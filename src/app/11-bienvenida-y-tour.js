/* ===================== BIENVENIDA (onboarding): bienvenida → tour con demo → perfil → entrar ===================== */
// Todo lo que se ve en el tour es una capa de DEMOSTRACIÓN: vive solo aquí y nunca se escribe en la base de datos.
let profilesLoaded=false;
const tourKey = () => 'polo-tour-'+(me||authUser?.email||'');
const onbKey  = () => 'polo-onb-'+(me||authUser?.email||'');
function tourDone(){ try{ if(localStorage.getItem(tourKey())) return true; }catch(e){} return !!(me && profiles[me]?.tourAt); }
const DEMO={ team:''+US+' A', rivals:['CT Mirador','Tennis Atalaya','Club Brisamar','CT Sant Roc'],
  players:[['Marc Soler','1a',['#2b5876','#4e4376'],1],['Pau Ferrer','1a',['#614385','#516395']],['Àlex Puig','2a',['#134E5E','#71B280']],['Jordi Vidal','2a',['#8e6b56','#c9a27e']],
           ['Oriol Mas','2a',['#3a6186','#89253e']],['Nil Serra','3a',['#4b6cb7','#182848']],['Biel Roca','3a',['#9d4b62','#d7a08f']],['Hugo Costa','3a',['#0f2027','#2c5364']]],
  results:[[1,'Tennis Atalaya','4-1','W','17 oct'],[2,'Club Brisamar','2-3','L','24 oct'],[3,'CT Sant Roc','3-2','W','31 oct']],
  table:[['CT Mirador',9],[''+US+'',6,1],['Club Brisamar',6],['Tennis Atalaya',3],['CT Sant Roc',0]] };
// Retrato ilustrado de demostración (no son fotos reales de nadie)
function demoFace(i,size=44,label=true){ const p=DEMO.players[i%DEMO.players.length], id='df'+i+'_'+size;
  return `<span class="dm-face" style="width:${size}px;height:${size}px"><svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[2][0]}"/><stop offset="1" stop-color="${p[2][1]}"/></linearGradient></defs><rect width="40" height="40" fill="url(#${id})"/><circle cx="20" cy="15.5" r="7" fill="rgba(255,255,255,.88)"/><path d="M6 40c1.6-8 7.4-12 14-12s12.4 4 14 12z" fill="rgba(255,255,255,.88)"/></svg>${label&&p[3]? '<i class="dm-cap">C</i>' : ''}</span>`; }
