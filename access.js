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
// Pantalla de entrada: solo dos opciones. El capitán es un jugador con permisos de su equipo (se detecta solo al entrar).
const ACC_LOGIN = { jugador: { t: 'Soy jugador', d: 'Tu equipo, disponibilidad, convocatorias y resultados. Si eres capitán, también la gestión de tu equipo.' },
  gestor: { t: 'Soy gestor deportivo', d: 'Da de alta tu club, configura sus equipos y gestiona la competición.' } };
const ACC = {
  flow: null,        // {role, club, step, join}: el recorrido de entrada en curso
  ctx: null,         // perfil con el que está dentro ahora
  capTeams: null, capKey: '',
  member: null,      // clubs/<club>/members/<uid> del club de esta app
  memberOf: {},      // lo mismo para el club elegido por un gestor, si es otro
  openClaims: false,   // jugadores y capitanes entran solo con invitación (un administrador puede abrirlo)
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
  if (ACC.flow && ACC.flow.role === 'capitan') ACC.flow.role = 'jugador';
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
  const steps = role === 'gestor' || !role ? ['Perfil', 'Club', 'Acceso'] : ['Perfil', 'Acceso', 'Tu equipo'];
  const at = role === 'gestor' || !role ? ({ role: 0, club: 1, auth: 2, check: 2 }[f.step || 'role'] ?? 0) : ({ role: 0, auth: 1, check: 2 }[f.step || 'role'] ?? 0);
  return `<div class="acc-top">${back ? `<button class="acc-back" data-acc="back" aria-label="Volver al paso anterior">${accIco('back', 18)}Atrás</button>` : `<div class="acc-brand">${ACC_MARK}<span>Lliga Catalana</span></div>`}
    <ol class="acc-steps" aria-label="Pasos">${steps.map((s, i) => `<li class="${i < at ? 'done' : i === at ? 'on' : ''}" ${i === at ? 'aria-current="step"' : ''}><i>${i + 1}</i><span>${s}</span></li>`).join('')}</ol></div>`;
}
const accWait = (msg) => accShell(`${accTop(false)}<p class="acc-wait">${esc(msg || 'Comprobando tu acceso…')}</p>`, '', 'wait');
const accAccount = () => authUser ? `<p class="acc-p dim acc-who">Entras como ${esc(authUser.email)}. <button class="acc-link" data-acc="signout-now">Usar otra cuenta</button></p>` : '';
const accNorm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Escudo: el del club (configurado o subido), el de la FCT si lo publica, o el icono de su web oficial; si no, iniciales
function accIni(c) { return String(c?.name || '?').replace(/\b(club|de|del|la|les|el|i|tennis|tenis|esportiu|ct|c\.t\.)\b/gi, ' ').split(/[\s-]+/).filter(w => /^\p{L}/u.test(w)).map(w => w[0]).join('').slice(0, 3).toUpperCase() || '?'; }
function accCrest(c, s) {
  const box = `width:${s}px;height:${s}px`, ini = `<span class="acc-crest ini" style="${box};font-size:${Math.round(s / 3.2)}px">${esc(accIni(c))}</span>`;
  if (c && c.crest) return `<img class="acc-crest" src="${esc(c.crest)}" alt="" width="${s}" height="${s}" style="${box}" loading="lazy" onerror="accCrestFail(this)">`;
  if (c && c.web) return `<span class="acc-crest-w" style="${box}" data-ini="${esc(accIni(c))}"><img class="acc-crest web" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(c.web)}&amp;sz=128" alt="" width="${s}" height="${s}" style="${box}" loading="lazy" referrerpolicy="no-referrer" onload="if(this.naturalWidth<32)accCrestFail(this)" onerror="accCrestFail(this)"></span>`;
  return ini;
}
// Sin icono propio (o demasiado pequeño para ser un escudo): iniciales
function accCrestFail(img) { const w = img.closest('.acc-crest-w') || img, s = parseInt(img.style.width) || 52; const sp = document.createElement('span'); sp.className = 'acc-crest ini'; sp.style.cssText = `width:${s}px;height:${s}px;font-size:${Math.round(s / 3.2)}px`; sp.textContent = w.dataset?.ini || '?'; w.replaceWith(sp); }

