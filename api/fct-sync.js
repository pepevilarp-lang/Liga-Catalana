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

// Plantilla del equipo del Polo en la FCT (nombre, licencia, categoría y puntos; sin capitán)
async function fctRoster(teamCode) {
  const r = await fetch(FCT_API, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ accion: 'recuperarJugadoresEquipoLiga', data: { codigoEquipo: +teamCode } }) });
  if (!r.ok) throw new Error('FCT respondió ' + r.status);
  const j = await r.json();
  if (j.error) throw new Error('FCT: error al leer la plantilla del equipo ' + teamCode);
  return Array.isArray(j.datos) ? j.datos : [];
}
const PARTICLE = new Set(['de', 'del', 'la', 'las', 'los', 'i', 'y', 'van', 'von', 'da', 'dos']);
const titleCase = s => String(s || '').toLowerCase().split(/\s+/).filter(Boolean).map((w, i) => i && PARTICLE.has(w) ? w : w.replace(/(^|[-'])(\p{L})/gu, (m, a, b) => a + b.toUpperCase())).join(' ');
// «Francisco Javier Torrent Correa» → «Francisco Torrent»; «Michael B Goldenberg» → «Michael Goldenberg»
function shortOf(full) {
  const t = titleCase(full).split(' '); if (t.length <= 2) return t.join(' ');
  let i = t.length - 2; if (PARTICLE.has(t[i].toLowerCase())) i--; if (t[i].replace(/\W/g, '').length <= 1) i = t.length - 1;
  return t[0] + ' ' + t[Math.max(1, i)];
}
// Importa la plantilla: la primera vez (temporada sin jugadores) da de alta a todos; después solo
// actualiza licencia, categoría y puntos de los que reconoce, y añade nuevos si la plantilla vino de la FCT.
function syncRoster(S, list) {
  S.players = Array.isArray(S.players) ? S.players : []; S.comp = S.comp || {};
  const out = { added: 0, updated: 0 };
  const fromFct = !S.players.length || S.comp.fctRoster === true;
  const byLic = l => S.players.find(p => p.lic && String(p.lic) === String(l));
  const byName = n => { const a = norm(n); return S.players.find(p => norm(p.full) === a || (p.full && norm(p.full).split(' ').length >= 2 && a.startsWith(norm(p.full) + ' '))); };
  list.slice().sort((a, b) => (+a.posicion || 99) - (+b.posicion || 99)).forEach((x, i) => {
    const full = titleCase(x.nombreCompleto || ''); if (!full) return;
    const cat = String(x.codigoCategoriaNombre || '').trim(), pts = +x.puntos || 0, order = +x.posicion || i + 1;
    let p = byLic(x.licencia) || byName(full);
    if (p) { const before = JSON.stringify(p); if (x.licencia) p.lic = String(x.licencia); if (cat) p.cat = cat; p.pts = pts; if (fromFct) p.order = order; if (JSON.stringify(p) !== before) out.updated++; return; }
    if (!fromFct) return;
    const name = shortOf(full); let id = slug(name) || 'jugador'; while (S.players.some(q => q.id === id)) id += '-2';
    S.players.push({ id, name, full, cat, pts, order, lic: x.licencia ? String(x.licencia) : '', captain: false, active: x.activa !== false, src: 'fct' });
    out.added++;
  });
  if (out.added) S.comp.fctRoster = true;
  return out;
}

// Acta de un partido: quién jugó cada individual y el dobles, con su marcador
async function fctActa(partidoCode) {
  const r = await fetch(FCT_API, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ accion: 'recuperarActaPartido', data: { codigo: +partidoCode } }) });
  if (!r.ok) throw new Error('FCT respondió ' + r.status);
  const j = await r.json();
  if (j.error || !j.acta) throw new Error('FCT: error al leer el acta ' + partidoCode);
  return j.acta;
}
// Busca (o da de alta, si la plantilla viene de la FCT) al jugador del Polo que aparece en el acta
function pidForFct(S, pl) {
  if (!pl || !pl.nombreCuadro) return null;
  const lic = pl.licencia ? String(pl.licencia) : '', full = titleCase(pl.nombreCuadro), a = norm(full);
  let p = (lic && S.players.find(x => x.lic && String(x.lic) === lic)) || S.players.find(x => norm(x.full) === a);
  if (p) { if (lic && !p.lic) p.lic = lic; return p.id; }
  if (!(S.comp && S.comp.fctRoster === true)) return null;
  const name = shortOf(full); let id = slug(name) || 'jugador'; while (S.players.some(q => q.id === id)) id += '-2';
  S.players.push({ id, name, full, cat: String(pl.nombreCategoria || ''), pts: +pl.puntos || 0, order: S.players.length + 1, lic, captain: false, active: true, src: 'fct' });
  return id;
}
// Pasa un enfrentamiento de la FCT al formato de la app (marcador desde el punto de vista del Polo)
function rubberFromFct(e, poloCode, isD, S) {
  const codeOf = side => side ? (isD ? (side.jugador1 || {}).codigo : side.codigo) : null;
  const poloIs1 = e.equipo1 ? +codeOf(e.equipo1) === +poloCode : false;
  const mine = poloIs1 ? e.equipo1 : e.equipo2, theirs = poloIs1 ? e.equipo2 : e.equipo1;
  if (!mine) return null;
  const pls = isD ? [mine.jugador1, mine.jugador2] : [mine];
  const sets = [];
  for (let i = 1; i <= 3; i++) { const a = e['r' + i], b = e['c' + i]; if (a == null || b == null || (+a === 0 && +b === 0)) continue; sets.push(poloIs1 ? `${a}-${b}` : `${b}-${a}`); }
  const poloWins = e.ganador ? ((e.ganador === 'jugador') === poloIs1) : null;
  const rivalNames = theirs ? (isD ? [theirs.jugador1, theirs.jugador2] : [theirs]).filter(Boolean).map(x => titleCase(x.nombreCuadro)) : [];
  const wo = !sets.length && poloWins != null;
  return { polo: pls.map(pl => pidForFct(S, pl)).filter(Boolean), score: sets.join(' '), res: wo ? (poloWins ? 'W' : 'L') : null, note: wo ? 'W.O.' : '', wo, rival: rivalNames.join(' / ') };
}
const rubSig = rs => JSON.stringify((rs || []).map(r => [r.n, (r.polo || []).slice().sort(), r.score || '', r.res || null]));
// Carga el acta en la eliminatoria si está vacía o si lo que hay lo puso la propia sincronización (no pisa lo que haya editado el capitán)
function syncActa(S, j, acta, poloCode) {
  S.ties = S.ties || {}; const k = 'j' + j, t = S.ties[k];
  const empty = !t || !(t.rubbers || []).some(r => (r.polo || []).length || r.score || r.res);
  if (!empty && !(t.fctSig && t.fctSig === rubSig(t.rubbers))) return 'manual';
  const singles = (acta.enfrentamientos || []).map(e => rubberFromFct(e, poloCode, false, S));
  const dobles = (acta.enfrentamientosDobles || []).map(e => rubberFromFct(e, poloCode, true, S));
  const base = t || { convocados: [], subs: [], lineupPub: false, poster: {}, moment: '' };
  const prev = base.rubbers || [];
  const rubbers = [1, 2, 3, 4, 5].map(n => { const x = n <= 4 ? singles[n - 1] : dobles[0]; const old = prev.find(r => r.n === n) || {};
    return { ...old, n, type: n <= 4 ? 'S' : 'D', polo: x ? x.polo : [], score: x ? x.score : '', res: x ? x.res : null, note: x ? x.note : '', wo: !!(x && x.wo), rivalPl: x ? x.rival : '' }; });
  const played = [...new Set(rubbers.flatMap(r => r.polo))];
  const before = rubSig(prev);
  S.ties[k] = { ...base, rubbers, convocados: [...new Set([...(base.convocados || []), ...played])], lineupPub: true, fctSig: rubSig(rubbers), fctActa: String(acta.estadoNombre || acta.estado || '') };
  return before === rubSig(rubbers) ? 'same' : 'loaded';
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
  const note = (f, what) => { f.hist = [...(f.hist || []), { at: Date.now(), by: 'FCT', what }].slice(-6); f.srcAt = Date.now(); };
  const out = { results: 0, official: 0, dates: 0, created: 0, newTeams: [], diffs: [], dateDiffs: [] };
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
    // Lo que edita una persona en la app (fecha u hora) manda: la FCT no lo cambia y su dato queda como aviso
    const lockD = !!((f.lock && f.lock.date) || (f.moved && f.moved.by !== 'FCT')), lockT = !!(f.lock && f.lock.time);
    if (date && f.date !== date) {
      if (lockD) { if (f.fctDate !== date) { f.fctDate = date; out.dateDiffs.push({ j, app: f.date, fct: date }); } }
      else {
        if (isPolo) { const orig = (f.moved && f.moved.from) || f.date; if (date === orig) delete f.moved; else f.moved = { from: orig, at: Date.now(), by: 'FCT' }; }
        note(f, `Fecha ${f.date} → ${date}`); f.date = date; if (!lockT && (!isPolo || f.time === '15:00' || !f.time)) f.time = time; out.dates++;
      }
    } else if (f.fctDate) delete f.fctDate;
    if (time && f.time !== time && (f.date === date || lockD)) {
      if (lockT) { if (f.fctTime !== time) { f.fctTime = time; out.dateDiffs.push({ j, app: f.date + ' ' + f.time, fct: date + ' ' + time }); } }
      else if (!isPolo) f.time = time;
    } else if (f.fctTime && (f.time === time || !lockT)) delete f.fctTime;
    // Marcador: la FCT lo da como r1 (equipo) y c1 (contrario)
    const hasResult = (+p.codigoActa > 0) || (+p.r1 + +p.c1) > 0; if (!hasResult) continue;
    const eqIsLoc = +p.codigoEquipo === +locCode;
    let hs = eqIsLoc ? +p.r1 : +p.c1, as = eqIsLoc ? +p.c1 : +p.r1; if (swapped) [hs, as] = [as, hs];
    const closed = String(p.estadoActa || '').toUpperCase() === 'CRR';
    if (isPolo && f.hs != null && f.as != null) {
      if (+f.hs === hs && +f.as === as) { if (closed && f.status !== 'official') { f.status = 'official'; out.official++; note(f, 'Resultado confirmado como oficial por la FCT'); } delete f.fctScore; }
      else if (f.fctScore !== `${hs}-${as}`) { f.fctScore = `${hs}-${as}`; out.diffs.push({ j, app: `${f.hs}-${f.as}`, fct: `${hs}-${as}` }); note(f, `La FCT tiene ${hs}-${as}; en la app ${f.hs}-${f.as}`); }
      continue;
    }
    const st = closed ? 'official' : 'provisional';
    if (f.hs !== hs || f.as !== as || f.status !== st) { if (f.status !== 'official' || closed) { note(f, f.hs != null && (f.hs !== hs || f.as !== as) ? `Resultado cambiado de ${f.hs}-${f.as} a ${hs}-${as}` : `Resultado ${hs}-${as} ${closed ? '(oficial)' : '(provisional)'}`); f.hs = hs; f.as = as; f.status = st; f.src = 'fct'; out.results++; if (closed) out.official++; } }
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
  const before = JSON.stringify({ t: S.teams, f: S.fixtures, p: S.players || [], c: S.comp || {}, x: S.ties || {} });
  const out = syncSeason(S, partidos);
  // Plantilla: con el código FCT del equipo del Polo en este grupo
  const poloCode = (S.teams.find(t => t.id === POLO) || {}).fct;
  if (poloCode && (S.comp || {}).fctRosterSync !== false) {
    try { out.roster = syncRoster(S, await fctRoster(poloCode)); } catch (e) { out.rosterError = e.message; }
  }
  // Actas: quién jugó cada partido del Polo y con qué marcador
  if (poloCode && (S.comp || {}).fctActas !== false) {
    const mine = partidos.filter(p => (+p.equipoLocal === +poloCode || +p.equipoVisitante === +poloCode) && +p.codigoActa > 0);
    const acts = { loaded: [], manual: [] };
    for (const p of mine) { try { const st = syncActa(S, +p.jornada, await fctActa(p.codigo), poloCode); if (st === 'loaded') acts.loaded.push(+p.jornada); if (st === 'manual') acts.manual.push(+p.jornada); } catch (e) { (acts.errors = acts.errors || []).push(+p.jornada); } }
    out.actas = acts;
  }
  const changed = JSON.stringify({ t: S.teams, f: S.fixtures, p: S.players || [], c: S.comp || {}, x: S.ties || {} }) !== before;
  const meta = { at: Date.now(), group, ...out };
  await ref.update(changed ? { teams: S.teams, fixtures: S.fixtures, players: S.players || [], comp: S.comp || {}, ties: S.ties || {}, fctLast: meta, updatedAt: Date.now() } : { fctLast: meta });
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

module.exports._test = { syncRoster, shortOf, syncSeason, syncActa, rubberFromFct };
