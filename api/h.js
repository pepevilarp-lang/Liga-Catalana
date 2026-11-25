// Una sola función de Vercel para las rutas de /api que no son tareas programadas (el plan gratuito permite 12).
// vercel.json reescribe /api/<ruta> → /api/h?fn=<ruta>: las URLs de la app no cambian.
// Cada ruta está en api/_<ruta>.js (los archivos con «_» no cuentan como funciones).
const ROUTES = {
  'access-request': () => require('./_access-request.js'),
  'auto-report': () => require('./_auto-report.js'),
  'extract': () => require('./_extract.js'),
  'fct-clubs': () => require('./_fct-clubs.js'),
  'migrate': () => require('./_migrate.js'),
  'notify': () => require('./_notify.js'),
  'send-invite': () => require('./_send-invite.js'),
  'send-report': () => require('./_send-report.js'),
  'write-report': () => require('./_write-report.js'),
  'wa-webhook': () => require('./_wa-webhook.js'),
  'client-error': () => require('./_client-error.js'),
  'photo': () => require('./_photo.js'),
};
module.exports = async (req, res) => {
  const fn = String((req.query && req.query.fn) || '').replace(/[^a-z-]/g, '');
  const load = ROUTES[fn]; if (!load) return res.status(404).json({ error: 'not-found' });
  // La ruta ve su propia URL y su query sin el parámetro interno
  if (req.query) delete req.query.fn;
  return load()(req, res);
};