const EJ='<span class="tm-ej">Ejemplo</span>';
const dmScreen = (title, inner, tab) => `<div class="dm-phone">${EJ}<div class="dm-scr"><div class="dm-top"><img src="${ASSET.crestSm}" alt=""><b>${title}</b></div>${inner}</div>${tab!=null? dmBar(tab) : ''}</div>`;
function dmBar(on){ const t=[['Inicio','M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],['Clasif.','M7 4h10v4a5 5 0 0 1-10 0zM12 13v4M8 21h8'],['Calendario',IC.cal],['Equipo',IC.team],['Stats','M4 20V10M10 20V4M16 20v-7'],['Yo',IC.clock]];
  return `<div class="dm-bar">${t.map(([l,d],i)=>`<span class="${i===on?'on':''}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>${l}</span>`).join('')}</div>`; }
const dmRow = (a,b,cls='') => `<div class="dm-row ${cls}"><span>${a}</span><b>${b}</b></div>`;
// ---- pantallas del tour, por perfil (texto corto + ejemplo completo)
function slidesPlayer(){ return [
  {t:'Inicio: tu jornada de un vistazo', d:'Próximo rival, si estás disponible, si estás convocado y lo último del equipo.', w:'Pestaña Inicio', m:dmScreen('Inicio',`<div class="dm-match"><div>${demoFace(0,34,false)}<b>${US}</b></div><em>vs</em><div><span class="dm-crest">CM</span><b>CT Mirador</b></div></div><p class="dm-sub">Sábado, 15:00 h, en casa · En 3 días</p>
     <div class="dm-tiles"><div class="ok">${svgi('check',15,2.4)}<span>Disponible</span></div><div class="ok">${svgi('list',15,2.2)}<span>Individual 2</span></div></div>
     <div class="dm-feed"><div><i class="w">${svgi('score',13)}</i>Victoria 3-2 contra CT Sant Roc</div><div><i class="g">${svgi('trophy',13)}</i>Pau Ferrer, MVP de la jornada 3</div></div>`,0)},
  {t:'Equipo: tus compañeros', d:'La plantilla con fotos, categoría y capitán. Toca a cualquiera para ver su perfil.', w:'Pestaña Equipo', m:dmScreen('Equipo',`<div class="dm-grid">${DEMO.players.map((p,i)=>`<div>${demoFace(i,46)}<b>${p[0].split(' ')[0]}</b><span>${p[1]}</span></div>`).join('')}</div>`,3)},
  {t:'Calendario: lo jugado y lo que viene', d:'Cada jornada con su resultado, y la próxima destacada.', w:'Pestaña Calendario', m:dmScreen('Calendario',`<div class="dm-cal">${DEMO.results.map(r=>`<div><span class="j">${r[0]}</span><b>${r[1]}</b><em class="${r[3]==='W'?'w':'l'}">${r[3]==='W'?'G':'P'} ${r[2]}</em></div>`).join('')}<div class="nx"><span class="j">4</span><b>CT Mirador</b><em>Sáb 15:00</em></div><div class="fut"><span class="j">5</span><b>Tennis Atalaya</b><em>Pendiente</em></div></div>`,2)},
  {t:'Disponibilidad: un toque', d:'Cuando el capitán la pide, respondes desde el aviso o el enlace de WhatsApp.', w:'Aviso en Inicio', m:dmScreen('Jornada 4',`<p class="dm-q">¿Puedes jugar el sábado?</p><div class="dm-av"><span class="on">${svgi('check',15,2.4)} Disponible</span><span>${svgi('x',15,2.4)} No puedo</span><span>${svgi('clock',15,2)} Por confirmar</span></div><p class="dm-sub">8 de 10 compañeros ya han respondido</p>`,0)},
  {t:'Convocatoria: si juegas y en qué partido', d:'Al publicarse, ves el orden de juego y tu partido resaltado.', w:'Calendario, página de la jornada', m:dmScreen('Convocatoria',`<div class="dm-lu">${['Individual 1','Individual 2','Individual 3','Individual 4','Dobles'].map((l,i)=>`<div class="${i===1?'me':''}">${i===1? demoFace(5,26,false) : demoFace([0,5,2,3,1][i],26,false)}<span>${l}</span><b>${i===1?'Tú':[DEMO.players[0][0],'',DEMO.players[2][0],DEMO.players[3][0],'Pau y Oriol'][i]}</b></div>`).join('')}</div>`,2)},
  {t:'Estadísticas: tu temporada', d:'Win rate, individuales y dobles por separado, tu racha y tus MVP.', w:'Stats y tu perfil', m:dmScreen('Tus estadísticas',`<div class="dm-st"><div class="dm-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="bg"/><circle cx="50" cy="50" r="42" class="fg" stroke-dasharray="264" stroke-dashoffset="77"/></svg><b>71%</b></div><div class="dm-sg"><div><b>5-2</b><span>individuales</span></div><div><b>3-1</b><span>dobles</span></div><div><span class="dm-seq"><i class="w"></i><i class="w"></i><i></i><i class="w"></i><i class="w"></i></span><span>racha</span></div><div><b>2</b><span>MVP</span></div></div></div><div class="dm-bars">${[2,1,2,1].map((w,i)=>`<i style="height:${w*22}px" class="${i===1||i===3?'l':''}"></i>`).join('')}</div>`,4)},
  {t:'Tu perfil: tu ficha deportiva', d:'Tu carta, foto, golpe favorito y todo tu historial. Lo rellenas en un momento.', w:'Yo, Mi ficha', m:dmScreen('Perfil',`<div class="dm-prof"><div class="dm-card">${demoFace(1,64,false)}<b>78</b><span>PAU FERRER</span><em>VIC 82 · SET 76</em></div><div class="dm-pf">${dmRow('Golpe favorito','Revés')}${dmRow('Ídolo','Federer')}${dmRow('Grito','¡Vamos!')}</div></div>`,5)} ]; }
function slidesCaptain(){ return [
  {t:'Gestión: tu centro de operaciones', d:'Como capitán ves en Inicio el estado de la jornada y el siguiente paso.', w:'Arriba a la derecha: «Gestión» (punto rojo si hay algo pendiente)', m:`<div class="dm-ops">${EJ}<div class="dm-hd"><img src="${ASSET.crestSm}" alt=""><b>${US} A</b><span class="dm-gest">Gestión<i></i></span></div><div class="dm-k">Tu gestión, jornada 4</div><div class="dm-osteps">${['cal','mega','lock','team','score','trophy'].map((k,i)=>`<i class="${i<2?'done':i===2?'now':''}">${i<2? svgi('check',12,2.6) : svgi(k,12)}</i>`).join('')}</div><div class="dm-onext"><span>Siguiente paso</span><b>Cierra la disponibilidad</b><em>8 disponibles, 2 sin responder</em></div></div>`},
  {t:'Una jornada completa, paso a paso', d:'Toca cada fase para ver cómo queda: disponibilidad, convocatoria, orden de juego, resultados y cierre.', w:'Gestión, Jornada', cycle:true, m:`<div class="dm-cycle" id="dm-cycle">${EJ}<div class="dm-ctabs">${['Disponibilidad','Convocatoria','Orden','Resultados','Final'].map((l,i)=>`<button data-cyc="${i}" class="${i===0?'on':''}">${l}</button>`).join('')}</div><div class="dm-cbody">${cyclePane(0)}</div></div>`},
  {t:'Resultados: sube el acta', d:'Foto del acta y la IA lee nombres, marcadores y ganador. Tú revisas y confirmas.', w:'Gestión, Jornada, Resultados', m:`<div class="dm-acta">${EJ}<div class="dm-doc"><b>ACTA DE RESULTATS</b>${'<i></i>'.repeat(8)}<div class="dm-laser"></div></div><div class="dm-rev">${dmRow('Individual 1','6-3 6-4 · Marc','ok')}${dmRow('Individual 2','4-6 2-6 · Tú','ko')}${dmRow('Total',''+US+' 4-1','ok')}</div></div>`} ]; }
function cyclePane(i){ const P=DEMO.players;
  return [`<div class="dm-resp">${P.slice(0,8).map((p,k)=>`<div>${demoFace(k,30,false)}<i class="${k<6?'y':k===6?'m':'n'}">${k<6? svgi('check',10,3) : k===6? '?' : svgi('x',10,3)}</i></div>`).join('')}</div><p class="dm-sub">6 disponibles, 1 por confirmar, 1 no puede</p>`,
    `<div class="dm-sel">${P.slice(0,7).map((p,k)=>`<label class="${k<6?'on':''}">${demoFace(k,24,false)}<span>${p[0]}</span><i>${k<6? svgi('check',11,3) : ''}</i></label>`).join('')}</div>`,
    `<div class="dm-lu">${['Individual 1','Individual 2','Individual 3','Individual 4','Dobles'].map((l,k)=>`<div>${demoFace(k,24,false)}<span>${l}</span><b>${k<4? P[k][0] : P[4][0].split(' ')[0]+' y '+P[1][0].split(' ')[0]}</b></div>`).join('')}</div>`,
    `<div class="dm-sb"><div><b>${US}</b><span><i class="w"></i><i class="w"></i><i></i><i class="w"></i><i class="w"></i></span><strong>4</strong></div><div><b>CT Mirador</b><span><i></i><i></i><i class="w"></i><i></i><i></i></span><strong>1</strong></div></div>`,
    `<div class="dm-final">${svgi('trophy',30,1.7)}<b>Jornada finalizada</b><span>MVP: ${P[1][0]} · Informe del capitán enviado</span></div>`][i]; }
function slidesManager(){ return [
  {t:'Gestión deportiva: todo el club', d:'Primero lo que requiere atención; después cómo fue el fin de semana.', w:'Icono de la casa, arriba', m:`<div class="dm-club">${EJ}<div class="dm-hd dark"><b>Gestión deportiva</b><span class="dm-house">${svgi('cal',13)}</span></div>${[''+US+' B, jornada 4: sin resultado','Femenino A: resultado por validar',''+US+' A: 2 documentos por revisar'].map(x=>`<div class="dm-at">${x}<span>›</span></div>`).join('')}<div class="dm-kp"><div><b>3/4</b><span>compitieron</span></div><div><b class="w">2</b><span>victorias</span></div><div><b class="l">1</b><span>derrotas</span></div></div></div>`},
  {t:'Equipos y resultados', d:'Todos los equipos en tarjetas o en tabla, con su clasificación y próxima jornada.', w:'Gestión deportiva, Equipos', m:`<div class="dm-club">${EJ}${[['Absoluto Masculino A','2º','J4 vs CT Mirador'],['Absoluto Masculino B','5º','J4 vs Club Brisamar'],['Absoluto Femenino A','1º','J4 vs Tennis Atalaya'],['Veteranos +35','3º','J4 vs CT Sant Roc']].map(r=>`<div class="dm-team"><b>${r[0]}</b><em>${r[1]}</em><span>${r[2]}</span></div>`).join('')}</div>`},
  {t:'Documentación con IA', d:'Elige equipo, sube actas o listados, la IA los lee y tú validas.', w:'Gestión deportiva, Documentación', m:`<div class="dm-club">${EJ}${[['Acta jornada 3.pdf','Incorporado','ok'],['Listado jugadores.xlsx','Por revisar','mid'],['Orden de juego J4.jpg','Leyendo…','scan']].map(r=>`<div class="dm-docrow"><i>${svgi('list',14)}</i><b>${r[0]}</b><em class="${r[2]}">${r[1]}</em></div>`).join('')}</div>`},
  {t:'Informe del fin de semana', d:'Un botón genera el PDF profesional y lo envía por correo a los gestores.', w:'Gestión deportiva, Resumen', m:`<div class="dm-pdf">${EJ}<div class="dm-cover"><img src="${ASSET.crestSm}" alt=""><b>WEEKEND SPORTS REPORT</b><span>7–8 noviembre 2026</span></div><div class="dm-sent">${svgi('check',14,2.6)} Enviado a Albert con el PDF adjunto</div></div>`} ]; }
function onbRoles(){ return [...(me? [['player','Jugador','Consulta tu jornada, tus estadísticas y tu equipo']] : []), ...(me&&(isCaptain||isAdmin)? [['captain','Capitán','Gestiona convocatorias, resultados y actas']] : []), ...(canClub()? [['manager', isManager? 'Gestor deportivo' : 'Administrador', isManager? 'Supervisa todos los equipos del club' : 'Acceso completo, también a la gestión deportiva']] : [])]; }
function onbSave(){ try{ const o=ui.onb; localStorage.setItem(onbKey(), JSON.stringify({stage:o.stage,i:o.i,step:o.step,roles:o.roles})); }catch(e){} }
function startOnb(opts={}){ ensureOnbCss(); let st=null; try{ st=JSON.parse(localStorage.getItem(onbKey())||'null'); }catch(e){}
  const roles=onbRoles().map(r=>r[0]);
  ui.onb = (!opts.force && st && st.stage && st.stage!=='tour')? {...st, roles} : {stage:'welcome', i:0, step:0, roles};
  drawOnb(); }
const startTour = force => startOnb({force:true});
function onbSlides(){ const R=ui.onb.roles||[]; return [...(R.includes('player')? slidesPlayer() : []), ...(R.includes('captain')? slidesCaptain() : []), ...(R.includes('manager')? slidesManager() : [])]; }
function initFe(){ if(!me) return; if(!ui.fe || ui.fe.pid!==me) ui.fe={pid:me, base:clone(profiles[me]||{}), draft:{...(profiles[me]||{})}, phone:phones[me]||'', dirty:false, touched:false}; }
const PSTEPS=[['photo','Tu foto'],['you','Tú'],['game','Tu juego'],['doubles','Dobles y años'],['about','Sobre ti']];
function chipRow(k,opts){ const v=ui.fe.draft[k]||''; return `<div class="ob-chips">${opts.map(o=>`<button type="button" data-onb-chip="${k}" data-v="${esc(o)}" aria-pressed="${v===o}">${esc(o)}</button>`).join('')}</div>`; }
function profileStep(s){ const d=ui.fe.draft, p=player(me), ph=photos[me]?.d;
  if(s==='photo') return `<div class="ob-photo"><div class="ob-ph">${ph? `<img src="${esc(ph)}" alt="Tu foto">` : `<span>${esc((p?.name||'').split(' ').map(x=>x[0]).slice(0,2).join(''))}</span>`}</div><div class="ob-phb"><button class="btn brass big" data-act="crop" data-target="${esc(me)}" data-pick="1">${ph?'Cambiar foto':'Subir foto'}</button>${ph? `<button class="btn ghost" data-act="crop" data-target="${esc(me)}">Reencuadrar</button>` : ''}<p class="muted small">Desde el móvil puedes hacerla en el momento. Vertical y con la cara arriba.</p></div></div>`;
  if(s==='you') return `<label class="ob-f"><span>Tu nombre en el equipo</span><input type="text" value="${esc(p?.full||p?.name||'')}" disabled></label><p class="muted small" style="margin:-4px 0 12px">Si no es correcto, avisa a tu capitán: lo cambia en la plantilla.</p>
    <label class="ob-f"><span>Nombre deportivo o apodo (opcional)</span><input type="text" data-onb-k="nick" maxlength="40" value="${esc(d.nick||'')}" placeholder="Cómo te llaman en el equipo"></label>`;
  if(s==='game') return `<div class="ob-q"><span>Mano dominante</span>${chipRow('hand',['Diestro','Zurdo'])}</div><div class="ob-q"><span>Revés</span>${chipRow('backhand',['A una mano','A dos manos'])}</div><div class="ob-q"><span>Golpe favorito</span>${chipRow('shot',SHOTS)}</div><div class="ob-q"><span>Estilo de juego</span>${chipRow('style',['Fondo de pista','Agresivo desde el fondo','Saque y red','Todoterreno','Contragolpeador'])}</div>`;
  if(s==='doubles') return `<div class="ob-q"><span>En dobles prefieres jugar</span>${chipRow('dbl',['Drive (derecha)','Revés (izquierda)','Me da igual'])}</div><label class="ob-f"><span>Juegas al tenis desde (año, opcional)</span><input type="number" inputmode="numeric" min="1950" max="2026" data-onb-k="since" value="${esc(d.since||'')}" placeholder="Por ejemplo, 2008"></label>`;
  return `<label class="ob-f"><span>Unas líneas sobre ti (opcional)</span><textarea rows="3" maxlength="200" data-onb-k="bio" placeholder="Cómo vives el tenis, qué te gusta del equipo…">${esc(d.bio||'')}</textarea></label>
    <label class="ob-f"><span>Jugador favorito</span><input type="text" data-onb-k="idol" maxlength="60" value="${esc(d.idol||'')}" placeholder="Nadal, Alcaraz, Federer…"></label><label class="ob-f"><span>Grito de guerra</span><input type="text" data-onb-k="motto" maxlength="60" value="${esc(d.motto||'')}" placeholder="¡Vamos!"></label>`; }
function drawOnb(){ const O=ui.onb; let el=document.getElementById('onb');
  if(O && O.stage==='spot'){ if(el) el.remove(); document.body.classList.remove('tour-on'); onbSave(); return spotShow(O.i||0); }
  if(!O){ clearInterval(ui.cycT); if(el){ el.classList.add('out'); setTimeout(()=>el.remove(),280); } document.body.classList.remove('tour-on'); return; }
  if(!el){ el=document.createElement('div'); el.id='onb'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); document.body.appendChild(el); document.body.classList.add('tour-on');
    el.addEventListener('click',onbClick); el.addEventListener('input',onbInput);
    let x0=null; el.addEventListener('touchstart',e=>{ x0=e.touches[0].clientX; },{passive:true}); el.addEventListener('touchend',e=>{ if(x0==null||ui.onb?.stage!=='tour') return; const dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>55) onbGo(dx<0?1:-1); x0=null; }); }
  clearInterval(ui.cycT); onbSave(); const nm=(me&&player(me)?.name||(authUser?.name&&!/vista previa/i.test(authUser.name)? authUser.name : '')||'').split(' ')[0];
  let h='';
  if(O.stage==='welcome'){ const R=onbRoles();
    h=`<div class="ob-card ob-welcome"><div class="ob-wbg"></div><img class="ob-crest" src="${ASSET.crestSm}" alt=""><span class="hx-k">${esc(CLUB.name)}</span><h1>¡Bienvenido a Lliga Catalana${nm? ', '+esc(nm) : ''}!</h1><p>Todo lo que necesitas para vivir y gestionar la competición de tu equipo, en un solo lugar.</p>
      ${R.length? `<div class="ob-access"><span>Tu acceso</span><div>${R.map(([k,l])=>`<i class="${k}">${l}</i>`).join('')}</div></div>` : ''}
      <button class="btn brass big ob-cta" data-onb="discover">Descubrir la plataforma ${svgi('arrow',16)}</button><button class="ob-later" data-onb="skipall">Ahora no</button></div>`; }
  else if(O.stage==='tour'){ const S_=onbSlides(), n=S_.length, s=S_[Math.min(O.i,n-1)];
    h=`<div class="ob-card"><div class="ob-top"><div class="ob-prog"><i style="width:${Math.round((O.i+1)*100/n)}%"></i></div><button class="ob-skip" data-onb="skiptour">Saltar</button></div>
      <div class="ob-mock">${s.m}</div><div class="ob-txt"><span class="ob-n">${O.i+1} de ${n}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p>${s.w? `<p class="ob-where">${svgi('arrow',13)} ${esc(s.w)}</p>` : ''}</div>
      <div class="ob-nav"><button class="btn ghost" data-onb="prev" ${O.i? '' : 'disabled'}>Atrás</button><div class="ob-dots">${S_.map((_,k)=>`<i class="${k===O.i?'on':k<O.i?'past':''}"></i>`).join('')}</div><button class="btn brass" data-onb="next">${O.i===n-1? (me? 'Completar mi perfil' : 'Terminar') : 'Siguiente'}</button></div></div>`;
    if(s.cycle && !matchMedia('(prefers-reduced-motion: reduce)').matches){ let c=0; ui.cycT=setInterval(()=>{ c=(c+1)%5; onbCycle(c); },2200); } }
  else if(O.stage==='perfil'){ initFe(); const k=Math.min(O.step,PSTEPS.length-1), [sk,sl]=PSTEPS[k];
    h=`<div class="ob-card"><div class="ob-top"><div class="ob-prog"><i style="width:${Math.round((k+1)*100/PSTEPS.length)}%"></i></div><button class="ob-skip" data-onb="pskip">Ahora no</button></div>
      <div class="ob-txt" style="padding-top:14px"><span class="ob-n">Tu perfil, paso ${k+1} de ${PSTEPS.length}</span><h2>${k===0?'Ahora, vamos a completar tu perfil':esc(sl)}</h2><p>${k===0? 'Así tendrás una ficha deportiva completa y personal dentro de tu equipo. Empezamos por tu foto.' : 'Toca lo que encaje contigo. Todo es opcional y se guarda solo.'}</p></div>
      <div class="ob-form">${profileStep(sk)}</div>
      <div class="ob-nav"><button class="btn ghost" data-onb="pprev" ${k? '' : 'disabled'}>Atrás</button><span class="ob-saved">${ui.fe?.dirty? 'Guardando…' : 'Guardado'}</span><button class="btn brass" data-onb="pnext">${k===PSTEPS.length-1? 'Terminar' : 'Siguiente'}</button></div></div>`; }
  else if(O.stage==='apps'){ h=appsStage(); }
  else if(O.stage==='done' && !me){ onbMarkDone();
    h=`<div class="ob-card ob-done"><div class="ob-wbg"></div><img class="ob-crest" src="${ASSET.crestSm}" alt=""><h1>¡Todo listo!</h1><p>Ya tienes acceso a la gestión deportiva del club: todos los equipos, la Federació y el informe del fin de semana.</p><button class="btn brass big ob-cta" data-onb="enter">Ir a Gestión deportiva ${svgi('arrow',16)}</button></div>`; }
  else if(O.stage==='done'){ onbMarkDone(); const p=player(me);
    h=`<div class="ob-card ob-done"><div class="ob-wbg"></div><div class="ob-burst">${photos[me]?.d? `<img src="${esc(photos[me].d)}" alt="">` : `<b>${esc((p?.name||'?').split(' ').map(x=>x[0]).slice(0,2).join(''))}</b>`}</div><h1>¡Tu perfil está listo!</h1><p>Ya formas parte de tu equipo. Ahora puedes empezar a utilizar Lliga Catalana.</p><button class="btn brass big ob-cta" data-onb="enter">Entrar en mi equipo ${svgi('arrow',16)}</button><button class="ob-later" data-act="intro-open" data-id="${esc(me)}">▶ Ver mi presentación de jugador</button></div>`; }
  el.innerHTML=h; el.querySelector('.ob-cta, [data-onb="next"], [data-onb="pnext"]')?.focus({preventScroll:true});
}
function onbCycle(c){ const box=document.getElementById('dm-cycle'); if(!box) return; box.querySelectorAll('[data-cyc]').forEach(b=>b.classList.toggle('on',+b.dataset.cyc===c)); const body=box.querySelector('.dm-cbody'); body.innerHTML=cyclePane(c); body.classList.remove('dm-in'); void body.offsetWidth; body.classList.add('dm-in'); }
function onbGo(d){ const O=ui.onb; if(!O||O.stage!=='tour') return; const n=onbSlides().length, i=O.i+d; if(i<0) return; if(i>=n){ return onbToProfile(); } O.i=i; drawOnb(); }
function onbToProfile(){ const O=ui.onb; if(!me){ return onbFinish(); } O.stage='perfil'; O.step=0; drawOnb(); }
function onbMarkDone(){ try{ localStorage.setItem(tourKey(), String(Date.now())); localStorage.removeItem(onbKey()); }catch(e){}
  if(me && !profiles[me]?.tourAt){ const at=Date.now(); const ex=profiles[me]&&Object.keys(profiles[me]).length; (profiles[me] ||= {}).tourAt=at; (ex? B.update('profiles/'+me,{tourAt:at}) : B.set('profiles/'+me,{...profiles[me]})).catch(()=>{}); } }
async function onbFinish(){ try{ if(ui.fe?.dirty) await feFlush(); }catch(e){} try{ localStorage.setItem(tourKey(), String(Date.now())); localStorage.removeItem(onbKey()); }catch(e){}
  if(me){ const at=Date.now(); const ex=profiles[me]&&Object.keys(profiles[me]).length; (profiles[me] ||= {}).tourAt=at; (ex? B.update('profiles/'+me,{tourAt:at}) : B.set('profiles/'+me,{...profiles[me]})).catch(()=>{}); }
  ui.onb=null; ui.tourSeen=true; drawOnb(); location.hash= me? 'inicio' : 'club'; setTimeout(()=>{ confetti(innerWidth/2,innerHeight/3,100); },350); }
function onbClick(e){ const O=ui.onb; if(!O) return; const r=e.target.closest('[data-onb-role]'); if(r){ const k=r.dataset.onbRole; O.roles = O.roles.includes(k)? O.roles.filter(x=>x!==k) : [...O.roles,k]; if(!O.roles.length) O.roles=[k]; drawOnb(); return; }
  const cy=e.target.closest('[data-cyc]'); if(cy){ clearInterval(ui.cycT); onbCycle(+cy.dataset.cyc); return; }
  const ch=e.target.closest('[data-onb-chip]'); if(ch){ initFe(); const k=ch.dataset.onbChip, v=ch.dataset.v; ui.fe.draft[k]= ui.fe.draft[k]===v? '' : v; ch.parentElement.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===ui.fe.draft[k]))); feQueue(); onbSavedLabel(); return; }
  const b=e.target.closest('[data-onb]'); if(!b) return; const a=b.dataset.onb;
  if(a==='discover'){ O.stage='spot'; O.i=0; drawOnb(); }
  else if(a==='skipall'){ ui.onb=null; ui.tourSeen=true; drawOnb(); onbMarkDone(); toast('Puedes ver la introducción cuando quieras desde Yo'); }
  else if(a==='appsnext'||a==='appslater'){ if(a==='appslater'){ try{ localStorage.setItem('polo-nudge',String(Date.now()-4*864e5)); }catch(e){} } O.stage='done'; drawOnb(); }
  else if(a==='next') onbGo(1); else if(a==='prev') onbGo(-1); else if(a==='skiptour') onbToProfile();
  else if(a==='pnext'){ if(O.step>=PSTEPS.length-1){ if(ui.fe?.dirty) feFlush(); O.stage='apps'; drawOnb(); } else { O.step++; drawOnb(); } }
  else if(a==='pprev'){ if(O.step>0){ O.step--; drawOnb(); } } else if(a==='pskip'){ if(ui.fe?.dirty) feFlush(); O.stage='apps'; drawOnb(); } else if(a==='enter') onbFinish(); }
