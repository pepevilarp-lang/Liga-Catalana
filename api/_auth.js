// Permisos y rutas de datos compartidos por las funciones del servidor (api/*).
// Las funciones usan la cuenta de servicio, que se salta las reglas de Firestore: por eso cada una comprueba aquí,
// con los mismos criterios que firestore.rules, quién llama y qué puede hacer.
//   - Raíz de datos del club: la raíz de la base de datos hasta que el club se marca como migrado
//     (clubs/<id>.migrated = true); después, clubs/<id>/. Ver docs/MULTICLUB.md (fase 2).
const CLUB = require('../club-config.js');
let admin = null;
function getAdmin() {
  admin = admin || require('firebase-admin');
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return admin;
}
// Colecciones que pertenecen a un club (las mismas que CLUB_COLLS en app.js)
const CLUB_COLLS = ['meta', 'public', 'claims', 'profiles', 'photos', 'phones', 'pushTokens', 'reports', 'seasons', 'private', 'invites'];
const isClubPath = p => CLUB_COLLS.includes(String(p).split('/')[0]);

// Dónde están hoy los datos del club: '' (raíz) o 'clubs/<id>/'
const validClub = id => /^[A-Za-z0-9_-]{2,40}$/.test(String(id || ''));
// Configuración de un club: la del archivo para el Real Club de Polo; para los demás, su documento clubs/<id>
async function clubConfig(db, clubId = CLUB.id) {
  if (clubId === CLUB.id) return CLUB;
  const d = await db.doc('clubs/' + clubId).get().catch(() => null);
  return CLUB.forClub(clubId, d && d.exists ? d.data() : {});
}
async function dataRoot(db, clubId = CLUB.id) {
  if (clubId !== 'rcpb') return 'clubs/' + clubId + '/';
  const c = await db.doc('clubs/' + clubId).get().catch(() => null);
  return c && c.exists && c.data().migrated === true ? 'clubs/' + clubId + '/' : '';
}
// Traduce una ruta de datos del club a su ruta real (la raíz se calcula una vez por petición)
function pather(root) { return p => (root && isClubPath(p) ? root + p : p); }
// Base de datos «del club»: doc() y collection() traducen las rutas de datos del club a su raíz real
function clubDb(db, P, club, cfg) { return { doc: p => db.doc(P(p)), collection: p => db.collection(P(p)), batch: () => db.batch(), raw: db, P, club, cfg }; }
async function clubDbFor(db, clubId = CLUB.id) { return clubDb(db, pather(await dataRoot(db, clubId)), clubId, await clubConfig(db, clubId)); }
// Clubes con datos en la plataforma (para las tareas nocturnas): el original y los dados de alta con su configuración
async function allClubs(db) {
  const ids = new Set([CLUB.id]);
  (await db.collection('clubs').get()).forEach(d => { const x = d.data() || {}; if (x.activation || x.setup || x.createdAt) ids.add(d.id); });
  return [...ids];
}

const lower = s => String(s || '').toLowerCase();
const httpErr = (status, msg) => Object.assign(new Error(msg), { status });

// Quién llama: cuenta verificada, administrador, gestor, ficha y si está activo en el club
async function caller(req, opts = {}) {
  const A = getAdmin(), db = A.firestore();
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw httpErr(401, 'Falta la sesión');
  const user = await A.auth().verifyIdToken(token);
  if (user.email_verified !== true) throw httpErr(403, 'Correo sin verificar');
  // El club de la petición: lo envía la app en la cabecera X-Club (el que tiene abierto); por defecto, el original
  const hdr = req.headers['x-club'], clubId = opts.club || (validClub(hdr) ? hdr : CLUB.id);
  const root = await dataRoot(db, clubId), P = pather(root);
  const [a1, a2, m, u, meta] = await Promise.all([db.doc('admins/' + user.uid).get(), db.doc('admins/' + email).get(),
    db.doc('clubs/' + clubId + '/members/' + user.uid).get(), db.doc('users/' + user.uid).get(), db.doc(P('meta/app')).get()]);
  const member = m.exists ? m.data() : null, metaD = meta.exists ? meta.data() : {};
  const active = !member || member.status !== 'inactivo';
  const isAdmin = a1.exists || a2.exists;
  const isManager = active && (((member && member.roles) || []).includes('gestor') || (metaD.managerEmails || []).includes(email));
  let pid = !active ? null : root ? (member && member.pid) || null : (u.exists ? u.data().pid : null) || null;
  // En la raíz, la ficha cuenta solo si su vínculo sigue siendo de esta cuenta (igual que rootLinked en firestore.rules)
  if (pid && !root) { const c = await db.doc('claims/' + pid).get(); if (!c.exists || c.data().uid !== user.uid) pid = null; }
  const cfg = await clubConfig(db, clubId);
  return { A, db, cdb: clubDb(db, P, clubId, cfg), cfg, user, email, clubId, root, P, meta: metaD, member, active, isAdmin, isManager, isStaff: isAdmin || isManager, pid };
}
// Papel en un equipo (temporada S), con los mismos criterios que las reglas
function teamRole(ctx, S) {
  const ids = S && Array.isArray(S.memberIds) ? S.memberIds : null;
  const captain = !!(ctx.pid && (S.captains || []).includes(ctx.pid));
  const member = !!(ctx.pid && (ids === null || ids.includes(ctx.pid)));
  const teamManage = ((S.rules || {}).teamManage) !== false;
  return { captain, member, canPrivate: ctx.isStaff || captain, canEdit: ctx.isStaff || captain || (teamManage && member), canRead: ctx.isStaff || member || captain };
}
// Atajo: exige permiso sobre un equipo y devuelve su temporada
async function needTeam(req, season, need = 'canEdit') {
  if (!/^[\w-]{2,40}$/.test(String(season || ''))) throw httpErr(400, 'season');
  const ctx = await caller(req);
  const snap = await ctx.db.doc(ctx.P('seasons/' + season)).get();
  if (!snap.exists) throw httpErr(404, 'season-not-found');
  const S = snap.data(), role = teamRole(ctx, S);
  if (!role[need]) throw httpErr(403, 'forbidden');
  return { ...ctx, S, role, ref: snap.ref };
}
// Historial de auditoría del club (lo escribe el servidor en nombre de quien llama)
async function audit(ctx, action, data = {}) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await ctx.db.doc('clubs/' + ctx.clubId + '/audit/' + id).set({ action, data, by: ctx.user.uid, byEmail: ctx.email, at: Date.now(), via: 'servidor' }).catch(() => {});
}
const sendErr = (res, e) => res.status(e.status || (e.code && String(e.code).startsWith('auth/') ? 401 : 500)).json({ error: e.message || 'error' });

module.exports = { getAdmin, CLUB_COLLS, isClubPath, dataRoot, pather, clubDb, clubDbFor, clubConfig, allClubs, validClub, caller, teamRole, needTeam, audit, httpErr, sendErr };
