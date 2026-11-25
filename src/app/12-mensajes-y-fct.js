/* ===================== MENSAJE AL EQUIPO + RECORDATORIOS AUTOMÁTICOS ===================== */
const MSG_AUD = {all:'Todos', pending:'Sin responder', convoked:'Convocados'};
function msgAudience(j){ const t=tie(j)||blankTie(), a=availFor(j);
  return { all:S.players.filter(p=>p.active!==false).map(p=>p.id), pending:a.none, convoked:[...new Set([...(t.convocados||[]),...(t.subs||[]),...(t.rubbers||[]).flatMap(r=>r.polo||[])])] }; }
function msgTemplates(j){ const f=poloFix(j), p=persp(f), riv=clubName(p.rival), fd=fdate(f,{weekday:'long',day:'numeric',month:'long'}), where=p.home?'en casa':'fuera', mv=!!(f.moved?.from&&f.moved.from!==f.date);
  return [
    {k:'avail', l:'Pedir disponibilidad', aud:'pending', title:'Falta tu disponibilidad', text:`Falta tu respuesta para la jornada ${j} contra ${riv} (${fd}). Responde en la app, es un toque.`},
    {k:'lineup', l:'Convocatoria', aud:'convoked', title:`Convocatoria, jornada ${j}`, text:`Convocatoria publicada para la jornada ${j} contra ${riv}. Mira tu partido en la app.`},
    {k:'date', l: mv? 'Cambio de fecha' : 'Fecha y hora', aud:'all', title: mv? 'Cambio de fecha' : `Jornada ${j}: ${fd}`, text: mv? `Cambio de fecha: la jornada ${j} contra ${riv} ahora es el ${fd} a las ${f.time} h (${where}). Antes era el ${shortD(f.moved.from)}.` : `Jornada ${j} contra ${riv}: ${fd} a las ${f.time} h (${where}).`},
    {k:'day', l:'Recordatorio del partido', aud:'convoked', title:`Jugamos contra ${riv}`, text:`Recordatorio: ${fd} a las ${f.time} h contra ${riv} (${where}). Llegad con tiempo para calentar.`},
    {k:'free', l:'Mensaje libre', aud:'all', title:`Jornada ${j}: mensaje del capitán`, text:''} ]; }
function msgOpen(j){ ensureMsgCss(); const T=msgTemplates(j), a=availFor(j); const first=(a.none.length && !deadlinePassed(j))? T[0] : T[4];
  ui.msg={j, tpl:first.k, aud:first.aud, title:first.title, text:first.text, busy:false}; drawMsg(); }
function msgClose(){ ui.msg=null; drawMsg(); }
function drawMsg(){ const M=ui.msg; let el=document.getElementById('msgm');
  if(!M){ if(el){ el.classList.add('out'); setTimeout(()=>el.remove(),220); } document.body.classList.remove('msg-on'); return; }
  if(!el){ el=document.createElement('div'); el.id='msgm'; document.body.appendChild(el); document.body.classList.add('msg-on'); el.addEventListener('click',msgClick);
    el.addEventListener('input',e=>{ if(e.target.id!=='mg-text'||!ui.msg) return; ui.msg.text=e.target.value; const c=el.querySelector('.mg-cnt'); if(c) c.textContent=e.target.value.length+'/220'; msgBtns(); }); }
  const T=msgTemplates(M.j), au=msgAudience(M.j), p=persp(poloFix(M.j)), log=((tie(M.j)||{}).msgLog||[]).slice(-3).reverse();
  el.innerHTML=`<div class="mg-back" data-mg="close"></div><div class="mg-sheet" role="dialog" aria-modal="true" aria-label="Mensaje al equipo">
    <div class="mg-h"><div><b>Mensaje al equipo</b><span>Jornada ${M.j}, ${esc(CLUB.teamShort)} contra ${esc(clubName(p.rival))}</span></div><button class="mg-x" data-mg="close" aria-label="Cerrar">✕</button></div>
    <div class="mg-chips">${T.map(t=>`<button data-mg="tpl" data-k="${t.k}" aria-pressed="${t.k===M.tpl}">${esc(t.l)}</button>`).join('')}</div>
    <div class="mg-aud"><span>Para</span>${Object.entries(MSG_AUD).map(([k,l])=>`<button data-mg="aud" data-k="${k}" aria-pressed="${k===M.aud}">${l}<em>${au[k].length}</em></button>`).join('')}</div>
    <label class="mg-f"><span>Mensaje <i class="mg-cnt">${M.text.length}/220</i></span><textarea id="mg-text" rows="4" maxlength="220" placeholder="Escribe el mensaje para el equipo">${esc(M.text)}</textarea></label>
    <div class="mg-btns"><button class="btn brass big" data-mg="push">${svgi('mega',17)} Enviar notificación a la app</button><button class="btn" data-mg="wa">Enviar por WhatsApp</button><button class="btn ghost" data-mg="copy">Copiar</button></div>
    <p class="mg-note"><b>Notificación:</b> llega al móvil de quien la tenga activada. <b>WhatsApp:</b> se abre con el mensaje listo para que elijas el grupo y pulses enviar; WhatsApp no permite que una app escriba sola en un grupo.</p>
    ${log.length? `<div class="mg-log"><span>Últimos mensajes</span>${log.map(m=>`<div><b>${esc(m.text.slice(0,80))}${m.text.length>80?'…':''}</b><small>${esc(MSG_AUD[m.aud]||'')}, ${m.ch==='push'? 'notificación'+(m.reached!=null? ' ('+m.reached+' de '+m.n+')' : '') : 'WhatsApp'}, ${relTime(m.at)}</small></div>`).join('')}</div>` : ''}</div>`;
  msgBtns(); }
function msgBtns(){ const M=ui.msg, el=document.getElementById('msgm'); if(!M||!el) return; const n=msgAudience(M.j)[M.aud].length, ok=M.text.trim().length>=3;
  const b=el.querySelector('[data-mg=push]'); if(b){ b.disabled=M.busy||!ok||!n; b.title= !n? 'No hay nadie en este grupo' : !ok? 'Escribe el mensaje' : ''; }
  ['wa','copy'].forEach(k=>{ const x=el.querySelector(`[data-mg=${k}]`); if(x) x.disabled=!ok; }); }
function msgLogAdd(ch,d){ const M=ui.msg, t=ensureTie(M.j);
  t.msgLog=[...(t.msgLog||[]).slice(-19),{at:Date.now(), by:(me&&player(me)?.name)||authUser?.email||'', aud:M.aud, ch, text:M.text.replace(/\s+/g,' ').trim().slice(0,220), n:msgAudience(M.j)[M.aud].length, ...(d&&d.reached!=null? {reached:d.reached} : {})}].slice(-30);
  saveState(ch==='push'? 'Mensaje enviado' : 'Mensaje preparado'); }