function onbInput(e){ const el=e.target; if(!el.dataset?.onbK) return; initFe(); ui.fe.draft[el.dataset.onbK]=el.value; feQueue(); onbSavedLabel(); }
function onbSavedLabel(){ const s=document.querySelector('#onb .ob-saved'); if(s){ s.textContent='Guardando…'; clearTimeout(ui.obsT); ui.obsT=setTimeout(()=>{ if(s.isConnected) s.textContent='Guardado'; },1300); } }
function maybeTour(){ if(ui.onb || ui.tourSeen || !authReady || !authUser) return; try{ if(localStorage.getItem('polo-tour-off')) return; }catch(e){} if(!me && !isManager) return; if(me && !profilesLoaded) return;
  if(!['inicio','club',''].includes(route())) return; ui.tourSeen=true; if(tourDone()) return;
  let st=null; try{ st=JSON.parse(localStorage.getItem(onbKey())||'null'); }catch(e){} if(st?.later && Date.now()-st.later<20*36e5) return;
  setTimeout(()=>{ if(!ui.onb && !tourDone()) startOnb(); },350); }
function onboardBanner(){ return ''; }

const ONB_CSS=`
body.tour-on{overflow:hidden}
.cropper{z-index:260!important}
#onb{position:fixed;inset:0;z-index:240;display:grid;place-items:center;padding:14px;background:radial-gradient(800px 500px at 50% 0%,rgba(26,80,62,.55),transparent 70%),rgba(5,20,15,.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:obin .3s ease}
#onb.out{animation:obout .28s ease forwards}@keyframes obin{from{opacity:0}to{opacity:1}}@keyframes obout{to{opacity:0}}
.ob-card{position:relative;width:min(460px,100%);max-height:calc(100dvh - 28px);overflow:auto;border-radius:30px;background:var(--surface,#fff);color:var(--ink,#13261F);box-shadow:0 40px 90px -40px rgba(0,0,0,.8);display:grid;animation:obpop .4s cubic-bezier(.2,.8,.2,1)}
@keyframes obpop{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
.ob-welcome,.ob-done{padding:34px 24px 22px;text-align:center;justify-items:center;overflow:hidden;color:#F2F5F0;background:linear-gradient(165deg,#164a3a 0%,#0b2a21 70%)}
.ob-wbg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(300px 200px at 85% 0%,rgba(226,196,124,.28),transparent 70%),linear-gradient(rgba(255,255,255,.05),rgba(255,255,255,.05)) 50% 0/1px 100% no-repeat,linear-gradient(rgba(255,255,255,.04),rgba(255,255,255,.04)) 0 62%/100% 1px no-repeat}
.ob-crest{position:relative;width:96px;filter:drop-shadow(0 16px 22px rgba(0,0,0,.45));animation:obfloat 3.4s ease-in-out infinite;margin-bottom:10px}
@keyframes obfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.ob-welcome h1,.ob-done h1{position:relative;margin:6px 0 8px;font-stretch:62%;font-weight:800;font-size:clamp(2.1rem,9vw,2.8rem);line-height:.98}
.ob-welcome>p,.ob-done>p{position:relative;margin:0 0 18px;color:rgba(242,245,240,.8);font-size:1rem;line-height:1.45;max-width:34ch}
.ob-roles{position:relative;display:grid;gap:8px;width:100%;margin:0 0 18px;text-align:left}
.ob-roles>span{font-size:.78rem;color:rgba(242,245,240,.65)}
.ob-roles button{position:relative;display:grid;gap:2px;padding:12px 44px 12px 14px;border-radius:16px;border:1.5px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#F2F5F0;text-align:left;cursor:pointer;transition:all .2s}
.ob-roles button b{font-size:1rem}.ob-roles button em{font-style:normal;font-size:.8rem;color:rgba(242,245,240,.65)}
.ob-roles button i{position:absolute;right:14px;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:50%;display:grid;place-items:center;border:2px solid rgba(255,255,255,.3);color:transparent}
.ob-roles button[aria-pressed="true"]{border-color:#E2C47C;background:rgba(226,196,124,.12)}.ob-roles button[aria-pressed="true"] i{background:#E2C47C;border-color:#E2C47C;color:#0b2a21}
.ob-roles.one button{padding-right:14px;cursor:default}
.ob-access{position:relative;display:grid;gap:8px;justify-items:center;margin:0 0 20px}.ob-access>span{font-size:.72rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:rgba(242,245,240,.6)}.ob-access div{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}.ob-access i{font-style:normal;font-weight:700;font-size:.86rem;padding:7px 13px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)}.ob-access i.manager{background:rgba(226,196,124,.16);border-color:rgba(226,196,124,.5);color:#E2C47C}
.ob-cta{position:relative;width:100%;justify-content:center;gap:8px;background:linear-gradient(180deg,#C9A24D,#94722A)!important;border-color:#94722A!important;color:#fff!important;box-shadow:0 14px 28px -14px rgba(201,162,77,.9)}
.ob-later{position:relative;margin-top:10px;border:0;background:none;color:rgba(242,245,240,.6);font-weight:600;cursor:pointer}
.ob-top{display:flex;align-items:center;gap:12px;padding:16px 18px 0}
.ob-prog{flex:1;height:4px;border-radius:4px;background:var(--surface2,#eef0eb);overflow:hidden}.ob-prog i{display:block;height:100%;background:linear-gradient(90deg,#94722A,#E2C47C);transition:width .45s cubic-bezier(.2,.8,.2,1)}
.ob-skip{border:0;background:none;color:var(--muted,#5b6b63);font-weight:700;font-size:.85rem;cursor:pointer}
.ob-mock{display:grid;place-items:center;padding:14px 16px 2px;min-height:300px;animation:obslide .4s cubic-bezier(.2,.8,.2,1)}
@keyframes obslide{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:none}}
.ob-txt{padding:6px 22px 2px}.ob-n{font-size:.7rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--brass,#94722A)}
.ob-txt h2{margin:4px 0 6px;font-stretch:72%;font-weight:750;font-size:1.55rem;line-height:1.08}
.ob-txt p{margin:0 0 8px;color:var(--muted,#5b6b63);font-size:.95rem;line-height:1.45}
.ob-where{display:inline-flex!important;align-items:center;gap:6px;font-size:.78rem!important;font-weight:700;color:var(--brass,#94722A)!important;background:#F6EFDD;padding:5px 11px;border-radius:999px}
.ob-nav{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:12px 18px 18px}
.ob-dots{display:flex;justify-content:center;gap:4px;flex-wrap:wrap}.ob-dots i{width:6px;height:6px;border-radius:50%;background:var(--line,#dfe3dc);transition:all .3s}.ob-dots i.past{background:#d4c08f}.ob-dots i.on{width:18px;border-radius:4px;background:#94722A}
.ob-saved{justify-self:center;font-size:.78rem;font-weight:700;color:var(--muted,#5b6b63)}
.ob-form{padding:6px 22px 4px;display:grid;gap:4px}
.ob-q{display:grid;gap:7px;margin-bottom:12px}.ob-q>span,.ob-f>span{font-size:.8rem;font-weight:700;color:var(--ink,#13261F)}
.ob-chips{display:flex;flex-wrap:wrap;gap:6px}.ob-chips button{border:1.5px solid var(--line,#e3e6df);background:var(--bg,#f4f5f1);border-radius:999px;padding:9px 13px;font-weight:600;font-size:.88rem;min-height:40px;cursor:pointer;transition:all .18s}
.ob-chips button[aria-pressed="true"]{background:#13261F;border-color:#13261F;color:#fff;box-shadow:inset 0 0 0 2px #E2C47C}
.ob-f{display:grid;gap:6px;margin-bottom:12px}.ob-f input,.ob-f textarea{font-size:1rem}
.ob-photo{display:grid;grid-template-columns:140px 1fr;gap:16px;align-items:center;padding:4px 0 10px}
.ob-ph{aspect-ratio:3/4;border-radius:18px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(160deg,#1B5A46,#0A2A20);border:2px solid #E2C47C;box-shadow:0 16px 30px -18px rgba(0,0,0,.6)}
.ob-ph img{width:100%;height:100%;object-fit:cover;object-position:50% 22%}.ob-ph span{font-stretch:62%;font-weight:800;font-size:2.8rem;color:#E2C47C}
.ob-phb{display:grid;gap:8px;justify-items:start}
@media (max-width:420px){.ob-photo{grid-template-columns:110px 1fr}}
.ob-burst{position:relative;width:118px;height:118px;border-radius:50%;display:grid;place-items:center;overflow:hidden;border:3px solid #E2C47C;background:#123d30;box-shadow:0 0 0 10px rgba(226,196,124,.12),0 0 0 22px rgba(226,196,124,.06);margin:6px 0 14px;animation:obpop .6s cubic-bezier(.2,.8,.2,1)}
.ob-burst img{width:100%;height:100%;object-fit:cover;object-position:50% 22%}.ob-burst b{font-stretch:62%;font-weight:800;font-size:2.8rem;color:#E2C47C}
.tm-ej{position:absolute;top:10px;right:10px;z-index:3;font-size:.6rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:#F3EAD3;color:#94722A}
.dm-face{position:relative;display:inline-block;border-radius:50%;overflow:visible;flex:none}.dm-face svg{border-radius:50%;display:block}
.dm-cap{position:absolute;right:-3px;bottom:-3px;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:.55rem;font-weight:800;background:#E2C47C;color:#13261F;border:2px solid #fff}
.dm-phone{position:relative;width:250px;border-radius:32px;padding:10px;background:#0b2a21;box-shadow:0 24px 44px -24px rgba(0,0,0,.85)}
.dm-scr{border-radius:23px;background:#F4F5F1;padding:12px 12px 14px;min-height:230px}
.dm-top{display:flex;align-items:center;gap:6px;margin-bottom:10px}.dm-top img{width:16px}.dm-top b{font-size:.78rem;color:#13261F}
.dm-bar{display:grid;grid-template-columns:repeat(6,1fr);padding:8px 2px 2px}.dm-bar span{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:.48rem;color:rgba(242,245,240,.55)}.dm-bar span.on{color:#E2C47C}
.dm-match{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;text-align:center;padding:10px;border-radius:16px;background:#0f3b2e;color:#F2F5F0}.dm-match>div{display:grid;justify-items:center;gap:4px}.dm-match b{font-size:.72rem}.dm-match em{font-style:normal;font-weight:800;color:#E2C47C}
.dm-crest{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:.62rem;font-weight:800;background:rgba(255,255,255,.14)}
.dm-sub{font-size:.62rem;color:#5b6b63;margin:7px 0;text-align:center}
.dm-tiles{display:grid;grid-template-columns:1fr 1fr;gap:6px}.dm-tiles div{display:flex;align-items:center;gap:6px;padding:8px;border-radius:12px;background:#DDF1E6;color:#1F7A4D;font-weight:700;font-size:.68rem}
.dm-feed{display:grid;gap:5px;margin-top:8px}.dm-feed div{display:flex;align-items:center;gap:7px;font-size:.62rem;font-weight:600;color:#13261F;padding:6px 7px;border-radius:10px;background:#fff}.dm-feed i{width:20px;height:20px;border-radius:50%;display:grid;place-items:center}.dm-feed i.w{background:#DDF1E6;color:#1F7A4D}.dm-feed i.g{background:#F3EAD3;color:#94722A}
.dm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px 4px}.dm-grid div{display:grid;justify-items:center;gap:2px}.dm-grid b{font-size:.6rem;color:#13261F}.dm-grid span{font-size:.52rem;color:#5b6b63}
.dm-cal{display:grid;gap:5px}.dm-cal div{display:grid;grid-template-columns:20px 1fr auto;gap:6px;align-items:center;padding:8px;border-radius:11px;background:#fff;font-size:.66rem}.dm-cal .j{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;background:#eef0eb;font-weight:800;font-size:.6rem}
.dm-cal em{font-style:normal;font-weight:800;font-size:.6rem;padding:2px 6px;border-radius:999px}.dm-cal em.w{background:#DDF1E6;color:#1F7A4D}.dm-cal em.l{background:#F7E1DC;color:#B4472F}.dm-cal .nx{background:#0f3b2e;color:#F2F5F0}.dm-cal .nx .j{background:#E2C47C;color:#0b2a21}.dm-cal .nx em{color:#E2C47C}.dm-cal .fut{opacity:.6}
.dm-q{font-stretch:62%;font-weight:800;font-size:1.3rem;color:#13261F;margin:2px 0 8px}
.dm-av{display:grid;gap:6px}.dm-av span{display:flex;align-items:center;gap:7px;padding:9px 11px;border-radius:12px;background:#fff;font-weight:700;font-size:.74rem;color:#13261F;border:1.5px solid #e3e6df}.dm-av span.on{border-color:#1F7A4D;background:#EAF6EF;color:#1F7A4D}
.dm-lu{display:grid;gap:5px}.dm-lu div{display:grid;grid-template-columns:26px 1fr auto;gap:7px;align-items:center;padding:6px 8px;border-radius:11px;background:#fff;font-size:.64rem}.dm-lu span{color:#5b6b63}.dm-lu b{color:#13261F}.dm-lu .me{background:#13261F}.dm-lu .me span{color:rgba(242,245,240,.7)}.dm-lu .me b{color:#E2C47C}
.dm-st{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center}.dm-ring{position:relative;width:86px;height:86px}.dm-ring svg{transform:rotate(-90deg)}.dm-ring .bg{fill:none;stroke:#e3e6df;stroke-width:9}.dm-ring .fg{fill:none;stroke:#1F7A4D;stroke-width:9;stroke-linecap:round;animation:dmring 1.3s cubic-bezier(.2,.8,.2,1)}@keyframes dmring{from{stroke-dashoffset:264}}
.dm-ring b{position:absolute;inset:0;display:grid;place-items:center;font-stretch:62%;font-weight:800;font-size:1.4rem;color:#13261F}
.dm-sg{display:grid;grid-template-columns:1fr 1fr;gap:6px}.dm-sg b{display:block;font-stretch:62%;font-weight:800;font-size:1.05rem;color:#13261F}.dm-sg span{font-size:.54rem;color:#5b6b63}
.dm-seq{display:flex;gap:3px}.dm-seq i{width:11px;height:11px;border-radius:50%;background:#d5dbd7}.dm-seq i.w{background:radial-gradient(circle at 35% 30%,#f2ff8a,#c9e033 60%,#a8bf22)}
.dm-bars{display:flex;align-items:flex-end;gap:10px;height:50px;margin-top:10px;padding:0 6px;border-bottom:1px solid #e3e6df}.dm-bars i{flex:1;border-radius:5px 5px 0 0;background:#1F7A4D;animation:dmgrow .9s cubic-bezier(.2,.8,.2,1) both;transform-origin:bottom}.dm-bars i.l{background:#d9a79c}@keyframes dmgrow{from{transform:scaleY(0)}}
.dm-prof{display:grid;gap:10px;justify-items:center}.dm-card{width:132px;padding:12px 8px;border-radius:16px;display:grid;justify-items:center;gap:3px;background:linear-gradient(160deg,#F3DE9C,#B08D3C);color:#3b2b06;box-shadow:0 16px 26px -16px rgba(148,114,42,.9)}.dm-card b{font-stretch:62%;font-weight:800;font-size:1.7rem;line-height:1}.dm-card span{font-size:.62rem;font-weight:800}.dm-card em{font-style:normal;font-size:.55rem}
.dm-pf,.dm-rev{display:grid;gap:4px;width:100%}.dm-row{display:flex;justify-content:space-between;gap:8px;padding:6px 8px;border-radius:9px;background:#fff;font-size:.64rem}.dm-row span{color:#5b6b63}.dm-row.ok b{color:#1F7A4D}.dm-row.ko b{color:#B4472F}
.dm-ops,.dm-club,.dm-acta,.dm-pdf,.dm-cycle{position:relative;width:min(310px,100%);border-radius:24px;padding:16px;display:grid;gap:10px}
.dm-ops{background:linear-gradient(160deg,#123d30,#0b2a21);color:#F2F5F0}
.dm-hd{display:flex;align-items:center;gap:7px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.1)}.dm-hd img{width:18px}.dm-hd b{font-size:.8rem;flex:1}.dm-hd.dark{border-color:#e3e6df}.dm-hd.dark b{color:#13261F}
.dm-gest{position:relative;font-size:.68rem;font-weight:800;padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.12);box-shadow:0 0 0 2px #E2C47C;animation:hxpulse 2s infinite}.dm-gest i{position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:#E5533D}
.dm-house{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#0f3b2e;color:#E2C47C;box-shadow:0 0 0 2px #E2C47C}
.dm-k{font-size:.58rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#E2C47C}
.dm-osteps{display:flex;justify-content:space-between}.dm-osteps i{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;border:2px solid rgba(255,255,255,.2);color:rgba(242,245,240,.6)}.dm-osteps i.done{background:#E2C47C;border-color:#E2C47C;color:#0b2a21}.dm-osteps i.now{border-color:#E2C47C;color:#E2C47C;animation:hxpulse 2s infinite}
.dm-onext{border-radius:14px;background:#F7F5EF;color:#13261F;padding:11px;display:grid;gap:3px}.dm-onext span{font-size:.56rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94722A}.dm-onext b{font-size:.92rem}.dm-onext em{font-style:normal;font-size:.66rem;color:#5b6b63}
.dm-cycle{background:var(--surface,#fff);border:1px solid var(--line,#e3e6df)}
.dm-cycle>.tm-ej{top:auto;bottom:10px}.dm-ctabs{display:flex;gap:4px;overflow-x:auto}.dm-ctabs button{flex:none;border:0;border-radius:999px;padding:6px 9px;font-size:.66rem;font-weight:700;background:var(--bg,#f4f5f1);color:var(--muted,#5b6b63);cursor:pointer}.dm-ctabs button.on{background:#13261F;color:#E2C47C}
.dm-cbody{min-height:170px}.dm-in{animation:obslide .35s ease}
.dm-resp{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;justify-items:center}.dm-resp div{position:relative}.dm-resp i{position:absolute;right:-4px;bottom:-4px;width:15px;height:15px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:.55rem;font-weight:800;border:2px solid #fff;color:#fff}.dm-resp i.y{background:#1F7A4D}.dm-resp i.m{background:#94722A}.dm-resp i.n{background:#B4472F}
.dm-sel{display:grid;gap:4px}.dm-sel label{display:grid;grid-template-columns:24px 1fr 18px;gap:7px;align-items:center;padding:5px 7px;border-radius:10px;background:var(--bg,#f4f5f1);font-size:.64rem}.dm-sel label i{width:16px;height:16px;border-radius:5px;border:1.5px solid #cfd6d1;display:grid;place-items:center}.dm-sel label.on i{background:#13261F;border-color:#13261F;color:#E2C47C}
.dm-sb{border-radius:14px;background:#0b2a21;color:#F2F5F0;padding:12px;display:grid;gap:8px}.dm-sb div{display:grid;grid-template-columns:1fr auto 18px;gap:8px;align-items:center;font-size:.78rem}.dm-sb span{display:flex;gap:3px}.dm-sb span i{width:11px;height:11px;border-radius:3px;background:rgba(255,255,255,.14)}.dm-sb span i.w{background:#E2C47C}.dm-sb strong{font-stretch:62%;font-size:1.3rem;text-align:right}
.dm-final{display:grid;justify-items:center;gap:6px;text-align:center;padding:16px 8px;border-radius:16px;background:linear-gradient(140deg,#F6E7B8,#D9B45A);color:#3b2b06}.dm-final b{font-size:1rem}.dm-final span{font-size:.68rem}
.dm-acta{background:var(--bg,#f4f5f1);justify-items:center}
.dm-doc{position:relative;width:160px;height:150px;border-radius:10px;background:#fff;border:1px solid #e3e6df;padding:12px;display:grid;align-content:start;gap:8px;overflow:hidden}.dm-doc b{font-size:.55rem}.dm-doc i{height:5px;border-radius:3px;background:#e6eaef}.dm-doc i:nth-child(3n){width:70%}
.dm-laser{position:absolute;left:0;right:0;top:0;height:2px;background:#ff6f61;box-shadow:0 0 8px 2px rgba(255,90,78,.6);animation:dmscan 2.2s ease-in-out infinite}@keyframes dmscan{0%{top:2%;opacity:0}10%{opacity:1}90%{opacity:1}100%{top:96%;opacity:0}}
.dm-club{background:var(--surface,#fff);border:1px solid var(--line,#e3e6df)}
.dm-at{display:flex;justify-content:space-between;padding:8px 10px;border-radius:10px;background:var(--bg,#f4f5f1);font-size:.68rem;box-shadow:inset 3px 0 0 #94722A}
.dm-kp{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.dm-kp div{padding:6px;border-radius:10px;background:var(--bg,#f4f5f1)}.dm-kp b{display:block;font-stretch:62%;font-weight:800;font-size:1.2rem}.dm-kp b.w{color:#1F7A4D}.dm-kp b.l{color:#B4472F}.dm-kp span{font-size:.56rem;color:#5b6b63}
.dm-team{display:grid;grid-template-columns:1fr auto;gap:2px 8px;padding:9px 10px;border-radius:12px;background:var(--bg,#f4f5f1)}.dm-team b{font-size:.72rem}.dm-team em{font-style:normal;font-stretch:62%;font-weight:800;font-size:1.1rem;grid-row:span 2;align-self:center}.dm-team span{font-size:.6rem;color:#5b6b63}
.dm-docrow{display:grid;grid-template-columns:26px 1fr auto;gap:7px;align-items:center;padding:8px;border-radius:11px;background:var(--bg,#f4f5f1)}.dm-docrow i{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:#fff;color:#5b6b63}.dm-docrow b{font-size:.66rem}.dm-docrow em{font-style:normal;font-size:.58rem;font-weight:800;padding:2px 7px;border-radius:999px}.dm-docrow em.ok{background:#DDF1E6;color:#1F7A4D}.dm-docrow em.mid{background:#F3EAD3;color:#94722A}.dm-docrow em.scan{background:#fde4e1;color:#c2463a}
.dm-pdf{background:var(--bg,#f4f5f1);justify-items:center}.dm-cover{width:150px;height:200px;border-radius:8px;background:#12284C;color:#fff;display:grid;justify-items:center;align-content:center;gap:8px;box-shadow:0 18px 30px -16px rgba(18,40,76,.9);border-bottom:6px solid #9E1B32}.dm-cover img{width:44px}.dm-cover b{font-size:.62rem;letter-spacing:.12em;text-align:center}.dm-cover span{font-size:.56rem;color:#E2C47C}
.dm-sent{display:flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;color:#1F7A4D;background:#DDF1E6;padding:7px 11px;border-radius:999px}
@media (max-width:420px){.ob-mock{min-height:280px}.dm-phone{width:236px}}
@media (prefers-reduced-motion: reduce){#onb,.ob-card,.ob-mock,.ob-crest,.ob-burst,.dm-ring .fg,.dm-bars i,.dm-laser,.dm-gest,.dm-osteps i.now,.dm-in{animation:none!important}}
`;
function ensureOnbCss(){ if(document.getElementById('onb-css')) return; const s=document.createElement('style'); s.id='onb-css'; s.textContent=ONB_CSS+(typeof SPOT_CSS!=='undefined'? SPOT_CSS : ''); document.head.appendChild(s); }
const ensureTourCss = ensureOnbCss;

