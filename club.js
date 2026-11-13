/* Gestión del club (gestor deportivo y administradores):
   - Usuarios: invitar jugadores y capitanes, reenviar y revocar invitaciones, solicitudes, miembros (desactivar,
     quitar de un equipo, desvincular) e historial de cambios. Fase 1 de docs/MULTICLUB.md.
   - Identidad del club: escudo, nombre de uso, colores, portada y temporada activa. Fase 3.
   - Configuración inicial: lista de pasos con el progreso guardado, para continuar otro día. Fase 4.
   - Migración de los datos a clubs/<id>/ (solo administradores). Fase 2.
   Se carga antes de app.js y usa sus funciones al ejecutarse (como access.js). Los permisos los deciden
   firestore.rules y las funciones del servidor: aquí solo se muestran las acciones permitidas. */
const CM = { inv: null, invSub: null, mem: null, memSub: null, aud: null, audSub: null,
  f: { team: '', pid: '', role: 'jugador', email: '' }, busy: {}, mail: {}, idn: null, mig: null, open: {} };
function cmReset() { ['invSub', 'memSub', 'audSub'].forEach(k => { try { CM[k] && CM[k](); } catch (e) {} CM[k] = null; }); CM.inv = CM.mem = CM.aud = null; CM.idn = null; }
function cmSubs() {
  if (!canClub()) return;
  if (!CM.invSub) CM.invSub = B.watchColl('invites', m => { CM.inv = m; softRender(); });
  if (!CM.memSub) CM.memSub = B.watchColl('clubs/' + CLUB.id + '/members', m => { CM.mem = m; softRender(); });
  if (!CM.audSub) CM.audSub = B.watchRecent('clubs/' + CLUB.id + '/audit', 'at', 60, m => { CM.aud = m; softRender(); });
}
const cmSid = tid => docIdFor(tid, viewSeason);
const cmTeam = tid => clubTeams().find(t => t.id === tid);
const cmPlayers = tid => (clubData[tid]?.players || []).filter(p => p.active !== false);
const cmCaptainOf = pid => clubTeams().filter(t => (clubData[t.id]?.captains || []).includes(pid));
const cmTeamsOf = pid => clubTeams().filter(t => (clubData[t.id]?.players || []).some(p => p.id === pid && p.active !== false));
const cmInvState = i => i.usedBy ? 'usada' : i.revoked ? 'revocada' : (i.exp || 0) < Date.now() ? 'caducada' : 'pendiente';
const cmPendingFor = pid => Object.values(CM.inv || {}).some(i => i.pid === pid && cmInvState(i) === 'pendiente');
const cmDays = t => Math.max(0, Math.ceil((t - Date.now()) / 864e5));
const cmChip = (t, k = '') => `<span class="cm-chip ${k}">${esc(t)}</span>`;