async function msgClick(e){ const M=ui.msg; if(!M) return; const b=e.target.closest('[data-mg]'); if(!b) return; const a=b.dataset.mg;
  if(a==='close') return msgClose();
  if(a==='tpl'){ const t=msgTemplates(M.j).find(x=>x.k===b.dataset.k); if(t){ Object.assign(M,{tpl:t.k,aud:t.aud,title:t.title,text:t.text}); drawMsg(); if(t.k==='free') document.getElementById('mg-text')?.focus(); } return; }
  if(a==='aud'){ M.aud=b.dataset.k; drawMsg(); return; }
  const text=M.text.trim(); if(text.length<3) return toast('Escribe el mensaje');
  if(a==='copy'){ try{ await navigator.clipboard.writeText(text+'\n'+location.origin+'/#jornada-'+M.j); toast('Copiado'); }catch(err){ toast('No se ha podido copiar'); } return; }
  if(a==='wa'){ waOpen(text+'\n\n'+location.origin+'/#jornada-'+M.j); msgLogAdd('wa'); msgClose(); return; }
  if(a==='push'){ if(B.mode!=='firebase') return toast('En la vista previa no se envían notificaciones; funcionan en la app publicada. Para probar, usa WhatsApp.');
    if(!msgAudience(M.j)[M.aud].length) return toast('No hay nadie en ese grupo');
    M.busy=true; msgBtns(); const d=await notify('custom',M.j,{aud:M.aud,title:M.title,text:text.replace(/\s+/g,' ')}); if(!ui.msg) return; M.busy=false;
    if(d){ msgLogAdd('push',d); msgClose(); } else msgBtns(); } }
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && ui.msg) msgClose(); });
function autoRemindPanel(bare){ ensureMsgCss(); const ar=S.rules.autoRemind||{}, on=!!ar.on, every=+ar.every||1, day=ar.dayBefore!==false;
  return `${bare?'':'<section class="sec"><div class="sec-h"><h2>Recordatorios automáticos</h2></div>'}<div class="panel ar${bare?' bare':''}">
    <div class="ar-top"><div><b>La app avisa sola al equipo</b><span class="muted small">Notificación al móvil, sin que el capitán tenga que acordarse.</span></div><label class="sw" aria-label="Activar recordatorios automáticos"><input type="checkbox" data-ar="on" ${on?'checked':''}><i></i></label></div>
    <div class="ar-opts ${on?'':'off'}"><label class="ar-r"><span>Disponibilidad pendiente</span><select data-ar="every" ${on?'':'disabled'}>${[1,2,3].map(n=>`<option value="${n}" ${every===n?'selected':''}>${n===1?'Cada día':'Cada '+n+' días'}</option>`).join('')}</select></label>
      <p class="muted small" style="margin:0 0 8px">Solo a quien no ha respondido, desde que se pide la disponibilidad hasta que se cierra o vence el plazo.</p>
      <label class="ar-c"><input type="checkbox" data-ar="day" ${day?'checked':''} ${on?'':'disabled'}> Recordar a los convocados el día antes del partido</label></div>
    <p class="muted small">Se envía una vez al día, a media tarde. Llega a quien tenga las notificaciones activadas; para el resto usa «Mensaje al equipo» por WhatsApp.</p>
    ${CFG.vapidKey? '' : '<p class="notice">Faltan por configurar las notificaciones (clave vapidKey en config.js y FIREBASE_SERVICE_ACCOUNT en Vercel). Mientras tanto, esta opción no enviará nada.</p>'}
    <div class="row"><button class="btn ghost sm" data-act="ar-now">Enviar ahora los recordatorios pendientes</button></div></div>${bare?'':'</section>'}`; }
const MSG_CSS=`
body.msg-on{overflow:hidden}
#msgm{position:fixed;inset:0;z-index:230;display:grid;align-items:end;justify-items:center}
#msgm.out{opacity:0;transition:opacity .22s}
.mg-back{position:absolute;inset:0;background:rgba(5,20,15,.6);backdrop-filter:blur(4px);animation:mgfade .2s ease}
.mg-sheet{position:relative;width:min(560px,100%);max-height:92dvh;overflow:auto;background:var(--surface,#fff);color:var(--ink,#13261F);border-radius:26px 26px 0 0;padding:18px 18px 22px;box-shadow:0 -24px 60px -30px rgba(0,0,0,.7);animation:mgup .3s cubic-bezier(.2,.8,.2,1)}
@keyframes mgup{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}@keyframes mgfade{from{opacity:0}to{opacity:1}}
@media (min-width:700px){#msgm{align-items:center}.mg-sheet{border-radius:26px}}
.mg-h{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.mg-h b{display:block;font-stretch:72%;font-weight:750;font-size:1.45rem;line-height:1.05}.mg-h span{font-size:.82rem;color:var(--muted,#5b6b63)}
.mg-x{border:0;background:var(--surface2,#eef0eb);width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:.9rem}
.mg-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}.mg-chips button,.mg-aud button{border:1.5px solid var(--line,#e3e6df);background:var(--bg,#f4f5f1);border-radius:999px;padding:8px 13px;font-weight:600;font-size:.85rem;min-height:38px;cursor:pointer;color:inherit}
.mg-chips button[aria-pressed="true"],.mg-aud button[aria-pressed="true"]{background:#13261F;border-color:#13261F;color:#fff;box-shadow:inset 0 0 0 2px #E2C47C}
.mg-aud{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:12px}.mg-aud>span{font-size:.78rem;font-weight:700;color:var(--muted,#5b6b63);margin-right:2px}
.mg-aud em{font-style:normal;font-size:.72rem;font-weight:800;margin-left:6px;opacity:.75}
.mg-f{display:grid;gap:6px;margin-bottom:12px}.mg-f>span{display:flex;justify-content:space-between;font-size:.8rem;font-weight:700}.mg-f i{font-style:normal;font-weight:600;color:var(--muted,#5b6b63)}.mg-f textarea{font-size:1rem;width:100%}
.mg-btns{display:grid;gap:8px;grid-template-columns:1fr 1fr}.mg-btns .big{grid-column:1 / -1;justify-content:center;gap:8px}.mg-btns .btn{justify-content:center}.mg-btns button:disabled{opacity:.45;cursor:not-allowed}
.mg-note{font-size:.78rem;color:var(--muted,#5b6b63);line-height:1.45;margin:12px 0 0}
.mg-log{margin-top:14px;border-top:1px solid var(--line,#e3e6df);padding-top:10px;display:grid;gap:8px}.mg-log>span{font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94722A}.mg-log b{display:block;font-size:.88rem;font-weight:600}.mg-log small{color:var(--muted,#5b6b63);font-size:.76rem}
.ar-top{display:flex;justify-content:space-between;gap:14px;align-items:center}.ar-top b{display:block}
.sw{position:relative;flex:none;width:52px;height:30px}.sw input{position:absolute;inset:0;opacity:0;width:100%;height:100%;margin:0;cursor:pointer;z-index:2}.sw i{position:absolute;inset:0;border-radius:999px;background:#cfd6d1;transition:background .2s}.sw i::after{content:"";position:absolute;left:3px;top:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .2s}.sw input:checked+i{background:#1F7A4D}.sw input:checked+i::after{transform:translateX(22px)}
.ar-opts{margin:14px 0 6px;padding-top:12px;border-top:1px solid var(--line,#e3e6df)}.ar-opts.off{opacity:.5}.ar-r{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;font-weight:600}.ar-r select{max-width:180px}.ar-c{display:flex;gap:8px;align-items:center;font-weight:600;font-size:.92rem}
@media (prefers-reduced-motion: reduce){.mg-sheet,.mg-back{animation:none}}
`;
function ensureMsgCss(){ if(document.getElementById('msg-css')) return; const s=document.createElement('style'); s.id='msg-css'; s.textContent=MSG_CSS; document.head.appendChild(s); }

