/* ===================== ACCESO: entrada por rol, sesión, invitaciones, club e identidad =====================
   Se carga antes que app.js y solo define funciones: las llama app.js cuando ya ha preparado su estado.
   Elegir un rol en la pantalla de entrada no da permisos: los roles salen de la base de datos y las reglas
   de Firestore (firestore.rules) son las que deciden. Plan completo: docs/MULTICLUB.md */
'use strict';

const ACC_ROLES = {
  gestor:  { t: 'Gestor deportivo', d: 'Supervisa todos los equipos del club, la Federació y el informe semanal.', home: 'club' },
  capitan: { t: 'Capitán', d: 'Gestiona la convocatoria, los resultados y las actas de tu equipo.', home: 'admin' },
  jugador: { t: 'Jugador', d: 'Tu jornada, tu disponibilidad, tus estadísticas y tu equipo.', home: 'inicio' },
};
const ACC_ORDER = ['gestor', 'capitan', 'jugador'];
const ACC = {
  want: null,        // rol elegido en la pantalla de entrada (antes de comprobarlo)
  ctx: null,         // rol con el que está dentro ahora
  capTeams: null,    // equipos donde es capitán esta temporada (null = sin comprobar)
  capKey: '',
  invite: null,      // código de invitación pendiente
  inv: null,         // invitación leída {state, data}
  invites: {},       // enlaces creados en esta sesión, por jugador
  req: undefined,    // solicitud de gestor del usuario (undefined = sin leer)
  reqSub: null,
  catalog: null, q: '', pick: null,
  menu: false, menuState: 'menu', menuErr: '',
  navDone: false,
  admin: { reqs: null, sub: null, imp: null, brand: null },
};
const accStore = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
};
(function accBoot() {
  ACC.want = accStore.get('lc-acc-want') || accStore.get('lc-last-role');   // en este dispositivo, el último rol con el que entró
  const h = (location.hash || '').slice(1);
  if (/^invitacion-[A-Za-z0-9]{6,}$/.test(h)) { ACC.invite = h.slice(11).toUpperCase(); try { sessionStorage.setItem('lc-invite', ACC.invite); } catch (e) {} ACC.want = 'jugador'; }
  else { try { ACC.invite = sessionStorage.getItem('lc-invite'); } catch (e) {} }
  // Una página restaurada del historial (botón atrás) no debe enseñar datos de una sesión ya cerrada
  window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
})();

/* ---------- Identidad visual del club: solo los colores de marca, sobre el diseño base ---------- */
function accHex(h) { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim()); return m ? '#' + m[1].toUpperCase() : null; }
function accMix(hex, to, t) { const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
  const c = [16, 8, 0].map(s => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t));
  return '#' + c.map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase(); }
const ACC_BASE = { primary: '#0F3B2E', secondary: '#94722A' };   // los colores de styles.css
function accBrand() { const o = (window.CLUB && CLUB.colors) || {}, d = ACC.admin.brand || {};
  let saved = null; try { saved = JSON.parse(accStore.get('lc-brand-' + (CLUB.id || '')) || 'null'); } catch (e) {}
  const src = d.colors || saved || o;
  return { primary: accHex(src.primary) || ACC_BASE.primary, secondary: accHex(src.secondary) || ACC_BASE.secondary }; }
function accApplyBrand() {
  const c = accBrand(); let el = document.getElementById('club-brand');
  if (c.primary === ACC_BASE.primary && c.secondary === ACC_BASE.secondary) { el && el.remove(); return; }
  if (!el) { el = document.createElement('style'); el.id = 'club-brand'; document.head.appendChild(el); }
  const L = `--green:${c.primary};--green2:${accMix(c.primary, '#FFFFFF', .14)};--brass:${c.secondary};--brassLine:${accMix(c.secondary, '#FFFFFF', .3)};--gold:${accMix(c.secondary, '#FFFFFF', .5)}`;
  const D = `--green:${accMix(c.primary, '#000000', .18)};--green2:${accMix(c.primary, '#FFFFFF', .3)};--brass:${accMix(c.secondary, '#FFFFFF', .3)};--brassLine:${accMix(c.secondary, '#FFFFFF', .15)};--gold:${accMix(c.secondary, '#FFFFFF', .5)}`;
  el.textContent = `:root{${L}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${D}}}:root[data-theme="dark"]{${D}}`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.primary);
}
accApplyBrand();

/* ---------- Pantalla de entrada ---------- */
const ACC_ICON = {
  gestor: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6',
  capitan: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  jugador: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.2-4 4.3-6 8-6s6.8 2 8 6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.2-4 4.3-6 8-6s6.8 2 8 6',
  settings: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
};
const accIco = (k, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ACC_ICON[k]}"/></svg>`;
const ACC_G = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

