// Migración multiclub (fase 2, docs/MULTICLUB.md): mueve los datos del club original de la raíz de Firestore a clubs/<id>/
// sin borrar nada. Solo administradores de la plataforma. Acciones (POST { action }):
//   plan      Recuento de lo que hay y de lo que falta. No escribe nada.
//   backfill  Prepara los datos sin moverlos: pertenencias (clubs/<id>/members) a partir de las fichas vinculadas,
//             memberIds de las temporadas antiguas y meta/app.captainPids. Se puede repetir.
//   copy      Copia raíz → clubs/<id>/ (documentos y subcolecciones). Sobrescribe la copia; la raíz no se toca. Se puede repetir.
//   verify    Compara documento a documento la raíz y la copia. No escribe nada.
//   switch    Si verify sale bien, marca clubs/<id>.migrated = true: la app, el servidor y las reglas pasan a usar la copia.
//   rollback  Copia clubs/<id>/ → raíz (con los cambios hechos después del switch) y desmarca migrated: todo vuelve a la raíz.
// Cada acción queda en el historial del club (clubs/<id>/audit).
const crypto = require('crypto');
const CLUB = require('../club-config.js');
const { caller, CLUB_COLLS, audit, httpErr, sendErr } = require('./_auth.js');

const stable = v => (v && typeof v === 'object' && !Array.isArray(v) && !(v.toDate && v.toMillis)
  ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}'
  : Array.isArray(v) ? '[' + v.map(stable).join(',') + ']' : JSON.stringify(v && v.toMillis ? { ts: v.toMillis() } : v));
const hash = d => crypto.createHash('sha1').update(stable(d)).digest('hex');

// Recorre una colección y sus subcolecciones: { 'seasons/2026-27': hash, 'seasons/2026-27/avail/x': hash, ... }
async function walk(db, collPath, rel, out, docs) {
  const refs = await db.collection(collPath).listDocuments();
  for (const ref of refs) {
    const snap = await ref.get(), key = rel + '/' + ref.id;
    if (snap.exists) { out[key] = hash(snap.data()); if (docs) docs[key] = snap.data(); }
    for (const sub of await ref.listCollections()) await walk(db, collPath + '/' + ref.id + '/' + sub.id, key + '/' + sub.id, out, docs);
  }
}
async function tree(db, base, withDocs) {
  const out = {}, docs = withDocs ? {} : null;
  for (const c of CLUB_COLLS) await walk(db, base + c, c, out, docs);
  return { out, docs };
}
const countBy = t => Object.keys(t).reduce((o, k) => { const c = k.split('/')[0]; o[c] = (o[c] || 0) + 1; return o; }, {});
async function copyDocs(db, docs, base) {
  const w = db.bulkWriter(); let n = 0;
  for (const [k, d] of Object.entries(docs)) { w.set(db.doc(base + k), d); n++; }
  await w.close(); return n;
}
function compare(a, b) {
  const missing = Object.keys(a).filter(k => !(k in b)), different = Object.keys(a).filter(k => k in b && a[k] !== b[k]);
  return { ok: !missing.length && !different.length, total: Object.keys(a).length, missing: missing.slice(0, 50), different: different.slice(0, 50), missingCount: missing.length, differentCount: different.length };
}

