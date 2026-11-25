/* ===================== MATCHDAY MANAGEMENT ===================== */
function phases(j){
  const f=poloFix(j), t=tie(j)||blankTie(), a=availFor(j), tr=tieFromRubbers(j)||{}, p=persp(f), pub=S.published[jid(j)]||{}, closed=deadlinePassed(j)||isPlayed(f);
  const resDone = !!(tr.complete) || (isPlayed(f) && f.status==='official' && !tr.decided);
  return [
    {k:'prep', s:'Calendario', l:'Calendario confirmado', st: t.calOk||isPlayed(f)? 'done' : 'todo', d: t.calOk? 'Confirmado' : isPlayed(f)? 'Disputada' : 'Confirma fecha, hora y rival'},
    {k:'disp', s:'Pedir disponibilidad', l:'Disponibilidad solicitada', st: t.availReq||closed? 'done' : 'todo', d: t.availReq? 'Pedida '+relTime(t.availReq.at) : closed? 'Plazo cerrado' : 'Sin pedir'},
    {k:'disp', s:'Cerrar disponibilidad', l:'Disponibilidad cerrada', st: closed? 'done' : (t.availReq||a.answered)? 'doing' : 'todo', d: `${a.answered} de ${a.total} respuestas`},
    {k:'conv', s:'Convocatoria', l:'Convocatoria publicada', st: t.lineupPub? 'done' : (t.convocados?.length||t.rubbers.some(r=>r.polo.length))? 'doing' : 'todo', d: t.lineupPub? 'Publicada' : t.convocados?.length? 'Borrador' : 'Pendiente'},
    {k:'res', s:'Resultados', l:'Resultados introducidos', st: resDone? 'done' : (tr.decided||isPlayed(f))? 'doing' : 'todo', d: resDone? `${US} ${p.ps}-${p.rs}${f.status==='official'?', oficial':''}` : tr.decided? `${tr.decided} partidos con resultado` : 'Pendiente'},
    {k:'post', s:'MVP', l:'MVP publicado', st: pub.mvp? 'done' : mvpState(j)? 'doing' : 'todo', d: pub.mvp? pname(pub.mvp) : mvpOpen(j)? `Votando: ${mvpVoteCount(jid(j))}` : mvpState(j)? 'Por publicar' : 'Tras el partido'}];
}
function nextAction(j){
  const f=poloFix(j), t=tie(j)||blankTie(), a=availFor(j), ph=phases(j), cur=ph.find(x=>x.st!=='done');
  if(!cur) return {t:'Jornada completada', d:'Todo está publicado. Las estadísticas, la clasificación y los perfiles ya están al día.', b:''};
  const B=(act,label,extra='')=>`<button class="btn brass" data-act="${act}" data-j="${j}" ${extra}>${label}</button>`;
  switch(ph.indexOf(cur)){
    case 0: return {t:'Confirma el calendario', d:`${fdate(f,{weekday:'long',day:'numeric',month:'long'})} a las ${f.time} h, ${persp(f).home?'en casa':'fuera'} contra ${clubName(persp(f).rival)}.`, b:B('cal-ok','Confirmar calendario')+`<button class="btn ghost" data-act="jtab" data-v="prep">Editar</button>`};
    case 1: return {t:'Pide la disponibilidad', d:'Se prepara el mensaje de WhatsApp con el enlace y se envía la notificación al equipo.', b:`<button class="btn brass" data-act="go-compose" data-kind="req" data-j="${j}">Solicitar disponibilidad</button>`};
    case 2: return {t: a.none.length? `Faltan ${a.none.length} por responder` : 'Ya han respondido todos', d:`${a.yes.length} disponibles, ${a.maybe.length} pendientes de confirmar, ${a.no.length} no. Plazo: ${fmtDT(deadline(j))}.`, b:(a.none.length? `<button class="btn brass" data-act="go-compose" data-kind="rem" data-j="${j}">Recordar a los ${a.none.length}</button>`:'')+`<button class="btn ${a.none.length?'ghost':'brass'}" data-act="avail-close" data-j="${j}">Cerrar disponibilidad</button>`};
    case 3: return {t:'Prepara la convocatoria', d:`${a.yes.length} disponibles. Elige convocados, individuales y la pareja de dobles.`, b:`<button class="btn brass" data-act="jtab" data-v="conv">Ir a la convocatoria</button>`};
    case 4: return {t: isPlayed(f)&&!tieFromRubbers(j)?.decided? 'Faltan los partidos' : 'Introduce los resultados', d:'Sube el acta oficial (la IA la lee y tú confirmas) o escríbelos a mano. Al guardarlos se recalcula todo y se abren la encuesta y el MVP.', b:`<button class="btn brass" data-act="jtab" data-v="res" data-mode="acta">Subir el acta</button><button class="btn ghost" data-act="jtab" data-v="res" data-mode="manual">A mano</button>`};
    default: return {t: mvpOpen(j)? 'Votación del MVP en marcha' : 'Publica el MVP', d: mvpOpen(j)? `Han votado ${mvpVoteCount(jid(j))}. Plazo: ${fmtDT(new Date(mvpState(j).deadline))}.` : 'Revisa el recuento y publica al ganador.', b:`<button class="btn brass" data-act="jtab" data-v="post">Ver el MVP</button>`};
  }
}
function aJornada(){
  const j=adminJ(); if(!j) return `<div class="empty">No hay eliminatorias del ${US} en el calendario. Añádelas en «Calendario».</div>`;
  const f=poloFix(j), p=persp(f), t=tie(j)||blankTie(), ph=phases(j), na=nextAction(j);
  if(!ui.jTabSet || ui.jTabFor!==j){ ui.jTabFor=j; ui.jTabSet=true; const c=ph.find(x=>x.st!=='done'); ui.jTab = c? c.k : 'post'; }
  const jt=ui.jTab, cur=ph.findIndex(x=>x.st!=='done'), nDocs=(ensureDocsSub(), Object.values(docs).filter(d=>d.j===j).length);
  const panel = jt==='prep'? aPrep(j)
    : jt==='disp'? aDisp(j)
    : jt==='conv'? aConv(j)+(t.lineupPub||lineupList(j).length? `<div class="sec-h" style="margin-top:30px"><h2>Cartel de la convocatoria</h2></div>`+aCartel(j):'')
    : jt==='res'? aResultados(j) : aPost(j);
  return `<section class="sec" style="padding-top:6px"><div class="jhero">
    <div class="jh-top">${jSelect('admin-j',j)}<div class="jh-links"><button class="btn ghost sm" data-act="msg-open" data-j="${j}">${svgi('mega',15)} Mensaje al equipo</button><a class="btn ghost sm" href="#jornada-${j}">Ver la jornada</a><button class="btn ghost sm" data-act="docs-j" data-j="${j}">Documentos${nDocs?' ('+nDocs+')':''}</button></div></div>
    <div class="jh-match"><div class="jh-side">${crest(POLO)}<b>${esc(CLUB.teamShort)}</b></div>
      <div class="jh-mid">${isPlayed(f)? `<b class="jh-score">${p.ps}-${p.rs}</b><small>${f.status==='official'?'Oficial':'Provisional'}</small>` : `<b class="jh-vs">vs</b><small>${esc(countdown(f))}</small>`}</div>
      <div class="jh-side">${crest(p.rival)}<b>${esc(clubName(p.rival))}</b></div></div>
    <p class="jh-when">${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h, ${p.home?'en casa':'fuera'} ${movedTag(f)}</p>
    <ol class="jprog">${ph.map((x,i)=>`<li class="p-${x.st}${i===cur?' cur':''}"><button data-act="jtab" data-v="${x.k}" aria-pressed="${x.k===jt}" title="${esc(x.l+'. '+x.d)}"><span class="jd">${x.st==='done'?'✓':i+1}</span><span class="jl">${x.s}</span><small>${esc(x.d)}</small></button></li>`).join('')}</ol>
  </div>
  <div class="nextcard"><div><span class="nk">Siguiente paso</span><b>${esc(na.t)}</b><p>${esc(na.d)}</p></div><div class="row">${na.b}</div></div></section>
  ${autoCenter(j)}${panel}`;
}
function aPrep(j){
  const f=poloFix(j), p=persp(f), t=tie(j)||blankTie(), topts=sel=>S.teams.filter(x=>x.id!==POLO).map(x=>`<option value="${x.id}" ${sel===x.id?'selected':''}>${esc(x.name)}</option>`).join('');
  const moved=f.moved?.from&&f.moved.from!==f.date, lu=lineupList(j).length;
  const edit=`<div class="mvf"><label>Fecha<input type="date" id="pp-date" value="${f.date}"></label><label>Hora<input type="time" id="pp-time" value="${f.time}"></label></div>
      <div class="tfields" style="margin-top:10px"><label>Rival<select id="pp-rival">${topts(p.rival)}</select></label><label>Dónde<select id="pp-home"><option value="1" ${p.home?'selected':''}>En casa</option><option value="0" ${!p.home?'selected':''}>Fuera</option></select></label></div>
      <div class="row" style="margin-top:12px"><button class="btn brass" data-act="prep-save" data-j="${j}">Guardar cambios</button></div>`;
  const box=`<div class="sec-h"><h2>Datos de la eliminatoria</h2>${t.calOk?'<span class="okmark">✓ Confirmado</span>':''}</div>
    <div class="mvbox"><dl class="kvs"><div><dt>Fecha</dt><dd>${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h ${movedTag(f)}</dd></div><div><dt>Rival</dt><dd>${esc(clubName(p.rival))}</dd></div><div><dt>Dónde</dt><dd>${p.home?'En casa':'Fuera'}, ${esc(sedeOf(f).name)} · <a href="${esc(sedeOf(f).url)}" target="_blank" rel="noopener">Google Maps</a>${sedeOf(f).exact? '' : ' <small class="muted">(búsqueda por el nombre del club)</small>'}</dd></div></dl>
      ${(f.fctDate&&f.fctDate!==f.date)||(f.fctTime&&f.fctTime!==f.time)? `<div class="notice" style="margin:0">La FCT tiene este partido el ${esc(shortD(f.fctDate||f.date))} a las ${esc(f.fctTime||f.time)} h. La app mantiene lo que habéis puesto${f.lock?.by?' ('+esc(f.lock.by)+')':''}. <button class="textlink" data-act="use-fct" data-j="${j}">Usar lo de la FCT</button></div>` : f.lock&&(f.lock.date||f.lock.time)? `<p class="muted small" style="margin:0">🔒 ${f.lock.date&&f.lock.time?'Fecha y hora fijadas':f.lock.date?'Fecha fijada':'Hora fijada'} a mano${f.lock.by?' por '+esc(f.lock.by):''}: la sincronización con la FCT no las cambia.</p>` : ''}
      ${moved? `<div class="row"><button class="btn ghost sm" data-act="move-reset" data-j="${j}">Volver al ${esc(shortD(f.moved.from))}</button><a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`📅 Cambio de fecha: la jornada ${j} contra ${clubName(p.rival)} se juega el ${fdate(f,{weekday:'long',day:'numeric',month:'long'})} a las ${f.time} h (${p.home?'en casa':'fuera'}). Antes era el ${shortD(f.moved.from)}. Todo en la app: ${location.origin}/#jornada-${j}`)}">Avisar al equipo por WhatsApp</a></div>` : ''}
      ${fold('prep-edit-'+j,'Cambiar fecha, hora, rival o lugar','Si se adelanta o se aplaza, la app se reordena sola',edit)}
      ${fold('prep-sede-'+j,'Dirección de la sede',sedeOf(f).addr? esc(sedeOf(f).addr) : 'Sin dirección: el enlace de Maps busca por el nombre del club',`<p class="muted small" style="margin:0 0 8px">Se usa en el enlace de Google Maps de los mensajes y avisos. Se guarda para ${esc(sedeOf(f).name)} y sirve para todas sus jornadas en casa.</p><div class="row"><input type="text" id="sede-addr" value="${esc(venueOf(f.home))}" placeholder="Calle, número, código postal y población" style="flex:1;min-width:0"><button class="btn sm" data-act="sede-save" data-j="${j}">Guardar</button></div>`)}</div>`;
  return `<section class="sec">${lu? `<div class="split"><div>${box}</div><div><div class="sec-h"><h2>Orden de juego</h2></div>${lineupStrip(j)}</div></div>` : `<div style="max-width:640px">${box}</div>`}</section>`;
}
const CAP_FIELDS=[['valoracion','Valoración general','¿Cómo ha ido la eliminatoria en conjunto?'],['desarrollo','Desarrollo de la jornada','Cómo fueron los partidos, momentos clave'],['destacados','Jugadores destacados','Quién y por qué'],['positivos','Aspectos positivos',''],['mejorar','Aspectos a mejorar',''],['incidencias','Incidencias','Lesiones, retrasos, pistas, arbitraje…'],['compromiso','Disponibilidad y compromiso del equipo',''],['observaciones','Observaciones adicionales','']];
function captainReportForm(j){ const t=tie(j)||{}, r=t.captainReport||{}, more=CAP_FIELDS.slice(1), nMore=more.filter(([k])=>r[k]).length;
  const fld=([k,l,ph])=>`<label class="f" for="capr-${k}">${l}</label><textarea id="capr-${k}" data-capr="${k}" rows="2" placeholder="${esc(ph)}">${esc(r[k]||'')}</textarea>`;
  return `<div class="panel caprep"><p class="muted small" style="margin:0 0 10px">Lo lee el gestor deportivo para el informe semanal del club.</p>
    <label class="f" style="margin-top:0">Nota de la jornada (1 a 10)<select data-capr="nota" style="width:auto;margin-left:8px"><option value="">Sin nota</option>${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option ${+r.nota===n?'selected':''}>${n}</option>`).join('')}</select></label>
    ${fld(CAP_FIELDS[0])}
    ${fold('capr-more-'+j,'Más apartados',nMore? nMore+' de '+more.length+' rellenados' : more.map(x=>x[1].toLowerCase()).slice(0,3).join(', ')+'…',more.map(fld).join(''))}
    <div class="row" style="margin-top:10px"><button class="btn brass" data-act="capr-save" data-j="${j}">Guardar informe</button>${r.at? `<span class="muted small">Guardado por ${esc(r.by||'')} ${relTime(r.at)}</span>` : ''}</div></div>`; }
