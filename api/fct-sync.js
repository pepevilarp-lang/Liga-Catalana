// Sincroniza calendario y resultados de la liga con el portal de la FCT (portal.fctennis.cat).
//  · Vercel Cron (cada noche) o botón «Actualizar desde la FCT» de capitanes y administradores.
//  · Resultados de los demás equipos: la FCT manda (acta cerrada = oficial, si no = provisional).
//  · Partido del Polo: si la app ya tiene resultado, no se toca; si coincide y el acta está cerrada,
//    pasa a oficial; si no coincide, se guarda el marcador de la FCT en fctScore para avisar.
//  · Cambios de fecha (aplazamientos) se copian; la hora del partido del Polo solo si cambia la fecha.
// Cada temporada indica su grupo en comp.fctGroup (por defecto, los grupos conocidos de 2026-27).
// Necesita en Vercel: FIREBASE_SERVICE_ACCOUNT y CRON_SECRET (los mismos que /api/remind).
const admin = require('firebase-admin');
function getAdmin() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return admin;
}
const FCT_API = 'https://portal.fctennis.cat/app/api/calendario.do';
// Grupos de la 13a Lliga Catalana 2026-27 (torneo 4296)
const KNOWN_GROUPS = { '2026-27': 4622, '2026-27-polo-a': 4622, '2026-27-polo-b': 4621, '2026-27-fem-a': 4599 };
const POLO = 'polo';
const STOP = new Set(['club', 'de', 'del', 'la', 'el', 'tenis', 'tennis', 'rc', 'rst', 'ct', 'ce', 'rct', 'real', 'sant', 'sport', 'esportiu', 's', 'i', 'y', 'a', 'b', 'cd', 'cn', 'ctn', 'c', 't', 'n']);
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const toks = s => norm(s).split(' ').filter(t => t && !STOP.has(t));
const slug = s => norm(s).replace(/ /g, '-');
const ymd = d => { const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(d || '')); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null; };

async function fctMatches(group) {
  const r = await fetch(FCT_API, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ accion: 'recuperarPartidosEquiposGrupo', data: { codigo: +group } }) });
  if (!r.ok) throw new Error('FCT respondió ' + r.status);
  const j = await r.json();
  if (j.error) throw new Error('FCT: error al leer el grupo ' + group);
  return Array.isArray(j.partidos) ? j.partidos : [];
}

// Busca el equipo de la app que corresponde a un equipo de la FCT (por código guardado o por nombre)
function teamFor(S, code, name, added) {
  let t = S.teams.find(x => +x.fct === +code); if (t) return t.id;
  if (/\bpolo\b/.test(norm(name))) { t = S.teams.find(x => x.id === POLO); if (t) { t.fct = code; return POLO; } }
  const a = toks(name); let best = null, bs = 0;
  S.teams.forEach(x => { if (x.fct && +x.fct !== +code) return; const b = new Set([...toks(x.name), ...toks(x.short)]); const hit = a.filter(w => b.has(w)).length; const sc = hit / Math.max(a.length, 1); if (sc > bs) { bs = sc; best = x; } });
  if (best && bs >= 0.5) { best.fct = code; return best.id; }
  // Equipo nuevo: «Mas-Ram, CE» → «CE Mas-Ram»
  const [base, pre] = String(name).split(/,\s*/); const full = pre ? `${pre} ${base}` : base;
  let id = slug(base) || 'equipo'; while (S.teams.some(x => x.id === id)) id += '-2';
  S.teams.push({ id, name: full.trim(), short: base.trim(), abbr: toks(base).map(w => w[0]).join('').toUpperCase().slice(0, 4) || base.slice(0, 3).toUpperCase(), fct: code });
  added.push(full.trim());
  return id;
}

