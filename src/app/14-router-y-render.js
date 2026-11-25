/* ===================== ROUTER Y RENDER ===================== */
const route = () => (location.hash||'#inicio').slice(1)||'inicio';
function render(){
  { const m=route().match(/^gestion-(prep|disp|conv|res|post)-(\d+)$/); if(m){ ui.adminTab='jornada'; ui.adminJ=+m[2]; ui.jTab=m[1]; ui.jTabSet=true; ui.jTabFor=+m[2]; history.replaceState(null,'','#admin'); } }
  if(me && ui.sLoaded===SEASON_PATH && !ui.teamAuto && !S.players.some(p=>p.id===me)){ const hit=rosterAll().find(p=>p.id===me), other=hit?.teams.find(t=>t!==teamId); if(other){ ui.teamAuto=true; setTimeout(()=>switchTeam(other),0); } }
  ensureHomeCss(); updRoles(); if(authReady && authUser && !me && isManager && !adminSkip && ACC.flow?.role!=='jugador' && ACC.flow?.role!=='capitan'){ adminSkip=true; if(!route().startsWith('club')) history.replaceState(null,'','#club'); }
  const accHtml = authReady && authUser ? accGate() : null;   // acceso por rol, invitaciones y solicitud de gestor (access.js)
  const app=$('#app'), gate=!authReady || !authUser || !!accHtml || (!me && !adminSkip);
  document.body.classList.toggle('gate', gate);
  let html, nav=route();
  if(!authReady) html=accShell(ACC_BOOT);   // arranque: fondo de Lliga Catalana con indicador de carga, sin la identidad de ningún club
  else if(!authUser) html=vLogin();
  else if(accHtml) html=accHtml;
  else if(!me && !adminSkip) html=accJoinView(ACC.flow||{}, 'jugador');
  else { const r=nav;
    const split=!!document.querySelector('[data-nav="calendario"]');   // barra con Clasificación y Calendario separados
    if(r==='docs'||r.startsWith('doc-')){ ui.docBase='doc-'; ui.docBack='docs'; }   // documentos dentro del equipo
    if(r==='inicio') html=vInicio(); else if(r==='liga') html=vLiga(split?'calendario':'liga'); else if(r==='clasificacion'||r==='clasificación') html=vLiga('clasificacion'); else if(r==='calendario') html=vLiga('calendario');
    else if(r.startsWith('jornada-')){ html=vJornada(+r.slice(8)); nav=split?'calendario':'liga'; }
    else if(r==='equipo') html=vEquipo();
    else if(r.startsWith('jugador-')){ html=vJugador(r.slice(8)); nav='equipo'; }
    else if(r.startsWith('disponibilidad-')){ html=vDisponibilidad(+r.slice(15)); nav='yo'; }
    else if(r.startsWith('encuesta-')){ html=vEncuesta(+r.slice(9)); nav='yo'; }
    else if(r.startsWith('mvp-')){ html=vMvp(+r.slice(4)); nav='yo'; }
    else if(r.startsWith('informe-')){ html=vIxPlayer(r.slice(8)); nav='yo'; }
    else if(/^rival-\d+$/.test(r)){ html=vIxClub(+r.slice(6)); nav=split?'calendario':'liga'; }
    else if(/^scout-\d+-\d+$/.test(r)){ const q=r.split('-'); html=vIxScout(+q[1],+q[2]); nav=split?'calendario':'liga'; }
    else if(r==='mi-ficha'){ html=vMiFicha(); nav='yo'; }
    else if(r==='club'){ html=vClub(); nav='club'; } else if(r==='club-equipos'){ html=vClubEquipos(); nav='club'; } else if(r==='club-fct'){ html=vClubFct(); nav='club'; } else if(r==='club-resumen'){ html=vClubResumen(); nav='club'; } else if(r==='club-ajustes'){ html=vClubAjustes(); nav='club'; } else if(r==='club-docs'){ html=vClubDocs(); nav='club'; } else if(r==='club-usuarios'){ html=vClubUsuarios(); nav='club'; }
    else if(r.startsWith('club-equipo-')){ html=vClubTeam(r.slice(12)); nav='club'; }
    else if(r.startsWith('club-doc-')){ ui.docBase='club-doc-'; ui.docBack='club-docs'; html=vDoc(r.slice(9)); nav='club'; }
    else if(r==='docs') html=vDocs(); else if(r.startsWith('doc-')) html=vDoc(r.slice(4));
    else if(r==='stats') html=vStats(); else if(r==='yo'||r==='votar') { html=vYo(); nav='yo'; } else if(r==='admin') html=vAdmin(); else html=vNotFound();
    if(ui.sLoaded!==SEASON_PATH && !/^(club|yo|mi-ficha|votar|docs|doc-)/.test(r)) html=vSkeleton();   // la temporada aún no ha llegado
    html+=`<footer class="wrap">Datos oficiales: Federació Catalana de Tennis. App privada del ${esc(curTeam()?.short||'equipo')} (${esc(teamCat(curTeam()))}) del ${esc(CLUB.name)}.${S.updatedAt?' Actualizado el '+new Date(S.updatedAt).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'.':''}</footer>`; }
  if(authReady || !app.querySelector('.acc-boot')) app.innerHTML=`<div class="page">${html}</div>`;   // el indicador de arranque no se repinta (la animación no se reinicia)
  app.dataset.ok='1';
  document.querySelectorAll('[data-nav]').forEach(a=>{ if(a.dataset.nav===nav) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  document.querySelectorAll('.tabbar a[data-nav], .topnav a[data-nav]').forEach(a=>{ if(!a.querySelector('.tp')) a.insertAdjacentHTML('afterbegin','<i class="tp" aria-hidden="true"></i>'); });
  if(authUser?.uid && authReady) dxIdentify(authUser.uid,{club:CLUB.id||'', equipo:teamId||'', rol: isAdmin? 'admin' : isManager? 'gestor' : isCaptain? 'capitan' : me? 'jugador' : 'sin-ficha', jugador: me? (player(me)?.name||me) : ''});
  const al=$('.adminlink'); al.classList.toggle('on',canManage);
  if(!al.querySelector('.al-t')){ al.insertAdjacentHTML('beforeend','<span class="al-t">Gestión</span><span class="al-dot" aria-hidden="true"></span>'); al.setAttribute('aria-label','Gestión'); al.title='Gestión'; }
  let pend=null; try{ pend=canManage? pendingAction() : null; }catch(e){} al.classList.toggle('pending', !!pend); al.setAttribute('aria-label', pend? 'Gestión: hay un paso pendiente' : 'Gestión');
  const bs=$('.brand span'); if(bs) bs.innerHTML= gate? 'Lliga Catalana' : nav==='club'? `Gestión deportiva <small>${esc(CLUB.medium)}</small>` : `${esc(teamLabel())} <small>Lliga Catalana ${esc(String(viewSeason).replace(/^20(\d\d)-(\d\d)$/,'$1-$2'))}</small>`;
  let tw=$('.teamsw'); if(!tw){ tw=document.createElement('button'); tw.className='teamsw'; tw.type='button'; tw.setAttribute('aria-label','Cambiar de equipo'); tw.dataset.act='team-menu'; tw.textContent='▾'; $('.brand').after(tw); }
  const inClub = nav==='club'; tw.hidden = !(accMyTeams().length>1 || canClub());
  tw.textContent = inClub? 'Ir a un equipo ▾' : '▾'; tw.style.cssText = inClub? 'width:auto;padding:0 10px;margin-left:10px;white-space:nowrap;font-size:.78rem;font-weight:600' : '';
  tw.setAttribute('aria-label', inClub? 'Ir a la app de un equipo' : 'Cambiar de equipo');
  let cl=$('.clublink'); if(!cl){ cl=document.createElement('a'); cl.className='clublink'; cl.href='#club'; cl.title='Gestión deportiva'; cl.setAttribute('aria-label','Gestión deportiva'); cl.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>'; $('.topicons').prepend(cl); }
  cl.classList.toggle('on',canClub()); if(nav==='club') cl.setAttribute('aria-current','page'); else cl.removeAttribute('aria-current');
  document.body.classList.toggle('clubmode', nav==='club');
  setNavMode(nav==='club'); if(authReady&&authUser&&!gate&&route()==='intro'&&!ui.onb){ history.replaceState(null,'','#inicio'); startOnb({force:true}); }
  if(authReady&&authUser){ checkCssVersion(); if(!gate) maybeTour(); if(!gate && !ui.onb && !ui.instTried && (me||canClub())){ ui.instTried=true; window.maybeInstallSheet?.('entrada'); } if(ui.onb?.stage==='perfil' && ui.onb.step===0 && !document.querySelector('.cropper.on')) drawOnb(); if(ui.onb?.stage==='apps') drawOnb(); if(ui.onb?.stage==='spot' && document.getElementById('spot')) setTimeout(()=>spotPlace(false),30); } document.body.classList.toggle('noplayer', !me);
  const tc=document.querySelector('meta[name="theme-color"]'); if(tc) tc.setAttribute('content', gate? '#0E1216' : (getComputedStyle(document.documentElement).getPropertyValue('--green').trim()||'#0F3B2E'));
  document.title = gate? 'Lliga Catalana' : (nav==='club'? 'Gestión deportiva · '+CLUB.medium : teamLabel()+' · Lliga Catalana');
  const bi=$('.brand img'); if(bi && bi.getAttribute('src')!==ASSET.crestSm) bi.setAttribute('src',ASSET.crestSm);
  const mb=$('.mebtn'); if(mb) mb.innerHTML = me? avatar(player(me)) : (authUser? `<span class="av">${esc((authUser.email||'?')[0].toUpperCase())}</span>`:'');
  const dot=document.querySelector('.tabbar [data-nav="yo"]'); if(dot){ dot.querySelector('.dot')?.remove(); const nx=nextPoloFix(); if(pendingSurveys().length || pendingMvp().length || (nx&&me&&availOpen(nx)&&!avOf(me,nx.j))) dot.insertAdjacentHTML('beforeend','<span class="dot"></span>'); }
  try{ ixTick(); }catch(e){ console.warn('informe',e); }
  afterRender(app);
}
// Pantalla de carga con la forma del contenido (mientras llega la temporada del equipo)
function vSkeleton(){ const b=(w,h,r=12)=>`<i class="sk" style="width:${w};height:${h}px;border-radius:${r}px"></i>`;
  return `<div class="wrap skel" aria-busy="true" aria-label="Cargando"><div style="padding:34px 0 18px">${b('38%',14,7)}<div style="height:14px"></div>${b('62%',52,14)}<div style="height:10px"></div>${b('45%',16,8)}</div>
    <div class="sk-card">${b('30%',14,7)}<div style="height:16px"></div>${b('100%',22,8)}<div style="height:10px"></div>${b('100%',22,8)}</div>
    ${[0,1,2,3].map(()=>`<div class="sk-row">${b('44px',44,22)}<div style="flex:1">${b('60%',14,7)}<div style="height:8px"></div>${b('35%',12,6)}</div></div>`).join('')}</div>`; }
function editing(){ const a=document.activeElement; return a && a.closest('#app') && /INPUT|TEXTAREA|SELECT/.test(a.tagName); }
// Repintado por datos que llegan (Firestore, FCT…): los cambios que llegan seguidos se juntan en un solo repintado
let _softT=null;
function softRender(){ if(_softT) return; _softT=setTimeout(()=>{ _softT=null; softRenderNow(); },50); }
function softRenderNow(){ if($('.cropper.on')||$('.pmodal.on')){ ui.pendingRender=true; return; } if(editing()||ui.survey&&route().startsWith('encuesta')&&document.activeElement?.tagName==='TEXTAREA'){ ui.pendingRender=true; return; } renderQuiet(); }
function renderQuiet(){ // re-render sin repetir la animación de entrada
  const y=scrollY; render(); const pg=$('#app .page'); if(pg) pg.style.animation='none'; $('#app').querySelectorAll('.stagger>*').forEach(c=>c.style.animation='none'); scrollTo(0,y);
}
document.addEventListener('focusout',()=>setTimeout(()=>{ if(ui.pendingRender&&!editing()){ ui.pendingRender=false; renderQuiet(); } },150));
let lastRoute=null;
/* Transiciones entre pantallas (View Transitions API, donde exista): de pestaña a pestaña la página se desliza hacia
   el lado de la pestaña; al entrar en un detalle (una jornada, un jugador…) entra desde la derecha y al volver, al revés.
   La barra de arriba y la de pestañas no se mueven y la marca de la pestaña activa se desliza hasta la nueva.
   Sin la API, o con «reducir movimiento», se pinta como siempre. */
const NAV_TABS=['inicio','clasificacion','calendario','liga','equipo','stats','yo','admin','club','club-equipos','club-fct','club-docs','club-usuarios','club-resumen','club-ajustes'];
const navDepth=r=> !r||NAV_TABS.includes(r)||r==='votar'? 0 : /^scout-/.test(r)? 2 : 1;
const navTab=r=>{ const i=NAV_TABS.indexOf(r); if(i>=0) return i; const b=/^(jornada|rival|scout)-/.test(r)? 'calendario' : /^jugador-/.test(r)? 'equipo' : /^(doc|docs)/.test(r)? 'admin' : /^club/.test(r)? 'club' : 'yo'; return NAV_TABS.indexOf(b); };
function navTo(paint){
  const from=lastRoute, to=route(), html=document.documentElement;
  if(!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches || from==null || from===to || document.body.classList.contains('gate')) return paint();
  const d=navDepth(to)-navDepth(from), t=navTab(to)-navTab(from);
  html.dataset.vt = d>0? 'fwd' : d<0? 'back' : t>0? 'right' : t<0? 'left' : 'fade';
  try{ const vt=document.startViewTransition(()=>{ paint(); }); vt.ready.catch(()=>{}); vt.updateCallbackDone.catch(()=>{}); vt.finished.catch(()=>{}).finally(()=>{ delete html.dataset.vt; }); }
  catch(e){ delete html.dataset.vt; paint(); }
}
window.addEventListener('hashchange',()=>{ if(ui.fe?.dirty) feFlush(); ui.survey=null; ui.avDraft=null; ui.compose=ui.composeAfter||null; ui.composeAfter=null; if(ui.compose) setTimeout(()=>$('#compose-text')?.scrollIntoView({behavior:'smooth',block:'center'}),250); closeSheet(); stageClose(); closePosterModal(); navTo(()=>{ render(); if(route()!==lastRoute) scrollTo(0,0); lastRoute=route(); }); });
function toast(m){ const t=$('#toast'); if(!t) return; t.textContent=m; t.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('on'),2600); }

