/* ===================== GESTIÓN DEPORTIVA DEL CLUB ===================== */
let isManager=false, clubData={}, clubSubs=[], clubKey='', roster=null;
// Lista de nombres de todos los equipos (solo nombre e id), para que cualquier jugador pueda elegir su nombre al entrar
function rosterAll(){ const out=new Map(); const add=(tid,list)=>(list||[]).forEach(p=>{ if(!out.has(p.id)) out.set(p.id,{...p,teams:[tid]}); else if(!out.get(p.id).teams.includes(tid)) out.get(p.id).teams.push(tid); });
  Object.entries(roster?.teams||{}).forEach(([t,l])=>add(t,l));
  if(IS_POLO && !roster?.teams?.['polo-a']) add('polo-a', seed().players.map(p=>({id:p.id,name:p.name,order:p.order})));
  if(S.players.length && !roster?.teams?.[teamId]) add(teamId, S.players.map(p=>({id:p.id,name:p.name,order:p.order})));
  return [...out.values()]; }
function syncRoster(){ if(B.mode!=='firebase'&&B.mode!=='demo') return; const list=S.players.filter(p=>p.active!==false).map(p=>({id:p.id,name:p.name,order:p.order||0}));
  roster={...(roster||{}), teams:{...(roster?.teams||{}), [teamId]:list}}; B.merge('public/roster',{teams:{[teamId]:list}}).catch(()=>{}); }
const canClub = () => isAdmin || isManager;
function checkManager(m){ const em=(authUser?.email||'').toLowerCase(); isManager = (!!(em && (m?.managerEmails||[]).includes(em)) && !accMemberOff()) || accIsMemberGestor(); }   // gestores de la lista o aprobados (access.js)
function ensureClubSubs(){ const key=clubTeams().map(t=>t.id).join(',')+'|'+viewSeason; if(key===clubKey) return; clubKey=key;
  clubSubs.forEach(u=>{ try{u()}catch(e){} }); clubSubs=[]; clubData={};
  clubTeams().forEach(t=>clubSubs.push(B.watchDoc('seasons/'+docIdFor(t.id,viewSeason), d=>{ clubData[t.id]= d? normalize(clone(d)) : null; softRender(); }))); }
function withS(d,fn){ const keep=S; S=d; try{ return fn(); } finally { S=keep; } }
const ymd = d => { const x=new Date(d); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); };
function weekendSat(ref){ const x=new Date(ref||Date.now()); x.setHours(12,0,0,0); const day=x.getDay(); x.setDate(x.getDate()+(day===6?0:day===0?-1:-(day+1))); return x; }
function weekendRange(satIso){ const sat=new Date(satIso+'T12:00:00'), fri=new Date(sat), sun=new Date(sat); fri.setDate(sat.getDate()-1); sun.setDate(sat.getDate()+1); return {from:ymd(fri), to:ymd(sun), sat, sun}; }
function tieState(d,f){ return withS(d,()=>{ const p=persp(f), tr=tieFromRubbers(f.j)||{}, t=tie(f.j), r=(t?.rubbers||[]).map(x=>({x,c:rubberCalc(x)})).filter(y=>y.c.res);
  const singles=r.filter(y=>y.x.type==='S').length, dbl=r.filter(y=>y.x.type==='D').length;
  const future=new Date(f.date+'T23:59:00').getTime()>Date.now();
  let st = p.played? (p.ps>p.rs?'win':'loss') : future? 'next' : 'pending';
  return {p, rival:clubName(p.rival), st, confirm: p.played && f.status!=='official', singles, dbl, partial: !p.played && tr.decided>0}; }); }