/* ===================== CENTRO FCT (Gestión deportiva → Equipos) ===================== */
function fctTeamInfo(t){ const sid=docIdFor(t.id,viewSeason), d=clubData[t.id]||(('seasons/'+sid)===SEASON_PATH? S : null), grp= d? +((d.comp||{}).fctGroup||FCT_GROUPS[sid]||0) : +(FCT_GROUPS[sid]||0), today=ymd(new Date());
  const fx=(d&&d.fixtures)||[], polo=fx.filter(f=>f.home===POLO||f.away===POLO), L=d&&d.fctLast;
  const k={ imp:fx.filter(f=>f.src==='fct').length, off:fx.filter(f=>isPlayed(f)&&f.status==='official').length, prov:fx.filter(f=>isPlayed(f)&&f.status!=='official').length,
    rev:polo.filter(f=>f.fctScore||(f.fctDate&&f.fctDate!==f.date)||(f.fctTime&&f.fctTime!==f.time)).length, pend:polo.filter(f=>f.date<today&&!isPlayed(f)).length };
  const st= !d? ['nodata','Sin temporada'] : !grp? ['nogroup','Falta el grupo'] : k.rev? ['rev','Revisar'] : !L? ['new','Sin sincronizar'] : ['ok','Al día'];
  return {t,d,sid,grp,L,k,st}; }
function fctCenter(){ ensureMsgCss(); ensureFctCss(); const rows=clubTeams().map(fctTeamInfo), busy=ui.fctBusy||{};
  return `<section class="sec"><div class="sec-h"><h2>Por equipo</h2></div>
    <div class="fctc">${rows.map(r=>`<div class="fctc-row st-${r.st[0]}">
      <div class="fc-t"><b>${esc(r.t.name)}</b><span>${r.grp? 'Grupo '+r.grp : 'Sin grupo FCT'}${r.L? ', última consulta '+relTime(r.L.at) : ''}</span></div>
      <div class="fc-k">${[['imp','importados'],['off','oficiales'],['prov','provisionales'],['rev','por revisar'],['pend','sin resultado']].map(([x,l])=>`<span class="${(x==='rev'||x==='pend')&&r.k[x]?'w':''}"><b>${r.k[x]}</b>${l}</span>`).join('')}</div>
      <div class="fc-a"><span class="fc-st">${r.st[1]}</span>
        ${ui.fctEdit===r.t.id? `<input type="number" inputmode="numeric" id="fct-g-${r.t.id}" value="${r.grp||''}" placeholder="Código" style="width:96px"><button class="btn sm" data-act="fct-gsave" data-tid="${r.t.id}">Guardar</button>`
          : `<button class="btn ghost sm" data-act="fct-gedit" data-tid="${r.t.id}">${r.grp?'Cambiar grupo':'Poner grupo'}</button>`}
        <button class="btn sm ${r.st[0]==='ok'?'ghost':'brass'}" data-act="fct-one" data-tid="${r.t.id}" ${busy[r.t.id]||!r.grp?'disabled':''}>${busy[r.t.id]? 'Consultando…' : r.d? 'Sincronizar' : 'Crear y sincronizar'}</button></div>
      ${r.L?.actas?.unmatched?.length? `<p class="fc-note">En las actas de la FCT aparecen jugadores que no se reconocen en la plantilla: <b>${esc(r.L.actas.unmatched.join(', '))}</b>. Añádelos en Gestión → Plantilla (o corrige su nombre completo) y vuelve a sincronizar: sus partidos se completarán solos.</p>` : ''}
      ${r.d&&r.k.rev? `<p class="fc-note">La FCT tiene datos distintos en ${r.k.rev} ${r.k.rev===1?'partido':'partidos'} del equipo: revísalos en Resultados o en Preparar. La app no los cambia sola.</p>` : ''}</div>`).join('')}</div>
    <p class="muted small" style="margin:10px 0 0">Del portal de la Federació se importan calendario, fechas y resultados de toda la liga (oficiales si el acta está cerrada), cada noche y con estos botones. Las plantillas y el orden de juego no están disponibles en el portal: se cargan con documentos en Documentación o desde la app.</p></section>`; }
// Estado global de la sincronización con la Federació (todos los equipos)
function fctOverview(){ const rows=clubTeams().map(fctTeamInfo), on=rows.filter(r=>r.grp);
  const last=on.map(r=>r.L?.at||0), oldest=on.length? Math.min(...last) : 0, newest=last.length? Math.max(...last) : 0;
  const rev=on.reduce((n,r)=>n+r.k.rev,0), un=on.reduce((n,r)=>n+(r.L?.actas?.unmatched?.length||0),0), err=on.filter(r=>r.d?.fctError && (!r.L || r.d.fctError.at>r.L.at)).length;
  const stale=on.some(r=>!r.L || Date.now()-r.L.at>36*3600e3);
  const st= err? 'err' : (rev||un)? 'rev' : !on.length? 'nogroup' : stale? 'stale' : 'ok';
  return {rows, on, oldest, newest, rev, un, err, st, imp:on.reduce((n,r)=>n+r.k.imp,0), off:on.reduce((n,r)=>n+r.k.off,0)}; }