function accShell(inner, cls = '') {
  return `<div class="acc ${cls}"><div class="acc-lines" aria-hidden="true"></div><div class="acc-in">${inner}</div></div>`;
}
function accHead(sub) {
  return `<div class="acc-brand"><img src="${esc(ASSET.crestSm)}" alt=""><span>${esc(CLUB.name)}</span></div>${sub || ''}`;
}
function accLogin() {
  const w = ACC.want, inv = ACC.invite;
  const cards = ACC_ORDER.map(k => `<button class="acc-role ${w === k ? 'on' : ''}" data-acc="want" data-v="${k}" aria-pressed="${w === k}">
      <span class="acc-ri">${accIco(k)}</span><span class="acc-rt"><b>${ACC_ROLES[k].t}</b><small>${ACC_ROLES[k].d}</small></span><span class="acc-chk" aria-hidden="true"></span></button>`).join('');
  const note = inv ? `<p class="acc-note">Tienes una invitación para unirte a tu equipo. Entra con tu Google para aceptarla.</p>`
    : w === 'gestor' ? `<p class="acc-note">Después te pediremos de qué club formas parte. Un administrador valida el acceso.</p>`
    : w ? `<p class="acc-note">Si es tu primera vez, necesitarás el enlace de invitación que te envía tu capitán.</p>` : '';
  return accShell(`${accHead()}
    <h1 class="acc-h">Bienvenido a Lliga Catalana</h1>
    <p class="acc-q">¿Cómo accedes a la plataforma?</p>
    <div class="acc-roles" role="group" aria-label="Cómo accedes">${cards}</div>
    <div class="acc-go ${w ? 'on' : ''}">${note}<button class="gbtn" data-acc="signin" ${w ? '' : 'disabled'}>${ACC_G}${w ? 'Continuar con Google' : 'Elige cómo accedes'}</button></div>
    <p class="acc-foot">Una sola cuenta de Google para todos tus roles. Elegir una opción no da permisos: comprobamos los que tienes asignados.</p>`, 'acc-login');
}

/* ---------- Roles reales y contexto ---------- */
function accCapLoaded() { return ACC.capTeams !== null && ACC.capKey === (me || '') + '|' + viewSeason; }
function accRoles() {
  const r = [];
  if (isAdmin || isManager) r.push('gestor');
  if (me && accCapLoaded() && ACC.capTeams.length) r.push('capitan');
  if (me) r.push('jugador');
  return r;
}
async function accCheckCaptain() {
  if (!me) { ACC.capTeams = []; ACC.capKey = '|' + viewSeason; return; }
  const key = me + '|' + viewSeason; if (ACC.capKey === key && ACC.capTeams !== null) return;
  ACC.capKey = key; ACC.capTeams = null;
  const teams = clubTeams(), out = [];
  await Promise.all(teams.map(async t => { try { const d = await B.getDoc('seasons/' + docIdFor(t.id, viewSeason)); if ((d?.captains || []).includes(me)) out.push(t.id); } catch (e) {} }));
  if (ACC.capKey !== key) return;
  ACC.capTeams = teams.map(t => t.id).filter(id => out.includes(id));
  render();
}
function accCtxKey() { return 'lc-ctx-' + (authUser?.email || ''); }
function accSetCtx(k, go) {
  ACC.ctx = k; accStore.set(accCtxKey(), k); accStore.set('lc-last-role', k); ACC.want = null; accStore.set('lc-acc-want', null);
  if (k === 'capitan' && ACC.capTeams?.length && !ACC.capTeams.includes(teamId)) switchTeam(ACC.capTeams[0]);
  if (k === 'gestor' && !me) adminSkip = true;
  if (go) { const h = ACC_ROLES[k].home; if (route() !== h) location.hash = h; else render(); }
}
function accApplyCtx() {
  ACC_ORDER.forEach(k => document.body.classList.toggle('ctx-' + k, ACC.ctx === k));
}
// Lo llama render() con la sesión iniciada. Devuelve el HTML de la pantalla de acceso que toque, o null si puede entrar.
function accGate() {
  accApplyCtx();
  if (ACC.invite && !me) return accInviteView();
  if (ACC.invite && me) { accClearInvite(); toast('Ya estás vinculado como ' + pname(me)); }
  const roles = accRoles(), want = ACC.want;
  // Ser capitán depende de la temporada de cada equipo: se comprueba antes de decidir el contexto
  if (me && !accCapLoaded()) { accCheckCaptain(); if (want || !ACC.ctx || ACC.ctx === 'capitan') return accShell(`${accHead()}<p class="acc-wait">Comprobando tu acceso…</p>`); }
  if (want) {
    if (roles.includes(want)) { accSetCtx(want, !ACC.navDone); ACC.navDone = true; return null; }
    if (want === 'gestor') return accGestorView(roles);
    if (!me) return null;   // jugador o capitán aún sin vincular: lo resuelve accClaimView()
    return accNoAccess(want, roles);
  }
  if (!ACC.ctx) { const saved = accStore.get(accCtxKey()); ACC.ctx = roles.includes(saved) ? saved : roles[0] || null; accApplyCtx(); }
  else if (roles.length && !roles.includes(ACC.ctx) && (ACC.ctx !== 'capitan' || accCapLoaded())) { ACC.ctx = roles[0]; accApplyCtx(); }
  return null;
}
function accNoAccess(want, roles) {
  const why = want === 'capitan' ? 'No figuras como capitán de ningún equipo del club esta temporada. Los capitanes los asigna la gestión deportiva.'
    : 'Tu cuenta no tiene ese acceso.';
  return accShell(`${accHead()}
    <h1 class="acc-h sm">No tienes acceso como ${ACC_ROLES[want].t.toLowerCase()}</h1>
    <p class="acc-p">${why}</p><p class="acc-p">Entras como <b>${esc(authUser.email)}</b>.</p>
    ${roles.length ? `<p class="acc-q sm">Puedes entrar como</p><div class="acc-roles">${roles.map(k => `<button class="acc-role" data-acc="ctx" data-v="${k}"><span class="acc-ri">${accIco(k)}</span><span class="acc-rt"><b>${ACC_ROLES[k].t}</b><small>${ACC_ROLES[k].d}</small></span><span class="acc-arr">›</span></button>`).join('')}</div>` : ''}
    <div class="acc-acts"><button class="acc-link" data-acc="signout-now">Usar otra cuenta</button></div>`);
}

