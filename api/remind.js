// Recordatorios automáticos (Vercel Cron) y botón «Enviar ahora» del capitán.
//  · Disponibilidad: avisa a quien aún no ha respondido, cada X días, mientras siga abierta.
//  · Día antes: avisa a los convocados cuando falta poco para el partido.
// Cada temporada decide si está activo en  rules.autoRemind = { on, every, dayBefore }.
// Necesita en Vercel: FIREBASE_SERVICE_ACCOUNT y CRON_SECRET (cualquier texto largo y secreto).
// Permisos: los mismos que firestore.rules (api/_auth.js). Datos: en la raíz real del club (clubDb).
const { getAdmin, needTeam, clubDbFor, sendErr } = require('./_auth.js');
const { deliver } = require('./_deliver.js');
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

// Configuración de automatizaciones del equipo. La edita el capitán (S.auto); rules.autoRemind es la versión antigua.
const AUTO_DEF = { on: false, every: 1, firstAfterH: 24, lastCallH: 48, max: 3, dayBefore: true, sched: true, result: true, email: true };
const autoCfg = S => ({ ...AUTO_DEF, ...((S.rules || {}).autoRemind || {}), ...(S.auto || {}) });

// Decide a quién toca recordar la disponibilidad. Política (todo configurable por el capitán):
//  · primer recordatorio cuando pasan firstAfterH horas desde la solicitud sin respuesta;
//  · después, cada «every» días;
//  · aviso final cuando faltan lastCallH horas para el cierre (una sola vez);
//  · nunca más de «max» recordatorios a la misma persona; quien responde deja de recibirlos.
function dueAvail({ pend, reqAt, dl, now, cfg, avl, force }) {
  return pend.filter(p => {
    const r = avl[p] || { n: 0, at: 0 };
    if (r.n >= cfg.max) return false;
    if (force) return now - r.at > 2 * H;
    if (dl - now <= cfg.lastCallH * H && !r.last && now - r.at > 6 * H) return true;
    const gap = r.n === 0 ? cfg.firstAfterH * H : cfg.every * D;
    return now - Math.max(reqAt, r.at) >= gap - 3 * H;   // 3 h de margen: la tarea se ejecuta a horas fijas
  });
}

