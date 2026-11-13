// Aviso por correo de una solicitud de acceso nueva (pantalla de entrada → «Solicitar acceso»).
// La llama la app justo después de crear clubRequests/<uid>. Destinatarios:
//   - Club activo en esta app (club-config.js → id):
//       · jugador con ficha propuesta: los capitanes de ese equipo y los gestores del club
//       · jugador sin ficha: los gestores del club (meta/app.managerEmails)
//   - Gestor (de cualquier club): la plataforma, es decir PLATFORM_EMAILS (Dossau Lab) y los administradores.
//     y, si el club aún no tiene gestores, los administradores.
//   - Club que todavía no está activo: los administradores de la plataforma (colección admins con correo
//     y, opcionalmente, PLATFORM_EMAILS en Vercel, separados por comas).
// Cada solicitud se avisa una sola vez (campo notifiedAt).
const CLUB = require('../club-config.js');
const { getAdmin, clubDbFor } = require('./_auth.js');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isMail = s => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || ''));

async function recipients(db, r, cdb = db) {
  const admins = (await db.collection('admins').get()).docs.map(d => d.id).filter(isMail);
  const platform = String(process.env.PLATFORM_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(isMail);
  // Los gestores los valida la plataforma (Dossau Lab): PLATFORM_EMAILS y administradores
  if (r.clubId !== CLUB.id || r.role !== 'jugador') return { to: [...new Set([...platform, ...admins])], who: 'plataforma' };
  const meta = (await cdb.doc('meta/app').get()).data() || {};
  const managers = (meta.managerEmails || []).filter(isMail);
  let captains = [];
  if (r.role === 'jugador' && r.season) {
    const s = (await cdb.doc('seasons/' + r.season).get()).data() || {};
    const claims = await Promise.all((s.captains || []).map(pid => cdb.doc('claims/' + pid).get()));
    captains = claims.map(c => c.exists && c.data().email).filter(isMail);
  }
  const to = [...new Set([...captains, ...managers])];
  return { to: to.length ? to : [...new Set([...platform, ...admins])], who: captains.length ? 'capitanes y gestión' : to.length ? 'gestión' : 'plataforma' };
}

const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9ñ ]+/g, ' ').split(/\s+/).filter(w => w.length > 1);
async function findPlayers(cdb, first, last) {
  const F = norm(first), L = norm(last);
  if (!F.length || !L.length || String(first).length > 40 || String(last).length > 60) return [];
  const meta = (await cdb.doc('meta/app').get()).data() || {}, season = meta.current || '';
  const R = require('./_report.js'), teams = R.clubTeams(meta), roster = ((await cdb.doc('public/roster').get()).data() || {}).teams || {};
  const out = new Map();
  for (const t of teams) {
    let list = roster[t.id] || [];
    if (!list.length && season) { const S = (await cdb.doc('seasons/' + R.docIdFor(t.id, season)).get()).data() || {}; list = (S.players || []).filter(p => p.active !== false); }
    for (const p of list) {
      const n = norm(p.full || p.name);
      if (!(F.every(x => n.includes(x)) && L.some(x => n.includes(x)))) continue;
      const m = out.get(p.id) || { pid: p.id, name: p.name, teams: [] };
      m.teams.push({ id: t.id, name: t.name, season: season ? R.docIdFor(t.id, season) : '' }); out.set(p.id, m);
    }
  }
  const list = [...out.values()].slice(0, 5);
  const cl = await Promise.all(list.map(m => cdb.doc('claims/' + m.pid).get()));
  return list.map((m, i) => ({ ...m, claimed: cl[i].exists }));
}