/* ---------- Jugador o capitán sin vincular: invitación ---------- */
function accClaimView() {
  const open = meta?.openClaims === true;
  if (open) return vClaim();
  return accShell(`${accHead()}
    <h1 class="acc-h sm">Únete a tu equipo</h1>
    <p class="acc-p">Para ver los datos de un equipo necesitas una invitación. Pídele a tu capitán el enlace: se envía por WhatsApp en un momento y solo se usa una vez.</p>
    <form class="acc-code" data-acc-form="code"><label for="acc-code">Código de invitación</label><div class="acc-cin"><input id="acc-code" name="code" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="Por ejemplo, K7PQ2XM4" maxlength="20"><button class="acc-btn" type="submit">Continuar</button></div></form>
    ${isManager || isAdmin ? `<div class="acc-acts"><button class="acc-link" data-acc="ctx" data-v="gestor">Entrar como gestor deportivo</button></div>` : ''}
    <p class="acc-p dim">Entras como ${esc(authUser.email)}. <button class="acc-link" data-acc="signout-now">Usar otra cuenta</button></p>`);
}
function accClearInvite() { ACC.invite = null; ACC.inv = null; try { sessionStorage.removeItem('lc-invite'); } catch (e) {} if (route().startsWith('invitacion-')) history.replaceState(null, '', '#inicio'); }
function accInviteView() {
  const code = ACC.invite, I = ACC.inv;
  if (!I || I.code !== code) {
    ACC.inv = { code, state: 'loading' };
    B.getDoc('invites/' + code).then(d => {
      if (ACC.inv?.code !== code) return;
      ACC.inv = { code, data: d, state: !d ? 'missing' : d.usedBy ? 'used' : (d.exp || 0) < Date.now() ? 'expired' : 'ok' };
      render();
    }).catch(() => { ACC.inv = { code, state: 'missing' }; render(); });
    return accShell(`${accHead()}<p class="acc-wait">Abriendo tu invitación…</p>`);
  }
  if (I.state === 'loading' || I.state === 'saving') return accShell(`${accHead()}<p class="acc-wait">${I.state === 'saving' ? 'Entrando en tu equipo…' : 'Abriendo tu invitación…'}</p>`);
  const bad = { missing: 'Esta invitación no existe. Revisa que el enlace esté completo o pide uno nuevo a tu capitán.', used: 'Esta invitación ya se ha usado. Si no has sido tú, avisa a tu capitán.', expired: 'Esta invitación ha caducado. Pide un enlace nuevo a tu capitán.', error: I.err || 'No se ha podido aceptar la invitación.' }[I.state];
  if (bad) return accShell(`${accHead()}<h1 class="acc-h sm">No podemos usar esta invitación</h1><p class="acc-p">${esc(bad)}</p>
    <div class="acc-acts"><button class="acc-btn" data-acc="invite-drop">Introducir otro código</button><button class="acc-link" data-acc="signout-now">Usar otra cuenta</button></div>`);
  const d = I.data, p = { id: d.pid, name: d.name };
  return accShell(`${accHead()}
    <div class="acc-inv">${avatar(p, 'lg')}<div><span class="acc-k">Invitación de ${esc(d.byName || 'tu capitán')}</span><h1 class="acc-h sm">¿Eres ${esc(d.name)}?</h1><p class="acc-p">${esc(d.teamName || '')}${d.teamName ? ', ' : ''}${esc(CLUB.medium)}. Tu Gmail ${esc(authUser.email)} quedará ligado a este jugador.</p></div></div>
    <div class="acc-acts"><button class="acc-btn big" data-acc="invite-accept">Sí, soy ${esc(String(d.name).split(' ')[0])}</button><button class="acc-link" data-acc="invite-drop">No soy yo</button></div>`);
}
async function accAcceptInvite() {
  const I = ACC.inv; if (!I || I.state !== 'ok') return;
  ACC.inv = { ...I, state: 'saving' }; render();
  try { await B.claimInvite(I.code, I.data.pid); if (ACC.want !== 'capitan') { accStore.set('lc-acc-want', null); ACC.want = null; } accClearInvite(); location.hash = 'inicio'; toast('Ya estás en tu equipo'); }
  catch (e) { ACC.inv = { ...I, state: 'error', err: /permission/i.test(e?.code || '') ? 'La invitación ya no es válida o ese jugador ya está vinculado a otra cuenta.' : (e?.message || 'Error') }; render(); }
}