const FCT_ICON='<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4"/></svg>';
function fctHero(detail=true){ ensureFctCss(); const O=fctOverview(), busy=Object.keys(ui.fctBusy||{}).length;
  const title= O.st==='err'? 'La sincronización ha fallado' : O.st==='rev'? `${O.rev+O.un} ${O.rev+O.un===1?'dato por revisar':'datos por revisar'}` : O.st==='nogroup'? 'Conecta los equipos con la FCT' : O.st==='stale'? 'Pendiente de sincronizar' : 'Todo sincronizado con la FCT';
  const sub= O.st==='nogroup'? 'Pon el código de grupo de cada equipo y la app traerá sola calendario, resultados, actas y plantillas.'
    : `${O.newest? 'Última sincronización '+relTime(O.newest) : 'Aún sin sincronizar'}. Se actualiza sola cada noche: ${O.imp} ${O.imp===1?'partido':'partidos'} de la liga ${O.imp===1?'importado':'importados'}, ${O.off} ${O.off===1?'oficial':'oficiales'}.`;
  return `<section class="sec"><div class="fcth st-${O.st}">
    <div class="fcth-ic${busy?' spinning':''}">${FCT_ICON}</div>
    <div class="fcth-t"><p class="fcth-k">Federació Catalana de Tennis</p><h2>${title}</h2><p>${esc(sub)}</p>
      <div class="fcth-teams">${O.rows.map(r=>`<span class="fcth-chip st-${r.st[0]}"><i></i>${esc(r.t.short||r.t.name)}<small>${esc(r.st[1])}</small></span>`).join('')}</div></div>
    <div class="fcth-a"><button class="btn brass" data-act="fct-all" ${busy||!O.on.length?'disabled':''}>${busy? 'Sincronizando…' : 'Sincronizar ahora'}</button>${detail? '<a class="btn ghost" href="#club-fct">Ver detalle</a>' : ''}</div></div></section>`; }
function vClubFct(){
  if(!canClub()) return vClub(); ensureClubSubs();
  const m=meta||{}, al=(m.fctAlerts||{}).on!==false;
  return `<div class="wrap club"><div class="pagehead"><p class="qsec">Gestión deportiva</p><h1>Federació (FCT)</h1><p class="lede">La app se mantiene al día con el portal de la Federació Catalana de Tennis: cada noche y cuando pulsas «Sincronizar».</p></div>
  ${fctNewPanel()}${fctHero(false)}${fctCenter()}
  <section class="sec"><div class="sec-h"><h2>Qué se sincroniza</h2></div><ul class="fcth-what">
    <li><b>Calendario</b><span>Fechas, horas y aplazamientos de toda la liga. Lo que alguien cambia a mano en la app no se toca; la diferencia queda como aviso.</span></li>
    <li><b>Resultados</b><span>De todos los equipos del grupo. Pasan a oficiales cuando la FCT cierra el acta.</span></li>
    <li><b>Actas y plantillas</b><span>Quién jugó cada partido del ${US}, marcadores, licencias y puntos.</span></li>
    <li><b>El ${US} manda</b><span>Si un resultado del ${US} ya está en la app, no se sobrescribe: si la FCT dice otra cosa, aparece aquí y en «Requiere atención».</span></li></ul></section>
  <section class="sec"><div class="sec-h"><h2>Avisos por correo</h2></div><div class="panel">
    <label class="chkline"><input type="checkbox" data-act="fct-alerts" ${al?'checked':''}> <span>Enviar un correo a los gestores cuando la sincronización de la noche encuentre datos que no cuadran o falle</span></label>
    <p class="muted small" style="margin:6px 0 0">${(m.managerEmails||[]).length? 'Se envía a: '+esc(m.managerEmails.join(', ')) : 'Aún no hay gestores con correo: añádelos en Configuración.'}</p></div></section></div>`; }
async function fctSyncTeam(tid,created){ const t=clubTeams().find(x=>x.id===tid); if(!t) return null; const info=fctTeamInfo(t);
  if(!info.grp){ toast('Pon primero el código del grupo FCT'); return null; }
  if(!info.d && !created){ await B.set('seasons/'+info.sid,{comp:{name:t.name, fctGroup:info.grp}, teams:[{id:POLO,name:CLUB.short,short:CLUB.teamShort}], fixtures:[], players:[], captains:[], ties:{}, memberIds:[]}).catch(()=>{}); }
  (ui.fctBusy ||= {})[tid]=1; renderQuiet();
  try{ const tok=await B.idToken(); const r=await fetch('/api/fct-sync',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({season:info.sid})});
    if(r.status===501||r.status===404){ toast('Falta configurar la sincronización en Vercel (FIREBASE_SERVICE_ACCOUNT)'); return null; }
    const d=await r.json().catch(()=>({})); if(!r.ok){ toast(`${t.short||t.name}: no se ha podido sincronizar (${d.error||r.status})`); return null; }
    return (d.results||[]).find(x=>x.season===info.sid)||(d.results||[])[0]||{};
  }catch(e){ toast(`${t.short||t.name}: sin conexión con el servidor`); return null; }
  finally{ delete ui.fctBusy[tid]; renderQuiet(); } }
const fctSummary=(t,x)=> !x? '' : x.skipped==='grupo-vacio'? `${t.short||t.name}: la FCT no devuelve partidos para ese grupo; revisa el código` : x.skipped? `${t.short||t.name}: ${x.skipped}` : `${t.short||t.name}: ${x.results||0} resultados, ${x.dates||0} fechas${x.created? ', '+x.created+' partidos nuevos' : ''}${x.roster?.added? ', '+x.roster.added+' jugadores importados' : ''}${x.actas?.loaded?.length? ', actas de las jornadas '+x.actas.loaded.join(', ') : ''}${x.actas?.unmatched?.length? '. '+x.actas.unmatched.length+' jugadores de las actas no están en la plantilla (ver Equipos)' : ''}${(x.diffs||[]).length+(x.dateDiffs||[]).length? ', '+((x.diffs||[]).length+(x.dateDiffs||[]).length)+' por revisar' : ''}`;
/* ---------- Alta de un equipo desde la FCT (Gestión deportiva → Federació) ----------
   Un solo paso: nombre, categoría, letra y código de grupo de la FCT. La app crea el equipo y su temporada y
   trae de la FCT el calendario de todo el grupo, los resultados de las jornadas ya jugadas, la plantilla
   oficial y las actas del club (quién jugó y con qué marcador): las estadísticas quedan hechas desde el primer momento. */