/* ===================== USUARIOS ===================== */
function vClubUsuarios() {
  if (!canClub()) return vClub();
  ensureClubSubs(); cmSubs();
  const teams = clubTeams(), inv = Object.entries(CM.inv || {}).map(([code, i]) => ({ code, ...i }));
  const pend = inv.filter(i => cmInvState(i) === 'pendiente').sort((a, b) => (b.at || 0) - (a.at || 0));
  const rows = cmMembers(), off = rows.filter(r => r.off).length;
  const reqN = Object.values(ACC.admin.reqs || {}).filter(r => r.status === 'pendiente' && (isAdmin || r.clubId === CLUB.id)).length;
  return `<div class="wrap club cmu"><div class="pagehead"><p class="qsec">${esc(CLUB.name)}</p><h1>Usuarios</h1>
    <p class="lede">Quién entra en la app del club y con qué papel. Jugadores y capitanes solo entran con una invitación personal; elegir un perfil en la pantalla de entrada no da acceso.</p></div>
    <div class="cm-kpis"><div><b>${rows.length - off}</b><small>Con acceso</small></div><div><b>${pend.length}</b><small>Invitaciones pendientes</small></div><div><b>${reqN}</b><small>Solicitudes</small></div><div><b>${off}</b><small>Desactivados</small></div></div>
    ${cmInviteForm(teams)}
    <section class="sec"><div class="sec-h"><h2>Invitaciones pendientes</h2></div>
      ${pend.length ? `<ul class="cm-list">${pend.map(cmInvRow).join('')}</ul>` : '<div class="empty">No hay invitaciones pendientes.</div>'}
      ${cmOldInvites(inv)}</section>
    ${accRequestsPanel()}
    <section class="sec"><div class="sec-h"><h2>Miembros del club</h2><span class="muted small">${rows.length}</span></div>
      <p class="muted small" style="margin:0 0 8px">Desactivar corta el acceso al instante (también en la base de datos) y se puede deshacer. Quitar de un equipo lo saca de su plantilla. Desvincular libera su ficha para invitar a otra cuenta.</p>
      ${rows.length ? `<ul class="cm-list">${rows.map(cmMemberRow).join('')}</ul>` : '<div class="empty">Aún no hay nadie con acceso.</div>'}</section>
    ${cmHistory()}</div>`;
}
function cmInviteForm(teams) {
  const f = CM.f; if (!f.team || !cmTeam(f.team)) f.team = teams[0]?.id || '';
  const free = cmPlayers(f.team).filter(p => !claims[p.id]).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  if (f.pid && !free.some(p => p.id === f.pid)) f.pid = '';
  const loading = f.team && !clubData.hasOwnProperty(f.team);
  return `<section class="sec"><div class="sec-h"><h2>Invitar</h2></div><div class="panel cm-inv">
    <div class="cm-steps"><span><b>1</b> Equipo</span><span><b>2</b> Jugador de la plantilla</span><span><b>3</b> Papel</span><span><b>4</b> Correo (opcional)</span></div>
    <div class="cm-grid">
      <label>Equipo<select data-cm="f-team">${teams.map(t => `<option value="${esc(t.id)}" ${t.id === f.team ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label>
      <label>Jugador<select data-cm="f-pid" ${loading ? 'disabled' : ''}><option value="">${loading ? 'Cargando…' : free.length ? 'Elige un jugador' : 'Todos tienen acceso'}</option>${free.map(p => `<option value="${esc(p.id)}" ${p.id === f.pid ? 'selected' : ''}>${esc(p.name)}${cmPendingFor(p.id) ? ' (ya invitado)' : ''}</option>`).join('')}</select></label>
      <label>Papel<select data-cm="f-role"><option value="jugador" ${f.role === 'jugador' ? 'selected' : ''}>Jugador</option><option value="capitan" ${f.role === 'capitan' ? 'selected' : ''}>Capitán de este equipo</option></select></label>
      <label>Correo<input type="email" data-cm="f-email" value="${esc(f.email)}" placeholder="nombre@gmail.com" autocomplete="off"></label>
    </div>
    <p class="muted small" style="margin:8px 0 0">${f.role === 'capitan' ? '<b>Capitán:</b> gestiona solo este equipo (convocatorias, resultados, plantilla e invitaciones de su equipo), nunca el club entero. ' : ''}Con correo, solo esa cuenta de Google podrá usarla y la enviamos con el escudo del club. Sin correo, copia el enlace y envíalo tú. Un solo uso, 30 días.
      ¿No aparece? <button class="textlink" data-cm="go-roster" data-t="${esc(f.team)}">Añádelo a la plantilla de ${esc(cmTeam(f.team)?.short || 'este equipo')}</button>.</p>
    <div class="row" style="margin-top:12px;gap:8px"><button class="btn sm brass" data-cm="inv-create" ${!f.pid || CM.busy.create ? 'disabled' : ''}>${CM.busy.create ? 'Creando…' : f.email ? 'Crear y enviar por correo' : 'Crear invitación'}</button></div></div></section>`;
}
function cmInvRow(i) {
  const t = cmTeam(i.team), rol = i.role === 'gestor' ? 'Gestor' : i.role === 'capitan' ? 'Capitán' : 'Jugador', url = accInviteUrl(i.code), m = CM.mail[i.code];
  return `<li class="cm-row"><div class="cm-who">${i.role === 'gestor' ? `<span class="cm-av">${accIco('gestor', 18)}</span>` : avatar({ id: i.pid, name: i.name }, 'sm')}<span><b>${esc(i.role === 'gestor' ? (i.email || 'Gestor deportivo') : i.name || '?')}</b>
      <small>${[t?.short, i.email || 'sin correo', 'de ' + (i.byName || '?'), relTime(i.at), cmDays(i.exp) + ' días para caducar', i.sends ? 'enviada ' + i.sends + (i.sends === 1 ? ' vez' : ' veces') : ''].filter(Boolean).map(esc).join(' · ')}</small></span>${cmChip(rol, i.role || 'jugador')}</div>
    <div class="cm-acts">${accLinkRow(url, 'Enlace de invitación', 'inv-copy-code', i.code, '')}
      ${m?.open ? `<span class="cm-mail"><input type="email" data-cm="mail-to" data-v="${esc(i.code)}" value="${esc(m.to || i.email || '')}" placeholder="nombre@gmail.com"><button class="btn sm" data-cm="mail-send" data-v="${esc(i.code)}" ${m.busy ? 'disabled' : ''}>${m.busy ? 'Enviando…' : 'Enviar'}</button></span>`
        : `<button class="btn sm ghost" data-cm="mail-open" data-v="${esc(i.code)}">${i.sends ? 'Reenviar' : 'Enviar por correo'}</button>`}
      <button class="btn sm ghost danger" data-cm="inv-revoke" data-v="${esc(i.code)}">Revocar</button></div></li>`;
}
function cmOldInvites(inv) {
  const old = inv.filter(i => cmInvState(i) !== 'pendiente').sort((a, b) => (b.usedAt || b.revokedAt || b.exp || 0) - (a.usedAt || a.revokedAt || a.exp || 0)).slice(0, 12);
  if (!old.length) return '';
  return `<details class="fold" data-k="cm-old" ${ui.open?.['cm-old'] ? 'open' : ''}><summary><span class="fl"><b>Usadas, revocadas y caducadas</b><small>${old.length} últimas</small></span><span class="fchev" aria-hidden="true"></span></summary><div class="fbody"><ul class="insights">
    ${old.map(i => `<li><span><b>${esc(i.name || i.email || 'Gestor')}</b> ${cmChip(cmInvState(i), cmInvState(i))}<small>${esc([cmTeam(i.team)?.short, i.email].filter(Boolean).join(' · '))} · creada ${relTime(i.at)}</small></span></li>`).join('')}</ul></div></details>`;
}
// Personas con acceso: fichas vinculadas (claims) y miembros del club (clubs/<id>/members), sin duplicar cuentas
function cmMembers() {
  const by = {}, mem = CM.mem || {};
  Object.entries(claims || {}).forEach(([pid, c]) => { if (!c?.uid) return; by[c.uid] = { uid: c.uid, email: c.email, pid }; });
  Object.entries(mem).forEach(([uid, m]) => { by[uid] = { ...(by[uid] || { uid }), email: (by[uid] || {}).email || m.email, pid: (by[uid] || {}).pid || m.pid || null, m }; });
  (meta?.managers || []).forEach(x => { if (!Object.values(by).some(r => r.email === x.email)) by['mail:' + x.email] = { uid: null, email: x.email, list: true, name: x.name }; });
  return Object.values(by).map(r => {
    const roles = [], m = r.m || {};
    if ((m.roles || []).includes('gestor') || r.list || (meta?.managerEmails || []).includes(r.email)) roles.push('gestor');
    if (r.pid && cmCaptainOf(r.pid).length) roles.push('capitan');
    if (r.pid) roles.push('jugador');
    return { ...r, roles, off: m.status === 'inactivo', name: r.pid ? pname(r.pid) : r.name || '' };
  }).sort((a, b) => (a.off - b.off) || String(a.name || a.email).localeCompare(String(b.name || b.email)));
}
function cmMemberRow(r) {
  const teams = r.pid ? cmTeamsOf(r.pid) : [], caps = r.pid ? cmCaptainOf(r.pid).map(t => t.id) : [];
  const me_ = r.uid && r.uid === authUser?.uid, busy = CM.busy['m-' + (r.uid || r.email)];
  return `<li class="cm-row ${r.off ? 'off' : ''}"><div class="cm-who">${r.pid ? avatar(player(r.pid) || { id: r.pid, name: r.name }, 'sm') : `<span class="cm-av">${accIco('gestor', 18)}</span>`}<span><b>${esc(r.name || r.email)}</b><small>${esc(r.email || '')}${r.off ? ' · desactivado' : ''}${me_ ? ' · tú' : ''}</small></span>
      <span class="cm-roles">${r.roles.map(k => cmChip({ gestor: 'Gestor', capitan: 'Capitán', jugador: 'Jugador' }[k], k)).join('')}</span></div>
    ${teams.length ? `<div class="cm-teams">${teams.map(t => `<span class="cm-team">${esc(t.short)}${caps.includes(t.id) ? (accOfficial(clubData[t.id]).includes(r.pid) ? ' · capitán oficial' : ' · capitán') : ''}${r.off ? '' : `<button class="cm-x" data-cm="team-out" data-pid="${esc(r.pid)}" data-t="${esc(t.id)}" title="Quitar de ${esc(t.short)}" aria-label="Quitar de ${esc(t.short)}">×</button>`}</span>`).join('')}</div>` : ''}
    ${me_ || r.list && !r.uid ? '' : `<div class="cm-acts">${r.uid ? (r.off ? `<button class="btn sm" data-cm="m-on" data-v="${esc(r.uid)}" ${busy ? 'disabled' : ''}>Reactivar</button>` : `<button class="btn sm ghost danger" data-cm="m-off" data-v="${esc(r.uid)}" ${busy ? 'disabled' : ''}>Desactivar</button>`) : ''}
      ${r.pid && claims[r.pid] ? `<button class="btn sm ghost" data-cm="m-unlink" data-pid="${esc(r.pid)}" data-v="${esc(r.uid || '')}">Desvincular ficha</button>` : ''}</div>`}</li>`;
}
const CM_ACT = { 'invitacion-creada': 'Invitación creada', 'invitacion-enviada': 'Invitación enviada por correo', 'invitacion-reenviada': 'Invitación reenviada', 'invitacion-revocada': 'Invitación revocada',
  'invitacion-aceptada': 'Invitación aceptada', capitanes: 'Capitanes cambiados', 'capitan-asignado': 'Capitán asignado', 'miembro-desactivado': 'Acceso desactivado', 'miembro-reactivado': 'Acceso reactivado',
  'ficha-desvinculada': 'Ficha desvinculada', 'equipo-quitado': 'Quitado de un equipo', 'solicitud-aprobada': 'Solicitud aprobada', 'solicitud-rechazada': 'Solicitud rechazada',
  'identidad-actualizada': 'Identidad del club actualizada', 'club-activado': 'Club activado', 'paso-configuracion': 'Paso de la configuración marcado', 'gestor-anadido': 'Gestor añadido', 'gestor-quitado': 'Gestor quitado' };
function cmHistory() {
  const list = Object.values(CM.aud || {}).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 40);
  const what = a => { const d = a.data || {}; return [d.pid ? pname(d.pid) : '', d.team ? cmTeam(d.team)?.short || d.team : '', d.email || '', d.role && d.role !== 'jugador' ? ({ capitan: 'capitán', gestor: 'gestor' }[d.role] || d.role) : ''].filter(Boolean).join(' · '); };
  return `<section class="sec"><div class="sec-h"><h2>Historial de cambios</h2></div>
    ${list.length ? `<ul class="cm-hist">${list.map(a => `<li><b>${esc(CM_ACT[a.action] || (String(a.action || '').startsWith('migracion-') ? 'Migración: ' + a.action.slice(10) : a.action))}</b>${what(a) ? `<span>${esc(what(a))}</span>` : ''}<small>${esc(a.byName || a.byEmail || '')}${a.via === 'servidor' ? ' (servidor)' : ''} · ${relTime(a.at)}</small></li>`).join('')}</ul>`
      : '<div class="empty">Aún no hay cambios registrados. A partir de ahora quedan aquí las invitaciones, cambios de capitán, accesos y desactivaciones.</div>'}</section>`;
}

/* ---------- Acciones de usuarios ---------- */
async function cmCreateInvite() {
  const f = CM.f; if (!f.pid || !f.team) return;
  const email = String(f.email || '').trim().toLowerCase();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast('Revisa el correo');
  CM.busy.create = true; renderQuiet();
  try {
    if (f.role === 'capitan') await cmSetCaptain(f.team, f.pid, true);
    const code = await accMakeInvite(f.pid, f.team, { role: f.role, ...(email ? { email } : {}) });
    if (email) await cmSendMail(code, email, true);
    else { try { await navigator.clipboard.writeText(accInviteUrl(code)); toast('Invitación creada y enlace copiado'); } catch (e) { toast('Invitación creada'); } }
    CM.f = { team: f.team, pid: '', role: 'jugador', email: '' };
  } catch (e) { toast('No se ha podido crear (' + (e?.code || e?.message || 'error') + ')'); }
  CM.busy.create = false; renderQuiet();
}
// Capitanes: solo los asigna la gestión (las reglas no dejan a nadie más cambiar seasons/<s>.captains)
async function cmSetCaptain(tid, pid, on) {
  const d = clubData[tid]; if (!d) throw new Error('Equipo sin cargar');
  const cur = d.captains || [], next = on ? [...new Set([...cur, pid])] : cur.filter(x => x !== pid);
  if (next.join() === cur.join()) return;
  const off = accOfficial(d), offNext = on ? [...new Set([...off, pid])] : off.filter(x => x !== pid);
  await B.update('seasons/' + cmSid(tid), { captains: next, officialCaptains: offNext });
  accAudit(on ? 'capitan-asignado' : 'capitanes', { team: tid, pid, antes: cur, ahora: next });
  await accSyncCaptainPids(true, { [tid]: next });
}
async function cmSendMail(code, to, fresh) {
  CM.mail[code] = { ...(CM.mail[code] || {}), busy: true, to }; renderQuiet();
  try {
    const tok = await B.idToken(); if (!tok) throw new Error('Solo con la base de datos real: copia el enlace');
    const r = await fetch('/api/send-invite', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ code, email: to }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'error ' + r.status);
    delete CM.mail[code]; toast(fresh ? 'Invitación creada y enviada a ' + to : 'Invitación enviada a ' + to);
  } catch (e) { CM.mail[code] = { open: true, to, busy: false }; toast('No se ha enviado: ' + (e?.message || 'error') + (fresh ? '. La invitación está creada: copia el enlace.' : '')); }
  renderQuiet();
}
async function cmMemberStatus(uid, on) {
  if (!on && !confirm('¿Desactivar el acceso de esta cuenta? Dejará de ver los datos del club al instante. Se puede reactivar.')) return;
  CM.busy['m-' + uid] = true; renderQuiet();
  await safe(async () => {
    await B.merge('clubs/' + CLUB.id + '/members/' + uid, { status: on ? 'activo' : 'inactivo', statusBy: authUser.email, statusAt: Date.now(), uid, ...(CM.mem?.[uid] ? {} : { email: Object.values(claims).find(c => c.uid === uid)?.email || '', roles: ['jugador'], pid: Object.keys(claims).find(k => claims[k].uid === uid) || null, at: Date.now() }) });
    accAudit(on ? 'miembro-reactivado' : 'miembro-desactivado', { uid, pid: Object.keys(claims).find(k => claims[k].uid === uid) || null });
  }, on ? 'Acceso reactivado' : 'Acceso desactivado');
  delete CM.busy['m-' + uid]; renderQuiet();
}
async function cmUnlink(pid, uid) {
  if (!confirm('¿Desvincular a ' + pname(pid) + ' de su cuenta? Dejará de entrar con esta ficha y podrás invitar a otra cuenta.')) return;
  await safe(async () => {
    await B.del('claims/' + pid);
    if (uid && CM.mem?.[uid]) await B.merge('clubs/' + CLUB.id + '/members/' + uid, { pid: null, roles: (CM.mem[uid].roles || []).filter(r => r !== 'jugador') });
    accAudit('ficha-desvinculada', { pid, uid: uid || null });
  }, 'Ficha desvinculada');
}
async function cmTeamOut(pid, tid) {
  const d = clubData[tid]; if (!d) return; const t = cmTeam(tid);
  if (!confirm('¿Quitar a ' + pname(pid) + ' de ' + (t?.short || tid) + '? Sale de la plantilla de este equipo (sus resultados se conservan).')) return;
  const players = d.players.map(p => p.id === pid ? { ...p, active: false } : p), memberIds = players.filter(p => p.active !== false).map(p => p.id);
  const captains = (d.captains || []).filter(x => x !== pid);
  await safe(async () => {
    await B.update('seasons/' + cmSid(tid), { players, memberIds, captains });
    accAudit('equipo-quitado', { pid, team: tid });
    if (captains.length !== (d.captains || []).length) await accSyncCaptainPids(true, { [tid]: captains });
  }, 'Quitado de ' + (t?.short || 'el equipo'));
}
async function cmRevoke(code) {
  if (!confirm('¿Revocar esta invitación? El enlace dejará de funcionar.')) return;
  const i = CM.inv?.[code] || {};
  await safe(async () => { await B.update('invites/' + code, { revoked: true, revokedAt: Date.now(), revokedBy: authUser.email }); accAudit('invitacion-revocada', { code, pid: i.pid || null, team: i.team || null }); }, 'Invitación revocada');
}

/* ===================== IDENTIDAD DEL CLUB ===================== */
function cmIdn() { if (!CM.idn) { const d = ACC.admin.brand || {}, c = accBrand(); CM.idn = { name: d.name || CLUB.name, shortName: d.shortName || '', primary: c.primary, secondary: c.secondary, crest: d.crest || '', crestSm: d.crestSm || '', crestPng: d.crestPng || '', cover: d.cover || '', email: d.contact?.email || '', phone: d.contact?.phone || '', web: d.contact?.web || '', season: meta?.current || viewSeason, dirty: false }; } return CM.idn; }
function cmIdentityPanel() {
  const I = cmIdn(), crest = I.crest || ASSET.crestSm, seasons = [...new Set([...(meta?.seasons || []), meta?.current || viewSeason].filter(Boolean))];
  return `<section class="sec" id="cm-identity"><div class="sec-h"><h2>Identidad del club</h2></div><div class="panel cm-idn">
    <div class="cm-prev" style="--p:${esc(I.primary)};--s:${esc(I.secondary)}">${I.cover ? `<img class="cm-cover" src="${esc(I.cover)}" alt="">` : ''}<div class="cm-prev-bar"><img src="${esc(crest)}" alt=""><span><b>${esc(I.shortName || CLUB.medium)}</b><small>Lliga Catalana ${esc(I.season)}</small></span></div><div class="cm-prev-btn">Así se verá</div></div>
    <p class="muted small" style="margin:10px 0">Se aplica al entrar en el club (antes de validar el acceso no se muestra), en la cabecera, la intro, los carteles de partido, el PDF del informe y los correos.</p>
    <div class="cm-grid">
      <label>Escudo<span class="cm-file"><img src="${esc(crest)}" alt=""><label class="btn sm ghost">Subir escudo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-cm="crest-file" hidden></label></span><small class="muted">PNG con fondo transparente, cuadrado, 512 px o más.</small></label>
      <label>Portada<span class="cm-file">${I.cover ? `<img class="wide" src="${esc(I.cover)}" alt="">` : ''}<label class="btn sm ghost">${I.cover ? 'Cambiar' : 'Subir portada'}<input type="file" accept="image/png,image/jpeg,image/webp" data-cm="cover-file" hidden></label>${I.cover ? '<button class="textlink" data-cm="cover-del">Quitar</button>' : ''}</span><small class="muted">Una foto horizontal de las pistas o del equipo.</small></label>
      <label>Nombre oficial<input type="text" data-cm-i="name" value="${esc(I.name)}" maxlength="80"></label>
      <label>Nombre corto<input type="text" data-cm-i="shortName" value="${esc(I.shortName)}" placeholder="${esc(ACC_DEF.medium || CLUB.medium)}" maxlength="30"></label>
      <label class="acc-col">Color principal<input type="color" data-cm-i="primary" value="${esc(I.primary)}"></label>
      <label class="acc-col">Color secundario<input type="color" data-cm-i="secondary" value="${esc(I.secondary)}"></label>
      <label>Temporada activa<select data-cm-i="season">${seasons.map(x => `<option ${x === I.season ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <label>Correo de contacto<input type="email" data-cm-i="email" value="${esc(I.email)}" placeholder="tenis@club.cat"></label>
      <label>Teléfono<input type="tel" data-cm-i="phone" value="${esc(I.phone)}"></label>
      <label>Web<input type="url" data-cm-i="web" value="${esc(I.web)}" placeholder="https://"></label>
    </div>
    <div class="row" style="margin-top:12px;gap:8px"><button class="btn sm brass" data-cm="idn-save" ${CM.busy.idn ? 'disabled' : ''}>${CM.busy.idn ? 'Guardando…' : 'Guardar identidad'}</button>${I.dirty ? '<span class="muted small">Cambios sin guardar</span>' : ''}<button class="btn sm ghost" data-cm="idn-reset">Volver a los colores originales</button></div></div></section>`;
}
// Redimensiona una imagen a un data URL (el escudo en PNG/WebP; la portada en JPEG) para guardarla en clubs/<id>
function cmImg(file, maxW, maxH, type, q) {
  return new Promise((ok, ko) => {
    const r = new FileReader(); r.onerror = ko;
    r.onload = () => { const im = new Image(); im.onerror = () => ko(new Error('Imagen no válida')); im.onload = () => {
      const k = Math.min(1, maxW / im.width, maxH / im.height), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
      const g = c.getContext('2d'); if (type === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); }
      g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL(type, q)); }; im.src = r.result; };
    r.readAsDataURL(file);
  });
}
async function cmCrestFile(file) {
  if (!file) return; if (file.size > 8e6) return toast('La imagen es demasiado grande (máximo 8 MB)');
  try { const I = cmIdn();
    I.crest = await cmImg(file, 384, 384, 'image/webp', .9); if (!I.crest.startsWith('data:image/webp')) I.crest = await cmImg(file, 384, 384, 'image/png');
    I.crestSm = await cmImg(file, 128, 128, 'image/png'); I.crestPng = await cmImg(file, 640, 320, 'image/png');   // el PDF necesita PNG
    I.dirty = true; renderQuiet(); toast('Escudo listo: pulsa «Guardar identidad»');
  } catch (e) { toast(e.message || 'No se ha podido leer la imagen'); }
}
async function cmCoverFile(file) {
  if (!file) return; try { const I = cmIdn(); let q = .8, d = await cmImg(file, 1400, 800, 'image/jpeg', q); while (d.length > 360000 && q > .4) { q -= .1; d = await cmImg(file, 1400, 800, 'image/jpeg', q); }
    I.cover = d; I.dirty = true; renderQuiet(); } catch (e) { toast(e.message || 'No se ha podido leer la imagen'); }
}
async function cmSaveIdentity() {
  const I = cmIdn(), hex = h => /^#[0-9a-f]{6}$/i.test(h) ? h.toUpperCase() : null;
  const doc = { name: String(I.name || '').trim() || CLUB.name, shortName: String(I.shortName || '').trim(), colors: { primary: hex(I.primary) || ACC_BASE.primary, secondary: hex(I.secondary) || ACC_BASE.secondary },
    crest: I.crest || '', crestSm: I.crestSm || '', crestPng: I.crestPng || '', cover: I.cover || '', contact: { email: I.email.trim(), phone: I.phone.trim(), web: I.web.trim() }, updatedAt: Date.now(), updatedBy: authUser.email };
  if (JSON.stringify(doc).length > 900000) return toast('Las imágenes ocupan demasiado: usa un escudo o una portada más ligeros');
  CM.busy.idn = true; renderQuiet();
  await safe(async () => {
    await B.merge('clubs/' + CLUB.id, doc);
    ACC.admin.brand = { ...(ACC.admin.brand || {}), ...doc }; accStore.set('lc-brand-' + CLUB.id, JSON.stringify(doc.colors)); accIdentity(ACC.admin.brand); accApplyBrand();
    if (I.season && I.season !== meta?.current) await saveMeta({ current: I.season });
    accAudit('identidad-actualizada', { season: I.season }); I.dirty = false;
  }, 'Identidad del club guardada');
  CM.busy.idn = false; render();
}

/* ===================== CONFIGURACIÓN INICIAL ===================== */
// Cada paso se da por hecho mirando los datos reales (no hay que marcarlo a mano); «Marcar como hecho» queda guardado en clubs/<id>.setup
function cmSetup() {
  const teams = clubTeams(), d = t => clubData[t.id], loaded = teams.every(t => clubData.hasOwnProperty(t.id)), st = (ACC.admin.brand || {}).setup || {};
  const brand = ACC.admin.brand || {}, all = f => { const ts = teams.filter(t => d(t)); return loaded && ts.length > 0 && ts.every(t => f(d(t), t)); };   // equipos con temporada (igual que el servidor)
  const act = x => x.players.filter(p => p.active !== false);
  // Orden obligatorio, igual para todos los clubes: estructura deportiva → capitanes oficiales → activar → jugadores
  const S = [
    { k: 'identidad', t: 'Identidad del club', why: 'Escudo, colores y nombre corto: así cada club tiene su propia app.', ex: `<span class="cm-exh" style="--p:${esc(accBrand().primary)}"><img src="${esc(ASSET.crestSm)}" alt="">${esc(CLUB.medium)}</span>`, done: !!(brand.crest || brand.shortName || brand.colors), go: 'cm-identity', btn: 'Configurar' },
    { k: 'temporada', t: 'Temporada', why: 'La temporada en curso. Al cambiar de año se crea otra y se conserva el histórico.', ex: cmChip(meta?.current || '2026-27'), done: !!meta?.current, go: 'cm-identity', btn: 'Elegir' },
    { k: 'equipos', t: 'Equipos', why: 'Los equipos del club en la Lliga Catalana. Cada uno tiene su calendario, plantilla, resultados y MVP.', ex: teams.slice(0, 3).map(t => cmChip(t.short)).join('') || cmChip('Absoluto A'), done: teams.length > 0, go: 'ctlist', btn: 'Revisar' },
    { k: 'competicion', t: 'Categoría y competición', why: 'La categoría y el grupo de la FCT de cada equipo: con él se importan calendario y plantilla oficiales.', ex: cmChip('Absoluto') + cmChip('Grupo FCT 2'), done: all((x, t) => t.cat && fctTeamInfo(t).grp), href: '#club-fct', btn: 'Ir a Federació', hard: true },
    { k: 'plantillas', t: 'Plantillas oficiales de la FCT', why: 'Se importan de la FCT con nombre y licencia: con ellas los jugadores se identifican solos al entrar.', ex: cmChip('8 jugadores · con licencia'), done: all(x => act(x).length > 0 && act(x).some(p => p.lic)), href: '#club-fct', btn: 'Importar', hard: true },
    { k: 'capitanes', t: 'Capitanes oficiales', why: 'La FCT no publica el capitán: márcalo en la plantilla de cada equipo. Al registrarse recibirá el rol solo.', ex: cmChip('Capitán oficial', 'capitan'), done: all(x => accOfficial(x).length > 0), href: '#club-equipos', btn: 'Marcar', hard: true },
    { k: 'calendario', t: 'Calendario y jornadas', why: 'Se descarga de la FCT; también se puede cargar desde un documento.', ex: cmChip('Jornada 1 · 15 nov'), done: all(x => (x.fixtures || []).length > 0), href: '#club-fct', btn: 'Sincronizar' },
    { k: 'revisar', t: 'Revisar asociaciones', why: 'Comprueba que cada jugador está en su equipo y que no hay fichas duplicadas ni sin licencia.', ex: cmChip('Polo A · 9') + cmChip('Polo B · 7'), done: !!(st.done || {}).revisar, href: '#club-equipos', btn: 'Revisar' },
  ].map(x => ({ ...x, done: x.done || (!x.hard && !!(st.done || {})[x.k]), manual: !x.done && !x.hard && !!(st.done || {})[x.k] }));
  const act0 = (ACC.admin.brand || {}).activation || {};
  return { steps: S, n: S.filter(x => x.done).length, active: !!act0.at, act0, st, loaded, ready: S.filter(x => x.hard || ['temporada', 'equipos'].includes(x.k)).every(x => x.done) };
}
function cmSetupCard() {
  if (!canClub()) return ''; const U = cmSetup(); if (U.active) return '';
  const next = U.steps.find(x => !x.done);
  return `<a class="cm-setcard" href="#club-ajustes" data-cm="to-setup"><span class="cm-ring" style="--v:${Math.round(U.n / U.steps.length * 100)}"><b>${U.n}/${U.steps.length}</b></span>
    <span><small>Configuración inicial del club</small><b>${next ? 'Siguiente: ' + esc(next.t) : 'Todo listo: revisa y activa el club'}</b><em>Puedes dejarla a medias y seguir otro día: el progreso se guarda.</em></span><span class="acc-arr">›</span></a>`;
}
function cmSetupPanel() {
  const U = cmSetup(), pct = Math.round(U.n / U.steps.length * 100), open = !U.active || CM.open.setup;
  if (!open) return `<section class="sec" id="cm-setup"><div class="panel cm-setdone"><span>${svgi('check', 16, 2.6)}</span><span><b>Registro de jugadores activado</b><small>${U.act0.at ? 'Desde ' + new Date(U.act0.at).toLocaleDateString('es-ES') : ''}${U.act0.by ? ' por ' + esc(U.act0.by) : ''}</small></span><button class="textlink" data-cm="setup-show">Ver la configuración inicial</button></div></section>`;
  return `<section class="sec" id="cm-setup"><div class="sec-h"><h2>Configuración inicial</h2><span class="muted small">${U.n} de ${U.steps.length}</span></div>
    <div class="cm-bar"><i style="width:${pct}%"></i></div><p class="muted small" style="margin:6px 0 12px">Primero la estructura deportiva del club; después entran los jugadores. Cada paso se marca solo cuando los datos están y puedes seguir otro día. Los marcados como obligatorios no se pueden saltar.</p>
    <ol class="cm-steplist">${U.steps.map((x, i) => `<li class="${x.done ? 'done' : ''}"><span class="cm-n">${x.done ? svgi('check', 14, 2.8) : i + 1}</span><div><b>${esc(x.t)}</b><p>${esc(x.why)}</p><div class="cm-ex">${x.ex}</div></div>
      <div class="cm-sact">${x.done ? (x.manual ? `<button class="textlink" data-cm="step-undo" data-v="${x.k}">Desmarcar</button>` : '<span class="muted small">Hecho</span>') : `${x.href ? `<a class="btn sm" href="${x.href}">${x.btn}</a>` : `<button class="btn sm" data-cm="scroll" data-v="${x.go}">${x.btn}</button>`}${x.hard ? '<small class="muted">Obligatorio</small>' : `<button class="textlink" data-cm="step-done" data-v="${x.k}">${x.k === 'revisar' ? 'Revisado' : 'Marcar como hecho'}</button>`}`}</div></li>`).join('')}
      <li class="${U.active ? 'done' : ''}"><span class="cm-n">${U.active ? svgi('check', 14, 2.8) : 9}</span><div><b>Activar el registro de jugadores</b><p>${U.active ? 'Los jugadores ya pueden entrar identificándose con su licencia.' : U.ready ? 'La estructura mínima está lista. Al activarlo, los jugadores podrán entrar identificándose con su nombre y licencia.' : 'Antes hay que completar los pasos obligatorios: competición, plantillas oficiales y capitanes oficiales de cada equipo.'}</p>${CM.actMissing?.length ? `<ul class="cm-miss">${CM.actMissing.map(m => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}</div>
        <div class="cm-sact">${U.active ? '<span class="muted small">Activado</span>' : `<button class="btn sm brass" data-cm="activate" ${U.ready && !CM.busy.act ? '' : 'disabled'}>${CM.busy.act ? 'Comprobando…' : 'Activar'}</button>`}</div></li></ol></section>`;
}
async function cmStep(k, on) {
  const st = (ACC.admin.brand || {}).setup || {}, done = { ...(st.done || {}) }; if (on) done[k] = true; else delete done[k];
  await safe(async () => { await B.merge('clubs/' + CLUB.id, { setup: { done } }); ACC.admin.brand = { ...(ACC.admin.brand || {}), setup: { ...st, done } }; accAudit('paso-configuracion', { paso: k, hecho: !!on }); }, on ? 'Paso marcado' : 'Paso desmarcado');
  renderQuiet();
}
async function cmActivate() {
  CM.busy.act = true; CM.actMissing = null; renderQuiet();
  try {
    const t = await B.idToken(); let j;
    if (t) { const r = await fetch('/api/access-request', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'activate' }) });
      j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'error ' + r.status); }
    else { const U = cmSetup(); j = U.ready ? { ok: true, activated: Date.now() } : { ok: false, missing: U.steps.filter(x => x.hard && !x.done).map(x => x.t) };
      if (j.ok) { await B.merge('clubs/' + CLUB.id, { activation: { at: j.activated, by: authUser.email } }); accAudit('club-activado', {}); } }
    if (!j.ok) { CM.actMissing = j.missing || []; toast('Aún falta completar la estructura del club'); }
    else { ACC.admin.brand = { ...(ACC.admin.brand || {}), activation: { at: j.activated, by: authUser.email } }; toast('Registro de jugadores activado'); }
  } catch (e) { toast('No se ha podido activar: ' + e.message); }
  CM.busy.act = false; render();
}

/* ===================== MIGRACIÓN (solo administradores) ===================== */
function cmMigrationPanel() {
  if (!isAdmin) return '';
  const M = CM.mig || {}, migrated = !!(ACC.admin.brand || {}).migrated, r = M.res;
  return `<section class="sec"><div class="sec-h"><h2>Datos del club (migración multiclub)</h2></div><div class="panel">
    <p class="muted small" style="margin:0 0 10px">Hoy los datos de ${esc(CLUB.medium)} están ${migrated ? '<b>en clubs/' + esc(CLUB.id) + '/</b> (migrados)' : '<b>en la raíz de la base de datos</b>'}. La migración los copia a su espacio propio sin borrar nada; «Pasar a la copia» cambia la app, el servidor y las reglas a la vez, y «Volver a la raíz» lo deshace con los cambios hechos mientras tanto. Antes, publica las reglas nuevas.</p>
    <div class="row" style="gap:6px;flex-wrap:wrap">${[['plan', 'Comprobar'], ['backfill', 'Preparar pertenencias'], ...(migrated ? [['verify', 'Verificar'], ['rollback', 'Volver a la raíz']] : [['copy', 'Copiar'], ['verify', 'Verificar'], ['switch', 'Pasar a la copia']])]
      .map(([k, l]) => `<button class="btn sm ${k === 'switch' || k === 'rollback' ? 'brass' : 'ghost'}" data-cm="mig" data-v="${k}" ${M.busy ? 'disabled' : ''}>${M.busy === k ? 'Trabajando…' : l}</button>`).join('')}</div>
    ${r ? `<pre class="cm-pre">${esc(JSON.stringify(r, null, 1).slice(0, 4000))}</pre>` : ''}</div></section>`;
}
async function cmMigrate(action) {
  if ((action === 'switch' || action === 'rollback') && !confirm(action === 'switch' ? '¿Pasar el club a la copia? La app de todos los usuarios usará clubs/' + CLUB.id + '/ desde ahora.' : '¿Volver a la raíz? Se copian a la raíz los cambios hechos en la copia.')) return;
  CM.mig = { busy: action }; renderQuiet();
  try { const tok = await B.idToken(); if (!tok) throw new Error('Solo con la base de datos real');
    const x = await fetch('/api/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok }, body: JSON.stringify({ action }) });
    const j = await x.json().catch(() => ({})); if (!x.ok) throw Object.assign(new Error(j.error || 'error ' + x.status), { detail: j.detail });
    CM.mig = { res: j }; if (action === 'switch' || action === 'rollback') { toast('Hecho: recargando'); setTimeout(() => location.reload(), 1200); }
  } catch (e) { CM.mig = { res: { error: e.message, detail: e.detail } }; }
  renderQuiet();
}

/* ===================== Eventos ===================== */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-cm]'); if (!el || el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type !== 'button')) return;
  const a = el.dataset.cm, v = el.dataset.v;
  if (a === 'inv-create') cmCreateInvite();
  else if (a === 'mail-open') { CM.mail[v] = { open: true, to: CM.inv?.[v]?.email || '' }; renderQuiet(); setTimeout(() => document.querySelector(`[data-cm="mail-to"][data-v="${v}"]`)?.focus(), 30); }
  else if (a === 'mail-send') { const to = (document.querySelector(`[data-cm="mail-to"][data-v="${v}"]`)?.value || '').trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return toast('Revisa el correo'); cmSendMail(v, to); }
  else if (a === 'inv-revoke') cmRevoke(v);
  else if (a === 'm-off' || a === 'm-on') cmMemberStatus(v, a === 'm-on');
  else if (a === 'm-unlink') cmUnlink(el.dataset.pid, v);
  else if (a === 'team-out') cmTeamOut(el.dataset.pid, el.dataset.t);
  else if (a === 'go-roster') { const t = el.dataset.t; ui.adminTab = 'plantilla'; if (t && t !== teamId) switchTeam(t); location.hash = '#admin'; }
  else if (a === 'idn-save') cmSaveIdentity();
  else if (a === 'idn-reset') { const I = cmIdn(); I.primary = (CLUB.colors || ACC_BASE).primary || ACC_BASE.primary; I.secondary = (CLUB.colors || ACC_BASE).secondary || ACC_BASE.secondary; I.dirty = true; renderQuiet(); }
  else if (a === 'cover-del') { cmIdn().cover = ''; cmIdn().dirty = true; renderQuiet(); }
  else if (a === 'scroll') { const t = document.getElementById(v); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); t.classList.add('cm-flash'); setTimeout(() => t.classList.remove('cm-flash'), 1600); } }
  else if (a === 'step-done' || a === 'step-undo') cmStep(v, a === 'step-done');
  else if (a === 'activate') cmActivate();
  else if (a === 'setup-show') { CM.open.setup = true; renderQuiet(); }
  else if (a === 'mig') cmMigrate(v);
});
document.addEventListener('change', e => {
  const el = e.target; const a = el.dataset?.cm, k = el.dataset?.cmI;
  if (a === 'f-team') { CM.f.team = el.value; CM.f.pid = ''; renderQuiet(); }
  else if (a === 'f-pid') { CM.f.pid = el.value; renderQuiet(); }
  else if (a === 'f-role') { CM.f.role = el.value; renderQuiet(); }
  else if (a === 'crest-file') cmCrestFile(el.files?.[0]);
  else if (a === 'cover-file') cmCoverFile(el.files?.[0]);
  else if (k) { const I = cmIdn(); I[k] = el.value; I.dirty = true; if (el.tagName === 'INPUT' && el.type !== 'color') return;   // texto: sin repintar (el cambio llega al salir del campo)
    if (k === 'primary' || k === 'secondary') { const keep = ACC.admin.brand; ACC.admin.brand = { ...(keep || {}), colors: { primary: I.primary, secondary: I.secondary } }; accApplyBrand(); ACC.admin.brand = keep; } renderQuiet(); }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset?.cm === 'f-email') { const had = !!CM.f.email; CM.f.email = el.value; if (had !== !!CM.f.email) { const b = document.querySelector('[data-cm="inv-create"]'); if (b) b.textContent = CM.f.email ? 'Crear y enviar por correo' : 'Crear invitación'; } }
  else if (el.dataset?.cm === 'mail-to') CM.mail[el.dataset.v] = { ...(CM.mail[el.dataset.v] || {}), open: true, to: el.value };
  else if (el.dataset?.cmI && el.type !== 'color' && el.tagName !== 'SELECT') { cmIdn()[el.dataset.cmI] = el.value; cmIdn().dirty = true; }
});
