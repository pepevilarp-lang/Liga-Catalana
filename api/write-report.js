// Redacta con IA los textos del informe semanal (resumen ejecutivo, conclusiones, síntesis de capitanes,
// áreas de mejora y seguimiento) a partir EXCLUSIVAMENTE de los datos que envía la app.
// Solo gestores del club y administradores. Configuración en Vercel: GROQ_API_KEY y FIREBASE_PROJECT_ID
// (opcional: AI_PROVIDER=openai|xai|gemini con su clave y AI_MODEL; GROQ_MODEL para cambiar el modelo de Groq).
const PROVIDERS = {
  groq:   { base: 'https://api.groq.com/openai/v1', keyVar: 'GROQ_API_KEY', model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b', extra: { reasoning_effort: 'none' }, maxTok: 'max_completion_tokens' },
  openai: { base: 'https://api.openai.com/v1', keyVar: 'OPENAI_API_KEY', model: process.env.AI_MODEL, maxTok: 'max_tokens' },
  xai:    { base: 'https://api.x.ai/v1', keyVar: 'XAI_API_KEY', model: process.env.AI_MODEL, maxTok: 'max_tokens' },
  gemini: { base: 'https://generativelanguage.googleapis.com/v1beta/openai', keyVar: 'GEMINI_API_KEY', model: process.env.AI_MODEL, maxTok: 'max_tokens' },
};
function provider() {
  const name = String(process.env.AI_PROVIDER || 'groq').toLowerCase(), p = PROVIDERS[name];
  if (!p) throw Object.assign(new Error('Proveedor de IA no admitido: ' + name), { status: 501 });
  if (!process.env[p.keyVar]) throw Object.assign(new Error('Falta la variable ' + p.keyVar + ' en Vercel'), { status: 501 });
  if (!p.model) throw Object.assign(new Error('Falta AI_MODEL en Vercel'), { status: 501 });
  return { name, ...p };
}
const fsBase = () => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(process.env.FIREBASE_PROJECT_ID || '')}/databases/(default)/documents/`;
function tokenEmail(t) { try { return String(JSON.parse(Buffer.from(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')).email || '').toLowerCase(); } catch (e) { return ''; } }
async function authorize(token) {
  // Con la cuenta de servicio: gestores del club (lista o miembros con rol gestor, activos) y administradores (api/_auth.js)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const ctx = await require('./_auth.js').caller({ headers: { authorization: 'Bearer ' + token } });
    if (!ctx.isStaff) throw Object.assign(new Error('Solo gestores del club y administradores'), { status: 403 });
    return;
  }
  if (!process.env.FIREBASE_PROJECT_ID) throw Object.assign(new Error('Falta FIREBASE_PROJECT_ID en Vercel'), { status: 501 });
  if (!token) throw Object.assign(new Error('Falta la sesión'), { status: 401 });
  const h = { headers: { Authorization: 'Bearer ' + token } };
  const r = await fetch(fsBase() + 'meta/app', h);
  if (r.status === 401) throw Object.assign(new Error('Sesión no válida: vuelve a entrar'), { status: 401 });
  if (r.status !== 200 && r.status !== 404) throw Object.assign(new Error('Solo gestores del club'), { status: 403 });
  const meta = r.status === 200 ? await r.json() : {};
  const managers = ((((meta.fields || {}).managerEmails || {}).arrayValue || {}).values || []).map(v => String(v.stringValue || '').toLowerCase());
  const email = tokenEmail(token);
  const a = await fetch(fsBase() + 'admins/' + encodeURIComponent(email), h);
  if (a.status !== 200 && !managers.includes(email)) throw Object.assign(new Error('Solo gestores del club y administradores'), { status: 403 });
}
const SYSTEM = `Eres el redactor del informe deportivo semanal del ${require('../club-config.js').name} (tenis, Lliga Catalana por equipos).
Escribes en español, con tono profesional, sobrio y claro, como un informe de dirección deportiva. Sin emojis ni adjetivos exagerados.
REGLAS ESTRICTAS:
1. Usa SOLO los datos del JSON que recibes. No inventes resultados, marcadores, jugadores, estadísticas, rivales, opiniones, declaraciones ni incidencias.
2. Los resultados con "validado": false están pendientes de validación: dilo así, no los presentes como definitivos.
3. Individuales y dobles se analizan por separado; nunca sumes sus balances.
4. En "sintesis_capitan" resume y ordena SOLO lo que el capitán escribió en "informe_capitan". No añadas valoraciones propias ni le atribuyas nada que no diga. Si un equipo no tiene informe, no lo incluyas.
5. Cada área de mejora debe apoyarse en un dato o en un comentario real del capitán, indicado en "fundamento". Si no hay base suficiente, devuelve la lista vacía.
6. Si hay pocos datos, sé breve. No rellenes.
Devuelve SOLO un objeto JSON con esta forma:
{"resumen_ejecutivo": "máx. 110 palabras",
 "conclusiones": ["máx. 4 frases"],
 "sintesis_capitan": {"<nombre exacto del equipo>": "máx. 90 palabras"},
 "areas_mejora": [{"texto": "...", "fundamento": "dato o comentario en que se basa", "equipo": "<nombre exacto o vacío>"}],
 "seguimiento": ["acciones concretas de seguimiento para el gestor, basadas en pendientes reales"]}`;
const words = (s, n) => String(s || '').split(/\s+/).slice(0, n).join(' ');
function clean(o, teams) {
  const names = new Set(teams);
  const out = { resumen_ejecutivo: words(o.resumen_ejecutivo, 140), conclusiones: [], sintesis_capitan: {}, areas_mejora: [], seguimiento: [] };
  (Array.isArray(o.conclusiones) ? o.conclusiones : []).slice(0, 5).forEach(x => out.conclusiones.push(words(x, 50)));
  Object.entries(o.sintesis_capitan || {}).forEach(([k, v]) => { if (names.has(k)) out.sintesis_capitan[k] = words(v, 120); });
  (Array.isArray(o.areas_mejora) ? o.areas_mejora : []).slice(0, 8).forEach(x => { if (x && x.texto && x.fundamento) out.areas_mejora.push({ texto: words(x.texto, 40), fundamento: words(x.fundamento, 40), equipo: names.has(x.equipo) ? x.equipo : '' }); });
  (Array.isArray(o.seguimiento) ? o.seguimiento : []).slice(0, 8).forEach(x => out.seguimiento.push(words(x, 40)));
  return out;
}
// Redacta los textos a partir de los datos. La usan el botón de la app y el informe automático (api/_report.js).
async function analyze(facts) {
  const p = provider();
  const txt = JSON.stringify(facts);
  if (txt.length > 90000) throw Object.assign(new Error('Demasiados datos para redactar'), { status: 413 });
  const teams = (facts.equipos || []).map(t => t.equipo).filter(Boolean);
  const payload = { model: p.model, temperature: 0.2, [p.maxTok]: 3000, response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: 'Datos del fin de semana (JSON):\n' + txt }], ...(p.extra || {}) };
  const go = b => fetch(p.base + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env[p.keyVar] }, body: JSON.stringify(b) });
  let r = await go(payload);
  if (r.status === 400 && p.extra) { const t = await r.text(); if (/reasoning/i.test(t)) { Object.keys(p.extra).forEach(k => delete payload[k]); r = await go(payload); } else throw Object.assign(new Error('El proveedor rechazó la petición: ' + t.slice(0, 200)), { status: 502 }); }
  if (!r.ok) throw Object.assign(new Error('Error del proveedor (' + r.status + '): ' + (await r.text()).slice(0, 200)), { status: 502 });
  const j = await r.json(); let raw = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '{}';
  raw = raw.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/^```(json)?|```$/g, '').trim();
  let o; try { o = JSON.parse(raw); } catch (e) { const m = raw.match(/\{[\s\S]*\}/); o = m ? JSON.parse(m[0]) : {}; }
  return { provider: p.name, model: p.model, usage: j.usage || null, data: clean(o, teams) };
}
module.exports = async (req, res) => {
  if (req.method === 'GET') { let p = null, err = null; try { p = provider(); } catch (e) { err = e.message; } return res.status(200).json({ configured: !!p && !!process.env.FIREBASE_PROJECT_ID, provider: p ? p.name : null, model: p ? p.model : null, error: err }); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try {
    provider();
    await authorize(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const out = await analyze(body.facts || {});
    return res.status(200).json({ ok: true, ...out });
  } catch (e) { return res.status(e.status || 500).json({ error: e.message || 'error' }); }
};
module.exports.analyze = analyze;
