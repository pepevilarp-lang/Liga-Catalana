// «Mi presentación»: vídeo de salida a pista generado con la API oficial de Higgsfield a partir de una foto del jugador.
// Todo pasa por aquí (el navegador nunca ve la clave ni escribe en la colección):
//   GET                         → ¿está configurado? (sin datos sensibles)
//   POST {action:'list'}        → presentaciones del equipo (metadatos y miniatura; el vídeo va aparte)
//   POST {action:'create'}      → foto 9:16 en JPEG + consentimiento → trabajo en Higgsfield
//   POST {action:'status'}      → consulta el estado del trabajo propio y, al terminar, guarda el vídeo
//   POST {action:'chunk'}       → un trozo del vídeo (binario), para reproducirlo en la app
//   POST {action:'delete'}      → borra el vídeo (el propio jugador o un administrador)
//   POST ?hook=1                → webhook de Higgsfield (firma Standard Webhooks) → guarda el vídeo sin esperar al navegador
//
// Variables de entorno en Vercel:
//   HF_API_KEY_ID, HF_API_KEY_SECRET   clave de la API de Higgsfield (console.higgsfield.ai). Obligatorias.
//   FIREBASE_SERVICE_ACCOUNT           JSON de la cuenta de servicio (ya se usa para las notificaciones). Obligatoria.
//   HF_WEBHOOK_SECRET                  opcional: secreto de firma de webhooks (Higgsfield Console > Settings, empieza por whsec_)
//   HF_VIDEO_ENDPOINT                  opcional: modelo. Por defecto /kling-video/v2.5-turbo/pro/image-to-video
//   PRESENTATION_MONTHLY_LIMIT         opcional: vídeos por jugador y mes (por defecto 2)
//   PRESENTATION_GLOBAL_MONTHLY_LIMIT  opcional: vídeos de todo el club por mes (por defecto 25)
//
// API verificada en docs.higgsfield.ai (nov. 2026): base https://api.higgsfield.ai, cabecera "Authorization: Key id:secret",
// subida con POST /files/generate-upload-url + PUT firmado, petición asíncrona con request_id/status_url,
// estados queued, in_progress, completed, failed, nsfw, canceled; vídeo en video.url; datos borrables con DELETE /requests/{id}.
const crypto = require('crypto');

const HF = 'https://api.higgsfield.ai';
const ENDPOINT = process.env.HF_VIDEO_ENDPOINT || '/kling-video/v2.5-turbo/pro/image-to-video';
const PER_PLAYER = Math.max(1, +process.env.PRESENTATION_MONTHLY_LIMIT || 2);
const GLOBAL = Math.max(1, +process.env.PRESENTATION_GLOBAL_MONTHLY_LIMIT || 25);
const CHUNK = 900 * 1024;               // bytes por documento (límite de Firestore: 1 MiB)
const MAX_VIDEO = 24 * 1024 * 1024;
const CONSENT_V = 1;                     // versión del texto de consentimiento que muestra la app

const PROMPT = 'Cinematic tennis walk-out. The same person from the photo, keeping exactly the same face, facial features, hairstyle and skin tone for the whole shot, ' +
  'now wearing a premium professional tennis outfit and holding a tennis racket in one hand, walks confidently toward the camera through the players\' entrance onto a professional tennis court, ' +
  'like a Davis Cup team presentation. The camera dollies slowly backward as the player advances, framing the full body. Halfway through, the player briefly looks into the camera with a calm, focused expression. ' +
  'Dramatic stadium lighting with soft rim light, blurred crowd in the stands, light haze in the air, shallow depth of field. ' +
  'Realistic body proportions, natural walking motion, photorealistic, premium sports broadcast look.';
const NEGATIVE = 'cartoon, animation, avatar, CGI, 3d render, plastic skin, face morphing, different person, distorted face, deformed hands, extra fingers, extra limbs, two rackets, text, captions, watermark, logo, low quality, blurry face';

