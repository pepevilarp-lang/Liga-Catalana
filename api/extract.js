// Lee un documento (texto ya extraído en el navegador y/o hasta 3 imágenes) y devuelve datos estructurados.
// La IA solo propone: nada se guarda hasta que una persona lo valida en la app.
// ===== Capa de IA independiente del proveedor (antes api/_ai.js, ahora dentro de este archivo para no depender de otros) =====
//  Se elige con la variable AI_PROVIDER (por defecto: groq).
// Las claves viven SOLO en el servidor (variables de entorno de Vercel). Nunca llegan al navegador.
const CLUBCFG = require('../club-config.js');
const PROVIDERS = {
  // Verificado en la documentación de Groq (nov. 2026): qwen/qwen3.8-27b lee texto e imágenes (máx. 3), modo JSON.
  groq:     { base: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1', keyVar: 'GROQ_API_KEY', model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b', maxImages: 3, extra: { reasoning_effort: 'none' } },
  // El resto se activa poniendo su clave y su modelo en Vercel (no se inventan nombres de modelo).
  openai:   { base: 'https://api.openai.com/v1', keyVar: 'OPENAI_API_KEY', model: process.env.OPENAI_MODEL, maxImages: 5 },
  xai:      { base: 'https://api.x.ai/v1', keyVar: 'XAI_API_KEY', model: process.env.XAI_MODEL, maxImages: 5 },
  gemini:   { base: 'https://generativelanguage.googleapis.com/v1beta/openai', keyVar: 'GEMINI_API_KEY', model: process.env.GEMINI_MODEL, maxImages: 5 },
  anthropic:{ anthropic: true, keyVar: 'ANTHROPIC_API_KEY', model: process.env.ANTHROPIC_MODEL, maxImages: 5 }
};
function provider() {
  const name = (process.env.AI_PROVIDER || 'groq').toLowerCase();
  const p = PROVIDERS[name];
  if (!p) throw Object.assign(new Error('Proveedor de IA desconocido: ' + name), { status: 501, code: 'ai-provider' });
  if (!process.env[p.keyVar]) throw Object.assign(new Error('Falta la variable ' + p.keyVar + ' en Vercel'), { status: 501, code: 'ai-not-configured' });
  if (!p.model) throw Object.assign(new Error('Falta el modelo para ' + name + ' (variable ' + name.toUpperCase() + '_MODEL)'), { status: 501, code: 'ai-model' });
  return { name, ...p };
}
async function openaiCompat(p, system, userText, images) {
  const content = images.length ? [{ type: 'text', text: userText }, ...images.map(u => ({ type: 'image_url', image_url: { url: u } }))] : userText;
  const body = { model: p.model, temperature: 0.1, [p.name === 'groq' ? 'max_completion_tokens' : 'max_tokens']: 8000, response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: system }, { role: 'user', content }], ...(p.extra || {}) };
  const go = () => fetch(p.base + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env[p.keyVar] }, body: JSON.stringify(body) });
  let r = await go();
  if (r.status === 400 && p.extra) {               // si el modelo no admite un parámetro opcional, se reintenta sin él
    const t = await r.text();
    if (/reasoning/i.test(t)) { Object.keys(p.extra).forEach(k => delete body[k]); r = await go(); }
    else throw Object.assign(new Error('El proveedor rechazó la petición: ' + t.slice(0, 240)), { status: 502 });
  }
  if (!r.ok) throw Object.assign(new Error('Error del proveedor (' + r.status + '): ' + (await r.text()).slice(0, 240)), { status: 502 });
  const j = await r.json();
  return { text: j.choices?.[0]?.message?.content || '', usage: j.usage || null };
}
async function anthropicCall(p, system, userText, images) {
  const imgs = images.map(u => { const m = /^data:(image\/[a-z]+);base64,(.*)$/i.exec(u) || []; return { type: 'image', source: { type: 'base64', media_type: m[1] || 'image/jpeg', data: m[2] || '' } }; });
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env[p.keyVar], 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: p.model, max_tokens: 8000, system, messages: [{ role: 'user', content: [...imgs, { type: 'text', text: userText + '\n\nResponde únicamente con el objeto JSON.' }] }] }) });
  if (!r.ok) throw Object.assign(new Error('Error del proveedor (' + r.status + '): ' + (await r.text()).slice(0, 240)), { status: 502 });
  const j = await r.json();
  return { text: (j.content || []).map(c => c.text || '').join(''), usage: j.usage || null };
}
function parseJson(text) {
  const t = String(text || '').replace(/```json|```/g, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < a) throw Object.assign(new Error('La IA no devolvió datos estructurados'), { status: 502 });
  return JSON.parse(t.slice(a, b + 1));
}
async function extractJSON(system, userText, images) {
  const p = provider();
  const imgs = (images || []).slice(0, p.maxImages);
  const out = p.anthropic ? await anthropicCall(p, system, userText, imgs) : await openaiCompat(p, system, userText, imgs);
  return { data: parseJson(out.text), usage: out.usage, provider: p.name, model: p.model, imagesUsed: imgs.length };
}