// ---------- Aprobar o rechazar una solicitud de gestor desde el correo (plataforma) ----------
// El enlace lleva el uid y un código aleatorio de esa solicitud, firmados con una clave derivada de la cuenta de servicio
// (no hace falta otra variable en Vercel). Abrir el enlace solo muestra una página de confirmación; la decisión se toma al
// pulsar el botón (POST), para que un antivirus o una vista previa del correo no apruebe nada. Una vez decidida, el enlace ya no sirve.
const crypto = require('crypto');
const secret = () => crypto.createHash('sha256').update('lliga-decision:' + JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT).private_key).digest();
const sign = (uid, nonce) => crypto.createHmac('sha256', secret()).update(uid + '.' + nonce).digest('base64url');
const makeToken = (uid, nonce) => Buffer.from(uid).toString('base64url') + '.' + nonce + '.' + sign(uid, nonce);
function readToken(t) {
  const [u, nonce, sig] = String(t || '').split('.'); if (!u || !nonce || !sig) return null;
  const uid = Buffer.from(u, 'base64url').toString('utf8'), good = sign(uid, nonce);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  return { uid, nonce };
}
const page = (title, body, color = '#0F3B2E') => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title>
  <style>body{margin:0;background:#0E1216;color:#EEF1EC;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box}
  main{max-width:520px;width:100%;background:#161B21;border:1px solid #2A313A;border-radius:18px;padding:28px}h1{font-size:24px;margin:6px 0 12px;line-height:1.2}small{color:#D4F04C;letter-spacing:.12em;text-transform:uppercase;font-size:12px;font-weight:700}
  p{color:#C6CDD3;margin:0 0 10px}b{color:#fff}.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}button{font:inherit;font-weight:700;border:0;border-radius:999px;padding:12px 20px;cursor:pointer}
  .ok{background:#D4F04C;color:#0E1216}.no{background:transparent;color:#EEF1EC;border:1px solid #3A424C}.st{display:inline-block;padding:3px 10px;border-radius:999px;background:${color};color:#fff;font-size:13px}</style></head>
  <body><main><small>Lliga Catalana · plataforma</small>${body}</main></body></html>`;
async function approveGestor(db, ref, r, by) {
  const at = Date.now();
  const mref = db.doc('clubs/' + r.clubId + '/members/' + r.uid), m = await mref.get(), cur = m.exists ? m.data() : {};
  await mref.set({ ...cur, email: r.email, roles: [...new Set([...(cur.roles || []), 'gestor'])], status: 'activo', approvedBy: by, at: cur.at || at, request: r.uid }, { merge: true });
  if (r.clubId === CLUB.id) {   // en el club de esta app, también en la lista de gestores (recibe el informe semanal)
    const cdb = await clubDbFor(db), meta = (await cdb.doc('meta/app').get()).data() || {};
    const managers = [...(meta.managers || []).filter(x => x.email !== r.email), { name: r.name || '', email: r.email, approvedBy: by, approvedAt: at }];
    await cdb.doc('meta/app').set({ managers, managerEmails: managers.map(x => x.email) }, { merge: true });
  }
}
async function decisionHandler(req, res) {
  const A = getAdmin(), db = A.firestore();
  const q = req.method === 'GET' ? (req.query || {}) : (typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : (req.body || {}));
  const tk = readToken(q.t), act = q.a === 'no' ? 'no' : 'ok';
  res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex');
  if (!tk) return res.status(400).send(page('Enlace no válido', '<h1>Enlace no válido</h1><p>Este enlace no es correcto. Revisa la solicitud desde la app.</p>', '#A8432E'));
  const ref = db.doc('clubRequests/' + tk.uid), snap = await ref.get(), r = snap.exists ? snap.data() : null;
  if (!r || r.decisionNonce !== tk.nonce) return res.status(410).send(page('Enlace caducado', '<h1>Este enlace ya no sirve</h1><p>La solicitud ha cambiado o se ha vuelto a enviar. Usa el último correo o la app.</p>', '#A8432E'));
  const who = `<p><b>${esc(r.name || r.email)}</b> · ${esc(r.email)}</p><p>Pide ser <b>gestor deportivo</b> de <b>${esc(r.clubName)}</b>.${r.msg ? ` «${esc(r.msg)}»` : ''}</p>`;
  if (r.status !== 'pendiente') return res.status(200).send(page('Solicitud ya resuelta', `<h1>Ya estaba ${r.status === 'aprobada' ? 'aprobada' : 'rechazada'}</h1>${who}<p>Decidido por ${esc(r.decidedByEmail || '')}.</p>`));
  if (req.method === 'GET') return res.status(200).send(page(act === 'ok' ? 'Dar acceso' : 'Rechazar',
    `<h1>${act === 'ok' ? '¿Dar acceso como gestor?' : '¿Rechazar la solicitud?'}</h1>${who}
     <p>${act === 'ok' ? 'Podrá entrar con ese correo de Google en la gestión deportiva de su club y empezar la configuración inicial.' : 'No tendrá acceso a ningún dato. Podrá volver a solicitarlo.'}</p>
     <form method="post" class="row"><input type="hidden" name="t" value="${esc(q.t)}"><input type="hidden" name="a" value="${act}">
       <button class="${act === 'ok' ? 'ok' : 'no'}" type="submit">${act === 'ok' ? 'Sí, dar acceso' : 'Sí, rechazar'}</button></form>`));
  const by = 'plataforma (correo)', at = Date.now();
  if (act === 'ok') await approveGestor(db, ref, r, by);
  await ref.update({ status: act === 'ok' ? 'aprobada' : 'rechazada', decidedBy: 'plataforma', decidedByEmail: by, decidedAt: at, decisionNonce: null });
  await db.doc('clubs/' + r.clubId + '/audit/' + at.toString(36) + crypto.randomBytes(2).toString('hex')).set({ action: act === 'ok' ? 'solicitud-aprobada' : 'solicitud-rechazada', data: { email: r.email, role: 'gestor' }, by: 'plataforma', byEmail: by, at, via: 'servidor' }).catch(() => {});
  // Aviso al solicitante
  try { if (require('./_mail.js').via()) { const host = req.headers['x-forwarded-host'] || req.headers.host, app = process.env.APP_URL || ('https://' + host);
    await require('./_mail.js').sendMail({ to: [r.email], fromName: 'Lliga Catalana', subject: act === 'ok' ? `Ya tienes acceso: gestor deportivo de ${r.clubName}` : `Tu solicitud para ${r.clubName}`,
      text: act === 'ok' ? `Ya puedes entrar en Lliga Catalana como gestor deportivo de ${r.clubName} con tu cuenta de Google ${r.email}:\n${app}\n\nAl entrar empezarás la configuración inicial del club.` : `Tu solicitud para gestionar ${r.clubName} en Lliga Catalana no se ha aprobado. Si crees que es un error, responde a este correo.`,
      html: act === 'ok' ? `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#13241e;max-width:560px"><h2 style="margin:0 0 12px">Ya tienes acceso</h2><p>Ya puedes entrar en Lliga Catalana como <b>gestor deportivo de ${esc(r.clubName)}</b> con tu cuenta de Google <b>${esc(r.email)}</b>.</p><p style="margin:20px 0"><a href="${esc(app)}" style="background:#0F3B2E;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold">Entrar</a></p><p style="color:#6b7a73;font-size:13px">Al entrar empezarás la configuración inicial del club.</p></div>`
        : `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#13241e;max-width:560px"><p>Tu solicitud para gestionar <b>${esc(r.clubName)}</b> en Lliga Catalana no se ha aprobado. Si crees que es un error, responde a este correo.</p></div>` }); } } catch (e) { console.error('aviso al solicitante', e.message); }
  return res.status(200).send(page('Hecho', act === 'ok' ? `<h1>Acceso concedido</h1>${who}<p>Le hemos avisado por correo. Ya puede entrar y empezar la configuración del club.</p>` : `<h1>Solicitud rechazada</h1>${who}`, act === 'ok' ? '#2B7A4B' : '#A8432E'));
}

