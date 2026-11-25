// Fotos de jugadores y del equipo, fuera de la base de datos: se guardan en Vercel Blob (CDN) y en Firestore solo
// queda su dirección (photos/<id> = { d: foto, t: miniatura }). Así la app ya no descarga las fotos de todo el
// equipo en cada visita: las listas usan la miniatura (pocos KB) y la foto grande solo donde se ve grande.
// Necesita BLOB_READ_WRITE_TOKEN en Vercel (se pone solo al conectar un almacén Blob al proyecto). Sin él responde
// 501 y la app guarda la foto (ya reducida) en Firestore como antes.
// Permisos, los mismos que firestore.rules para photos/<id>: la propia persona, capitanes y gestión.
const { caller, sendErr, httpErr } = require('./_auth.js');
const configured = () => !!process.env.BLOB_READ_WRITE_TOKEN;
function fromDataUrl(s, max) {
  const m = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(String(s || ''));
  if (!m) throw httpErr(400, 'Imagen no válida');
  const buf = Buffer.from(m[2], 'base64'); if (buf.length > max) throw httpErr(413, 'Imagen demasiado grande');
  return { buf, type: m[1], ext: m[1] === 'image/jpeg' ? 'jpg' : m[1].split('/')[1] };
}
module.exports = async (req, res) => {
  if (req.method === 'GET') return res.status(200).json({ blob: configured() });
  if (req.method !== 'POST') return res.status(405).end();
  try {
    if (!configured()) return res.status(501).json({ error: 'sin-almacen' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const id = String(b.id || ''); if (!/^[\w-]{1,60}$/.test(id)) throw httpErr(400, 'Foto no válida');
    const ctx = await caller(req);
    const captain = !!(ctx.pid && ((ctx.meta || {}).captainPids || []).includes(ctx.pid));
    if (!(ctx.isStaff || captain || (ctx.pid && ctx.pid === id))) throw httpErr(403, 'No puedes cambiar esta foto');
    const full = fromDataUrl(b.full, 900 * 1024), thumb = fromDataUrl(b.thumb, 60 * 1024);
    const { put, del } = require('@vercel/blob');
    const base = `photos/${ctx.clubId || 'club'}/${id}`;
    const [F, T] = await Promise.all([
      put(`${base}.${full.ext}`, full.buf, { access: 'public', contentType: full.type, addRandomSuffix: true, cacheControlMaxAge: 31536000 }),
      put(`${base}-t.${thumb.ext}`, thumb.buf, { access: 'public', contentType: thumb.type, addRandomSuffix: true, cacheControlMaxAge: 31536000 })]);
    const ref = ctx.cdb.doc('photos/' + id), old = (await ref.get()).data() || {};
    const doc = { d: F.url, t: T.url, at: Date.now(), by: ctx.email, blob: true };
    await ref.set(doc);
    // Las anteriores, si también estaban en Blob, se borran
    const prev = [old.d, old.t].filter(u => /^https:\/\/[\w.-]+\.blob\.vercel-storage\.com\//.test(String(u || '')));
    if (prev.length) await del(prev).catch(() => {});
    return res.status(200).json(doc);
  } catch (e) { return sendErr(res, e); }
};