function syncSeason(S, partidos) {
  S.teams = Array.isArray(S.teams) ? S.teams : []; S.fixtures = Array.isArray(S.fixtures) ? S.fixtures : [];
  if (!S.teams.some(t => t.id === POLO)) S.teams.unshift({ id: POLO, name: 'RC de Polo', short: 'Polo', abbr: 'RCP' });
  const out = { results: 0, official: 0, dates: 0, created: 0, newTeams: [], diffs: [] };
  for (const p of partidos) {
    const j = +p.jornada; if (!j) continue;
    const locCode = p.equipoLocal || p.codigoEquipo, visCode = p.equipoVisitante || p.codigoContrario;
    const locName = (+p.codigoEquipo === +locCode ? p.equipo : p.contrario)?.nombreCuadro || '';
    const visName = (+p.codigoEquipo === +locCode ? p.contrario : p.equipo)?.nombreCuadro || '';
    const home = teamFor(S, locCode, locName, out.newTeams), away = teamFor(S, visCode, visName, out.newTeams);
    const date = ymd(p.fecha), time = /^\d{1,2}:\d{2}$/.test(p.hora || '') ? p.hora.padStart(5, '0') : '15:00';
    let f = S.fixtures.find(x => +x.j === j && ((x.home === home && x.away === away) || (x.home === away && x.away === home)));
    if (!f) { if (!date) continue; f = { j, date, time, home, away, hs: null, as: null, status: null }; S.fixtures.push(f); out.created++; }
    const swapped = f.home !== home, isPolo = home === POLO || away === POLO;
    if (date && f.date !== date) { f.date = date; if (!isPolo || f.time === '15:00' || !f.time) f.time = time; out.dates++; }
    else if (!isPolo && time && f.time !== time) f.time = time;
    // Marcador: la FCT lo da como r1 (equipo) y c1 (contrario)
    const hasResult = (+p.codigoActa > 0) || (+p.r1 + +p.c1) > 0; if (!hasResult) continue;
    const eqIsLoc = +p.codigoEquipo === +locCode;
    let hs = eqIsLoc ? +p.r1 : +p.c1, as = eqIsLoc ? +p.c1 : +p.r1; if (swapped) [hs, as] = [as, hs];
    const closed = String(p.estadoActa || '').toUpperCase() === 'CRR';
    if (isPolo && f.hs != null && f.as != null) {
      if (+f.hs === hs && +f.as === as) { if (closed && f.status !== 'official') { f.status = 'official'; out.official++; } delete f.fctScore; }
      else if (f.fctScore !== `${hs}-${as}`) { f.fctScore = `${hs}-${as}`; out.diffs.push({ j, app: `${f.hs}-${f.as}`, fct: `${hs}-${as}` }); }
      continue;
    }
    const st = closed ? 'official' : 'provisional';
    if (f.hs !== hs || f.as !== as || f.status !== st) { if (f.status !== 'official' || closed) { f.hs = hs; f.as = as; f.status = st; f.src = 'fct'; out.results++; if (closed) out.official++; } }
  }
  S.fixtures.sort((a, b) => a.j - b.j || String(a.date).localeCompare(String(b.date)));
  return out;
}

async function runSeason(db, id) {
  const ref = db.doc('seasons/' + id), snap = await ref.get(); if (!snap.exists) return { season: id, skipped: 'no-existe' };
  const S = snap.data(), group = +((S.comp || {}).fctGroup || KNOWN_GROUPS[id] || 0);
  if (!group) return { season: id, skipped: 'sin-grupo-fct' };
  if ((S.comp || {}).fctSync === false) return { season: id, skipped: 'desactivado' };
  const partidos = await fctMatches(group);
  if (!partidos.length) return { season: id, group, skipped: 'grupo-vacio' };
  const before = JSON.stringify({ t: S.teams, f: S.fixtures });
  const out = syncSeason(S, partidos);
  const changed = JSON.stringify({ t: S.teams, f: S.fixtures }) !== before;
  const meta = { at: Date.now(), group, ...out };
  await ref.update(changed ? { teams: S.teams, fixtures: S.fixtures, fctLast: meta, updatedAt: Date.now() } : { fctLast: meta });
  return { season: id, changed, ...meta };
}

module.exports = async (req, res) => {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(501).json({ error: 'not-configured' });
  try {
    const A = getAdmin(), db = A.firestore();
    const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    let ids = [];
    if (process.env.CRON_SECRET && tok === process.env.CRON_SECRET) {
      const snap = await db.collection('seasons').get(); snap.forEach(d => ids.push(d.id));
    } else {
      // Botón «Actualizar desde la FCT»: administradores, gestores o quien pueda gestionar ese equipo
      if (req.method !== 'POST') return res.status(401).json({ error: 'unauthorized' });
      const user = await A.auth().verifyIdToken(tok), email = String(user.email || '').toLowerCase();
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const season = String(body.season || ''); if (!/^[\w-]{2,30}$/.test(season)) return res.status(400).json({ error: 'season' });
      const S = (await db.doc('seasons/' + season).get()).data(); if (!S) return res.status(404).json({ error: 'season-not-found' });
      const [a1, a2, me, club] = await Promise.all([db.doc('admins/' + user.uid).get(), db.doc('admins/' + email).get(), db.doc('users/' + user.uid).get(), db.doc('meta/app').get().catch(() => null)]);
      const myPid = me.exists ? me.data().pid : null, teamOn = (S.rules || {}).teamManage !== false;
      const isMgr = !!(club && club.exists && (club.data().managerEmails || []).includes(email));
      const member = myPid && (!(S.players || []).length || (S.players || []).some(p => p.id === myPid));
      if (!(a1.exists || a2.exists || isMgr || (member && ((S.captains || []).includes(myPid) || teamOn)))) return res.status(403).json({ error: 'forbidden' });
      ids = [season];
    }
    const results = [];
    for (const id of ids) { try { results.push(await runSeason(db, id)); } catch (e) { results.push({ season: id, error: e.message }); } }
    return res.status(200).json({ ok: true, results });
  } catch (e) {
    return res.status(500).json({ error: e.code || e.message });
  }
};
