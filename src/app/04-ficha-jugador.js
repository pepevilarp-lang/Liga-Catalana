/* ===================== FICHA DE JUGADOR ===================== */
const ATTRS=[['VIC','Victorias','Partidos ganados (suavizado)'],['SET','Sets','Sets ganados'],['JUE','Juegos','Juegos ganados'],['CLU','Clutch','Tercer set y tie-breaks ganados'],['DIS','Disponible','Jornadas en las que dijo «disponible»'],['EQU','Equipo','Votos MVP recibidos de los compañeros']];
const ATTR_W={VIC:.3,SET:.15,JUE:.15,CLU:.15,DIS:.1,EQU:.15};
function teamTotals(){ const t={pj:0,w:0,l:0,sw:0,sl:0,gw:0,gl:0,tw:0,tt:0,tbW:0,tbL:0,bag:0,cb:0,n:0};
  S.players.forEach(p=>{ const s=playerStats(p.id); if(!s.pj) return; t.n++; t.pj+=s.pj; t.w+=s.w; t.l+=s.l; t.sw+=s.sw; t.sl+=s.sl; t.gw+=s.gw; t.gl+=s.gl; t.tw+=s.three.w; t.tt+=s.three.w+s.three.l; t.tbW+=s.tbW; t.tbL+=s.tbL; t.bag+=s.bagels; t.cb+=s.comebacks; }); return t; }
