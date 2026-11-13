// Informe semanal en el servidor: los mismos datos, textos y PDF que el botón «Enviar desde la app»
// (Gestión deportiva → Resumen), para el envío automático del domingo por la noche (api/fct-sync.js)
// y el botón «Enviar ahora» de Configuración (api/auto-report.js).
// La lógica de competición es una copia de la de app.js (standings, tieState, teamWeekFacts...): si se cambia allí, cámbiese aquí.
process.env.TZ = 'Europe/Madrid';            // fechas como en la app (hora de España)
const ReportDoc = require('../report-doc.js');

const POLO = 'polo';
const DEFAULT_CLUB_TEAMS = require('../club-config.js').teams;
const RUBBERS = [{ n: 1, type: 'S', label: 'Individual 1' }, { n: 2, type: 'S', label: 'Individual 2' }, { n: 3, type: 'S', label: 'Individual 3' }, { n: 4, type: 'S', label: 'Individual 4' }, { n: 5, type: 'D', label: 'Dobles' }];
const RULES0 = { win: 3, loss: 1, deadlineDays: 2, deadlineTime: '21:00', doubles: 'always' };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DOC_ST = { subido: 'Pendiente', procesando: 'Procesando', revision: 'En revisión', validado: 'Validado', completado: 'Completado', error: 'Error' };
const CLUBCFG = require('../club-config.js'), CLUB = CLUBCFG.name;

