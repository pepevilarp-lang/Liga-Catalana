/* ===================== MI FICHA DE JUGADOR ===================== */
const SHOTS=['Saque','Derecha','Revés','Volea','Dejada','Globo','Resto','Smash','Passing'];
const FICHA=[
  {sec:'Tu juego', sub:'Cómo juegas en la pista', fields:[
    {k:'hand',l:'Mano',t:'chips',o:['Diestro','Zurdo'],i:'✋'},
    {k:'backhand',l:'Revés',t:'chips',o:['A una mano','A dos manos'],i:'↩️'},
    {k:'style',l:'Estilo de juego',t:'chips',o:['Fondo de pista','Agresivo desde el fondo','Saque y red','Todoterreno','Contragolpeador'],i:'🧠'},
    {k:'surface',l:'Superficie favorita',t:'chips',o:['Tierra batida','Pista rápida','Hierba','Indoor'],i:'🟤'},
    {k:'shot',l:'Golpe favorito',t:'chips',o:SHOTS,i:'💥'},
    {k:'weak',l:'Talón de Aquiles',t:'chips',o:[...SHOTS,'Segundo saque','Bolas altas','Los nervios'],i:'🎯'},
    {k:'dbl',l:'Lado en dobles',t:'chips',o:['Drive (derecha)','Revés (izquierda)','Me da igual'],i:'🤝'}]},
  {sec:'Tu tenis', sub:'Lo que te inspira', fields:[
    {k:'idol',l:'Jugador favorito',t:'text',o:['Rafa Nadal','Roger Federer','Novak Djokovic','Carlos Alcaraz','Jannik Sinner','Andre Agassi','Pete Sampras','Juan Carlos Ferrero','Carlos Moyà','Àlex Corretja'],i:'⭐',ph:'¿A quién te pareces jugando?'},
    {k:'tournament',l:'Torneo soñado',t:'chips',o:['Roland Garros','Wimbledon','US Open','Open de Australia','Conde de Godó','Mutua Madrid Open','Copa Davis'],i:'🏆'},
    {k:'racket',l:'Raqueta',t:'text',o:['Babolat Pure Aero','Babolat Pure Drive','Wilson Blade','Wilson Pro Staff','Head Speed','Head Radical','Yonex EZONE','Yonex VCORE','Tecnifibre TF40'],i:'🎾',ph:'Marca y modelo'},
    {k:'since',l:'Juega desde',t:'year',i:'📅',ph:'Año'}]},
  {sec:'Tu personalidad en pista', sub:'Lo que te hace único', fields:[
    {k:'nick',l:'Apodo',t:'text',o:[],i:'🏷️',ph:'Cómo te llaman en el equipo'},
    {k:'motto',l:'Grito de guerra más usado',t:'text',o:['¡Vamos!','¡Come on!','¡Venga!','¡Sí señor!','¡Allez!','¡Vamos '+CLUB.teamShort+'!'],i:'📣',ph:'Lo que gritas tras un gran punto'},
    {k:'ritual',l:'Ritual antes de sacar',t:'text',o:['Tres botes y al lío','Mirar las cuerdas','Secarme con la toalla','Elegir la bola buena'],i:'🔁',ph:'Tu manía antes del saque'},
    {k:'song',l:'Canción para calentar',t:'text',o:[],i:'🎧',ph:'Lo que suena en tus cascos'},
    {k:'quote',l:'Frase que te define',t:'text',o:[],i:'💬',ph:'En una línea'},
    {k:'bio',l:'Sobre mí',t:'text',o:[],i:'✍️',ph:'Una o dos líneas sobre ti'}]}];