function attrs(pid){
  const st=playerStats(pid), av=availStats(pid), sm=(a,b)=>(a+1)/(a+b+2), clamp=v=>Math.max(0,Math.min(1,v));
  const anyVotes=Object.keys(S.published).length>0, mx=Math.max(1,...S.players.map(p=>totalVotes(p.id)));
  const raw={VIC: st.pj? sm(st.w,st.l):null, SET: st.sw+st.sl? sm(st.sw,st.sl):null, JUE: st.gw+st.gl? clamp((st.gw/(st.gw+st.gl)-.3)/.4):null,
    CLU: (st.three.w+st.three.l+st.tbW+st.tbL)? sm(st.three.w+st.tbW,st.three.l+st.tbL):null, DIS: av.total? av.pct:null, EQU: anyVotes? totalVotes(pid)/mx:null};
  const val={}; Object.entries(raw).forEach(([k,v])=>val[k]= v==null? null : Math.round(25+74*v));
  let ws=0,acc=0; Object.entries(val).forEach(([k,v])=>{ if(v!=null){ ws+=ATTR_W[k]; acc+=v*ATTR_W[k]; } });
  const ovr = st.pj && ws? Math.round(acc/ws) : null;
  const pos=Object.entries(st.byPos).sort((a,b)=>(b[1].w+b[1].l)-(a[1].w+a[1].l))[0]?.[0];
  return {raw,val,ovr,pos: pos? (pos==='D'?'DOB':'IND '+pos) : null};
}
function tennisBall(cls,k){ return `<svg class="tball ${cls}" style="--k:${k}" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18"/><path d="M5 11c7 4 10 10 8 19M35 29c-7-4-10-10-8-19" fill="none"/></svg>`; }
function playerCard(pid){
  const p=player(pid), a=attrs(pid), pr=profiles[pid]||{}, tier=a.ovr==null? 'base' : a.ovr>=80? 'gold' : a.ovr>=65? 'silver' : 'bronze';
  const nm=(p?.name||'').split(' '), last=nm.at(-1)||'', ph=photos[pid]?.d;
  return `<div class="fcard ${tier}" data-tilt><div class="fc-in"><span class="fc-holo"></span><span class="fc-court"></span>
    <div class="fc-top"><div class="fc-ovr"><b>${a.ovr??'–'}</b><small>${esc(a.pos||'POLO')}</small></div><img class="fc-crest" src="${ASSET.crestSm}" alt=""></div>
    <div class="fc-photo">${ph? `<img src="${esc(ph)}" alt="">` : `<span>${esc(nm.map(x=>x[0]).slice(0,2).join(''))}</span>`}</div>
    <div class="fc-name">${esc((pr.nick||last).toUpperCase())}</div>
    <div class="fc-attrs">${ATTRS.map(([k])=>`<span><b>${a.val[k]??'–'}</b>${k}</span>`).join('')}</div></div></div>`;
}
function radar(pid){
  const a=attrs(pid), tA=S.players.filter(p=>playerStats(p.id).pj).map(p=>attrs(p.id)); const avg={}; ATTRS.forEach(([k])=>{ const v=tA.map(x=>x.val[k]).filter(x=>x!=null); avg[k]=v.length? sum(v)/v.length : null; });
  const C=150, R=108, n=ATTRS.length, pt=(i,v)=>{ const ang=-Math.PI/2+i*2*Math.PI/n, r=R*((v??25)-25)/74; return [C+Math.cos(ang)*r, C+Math.sin(ang)*r]; };
  let g=''; [.25,.5,.75,1].forEach(f=>{ g+=`<polygon points="${ATTRS.map((_,i)=>{ const ang=-Math.PI/2+i*2*Math.PI/n; return [C+Math.cos(ang)*R*f,C+Math.sin(ang)*R*f].join(','); }).join(' ')}" fill="none" stroke="var(--line)"/>`; });
  ATTRS.forEach(([k,l],i)=>{ const ang=-Math.PI/2+i*2*Math.PI/n, x=C+Math.cos(ang)*(R+26), y=C+Math.sin(ang)*(R+26); g+=`<line x1="${C}" y1="${C}" x2="${C+Math.cos(ang)*R}" y2="${C+Math.sin(ang)*R}" stroke="var(--line)"/><text x="${x}" y="${y+4}" text-anchor="middle" class="rl">${k}</text><text x="${x}" y="${y+18}" text-anchor="middle" class="rv">${a.val[k]??'–'}</text>`; });
  const poly=v=>ATTRS.map(([k],i)=>pt(i,v[k]).join(',')).join(' ');
  return `<svg class="radar" viewBox="0 0 300 300" role="img" aria-label="Radar de atributos">${g}<polygon class="ravg" points="${poly(avg)}"/><polygon class="rme" points="${poly(a.val)}"/>${ATTRS.map(([k],i)=>{ const [x,y]=pt(i,a.val[k]); return a.val[k]==null?'':`<circle class="rdot" style="--k:${i}" cx="${x}" cy="${y}" r="4.5"/>`; }).join('')}</svg>
    <div class="legend" style="justify-content:center"><span><i style="background:var(--brass)"></i>${esc(pname(pid))}</span><span><i style="background:transparent;box-shadow:inset 0 0 0 2px var(--muted)"></i>Media del equipo</span></div>`;
}
function broadcast(pid){
  const s=playerStats(pid), t=teamTotals(), per=(a,b)=>b? Math.round(a*100/b) : null, avgN=v=>t.n? v/t.n : 0;
  const rows=[['Individuales ganados',per(s.w,s.pj),per(t.w,t.pj),'%'],['Sets ganados',per(s.sw,s.sw+s.sl),per(t.sw,t.sw+t.sl),'%'],['Juegos ganados',per(s.gw,s.gw+s.gl),per(t.gw,t.gw+t.gl),'%'],
    ['Partidos a 3 sets ganados',per(s.three.w,s.three.w+s.three.l),per(t.tw,t.tt),'%'],['Tie-breaks ganados',per(s.tbW,s.tbW+s.tbL),per(t.tbW,t.tbW+t.tbL),'%'],
    ['Sets ganados 6-0',s.bagels,Math.round(avgN(t.bag)*10)/10,''],['Remontadas',s.comebacks,Math.round(avgN(t.cb)*10)/10,'']];
  return `<div class="bc"><div class="bc-head"><span>${esc(pname(pid))}</span><span>Media del equipo</span></div>${rows.map(([l,a,b,u])=>{ const mx=u==='%'?100:Math.max(1,a||0,b||0);
    return `<div class="bc-row ${a!=null&&b!=null&&a>b?'up':''}"><b class="bv">${a==null?'–':String(a).replace('.',',')+u}</b><span class="bl">${l}</span><b class="bv r">${b==null?'–':String(b).replace('.',',')+u}</b>
      <span class="bbar"><span class="bb l"><i data-w="${a==null?0:Math.round(a/mx*100)}"></i></span><span class="bb r"><i data-w="${b==null?0:Math.round(b/mx*100)}"></i></span></span></div>`; }).join('')}</div>`;
}
function courtMap(pid){
  const st=playerStats(pid), dd=playerStats(pid,null,'D'), z=k=>k==='D'? {w:dd.w,l:dd.l} : (st.byPos[k]||{w:0,l:0}), cell=(k,x,y,w,h,lab)=>{ const v=z(k), n=v.w+v.l, wr=n? v.w/n : 0;
    if(h<40) return `<g class="cz ${n?'on':''}" style="--a:${n? .25+.6*wr : 0}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/>${lab?`<text x="${x+w/2}" y="${y+h/2+5}" text-anchor="middle" class="czl">${lab}: ${n? v.w+'-'+v.l : '–'}</text>`:''}</g>`;
    return `<g class="cz ${n?'on':''}" style="--a:${n? .25+.6*wr : 0}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/><text x="${x+w/2}" y="${y+h/2-4}" text-anchor="middle" class="czl">${lab}</text><text x="${x+w/2}" y="${y+h/2+16}" text-anchor="middle" class="czv">${n? v.w+'-'+v.l : '–'}</text></g>`; };
  return `<svg class="cmap" viewBox="0 0 520 260" role="img" aria-label="Rendimiento por posición">
    <rect x="10" y="10" width="500" height="240" rx="4" class="cbg"/>
    ${cell('D',10,10,500,28,'Dobles')}${cell('D',10,222,500,28,'')}
    ${cell(1,60,38,95,92,'Ind. 1')}${cell(2,60,130,95,92,'Ind. 2')}${cell(3,365,38,95,92,'Ind. 3')}${cell(4,365,130,95,92,'Ind. 4')}
    <g class="cl"><rect x="10" y="10" width="500" height="240"/><path d="M10 38h500M10 222h500M60 38v184M460 38v184M155 38v184M365 38v184M155 130h210M60 130h95M365 130h95"/><path d="M260 4v252" class="net"/></g></svg>`;
}
function scoreboards(pid,kind='S'){
  const st=playerStats(pid,null,kind); if(!st.matches.length) return `<div class="empty">Aún no hay ${kind==='D'?'dobles':'individuales'} con marcador.</div>`;
  return `<div class="sbs stagger">${st.matches.slice().reverse().map(m=>{ const f=poloFix(m.j), rv=persp(f).rival, W=m.c.res==='W';
    const me=(m.r.polo||[]).map(id=>pname(id).split(' ').slice(-1)[0]).join(' / '); const mate=kind==='D'? (m.r.polo||[]).find(x=>x!==pid) : null;
    return `<a class="sb ${W?'w':'l'}" href="#jornada-${m.j}"><div class="sb-h"><span>J${m.j}, ${m.r.type==='D'?'dobles':'individual '+m.r.n}</span><span>${esc(fdate(f))}</span></div>
      <div class="sb-r ${W?'win':''}"><span class="sb-n">${avatar(player(pid),'sm')}${mate? avatar(player(mate),'sm') : ''}${esc(me)}</span>${m.c.sets.map(([a,b])=>`<span class="sb-s ${a>b?'hi':''}">${a}</span>`).join('')}<span class="sb-c">${W?'✓':''}</span></div>
      <div class="sb-r ${!W?'win':''}"><span class="sb-n">${crest(rv,'sm')}${esc(team(rv).short)}</span>${m.c.sets.map(([a,b])=>`<span class="sb-s ${b>a?'hi':''}">${b}</span>`).join('')}<span class="sb-c">${!W?'✓':''}</span></div>${m.r.note?`<div class="sb-note">${esc(m.r.note)}</div>`:''}</a>`; }).join('')}</div>`;
}
function evoChart(pid){
  const st=playerStats(pid), js=[...st.jornadas].sort((a,b)=>a-b); if(js.length<2) return '';
  let w=0,n=0; const pts=js.map(j=>{ w+=st.byJ[j].w; n+=st.byJ[j].w+st.byJ[j].l; return {j,v:Math.round(w*100/n)}; });
  const W=600,H=170,pad={l:34,r:12,t:12,b:24},N=Math.max(2,NJ()), X=j=>pad.l+(j-1)*(W-pad.l-pad.r)/(N-1), Y=v=>pad.t+(1-v/100)*(H-pad.t-pad.b);
  let g=''; [0,50,100].forEach(v=>g+=`<line x1="${pad.l}" x2="${W-pad.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${pad.l-6}" y="${Y(v)+4}" text-anchor="end">${v}%</text>`);
  js.forEach(j=>g+=`<text x="${X(j)}" y="${H-6}" text-anchor="middle">J${j}</text>`);
  const d=pts.map((p,i)=>`${i?'L':'M'}${X(p.j)},${Y(p.v)}`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="eg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--brass)" stop-opacity=".35"/><stop offset="1" stop-color="var(--brass)" stop-opacity="0"/></linearGradient></defs>${g}<path d="${d}L${X(pts.at(-1).j)},${Y(0)}L${X(pts[0].j)},${Y(0)}Z" fill="url(#eg)"/><path class="ln" d="${d}" fill="none" stroke="var(--brass)" stroke-width="3"/>${pts.map((p,k)=>`<circle class="dt" style="--k:${k}" cx="${X(p.j)}" cy="${Y(p.v)}" r="5" fill="var(--brass)" stroke="var(--bg)" stroke-width="2"/>`).join('')}</svg><p class="source">Win rate acumulado en individuales tras cada jornada.</p>`;
}
function wlBars(pid){
  const st=playerStats(pid), js=[...st.jornadas].sort((a,b)=>a-b); if(!js.length) return '<div class="empty">Sin individuales todavía.</div>';
  const W=600,H=170,pad={l:24,r:8,t:12,b:24},n=Math.max(1,NJ()),bw=(W-pad.l-pad.r)/n, mx=Math.max(1,...js.map(j=>st.byJ[j].w+st.byJ[j].l)), mid=pad.t+(H-pad.t-pad.b)/2, hh=(H-pad.t-pad.b)/2;
  let g=`<line x1="${pad.l}" x2="${W-pad.r}" y1="${mid}" y2="${mid}" stroke="var(--line)"/><text x="${pad.l-6}" y="${pad.t+10}" text-anchor="end">G</text><text x="${pad.l-6}" y="${H-pad.b}" text-anchor="end">P</text>`;
  for(let j=1;j<=n;j++){ const cx=pad.l+(j-.5)*bw, v=st.byJ[j]; g+=`<text x="${cx}" y="${H-6}" text-anchor="middle">J${j}</text>`;
    if(v){ const a=v.w/mx*hh, b=v.l/mx*hh; if(a) g+=`<rect class="br" style="--k:${j}" x="${cx-bw*.3}" y="${mid-a}" width="${bw*.6}" height="${a}" rx="3" fill="var(--win)"/>`; if(b) g+=`<rect class="brd" style="--k:${j}" x="${cx-bw*.3}" y="${mid}" width="${bw*.6}" height="${b}" rx="3" fill="var(--loss)"/>`; } }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${g}</svg>`;
}
function setsChart(pid){
  const st=playerStats(pid); if(!(st.sw+st.sl)) return '<div class="empty">Sin sets todavía.</div>';
  const C=2*Math.PI*46, f=st.sw/(st.sw+st.sl);
  return `<div class="setsviz"><div class="ring big"><svg width="130" height="130" viewBox="0 0 110 110"><circle class="bg" cx="55" cy="55" r="46" style="stroke:var(--lossSoft)"/><circle class="v" cx="55" cy="55" r="46" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${C*(1-f)}" style="stroke:var(--win)"/></svg><b>${st.sw}-${st.sl}</b><small>sets</small></div>
    <dl class="setdl"><div><dt>Sets ganados</dt><dd>${count(st.sw)}</dd></div><div><dt>Sets perdidos</dt><dd>${count(st.sl)}</dd></div><div><dt>Diferencia</dt><dd>${st.sw-st.sl>0?'+':''}${st.sw-st.sl}</dd></div><div><dt>Juegos</dt><dd>${st.gw}-${st.gl}</dd></div></dl></div>`;
}
function doublesSection(pid){
  const d=playerStats(pid,null,'D'); const parts=Object.entries(d.partners).sort((a,b)=>(b[1].w+b[1].l)-(a[1].w+a[1].l));
  return `<section class="sec dblsec"><div class="sec-h"><h2>Dobles</h2><span class="muted small">Estadística independiente: no cuenta en sus individuales</span></div>
  ${d.pj? `<div class="figs stagger"><div class="fig"><b>${count(d.pj)}</b><span>dobles jugados</span></div><div class="fig"><b>${d.w}-${d.l}</b><span>victorias y derrotas</span></div><div class="fig"><b>${count(pct(d.w,d.pj),'%')}</b><span>de victorias</span></div><div class="fig"><b>${d.sw}-${d.sl}</b><span>sets (juegos ${d.gw}-${d.gl})</span></div></div>
    <div class="split" style="margin-top:20px"><div><div class="sec-h"><h3>Con cada pareja</h3></div><div class="pairs">${parts.map(([m,v])=>`<button class="pair press" data-player="${esc(m)}">${avatar(player(pid),'sm')}${avatar(player(m),'sm')}<span>con <b>${esc(pname(m))}</b></span><span class="pr">${v.w}-${v.l}<small>sets ${v.sw}-${v.sl}</small></span></button>`).join('')}</div></div>
    <div><div class="sec-h"><h3>Partido a partido</h3></div>${scoreboards(pid,'D')}</div></div>` : '<div class="empty">Aún no ha jugado dobles. Cuando lo haga, sus estadísticas de dobles aparecerán aquí, separadas de las individuales.</div>'}</section>`;
}
function vJugador(id){
  const p=player(id); if(!p) return vNotFound(); const st=playerStats(id), ins=insights(id), own=me===id, pr=profiles[id]||{}, nm=p.name.split(' '), first=nm.slice(0,-1).join(' '), last=nm.at(-1);
  const chips=[pr.hand,pr.backhand&&('Revés '+pr.backhand.toLowerCase()),pr.style,pr.surface&&('Prefiere '+pr.surface.toLowerCase())].filter(Boolean);
  const ph=photos[id]?.d, a=attrs(id);
  const vsClubs=Object.entries(st.vs);
  const seq=st.seq.slice(-10);
  let h=`<section class="phero"><span class="phero-num">${p.order}</span>${courtSVG()}<div class="wrap phero-in">
    <div class="phero-photo">${ph? `<img src="${esc(ph)}" alt="">` : `<span>${esc(nm.map(x=>x[0]).slice(0,2).join(''))}</span>`}</div>
    <div class="phero-txt"><p class="kick">Nº ${p.order} del equipo, ${esc(p.cat)}, ${p.pts} puntos FCT${(S.captains||[]).includes(id)?', capitán':''}</p>
      <h1><span>${esc(first)}</span>${esc(last)}</h1>${pr.nick?`<p class="nick">«${esc(pr.nick)}»</p>`:''}
      ${chips.length?`<div class="hchips">${chips.map(c=>`<span>${esc(c)}</span>`).join('')}</div>`:''}
      <p class="hlab">Individuales${a.pos&&a.pos!=='DOB'?`, posición habitual: individual ${a.pos.replace('IND ','')}`:''}</p>
      <div class="hfigs five stagger"><div><b>${count(st.pj)}</b><span>partidos</span></div><div><b>${count(st.w)}</b><span>victorias</span></div><div><b>${count(st.l)}</b><span>derrotas</span></div><div><b>${st.pj? count(pct(st.w,st.pj),'%') : '–'}</b><span>win rate</span></div><div><b>${st.streak.n? (st.streak.t==='W'?'+':'−')+st.streak.n : '–'}</b><span>racha</span></div></div></div></div></section>
  <div class="wrap">
  ${fichaDisplay(id, own)}${introBlock(id, own)}${ixPlayerCta(id)}
  <section class="sec"><div class="split cardsplit"><div class="cardcol">${playerCard(id)}<p class="source" style="text-align:center">Índice ${US}: se calcula solo con sus resultados, su disponibilidad y los votos publicados. Se recalcula cada jornada. No es un ranking oficial.</p></div>
    <div><div class="sec-h"><h2>Atributos</h2></div>${radar(id)}<ul class="attrlist">${ATTRS.map(([k,l,d])=>`<li><b>${k}</b> ${l}<small>${d}</small></li>`).join('')}</ul></div></div></section>
  <section class="sec"><div class="split"><div><div class="sec-h"><h2>Victorias y derrotas por jornada</h2><span class="muted small">Individuales</span></div>${wlBars(id)}</div>
    <div><div class="sec-h"><h2>Sets</h2><span class="muted small">Individuales</span></div>${setsChart(id)}</div></div></section>
  <section class="sec"><div class="sec-h"><h2>Individuales frente al equipo</h2></div>${st.pj? broadcast(id) : '<div class="empty">Aparecerán con su primer individual con marcador.</div>'}</section>
  <section class="sec"><div class="split"><div><div class="sec-h"><h2>Racha en individuales</h2><span class="muted small">${st.streak.n? (st.streak.t==='W'? st.streak.n+' victorias seguidas' : st.streak.n+' derrotas seguidas') : ''}</span></div>
      ${seq.length? `<div class="balls">${seq.map((x,k)=>tennisBall(x==='W'?'w':'l',k)).join('')}</div><p class="source">Últimos ${seq.length} individuales. Pelota amarilla: victoria. Los dobles no cuentan.</p>` : '<div class="empty">Sin partidos todavía.</div>'}
      ${evoChart(id)}</div>
    <div><div class="sec-h"><h2>En la pista</h2></div>${courtMap(id)}<p class="source">Individuales según su posición en el orden de juego; el pasillo de dobles muestra su balance de dobles, que se cuenta aparte.</p>
      ${vsClubs.length? `<div class="clubs">${vsClubs.map(([c,v])=>`<div>${crest(c,'sm')}<span>${esc(team(c).short)}</span><b>${v.w}-${v.l}</b></div>`).join('')}</div>`:''}</div></div></section>
  <section class="sec"><div class="sec-h"><h2>Individuales partido a partido</h2></div>${scoreboards(id,'S')}</section>
  ${doublesSection(id)}
  ${availProfile(id)}
  <section class="sec"><div><div class="sec-h"><h2>Lectura del rendimiento</h2></div>${ins.length? `<ul class="insights stagger">${ins.map(i=>`<li>${esc(i.t)}<small>Fuente: ${esc(i.s)}</small></li>`).join('')}</ul>` : '<div class="empty">El análisis aparecerá con sus partidos y votos.</div>'}</div>
</div></section>`;
  if(own) h+=privateBlock();
  return h+`<div class="row" style="margin-top:20px"><a class="textlink" href="#stats" data-act="cmp" data-id="${esc(id)}">Comparar con un compañero</a></div></div>`;
}

function privateBlock(){
  const ins=privateInsights(), r=selfSeries('s_rend');
  const dims=SELF_DIMS.map(([k,l])=>{ const s=selfSeries(k), avg=s.length? sum(s.map(x=>x.v))/s.length : null; return meter(l,'tu media',avg?avg/10:null,avg?dec(avg):'–','sv'); }).join('');
  const notes=myBallot?.j? Object.entries(myBallot.j).sort((a,b)=>+b[0].slice(1)-+a[0].slice(1)).map(([k,v])=>v.a?.s_mejorar?`<li class="sv">${esc(v.a.s_mejorar)}<small>J${k.slice(1)}, lo que querías mejorar</small></li>`:'').join('') : '';
  return `<section class="sec"><div class="panel"><div class="sec-h"><h2>Tu lectura privada</h2></div><p class="muted small" style="margin-top:-6px">Solo tú ves este bloque, además de los administradores que gestionan las encuestas. Son tus propias respuestas, no datos oficiales.</p>
    <div class="split" style="margin-top:12px"><div>${dims}${r.length>=2? lineChart(r,{min:1,max:10,h:150,labels:false}):''}</div><div>${ins.length||notes? `<ul class="insights">${ins.map(t=>`<li class="sv">${esc(t)}<small>Fuente: tus encuestas</small></li>`).join('')}${notes}</ul>` : '<div class="empty">Responde a las encuestas de cada jornada y aquí verás tu evolución.</div>'}</div></div></div></section>`;
}

function vStats(){
  const tabs=[['equipo','Equipo'],['jugadores','Jugadores'],['mvp','MVP'],['disponibilidad','Disponibilidad'],['rankings','Rankings'],['records','Récords']];
  let h=`<div class="wrap"><div class="pagehead"><h1>Estadísticas</h1><p class="lede">Calculadas con los resultados introducidos. Las encuestas solo alimentan los rankings de votos.</p></div>
  <div class="stabs" role="tablist">${tabs.map(([k,l])=>`<button class="stab" role="tab" data-act="stats-tab" data-v="${k}" aria-selected="${ui.statsTab===k}" aria-pressed="${ui.statsTab===k}">${l}</button>`).join('')}</div>`;
  const emp=statsEmpty(); if(emp) return h.replace('<div class="stabs"', emp+'<div class="stabs"')+`</div>`;
  return h+(ui.statsTab==='equipo'?statsEquipo():ui.statsTab==='jugadores'?statsJugadores():ui.statsTab==='disponibilidad'?statsDisponibilidad():ui.statsTab==='mvp'?`<section class="sec">${mvpRanking(false)}</section>${statsMvpHistory()}`:ui.statsTab==='rankings'?statsRankings():statsRecords())+`</div>`;
}
// Inicio de temporada: sin resultados todavía, en lugar de gráficos vacíos se explica cuándo aparecerán
function statsEmpty(){ const mine=S.fixtures.filter(f=>f.home===POLO||f.away===POLO); if(mine.some(isPlayed)) return '';
  const nx=mine.filter(f=>!isPlayed(f)).sort((a,b)=>String(a.date).localeCompare(String(b.date))||a.j-b.j)[0];
  const list=(meta?.seasons||[]).filter(x=>x!==viewSeason).sort(), prev=list.filter(x=>x<viewSeason).pop();
  const when= nx? `Aparecerán tras la jornada ${nx.j}, ${esc(fdate(nx,{weekday:'long',day:'numeric',month:'long'}))}, contra ${esc(clubName(persp(nx).rival))}.` : 'Aparecerán en cuanto se cargue el calendario y se juegue la primera jornada.';
  return `<section class="sec"><div class="notice" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between"><div><b>La temporada ${esc(viewSeason)} aún no ha empezado.</b><br><span class="small">${when} Todo se calcula solo con los resultados.</span></div>
    ${prev? `<button class="btn ghost sm" data-act="season-view" data-id="${esc(prev)}">Ver la temporada ${esc(prev)}</button>` : ''}</div></section>`; }
function statsEquipo(){ return svStatsTeam(); }   // season-views.js
function statsJugadores(){
  let h=svPlayers();   // tarjetas de jugador (season-views.js); el cara a cara sigue aquí
  const opts=sel=>S.players.map(p=>`<option value="${esc(p.id)}" ${sel===p.id?'selected':''}>${esc(p.name)}</option>`).join('');
  const a=ui.cmpA||S.players[0].id, b=ui.cmpB||(a===S.players[1].id?S.players[0].id:S.players[1].id), A=playerStats(a), Bs=playerStats(b), DA=playerStats(a,null,'D'), DB=playerStats(b,null,'D');
  const grp=(title,rows)=>`<h3 style="margin:18px 0 4px">${title}</h3>`+rows.map(([l,x,y,u=''])=>{ const m=Math.max(Math.abs(x),Math.abs(y),1); return `<div class="cmprow"><div class="meter" style="grid-template-columns:1fr 46px;padding:0"><span class="bar" style="transform:scaleX(-1)"><i data-w="${Math.round(Math.max(0,x)/m*100)}"></i></span><b style="${x>y?'':'font-weight:400'}">${x}${u}</b></div><span class="muted small cl">${l}</span><div class="meter" style="grid-template-columns:46px 1fr;padding:0"><b style="text-align:left;${y>x?'':'font-weight:400'}">${y}${u}</b><span class="bar"><i class="sv" data-w="${Math.round(Math.max(0,y)/m*100)}"></i></span></div></div>`; }).join('');
  h+=`<section class="sec"><div class="sec-h"><h2>Cara a cara</h2></div><div class="row" style="flex-wrap:nowrap"><select data-act="cmp-a" aria-label="Jugador A">${opts(a)}</select><span class="muted">y</span><select data-act="cmp-b" aria-label="Jugador B">${opts(b)}</select></div>
    <div class="row" style="justify-content:space-between;margin:16px 0 4px">${avatar(player(a),'lg')}${avatar(player(b),'lg')}</div>
    ${grp('Individuales',[['Partidos',A.pj,Bs.pj],['Victorias',A.w,Bs.w],['Win rate',A.pj?pct(A.w,A.pj):0,Bs.pj?pct(Bs.w,Bs.pj):0,'%'],['Dif. de sets',A.sw-A.sl,Bs.sw-Bs.sl],['Dif. de juegos',A.gw-A.gl,Bs.gw-Bs.gl],['Mejor racha',A.bestStreak,Bs.bestStreak]])}
    ${grp('Dobles',[['Partidos',DA.pj,DB.pj],['Victorias',DA.w,DB.w],['Win rate',DA.pj?pct(DA.w,DA.pj):0,DB.pj?pct(DB.w,DB.pj):0,'%']])}
    ${grp('Equipo',[['MVP',mvpCount(a),mvpCount(b)],['Votos MVP',totalVotes(a),totalVotes(b)],['% disponible',Math.round((availStats(a).pct||0)*100),Math.round((availStats(b).pct||0)*100),'%'],['Convocatorias',availStats(a).conv,availStats(b).conv]])}</section>`;
  return h;
}
function statsRankings(){
  const f=ui.rankFilter==='season'? null : +ui.rankFilter, pl=S.players.filter(p=>p.active!==false);
  const mk=(title,def,fn,fmt=v=>v,sub=null,sortKey=null)=>{ const list=pl.map(p=>({p,v:fn(p.id),s:sortKey?sortKey(p.id):null})).filter(x=>x.v!=null).sort((a,b)=>(sortKey? b.s-a.s : 0)||b.v-a.v).slice(0,5);
    return `<div class="rank"><h3>${title}</h3><p class="def">${def}</p>${list.length? `<ol class="stagger">${list.map(x=>`<li>${avatar(x.p,'sm')}${plink(x.p.id)}<b>${fmt(x.v)}${sub?`<small class="rsub">${sub(x.p.id)}</small>`:''}</b></li>`).join('')}</ol>`:'<div class="empty">Sin datos todavía.</div>'}</div>`; };
  const S_=id=>playerStats(id,f), D_=id=>playerStats(id,f,'D');
  const evo=id=>{ const st=playerStats(id), js=[...st.jornadas].sort((a,b)=>a-b); if(js.length<4) return null; const wr=a=>{ let w=0,n=0; a.forEach(j=>{ w+=st.byJ[j].w; n+=st.byJ[j].w+st.byJ[j].l; }); return n?w/n:0; }; return Math.round((wr(js.slice(-3))-wr(js.slice(0,-3)))*100); };
  const pairs={}; pl.forEach(p=>Object.entries(D_(p.id).partners).forEach(([m,v])=>{ const k=[p.id,m].sort().join('|'); pairs[k]=v; }));
  const pairList=Object.entries(pairs).map(([k,v])=>({ids:k.split('|'),v,n:v.w+v.l})).sort((a,b)=>(b.v.w-b.v.l)-(a.v.w-a.v.l)||(b.n? b.v.w/b.n : 0)-(a.n? a.v.w/a.n : 0)).slice(0,5);
  return `<section class="sec"><select data-act="rank-filter" style="max-width:280px"><option value="season">Temporada ${esc(S.seasonId||viewSeason)} completa</option>${Array.from({length:NJ()},(_,i)=>i+1).filter(j=>poloFix(j)).map(j=>`<option value="${j}" ${ui.rankFilter==j?'selected':''}>Jornada ${j}</option>`).join('')}</select></section>
  <section class="sec"><div class="sec-h"><h2>Individuales</h2><span class="muted small">La estadística principal</span></div><div class="rgrid">
    ${mk('Win rate individual','Ordenado por balance: victorias menos derrotas (6-2 es +4 y va por delante de 1-0, +1). Si empatan, el % más alto.',id=>{ const s=S_(id); return s.pj? pct(s.w,s.pj) : null; },v=>v+'%',id=>{ const s=S_(id), b=s.w-s.l; return s.w+'-'+s.l+' · '+(b>0?'+':'')+b; },id=>{ const s=S_(id); return (s.w-s.l)*1e3+(s.pj? s.w/s.pj*100 : 0); })}
    ${mk('Victorias individuales','Individuales ganados. Con las mismas victorias, primero quien ha perdido menos.',id=>S_(id).w||null,v=>v,id=>{ const s=S_(id); return s.w+'-'+s.l; },id=>{ const s=S_(id); return s.w*1e3+(s.pj? s.w/s.pj : 0); })}
    ${mk('Individuales disputados','Partidos individuales jugados.',id=>S_(id).pj||null)}
    ${mk('Mejor racha individual','Victorias seguidas en individuales.',id=>playerStats(id).bestStreak||null)}
    ${mk('Consistencia','Jornadas con balance positivo o igualado en individuales, mínimo 2.',id=>{ const s=S_(id); return s.njor>=2?Math.round(s.consist*100):null; },v=>v+'%')}
    ${mk('Evolución','Win rate individual de sus 3 últimas jornadas frente a las anteriores, mínimo 4.',id=>f?null:evo(id),v=>(v>0?'+':'')+v)}</div></section>
  <section class="sec"><div class="sec-h"><h2>Dobles</h2><span class="muted small">Ranking independiente</span></div><div class="rgrid">
    ${mk('Win rate en dobles','Mismo criterio: balance de victorias menos derrotas y, si empatan, el % más alto.',id=>{ const s=D_(id); return s.pj? pct(s.w,s.pj) : null; },v=>v+'%',id=>{ const s=D_(id), b=s.w-s.l; return s.w+'-'+s.l+' · '+(b>0?'+':'')+b; },id=>{ const s=D_(id); return (s.w-s.l)*1e3+(s.pj? s.w/s.pj*100 : 0); })}
    ${mk('Victorias en dobles','Dobles ganados. Si empatan, primero quien ha perdido menos.',id=>D_(id).w||null,v=>v,id=>{ const s=D_(id); return s.w+'-'+s.l; },id=>{ const s=D_(id); return s.w*1e3+(s.pj? s.w/s.pj : 0); })}
    <div class="rank"><h3>Mejores parejas</h3><p class="def">Balance de cada pareja.</p>${pairList.length? `<ol class="stagger">${pairList.map(x=>`<li><span class="duo">${x.ids.map(i=>avatar(player(i),'sm')).join('')}</span><span class="small">${x.ids.map(i=>esc(pname(i).split(' ')[0])).join(' y ')}</span><b>${x.v.w}-${x.v.l}</b></li>`).join('')}</ol>` : '<div class="empty">Sin dobles todavía.</div>'}</div></div></section>
  <section class="sec"><div class="sec-h"><h2>En el vestuario</h2></div><div class="rgrid">
    ${mk('MVP','Veces MVP de la jornada.',id=>mvpCount(id,f)||null)}
    ${mk('Votos MVP','Votos recibidos en las votaciones de MVP.',id=>totalVotes(id,f)||null)}
    ${mk('Disponibilidad','% de jornadas cerradas en las que dijo «disponible».',id=>{ const a=availStats(id); return a.total? Math.round(a.pct*100) : null; },v=>v+'%')}
    ${mk('Convocatorias','Veces convocado.',id=>availStats(id).conv||null)}</div><p class="source">MVP: votación de todo el equipo tras cada eliminatoria.</p></section>`;
}
function statsRecords(){
  const all=[]; S.players.forEach(p=>playerStats(p.id).matches.forEach(m=>{ if(m.r.type==='S'||m.r.polo[0]===p.id) all.push({p,...m}); }));
  const ts=teamStats(), recs=[], top=fn=>S.players.map(p=>({p,v:fn(playerStats(p.id))})).sort((a,b)=>b.v-a.v)[0];
  const bt=ts.byJ.slice().sort((a,b)=>(b.ps-b.rs)-(a.ps-a.rs))[0]; if(bt&&bt.ps>bt.rs) recs.push(['Mayor victoria por equipos',`${US} ${bt.ps}-${bt.rs} ${clubName(bt.rival)}, J${bt.j}`]);
  const lg=all.slice().sort((a,b)=>(b.c.gw+b.c.gl)-(a.c.gw+a.c.gl))[0]; if(lg) recs.push(['Partido con más juegos',`${lg.r.polo.map(pname).join(' y ')}: ${lg.c.sets.map(s=>s.join('-')).join(' ')}, J${lg.j}`]);
  let t=top(s=>s.bestStreak); if(t&&t.v>=2) recs.push(['Racha más larga en individuales',`${t.p.name}, ${t.v} victorias seguidas`]);
  t=top(s=>s.bagels); if(t&&t.v) recs.push(['Más sets ganados 6-0',`${t.p.name}, ${t.v}`]);
  t=top(s=>s.comebacks); if(t&&t.v) recs.push(['Más remontadas',`${t.p.name}, ${t.v}`]);
  t=top(s=>s.three.w); if(t&&t.v) recs.push(['Más victorias a tres sets',`${t.p.name}, ${t.v}`]);
  const mv=S.players.map(p=>({p,v:mvpCount(p.id)})).sort((a,b)=>b.v-a.v)[0]; if(mv&&mv.v) recs.push(['Más veces MVP',`${mv.p.name}, ${mv.v}`]);
  const pr={}; S.players.forEach(p=>Object.entries(playerStats(p.id,null,'D').partners).forEach(([m,v])=>{ pr[[p.id,m].sort().join('|')]=v; })); const bp=Object.entries(pr).sort((a,b)=>(b[1].w-b[1].l)-(a[1].w-a[1].l))[0];
  if(bp && bp[1].w) recs.push(['Mejor pareja de dobles',`${bp[0].split('|').map(pname).join(' y ')}, ${bp[1].w}-${bp[1].l}`]);
  const nThree=all.filter(x=>x.c.three).length, nTb=sum(all.map(x=>x.c.tbs));
  return `<section class="sec"><div class="sec-h"><h2>Récords de la temporada</h2></div>${recs.length? `<div class="recs stagger">${recs.map(([a,b])=>`<div class="rec"><small>${esc(a)}</small><b>${esc(b)}</b></div>`).join('')}</div>`:'<div class="empty">Los récords aparecerán cuando haya resultados individuales.</div>'}</section>
  <section class="sec"><div class="sec-h"><h2>Curiosidades</h2></div><ul class="insights stagger"><li>${all.length} individuales con marcador introducido (los dobles se cuentan aparte).</li><li>${nThree} se han ido al tercer set y ${nTb} sets se han decidido en tie-break.</li><li>${ts.dbl.w+ts.dbl.l} dobles decisivos jugados (${ts.dbl.w} ganados).</li><li>${playedJornadas().length} de ${NJ()} jornadas disputadas en la liga.</li></ul></section>`;
}


/* ---------------- Disponibilidad: página del jugador ---------------- */
function vDisponibilidad(j){
  const f=poloFix(j); if(!f) return vNotFound();
  const p=persp(f), mine=avOf(me,j), note=noteOf(me,j), dl=deadline(j), locked=(deadlinePassed(j)||isPlayed(f)) && !canManage;
  const draft = ui.avDraft && ui.avDraft.j===j ? ui.avDraft : (ui.avDraft={j, s:mine?.s||null, c:note?.c||''});
  const opt=(k,ico,sub)=>`<button class="avopt ${k} press" data-act="av-pick" data-v="${k}" aria-pressed="${draft.s===k}" ${locked?'disabled':''}><span class="ico">${ico}</span><span><b>${AV_LABEL[k]}</b><small>${sub}</small></span></button>`;
  return `<div class="wrap"><div class="survey" style="padding-top:28px">
    <p class="qsec">Jornada ${j}, disponibilidad</p>
    <div class="avhead">${crest(p.rival,'')}<div><h1 class="q" style="margin:0">${esc(CLUB.teamShort)} contra ${esc(clubName(p.rival))}</h1><p class="muted" style="margin:4px 0 0">${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h. ${p.home?'En casa.':'Fuera, en las pistas del '+esc(clubName(p.rival))+'.'}</p></div></div>
    <a class="avmap" href="${esc(sedeOf(f).url)}" target="_blank" rel="noopener"><span>📍</span><span><b>${esc(sedeOf(f).name)}</b><small>${esc(sedeTxt(sedeOf(f)))}</small></span><em>Cómo llegar</em></a>
    <div class="notice" style="margin:16px 0">${locked? 'El plazo para responder terminó el '+esc(fmtDT(dl))+'. Si necesitas cambiar algo, habla con el capitán.' : 'Puedes cambiar tu respuesta hasta el <b>'+esc(fmtDT(dl))+'</b>.'}</div>
    <div class="avopts">${opt('yes','✓','Cuenta conmigo')}${opt('maybe','?','Lo confirmo antes del plazo')}${opt('no','✕','Esta vez no puedo')}</div>
    <label class="f" for="av-c">Comentario para el capitán (opcional, solo lo ven los capitanes)</label>
    <textarea id="av-c" data-act="av-text" ${locked?'disabled':''} placeholder="Por ejemplo: puedo jugar a partir de las 12:00">${esc(draft.c||'')}</textarea>
    <div class="chips" style="margin-top:8px">${AV_CHIPS.map(c=>`<button class="chip" data-act="av-chip" data-v="${esc(c)}" ${locked?'disabled':''}>${esc(c)}</button>`).join('')}</div>
    <div class="row" style="margin-top:18px;justify-content:space-between"><span class="muted small">${mine?.at? 'Última respuesta '+relTime(mine.at)+': '+AV_LABEL[mine.s] : 'Aún no has respondido'}</span>
      <button class="btn brass" data-act="av-save" data-j="${j}" ${locked||!draft.s?'disabled':''}>${mine?'Actualizar respuesta':'Enviar respuesta'}</button></div>
    <section class="sec"><div class="sec-h"><h2 style="font-size:1.4rem">Cómo va el equipo</h2><a href="#jornada-${j}">Ver la jornada</a></div>${availSummary(j)}</section>
  </div></div>`;
}
function lineupStrip(j){
  const roles=rolesOf(j), list=lineupList(j);
  return `<div class="lineup stagger">${list.map(pid=>{ const pl=player(pid), r=roles[pid]||[]; return `<button class="lucard press" data-player="${esc(pid)}">${avatar(pl)}<span class="nm">${esc(pl?.name||'')}</span><span class="rl ${r[0]==='Suplente'?'sub':''}">${esc(r.join(' + '))}</span></button>`; }).join('')}</div>`;
}
/* ---------------- Estadísticas de disponibilidad ---------------- */
function avStrip(seq){ return `<span class="avstrip">${seq.map(x=>`<i class="${x.s} ${x.c?'c':''}" title="J${x.j}: ${AV_LABEL[x.s]}${x.c?', convocado':''}"></i>`).join('')}</span>`; }
function statsMvpHistory(){
  const js=playedJornadas().filter(j=>poloFix(j)); if(!js.length) return '';
  return `<section class="sec"><div class="sec-h"><h2>Jornada a jornada</h2></div><div class="mvphist stagger">${js.map(j=>{ const p=S.published[jid(j)], f=poloFix(j), pl=p?.mvp? player(p.mvp) : null, ph=pl? photos[pl.id]?.d : null;
    return `<a class="mvh" href="#jornada-${j}"><span class="mvh-j">J${j}</span><span class="mvh-ph">${ph?`<img src="${esc(ph)}" alt="">`:(pl?`<i>${esc(pl.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</i>`:'<i>?</i>')}</span><span><b>${pl? esc(pl.name) : (mvpOpen(j)? 'Votación abierta' : 'Pendiente')}</b><small>Contra ${esc(team(persp(f).rival).short)}${p?.mvp? ', '+p.votes+' '+(p.votes===1?'voto':'votos') : ''}</small></span></a>`; }).join('')}</div></section>`;
}
function statsDisponibilidad(){
  const rows=S.players.filter(p=>p.active!==false).map(p=>({p,a:availStats(p.id)}));
  const key=ui.avSort||'pct'; const v=r=> key==='pct'? (r.a.pct??-1) : key==='conv'? r.a.conv : key==='none'? r.a.none : key==='ync'? r.a.yesNotConv : r.a.yes;
  rows.sort((x,y)=>v(y)-v(x)||x.p.order-y.p.order);
  const js=closedJornadas(); const th=(k,l)=>`<th><button data-act="av-sort" data-v="${k}">${l}${key===k?' ↓':''}</button></th>`;
  const team=js.map(j=>{ const a=availFor(j); return {j,v:a.total? Math.round(a.yes.length*100/a.total) : 0}; });
  return `<section class="sec"><p class="lede">Disponibilidad declarada frente a convocatoria. Cuentan las jornadas del ${US} con el plazo cerrado o ya disputadas (${js.length}). «Sin respuesta» se cuenta aparte de «No disponible».</p></section>
  <section class="sec"><div class="tscroll"><table><thead><tr><th>Jugador</th><th>Jornadas</th>${th('yes','Disp.')}<th>No</th><th>Pend.</th>${th('none','Sin resp.')}${th('pct','%')}${th('conv','Convoc.')}${th('ync','Disp. no conv.')}<th class="l">Evolución</th></tr></thead><tbody class="stagger">
    ${rows.map(({p,a})=>`<tr><td>${plink(p.id)}</td><td>${a.total}</td><td>${a.yes}</td><td>${a.no}</td><td>${a.maybe}</td><td>${a.none}</td><td><b>${a.pct==null?'–':dec(a.pct*100)+' %'}</b></td><td>${a.conv}</td><td>${a.yesNotConv}</td><td class="l">${avStrip(a.seq)}</td></tr>`).join('')}</tbody></table></div>
    <div class="legend"><span><i style="background:var(--win)"></i>Disponible</span><span><i style="background:var(--brass)"></i>Pendiente</span><span><i style="background:var(--loss)"></i>No disponible</span><span><i style="background:var(--surface2)"></i>Sin respuesta</span><span><i style="background:transparent;box-shadow:inset 0 0 0 2px var(--ink)"></i>Convocado</span></div></section>
  ${team.length?`<section class="sec"><div class="sec-h"><h2>Disponibilidad del equipo por jornada</h2></div>${barsPct(team)}</section>`:''}`;
}
function barsPct(items,h=160){
  const W=600,pad={l:30,r:8,t:10,b:24},n=Math.max(1,NJ()),bw=(W-pad.l-pad.r)/n; let g='';
  [0,50,100].forEach(v=>{ const y=pad.t+(1-v/100)*(h-pad.t-pad.b); g+=`<line x1="${pad.l}" x2="${W-pad.r}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${pad.l-6}" y="${y+4}" text-anchor="end">${v}%</text>`; });
  for(let j=1;j<=n;j++){ const it=items.find(i=>i.j===j), cx=pad.l+(j-.5)*bw; g+=`<text x="${cx}" y="${h-6}" text-anchor="middle">J${j}</text>`;
    if(it){ const hh=it.v/100*(h-pad.t-pad.b); g+=`<rect class="br" style="--k:${j}" x="${cx-bw*.3}" y="${h-pad.b-hh}" width="${bw*.6}" height="${hh}" rx="3" fill="var(--green2)"/>`; } }
  return `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">${g}</svg>`;
}
function availProfile(pid){
  const a=availStats(pid);
  return `<section class="sec"><div class="sec-h"><h2>Disponibilidad</h2></div>${a.total? `<div class="figs stagger"><div class="fig"><b>${a.pct==null?'–':count(Math.round(a.pct*100),'%')}</b><span>disponible (${a.yes} de ${a.total})</span></div><div class="fig"><b>${a.no}/${a.maybe}</b><span>no disponible / pendiente</span></div><div class="fig"><b>${a.none}</b><span>sin responder</span></div><div class="fig"><b>${a.conv}</b><span>convocatorias${a.yesNotConv?`, ${a.yesNotConv} disponible sin convocar`:''}</span></div></div><div style="margin-top:12px">${avStrip(a.seq)}</div>` : '<div class="empty">Aún no hay jornadas con el plazo de disponibilidad cerrado.</div>'}</section>`;
}

/* ---------------- Votar ---------------- */