async function backfill(db, clubId, root) {
  const P = p => root + p, now = Date.now(), res = { members: 0, memberIds: 0, captainPids: 0 };
  // Pertenencias: cada ficha vinculada (claims/<pid> = { uid, email }) es un jugador del club
  const claims = await db.collection(P('claims')).get();
  for (const c of claims.docs) {
    const { uid, email } = c.data() || {}; if (!uid) continue;
    const ref = db.doc('clubs/' + clubId + '/members/' + uid), m = await ref.get(), cur = m.exists ? m.data() : {};
    const roles = [...new Set([...(cur.roles || []), 'jugador'])];
    if (cur.pid === c.id && cur.uid === uid && (cur.roles || []).includes('jugador') && cur.status) continue;
    await ref.set({ ...cur, uid, pid: c.id, email: email || cur.email || '', roles, status: cur.status || 'activo', at: cur.at || now, backfilledAt: now }, { merge: true });
    res.members++;
  }
  // Temporadas antiguas sin memberIds: la plantilla activa
  const seasons = await db.collection(P('seasons')).get(), caps = new Set();
  const meta = (await db.doc(P('meta/app')).get()).data() || {};
  for (const s of seasons.docs) {
    const S = s.data() || {};
    if (!Array.isArray(S.memberIds)) { await s.ref.update({ memberIds: (S.players || []).filter(p => p.active !== false).map(p => p.id) }); res.memberIds++; }
    if (!meta.current || s.id.startsWith(meta.current)) (S.captains || []).forEach(p => caps.add(p));
  }
  const list = [...caps].sort();
  if (list.join() !== (meta.captainPids || []).slice().sort().join()) { await db.doc(P('meta/app')).set({ captainPids: list }, { merge: true }); res.captainPids = list.length; }
  return res;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(501).json({ error: 'Falta FIREBASE_SERVICE_ACCOUNT en Vercel' });
  try {
    const ctx = await caller(req);
    if (!ctx.isAdmin) throw httpErr(403, 'Solo administradores de la plataforma');
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const action = String(body.action || 'plan'), db = ctx.db, clubId = CLUB.id, dest = 'clubs/' + clubId + '/';
    const clubRef = db.doc('clubs/' + clubId), club = (await clubRef.get()).data() || {};
    const migrated = club.migrated === true;
    let out;
    if (action === 'plan' || action === 'verify') {
      const a = (await tree(db, '', false)).out, b = (await tree(db, dest, false)).out;
      const seasons = await db.collection((migrated ? dest : '') + 'seasons').get();
      const claims = await db.collection((migrated ? dest : '') + 'claims').get();
      const members = await db.collection('clubs/' + clubId + '/members').get();
      const withPid = new Set(members.docs.filter(m => m.data().pid).map(m => m.id));
      out = { migrated, root: countBy(a), copy: countBy(b), compare: compare(migrated ? b : a, migrated ? a : b),
        pending: { seasonsWithoutMemberIds: seasons.docs.filter(s => !Array.isArray(s.data().memberIds)).map(s => s.id), claimsWithoutMember: claims.docs.filter(c => c.data().uid && !withPid.has(c.data().uid)).length } };
    } else if (action === 'backfill') {
      out = await backfill(db, clubId, migrated ? dest : '');
    } else if (action === 'copy') {
      if (migrated) throw httpErr(409, 'El club ya usa la copia (migrated). Para volver a la raíz, usa rollback.');
      const { docs } = await tree(db, '', true);
      out = { copied: await copyDocs(db, docs, dest) };
      await clubRef.set({ migration: { copiedAt: Date.now(), copiedBy: ctx.email, docs: out.copied } }, { merge: true });
    } else if (action === 'switch') {
      if (migrated) throw httpErr(409, 'Ya está migrado');
      const a = (await tree(db, '', false)).out, b = (await tree(db, dest, false)).out, cmp = compare(a, b);
      if (!cmp.ok) throw Object.assign(httpErr(409, 'La copia no coincide con la raíz: vuelve a copiar (copy) y verifica'), { detail: cmp });
      await backfill(db, clubId, dest);   // pertenencias con ficha: después de migrar, las reglas leen la ficha de clubs/<id>/members
      await clubRef.set({ migrated: true, migratedAt: Date.now(), migratedBy: ctx.email }, { merge: true });
      out = { migrated: true, docs: cmp.total };
    } else if (action === 'rollback') {
      const { docs } = await tree(db, dest, true);
      const n = await copyDocs(db, docs, '');
      await clubRef.set({ migrated: false, rolledBackAt: Date.now(), rolledBackBy: ctx.email }, { merge: true });
      out = { migrated: false, restored: n };
    } else throw httpErr(400, 'Acción desconocida');
    await audit(ctx, 'migracion-' + action, { result: JSON.stringify(out).slice(0, 1500) });
    return res.status(200).json({ ok: true, action, ...out });
  } catch (e) {
    if (e.detail) return res.status(e.status || 500).json({ error: e.message, detail: e.detail });
    return sendErr(res, e);
  }
};
module.exports._test = { stable, hash, compare, countBy, backfill, tree };