/* ---------- Gestor deportivo: club, solicitud y validación ---------- */
function accWatchReq() {
  if (ACC.reqSub || !authUser) return;
  ACC.reqSub = B.watchDoc('clubRequests/' + authUser.uid, d => {
    const was = ACC.req?.status; ACC.req = d || null;
    if (d?.status === 'aprobada' && was && was !== 'aprobada' && d.clubId === CLUB.id) { location.reload(); return; }
    render();
  });
}
function accClubs() {
  const own = { id: CLUB.id, name: CLUB.name, town: CLUB.town || '', crest: ASSET.crestSm, active: true };
  const cat = Object.entries(ACC.catalog || {}).map(([id, c]) => ({ id, ...c, active: id === CLUB.id }));
  return [own, ...cat.filter(c => c.id !== own.id)];
}
const accNorm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function accGestorView(roles) {
  accWatchReq();
  if (ACC.req === undefined) return accShell(`${accHead()}<p class="acc-wait">Comprobando tu acceso…</p>`);
  const R = ACC.req, other = roles.filter(k => k !== 'gestor');
  const alt = other.length ? `<div class="acc-acts">${other.map(k => `<button class="acc-link" data-acc="ctx" data-v="${k}">Entrar como ${ACC_ROLES[k].t.toLowerCase()}</button>`).join('')}</div>` : '';
  if (R && R.status === 'pendiente') return accShell(`${accHead()}
    <span class="acc-k">Solicitud enviada</span><h1 class="acc-h sm">Estamos validando tu acceso</h1>
    <p class="acc-p">Has pedido entrar como gestor deportivo de <b>${esc(R.clubName)}</b>. Un administrador lo revisará y, en cuanto lo apruebe, entrarás directamente en el entorno del club.</p>
    <div class="acc-acts"><button class="acc-link" data-acc="req-cancel">Cancelar la solicitud</button><button class="acc-link" data-acc="signout-now">Usar otra cuenta</button></div>${alt}`);
  if (R && R.status === 'aprobada') return accShell(`${accHead()}
    <span class="acc-k">Acceso aprobado</span><h1 class="acc-h sm">${esc(R.clubName)}</h1>
    <p class="acc-p">Tu acceso como gestor deportivo está aprobado. El entorno de este club todavía no está activo en Lliga Catalana: lo prepararemos con sus equipos y su identidad y te avisaremos.</p>
    <div class="acc-acts"><button class="acc-link" data-acc="signout-now">Cerrar sesión</button></div>${alt}`);
  if (ACC.catalog === null) { ACC.catalog = {}; B.getColl('catalog').then(m => { ACC.catalog = m || {}; render(); }).catch(() => render()); }
  if (ACC.pick) { const c = accClubs().find(x => x.id === ACC.pick); if (c) return accShell(`${accHead()}
    <div class="acc-picked">${accCrest(c, 64)}<div><span class="acc-k">${esc(c.town || 'Club de la FCT')}</span><h1 class="acc-h sm">${esc(c.name)}</h1></div></div>
    <p class="acc-p">Pediremos acceso como gestor deportivo de este club. Un administrador lo valida y queda registrado quién lo autoriza.</p>
    <form data-acc-form="req"><label class="acc-lbl" for="acc-msg">Mensaje para el administrador (opcional)</label><textarea id="acc-msg" name="msg" rows="2" maxlength="300" placeholder="Por ejemplo: soy el director deportivo de la sección de tenis"></textarea>
    <div class="acc-acts"><button class="acc-btn big" type="submit" ${ui.accBusy ? 'disabled' : ''}>${ui.accBusy ? 'Enviando…' : 'Solicitar acceso'}</button><button class="acc-link" type="button" data-acc="unpick">Elegir otro club</button></div></form>`, 'acc-launch'); }
  const q = accNorm(ACC.q), list = accClubs().filter(c => !q || accNorm(c.name + ' ' + (c.town || '')).includes(q));
  const nCat = Object.keys(ACC.catalog || {}).length;
  return accShell(`${accHead()}
    <h1 class="acc-h sm">¿De qué club formas parte?</h1>
    <div class="acc-search">${accIco('search', 18)}<input id="acc-q" type="search" placeholder="Busca tu club por nombre o localidad" value="${esc(ACC.q)}" autocomplete="off" aria-label="Buscar club"></div>
    <div class="acc-clubs" role="list">${list.slice(0, 40).map(c => `<button class="acc-club" role="listitem" data-acc="pick" data-v="${esc(c.id)}">${accCrest(c, 40)}<span><b>${esc(c.name)}</b><small>${esc(c.town || '')}${c.active ? ' · Activo en Lliga Catalana' : ''}</small></span><span class="acc-arr">›</span></button>`).join('') || `<p class="acc-p dim">No hay ningún club con ese nombre.</p>`}</div>
    <p class="acc-p dim">${nCat ? `Catálogo de clubes de la Federació Catalana de Tennis (${nCat}).` : 'El catálogo de clubes de la FCT aún no se ha importado. Si tu club no aparece, pide a un administrador que lo cargue.'}</p>
    ${alt}<div class="acc-acts"><button class="acc-link" data-acc="signout-now">Usar otra cuenta</button></div>`);
}
function accCrest(c, s) {
  if (c.crest) return `<img class="acc-crest" src="${esc(c.crest)}" alt="" width="${s}" height="${s}" style="width:${s}px;height:${s}px" loading="lazy">`;
  const ini = String(c.name || '?').replace(/\b(club|de|del|la|el|tennis|tenis|ct|c\.t\.)\b/gi, ' ').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
  return `<span class="acc-crest ini" style="width:${s}px;height:${s}px">${esc(ini || '?')}</span>`;
}
async function accSendReq(msg) {
  const c = accClubs().find(x => x.id === ACC.pick); if (!c) return;
  ui.accBusy = true; render();
  try { await B.set('clubRequests/' + authUser.uid, { uid: authUser.uid, email: authUser.email, name: authUser.name || '', clubId: c.id, clubName: c.name, role: 'gestor', msg: String(msg || '').slice(0, 300), status: 'pendiente', at: Date.now() });
    ACC.pick = null; toast('Solicitud enviada'); }
  catch (e) { toast('No se ha podido enviar: ' + (e?.code || e?.message || 'error')); }
  ui.accBusy = false; render();
}

