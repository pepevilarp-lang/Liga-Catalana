// Lee un documento (texto ya extraído en el navegador y/o hasta 3 imágenes) y devuelve datos estructurados.
// La IA solo propone: nada se guarda hasta que una persona lo valida en la app.
const { extractJSON, provider } = require('./_ai');

let admin = null;
function getAdmin() {
  admin = admin || require('firebase-admin');
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return admin;
}
// Comprueba que quien llama es del equipo. Dos vías:
// 1) Con FIREBASE_SERVICE_ACCOUNT: verifica el token con Firebase Admin y aplica el tope diario de lecturas.
// 2) Solo con FIREBASE_PROJECT_ID: pregunta a Firestore con el propio token del usuario si puede leer meta/app.
//    Las reglas solo dejan leerlo a jugadores del equipo, administradores y gestores, así que la respuesta lo acredita.
async function authorize(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw Object.assign(new Error('Falta la sesión'), { status: 401 });
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const A = getAdmin(), db = A.firestore();
    const user = await A.auth().verifyIdToken(token);
    const email = String(user.email || '').toLowerCase();
    const [u, a1, a2, meta] = await Promise.all([db.doc('users/' + user.uid).get(), db.doc('admins/' + user.uid).get(), db.doc('admins/' + email).get(), db.doc('meta/app').get()]);
    const isMgr = meta.exists && (meta.data().managerEmails || []).includes(email);
    if (!u.exists && !a1.exists && !a2.exists && !isMgr) throw Object.assign(new Error('Solo miembros del equipo'), { status: 403 });
    return { db };
  }
  const pid = process.env.FIREBASE_PROJECT_ID;
  if (!pid) throw Object.assign(new Error('Falta FIREBASE_PROJECT_ID en Vercel'), { status: 501 });
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(pid)}/databases/(default)/documents/meta/app`, { headers: { Authorization: 'Bearer ' + token } });
  if (r.status === 200 || r.status === 404) return { db: null };
  if (r.status === 401) throw Object.assign(new Error('Sesión no válida: vuelve a entrar'), { status: 401 });
  throw Object.assign(new Error('Solo miembros del equipo'), { status: 403 });
}
const COMMON = `Eres un asistente que extrae datos de documentos de la Lliga Catalana de tenis por equipos (Federació Catalana de Tennis).
Nuestro club es el Real Club de Polo de Barcelona (aparece como "Polo, RC de", "RC Polo", "Real Club de Polo"...).
REGLAS OBLIGATORIAS:
- Devuelve SOLO un objeto JSON válido con exactamente la estructura pedida.
- No inventes nada. Si un dato no aparece o no se lee bien, pon null y añade una frase a "unclear".
- Pon "confidence" entre 0 y 1 en cada elemento (1 = se lee perfectamente, 0.5 = dudoso).
- Separa siempre partidos individuales (type "S") y dobles (type "D").
- NO incluyas números de licencia, fechas de nacimiento, DNI, teléfonos ni correos aunque aparezcan.
- Fechas en formato AAAA-MM-DD y horas en HH:MM.`;
const SCHEMAS = {
  plantilla: `Es un listado de jugadores de un equipo. Estructura:
{"team":string|null,"category":string|null,"captain":string|null,"players":[{"name":"nombre y apellidos tal cual","category":string|null,"points":number|null,"order":number|null,"confidence":number}],"unclear":[string]}`,
  calendario: `Es un calendario o listado de partidos de un grupo. Una fila por eliminatoria. Estructura:
{"competition":string|null,"group":string|null,"fixtures":[{"jornada":number,"date":"AAAA-MM-DD"|null,"time":"HH:MM"|null,"home":"club local tal cual","away":"club visitante tal cual","home_score":number|null,"away_score":number|null,"confidence":number}],"unclear":[string]}
Un marcador 0/0 significa que aún no se ha jugado: pon null en ambos.`,
  orden: `Es un orden de juego de una eliminatoria. Estructura:
{"jornada":number|null,"date":"AAAA-MM-DD"|null,"rival":string|null,"singles":[{"order":number,"player":"jugador del Polo","rival_player":string|null,"confidence":number}],"doubles":[{"players":["jugador del Polo","jugador del Polo"],"rival_players":[string],"confidence":number}],"unclear":[string]}`,
  acta: `Es un acta o hoja de resultados de una eliminatoria. Expresa los marcadores DESDE EL PUNTO DE VISTA DEL POLO (primero los juegos del Polo). Estructura:
{"jornada":number|null,"date":"AAAA-MM-DD"|null,"home":string|null,"away":string|null,"matches":[{"type":"S"|"D","order":number|null,"polo_players":[string],"rival_players":[string],"score":"6-4 3-6 6-3"|null,"winner":"polo"|"rival"|null,"confidence":number}],"total":{"polo":number|null,"rival":number|null},"unclear":[string]}`,
  clasificacion: `Es una clasificación de un grupo. Estructura:
{"after_jornada":number|null,"rows":[{"pos":number,"team":"club tal cual","points":number|null,"played":number|null,"confidence":number}],"unclear":[string]}`
};
SCHEMAS.resultados = SCHEMAS.acta;
const FORBIDDEN = /licen|nacim|birth|dni|nif|phone|tel[eé]f|email|correo/i;
function scrub(x) { if (Array.isArray(x)) return x.map(scrub); if (x && typeof x === 'object') { const o = {}; for (const [k, v] of Object.entries(x)) if (!FORBIDDEN.test(k)) o[k] = scrub(v); return o; } return x; }
function clampConf(x) { if (Array.isArray(x)) x.forEach(clampConf); else if (x && typeof x === 'object') { if ('confidence' in x) { const c = +x.confidence; x.confidence = isFinite(c) ? Math.max(0, Math.min(1, c)) : 0.5; } Object.values(x).forEach(clampConf); } return x; }

module.exports = async (req, res) => {
  if (req.method === 'GET') {   // estado de la configuración (sin datos sensibles)
    let p = null, err = null; try { p = provider(); } catch (e) { err = e.message; }
    return res.status(200).json({ configured: !!p && !!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_PROJECT_ID), provider: p?.name || null, model: p?.model || null, error: err || (!(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_PROJECT_ID) ? 'Falta FIREBASE_PROJECT_ID en Vercel' : null) });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    const { db } = await authorize(req);

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const kind = String(body.kind || ''); if (!SCHEMAS[kind]) return res.status(400).json({ error: 'Tipo de documento no admitido para lectura automática' });
    const text = String(body.text || '').slice(0, 60000);
    let images = (Array.isArray(body.images) ? body.images : []).filter(x => /^data:image\/(jpeg|png|webp);base64,/.test(x)).slice(0, 5);
    let total = 0; images = images.filter(x => (total += x.length) < 3.6e6);   // Groq admite hasta 4 MB en base64 por petición
    if (!text.trim() && !images.length) return res.status(400).json({ error: 'El documento no tiene contenido legible' });

    // Tope diario de lecturas (control de coste). Con la vía sin cuenta de servicio, el control es el límite de gasto de Groq.
    if (db) {
      const limit = +process.env.AI_DAILY_LIMIT || 150, day = new Date().toISOString().slice(0, 10), ref = db.doc('aiUsage/' + day);
      const n = await db.runTransaction(async t => { const s = await t.get(ref); const c = (s.exists ? s.data().n : 0) + 1; if (c > limit) return -1; t.set(ref, { n: c, at: Date.now() }, { merge: true }); return c; });
      if (n < 0) return res.status(429).json({ error: 'Se ha alcanzado el tope diario de lecturas con IA (' + limit + ')' });
    }

    const ctx = body.context || {};
    const userText = `${SCHEMAS[kind]}

Contexto de la app (para ayudarte a reconocer nombres; NO lo copies si no aparece en el documento):
- Equipo: ${String(ctx.team || '').slice(0, 80)}
- Jugadores del equipo: ${(ctx.players || []).slice(0, 60).map(p => String(p).slice(0, 60)).join('; ')}
- Clubes del grupo: ${(ctx.clubs || []).slice(0, 20).map(p => String(p).slice(0, 60)).join('; ')}
${ctx.jornada ? '- Jornada indicada por el usuario: ' + (+ctx.jornada) : ''}

${text ? 'TEXTO DEL DOCUMENTO:\n' + text : 'El documento va en las imágenes adjuntas.'}`;
    const out = await extractJSON(COMMON, userText, images);
    return res.status(200).json({ data: clampConf(scrub(out.data)), provider: out.provider, model: out.model, usage: out.usage, imagesUsed: out.imagesUsed });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || 'error' });
  }
};