const FCT_CATS=['Absoluto','Júnior','Cadete','Infantil','+25','+30','+35','+40','+45','+50','+55','+60','+65','+70','+75','+80'];
// Código de grupo: el número o un enlace del portal de la FCT que lo contenga
function fctGroupFrom(v){ const t=String(v||'').trim(); if(/^\d{3,7}$/.test(t)) return +t; const m=/(?:grupo|codigo|group)[^0-9]{0,4}(\d{3,7})/i.exec(t)||/(\d{4,7})(?!.*\d{4,7})/.exec(t); return m? +m[1] : 0; }
function fctNewPanel(){ ensureFctCss(); const N=ui.fctNew, f=ui.fctNewForm||{};
  if(N) return `<section class="sec"><div class="fnew">${fctNewProgress(N)}</div></section>`;
  if(ui.fctBulk) return `<section class="sec">${fctBulkView()}</section>`;
  if(ui.fctFind) return `<section class="sec">${fctFindView()}</section>`;
  if(!ui.fctNewOpen) return `<section class="sec"><div class="fnew fnew-c"><div><h2>Dar de alta equipos</h2><p class="muted small">La app busca los equipos del club en la Lliga Catalana de la FCT y trae su calendario, resultados, plantilla y actas.</p></div><div class="row"><button class="btn brass" data-act="fct-find">Buscar los equipos del club</button><button class="btn ghost" data-act="fct-new-open">Con el código de grupo</button></div></div></section>`;
  const g=f.gender||'Masculino', L=f.letter??'A';
  return `<section class="sec"><div class="fnew"><div class="sec-h"><h2>Dar de alta un equipo</h2><button class="btn ghost sm" data-act="fct-new-close">Cancelar</button></div>
    <p class="muted small" style="margin:0 0 14px">El código de grupo está en el portal de la Federació (Lliga Catalana → categoría → grupo). También puedes pegar el enlace del grupo.</p>
    <div class="fnew-grid">
      <label>Categoría<select id="fn-cat">${FCT_CATS.map(c=>`<option ${(f.cat||'Absoluto')===c?'selected':''}>${c}</option>`).join('')}</select></label>
      <label>Género<select id="fn-gender">${['Masculino','Femenino','Mixto'].map(x=>`<option ${g===x?'selected':''}>${x}</option>`).join('')}</select></label>
      <label>Letra del equipo<select id="fn-letter">${['A','B','C','D','E',''].map(x=>`<option value="${x}" ${L===x?'selected':''}>${x||'Sin letra'}</option>`).join('')}</select></label>
      <label class="fn-wide">Código de grupo FCT<input type="text" inputmode="numeric" id="fn-group" value="${esc(f.group||'')}" placeholder="Por ejemplo, 4583" autocomplete="off"></label>
      <label class="fn-wide"><span>Nombre del equipo <span class="muted small" style="font-weight:500">(opcional)</span></span><input type="text" id="fn-name" value="${esc(f.name||'')}" placeholder="Se completa solo: ${esc(fctNewName({cat:f.cat||'Absoluto',gender:g,letter:L}).name)}"></label>
    </div>
    <div class="row" style="margin-top:14px"><button class="btn brass" data-act="fct-new-go">Dar de alta y sincronizar con la FCT</button></div></div></section>`; }
// «+50», «Masculino», «A» → «Veteranos +50 Masculino A» / «+50 A»
function fctNewName({cat,gender,letter}){ const vet=/^\+\d/.test(cat), name=[vet?'Veteranos '+cat:cat, gender, letter].filter(Boolean).join(' ');
  const short=[vet? cat : cat==='Absoluto'? (gender==='Femenino'?'Femenino':CLUB.teamShort) : cat, gender==='Femenino'&&cat!=='Absoluto'?'Fem.':'', letter].filter(Boolean).join(' ');
  return {name, short}; }
function fctNewProgress(N){ const t=clubTeams().find(x=>x.id===N.tid)||{name:N.name}, d=clubData[N.tid], x=N.res||{};
  const step=(ok,txt,sub='')=>`<li class="${ok===true?'ok':ok===false?'ko':'run'}"><i></i><span><b>${txt}</b>${sub? `<small>${sub}</small>` : ''}</span></li>`;
  let body='';
  if(N.state==='done' && d){ const fx=d.fixtures||[], mine=fx.filter(f=>f.home===POLO||f.away===POLO), played=mine.filter(isPlayed).sort((a,b)=>a.j-b.j), js=fx.map(f=>+f.j), lastJ=js.length? Math.max(...js) : 0;
    const acts=Object.keys(d.ties||{}).filter(k=>(d.ties[k].rubbers||[]).some(r=>(r.polo||[]).length)).length, players=(d.players||[]).filter(p=>p.active!==false).length;
    const st=withS(d,()=>standings()), me_=st.find(r=>r.id===POLO)||{}, ts=withS(d,()=>teamStats()), nx=mine.filter(f=>!isPlayed(f)).sort((a,b)=>String(a.date).localeCompare(b.date))[0];
    body=`<div class="fnew-kpis"><div><b>${lastJ}</b><span>jornadas en el calendario</span></div><div><b>${played.length}</b><span>${played.length===1?'jornada jugada':'jornadas jugadas'}</span></div><div><b>${players}</b><span>jugadores en la plantilla</span></div><div><b>${me_.pj? me_.pos+'º' : '–'}</b><span>${me_.pts||0} puntos en la clasificación</span></div></div>
      ${played.length? `<ul class="fnew-j">${played.map(f=>{ const p=persp(f), w=p.ps>p.rs; return `<li><span class="fj">J${f.j}</span><span>${esc(withS(d,()=>clubName(p.rival)))}</span><b class="${w?'w':'l'}">${p.ps}-${p.rs}</b><small>${f.status==='official'?'oficial':'provisional'}${d.ties?.['j'+f.j]?.rubbers?.some(r=>(r.polo||[]).length)? ', con acta' : ''}</small></li>`; }).join('')}</ul>` : '<p class="muted small">Aún no se ha jugado ninguna jornada.</p>'}
      <p class="small" style="margin:12px 0 0">Partidos ${ts.rw}-${ts.rl}${acts? `, ${acts} ${acts===1?'acta cargada':'actas cargadas'} con quién jugó cada partido` : ''}.${nx? ` Próxima jornada: J${nx.j} contra ${esc(withS(d,()=>clubName(persp(nx).rival)))}, ${esc(fdate(nx,{weekday:'long',day:'numeric',month:'long'}))}.` : ''}</p>
      ${x.actas?.unmatched?.length? `<p class="fc-note">Jugadores de las actas que no están en la plantilla: ${esc(x.actas.unmatched.join(', '))}.</p>` : ''}
      <div class="row" style="margin-top:14px"><button class="btn brass" data-act="team-open" data-t="${esc(N.tid)}">Abrir la app del equipo</button><a class="btn ghost" href="#club-equipo-${esc(N.tid)}">Ver la ficha del equipo</a><button class="btn ghost" data-act="fct-new-close">Dar de alta otro</button></div>`; }
  else if(N.state==='error') body=`<p class="fc-note">${esc(N.msg||'No se ha podido sincronizar')}</p><div class="row" style="margin-top:10px"><button class="btn brass" data-act="fct-one" data-tid="${esc(N.tid)}">Volver a intentarlo</button><button class="btn ghost" data-act="fct-new-close">Cerrar</button></div>`;
  return `<div class="sec-h"><h2>${esc(t.name)}</h2></div><ol class="fnew-steps">
    ${step(true,'Equipo creado', esc(teamCat(t))+(N.group? ', grupo FCT '+N.group : ''))}
    ${step(N.state==='sync'? null : N.state==='error'? false : true, N.state==='sync'? 'Consultando la Federació…' : 'Datos de la Federació', N.state==='sync'? 'Calendario, resultados, plantilla y actas' : x.season? fctSummary(t,x).replace(/^[^:]+:\s*/,'') : '')}
    ${step(N.state==='done'&&d? true : N.state==='error'? false : null, N.state==='done'? 'Estadísticas al día' : 'Estadísticas y clasificación')}</ol>${body}`; }