/* ---------- Menú de cuenta y cerrar sesión ---------- */
function accMenuToggle(state) {
  ACC.menu = state === false ? false : (state ? true : !ACC.menu); ACC.menuState = 'menu'; ACC.menuErr = '';
  accMenuDraw();
}
function accMenuDraw() {
  let el = document.getElementById('acc-menu');
  if (!ACC.menu || !authUser) { if (el) el.remove(); document.removeEventListener('pointerdown', accMenuOutside, true); return; }
  if (!el) { el = document.createElement('div'); el.id = 'acc-menu'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Tu cuenta'); document.body.appendChild(el); setTimeout(() => document.addEventListener('pointerdown', accMenuOutside, true), 0); }
  const roles = accRoles(), st = ACC.menuState, p = me ? player(me) : null;
  let body;
  if (st === 'confirm' || st === 'busy' || st === 'error') body = `<p class="acc-m-t">¿Cerrar sesión en este dispositivo?</p><p class="acc-m-s">Se borran de este dispositivo los datos del club guardados para usar la app sin conexión.</p>
      ${st === 'error' ? `<p class="acc-m-err">${esc(ACC.menuErr)}</p>` : ''}
      <div class="acc-m-row"><button class="acc-m-b ghost" data-acc="menu-back" ${st === 'busy' ? 'disabled' : ''}>Cancelar</button><button class="acc-m-b danger" data-acc="signout-confirm" ${st === 'busy' ? 'disabled' : ''}>${st === 'busy' ? 'Cerrando sesión…' : st === 'error' ? 'Reintentar' : 'Cerrar sesión'}</button></div>`;
  else body = `<div class="acc-m-me">${p ? avatar(p) : `<span class="av">${esc((authUser.email || '?')[0].toUpperCase())}</span>`}<div><b>${esc(p?.name || authUser.name || 'Tu cuenta')}</b><small>${esc(authUser.email)}</small></div></div>
      ${roles.length > 1 ? `<p class="acc-m-k">Entrar como</p><div class="acc-m-roles">${roles.map(k => `<button data-acc="ctx" data-v="${k}" aria-pressed="${ACC.ctx === k}">${accIco(k, 16)}${ACC_ROLES[k].t}</button>`).join('')}</div>` : roles.length ? `<p class="acc-m-k">Acceso: ${ACC_ROLES[roles[0]].t}</p>` : ''}
      <div class="acc-m-list">${me ? `<button data-acc="go" data-v="perfil">${accIco('user', 17)}Mi perfil</button>` : ''}<button data-acc="go" data-v="yo">${accIco('settings', 17)}Yo: avisos e instalación</button><button class="danger" data-acc="signout">${accIco('logout', 17)}Cerrar sesión</button></div>`;
  el.innerHTML = body;
  el.querySelector('[data-acc="signout-confirm"],[data-acc="ctx"][aria-pressed="true"],button')?.focus({ preventScroll: true });
}
function accMenuOutside(e) { const m = document.getElementById('acc-menu'); if (m && !m.contains(e.target) && !e.target.closest('.mebtn')) accMenuToggle(false); }
async function accSignOut() {
  ACC.menu = true; ACC.menuState = 'busy'; accMenuDraw();
  try {
    // Dejar de escuchar antes de cerrar la sesión: así no llegan errores de permisos ni datos de la sesión anterior
    [subs, dataSubs, privSubs, mvpSubs, clubSubs].forEach(arr => { (arr || []).splice(0).forEach(u => { try { u(); } catch (e) {} }); });
    [docsSub, mineSub, ACC.reqSub, ACC.admin.sub].forEach(u => { try { u && u(); } catch (e) {} });
    accStore.set('lc-acc-want', null); try { sessionStorage.clear(); } catch (e) {}
    await B.signOut();
    location.replace(location.pathname + location.search);   // recarga sin la ruta privada: la memoria queda vacía
  } catch (e) { ACC.menuState = 'error'; ACC.menuErr = 'No se ha podido cerrar la sesión (' + (e?.code || e?.message || 'error') + '). Comprueba la conexión y reinténtalo.'; accMenuDraw(); }
}

/* ---------- Invitaciones (Gestión > Plantilla) ---------- */
function accCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint32Array(10); crypto.getRandomValues(b); return [...b].map(x => A[x % A.length]).join(''); }
function accInviteCell(p) {
  if (claims[p.id] || !(canPrivate || canClub())) return '';
  const i = ACC.invites[p.id];
  if (!i) return `<button class="textlink" data-acc="inv-new" data-pid="${esc(p.id)}">Invitar</button>`;
  if (i.busy) return `<span class="muted">Creando invitación…</span>`;
  const tel = String(phones[p.id] || '').replace(/[^\d]/g, ''), msg = `Hola ${String(p.name).split(' ')[0]}, este es tu acceso a la app del ${CLUB.medium} en la Lliga Catalana: ${i.url}`;
  return `<span class="acc-invrow"><input readonly value="${esc(i.url)}" aria-label="Enlace de invitación de ${esc(p.name)}" onclick="this.select()"><button class="btn sm ghost" data-acc="inv-copy" data-pid="${esc(p.id)}">Copiar</button><a class="btn sm" href="https://wa.me/${tel}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">WhatsApp</a></span>`;
}
async function accNewInvite(pid) {
  const p = player(pid); if (!p) return;
  ACC.invites[pid] = { busy: true }; renderQuiet();
  const code = accCode(), now = Date.now(), t = clubTeams().find(x => x.id === teamId);
  try {
    await B.set('invites/' + code, { pid, name: p.full || p.name, team: teamId, teamName: t?.name || '', season: SEASON_PATH.split('/')[1], club: CLUB.id || '', role: 'jugador',
      by: authUser.uid, byName: (me && player(me)?.name) || authUser.name || authUser.email, at: now, exp: now + 30 * 864e5, usedBy: null });
    ACC.invites[pid] = { code, url: location.origin + location.pathname + '#invitacion-' + code };
    toast('Invitación creada: válida 30 días y para un solo uso');
  } catch (e) { delete ACC.invites[pid]; toast('No se ha podido crear la invitación (' + (e?.code || 'error') + ')'); }
  renderQuiet();
}