const MAIN_TEAM = (DEFAULT_CLUB_TEAMS[0] || {}).id || 'polo-a';
// cfg = configuración del club (cdb.cfg). Solo el club original tiene equipos por defecto y un equipo con la ruta de temporada antigua.
const isGeneric = cfg => !!(cfg && cfg.generic);
const docIdFor = (tid, season, cfg) => !isGeneric(cfg) && tid === MAIN_TEAM ? season : season + '-' + tid;
const clubTeams = (meta, cfg) => { const base = (Array.isArray(meta && meta.teams) && meta.teams.length) ? meta.teams : []; const def = isGeneric(cfg) ? [] : DEFAULT_CLUB_TEAMS; return [...base, ...def.filter(d => !base.some(t => t.id === d.id))].map(t => ({ gender: '', ...t })); };
const teamCat = t => [t && t.cat, ((t && t.gender) || '').toLowerCase()].filter(Boolean).join(' ');
const ymd = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
function weekendSat(ref) { const x = new Date(ref || Date.now()); x.setHours(12, 0, 0, 0); const day = x.getDay(); x.setDate(x.getDate() + (day === 6 ? 0 : day === 0 ? -1 : -(day + 1))); return x; }
function weekendRange(satIso) { const sat = new Date(satIso + 'T12:00:00'), fri = new Date(sat), sun = new Date(sat); fri.setDate(sat.getDate() - 1); sun.setDate(sat.getDate() + 1); return { from: ymd(fri), to: ymd(sun), sat, sun }; }
function weekendLabel(rg) { const a = rg.sat, b = rg.sun; return a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}` : `${a.getDate()} ${MESES[a.getMonth()]}–${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}`; }
const jid = n => 'j' + n;
const fdate = (f, opt) => new Date(f.date + 'T' + (f.time || '15:00')).toLocaleDateString('es-ES', opt);
const isPlayed = f => f.hs != null && f.as != null && (f.hs + f.as) > 0;
function parseScore(str) { if (!str) return []; return String(str).split(/[\s,;]+/).map(x => x.match(/^(\d{1,2})[-\/](\d{1,2})$/)).filter(Boolean).map(m => [+m[1], +m[2]]); }
function rubberCalc(r) {
  const sets = parseScore(r.score); let sw = 0, sl = 0;
  sets.forEach(([a, b]) => { if (a > b) sw++; else if (b > a) sl++; });
  const res = r.res || (sets.length >= 2 && sw !== sl ? (sw > sl ? 'W' : 'L') : null);
  return { sets, sw, sl, res };
}

// Una temporada de equipo con las mismas utilidades que la app (S = documento de la temporada)
function season(doc) {
  const S = { ...doc };
  S.rules = { ...RULES0, ...(doc.rules || {}) }; S.teams = Array.isArray(doc.teams) ? doc.teams : []; S.players = Array.isArray(doc.players) ? doc.players : [];
  S.fixtures = Array.isArray(doc.fixtures) ? doc.fixtures : []; S.ties = doc.ties || {}; S.published = doc.published || {};
  S.captains = Array.isArray(doc.captains) ? doc.captains : S.players.filter(p => p.captain).map(p => p.id);
  const team = id => S.teams.find(t => t.id === id) || { id, name: id, short: id };
  const pname = id => (S.players.find(p => p.id === id) || {}).name || 'Por designar';
  const clubName = id => team(id).name;
  const tie = j => S.ties[jid(j)];
  const poloFix = j => S.fixtures.find(f => f.j === j && (f.home === POLO || f.away === POLO));
  const persp = f => { const home = f.home === POLO; return { home, rival: home ? f.away : f.home, ps: home ? f.hs : f.as, rs: home ? f.as : f.hs, played: isPlayed(f) }; };
  const dblDecider = () => S.rules.doubles === 'decider';
  function tieFromRubbers(j) {
    const t = tie(j); if (!t) return null; let w = 0, l = 0, singles = 0, dRes = null;
    (t.rubbers || []).forEach(r => { const c = rubberCalc(r); if (!c.res) return; if (r.type === 'S') { singles++; c.res === 'W' ? w++ : l++; } else dRes = c.res; });
    const needsDoubles = singles === 4 && w === 2 && l === 2;
    if (dRes && (needsDoubles || !dblDecider())) { dRes === 'W' ? w++ : l++; }
    return { w, l, decided: w + l, singles, needsDoubles, complete: singles === 4 && (!needsDoubles || !!dRes) };
  }
  function standings(uptoJ) {
    const rows = S.teams.map(t => ({ id: t.id, pj: 0, pts: 0, rw: 0, rl: 0 })); const R = Object.fromEntries(rows.map(r => [r.id, r]));
    S.fixtures.filter(f => isPlayed(f) && (uptoJ == null || f.j <= uptoJ)).sort((a, b) => a.j - b.j).forEach(f => {
      const h = R[f.home], a = R[f.away]; if (!h || !a) return;
      h.pj++; a.pj++; h.rw += f.hs; h.rl += f.as; a.rw += f.as; a.rl += f.hs;
      if (f.hs > f.as) { h.pts += S.rules.win; a.pts += S.rules.loss; } else if (f.as > f.hs) { a.pts += S.rules.win; h.pts += S.rules.loss; }
    });
    const lastJ = uptoJ != null ? uptoJ : Math.max(0, ...S.fixtures.filter(isPlayed).map(f => f.j));
    const O = S.official && Array.isArray(S.official.order) && S.official.asOf > 0 ? S.official : null;
    const ahead = !!O && uptoJ == null && O.asOf > lastJ;
    const off = O && (O.asOf === lastJ || ahead) ? O.order : null;
    if (off && O.pts) rows.forEach(r => { if (O.pts[r.id] != null && isFinite(+O.pts[r.id])) r.pts = +O.pts[r.id]; });
    const oi = id => { const i = off ? off.indexOf(id) : -1; return i < 0 ? 99 : i; };
    rows.sort((x, y) => off ? (oi(x.id) - oi(y.id) || y.pts - x.pts) : (y.pts - x.pts || (y.rw - y.rl) - (x.rw - x.rl) || y.rw - x.rw || String(team(x.id).short).localeCompare(String(team(y.id).short))));
    rows.forEach((r, i) => r.pos = i + 1); return rows;
  }
  const playedJornadas = () => [...new Set(S.fixtures.filter(isPlayed).map(f => f.j))].sort((a, b) => a - b);
  function tieState(f) {
    const p = persp(f), tr = tieFromRubbers(f.j) || {}, future = new Date(f.date + 'T23:59:00').getTime() > Date.now();
    const st = p.played ? (p.ps > p.rs ? 'win' : 'loss') : future ? 'next' : 'pending';
    return { p, rival: clubName(p.rival), st, confirm: p.played && f.status !== 'official', partial: !p.played && tr.decided > 0 };
  }
  function deadline(j) { const t = tie(j); if (t && t.deadline) return new Date(t.deadline); const f = poloFix(j); if (!f) return null; const d = new Date(f.date + 'T' + (S.rules.deadlineTime || '21:00') + ':00'); d.setDate(d.getDate() - (+S.rules.deadlineDays || 0)); return d; }
  const deadlinePassed = j => { const t = tie(j); if (t && t.availClosed) return true; const d = deadline(j); return d ? Date.now() > d.getTime() : true; };
  function availFor(j, avail) {
    const out = { yes: [], no: [], maybe: [], none: [] };
    S.players.filter(p => p.active !== false).forEach(p => { let v = avail[p.id] && avail[p.id].j && avail[p.id].j[jid(j)]; if (v && typeof v === 'string') v = { s: v }; (out[v && v.s] || out.none).push(p.id); });
    out.total = out.yes.length + out.no.length + out.maybe.length + out.none.length; out.answered = out.total - out.none.length; return out;
  }
  // Las cuatro primeras fases de la jornada (lo que el capitán prepara antes del partido)
  function prepTasks(j, avail) {
    const f = poloFix(j), t = tie(j) || {}, a = availFor(j, avail), closed = deadlinePassed(j) || isPlayed(f);
    const st = [t.calOk || isPlayed(f), t.availReq || closed, closed, t.lineupPub];
    const a0 = ['Confirmar el calendario', 'Pedir la disponibilidad', 'Cerrar la disponibilidad', 'Publicar la convocatoria'];
    return a0.filter((_, i) => !st[i]);
  }
  return { S, team, pname, clubName, tie, persp, tieFromRubbers, standings, playedJornadas, tieState, availFor, deadlinePassed, prepTasks };
}

function teamWeekFacts(t, X, f, s, av) {
  const { S, pname, clubName, tie, persp, tieFromRubbers, standings, playedJornadas, availFor, deadlinePassed } = X;
  const tt = tie(f.j) || { rubbers: [] }, rub = (tt.rubbers || []).map((r, i) => ({ type: r.type, n: r.n, label: (RUBBERS[i] || {}).label || '', players: (r.polo || []).map(pname), c: rubberCalc(r), note: r.note || '' }));
  const mk = x => ({ n: x.n, label: x.label, jugadores: x.players, marcador: x.c.sets.map(z => z.join('-')).join(' ') || '', resultado: x.c.res === 'W' ? 'ganado' : x.c.res === 'L' ? 'perdido' : 'sin resultado', nota: x.note });
  const singles = rub.filter(x => x.type === 'S' && (x.players.length || x.c.res)).map(mk), doubles = rub.filter(x => x.type === 'D' && (x.players.length || x.c.res)).map(mk);
  const st = standings(), mine = st.find(r => r.id === POLO) || {}, evo = playedJornadas().map(j => ({ j, pos: (standings(j).find(r => r.id === POLO) || {}).pos })).filter(x => x.pos);
  let ssw = 0, ssl = 0, sdw = 0, sdl = 0; const seq = [];
  S.fixtures.filter(x => (x.home === POLO || x.away === POLO) && isPlayed(x)).sort((a, b) => a.j - b.j).forEach(x => { const p = persp(x); seq.push(p.ps > p.rs ? 'G' : 'P'); ((tie(x.j) || {}).rubbers || []).forEach(r => { const c = rubberCalc(r); if (!c.res) return; if (r.type === 'S') c.res === 'W' ? ssw++ : ssl++; else c.res === 'W' ? sdw++ : sdl++; }); });
  let streak = 0; for (let i = seq.length - 1; i >= 0 && seq[i] === seq[seq.length - 1]; i--) streak++;
  const cnt = (arr, v) => arr.filter(x => x.resultado === v).length;
  const players = new Set([...singles, ...doubles].flatMap(x => x.jugadores));
  const cr = tt.captainReport || null, tr = tieFromRubbers(f.j) || {}, k = jid(f.j);
  const a = availFor(f.j, av || {}), prob = [];
  if (a.total && a.yes.length < 4) prob.push(`solo ${a.yes.length} ${a.yes.length === 1 ? 'jugador disponible' : 'jugadores disponibles'}`);
  if (a.none.length && deadlinePassed(f.j)) prob.push(`${a.none.length} sin responder al cerrar el plazo`);
  if (a.maybe.length) prob.push(`${a.maybe.length} pendientes de confirmar`);
  return {
    id: t.id, equipo: t.name, categoria: teamCat(t), capitan: (S.captains || []).map(pname).join(', '), rival: s.rival, jornada: f.j, fecha: fdate(f, { weekday: 'long', day: 'numeric', month: 'long' }), hora: f.time, casa: s.p.home,
    resultado: s.p.played ? `${s.p.ps}-${s.p.rs}` : null, estado: s.st === 'win' ? 'victoria' : s.st === 'loss' ? 'derrota' : 'pendiente', validado: s.p.played && f.status === 'official',
    convocados: (tt.convocados || []).map(pname), individuales: singles, dobles: doubles,
    fin_de_semana: { individuales: `${cnt(singles, 'ganado')}-${cnt(singles, 'perdido')}`, dobles: `${cnt(doubles, 'ganado')}-${cnt(doubles, 'perdido')}`, jugadores_utilizados: players.size },
    temporada: { individuales: `${ssw}-${ssl}`, dobles: `${sdw}-${sdl}`, eliminatorias: `${seq.filter(x => x === 'G').length}-${seq.filter(x => x === 'P').length}`, racha: seq.length >= 3 ? `${streak} ${seq[seq.length - 1] === 'G' ? 'victorias' : 'derrotas'} seguidas` : null },
    clasificacion: (mine.pj || mine.off) ? { posicion: mine.pos, puntos: mine.pts, jugadas: mine.pj, equipos: st.length, tabla: st.slice(0, 10).map(r => ({ pos: r.pos, club: clubName(r.id), pts: r.pts, pj: r.pj, nuestro: r.id === POLO })) } : null,
    evolucion: evo.length >= 2 ? evo : [],
    informe_capitan: cr ? Object.fromEntries(Object.entries(cr).filter(([kk]) => !['by', 'at'].includes(kk))) : null, informe_por: (cr && cr.by) || null,
    disponibilidad: { disponibles: a.yes.length, no_disponibles: a.no.length, pendientes: a.maybe.length, sin_respuesta: a.none.length, plantilla: a.total, convocados: (tt.convocados || []).length, problemas: prob },
    pendientes: { sin_validar: s.p.played && f.status !== 'official', partidos_incompletos: !tr.complete && !!(tr.decided || s.p.played), mvp_sin_publicar: s.p.played && !(S.published[k] || {}).mvp, sin_informe_capitan: !cr },
  };
}

const collMap = async ref => { const o = {}; (await ref.get()).forEach(d => { o[d.id] = d.data(); }); return o; };

// Datos del fin de semana del sábado `sat` (YYYY-MM-DD) de la temporada actual del club
async function reportFacts(db, opts = {}) {
  const meta = opts.meta || ((await db.doc('meta/app').get()).data() || {});
  const seasonId = opts.season || meta.current; if (!seasonId) throw new Error('No hay temporada actual en la configuración');
  const sat = opts.sat || ymd(weekendSat()), rg = weekendRange(sat), ns = new Date(sat + 'T12:00:00'); ns.setDate(ns.getDate() + 7); const rn = weekendRange(ymd(ns));
  const out = [], next = [], docsPend = [];
  for (const t of clubTeams(meta, db.cfg)) {
    const sref = db.doc('seasons/' + docIdFor(t.id, seasonId, db.cfg)), snap = await sref.get(); if (!snap.exists) continue;
    const X = season(snap.data()), S = X.S;
    const fx = S.fixtures.filter(f => (f.home === POLO || f.away === POLO) && f.date >= rg.from && f.date <= rg.to).map(f => ({ f, s: X.tieState(f) })).filter(x => x.s.st !== 'next');
    const av = await collMap(sref.collection('avail'));
    fx.forEach(({ f, s }) => out.push(teamWeekFacts(t, X, f, s, av)));
    S.fixtures.filter(f => (f.home === POLO || f.away === POLO) && f.date >= rn.from && f.date <= rn.to).forEach(f => { const p = X.persp(f);
      next.push({ equipo: t.name, jornada: f.j, fecha: fdate(f, { weekday: 'long', day: 'numeric', month: 'long' }), hora: f.time, rival: X.clubName(p.rival), casa: p.home, tareas: X.prepTasks(f.j, av) }); });
    const docs = await sref.collection('docs').where('status', 'in', ['revision', 'error']).get().catch(() => null);
    if (docs) docs.forEach(d => { const x = d.data(); docsPend.push({ equipo: t.name, documento: x.name, estado: DOC_ST[x.status] || x.status }); });
  }
  const sum = k => out.reduce((a, x) => { const [w, l] = x.fin_de_semana[k].split('-').map(Number); return [a[0] + w, a[1] + l]; }, [0, 0]);
  const tot = { equipos: out.length, victorias: out.filter(x => x.estado === 'victoria').length, derrotas: out.filter(x => x.estado === 'derrota').length, empates: 0, pendientes: out.filter(x => x.estado === 'pendiente').length,
    sin_validar: out.filter(x => x.pendientes.sin_validar).length, individuales: sum('individuales').join('-'), dobles: sum('dobles').join('-') };
  return { club: (db.cfg || CLUBCFG).name, temporada: seasonId, fin_de_semana: weekendLabel(rg), sat, totales: tot, equipos: out, proximo_fin_de_semana: { fechas: weekendLabel(rn), eliminatorias: next }, documentacion_pendiente: docsPend };
}

// Textos de respaldo si la IA no está disponible: solo datos (copia de factualTexts de app.js)
function factualTexts(F) {
  const T = F.totales;
  const r = { resumen_ejecutivo: !T.equipos ? 'No hubo eliminatorias de equipos del club este fin de semana.' : `${T.equipos} ${T.equipos === 1 ? 'equipo compitió' : 'equipos compitieron'} este fin de semana: ${T.victorias} ${T.victorias === 1 ? 'victoria' : 'victorias'}, ${T.derrotas} ${T.derrotas === 1 ? 'derrota' : 'derrotas'} y ${T.pendientes} ${T.pendientes === 1 ? 'resultado pendiente' : 'resultados pendientes'}. Balance de individuales ${T.individuales} y de dobles ${T.dobles}.${T.sin_validar ? ` ${T.sin_validar} ${T.sin_validar === 1 ? 'resultado está' : 'resultados están'} pendientes de validación.` : ''}`,
    conclusiones: F.equipos.map(x => `${x.equipo}: ${x.resultado ? (x.estado === 'victoria' ? 'victoria ' : 'derrota ') + x.resultado : 'resultado pendiente'} contra ${x.rival}${x.validado ? '' : ' (pendiente de validación)'}.`),
    sintesis_capitan: {}, areas_mejora: [], seguimiento: [] };
  F.equipos.forEach(x => { if (x.pendientes.sin_validar) r.seguimiento.push(`Validar el resultado de ${x.equipo} (jornada ${x.jornada}).`); if (x.pendientes.sin_informe_capitan) r.seguimiento.push(`Pedir el informe postpartido al capitán de ${x.equipo}.`); if (x.pendientes.mvp_sin_publicar) r.seguimiento.push(`Publicar el MVP de ${x.equipo}.`); });
  return r;
}
async function analysis(F) {
  const fb = factualTexts(F);
  try {
    const { data } = await require('./write-report.js').analyze(F);
    const A = { ...data, _ia: true }; if (!A.resumen_ejecutivo) A.resumen_ejecutivo = fb.resumen_ejecutivo; if (!(A.seguimiento || []).length) A.seguimiento = fb.seguimiento; return A;
  } catch (e) { return { ...fb, _note: e.message }; }
}

// Identidad del club guardada por su gestor (clubs/<id>): nombre de uso, escudo y colores. Si no hay, la de club-config.js
async function clubIdentity(db) {
  const raw = (db && db.raw) || db, C = (db && db.cfg) || CLUBCFG;
  let d = {}; try { const x = await raw.doc('clubs/' + C.id).get(); if (x.exists) d = x.data() || {}; } catch (e) {}
  const hex = h => (/^#[0-9a-f]{6}$/i.test(String(h || '')) ? h : null);
  return { name: d.name || C.name, medium: d.shortName || C.medium, crest: /^data:image\/png;base64,/.test(d.crestPng || '') ? d.crestPng : require('./_crest.js'),
    primary: hex((d.colors || {}).primary) || '#13261F', secondary: hex((d.colors || {}).secondary) || '#94722A' };
}
function pdfBuffer(F, A, crest) {
  const PdfPrinter = require('pdfmake');
  const vfs = require('pdfmake/build/vfs_fonts.js'); const V = (vfs.pdfMake && vfs.pdfMake.vfs) || vfs.vfs || vfs;
  const font = n => Buffer.from(V[n], 'base64');
  const printer = new PdfPrinter({ Roboto: { normal: font('Roboto-Regular.ttf'), bold: font('Roboto-Medium.ttf'), italics: font('Roboto-Italic.ttf'), bolditalics: font('Roboto-MediumItalic.ttf') } });
  const doc = printer.createPdfKitDocument(ReportDoc.build(F, A, crest || require('./_crest.js')));
  return new Promise((ok, ko) => { const chunks = []; doc.on('data', c => chunks.push(c)); doc.on('end', () => ok(Buffer.concat(chunks))); doc.on('error', ko); doc.end(); });
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Correo con el mismo aspecto que el del botón de la app
function emailFor(F, file, appUrl, I) {
  I = I || { medium: CLUBCFG.medium, primary: '#13261F', secondary: '#94722A' };
  const T = F.totales, rows = F.equipos, range = F.fin_de_semana;
  const st = x => (x.estado === 'victoria' ? 'Victoria' : x.estado === 'derrota' ? 'Derrota' : 'Pendiente de resultado') + (x.resultado && !x.validado ? ', por confirmar' : '');
  const subject = `Resumen del fin de semana (${range}), ${I.medium}`;
  const link = (appUrl || '') + '/#club-resumen';
  const text = [`RESUMEN DEL FIN DE SEMANA: ${range}`, `Eliminatorias: ${rows.length}. Victorias: ${T.victorias}. Derrotas: ${T.derrotas}. Pendientes: ${T.pendientes}.`, '',
    ...rows.map(x => `${x.equipo} contra ${x.rival} (jornada ${x.jornada}, ${x.fecha}): ${x.resultado || '–'}. ${st(x)}. Individuales ${x.fin_de_semana.individuales}, dobles ${x.fin_de_semana.dobles}.`),
    '', file ? 'Se adjunta el informe completo en PDF: ' + file : '', 'Detalle completo en la app: ' + link, '', 'Envío automático del domingo. Se puede desactivar en Gestión deportiva → Configuración.'].join('\n');
  const td = 'style="padding:6px 8px;border-bottom:1px solid #e3e6df;font-size:14px"';
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#13261F;max-width:640px">
    <p style="font-size:12px;color:${I.secondary};text-transform:uppercase;letter-spacing:.06em;margin:0">${esc(I.name)}, gestión deportiva</p>
    <h1 style="font-size:24px;margin:4px 0 2px">Resumen del fin de semana</h1><p style="margin:0 0 14px;color:#5b6b63">${esc(range)}</p>
    <p><b>${rows.length}</b> eliminatorias: <b style="color:#2F7D4F">${T.victorias} victorias</b>, <b style="color:#B4472F">${T.derrotas} derrotas</b>, ${T.pendientes} pendientes.</p>
    ${rows.length ? `<table style="border-collapse:collapse;width:100%"><tr><th align="left" ${td}>Equipo</th><th align="left" ${td}>Rival</th><th ${td}>Resultado</th><th align="left" ${td}>Estado</th><th ${td}>Ind.</th><th ${td}>Dob.</th></tr>
      ${rows.map(x => `<tr><td ${td}>${esc(x.equipo)}</td><td ${td}>${esc(x.rival)}</td><td align="center" ${td}><b>${esc(x.resultado || '–')}</b></td><td ${td}>${esc(st(x))}</td><td align="center" ${td}>${x.fin_de_semana.individuales}</td><td align="center" ${td}>${x.fin_de_semana.dobles}</td></tr>`).join('')}</table>` : '<p>No hubo eliminatorias de equipos del club este fin de semana.</p>'}
    ${rows.filter(x => x.individuales.length || x.dobles.length).map(x => `<h3 style="font-size:16px;margin:18px 0 4px">${esc(x.equipo)}</h3>${[...x.individuales.map(m => ({ ...m, k: 'individual ' + m.n })), ...x.dobles.map(m => ({ ...m, k: 'dobles' }))].filter(m => m.resultado !== 'sin resultado').map(m => `<div style="font-size:14px;padding:2px 0">${m.resultado === 'ganado' ? '✅' : '❌'} ${esc(m.jugadores.join(' y '))}, ${m.k}: ${esc(m.marcador)}</div>`).join('')}`).join('')}
    ${file ? `<p style="margin-top:18px;padding:10px 12px;border:1px solid #d9dee6;border-radius:8px">📎 Se adjunta el informe completo en PDF: <b>${esc(file)}</b></p>` : ''}
    <p style="margin-top:20px"><a href="${esc(link)}" style="color:${I.secondary}">Ver el detalle en la app</a></p>
    <p style="font-size:12px;color:#8a978f">Envío automático del domingo, generado con los resultados registrados en la app. Los marcados como pendientes aún no están confirmados. Se puede desactivar en Gestión deportiva → Configuración.</p></div>`;
  return { subject, text, html };
}