document.addEventListener('keydown',e=>{ if(!ui.onb||ui.onb.stage!=='tour') return; if(e.key==='ArrowRight') onbGo(1); else if(e.key==='ArrowLeft') onbGo(-1); });
/* ---------- Tour guiado sobre la app real: foco en cada elemento + explicación ---------- */
const navSel = k => `.tabbar a[data-nav="${k}"], .topnav a[data-nav="${k}"]`;
function spotSteps(){ const R=ui.onb?.roles||[], st=[];
  if(R.includes('player')){
    st.push({r:'inicio', sel:'.hero .board', t:'Tu próxima jornada', d:'Rival, fecha y hora. El día del partido, el marcador se actualiza en directo.'});
    st.push({r:'inicio', sel:'.hx-my', t:'Tu estado en la jornada', d:'Si estás disponible y si estás convocado. Un toque para responder.', ex:`<div class="dm-tiles"><div class="ok">${svgi('check',14,2.4)}<span>Disponible</span></div><div class="ok">${svgi('list',14,2.2)}<span>Individual 2</span></div></div>`});
    st.push({r:'inicio', sel:'.hx-stats, .hx-empty', t:'Tus números y la actividad', d:'Tu win rate, tu racha y lo último del equipo: resultados, convocatorias y MVP.', ex:`<div class="dm-st"><div class="dm-ring" style="width:64px;height:64px"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="bg"/><circle cx="50" cy="50" r="42" class="fg" stroke-dasharray="264" stroke-dashoffset="77"/></svg><b style="font-size:1.1rem">71%</b></div><div class="dm-sg"><div><b>5-2</b><span>individuales</span></div><div><b>3-1</b><span>dobles</span></div></div></div>`});
    st.push({r:'clasificacion', sel:navSel('clasificacion'), t:'Clasificación', d:'La tabla de la liga y cómo evoluciona el equipo jornada a jornada.', ex:`<div style="display:grid;gap:4px">${DEMO.table.slice(0,4).map((r,i)=>dmRow(`${i+1}. ${r[0]}`,`${r[1]} pts`,r[2]?'ok':'')).join('')}</div>`});
    st.push({r:'calendario', sel:navSel('calendario'), t:'Calendario', d:'Todas las jornadas, jugadas y por jugar. Toca una para ver la convocatoria y los partidos.', ex:`<div class="dm-cal">${DEMO.results.slice(1).map(r=>`<div><span class="j">${r[0]}</span><b>${r[1]}</b><em class="${r[3]==='W'?'w':'l'}">${r[3]==='W'?'G':'P'} ${r[2]}</em></div>`).join('')}<div class="nx"><span class="j">4</span><b>CT Mirador</b><em>Sáb 15:00</em></div></div>`});
    st.push({r:'equipo', sel:navSel('equipo'), t:'Equipo', d:'La plantilla con fotos. Toca a un compañero para ver su perfil y sus estadísticas.', ex:`<div class="dm-grid">${[0,1,2,3].map(i=>`<div>${demoFace(i,38)}<b>${DEMO.players[i][0].split(' ')[0]}</b></div>`).join('')}</div>`});
    st.push({r:'stats', sel:navSel('stats'), t:'Estadísticas', d:'Rankings de individuales y dobles, MVP de la temporada y récords del equipo.', ex:`<div style="display:grid;gap:4px">${[['Pau Ferrer','6-1 · 86%'],['Marc Soler','5-2 · 71%'],['Àlex Puig','4-2 · 67%']].map((r,i)=>dmRow(`${i+1}. ${r[0]}`,r[1],i?'':'ok')).join('')}${dmRow('MVP de la temporada','Pau Ferrer (2)')}</div>`});
    st.push({r:'yo', sel:navSel('yo'), t:'Yo', d:'Tu ficha, tus avisos pendientes, instalar la app y las notificaciones. Y esta introducción, por si quieres repetirla.'}); }
  if(R.includes('captain')){
    st.push({r:'inicio', sel:'.hx-ops', t:'Tu centro de operaciones', d:'Como capitán ves aquí el estado de la jornada y el siguiente paso, con su botón.'});
    st.push({r:'inicio', sel:'.adminlink', t:'Gestión', d:'Todo lo del capitán está aquí. Si hay algo pendiente, verás un punto rojo.'});
    st.push({r:'admin', sel:'.mdtabs', t:'Las fases de cada jornada', d:'Preparar (disponibilidad), Convocar (orden de juego y cartel), Resultados (con el acta y la IA) y Postpartido (informe y MVP).'}); }
  if(R.includes('manager')){
    st.push({r:me?'inicio':'club', sel:'.clublink', t:'Gestión deportiva', d:'El icono de la casa abre la vista de todo el club, separada de la de tu equipo.'});
    st.push({r:'club', sel:'.attn, .attn-ok', t:'Lo que requiere atención', d:'Resultados sin poner, por validar y documentos por revisar de todos los equipos, lo primero.', ex:`<div style="display:grid;gap:6px">${[''+US+' B, jornada 4: sin resultado','Femenino A: resultado por validar',''+US+' A: 2 documentos por revisar'].map(x=>`<div class="dm-at">${x}<span>›</span></div>`).join('')}</div>`});
    st.push({r:'club-resumen', sel:'[data-act=mail-toggle]', t:'Informe del fin de semana', d:'Genera el PDF profesional y lo envía por correo a los gestores, con un botón.'}); }
  return st; }
