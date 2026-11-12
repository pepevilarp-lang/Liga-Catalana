/* ===================== ACCESO: quién eres → tu club o tu equipo → tu entorno =====================
   Se carga antes que app.js y solo define funciones: las llama app.js cuando ya ha preparado su estado.
   Antes de entrar no se muestra la identidad de ningún club: la pantalla es de Lliga Catalana.
   Elegir un perfil o un club no da permisos: se comprueban después de iniciar sesión, y las reglas de
   Firestore (firestore.rules) son las que deciden. Plan completo: docs/MULTICLUB.md

   Flujos (ACC.flow, se guarda para sobrevivir a la vuelta de Google):
   - Gestor: perfil → club → acceso con Google → validación → entorno del club.
   - Capitán: perfil → acceso → sus equipos como capitán (selector si hay varios) → gestión del equipo.
   - Jugador: perfil → acceso → sus equipos (selector si hay varios) → su perfil. Sin equipo: invitación o solicitud. */
'use strict';

const ACC_ROLES = {
  gestor:  { t: 'Gestor deportivo', d: 'Gestiona los equipos y la competición de tu club.', home: 'club' },
  capitan: { t: 'Capitán', d: 'Organiza tu equipo y gestiona cada jornada.', home: 'admin' },
  jugador: { t: 'Jugador', d: 'Consulta tu equipo, disponibilidad, convocatorias y resultados.', home: 'inicio' },
};
const ACC_ORDER = ['gestor', 'capitan', 'jugador'];
const ACC = {
  flow: null,        // {role, club, step, join}: el recorrido de entrada en curso
  ctx: null,         // perfil con el que está dentro ahora
  capTeams: null, capKey: '',
  member: null,      // clubs/<club>/members/<uid> del club de esta app
  memberOf: {},      // lo mismo para el club elegido por un gestor, si es otro
  openClaims: false,
  invite: null, inv: null, invites: {},
  ginv: null,        // invitación de gestor en curso
  req: undefined, reqSub: null,
  catalog: null, q: '',
  menu: false, menuState: 'menu', menuErr: '',
  rosterWaited: false,
  admin: { reqs: null, sub: null, imp: null, brand: null, ginv: null, link: {} },
};
const accStore = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
  json(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
};
function accFlowSave() { accStore.set('lc-flow', ACC.flow ? JSON.stringify(ACC.flow) : null); }
function accSetFlow(patch) { ACC.flow = patch === null ? null : { ...(ACC.flow || {}), ...patch }; accFlowSave(); }
(function accBoot() {
  ACC.flow = accStore.json('lc-flow');
  const h = (location.hash || '').slice(1);
  if (/^invitacion-[A-Za-z0-9]{6,}$/.test(h)) { ACC.invite = h.slice(11).toUpperCase(); try { sessionStorage.setItem('lc-invite', ACC.invite); } catch (e) {} }
  else { try { ACC.invite = sessionStorage.getItem('lc-invite'); } catch (e) {} }
  if (ACC.invite && !ACC.flow) ACC.flow = { role: 'jugador', step: 'auth' };
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
  const saved = accStore.json('lc-brand-' + ((window.CLUB && CLUB.id) || ''));
  const src = d.colors || saved || o;
  return { primary: accHex(src.primary) || ACC_BASE.primary, secondary: accHex(src.secondary) || ACC_BASE.secondary }; }
function accApplyBrand() {
  const c = accBrand(); let el = document.getElementById('club-brand');
  if (c.primary === ACC_BASE.primary && c.secondary === ACC_BASE.secondary) { el && el.remove(); return; }
  if (!el) { el = document.createElement('style'); el.id = 'club-brand'; document.head.appendChild(el); }
  const L = `--green:${c.primary};--green2:${accMix(c.primary, '#FFFFFF', .14)};--brass:${c.secondary};--brassLine:${accMix(c.secondary, '#FFFFFF', .3)};--gold:${accMix(c.secondary, '#FFFFFF', .5)}`;
  const D = `--green:${accMix(c.primary, '#000000', .18)};--green2:${accMix(c.primary, '#FFFFFF', .3)};--brass:${accMix(c.secondary, '#FFFFFF', .3)};--brassLine:${accMix(c.secondary, '#FFFFFF', .15)};--gold:${accMix(c.secondary, '#FFFFFF', .5)}`;
  el.textContent = `:root{${L}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${D}}}:root[data-theme="dark"]{${D}}`;
}
accApplyBrand();

/* ---------- Piezas comunes ---------- */
const ACC_ICON = {
  gestor: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6',
  capitan: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  jugador: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.2-4 4.3-6 8-6s6.8 2 8 6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.2-4 4.3-6 8-6s6.8 2 8 6',
  settings: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  back: 'M15 18l-6-6 6-6',
  team: 'M8 8a3.5 3.5 0 1 0 0-.01M2.5 20c.8-3.6 3.3-5.5 5.5-5.5s4.7 1.9 5.5 5.5M16 7a3 3 0 1 0 0-.01M15 14.6c2.6-.3 5.4 1.2 6.5 5.4',
};
const accIco = (k, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ACC_ICON[k]}"/></svg>`;
const ACC_G = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
// Antes de saber a qué club pertenece el usuario, la entrada es de Lliga Catalana, sin la identidad de ningún club
const ACC_MARK = '<svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="#D4F04C" stroke-width="3" stroke-linecap="round" aria-hidden="true"><circle cx="24" cy="24" r="19"/><path d="M12.5 9.5c6.5 7.5 6.5 21.5 0 29M35.5 9.5c-6.5 7.5-6.5 21.5 0 29"/></svg>';
function accShell(inner, cls = '', key = '') {
  return `<div class="acc ${cls}" data-step="${esc(key)}"><div class="acc-lines" aria-hidden="true"></div><div class="acc-in">${inner}</div></div>`;
}
// Cabecera con los pasos del recorrido y el botón para volver
function accTop(back) {
  const f = ACC.flow || {}, role = f.role;
  const steps = role === 'gestor' ? ['Perfil', 'Club', 'Acceso'] : role ? ['Perfil', 'Acceso', 'Tu equipo'] : ['Perfil', 'Acceso', 'Tu entorno'];
  const at = { role: 0, club: 1, auth: role === 'gestor' ? 2 : 1, check: role === 'gestor' ? 2 : 2 }[f.step || 'role'] ?? 0;
  return `<div class="acc-top">${back ? `<button class="acc-back" data-acc="back" aria-label="Volver al paso anterior">${accIco('back', 18)}Atrás</button>` : `<div class="acc-brand">${ACC_MARK}<span>Lliga Catalana</span></div>`}
    <ol class="acc-steps" aria-label="Pasos">${steps.map((s, i) => `<li class="${i < at ? 'done' : i === at ? 'on' : ''}" ${i === at ? 'aria-current="step"' : ''}><i>${i + 1}</i><span>${s}</span></li>`).join('')}</ol></div>`;
}
const accWait = (msg) => accShell(`${accTop(false)}<p class="acc-wait">${esc(msg || 'Comprobando tu acceso…')}</p>`, '', 'wait');
const accAccount = () => authUser ? `<p class="acc-p dim acc-who">Entras como ${esc(authUser.email)}. <button class="acc-link" data-acc="signout-now">Usar otra cuenta</button></p>` : '';
const accNorm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function accCrest(c, s) {
  if (c && c.crest) return `<img class="acc-crest" src="${esc(c.crest)}" alt="" width="${s}" height="${s}" style="width:${s}px;height:${s}px" loading="lazy">`;
  const ini = String(c?.name || '?').replace(/\b(club|de|del|la|el|tennis|tenis|ct|c\.t\.)\b/gi, ' ').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
  return `<span class="acc-crest ini" style="width:${s}px;height:${s}px;font-size:${Math.round(s / 3.2)}px">${esc(ini || '?')}</span>`;
}

/* ---------- Catálogo de clubes ---------- */
function accLoadCatalog() {
  if (ACC.catalog !== null) return; ACC.catalog = {};
  B.getColl('catalog').then(m => { ACC.catalog = m || {}; accRefreshClubs(); }).catch(() => {});
}
function accClubs() {
  const own = window.CLUB && CLUB.id ? { id: CLUB.id, name: CLUB.name, town: CLUB.town || '', crest: CLUB.crestSm || '', active: true } : null;
  const cat = Object.entries(ACC.catalog || {}).map(([id, c]) => ({ id, ...c }));
  const out = cat.map(c => c.id === own?.id ? { ...c, ...own } : c);
  if (own && !out.some(c => c.id === own.id)) out.push(own);
  return out.sort((a, b) => accNorm(a.name).localeCompare(accNorm(b.name)));   // por nombre: ningún club va primero por defecto
}
const accClub = id => accClubs().find(c => c.id === id) || accStore.json('lc-last-club') || null;
function accClubList() {
  const q = accNorm(ACC.q), list = accClubs().filter(c => !q || accNorm(c.name + ' ' + (c.town || '')).includes(q));
  if (!list.length) return `<p class="acc-p dim">${q ? 'No hay ningún club con ese nombre en el catálogo.' : 'Cargando el catálogo de clubes…'}</p>`;
  return list.slice(0, 60).map(c => `<button class="acc-club" role="listitem" data-acc="club" data-v="${esc(c.id)}">${accCrest(c, 52)}<span><b>${esc(c.name)}</b><small>${esc(c.town || '')}</small></span><span class="acc-arr" aria-hidden="true">›</span></button>`).join('');
}
function accRefreshClubs() { const box = document.getElementById('acc-clubs'); if (box) box.innerHTML = accClubList(); }
function accClubPicker(title, sub, extra = '') {
  accLoadCatalog();
  const last = accStore.json('lc-last-club'), nCat = Object.keys(ACC.catalog || {}).length;
  return `<h1 class="acc-h sm">${title}</h1><p class="acc-q">${sub}</p>
    ${last && last.id ? `<button class="acc-club last" data-acc="club" data-v="${esc(last.id)}">${accCrest(last, 52)}<span><small>Último club utilizado</small><b>${esc(last.name)}</b></span><span class="acc-arr" aria-hidden="true">›</span></button>` : ''}
    <div class="acc-search">${accIco('search', 18)}<input id="acc-q" type="search" placeholder="Busca por nombre o localidad" value="${esc(ACC.q)}" autocomplete="off" aria-label="Buscar club"></div>
    <div class="acc-clubs" id="acc-clubs" role="list">${accClubList()}</div>
    <p class="acc-p dim">${nCat ? `Clubes del catálogo de la Federació Catalana de Tennis.` : 'Si tu club no aparece, aún no está en el catálogo de Lliga Catalana: pide a la plataforma que lo incorpore.'}</p>${extra}`;
}

/* ---------- Antes de iniciar sesión (y también con la sesión iniciada, si vuelve a elegir) ---------- */
function accLogin() {
  const f = ACC.flow || { step: 'role' };
  if (f.step === 'club' && f.role === 'gestor') return accShell(`${accTop(true)}${accClubPicker('¿De qué club eres gestor deportivo?', 'Selecciona tu club para acceder a su entorno de Lliga Catalana.')}${accAccount()}`, '', 'club');
  if (f.step === 'auth' && f.role) return accAuthStep(f);
  const last = accStore.get('lc-last-role');
  const cards = ACC_ORDER.map(k => `<button class="acc-role" data-acc="role" data-v="${k}">
      <span class="acc-ri">${accIco(k)}</span><span class="acc-rt"><b>${ACC_ROLES[k].t}</b><small>${ACC_ROLES[k].d}</small></span>${last === k ? '<span class="acc-tag">Último usado</span>' : ''}<span class="acc-arr" aria-hidden="true">›</span></button>`).join('');
  return accShell(`${accTop(false)}
    <h1 class="acc-h">Bienvenido a Lliga Catalana</h1>
    <p class="acc-q">¿Cómo quieres acceder?</p>
    <div class="acc-roles" role="list">${cards}</div>
    <p class="acc-foot">Una sola cuenta para todos tus perfiles. Elegir uno no da permisos: después de entrar comprobamos los que tienes asignados.</p>${accAccount()}`, 'acc-login', 'role');
}
function accAuthStep(f) {
  const c = f.role === 'gestor' ? accClub(f.club) : null;
  const head = c ? `<div class="acc-picked">${accCrest(c, 76)}<div><span class="acc-k">Has seleccionado</span><h1 class="acc-h sm">${esc(c.name)}</h1>${c.town ? `<small>${esc(c.town)}</small>` : ''}</div></div>
      <p class="acc-q">Accede a ${esc(c.name)} como gestor deportivo.</p>`
    : `<span class="acc-k">${ACC_ROLES[f.role].t}</span><h1 class="acc-h sm">Accede a Lliga Catalana</h1>
      <p class="acc-q">${f.role === 'capitan' ? 'Al entrar buscaremos los equipos de los que eres capitán.' : ACC.invite ? 'Tienes una invitación para unirte a tu equipo. Entra para aceptarla.' : 'Al entrar buscaremos tu club y tu equipo. No tendrás que elegirlos.'}</p>`;
  return accShell(`${accTop(true)}${head}
    <button class="gbtn" data-acc="signin">${ACC_G}Continuar con Google</button>
    <p class="acc-foot">${f.role === 'gestor' ? 'Comprobaremos que eres gestor de este club. Si aún no lo eres, podrás pedir acceso o usar una invitación.' : 'Si es tu primera vez, ten a mano el enlace de invitación que te envía tu capitán.'}</p>`, c ? 'acc-launch' : '', 'auth');
}

/* ---------- Roles reales ---------- */
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
// Gestor por aprobación o invitación: clubs/<club>/members/<uid> con el rol «gestor» (se suma a meta/app.managerEmails)
async function accLoadMember(u) {
  ACC.member = null; if (!u || !window.CLUB || !CLUB.id) return;
  try { ACC.member = await B.getDoc('clubs/' + CLUB.id + '/members/' + u.uid); } catch (e) { ACC.member = null; }
  try { const pa = await B.getDoc('public/access'); ACC.openClaims = pa?.openClaims === true; } catch (e) {}
}
const accIsMemberGestor = () => (ACC.member?.roles || []).includes('gestor');
function accCtxKey() { return 'lc-ctx-' + (authUser?.email || ''); }
function accSetCtx(k, go) {
  ACC.ctx = k; accStore.set(accCtxKey(), k); accStore.set('lc-last-role', k);
  if (k === 'gestor' && !me) adminSkip = true;
  accApplyCtx();
  if (go) { const h = ACC_ROLES[k].home; if (route() !== h) location.hash = h; else render(); }
}
function accApplyCtx() { ACC_ORDER.forEach(k => document.body.classList.toggle('ctx-' + k, ACC.ctx === k)); }
// Termina el recorrido: entra en el entorno con ese perfil (y ese equipo)
function accFinish(role, tid) {
  accSetFlow(null);
  if (tid && tid !== teamId) switchTeam(tid);
  if (role === 'capitan' && tid) accStore.set('lc-last-team', tid);
  accSetCtx(role, true);
  setTimeout(() => playIntro(), 0);   // la entrada en el entorno del club (una vez por sesión)
  return null;
}

/* ---------- Con la sesión iniciada: render() llama aquí. Devuelve la pantalla de acceso o null si ya puede entrar ---------- */
function accGate() {
  accApplyCtx();
  if (ACC.invite && !me) { if (!ACC.flow) accSetFlow({ role: 'jugador', step: 'check' }); return accInviteView(); }
  if (ACC.invite && me) { accClearInvite(); toast('Ya estás vinculado como ' + pname(me)); }
  if (ACC.ginv) return accGestorInviteView();
  let f = ACC.flow;
  if (!f) {
    // Sesión ya abierta sin recorrido: si no se le conoce ningún perfil, se le pregunta quién es
    if (!me && !isManager && !isAdmin) { accSetFlow({ step: 'role' }); f = ACC.flow; }
    else {
      if (me && !accCapLoaded()) accCheckCaptain();
      const roles = accRoles();
      if (!ACC.ctx || (!roles.includes(ACC.ctx) && (ACC.ctx !== 'capitan' || accCapLoaded()))) { const saved = accStore.get(accCtxKey()); ACC.ctx = roles.includes(saved) ? saved : roles[0] || null; accApplyCtx(); }
      if (ACC.ctx === 'gestor' && !me) adminSkip = true;
      return null;
    }
  }
  if (f.step === 'role' || f.step === 'club' || !f.role) return accLogin();
  if (f.step === 'auth') { accSetFlow({ step: 'check' }); f = ACC.flow; }
  if (f.role === 'gestor') return accGestorCheck(f);
  if (f.role === 'capitan') return accCaptainCheck(f);
  return accPlayerCheck(f);
}
function accRoleSwitch(role) {
  const other = accRoles().filter(k => k !== role);
  return other.length ? `<p class="acc-q sm">Puedes entrar como</p><div class="acc-roles">${other.map(k => `<button class="acc-role" data-acc="enter" data-v="${k}"><span class="acc-ri">${accIco(k)}</span><span class="acc-rt"><b>${ACC_ROLES[k].t}</b><small>${ACC_ROLES[k].d}</small></span><span class="acc-arr">›</span></button>`).join('')}</div>` : '';
}

/* ---------- Gestor ---------- */
function accGestorCheck(f) {
  const c = accClub(f.club);
  if (!c) { accSetFlow({ step: 'club' }); return accLogin(); }
  let ok;
  if (c.id === (window.CLUB && CLUB.id)) ok = isAdmin || isManager;
  else {
    if (!(c.id in ACC.memberOf)) { ACC.memberOf[c.id] = undefined; B.getDoc('clubs/' + c.id + '/members/' + authUser.uid).then(d => { ACC.memberOf[c.id] = d || null; render(); }).catch(() => { ACC.memberOf[c.id] = null; render(); }); }
    if (ACC.memberOf[c.id] === undefined) return accWait('Comprobando tu acceso a ' + c.name + '…');
    ok = (ACC.memberOf[c.id]?.roles || []).includes('gestor');
    if (ok) return accShell(`${accTop(true)}<div class="acc-picked">${accCrest(c, 76)}<div><span class="acc-k">Acceso autorizado</span><h1 class="acc-h sm">${esc(c.name)}</h1></div></div>
      <p class="acc-p">Eres gestor deportivo de este club. Su entorno en Lliga Catalana todavía no está activo: lo prepararemos con sus equipos y su identidad y te avisaremos.</p>${accRoleSwitch('gestor')}${accAccount()}`, 'acc-launch', 'gestor-wait');
  }
  if (ok) { accStore.set('lc-last-club', JSON.stringify({ id: c.id, name: c.name, town: c.town || '', crest: c.crest || '' })); return accFinish('gestor'); }
  accWatchReq();
  if (ACC.req === undefined) return accWait();
  const R = ACC.req && ACC.req.clubId === c.id && ACC.req.role !== 'jugador' ? ACC.req : null;
  const head = `${accTop(true)}<div class="acc-picked">${accCrest(c, 64)}<div><span class="acc-k">${esc(c.name)}</span><h1 class="acc-h sm">Tu acceso como gestor está pendiente de validación</h1></div></div>`;
  if (R && R.status === 'pendiente') return accShell(`${head}
    <p class="acc-p">Hemos enviado tu solicitud a ${esc(c.name)}. Cuando el club la valide entrarás directamente en su entorno, con este mismo correo.</p>
    <div class="acc-acts"><button class="acc-btn" data-acc="ginv-open">Tengo una invitación</button><button class="acc-link" data-acc="req-cancel">Cancelar la solicitud</button></div>${accRoleSwitch('gestor')}${accAccount()}`, '', 'gestor-pend');
  if (R && R.status === 'rechazada') return accShell(`${head}
    <p class="acc-p">El club no ha validado tu solicitud. Si crees que es un error, habla con la gestión del club o pide una invitación.</p>
    <div class="acc-acts"><button class="acc-btn" data-acc="ginv-open">Tengo una invitación</button><button class="acc-link" data-acc="req-form">Volver a solicitarlo</button></div>${accRoleSwitch('gestor')}${accAccount()}`, '', 'gestor-no');
  return accShell(`${head}
    <p class="acc-p">Para entrar en el entorno de ${esc(c.name)} el club tiene que validar que eres su gestor deportivo. Puedes pedírselo ahora o usar la invitación que te hayan enviado.</p>
    <form data-acc-form="req"><label class="acc-lbl" for="acc-msg">Mensaje para el club (opcional)</label><textarea id="acc-msg" name="msg" rows="2" maxlength="300" placeholder="Por ejemplo: soy el director deportivo de la sección de tenis"></textarea>
    <div class="acc-acts"><button class="acc-btn big" type="submit" ${ui.accBusy ? 'disabled' : ''}>${ui.accBusy ? 'Enviando…' : 'Solicitar acceso'}</button><button class="acc-link" type="button" data-acc="ginv-open">Tengo una invitación</button></div></form>${accRoleSwitch('gestor')}${accAccount()}`, '', 'gestor-req');
}
function accWatchReq() {
  if (ACC.reqSub || !authUser) return;
  ACC.reqSub = B.watchDoc('clubRequests/' + authUser.uid, d => {
    const was = ACC.req?.status; ACC.req = d || null;
    if (d?.status === 'aprobada' && was && was !== 'aprobada') {
      if (d.role === 'jugador' && d.invite) { ACC.invite = d.invite; ACC.inv = null; }
      else if (d.clubId === CLUB.id) { location.reload(); return; }
    }
    render();
  });
}
async function accSendReq(msg, role) {
  const f = ACC.flow || {}, c = accClub(f.join?.club || f.club); if (!c) return;
  ui.accBusy = true; render();
  try { await B.set('clubRequests/' + authUser.uid, { uid: authUser.uid, email: authUser.email, name: authUser.name || '', clubId: c.id, clubName: c.name, role: role || 'gestor', msg: String(msg || '').slice(0, 300), status: 'pendiente', at: Date.now() });
    toast('Solicitud enviada'); }
  catch (e) { toast('No se ha podido enviar: ' + (e?.code || e?.message || 'error')); }
  ui.accBusy = false; render();
}
// Invitación de gestor: un código de un solo uso que el club envía a su nuevo gestor
function accGestorInviteView() {
  const G = ACC.ginv;
  if (G.state === 'form' || !G.code) return accShell(`${accTop(true)}<h1 class="acc-h sm">Invitación de gestor</h1><p class="acc-p">Escribe el código que te ha enviado tu club.</p>
    <form class="acc-code" data-acc-form="gcode"><label for="acc-gcode">Código de invitación</label><div class="acc-cin"><input id="acc-gcode" name="code" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="Por ejemplo, K7PQ2XM4" maxlength="40"><button class="acc-btn" type="submit">Continuar</button></div></form>
    <div class="acc-acts"><button class="acc-link" data-acc="ginv-close">Cancelar</button></div>${accAccount()}`, '', 'ginv');
  if (G.state === 'loading' || G.state === 'saving') return accWait(G.state === 'saving' ? 'Activando tu acceso…' : 'Comprobando la invitación…');
  const bad = { missing: 'Esta invitación no existe o no es de gestor.', used: 'Esta invitación ya se ha usado.', expired: 'Esta invitación ha caducado. Pide una nueva al club.', error: G.err || 'No se ha podido usar la invitación.' }[G.state];
  if (bad) return accShell(`${accTop(true)}<h1 class="acc-h sm">No podemos usar esta invitación</h1><p class="acc-p">${esc(bad)}</p><div class="acc-acts"><button class="acc-btn" data-acc="ginv-open">Probar otro código</button><button class="acc-link" data-acc="ginv-close">Volver</button></div>${accAccount()}`, '', 'ginv-bad');
  const d = G.data, c = accClub(d.club) || { name: d.clubName, id: d.club };
  return accShell(`${accTop(true)}<div class="acc-picked">${accCrest(c, 76)}<div><span class="acc-k">Invitación de ${esc(d.byName || 'tu club')}</span><h1 class="acc-h sm">Gestor deportivo de ${esc(c.name)}</h1></div></div>
    <p class="acc-p">Tu cuenta ${esc(authUser.email)} quedará autorizada como gestora deportiva de este club.</p>
    <div class="acc-acts"><button class="acc-btn big" data-acc="ginv-accept">Aceptar y entrar</button><button class="acc-link" data-acc="ginv-close">Ahora no</button></div>`, 'acc-launch', 'ginv-ok');
}
async function accGestorInviteRead(code) {
  ACC.ginv = { code, state: 'loading' }; render();
  try { const d = await B.getDoc('invites/' + code);
    ACC.ginv = { code, data: d, state: !d || d.role !== 'gestor' ? 'missing' : d.usedBy ? 'used' : (d.exp || 0) < Date.now() ? 'expired' : 'ok' }; }
  catch (e) { ACC.ginv = { code, state: 'missing' }; }
  render();
}
async function accGestorInviteAccept() {
  const G = ACC.ginv; if (!G || G.state !== 'ok') return;
  ACC.ginv = { ...G, state: 'saving' }; render();
  try {
    await B.acceptGestorInvite(G.code, G.data.club);
    const c = accClub(G.data.club) || { id: G.data.club, name: G.data.clubName };
    accSetFlow({ role: 'gestor', club: c.id, step: 'check' });
    if (c.id === CLUB.id) { ACC.member = { roles: ['gestor'] }; checkManager(meta); } else ACC.memberOf[c.id] = { roles: ['gestor'] };
    ACC.ginv = null; toast('Acceso de gestor activado');
    if (c.id === CLUB.id) { location.reload(); return; }
    render();
  } catch (e) { ACC.ginv = { ...G, state: 'error', err: /permission/i.test(e?.code || '') ? 'La invitación ya no es válida.' : (e?.message || 'Error') }; render(); }
}

/* ---------- Capitán ---------- */
function accTeamPicker(role, tids, title, sub) {
  const last = accStore.get('lc-last-team');
  const items = tids.map(tid => { const t = clubTeams().find(x => x.id === tid) || { id: tid, name: tid };
    return `<button class="acc-club acc-team ${last === tid ? 'last' : ''}" data-acc="team" data-role="${role}" data-v="${esc(tid)}">${accCrest({ name: CLUB.name, crest: CLUB.crestSm }, 52)}<span><b>${esc(t.name)}</b><small>${esc(CLUB.medium)}${t.cat ? ' · ' + esc(t.cat) : ''}${last === tid ? ' · El último que usaste' : ''}</small></span><span class="acc-arr" aria-hidden="true">›</span></button>`; }).join('');
  return accShell(`${accTop(true)}<span class="acc-k">${ACC_ROLES[role].t}</span><h1 class="acc-h sm">${title}</h1><p class="acc-q">${sub}</p><div class="acc-clubs" role="list">${items}</div>${accAccount()}`, '', 'team');
}
function accCaptainCheck(f) {
  if (!me) return accJoinView(f, 'capitan');
  if (!accCapLoaded()) { accCheckCaptain(); return accWait('Buscando tus equipos…'); }
  const caps = ACC.capTeams;
  if (caps.length === 1) return accFinish('capitan', caps[0]);
  if (caps.length > 1) return accTeamPicker('capitan', caps, '¿Con qué equipo quieres trabajar?', 'Eres capitán de varios equipos. Puedes cambiar de equipo cuando quieras.');
  return accShell(`${accTop(true)}<span class="acc-k">${esc(pname(me))}</span><h1 class="acc-h sm">No figuras como capitán</h1>
    <p class="acc-p">No eres capitán de ningún equipo esta temporada. Los capitanes los asigna la gestión deportiva de tu club.</p>${accRoleSwitch('capitan')}${accAccount()}`, '', 'cap-no');
}

/* ---------- Jugador ---------- */
function accPlayerCheck(f) {
  if (!me) return accJoinView(f, 'jugador');
  if (roster === null && !ACC.rosterWaited) { setTimeout(() => { ACC.rosterWaited = true; render(); }, 1200); return accWait('Buscando tu equipo…'); }
  const tids = (rosterAll().find(p => p.id === me)?.teams || []).filter(t => clubTeams().some(x => x.id === t));
  if (tids.length > 1) return accTeamPicker('jugador', tids, '¿Qué equipo quieres ver?', 'Juegas en varios equipos del club. Puedes cambiar de equipo cuando quieras.');
  return accFinish('jugador', tids[0]);
}
// Sin jugador vinculado: invitación del capitán o solicitud a un club
function accJoinView(f, role) {
  if (ACC.openClaims) return vClaim();
  accWatchReq();
  const R = ACC.req && ACC.req.role === 'jugador' ? ACC.req : null;
  if (R && R.status === 'aprobada' && R.invite && !ACC.inv) { ACC.invite = R.invite; return accInviteView(); }   // el club ya le ha vinculado
  if (R && R.status === 'pendiente' && !f.join) return accShell(`${accTop(true)}<span class="acc-k">${esc(R.clubName)}</span><h1 class="acc-h sm">Solicitud enviada</h1>
    <p class="acc-p">El club revisará tu solicitud y te vinculará a tu ficha de jugador. Si tu capitán te envía un enlace de invitación, también puedes usarlo.</p>
    <div class="acc-acts"><button class="acc-link" data-acc="req-cancel">Cancelar la solicitud</button></div>${accCodeForm()}${accAccount()}`, '', 'join-pend');
  if (f.join?.step === 'club') return accShell(`${accTop(true)}${accClubPicker('¿De qué club eres jugador?', 'El club validará que eres tú antes de darte acceso a tu equipo.')}${accAccount()}`, '', 'join-club');
  if (f.join?.step === 'msg') { const c = accClub(f.join.club); return accShell(`${accTop(true)}<div class="acc-picked">${accCrest(c, 64)}<div><span class="acc-k">Solicitar vinculación</span><h1 class="acc-h sm">${esc(c?.name || '')}</h1></div></div>
    <form data-acc-form="jreq"><label class="acc-lbl" for="acc-msg">¿Quién eres y en qué equipo juegas?</label><textarea id="acc-msg" name="msg" rows="3" maxlength="300" required placeholder="Por ejemplo: Marc Huet, Absoluto Masculino A"></textarea>
    <div class="acc-acts"><button class="acc-btn big" type="submit" ${ui.accBusy ? 'disabled' : ''}>${ui.accBusy ? 'Enviando…' : 'Enviar solicitud'}</button></div></form>${accAccount()}`, 'acc-launch', 'join-msg'); }
  return accShell(`${accTop(true)}<span class="acc-k">${ACC_ROLES[role].t}</span>
    <h1 class="acc-h sm">Aún no estás en ningún equipo</h1>
    <p class="acc-p">${role === 'capitan' ? 'Los capitanes entran igual que los jugadores: con la invitación de su equipo. Después verás la gestión de tu equipo.' : 'Para ver tu equipo necesitas la invitación que te envía tu capitán. Si no la tienes, pide al club que te vincule.'}</p>
    ${accCodeForm()}
    <div class="acc-acts"><button class="acc-btn ghost" data-acc="join-club">Solicitar vinculación a un club</button>${isManager || isAdmin ? `<button class="acc-link" data-acc="enter" data-v="gestor">Entrar como gestor deportivo</button>` : ''}</div>${accAccount()}`, '', 'join');
}
const accCodeForm = () => `<form class="acc-code" data-acc-form="code"><label for="acc-code">Código de invitación</label><div class="acc-cin"><input id="acc-code" name="code" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="Por ejemplo, K7PQ2XM4" maxlength="80"><button class="acc-btn" type="submit">Continuar</button></div></form>`;
function accClearInvite() { ACC.invite = null; ACC.inv = null; try { sessionStorage.removeItem('lc-invite'); } catch (e) {} if (route().startsWith('invitacion-')) history.replaceState(null, '', '#inicio'); }
function accInviteView() {
  const code = ACC.invite, I = ACC.inv;
  if (!I || I.code !== code) {
    ACC.inv = { code, state: 'loading' };
    B.getDoc('invites/' + code).then(d => {
      if (ACC.inv?.code !== code) return;
      if (d && d.role === 'gestor') { accClearInvite(); ACC.ginv = { code, data: d, state: d.usedBy ? 'used' : (d.exp || 0) < Date.now() ? 'expired' : 'ok' }; render(); return; }
      ACC.inv = { code, data: d, state: !d ? 'missing' : d.usedBy ? 'used' : (d.exp || 0) < Date.now() ? 'expired' : 'ok' };
      render();
    }).catch(() => { ACC.inv = { code, state: 'missing' }; render(); });
    return accWait('Abriendo tu invitación…');
  }
  if (I.state === 'loading' || I.state === 'saving') return accWait(I.state === 'saving' ? 'Entrando en tu equipo…' : 'Abriendo tu invitación…');
  const bad = { missing: 'Esta invitación no existe. Revisa que el enlace esté completo o pide uno nuevo a tu capitán.', used: 'Esta invitación ya se ha usado. Si no has sido tú, avisa a tu capitán.', expired: 'Esta invitación ha caducado. Pide un enlace nuevo a tu capitán.', error: I.err || 'No se ha podido aceptar la invitación.' }[I.state];
  if (bad) return accShell(`${accTop(true)}<h1 class="acc-h sm">No podemos usar esta invitación</h1><p class="acc-p">${esc(bad)}</p>
    <div class="acc-acts"><button class="acc-btn" data-acc="invite-drop">Introducir otro código</button></div>${accAccount()}`, '', 'inv-bad');
  const d = I.data, p = { id: d.pid, name: d.name }, club = accClub(d.club) || { name: d.clubName };
  return accShell(`${accTop(true)}
    <div class="acc-inv">${avatar(p, 'lg')}<div><span class="acc-k">Invitación de ${esc(d.byName || 'tu capitán')}</span><h1 class="acc-h sm">¿Eres ${esc(d.name)}?</h1><p class="acc-p">${esc(d.teamName || '')}${d.teamName && club.name ? ', ' : ''}${esc(club.name || '')}. Tu Gmail ${esc(authUser.email)} quedará ligado a este jugador.</p></div></div>
    <div class="acc-acts"><button class="acc-btn big" data-acc="invite-accept">Sí, soy ${esc(String(d.name).split(' ')[0])}</button><button class="acc-link" data-acc="invite-drop">No soy yo</button></div>`, 'acc-launch', 'inv-ok');
}
async function accAcceptInvite() {
  const I = ACC.inv; if (!I || I.state !== 'ok') return;
  ACC.inv = { ...I, state: 'saving' }; render();
  try { await B.claimInvite(I.code, I.data.pid); accClearInvite();
    if (!ACC.flow || !ACC.flow.role) accSetFlow({ role: 'jugador', step: 'check' }); else accSetFlow({ step: 'check', join: null });
    toast('Ya estás en tu equipo'); }
  catch (e) { ACC.inv = { ...I, state: 'error', err: /permission/i.test(e?.code || '') ? 'La invitación ya no es válida o ese jugador ya está vinculado a otra cuenta.' : (e?.message || 'Error') }; render(); }
}

/* ---------- Menú de cuenta y cerrar sesión ---------- */
function accMenuToggle(state) {
  ACC.menu = state === false ? false : (state ? true : !ACC.menu); ACC.menuState = 'menu'; ACC.menuErr = '';
  if (ACC.menu && me && !accCapLoaded()) accCheckCaptain().then(() => ACC.menu && accMenuDraw());
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
      ${roles.length > 1 ? `<p class="acc-m-k">Entrar como</p><div class="acc-m-roles">${roles.map(k => `<button data-acc="enter" data-v="${k}" aria-pressed="${ACC.ctx === k}">${accIco(k, 16)}${ACC_ROLES[k].t}</button>`).join('')}</div>` : roles.length ? `<p class="acc-m-k">Acceso: ${ACC_ROLES[roles[0]].t}</p>` : ''}
      <div class="acc-m-list">${me ? `<button data-acc="go" data-v="perfil">${accIco('user', 17)}Mi perfil</button>` : ''}<button data-acc="go" data-v="yo">${accIco('settings', 17)}Yo: avisos e instalación</button><button class="danger" data-acc="signout">${accIco('logout', 17)}Cerrar sesión</button></div>`;
  el.innerHTML = body;
  el.querySelector('[data-acc="signout-confirm"],[data-acc="enter"][aria-pressed="true"],button')?.focus({ preventScroll: true });
}
function accMenuOutside(e) { const m = document.getElementById('acc-menu'); if (m && !m.contains(e.target) && !e.target.closest('.mebtn')) accMenuToggle(false); }
async function accSignOut() {
  ACC.menu = true; ACC.menuState = 'busy'; accMenuDraw();
  try {
    // Dejar de escuchar antes de cerrar la sesión: así no llegan errores de permisos ni datos de la sesión anterior
    [subs, dataSubs, privSubs, mvpSubs, clubSubs].forEach(arr => { (arr || []).splice(0).forEach(u => { try { u(); } catch (e) {} }); });
    [docsSub, mineSub, ACC.reqSub, ACC.admin.sub].forEach(u => { try { u && u(); } catch (e) {} });
    accStore.set('lc-flow', null); try { sessionStorage.clear(); } catch (e) {}
    await B.signOut();
    location.replace(location.pathname + location.search);   // recarga sin la ruta privada: la memoria queda vacía
  } catch (e) { ACC.menuState = 'error'; ACC.menuErr = 'No se ha podido cerrar la sesión (' + (e?.code || e?.message || 'error') + '). Comprueba la conexión y reinténtalo.'; accMenuDraw(); }
}

/* ---------- Invitaciones (Gestión > Plantilla) ---------- */
function accCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint32Array(10); crypto.getRandomValues(b); return [...b].map(x => A[x % A.length]).join(''); }
const accInviteUrl = code => location.origin + location.pathname + '#invitacion-' + code;
function accInviteCell(p) {
  if (claims[p.id] || !(canPrivate || canClub())) return '';
  const i = ACC.invites[p.id];
  if (!i) return `<button class="textlink" data-acc="inv-new" data-pid="${esc(p.id)}">Invitar</button>`;
  if (i.busy) return `<span class="muted">Creando invitación…</span>`;
  const tel = String(phones[p.id] || '').replace(/[^\d]/g, ''), msg = `Hola ${String(p.name).split(' ')[0]}, este es tu acceso a la app del ${CLUB.medium} en la Lliga Catalana: ${i.url}`;
  return accLinkRow(i.url, 'Enlace de invitación de ' + p.name, 'inv-copy', p.id, `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`);
}
const accLinkRow = (url, label, act, key, wa) => `<span class="acc-invrow"><input readonly value="${esc(url)}" aria-label="${esc(label)}" onclick="this.select()"><button class="btn sm ghost" data-acc="${act}" data-pid="${esc(key)}">Copiar</button>${wa ? `<a class="btn sm" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</span>`;
async function accMakeInvite(pid, tid) {
  const p = rosterAll().find(x => x.id === pid) || player(pid); if (!p) throw new Error('Jugador no encontrado');
  const team = tid || p.teams?.[0] || teamId, code = accCode(), now = Date.now(), t = clubTeams().find(x => x.id === team);
  await B.set('invites/' + code, { pid, name: p.full || p.name, team, teamName: t?.name || '', season: docIdFor(team, viewSeason), club: CLUB.id || '', clubName: CLUB.medium || CLUB.name || '', role: 'jugador',
    by: authUser.uid, byName: (me && player(me)?.name) || authUser.name || authUser.email, at: now, exp: now + 30 * 864e5, usedBy: null });
  return code;
}
async function accNewInvite(pid) {
  ACC.invites[pid] = { busy: true }; renderQuiet();
  try { const code = await accMakeInvite(pid, teamId); ACC.invites[pid] = { code, url: accInviteUrl(code) }; toast('Invitación creada: válida 30 días y para un solo uso'); }
  catch (e) { delete ACC.invites[pid]; toast('No se ha podido crear la invitación (' + (e?.code || e?.message || 'error') + ')'); }
  renderQuiet();
}
async function accNewGestorInvite() {
  ACC.admin.ginv = { busy: true }; renderQuiet();
  const code = accCode(), now = Date.now();
  try { await B.set('invites/' + code, { role: 'gestor', club: CLUB.id, clubName: CLUB.name, by: authUser.uid, byName: authUser.name || authUser.email, byEmail: authUser.email, at: now, exp: now + 14 * 864e5, usedBy: null });
    ACC.admin.ginv = { code, url: accInviteUrl(code) }; toast('Invitación de gestor creada: un solo uso, 14 días'); }
  catch (e) { ACC.admin.ginv = null; toast('No se ha podido crear (' + (e?.code || 'error') + ')'); }
  renderQuiet();
}

/* ---------- Gestión del club: solicitudes (gestores y administradores) y configuración (administradores) ---------- */
function accRequestsPanel() {
  if (!canClub()) return '';
  if (!ACC.admin.sub) ACC.admin.sub = isAdmin ? B.watchColl('clubRequests', m => { ACC.admin.reqs = m; softRender(); })
    : B.watchWhere('clubRequests', 'clubId', CLUB.id, m => { ACC.admin.reqs = m; softRender(); });
  const reqs = Object.entries(ACC.admin.reqs || {}).map(([id, r]) => ({ id, ...r })).filter(r => isAdmin || r.clubId === CLUB.id);
  const pend = reqs.filter(r => r.status === 'pendiente').sort((a, b) => a.at - b.at);
  const done = reqs.filter(r => r.status === 'aprobada' || r.status === 'rechazada').sort((a, b) => (b.decidedAt || 0) - (a.decidedAt || 0)).slice(0, 6);
  const free = rosterAll().filter(p => !claims[p.id]).sort((a, b) => accNorm(a.name).localeCompare(accNorm(b.name)));
  const G = ACC.admin.ginv;
  return `<section class="sec"><div class="sec-h"><h2>Solicitudes de acceso</h2></div>
    ${pend.length ? `<ul class="insights">${pend.map(r => `<li class="acc-reqrow"><span><b>${esc(r.name || r.email)}</b> ${esc(r.email)}<small>${r.role === 'jugador' ? 'Jugador' : 'Gestor deportivo'} · ${esc(r.clubName)}${r.msg ? ' · «' + esc(r.msg) + '»' : ''} · ${relTime(r.at)}</small></span>
      <span class="row" style="gap:6px;flex-wrap:wrap">${r.role === 'jugador' ? `<select data-acc="link-pick" data-v="${esc(r.id)}" aria-label="Jugador de la plantilla"><option value="">¿Qué jugador es?</option>${free.map(p => `<option value="${esc(p.id)}" ${ACC.admin.link[r.id] === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>` : ''}
      <button class="btn sm brass" data-acc="req-ok" data-v="${esc(r.id)}" ${r.role === 'jugador' && !ACC.admin.link[r.id] ? 'disabled' : ''}>${r.role === 'jugador' ? 'Vincular' : 'Aprobar'}</button><button class="btn sm ghost" data-acc="req-no" data-v="${esc(r.id)}">Rechazar</button></span></li>`).join('')}</ul>` : '<div class="empty">No hay solicitudes pendientes.</div>'}
    ${done.length ? `<p class="muted small" style="margin:10px 0 4px">Últimas decisiones</p><ul class="insights">${done.map(r => `<li><span>${r.status === 'aprobada' ? '✓' : '✗'} <b>${esc(r.email)}</b>, ${r.role === 'jugador' ? 'jugador' : 'gestor'} de ${esc(r.clubName)}<small>${r.status === 'aprobada' ? 'Aprobada' : 'Rechazada'} por ${esc(r.decidedByEmail || '')}, ${relTime(r.decidedAt)}</small></span></li>`).join('')}</ul>` : ''}
    <div class="panel" style="margin-top:12px"><b>Invitar a un gestor deportivo</b><p class="muted small" style="margin:4px 0 8px">Crea un enlace de un solo uso (14 días). Quien lo abra con su Google quedará como gestor de ${esc(CLUB.medium)}, sin pasar por la solicitud.</p>
      ${G?.url ? accLinkRow(G.url, 'Enlace de invitación de gestor', 'ginv-copy', 'g', '') : `<button class="btn sm" data-acc="ginv-new" ${G?.busy ? 'disabled' : ''}>${G?.busy ? 'Creando…' : 'Crear invitación de gestor'}</button>`}</div></section>`;
}
function accAdminPanels() {
  if (!isAdmin) return '';
  const imp = ACC.admin.imp, br = accBrand(), id = ACC.admin.brand || {};
  const nCat = ACC.catalog ? Object.keys(ACC.catalog).length : null;
  accLoadCatalog();
  return `<section class="sec"><div class="sec-h"><h2>Acceso de jugadores</h2></div><div class="panel">
    <label class="chkline"><input type="checkbox" data-acc="open-claims" ${ACC.openClaims ? 'checked' : ''}> <span><b>Permitir elegir el nombre sin invitación.</b> Desactivado, cada jugador entra con el enlace que le envía su capitán o la gestión (Gestión, Plantilla, «Invitar»). Es lo recomendado: así nadie puede hacerse pasar por otro jugador.</span></label></div></section>
  <section class="sec"><div class="sec-h"><h2>Identidad del club</h2></div><div class="panel acc-brandp">
    <p class="muted small" style="margin:0 0 10px">Colores de la cabecera, los botones y los carteles dentro del entorno del club. La entrada a la app es común a todos los clubes y el resto del diseño no cambia.</p>
    <div class="row" style="gap:16px;flex-wrap:wrap"><label class="acc-col">Color principal<input type="color" id="acc-c1" value="${br.primary}"></label><label class="acc-col">Color secundario<input type="color" id="acc-c2" value="${br.secondary}"></label>
      <label class="acc-col grow">Correo de contacto<input type="email" id="acc-mail" value="${esc(id.contact?.email || '')}" placeholder="tenis@club.cat"></label><label class="acc-col grow">Teléfono<input type="tel" id="acc-tel" value="${esc(id.contact?.phone || '')}"></label><label class="acc-col grow">Web<input type="url" id="acc-web" value="${esc(id.contact?.web || '')}" placeholder="https://"></label></div>
    <div class="row" style="margin-top:12px;gap:8px"><button class="btn sm brass" data-acc="brand-save">Guardar identidad</button><button class="btn sm ghost" data-acc="brand-reset">Volver a los colores originales</button></div></div></section>
  <section class="sec"><div class="sec-h"><h2>Catálogo de clubes de la FCT</h2>${nCat != null ? `<span class="muted small">${nCat} clubes</span>` : ''}</div><div class="panel">
    <p class="muted small" style="margin:0 0 10px">Es el buscador de clubes de la pantalla de entrada. La FCT no ofrece una API ni una exportación de clubes: carga un CSV o Excel con el listado de <a href="https://fctennis.cat/clubs-afiliats/" target="_blank" rel="noopener">clubs afiliats</a> o el que os facilite la Federació. Columnas: <b>nombre</b> (obligatoria), <b>localidad</b>, <b>provincia</b>, <b>web</b>, <b>codigo</b> (FCT) y <b>escudo</b> (URL de la imagen). Se puede volver a importar para actualizarlo.</p>
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
    const extra = {};
    if (ok && r.role === 'jugador') {
      const pid = ACC.admin.link[id]; if (!pid) throw new Error('Elige el jugador de la plantilla');
      extra.invite = await accMakeInvite(pid); extra.pid = pid;     // el solicitante entra con esta invitación (la ve al instante)
    } else if (ok) {
      await B.set('clubs/' + r.clubId + '/members/' + r.uid, { email: r.email, roles: ['gestor'], approvedBy: authUser.email, at: by.decidedAt, request: id });
      if (isAdmin && r.clubId === CLUB.id) {   // también en la lista de gestores (recibe el informe semanal)
        const managers = [...(meta?.managers || []).filter(x => x.email !== r.email), { name: r.name || '', email: r.email, approvedBy: authUser.email, approvedAt: by.decidedAt }];
        await saveMeta({ managers, managerEmails: managers.map(x => x.email) });
      }
    }
    await B.merge('clubRequests/' + id, { status: ok ? 'aprobada' : 'rechazada', ...by, ...extra });
  }, ok ? (r.role === 'jugador' ? 'Vinculado: ya puede entrar' : 'Acceso aprobado para ' + r.email) : 'Solicitud rechazada');
}
async function accLoadBrand() {
  if (!CLUB.id || ACC.admin.brandLoaded) return; ACC.admin.brandLoaded = true;
  try { const d = await B.getDoc('clubs/' + CLUB.id); if (d) { ACC.admin.brand = d; accStore.set('lc-brand-' + CLUB.id, d.colors ? JSON.stringify(d.colors) : null); accApplyBrand(); softRender(); } } catch (e) {}
}

/* ---------- Eventos ---------- */
function accBack() {
  const f = ACC.flow || {};
  if (ACC.ginv) { ACC.ginv = null; }
  else if (f.join?.step === 'msg') accSetFlow({ join: { step: 'club' } });
  else if (f.join) accSetFlow({ join: null });
  else if (f.step === 'check' && f.role === 'gestor') accSetFlow({ step: 'club' });
  else if (f.step === 'check' || f.step === 'club') accSetFlow({ step: 'role', role: null, club: null });
  else if (f.step === 'auth') accSetFlow(f.role === 'gestor' ? { step: 'club' } : { step: 'role', role: null });
  else accSetFlow({ step: 'role', role: null, club: null });
  ACC.q = ''; render(); scrollTo(0, 0);
}
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-acc]'); if (!el) return;
  const a = el.dataset.acc, v = el.dataset.v;
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  if (a === 'role') { accSetFlow({ role: v, club: null, join: null, step: v === 'gestor' ? 'club' : authUser ? 'check' : 'auth' }); ACC.q = ''; render(); scrollTo(0, 0); }
  else if (a === 'club') {
    const c = accClubs().find(x => x.id === v) || accStore.json('lc-last-club');
    if (ACC.flow?.join) { accSetFlow({ join: { step: 'msg', club: v } }); }
    else { accSetFlow({ club: v, step: authUser ? 'check' : 'auth' }); if (c) accStore.set('lc-last-club', JSON.stringify({ id: c.id, name: c.name, town: c.town || '', crest: c.crest || '' })); }
    ACC.q = ''; render(); scrollTo(0, 0);
  }
  else if (a === 'back') accBack();
  else if (a === 'signin') { el.disabled = true; el.lastChild.textContent = 'Abriendo Google…'; try { await B.signIn(); } finally { el.disabled = false; } }
  else if (a === 'team') accFinish(el.dataset.role, v);
  else if (a === 'enter') { accMenuToggle(false); accSetFlow(null); ACC.ginv = null;
    if (v === 'capitan' && ACC.capTeams?.length > 1) { accSetFlow({ role: 'capitan', step: 'check' }); render(); }
    else accFinish(v, v === 'capitan' ? ACC.capTeams?.[0] : undefined); }
  else if (a === 'go') { accMenuToggle(false); if (v === 'perfil' && me) openSheet(me); else location.hash = v; }
  else if (a === 'signout') { ACC.menu = true; ACC.menuState = 'confirm'; accMenuDraw(); }
  else if (a === 'menu-back') { ACC.menuState = 'menu'; accMenuDraw(); }
  else if (a === 'signout-confirm' || a === 'signout-now') accSignOut();
  else if (a === 'invite-accept') accAcceptInvite();
  else if (a === 'invite-drop') { accClearInvite(); render(); }
  else if (a === 'join-club') { accSetFlow({ join: { step: 'club' } }); ACC.q = ''; render(); scrollTo(0, 0); }
  else if (a === 'req-form') { ACC.req = null; render(); }
  else if (a === 'req-cancel') { await safe(() => B.del('clubRequests/' + authUser.uid), 'Solicitud cancelada'); }
  else if (a === 'ginv-open') { ACC.ginv = { state: 'form' }; render(); }
  else if (a === 'ginv-close') { ACC.ginv = null; render(); }
  else if (a === 'ginv-accept') accGestorInviteAccept();
  else if (a === 'ginv-new') accNewGestorInvite();
  else if (a === 'inv-new') accNewInvite(el.dataset.pid);
  else if (a === 'inv-copy' || a === 'ginv-copy') { const url = a === 'ginv-copy' ? ACC.admin.ginv?.url : ACC.invites[el.dataset.pid]?.url; try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); } catch (x) { el.previousElementSibling?.select(); toast('Selecciona el enlace y cópialo'); } }
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
  else if (el.dataset?.acc === 'link-pick') { ACC.admin.link[el.dataset.v] = el.value || null; renderQuiet(); }
  else if (el.dataset?.acc === 'open-claims') { ACC.openClaims = el.checked;
    saveMeta({ openClaims: el.checked }, el.checked ? 'Se puede elegir el nombre sin invitación' : 'Solo se entra con invitación');
    B.merge('public/access', { openClaims: el.checked }).catch(() => {}); }
});
document.addEventListener('input', e => { if (e.target.id === 'acc-q') { ACC.q = e.target.value; accRefreshClubs(); } });   // solo la lista: sin repintar la pantalla
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-acc-form]'); if (!f) return; e.preventDefault();
  const kind = f.dataset.accForm, val = String(new FormData(f).get(kind === 'jreq' || kind === 'req' ? 'msg' : 'code') || '');
  const code = val.toUpperCase().replace(/^.*INVITACION-/, '').replace(/[^A-Z0-9]/g, '');
  if (kind === 'code') { if (code.length < 6) { toast('Revisa el código: tiene 10 letras y números'); return; } ACC.invite = code; ACC.inv = null; try { sessionStorage.setItem('lc-invite', code); } catch (x) {} render(); }
  else if (kind === 'gcode') { if (code.length < 6) { toast('Revisa el código: tiene 10 letras y números'); return; } accGestorInviteRead(code); }
  else if (kind === 'req') accSendReq(val, 'gestor');
  else if (kind === 'jreq') accSendReq(val, 'jugador').then(() => { accSetFlow({ join: null }); render(); });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ACC.menu) accMenuToggle(false); });
window.addEventListener('hashchange', () => { const h = location.hash.slice(1);
  if (/^invitacion-[A-Za-z0-9]{6,}$/.test(h)) { ACC.invite = h.slice(11).toUpperCase(); ACC.inv = null; try { sessionStorage.setItem('lc-invite', ACC.invite); } catch (e) {}
    if (!authUser) accSetFlow({ role: 'jugador', step: 'auth' }); render(); }
  if (ACC.menu) accMenuToggle(false); });