const ST_LABEL={win:'Victoria',loss:'Derrota',pending:'Pendiente de resultado',next:'Programada'};
const CLUB_TABS=[['club','Inicio','M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],['club-equipos','Equipos','M8 8a3.5 3.5 0 1 0 0-.01M2.5 20c.8-3.6 3.3-5.5 5.5-5.5s4.7 1.9 5.5 5.5M16 7a3 3 0 1 0 0-.01M15 14c2.6 0 5 1.6 6.5 5'],['club-fct','Federació','M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4'],['club-docs','Documentación','M6 2h9l5 5v15H6zM14 2v6h6'],['club-usuarios','Usuarios','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'],['club-resumen','Resumen','M4 20V10M10 20V4M16 20v-7M22 20H2'],['club-ajustes','Configuración','M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6']];
const clubRouteKey = r => String(r||'').replace(/^club-doc-.*/,'club-docs').replace(/^club-equipo-.*/,'club-equipos');
// Dentro de la gestión deportiva, la barra superior (y la inferior en el móvil) muestra SUS apartados, no los del equipo
function setNavMode(club){
  const top=$('.topnav'), bar=$('.tabbar'); if(!top||!bar) return;
  if(!ui.navOrig) ui.navOrig={top:top.innerHTML, bar:bar.innerHTML};
  if(club && !ui.navClub){ ui.navClub=true;
    top.innerHTML=CLUB_TABS.map(([k,l])=>`<a href="#${k}" data-club="${k}">${l}</a>`).join('');
    bar.innerHTML=CLUB_TABS.map(([k,l,d])=>`<a href="#${k}" data-club="${k}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>${l==='Documentación'?'Docs':l==='Configuración'?'Ajustes':l==='Federació'?'FCT':l}</a>`).join(''); }
  else if(!club && ui.navClub){ ui.navClub=false; top.innerHTML=ui.navOrig.top; bar.innerHTML=ui.navOrig.bar; }
  if(club){ const k=clubRouteKey(route()), fr=fctOverview().rev>0; document.querySelectorAll('[data-club]').forEach(a=>{ a.dataset.club===k? a.setAttribute('aria-current','page') : a.removeAttribute('aria-current'); if(a.dataset.club==='club-fct') a.classList.toggle('has-dot',fr); }); }
}
function clubNav(){ return ''; }
function clubWeekRows(){
  const sat=ui.clubSat||ymd(weekendSat()), rg=weekendRange(sat), out=[], idle=[];
  clubTeams().forEach(t=>{ const d=clubData[t.id]; if(ui.clubTeam && ui.clubTeam!==t.id) return; if(ui.clubCat && t.cat!==ui.clubCat) return;
    if(!d){ idle.push({t, why: clubData.hasOwnProperty(t.id)? 'Sin calendario cargado' : 'Cargando…'}); return; }
    const fx=d.fixtures.filter(f=>(f.home===POLO||f.away===POLO) && f.date>=rg.from && f.date<=rg.to);
    if(!fx.length){ idle.push({t, why: d.fixtures.length? 'No juega este fin de semana' : 'Sin calendario cargado'}); return; }
    fx.forEach(f=>{ const s=tieState(d,f); if(ui.clubRes && ui.clubRes!==(s.confirm?'confirm':s.st)) return; out.push({t,d,f,s}); }); });
  return {rg, sat, rows:out, idle};
}
function clubAttention(){ const out=[], today=ymd(new Date()), lim=ymd(new Date(Date.now()-28*864e5)); ensureClubDocs();
  clubTeams().forEach(t=>{ const d=clubData[t.id];
    if(!d || !d.fixtures.length){ if(clubData.hasOwnProperty(t.id)) out.push({lvl:'info', t:`${t.short}: falta cargar el calendario y la plantilla`, href:'#club-docs', tid:t.id, go:'docs'}); return; }
    d.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&f.date<today&&f.date>=lim).forEach(f=>{ const s=tieState(d,f);
      if(s.st==='pending') out.push({lvl:'warn', t:`${t.short}, jornada ${f.j} contra ${s.rival}: sin resultado`, href:'#club-equipo-'+t.id});
      else if(s.confirm) out.push({lvl:'info', t:`${t.short}, jornada ${f.j}: resultado ${s.p.ps}-${s.p.rs} pendiente de validar`, href:'#club-equipo-'+t.id}); });
    const fi=fctTeamInfo(t), L=fi.L, un=L?.actas?.unmatched?.length||0;
    if(d.fctError && (!L || d.fctError.at>L.at)) out.push({lvl:'warn', t:`${t.short}: la sincronización con la FCT ha fallado (${d.fctError.msg})`, href:'#club-fct'});
    if(fi.k.rev) out.push({lvl:'warn', t:`${t.short}: la FCT tiene datos distintos en ${fi.k.rev} ${fi.k.rev===1?'partido':'partidos'}`, href:'#club-fct'});
    if(un) out.push({lvl:'info', t:`${t.short}: ${un} ${un===1?'jugador de las actas no está':'jugadores de las actas no están'} en la plantilla`, href:'#club-fct'});
    if(fi.grp && (!L || Date.now()-L.at>36*3600e3)) out.push({lvl:'info', t:`${t.short}: ${L? 'sin sincronizar con la FCT desde '+relTime(L.at) : 'aún no se ha sincronizado con la FCT'}`, href:'#club-fct'});
    const rv=Object.values(clubDocs[t.id]||{}).filter(x=>x.status==='revision'||x.status==='error').length;
    if(rv) out.push({lvl:'info', t:`${t.short}: ${rv} ${rv===1?'documento':'documentos'} por revisar`, href:'#club-docs', tid:t.id, go:'docs'}); });
  return out.sort((a,b)=>(a.lvl==='warn'?0:1)-(b.lvl==='warn'?0:1)); }
function vClub(){
  if(!canClub()) return `<div class="wrap"><div class="pagehead"><h1>Gestión deportiva</h1></div><div class="notice">Esta zona es para el gestor deportivo del club y los administradores.</div></div>`;
  ensureClubSubs(); const W=clubWeekRows(), rows=W.rows, all=clubTeams();
  const k={teams:all.length, played:rows.filter(r=>r.s.p.played).length, win:rows.filter(r=>r.s.st==='win').length, loss:rows.filter(r=>r.s.st==='loss').length,
    pending:rows.filter(r=>r.s.st==='pending').length, confirm:rows.filter(r=>r.s.confirm).length};
  const fmt=d=>d.toLocaleDateString('es-ES',{day:'numeric',month:'long'});
  const cats=[...new Set(all.map(t=>t.cat).filter(Boolean))];
  const next=all.map(t=>{ const d=clubData[t.id]; if(!d) return null; const f=d.fixtures.filter(x=>(x.home===POLO||x.away===POLO)&&!isPlayed(x)&&x.date>=ymd(new Date())).sort((a,b)=>a.date.localeCompare(b.date))[0]; return f? {t,d,f} : null; }).filter(Boolean);
  return `<div class="wrap club"><div class="pagehead"><p class="qsec">${esc(CLUB.name)}</p><h1>Inicio</h1><p class="lede">Todos los equipos del club en la Lliga Catalana, temporada ${esc(viewSeason)}.</p></div>${cmSetupCard()}
  ${fctHero()}
  
  <section class="sec"><div class="wknav"><button class="btn ghost sm" data-act="club-wk" data-d="-7" aria-label="Fin de semana anterior">‹</button><div><span class="muted small">Fin de semana</span><b>${fmt(W.rg.sat)} y ${fmt(W.rg.sun)}</b></div><button class="btn ghost sm" data-act="club-wk" data-d="7" aria-label="Fin de semana siguiente">›</button>
    <input type="date" data-act="club-date" value="${W.sat}" aria-label="Elegir fecha" style="max-width:170px"><button class="btn ghost sm" data-act="club-wk" data-d="0">Último</button></div>
    <div class="row" style="margin-top:10px"><select data-act="club-f" data-k="clubTeam" style="max-width:220px"><option value="">Todos los equipos</option>${all.map(t=>`<option value="${esc(t.id)}" ${ui.clubTeam===t.id?'selected':''}>${esc(t.short)}</option>`).join('')}</select>
      ${cats.length>1?`<select data-act="club-f" data-k="clubCat" style="max-width:220px"><option value="">Todas las categorías</option>${cats.map(c=>`<option ${ui.clubCat===c?'selected':''}>${esc(c)}</option>`).join('')}</select>`:''}
      <select data-act="club-f" data-k="clubRes" style="max-width:220px"><option value="">Todos los resultados</option>${[['win','Victorias'],['loss','Derrotas'],['pending','Pendientes de resultado'],['confirm','Por confirmar'],['next','Programadas']].map(([v,l])=>`<option value="${v}" ${ui.clubRes===v?'selected':''}>${l}</option>`).join('')}</select></div></section>
  ${(()=>{ const at=clubAttention(); return `<section class="sec"><div class="sec-h"><h2>Requiere atención</h2></div>${at.length? `<ul class="attn">${at.slice(0,8).map(x=>`<li class="${x.lvl}"><a href="${x.href}" ${x.go==='docs'?`data-act="club-doc-team-go" data-t="${esc(x.tid)}"`:''}>${esc(x.t)}<span>›</span></a></li>`).join('')}</ul>` : '<p class="attn-ok">✓ Nada pendiente: resultados, validaciones y documentos al día.</p>'}</section>`; })()}
  <section class="sec"><div class="mdkpis four stagger"><div><b>${k.played}<small>/${k.teams}</small></b><span>equipos han competido</span></div><div><b style="color:var(--win)">${k.win}</b><span>victorias</span></div><div><b style="color:var(--loss)">${k.loss}</b><span>derrotas</span></div><div><b>${k.pending+k.confirm}</b><span>por cerrar o validar</span></div></div></section>
  <section class="sec"><div class="sec-h"><h2>Equipos del fin de semana</h2><a href="#club-resumen">Resumen para imprimir</a></div>
    ${rows.length? `<div class="ccards stagger">${rows.map(({t,d,f,s})=>`<a class="ccard ${s.st}" href="#club-equipo-${esc(t.id)}">
      <span class="cc-top"><b>${esc(t.name)}</b><small>${esc(teamCat(t))}</small></span>
      <span class="cc-vs">${crest(POLO,'sm')} ${esc(CLUB.medium)} <i>contra</i> ${esc(s.rival)}</span>
      <span class="cc-date">Jornada ${f.j}, ${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h, ${s.p.home?'en casa':'fuera'}</span>
      <span class="cc-res">${s.p.played? `${US} ${s.p.ps}-${s.p.rs}` : s.partial? 'En curso' : '–'}</span>
      <span class="cc-badges"><span class="ccb ${s.st}">${ST_LABEL[s.st]}</span>${s.confirm?'<span class="ccb confirm">Pendiente de confirmar</span>':''}</span>
      <span class="cc-meta">${s.singles} ${s.singles===1?'individual':'individuales'} y ${s.dbl} ${s.dbl===1?'dobles':'dobles'} con resultado</span></a>`).join('')}</div>` : '<div class="empty">Ningún equipo con eliminatoria en este fin de semana con los filtros elegidos.</div>'}
    ${W.idle.length? `<div class="idle"><span class="muted small">Sin eliminatoria:</span> ${W.idle.map(x=>`<a class="chip" href="#club-equipo-${esc(x.t.id)}">${esc(x.t.short)}: <span class="muted">${esc(x.why)}</span></a>`).join('')}</div>` : ''}</section>
  <section class="sec"><div class="split"><div><div class="sec-h"><h2>Próximas jornadas</h2></div>${next.length? `<ul class="insights">${next.map(({t,d,f})=>`<li><b>${esc(t.short)}</b> contra ${esc(withS(d,()=>clubName(persp(f).rival)))}<small>Jornada ${f.j}, ${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h</small></li>`).join('')}</ul>` : '<div class="empty">Sin jornadas programadas.</div>'}</div>
    <div><div class="sec-h"><h2>Última actividad</h2></div><ul class="insights">${all.map(t=>{ const d=clubData[t.id], a=d?.audit?.[0]; return `<li><b>${esc(t.short)}</b>: ${d?.updatedAt? 'actualizado '+relTime(d.updatedAt) : 'sin datos'}${a? `<small>${esc(a.by)}: ${esc(a.what.join(', '))}</small>` : ''}</li>`; }).join('')}</ul></div></div></section></div>`;
}
function clubTeamRow(t){ const d=clubData[t.id];
  if(!d) return {t, cat:t.cat||'', gender:t.gender||'', caps:'', n:0, next:null, nextTxt:'Sin calendario', act:'sin', actTxt:'Sin datos', upd:0};
  const nx=d.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&!isPlayed(f)&&f.date>=ymd(new Date())).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const pend=d.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&f.date<ymd(new Date())&&!isPlayed(f)).length;
  const upd=d.updatedAt||0, days=upd? (Date.now()-upd)/864e5 : 999;
  const act= !d.fixtures.length? 'sin' : pend? 'pend' : days<=14? 'ok' : 'idle';
  return {t, cat:t.cat||'', gender:t.gender||'', caps:(d.captains||[]).map(id=>withS(d,()=>pname(id))).join(', '), n:d.players.filter(p=>p.active!==false).length,
    next:nx? nx.date : null, nextTxt: nx? `J${nx.j}, ${withS(d,()=>fdate(nx,{day:'numeric',month:'short'}))}, contra ${withS(d,()=>clubName(persp(nx).rival))}` : (d.fixtures.length? 'Temporada acabada' : 'Sin calendario'),
    act, actTxt:{ok:'Al día',pend:pend+' sin resultado',idle:'Sin cambios recientes',sin:'Sin calendario'}[act], upd};
}
function vClubEquipos(){
  if(!canClub()) return vClub(); ensureClubSubs();
  const view=ui.eqView||(()=>{ try{ return localStorage.getItem('polo-eqview')||'cards'; }catch(e){ return 'cards'; } })();
  let rows=clubTeams().map(clubTeamRow);
  const cats=[...new Set(rows.map(r=>r.cat).filter(Boolean))], gens=[...new Set(rows.map(r=>r.gender).filter(Boolean))];
  if(ui.eqCat) rows=rows.filter(r=>r.cat===ui.eqCat); if(ui.eqGen) rows=rows.filter(r=>r.gender===ui.eqGen);
  const sk=ui.eqSort||'name', dir=ui.eqDir||1, val=r=>sk==='n'?r.n: sk==='next'?(r.next||'9999'): sk==='act'?r.act: sk==='cat'?r.cat+r.gender : r.t.name;
  rows.sort((a,b)=>{ const x=val(a), y=val(b); return (x>y?1:x<y?-1:0)*dir; });
  const th=(k,l)=>`<th><button data-act="eq-sort" data-v="${k}">${l}${sk===k?(dir>0?' ↑':' ↓'):''}</button></th>`;
  const filters=`<div class="row eqtools"><div class="seg" role="group" aria-label="Vista"><button data-act="eq-view" data-v="cards" aria-pressed="${view==='cards'}">Tarjetas</button><button data-act="eq-view" data-v="table" aria-pressed="${view==='table'}">Tabla</button></div>
    <select data-act="eq-sortsel" aria-label="Ordenar">${[['name','Ordenar por nombre'],['cat','Por categoría'],['n','Por jugadores'],['next','Por próxima jornada'],['act','Por actividad']].map(([k,l])=>`<option value="${k}" ${sk===k?'selected':''}>${l}</option>`).join('')}</select>
    ${cats.length>1?`<select data-act="eq-f" data-k="eqCat" aria-label="Categoría"><option value="">Todas las categorías</option>${cats.map(c=>`<option ${ui.eqCat===c?'selected':''}>${esc(c)}</option>`).join('')}</select>`:''}
    ${gens.length>1?`<select data-act="eq-f" data-k="eqGen" aria-label="Género"><option value="">Todos los géneros</option>${gens.map(g=>`<option ${ui.eqGen===g?'selected':''}>${esc(g)}</option>`).join('')}</select>`:''}</div>`;
  const cards=`<div class="ccards stagger">${rows.map(r=>{ const d=clubData[r.t.id]; if(!d) return `<a class="ccard idle" href="#club-equipo-${esc(r.t.id)}"><span class="cc-top"><b>${esc(r.t.name)}</b><small>${esc(teamCat(r.t))}</small></span><span class="cc-meta">Sin calendario ni plantilla cargados todavía</span></a>`;
      const st=withS(d,()=>standings()), me_=st.find(x=>x.id===POLO)||{}, ts=withS(d,()=>teamStats());
      return `<a class="ccard" href="#club-equipo-${esc(r.t.id)}"><span class="cc-top"><b>${esc(r.t.name)}</b><small>${esc(teamCat(r.t))}${d.comp?.group? ', '+esc(d.comp.group):''}</small></span>
        <span class="cc-res">${me_.pj? me_.pos+'º' : '–'}<small> ${me_.pts||0} pts</small></span><span class="cc-meta">${r.n} jugadores. Eliminatorias ${ts.tw}-${ts.tl}, partidos ${ts.rw}-${ts.rl}.</span><span class="cc-badges"><span class="ccb act-${r.act}">${esc(r.actTxt)}</span>${autoBadges(d)}</span></a>`; }).join('')}</div>`;
  const table=`<table class="eqtable"><thead><tr>${th('name','Equipo')}${th('cat','Categoría')}<th>Capitán</th>${th('n','Jugadores')}${th('next','Próxima jornada')}${th('act','Actividad')}</tr></thead><tbody>
    ${rows.map(r=>`<tr data-href="#club-equipo-${esc(r.t.id)}"><td data-l="Equipo"><a href="#club-equipo-${esc(r.t.id)}"><b>${esc(r.t.name)}</b></a></td><td data-l="Categoría">${esc(teamCat(r.t))||'–'}</td><td data-l="Capitán">${esc(r.caps)||'<span class="muted">Sin asignar</span>'}</td><td data-l="Jugadores">${r.n}</td><td data-l="Próxima jornada">${esc(r.nextTxt)}</td><td data-l="Actividad"><span class="ccb act-${r.act}">${esc(r.actTxt)}</span></td></tr>`).join('')}</tbody></table>`;
  return `<div class="wrap club"><div class="pagehead"><h1>Equipos</h1><p class="lede">Equipos del ${esc(CLUB.medium)} en la Lliga Catalana, temporada ${esc(viewSeason)}.</p><a class="btn brass" href="#club-fct" data-act="fct-find" style="margin-top:12px">Dar de alta equipos</a></div>
    <section class="sec">${filters}<div style="margin-top:12px">${view==='table'? table : cards}</div></section>${fctHero()}</div>`;
}

