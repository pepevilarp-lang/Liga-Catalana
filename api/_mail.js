// Envío de correo compartido por las funciones (resumen manual, informe automático y avisos de la FCT).
// Configuración en Vercel (una de las dos):
//   Gmail:  SMTP_USER (la dirección de Gmail) y SMTP_PASS (contraseña de aplicación de 16 letras)
//           opcional: SMTP_HOST (por defecto smtp.gmail.com), SMTP_PORT (465), MAIL_FROM_NAME
//   Resend: RESEND_API_KEY y MAIL_FROM (dirección de un dominio verificado en Resend)
function via() {
  if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) return { name: 'resend', from: process.env.MAIL_FROM };
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return { name: 'smtp', from: process.env.SMTP_USER };
  return null;
}
async function sendResend(v, mail) {
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.RESEND_API_KEY },
    body: JSON.stringify({ from: mail.fromName && !/[<>"]/.test(mail.fromName) && !/</.test(v.from) ? `"${mail.fromName}" <${v.from}>` : v.from, to: mail.to, reply_to: mail.replyTo, subject: mail.subject, html: mail.html, text: mail.text,
      attachments: mail.attachments.map(a => ({ filename: a.filename, content: a.content })) }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.id) throw Object.assign(new Error('El servicio de correo no confirmó el envío: ' + (j.message || r.status)), { status: 502 });
  return j.id;
}
async function sendSmtp(v, mail) {
  const nodemailer = require('nodemailer');
  const t = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: +process.env.SMTP_PORT || 465, secure: (+process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  const info = await t.sendMail({ from: `"${String(mail.fromName || process.env.MAIL_FROM_NAME || (require('../club-config.js').medium + ', gestión deportiva')).replace(/["<>]/g, '')}" <${v.from}>`, to: mail.to.join(', '), replyTo: mail.replyTo, subject: mail.subject, html: mail.html, text: mail.text,
    attachments: mail.attachments.map(a => ({ filename: a.filename, content: Buffer.from(a.content, 'base64'), contentType: a.contentType })) });
  const ok = (info.accepted || []).map(x => String(x).toLowerCase());
  if (!mail.to.every(x => ok.includes(x))) throw Object.assign(new Error('El servidor de correo no aceptó a: ' + mail.to.filter(x => !ok.includes(x)).join(', ')), { status: 502 });
  return info.messageId || '';
}
// mail = { to: [..], fromName (nombre del remitente, opcional), replyTo, subject, html, text, attachments: [{ filename, content (base64), contentType }] }
async function sendMail(mail) {
  const v = via(); if (!v) throw Object.assign(new Error('El envío de correo no está configurado en Vercel'), { status: 501 });
  mail = { attachments: [], ...mail };
  const id = v.name === 'resend' ? await sendResend(v, mail) : await sendSmtp(v, mail);
  return { provider: v.name, id };
}
module.exports = { via, sendMail };