function aPost(j){
  const f=poloFix(j); if(!isPlayed(f)) return `<section class="sec"><div class="empty">El postpartido se activa al guardar los resultados: se abren la encuesta para los que jugaron y la votación del MVP.</div></section>`;
  const c=cronica(j), k=jid(j), m=mvpState(j), pub=S.published[k]||{}, voters=S.players.filter(p=>p.active!==false).length, agg=aggregate(k), parts=participants(j), r=(tie(j)||{}).captainReport||{};
  const mvpSub = pub.mvp? '🏆 '+esc(pname(pub.mvp)) : mvpOpen(j)? `Votando: ${mvpVoteCount(k)} de ${voters} · cierra ${esc(fmtDT(new Date(+m.deadline)))}` : m? 'Cerrada, falta publicar' : 'Sin abrir';
  const encSub = `${agg.n} de ${parts.length} respuestas${S.survey.closed?.[k]?' · cerrada':''}`;
  return `<section class="sec"><div class="sec-h"><h2>Resumen de la jornada</h2></div><div class="panel"><p class="cronica" style="margin:0">${esc(c?.txt||'')}</p>
      <div class="row" style="margin-top:12px"><button class="btn ghost sm" data-act="compose" data-kind="summary" data-j="${j}">Compartir por WhatsApp</button></div>${composer('summary',j,'Resumen de la jornada')}</div></section>
    <section class="sec postcards">
      ${fold('post-mvp-'+j,'Votación del MVP',mvpSub,aMvp(j),!pub.mvp)}
      ${fold('post-enc-'+j,'Encuesta postpartido',encSub,aEncuesta(j))}
      ${fold('post-cap-'+j,'Informe del capitán',r.at? 'Guardado '+relTime(r.at)+(r.nota?' · nota '+r.nota:'') : 'Sin escribir',captainReportForm(j))}
    </section>`;
}
/* --- WhatsApp --- */
const appLink = h => location.origin + location.pathname + '#' + h;
// Sede del partido: dirección guardada (del partido o del club local) o, si no hay, búsqueda en Google Maps por el nombre del club
function venueOf(tid){ const t=S.teams.find(x=>x.id===tid)||{}; return t.venue || (tid===POLO? (CLUB.venue||'') : ''); }
function sedeOf(f){ const h=f.home, addr=f.venue||venueOf(h), name= h===POLO? (CLUB.name||CLUB.short) : clubName(h);
  const q=addr || (name+' tenis '+(h===POLO? CLUB.town||'' : '')).trim();
  return {name, addr, exact:!!addr, url:'https://www.google.com/maps/search/?api=1&query='+mapsQ(q)}; }
const sedeTxt = sd => sd.addr? (sd.addr.startsWith(sd.name)? sd.addr.slice(sd.name.length).replace(/^[,\s·]+/,'') : sd.addr) : 'Ubicación según el nombre del club';
const mapsQ = q => encodeURIComponent(q).replace(/%20/g,'+').replace(/%2C/g,',');
function msgVars(j){ const f=poloFix(j), p=persp(f), sd=sedeOf(f); return {sede:sd.name, direccion:sd.addr||sd.name, mapa:sd.url, rival:clubName(p.rival), fecha:fdate(f,{weekday:'long',day:'numeric',month:'long'}), hora:f.time, limite:fmtDT(deadline(j)), enlace:appLink('disponibilidad-'+j), enlaceJornada:appLink('jornada-'+j), jornada:j, lugar:p.home?'en casa':'fuera, en las pistas del '+clubName(p.rival)}; }
const fillMsg = (tpl,v) => String(tpl||'').replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null? v[k] : m);
function composeText(kind,j){ const v=msgVars(j), a=availFor(j);
  if(kind==='summary'){ const p=persp(poloFix(j)); v.resultado=p.played? `${US} ${p.ps}-${p.rs} ${clubName(p.rival)}` : ''; v.cronica=cronica(j)?.txt||''; v.partidos=(tie(j)?.rubbers||[]).filter(r=>rubberCalc(r).res).map(r=>{ const c=rubberCalc(r); return `${c.res==='W'?'✅':'❌'} ${r.type==='D'?'Dobles':'Ind. '+r.n}: ${(r.polo||[]).map(x=>pname(x)).join(' y ')} ${c.sets.map(x=>x.join('-')).join(' ')}`; }).join('\n'); }
  if(kind==='mvp'){ const p=persp(poloFix(j)); v.resultado=p.played? `${US} ${p.ps}-${p.rs} ${clubName(p.rival)}` : ''; v.enlaceMvp=appLink('mvp-'+j); v.limiteMvp=mvpState(j)?.deadline? fmtDT(new Date(mvpState(j).deadline)) : ''; }
  if(kind==='survey'){ const p=persp(poloFix(j)); v.resultado=p.played? `${US} ${p.ps}-${p.rs} ${clubName(p.rival)}` : 'resultado pendiente'; v.jugadores=participants(j).map(x=>pname(x).split(' ')[0]).join(', '); v.enlaceEncuesta=appLink('encuesta-'+j); }
  if(kind==='rem') v.pendientes=a.none.map(pname).join(', ')||'nadie';
  if(kind==='lineup'){ const roles=rolesOf(j); v.lista=lineupList(j).map(pid=>`• ${pname(pid)}: ${(roles[pid]||[]).join(' + ')}`).join('\n'); }
  return withLinks(kind, S.msgs[kind], v); }
