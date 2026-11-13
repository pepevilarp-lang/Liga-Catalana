// Informe semanal generado en el servidor: botón «Enviar ahora» de Gestión deportiva → Configuración.
// El envío automático del domingo lo hace la tarea nocturna (api/fct-sync.js) con el mismo código (api/_report.js).
// Solo gestores del club y administradores. Necesita en Vercel: FIREBASE_SERVICE_ACCOUNT y el correo (SMTP_* o RESEND_*).
const { caller, sendErr } = require('./_auth.js');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(501).json({ error: 'Falta FIREBASE_SERVICE_ACCOUNT en Vercel' });
  try {
    const ctx = await caller(req), db = ctx.cdb, email = ctx.email, meta = ctx.meta;
    if (!ctx.isStaff) return res.status(403).json({ error: 'Solo gestores del club y administradores' });
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
    return sendErr(res, e);
  }
};