// Solo campos documentados para cada familia de modelos
function payload(imageUrl) {
  if (/minimax\/hailuo/.test(ENDPOINT)) return { prompt: PROMPT, image_url: imageUrl, duration: 6, prompt_optimizer: false };
  return { prompt: PROMPT, image_url: imageUrl, duration: 5, cfg_scale: 0.6, negative_prompt: NEGATIVE };
}
const configured = () => !!(process.env.HF_API_KEY_ID && process.env.HF_API_KEY_SECRET && process.env.FIREBASE_SERVICE_ACCOUNT);
const hfAuth = () => 'Key ' + process.env.HF_API_KEY_ID + ':' + process.env.HF_API_KEY_SECRET;
const err = (status, message, code) => Object.assign(new Error(message), { status, code });
const month = () => new Date().toISOString().slice(0, 7);

let admin = null;
function getAdmin() {
  admin = admin || require('firebase-admin');
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return admin;
}

async function who(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw err(401, 'Falta la sesión');
  const A = getAdmin(), db = A.firestore();
  let user; try { user = await A.auth().verifyIdToken(token); } catch (e) { throw err(401, 'Sesión no válida: vuelve a entrar'); }
  const email = String(user.email || '').toLowerCase();
  const [u, a1, a2, meta] = await Promise.all([db.doc('users/' + user.uid).get(), db.doc('admins/' + user.uid).get(), db.doc('admins/' + email).get(), db.doc('meta/app').get()]);
  const isAdmin = a1.exists || a2.exists;
  const isMgr = meta.exists && (meta.data().managerEmails || []).includes(email);
  if (!u.exists && !isAdmin && !isMgr) throw err(403, 'Solo miembros del equipo');
  return { db, A, email, isAdmin, pid: u.exists ? u.data().pid : null };
}

// Lo que ve la app de cada presentación (nunca la URL de Higgsfield ni el prompt)
function view(d, own) {
  if (!d) return null;
  const o = { status: d.status || null, error: d.error || null, poster: d.poster || null, at: d.updatedAt || null,
    video: d.video ? { gen: d.video.gen, chunks: d.video.chunks, mime: d.video.mime, size: d.video.size, at: d.video.at, poster: d.video.poster || null } : null };
  if (own) o.startedAt = d.startedAt || null;
  return o;
}
async function usage(db, pid) {
  const s = await db.doc('presentationUsage/' + month()).get(); const u = s.exists ? s.data() : {};
  const mine = (u.byPid || {})[pid] || 0;
  return { used: mine, limit: PER_PLAYER, left: Math.max(0, Math.min(PER_PLAYER - mine, GLOBAL - (u.n || 0))) };
}

// Dimensiones de un JPEG (marcadores SOF), sin dependencias
function jpegSize(b) {
  if (b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}

async function hfJson(url, opts, what) {
  const r = await fetch(url, opts);
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : {}; } catch (e) { }
  if (!r.ok) {
    if (r.status === 401 || r.status === 403) throw err(502, 'Higgsfield ha rechazado la clave de API (revisa HF_API_KEY_ID y HF_API_KEY_SECRET en Vercel)');
    if (r.status === 402) throw err(502, 'La cuenta de Higgsfield no tiene créditos suficientes');
    if (r.status === 429) throw err(503, 'Higgsfield está saturado ahora mismo. Prueba en unos minutos');
    throw err(502, 'Higgsfield (' + what + ', ' + r.status + '): ' + String((j && (j.detail || j.error || j.message)) || t).slice(0, 200));
  }
  return j || {};
}