function visibleEl(sel){ return [...document.querySelectorAll(sel)].find(e=>{ const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); return r.width>0 && r.height>0 && cs.visibility!=='hidden' && cs.display!=='none'; }); }
function spotShow(i){ ensureOnbCss(); const S_=spotSteps(); if(!S_.length) return onbAfterSpot(); i=Math.max(0,Math.min(i,S_.length-1)); ui.onb.i=i; onbSave();
  const s=S_[i]; let el=document.getElementById('spot');
  if(!el){ el=document.createElement('div'); el.id='spot'; el.innerHTML='<div class="sp-hole"></div><div class="sp-tip" role="dialog" aria-live="polite"></div>'; document.body.appendChild(el);
    el.addEventListener('click',e=>{ const b=e.target.closest('[data-sp]'); if(!b) return; const a=b.dataset.sp; if(a==='next') spotGo(1); else if(a==='prev') spotGo(-1); else if(a==='skip') onbAfterSpot(); });
    ui.spotRe=()=>{ clearTimeout(ui.spotT); ui.spotT=setTimeout(()=>spotPlace(false),60); }; addEventListener('resize',ui.spotRe); addEventListener('scroll',ui.spotRe,{passive:true}); }
  const tip=el.querySelector('.sp-tip'); const n=S_.length;
  tip.innerHTML=`<div class="sp-head"><span>${i+1} de ${n}</span><button class="sp-skip" data-sp="skip">Saltar</button></div><div class="sp-bar"><i style="width:${Math.round((i+1)*100/n)}%"></i></div>
    <h3>${esc(s.t)}</h3><p>${esc(s.d)}</p>${s.ex? `<div class="sp-ex"><span class="tm-ej">Ejemplo</span>${s.ex}</div>` : ''}
    <div class="sp-nav"><button class="btn ghost sm" data-sp="prev" ${i?'':'disabled'}>Atrás</button><button class="btn brass" data-sp="next">${i===n-1? 'Continuar' : 'Siguiente'}</button></div>`;
  tip.classList.remove('in'); void tip.offsetWidth; tip.classList.add('in');
  if(route()!==s.r){ location.hash=s.r; setTimeout(()=>spotPlace(true),480); } else setTimeout(()=>spotPlace(true),60); }