function vClubTeam(tid){
  if(!canClub()) return vClub(); ensureClubSubs(); const t=clubTeams().find(x=>x.id===tid); if(!t) return vNotFound(); const d=clubData[tid];
  const head=`<div class="wrap club"><div class="pagehead"><a class="textlink" href="#club-equipos">← Equipos</a><h1 style="margin-top:10px">${esc(t.name)}</h1><p class="lede">${esc(t.cat||'')}${d?.comp?.group? ', '+esc(d.comp.group):''}. Temporada ${esc(viewSeason)}.</p>
    <div class="row" style="margin-top:12px"><button class="btn brass" data-act="team-open" data-t="${esc(tid)}">Abrir la app del equipo</button><button class="btn ghost" data-act="team-docs" data-t="${esc(tid)}">Documentación</button></div></div>`;
  if(!d) return head+`<section class="sec"><div class="empty">Este equipo aún no tiene calendario ni plantilla cargados. Ábrelo y cárgalos desde Gestión, o envía los documentos de la FCT.</div></section></div>`;
  return withS(d,()=>{ const st=standings(), mine=st.find(r=>r.id===POLO)||{}, ts=teamStats(), caps=(d.captains||[]).map(pname);
    const fx=d.fixtures.filter(f=>f.home===POLO||f.away===POLO).sort((a,b)=>a.j-b.j);
    const pend=fx.filter(f=>{ const s=tieState(d,f); return s.confirm || s.st==='pending' || (isPlayed(f) && !(tieFromRubbers(f.j)||{}).decided); });
    const last=[...fx].reverse().find(f=>isPlayed(f));
    return head+`<section class="sec"><div class="mdkpis stagger"><div><b>${(mine.pj||mine.off)? mine.pos+'º':'–'}</b><span>clasificación</span></div><div><b>${mine.pts||0}</b><span>puntos</span></div><div><b>${ts.tw}-${ts.tl}</b><span>eliminatorias</span></div><div><b>${ts.rw}-${ts.rl}</b><span>partidos</span></div><div><b>${d.players.length}</b><span>jugadores</span></div><div class="${pend.length?'warn':''}"><b>${pend.length}</b><span>por validar</span></div></div></section>
    <section class="sec"><div class="split"><div><div class="sec-h"><h2>Jornadas</h2></div>${fx.length? `<div class="tscroll"><table><thead><tr><th>J</th><th class="l">Fecha</th><th class="l">Rival</th><th>Resultado</th><th class="l">Estado</th><th>Ind.</th><th>Dob.</th></tr></thead><tbody>${fx.map(f=>{ const s=tieState(d,f); return `<tr><td>${f.j}</td><td class="l">${esc(fdate(f))}</td><td class="l">${esc(s.rival)}</td><td>${s.p.played? s.p.ps+'-'+s.p.rs : '–'}</td><td class="l"><span class="ccb ${s.st}">${ST_LABEL[s.st]}</span>${s.confirm?' <span class="ccb confirm">Por confirmar</span>':''}</td><td>${s.singles}</td><td>${s.dbl}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">Sin calendario.</div>'}</div>
      <div><div class="sec-h"><h2>Clasificación</h2></div>${st.length>1? standingsTable(st,true) : '<div class="empty">Sin clasificación.</div>'}</div></div></section>
    ${last? `<section class="sec"><div class="sec-h"><h2>Última eliminatoria: jornada ${last.j}</h2></div><p class="lede" style="margin:0 0 8px">${US} ${persp(last).ps}-${persp(last).rs} ${esc(clubName(persp(last).rival))}, ${esc(fdate(last,{day:'numeric',month:'long'}))}.</p>${(tie(last.j)?.rubbers||[]).map((r,i)=>((r.polo||[]).length||rubberCalc(r).res)? rubberRow(r,i,last) : '').join('') || '<div class="empty">Sin partidos introducidos.</div>'}</section>` : ''}
    <section class="sec"><div class="split"><div><div class="sec-h"><h2>Plantilla</h2></div><p class="muted small" style="margin-top:-6px">Capitán: ${caps.length? esc(caps.join(', ')) : 'sin asignar'}</p>
      ${d.players.length? `<div class="tscroll"><table><thead><tr><th>Jugador</th><th>Cat.</th><th>Individuales</th><th>Dobles</th></tr></thead><tbody>${d.players.filter(p=>p.active!==false).sort((a,b)=>a.order-b.order).map(p=>{ const a=playerStats(p.id), b=playerStats(p.id,null,'D'); return `<tr><td>${esc(p.name)}</td><td>${esc(p.cat||'')}</td><td>${a.w}-${a.l}</td><td>${b.w}-${b.l}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">Sin plantilla.</div>'}</div>
      <div><div class="sec-h"><h2>Pendiente de validar</h2></div>${pend.length? `<ul class="insights">${pend.map(f=>{ const s=tieState(d,f); return `<li>Jornada ${f.j} contra ${esc(s.rival)}<small>${s.confirm? 'Resultado provisional, falta confirmarlo como oficial' : s.st==='pending'? 'Sin resultado' : 'Marcador sin los partidos individuales'}</small></li>`; }).join('')}</ul>` : '<div class="empty">Nada pendiente.</div>'}
      <div class="sec-h" style="margin-top:20px"><h2>Documentación</h2><a href="#club-docs" data-act="club-f-team" data-t="${esc(tid)}">Ver documentos</a></div>${(()=>{ ensureClubDocs(); const ds=Object.values(clubDocs[tid]||{}); return ds.length? `<p class="small">${ds.length} ${ds.length===1?'documento':'documentos'}${ds.filter(x=>x.status==='revision').length? ', '+ds.filter(x=>x.status==='revision').length+' por revisar':''}.</p>` : '<p class="muted small">Sin documentos.</p>'; })()}
      <div class="sec-h" style="margin-top:20px"><h2>Últimas actualizaciones</h2></div>${(d.audit||[]).length? `<ul class="insights">${d.audit.slice(0,8).map(a=>`<li>${esc(a.what.join(', '))}<small>${esc(a.by)}, ${relTime(a.at)}</small></li>`).join('')}</ul>` : '<div class="empty">Sin cambios registrados todavía.</div>'}</div></div></section></div>`; });
}
/* ===================== INFORME EJECUTIVO SEMANAL (PDF) ===================== */
const PDFMAKE={js:'https://cdn.jsdelivr.net/npm/pdfmake@0.2.10/build/pdfmake.min.js', fonts:'https://cdn.jsdelivr.net/npm/pdfmake@0.2.10/build/vfs_fonts.js'};
const RC={navy:'#12284C',crimson:'#9E1B32',gold:'#B08D3C',ink:'#1C2430',grey:'#6B7280',line:'#D9DEE6',soft:'#F3F5F8',win:'#1F6B45'};
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function weekendLabel(rg){ const a=rg.sat, b=rg.sun; return a.getMonth()===b.getMonth()? `${a.getDate()}–${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}` : `${a.getDate()} ${MESES[a.getMonth()]}–${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}`; }
// ---- datos del fin de semana: solo lo registrado en la app (misma fuente que el Resumen)
const onceColl = path => new Promise(ok=>{ let u=null, done=false; const fin=m=>{ if(done) return; done=true; try{ u&&u(); }catch(e){} ok(m||{}); }; u=B.watchColl(path, fin); setTimeout(()=>fin({}),6000); });
function teamWeekFacts(t,d,f,s,av){ return withS(d,()=>{
  const tt=tie(f.j)||{rubbers:[]}, rub=(tt.rubbers||[]).map((r,i)=>({type:r.type,n:r.n,label:RUBBERS[i]?.label||'',players:(r.polo||[]).map(pname),c:rubberCalc(r),note:r.note||''}));
  const mk=x=>({n:x.n,label:x.label,jugadores:x.players,marcador:x.c.sets.map(z=>z.join('-')).join(' ')||'',resultado:x.c.res==='W'?'ganado':x.c.res==='L'?'perdido':'sin resultado',nota:x.note});
  const singles=rub.filter(x=>x.type==='S'&&(x.players.length||x.c.res)).map(mk), doubles=rub.filter(x=>x.type==='D'&&(x.players.length||x.c.res)).map(mk);
  const st=standings(), mine=st.find(r=>r.id===POLO)||{}, evo=playedJornadas().map(j=>({j,pos:standings(j).find(r=>r.id===POLO)?.pos})).filter(x=>x.pos);
  // balance de temporada separado
  let ssw=0,ssl=0,sdw=0,sdl=0; const seq=[];
  S.fixtures.filter(x=>(x.home===POLO||x.away===POLO)&&isPlayed(x)).sort((a,b)=>a.j-b.j).forEach(x=>{ const p=persp(x); seq.push(p.ps>p.rs?'G':'P'); (tie(x.j)?.rubbers||[]).forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; if(r.type==='S') c.res==='W'?ssw++:ssl++; else c.res==='W'?sdw++:sdl++; }); });
  let streak=0; for(let i=seq.length-1;i>=0&&seq[i]===seq[seq.length-1];i--) streak++;
  const wsw=singles.filter(x=>x.resultado==='ganado').length, wsl=singles.filter(x=>x.resultado==='perdido').length, wdw=doubles.filter(x=>x.resultado==='ganado').length, wdl=doubles.filter(x=>x.resultado==='perdido').length;
  const players=new Set([...singles,...doubles].flatMap(x=>x.jugadores));
  const cr=tt.captainReport||null, tr=tieFromRubbers(f.j)||{}, k=jid(f.j);
  return { id:t.id, equipo:t.name, categoria:teamCat(t), capitan:(d.captains||[]).map(pname).join(', '), rival:s.rival, jornada:f.j, fecha:fdate(f,{weekday:'long',day:'numeric',month:'long'}), hora:f.time, casa:s.p.home,
    resultado: s.p.played? `${s.p.ps}-${s.p.rs}` : null, estado: s.st==='win'?'victoria':s.st==='loss'?'derrota':'pendiente', validado: s.p.played && f.status==='official',
    convocados:(tt.convocados||[]).map(pname), individuales:singles, dobles:doubles,
    fin_de_semana:{individuales:`${wsw}-${wsl}`, dobles:`${wdw}-${wdl}`, jugadores_utilizados:players.size},
    temporada:{individuales:`${ssw}-${ssl}`, dobles:`${sdw}-${sdl}`, eliminatorias:`${seq.filter(x=>x==='G').length}-${seq.filter(x=>x==='P').length}`, racha: seq.length>=3? `${streak} ${seq[seq.length-1]==='G'?'victorias':'derrotas'} seguidas` : null},
    clasificacion: (mine.pj||mine.off)? {posicion:mine.pos, puntos:mine.pts, jugadas:mine.pj, equipos:st.length, tabla:st.slice(0,10).map(r=>({pos:r.pos,club:clubName(r.id),pts:r.pts,pj:r.pj,nuestro:r.id===POLO}))} : null,
    evolucion: evo.length>=2? evo : [],
    informe_capitan: cr? Object.fromEntries(Object.entries(cr).filter(([k])=>!['by','at'].includes(k))) : null, informe_por: cr?.by||null,
    disponibilidad: (()=>{ const keep=avail; avail=av||{}; const a=availFor(f.j); avail=keep; const prob=[];
      if(a.total && a.yes.length<4) prob.push(`solo ${a.yes.length} ${a.yes.length===1?'jugador disponible':'jugadores disponibles'}`);
      if(a.none.length && deadlinePassed(f.j)) prob.push(`${a.none.length} sin responder al cerrar el plazo`);
      if(a.maybe.length) prob.push(`${a.maybe.length} pendientes de confirmar`);
      return {disponibles:a.yes.length, no_disponibles:a.no.length, pendientes:a.maybe.length, sin_respuesta:a.none.length, plantilla:a.total, convocados:(tt.convocados||[]).length, problemas:prob}; })(),
    pendientes: { sin_validar: s.p.played && f.status!=='official', partidos_incompletos: !tr.complete && !!(tr.decided||s.p.played), mvp_sin_publicar: s.p.played && !S.published[k]?.mvp, sin_informe_capitan: !cr } }; }); }
async function reportFacts(sat){
  const rg=weekendRange(sat), out=[], next=[], ns=new Date(sat+'T12:00:00'); ns.setDate(ns.getDate()+7); const rn=weekendRange(ymd(ns));
  for(const t of clubTeams()){ const d=clubData[t.id]; if(!d) continue;
    const fx=d.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&f.date>=rg.from&&f.date<=rg.to).map(f=>({f,s:tieState(d,f)})).filter(x=>x.s.st!=='next');
    const av= fx.length? await onceColl('seasons/'+docIdFor(t.id,viewSeason)+'/avail') : {};
    fx.forEach(({f,s})=>out.push(teamWeekFacts(t,d,f,s,av)));
    d.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&f.date>=rn.from&&f.date<=rn.to).forEach(f=>withS(d,()=>{ const p=persp(f); const ACT=['Confirmar el calendario','Pedir la disponibilidad','Cerrar la disponibilidad','Publicar la convocatoria']; const ph=phases(f.j).slice(0,4).map((x,i)=>x.st!=='done'? ACT[i] : null).filter(Boolean);
      next.push({equipo:t.name, jornada:f.j, fecha:fdate(f,{weekday:'long',day:'numeric',month:'long'}), hora:f.time, rival:clubName(p.rival), casa:p.home, tareas:ph}); })); }
  ensureClubDocs(); const docsPend=clubTeams().flatMap(t=>Object.values(clubDocs[t.id]||{}).filter(x=>x.status==='revision'||x.status==='error').map(x=>({equipo:t.name, documento:x.name, estado:DOC_ST[x.status]||x.status})));
  const sum=k=>out.reduce((a,x)=>{ const [w,l]=x.fin_de_semana[k].split('-').map(Number); return [a[0]+w,a[1]+l]; },[0,0]);
  const tot={equipos:out.length, victorias:out.filter(x=>x.estado==='victoria').length, derrotas:out.filter(x=>x.estado==='derrota').length, empates:0, pendientes:out.filter(x=>x.estado==='pendiente').length,
    sin_validar:out.filter(x=>x.pendientes.sin_validar).length, individuales:sum('individuales').join('-'), dobles:sum('dobles').join('-')};
  return {club:CLUB.name, temporada:viewSeason, fin_de_semana:weekendLabel(rg), sat, totales:tot, equipos:out, proximo_fin_de_semana:{fechas:weekendLabel(rn), eliminatorias:next}, documentacion_pendiente:docsPend};
}
// ---- textos de respaldo si la IA no está disponible: solo datos, sin interpretación
function factualTexts(F){ const T=F.totales;
  const r={resumen_ejecutivo: !T.equipos? 'No hubo eliminatorias de equipos del club este fin de semana.' : `${T.equipos} ${T.equipos===1?'equipo compitió':'equipos compitieron'} este fin de semana: ${T.victorias} ${T.victorias===1?'victoria':'victorias'}, ${T.derrotas} ${T.derrotas===1?'derrota':'derrotas'} y ${T.pendientes} ${T.pendientes===1?'resultado pendiente':'resultados pendientes'}. Balance de individuales ${T.individuales} y de dobles ${T.dobles}.${T.sin_validar? ` ${T.sin_validar} ${T.sin_validar===1?'resultado está':'resultados están'} pendientes de validación.`:''}`,
    conclusiones: F.equipos.map(x=>`${x.equipo}: ${x.resultado? (x.estado==='victoria'?'victoria ':'derrota ')+x.resultado : 'resultado pendiente'} contra ${x.rival}${x.validado?'':' (pendiente de validación)'}.`),
    sintesis_capitan:{}, areas_mejora:[], seguimiento:[]};
  F.equipos.forEach(x=>{ if(x.pendientes.sin_validar) r.seguimiento.push(`Validar el resultado de ${x.equipo} (jornada ${x.jornada}).`); if(x.pendientes.sin_informe_capitan) r.seguimiento.push(`Pedir el informe postpartido al capitán de ${x.equipo}.`); if(x.pendientes.mvp_sin_publicar) r.seguimiento.push(`Publicar el MVP de ${x.equipo}.`); });
  return r; }
// ---- PDF
async function crestPng(h=300){ const im=await new Promise((ok,ko)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=ko; i.src=ASSET.crest||ASSET.crestSm; }); const c=document.createElement('canvas'); const k=h/im.height; c.width=Math.round(im.width*k); c.height=h; c.getContext('2d').drawImage(im,0,0,c.width,c.height); return c.toDataURL('image/png'); }
const buildReportDoc=(F,A,crest)=>ReportDoc.build(F,A,crest);   // composición del PDF en report-doc.js (compartida con el envío automático)
const b64OfBlob = blob => new Promise((ok,ko)=>{ const r=new FileReader(); r.onload=()=>ok(String(r.result).split(',')[1]); r.onerror=ko; r.readAsDataURL(blob); });
async function buildWeekendPdf(sat, onStep){
  const step=t=>{ try{ onStep&&onStep(t); }catch(e){} };
  step('Recopilando los datos del fin de semana…'); ensureClubSubs(); ensureClubDocs();
  const F=await reportFacts(sat);
  step('Redactando las conclusiones…'); let A=null, aiNote='';
  try{ const tok=await B.idToken(); const r=await fetch('/api/write-report',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({facts:F})});
    const j=await r.json().catch(()=>({})); if(r.ok && j.ok) A={...j.data,_ia:true}; else aiNote=j.error||('Error '+r.status); }catch(e){ aiNote=e.message; }
  const fb=factualTexts(F); if(!A) A=fb; else { if(!A.resumen_ejecutivo) A.resumen_ejecutivo=fb.resumen_ejecutivo; if(!A.seguimiento?.length) A.seguimiento=fb.seguimiento; }
  step('Componiendo el PDF…'); await loadScript(PDFMAKE.js); await loadScript(PDFMAKE.fonts);
  if(!window.pdfMake?.createPdf) throw new Error('No se ha podido cargar el generador de PDF');
  const crest=await crestPng(320), doc=buildReportDoc(F,A,crest);
  const blob=await new Promise((ok,ko)=>{ const to=setTimeout(()=>ko(new Error('El PDF tarda demasiado en generarse')),30000); try{ pdfMake.createPdf(doc).getBlob(b=>{ clearTimeout(to); ok(b); }); }catch(e){ clearTimeout(to); ko(e); } });
  if(!blob || blob.size<1500) throw new Error('El PDF generado está vacío');
  const b64=await b64OfBlob(blob);
  return {blob, b64, file:`Weekend_Sports_Report_${CLUB.fileTag}_${sat}.pdf`, ia:!!A._ia, aiNote, teams:F.totales.equipos};
}
/* ---------- Envío del resumen por correo ---------- */
let mailInfo=null, reportLog={}, reportSub=null;
async function mailStatus(){ if(mailInfo) return mailInfo; try{ const r=await fetch('/api/send-report'); mailInfo=r.ok? await r.json() : {configured:false}; }catch(e){ mailInfo={configured:false}; } softRender(); return mailInfo; }
function ensureReportLog(){ if(reportSub) return; reportSub=B.watchColl('reports', m=>{ reportLog=m; softRender(); }); }
function reportData(){
  const W=clubWeekRows(), rows=W.rows, fmt=d=>d.toLocaleDateString('es-ES',{day:'numeric',month:'long'});
  const items=rows.map(({t,d,f,s})=>withS(d,()=>{ const tt=tie(f.j); let sw=0,sl=0,dw=0,dl=0; const S_=[],D_=[];
    (tt?.rubbers||[]).forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; const line={who:(r.polo||[]).map(pname).join(' y '),n:r.n,res:c.res,sets:c.sets.map(x=>x.join('-')).join(' ')};
      if(r.type==='S'){ c.res==='W'? sw++ : sl++; S_.push(line); } else { c.res==='W'? dw++ : dl++; D_.push(line); } });
    return {team:t.name, rival:s.rival, j:f.j, date:fdate(f,{weekday:'long',day:'numeric',month:'long'}), res:s.p.played? `${s.p.ps}-${s.p.rs}` : '–', st:ST_LABEL[s.st]+(s.confirm?', por confirmar':''), sw,sl,dw,dl,S_,D_}; }));
  const win=rows.filter(r=>r.s.st==='win').length, loss=rows.filter(r=>r.s.st==='loss').length, next=rows.filter(r=>r.s.st==='next').length, pend=rows.filter(r=>r.s.st==='pending'||r.s.confirm).length;
  return {range:`${fmt(W.rg.sat)} y ${fmt(W.rg.sun)}`, items, win, loss, next, pend};
}
function reportEmail(extra, attach){
  const R=reportData(), subject=`Resumen del fin de semana (${R.range}), ${CLUB.medium}`;
  const text=[`RESUMEN DEL FIN DE SEMANA: ${R.range}`, `Eliminatorias: ${R.items.length}. Victorias: ${R.win}. Derrotas: ${R.loss}. Programadas: ${R.next}. Pendientes: ${R.pend}.`, extra? '\n'+extra : '', '',
    ...R.items.map(x=>`${x.team} contra ${x.rival} (jornada ${x.j}, ${x.date}): ${x.res}. ${x.st}. Individuales ${x.sw}-${x.sl}, dobles ${x.dw}-${x.dl}.`+(x.S_.length? '\n'+x.S_.map(m=>`  ${m.res==='W'?'G':'P'} ${m.who}, individual ${m.n}: ${m.sets}`).join('\n'):'')+(x.D_.length? '\n'+x.D_.map(m=>`  ${m.res==='W'?'G':'P'} Dobles ${m.who}: ${m.sets}`).join('\n'):'')),
    '', attach? 'Se adjunta el informe completo en PDF: '+attach : '', 'Detalle completo en la app: '+location.origin+'/#club-resumen'].join('\n');
  const td='style="padding:6px 8px;border-bottom:1px solid #e3e6df;font-size:14px"';
  const html=`<div style="font-family:Arial,Helvetica,sans-serif;color:#13261F;max-width:640px">
    <p style="font-size:12px;color:#94722A;text-transform:uppercase;letter-spacing:.06em;margin:0">${esc(CLUB.name)}, gestión deportiva</p>
    <h1 style="font-size:24px;margin:4px 0 2px">Resumen del fin de semana</h1><p style="margin:0 0 14px;color:#5b6b63">${esc(R.range)}</p>
    ${extra? `<p style="background:#f4f1e8;padding:10px 12px;border-radius:8px">${esc(extra).replace(/\n/g,'<br>')}</p>` : ''}
    <p><b>${R.items.length}</b> eliminatorias: <b style="color:#2F7D4F">${R.win} victorias</b>, <b style="color:#B4472F">${R.loss} derrotas</b>, ${R.next} programadas, ${R.pend} pendientes.</p>
    ${R.items.length? `<table style="border-collapse:collapse;width:100%"><tr><th align="left" ${td}>Equipo</th><th align="left" ${td}>Rival</th><th ${td}>Resultado</th><th align="left" ${td}>Estado</th><th ${td}>Ind.</th><th ${td}>Dob.</th></tr>
      ${R.items.map(x=>`<tr><td ${td}>${esc(x.team)}</td><td ${td}>${esc(x.rival)}</td><td align="center" ${td}><b>${esc(x.res)}</b></td><td ${td}>${esc(x.st)}</td><td align="center" ${td}>${x.sw}-${x.sl}</td><td align="center" ${td}>${x.dw}-${x.dl}</td></tr>`).join('')}</table>` : '<p>No hubo eliminatorias este fin de semana.</p>'}
    ${R.items.filter(x=>x.S_.length||x.D_.length).map(x=>`<h3 style="font-size:16px;margin:18px 0 4px">${esc(x.team)}</h3>${x.S_.map(m=>`<div style="font-size:14px;padding:2px 0">${m.res==='W'?'✅':'❌'} ${esc(m.who)}, individual ${m.n}: ${esc(m.sets)}</div>`).join('')}${x.D_.map(m=>`<div style="font-size:14px;padding:2px 0">${m.res==='W'?'✅':'❌'} Dobles, ${esc(m.who)}: ${esc(m.sets)}</div>`).join('')}`).join('')}
    ${attach? `<p style="margin-top:18px;padding:10px 12px;border:1px solid #d9dee6;border-radius:8px">📎 Se adjunta el informe completo en PDF: <b>${esc(attach)}</b></p>` : ''}
    <p style="margin-top:20px"><a href="${esc(location.origin)}/#club-resumen" style="color:#94722A">Ver el detalle en la app</a></p>
    <p style="font-size:12px;color:#8a978f">Generado con los resultados registrados en la app. Los marcados como pendientes aún no están confirmados.</p></div>`;
  return {subject, text, html};
}
function mailPanel(){
  ensureReportLog(); mailStatus();
  const my=(authUser?.email||'').toLowerCase(), mgr=(meta?.managers||[]).filter(x=>x.email);
  const opts=[...mgr.map(x=>({email:x.email,label:(x.name? x.name+', ' : '')+x.email})), ...(my && !mgr.some(x=>x.email===my)? [{email:my,label:'Yo, '+my}] : [])];
  ui.mailTo ||= new Set(mgr.slice(0,1).map(x=>x.email));
  const log=Object.entries(reportLog).map(([id,x])=>({id,...x})).sort((a,b)=>b.at-a.at).slice(0,5);
  const ok=mailInfo?.configured;
  return `<section class="sec noprint"><div class="panel"><b>Enviar el resumen por correo</b>
    ${opts.length? `<div class="mailto">${opts.map(o=>`<label><input type="checkbox" data-act="mail-to" value="${esc(o.email)}" ${ui.mailTo.has(o.email)?'checked':''}> ${esc(o.label)}</label>`).join('')}</div>` : '<p class="muted small">Aún no hay gestores con correo. Añádelos en Configuración.</p>'}
    <textarea id="mail-extra" rows="2" placeholder="Mensaje opcional (se añade al principio)">${esc(ui.mailExtra||'')}</textarea>
    <div class="row" style="margin-top:10px"><button class="btn brass" data-act="mail-send" ${ok&&ui.mailTo.size&&!ui.mailSending?'':'disabled'}>${ui.mailSending?'Enviando…':'Enviar desde la app'}</button><button class="btn ghost" data-act="mail-open" ${ui.mailTo.size&&!ui.mailSending?'':'disabled'}>Abrir en mi correo</button></div>
    <p class="muted small" style="margin:6px 0 0">«Enviar desde la app» adjunta automáticamente el informe en PDF (Weekend Sports Report). «Abrir en mi correo» no puede adjuntar archivos.</p>
    ${ui.mailSending? `<p class="small" style="margin:8px 0 0"><span class="spin"></span> ${esc(ui.mailStep||'')}</p>` : ''}
    ${ui.mailErr? `<div class="vbox err" style="margin-top:8px">${esc(ui.mailErr)}</div>` : ''}
    ${ui.lastPdf? `<p class="small" style="margin:8px 0 0">Último PDF enviado: <a href="${ui.lastPdf.url}" download="${esc(ui.lastPdf.file)}">${esc(ui.lastPdf.file)}</a>${ui.lastPdf.ia? '' : ' (conclusiones generadas solo con datos'+(ui.lastPdf.aiNote? ': la IA no respondió' : '')+')'}</p>` : ''}
    <p class="muted small" style="margin:8px 0 0">${ok? `Se enviará desde <b>${esc(mailInfo.from||'el correo configurado')}</b>. Solo se puede enviar a gestores del club o a ti.` : mailInfo? 'El envío automático aún no está configurado (falta el correo de envío en Vercel). Mientras tanto, «Abrir en mi correo» lo deja escrito en tu Mail o Gmail para que lo envíes tú.' : 'Comprobando…'}</p>
    ${log.length? `<p class="small" style="margin:12px 0 4px"><b>Últimos envíos</b></p><ul class="insights">${log.map(x=>`<li>${x.status==='enviado'?'✓':'✗'} ${esc((x.to||[]).join(', '))}<small>${esc(x.range||'')}, ${relTime(x.at)}, ${esc(x.by||'')}${x.status==='enviado'? (x.attachment? ', con '+esc(x.attachment) : '') : ': '+esc(x.error||'error')}</small></li>`).join('')}</ul>` : ''}</div></section>`;
}
async function mailSend(){
  const to=[...ui.mailTo]; if(!to.length) return toast('Elige al menos un destinatario');
  if(ui.mailSending) return; const extra=$('#mail-extra')?.value.trim()||''; ui.mailExtra=extra; ui.mailErr=null;
  const sat=ui.clubSat||ymd(weekendSat()), R=reportData();
  ui.mailSending=true; ui.mailStep='Generando el informe PDF…'; renderQuiet();
  // 1) PDF: si no se puede generar, NO se envía el correo
  let pdf=null;
  try{ pdf=await buildWeekendPdf(sat, t=>{ ui.mailStep=t; renderQuiet(); }); }
  catch(e){ ui.mailSending=false; ui.mailStep=''; ui.mailErr='No se ha podido generar el informe PDF ('+(e.message||e)+'). No se ha enviado nada. Pulsa «Enviar desde la app» para reintentar.'; renderQuiet(); return; }
  // 2) correo de siempre, con el PDF adjunto
  ui.mailStep='Enviando el correo…'; renderQuiet();
  const m=reportEmail(extra, pdf.file);
  const base={at:Date.now(), by:authUser?.email||'', to, range:R.range, subject:m.subject, attachment:pdf.file, attachmentSize:pdf.blob.size, aiText:pdf.ia};
  try{ const tok=await B.idToken(); const r=await fetch('/api/send-report',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},
      body:JSON.stringify({to,subject:m.subject,html:m.html,text:m.text,attachments:[{filename:pdf.file,content:pdf.b64,contentType:'application/pdf'}]})});
    const j=await r.json().catch(()=>({})); if(!r.ok || !j.ok) throw new Error(j.error||('Error '+r.status));
    await B.set('reports/'+Date.now().toString(36),{...base,status:'enviado',provider:j.provider||'',messageId:j.id||''}).catch(()=>{});
    if(ui.lastPdf?.url) URL.revokeObjectURL(ui.lastPdf.url); ui.lastPdf={url:URL.createObjectURL(pdf.blob), file:pdf.file, ia:pdf.ia, aiNote:pdf.aiNote};
    toast('Enviado a '+to.join(', ')+' con el PDF adjunto');
  }catch(e){ ui.mailErr='No se ha enviado: '+(e.message||e); await B.set('reports/'+Date.now().toString(36),{...base,status:'error',error:String(e.message||e).slice(0,200)}).catch(()=>{}); toast(ui.mailErr); }
  ui.mailSending=false; ui.mailStep=''; renderQuiet();
}
function mailOpen(){ const to=[...ui.mailTo]; const m=reportEmail($('#mail-extra')?.value.trim()||'');
  let body=m.text; if(body.length>1800) body=body.slice(0,1750)+'\n…\nDetalle completo en la app: '+location.origin+'/#club-resumen';
  location.href=`mailto:${to.map(encodeURIComponent).join(',')}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(body)}`; }

