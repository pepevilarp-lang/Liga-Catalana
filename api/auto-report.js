// Informe semanal generado en el servidor: botón «Enviar ahora» de Gestión deportiva → Configuración.
// El envío automático del domingo lo hace la tarea nocturna (api/fct-sync.js) con el mismo código (api/_report.js).
// Solo gestores del club y administradores. Necesita en Vercel: FIREBASE_SERVICE_ACCOUNT y el correo (SMTP_* o RESEND_*).
const admin = require('firebase-admin');
function getAdmin() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return admin;
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(501).json({ error: 'Falta FIREBASE_SERVICE_ACCOUNT en Vercel' });
  try {
    const A = getAdmin(), db = A.firestore();
    const user = await A.auth().verifyIdToken(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    const email = String(user.email || '').toLowerCase();
    const [a1, a2, m] = await Promise.all([db.doc('admins/' + user.uid).get(), db.doc('admins/' + email).get(), db.doc('meta/app').get()]);
    const meta = m.data() || {};
    if (!(a1.exists || a2.exists || (meta.managerEmails || []).includes(email))) return res.status(403).json({ error: 'Solo gestores del club y administradores' });
    if (!require('./_mail.js').via()) return res.status(501).json({ error: 'El envío de correo no está configurado en Vercel' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const R = require('./_report.js');
    const sat = /^\d{4}-\d{2}-\d{2}$/.test(body.sat || '') ? body.sat : R.ymd(R.weekendSat());
    const allowed = new Set([...(meta.managerEmails || []), email]);
    const to = Array.isArray(body.to) && body.to.length ? body.to.map(x => String(x).toLowerCase()).filter(x => allowed.has(x)) : null;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const out = await R.sendWeekly(db, { meta, sat, to, by: email, appUrl: process.env.APP_URL || ('https://' + host) });
    return res.status(200).json(out);
  } catch (e) {
    return res.status(e.status || (e.code && String(e.code).startsWith('auth/') ? 401 : 500)).json({ error: e.message || 'error' });
  }
};