const ai = { extractJSON, provider };

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
Nuestro club es el ${CLUBCFG.name} (aparece como ${CLUBCFG.aliases.map(x => '"' + x + '"').join(', ')}...).
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
  acta: `Es el "ACTA DE RESULTATS TÈCNICS" de la Federació Catalana de Tennis, normalmente RELLENADA A MANO (foto o escaneo).
CÓMO ES EL IMPRESO:
- Arriba: "ACTA" (número), "PROVA" (competición) y "CATEGORIA".
- Dos columnas iguales, una por equipo, cada una encabezada por "EQUIP DEL ____" (club escrito a mano).
- Bloque "INDIVIDUALS": filas numeradas 1 a 5 con "núm. llicència" y "nom i cognoms" del jugador de ese equipo.
- Bloque "DOBLES": parejas 1 y 2, cada una con dos jugadores (marcados 1 y 2).
- Debajo de cada fila hay una LÍNEA DE PUNTOS. El impreso dice "Anoteu els resultats de cada partit a la línia de punts al peu del nom del guanyador": EL MARCADOR SE ESCRIBE DEBAJO DEL GANADOR, normalmente desde su punto de vista (6-3 6-4). Si el marcador está en la columna del Polo, ganó el Polo; si está en la columna del rival, ganó el rival.
- "CAPITÀ" de cada equipo y, abajo, "PUNTUACIÓ": "L'equip del Club ___ guanya el del ___ per __ a __", lugar y fecha.
NUESTRO EQUIPO es el ${CLUBCFG.name} (${[CLUBCFG.teamShort, ...CLUBCFG.aliases].map(x => '"' + x + '"').join(', ')}...). Identifica primero cuál de las dos columnas es la de nuestro club.
En la columna del rival a veces solo se escribe el nombre del club: NO hace falta leer nombres de jugadores rivales.
Estructura:
{"acta_numero":string|null,"prova":string|null,"categoria":string|null,"columna_polo":"izquierda"|"derecha"|null,"rival":"club rival tal cual"|null,
 "date":"AAAA-MM-DD"|null,"lugar":string|null,"jornada":number|null,
 "matches":[{"type":"S"|"D","order":number,"polo_players":["nombre tal cual en la columna del Polo"],"rival_text":"lo escrito en el lado rival"|null,
   "score_written":"marcador tal cual"|null,"score_side":"polo"|"rival"|null,"winner":"polo"|"rival"|null,
   "score":"marcador DESDE EL PUNTO DE VISTA DEL POLO (primero los juegos del Polo)"|null,"retired_or_wo":string|null,"confidence":number}],
 "puntuacion":{"ganador":"polo"|"rival"|null,"polo":number|null,"rival":number|null,"texto":string|null},
 "capitan_polo":string|null,"unclear":[string]}
REGLAS DEL ACTA:
- "order" es el número de fila (1 a 5) en individuales y el número de pareja (1 o 2) en dobles.
- Incluye solo las filas con algo escrito (nombre o marcador). No inventes filas ni jugadores.
- "winner" sale del lado donde está escrito el marcador ("score_side"). Si no se distingue, winner=null y explícalo en "unclear".
- "score": si ganó el Polo copia los sets tal cual; si ganó el rival, invierte cada set (6-3 pasa a 3-6).
- Tie-break escrito como 7-6(4), 7/6 o 7-6 (7-4): usa 7-6. Super tie-break del tercer set como 10-8 o [10-8]: úsalo como tercer set.
- "W.O.", "WO" (incomparecencia) o "ret.", "abandona" (abandono): ponlo en "retired_or_wo"; el ganador sigue saliendo del lado donde se anota.
- Si una cifra es dudosa (por ejemplo, 6 u 8), escribe tu mejor lectura, baja "confidence" y añádelo a "unclear".`,
  clasificacion: `Es una clasificación de un grupo. Estructura:
{"after_jornada":number|null,"rows":[{"pos":number,"team":"club tal cual","points":number|null,"played":number|null,"confidence":number}],"unclear":[string]}`
};
SCHEMAS.resultados = SCHEMAS.acta;
const FORBIDDEN = /licen|nacim|birth|dni|nif|phone|tel[eé]f|email|correo/i;
function scrub(x) { if (Array.isArray(x)) return x.map(scrub); if (x && typeof x === 'object') { const o = {}; for (const [k, v] of Object.entries(x)) if (!FORBIDDEN.test(k)) o[k] = scrub(v); return o; } return x; }
function clampConf(x) { if (Array.isArray(x)) x.forEach(clampConf); else if (x && typeof x === 'object') { if ('confidence' in x) { const c = +x.confidence; x.confidence = isFinite(c) ? Math.max(0, Math.min(1, c)) : 0.5; } Object.values(x).forEach(clampConf); } return x; }

module.exports = async (req, res) => {
  const { extractJSON, provider } = ai;
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