/* ---------- Configuración del club (administradores) ---------- */
function accAdminPanels() {
  if (!isAdmin) return '';
  if (!ACC.admin.sub) ACC.admin.sub = B.watchColl('clubRequests', m => { ACC.admin.reqs = m; softRender(); });
  const reqs = Object.entries(ACC.admin.reqs || {}).map(([id, r]) => ({ id, ...r }));
  const pend = reqs.filter(r => r.status === 'pendiente').sort((a, b) => a.at - b.at);
  const done = reqs.filter(r => r.status === 'aprobada' || r.status === 'rechazada').sort((a, b) => (b.decidedAt || 0) - (a.decidedAt || 0)).slice(0, 6);
  const imp = ACC.admin.imp, br = accBrand(), id = ACC.admin.brand || {};
  const nCat = ACC.catalog ? Object.keys(ACC.catalog).length : null;
  if (ACC.catalog === null) { ACC.catalog = {}; B.getColl('catalog').then(m => { ACC.catalog = m || {}; softRender(); }).catch(() => {}); }
  return `<section class="sec"><div class="sec-h"><h2>Solicitudes de acceso de gestores</h2></div>
    ${pend.length ? `<ul class="insights">${pend.map(r => `<li class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><span><b>${esc(r.name || r.email)}</b> ${esc(r.email)}<small>${esc(r.clubName)}${r.msg ? ' · «' + esc(r.msg) + '»' : ''} · ${relTime(r.at)}</small></span><span class="row" style="gap:6px"><button class="btn sm brass" data-acc="req-ok" data-v="${esc(r.id)}">Aprobar</button><button class="btn sm ghost" data-acc="req-no" data-v="${esc(r.id)}">Rechazar</button></span></li>`).join('')}</ul>` : '<div class="empty">No hay solicitudes pendientes.</div>'}
    ${done.length ? `<p class="muted small" style="margin:10px 0 4px">Últimas decisiones</p><ul class="insights">${done.map(r => `<li><span>${r.status === 'aprobada' ? '✓' : '✗'} <b>${esc(r.email)}</b> en ${esc(r.clubName)}<small>${r.status === 'aprobada' ? 'Aprobada' : 'Rechazada'} por ${esc(r.decidedByEmail || '')}, ${relTime(r.decidedAt)}</small></span></li>`).join('')}</ul>` : ''}</section>
  <section class="sec"><div class="sec-h"><h2>Acceso de jugadores</h2></div><div class="panel">
    <label class="chkline"><input type="checkbox" data-acc="open-claims" ${meta?.openClaims === true ? 'checked' : ''}> <span><b>Permitir elegir el nombre sin invitación.</b> Desactivado, cada jugador entra con el enlace que le envía su capitán o la gestión (Gestión, Plantilla, «Invitar»). Es lo recomendado: así nadie puede hacerse pasar por otro jugador.</span></label></div></section>
  <section class="sec"><div class="sec-h"><h2>Identidad del club</h2></div><div class="panel acc-brandp">
    <p class="muted small" style="margin:0 0 10px">Colores de la cabecera, la pantalla de entrada, los botones y los carteles. El resto del diseño es común a todos los clubes.</p>
    <div class="row" style="gap:16px;flex-wrap:wrap"><label class="acc-col">Color principal<input type="color" id="acc-c1" value="${br.primary}"></label><label class="acc-col">Color secundario<input type="color" id="acc-c2" value="${br.secondary}"></label>
      <label class="acc-col grow">Correo de contacto<input type="email" id="acc-mail" value="${esc(id.contact?.email || '')}" placeholder="tenis@club.cat"></label><label class="acc-col grow">Teléfono<input type="tel" id="acc-tel" value="${esc(id.contact?.phone || '')}"></label><label class="acc-col grow">Web<input type="url" id="acc-web" value="${esc(id.contact?.web || '')}" placeholder="https://"></label></div>
    <div class="row" style="margin-top:12px;gap:8px"><button class="btn sm brass" data-acc="brand-save">Guardar identidad</button><button class="btn sm ghost" data-acc="brand-reset">Volver a los colores originales</button></div></div></section>
  <section class="sec"><div class="sec-h"><h2>Catálogo de clubes de la FCT</h2>${nCat != null ? `<span class="muted small">${nCat} clubes</span>` : ''}</div><div class="panel">
    <p class="muted small" style="margin:0 0 10px">La FCT no ofrece una API ni una exportación de clubes. Carga un CSV o Excel con el listado de <a href="https://fctennis.cat/clubs-afiliats/" target="_blank" rel="noopener">clubs afiliats</a> o el que os facilite la Federació. Columnas: <b>nombre</b> (obligatoria), <b>localidad</b>, <b>provincia</b>, <b>web</b>, <b>codigo</b> (FCT) y <b>escudo</b> (URL de la imagen). Se puede volver a importar para actualizarlo.</p>
    ${imp?.rows ? `<p class="small"><b>${imp.rows.length}</b> clubes en «${esc(imp.file)}»${imp.skipped ? `, ${imp.skipped} filas sin nombre descartadas` : ''}. Vista previa:</p>
      <div class="tablewrap"><table><thead><tr><th class="l">Nombre</th><th class="l">Localidad</th><th class="l">Provincia</th><th class="l">Web</th></tr></thead><tbody>${imp.rows.slice(0, 8).map(r => `<tr><td class="l">${esc(r.name)}</td><td class="l">${esc(r.town)}</td><td class="l">${esc(r.province)}</td><td class="l">${esc(r.web)}</td></tr>`).join('')}</tbody></table></div>
      <div class="row" style="margin-top:10px;gap:8px"><button class="btn sm brass" data-acc="cat-save" ${imp.busy ? 'disabled' : ''}>${imp.busy ? 'Importando…' : 'Importar ' + imp.rows.length + ' clubes'}</button><button class="btn sm ghost" data-acc="cat-cancel">Cancelar</button></div>`
      : `<label class="btn sm" style="cursor:pointer">Elegir archivo CSV o Excel<input type="file" id="acc-cat-file" accept=".csv,.xlsx,.xls,text/csv" hidden></label>${imp?.err ? `<p class="small" style="color:var(--loss)">${esc(imp.err)}</p>` : ''}`}</div></section>`;
}
const accSlug = s => accNorm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
async function accReadCatalog(file) {
  ACC.admin.imp = { file: file.name, busy: true }; renderQuiet();
  try {
    await loadScript(LIBS.xlsx);
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    const pick = (r, keys) => { for (const k of Object.keys(r)) if (keys.includes(accNorm(k).replace(/[^a-z]/g, ''))) return String(r[k]).trim(); return ''; };
    let skipped = 0; const out = [], seen = new Set();
    rows.forEach(r => {
      const name = pick(r, ['nombre', 'nom', 'name', 'club', 'nombreclub', 'nomclub']);
      if (!name) { skipped++; return; }
      const id = accSlug(pick(r, ['codigo', 'codi', 'code', 'id', 'codigofct', 'codifct']) || name); if (seen.has(id)) return; seen.add(id);
      out.push({ id, name, town: pick(r, ['localidad', 'localitat', 'poblacion', 'poblacio', 'municipio', 'municipi', 'town', 'city']), province: pick(r, ['provincia', 'province']), web: pick(r, ['web', 'url', 'website', 'pagina']), crest: pick(r, ['escudo', 'escut', 'logo', 'crest']), code: pick(r, ['codigo', 'codi', 'code', 'codigofct', 'codifct']) });
    });
    ACC.admin.imp = out.length ? { file: file.name, rows: out, skipped } : { err: 'No hemos encontrado ninguna fila con la columna «nombre».' };
  } catch (e) { ACC.admin.imp = { err: 'No se ha podido leer el archivo: ' + (e?.message || e) }; }
  renderQuiet();
}
async function accSaveCatalog() {
  const imp = ACC.admin.imp; if (!imp?.rows) return; imp.busy = true; renderQuiet();
  const at = Date.now(), by = authUser.email;
  try {
    for (const r of imp.rows) await B.merge('catalog/' + r.id, { name: r.name, town: r.town, province: r.province, web: r.web, crest: r.crest, code: r.code, source: imp.file, importedAt: at, importedBy: by });
    ACC.catalog = null; ACC.admin.imp = null; toast(imp.rows.length + ' clubes importados');
  } catch (e) { imp.busy = false; imp.err = 'Error al guardar: ' + (e?.code || e?.message); toast(imp.err); }
  renderQuiet();
}
async function accDecide(id, ok) {
  const r = (ACC.admin.reqs || {})[id]; if (!r) return;
  const by = { decidedBy: authUser.uid, decidedByEmail: authUser.email, decidedAt: Date.now() };
  await safe(async () => {
    if (ok && r.clubId === CLUB.id) {
      const managers = [...(meta?.managers || []).filter(x => x.email !== r.email), { name: r.name || '', email: r.email, approvedBy: authUser.email, approvedAt: by.decidedAt }];
      await saveMeta({ managers, managerEmails: managers.map(x => x.email) });
    } else if (ok) {
      await B.set('clubs/' + r.clubId + '/members/' + r.uid, { email: r.email, roles: ['gestor'], approvedBy: authUser.email, at: by.decidedAt });
    }
    await B.merge('clubRequests/' + id, { status: ok ? 'aprobada' : 'rechazada', ...by });
  }, ok ? 'Acceso aprobado para ' + r.email : 'Solicitud rechazada');
}
async function accLoadBrand() {
  if (!CLUB.id || ACC.admin.brandLoaded) return; ACC.admin.brandLoaded = true;
  try { const d = await B.getDoc('clubs/' + CLUB.id); if (d) { ACC.admin.brand = d; accStore.set('lc-brand-' + CLUB.id, d.colors ? JSON.stringify(d.colors) : null); accApplyBrand(); softRender(); } } catch (e) {}
}

