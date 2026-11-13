// Recordatorios automáticos (Vercel Cron) y botón «Enviar ahora» del capitán.
//  · Disponibilidad: avisa a quien aún no ha respondido, cada X días, mientras siga abierta.
//  · Día antes: avisa a los convocados cuando falta poco para el partido.
// Cada temporada decide si está activo en  rules.autoRemind = { on, every, dayBefore }.
// Necesita en Vercel: FIREBASE_SERVICE_ACCOUNT y CRON_SECRET (cualquier texto largo y secreto).
// Permisos: los mismos que firestore.rules (api/_auth.js). Datos: en la raíz real del club (clubDb).
const { getAdmin, needTeam, clubDbFor, sendErr } = require('./_auth.js');
const TZ = 'Europe/Madrid', H = 36e5, D = 864e5;
// Hora local de España a milisegundos (los partidos se guardan como fecha y hora locales)
function madridMs(date, time) {
  const [y, m, d] = String(date).split('-').map(Number), [hh, mm] = String(time || '15:00').split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm || 0);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(guess)).map(x => [x.type, x.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, (+parts.hour) % 24, +parts.minute);
  return guess - (asUtc - guess);
}
const addDays = (date, n) => { const [y, m, d] = date.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const played = f => f.hs != null && f.as != null && (f.hs + f.as) > 0;
const fechaTxt = f => new Date(f.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

async function push(A, db, pids, data) {
  const tokens = [], owner = {};
  const docs = await Promise.all(pids.map(p => db.doc('pushTokens/' + p).get()));
  docs.forEach((d, i) => (d.exists ? d.data().tokens || [] : []).forEach(t => { tokens.push(t); owner[t] = pids[i]; }));
  const bad = [];
  for (let i = 0; i < tokens.length; i += 500) {
    const r = await A.messaging().sendEachForMulticast({ tokens: tokens.slice(i, i + 500), data, webpush: { headers: { Urgency: 'high', TTL: '86400' } } });
    r.responses.forEach((x, n) => { const c = x.error && x.error.code; if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token' || c === 'messaging/invalid-argument') bad.push(tokens[i + n]); });
  }
  await Promise.all(bad.map(t => db.doc('pushTokens/' + owner[t]).update({ tokens: A.firestore.FieldValue.arrayRemove(t) }).catch(() => {})));
  return { recipients: pids.length, reached: new Set(tokens.filter(t => !bad.includes(t)).map(t => owner[t])).size };
}

async function runSeason(A, db, id, S, { force, origin, now }) {
  const ar = (S.rules || {}).autoRemind || {};
  const out = { season: id, availability: [], dayBefore: [] };
  if (!force && !ar.on) return out;
  const every = Math.max(1, Math.min(7, +ar.every || 1));
  const logRef = db.raw.doc('remLog/' + (db.club && db.club !== 'rcpb' ? db.club + '_' : '') + id), log = (await logRef.get()).data() || {};
  const active = (S.players || []).filter(p => p.active !== false).map(p => p.id);
  const base = String(origin || '').replace(/\/$/, '');
  const teamName = n => ((S.teams || []).find(t => t.id === n) || {}).name || 'el rival';
  const upd = {};
  for (const f of (S.fixtures || [])) {
    if (!(f.home === 'polo' || f.away === 'polo') || played(f) || !f.date) continue;
    const j = +f.j, k = 'j' + j, tie = (S.ties || {})[k] || {}, ko = madridMs(f.date, f.time);
    if (ko <= now) continue;
    const rival = teamName(f.home === 'polo' ? f.away : f.home), fecha = fechaTxt(f);
    // 1) disponibilidad pendiente
    if (tie.availReq && !tie.availClosed) {
      const dl = tie.deadline ? new Date(tie.deadline).getTime() : madridMs(addDays(f.date, -(+((S.rules || {}).deadlineDays) || 0)), (S.rules || {}).deadlineTime || '21:00');
      const last = (log.availAt || {})[k] || 0;
      if (now < dl && (force || now - last >= every * D - 3 * H)) {
        const snap = await db.collection(`seasons/${id}/avail`).get(), done = new Set();
        snap.forEach(d => { if ((d.data().j || {})[k]) done.add(d.id); });
        const pend = active.filter(p => !done.has(p));
        if (pend.length) {
          const r = await push(A, db, pend, { title: 'Falta tu disponibilidad', body: `¿Puedes jugar contra ${rival} el ${fecha}? Responde en un toque.`, url: `${base}/#disponibilidad-${j}`, tag: `availRem-${k}` });
          out.availability.push({ j, ...r }); upd.availAt = { ...(upd.availAt || {}), [k]: now };
        }
      }
    }
    // 2) recordatorio a los convocados, entre 6 y 36 horas antes
    if (ar.dayBefore !== false && tie.lineupPub && ko - now >= 6 * H && ko - now <= 36 * H && (force || !(log.dayAt || {})[k])) {
      const pids = [...new Set([...(tie.convocados || []), ...(tie.subs || []), ...((tie.rubbers || []).flatMap(r => r.polo || []))])];
      if (pids.length) {
        const r = await push(A, db, pids, { title: `Recordatorio: jornada ${j}`, body: `${(db.cfg && db.cfg.teamShort) || 'Polo'} contra ${rival}, ${fecha} a las ${f.time || ''}. Revisa tu partido en la app.`, url: `${base}/#jornada-${j}`, tag: `dayBefore-${k}` });
        out.dayBefore.push({ j, ...r }); upd.dayAt = { ...(upd.dayAt || {}), [k]: now };
      }
    }
  }
  if (Object.keys(upd).length) await logRef.set({ ...upd, lastRun: now }, { merge: true });
  return out;
}

module.exports = async (req, res) => {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(501).json({ error: 'not-configured' });
  try {
    const A = getAdmin(), now = Date.now(), raw = A.firestore();
    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const jobs = []; let force = false, origin = '';
    if (process.env.CRON_SECRET && tok === process.env.CRON_SECRET) {
      // Ejecución programada por Vercel Cron: todas las temporadas de todos los clubes con los recordatorios activados
      origin = process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : '');
      for (const id of await require('./_auth.js').allClubs(raw)) { const db = await clubDbFor(raw, id), ids = []; (await db.collection('seasons').get()).forEach(d => ids.push(d.id)); jobs.push({ db, ids }); }
    } else {
      // «Enviar ahora»: solo quien gestiona ese equipo, y solo de su temporada
      if (req.method !== 'POST') return res.status(401).json({ error: 'unauthorized' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const ctx = await needTeam(req, String(body.season || ''), 'canEdit');
      force = true; origin = String(body.origin || ''); jobs.push({ db: ctx.cdb, ids: [String(body.season)] });
    }
    const results = [];
    for (const { db, ids } of jobs) for (const id of ids) { const S = (await db.doc('seasons/' + id).get()).data(); if (S) results.push({ club: db.club, ...(await runSeason(A, db, id, S, { force, origin, now })) }); }
    const n = results.reduce((a, r) => a + r.availability.length + r.dayBefore.length, 0);
    return res.status(200).json({ ok: true, avisos: n, results });
  } catch (e) {
    return sendErr(res, e);
  }
};
