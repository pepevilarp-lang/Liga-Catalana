/* =====================================================================
   Calendario de competición y Estadísticas del equipo (rediseño).
   Solo presentación: todos los datos salen de S.fixtures, S.ties, standings(),
   teamStats() y playerStats(), con las mismas reglas de cálculo que el resto de la app.
   Sin escudo oficial de un rival se muestra su monograma (no se inventan escudos);
   la sede es la del club local (no hay otro dato de ubicación).
   ===================================================================== */

/* ---------- utilidades ---------- */
const svIsUs = id => id===POLO;
const svName = id => svIsUs(id)? teamLabel() : (team(id).short || team(id).name);
const svCrest = (id, sz='md') => svIsUs(id)
  ? `<span class="svc ${sz} us"><img src="${esc(ASSET.crestSm)}" alt=""></span>`
  : `<span class="svc ${sz}" title="${esc(team(id).name)}"><i>${esc(team(id).abbr||'?')}</i></span>`;
const svCap = s => s? s.charAt(0).toUpperCase()+s.slice(1) : s;
const svDay = f => svCap(new Date(f.date+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long'}));
const svDate = (f,o={day:'numeric',month:'long'}) => new Date(f.date+'T12:00:00').toLocaleDateString('es-ES',o);
const svTime = f => f.time? esc(f.time)+' h' : '<span class="sv-tbc">Hora por confirmar</span>';
const svVenue = f => svIsUs(f.home)? (CLUB.medium||clubName(f.home)) : clubName(f.home);
const svMine = f => f.home===POLO || f.away===POLO;
const svByDate = (a,b) => kickoff(a)-kickoff(b) || a.j-b.j;
const svIdx = f => S.fixtures.indexOf(f);

// Estado de un enfrentamiento (de más a menos importante)
function svState(f){
  const st=String(f.status||'').toLowerCase(), nx=nextPoloFix();
  if(/susp/.test(st)) return {k:'sus', l:'Suspendido'};
  if(isPlayed(f)){
    const val = f.status==='official'? 'Oficial' : 'Provisional';
    if(!svMine(f)) return {k:'done', l:'Disputado', v:val};
    const p=persp(f); return p.ps>p.rs? {k:'win', l:'Victoria', v:val} : {k:'loss', l:'Derrota', v:val};
  }
  if(/aplaz|postp/.test(st) || (f.moved?.from && f.date>f.moved.from)) return {k:'post', l:'Aplazado', sub: f.moved?.from? 'Era el '+shortD(f.moved.from) : ''};
  if(nx && nx===f) return {k:'next', l:'Próximo partido'};
  if(kickoff(f).getTime() < Date.now()-8*3600e3) return {k:'wait', l:'Resultado pendiente'};
  return {k:'pend', l:'Pendiente'};
}

/* ---------- hoja de detalle ---------- */
function svSheet(){
  let bg=$('.sheet-bg'), sh=$('.sheet');
  if(!bg){ bg=document.createElement('div'); bg.className='sheet-bg'; sh=document.createElement('div'); sh.className='sheet'; sh.setAttribute('role','dialog'); sh.setAttribute('aria-modal','true'); document.body.append(bg,sh); bg.addEventListener('click',closeSheet); }
  return {bg,sh};
}
function svRubberLine(r,i,f){
  const c=rubberCalc(r), who=(r.polo||[]).length? r.polo.map(id=>esc(pname(id))).join(' y ') : '<span class="muted">Por designar</span>';
  const res=c.res? (c.res==='W'?'win':'loss') : '';
  return `<li class="${res}"><span class="sv-rn">${r.type==='D'?'D':r.n}</span><span class="sv-rp">${who}${r.note?`<small>${esc(r.note)}</small>`:''}</span><span class="sv-rs">${c.sets.length? c.sets.map(s=>s.join('-')).join(' ') : (isWO(r)? 'W.O.' : '–')}</span><span class="sv-rr">${c.res? (c.res==='W'?'Ganado':'Perdido') : ''}</span></li>`;
}
function svMatchSheet(i){
  const f=S.fixtures[i]; if(!f) return; const {bg,sh}=svSheet(), s=svState(f), mine=svMine(f), played=isPlayed(f);
  const side=(id,role)=>`<div class="sv-sd ${svIsUs(id)?'us':''}">${svCrest(id,'lg')}<b>${esc(svIsUs(id)? teamLabel() : team(id).name)}</b><small>${role}</small></div>`;
  let body='';
  if(mine){
    const t=tie(f.j), rubs=(t?.rubbers||[]).map((r,k)=>({r,k})), sg=rubs.filter(x=>x.r.type==='S'), db=rubs.filter(x=>x.r.type==='D');
    const any=rubs.some(x=>rubberCalc(x.r).res || (x.r.polo||[]).length);
    if(any){
      body+=`<h3 class="sv-h3">Individuales</h3><ul class="sv-rubs">${sg.map(x=>svRubberLine(x.r,x.k,f)).join('')}</ul>`;
      if(db.length) body+=`<h3 class="sv-h3">Dobles</h3><ul class="sv-rubs">${db.map(x=>svRubberLine(x.r,x.k,f)).join('')}</ul>`;
    } else body+=`<p class="sv-note">${played? 'El marcador global es oficial; los resultados de cada partido aún no se han introducido.' : 'Los partidos y el orden de juego aparecerán cuando el capitán publique la convocatoria.'}</p>`;
    if(typeof lineupVisible==='function' && lineupVisible(f.j) && lineupList(f.j).length)
      body+=`<h3 class="sv-h3">Convocatoria</h3><div class="sv-lu">${lineupList(f.j).map(pid=>`<span>${avatar(player(pid),'sm')}${esc(pname(pid).split(' ')[0])}</span>`).join('')}</div>`;
    const h=teamStats().vs[persp(f).rival];
    body+=`<p class="sv-note">${h? `Esta temporada contra ${esc(clubName(persp(f).rival))}: ${h.w}-${h.l} en eliminatorias y ${h.rw}-${h.rl} en partidos.` : `Primer enfrentamiento de la temporada contra ${esc(clubName(persp(f).rival))}.`}</p>`;
  } else body+=`<p class="sv-note">El detalle partido a partido solo se registra en los enfrentamientos del ${esc(teamLabel())}. Fuente del marcador: FCT.</p>`;
  sh.innerHTML=`<div class="handle"></div>
    <div class="sv-mh st-${s.k}"><p class="sv-mk">Jornada ${f.j} · ${svDay(f)} ${esc(svDate(f,{day:'numeric',month:'long',year:'numeric'}))} · ${svTime(f)}</p>
      <div class="sv-mrow">${side(f.home,'Local')}<div class="sv-msc">${played? `<b>${f.hs}</b><i></i><b>${f.as}</b>` : '<span>VS</span>'}</div>${side(f.away,'Visitante')}</div>
      <p class="sv-mst"><span class="sv-pill ${s.k}">${s.l}</span>${s.v? `<span class="sv-val ${f.status==='official'?'ok':''}">${s.v==='Oficial'? 'Resultado oficial' : 'Pendiente de validar'}</span>` : ''}${s.sub? `<span class="sv-val">${esc(s.sub)}</span>`:''}</p>
      <p class="sv-loc">${mine? (persp(f).home? 'En casa' : 'Fuera')+' · ' : ''}Pistas del ${esc(svVenue(f))}</p></div>
    ${body}
    <div class="row" style="margin-top:18px">${mine? `<a class="btn" href="#jornada-${f.j}" data-act="close-sheet">Abrir la jornada</a>` : ''}<button class="btn ghost" data-act="close-sheet">Cerrar</button></div>`;
  requestAnimationFrame(()=>{ bg.classList.add('on'); sh.classList.add('on'); sh.scrollTop=0; });
}

/* =====================================================================
   CALENDARIO
   ===================================================================== */
function svCard(f, opt={}){
  const s=svState(f), mine=svMine(f), played=isPlayed(f), p=mine? persp(f) : null;
  const side=(id,role)=>{ const won= played && ((id===f.home && f.hs>f.as) || (id===f.away && f.as>f.hs));
    return `<span class="mc-t ${svIsUs(id)?'us':''} ${won?'won':''}">${svCrest(id, opt.compact?'sm':'md')}<b>${esc(svName(id))}</b>${opt.compact?'':`<small>${role}</small>`}</span>`; };
  const where = mine? `<b class="mc-ha ${p.home?'h':'a'}">${p.home?'En casa':'Fuera'}</b> · ${esc(svVenue(f))}` : `Pistas del ${esc(svVenue(f))}`;
  return `<button class="mc st-${s.k} ${mine?'mine':''} ${opt.compact?'compact':''}" data-sx="match" data-i="${svIdx(f)}">
    ${opt.compact? '' : `<span class="mc-top"><span class="mc-j">Jornada ${f.j}</span><span class="mc-d">${svDay(f)} · ${esc(svDate(f,{day:'numeric',month:'short'}))} · ${svTime(f)}</span></span>`}
    <span class="mc-mid">${side(f.home,'Local')}<span class="mc-sc">${played? `<b>${f.hs}</b><i>–</i><b>${f.as}</b>` : `<em>${opt.compact? (f.time? esc(f.time) : 'VS') : 'VS'}</em>`}</span>${side(f.away,'Visitante')}</span>
    ${opt.compact? '' : `<span class="mc-foot"><span class="mc-w">${where}</span><span class="sv-pill ${s.k}">${s.l}</span></span>`}
  </button>`;
}
function svHero(f){
  const p=persp(f), d=Math.ceil((kickoff(f)-Date.now())/864e5), when= d<=0? 'Hoy' : d===1? 'Mañana' : 'En '+d+' días';
  return `<button class="sv-next" data-sx="match" data-i="${svIdx(f)}">
    <span class="sv-nk"><span>Próximo partido · Jornada ${f.j}</span><b>${when}</b></span>
    <span class="sv-nd">${svDay(f)} · ${esc(svDate(f))}<em>${svTime(f)}</em></span>
    <span class="sv-nm"><span class="sv-ns ${svIsUs(f.home)?'us':''}">${svCrest(f.home,'xl')}<b>${esc(svName(f.home))}</b><small>Local</small></span><span class="sv-nvs">VS</span><span class="sv-ns ${svIsUs(f.away)?'us':''}">${svCrest(f.away,'xl')}<b>${esc(svName(f.away))}</b><small>Visitante</small></span></span>
    <span class="sv-nl"><b class="mc-ha ${p.home?'h':'a'}">${p.home?'En casa':'Fuera'}</b> · Pistas del ${esc(svVenue(f))}${movedTag(f)}</span>
  </button>`;
}
function svMonthKey(f){ return f.date? f.date.slice(0,7) : '0000-00'; }
function svMonthName(k){ const d=new Date(k+'-15T12:00:00'); return svCap(d.toLocaleDateString('es-ES',{month:'long',year:'numeric'})); }

function svCalList(){
  const all=!!ui.ligaAll, jf=+ui.calJ||0, nx=nextPoloFix();
  if(all){ // toda la competición: por jornada, todos los cruces
    let h='', js=[...new Set(S.fixtures.map(f=>f.j))].sort((a,b)=>a-b); if(jf) js=js.filter(j=>j===jf);
    js.forEach(j=>{ const fs=S.fixtures.filter(f=>f.j===j).sort(svByDate), d=fs[0], ids=new Set(fs.flatMap(f=>[f.home,f.away])), rest=S.teams.filter(t=>!ids.has(t.id));
      h+=`<section class="sv-jg"><header><b>Jornada ${j}</b><span>${d? svDay(d)+' · '+esc(svDate(d)) : ''}</span></header><div class="sv-jl">${fs.map(f=>svCard(f,{compact:true})).join('')}</div>${rest.length? `<p class="sv-rest">Descansa: ${rest.map(t=>esc(svName(t.id))).join(', ')}</p>`:''}</section>`; });
    return h || '<div class="empty">No hay enfrentamientos con este filtro.</div>';
  }
  const mine=S.fixtures.filter(svMine).filter(f=>!jf||f.j===jf).sort(svByDate);
  // Jornadas en que descansa el equipo (solo sin filtro de jornada)
  const rests = jf? [] : Array.from({length:NJ()},(_,i)=>i+1).filter(j=>!poloFix(j) && S.fixtures.some(f=>f.j===j)).map(j=>({rest:true,j,f:S.fixtures.filter(f=>f.j===j).sort(svByDate)[0]}));
  const items=[...mine.map(f=>({f,j:f.j})), ...rests].sort((a,b)=>svByDate(a.f,b.f));
  if(!items.length) return '<div class="empty">No hay enfrentamientos con este filtro.</div>';
  let h='', cur=null;
  items.forEach(it=>{ const mk=svMonthKey(it.f); if(mk!==cur){ if(cur) h+='</div>'; cur=mk; h+=`<h3 class="sv-mon">${esc(svMonthName(mk))}</h3><div class="sv-list">`; }
    h+= it.rest? `<a class="mc rest" href="#jornada-${it.j}"><span class="mc-j">Jornada ${it.j}</span><span>Descansa el ${esc(teamLabel())} · ${esc(svDate(it.f,{day:'numeric',month:'short'}))}</span></a>` : (nx===it.f && !jf? '' : svCard(it.f)); });
  return h+'</div>';
}
function svCalMonth(){
  const all=!!ui.ligaAll, fs=S.fixtures.filter(f=>(all||svMine(f)) && f.date).sort(svByDate);
  if(!fs.length) return '<div class="empty">Calendario pendiente de cargar.</div>';
  const months=[...new Set(fs.map(svMonthKey))], today=new Date().toISOString().slice(0,10);
  return `<div class="sv-months">${months.map(mk=>{ const [y,m]=mk.split('-').map(Number), first=new Date(y,m-1,1), days=new Date(y,m,0).getDate(), off=(first.getDay()+6)%7;
    let cells=''; for(let k=0;k<off;k++) cells+='<span class="cd x"></span>';
    for(let d=1; d<=days; d++){ const iso=`${mk}-${String(d).padStart(2,'0')}`, on=fs.filter(f=>f.date===iso), pf=on.find(svMine);
      if(!on.length){ cells+=`<span class="cd ${iso===today?'today':''}"><i>${d}</i></span>`; continue; }
      const f=pf||on[0], s=svState(f);
      cells+=`<button class="cd on st-${s.k} ${iso===today?'today':''}" data-sx="match" data-i="${svIdx(f)}" title="Jornada ${f.j}"><i>${d}</i>${pf? svCrest(persp(pf).rival,'xs') : `<em>${on.length}</em>`}<small>${pf? (isPlayed(pf)? `${persp(pf).ps}-${persp(pf).rs}` : 'J'+pf.j) : 'J'+f.j}</small></button>`; }
    return `<section class="sv-cal"><h3 class="sv-mon">${esc(svMonthName(mk))}</h3><div class="sv-grid">${['L','M','X','J','V','S','D'].map(d=>`<span class="dw">${d}</span>`).join('')}${cells}</div></section>`; }).join('')}</div>
    <p class="sv-legend"><span class="win">Victoria</span><span class="loss">Derrota</span><span class="next">Próximo</span><span class="pend">Pendiente</span>${all?'<span>Número: partidos ese día</span>':''}</p>`;
}
function svCalendar(){
  if(!S.fixtures.length) return `<section class="sec"><div class="empty">El calendario aparecerá en cuanto se cargue desde la FCT.</div></section>`;
  const all=!!ui.ligaAll, mode=ui.calMode||'list', jf=+ui.calJ||0, nx=nextPoloFix(), seasons=(typeof meta!=='undefined' && meta?.seasons)||[];
  const seg=(act,v,cur,l)=>`<button class="seg-b" data-sx="${act}" data-v="${v}" aria-pressed="${cur}">${l}</button>`;
  let h=`<section class="sec sv-cal-sec"><div class="sv-ctrl">
      <div class="seg">${seg('cal-all','0',!all,'Mi equipo')}${seg('cal-all','1',all,'Toda la competición')}</div>
      <div class="seg">${seg('cal-mode','list',mode==='list','Jornadas')}${seg('cal-mode','month',mode==='month','Mes')}</div>
      ${mode==='list'? `<select class="sv-sel" data-sx="cal-j" aria-label="Jornada"><option value="0">Todas las jornadas</option>${Array.from({length:NJ()},(_,i)=>i+1).map(j=>`<option value="${j}" ${jf===j?'selected':''}>Jornada ${j}</option>`).join('')}</select>` : ''}
      ${seasons.length>1? `<span class="sv-seasons">${seasons.slice().sort().map(id=>`<button class="chip" data-act="season-view" data-id="${esc(id)}" aria-pressed="${id===viewSeason}">${esc(id)}</button>`).join('')}</span>` : ''}
    </div>`;
  if(!all && nx && mode==='list' && !jf) h+=svHero(nx);
  h+= mode==='month'? svCalMonth() : svCalList();
  const miss=S.fixtures.filter(f=>svMine(f)&&!f.time).length;
  return h+`<p class="source">Fuente: calendario oficial FCT${fctAgo()? `, actualizado ${esc(fctAgo())}` : ''}. La sede es la del club local.${miss? ` ${miss} ${miss>1?'horarios están':'horario está'} pendiente${miss>1?'s':''} de confirmar.`:''}</p></section>`;
}

/* =====================================================================
   ESTADÍSTICAS DEL EQUIPO
   ===================================================================== */
const svPct = (w,n) => n? Math.round(w*100/n) : null;
function svRing(p, size=148, label=''){
  const r=size/2-9, C=2*Math.PI*r;
  return `<span class="sv-ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" class="bg"/><circle cx="${size/2}" cy="${size/2}" r="${r}" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${p==null? C : C*(1-p/100)}"/></svg><b class="${p>=100?'w3':''}">${p==null? '–' : count(p,'%')}</b>${label?`<small>${label}</small>`:''}</span>`;
}
function svSplitBar(w,l){ const n=w+l; return `<span class="sv-sb"><i class="w" data-w="${n? Math.round(w*100/n):0}"></i></span>`; }
function svByType(){ // individuales y dobles, por separado (mismo criterio que teamStats)
  const o={S:{w:0,l:0,sw:0,sl:0,gw:0,gl:0},D:{w:0,l:0,sw:0,sl:0,gw:0,gl:0}};
  Object.values(S.ties).forEach(t=>(t.rubbers||[]).forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; const x=o[r.type==='D'?'D':'S']; c.res==='W'? x.w++ : x.l++; x.sw+=c.sw; x.sl+=c.sl; x.gw+=c.gw; x.gl+=c.gl; }));
  return o;
}
function svTieSets(j){ const t=tie(j), o={sw:0,sl:0,n:0}; (t?.rubbers||[]).forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; o.sw+=c.sw; o.sl+=c.sl; o.n++; }); return o; }
function svSeasonFacts(ts, played){
  const out=[]; if(!played.length) return out;
  const seq=played.map(f=>{ const p=persp(f); return p.ps>p.rs?'W':'L'; }); let n=0; const last=seq.at(-1); for(let i=seq.length-1;i>=0&&seq[i]===last;i--) n++;
  if(n>=2) out.push(`${n} ${last==='W'?'victorias':'derrotas'} seguidas en eliminatorias.`);
  else { const f=played.at(-1), p=persp(f); out.push(`Última jornada: ${p.ps>p.rs?'victoria':'derrota'} ${p.ps}-${p.rs} ${p.home?'en casa ante el':'en las pistas del'} ${clubName(p.rival)}.`); }
  const best=ts.byJ.slice().sort((a,b)=>(b.ps-b.rs)-(a.ps-a.rs))[0]; if(best && best.ps>best.rs) out.push(`Mayor victoria: ${best.ps}-${best.rs} al ${clubName(best.rival)} (J${best.j}).`);
  const pl=S.players.filter(p=>p.active!==false).map(p=>({p,s:playerStats(p.id)})).filter(x=>x.s.pj>=3).sort((a,b)=>wilson(b.s.w,b.s.pj)-wilson(a.s.w,a.s.pj))[0];
  if(pl) out.push(`${pl.p.name} lidera en individuales: ${pl.s.w}-${pl.s.l} en ${pl.s.pj} partidos.`);
  const evo=playedJornadas().map(j=>standings(j).find(r=>r.id===POLO)?.pos).filter(Boolean);
  if(evo.length>=2 && evo[0]!==evo.at(-1)) out.push(`En la clasificación: del ${evo[0]}º tras la primera jornada al ${evo.at(-1)}º ahora.`);
  return out.slice(0,4);
}
function svTimeline(){
  const fx=S.fixtures.filter(svMine).sort(svByDate); if(!fx.length) return '';
  const played=fx.filter(isPlayed), sel = fx.find(f=>f.j===+ui.tlJ) || played.at(-1) || fx[0], MX=Math.max(3,...played.map(f=>Math.max(f.hs,f.as)));
  const col=f=>{ const p=persp(f), on=f===sel;
    if(!isPlayed(f)) return `<button class="tl-c pend ${on?'on':''}" data-sx="tl" data-j="${f.j}" aria-label="Jornada ${f.j}, pendiente"><span class="tl-up"></span><span class="tl-ax"></span><span class="tl-dn"></span><span class="tl-k">J${f.j}</span>${svCrest(p.rival,'xs')}</button>`;
    const w=p.ps>p.rs; return `<button class="tl-c ${w?'win':'loss'} ${on?'on':''}" data-sx="tl" data-j="${f.j}" aria-label="Jornada ${f.j}, ${p.ps}-${p.rs}"><span class="tl-up"><i style="--h:${p.ps/MX}"></i><b>${p.ps}</b></span><span class="tl-ax"></span><span class="tl-dn"><i style="--h:${p.rs/MX}"></i><b>${p.rs}</b></span><span class="tl-k">J${f.j}</span>${svCrest(p.rival,'xs')}</button>`; };
  const p=persp(sel), ss=svTieSets(sel.j), pos=isPlayed(sel)? standings(sel.j).find(r=>r.id===POLO)?.pos : null, s=svState(sel);
  const det=`<div class="tl-det st-${s.k}">${svCrest(p.rival,'md')}<div><b>Jornada ${sel.j} · ${p.home?'En casa contra':'Fuera, en las pistas del'} ${esc(clubName(p.rival))}</b><span>${svDay(sel)} ${esc(svDate(sel))} · ${svTime(sel)}</span></div>
    <div class="tl-res">${isPlayed(sel)? `<b>${p.ps}-${p.rs}</b><span class="sv-pill ${s.k}">${s.l}</span>` : `<span class="sv-pill ${s.k}">${s.l}</span>`}</div>
    ${isPlayed(sel)? `<p>${ss.n? `Sets ${ss.sw}-${ss.sl} en ${ss.n} partidos con marcador.` : 'Sin marcadores de cada partido.'}${pos? ` Tras la jornada: ${pos}º.`:''} <button class="textlink" data-sx="match" data-i="${svIdx(sel)}">Ver el enfrentamiento</button></p>` : `<p><button class="textlink" data-sx="match" data-i="${svIdx(sel)}">Ver el enfrentamiento</button></p>`}</div>`;
  return `<div class="tl" style="--n:${fx.length}">${fx.map(col).join('')}</div><div class="tl-leg"><span>Partidos ganados ▲</span><span>▼ Partidos perdidos</span></div>${det}`;
}
// Posición tras cada jornada jugada: línea (SVG que se estira) + etiquetas HTML legibles a cualquier ancho
function svPosChart(evo,N){
  const n=evo.length, y=v=>8+(N>1? (v-1)/(N-1) : 0)*84, x=i=>(i+.5)*10, best=Math.min(...evo.map(e=>e.v));
  const line=evo.map((e,i)=>`${x(i)},${y(e.v)}`).join(' ');
  return `<div class="ps" style="--n:${n}"><div class="ps-plot"><svg viewBox="0 0 ${n*10} 100" preserveAspectRatio="none" aria-hidden="true">${[1,N].map(v=>`<line x1="0" x2="${n*10}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}<polyline points="${line}"/></svg>
    ${evo.map((e,i)=>`<span class="ps-p ${e.v===best?'top':''} ${i===n-1?'last':''}" style="left:${(i+.5)*100/n}%;top:${y(e.v)}%"><b>${e.v}º</b></span>`).join('')}</div>
    <div class="ps-x">${evo.map(e=>`<span>J${e.j}</span>`).join('')}</div><p class="ps-leg"><span>1º arriba</span><span>${N}º abajo</span></p></div>`;
}
function svVsClubs(ts){
  const rivals=S.teams.filter(t=>t.id!==POLO); if(!rivals.length) return '';
  const rows=rivals.map(t=>{ const fx=S.fixtures.filter(f=>svMine(f) && persp(f).rival===t.id).sort(svByDate), v=ts.vs[t.id], sets=fx.filter(isPlayed).reduce((o,f)=>{ const s=svTieSets(f.j); o.sw+=s.sw; o.sl+=s.sl; return o; },{sw:0,sl:0});
    return {t,fx,v,sets,net: v? v.w-v.l : -99}; }).sort((a,b)=>(b.v?1:0)-(a.v?1:0) || b.net-a.net || (b.v?.rw-b.v?.rl||0)-(a.v?.rw-a.v?.rl||0));
  return `<div class="vs-l">${rows.map(({t,fx,v,sets})=>{ const tone= !v? 'pend' : v.w>v.l? 'win' : v.l>v.w? 'loss' : 'even';
    return `<div class="vs-r ${tone}">${svCrest(t.id,'md')}<div class="vs-n"><b>${esc(t.short||t.name)}</b><span class="vs-m">${fx.map(f=>{ const p=persp(f); return isPlayed(f)? `<button class="vs-x ${p.ps>p.rs?'w':'l'}" data-sx="match" data-i="${svIdx(f)}">${p.home?'Casa':'Fuera'} ${p.ps}-${p.rs}</button>` : `<button class="vs-x p" data-sx="match" data-i="${svIdx(f)}">${p.home?'Casa':'Fuera'} · ${esc(svDate(f,{day:'numeric',month:'short'}))}</button>`; }).join('')||'<span class="muted small">Sin enfrentamientos</span>'}</span></div>
      <div class="vs-s">${v? `<b>${v.w}-${v.l}</b><small>${v.rw}-${v.rl} partidos${sets.sw+sets.sl? ` · ${sets.sw}-${sets.sl} sets`:''}</small>${svSplitBar(v.rw,v.rl)}` : `<b class="muted">–</b><small>Pendiente</small>`}</div></div>`; }).join('')}</div>`;
}
function svModes(){
  const o=svByType(), card=(k,title,sub)=>{ const x=o[k], n=x.w+x.l, p=svPct(x.w,n);
    return `<div class="md-c"><div class="md-h"><b>${title}</b><small>${sub}</small></div><div class="md-b">${svRing(p,104)}<div class="md-f"><span><b>${x.w}-${x.l}</b><small>partidos</small></span><span><b>${x.sw}-${x.sl}</b><small>sets</small></span><span><b>${x.gw}-${x.gl}</b><small>juegos</small></span></div></div>${n? '' : '<p class="md-e">Sin resultados todavía.</p>'}</div>`; };
  return `<div class="md">${card('S','Individuales','4 por eliminatoria')}${card('D','Dobles','Estadística aparte')}</div><p class="source">Los dobles nunca se suman a las estadísticas de individuales.</p>`;
}
function svStatsTeam(){
  const ts=teamStats(), st=standings(), row=st.find(r=>r.id===POLO), N=S.teams.length, played=S.fixtures.filter(f=>svMine(f)&&isPlayed(f)).sort(svByDate);
  const total=S.fixtures.filter(svMine).length, wp=svPct(ts.tw,ts.tw+ts.tl), seq=played.map(f=>{ const p=persp(f); return p.ps>p.rs?'W':'L'; });
  const kpi=(big,l,w,lo,sub='')=>`<div class="kp"><b>${big}</b><span>${l}</span>${w!=null? svSplitBar(w,lo):''}${sub?`<small>${sub}</small>`:''}</div>`;
  const facts=svSeasonFacts(ts,played), evo=playedJornadas().map(j=>({j,v:standings(j).find(r=>r.id===POLO).pos}));
  let h=`<section class="sv-hero"><p class="sv-k">${esc([S.comp?.name, S.comp?.group].filter(Boolean).join(' · ')||'Lliga Catalana')}</p><div class="sv-hi">
      <div class="sv-id">${svCrest(POLO,'hero')}<div><h2>${esc(teamLabel())}</h2><p class="sv-s">Temporada ${esc(S.seasonId||viewSeason)} · ${played.length} de ${total} jornadas</p></div></div>
      <div class="sv-pos">${row&&row.pj? `<b>${row.pos}º</b><span>de ${N} · ${row.pts} pts</span>` : '<b>–</b><span>Sin clasificación</span>'}</div>
    </div>
    <div class="sv-main">${svRing(wp,170,'eliminatorias ganadas')}<div class="sv-rec"><div class="sv-wl"><span class="w"><b>${count(ts.tw)}</b>victorias</span><span class="l"><b>${count(ts.tl)}</b>derrotas</span></div><div class="sv-form" aria-label="Últimas eliminatorias">${seq.slice(-6).map(x=>`<i class="${x}">${x==='W'?'G':'P'}</i>`).join('')||'<small>Sin eliminatorias jugadas</small>'}</div></div></div>
    <div class="kps">${kpi(`${ts.tw+ts.tl}`,'eliminatorias jugadas',null,null,`${total-ts.tw-ts.tl} por jugar`)}${kpi(`${ts.rw}-${ts.rl}`,'partidos',ts.rw,ts.rl,ts.rw+ts.rl? svPct(ts.rw,ts.rw+ts.rl)+'% ganados':'')}${kpi(`${ts.sw}-${ts.sl}`,'sets',ts.sw,ts.sl,ts.sw+ts.sl? svPct(ts.sw,ts.sw+ts.sl)+'% ganados':'')}${kpi(`${ts.gw}-${ts.gl}`,'juegos',ts.gw,ts.gl,ts.gw+ts.gl? svPct(ts.gw,ts.gw+ts.gl)+'% ganados':'')}</div></section>`;
  if(facts.length) h+=`<section class="sec"><div class="sec-h"><h2>La temporada hasta ahora</h2></div><ul class="sv-facts stagger">${facts.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></section>`;
  h+=`<section class="sec"><div class="sec-h"><h2>Jornada a jornada</h2><span class="muted small">Toca una jornada</span></div>${svTimeline()}
    ${evo.length>=2? `<h3 class="sv-h3" style="margin-top:24px">Posición en la clasificación</h3>${svPosChart(evo,N)}` : ''}</section>
  <section class="sec"><div class="sec-h"><h2>Individuales y dobles</h2></div>${svModes()}</section>
  <section class="sec"><div class="sec-h"><h2>Contra cada club</h2><span class="muted small">Eliminatorias · partidos · sets</span></div>${svVsClubs(ts)}</section>`;
  const sv=Object.entries(S.published).filter(([,p])=>p.ratings?.q_jornada).map(([k,p])=>({j:+k.slice(1),v:p.ratings.q_jornada}));
  if(sv.length) h+=`<section class="sec"><div class="sec-h"><h2>Nota del equipo a cada jornada</h2></div>${lineChart(sv,{min:1,max:10,h:150})}<p class="source">Media de la encuesta publicada. No afecta a ninguna estadística deportiva.</p></section>`;
  return h+`<p class="source">Eliminatorias y partidos: marcador oficial. Sets y juegos: partidos con marcador introducido.</p>`;
}

/* ---------- jugadores ---------- */
function svPlayers(){
  const kind=ui.statKind||'S', key=ui.sortKey||'wr';
  const rows=S.players.filter(p=>p.active!==false).map(p=>({p,st:playerStats(p.id,null,kind),o:playerStats(p.id,null,kind==='S'?'D':'S')})).filter(r=>kind==='S'||r.st.pj);
  const val=r=> key==='wr'? wilson(r.st.w,r.st.pj) : key==='sd'? r.st.sw-r.st.sl : key==='pj'? r.st.pj : key==='streak'? r.st.bestStreak : r.st.w;
  rows.sort((a,b)=>val(b)-val(a)||b.st.pj-a.st.pj||a.p.order-b.p.order);
  const on=rows.filter(r=>r.st.pj), off=rows.filter(r=>!r.st.pj);
  const seg=(act,v,cur,l)=>`<button class="seg-b" data-act="${act}" data-v="${v}" aria-pressed="${cur}">${l}</button>`;
  const card=({p,st,o},i)=>{ const pc=svPct(st.w,st.pj), small=st.pj>0 && st.pj<3;
    return `<button class="pl" data-player="${esc(p.id)}"><span class="pl-r">${i+1}</span>${avatar(p,'lg')}<span class="pl-b"><b class="pl-n">${esc(p.name)}</b>
      <span class="pl-m"><span><b>${st.pj}</b>PJ</span><span><b>${st.w}-${st.l}</b>${kind==='S'?'ind.':'dob.'}</span><span><b>${st.sw}-${st.sl}</b>sets</span></span>
      <span class="pl-bar"><i data-w="${pc||0}"></i></span><span class="pl-f"><em>${pc==null? 'Sin partidos' : pc+'% en '+st.pj+' '+(st.pj===1?'partido':'partidos')}${small? ' · muestra pequeña':''}</em>${kind==='S'? formStrip(st.seq,5) : ''}</span>
      <small class="pl-o">${kind==='S'? (o.pj? `Dobles (aparte): ${o.w}-${o.l}` : 'Sin dobles') : `Individuales (aparte): ${o.w}-${o.l}`}${st.bestStreak>=2&&kind==='S'? ` · mejor racha ${st.bestStreak}`:''}</small></span></button>`; };
  return `<section class="sec"><div class="sv-ctrl"><div class="seg">${seg('stat-kind','S',kind==='S','Individuales')}${seg('stat-kind','D',kind==='D','Dobles')}</div>
      <div class="seg">${seg('sort','wr',key==='wr','Rendimiento')}${seg('sort','w',key==='w','Victorias')}${seg('sort','pj',key==='pj','Partidos')}${seg('sort','sd',key==='sd','Sets')}${kind==='S'? seg('sort','streak',key==='streak','Racha') : ''}</div></div>
    <p class="muted small" style="margin:10px 0 0">${kind==='S'? 'Solo individuales. Los dobles se consultan aparte.' : 'Solo dobles: no influyen en las estadísticas individuales.'} «Rendimiento» ordena el % teniendo en cuenta cuántos partidos ha jugado cada uno.</p>
    <div class="pls stagger">${on.map(card).join('') || `<div class="empty">Aún no se han jugado ${kind==='S'?'individuales':'dobles'}.</div>`}</div>
    ${off.length? `<div class="pl-off"><small>Sin ${kind==='S'?'individuales':'dobles'} todavía</small><div>${off.map(({p})=>`<button class="pl-chip" data-player="${esc(p.id)}">${avatar(p,'sm')}${esc(p.name)}</button>`).join('')}</div></div>` : ''}</section>`;
}

/* ---------- eventos propios ---------- */
document.addEventListener('click', e=>{
  const el=e.target.closest('[data-sx]'); if(!el || el.tagName==='SELECT') return; const a=el.dataset.sx;
  if(a==='match'){ e.preventDefault(); svMatchSheet(+el.dataset.i); }
  else if(a==='cal-all'){ ui.ligaAll=el.dataset.v==='1'; ui.calJ=0; renderQuiet(); }
  else if(a==='cal-mode'){ ui.calMode=el.dataset.v; renderQuiet(); }
  else if(a==='tl'){ ui.tlJ=+el.dataset.j; renderQuiet(); }
});
document.addEventListener('change', e=>{ const el=e.target; if(el.dataset?.sx==='cal-j'){ ui.calJ=+el.value; renderQuiet(); } });
