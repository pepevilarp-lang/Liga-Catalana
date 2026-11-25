// Errores de la app en los móviles de los usuarios (los manda errors.js). Se escriben en los registros de Vercel
// (Logs → buscar «[client-error]») sin datos personales: mensaje, archivo y línea, pantalla, versión y navegador.
const seen = new Map();   // dentro de una misma ejecución, el mismo error no se repite más de 20 veces
const clip = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]+/g, ' ').slice(0, n);
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  let b = req.body || {}; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  const list = (Array.isArray(b.errors) ? b.errors : [b]).slice(0, 10);
  for (const e of list) {
    const key = clip(e.msg, 120) + '|' + clip(e.src, 80);
    const n = (seen.get(key) || 0) + 1; seen.set(key, n); if (n > 20) continue;
    console.error('[client-error]', JSON.stringify({
      msg: clip(e.msg, 300), src: clip(e.src, 160), line: +e.line || 0, col: +e.col || 0, stack: clip(e.stack, 1200),
      screen: clip(e.screen, 40), app: clip(e.app, 20), v: clip(e.v, 40), club: clip(e.club, 40), ua: clip(req.headers['user-agent'], 160), n: +e.n || 1 }));
  }
  return res.status(204).end();
};
