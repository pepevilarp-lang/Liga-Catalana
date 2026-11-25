// Envía el resumen del fin de semana por correo. Solo pueden usarlo gestores del club y administradores,
// y solo a destinatarios autorizados (los gestores configurados en la app, o uno mismo).
// Configuración en Vercel (una de las dos):
//   Gmail:  SMTP_USER (la dirección de Gmail) y SMTP_PASS (contraseña de aplicación de 16 letras)
//           opcional: SMTP_HOST (por defecto smtp.gmail.com), SMTP_PORT (465), MAIL_FROM_NAME
//   Resend: RESEND_API_KEY y MAIL_FROM (dirección de un dominio verificado en Resend)
// Además: FIREBASE_PROJECT_ID (el mismo que usa la lectura con IA).
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const { via, sendMail } = require('./_mail');
const fsBase = () => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(process.env.FIREBASE_PROJECT_ID || '')}/databases/(default)/documents/`;
function tokenEmail(token) {
  try { const p = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')); return String(p.email || '').toLowerCase(); }
  catch (e) { return ''; }
}
async function authorize(token) {
  // Con la cuenta de servicio: gestores del club (lista o miembros con rol gestor, activos) y administradores (api/_auth.js)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const ctx = await require('./_auth.js').caller({ headers: { authorization: 'Bearer ' + token } });
    if (!ctx.isStaff) throw Object.assign(new Error('Solo gestores del club y administradores'), { status: 403 });
    return { email: ctx.email, allowed: new Set([...(ctx.meta.managerEmails || []), ctx.email]) };
  }
  if (!process.env.FIREBASE_PROJECT_ID) throw Object.assign(new Error('Falta FIREBASE_PROJECT_ID en Vercel'), { status: 501 });
  if (!token) throw Object.assign(new Error('Falta la sesión'), { status: 401 });
  const h = { headers: { Authorization: 'Bearer ' + token } };
  // Firestore solo responde si el token es válido para este proyecto; las reglas deciden qué puede leer
  const r = await fetch(fsBase() + 'meta/app', h);
  if (r.status === 401) throw Object.assign(new Error('Sesión no válida: vuelve a entrar'), { status: 401 });
  if (r.status !== 200 && r.status !== 404) throw Object.assign(new Error('Solo gestores del club'), { status: 403 });
  const meta = r.status === 200 ? await r.json() : {};
  const managers = ((((meta.fields || {}).managerEmails || {}).arrayValue || {}).values || []).map(v => String(v.stringValue || '').toLowerCase());
  const email = tokenEmail(token);
  if (!email) throw Object.assign(new Error('Sesión sin correo'), { status: 401 });
  let admin = false;
  const a = await fetch(fsBase() + 'admins/' + encodeURIComponent(email), h);
  if (a.status === 200) admin = true;
  if (!admin && !managers.includes(email)) throw Object.assign(new Error('Solo gestores del club y administradores'), { status: 403 });
  return { email, allowed: new Set([...managers, email]) };
}
module.exports = async (req, res) => {
  const v = via();
  if (req.method === 'GET') return res.status(200).json({ configured: !!v && !!process.env.FIREBASE_PROJECT_ID, via: v ? v.name : null, from: v ? v.from : null });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    if (!v) throw Object.assign(new Error('El envío de correo no está configurado en Vercel'), { status: 501 });
    const { email, allowed } = await authorize(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const to = [...new Set((Array.isArray(body.to) ? body.to : []).map(x => String(x).trim().toLowerCase()))].filter(x => EMAIL.test(x));
    if (!to.length) throw Object.assign(new Error('Sin destinatarios'), { status: 400 });
    const bad = to.filter(x => !allowed.has(x));
    if (bad.length) throw Object.assign(new Error('Destinatario no autorizado: ' + bad.join(', ') + '. Añádelo como gestor en Configuración.'), { status: 403 });
    if (to.length > 10) throw Object.assign(new Error('Máximo 10 destinatarios'), { status: 400 });
    // Adjuntos: solo PDF, como máximo 2 y unos 3,5 MB en total (límite de Vercel en la petición)
    const atts = (Array.isArray(body.attachments) ? body.attachments : []).slice(0, 2).map(a => ({ filename: String(a.filename || 'informe.pdf').replace(/[^\w.\-]+/g, '_').slice(0, 120), content: String(a.content || ''), contentType: 'application/pdf' }));
    if (atts.some(a => !/\.pdf$/i.test(a.filename) || !/^[A-Za-z0-9+/=]+$/.test(a.content) || !a.content.startsWith('JVBER'))) throw Object.assign(new Error('Adjunto no válido: solo se admiten PDF'), { status: 400 });
    if (atts.reduce((n, a) => n + a.content.length, 0) > 3.6e6) throw Object.assign(new Error('El PDF adjunto es demasiado grande'), { status: 413 });
    const mail = { attachments: atts, to, replyTo: email, subject: String(body.subject || 'Resumen del fin de semana').slice(0, 200), html: String(body.html || '').slice(0, 400000), text: String(body.text || '').slice(0, 100000) };
    const { id } = await sendMail(mail);
    return res.status(200).json({ ok: true, provider: v.name, id, to, attachments: atts.map(a => a.filename) });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'error' });
  }
};