function vClubResumen(){
  if(!canClub()) return vClub(); ensureClubSubs(); const W=clubWeekRows(), rows=W.rows, fmt=d=>d.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
  const win=rows.filter(r=>r.s.st==='win').length, loss=rows.filter(r=>r.s.st==='loss').length, pend=rows.filter(r=>r.s.st==='pending'||r.s.confirm).length;
  const perf=rows.map(({t,d,f})=>withS(d,()=>{ const tt=tie(f.j); const S_=[], D_=[]; (tt?.rubbers||[]).forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; (r.type==='S'?S_:D_).push({who:(r.polo||[]).map(pname).join(' y '), n:r.n, res:c.res, sets:c.sets.map(x=>x.join('-')).join(' ')}); }); return {t,S_,D_}; }));
  const played=rows.filter(r=>r.s.p.played);
  const concl = !rows.length? 'No hubo eliminatorias de equipos del club este fin de semana.'
    : `${played.length} ${played.length===1?'equipo compitió':'equipos compitieron'} este fin de semana: ${win} ${win===1?'victoria':'victorias'} y ${loss} ${loss===1?'derrota':'derrotas'}.${pend? ' Quedan '+pend+' '+(pend===1?'resultado':'resultados')+' por cerrar o confirmar.' : ''}`;
  return `<div class="wrap club report"><div class="pagehead noprint"></div>
    <div class="rep-head"><img src="${ASSET.crestSm}" alt=""><div><p class="qsec">${esc(CLUB.name)}, gestión deportiva</p><h1>Resumen del fin de semana</h1><p class="lede">${fmt(W.rg.sat)} y ${fmt(W.rg.sun)}. Temporada ${esc(viewSeason)}.</p></div></div>
    <div class="row noprint" style="margin:6px 0 16px"><button class="btn ghost sm" data-act="club-wk" data-d="-7">‹ Anterior</button><button class="btn ghost sm" data-act="club-wk" data-d="7">Siguiente ›</button><button class="btn brass" data-act="club-print">Imprimir o guardar en PDF</button><button class="btn" data-act="mail-toggle">Enviar por correo</button></div>${ui.mailOpen? mailPanel() : ''}
    <section class="sec"><h2>1. Resumen</h2><div class="mdkpis"><div><b>${rows.length}</b><span>eliminatorias</span></div><div><b>${win}</b><span>victorias</span></div><div><b>${loss}</b><span>derrotas</span></div><div><b>${rows.filter(r=>r.s.st==='next').length}</b><span>programadas</span></div><div><b>${pend}</b><span>pendientes</span></div></div></section>
    <section class="sec"><h2>2. Resultados por equipo</h2>${rows.length? `<table><thead><tr><th>Equipo</th><th class="l">Rival</th><th>Resultado</th><th class="l">Estado</th><th>Ind.</th><th>Dob.</th></tr></thead><tbody>${rows.map(({t,d,f,s})=>{ const g=withS(d,()=>{ const tt=tie(f.j); let sw=0,sl=0,dw=0,dl=0; (tt?.rubbers||[]).forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; if(r.type==='S') c.res==='W'? sw++ : sl++; else c.res==='W'? dw++ : dl++; }); return {sw,sl,dw,dl}; });
      return `<tr><td>${esc(t.name)}</td><td class="l">${esc(s.rival)}</td><td>${s.p.played? s.p.ps+'-'+s.p.rs : '–'}</td><td class="l">${ST_LABEL[s.st]}${s.confirm?', por confirmar':''}</td><td>${g.sw}-${g.sl}</td><td>${g.dw}-${g.dl}</td></tr>`; }).join('')}</tbody></table>` : '<p class="muted">Sin eliminatorias.</p>'}</section>
    <section class="sec"><h2>3. Rendimiento de jugadores</h2>${perf.some(x=>x.S_.length||x.D_.length)? perf.map(x=>`<h3>${esc(x.t.name)}</h3>${x.S_.length?`<p class="small muted">Individuales</p><ul class="replist">${x.S_.map(m=>`<li><b>${m.res==='W'?'G':'P'}</b> ${esc(m.who)}, individual ${m.n}: ${esc(m.sets)}</li>`).join('')}</ul>`:''}${x.D_.length?`<p class="small muted">Dobles</p><ul class="replist">${x.D_.map(m=>`<li><b>${m.res==='W'?'G':'P'}</b> ${esc(m.who)}: ${esc(m.sets)}</li>`).join('')}</ul>`:''}`).join('') : '<p class="muted">Sin partidos individuales registrados.</p>'}</section>
    <section class="sec"><h2>4. Seguimiento</h2><ul class="insights">${clubTeams().map(t=>{ const d=clubData[t.id]; if(!d) return `<li><b>${esc(t.short)}</b>: sin calendario cargado.</li>`; const nx=d.fixtures.filter(x=>(x.home===POLO||x.away===POLO)&&!isPlayed(x)&&x.date>W.rg.to).sort((a,b)=>a.date.localeCompare(b.date))[0];
      return `<li><b>${esc(t.short)}</b>: ${nx? 'próxima jornada '+nx.j+' contra '+esc(withS(d,()=>clubName(persp(nx).rival)))+', '+esc(fdate(nx,{day:'numeric',month:'long'})) : 'sin próximas jornadas'}.</li>`; }).join('')}</ul></section>
    <section class="sec"><h2>5. Conclusión</h2><p>${esc(concl)}</p><p class="source">Informe generado a partir de los resultados registrados en la app. Solo incluye datos introducidos por los equipos; los marcados como pendientes aún no están confirmados.</p></section></div>`;
}
function vClubAjustes(){
  if(!canClub()) return vClub(); ensureClubSubs(); cmSubs();
  const m=meta||{}, teams=clubTeams(), mgr=m.managers||[];
  // Gestores de la lista (reciben el informe): solo los cambia un administrador. Los gestores aprobados o invitados están en Usuarios.
  const mgrSec=`<section class="sec"><div class="sec-h"><h2>Gestores deportivos</h2></div><p class="muted small">Ven todos los equipos del club, gestionan usuarios y reciben el informe semanal. Entran con su Google; no necesitan ser jugadores.${isAdmin?'':' Para invitar a otro gestor, ve a Usuarios.'}</p>
      ${mgr.length? `<ul class="insights">${mgr.map((x,i)=>`<li class="row" style="justify-content:space-between"><span><b>${esc(x.name||'')}</b> ${esc(x.email)}</span>${isAdmin?`<button class="btn sm ghost" data-act="mgr-del" data-i="${i}">Quitar</button>`:''}</li>`).join('')}</ul>` : '<div class="empty">Aún no hay gestores en la lista.</div>'}
      ${isAdmin?`<div class="row" style="margin-top:10px"><input type="text" id="mgr-name" placeholder="Nombre (por ejemplo, Albert)" style="max-width:200px"><input type="email" id="mgr-email" placeholder="correo@gmail.com" style="max-width:260px"><button class="btn sm brass" data-act="mgr-add">Añadir gestor</button></div>`:''}</section>`;
  return `<div class="wrap club"><div class="pagehead"><p class="qsec">${esc(CLUB.name)}</p><h1>Configuración</h1></div>
    ${cmSetupPanel()}
    ${cmIdentityPanel()}
    ${photoOptCard()}
    <section class="sec" id="ctlist"><div class="sec-h"><h2>Equipos del club</h2></div><p class="muted small">Cada equipo tiene su propia temporada: calendario, plantilla, resultados, disponibilidad y MVP. Jugadores, fotos y fichas son del club.</p>
      <div>${teams.map(t=>`<div class="qedit" data-id="${esc(t.id)}" style="grid-template-columns:1fr 110px 1fr 120px 92px"><input type="text" name="name" value="${esc(t.name)}" aria-label="Nombre"><input type="text" name="short" value="${esc(t.short)}" aria-label="Nombre corto"><input type="text" name="cat" value="${esc(t.cat||'')}" aria-label="Categoría" placeholder="Categoría"><select name="gender" aria-label="Género"><option value="">Género</option>${['Masculino','Femenino','Mixto'].map(g=>`<option ${t.gender===g?'selected':''}>${g}</option>`).join('')}</select>${t.id===MAIN_TEAM? '<span class="muted small" title="Su temporada es la ruta original de la app">Principal</span>' : `<button class="btn sm ghost danger" data-act="cteam-del" data-t="${esc(t.id)}" ${ui.teamDel===t.id?'disabled':''}>${ui.teamDel===t.id?'Eliminando…':'Eliminar'}</button>`}</div>`).join('')}</div>
      <div class="row" style="margin-top:10px"><button class="btn sm brass" data-act="cteams-save">Guardar equipos</button><input type="text" id="ct-name" placeholder="Nuevo equipo (por ejemplo, Veteranos +35)" style="max-width:280px"><input type="text" id="ct-short" placeholder="Nombre corto" style="max-width:140px"><button class="btn sm ghost" data-act="cteam-add">Añadir equipo</button></div></section>
    ${mgrSec}
    ${autoReportPanel()}
    ${accAdminPanels()}
    ${cmMigrationPanel()}</div>`;
}
// Informe semanal automático: el servidor lo genera y lo envía el domingo por la noche (api/fct-sync.js → api/_report.js)
function autoReportPanel(){ ensureFctCss(); ensureReportLog(); mailStatus(); const c=meta?.autoReport||{}, on=c.on!==false, mg=meta?.managerEmails||[], ok=mailInfo?.configured;
  const last=Object.values(reportLog).filter(x=>x.auto).sort((a,b)=>b.at-a.at)[0];
  return `<section class="sec"><div class="sec-h"><h2>Informe semanal automático</h2></div><div class="panel">
    <label class="chkline"><input type="checkbox" data-act="ar-on" ${on?'checked':''}> <span><b>Enviar el «Weekend Sports Report» sin pulsar nada</b>: el mismo correo con el PDF que «Enviar desde la app», después de sincronizar con la FCT.</span></label>
    <div class="row" style="margin-top:10px;gap:10px"><span class="small">Cuándo</span><select data-act="ar-day" style="max-width:260px" ${on?'':'disabled'}><option value="sun" ${c.day!=='mon'?'selected':''}>Domingo por la noche</option><option value="mon" ${c.day==='mon'?'selected':''}>Lunes por la noche</option></select>
      <button class="btn sm ghost" data-act="ar-send" ${ui.arSending||!ok||!mg.length?'disabled':''}>${ui.arSending? 'Generando y enviando…' : 'Enviar ahora'}</button></div>
    <p class="muted small" style="margin:8px 0 0">${mg.length? 'Destinatarios: los gestores ('+esc(mg.join(', '))+').' : 'Añade al menos un gestor con correo para que se envíe.'} ${mailInfo && !ok? '<b>Falta configurar el correo en Vercel</b> (SMTP_USER y SMTP_PASS, o RESEND_API_KEY y MAIL_FROM).' : ''}</p>
    ${last? `<p class="small" style="margin:6px 0 0">Último envío automático: ${last.status==='enviado'?'✓':'✗'} ${esc(last.range||'')}, ${relTime(last.at)}${last.error? ' ('+esc(last.error)+')' : ''}.</p>` : ''}</div></section>`; }
async function saveMeta(patch,msg){ const m={current:currentSeason(), seasons:meta?.seasons||[viewSeason], ...(meta||{}), ...patch}; meta=m; renderQuiet(); await safe(()=>B.set('meta/app',m),msg); }
function teamMenuHTML(){ const ts=accMyTeams(), inClub=route().startsWith('club'); return `${ts.map(t=>`<button data-act="team-pick" data-t="${esc(t.id)}" aria-pressed="${!inClub && t.id===teamId}"><b>${esc(t.short)}</b><small>${esc(t.name)}</small></button>`).join('')}${canClub()? `<a href="#club" data-act="team-menu-close" aria-pressed="${inClub}"><b>Gestión deportiva</b><small>Todos los equipos del club</small></a>` : ''}`; }

