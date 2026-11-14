// Entrega de avisos a jugadores por los canales que de verdad existen hoy:
//   1. Notificación push (Firebase Cloud Messaging) a quien la tiene activada.
//   2. Correo, como respaldo, a quien no la tiene (si el equipo lo permite y el correo está configurado en Vercel).
// WhatsApp no se envía desde aquí: no hay integración oficial con los grupos de los equipos (ver docs/WHATSAPP.md).
// El capitán comparte en su grupo los mensajes que prepara la app; cuando haya WhatsApp Business Platform,
// será un tercer canal en esta misma función, sin tocar el resto.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BAD = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument'];

// doc(path) devuelve la referencia real (traduce la ruta del club). pids: fichas destino.
async function pushTo(A, doc, pids, data) {
  const tokens = [], owner = {};
  const docs = await Promise.all(pids.map(p => doc('pushTokens/' + p).get()));
  docs.forEach((d, i) => (d.exists ? d.data().tokens || [] : []).forEach(t => { tokens.push(t); owner[t] = pids[i]; }));
  const bad = [], ok = new Set();
  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    const r = await A.messaging().sendEachForMulticast({ tokens: chunk, data, webpush: { headers: { Urgency: 'high', TTL: '86400' } } });
    r.responses.forEach((x, n) => { if (x.success) ok.add(owner[chunk[n]]); else if (BAD.includes(x.error && x.error.code)) bad.push(chunk[n]); });
  }
  await Promise.all(bad.map(t => doc('pushTokens/' + owner[t]).update({ tokens: A.firestore.FieldValue.arrayRemove(t) }).catch(() => {})));
  return ok;
}

// Correo del jugador: el de la cuenta con la que vinculó su ficha (claims/<pid>.email)
async function emailsOf(doc, pids) {
  const out = {};
  const snaps = await Promise.all(pids.map(p => doc('claims/' + p).get().catch(() => null)));
  snaps.forEach((s, i) => { const e = s && s.exists && String(s.data().email || '').toLowerCase(); if (e && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) out[pids[i]] = e; });
  return out;
}

function mailHtml({ title, lines, cta, url, team, color }) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#13241e;max-width:520px">
    <div style="height:6px;background:${color || '#0B3D2E'};border-radius:3px;margin-bottom:16px"></div>
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6b7a73">${esc(team)} · Lliga Catalana</p>
    <h2 style="margin:0 0 10px;font-size:21px">${esc(title)}</h2>
    ${lines.map(l => `<p style="margin:0 0 8px">${esc(l)}</p>`).join('')}
    <p style="margin:18px 0"><a href="${esc(url)}" style="background:${color || '#0B3D2E'};color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold">${esc(cta)}</a></p>
    <p style="margin:0;color:#6b7a73;font-size:12px">Te llega por correo porque no tienes activadas las notificaciones de la app. Actívalas en «Yo» y dejarás de recibir estos correos.</p></div>`;
}

// msg = { title, body, url (absoluta), tag, cta, lines? }   opts = { email: bool, team, color, names: {pid: nombre} }
async function deliver(A, doc, pids, msg, opts = {}) {
  pids = [...new Set(pids.filter(Boolean))];
  const res = { recipients: pids.length, push: 0, email: 0, none: 0, failed: [] };
  if (!pids.length) return res;
  const reached = await pushTo(A, doc, pids, { title: msg.title, body: msg.body, url: msg.url, tag: msg.tag || 'aviso' }).catch(() => new Set());
  res.push = reached.size;
  const rest = pids.filter(p => !reached.has(p));
  const mail = require('./_mail.js');
  if (opts.email && rest.length && mail.via()) {
    const em = await emailsOf(doc, rest);
    for (const p of rest) {
      if (!em[p]) { res.none++; continue; }
      const first = String((opts.names || {})[p] || '').split(' ')[0];
      try {
        await mail.sendMail({ to: [em[p]], fromName: (opts.team || 'Lliga Catalana') + ' · Lliga Catalana', subject: msg.title,
          text: [first ? `Hola ${first},` : 'Hola,', '', msg.body, ...(msg.lines || []), '', msg.url].join('\n'),
          html: mailHtml({ title: msg.title, lines: [first ? `Hola ${first},` : 'Hola,', msg.body, ...(msg.lines || [])], cta: msg.cta || 'Abrir en la app', url: msg.url, team: opts.team || 'Lliga Catalana', color: opts.color }) });
        res.email++;
      } catch (e) { res.failed.push(p); }
    }
  } else res.none = rest.length;
  return res;
}

module.exports = { deliver, pushTo, emailsOf };