function withLinks(kind,tpl,v){ let out=fillMsg(tpl,v);
  if(['req','rem','remOne'].includes(kind) && !/\{enlace\}/.test(tpl||'')) out+=`\n\n👉 Da tu disponibilidad aquí: ${v.enlace}`;
  if(['req','rem','remOne','lineup'].includes(kind) && !/\{mapa\}/.test(tpl||'')) out+=`\n📍 ${v.sede}: ${v.mapa}`;
  return out; }
function composer(kind,j,title){
  const c=ui.compose&&ui.compose.kind===kind&&ui.compose.j===j? ui.compose : null;
  if(!c) return '';
  return `<div class="panel composer"><b>${title}</b><p class="muted small" style="margin:4px 0 10px">Revísalo y edítalo antes de enviarlo. ${waCfg().group? '«Copiar y abrir el grupo» copia el texto y abre el grupo del equipo: solo tienes que pegarlo.' : 'WhatsApp no deja elegir el grupo desde un enlace: al abrirse, elige el grupo del equipo. Si vinculas el grupo en «Lo que la app gestiona por ti», se abrirá directamente.'}</p>
    <textarea id="compose-text" rows="10">${esc(c.text)}</textarea>
    <div class="row" style="margin-top:10px"><button class="btn brass" data-act="wa-send" data-kind="${kind}" data-j="${j}"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>Abrir WhatsApp</button>
      ${waCfg().group?`<button class="btn" data-act="wa-group" data-kind="${kind}" data-j="${j}">Copiar y abrir el grupo</button>`:''}${navigator.share?`<button class="btn ghost" data-act="wa-share" data-kind="${kind}" data-j="${j}">Compartir…</button>`:''}<button class="btn ghost" data-act="wa-copy" data-kind="${kind}" data-j="${j}">Copiar texto</button><button class="btn ghost sm" data-act="compose-close">Cancelar</button></div></div>`;
}
function respChart(j){
  const k=jid(j), ev=[]; Object.entries(avail).forEach(([pid,d])=>(d.h?.[k]||[]).forEach(e=>ev.push({pid,...e})));
  if(!ev.length) return '';
  ev.sort((a,b)=>a.at-b.at); const t0=Math.min(tie(j)?.availReq?.at||ev[0].at, ev[0].at), t1=Math.max(Date.now(), ev.at(-1).at+1), st={}; const pts=[];
  ev.forEach(e=>{ st[e.pid]=e.s; pts.push({t:e.at, n:Object.keys(st).length, y:Object.values(st).filter(x=>x==='yes').length}); });
  const W=600,H=170,pad={l:28,r:10,t:10,b:24}, tot=Math.max(1,availFor(j).total);
  const X=t=>pad.l+(t-t0)/(t1-t0||1)*(W-pad.l-pad.r), Y=v=>pad.t+(1-v/tot)*(H-pad.t-pad.b);
  const step=key=>{ let d=`M${X(t0)},${Y(0)}`, prev=0; pts.forEach(q=>{ d+=`L${X(q.t)},${Y(prev)}L${X(q.t)},${Y(q[key])}`; prev=q[key]; }); return d+`L${X(t1)},${Y(prev)}`; };
  let g=''; [0,Math.round(tot/2),tot].forEach(v=>g+=`<line x1="${pad.l}" x2="${W-pad.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${pad.l-6}" y="${Y(v)+4}" text-anchor="end">${v}</text>`);
  g+=`<text x="${pad.l}" y="${H-6}">${new Date(t0).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</text><text x="${W-pad.r}" y="${H-6}" text-anchor="end">ahora</text>`;
  return `<div class="sec-h" style="margin-top:22px"><h3>Evolución de las respuestas</h3></div><svg class="chart" viewBox="0 0 ${W} ${H}">${g}<path class="ln" d="${step('n')}" fill="none" stroke="var(--muted)" stroke-width="2"/><path class="ln" d="${step('y')}" fill="none" stroke="var(--win)" stroke-width="2.5"/></svg><div class="legend"><span><i style="background:var(--muted)"></i>Han respondido</span><span><i style="background:var(--win)"></i>Disponibles</span></div>`;
}
function aDisp(j){
  const f=poloFix(j), t=tie(j)||blankTie(), a=availFor(j), dl=deadline(j), closed=deadlinePassed(j);
  const dlv=new Date(dl.getTime()-dl.getTimezoneOffset()*6e4).toISOString().slice(0,16);
  const order=['yes','maybe','no','none'], tot=Math.max(1,a.total);
  const face=(pid,k)=>{ const v=avOf(pid,j), n=noteOf(pid,j), ph=phones[pid], hs=availStats(pid);
    return `<li class="face ${k}" title="${esc(pname(pid)+(hs.total?' · '+Math.round(hs.pct*100)+'% disponible en la temporada':''))}"><div class="fhit">${avatar(player(pid),'sm')}<b>${esc(pname(pid).split(' ')[0])}</b><small>${k==='none'?'Sin respuesta':esc(AV_LABEL[k])}${v?.at?' · '+relTime(v.at):''}</small>${n?.c?`<em>«${esc(n.c)}»</em>`:''}
      <select class="fsel" data-act="av-admin" data-pid="${esc(pid)}" data-j="${j}" aria-label="Anotar a mano la respuesta de ${esc(pname(pid))}"><option value="">Anotar a mano…</option><option value="yes">Disponible</option><option value="maybe">Pendiente de confirmar</option><option value="no">No disponible</option></select></div>
      ${k==='none'&&ph&&!closed&&waCfg().mode!=='group'? `<button class="fwa" data-act="wa-one" data-pid="${esc(pid)}" data-j="${j}" title="Recordar por WhatsApp">Recordar</button>` : ''}</li>`; };
  const main = closed? `<button class="btn brass" data-act="jtab" data-v="conv">Preparar la convocatoria</button>${t.availClosed?`<button class="btn ghost sm" data-act="avail-reopen" data-j="${j}">Reabrir disponibilidad</button>`:''}`
    : !t.availReq? `<button class="btn brass" data-act="compose" data-kind="req" data-j="${j}">Solicitar disponibilidad</button><button class="btn ghost sm" data-ax="req-app" data-j="${j}" title="Notificación de la app y correo a quien no la tenga, sin mensaje de WhatsApp">Pedir solo por la app</button><button class="btn ghost sm" data-act="avail-close" data-j="${j}">Cerrar disponibilidad</button>`
    : `${a.none.length? `<button class="btn brass" data-act="compose" data-kind="rem" data-j="${j}">Recordar a los ${a.none.length} que faltan</button>` : ''}<button class="btn ${a.none.length?'ghost sm':'brass'}" data-act="avail-close" data-j="${j}">Cerrar disponibilidad</button><button class="btn ghost sm" data-act="compose" data-kind="req" data-j="${j}">Volver a pedir</button>`;
  const dlForm=`<div class="row"><input type="datetime-local" id="dl" value="${dlv}" style="max-width:240px"><button class="btn sm" data-act="dl-save" data-j="${j}">Guardar plazo</button>${t.deadline?`<button class="btn sm ghost" data-act="dl-reset" data-j="${j}">Usar el plazo por defecto</button>`:''}</div><p class="muted small" style="margin:6px 0 0">Por defecto, ${S.rules.deadlineDays} días antes a las ${esc(S.rules.deadlineTime)}.</p>`;
  return `<section class="sec"><div class="sec-h"><h2>Disponibilidad</h2></div>
    <div class="avbar">${order.map(k=>a[k].length?`<i class="${k}" style="flex:${a[k].length}"></i>`:'').join('')||'<i class="none" style="flex:1"></i>'}</div>
    <div class="avlegend">${order.map(k=>`<span class="${k}"><b>${a[k].length}</b> ${k==='yes'?'disponibles':k==='maybe'?'por confirmar':k==='no'?'no pueden':'sin responder'}</span>`).join('')}</div>
    <div class="avmeta"><span class="chip-s">${t.availReq? 'Pedida '+relTime(t.availReq.at)+((t.remLog||[]).length?' · '+t.remLog.length+' recordatorios':'') : 'Aún no se ha pedido'}</span>
      <details class="dlchip" data-k="dl-${j}" ${ui.open?.['dl-'+j]?'open':''}><summary>${closed?'Plazo cerrado':'Plazo'}: ${esc(fmtDT(dl))} ✎</summary><div class="dlpop">${dlForm}</div></details></div>
    <div class="row" style="margin-top:12px">${main}</div>
    ${composer('req',j,'Mensaje para el grupo')}${composer('rem',j,'Recordatorio para el grupo')}
    <ul class="faces">${order.flatMap(k=>a[k].map(pid=>face(pid,k))).join('')}</ul>
    <p class="muted small" style="margin-top:8px">Toca una cara para anotar su respuesta a mano.</p>
    ${(()=>{ const rc=respChart(j); return rc? fold('respchart-'+j,'Evolución de las respuestas','',rc.replace(/^<div class="sec-h"[^]*?<\/div><\/div>|^<div class="sec-h"[^]*?<\/h3><\/div>/,'')) : ''; })()}
  </section>`;
}
function aConv(j){
  const t=tie(j)||blankTie(), a=availFor(j), dr=capDraft(j), conv=new Set(dr? dr.conv : t.convocados?.length? t.convocados : a.yes);
  const order=[...a.yes,...a.maybe,...a.none,...a.no], rp=i=> dr? (dr.rub[i]||[]) : (t.rubbers[i]?.polo||[]), jug=pid=>capRow(pid,j).jug;
  const badge=(pid,nj)=>{ const v=avOf(pid,j)?.s||'none'; return `<em class="av-${v}">${{yes:'disponible',maybe:'pendiente',no:'no disponible',none:'sin respuesta'}[v]}${nj==null?'':`<span class="cv-j" title="Jornadas jugadas esta temporada"> · jugó ${nj}</span>`}</em>`; };
  const popts=sel=>`<option value="">Elegir</option>`+order.map(id=>`<option value="${esc(id)}" ${sel===id?'selected':''}>${esc(pname(id))}${conv.has(id)?'':' (no convocado)'}</option>`).join('');
  const assigned=new Set(t.rubbers.flatMap((r,i)=>rp(i))); const subs=[...conv].filter(x=>!assigned.has(x));
  const dupe=t.rubbers.map((r,i)=>r.type==='S'?rp(i)[0]:null).filter(Boolean); const hasDupe=new Set(dupe).size!==dupe.length;
  const warn=[...assigned].filter(x=>(avOf(x,j)?.s||'none')!=='yes');
  return `<section class="sec">${capSuggestBlock(j)}${capDraftNote(j)}<div class="sec-h"><h2>Convocados</h2><span class="muted small">${conv.size} seleccionados</span></div>
    <div class="cvgrid">${order.map(id=>{ const n=noteOf(id,j), nj=jug(id); return `<label title="${esc(n?.c||'')}"><input type="checkbox" name="conv" value="${esc(id)}" ${conv.has(id)?'checked':''}> ${esc(pname(id))}${badge(id,nj)}</label>`; }).join('')}</div></section>
  <section class="sec"><div class="sec-h"><h2>Orden de juego</h2></div><p class="muted small">4 individuales y la pareja de dobles (${dblDecider()?'solo cuenta si queda 2-2':'cuenta siempre que se juegue'}). Los convocados sin partido asignado quedan como suplentes.</p>
    ${t.rubbers.map((r,i)=>`<div class="redit" data-r="${i}" style="grid-template-columns:150px 1fr 1fr"><span class="rn">${RUBBERS[i].label}${r.type==='D'?'<small>'+dblHint()+'</small>':''}</span><select name="p1">${popts(rp(i)[0])}</select>${r.type==='D'?`<select name="p2">${popts(rp(i)[1])}</select>`:'<span></span>'}</div>`).join('')}
    <p class="small" style="margin-top:10px">Suplentes: ${subs.length? subs.map(pname).join(', ') : 'ninguno'}.</p>
    ${hasDupe?'<div class="notice" style="margin-top:8px">Hay un jugador repetido en los individuales.</div>':''}
    ${warn.length?`<div class="notice" style="margin-top:8px">Sin «disponible» confirmado: ${warn.map(pname).join(', ')}.</div>`:''}
    <div class="row" style="margin-top:16px"><button class="btn ghost" data-act="conv-save" data-j="${j}">Guardar borrador</button>${t.lineupPub?`<button class="btn ghost" data-act="conv-pub" data-j="${j}" data-v="0">Retirar publicación</button><button class="btn brass" data-act="conv-save" data-j="${j}" data-pub="1">Guardar y mantener publicada</button>`:`<button class="btn brass" data-act="conv-save" data-j="${j}" data-pub="1">Publicar convocatoria</button>`}</div>
    ${lineupChanged(j)?`<div class="notice" style="margin-top:12px"><b>La convocatoria ha cambiado desde que la anunciaste.</b> El mensaje y el cartel ya muestran la versión actual: compártela de nuevo en el grupo.</div>`:''}
    ${t.lineupPub?`<div class="row" style="margin-top:12px"><button class="btn ${lineupChanged(j)?'brass':'ghost'}" data-act="compose" data-kind="lineup" data-j="${j}">${lineupChanged(j)?'Anunciar la versión actualizada':t.lineupAnnounced?'Volver a anunciar por WhatsApp':'Anunciar por WhatsApp'}</button><button class="btn ghost" data-act="poster-scroll">Ver el cartel</button></div>`:''}
    ${composer('lineup',j,'Anuncio de la convocatoria')}</section>`;
}
function posterOpts(j){ const t=tie(j)||{}; const p=t.poster||{}; const f=poloFix(j);
  return {fmt:p.fmt||'story', bg:p.bg||(photos._team?'team':'court'), title:p.title||'Convocatoria', sub:p.sub||`Jornada ${j}, ${S.comp.name.replace(/^\d+a /,'')}`, tagline:p.tagline||'¡Vamos '+CLUB.teamShort+'!', showSubs:p.showSubs!==false, order:p.order||[], hidden:p.hidden||[]}; }