async function runSeason(A, db, id, S, { force, origin, now }) {
  const cfg = autoCfg(S);
  const out = { season: id, availability: [], dayBefore: [], sched: [], result: [] };
  if (!force && !cfg.on) return out;
  const logRef = db.raw.doc('remLog/' + (db.club && db.club !== 'rcpb' ? db.club + '_' : '') + id), log = (await logRef.get()).data() || {};
  const players = (S.players || []).filter(p => p.active !== false), active = players.map(p => p.id);
  const names = Object.fromEntries((S.players || []).map(p => [p.id, p.name]));
  const base = String(origin || '').replace(/\/$/, '');
  const team = (db.cfg && db.cfg.teamShort) || 'Polo', color = db.cfg && db.cfg.colors && db.cfg.colors.primary;
  const teamName = n => ((S.teams || []).find(t => t.id === n) || {}).name || 'el rival';
  const send = (pids, msg) => deliver(A, p => db.doc(p), pids, msg, { email: cfg.email !== false, team, color, names });
  const upd = { av: { ...(log.av || {}) }, sched: { ...(log.sched || {}) } }, logs = {};
  const note = (k, e) => { (logs[k] = logs[k] || []).push({ at: now, ...e }); };
  for (const f of (S.fixtures || [])) {
    if (!(f.home === 'polo' || f.away === 'polo') || !f.date) continue;
    const j = +f.j, k = 'j' + j, tie = (S.ties || {})[k] || {}, ko = madridMs(f.date, f.time);
    const rival = teamName(f.home === 'polo' ? f.away : f.home), fecha = fechaTxt(f), lugar = f.home === 'polo' ? 'en casa' : 'fuera';
    // 0) después del partido: pedir el resultado a los capitanes (una vez, entre 3 h y 4 días después)
    if (!played(f)) {
      if (cfg.result && ko + 3 * H <= now && now <= ko + 4 * D && !(log.resAt || {})[k] && (S.captains || []).length) {
        const r = await send(S.captains, { title: `Resultado de la jornada ${j}`, body: `${team} contra ${rival} ya se ha jugado. Introduce el resultado o sube el acta: la app recalcula todo y abre la encuesta y el MVP.`, url: `${base}/#gestion-res-${j}`, tag: `result-${k}`, cta: 'Introducir el resultado' });
        out.result.push({ j, ...r }); upd.resAt = { ...(log.resAt || {}), ...(upd.resAt || {}), [k]: now }; note(k, { kind: 'result', ...pick(r) });
      }
    }
    if (played(f) || ko <= now) continue;
    // 1) cambio de fecha u hora: avisar si el equipo ya estaba pendiente de esa jornada
    const sig = f.date + ' ' + (f.time || ''), prev = (log.sched || {})[k];
    if (prev && prev !== sig && cfg.sched && (tie.availReq || tie.lineupPub)) {
      const pids = tie.lineupPub ? [...new Set([...(tie.convocados || []), ...(tie.subs || []), ...((tie.rubbers || []).flatMap(r => r.polo || []))])] : active;
      const r = await send(pids, { title: `Cambio de horario: jornada ${j}`, body: `${team} contra ${rival} pasa al ${fecha} a las ${f.time || 'hora por confirmar'} (${lugar}).`, url: `${base}/#jornada-${j}`, tag: `sched-${k}`, cta: 'Ver la jornada' });
      out.sched.push({ j, ...r }); note(k, { kind: 'sched', ...pick(r), from: prev, to: sig });
    }
    upd.sched[k] = sig;
    // 2) disponibilidad pendiente, persona a persona
    if (tie.availReq && !tie.availClosed) {
      const dl = tie.deadline ? new Date(tie.deadline).getTime() : madridMs(addDays(f.date, -(+((S.rules || {}).deadlineDays) || 0)), (S.rules || {}).deadlineTime || '21:00');
      if (now < dl) {
        const snap = await db.collection(`seasons/${id}/avail`).get(), done = new Set();
        snap.forEach(d => { if ((d.data().j || {})[k]) done.add(d.id); });
        const avl = { ...((log.av || {})[k] || {}) }, pend = active.filter(p => !done.has(p));
        const due = dueAvail({ pend, reqAt: tie.availReq.at || 0, dl, now, cfg, avl, force });
        if (due.length) {
          const last = dl - now <= cfg.lastCallH * H;
          const r = await send(due, { title: last ? 'Último aviso: tu disponibilidad' : 'Falta tu disponibilidad', body: `¿Puedes jugar contra ${rival} el ${fecha} a las ${f.time || ''}? Responde en un toque${last ? ', el plazo se cierra pronto' : ''}.`, url: `${base}/#disponibilidad-${j}`, tag: `availRem-${k}`, cta: 'Responder' });
          due.forEach(p => { const x = avl[p] || { n: 0 }; avl[p] = { n: (x.n || 0) + 1, at: now, last: x.last || last }; });
          out.availability.push({ j, ...r }); note(k, { kind: last ? 'last' : 'avail', ...pick(r) });
        }
        upd.av[k] = avl;
      }
    }
    // 3) recordatorio a los convocados, entre 6 y 36 horas antes
    if (cfg.dayBefore !== false && tie.lineupPub && ko - now >= 6 * H && ko - now <= 36 * H && (force || !(log.dayAt || {})[k])) {
      const pids = [...new Set([...(tie.convocados || []), ...(tie.subs || []), ...((tie.rubbers || []).flatMap(r => r.polo || []))])];
      if (pids.length) {
        const r = await send(pids, { title: `Mañana juegas: jornada ${j}`, body: `${team} contra ${rival}, ${fecha} a las ${f.time || ''} (${lugar}). Revisa tu partido y el orden de juego en la app.`, url: `${base}/#jornada-${j}`, tag: `dayBefore-${k}`, cta: 'Ver mi partido' });
        out.dayBefore.push({ j, ...r }); upd.dayAt = { ...(log.dayAt || {}), ...(upd.dayAt || {}), [k]: now }; note(k, { kind: 'day', ...pick(r) });
      }
    }
  }
  await logRef.set({ ...upd, lastRun: now }, { merge: true });
  // Registro visible para el capitán en su centro de automatización (S.autoLog.<jornada>, últimas 30 entradas)
  const ks = Object.keys(logs);
  if (ks.length) {
    const cur = S.autoLog || {}, patch = {};
    ks.forEach(k => { patch['autoLog.' + k] = [...(cur[k] || []), ...logs[k]].slice(-30); });
    await db.doc('seasons/' + id).update(patch).catch(e => console.error('autoLog', e.message));
  }
  return out;
}
const pick = r => ({ n: r.recipients, push: r.push, email: r.email, none: r.none });

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
    const n = results.reduce((a, r) => a + r.availability.length + r.dayBefore.length + r.sched.length + r.result.length, 0);
    return res.status(200).json({ ok: true, avisos: n, results });
  } catch (e) {
    return sendErr(res, e);
  }
};

module.exports._test = { dueAvail, autoCfg, madridMs };