const FICHA_FIELDS=FICHA.flatMap(s=>s.fields);
const TENNIS_FIELDS=FICHA_FIELDS.map(f=>[f.k,f.l,f.t==='chips'?'select':f.t,f.o]);
function fichaPct(pid, pr){ pr=pr||profiles[pid]||{}; const n=FICHA_FIELDS.filter(f=>String(pr[f.k]||'').trim()).length+(photos[pid]?1:0); return Math.round(n*100/(FICHA_FIELDS.length+1)); }
function fichaDisplay(pid, own){
  const pr=profiles[pid]||{}, has=f=>String(pr[f.k]||'').trim();
  if(!FICHA_FIELDS.some(has)) return own? `<section class="sec"><a class="fcta" href="#mi-ficha"><span class="fci">✍️</span><span><b>Completa tu ficha de jugador</b><small>Golpe favorito, jugador favorito, grito de guerra, ritual… Sale aquí, en tu carta y en la plantilla.</small></span><span class="btn sm brass">Empezar</span></a></section>` : '';
  const tiles=FICHA_FIELDS.filter(f=>has(f) && !['motto','quote','nick','bio'].includes(f.k));
  return `<section class="sec"><div class="sec-h"><h2>El jugador</h2>${own?'<a href="#mi-ficha">Editar mi ficha</a>':''}</div>
    ${has({k:'motto'})? `<div class="warcry"><span class="wl">📣 Grito de guerra</span><span class="wt">${esc(pr.motto)}</span></div>` : ''}
    ${tiles.length? `<div class="ftiles stagger">${tiles.map(f=>`<div class="ftile ${f.k==='idol'?'wide':''}"><span class="fi">${f.i}</span><span class="fl">${f.l}</span><b>${esc(pr[f.k])}</b></div>`).join('')}</div>` : ''}
    ${has({k:'bio'})? `<p class="fbio">${esc(pr.bio)}</p>` : ''}${has({k:'quote'})? `<p class="fquote">«${esc(pr.quote)}»</p>` : ''}</section>`;
}
function fePreviewHTML(){
  const pr=ui.fe.draft, pct=fichaPct(me,pr);
  return `${playerCard(me)}
    <div class="fe-prog"><div class="row" style="justify-content:space-between"><b>Ficha completada</b><b id="fe-pct">${pct}%</b></div><span class="fbar"><i style="width:${pct}%"></i></span>
      <small>${pct>=100? '¡Ficha completa! 🎾' : pct>=60? 'Ya casi. Te faltan '+(FICHA_FIELDS.length+1-Math.round(pct*(FICHA_FIELDS.length+1)/100))+' datos.' : 'Cuanto más rellenes, mejor luce tu perfil.'}</small></div>
    ${pr.motto? `<div class="warcry sm"><span class="wl">📣 Grito de guerra</span><span class="wt">${esc(pr.motto)}</span></div>` : ''}`;
}
function feRefresh(){ const ob=document.querySelector('.ob-banner'); if(ob && ui.onboard){ const t=document.createElement('div'); t.innerHTML=onboardBanner(); ob.replaceWith(t.firstElementChild); } const box=$('#fe-preview'); if(!box||!ui.fe) return; const saved=profiles[me]; profiles[me]=ui.fe.draft; box.innerHTML=fePreviewHTML(); profiles[me]=saved; afterRender(box); }
function feStatus(t,cls=''){ const el=$('#fe-status'); if(el){ el.textContent=t; el.className='fe-status '+cls; } }
function feQueue(){ if(!ui.fe) return; ui.fe.dirty=true; ui.fe.touched=true; feStatus('Guardando…','saving'); clearTimeout(ui.fe.t); ui.fe.t=setTimeout(feFlush,900); }
async function feFlush(){ if(!ui.fe||!me||!ui.fe.dirty) return; clearTimeout(ui.fe.t); const o={}; Object.entries(ui.fe.draft).forEach(([k,v])=>{ if(k!=='at' && v!=null && String(v).trim()!=='') o[k]=String(v).trim(); }); o.at=Date.now();
  ui.fe.dirty=false; try{ await trackWrite(B.set('profiles/'+me,o)); profiles[me]=o; feStatus('Guardado ✓','ok'); if(fichaPct(me,o)>=100 && !ui.fe.celebrated){ ui.fe.celebrated=true; confetti(innerWidth/2,innerHeight/3,110); } }catch(e){ ui.fe.dirty=true; feStatus('No se ha guardado. Toca el aviso rojo para ver el motivo','ko'); } }