module.exports = async (req, res) => {
  if (req.method === 'GET' || (req.method === 'POST' && !req.headers.authorization && (req.query?.t || /urlencoded/.test(req.headers['content-type'] || '')))) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(501).send('Falta FIREBASE_SERVICE_ACCOUNT');
    try { return await decisionHandler(req, res); } catch (e) { console.error('decision', e.message); return res.status(500).send(page('Error', '<h1>No se ha podido completar</h1><p>' + esc(e.message || 'error') + '</p>', '#A8432E')); }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(501).json({ error: 'Falta FIREBASE_SERVICE_ACCOUNT en Vercel' });
  try {
    const A = getAdmin(), db = A.firestore();
    const user = await A.auth().verifyIdToken(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    // Buscar la ficha por nombre y apellidos (pantalla «¿Cómo te llamas?»): quien aún no es del club no puede leer las
    // plantillas, así que se busca aquí y solo se devuelven fichas que coinciden en el nombre y en algún apellido.
    const body0 = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (body0.action === 'match') {
      if (user.email_verified !== true) return res.status(403).json({ error: 'Correo sin verificar' });
      return res.status(200).json({ matches: await findPlayers(await clubDbFor(db), body0.first, body0.last) });
    }
    const ref = db.doc('clubRequests/' + user.uid), snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'No hay ninguna solicitud' });
    const r = snap.data();
    if (r.status !== 'pendiente') return res.status(200).json({ ok: true, skipped: 'no pendiente' });
    // Un aviso por solicitud; «Reenviar el aviso» lo repite como mucho 5 veces y no antes de 2 minutos
    const body = body0;
    if (r.notifiedAt && !body.resend) return res.status(200).json({ ok: true, skipped: 'ya avisado', who: r.notifiedWho });
    if (r.notifiedAt && Date.now() - r.notifiedAt < 120000) return res.status(200).json({ ok: true, skipped: 'reciente', who: r.notifiedWho });
    if ((r.notifyCount || (r.notifiedAt ? 1 : 0)) >= 5) return res.status(429).json({ ok: false, error: 'Ya se ha avisado 5 veces' });
    if (!require('./_mail.js').via()) return res.status(501).json({ error: 'El envío de correo no está configurado en Vercel' });
    const { to, who } = await recipients(db, r, await clubDbFor(db));
    if (!to.length) return res.status(200).json({ ok: false, error: 'No hay a quién avisar: añade un administrador con correo o PLATFORM_EMAILS' });
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const app = process.env.APP_URL || ('https://' + host);
    // Gestores: el correo de la plataforma lleva los botones para decidir sin entrar en la app
    const nonce = r.role !== 'jugador' ? crypto.randomBytes(12).toString('base64url') : null;
    const dLink = a => app + '/api/access-request?a=' + a + '&t=' + encodeURIComponent(makeToken(r.uid, nonce));
    const link = r.clubId === CLUB.id ? app + '/#club-ajustes' : app;
    const rol = r.role === 'jugador' ? 'jugador' : 'gestor deportivo';
    const ficha = r.pidName ? `${r.pidName}${r.teamName ? ' (' + r.teamName + ')' : ''}` : '';
    const subject = `Solicitud de acceso: ${r.name || r.email}, ${rol} de ${r.clubName}`;
    const text = [`${r.name || 'Alguien'} (${r.email}) pide entrar en Lliga Catalana como ${rol} de ${r.clubName}.`,
      ficha ? `Dice ser: ${ficha}.` : '', r.msg ? `Mensaje: «${r.msg}»` : '',
      nonce ? `Dar acceso: ${dLink('ok')}\nRechazar: ${dLink('no')}` : '',
      r.clubId === CLUB.id ? `Para validarla: Gestión deportiva → Configuración → Solicitudes de acceso${r.role === 'jugador' ? ', o Gestión → Plantilla si eres capitán' : ''}.\n${link}` : 'Este club aún no está activo en Lliga Catalana: la solicitud queda registrada para darlo de alta.',
      'Si no conoces a esta persona, rechaza la solicitud: no tendrá acceso a ningún dato.'].filter(Boolean).join('\n\n');
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#13241e;max-width:560px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6b7a73">Lliga Catalana · ${esc(r.clubName)}</p>
      <h2 style="margin:0 0 12px;font-size:20px">Solicitud de acceso como ${esc(rol)}</h2>
      <p style="margin:0 0 8px"><b>${esc(r.name || 'Sin nombre')}</b> · ${esc(r.email)}</p>
      ${ficha ? `<p style="margin:0 0 8px">Dice ser <b>${esc(ficha)}</b>.</p>` : ''}
      ${nonce ? `<p style="margin:18px 0 6px"><a href="${esc(dLink('ok'))}" style="background:#0F3B2E;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold;display:inline-block">Dar acceso</a>&nbsp;&nbsp;<a href="${esc(dLink('no'))}" style="color:#A8432E;text-decoration:underline;font-weight:bold">Rechazar</a></p><p style="margin:0 0 8px;color:#6b7a73;font-size:13px">Te pediremos confirmarlo antes de aplicarlo.</p>` : ''}
      ${r.msg ? `<p style="margin:0 0 8px;color:#41534c">«${esc(r.msg)}»</p>` : ''}
      ${r.clubId === CLUB.id ? `<p style="margin:16px 0"><a href="${esc(link)}" style="background:#0F3B2E;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:bold">Revisar la solicitud</a></p>
      <p style="margin:0;color:#6b7a73;font-size:13px">Gestión deportiva → Configuración → Solicitudes de acceso${r.role === 'jugador' ? ' (los capitanes también la ven en Gestión → Plantilla)' : ''}.</p>`
        : `<p style="margin:12px 0 0;color:#41534c">Este club aún no está activo en Lliga Catalana: la solicitud queda registrada para darlo de alta.</p>`}
      <p style="margin:16px 0 0;color:#6b7a73;font-size:13px">Si no conoces a esta persona, rechaza la solicitud: no tendrá acceso a ningún dato.</p></div>`;
    const out = await require('./_mail.js').sendMail({ to, replyTo: r.email, subject, text, html });
    await ref.update({ ...(nonce ? { decisionNonce: nonce } : {}), notifiedAt: Date.now(), notifiedTo: to, notifiedWho: who, notifyCount: (r.notifyCount || (r.notifiedAt ? 1 : 0)) + 1, notifyError: null });
    return res.status(200).json({ ok: true, to: to.length, who, provider: out.provider });
  } catch (e) {
    console.error('access-request', e.message || e);
    return res.status(e.status || (e.code && String(e.code).startsWith('auth/') ? 401 : 500)).json({ error: e.message || 'error' });
  }
};
module.exports._test = { recipients, findPlayers, makeToken, readToken, page };