function spotPlace(scroll){ const el=document.getElementById('spot'); if(!el||!ui.onb||ui.onb.stage!=='spot') return; const s=spotSteps()[ui.onb.i]; if(!s) return;
  const t=visibleEl(s.sel), hole=el.querySelector('.sp-hole'), tip=el.querySelector('.sp-tip');
  if(t && scroll){ const r0=t.getBoundingClientRect(); if(r0.top<70 || r0.bottom>innerHeight-90) { t.scrollIntoView({block:'center'}); return setTimeout(()=>spotPlace(false),120); } }
  const W=innerWidth, H=innerHeight, mob=W<700;
  if(!t){ hole.style.cssText='left:50%;top:40%;width:0;height:0;'; tip.style.cssText= mob? 'left:12px;right:12px;bottom:16px;' : `left:${Math.round(W/2-190)}px;top:${Math.round(H/2-120)}px;width:380px`; return; }
  let r=t.getBoundingClientRect(); const pad=6, th=tip.offsetHeight||240; let side=null;
  if(r.height+th+pad*2+44 <= H){            // cabe con la tarjeta: arriba o abajo, desplazando si hace falta
    if(H-r.bottom-pad-14 >= th) side='below'; else if(r.top-pad-14 >= th) side='above';
    else if(scroll){ scrollBy(0, r.top-pad-16); return setTimeout(()=>spotPlace(false),140); }
    else { side='below'; const tipTop=H-th-10; if(r.bottom+pad+12>tipTop){ r={left:r.left, top:r.top, width:r.width, height:Math.max(60, tipTop-12-pad-r.top)}; r.bottom=r.top+r.height; } }
  } else {                                   // más alto que la pantalla: su parte superior, y la tarjeta debajo
    if(scroll && Math.abs(r.top-64)>8){ scrollBy(0, r.top-64); return setTimeout(()=>spotPlace(false),140); }
    r={left:r.left, top:r.top, width:r.width, height:Math.max(80, H-th-48-r.top-pad)}; r.bottom=r.top+r.height; side='below'; }
  hole.style.cssText=`left:${r.left-pad}px;top:${r.top-pad}px;width:${r.width+pad*2}px;height:${r.height+pad*2}px;border-radius:${Math.min(22,Math.max(10,r.height/2))}px`;
  const top = side==='below'? Math.min(H-th-10, r.bottom+pad+12) : Math.max(10, r.top-pad-12-th);
  if(mob) tip.style.cssText=`left:12px;right:12px;top:${top}px`;
  else { const w=360, left=Math.max(12,Math.min(W-w-12, r.left+r.width/2-w/2)); tip.style.cssText=`left:${left}px;top:${top}px;width:${w}px`; } }