function vMiFicha(){
  if(!me) return `<div class="wrap"><div class="pagehead"><h1>Mi ficha</h1></div><div class="notice">Primero elige tu nombre de la lista en la pestaña Yo.</div></div>`;
  if(!player(me)) S.players.length; const _pp=player(me)||{id:me,name:rosterAll().find(x=>x.id===me)?.name||'Jugador'};
  if(!ui.fe || ui.fe.pid!==me || (!ui.fe.touched && JSON.stringify(ui.fe.base)!==JSON.stringify(profiles[me]||{})))
    ui.fe={pid:me, base:clone(profiles[me]||{}), draft:{...(profiles[me]||{})}, phone:phones[me]||'', dirty:false, touched:false};
  const p=_pp, d=ui.fe.draft, ph=photos[me]?.d;
  const field=f=>{ const v=d[f.k]||'';
    if(f.t==='chips') return `<div class="fe-f"><label class="fe-l"><span>${f.i}</span>${f.l}</label><div class="fe-chips" data-group="${f.k}">${f.o.map(o=>`<button type="button" class="fchip press" data-act="fe-chip" data-k="${f.k}" data-v="${esc(o)}" aria-pressed="${v===o}">${esc(o)}</button>`).join('')}</div></div>`;
    return `<div class="fe-f"><label class="fe-l" for="fe-${f.k}"><span>${f.i}</span>${f.l}</label><input id="fe-${f.k}" data-fe="${f.k}" type="${f.t==='year'?'number':'text'}" ${f.t==='year'?'min="1950" max="2026" inputmode="numeric"':'maxlength="80"'} value="${esc(v)}" placeholder="${esc(f.ph||'')}" ${f.o?.length?`list="dl-${f.k}"`:''}>
      ${f.o?.length? `<datalist id="dl-${f.k}">${f.o.map(o=>`<option value="${esc(o)}">`).join('')}</datalist><div class="sugs">${f.o.slice(0,6).map(o=>`<button type="button" class="sug" data-act="fe-sug" data-k="${f.k}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>` : ''}</div>`; };
  ensureTourCss(); return `<div class="wrap fe"><div class="pagehead"><a class="textlink" href="#yo">← Yo</a><h1 style="margin-top:10px">Mi ficha</h1><p class="lede">Lo que rellenes sale en tu perfil, en tu carta de jugador y en la plantilla. Todo es opcional y se guarda solo.</p>${onboardBanner()}</div>${introBlock(me,true)}<div class="wrap" style="margin-top:-18px"><label class="row small" style="gap:8px;justify-content:flex-end"><input type="checkbox" data-intro-vis ${(ui.fe?.draft||profiles[me]||{}).introOff?'':'checked'}> Mostrar mi presentación en el perfil</label></div>
    <div class="fe-grid"><aside class="fe-side"><div id="fe-preview">${(()=>{ const s=profiles[me]; profiles[me]=d; const h=fePreviewHTML(); profiles[me]=s; return h; })()}</div>
      <div class="row" style="margin-top:14px;justify-content:center"><a class="btn ghost sm" href="#jugador-${esc(me)}">Ver mi perfil</a></div></aside>
    <div class="fe-main">
      <section class="fe-card"><h2>Tu foto</h2><p class="muted small">Vertical, con la cara en el tercio de arriba. Se usa en tu perfil, la carta, la plantilla, los rankings y los carteles de convocatoria.</p>
        <div class="fe-photo"><div class="fe-ph">${ph? `<img src="${esc(ph)}" alt="Tu foto">` : `<span>${esc(p.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span>`}</div>
          <div class="fe-phbtns"><button class="btn brass" data-act="crop" data-target="${esc(me)}" data-pick="1">${ph?'Subir otra foto':'Subir mi foto'}</button>${ph? `<button class="btn ghost" data-act="crop" data-target="${esc(me)}">Reencuadrar</button><button class="btn ghost sm" data-act="photo-del" data-target="${esc(me)}">Quitar</button>` : ''}
            <p class="muted small">Desde el móvil puedes hacerte una foto en el momento.</p></div></div></section>
      ${FICHA.map(s=>`<section class="fe-card"><h2>${s.sec}</h2><p class="muted small">${s.sub}</p>${s.fields.map(field).join('')}</section>`).join('')}
      <section class="fe-card"><h2>Tu teléfono</h2><p class="muted small">Privado: solo lo usa el equipo para avisarte por WhatsApp si falta tu respuesta. No se muestra en tu perfil.</p>
        <div class="fe-f"><label class="fe-l" for="fe-phone"><span>📱</span>Móvil</label><input id="fe-phone" data-fe-phone type="tel" value="${esc(ui.fe.phone)}" placeholder="+34 600 000 000"></div>
        ${window.LC_WHATSAPP? `<label class="fe-wa"><input type="checkbox" data-act="wa-optin" ${waOptIn?'checked':''} ${ui.fe.phone.trim()?'':'disabled'}><span><b>Recibir los avisos por WhatsApp</b><small>Disponibilidad con botones «Puedo / No puedo», convocatoria y cambios de horario, desde el número oficial de Lliga Catalana. Lo puedes quitar cuando quieras.</small></span></label>` : ''}</section>
    </div></div>
    <div class="fe-bar"><span id="fe-status" class="fe-status">${ui.fe.dirty?'Guardando…':'Todo guardado'}</span><a class="btn sm" href="#jugador-${esc(me)}">Ver cómo queda</a></div></div>`;
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
function installCard(){
  if(isStandalone()) return `<div class="mcard ok"><span class="mi">📲</span><div><b>App instalada</b><small>La tienes en la pantalla de inicio.</small></div></div>`;
  if(installEvt) return `<div class="mcard"><span class="mi">📲</span><div><b>Instala la app</b><small>Acceso directo, pantalla completa y notificaciones.</small></div><button class="btn brass sm" data-act="install">Instalar</button></div>`;
  if(isIOS() || window.lcInApp?.()) return `<div class="mcard"><span class="mi">📲</span><div><b>${window.lcInApp?.()? 'Ábrela en el navegador para instalarla' : 'Instálala en el iPhone'}</b><small>Te guiamos paso a paso.</small></div><button class="btn brass sm" data-act="inst-how">Cómo instalarla</button></div>`;
  if(false) return `<div class="mcard"><span class="mi">📲</span><div><b>Instálala en el iPhone</b><small>En Safari pulsa <b>Compartir</b> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/></svg> y luego <b>Añadir a pantalla de inicio</b>. Las notificaciones en iPhone solo funcionan con la app instalada.</small></div></div>`;
  return `<div class="mcard"><span class="mi">📲</span><div><b>Instala la app</b><small>En el menú del navegador elige <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.</small></div><button class="btn ghost sm" data-act="inst-how">Cómo</button></div>`;
}
function pushCard(){
  if(!CFG.vapidKey) return isAdmin? `<div class="mcard"><span class="mi">🔔</span><div><b>Notificaciones sin configurar</b><small>Falta la clave vapidKey en config.js (Firebase, Cloud Messaging). Solo lo ves tú.</small></div></div>` : '';
  const st=pushState;
  if(st==='on') return `<div class="mcard ok"><span class="mi">🔔</span><div><b>Notificaciones activadas</b><small>Te avisaremos de la disponibilidad, la convocatoria y tu encuesta.</small></div><button class="btn ghost sm" data-act="push-test">Probar</button></div>`;
  if(st==='denied') return `<div class="mcard"><span class="mi">🔕</span><div><b>Notificaciones bloqueadas</b><small>Actívalas en los ajustes del navegador para esta web y vuelve a intentarlo.</small></div><button class="btn ghost sm" data-act="push-on">Reintentar</button></div>`;
  return `<div class="mcard"><span class="mi">🔔</span><div><b>Activa las notificaciones</b><small>Disponibilidad, convocatoria y encuesta, directas al móvil.</small></div><button class="btn brass sm" data-act="push-on">Activar</button></div>`;
}
function diagHint(d){ const bad=d.find(x=>!x[2]); if(!bad) return '<p class="notice" style="margin-top:10px">Todo correcto: puedes guardar y editar.</p>';
  const k=bad[0], m=bad[1];
  const tip = k==='Tu jugador'? 'Elige tu nombre de la lista (cierra sesión y vuelve a entrar si no te lo pide).'
    : /permission/.test(m)? 'Firebase sigue usando reglas antiguas. Ve a Firestore → Reglas, pega las reglas nuevas y pulsa Publicar; comprueba arriba que pone «Publicado» con la hora de ahora. Si al pegarlas sale una línea en rojo, no se publican: mándame una captura.'
    : k==='Sesión'? 'Vuelve a entrar con Google.' : 'Mándame una captura de esta lista.';
  return `<p class="notice" style="margin-top:10px"><b>${esc(k)}:</b> ${esc(tip)}</p>`; }
function connCard(){
  const fb=B.mode==='firebase', online=navigator.onLine!==false;
  const rows=[['Datos', fb? '<b class="ok">Conectado a la base de datos del equipo</b>' : '<b class="ko">Vista previa: los datos se guardan solo en este navegador</b>'],
    ['Conexión', online? 'En línea' : '<b class="ko">Sin conexión</b> (los cambios se subirán al volver)'],
    ['Cuenta', esc(authUser?.email||'–')],
    ['Puede editar la temporada', canManage? '<b class="ok">Sí</b> ('+(isAdmin?'administrador':'capitán')+')' : 'No (solo lo suyo: disponibilidad, encuesta, voto, foto y ficha)'],
    ['Último guardado', sync.at? relTime(sync.at) : 'Ninguno en esta sesión'+(sync.st==='error'? '. <b class="ko">'+esc(sync.msg)+'</b>' : '')],
    ['Temporada', esc(viewSeason)+(S.updatedAt? ', actualizada '+relTime(S.updatedAt) : '')]];
  return `<section class="sec"><div class="sec-h"><h2>Conexión y datos</h2></div><dl class="conn">${rows.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
    ${!fb? '<p class="notice" style="margin-top:10px">Para que todos veáis lo mismo, abrid siempre la web de Vercel con la configuración de Firebase puesta, no el enlace de vista previa.</p>':''}
    <div class="row" style="margin-top:12px"><button class="btn sm" data-act="diag">Comprobar permisos</button></div>
    ${ui.diag? `<ul class="diag">${ui.diag.map(([a,b,ok])=>`<li class="${ok?'ok':'ko'}"><span>${ok?'✓':'✗'}</span><b>${esc(a)}</b><em>${esc(b)}</em></li>`).join('')}</ul>${diagHint(ui.diag)}` : ''}</section>`;
}
// «Yo», ordenado por secciones: tú (perfil y ficha), lo pendiente, gestión (si te toca), el móvil y la cuenta
const yoRow=(href,ic,t,d,attrs='')=>`<${href?`a href="${href}"`:'button type="button"'} class="yo-row" ${attrs}><i>${svgi(ic,19)}</i><span><b>${t}</b>${d?`<small>${d}</small>`:''}</span><em aria-hidden="true">›</em></${href?'a':'button'}>`;
function yoGestion(){ const rows=[];
  if(me && canManage) rows.push(yoRow('#admin','team','Panel de capitán',(!isCaptain&&!isAdmin&&teamMode()? 'Todo el equipo gestiona. ' : '')+'Convocatorias, disponibilidad, resultados y mensajes del equipo.'));
  if(canClub()) rows.push(yoRow('#club','trophy','Gestión deportiva','Todos los equipos del club, informes semanales, permisos y configuración.'));
  return rows.length? `<section class="sec"><div class="sec-h"><h2>Gestión</h2></div><div class="yo-list">${rows.join('')}</div></section>` : ''; }
function yoCuenta(){ const rows=[
    yoRow('','clock','Ver la introducción','Repasa cómo funciona la app.','data-act="tour-again"'),
    window.DX_ANALYTICS?.key? yoRow('','score','Estadísticas de uso: '+(dxConsent()==='yes'?'activadas':'desactivadas'),'Datos anónimos para mejorar la app. Puedes cambiarlo cuando quieras.','onclick="dxConsentOpen()"') : '',
    yoRow('/privacidad.html','lock','Privacidad','Qué datos guarda la app y para qué.','target="_blank" rel="noopener"'),
    yoRow('','x','Retirar consentimiento','Deja de usar tus datos y cierra la sesión.','data-acc="priv-withdraw"'),
    yoRow('','x','Cerrar sesión','Entras como '+esc(authUser?.email||'')+'.','data-act="signout"')].filter(Boolean);
  return `<section class="sec"><div class="sec-h"><h2>Cuenta y privacidad</h2></div><div class="yo-list">${rows.join('')}</div></section>${isAdmin||isManager? connCard() : ''}`; }
function vYo(){
  if(!me) return `<div class="wrap"><div class="pagehead"><h1>Yo</h1><p class="lede">Entras como ${esc(authUser?.email||'')}${isManager? ', gestor deportivo' : isAdmin? ', administrador' : ''}. No estás ligado a ningún jugador.</p><div class="row" style="margin-top:10px"><button class="btn sm" data-act="unskip">Soy jugador: elegir mi nombre</button></div></div>${yoGestion()}<section class="sec"><div class="sec-h"><h2>En tu móvil</h2></div><div class="mcards">${installCard()}${pushCard()}</div></section>${yoCuenta()}</div>`;
  const p=player(me)||{id:me, name:rosterAll().find(x=>x.id===me)?.name||'Jugador', order:'', cat:''}, pr=profiles[me]||{}, tasks=[];
  S.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&availOpen(f)).forEach(f=>{ const v=avOf(me,f.j); tasks.push(`<a class="task ${v?'done':''}" href="#disponibilidad-${f.j}"><span class="ti">${v?'✓':'?'}</span><span><b>Disponibilidad, jornada ${f.j}</b><small>${v? 'Has dicho: '+AV_LABEL[v.s]+'. Puedes cambiarla hasta el '+esc(fmtDT(deadline(f.j))) : 'Contra '+esc(clubName(persp(f).rival))+'. Responde antes del '+esc(fmtDT(deadline(f.j)))}</small></span></a>`); });
  pendingMvp().forEach(j=>tasks.push(`<a class="task hot" href="#mvp-${j}"><span class="ti">🏆</span><span><b>Vota al MVP, jornada ${j}</b><small>Un voto, hasta el ${esc(fmtDT(new Date(mvpState(j).deadline)))}.</small></span></a>`));
  pendingSurveys().forEach(j=>tasks.push(`<a class="task hot" href="#encuesta-${j}"><span class="ti">!</span><span><b>${ixFichaPending(j)? 'Ficha de tu partido, jornada '+j : 'Encuesta de la jornada '+j}</b><small>${ixFichaPending(j)? 'Contra '+esc(clubName(persp(poloFix(j)).rival))+'. Falta para tu informe de jugador. 1 minuto.' : 'Has jugado contra '+esc(clubName(persp(poloFix(j)).rival))+'. 2 minutos.'}</small></span></a>`));
  const roles=[isCaptain?'Capitán':'',isAdmin?'Administrador':isManager?'Gestor deportivo':''].filter(Boolean);
  return `<div class="wrap"><div class="phead yo-head">${avatar(p,'lg')}<div><h1>${esc(p.name)}</h1><p class="yo-role">${esc(['Jugador del '+teamLabel(),...roles].join(' · '))}</p><p class="yo-mail">${esc(authUser?.email||'')}</p><div class="row" style="margin-top:10px"><a class="btn sm" href="#jugador-${esc(me)}">Ver mi perfil</a></div></div></div>
  <section class="sec"><a class="fcta big press" href="#mi-ficha">${avatar(p,'lg')}<span><b>Mi ficha de jugador</b><small>${(()=>{ const pc=fichaPct(me); return pc? pc+'% completada. ' : ''; })()}Foto, golpe favorito, jugador favorito, grito de guerra, ritual…</small><span class="fbar"><i style="width:${fichaPct(me)}%"></i></span></span><span class="btn brass sm">${fichaPct(me)?'Editar':'Empezar'}</span></a></section>
  <section class="sec"><div class="sec-h"><h2>Pendiente</h2></div>${tasks.length? `<div class="tasks stagger">${tasks.join('')}</div>` : '<div class="empty">Todo al día. Cuando haya disponibilidad que responder o una encuesta tuya, aparecerá aquí.</div>'}</section>
  ${ixPlayerCta(me)}
  ${yoGestion()}
  <section class="sec"><div class="sec-h"><h2>En tu móvil</h2></div><div class="mcards">${installCard()}${pushCard()}</div></section>
  ${yoCuenta()}
</div>`;
}
function vEncuesta(j){
  const f=poloFix(j); if(!f) return vNotFound(); const k=jid(j), parts=participants(j);
  const head=`<div class="wrap"><div class="pagehead"><p class="qsec">Encuesta postpartido</p><h1>Jornada ${j}</h1><p class="lede">${esc(CLUB.teamShort)} contra ${esc(clubName(persp(f).rival))}${isPlayed(f)?', '+persp(f).ps+'-'+persp(f).rs:''}.</p></div>`;
  if(!isPlayed(f)) return head+`<div class="empty">La encuesta se abre cuando se cargue el resultado de la eliminatoria.</div></div>`;
  if(!parts.includes(me)) return head+`<div class="empty">Esta encuesta es solo para los que jugaron la eliminatoria.</div></div>`;
  if(S.survey.closed?.[k]) return head+`<div class="empty">El capitán ya ha cerrado esta encuesta.</div></div>`;
  if(ui.survey && ui.survey.j===j) return head+`<section class="sec">${surveyCard()}</section></div>`;
  const done=myBallot?.j?.[k];
  return head+`<section class="sec"><div class="panel done">${done && ixFichaPending(j)? `<p class="q">Falta la ficha de tu partido</p><p class="muted">Ya respondiste la encuesta de esta jornada. Ahora la encuesta incluye la ficha de tu partido: tus golpes, el juego de tu rival, cómo compite de cabeza y cómo fue. Con ella se construyen tu informe de jugador y el informe del rival. ${ixSteps(j).length} pasos, un minuto.</p><div class="row"><button class="btn brass" data-act="survey-start" data-j="${j}" data-only="1">Completar la ficha</button><button class="btn ghost" data-act="survey-start" data-j="${j}">Cambiar todas mis respuestas</button></div>` : done? `<p class="q">Encuesta enviada ✓</p><p class="muted">Gracias. El capitán publicará los resultados agregados y el MVP.</p><button class="btn ghost" data-act="survey-start" data-j="${j}">Cambiar mis respuestas</button>` : `<p class="q">${ixQCount(j)} preguntas rápidas</p><p class="muted">${ixSteps(j).length? 'Empieza por la ficha de tu partido: tus golpes, el juego de tu rival y cómo fue. Con ella se construyen tu informe de jugador y el informe del rival para el equipo. ' : ''}Las preguntas sobre compañeros se publican solo como votos agregados. Lo que digas de ti y tus comentarios son privados.</p><button class="btn brass" data-act="survey-start" data-j="${j}">Empezar</button>`}</div></section></div>`;
}
const surveyQuestions = () => S.survey.questions.filter(q=>q.text&&q.type);
function surveyCard(){
  const xs=ui.survey.xs||[]; if(ui.survey.step<xs.length) return ixStepCard();   // ficha de cada partido (scout.js)
  const qs=ixBaseQs(), j=ui.survey.j, i=ui.survey.step-xs.length, tot=xs.length+qs.length;
  if(i>=qs.length) return `<div class="survey"><div class="prog"><i style="width:100%"></i></div><p class="q">Todo listo</p><p class="qsec">Revisa si quieres o envía tus respuestas de la jornada ${j}.</p><div class="nav"><button class="btn ghost" data-act="survey-prev">Atrás</button><button class="btn brass" data-act="survey-send">Enviar respuestas</button></div></div>`;
  const q=qs[i], a=ui.survey.a[q.id]; let body='';
  if(q.type==='scale') body=`<div class="scale">${Array.from({length:10},(_,n)=>`<button data-act="ans" data-q="${q.id}" data-v="${n+1}" aria-pressed="${a===n+1}">${n+1}</button>`).join('')}</div>`;
  else if(q.type==='player'){ const list=participants(j).map(player).filter(Boolean).filter(p=>p.id!==me);
    body=`<div class="picker">${list.map(p=>`<button data-act="ans" data-q="${q.id}" data-v="${esc(p.id)}" aria-pressed="${a===p.id}">${avatar(p)}${esc(p.name)}</button>`).join('')}</div>`; }
  else body=`<textarea data-act="ans-text" data-q="${q.id}" placeholder="Escribe aquí (opcional)" style="margin:20px 0">${esc(a||'')}</textarea>`;
  return `<div class="survey"><div class="qsec">Jornada ${j}. ${esc(SCOPE_LABEL[q.scope]||'')}, ${xs.length+i+1} de ${tot}</div><div class="prog"><i style="width:${Math.round((xs.length+i)*100/tot)}%"></i></div>
    <div class="qbody" key="${i}"><p class="q">${esc(q.text)}</p>${body}</div>
    <div class="nav"><button class="btn ghost" data-act="survey-prev" ${xs.length+i===0?'disabled':''}>Atrás</button><button class="btn" data-act="survey-next">${a!=null&&a!==''?'Siguiente':'Saltar'}</button></div></div>`;
}

/* ---------------- Puerta de acceso ---------------- */
function vLogin(){ return accLogin(); }
function vClaim(){
  const taken=new Set(Object.keys(claims).filter(pid=>claims[pid]?.email!==authUser.email));
  return `<div class="wrap" style="padding-top:30px;padding-bottom:40px"><p class="muted small">Has entrado como ${esc(authUser.email)}. <button class="textlink" data-act="signout">Cambiar de cuenta</button></p>
    <h1 class="q" style="font-size:clamp(2.2rem,8vw,3.2rem);margin-top:10px">¿Quién eres?</h1><p class="muted">Elige tu nombre de la lista del club. Quedará ligado a este Gmail.</p>
    <div class="claimgrid stagger">${rosterAll().sort((a,b)=>(a.teams[0]||'').localeCompare(b.teams[0]||'')||(a.order||0)-(b.order||0)).map(p=>`<button data-act="claim" data-id="${esc(p.id)}" ${taken.has(p.id)?'disabled':''}>${avatar(p)}<span>${esc(p.name)}<small class="muted" style="display:block;font-weight:400">${esc(p.teams.map(t=>clubTeams().find(x=>x.id===t)?.short||t).join(', '))}</small>${taken.has(p.id)?'<br><span class="muted small" style="font-weight:400">ya elegido</span>':''}</span></button>`).join('')}</div>
    ${isAdmin?`<p style="margin-top:20px"><button class="textlink" data-act="skip">Soy administrador y no juego</button></p>`:''}
    <p class="source">¿Tu nombre aparece como elegido y no has sido tú? Avisa al capitán para que lo libere.</p></div>`;
}

/* ---------------- Administración ---------------- */
// Fecha u hora editadas a mano: quedan fijadas y la sincronización con la FCT ya no las cambia
function lockFix(f,what){ if(!f) return; f.lock={...(f.lock||{}),[what]:true,at:Date.now(),by:(me&&player(me)?.name)||authUser?.email||''}; if(what==='date') delete f.fctDate; else delete f.fctTime; }
// Bloque plegable que recuerda si estaba abierto entre renders
const fold=(k,title,sub,body,def=false,extra='')=>`<details class="fold" data-k="${k}" ${(ui.open?.[k]??def)?'open':''}><summary><span class="fl"><b>${title}</b>${sub?`<small>${sub}</small>`:''}</span>${extra}<span class="fchev" aria-hidden="true"></span></summary><div class="fbody">${body}</div></details>`;
document.addEventListener('toggle',e=>{ const d=e.target; if(d?.matches?.('details[data-k]')) (ui.open ||= {})[d.dataset.k]=d.open; },true);
function vAdmin(){
  if(!canManage) return `<div class="wrap"><div class="pagehead"><h1>Gestión</h1></div><div class="notice">${me? 'La gestión está limitada a los capitanes marcados. Un administrador puede abrirla a todo el equipo en Temporadas y ajustes.' : 'Elige tu nombre en Yo para poder gestionar.'}</div></div>`;
  if(ui.adminTab==='preguntas') ui.adminTab='temporadas';
  const tabs=[['jornada','Jornada'],['rotacion','Rotación'],['calendario','Calendario'],['plantilla','Plantilla'],['temporadas','Ajustes']];
  if(!tabs.some(x=>x[0]===ui.adminTab)) ui.adminTab='jornada'; const t=ui.adminTab;
  return `<div class="wrap"><div class="pagehead"><h1>Gestión</h1>${viewSeason!==currentSeason()?`<p class="notice">Estás editando la temporada ${esc(viewSeason)}.</p>`:''}</div>
    ${capDocsStrip()}
    <div class="atabs">${tabs.map(([k,l])=>`<button class="chip" data-act="admin-tab" data-v="${k}" aria-pressed="${t===k}">${l}</button>`).join('')}</div>
    ${t==='jornada'?aJornada():t==='rotacion'?capRotation():t==='plantilla'?aPlantilla():t==='calendario'?aCalendario():aTemporadas()}</div>`;
}
function jSelect(act,cur,onlyPolo=true){ const js= onlyPolo? poloOrder() : Array.from({length:NJ()},(_,i)=>i+1); return `<select data-act="${act}" style="max-width:380px">${js.map(j=>{ const f=poloFix(j); return `<option value="${j}" ${cur===j?'selected':''}>Jornada ${j}${f?', '+(f.home===POLO?''+US+' contra '+team(f.away).short:team(f.home).short+' contra '+US+'')+', '+fdate(f)+(f.moved?.from&&f.moved.from!==f.date? (f.date<f.moved.from?' (adelantada)':' (aplazada)') : ''):''}</option>`; }).join('')}</select>`; }
function adminJ(){ if(ui.adminJ && poloFix(ui.adminJ)) return ui.adminJ; const nx=nextPoloFix(); if(nx) return nx.j; const l=lastPoloPlayed(); if(l) return l.j; const f=S.fixtures.find(x=>x.home===POLO||x.away===POLO); return f? f.j : null; }