/* ---------- Eventos ---------- */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-acc]'); if (!el) return;
  const a = el.dataset.acc, v = el.dataset.v;
  if (el.tagName === 'INPUT') return;
  if (a === 'want') { ACC.want = v; accStore.set('lc-acc-want', v); render(); document.querySelector('.acc .gbtn')?.focus({ preventScroll: true }); }
  else if (a === 'signin') { if (!ACC.want) return; el.disabled = true; el.lastChild.textContent = 'Abriendo Google…'; try { await B.signIn(); } finally { el.disabled = false; } }
  else if (a === 'ctx') { accMenuToggle(false); accSetCtx(v, true); }
  else if (a === 'go') { accMenuToggle(false); if (v === 'perfil' && me) openSheet(me); else location.hash = v; }
  else if (a === 'signout') { ACC.menu = true; ACC.menuState = 'confirm'; accMenuDraw(); }
  else if (a === 'menu-back') { ACC.menuState = 'menu'; accMenuDraw(); }
  else if (a === 'signout-confirm') accSignOut();
  else if (a === 'signout-now') accSignOut();
  else if (a === 'invite-accept') accAcceptInvite();
  else if (a === 'invite-drop') { accClearInvite(); render(); }
  else if (a === 'pick') { ACC.pick = v; render(); scrollTo(0, 0); }
  else if (a === 'unpick') { ACC.pick = null; render(); }
  else if (a === 'req-cancel') { await safe(() => B.del('clubRequests/' + authUser.uid), 'Solicitud cancelada'); }
  else if (a === 'inv-new') accNewInvite(el.dataset.pid);
  else if (a === 'inv-copy') { const i = ACC.invites[el.dataset.pid]; try { await navigator.clipboard.writeText(i.url); toast('Enlace copiado'); } catch (x) { el.previousElementSibling?.select(); toast('Selecciona el enlace y cópialo'); } }
  else if (a === 'req-ok' || a === 'req-no') accDecide(v, a === 'req-ok');
  else if (a === 'cat-save') accSaveCatalog();
  else if (a === 'cat-cancel') { ACC.admin.imp = null; renderQuiet(); }
  else if (a === 'brand-save' || a === 'brand-reset') {
    const reset = a === 'brand-reset', colors = reset ? null : { primary: accHex(document.getElementById('acc-c1')?.value), secondary: accHex(document.getElementById('acc-c2')?.value) };
    const contact = { email: document.getElementById('acc-mail')?.value.trim() || '', phone: document.getElementById('acc-tel')?.value.trim() || '', web: document.getElementById('acc-web')?.value.trim() || '' };
    const doc = { ...(ACC.admin.brand || {}), name: CLUB.name, short: CLUB.short, colors, contact, updatedAt: Date.now(), updatedBy: authUser.email };
    await safe(() => B.set('clubs/' + CLUB.id, doc), reset ? 'Colores originales recuperados' : 'Identidad guardada');
    ACC.admin.brand = doc; accStore.set('lc-brand-' + CLUB.id, colors ? JSON.stringify(colors) : null); accApplyBrand(); renderQuiet();
  }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'acc-cat-file' && el.files?.[0]) accReadCatalog(el.files[0]);
  else if (el.dataset?.acc === 'open-claims') saveMeta({ openClaims: el.checked }, el.checked ? 'Se puede elegir el nombre sin invitación' : 'Solo se entra con invitación');
});
document.addEventListener('input', e => { if (e.target.id === 'acc-q') { ACC.q = e.target.value; const pos = e.target.selectionStart; render(); const n = document.getElementById('acc-q'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } } });
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-acc-form]'); if (!f) return; e.preventDefault();
  if (f.dataset.accForm === 'code') { const c = String(new FormData(f).get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^.*INVITACION/, ''); if (c.length < 6) { toast('Revisa el código: tiene 10 letras y números'); return; } ACC.invite = c; ACC.inv = null; try { sessionStorage.setItem('lc-invite', c); } catch (x) {} render(); }
  else if (f.dataset.accForm === 'req') accSendReq(new FormData(f).get('msg'));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ACC.menu) accMenuToggle(false); });
window.addEventListener('hashchange', () => { const h = location.hash.slice(1);
  if (/^invitacion-[A-Za-z0-9]{6,}$/.test(h)) { ACC.invite = h.slice(11).toUpperCase(); ACC.inv = null; try { sessionStorage.setItem('lc-invite', ACC.invite); } catch (e) {}
    if (!authUser) { ACC.want = 'jugador'; accStore.set('lc-acc-want', 'jugador'); } render(); }
  if (ACC.menu) accMenuToggle(false); });