function spotGo(d){ const n=spotSteps().length, i=ui.onb.i+d; if(i<0) return; if(i>=n) return onbAfterSpot(); spotShow(i); }
function spotEnd(){ const el=document.getElementById('spot'); if(el){ el.classList.add('out'); setTimeout(()=>el.remove(),250); } if(ui.spotRe){ removeEventListener('resize',ui.spotRe); removeEventListener('scroll',ui.spotRe); ui.spotRe=null; } }
function onbAfterSpot(){ spotEnd(); scrollTo(0,0); if(me){ ui.onb.stage='perfil'; ui.onb.step=0; } else ui.onb.stage='apps'; location.hash= me? 'inicio' : 'club'; setTimeout(drawOnb,120); }
// ---- instalar la app y activar avisos
function appsStage(){ const inst=isStandalone(), push=pushState;
  const instBox = inst? `<div class="ob-app ok"><i>${svgi('check',20,2.4)}</i><div><b>App instalada</b><span>Ya la tienes en la pantalla de inicio.</span></div></div>`
    : installEvt? `<div class="ob-app"><i>📲</i><div><b>Instala la app</b><span>Acceso directo, pantalla completa y más rápida.</span></div><button class="btn brass sm" data-act="install">Instalar</button></div>`
    : isIOS()||window.lcInApp?.()? `<div class="ob-app"><i>📲</i><div><b>${window.lcInApp?.()? 'Ábrela en el navegador' : 'Instálala en el iPhone'}</b><span>Dos toques en Safari: te guiamos.</span></div><button class="btn brass sm" data-act="inst-how">Cómo</button></div>`
    : `<div class="ob-app"><i>📲</i><div><b>Instala la app</b><span>En el menú del navegador, elige <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.</span></div><button class="btn ghost sm" data-act="inst-how">Cómo</button></div>`;
  const pushBox = !pushReady()? (isAdmin? `<div class="ob-app"><i>🔔</i><div><b>Notificaciones sin configurar</b><span>Solo lo ves tú (administrador): falta la clave vapidKey en config.js. Mientras tanto, el resto del equipo no verá esta opción.</span></div></div>` : '')
    : push==='on'? `<div class="ob-app ok"><i>${svgi('check',20,2.4)}</i><div><b>Notificaciones activadas</b><span>Te avisaremos de disponibilidad, convocatoria, encuesta y MVP.</span></div></div>`
    : push==='denied'? `<div class="ob-app"><i>🔕</i><div><b>Notificaciones bloqueadas</b><span>Actívalas en los ajustes del navegador para esta web.</span></div><button class="btn ghost sm" data-act="push-on">Reintentar</button></div>`
    : `<div class="ob-app"><i>🔔</i><div><b>Activa las notificaciones</b><span>Disponibilidad, convocatoria, encuesta y MVP, directas al móvil.${isIOS()&&!inst? ' En iPhone, primero instala la app.' : ''}</span></div><button class="btn brass sm" data-act="push-on">Activar</button></div>`;
  return `<div class="ob-card"><div class="ob-txt" style="padding-top:22px"><span class="ob-n">Casi listo</span><h2>Llévala en el móvil</h2><p>Instálala y activa los avisos para no perderte ninguna convocatoria.</p></div><div class="ob-form" style="gap:10px">${instBox}${pushBox}</div>
    <div class="ob-nav"><button class="btn ghost" data-onb="appslater">Más tarde</button><span></span><button class="btn brass" data-onb="appsnext">Siguiente</button></div></div>`; }
