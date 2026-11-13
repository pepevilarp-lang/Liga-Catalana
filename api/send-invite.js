// Envía (o reenvía) por correo una invitación individual: Gestión deportiva → Usuarios, o Plantilla del capitán.
// El correo sale con el nombre y los colores del club. Al enviarla, la invitación queda ligada a ese correo:
// solo podrá usarla una cuenta de Google con esa dirección (lo comprueban las reglas: invites/<código>.email).
// Puede hacerlo la gestión del club o, para invitaciones de jugador, el capitán de ese equipo.
// Necesita en Vercel: FIREBASE_SERVICE_ACCOUNT y el correo (SMTP_* o RESEND_*).
const { caller, teamRole, audit, httpErr, sendErr } = require('./_auth.js');
const isMail = s => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || ''));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MAX_SENDS = 5;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(501).json({ error: 'Falta FIREBASE_SERVICE_ACCOUNT en Vercel' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const code = String(body.code || '').toUpperCase(), to = String(body.email || '').trim().toLowerCase();
    if (!/^[A-Z0-9]{6,40}$/.test(code)) throw httpErr(400, 'Código no válido');
    if (!isMail(to)) throw httpErr(400, 'Correo no válido');
    if (!require('./_mail.js').via()) throw httpErr(501, 'El envío de correo no está configurado en Vercel');
    const ctx = await caller(req), ref = ctx.db.doc(ctx.P('invites/' + code)), snap = await ref.get();
    if (!snap.exists) throw httpErr(404, 'La invitación no existe');
    const I = snap.data();
    // Permiso: gestión del club, o el capitán del equipo para invitaciones de jugador
    let ok = ctx.isStaff;
    if (!ok && I.role !== 'gestor' && I.season) {
      const s = await ctx.db.doc(ctx.P('seasons/' + I.season)).get();
      ok = s.exists && teamRole(ctx, s.data()).canPrivate;
    }
    if (!ok) throw httpErr(403, 'Solo la gestión del club o el capitán de ese equipo');
    if (I.usedBy) throw httpErr(409, 'Esta invitación ya se ha usado');
    if (I.revoked) throw httpErr(409, 'Esta invitación está revocada');
    if ((I.exp || 0) < Date.now()) throw httpErr(409, 'Esta invitación ha caducado: crea una nueva');
    if (I.email && I.email !== to) throw httpErr(409, 'Esta invitación es para ' + I.email + '. Revócala y crea otra para el nuevo correo.');
    if ((I.sends || 0) >= MAX_SENDS) throw httpErr(429, 'Ya se ha enviado ' + MAX_SENDS + ' veces: copia el enlace y envíalo tú');

    const R = require('./_report.js'), idn = await R.clubIdentity(ctx.cdb);
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const link = (process.env.APP_URL || ('https://' + host)) + '/#invitacion-' + code + (ctx.cfg && ctx.cfg.generic ? '.' + ctx.clubId : '');
    const rol = I.role === 'gestor' ? 'gestor deportivo' : I.role === 'capitan' ? 'capitán' : 'jugador';
    const who = I.role === 'gestor' ? '' : I.name ? `como <b>${esc(I.name)}</b>${I.teamName ? ', ' + esc(I.teamName) : ''}` : '';
    const days = Math.max(1, Math.round((I.exp - Date.now()) / 864e5));
    const subject = `${idn.medium}: tu acceso a Lliga Catalana`;
    const text = [`${I.byName || 'El club'} te invita a entrar en Lliga Catalana como ${rol} de ${idn.name}${I.name && I.role !== 'gestor' ? ' (' + I.name + (I.teamName ? ', ' + I.teamName : '') + ')' : ''}.`,
      '', 'Abre este enlace y entra con tu cuenta de Google de esta dirección (' + to + '):', link, '',
      `La invitación es personal, de un solo uso y caduca en ${days} días.`, 'Si no esperabas este correo, ignóralo: sin la invitación nadie puede entrar en tu nombre.'].join('\n');
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#13241e;max-width:560px">
      <div style="height:6px;background:${idn.primary};border-radius:3px;margin-bottom:18px"></div>
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${idn.secondary}">${esc(idn.name)} · Lliga Catalana</p>
      <h2 style="margin:0 0 12px;font-size:22px">Tu acceso como ${esc(rol)}</h2>
      <p style="margin:0 0 8px">${esc(I.byName || 'El club')} te invita a entrar en la app del club ${who}.</p>
      <p style="margin:20px 0"><a href="${esc(link)}" style="background:${idn.primary};color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold">Aceptar la invitación</a></p>
      <p style="margin:0 0 6px;color:#41534c;font-size:14px">Entra con tu cuenta de Google de <b>${esc(to)}</b>. La invitación es personal, de un solo uso y caduca en ${days} días.</p>
      <p style="margin:16px 0 0;color:#6b7a73;font-size:13px">Si no esperabas este correo, ignóralo: sin la invitación nadie puede entrar en tu nombre.</p></div>`;
    const out = await require('./_mail.js').sendMail({ to: [to], fromName: idn.medium + ' · Lliga Catalana', replyTo: isMail(ctx.email) ? ctx.email : undefined, subject, text, html });
    await ref.update({ email: to, sentTo: to, sentAt: Date.now(), sends: (I.sends || 0) + 1 });
    await audit(ctx, (I.sends ? 'invitacion-reenviada' : 'invitacion-enviada'), { code, pid: I.pid || null, team: I.team || null, role: I.role || 'jugador', email: to });
    return res.status(200).json({ ok: true, provider: out.provider, sends: (I.sends || 0) + 1 });
  } catch (e) {
    return sendErr(res, e);
  }
};