// Crea un equipo con su temporada y lo sincroniza con la FCT. Devuelve {tid, name, state:'done'|'error', res, msg}
async function fctCreateTeam({cat,gender,letter,group,team,division,name}){
  const auto=fctNewName({cat,gender,letter}); name=(name||'').trim()||auto.name; const short=auto.short||name;
  const taken=clubTeams().find(t=>normTxt(t.name)===normTxt(name)||normTxt(t.short)===normTxt(short));
  if(taken) return {name, state:'error', msg:`Ya hay un equipo «${taken.short||taken.name}» en el club`};
  let id=slug(short)||'equipo'; while(clubTeams().some(t=>t.id===id) || id===POLO) id+='-2';
  try{
    await saveMeta({teams:[...clubTeams(),{id,name,short,cat,gender}], removedTeams:(meta?.removedTeams||[]).filter(x=>x!==id)});
    const sid=docIdFor(id,viewSeason); FCT_GROUPS[sid]=group;
    const seed=emptyTeamSeed(id); seed.comp={...seed.comp, name, group:teamCat({cat,gender})+(division? ', '+division : ''), fctGroup:group, letter, cat, ...(team? {fctTeam:team} : {}), ...(division? {division} : {})};
    await B.set('seasons/'+sid,{...seed, seasonId:viewSeason, teamId:id, memberIds:[]});
    clubKey=''; ensureClubSubs();
    if(B.mode!=='firebase') return {tid:id, name, group, state:'error', msg:'Equipo creado. La sincronización con la FCT funciona en la app publicada, no en esta vista previa.'};
    const x=await fctSyncTeam(id,true);
    if(!x || x.error || x.skipped) return {tid:id, name, group, state:'error', res:x, msg: !x? 'No se ha podido consultar la FCT. Vuelve a intentarlo.' : x.skipped==='grupo-vacio'? `La FCT no devuelve partidos para el grupo ${group}: revisa el código.` : x.error? 'La FCT ha respondido con un error: '+x.error : 'No se ha sincronizado: '+x.skipped};
    return {tid:id, name, group, state:'done', res:x};
  }catch(e){ return {tid:id, name, group, state:'error', msg:'No se ha podido crear el equipo: '+(e?.message||e)}; }
}
async function fctNewTeam(){
  const v=id=>document.getElementById(id)?.value??'', cat=v('fn-cat'), gender=v('fn-gender'), letter=v('fn-letter'), group=fctGroupFrom(v('fn-group'));
  ui.fctNewForm={cat,gender,letter,group:v('fn-group'),name:v('fn-name')};
  if(!(group>0)) return toast('Escribe el código del grupo de la FCT (un número)');
  const auto=fctNewName({cat,gender,letter}), name=v('fn-name').trim()||auto.name;
  ui.fctNew={tid:'', name, group, state:'sync'}; ui.fctNewOpen=false; renderQuiet();
  const r=await fctCreateTeam({cat,gender,letter,group,name});
  if(!r.tid){ ui.fctNew=null; ui.fctNewOpen=true; renderQuiet(); return toast(r.msg); }
  ui.fctNew={...r}; renderQuiet(); if(r.state==='done') try{ confetti(innerWidth/2,innerHeight/3,60); }catch(e){}
}
// Buscar en la FCT los equipos del club en la Lliga de esta temporada y elegir cuáles dar de alta
async function fctFind(){
  if(B.mode!=='firebase'){ ui.fctFind={state:'error', msg:'La búsqueda en la FCT funciona en la app publicada, no en esta vista previa.'}; return renderQuiet(); }
  ui.fctFind={state:'loading'}; ui.fctNew=null; ui.fctNewOpen=false; renderQuiet();
  try{ const tok=await B.idToken(); const r=await fetch('/api/fct-sync',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok,'X-Club':CLUB.id},body:JSON.stringify({action:'fct-discover',season:viewSeason})});
    const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.error||('error '+r.status));
    const teams=(d.teams||[]).map(t=>({...t, key:t.group+'-'+t.team, label:fctNewName(t).name}));
    ui.fctFind={state:'list', teams, sel:new Set(teams.filter(t=>!t.have).map(t=>t.key)), club:d.club};
  }catch(e){ ui.fctFind={state:'error', msg:'No se ha podido consultar la FCT: '+(e?.message||e)}; }
  renderQuiet(); }
async function fctBulkAdd(){ const F=ui.fctFind; if(!F?.teams) return; const pick=F.teams.filter(t=>F.sel.has(t.key)&&!t.have); if(!pick.length) return toast('Marca al menos un equipo');
  ui.fctBulk={items:pick.map(t=>({key:t.key, label:t.label, division:t.division, state:'wait'}))}; ui.fctFind=null; renderQuiet();
  for(const [i,t] of pick.entries()){ const it=ui.fctBulk.items[i]; it.state='sync'; renderQuiet();
    const r=await fctCreateTeam(t); Object.assign(it,r); renderQuiet(); }
  if(pick.length===1 && ui.fctBulk.items[0].tid){ ui.fctNew={...ui.fctBulk.items[0]}; ui.fctBulk=null; renderQuiet(); }
  if(ui.fctBulk?.items.some(x=>x.state==='done')||ui.fctNew?.state==='done') try{ confetti(innerWidth/2,innerHeight/3,70); }catch(e){} }