function aCartel(j){
  const t=tie(j); if(!t || !lineupList(j).length) return `<section class="sec"><div class="empty">Primero elige los convocados y el orden de juego en «Convocatoria».</div></section>`;
  const o=posterOpts(j), all=(()=>{ const save=t.poster; t.poster={...(save||{}),hidden:[]}; const l=lineupList(j); t.poster=save; return l; })(), roles=rolesOf(j);
  return `<section class="sec"><div class="split"><div>
    <div class="chips">${[['story','Vertical 9:16'],['square','Cuadrado'],['wide','Horizontal']].map(([k,l])=>`<button class="chip" data-act="poster-set" data-k="fmt" data-v="${k}" aria-pressed="${o.fmt===k}">${l}</button>`).join('')}</div>
    <div class="chips" style="margin-top:8px">${[['court','Pista'],['team','Foto del equipo']].map(([k,l])=>`<button class="chip" data-act="poster-set" data-k="bg" data-v="${k}" aria-pressed="${o.bg===k}" ${k==='team'&&!photos._team?'disabled title="Sube la foto del equipo en Temporadas y ajustes"':''}>${l}</button>`).join('')}</div>
    <label class="f">Título</label><input type="text" id="pt-title" value="${esc(o.title)}">
    <label class="f">Subtítulo</label><input type="text" id="pt-sub" value="${esc(o.sub)}">
    <label class="f">Lema</label><input type="text" id="pt-tag" value="${esc(o.tagline)}">
    <label class="f">Jugadores en el cartel (orden y visibilidad)</label>
    <ul class="plist">${all.map((pid,i)=>`<li><label><input type="checkbox" data-act="poster-hide" data-pid="${esc(pid)}" ${o.hidden.includes(pid)?'':'checked'}> ${esc(pname(pid))} <span class="muted small">${esc((roles[pid]||[]).join(' + '))}</span></label><span><button class="iconbtn" data-act="poster-move" data-pid="${esc(pid)}" data-d="-1" ${i===0?'disabled':''} aria-label="Subir">↑</button><button class="iconbtn" data-act="poster-move" data-pid="${esc(pid)}" data-d="1" ${i===all.length-1?'disabled':''} aria-label="Bajar">↓</button></span></li>`).join('')}</ul>
    <div class="row" style="margin-top:12px"><button class="btn ghost sm" data-act="poster-texts" data-j="${j}">Aplicar textos</button>${t.poster&&Object.keys(t.poster).length?`<button class="btn ghost sm" data-act="poster-reset" data-j="${j}">Volver al diseño automático</button>`:''}</div>
    </div><div><canvas id="poster-canvas" data-j="${j}" class="pcanvas"></canvas>
    <div class="row" style="margin-top:12px"><button class="btn brass" data-act="poster-dl" data-j="${j}">Descargar imagen</button>${navigator.share?`<button class="btn" data-act="poster-share" data-j="${j}">Compartir</button>`:''}</div>
    <p class="muted small">Se compone solo según el número de jugadores. Las fotos salen de sus perfiles.</p></div></div></section>`;
}
function aResultados(j){
  const ad=actaDocFor(j), mode=(ui.resMode||{})[j] || (ad && ['subido','procesando','revision','error'].includes(ad.status)? 'acta' : 'manual');
  const sw=`<section class="sec" style="padding-bottom:0"><div class="seg resmode" role="group" aria-label="Cómo añadir los resultados"><button data-act="res-mode" data-j="${j}" data-v="manual" aria-pressed="${mode==='manual'}">Introducir manualmente</button><button data-act="res-mode" data-j="${j}" data-v="acta" aria-pressed="${mode==='acta'}">Subir acta oficial</button></div></section>`;
  return sw + (mode==='acta'? actaPanel(j) : aResultadosManual(j));
}
function aResultadosManual(j){
  const f=poloFix(j), t=tie(j)||blankTie(), p=persp(f), conv=new Set(t.convocados||[]);
  const order=[...S.players.filter(x=>conv.has(x.id)), ...S.players.filter(x=>!conv.has(x.id)&&x.active!==false)].map(x=>x.id);
  const popts=sel=>`<option value="">Elegir</option>`+order.map(id=>`<option value="${esc(id)}" ${sel===id?'selected':''}>${esc(pname(id))}</option>`).join('');
  const v=validateTie(t), tr=tieFromRubbers(j)||{}, fx=poloFix(j);
  const status = isPlayed(fx)? (fx.status==='official'? '<span class="badge ok">Oficial</span>' : '<span class="badge prov">Provisional, pendiente de validar</span>') : '<span class="badge">Sin resultado</span>';
  const fctWarn = fx?.fctScore? `<div class="vbox warn" style="margin-bottom:12px">La FCT tiene un resultado distinto para esta jornada: <b>${esc(fx.home===POLO? fx.fctScore : fx.fctScore.split('-').reverse().join('-'))}</b> (marcador del ${US} primero). Revisa el acta o avisa a la Federació.</div>` : '';
  return `<section class="sec"><div class="resbar"><div><span class="muted small">Eliminatoria</span><b>${US} ${tr.decided? tr.w+'-'+tr.l : (p.ps??'–')+'-'+(p.rs??'–')}</b></div><div>${status}</div></div>${fctWarn}
    ${v.errors.length? `<div class="vbox err"><b>Corrige antes de guardar</b><ul>${v.errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}${v.warnings.length? `<div class="vbox warn"><ul>${v.warnings.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
    <p class="muted small">Marcador desde el punto de vista del ${US}, sets separados por espacios: <b>6-4 3-6 6-3</b>. El resultado se calcula solo; fuerza uno a mano para W.O. o abandono. Los jugadores vienen de la convocatoria; cámbialos si hubo cambios de última hora.</p>
    ${t.rubbers.map((r,i)=>`<div class="redit" data-r="${i}"><span class="rn">${RUBBERS[i].label}${r.type==='D'?'<small>'+dblHint()+'</small>':''}</span>
      <select name="p1" aria-label="Jugador">${popts(r.polo[0])}</select>${r.type==='D'?`<select name="p2" aria-label="Pareja">${popts(r.polo[1])}</select>`:'<span></span>'}
      <input type="text" name="score" placeholder="6-4 6-3" value="${esc(r.score)}">
      <select name="res"><option value="">Auto</option><option value="W" ${r.res==='W'?'selected':''}>Gana ${US}</option><option value="L" ${r.res==='L'?'selected':''}>Pierde ${US}</option></select>
      <input type="text" name="riv" placeholder="${r.type==='D'?'Pareja rival (opcional)':'Rival (opcional)'}" value="${esc(r.riv||'')}" style="grid-column:2 / -2" aria-label="Rival">
      <input type="text" name="note" placeholder="Nota: W.O., abandono…" value="${esc(r.note)}" style="grid-column:2 / -2"><button class="btn sm ghost" data-act="res-clear" data-j="${j}" data-r="${i}" ${r.score||r.res?'':'disabled'}>Borrar</button>
      ${(()=>{ const e=validateRubber(r); return e.length&&(r.score||r.res)? `<p class="rerr">${esc(e.join('. '))}</p>` : (rubberCalc(r).res? `<p class="rok">${rubberCalc(r).res==='W'?'Gana el '+US+'':'Gana el rival'}</p>`:''); })()}</div>`).join('')}
    <label class="f" for="moment">Momento de la jornada (público)</label><input type="text" id="moment" value="${esc(t.moment||'')}">
    <div class="panel" style="margin-top:16px"><b>Marcador por equipos</b><p class="muted small" style="margin:4px 0 10px">Se calcula solo con los 4 individuales y el dobles (${dblDecider()?'este solo si hubo 2-2':'si se jugó'}). Si solo tienes el oficial, escríbelo aquí.</p>
      <div class="row"><label>${US} <input type="number" id="ps" min="0" max="5" value="${p.ps??''}" style="width:80px"></label><label>${esc(clubName(p.rival))} <input type="number" id="rs" min="0" max="5" value="${p.rs??''}" style="width:80px"></label></div></div>
    <div class="row" style="margin-top:16px"><button class="btn brass" data-act="save-tie" data-j="${j}">Guardar resultados</button>${isPlayed(fx)&&fx.status!=='official'?`<button class="btn ghost" data-act="res-confirm" data-j="${j}">Confirmar como resultado oficial</button>`:''}${fx.status==='official'&&isPlayed(fx)?`<button class="btn ghost sm" data-act="res-unconfirm" data-j="${j}">Marcar como provisional</button>`:''}<a class="textlink" href="#jornada-${j}">Ver la jornada</a></div>
    <p class="muted small">Si corriges o borras un resultado, todas las estadísticas, rankings y perfiles se recalculan solos. «Oficial» significa que coincide con el acta de la federación.</p>
    ${isPlayed(f)&&false? `<div class="panel" style="margin-top:20px"><b>Encuesta para los que jugaron</b><p class="muted small" style="margin:4px 0 10px">Se abre sola para ${participants(j).map(pname).join(', ')||'los jugadores con resultado'}. Al guardar el resultado se les envía una notificación; aquí puedes avisarles también por WhatsApp.${t.surveyAnnounced?' Último aviso por WhatsApp '+relTime(t.surveyAnnounced)+'.':''}</p>
      <div class="row"><button class="btn ghost" data-act="compose" data-kind="survey" data-j="${j}">Avisar por WhatsApp</button><button class="btn ghost sm" data-act="notify" data-type="survey" data-j="${j}">Reenviar notificación</button></div>${composer('survey',j,'Aviso de la encuesta')}</div>`:''}</section>`;
}
function aggregate(k){
  const out={n:0,votes:{},ratings:{},texts:[],who:[]}, sums={}, cnt={};
  Object.entries(ballots).forEach(([pid,b])=>{ const r=b.j?.[k]; if(!r) return; out.n++; out.who.push(pid);
    S.survey.questions.forEach(q=>{ const v=r.a?.[q.id]; if(v==null||v==='') return;
      if(q.scope==='peer'){ (out.votes[q.id] ||= {}); out.votes[q.id][v]=(out.votes[q.id][v]||0)+1; }
      else if(q.scope==='team'&&q.type==='scale'){ sums[q.id]=(sums[q.id]||0)+(+v); cnt[q.id]=(cnt[q.id]||0)+1; }
      else if(q.type==='text') out.texts.push({pid,q:q.text,v}); }); });
  Object.keys(sums).forEach(q=>out.ratings[q]=sums[q]/cnt[q]); return out;
}
function aEncuesta(j){
  if(!canPrivate) return `<section class="sec"><div class="panel"><b>Encuesta de la jornada ${j}</b><p class="muted small" style="margin:6px 0 10px">Se abre sola para los que jugaron. Sus respuestas individuales son privadas: solo las ven los administradores y capitanes marcados, que publican la nota media del equipo.</p><div class="row"><button class="btn sm ghost" data-act="compose" data-kind="survey" data-j="${j}">Avisar por WhatsApp</button><button class="btn sm ghost" data-act="notify" data-type="survey" data-j="${j}">Reenviar notificación</button></div>${composer('survey',j,'Aviso de la encuesta')}</div></section>`;
  const k=jid(j), agg=aggregate(k), parts=participants(j), closed=!!S.survey.closed?.[k], missing=parts.filter(pid=>!agg.who.includes(pid));
  return `<section class="sec"><div class="panel"><b>Encuesta de la jornada ${j}: ${closed?'cerrada':isPlayed(poloFix(j))?'abierta para los que jugaron':'se abrirá al cargar el resultado'}</b>
    <p class="muted small" style="margin:6px 0 10px">${agg.n} de ${parts.length} han respondido.${missing.length?' Faltan: '+missing.map(pname).join(', ')+'.':''}</p>
    <div class="row"><button class="btn sm ghost" data-act="survey-toggle" data-j="${j}">${closed?'Reabrir encuesta':'Cerrar encuesta'}</button><button class="btn sm ghost" data-act="compose" data-kind="survey" data-j="${j}">Avisar por WhatsApp</button><button class="btn sm ghost" data-act="notify" data-type="survey" data-j="${j}">Reenviar notificación</button></div>${composer('survey',j,'Aviso de la encuesta')}</div></section>
  <section class="sec"><div class="sec-h"><h2>Valoración del equipo</h2></div><p>${Object.entries(agg.ratings).map(([q,v])=>`${esc(S.survey.questions.find(x=>x.id===q)?.text||q)} <b>${dec(v)}</b>`).join('. ')||'<span class="muted">Sin respuestas todavía.</span>'}</p>
    <div class="row" style="margin-top:10px"><button class="btn sm" data-act="ratings-pub" data-j="${j}">Publicar la nota media del equipo</button></div><p class="source">Las autovaloraciones y los comentarios nunca se publican.</p></section>
  ${agg.texts.length?`<section class="sec"><div class="sec-h"><h2>Comentarios privados</h2></div><ul class="insights">${agg.texts.map(x=>`<li>${esc(x.v)}<small>${esc(pname(x.pid))}, ${esc(x.q)}</small></li>`).join('')}</ul></section>`:''}`;
}
function mvpTally(k){ if(canPrivate && mvpVotes[k] && Object.keys(mvpVotes[k]).length){ const t={}; Object.values(mvpVotes[k]).forEach(v=>{ if(v?.v) t[v.v]=(t[v.v]||0)+1; }); return t; } return {...(mvpCounts[k]?.t||{})}; }
const mvpVoteCount = k => canPrivate && mvpVotes[k] && Object.keys(mvpVotes[k]).length? Object.keys(mvpVotes[k]).length : (mvpCounts[k]?.n||0);
function aMvp(j){
  const k=jid(j), f=poloFix(j), m=mvpState(j), pub=S.published[k], votes=mvpVotes[k]||{}, tally=mvpTally(k), voters=S.players.filter(p=>p.active!==false).map(p=>p.id);
  const nVotes=mvpVoteCount(k), voted=canPrivate? voters.filter(v=>votes[v]) : [], missing=canPrivate? voters.filter(v=>!votes[v]) : [], sorted=Object.entries(tally).sort((a,b)=>b[1]-a[1]), top=sorted[0]?.[1]||0, tied=sorted.filter(x=>x[1]===top).map(x=>x[0]);
  if(!isPlayed(f)) return `<section class="sec"><div class="empty">La votación del MVP se abre sola al guardar el resultado de la eliminatoria.</div></section>`;
  const dl=m?.deadline? new Date(+m.deadline) : new Date(Date.now()+(S.rules.mvpHours||48)*3600e3), dlv=new Date(dl.getTime()-dl.getTimezoneOffset()*6e4).toISOString().slice(0,16);
  const state = pub?.mvp? 'Publicado' : mvpOpen(j)? 'Abierta' : m? 'Cerrada, pendiente de publicar' : 'Sin abrir';
  return `<section class="sec"><div class="split"><div>
    <div class="row" style="gap:20px;align-items:center">${ring(voters.length? nVotes/voters.length : null,'han votado')}<div><b style="font-stretch:72%;font-size:1.5rem">Votación: ${state}</b><p class="muted small" style="margin:4px 0 0">${nVotes} de ${voters.length} jugadores han votado.${m?.deadline&&!pub?.mvp?' Plazo: '+esc(fmtDT(dl))+'.':''}</p></div></div>
    <div class="panel" style="margin-top:14px"><label class="f" style="margin-top:0" for="mvp-dl">Fecha límite</label><div class="row"><input type="datetime-local" id="mvp-dl" value="${dlv}" style="max-width:240px">
      ${!m||!m.open? `<button class="btn brass sm" data-act="mvp-open" data-j="${j}">${m?'Reabrir votación':'Abrir votación'}</button>` : `<button class="btn sm" data-act="mvp-open" data-j="${j}">Cambiar plazo</button><button class="btn ghost sm" data-act="mvp-close" data-j="${j}">Cerrar ahora</button>`}</div>
      <div class="row" style="margin-top:10px"><button class="btn ghost sm" data-act="compose" data-kind="mvp" data-j="${j}">Avisar por WhatsApp</button><button class="btn ghost sm" data-act="notify" data-type="mvp" data-j="${j}">Enviar notificación</button></div>${composer('mvp',j,'Aviso de la votación')}</div>
    <div class="sec-h" style="margin-top:22px"><h3>Participación</h3></div>
    ${canPrivate? `<p class="small"><b>Han votado:</b> ${voted.map(pname).join(', ')||'nadie todavía'}.</p><p class="small muted"><b>Faltan:</b> ${missing.map(pname).join(', ')||'nadie'}.</p>` : `<p class="small muted">El voto es secreto: quién ha votado a quién solo lo ven los administradores y capitanes marcados.</p>`}</div>
  <div><div class="sec-h"><h2>Recuento</h2></div>${sorted.length? `<ol class="tally">${sorted.map(([pid,n])=>`<li>${avatar(player(pid),'sm')}<span>${esc(pname(pid))}</span><span class="tb"><i data-w="${Math.round(n/top*100)}"></i></span><b>${n}</b></li>`).join('')}</ol>` : '<div class="empty">Aún no hay votos.</div>'}
    ${tied.length>1?`<div class="notice" style="margin-top:10px">Empate a ${top} entre ${tied.map(pname).join(' y ')}. Elige al MVP abajo.</div>`:''}
    <div class="panel" style="margin-top:14px"><b>Publicar el MVP</b>
      <label class="f">MVP</label><select id="mvp-pick">${(tied.length? tied : mvpCandidates(j)).concat(mvpCandidates(j).filter(x=>!tied.includes(x))).filter((x,i,a)=>a.indexOf(x)===i).map(pid=>`<option value="${esc(pid)}" ${(pub?.mvp||tied[0])===pid?'selected':''}>${esc(pname(pid))} (${tally[pid]||0} ${tally[pid]===1?'voto':'votos'})</option>`).join('')}</select>
      <p class="muted small" style="margin:6px 0 0">Por defecto, el más votado. Elegir a otro queda marcado como decisión del capitán.</p>
      <div class="row" style="margin-top:12px"><button class="btn brass" data-act="mvp-publish" data-j="${j}">${pub?.mvp?'Actualizar MVP publicado':'Cerrar y publicar el MVP'}</button>${pub?.mvp?`<button class="btn ghost sm" data-act="mvp-unpublish" data-j="${j}">Retirar publicación</button>`:''}</div></div>
    ${canPrivate? '' : '<!--'}<details class="panel" style="margin-top:14px"><summary><b>Incidencias</b> <span class="muted small">(anular un voto)</span></summary>
      ${voted.length? `<ul class="avlist" style="margin-top:10px">${voted.map(v=>`<li class="row" style="justify-content:space-between"><span class="small">${esc(pname(v))} votó a <b>${esc(pname(votes[v].v))}</b> <span class="muted">${relTime(votes[v].at)}</span></span><button class="btn sm ghost" data-act="mvp-annul" data-j="${j}" data-voter="${esc(v)}">Anular</button></li>`).join('')}</ul>` : '<p class="muted small">Sin votos.</p>'}
      <p class="muted small">Al anular un voto, ese jugador puede volver a votar mientras la votación siga abierta.</p></details>${canPrivate? '' : '-->'}</div></div></section>`;
}
function vMvp(j){
  const f=poloFix(j); if(!f) return vNotFound(); const k=jid(j), p=persp(f), pub=S.published[k], mine=myVotes[k], m=mvpState(j);
  let h=`<div class="wrap"><div class="pagehead"><p class="qsec">🏆 Votación MVP</p><h1>Jornada ${j}</h1><p class="lede">${US} ${p.played? p.ps+'-'+p.rs : 'contra'} ${esc(clubName(p.rival))}, ${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}.</p></div>`;
  if(pub?.mvp) return h+`<section class="sec">${mvpCard(j)}</section><section class="sec">${mvpRanking(true)}</section></div>`;
  if(!m) return h+`<div class="empty">La votación se abre cuando se cargue el resultado de la eliminatoria.</div></div>`;
  if(mine) return h+`<section class="sec"><div class="panel done"><p class="q">Has votado a ${esc(pname(mine))} ✓</p><p class="muted">Tu voto es único y ya no se puede cambiar. El resultado se publicará al cerrar la votación${mvpOpen(j)?', el '+esc(fmtDT(new Date(m.deadline))):''}.</p></div></section></div>`;
  if(!mvpOpen(j)) return h+`<div class="empty">La votación está cerrada. El capitán publicará el resultado.</div></div>`;
  if(!me) return h+`<div class="notice">Elige tu nombre en Yo para poder votar.</div></div>`;
  const cands=mvpCandidates(j).filter(x=>x!==me), roles=rolesOf(j), t=tie(j);
  const res=pid=>(t?.rubbers||[]).filter(r=>(r.polo||[]).includes(pid)).map(r=>{ const c=rubberCalc(r); return `<span class="vr ${c.res||''}">${r.type==='D'?'D':'I'+r.n} ${c.sets.map(s=>s.join('-')).join(' ')}</span>`; }).join('');
  return h+`<section class="sec"><p class="muted" style="margin-top:0">Elige al mejor jugador de la eliminatoria. Un solo voto, no puedes votarte y no se puede cambiar. Hasta el ${esc(fmtDT(new Date(m.deadline)))}.</p>
    <div class="vgrid stagger">${cands.map(pid=>{ const pl=player(pid), ph=photos[pid]?.t||photos[pid]?.d; return `<button class="vcard press" data-act="mvp-pick" data-pid="${esc(pid)}" aria-pressed="${ui.mvpPick===pid}"><span class="vc-photo">${ph?`<img src="${esc(ph)}" alt="">`:`<i>${esc(pl.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</i>`}</span><span class="vc-n">${esc(pl.name)}</span><span class="vc-r">${res(pid)}</span></button>`; }).join('')}</div>
    ${cands.length?'':'<div class="empty">No hay jugadores con resultado en esta jornada.</div>'}</section>
    <div class="vbar ${ui.mvpPick?'on':''}"><span>${ui.mvpPick? 'Tu voto: <b>'+esc(pname(ui.mvpPick))+'</b>' : ''}</span><button class="btn brass" data-act="mvp-cast" data-j="${j}" ${ui.mvpPick?'':'disabled'}>Confirmar voto</button></div></div>`;
}
function mvpRanking(compact){
  const rows=S.players.map(p=>({p,m:mvpCount(p.id),v:totalVotes(p.id)})).filter(x=>x.m||x.v).sort((a,b)=>b.m-a.m||b.v-a.v);
  if(!rows.length) return `<div class="sec-h"><h2>Ranking MVP de la temporada</h2></div><div class="empty">Aún no se ha publicado ningún MVP.</div>`;
  const pod=rows.slice(0,3), order=[pod[1],pod[0],pod[2]].filter(Boolean);
  return `<div class="sec-h"><h2>Ranking MVP de la temporada</h2></div><div class="podium">${order.map(x=>{ const i=rows.indexOf(x), ph=photos[x.p.id]?.t||photos[x.p.id]?.d; return `<button class="pod p${i+1}" data-player="${esc(x.p.id)}"><span class="pod-ph">${ph?`<img src="${esc(ph)}" alt="">`:`<i>${esc(x.p.name.split(' ').map(y=>y[0]).slice(0,2).join(''))}</i>`}</span><span class="pod-n">${esc(x.p.name)}</span><span class="pod-b"><b>${x.m}</b> MVP<small>${x.v} votos</small></span><span class="pod-s">${i+1}</span></button>`; }).join('')}</div>
    ${compact||rows.length<=3? '' : `<table style="margin-top:18px"><thead><tr><th>Jugador</th><th>MVP</th><th>Votos</th></tr></thead><tbody class="stagger">${rows.map(x=>`<tr><td>${plink(x.p.id)}</td><td><b>${x.m}</b></td><td>${x.v}</td></tr>`).join('')}</tbody></table>`}
    <p class="source">Un voto por jugador en cada jornada. Gana el más votado.</p>`;
}
function aPreguntas(){
  const sc=v=>Object.entries(SCOPE_LABEL).map(([k,l])=>`<option value="${k}" ${v===k?'selected':''}>${l}</option>`).join('');
  const ty=v=>[['scale','Nota 1-10'],['player','Elegir jugador'],['text','Texto libre']].map(([k,l])=>`<option value="${k}" ${v===k?'selected':''}>${l}</option>`).join('');
  return `<div><p class="muted small" style="margin-top:0">«Sobre tus compañeros» se publica como votos agregados y solo deja elegir entre los que jugaron. «Sobre el equipo» como nota media. «Sobre ti» y «Comentarios» son privados.</p>
    <div id="qlist">${S.survey.questions.map((q,i)=>`<div class="qedit" data-i="${i}"><input type="text" name="text" value="${esc(q.text)}" aria-label="Pregunta"><select name="scope">${sc(q.scope)}</select><select name="type">${ty(q.type)}</select><button class="iconbtn" data-act="q-del" data-i="${i}" aria-label="Eliminar">✕</button></div>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn ghost sm" data-act="q-add">Añadir pregunta</button><button class="btn brass" data-act="q-save">Guardar preguntas</button><button class="btn ghost sm" data-act="q-reset">Restaurar</button></div></div>`;
}
function aPlantilla(){
  return `<section class="sec"><div class="sec-h"><h2>Plantilla</h2><span class="muted small">${S.players.length} jugadores</span></div>${accTeamRequests()}<p class="muted small">Los capitanes pueden pedir disponibilidad, convocar, poner resultados y publicar el MVP. Cada jugador sube su foto y su teléfono desde «Yo»; el teléfono solo lo ven los administradores.</p>
    <div id="plist">${S.players.slice().sort((a,b)=>a.order-b.order).map(p=>`<div class="pedit" data-id="${esc(p.id)}">
      <button class="phbtn" data-act="crop" data-target="${esc(p.id)}" title="Subir o recortar la foto">${avatar(p)}<span>${photos[p.id]?'Cambiar':'Subir'} foto</span></button>
      <div class="pf"><label>Nombre<input type="text" name="name" value="${esc(p.name)}"></label><label>Nombre completo<input type="text" name="full" value="${esc(p.full)}"></label></div>
      <div class="pf sm"><label>Orden<input type="number" name="order" value="${p.order}"></label><label>Categoría<input type="text" name="cat" value="${esc(p.cat)}"></label><label>Puntos FCT<input type="number" name="pts" value="${p.pts??0}"></label><label>Teléfono<input type="tel" name="phone" value="${esc(phones[p.id]||'')}" placeholder="+34 600 000 000"></label></div>
      <div class="row small" style="gap:12px">${canClub()? `<label title="Capitán oficial del equipo: al registrarse recibe el rol automáticamente"><input type="checkbox" name="official" value="${esc(p.id)}" ${accOfficial(S).includes(p.id)?'checked':''}> Capitán oficial</label>` : ''}<label ${accOfficial(S).includes(p.id)?'title="Capitán oficial"':''}><input type="checkbox" name="captain" value="${esc(p.id)}" ${(S.captains||[]).includes(p.id)||accOfficial(S).includes(p.id)?'checked':''} ${canClub()||(accIsOfficialCap()&&!accOfficial(S).includes(p.id)&&p.id!==me)?'':'disabled'}> ${accOfficial(S).includes(p.id)?'Capitán (oficial)':'Capitán'}</label><label><input type="checkbox" name="active" ${p.active!==false?'checked':''}> En plantilla</label>${photos[p.id]?`<button class="textlink" data-act="photo-del" data-target="${esc(p.id)}">Quitar foto</button>`:''}<span class="muted">${claims[p.id]? 'Entra como '+esc(claims[p.id].email) : 'Aún no ha entrado'}</span>${accInviteCell(p)}${claims[p.id]&&isAdmin?`<button class="textlink" data-act="unclaim" data-pid="${esc(p.id)}">Liberar acceso</button>`:''}</div></div>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn brass" data-act="players-save">Guardar plantilla</button></div>
    <div class="panel" style="margin-top:24px"><b>Añadir jugador</b><div class="row" style="margin-top:10px"><input type="text" id="np-name" placeholder="Nombre corto" style="max-width:200px"><input type="text" id="np-full" placeholder="Nombre completo" style="max-width:240px"><input type="text" id="np-cat" placeholder="Categoría" style="max-width:140px"><button class="btn sm" data-act="player-add">Añadir</button></div></div></section>`;
}
const FCT_GROUPS=CLUB.fctGroups||{};
const fctDefaultGroup = () => FCT_GROUPS[SEASON_PATH.split('/')[1]]||null;
function fctAgo(){ const L=S.fctLast; return L?.at? relTime(L.at) : null; }
function fctPanel(){ const L=S.fctLast, has=S.comp.fctGroup||fctDefaultGroup();
  const warn=[L?.diffs?.length? `La FCT tiene otro resultado en la jornada ${L.diffs.map(x=>x.j).join(', ')}` : '', L?.dateDiffs?.length? `La FCT tiene otra fecha u hora en la jornada ${L.dateDiffs.map(x=>x.j).join(', ')} (se mantiene la vuestra)` : '', L?.newTeams?.length? `Clubes nuevos añadidos: ${L.newTeams.join(', ')}` : ''].filter(Boolean);
  return `<div class="fctline"><span class="fdot ${has?(L?'ok':''):'off'}"></span><span>${has? (L? `FCT sincronizada ${esc(fctAgo())}: ${L.results||0} resultados y ${L.dates||0} fechas` : 'FCT: aún no se ha consultado') : 'FCT sin configurar: pon el código del grupo en «Configuración de la liga»'}</span><button class="btn ghost sm" data-act="fct-sync" ${has?'':'disabled'}>Actualizar</button></div>
    ${warn.length? `<p class="notice" style="margin:8px 0 0">${warn.map(esc).join('. ')}.</p>` : ''}`; }
function aCalendario(){
  const topts=sel=>S.teams.map(t=>`<option value="${t.id}" ${sel===t.id?'selected':''}>${esc(t.short)}</option>`).join('');
  const js=[...new Set(S.fixtures.map(f=>f.j))].sort((a,b)=>a-b), nx=nextPoloFix(), open=ui.calOpen;
  const editor=j=>{ const fs=S.fixtures.filter(f=>f.j===j);
    return `<div class="caledit"><div id="flist">${fs.map(f=>`<div class="qedit" data-k="${S.fixtures.indexOf(f)}" style="grid-template-columns:140px 90px 1fr 1fr 60px 60px 40px"><input type="date" name="date" value="${f.date}"><input type="time" name="time" value="${f.time}"><select name="home">${topts(f.home)}</select><select name="away">${topts(f.away)}</select><input type="number" name="hs" min="0" max="5" value="${f.hs??''}" aria-label="Local"><input type="number" name="as" min="0" max="5" value="${f.as??''}" aria-label="Visitante"><button class="iconbtn" data-act="fix-del" data-k="${S.fixtures.indexOf(f)}" aria-label="Quitar enfrentamiento">✕</button></div>`).join('')}</div>
      <div class="row" style="margin-top:10px"><button class="btn brass sm" data-act="fixtures-save" data-j="${j}">Guardar jornada ${j}</button><button class="btn sm ghost" data-act="fix-add" data-j="${j}">Añadir enfrentamiento</button><label class="small">Mover toda la jornada al <input type="date" id="jdate" style="max-width:170px"></label><button class="btn sm ghost" data-act="jdate" data-j="${j}">Aplicar</button></div></div>`; };
  const row=j=>{ const fs=S.fixtures.filter(f=>f.j===j), f=poloFix(j)||fs[0]; if(!f) return '';
    const isP=f.home===POLO||f.away===POLO, p=isP? persp(f) : null, pl=isPlayed(f), mv=f.moved?.from&&f.moved.from!==f.date;
    const st= pl? (f.status==='official'? ['ok','Oficial'] : ['prov','Provisional']) : nx&&nx.j===j? ['next','Próxima'] : mv? ['mv',f.date<f.moved.from?'Adelantada':'Aplazada'] : daysTo(f)<0? ['late','Sin resultado'] : ['fut',''];
    const others=fs.filter(x=>x!==f), oPlayed=others.filter(isPlayed).length;
    return `<li class="calrow ${st[0]} ${open===j?'open':''}"><button class="calhead" data-act="cal-pick" data-j="${j}" aria-expanded="${open===j}">
      <span class="cj">J${j}</span><span class="cd">${esc(fdate(f,{weekday:'short',day:'numeric',month:'short'}))}<small>${esc(f.time)} h</small></span>
      <span class="cm">${isP? `${crest(p.rival)}<b>${p.home?''+US+' – '+esc(team(p.rival).short):esc(team(p.rival).short)+' – '+US+''}</b>` : '<b class="muted">Descansa el '+US+'</b>'}</span>
      <span class="cr">${pl&&isP? `<b class="${p.ps>p.rs?'w':'l'}">${p.ps}-${p.rs}</b>` : ''}</span>
      <span class="cs">${st[1]?`<em class="cst ${st[0]}">${st[1]}</em>`:''}<small>${others.length? `resto ${oPlayed}/${others.length}` : ''}</small></span></button>
      ${open===j? editor(j) : ''}</li>`; };
  const cfg=`<div class="sec-h"><h3>Competición</h3></div>
    <div class="tfields"><label>Nombre<input type="text" id="c-name" value="${esc(S.comp.name)}"></label><label>Grupo<input type="text" id="c-group" value="${esc(S.comp.group)}"></label><label>Memorial o subtítulo<input type="text" id="c-mem" value="${esc(S.comp.memorial||'')}"></label><label>Código del grupo en la FCT<input type="text" inputmode="numeric" id="c-fct" value="${esc(String(S.comp.fctGroup||fctDefaultGroup()||''))}" placeholder="Por ejemplo, 4622"></label></div>
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-act="comp-save">Guardar competición</button></div>
    <div class="sec-h" style="margin-top:22px"><h3>Clubes</h3></div><div id="tlist">${S.teams.map(t=>`<div class="qedit" data-id="${t.id}" style="grid-template-columns:1fr 1fr 90px 40px"><input type="text" name="name" value="${esc(t.name)}" aria-label="Nombre del club"><input type="text" name="short" value="${esc(t.short)}" aria-label="Nombre corto"><input type="text" name="abbr" value="${esc(t.abbr)}" aria-label="Siglas">${t.id===POLO?'<span></span>':`<button class="iconbtn" data-act="team-del" data-id="${t.id}" aria-label="Quitar club">✕</button>`}</div>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-act="teams-save">Guardar clubes</button><input type="text" id="nt-name" placeholder="Nuevo club" style="max-width:220px"><button class="btn sm ghost" data-act="team-add">Añadir club</button></div>
    <div class="sec-h" style="margin-top:22px"><h3>Clasificación oficial a mano</h3></div><p class="muted small">Solo si la FCT no la trae: copia el orden publicado. Mientras corresponda a la última jornada disputada, la app lo respeta.</p>
    <label class="f">Tras la jornada</label><input type="number" id="off-j" min="0" max="${NJ()}" value="${S.official?.asOf??''}" style="max-width:100px">
    <div id="offlist" style="margin-top:8px">${S.teams.map((_,i)=>`<div class="row" style="padding:4px 0"><span style="width:24px">${i+1}</span><select style="max-width:280px">${topts(S.official?.order?.[i])}</select></div>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-act="official-save">Guardar orden oficial</button></div>`;
  return `<section class="sec"><div class="sec-h"><h2>${esc(S.comp.name)}</h2><span class="muted small">${js.length} jornadas</span></div>${fctPanel()}
    <ul class="callist">${js.map(row).join('')}</ul>
    <div class="row" style="margin-top:12px"><button class="btn sm ghost" data-act="jornada-add">Añadir jornada</button><span class="muted small">Toca una jornada para editar fechas y resultados.</span></div></section>
  <section class="sec">${fold('liga-cfg','Configuración de la liga','Competición, código FCT, clubes y clasificación a mano',cfg)}</section>`;
}
const currentSeason = () => meta?.current || SEASON_ID;
const clubTeams = () => { const base=(Array.isArray(meta?.teams) && meta.teams.length)? meta.teams : [], gone=new Set(meta?.removedTeams||[]); return [...base, ...DEFAULT_CLUB_TEAMS.filter(d=>!base.some(t=>t.id===d.id))].filter(t=>!gone.has(t.id)).map(t=>({gender:'',...t})); };
const curTeam = () => clubTeams().find(t=>t.id===teamId) || clubTeams()[0];
const teamLabel = () => curTeam()?.short || CLUB.teamShort;
const teamCat = t => [t?.cat, (t?.gender||'').toLowerCase()].filter(Boolean).join(' ');
function aTemporadas(){
  const list=meta?.seasons?.length? meta.seasons : [SEASON_ID], R=S.rules, ar=R.autoRemind||{};
  const MSG_KINDS=[['req','Solicitud de disponibilidad'],['rem','Recordatorio al grupo'],['remOne','Recordatorio individual'],['lineup','Anuncio de convocatoria'],['survey','Aviso de encuesta'],['mvp','Aviso de votación MVP'],['summary','Resumen de la jornada']];
  const pick=MSG_KINDS.some(x=>x[0]===ui.msgPick)? ui.msgPick : 'req';
  const varsOf=k=>[...new Set(((DEFAULT_MSGS[k]||'')+(S.msgs[k]||'')).match(/\{[a-zA-Z]+\}/g)||[])];
  const msgs=`<div class="chips msgpick">${MSG_KINDS.map(([k,l])=>`<button class="chip" data-act="msg-pick" data-v="${k}" aria-pressed="${k===pick}">${l}</button>`).join('')}</div>
    ${MSG_KINDS.map(([k,l])=>`<div class="msged" data-msg="${k}" ${k===pick?'':'hidden'}><textarea id="msg-${k}" rows="7" aria-label="${l}">${esc(S.msgs[k])}</textarea>
      <div class="varchips"><span class="muted small">Insertar:</span>${varsOf(k).map(v=>`<button class="vchip" data-act="msg-var" data-k="${k}" data-v="${v}">${v}</button>`).join('')}</div></div>`).join('')}
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-act="msgs-save">Guardar mensajes</button><button class="btn ghost sm" data-act="msgs-reset">Restaurar los originales</button></div>`;
  const plazos=`<div class="sgrid"><label>Avisar en la app<span><input type="number" id="r-av" value="${R.availDays}" min="1" max="21"> días antes</span></label>
      <label>Plazo para responder<span><input type="number" id="r-dd" value="${R.deadlineDays}" min="0" max="14"> días antes, a las <input type="time" id="r-dt" value="${esc(R.deadlineTime)}"></span></label></div>
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-act="rules-save">Guardar</button></div>`;
  const punt=`<div class="sgrid"><label>Victoria<span><input type="number" id="r-win" value="${R.win}"> puntos</span></label><label>Derrota<span><input type="number" id="r-loss" value="${R.loss}"> puntos</span></label>
      <label>Dobles<select id="r-dbl"><option value="always" ${!dblDecider()?'selected':''}>Cuentan siempre que se jueguen</option><option value="decider" ${dblDecider()?'selected':''}>Solo cuentan si queda 2-2</option></select></label>
      <label>Votación MVP abierta<span><input type="number" id="r-mvp" value="${R.mvpHours||48}" min="1" max="240"> horas tras el resultado</span></label></div>
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-act="rules-save">Guardar</button></div>`;
  const quien=`<label class="row" style="gap:10px;flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" id="team-manage" ${teamMode()?'checked':''}> <span><b>Todo el equipo</b> puede gestionar jornadas, convocatorias, resultados, MVP, calendario, plantilla y fotos.<br><span class="muted small">Si lo desactivas, solo los capitanes marcados y los administradores. Las respuestas de la encuesta y los votos siguen siendo privados.</span></span></label><div class="row" style="margin-top:10px"><button class="btn brass sm" data-act="team-save">Guardar</button></div>`;
  const foto=`${photos._team?`<img src="${esc(photos._team.d)}" alt="" style="border-radius:12px;max-height:200px;object-fit:cover;width:100%">`:'<p class="muted small" style="margin:0">Sale a pantalla completa en la portada y como fondo opcional de los carteles.</p>'}
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-act="crop" data-target="_team">${photos._team?'Cambiar':'Subir'} foto</button>${photos._team?'<button class="btn ghost sm" data-act="photo-del" data-target="_team">Quitar</button>':''}</div>`;
  const temps=`<table><tbody>${list.map(id=>`<tr><td><b>${esc(id)}</b>${id===currentSeason()?' <span class="tag">actual</span>':''}${id===viewSeason?' <span class="tag">viendo</span>':''}</td><td>${id!==viewSeason?`<button class="btn sm ghost" data-act="season-view" data-id="${esc(id)}">Ver</button>`:''} ${id!==currentSeason()?`<button class="btn sm ghost" data-act="season-current" data-id="${esc(id)}">Hacer actual</button>`:''}</td></tr>`).join('')}</tbody></table>
    <p class="muted small" style="margin:14px 0 8px"><b>Nueva temporada.</b> Las anteriores se conservan enteras. La nueva copia plantilla y clubes; el calendario empieza vacío.</p>
    <div class="row"><input type="text" id="ns-id" placeholder="2027-28" style="max-width:140px"><label class="small"><input type="checkbox" id="ns-copy" checked> Copiar plantilla y clubes</label><button class="btn sm" data-act="season-new">Crear temporada</button></div>`;
  const sw=`<label class="sw" aria-label="Activar recordatorios automáticos"><input type="checkbox" data-ar="on" ${ar.on?'checked':''}><i></i></label>`;
  return `<section class="sec"><div class="slist">
    ${fold('s-ar','Automatizaciones y WhatsApp',(()=>{ const c=autoCfg(), w=waCfg(); return (c.on? `Recordatorios ${c.firstAfterH} h sin responder, después ${(+c.every)===1?'cada día':'cada '+c.every+' días'}, máximo ${c.max}` : 'En pausa')+(w.group?' · grupo vinculado':' · sin grupo'); })(),autoSettings(),false,`<label class="sw" aria-label="Activar las automatizaciones"><input type="checkbox" data-ax="on" ${autoCfg().on?'checked':''}><i></i></label>`)}
    ${fold('s-cap','Convocatorias y sugerencias',capSettingsSub(),capSettings())}
    ${fold('s-plazos','Plazos de disponibilidad',`Aviso ${R.availDays} días antes · plazo ${R.deadlineDays} días antes, a las ${esc(R.deadlineTime)}`,plazos)}
    ${fold('s-punt','Puntuación y MVP',`Victoria ${R.win}, derrota ${R.loss} · dobles ${dblDecider()?'solo si 2-2':'siempre'} · MVP ${R.mvpHours||48} h`,punt)}
    ${fold('s-msgs','Mensajes de WhatsApp',`${MSG_KINDS.length} plantillas${MSG_KINDS.some(([k])=>S.msgs[k]!==DEFAULT_MSGS[k])?' · personalizadas':''}`,msgs)}
    ${fold('s-enc','Encuesta postpartido',`${S.survey.questions.length} preguntas`,aPreguntas())}
    ${fold('s-foto','Foto del equipo',photos._team?'Subida':'Sin foto',foto,false,photos._team?`<img class="sthumb" src="${esc(photos._team.d)}" alt="">`:'')}
    ${isAdmin? fold('s-quien','Quién gestiona',teamMode()?'Todo el equipo':'Capitanes y administradores',quien) : ''}
    ${isAdmin? fold('s-temps','Temporadas',`${esc(currentSeason())} (actual)${viewSeason!==currentSeason()?' · viendo '+esc(viewSeason):''}`,temps) : ''}
  </div></section>`;
}
const vNotFound = () => `<div class="wrap"><div class="pagehead"><h1>No encontrado</h1><p class="lede"><a class="textlink" href="#inicio">Volver al inicio</a></p></div></div>`;

