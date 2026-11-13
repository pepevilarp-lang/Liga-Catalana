// Aviso por correo de una solicitud de acceso nueva (pantalla de entrada → «Solicitar acceso»).
// La llama la app justo después de crear clubRequests/<uid>. Destinatarios:
//   - Club activo en esta app (club-config.js → id):
//       · jugador con ficha propuesta: los capitanes de ese equipo y los gestores del club
//       · jugador sin ficha: los gestores del club (meta/app.managerEmails)
//   - Gestor (de cualquier club): la plataforma, es decir PLATFORM_EMAILS (Dossau Lab) y los administradores.
//     y, si el club aún no tiene gestores, los administradores.
//   - Club que todavía no está activo: los administradores de la plataforma (colección admins con correo
//     y, opcionalmente, PLATFORM_EMAILS en Vercel, separados por comas).
// Cada solicitud se avisa una sola vez (campo notifiedAt).
const CLUB = require('../club-config.js');
const { getAdmin, clubDbFor } = require('./_auth.js');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isMail = s => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || ''));

async function recipients(db, r, cdb = db) {
  const admins = (await db.collection('admins').get()).docs.map(d => d.id).filter(isMail);
  const platform = String(process.env.PLATFORM_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(isMail);
  // Los gestores los valida la plataforma (Dossau Lab): PLATFORM_EMAILS y administradores
  if (r.clubId !== CLUB.id || r.role !== 'jugador') return { to: [...new Set([...platform, ...admins])], who: 'plataforma' };
  const meta = (await cdb.doc('meta/app').get()).data() || {};
  const managers = (meta.managerEmails || []).filter(isMail);
  let captains = [];
  if (r.role === 'jugador' && r.season) {
    const s = (await cdb.doc('seasons/' + r.season).get()).data() || {};
    const claims = await Promise.all((s.captains || []).map(pid => cdb.doc('claims/' + pid).get()));
    captains = claims.map(c => c.exists && c.data().email).filter(isMail);
  }
  const to = [...new Set([...captains, ...managers])];
  return { to: to.length ? to : [...new Set([...platform, ...admins])], who: captains.length ? 'capitanes y gestión' : to.length ? 'gestión' : 'plataforma' };
}

const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9ñ ]+/g, ' ').split(/\s+/).filter(w => w.length > 1);
async function findPlayers(cdb, first, last) {
  const F = norm(first), L = norm(last);
  if (!F.length || !L.length || String(first).length > 40 || String(last).length > 60) return [];
  const meta = (await cdb.doc('meta/app').get()).data() || {}, season = meta.current || '';
  const R = require('./_report.js'), teams = R.clubTeams(meta), roster = ((await cdb.doc('public/roster').get()).data() || {}).teams || {};
  const out = new Map();
  for (const t of teams) {
    let list = roster[t.id] || [];
    if (!list.length && season) { const S = (await cdb.doc('seasons/' + R.docIdFor(t.id, season)).get()).data() || {}; list = (S.players || []).filter(p => p.active !== false); }
    for (const p of list) {
      const n = norm(p.full || p.name);
      if (!(F.every(x => n.includes(x)) && L.some(x => n.includes(x)))) continue;
      const m = out.get(p.id) || { pid: p.id, name: p.name, teams: [] };
      m.teams.push({ id: t.id, name: t.name, season: season ? R.docIdFor(t.id, season) : '' }); out.set(p.id, m);
    }
  }
  const list = [...out.values()].slice(0, 5);
  const cl = await Promise.all(list.map(m => cdb.doc('claims/' + m.pid).get()));
  return list.map((m, i) => ({ ...m, claimed: cl[i].exists }));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(501).json({ error: 'Falta FIREBASE_SERVICE_ACCOUNT en Vercel' });
  try {
    const A = getAdmin(), db = A.firestore();
    const user = await A.auth().verifyIdToken(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    // Buscar la ficha por nombre y apellidos (pantalla «¿Cómo te llamas?»): quien aún no es del club no puede leer las
    // plantillas, así que se busca aquí y solo se devuelven fichas que coinciden en el nombre y en algún apellido.
    const body0 = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (body0.action === 'match') {
      if (user.email_verified !== true) return res.status(403).json({ error: 'Correo sin verificar' });
      return res.status(200).json({ matches: await findPlayers(await clubDbFor(db), body0.first, body0.last) });
    }
    const ref = db.doc('clubRequests/' + user.uid), snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'No hay ninguna solicitud' });
    const r = snap.data();
    if (r.status !== 'pendiente') return res.status(200).json({ ok: true, skipped: 'no pendiente' });
    // Un aviso por solicitud; «Reenviar el aviso» lo repite como mucho 5 veces y no antes de 2 minutos
    const body = body0;
    if (r.notifiedAt && !body.resend) return res.status(200).json({ ok: true, skipped: 'ya avisado', who: r.notifiedWho });
    if (r.notifiedAt && Date.now() - r.notifiedAt < 120000) return res.status(200).json({ ok: true, skipped: 'reciente', who: r.notifiedWho });
    if ((r.notifyCount || (r.notifiedAt ? 1 : 0)) >= 5) return res.status(429).json({ ok: false, error: 'Ya se ha avisado 5 veces' });
    if (!require('./_mail.js').via()) return res.status(501).json({ error: 'El envío de correo no está configurado en Vercel' });
    const { to, who } = await recipients(db, r, await clubDbFor(db));
    if (!to.length) return res.status(200).json({ ok: false, error: 'No hay a quién avisar: añade un administrador con correo o PLATFORM_EMAILS' });
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const app = process.env.APP_URL || ('https://' + host);
    const link = r.clubId === CLUB.id ? app + '/#club-ajustes' : app;
    const rol = r.role === 'jugador' ? 'jugador' : 'gestor deportivo';
    const ficha = r.pidName ? `${r.pidName}${r.teamName ? ' (' + r.teamName + ')' : ''}` : '';
    const subject = `Solicitud de acceso: ${r.name || r.email}, ${rol} de ${r.clubName}`;
    const text = [`${r.name || 'Alguien'} (${r.email}) pide entrar en Lliga Catalana como ${rol} de ${r.clubName}.`,
      ficha ? `Dice ser: ${ficha}.` : '', r.msg ? `Mensaje: «${r.msg}»` : '',
      r.clubId === CLUB.id ? `Para validarla: Gestión deportiva → Configuración → Solicitudes de acceso${r.role === 'jugador' ? ', o Gestión → Plantilla si eres capitán' : ''}.\n${link}` : 'Este club aún no está activo en Lliga Catalana: la solicitud queda registrada para darlo de alta.',
      'Si no conoces a esta persona, rechaza la solicitud: no tendrá acceso a ningún dato.'].filter(Boolean).join('\n\n');
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#13241e;max-width:560px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#6b7a73">Lliga Catalana · ${esc(r.clubName)}</p>
      <h2 style="margin:0 0 12px;font-size:20px">Solicitud de acceso como ${esc(rol)}</h2>
      <p style="margin:0 0 8px"><b>${esc(r.name || 'Sin nombre')}</b> · ${esc(r.email)}</p>
      ${ficha ? `<p style="margin:0 0 8px">Dice ser <b>${esc(ficha)}</b>.</p>` : ''}
      ${r.msg ? `<p style="margin:0 0 8px;color:#41534c">«${esc(r.msg)}»</p>` : ''}
      ${r.clubId === CLUB.id ? `<p style="margin:16px 0"><a href="${esc(link)}" style="background:#0F3B2E;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:bold">Revisar la solicitud</a></p>
      <p style="margin:0;color:#6b7a73;font-size:13px">Gestión deportiva → Configuración → Solicitudes de acceso${r.role === 'jugador' ? ' (los capitanes también la ven en Gestión → Plantilla)' : ''}.</p>`
        : `<p style="margin:12px 0 0;color:#41534c">Este club aún no está activo en Lliga Catalana: la solicitud queda registrada para darlo de alta.</p>`}
      <p style="margin:16px 0 0;color:#6b7a73;font-size:13px">Si no conoces a esta persona, rechaza la solicitud: no tendrá acceso a ningún dato.</p></div>`;
    const out = await require('./_mail.js').sendMail({ to, replyTo: r.email, subject, text, html });
    await ref.update({ notifiedAt: Date.now(), notifiedTo: to, notifiedWho: who, notifyCount: (r.notifyCount || (r.notifiedAt ? 1 : 0)) + 1, notifyError: null });
    return res.status(200).json({ ok: true, to: to.length, who, provider: out.provider });
  } catch (e) {
    console.error('access-request', e.message || e);
    return res.status(e.status || (e.code && String(e.code).startsWith('auth/') ? 401 : 500)).json({ error: e.message || 'error' });
  }
};
module.exports._test = { recipients, findPlayers };