/* ---------- Catálogo de clubes ---------- */
// Catálogo: los clubes de la FCT (portal oficial, api/fct-clubs) y, encima, lo que cargue la plataforma
// (escudos subidos o clubes importados de un CSV/Excel, colección «catalog»)
function accLoadCatalog() {
  if (ACC.catalog !== null) return; ACC.catalog = {}; ACC.fct = ACC.fct || null; ACC.fctErr = false;
  fetch('/api/fct-clubs').then(r => r.ok ? r.json() : Promise.reject(r.status)).then(j => { ACC.fct = j.clubs || []; accRefreshClubs(); }).catch(() => { ACC.fct = []; ACC.fctErr = true; accRefreshClubs(); });
  B.getColl('catalog').then(m => { ACC.catalog = m || {}; accRefreshClubs(); }).catch(() => {});
}
function accClubs() {
  const ownFct = window.CLUB && CLUB.fctId, over = ACC.catalog || {}, seen = new Set(), out = [];
  const add = c => { if (!c.id || seen.has(c.id)) return; seen.add(c.id); out.push(c); };
  (ACC.fct || []).forEach(f => {
    const own = ownFct && f.id === ownFct, o = over[f.id] || {};
    const logo = f.logo ? (/^https?:/.test(f.logo) ? f.logo : 'https://portal.fctennis.cat/' + f.logo.replace(/^\//, '')) : '';
    add({ id: own ? CLUB.id : f.id, fctId: f.id, name: own ? CLUB.name : f.name, short: f.short, town: f.town, province: f.province, web: f.web, crest: own ? (CLUB.crestSm || '') : (o.crest || logo), active: own });
  });
  Object.entries(over).forEach(([id, c]) => { if (!(ACC.fct || []).some(f => f.id === id)) add({ id, ...c }); });
  if (window.CLUB && CLUB.id) add({ id: CLUB.id, name: CLUB.name, town: CLUB.town || '', crest: CLUB.crestSm || '', active: true });
  return out.sort((a, b) => accNorm(a.name).localeCompare(accNorm(b.name)));   // por nombre: ningún club va primero por defecto
}
const accClub = id => accClubs().find(c => c.id === id) || accStore.json('lc-last-club') || null;
function accClubList() {
  const q = accNorm(ACC.q).trim(), words = q.split(/\s+/).filter(Boolean);
  const list = accClubs().filter(c => { const h = accNorm([c.name, c.short, c.town].join(' ')); return words.every(w => h.includes(w)); });
  if (ACC.fct === null && !q) return `<p class="acc-p dim">Cargando los clubes de la Federació Catalana de Tennis…</p>`;
  if (!list.length) return `<p class="acc-p dim">No hay ningún club de la FCT que coincida con «${esc(ACC.q)}».</p>`;
  const more = list.length > 60 ? `<p class="acc-p dim">${list.length} clubes. Escribe para afinar la búsqueda.</p>` : '';
  return more + list.slice(0, 60).map(c => `<button class="acc-club" role="listitem" data-acc="club" data-v="${esc(c.id)}">${accCrest(c, 52)}<span><b>${esc(c.name)}</b><small>${esc(c.town || '')}</small></span><span class="acc-arr" aria-hidden="true">›</span></button>`).join('');
}
function accRefreshClubs() { const box = document.getElementById('acc-clubs'); if (box) box.innerHTML = accClubList(); }
function accClubPicker(title, sub, extra = '') {
  accLoadCatalog();
  const last = accStore.json('lc-last-club');
  return `<h1 class="acc-h sm">${title}</h1><p class="acc-q">${sub}</p>
    ${last && last.id ? `<button class="acc-club last" data-acc="club" data-v="${esc(last.id)}">${accCrest(last, 52)}<span><small>Último club utilizado</small><b>${esc(last.name)}</b></span><span class="acc-arr" aria-hidden="true">›</span></button>` : ''}
    <div class="acc-search">${accIco('search', 18)}<input id="acc-q" type="search" placeholder="Busca por nombre o localidad" value="${esc(ACC.q)}" autocomplete="off" aria-label="Buscar club"></div>
    <div class="acc-clubs" id="acc-clubs" role="list">${accClubList()}</div>
    <p class="acc-p dim">${ACC.fctErr ? 'No hemos podido consultar la Federació Catalana de Tennis ahora mismo. Inténtalo de nuevo en unos minutos.' : 'Clubes afiliados a la Federació Catalana de Tennis. Busca por nombre, nombre corto o localidad.'}</p>${extra}`;
}

/* ---------- Antes de iniciar sesión (y también con la sesión iniciada, si vuelve a elegir) ---------- */
function accLogin() {
  const f = ACC.flow || { step: 'role' };
  if (f.step === 'club' && f.role) {
    const t = { gestor: ['¿De qué club eres gestor deportivo?', 'Selecciona tu club para acceder a su entorno de Lliga Catalana.'],
      capitan: ['¿De qué club eres capitán?', 'Selecciona tu club. Después buscaremos los equipos de los que eres capitán.'],
      jugador: ['¿En qué club juegas?', 'Selecciona tu club. Después buscaremos tu nombre en sus plantillas.'] }[f.role];
    return accShell(`${accTop(true)}${accClubPicker(t[0], t[1])}${accAccount()}`, '', 'club');
  }
  if (f.step === 'auth' && f.role) return accAuthStep(f);
  const last = accStore.get('lc-last-role');
  const cards = ['jugador', 'gestor'].map(k => `<button class="acc-role" data-acc="role" data-v="${k}">
      <span class="acc-ri">${accIco(k)}</span><span class="acc-rt"><b>${ACC_LOGIN[k].t}</b><small>${ACC_LOGIN[k].d}</small></span>${(last === 'capitan' ? 'jugador' : last) === k ? '<span class="acc-tag">Último usado</span>' : ''}<span class="acc-arr" aria-hidden="true">›</span></button>`).join('');
  return accShell(`${accTop(false)}
    <h1 class="acc-h">Bienvenido a Lliga Catalana</h1>
    <p class="acc-q">¿Cómo quieres acceder?</p>
    <div class="acc-roles" role="list">${cards}</div>
    <p class="acc-foot">Una sola cuenta para todo. Elegir una opción no da permisos: después de entrar comprobamos los que tienes. Primero el club se da de alta y configura sus equipos; después entran sus jugadores.</p>${accAccount()}`, 'acc-login', 'role');
}
function accAuthStep(f) {
  const c = f.club ? accClub(f.club) : null;
  const head = c ? `<div class="acc-picked">${accCrest(c, 76)}<div><span class="acc-k">Has seleccionado</span><h1 class="acc-h sm">${esc(c.name)}</h1>${c.town ? `<small>${esc(c.town)}</small>` : ''}</div></div>
      <p class="acc-q">Accede a ${esc(c.name)} como ${ACC_ROLES[f.role].t.toLowerCase()}.</p>`
    : `<span class="acc-k">${ACC_ROLES[f.role].t}</span><h1 class="acc-h sm">Accede a Lliga Catalana</h1>
      <p class="acc-q">${f.role === 'capitan' ? 'Al entrar buscaremos los equipos de los que eres capitán.' : ACC.invite ? 'Tienes una invitación para unirte a tu equipo. Entra para aceptarla.' : 'Al entrar buscaremos tu club y tu equipo. No tendrás que elegirlos.'}</p>`;
  return accShell(`${accTop(true)}${head}
    <button class="gbtn" data-acc="signin">${ACC_G}Continuar con Google</button>
    <p class="acc-foot">${f.role === 'gestor' ? 'Comprobaremos que eres gestor de este club. Si aún no lo eres, podrás pedir acceso o usar una invitación.' : ACC.invite ? 'Al entrar aceptarás tu invitación y verás tu equipo.' : 'Si es tu primera vez, abre el enlace de invitación que te ha enviado tu club o ten a mano su código.'}</p>`, c ? 'acc-launch' : '', 'auth');
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
const accIsMemberGestor = () => (ACC.member?.roles || []).includes('gestor') && ACC.member?.status !== 'inactivo';
// Desactivado por la gestión del club: no entra (ni como jugador ni como gestor)
const accMemberOff = () => ACC.member?.status === 'inactivo';
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
  if (role === 'gestor') accSyncCaptainPids();
  setTimeout(() => playIntro(), 0);   // la entrada en el entorno del club (una vez por sesión)
  return null;
}

/* ---------- Con la sesión iniciada: render() llama aquí. Devuelve la pantalla de acceso o null si ya puede entrar ---------- */
function accGate() {
  accApplyCtx();
  if (accMemberOff() && !isAdmin) return accShell(`${accTop(false)}<h1 class="acc-h sm">Tu acceso está desactivado</h1>
    <p class="acc-p">La gestión de ${esc(CLUB.medium || CLUB.name)} ha desactivado el acceso de esta cuenta. Si crees que es un error, habla con tu capitán o con la gestión del club.</p>${accAccount()}`, '', 'off');
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
      if (canClub()) accSyncCaptainPids();
      // Un jugador solo puede abrir sus equipos: si el guardado en este dispositivo no es suyo, al suyo
      if (me && !canClub() && (roster !== null || ACC.rosterWaited)) { const mt = accMyTeams(); if (mt.length && !mt.some(t => t.id === teamId)) setTimeout(() => switchTeam(mt[0].id), 0); }
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

// Equipos que puede ver: la gestión, todos; un jugador o capitán, solo los suyos (las reglas hacen lo mismo)
function accMyTeams() {
  const all = clubTeams(); if (canClub()) return all;
  const mine = new Set([...(rosterAll().find(p => p.id === me)?.teams || []), ...(ACC.capTeams || [])]);
  const out = all.filter(t => mine.has(t.id));
  return out.length ? out : all.filter(t => t.id === teamId);
}
// Capitanes de todo el club en meta/app.captainPids: las reglas lo usan para teléfonos, fotos y la lista de nombres
// Capitanes oficiales del equipo (los marca la gestión). Temporadas anteriores sin el campo: sus capitanes actuales.
const accOfficial = Sx => Array.isArray(Sx?.officialCaptains) ? Sx.officialCaptains : (Sx?.captains || []);
const accIsOfficialCap = () => !!(me && accOfficial(S).includes(me));
// meta/app.captainPids: con la base de datos real lo recalcula el servidor a partir de las temporadas (así un capitán
// que nombra a otro no puede escribir la lista); en la vista previa, aquí.
async function accSyncCaptainPids(force, over = {}) {
  if (!(canClub() || me) || (ACC.capSynced && !force)) return; ACC.capSynced = true;
  const t = B.idToken ? await B.idToken().catch(() => null) : null;
  if (t) { try { const r = await fetch('/api/access-request', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sync-captains' }) });
    const j = await r.json().catch(() => ({})); if (j.captainPids && meta) meta.captainPids = j.captainPids; } catch (e) {} return; }
  if (!canClub()) return;
  const all = new Set();
  await Promise.all(clubTeams().map(async t => { try { const d = over[t.id] ? { captains: over[t.id] } : t.id === teamId && force ? S : await B.getDoc('seasons/' + docIdFor(t.id, viewSeason)); (d?.captains || []).forEach(x => all.add(x)); } catch (e) {} }));
  const list = [...all].sort(), now = [...(meta?.captainPids || [])].sort();
  if (list.join() !== now.join()) { try { await B.merge('meta/app', { captainPids: list }); if (meta) meta.captainPids = list; } catch (e) {} }
}
// Historial de acciones sensibles del club (solo se añade; las reglas no dejan editarlo ni borrarlo)
function accAudit(action, data = {}) {
  if (!authUser || !window.CLUB || !CLUB.id) return Promise.resolve();
  const id = Date.now().toString(36) + '-' + accCode().slice(0, 4);
  return B.set('clubs/' + CLUB.id + '/audit/' + id, { action, data, by: authUser.uid, byEmail: authUser.email, byName: (me && player(me)?.name) || authUser.name || '', at: Date.now() }).catch(() => {});
}

/* ---------- Gestor ---------- */
function accGestorCheck(f) {
  const c = accClub(f.club);
  if (!c) { accSetFlow({ step: 'club' }); return accLogin(); }
  let ok; const sw = c.id === (window.CLUB && CLUB.id) ? accRoleSwitch('gestor') : '';   // en un club que se da de alta no hay equipos donde entrar como jugador
  if (c.id === (window.CLUB && CLUB.id)) ok = isAdmin || isManager;
  else {
    if (!(c.id in ACC.memberOf)) { ACC.memberOf[c.id] = undefined;
      const done = d => { if (ACC.memberOf[c.id] === undefined) { ACC.memberOf[c.id] = d || null; render(); } };
      B.getDoc('clubs/' + c.id + '/members/' + authUser.uid).then(done).catch(() => done(null)); setTimeout(() => done(null), 8000); }
    if (ACC.memberOf[c.id] === undefined) return accWait('Comprobando tu acceso a ' + c.name + '…');
    ok = (ACC.memberOf[c.id]?.roles || []).includes('gestor');
    if (ok) return accShell(`${accTop(true)}<div class="acc-picked">${accCrest(c, 76)}<div><span class="acc-k">Acceso autorizado</span><h1 class="acc-h sm">${esc(c.name)}</h1></div></div>
      <p class="acc-p">Eres gestor deportivo de este club. Su entorno en Lliga Catalana todavía no está activo: lo prepararemos con sus equipos y su identidad y te avisaremos.</p>${sw}${accAccount()}`, 'acc-launch', 'gestor-wait');
  }
  if (ok) { accStore.set('lc-last-club', JSON.stringify({ id: c.id, name: c.name, town: c.town || '', crest: c.crest || '', web: c.web || '' })); return accFinish('gestor'); }
  accWatchReq();
  if (ACC.req === undefined) return accWait();
  const R = ACC.req && ACC.req.clubId === c.id && ACC.req.role !== 'jugador' ? ACC.req : null;
  const head = `${accTop(true)}<div class="acc-picked">${accCrest(c, 64)}<div><span class="acc-k">${esc(c.name)}</span><h1 class="acc-h sm">Tu acceso como gestor está pendiente de validación</h1></div></div>`;
  if (R && R.status === 'pendiente') return accShell(`${head}
    <p class="acc-p">Tu solicitud está registrada. La valida el equipo de Lliga Catalana; cuando la aprueben entrarás directamente en el entorno de ${esc(c.name)}, con este mismo correo.</p>${accNotifyLine(R)}
    <div class="acc-acts"><button class="acc-btn" data-acc="ginv-open">Tengo una invitación</button><button class="acc-link" data-acc="req-cancel">Cancelar la solicitud</button></div>${sw}${accAccount()}`, '', 'gestor-pend');
  if (R && R.status === 'rechazada') return accShell(`${head}
    <p class="acc-p">El club no ha validado tu solicitud. Si crees que es un error, habla con la gestión del club o pide una invitación.</p>
    <div class="acc-acts"><button class="acc-btn" data-acc="ginv-open">Tengo una invitación</button><button class="acc-link" data-acc="req-form">Volver a solicitarlo</button></div>${sw}${accAccount()}`, '', 'gestor-no');
  return accShell(`${head}
    <p class="acc-p">Para entrar en el entorno de ${esc(c.name)} hay que validar que eres su gestor deportivo. Envía la solicitud y te avisaremos, o usa la invitación que te hayan enviado.</p>
    <form data-acc-form="req"><label class="acc-lbl" for="acc-msg">Tu cargo en el club (opcional)</label><textarea id="acc-msg" name="msg" rows="2" maxlength="300" placeholder="Por ejemplo: soy el director deportivo de la sección de tenis"></textarea>
    <div class="acc-acts"><button class="acc-btn big" type="submit" ${ui.accBusy ? 'disabled' : ''}>${ui.accBusy ? 'Enviando…' : 'Solicitar acceso'}</button><button class="acc-link" type="button" data-acc="ginv-open">Tengo una invitación</button></div></form>${sw}${accAccount()}`, '', 'gestor-req');
}
function accWatchReq() {
  if (ACC.reqSub || !authUser) return;
  // Si la base de datos no deja leerla (reglas sin publicar, sin conexión) no se queda esperando: sigue como «sin solicitud»
  const fail = e => { if (ACC.req === undefined) { ACC.req = null; ACC.reqErr = e?.code || 'error'; render(); } };
  setTimeout(() => fail({ code: 'timeout' }), 8000);
  ACC.reqSub = B.watchDoc('clubRequests/' + authUser.uid, d => { ACC.reqErr = null;
    const was = ACC.req?.status; ACC.req = d || null;
    if (d?.status === 'aprobada' && was && was !== 'aprobada') {
      if (d.role === 'jugador' && d.invite) { ACC.invite = d.invite; ACC.inv = null; }
      else if (d.clubId === CLUB.id) { location.reload(); return; }
    }
    render();
  }, fail);
}
async function accSendReq(msg, role, extra = {}) {
  const f = ACC.flow || {}, c = accClub(f.club) || (window.CLUB && { id: CLUB.id, name: CLUB.name }); if (!c) return;
  const name = f.who ? (f.who.first + ' ' + f.who.last).trim() : (authUser.name || '');
  ui.accBusy = true; render();
  try { await B.set('clubRequests/' + authUser.uid, { uid: authUser.uid, email: authUser.email, name, clubId: c.id, clubName: c.name, role: role || 'gestor', msg: String(msg || '').slice(0, 300), status: 'pendiente', at: Date.now(), ...extra });
    accNotifyReq(); toast('Solicitud enviada'); }
  catch (e) { toast(/permission/.test(e?.code || '') ? 'No se ha podido enviar: la base de datos aún no acepta solicitudes (faltan las reglas nuevas de Firestore)' : 'No se ha podido enviar: ' + (e?.code || e?.message || 'error')); }
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

// Aviso por correo a quien tiene que validar la solicitud (api/access-request.js)
async function accNotifyReq(resend) {
  ACC.notifyBusy = true; ACC.notifyErr = ''; render();
  try { const t = await B.idToken(); if (!t) { ACC.notifyBusy = false; render(); return; }   // vista previa: sin servidor
    const r = await fetch('/api/access-request', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ resend: !!resend }) }); const j = await r.json().catch(() => ({}));
    if (!r.ok || j.ok === false) throw new Error(j.error || 'error ' + r.status);
    ACC.notify = j.who || ACC.notify; if (resend) toast(j.skipped ? 'Ya se avisó hace un momento' : 'Aviso enviado de nuevo'); }
  catch (e) { ACC.notifyErr = e.message || 'error'; }
  ACC.notifyBusy = false; render();
}
// Estado real del aviso por correo de una solicitud (notifiedAt lo escribe el servidor al enviarlo)
function accNotifyLine(R) {
  if (!R) return '';
  if (!R.notifiedAt && !ACC.notifyTried && !ACC.notifyBusy) { ACC.notifyTried = true; setTimeout(() => accNotifyReq(false), 0); }   // solicitudes que nunca llegaron a avisar
  const st = ACC.notifyBusy ? 'Enviando el aviso por correo…' : ACC.notifyErr ? 'No se ha podido enviar el aviso por correo: ' + ACC.notifyErr
    : R.notifiedAt ? 'Aviso enviado por correo ' + relTime(R.notifiedAt) + '.' : 'El aviso por correo aún no se ha enviado.';
  return `<p class="acc-p dim">${esc(st)} ${ACC.notifyBusy ? '' : '<button class="acc-link" data-acc="req-renotify">Reenviar el aviso</button>'}</p>`;
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
  if (!accCapLoaded()) { accCheckCaptain(); return accWait('Buscando tu equipo…'); }
  return accFinish((ACC.capTeams || []).includes(tids[0]) ? 'capitan' : 'jugador', tids[0]);
}
// Sin membresía: jugadores y capitanes entran solo con una invitación de su club. También pueden pedir acceso a un
// club activo en Lliga Catalana (no al catálogo de la FCT); pedirlo no da nada hasta que el club lo acepta.
const accActiveClubs = () => (window.CLUB && CLUB.id ? [{ id: CLUB.id, name: CLUB.name, town: CLUB.town || '', crest: CLUB.crestSm || '' }] : []);
function accJoinView(f, role) {
  accWatchReq();
  if (ACC.req === undefined) return accWait();
  const R = ACC.req && ACC.req.role === 'jugador' ? ACC.req : null;
  if (R && R.status === 'aprobada' && R.invite && !ACC.inv) { ACC.invite = R.invite; return accInviteView(); }   // el club ya le ha vinculado
  if (R && R.status === 'pendiente') return accShell(`${accTop(true)}<div class="acc-picked">${accCrest(accClub(R.clubId) || {}, 64)}<div><span class="acc-k">${esc(R.clubName)}</span><h1 class="acc-h sm">Solicitud enviada</h1></div></div>
    <p class="acc-p">${R.pidName ? `Has dicho que eres <b>${esc(R.pidName)}</b>${R.teamName ? ' (' + esc(R.teamName) + ')' : ''}. Tu capitán o la gestión del club lo confirmará y entrarás directamente.` : 'El capitán de tu equipo o la gestión del club te vinculará a tu ficha de jugador y entrarás directamente.'}</p>${accNotifyLine(R)}
    <div class="acc-acts"><button class="acc-link" data-acc="req-cancel">Cancelar la solicitud</button></div>${accCodeForm('¿Te ha llegado la invitación? Introdúcela y entras ya.')}${accAccount()}`, '', 'join-pend');
  const c = accActiveClubs()[0] || {}, L = ACC.link || {}, who = f.who || {};
  const head = (t, k) => `${accTop(true)}<div class="acc-picked">${accCrest(c, 64)}<div><span class="acc-k">${esc(k || c.name || '')}</span><h1 class="acc-h sm">${t}</h1></div></div>`;
  const reqBtn = (pid, label) => `<button class="acc-btn ghost" data-acc="link-req" data-v="${esc(pid || '')}">${label || 'Pedir al club que me vincule'}</button>`;
  if (f.join === 'link') {
    if (L.busy) return accWait('Comprobando tus datos con la plantilla oficial…');
    const st = L.res?.status, cand = L.res?.candidates || [];
    if (st === 'cerrado') return accShell(`${head('Tu club aún no ha abierto el registro')}<p class="acc-p">${esc(c.name || 'Tu club')} está preparando sus equipos y plantillas en Lliga Catalana. Cuando su gestor deportivo lo active podrás entrar con tus datos. Si te han enviado una invitación, úsala:</p>${accCodeForm()}${accAccount()}`, 'acc-launch', 'join-closed');
    if (st === 'ocupada') return accShell(`${head('Esta ficha ya tiene cuenta')}<p class="acc-p">La ficha de <b>${esc(L.res.name)}</b> ya está vinculada a otra cuenta de Google. Si eres tú y no la reconoces, pide al club que la revise.</p><div class="acc-acts">${reqBtn('', 'Pedir al club que lo revise')}<button class="acc-link" data-acc="link-edit">Volver</button></div>${accAccount()}`, 'acc-launch', 'join-taken');
    if (st === 'limite' || st === 'desactivado') return accShell(`${head(st === 'limite' ? 'Demasiados intentos' : 'Tu acceso está desactivado')}<p class="acc-p">${st === 'limite' ? 'Por seguridad, hoy ya no se pueden hacer más comprobaciones con esta cuenta. Inténtalo mañana o pide al club que te vincule.' : 'La gestión del club ha desactivado el acceso de esta cuenta.'}</p><div class="acc-acts">${st === 'limite' ? reqBtn() : ''}</div>${accAccount()}`, 'acc-launch', 'join-limit');
    if (st === 'pedir-licencia' || st === 'licencia') return accShell(`${head(st === 'licencia' ? 'La licencia no coincide' : 'Hemos encontrado tu ficha')}
      <p class="acc-p">${cand.map(x => `<b>${esc(x.name)}</b> (${esc(x.teams.map(t => t.name).join(', '))})`).join(', ')}. ${st === 'licencia' ? 'El número de licencia no coincide con el de la plantilla oficial. Revísalo (está en tu licencia de la FCT o en las actas):' : 'Para entrar directamente, confirma tu número de licencia federativa (está en tu licencia de la FCT o en las actas):'}</p>
      <form class="acc-code" data-acc-form="lic"><label for="acc-lic">Número de licencia</label><div class="acc-cin"><input id="acc-lic" name="lic" inputmode="numeric" autocomplete="off" maxlength="20" value="${esc(who.licence || '')}" placeholder="Por ejemplo, 0712345"><button class="acc-btn" type="submit">Comprobar</button></div></form>
      <p class="acc-p dim">¿No la tienes a mano? El club puede validarte.</p><div class="acc-acts">${reqBtn(cand.length === 1 ? cand[0].pid : '', cand.length === 1 ? 'Soy ' + esc(cand[0].name.split(' ')[0]) + ': pedir al club que me vincule' : '')}<button class="acc-link" data-acc="link-edit">Cambiar mis datos</button></div>${accAccount()}`, 'acc-launch', 'join-lic');
    if (st === 'nombre') return accShell(`${head('Los datos no coinciden')}<p class="acc-p">Esa licencia pertenece a otro jugador de la plantilla oficial. Revisa tu nombre, apellidos y licencia, o pide al club que te vincule.</p><div class="acc-acts">${reqBtn()}<button class="acc-link" data-acc="link-edit">Cambiar mis datos</button></div>${accAccount()}`, 'acc-launch', 'join-mismatch');
    if (st === 'no' || L.err) return accShell(`${head('No apareces en las plantillas')}<p class="acc-p">${L.err ? 'No hemos podido comprobarlo: ' + esc(L.err) + '.' : `No encontramos a <b>${esc((who.first || '') + ' ' + (who.last || ''))}</b> en las plantillas oficiales de ${esc(c.name || 'tu club')}. Si acabas de entrar en el equipo, pide al club que te vincule.`}</p><div class="acc-acts">${reqBtn()}<button class="acc-link" data-acc="link-edit">Cambiar mis datos</button></div>${accAccount()}`, 'acc-launch', 'join-none');
  }
  // Por defecto: identificarse con los datos de la licencia federativa
  return accShell(`${head('Identifícate', 'Soy jugador · ' + (c.name || ''))}
    <p class="acc-p">Con tu nombre, apellidos y número de licencia te buscamos en la plantilla oficial de tu equipo y entras directamente. Si eres capitán, también tendrás la gestión de tu equipo.</p>
    ${accWhoForm(f)}
    ${accCodeForm('¿Te han enviado una invitación por correo o WhatsApp? Ábrela o escribe aquí el código.')}
    ${isManager || isAdmin ? `<div class="acc-acts"><button class="acc-link" data-acc="enter" data-v="gestor">Entrar como gestor deportivo</button></div>` : ''}${accAccount()}`, 'acc-launch', 'join');
}
function accWhoForm(f) {
  const g = String(authUser?.name || '').trim().split(/\s+/), w = f.who || { first: g[0] || '', last: g.slice(1).join(' ') };
  return `<form class="acc-who-f" data-acc-form="who-find"><div class="acc-2c"><label class="acc-lbl">Nombre<input name="first" required maxlength="40" value="${esc(w.first)}" autocomplete="given-name"></label><label class="acc-lbl">Apellidos<input name="last" required maxlength="60" value="${esc(w.last)}" autocomplete="family-name"></label></div>
    <label class="acc-lbl">Número de licencia federativa<input name="licence" inputmode="numeric" maxlength="20" value="${esc(w.licence || '')}" autocomplete="off" placeholder="Si no la sabes, el club te validará"></label>
    <label class="acc-lbl">Correo<input value="${esc(authUser?.email || '')}" readonly aria-readonly="true"></label><p class="acc-p dim" style="margin-top:-4px">Es el de tu cuenta de Google: con él entrarás siempre.</p>
    <div class="acc-acts"><button class="acc-btn big" type="submit">Entrar</button></div></form>`;
}
// Vínculo verificado: lo hace el servidor (nombre + licencia contra la plantilla oficial, solo en clubes activados).
// En la vista previa, sin servidor, se simula aquí con las mismas reglas.
async function accLinkMe(who) {
  ACC.link = { busy: true }; accSetFlow({ who, join: 'link' }); render();
  try {
    const t = await B.idToken(); let res;
    if (t) { const r = await fetch('/api/access-request', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'link', first: who.first, last: who.last, licence: who.licence || '' }) });
      res = await r.json().catch(() => ({})); if (!r.ok) throw new Error(res.error || 'error ' + r.status); }
    else res = await accLinkLocal(who);
    ACC.link = { res };
    if (res.status === 'vinculado') { accSetFlow({ step: 'check', join: null }); toast(res.captain?.length ? 'Ya estás dentro, como capitán de tu equipo' : 'Ya estás en tu equipo');
      ACC.capKey = ''; try { ACC.member = await B.getDoc('clubs/' + CLUB.id + '/members/' + authUser.uid); } catch (e) {} }
  } catch (e) { ACC.link = { err: e.message || 'error' }; }
  render();
}
async function accLinkLocal(who) {
  const club = await B.getDoc('clubs/' + CLUB.id); if (!club?.activation?.at) return { status: 'cerrado' };
  const N = s => accNorm(s).replace(/[^a-z0-9ñ ]+/g, ' ').split(/\s+/).filter(w => w.length > 1), lic = x => String(x || '').replace(/[^0-9a-z]/gi, '').replace(/^0+/, '').toUpperCase();
  const F = N(who.first), Ls = N(who.last), Lc = lic(who.licence), m0 = await B.getDoc('meta/app') || {}, all = new Map();
  for (const t of clubTeams()) { const sid = docIdFor(t.id, m0.current || viewSeason), S = await B.getDoc('seasons/' + sid); if (!S) continue; const off = Array.isArray(S.officialCaptains) ? S.officialCaptains : (S.captains || []);
    (S.players || []).filter(p => p.active !== false).forEach(p => { const m = all.get(p.id) || { pid: p.id, name: p.name, full: p.full || p.name, lic: p.lic || '', teams: [] }; m.teams.push({ id: t.id, name: t.name, season: sid, official: off.includes(p.id), S }); all.set(p.id, m); }); }
  const nameOk = m => { const n = N(m.full + ' ' + m.name); return F.every(x => n.includes(x)) && Ls.some(x => n.includes(x)); };
  const L = [...all.values()], bl = Lc ? L.filter(m => m.lic && lic(m.lic) === Lc) : [];
  if (bl.length === 1 && nameOk(bl[0])) {
    const m = bl[0], cl = await B.getDoc('claims/' + m.pid); if (cl && cl.email !== authUser.email) return { status: 'ocupada', name: m.name };
    await B.claim(m.pid); await B.merge('clubs/' + CLUB.id + '/members/' + authUser.uid, { pid: m.pid, email: authUser.email, roles: ['jugador'], status: 'activo' });
    const caps = m.teams.filter(x => x.official); for (const x of caps) if (!(x.S.captains || []).includes(m.pid)) await B.update('seasons/' + x.season, { captains: [...(x.S.captains || []), m.pid] });
    return { status: 'vinculado', pid: m.pid, captain: caps.map(x => x.id) };
  }
  if (bl.length) return { status: 'nombre' };
  const bn = L.filter(nameOk); if (bn.length) return { status: Lc ? 'licencia' : 'pedir-licencia', candidates: bn.map(m => ({ pid: m.pid, name: m.name, teams: m.teams.map(x => ({ id: x.id, name: x.name, season: x.season })) })) };
  return { status: 'no' };
}
async function accLinkReq(pid) {
  const x = (ACC.link?.res?.candidates || []).find(m => m.pid === pid), t = x?.teams?.[0] || {};
  accSendReq('', 'jugador', x ? { pid, pidName: x.name, team: t.id || '', teamName: t.name || '', season: t.season || '' } : {});
}
const accCodeForm = (hint) => `<form class="acc-code" data-acc-form="code">${hint ? `<p class="acc-p dim">${hint}</p>` : ''}<label for="acc-code">Código de invitación</label><div class="acc-cin"><input id="acc-code" name="code" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="Por ejemplo, K7PQ2XM4" maxlength="80"><button class="acc-btn" type="submit">Continuar</button></div></form>`;
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
  // Alta como miembro del club en el mismo lote (si ya es gestor, se le añade el rol de jugador)
  const m = ACC.member, opt = !m ? { member: CLUB.id } : accIsMemberGestor() ? { member: CLUB.id, roles: m.roles || [] } : {};
  try {
    // Con las reglas anteriores aún publicadas no se puede crear el miembro en el mismo lote: se vincula sin él
    try { await B.claimInvite(I.code, I.data.pid, opt); } catch (e) { if (!opt.member || !/permission/i.test(e?.code || '')) throw e; opt.member = null; await B.claimInvite(I.code, I.data.pid, {}); }
    accClearInvite(); accAudit('invitacion-aceptada', { code: I.code, pid: I.data.pid, team: I.data.team || null });
    ACC.member = opt.member ? { ...(m || {}), pid: I.data.pid, roles: [...new Set([...((m && m.roles) || []), 'jugador'])], status: (m && m.status) || 'activo' } : m;
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
async function accMakeInvite(pid, tid, extra = {}) {
  const p = rosterAll().find(x => x.id === pid) || player(pid); if (!p) throw new Error('Jugador no encontrado');
  const team = tid || p.teams?.[0] || teamId, code = accCode(), now = Date.now(), t = clubTeams().find(x => x.id === team);
  await B.set('invites/' + code, { pid, name: p.full || p.name, team, teamName: t?.name || '', season: docIdFor(team, viewSeason), club: CLUB.id || '', clubName: CLUB.medium || CLUB.name || '', role: 'jugador',
    by: authUser.uid, byName: (me && player(me)?.name) || authUser.name || authUser.email, at: now, exp: now + 30 * 864e5, usedBy: null, ...extra });
  accAudit('invitacion-creada', { code, pid, team, role: extra.role || 'jugador', email: extra.email || null });
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
  pend.forEach(r => { if (r.pid && !(r.id in ACC.admin.link)) ACC.admin.link[r.id] = r.pid; });   // la ficha que eligió el jugador
  const done = reqs.filter(r => r.status === 'aprobada' || r.status === 'rechazada').sort((a, b) => (b.decidedAt || 0) - (a.decidedAt || 0)).slice(0, 6);
  const free = rosterAll().filter(p => !claims[p.id]).sort((a, b) => accNorm(a.name).localeCompare(accNorm(b.name)));
  const G = ACC.admin.ginv;
  return `<section class="sec"><div class="sec-h"><h2>Solicitudes de acceso</h2></div>
    ${pend.length ? `<ul class="insights">${pend.map(r => `<li class="acc-reqrow"><span><b>${esc(r.name || r.email)}</b> ${esc(r.email)}<small>${r.role === 'jugador' ? 'Jugador' + (r.pidName ? ', dice ser ' + esc(r.pidName) + (r.teamName ? ' (' + esc(r.teamName) + ')' : '') : '') : 'Gestor deportivo'} · ${esc(r.clubName)}${r.msg ? ' · «' + esc(r.msg) + '»' : ''} · ${relTime(r.at)}</small></span>
      <span class="row" style="gap:6px;flex-wrap:wrap">${r.role === 'jugador' ? `<select data-acc="link-pick" data-v="${esc(r.id)}" aria-label="Jugador de la plantilla"><option value="">¿Qué jugador es?</option>${free.map(p => `<option value="${esc(p.id)}" ${ACC.admin.link[r.id] === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>` : ''}
      <button class="btn sm brass" data-acc="req-ok" data-v="${esc(r.id)}" ${r.role === 'jugador' && !ACC.admin.link[r.id] ? 'disabled' : ''}>${r.role === 'jugador' ? 'Vincular' : 'Aprobar'}</button><button class="btn sm ghost" data-acc="req-no" data-v="${esc(r.id)}">Rechazar</button></span></li>`).join('')}</ul>` : '<div class="empty">No hay solicitudes pendientes.</div>'}
    ${done.length ? `<p class="muted small" style="margin:10px 0 4px">Últimas decisiones</p><ul class="insights">${done.map(r => `<li><span>${r.status === 'aprobada' ? '✓' : '✗'} <b>${esc(r.email)}</b>, ${r.role === 'jugador' ? 'jugador' : 'gestor'} de ${esc(r.clubName)}<small>${r.status === 'aprobada' ? 'Aprobada' : 'Rechazada'} por ${esc(r.decidedByEmail || '')}, ${relTime(r.decidedAt)}</small></span></li>`).join('')}</ul>` : ''}
    <div class="panel" style="margin-top:12px"><b>Invitar a un gestor deportivo</b><p class="muted small" style="margin:4px 0 8px">Crea un enlace de un solo uso (14 días). Quien lo abra con su Google quedará como gestor de ${esc(CLUB.medium)}, sin pasar por la solicitud.</p>
      ${G?.url ? accLinkRow(G.url, 'Enlace de invitación de gestor', 'ginv-copy', 'g', '') : `<button class="btn sm" data-acc="ginv-new" ${G?.busy ? 'disabled' : ''}>${G?.busy ? 'Creando…' : 'Crear invitación de gestor'}</button>`}</div></section>`;
}
// Plantilla del equipo: solicitudes de jugadores que dicen ser de este equipo (las valida el capitán o la gestión)
function accTeamRequests() {
  if (!(canPrivate || canClub())) return '';
  const season = SEASON_PATH.split('/')[1];
  if (ACC.team?.season !== season) { try { ACC.team?.sub && ACC.team.sub(); } catch (e) {} ACC.team = { season, reqs: {}, sub: B.watchWhere('clubRequests', 'season', season, m => { ACC.team.reqs = m; softRender(); }) }; }
  const pend = Object.entries(ACC.team.reqs || {}).map(([id, r]) => ({ id, ...r })).filter(r => r.status === 'pendiente' && r.role === 'jugador');
  if (!pend.length) return '';
  return `<div class="panel acc-teamreq"><b>Solicitudes de acceso</b><p class="muted small" style="margin:4px 0 8px">Personas que dicen ser jugadores de este equipo. Acepta solo si las reconoces: entrarán con su ficha.</p>
    <ul class="insights">${pend.map(r => `<li class="acc-reqrow"><span><b>${esc(r.name || r.email)}</b> ${esc(r.email)}<small>Dice ser ${esc(r.pidName || '?')} · ${relTime(r.at)}</small></span>
      <span class="row" style="gap:6px"><button class="btn sm brass" data-acc="req-ok" data-v="${esc(r.id)}">Aceptar</button><button class="btn sm ghost" data-acc="req-no" data-v="${esc(r.id)}">Rechazar</button></span></li>`).join('')}</ul></div>`;
}
function accAdminPanels() {
  if (!isAdmin) return '';
  const imp = ACC.admin.imp, br = accBrand(), id = ACC.admin.brand || {};
  const nCat = ACC.catalog ? Object.keys(ACC.catalog).length : null;
  accLoadCatalog();
  return `<section class="sec"><div class="sec-h"><h2>Acceso de jugadores (plataforma)</h2></div><div class="panel">
    <label class="chkline"><input type="checkbox" data-acc="open-claims" ${ACC.openClaims ? 'checked' : ''}> <span><b>Permitir entrar sin invitación eligiendo la ficha.</b> Desactivado (lo recomendado): jugadores y capitanes solo entran con su invitación personal o con una solicitud que valida su capitán o la gestión. Actívalo solo para un periodo de alta controlado: cualquiera con cuenta de Google podría elegir una ficha libre.</span></label></div></section>
  <section class="sec"><div class="sec-h"><h2>Catálogo de clubes de la FCT</h2>${nCat != null ? `<span class="muted small">${nCat} clubes</span>` : ''}</div><div class="panel">
    <p class="muted small" style="margin:0 0 10px">El buscador de la pantalla de entrada usa los clubes afiliados del portal oficial de la Federació Catalana de Tennis y se actualiza solo cada día. La FCT no publica escudos: se muestra el icono de la web oficial de cada club. Aquí puedes completar o corregir escudos con un CSV o Excel: columnas <b>codigo</b> (el código FCT del club, por ejemplo 0708017) y <b>escudo</b> (URL de la imagen); también <b>nombre</b>, <b>localidad</b>, <b>provincia</b> y <b>web</b> para clubes que no estén en la FCT.</p>
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
      const name = pick(r, ['nombre', 'nom', 'name', 'club', 'nombreclub', 'nomclub']) || (ACC.fct || []).find(f => f.id === pick(r, ['codigo', 'codi', 'code', 'codigofct', 'codifct']).replace(/\s/g, ''))?.name || '';
      if (!name) { skipped++; return; }
      const code = pick(r, ['codigo', 'codi', 'code', 'id', 'codigofct', 'codifct']).replace(/\s/g, ''), id = /^\d{5,}$/.test(code) ? code : accSlug(code || name); if (seen.has(id)) return; seen.add(id);
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
  const r = (ACC.admin.reqs || {})[id] || (ACC.team?.reqs || {})[id]; if (!r) return;
  if (ok && r.role === 'jugador' && !ACC.admin.link[id] && r.pid) ACC.admin.link[id] = r.pid;
  const by = { decidedBy: authUser.uid, decidedByEmail: authUser.email, decidedAt: Date.now() };
  await safe(async () => {
    const extra = {};
    if (ok && r.role === 'jugador') {
      const pid = ACC.admin.link[id]; if (!pid) throw new Error('Elige el jugador de la plantilla');
      extra.invite = await accMakeInvite(pid, r.pid === pid ? r.team : undefined); extra.pid = pid;     // el solicitante entra con esta invitación (la ve al instante)
    } else if (ok) {
      await B.set('clubs/' + r.clubId + '/members/' + r.uid, { email: r.email, roles: ['gestor'], approvedBy: authUser.email, at: by.decidedAt, request: id });
      if (isAdmin && r.clubId === CLUB.id) {   // también en la lista de gestores (recibe el informe semanal)
        const managers = [...(meta?.managers || []).filter(x => x.email !== r.email), { name: r.name || '', email: r.email, approvedBy: authUser.email, approvedAt: by.decidedAt }];
        await saveMeta({ managers, managerEmails: managers.map(x => x.email) });
      }
    }
    await B.merge('clubRequests/' + id, { status: ok ? 'aprobada' : 'rechazada', ...by, ...extra });
    accAudit(ok ? 'solicitud-aprobada' : 'solicitud-rechazada', { email: r.email, role: r.role, pid: extra.pid || null });
  }, ok ? (r.role === 'jugador' ? 'Vinculado: ya puede entrar' : 'Acceso aprobado para ' + r.email) : 'Solicitud rechazada');
}
async function accLoadBrand() {
  if (!CLUB.id || ACC.admin.brandLoaded) return; ACC.admin.brandLoaded = true;
  try {
    const d = await B.getDoc('clubs/' + CLUB.id);
    // Raíz de los datos: la de club-config.js hasta que el club se migra a clubs/<id>/ (fase 2; las reglas y el servidor hacen lo mismo)
    if (B.setRoot) B.setRoot(d && d.migrated === true ? 'clubs/' + CLUB.id : (CLUB.dataRoot || ''));
    if (d) { ACC.admin.brand = d; accStore.set('lc-brand-' + CLUB.id, d.colors ? JSON.stringify(d.colors) : null); accIdentity(d); accApplyBrand(); softRender(); }
  } catch (e) {}
}
// Identidad del club guardada por su gestión (clubs/<id>): escudo, nombre de uso y portada, en toda la app (cabecera,
// intro, carteles, PDF). Lo que no se haya configurado sigue siendo lo de club-config.js.
const ACC_DEF = { crest: null, crestSm: null, medium: null };
function accIdentity(d) {
  if (typeof ASSET === 'undefined') return;
  if (ACC_DEF.crest === null) { ACC_DEF.crest = ASSET.crest; ACC_DEF.crestSm = ASSET.crestSm; ACC_DEF.medium = CLUB.medium; }
  const img = x => /^data:image\/(png|webp|jpeg);base64,/.test(String(x || '')) ? x : null;
  ASSET.crest = img(d?.crest) || ACC_DEF.crest; ASSET.crestSm = img(d?.crestSm) || img(d?.crest) || ACC_DEF.crestSm;
  CLUB.medium = String(d?.shortName || '').trim() || ACC_DEF.medium;
  ASSET.cover = img(d?.cover) || null;
}

/* ---------- Eventos ---------- */
function accBack() {
  const f = ACC.flow || {};
  if (ACC.ginv) { ACC.ginv = null; }
  else if (f.join && !me) accSetFlow({ join: null, who: null, club: f.role === 'gestor' ? f.club : null });
  else if ((f.step === 'check' || f.step === 'auth') && f.role === 'gestor') accSetFlow({ step: 'club', who: null });
  else if (f.step === 'check' || f.step === 'auth') accSetFlow({ step: 'role', role: null, club: null });
  else if (f.step === 'club') accSetFlow({ step: 'role', role: null, club: null });
  else accSetFlow({ step: 'role', role: null, club: null });
  ACC.q = ''; render(); scrollTo(0, 0);
}
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-acc]'); if (!el) return;
  const a = el.dataset.acc, v = el.dataset.v;
  if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  if (a === 'role') { accSetFlow({ role: v, club: null, who: null, join: null, step: v === 'gestor' ? 'club' : authUser ? 'check' : 'auth' }); ACC.q = ''; render(); scrollTo(0, 0); }
  else if (a === 'club') {
    const c = accClubs().find(x => x.id === v) || accStore.json('lc-last-club');
    accSetFlow({ club: v, step: authUser ? 'check' : 'auth' }); if (c) accStore.set('lc-last-club', JSON.stringify({ id: c.id, name: c.name, town: c.town || '', crest: c.crest || '', web: c.web || '' }));
    ACC.q = ''; render(); scrollTo(0, 0);
  }
  else if (a === 'req-renotify') accNotifyReq(true);
  else if (a === 'link-req') accLinkReq(v);
  else if (a === 'link-edit') { ACC.link = null; accSetFlow({ join: null }); render(); }
  else if (a === 'join-req') { accSetFlow({ join: 'req' }); render(); scrollTo(0, 0); }
  else if (a === 'req-club') { accSetFlow({ club: v }); render(); }
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
  else if (a === 'req-form') { ACC.req = null; render(); }
  else if (a === 'req-cancel') { await safe(() => B.del('clubRequests/' + authUser.uid), 'Solicitud cancelada'); }
  else if (a === 'ginv-open') { ACC.ginv = { state: 'form' }; render(); }
  else if (a === 'ginv-close') { ACC.ginv = null; render(); }
  else if (a === 'ginv-accept') accGestorInviteAccept();
  else if (a === 'ginv-new') accNewGestorInvite();
  else if (a === 'inv-new') accNewInvite(el.dataset.pid);
  else if (a === 'inv-copy' || a === 'ginv-copy' || a === 'inv-copy-code') { const url = a === 'ginv-copy' ? ACC.admin.ginv?.url : a === 'inv-copy-code' ? accInviteUrl(el.dataset.pid) : ACC.invites[el.dataset.pid]?.url; try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); } catch (x) { el.previousElementSibling?.select(); toast('Selecciona el enlace y cópialo'); } }
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
    saveMeta({ openClaims: el.checked }, el.checked ? 'Jugadores y capitanes entran directamente' : 'Las fichas las valida el capitán o la gestión');
    B.merge('public/access', { openClaims: el.checked }).catch(() => {}); }
});
document.addEventListener('input', e => { if (e.target.id === 'acc-q') { ACC.q = e.target.value; accRefreshClubs(); } });   // solo la lista: sin repintar la pantalla
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-acc-form]'); if (!f) return; e.preventDefault();
  const kind = f.dataset.accForm, fd = new FormData(f), val = String(fd.get(kind === 'jreq' || kind === 'req' || kind === 'who-req' ? 'msg' : 'code') || '');
  if (kind === 'who-find') { const who = { first: String(fd.get('first') || '').trim(), last: String(fd.get('last') || '').trim(), licence: String(fd.get('licence') || '').trim() }; if (!who.first || !who.last) { toast('Escribe tu nombre y tus apellidos'); return; } accLinkMe(who); return; }
  if (kind === 'lic') { const who = { ...(ACC.flow?.who || {}), licence: String(fd.get('lic') || '').trim() }; if (!who.licence) { toast('Escribe tu número de licencia'); return; } accLinkMe(who); return; }
  if (kind === 'who' || kind === 'who-req') { const who = { first: String(fd.get('first') || '').trim(), last: String(fd.get('last') || '').trim() }; if (!who.first || !who.last) { toast('Escribe tu nombre y tus apellidos'); return; }
    accSetFlow({ who }); if (kind === 'who-req') accSendReq(val, 'jugador'); else render(); return; }
  const code = val.toUpperCase().replace(/^.*INVITACION-/, '').replace(/[^A-Z0-9]/g, '');
  if (kind === 'code') { if (code.length < 6) { toast('Revisa el código: tiene 10 letras y números'); return; } ACC.invite = code; ACC.inv = null; try { sessionStorage.setItem('lc-invite', code); } catch (x) {} render(); }
  else if (kind === 'gcode') { if (code.length < 6) { toast('Revisa el código: tiene 10 letras y números'); return; } accGestorInviteRead(code); }
  else if (kind === 'req') accSendReq(val, 'gestor');
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ACC.menu) accMenuToggle(false); });
window.addEventListener('hashchange', () => { const h = location.hash.slice(1);
  if (/^invitacion-[A-Za-z0-9]{6,}$/.test(h)) { ACC.invite = h.slice(11).toUpperCase(); ACC.inv = null; try { sessionStorage.setItem('lc-invite', ACC.invite); } catch (e) {}
    if (!authUser) accSetFlow({ role: 'jugador', step: 'auth' }); render(); }
  if (ACC.menu) accMenuToggle(false); });