function fctFindView(){ const F=ui.fctFind;
  if(F.state==='loading') return `<div class="fnew"><div class="fnew-load"><i></i><div><b>Buscando los equipos del ${esc(CLUB.medium)} en la Federació…</b><small>Lliga Catalana ${esc(viewSeason)}, todas las categorías</small></div></div></div>`;
  if(F.state==='error') return `<div class="fnew"><p class="fc-note">${esc(F.msg)}</p><div class="row" style="margin-top:10px"><button class="btn brass" data-act="fct-find">Volver a intentarlo</button><button class="btn ghost" data-act="fct-new-open">Con el código de grupo</button><button class="btn ghost" data-act="fct-new-close">Cerrar</button></div></div>`;
  const avail=F.teams.filter(t=>!t.have), n=F.teams.filter(t=>F.sel.has(t.key)&&!t.have).length;
  return `<div class="fnew"><div class="sec-h"><h2>${F.teams.length} equipos del club en la FCT</h2><button class="btn ghost sm" data-act="fct-new-close">Cerrar</button></div>
    <p class="muted small" style="margin:0 0 12px">Marca los que quieras dar de alta. La app trae de cada uno su calendario, resultados, plantilla y actas.</p>
    ${avail.length>1? `<label class="fpick-all"><input type="checkbox" data-act="fct-pick-all" ${n===avail.length?'checked':''}> Marcar todos</label>` : ''}
    <ul class="fpick">${F.teams.map(t=>`<li class="${t.have?'have':''}"><label><input type="checkbox" data-act="fct-pick" data-k="${esc(t.key)}" ${t.have?'disabled':F.sel.has(t.key)?'checked':''}><span class="fp-n"><b>${esc(t.label)}</b><small>${esc(t.division||'')}${t.division?' · ':''}grupo ${t.group}</small></span>${t.have? `<span class="fp-tag">Ya en la app${t.have!==t.label? ': '+esc(t.have) : ''}</span>` : ''}</label></li>`).join('')}</ul>
    <div class="row" style="margin-top:14px"><button class="btn brass" data-act="fct-bulk" ${n?'':'disabled'}>${n? `Dar de alta ${n===1?'1 equipo':n+' equipos'}` : 'Marca algún equipo'}</button><button class="btn ghost" data-act="fct-new-open">Con el código de grupo</button></div></div>`; }
function fctBulkView(){ const B_=ui.fctBulk, done=B_.items.every(x=>x.state==='done'||x.state==='error');
  return `<div class="fnew"><div class="sec-h"><h2>${done? 'Equipos dados de alta' : 'Dando de alta los equipos…'}</h2>${done? '<button class="btn ghost sm" data-act="fct-new-close">Cerrar</button>' : ''}</div>
    <ol class="fnew-steps">${B_.items.map(x=>{ const t=clubTeams().find(c=>c.id===x.tid); return `<li class="${x.state==='done'?'ok':x.state==='error'?'ko':x.state==='sync'?'run':'wait'}"><i></i><span><b>${esc(x.label)}</b><small>${x.state==='wait'? 'En cola' : x.state==='sync'? 'Consultando la Federació…' : x.state==='error'? esc(x.msg||'Error') : esc(fctSummary(t||{short:x.label},x.res||{}).replace(/^[^:]+:\s*/,''))}</small></span>${x.state==='done'? `<button class="btn ghost sm" data-act="team-open" data-t="${esc(x.tid)}">Abrir</button>` : ''}</li>`; }).join('')}</ol></div>`; }
// Eliminar un equipo: su temporada con todo lo que contiene y su sitio en la lista del club (lo hace el servidor)
async function teamDelete(tid){ const t=clubTeams().find(x=>x.id===tid); if(!t||tid===MAIN_TEAM) return;
  const typed=prompt(`Se eliminará el equipo «${t.name}» con su calendario, plantilla, resultados, disponibilidad, encuestas y documentos de esta temporada. No se puede deshacer.\n\nPara confirmarlo, escribe: ${t.short}`);
  if(typed==null) return; if(normTxt(typed)!==normTxt(t.short)) return toast('No coincide: el equipo no se ha eliminado');
  ui.teamDel=tid; renderQuiet();
  try{
    if(B.mode==='firebase'){ const tok=await B.idToken(); const r=await fetch('/api/fct-sync',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({action:'team-delete',team:tid,season:viewSeason})});
      const d=await r.json().catch(()=>({})); if(!r.ok) return toast('No se ha eliminado: '+(d.error||r.status));
      meta={...(meta||{}), teams:(meta?.teams||[]).filter(x=>x.id!==tid), removedTeams:[...new Set([...(meta?.removedTeams||[]),tid])]}; }
    else { await B.del('seasons/'+docIdFor(tid,viewSeason)).catch(()=>{}); await saveMeta({teams:clubTeams().filter(x=>x.id!==tid), removedTeams:[...new Set([...(meta?.removedTeams||[]),tid])]}); }
    delete clubData[tid]; delete FCT_GROUPS[docIdFor(tid,viewSeason)]; if(ui.fctNew?.tid===tid) ui.fctNew=null; clubKey='';
    if(teamId===tid){ const first=clubTeams()[0]; if(first) switchTeam(first.id); }
    toast('Equipo eliminado: '+t.short);
  } catch(e){ toast('No se ha eliminado: sin conexión con el servidor'); }
  finally{ ui.teamDel=null; renderQuiet(); } }
