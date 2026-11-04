// Capa de IA independiente del proveedor. Se elige con la variable AI_PROVIDER (por defecto: groq).
// Las claves viven SOLO en el servidor (variables de entorno de Vercel). Nunca llegan al navegador.
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
module.exports = { extractJSON, provider };