// Genera y envía el informe. Devuelve lo enviado y lo deja registrado en la colección reports.
// Destinatarios del informe: la lista de gestores del club; si está vacía, sus miembros con rol de gestor
async function managerEmails(db, meta) {
  const list = (meta && meta.managerEmails) || []; if (list.length) return list;
  const raw = (db && db.raw) || db, id = (db && db.club) || CLUBCFG.id;
  try { const q = await raw.collection('clubs/' + id + '/members').where('roles', 'array-contains', 'gestor').get(); return q.docs.map(d => d.data()).filter(m => m.status !== 'inactivo' && m.email).map(m => String(m.email).toLowerCase()); } catch (e) { return []; }
}
async function sendWeekly(db, { meta, sat, to, by, appUrl, auto } = {}) {
  const { sendMail } = require('./_mail.js');
  meta = meta || ((await db.doc('meta/app').get()).data() || {});
  to = [...new Set((to || await managerEmails(db, meta)).map(x => String(x).toLowerCase()).filter(Boolean))].slice(0, 10);
  if (!to.length) throw Object.assign(new Error('No hay gestores con correo en Configuración'), { status: 400 });
  const F = await reportFacts(db, { meta, sat });
  const A = await analysis(F);
  const I = await clubIdentity(db);
  const pdf = await pdfBuffer(F, A, I.crest); if (!pdf || pdf.length < 1500) throw new Error('El PDF generado está vacío');
  const file = `Weekend_Sports_Report_${(db.cfg || CLUBCFG).fileTag}_${F.sat}.pdf`;
  const mail = emailFor(F, file, appUrl, I);
  const base = { at: Date.now(), by: by || 'Envío automático', to, range: F.fin_de_semana, sat: F.sat, auto: !!auto, pdf: file, ia: !!A._ia };
  try {
    const r = await sendMail({ ...mail, to, attachments: [{ filename: file, content: pdf.toString('base64'), contentType: 'application/pdf' }] });
    await db.collection('reports').doc(Date.now().toString(36)).set({ ...base, status: 'enviado', provider: r.provider, messageId: r.id || '' });
    return { ok: true, ...base, provider: r.provider, teams: F.totales.equipos };
  } catch (e) {
    await db.collection('reports').doc(Date.now().toString(36)).set({ ...base, status: 'error', error: String(e.message || e).slice(0, 200) }).catch(() => {});
    throw e;
  }
}

module.exports = { managerEmails, clubIdentity, reportFacts, factualTexts, pdfBuffer, emailFor, sendWeekly, weekendSat, ymd, clubTeams, docIdFor };
