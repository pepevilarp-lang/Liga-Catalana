// WhatsApp Business Platform (Cloud API de Meta): avisos 1 a 1 con plantillas aprobadas y respuesta de disponibilidad
// con botones «Puedo / No puedo». Solo a quien lo ha aceptado en «Yo» (phones/<pid>.wa = true).
// No hace nada hasta que estén en Vercel: WA_TOKEN y WA_PHONE_ID (y, para recibir las respuestas, WA_APP_SECRET y
// WA_VERIFY_TOKEN). Plantillas (nombres por defecto, se pueden cambiar con variables): ver docs/WHATSAPP.md.
const crypto = require('crypto');
const GRAPH = 'https://graph.facebook.com/v21.0';
const env = k => String(process.env[k] || '').trim();
const configured = () => !!(env('WA_TOKEN') && env('WA_PHONE_ID'));
const LANG = () => env('WA_LANG') || 'es';
const TPL = { aviso: () => env('WA_TPL_AVISO') || 'aviso_equipo', dispo: () => env('WA_TPL_DISPO') || 'disponibilidad' };

// +34 600 00 00 00 / 600000000 / 0034… → 34600000000 (sin «+», como lo pide la API)
function e164(phone) {
  let d = String(phone || '').replace(/[^\d+]/g, ''); if (!d) return '';
  if (d.startsWith('+')) d = d.slice(1); else if (d.startsWith('00')) d = d.slice(2); else if (/^[6789]\d{8}$/.test(d)) d = '34' + d;
  return /^\d{10,15}$/.test(d) ? d : '';
}
// Firma corta de los botones: que nadie pueda inventarse una respuesta para otro jugador
function key() { return crypto.createHash('sha256').update('lliga-wa:' + (JSON.parse(env('FIREBASE_SERVICE_ACCOUNT') || '{}').private_key || env('WA_APP_SECRET'))).digest(); }
const sig = s => crypto.createHmac('sha256', key()).update(s).digest('base64url').slice(0, 10);
const availPayload = (club, sid, j, pid, v) => { const b = ['av', club || '', sid, j, pid, v].join('|'); return b + '|' + sig(b); };
function parsePayload(p) {
  const parts = String(p || '').split('|'); if (parts.length !== 7 || parts[0] !== 'av') return null;
  const [, club, sid, j, pid, v, s] = parts; if (sig(parts.slice(0, 6).join('|')) !== s || !['yes', 'no'].includes(v)) return null;
  return { club, sid, j: +j, pid, v };
}

async function call(body) {
  const r = await fetch(`${GRAPH}/${env('WA_PHONE_ID')}/messages`, { method: 'POST', headers: { Authorization: 'Bearer ' + env('WA_TOKEN'), 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', ...body }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error((j.error && j.error.message) || 'WhatsApp ' + r.status); return j;
}
const clip = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
// Aviso general: «{{1}}» título, «{{2}}» texto; botón «Abrir en la app» con la ruta de la app como parámetro
function sendAviso(to, { title, body, url }) {
  const path = String(url || '').replace(/^https?:\/\/[^/]+\/?/, '') || '#';
  return call({ to, type: 'template', template: { name: TPL.aviso(), language: { code: LANG() }, components: [
    { type: 'body', parameters: [{ type: 'text', text: clip(title, 60) }, { type: 'text', text: clip(body, 500) }] },
    { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: path }] }] } });
}
// Disponibilidad: «{{1}}» equipo, «{{2}}» jornada y rival; botones de respuesta rápida «Puedo» / «No puedo»
function sendDispo(to, { team, text }, payload) {
  return call({ to, type: 'template', template: { name: TPL.dispo(), language: { code: LANG() }, components: [
    { type: 'body', parameters: [{ type: 'text', text: clip(team, 40) }, { type: 'text', text: clip(text, 300) }] },
    { type: 'button', sub_type: 'quick_reply', index: '0', parameters: [{ type: 'payload', payload: payload('yes') }] },
    { type: 'button', sub_type: 'quick_reply', index: '1', parameters: [{ type: 'payload', payload: payload('no') }] }] } });
}
// Dentro de las 24 h siguientes a una respuesta del jugador se le puede contestar con texto libre (gratis)
const sendText = (to, text) => call({ to, type: 'text', text: { body: clip(text, 1000) } });
// Firma de Meta en el webhook (X-Hub-Signature-256 = sha256=HMAC(app secret, cuerpo))
function validSignature(raw, header) {
  const secret = env('WA_APP_SECRET'); if (!secret || !header) return false;
  const exp = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
  return exp.length === String(header).length && crypto.timingSafeEqual(Buffer.from(exp), Buffer.from(String(header)));
}

module.exports = { configured, e164, availPayload, parsePayload, sendAviso, sendDispo, sendText, validSignature };