async function uploadImage(buf) {
  const up = await hfJson(HF + '/files/generate-upload-url', { method: 'POST', headers: { Authorization: hfAuth(), 'Content-Type': 'application/json' }, body: JSON.stringify({ content_type: 'image/jpeg' }) }, 'subida');
  if (!up.upload_url || !up.public_url) throw err(502, 'Higgsfield no ha devuelto la dirección de subida');
  // Las credenciales de Higgsfield NO se envían a la URL firmada de almacenamiento
  const put = await fetch(up.upload_url, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg', ...(up.upload_headers || {}) }, body: buf });
  if (!put.ok) throw err(502, 'No se ha podido subir la foto a Higgsfield (' + put.status + ')');
  return up.public_url;
}

// Avanza un trabajo: consulta el estado en Higgsfield y, si ha terminado, guarda el vídeo en Firestore.
async function advance(db, A, ref) {
  const snap = await ref.get(); const d = snap.exists ? snap.data() : null;
  if (!d || !d.job || !['pending', 'generating'].includes(d.status)) return d;
  const job = d.job;
  const st = await hfJson(job.statusUrl, { headers: { Authorization: hfAuth() } }, 'estado');
  const s = st.status;
  if (s === 'queued' || s === 'in_progress') {
    const ns = s === 'queued' ? 'pending' : 'generating';
    if (ns !== d.status) await ref.update({ status: ns, updatedAt: Date.now() });
    return { ...d, status: ns };
  }
  if (s === 'failed' || s === 'nsfw' || s === 'canceled') {
    const msg = s === 'nsfw' ? 'La foto o el vídeo no han pasado el filtro de contenido. Prueba con otra foto, de frente y con buena luz.'
      : s === 'canceled' ? 'La generación se ha cancelado.' : 'No se ha podido generar el vídeo' + (st.error ? ': ' + String(st.error).slice(0, 160) : '.');
    await ref.update({ status: 'error', error: msg, job: A.firestore.FieldValue.delete(), updatedAt: Date.now() });
    return { ...d, status: 'error', error: msg };
  }
  if (s !== 'completed') return d;
  const url = st.video && st.video.url;
  if (!url) { await ref.update({ status: 'error', error: 'Higgsfield no ha devuelto el vídeo.', job: A.firestore.FieldValue.delete(), updatedAt: Date.now() }); return null; }

  // Solo un proceso guarda el vídeo (navegador y webhook pueden llegar a la vez)
  const now = Date.now();
  const mine = await db.runTransaction(async t => { const x = (await t.get(ref)).data(); if (!x || !x.job || x.job.requestId !== job.requestId) return false;
    if (x.job.saving && now - x.job.saving < 90000) return false; t.update(ref, { 'job.saving': now }); return true; });
  if (!mine) return (await ref.get()).data();

  try {
    const r = await fetch(url); if (!r.ok) throw err(502, 'No se ha podido descargar el vídeo (' + r.status + ')');
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_VIDEO) throw err(502, 'El vídeo generado es demasiado grande para guardarlo');
    const mime = String(r.headers.get('content-type') || 'video/mp4').split(';')[0];
    const gen = job.gen, n = Math.ceil(buf.length / CHUNK);
    await Promise.all(Array.from({ length: n }, (_, i) => ref.collection('chunks').doc(gen + '-' + i).set({ d: buf.subarray(i * CHUNK, (i + 1) * CHUNK) })));
    const old = d.video;
    await ref.update({ status: 'completed', error: A.firestore.FieldValue.delete(), job: A.firestore.FieldValue.delete(), updatedAt: Date.now(),
      video: { gen, chunks: n, mime, size: buf.length, at: Date.now(), poster: job.poster || d.poster || null } });
    if (old && old.gen !== gen) await Promise.all(Array.from({ length: old.chunks || 0 }, (_, i) => ref.collection('chunks').doc(old.gen + '-' + i).delete().catch(() => {})));
    // Privacidad: una vez guardado en el club, se borran en Higgsfield la foto, el prompt y el vídeo
    fetch(HF + '/requests/' + encodeURIComponent(job.requestId), { method: 'DELETE', headers: { Authorization: hfAuth() } }).catch(() => {});
    return (await ref.get()).data();
  } catch (e) {
    await ref.update({ 'job.saving': A.firestore.FieldValue.delete() }).catch(() => {});
    throw e;
  }
}