// ---- recordatorio en Inicio si quedó pendiente (se puede cerrar)
const pushReady = () => !!CFG.vapidKey;
function appsNudge(){ if(!me || ui.onb) return ''; const needI=!isStandalone(), needP=pushState!=='on' && pushReady(); if(!needI && !needP) return '';
  try{ const d=+localStorage.getItem('polo-nudge')||0; if(Date.now()-d<5*864e5) return ''; }catch(e){}
  return `<section class="sec"><div class="nudge"><i>${needI? '📲' : '🔔'}</i><div><b>${needI&&needP? 'Instala la app y activa los avisos' : needI? 'Instala la app' : 'Activa las notificaciones'}</b><span>Para enterarte al momento de la convocatoria y la disponibilidad.</span></div><div class="row">${needI&&installEvt? '<button class="btn brass sm" data-act="install">Instalar</button>' : ''}${needP? '<button class="btn brass sm" data-act="push-on">Activar avisos</button>' : ''}${needI&&!installEvt? '<a class="btn ghost sm" href="#yo">Cómo instalar</a>' : ''}<button class="btn ghost sm" data-act="nudge-off" aria-label="Cerrar">✕</button></div></div></section>`; }
const SPOT_CSS=`
#spot{position:fixed;inset:0;z-index:240;pointer-events:auto}
#spot.out{opacity:0;transition:opacity .25s}
.sp-hole{position:fixed;border-radius:16px;box-shadow:0 0 0 2px #E2C47C,0 0 0 9999px rgba(5,20,15,.74);transition:all .45s cubic-bezier(.2,.8,.2,1);pointer-events:none;animation:sppulse 2.2s ease-out infinite}
@keyframes sppulse{0%{box-shadow:0 0 0 2px #E2C47C,0 0 0 2px rgba(226,196,124,.5),0 0 0 9999px rgba(5,20,15,.74)}100%{box-shadow:0 0 0 2px #E2C47C,0 0 0 14px rgba(226,196,124,0),0 0 0 9999px rgba(5,20,15,.74)}}
.sp-tip{position:fixed;z-index:2;padding:16px 16px 14px;border-radius:22px;background:var(--surface,#fff);color:var(--ink,#13261F);box-shadow:0 26px 60px -24px rgba(0,0,0,.75);transition:top .4s cubic-bezier(.2,.8,.2,1),left .4s cubic-bezier(.2,.8,.2,1)}
.sp-tip.in{animation:spin .35s cubic-bezier(.2,.8,.2,1)}@keyframes spin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.sp-head{display:flex;justify-content:space-between;align-items:center}.sp-head span{font-size:.7rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#94722A}
.sp-skip{border:0;background:none;color:var(--muted,#5b6b63);font-weight:700;font-size:.82rem;cursor:pointer}
.sp-bar{height:3px;border-radius:3px;background:var(--surface2,#eef0eb);margin:8px 0 10px;overflow:hidden}.sp-bar i{display:block;height:100%;background:linear-gradient(90deg,#94722A,#E2C47C);transition:width .4s}
.sp-tip h3{margin:0 0 4px;font-stretch:72%;font-weight:750;font-size:1.35rem;line-height:1.1}
.sp-tip p{margin:0;color:var(--muted,#5b6b63);font-size:.92rem;line-height:1.4}
.sp-ex{position:relative;margin-top:10px;padding:12px;border-radius:14px;background:var(--bg,#f4f5f1)}
.sp-ex .tm-ej{top:6px;right:6px}
.sp-nav{display:flex;justify-content:space-between;align-items:center;margin-top:12px}
.ob-app{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;padding:14px;border-radius:18px;background:var(--bg,#f4f5f1);border:1px solid var(--line,#e3e6df)}
.ob-app>i{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:var(--surface,#fff);font-style:normal;font-size:1.3rem}
.ob-app b{display:block;font-size:1rem}.ob-app span{display:block;font-size:.82rem;color:var(--muted,#5b6b63);line-height:1.35;margin-top:2px}.ob-app span b{display:inline;font-size:inherit;color:var(--ink,#13261F)}
.ob-app.ok{background:#EAF6EF;border-color:#bfe3cf}.ob-app.ok>i{background:#1F7A4D;color:#fff}
@media (max-width:420px){.ob-app{grid-template-columns:40px 1fr}.ob-app .btn{grid-column:1 / -1;justify-content:center}}
.nudge{display:grid;grid-template-columns:42px 1fr auto;gap:12px;align-items:center;padding:12px 14px;border-radius:18px;background:linear-gradient(135deg,#FBF6E8,#F3EAD3);border:1px solid #E8D9AE}
.nudge>i{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:#fff;font-style:normal;font-size:1.2rem}
.nudge b{display:block;font-size:.95rem}.nudge span{display:block;font-size:.8rem;color:#6b5a2e}
.nudge .row{gap:6px;flex-wrap:nowrap}
@media (max-width:560px){.nudge{grid-template-columns:42px 1fr}.nudge .row{grid-column:1 / -1;flex-wrap:wrap}}
@media (prefers-reduced-motion: reduce){.sp-hole{animation:none;transition:none}.sp-tip,.sp-tip.in{animation:none;transition:none}}
`;

