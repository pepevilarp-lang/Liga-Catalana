// Webhook de WhatsApp Business Platform: Meta avisa aquí cuando un jugador pulsa «Puedo» o «No puedo» en el aviso de
// disponibilidad. Se comprueba la firma de Meta y la del botón, y que el número sea el del jugador; se guarda como su
// disponibilidad (lo mismo que si la marcara en la app) y se le confirma por WhatsApp.
// Vercel: WA_VERIFY_TOKEN (para dar de alta el webhook en Meta), WA_APP_SECRET, WA_TOKEN, WA_PHONE_ID, FIREBASE_SERVICE_ACCOUNT.
const W = require('./_wa.js');
const { getAdmin, clubDbFor } = require('./_auth.js');

const rawBody = req => new Promise((ok, ko) => { const ch = []; req.on('data', c => ch.push(c)); req.on('end', () => ok(Buffer.concat(ch))); req.on('error', ko); });

module.exports = async (req, res) => {
  // Alta del webhook en Meta: devuelve el «challenge» si el token coincide
  if (req.method === 'GET') {
    const q = req.query || {};
    if (q['hub.mode'] === 'subscribe' && process.env.WA_VERIFY_TOKEN && q['hub.verify_token'] === process.env.WA_VERIFY_TOKEN) return res.status(200).send(String(q['hub.challenge'] || ''));
    return res.status(403).send('forbidden');
  }
  if (req.method !== 'POST') return res.status(405).end();
  let raw;
  // Cuerpo tal cual llega (la firma se calcula sobre él): no se toca req.body, que Vercel analizaría y consumiría
  try { raw = await rawBody(req); } catch (e) { return res.status(400).end(); }
  if (!W.validSignature(raw, req.headers['x-hub-signature-256'])) return res.status(401).end();
  let body; try { body = JSON.parse(raw.toString('utf8') || '{}'); } catch (e) { return res.status(400).end(); }
  const msgs = [];
  for (const e of body.entry || []) for (const c of e.changes || []) for (const m of ((c.value || {}).messages || [])) msgs.push(m);
  if (!msgs.length) return res.status(200).json({ ok: true });   // estados de entrega, etc.
  const A = getAdmin(), db = A.firestore();
  for (const m of msgs) {
    const payload = (m.button && m.button.payload) || (m.interactive && m.interactive.button_reply && m.interactive.button_reply.id) || '';
    const p = W.parsePayload(payload); if (!p) continue;
    try {
      const cdb = await clubDbFor(db, p.club || undefined);
      const ph = (await cdb.doc('phones/' + p.pid).get()).data() || {};
      if (!ph.wa || W.e164(ph.phone) !== String(m.from || '')) continue;   // el botón solo vale desde el móvil del propio jugador
      const ref = cdb.doc('seasons/' + p.sid + '/avail/' + p.pid), cur = (await ref.get()).data() || {}, k = 'j' + p.j;
      // Idempotente: Meta puede repetir el mismo aviso; si ya está guardado igual, no se toca
      if ((cur.j || {})[k] !== p.v) await ref.set({ j: { ...(cur.j || {}), [k]: p.v }, at: Date.now(), via: 'whatsapp' }, { merge: true });
      await W.sendText(m.from, p.v === 'yes' ? `✅ Anotado: puedes jugar la jornada ${p.j}. Si cambia algo, lo puedes cambiar en la app.` : `Anotado: no puedes jugar la jornada ${p.j}. Gracias por avisar.`).catch(() => {});
    } catch (e) { /* se registra en los logs de Vercel; Meta reintentará */ }
  }
  return res.status(200).json({ ok: true });
};
