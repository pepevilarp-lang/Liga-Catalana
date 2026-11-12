// Aviso por correo de una solicitud de acceso nueva (pantalla de entrada → «Solicitar acceso»).
// La llama la app justo después de crear clubRequests/<uid>. Destinatarios:
//   - Club activo en esta app (club-config.js → id):
//       · jugador con ficha propuesta: los capitanes de ese equipo y los gestores del club
//       · gestor o jugador sin ficha: los gestores del club (meta/app.managerEmails)
//     y, si el club aún no tiene gestores, los administradores.
//   - Club que todavía no está activo: los administradores de la plataforma (colección admins con correo
//     y, opcionalmente, PLATFORM_EMAILS en Vercel, separados por comas).
// Cada solicitud se avisa una sola vez (campo notifiedAt).
const admin = require('firebase-admin');
const CLUB = require('../club-config.js');
function getAdmin() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return admin;
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isMail = s => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || ''));

async function recipients(db, r) {
  const admins = (await db.collection('admins').get()).docs.map(d => d.id).filter(isMail);
  const platform = String(process.env.PLATFORM_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(isMail);
  if (r.clubId !== CLUB.id) return { to: [...new Set([...platform, ...admins])], who: 'plataforma' };
  const meta = (await db.doc('meta/app').get()).data() || {};
  const managers = (meta.managerEmails || []).filter(isMail);
  let captains = [];
  if (r.role === 'jugador' && r.season) {
    const s = (await db.doc('seasons/' + r.season).get()).data() || {};
    const claims = await Promise.all((s.captains || []).map(pid => db.doc('claims/' + pid).get()));
    captains = claims.map(c => c.exists && c.data().email).filter(isMail);
  }
  const to = [...new Set([...captains, ...managers])];
  return { to: to.length ? to : [...new Set([...platform, ...admins])], who: captains.length ? 'capitanes y gestión' : to.length ? 'gestión' : 'plataforma' };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(501).json({ error: 'Falta FIREBASE_SERVICE_ACCOUNT en Vercel' });
  try {
    const A = getAdmin(), db = A.firestore();
    const user = await A.auth().verifyIdToken(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    const ref = db.doc('clubRequests/' + user.uid), snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'No hay ninguna solicitud' });
    const r = snap.data();
    if (r.status !== 'pendiente') return res.status(200).json({ ok: true, skipped: 'no pendiente' });
    if (r.notifiedAt) return res.status(200).json({ ok: true, skipped: 'ya avisado' });
    if (!require('./_mail.js').via()) return res.status(501).json({ error: 'El envío de correo no está configurado en Vercel' });
    const { to, who } = await recipients(db, r);
    if (!to.length) return res.status(200).json({ ok: false, error: 'No hay a quién avisar: añade un administrador con correo o PLATFORM_EMAILS' });
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const app = process.env.APP_URL || ('https://' + host);
    const link = r.clubId === CLUB.id ? app + '/#club-ajustes' : app;
    const rol = r.role === 'jugador' ? 'jugador' : 'gestor deportivo';
    const ficha = r.pidName ? `${r.pidName}${r.teamName ? ' (' + r.teamName + ')' : ''}` : '';
    const subject = `Solicitud de acceso: ${r.name || r.email}, ${rol} de ${r.clubName}`;
    const text = [`${r.name || 'Alguien'} (${r.email}) pide entrar en Lliga Catalana como ${rol} de ${r.clubName}.`,
      ficha ? `Dice ser: ${ficha}.` : '', r.msg ? `Mensaje: «${r.msg}»` : '',
      r.clubId === CLUB.id ? `Para validarla: Gestión deportiva → Configuración → Solicitudes de acceso${r.role === 'jugador' ? ', o Gestión → Plantilla si eres capitán' : ''}.\n${link}` : 'Este club aún no está activo en Lliga Catalana: la solicitud queda registrada para darlo de alta.',
      'Si no conoces a esta persona, rechaza la solicitud: no tendrá acceso a ningún dato.'].filter(Boolean).join('\n\n');
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#13241e;max-width:560px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6b7a73">Lliga Catalana · ${esc(r.clubName)}</p>
      <h2 style="margin:0 0 12px;font-size:20px">Solicitud de acceso como ${esc(rol)}</h2>
      <p style="margin:0 0 8px"><b>${esc(r.name || 'Sin nombre')}</b> · ${esc(r.email)}</p>
      ${ficha ? `<p style="margin:0 0 8px">Dice ser <b>${esc(ficha)}</b>.</p>` : ''}
      ${r.msg ? `<p style="margin:0 0 8px;color:#41534c">«${esc(r.msg)}»</p>` : ''}
      ${r.clubId === CLUB.id ? `<p style="margin:16px 0"><a href="${esc(link)}" style="background:#0F3B2E;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:bold">Revisar la solicitud</a></p>
      <p style="margin:0;color:#6b7a73;font-size:13px">Gestión deportiva → Configuración → Solicitudes de acceso${r.role === 'jugador' ? ' (los capitanes también la ven en Gestión → Plantilla)' : ''}.</p>`
        : `<p style="margin:12px 0 0;color:#41534c">Este club aún no está activo en Lliga Catalana: la solicitud queda registrada para darlo de alta.</p>`}
      <p style="margin:16px 0 0;color:#6b7a73;font-size:13px">Si no conoces a esta persona, rechaza la solicitud: no tendrá acceso a ningún dato.</p></div>`;
    const out = await require('./_mail.js').sendMail({ to, replyTo: r.email, subject, text, html });
    await ref.update({ notifiedAt: Date.now(), notifiedTo: to, notifiedWho: who });
    return res.status(200).json({ ok: true, to: to.length, who, provider: out.provider });
  } catch (e) {
    return res.status(e.status || (e.code && String(e.code).startsWith('auth/') ? 401 : 500)).json({ error: e.message || 'error' });
  }
};
module.exports._test = { recipients };