const FCT_CSS=`
.fnew{padding:20px 22px;border-radius:20px;background:var(--surface,#fff);border:1px solid var(--line,#e3e6df)}
.fnew-c{display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}.fnew-c h2{margin:0 0 4px}.fnew-c p{margin:0}
.fnew-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.fnew-grid label{display:flex;flex-direction:column;gap:6px;font-weight:700;font-size:.86rem}.fnew-grid .fn-wide{grid-column:span 3}
.fnew-grid input,.fnew-grid select{width:100%;font-weight:500}
.fnew-steps{list-style:none;margin:0 0 14px;padding:0;display:grid;gap:10px}.fnew-steps li{display:flex;gap:12px;align-items:flex-start}.fnew-steps b{display:block}.fnew-steps small{display:block;color:var(--muted,#5b6b63);font-size:.84rem}
.fnew-steps i{flex:none;width:22px;height:22px;border-radius:50%;margin-top:1px;background:#d9ded8;position:relative}
.fnew-steps .ok i{background:#2E8B57}.fnew-steps .ok i::after{content:"";position:absolute;left:7px;top:3px;width:6px;height:11px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}
.fnew-steps .ko i{background:#C8553D}.fnew-steps .run i{border:3px solid #d9ded8;border-top-color:#94722A;background:transparent;animation:fnspin .8s linear infinite}
@keyframes fnspin{to{transform:rotate(360deg)}}
.fnew-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:4px 0 14px}.fnew-kpis div{padding:12px 14px;border-radius:14px;background:var(--bg2,#f3f4f0)}.fnew-kpis b{display:block;font-size:1.6rem;line-height:1.1}.fnew-kpis span{font-size:.8rem;color:var(--muted,#5b6b63)}
.fnew-j{list-style:none;margin:0;padding:0;display:grid;gap:6px}.fnew-j li{display:grid;grid-template-columns:44px 1fr auto 120px;gap:10px;align-items:center;padding:8px 12px;border-radius:12px;background:var(--bg2,#f3f4f0)}
.fnew-j .fj{font-weight:800;color:var(--muted,#5b6b63)}.fnew-j b.w{color:#2E8B57}.fnew-j b.l{color:#C8553D}.fnew-j small{color:var(--muted,#5b6b63);text-align:right}
.btn.danger{color:#B3412B;border-color:#E3B5A8}
.fnew-load{display:flex;gap:14px;align-items:center;padding:6px 0}.fnew-load i{flex:none;width:26px;height:26px;border-radius:50%;border:3px solid #d9ded8;border-top-color:#94722A;animation:fnspin .8s linear infinite}.fnew-load small{display:block;color:var(--muted,#5b6b63)}
.fpick{list-style:none;margin:0;padding:0;display:grid;gap:6px}.fpick label{display:grid;grid-template-columns:22px 1fr auto;gap:12px;align-items:center;padding:10px 14px;border-radius:12px;background:var(--bg2,#f3f4f0);cursor:pointer;transition:background .15s}
.fpick label:hover{background:#eceee7}.fpick input{width:18px;height:18px;accent-color:#94722A}.fpick small{display:block;color:var(--muted,#5b6b63);font-size:.8rem}.fpick .have label{opacity:.6;cursor:default}
.fp-tag{font-size:.75rem;font-weight:700;color:#2E8B57;background:#e3f1e8;border-radius:999px;padding:3px 10px;white-space:nowrap}
.fpick-all{display:flex;gap:10px;align-items:center;font-weight:700;font-size:.86rem;margin:0 0 8px 14px}.fpick-all input{width:18px;height:18px;accent-color:#94722A}
.fnew-steps .wait i{background:transparent;border:2px dashed #cfd5cd}.fnew-steps li .btn{margin-left:auto}
@media (max-width:720px){.fnew-grid{grid-template-columns:1fr 1fr}.fnew-grid .fn-wide{grid-column:span 2}.fnew-kpis{grid-template-columns:1fr 1fr}.fnew-j li{grid-template-columns:40px 1fr auto}.fnew-j small{display:none}}
.fctc{display:grid;gap:10px}
.fctc-row{display:grid;grid-template-columns:minmax(160px,1.2fr) 2fr auto;gap:12px 16px;align-items:center;padding:14px 16px;border-radius:18px;background:var(--surface,#fff);border:1px solid var(--line,#e3e6df);box-shadow:inset 4px 0 0 var(--line,#e3e6df)}
.fctc-row.st-ok{box-shadow:inset 4px 0 0 #1F7A4D}.fctc-row.st-rev{box-shadow:inset 4px 0 0 #94722A}.fctc-row.st-nogroup,.fctc-row.st-nodata,.fctc-row.st-new{box-shadow:inset 4px 0 0 #9aa6a0}
.fc-t b{display:block;font-size:1rem}.fc-t span{font-size:.8rem;color:var(--muted,#5b6b63)}
.fc-k{display:flex;flex-wrap:wrap;gap:6px}.fc-k span{display:inline-flex;align-items:baseline;gap:5px;padding:5px 10px;border-radius:999px;background:var(--bg,#f4f5f1);font-size:.76rem;color:var(--muted,#5b6b63)}.fc-k b{font-stretch:62%;font-weight:800;font-size:1.05rem;color:var(--ink,#13261F)}.fc-k .w{background:#F3EAD3}.fc-k .w b{color:#94722A}
.fc-a{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}.fc-st{font-size:.74rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#5b6b63);margin-right:4px}
.st-ok .fc-st{color:#1F7A4D}.st-rev .fc-st{color:#94722A}
.fc-note{grid-column:1 / -1;margin:0;font-size:.82rem;color:#6b5a2e;background:#FBF6E8;border-radius:10px;padding:8px 10px}
@media (max-width:820px){.fctc-row{grid-template-columns:1fr}.fc-a{justify-content:flex-start}}
.fcth{position:relative;overflow:hidden;display:grid;grid-template-columns:auto 1fr auto;gap:18px 22px;align-items:center;padding:22px 24px;border-radius:24px;color:#F1F4EF;background:radial-gradient(120% 140% at 0% 0%,#1E5A45 0%,#0F3B2E 55%,#0A2A20 100%);border:1px solid #2C5E4E;box-shadow:0 14px 34px -18px rgba(10,42,32,.75)}
.fcth::after{content:"";position:absolute;inset:auto -60px -80px auto;width:240px;height:240px;border-radius:50%;border:2px solid rgba(226,196,124,.18);pointer-events:none}
.fcth-ic{display:grid;place-items:center;width:58px;height:58px;border-radius:18px;background:rgba(226,196,124,.14);color:#E2C47C;box-shadow:inset 0 0 0 1px rgba(226,196,124,.35)}
.fcth-ic.spinning svg{animation:fcspin 1.1s linear infinite}@keyframes fcspin{to{transform:rotate(360deg)}}
.fcth-k{margin:0;font-size:.72rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#E2C47C}
.fcth h2{margin:2px 0 4px;font-size:1.45rem;line-height:1.15;color:#fff}.fcth-t>p{margin:0;font-size:.88rem;color:#C9D6CF;max-width:62ch}
.fcth.st-rev .fcth-ic,.fcth.st-err .fcth-ic{background:#E2C47C;color:#0A2A20}.fcth.st-err .fcth-ic{background:#E8A08F}
.fcth-teams{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.fcth-chip{display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;background:rgba(255,255,255,.08);font-size:.8rem;font-weight:700;color:#fff}.fcth-chip small{font-weight:500;color:#AFC2B8}
.fcth-chip i{width:8px;height:8px;border-radius:50%;background:#9aa6a0}.fcth-chip.st-ok i{background:#5FD39A}.fcth-chip.st-rev i{background:#E2C47C}
.fcth-a{display:flex;flex-direction:column;gap:8px;align-items:stretch;position:relative;z-index:1}.fcth-a .btn.ghost{color:#F1F4EF;border-color:rgba(241,244,239,.35);background:transparent;text-align:center}
.chkline{display:flex;gap:10px;align-items:flex-start;cursor:pointer}.chkline input{margin-top:3px;flex:none;width:18px;height:18px}
.fcth-what{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.fcth-what li{padding:14px 16px;border-radius:16px;background:var(--surface,#fff);border:1px solid var(--line,#e3e6df)}.fcth-what b{display:block;margin-bottom:4px}.fcth-what span{font-size:.86rem;color:var(--muted,#5b6b63)}
a.has-dot{position:relative}a.has-dot::after{content:"";position:absolute;top:3px;right:3px;width:8px;height:8px;border-radius:50%;background:#C8553D}
@media (max-width:820px){.fcth{grid-template-columns:auto 1fr;padding:18px}.fcth-a{grid-column:1 / -1;flex-direction:row}.fcth-a .btn{flex:1}}
`;
function ensureFctCss(){ if(document.getElementById('fct-css')) return; const s=document.createElement('style'); s.id='fct-css'; s.textContent=FCT_CSS; document.head.appendChild(s); }