// La firma se calcula sobre el cuerpo exacto: se lee el flujo sin tocar req.body (que lo interpretaría como JSON)
async function readRaw(req) {
  const raw = await new Promise(res => { const a = []; let done = false; const fin = () => { if (!done) { done = true; res(Buffer.concat(a)); } };
    req.on('data', c => a.push(c)); req.on('end', fin); req.on('error', fin); setTimeout(fin, 3000); });
  if (raw.length) return raw;
  const b = req.body; return Buffer.isBuffer(b) ? b : Buffer.from(typeof b === 'string' ? b : JSON.stringify(b || {}));
}
function verifyHook(req, raw) {
  const secret = String(process.env.HF_WEBHOOK_SECRET || '');
  if (!secret) return false;
  const id = req.headers['webhook-id'], ts = req.headers['webhook-timestamp'], sigs = String(req.headers['webhook-signature'] || '');
  if (!id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const exp = crypto.createHmac('sha256', key).update(id + '.' + ts + '.').update(raw).digest();
  return sigs.split(' ').some(x => { const [v, s] = x.split(','); if (v !== 'v1' || !s) return false; const b = Buffer.from(s, 'base64'); return b.length === exp.length && crypto.timingSafeEqual(b, exp); });
}

async function hook(req, res) {
  if (!configured() || !process.env.HF_WEBHOOK_SECRET) return res.status(404).json({ error: 'off' });
  const raw = await readRaw(req);
  if (!verifyHook(req, raw)) return res.status(401).json({ error: 'firma' });
  let body = {}; try { body = JSON.parse(raw.toString('utf8') || '{}'); } catch (e) { return res.status(400).json({ error: 'json' }); }
  const rid = String(body.request_id || ''); if (!rid) return res.status(200).json({ ok: true });
  const A = getAdmin(), db = A.firestore();
  const q = await db.collection('presentations').where('job.requestId', '==', rid).limit(1).get();
  if (q.empty) return res.status(200).json({ ok: true });     // ya procesado o borrado
  await advance(db, A, q.docs[0].ref);                         // si falla, 5xx → Higgsfield reintenta
  return res.status(200).json({ ok: true });
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') return res.status(200).json({ configured: configured(), perPlayer: PER_PLAYER, webhook: !!process.env.HF_WEBHOOK_SECRET });
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    if (req.query && req.query.hook) return await hook(req, res);
    if (!configured()) return res.status(501).json({ error: 'La presentación con IA aún no está configurada (faltan las claves de Higgsfield en Vercel)', code: 'not-configured' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { db, A, isAdmin, pid, email } = await who(req);
    const action = String(body.action || '');

    if (action === 'list') {
      const q = await db.collection('presentations').get(); const items = {};
      q.forEach(x => { const own = x.id === pid; const v = view(x.data(), own); if (own || (v && v.video)) items[x.id] = own ? v : { video: v.video, poster: v.poster }; });
      return res.status(200).json({ items, usage: pid ? await usage(db, pid) : null });
    }

    if (action === 'chunk') {
      const target = String(body.pid || ''), gen = String(body.gen || ''), i = +body.i;
      if (!/^[\w-]{1,60}$/.test(target) || !/^[\w-]{1,40}$/.test(gen) || !(i >= 0 && i < 64)) return res.status(400).json({ error: 'chunk' });
      const c = await db.doc('presentations/' + target + '/chunks/' + gen + '-' + i).get();
      if (!c.exists) return res.status(404).json({ error: 'no-existe' });
      const d = c.data().d; const buf = Buffer.isBuffer(d) ? d : Buffer.from(d.toUint8Array ? d.toUint8Array() : d);
      res.setHeader('Content-Type', 'application/octet-stream'); res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
      return res.status(200).end(buf);
    }

    if (action === 'delete') {
      const target = String(body.pid || pid || '');
      if (!target || (target !== pid && !isAdmin)) return res.status(403).json({ error: 'Solo puedes borrar tu propio vídeo' });
      const ref = db.doc('presentations/' + target); const d = (await ref.get()).data();
      if (!d) return res.status(200).json({ ok: true });
      if (d.job && ['pending', 'generating'].includes(d.status)) {
        // Si aún está en cola se cancela; si ya se está generando, se deja terminar y se descarta
        await fetch(d.job.cancelUrl || (HF + '/requests/' + encodeURIComponent(d.job.requestId) + '/cancel'), { method: 'POST', headers: { Authorization: hfAuth() } }).catch(() => {});
      }
      const chunks = await ref.collection('chunks').listDocuments();
      await Promise.all(chunks.map(c => c.delete()));
      await ref.delete();
      if (d.job && d.job.requestId) fetch(HF + '/requests/' + encodeURIComponent(d.job.requestId), { method: 'DELETE', headers: { Authorization: hfAuth() } }).catch(() => {});
      return res.status(200).json({ ok: true });
    }

    if (!pid) return res.status(403).json({ error: 'Tu cuenta no está ligada a ningún jugador' });
    const ref = db.doc('presentations/' + pid);

    if (action === 'status') {
      const d = await advance(db, A, ref);
      return res.status(200).json({ item: view(d, true), usage: await usage(db, pid) });
    }

    if (action === 'create') {
      if (body.consent !== true || +body.consentV !== CONSENT_V) return res.status(400).json({ error: 'Falta tu consentimiento para generar el vídeo con IA' });
      const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image || ''));
      if (!m) return res.status(400).json({ error: 'La foto debe llegar en JPEG' });
      const img = Buffer.from(m[1], 'base64');
      if (img.length < 8000 || img.length > 3 * 1024 * 1024) return res.status(400).json({ error: 'La foto no tiene un tamaño válido' });
      const dim = jpegSize(img);
      if (!dim || dim.w < 540 || dim.h < 960 || Math.abs(dim.w / dim.h - 9 / 16) > 0.02) return res.status(400).json({ error: 'La foto debe ser vertical 9:16 y de al menos 540×960' });
      const poster = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(String(body.poster || '')) && body.poster.length < 120000 ? body.poster : null;

      const cur = (await ref.get()).data();
      if (cur && cur.job && ['pending', 'generating'].includes(cur.status)) return res.status(409).json({ error: 'Ya se está preparando tu presentación' });

      // Reserva del cupo (por jugador y del club) antes de gastar nada
      const uref = db.doc('presentationUsage/' + month());
      const ok = await db.runTransaction(async t => { const u = (await t.get(uref)).data() || {}; const mine = (u.byPid || {})[pid] || 0;
        if (mine >= PER_PLAYER) return 'player'; if ((u.n || 0) >= GLOBAL) return 'club';
        t.set(uref, { n: (u.n || 0) + 1, byPid: { [pid]: mine + 1 }, at: Date.now() }, { merge: true }); return 'ok'; });
      if (ok === 'player') return res.status(429).json({ error: 'Ya has generado ' + PER_PLAYER + ' vídeos este mes. Podrás crear otro el mes que viene.' });
      if (ok === 'club') return res.status(429).json({ error: 'El club ha llegado al tope mensual de vídeos con IA. Avisa a un administrador.' });
      const refund = () => uref.set({ n: A.firestore.FieldValue.increment(-1), byPid: { [pid]: A.firestore.FieldValue.increment(-1) } }, { merge: true }).catch(() => {});

      const gen = Date.now().toString(36);
      let sub;
      try {
        const imageUrl = await uploadImage(img);
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const hookUrl = process.env.HF_WEBHOOK_SECRET && host ? 'https://' + host + '/api/presentation?hook=1' : '';
        sub = await hfJson(HF + ENDPOINT + (hookUrl ? '?hf_webhook=' + encodeURIComponent(hookUrl) : ''), {
          method: 'POST', headers: { Authorization: hfAuth(), 'Content-Type': 'application/json', 'Idempotency-Key': 'polo-' + pid + '-' + gen },
          body: JSON.stringify(payload(imageUrl)) }, 'generación');
        if (!sub.request_id || !sub.status_url) throw err(502, 'Higgsfield no ha devuelto el trabajo');
      } catch (e) { await refund(); throw e; }

      await ref.set({ pid, status: sub.status === 'in_progress' ? 'generating' : 'pending', error: A.firestore.FieldValue.delete(), poster: poster || (cur && cur.poster) || null,
        startedAt: Date.now(), updatedAt: Date.now(), consent: { at: Date.now(), v: CONSENT_V, by: email },
        job: { requestId: sub.request_id, statusUrl: sub.status_url, cancelUrl: sub.cancel_url || null, gen, endpoint: ENDPOINT, poster } }, { merge: true });
      const d = (await ref.get()).data();
      return res.status(200).json({ item: view(d, true), usage: await usage(db, pid) });
    }

    return res.status(400).json({ error: 'action' });
  } catch (e) {
    if (!e.status) console.error(e);
    return res.status(e.status || 500).json({ error: e.message || 'error', code: e.code || null });
  }
};
