/* ===================== ESTADO ===================== */
let S = seed();
let authUser=null, authReady=false, me=null, isAdmin=false, adminSkip=false, isCaptain=false, canManage=false;
let profiles={}, installEvt=null, pushState=null, myVotes={}, mvpVotes={}, mvpSubs=[], mvpKeys='';
let canPrivate=false;   // datos privados (respuestas individuales, comentarios, quién votó a quién): solo administradores y capitanes marcados
const teamMode = () => S.rules?.teamManage !== false;
function updRoles(){ isCaptain=!!(me && (S.captains||[]).includes(me)); canPrivate=isAdmin||isCaptain; canManage=canPrivate || isManager || (teamMode() && !!me && (!S.memberIds?.length || S.memberIds.includes(me))); return canManage; }
let claims={}, avail={}, picks={}, ballots={}, myBallot=null, notes={}, photos={}, phones={}, meta=null, waOptIn=false;
let subs=[], mineSub=null;
const ui = { ligaAll:false, statsTab:'equipo', rankFilter:'season', sortKey:'w', cmpA:null, cmpB:null, adminTab:'jornada', jTab:'disp', compose:null, poster:null, adminJ:null, survey:null, pendingRender:false, revealed:{} };
const RM = matchMedia('(prefers-reduced-motion: reduce)');

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const team = id => S.teams.find(t=>t.id===id) || {id, name:id, short:id, abbr:'?'};
const player = id => S.players.find(p=>p.id===id);
const pname = id => player(id)?.name || 'Por designar';
const jid = n => 'j'+n;
const NJ = () => Math.max(0,...S.fixtures.map(f=>+f.j||0));
const pct = (a,b) => b ? Math.round(a*100/b) : 0;
const dec = n => (Math.round(n*10)/10).toLocaleString('es-ES');
const sum = a => a.reduce((x,y)=>x+y,0);
const fdate = (f, opt={weekday:'short',day:'numeric',month:'short'}) => new Date(f.date+'T'+(f.time||'15:00')).toLocaleDateString('es-ES',opt);
const kickoff = f => new Date(f.date+'T'+(f.time||'15:00')+':00');
function daysTo(f){ const a=new Date(); a.setHours(0,0,0,0); return Math.round((new Date(f.date+'T00:00:00')-a)/864e5); }
function countdown(f){ const d=daysTo(f); if(d<0) return 'Disputada'; if(d===0) return 'Hoy'; if(d===1) return 'Mañana'; return 'En '+d+' días'; }

/* ===================== LÓGICA DE COMPETICIÓN ===================== */
const isPlayed = f => f.hs!=null && f.as!=null && (f.hs+f.as)>0;
const poloFix = j => S.fixtures.find(f=>f.j===j && (f.home===POLO||f.away===POLO));
function persp(f){ const home=f.home===POLO; return {home, rival: home? f.away : f.home, ps: home? f.hs : f.as, rs: home? f.as : f.hs, played:isPlayed(f)}; }
const tie = j => S.ties[jid(j)];
const blankTie = () => ({convocados:[], subs:[], lineupPub:false, poster:{}, rubbers: RUBBERS.map(R=>({n:R.n,type:R.type,polo:[],score:'',res:null,note:''})), moment:''});
function ensureTie(j){ const k=jid(j); if(!S.ties[k]) S.ties[k]=blankTie(); return S.ties[k]; }
function parseScore(str){ if(!str) return []; return String(str).split(/[\s,;]+/).map(x=>x.match(/^(\d{1,2})[-\/](\d{1,2})$/)).filter(Boolean).map(m=>[+m[1],+m[2]]); }
// W.O.: cuenta para el resultado de la eliminatoria, pero no en las estadísticas del jugador
const isWO = r => !!r.wo || (!String(r.score||'').trim() && /\bw\.?\s*o\b/i.test(r.note||''));
function rubberCalc(r){
  const sets=parseScore(r.score); let sw=0,sl=0,gw=0,gl=0,lostFirst=false,bagelsW=0,tbs=0;
  let tbW=0,tbL=0; sets.forEach(([a,b],i)=>{ if(a>b) sw++; else if(b>a) sl++; gw+=a; gl+=b; if(a===6&&b===0) bagelsW++; if(a===7&&b===6){tbs++;tbW++;} if(a===6&&b===7){tbs++;tbL++;} if(i===0&&b>a) lostFirst=true; });
  const res = r.res || (sets.length>=2 && sw!==sl ? (sw>sl?'W':'L') : null);
  return {sets, sw, sl, gw, gl, res, three: sets.length===3, comeback: res==='W'&&lostFirst, bagelsW, tbs, tbW, tbL};
}
const dblDecider = () => S.rules?.doubles==='decider';   // 'always': el dobles cuenta siempre que se juegue; 'decider': solo si queda 2-2
const dblHint = () => dblDecider()? 'Solo si queda 2-2' : 'Cuenta si se juega';
function setOk(a,b,i){ const w=Math.max(a,b), l=Math.min(a,b); if(a===b) return false; if(w===6&&l<=4) return true; if(w===7&&(l===5||l===6)) return true; if(i===2&&w>=10&&w-l>=2&&(w===10||l===w-2)) return true; return false; }
function validateRubber(r){ const errs=[], raw=String(r.score||'').trim(); if(!raw) return r.res&&!(r.polo||[]).length? ['Falta el jugador'] : [];
  const toks=raw.split(/[\s,;]+/), sets=parseScore(raw); if(toks.length!==sets.length) errs.push('Formato de sets no válido (usa 6-4 6-3)');
  sets.forEach(([a,b],i)=>{ if(!setOk(a,b,i)) errs.push(`El set ${a}-${b} no es un resultado de tenis válido`); });
  if(sets.length>3) errs.push('Máximo tres sets');
  if(sets.length>=2){ const w1=sets[0][0]>sets[0][1], w2=sets[1][0]>sets[1][1]; if(sets.length===2 && w1!==w2 && !r.res) errs.push('Un set cada uno: falta el tercer set'); if(sets.length===3 && w1===w2) errs.push('Con dos sets ganados por el mismo no hay tercer set'); }
  if(sets.length===1 && !r.res) errs.push('Falta el segundo set (si hubo abandono, elige el ganador y anótalo)');
  const c=rubberCalc({...r,res:null}); if(r.res && c.res && r.res!==c.res) errs.push('El ganador elegido no coincide con el marcador');
  if(!(r.polo||[]).length) errs.push('Falta el jugador del '+US+''); if(r.type==='D' && (r.polo||[]).length<2) errs.push('Falta la pareja de dobles');
  return errs; }
function validateTie(t){ const out={errors:[],warnings:[]}; if(!t) return out;
  const sing=t.rubbers.filter(r=>r.type==='S').map(r=>r.polo[0]).filter(Boolean); const dup=sing.filter((x,i)=>sing.indexOf(x)!==i);
  if(dup.length) out.errors.push(`${[...new Set(dup)].map(pname).join(', ')} aparece en dos individuales`);
  const d=t.rubbers.find(r=>r.type==='D'); if(d && d.polo?.length===2 && d.polo[0]===d.polo[1]) out.errors.push('La pareja de dobles repite jugador');
  t.rubbers.forEach((r,i)=>validateRubber(r).forEach(e=>out.errors.push(`${RUBBERS[i].label}: ${e}`)));
  const c=tieFromRubbers2(t); if(c.singles===4 && c.sw===2 && c.sl===2 && !rubberCalc(d||{}).res) out.warnings.push('2-2 en individuales: falta el dobles decisivo');
  if(dblDecider() && c.singles===4 && !(c.sw===2&&c.sl===2) && rubberCalc(d||{}).res) out.warnings.push('El dobles solo cuenta si queda 2-2; no se suma al marcador (puedes cambiarlo en Temporadas y ajustes)');
  return out; }
function tieFromRubbers2(t){ let sw=0,sl=0,singles=0; t.rubbers.forEach(r=>{ if(r.type!=='S') return; const c=rubberCalc(r); if(!c.res) return; singles++; c.res==='W'? sw++ : sl++; }); return {sw,sl,singles}; }
function tieFromRubbers(j){
  const t=tie(j); if(!t) return null; let w=0,l=0,singles=0, dRes=null;
  t.rubbers.forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; if(r.type==='S'){ singles++; c.res==='W'? w++ : l++; } else dRes=c.res; });
  const needsDoubles = singles===4 && w===2 && l===2;
  if(dRes && (needsDoubles || !dblDecider())){ dRes==='W'? w++ : l++; }
  return {w,l,decided:w+l,singles,needsDoubles,complete: singles===4 && (!needsDoubles || !!dRes)};
}

function standings(uptoJ,noOff){
  const rows=S.teams.map(t=>({id:t.id,pj:0,g:0,p:0,pts:0,rw:0,rl:0,form:[]})); const R=Object.fromEntries(rows.map(r=>[r.id,r]));
  S.fixtures.filter(f=>isPlayed(f)&&(uptoJ==null||f.j<=uptoJ)).sort((a,b)=>a.j-b.j).forEach(f=>{ const h=R[f.home],a=R[f.away]; if(!h||!a) return;
    h.pj++; a.pj++; h.rw+=f.hs; h.rl+=f.as; a.rw+=f.as; a.rl+=f.hs;
    if(f.hs>f.as){ h.g++; a.p++; h.pts+=S.rules.win; a.pts+=S.rules.loss; h.form.push('W'); a.form.push('L'); }
    else if(f.as>f.hs){ a.g++; h.p++; a.pts+=S.rules.win; h.pts+=S.rules.loss; a.form.push('W'); h.form.push('L'); } });
  const lastJ = uptoJ ?? Math.max(0,...S.fixtures.filter(isPlayed).map(f=>f.j));
  const O = !noOff && S.official && Array.isArray(S.official.order) && S.official.asOf>0? S.official : null;
  const ahead = !!O && uptoJ==null && O.asOf>lastJ;           // la oficial es más reciente que los resultados registrados
  const off = O && (O.asOf===lastJ || ahead)? O.order : null;
  if(off && O.pts) rows.forEach(r=>{ if(O.pts[r.id]!=null && isFinite(+O.pts[r.id])) r.pts=+O.pts[r.id]; });
  if(off) rows.forEach(r=>{ r.off=true; if(ahead) r.stale=true; });
  const oi = id => { const i=off? off.indexOf(id) : -1; return i<0? 99 : i; };
  rows.sort((x,y)=> off? (oi(x.id)-oi(y.id)||y.pts-x.pts) : (y.pts-x.pts||(y.rw-y.rl)-(x.rw-x.rl)||y.rw-x.rw||team(x.id).short.localeCompare(team(y.id).short)));
  rows.forEach((r,i)=>r.pos=i+1); return rows;
}
const playedJornadas = () => [...new Set(S.fixtures.filter(isPlayed).map(f=>f.j))].sort((a,b)=>a-b);
function nextPoloFix(){ const now=Date.now(); return S.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&!isPlayed(f)&&kickoff(f).getTime()>now-8*3600e3).sort((a,b)=>kickoff(a)-kickoff(b)||a.j-b.j)[0]||null; }
function lastPoloPlayed(){ return S.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&isPlayed(f)).sort((a,b)=>kickoff(b)-kickoff(a)||b.j-a.j)[0]||null; }
// Partidos del Polo ordenados por fecha real (adelantos y aplazamientos incluidos)
const poloOrder = () => S.fixtures.filter(f=>f.home===POLO||f.away===POLO).sort((a,b)=>kickoff(a)-kickoff(b)||a.j-b.j).map(f=>f.j);
const shortD = iso => { const d=new Date(iso+'T12:00:00'); return d.toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'}); };
function movedTag(f){ if(!f?.moved?.from || f.moved.from===f.date) return ''; const ad=f.date<f.moved.from; return `<span class="mvtag ${ad?'ad':'ap'}">${ad?'Adelantada':'Aplazada'}: era el ${esc(shortD(f.moved.from))}</span>`; }
function currentJ(){ const now=Date.now(); const up=S.fixtures.filter(f=>!isPlayed(f)&&kickoff(f).getTime()>now-8*3600e3).sort((a,b)=>a.j-b.j)[0]; return up? up.j : NJ(); }
const clubName = id => team(id).name;

/* ---------- Disponibilidad y participantes ---------- */
function avOf(pid,j){ const v=avail[pid]?.j?.[jid(j)]; if(!v) return null; return typeof v==='string'? {s:v} : v; }
function noteOf(pid,j){ return notes[pid]?.j?.[jid(j)] || null; }
function availFor(j){ const out={yes:[],no:[],maybe:[],none:[]}; S.players.filter(p=>p.active!==false).forEach(p=>{ const v=avOf(p.id,j); (out[v?.s]||out.none).push(p.id); }); out.total=out.yes.length+out.no.length+out.maybe.length+out.none.length; out.answered=out.total-out.none.length; out.pct=out.total? out.yes.length/out.total : 0; return out; }
function deadline(j){ const t=tie(j); if(t?.deadline) return new Date(t.deadline); const f=poloFix(j); if(!f) return null; const d=new Date(f.date+'T'+(S.rules.deadlineTime||'21:00')+':00'); d.setDate(d.getDate()-(+S.rules.deadlineDays||0)); return d; }
function deadlinePassed(j){ if(tie(j)?.availClosed) return true; const d=deadline(j); return d? Date.now()>d.getTime() : true; }
function availOpen(f){ if(!f||isPlayed(f)) return false; if(deadlinePassed(f.j)) return false; return !!tie(f.j)?.availReq || daysTo(f)<=S.rules.availDays; }
const lineupVisible = j => { const t=tie(j); return !!(t && (t.lineupPub || canManage || t.rubbers.some(r=>rubberCalc(r).res))); };
function convocados(j){ const t=tie(j); if(t?.convocados?.length && (t.lineupPub||canManage)) return t.convocados; const pl=new Set(); (t?.rubbers||[]).forEach(r=>{ if(rubberCalc(r).res) (r.polo||[]).forEach(x=>pl.add(x)); }); return [...pl]; }
function officialConv(j){ const t=tie(j), f=poloFix(j); if(!t) return []; if(t.lineupPub || (f&&isPlayed(f))){ const set=new Set(t.convocados||[]); t.rubbers.forEach(r=>(r.polo||[]).forEach(x=>set.add(x))); (t.subs||[]).forEach(x=>set.add(x)); return [...set]; } return []; }
function closedJornadas(){ return S.fixtures.filter(f=>(f.home===POLO||f.away===POLO) && (isPlayed(f) || deadlinePassed(f.j))).map(f=>f.j).sort((a,b)=>a-b); }
function availStats(pid){
  const js=closedJornadas(), o={total:js.length,yes:0,no:0,maybe:0,none:0,conv:0,yesNotConv:0,seq:[]};
  js.forEach(j=>{ const v=avOf(pid,j)?.s||'none'; o[v]++; const c=officialConv(j).includes(pid); if(c) o.conv++; if(v==='yes'&&!c&&officialConv(j).length) o.yesNotConv++; o.seq.push({j,s:v,c}); });
  o.pct=o.total? o.yes/o.total : null; o.respPct=o.total? (o.total-o.none)/o.total : null; return o;
}
function rolesOf(j){ const t=tie(j), roles={}; if(!t) return roles; t.rubbers.forEach(r=>(r.polo||[]).forEach(pid=>{ (roles[pid] ||= []).push(r.type==='D'?'Dobles':'Individual '+r.n); })); (t.subs||[]).forEach(pid=>{ if(!roles[pid]) roles[pid]=['Suplente']; }); (t.convocados||[]).forEach(pid=>{ if(!roles[pid]) roles[pid]=['Convocado']; }); return roles; }
function lineupList(j){ const t=tie(j); if(!t) return []; const order=[]; const add=x=>{ if(x&&!order.includes(x)) order.push(x); };
  t.rubbers.filter(r=>r.type==='S').forEach(r=>add(r.polo[0])); (t.rubbers.find(r=>r.type==='D')?.polo||[]).forEach(add); (t.convocados||[]).forEach(add); (t.subs||[]).forEach(add);
  const custom=(t.poster?.order||[]).filter(x=>order.includes(x)); const rest=order.filter(x=>!custom.includes(x)); return [...custom,...rest].filter(x=>!(t.poster?.hidden||[]).includes(x)); }
const relTime = ts => { if(!ts) return ''; const m=Math.round((Date.now()-ts)/6e4); if(m<1) return 'ahora'; if(m<60) return 'hace '+m+' min'; const h=Math.round(m/60); if(h<24) return 'hace '+h+' h'; const d=Math.round(h/24); return d===1? 'ayer' : 'hace '+d+' días'; };
const fmtDT = d => d? d.toLocaleString('es-ES',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}) : '';
function participants(j){ const t=tie(j); const played=new Set(); (t?.rubbers||[]).forEach(r=>{ if(rubberCalc(r).res && !isWO(r)) (r.polo||[]).forEach(p=>played.add(p)); }); return played.size? [...played] : convocados(j); }
function pendingSurveys(){
  if(!me) return [];
  return playedJornadas().filter(j=>{ const f=poloFix(j); if(!f) return false; const k=jid(j);
    return !S.survey.closed?.[k] && tie(j) && participants(j).includes(me) && (!myBallot?.j?.[k] || ixFichaPending(j)); });
}

/* ---------- Estadísticas ---------- */
// kind 'S' = individuales (por defecto, base de todas las estadísticas principales); 'D' = dobles, siempre aparte
function playerStats(pid, onlyJ, kind='S'){
  const st={pid,kind,partners:{},pj:0,w:0,l:0,sw:0,sl:0,gw:0,gl:0,tbW:0,tbL:0,seq:[],byJ:{},byPos:{},three:{w:0,l:0},dbl:{w:0,l:0},comebacks:0,bagels:0,tbs:0,jornadas:new Set(),matches:[],vs:{}};
  for(let j=1;j<=NJ();j++){ if(onlyJ&&onlyJ!==j) continue; const t=tie(j); if(!t) continue; const f=poloFix(j);
    t.rubbers.forEach(r=>{ if(r.type!==kind || !(r.polo||[]).includes(pid) || isWO(r)) return; const c=rubberCalc(r); if(!c.res) return; const W=c.res==='W';
      if(kind==='D'){ const mate=(r.polo||[]).find(x=>x!==pid); if(mate) (st.partners[mate] ||= {w:0,l:0,sw:0,sl:0})[W?'w':'l']++, st.partners[mate].sw+=c.sw, st.partners[mate].sl+=c.sl; }
      st.pj++; st.jornadas.add(j); W? st.w++ : st.l++; st.sw+=c.sw; st.sl+=c.sl; st.gw+=c.gw; st.gl+=c.gl; st.seq.push(c.res);
      (st.byJ[j] ||= {w:0,l:0})[W?'w':'l']++; const pos=r.type==='D'?'D':r.n; (st.byPos[pos] ||= {w:0,l:0})[W?'w':'l']++;
      if(c.three) st.three[W?'w':'l']++; if(r.type==='D') st.dbl[W?'w':'l']++; if(c.comeback) st.comebacks++; st.bagels+=c.bagelsW; st.tbs+=c.tbs; st.tbW+=c.tbW; st.tbL+=c.tbL;
      if(f){ const rv=persp(f).rival; (st.vs[rv] ||= {w:0,l:0})[W?'w':'l']++; }
      st.matches.push({j,r,c}); }); }
  st.wr=st.pj? st.w/st.pj : 0;
  let cur=0,t=null; for(let i=st.seq.length-1;i>=0;i--){ if(t===null) t=st.seq[i]; if(st.seq[i]===t) cur++; else break; } st.streak={n:cur,t};
  let best=0,run=0; st.seq.forEach(x=>{ run=x==='W'?run+1:0; best=Math.max(best,run); }); st.bestStreak=best;
  const js=[...st.jornadas]; st.njor=js.length; st.consist=js.length? js.filter(j=>st.byJ[j].w>=st.byJ[j].l).length/js.length : 0;
  return st;
}
const wilson=(w,n,z=1.28)=>{ if(!n) return 0; const p=w/n; return (p+z*z/(2*n)-z*Math.sqrt((p*(1-p)+z*z/(4*n))/n))/(1+z*z/n); };
const wrTxt = st => st.pj? `${pct(st.w,st.pj)}% (${st.w}-${st.l})` : '–';
function teamStats(){
  const fx=S.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&isPlayed(f)).sort((a,b)=>a.j-b.j);
  const o={ties:fx.length,tw:0,tl:0,rw:0,rl:0,sw:0,sl:0,gw:0,gl:0,byJ:[],vs:{},dbl:{w:0,l:0}};
  fx.forEach(f=>{ const p=persp(f); o.rw+=p.ps; o.rl+=p.rs; p.ps>p.rs? o.tw++ : o.tl++; o.byJ.push({j:f.j,ps:p.ps,rs:p.rs,rival:p.rival,home:p.home});
    const v=(o.vs[p.rival] ||= {w:0,l:0,rw:0,rl:0}); p.ps>p.rs? v.w++ : v.l++; v.rw+=p.ps; v.rl+=p.rs; });
  Object.values(S.ties).forEach(t=>t.rubbers.forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; o.sw+=c.sw; o.sl+=c.sl; o.gw+=c.gw; o.gl+=c.gl; if(r.type==='D') o.dbl[c.res==='W'?'w':'l']++; }));
  return o;
}
function clubSeason(id){ const r=standings().find(x=>x.id===id)||{}; return r; }
function votesFor(pid,qid,onlyJ){ let n=0; Object.entries(S.published).forEach(([k,p])=>{ if(onlyJ&&k!==jid(onlyJ)) return; n+=(p.tally?.[pid])||0; }); return n; }
const mvpCount = (pid,onlyJ) => Object.entries(S.published).filter(([k,p])=>(!onlyJ||k===jid(onlyJ))&&p.mvp===pid).length;
const totalVotes = (pid,onlyJ) => votesFor(pid,'mvp',onlyJ);

/* ---------- Crónica automática ---------- */
function listNames(arrs){ const n=[...new Set(arrs.map(a=>(a||[]).map(pname).join(' y ')).filter(Boolean))]; if(n.length<=1) return n[0]||'el equipo'; return n.slice(0,-1).join(', ')+' y '+n.at(-1); }
function cronica(j){
  const f=poloFix(j); if(!f||!isPlayed(f)) return null; const p=persp(f); const rv=clubName(p.rival);
  const where = p.home? 'en casa ante el '+rv : 'en las pistas del '+rv;
  let s = p.ps>p.rs? `El ${US} ${p.rs===0?'arrasa':'se impone'} ${p.ps}-${p.rs} ${where}` : `El ${US} ${p.ps===0?'cae con claridad':'cae'} ${p.ps}-${p.rs} ${where}`;
  const t=tie(j), bits=[];
  if(t){ const calc=t.rubbers.map(r=>({r,c:rubberCalc(r)})).filter(x=>x.c.res);
    const dbl=calc.find(x=>x.r.type==='D'); const cb=calc.filter(x=>x.c.comeback); const clean=calc.filter(x=>x.c.res==='W'&&x.c.sets.length===2&&x.c.gl<=4); const three=calc.filter(x=>x.c.three);
    if(dbl) bits.push(`con el dobles ${tieFromRubbers(j)?.needsDoubles?'decisivo ':''}${dbl.c.res==='W'?'ganado':'perdido'} por ${listNames([dbl.r.polo])}`);
    if(cb.length) bits.push(`${cb.length>1?'remontadas':'una remontada'} de ${listNames(cb.map(x=>x.r.polo))} tras perder el primer set`);
    else if(clean.length) bits.push(`${clean.length>1?'victorias rotundas':'una victoria rotunda'} de ${listNames(clean.map(x=>x.r.polo))}`);
    else if(three.length) bits.push(`${three.length} ${three.length>1?'partidos se fueron':'partido se fue'} al tercer set`); }
  let txt=s+(bits.length? ', '+bits.slice(0,2).join(' y ') : '')+'.';
  const pub=S.published[jid(j)]; if(pub?.mvp) txt+=` El equipo eligió a ${pname(pub.mvp)} MVP de la jornada.`;
  return {txt, partial: !(t && t.rubbers.some(r=>rubberCalc(r).res))};
}

/* ---------- Insights ---------- */
function insights(pid){
  const st=playerStats(pid), out=[];
  if(st.pj){ const last=st.seq.slice(-5), lw=last.filter(x=>x==='W').length;
    out.push({t: last.length===1? (lw?'Ganó el único individual que ha jugado.':'Perdió el único individual que ha jugado.') : `Ha ganado ${lw} de sus últimos ${last.length} individuales.`, s:'Resultados de individuales'});
    if(st.streak.n>=2) out.push({t:`Lleva ${st.streak.n} ${st.streak.t==='W'?'victorias':'derrotas'} seguidas en individuales.`, s:'Resultados de individuales'});
    if(st.three.w+st.three.l>=2) out.push({t:`En partidos a tres sets su balance es de ${st.three.w}-${st.three.l}.`, s:'Resultados'});
    if(st.comebacks) out.push({t:`Ha remontado ${st.comebacks} ${st.comebacks>1?'veces':'vez'} tras perder el primer set.`, s:'Resultados'});
    const pos=Object.entries(st.byPos).filter(([k,v])=>k!=='D'&&v.w+v.l>=2).sort((a,b)=>(b[1].w/(b[1].w+b[1].l))-(a[1].w/(a[1].w+a[1].l)));
    if(pos.length) out.push({t:`Su mejor rendimiento en individuales llega como individual ${pos[0][0]} (${pos[0][1].w}-${pos[0][1].l}).`, s:'Resultados'});
    if(st.njor>=3) out.push({t:`Ha cerrado con balance positivo o igualado ${Math.round(st.consist*st.njor)} de sus ${st.njor} jornadas.`, s:'Resultados'}); }
  const dsx=playerStats(pid,null,'D'); if(dsx.pj){ const bp=Object.entries(dsx.partners).sort((a,b)=>(b[1].w-b[1].l)-(a[1].w-a[1].l))[0]; out.push({t:`En dobles (aparte): ${dsx.w}-${dsx.l}${bp?', su mejor pareja es '+pname(bp[0])+' ('+bp[1].w+'-'+bp[1].l+')':''}.`, s:'Resultados de dobles'}); }
  const tv=totalVotes(pid); if(tv) out.push({t:`Ha recibido ${tv} ${tv>1?'votos':'voto'} para MVP de sus compañeros.`, s:'Votaciones MVP'});
  const m=mvpCount(pid); if(m) out.push({t:`${m>1?m+' veces':'Una vez'} MVP de la jornada.`, s:'MVP publicado'});
  return out;
}
function selfSeries(dim){ if(!myBallot?.j) return []; return Object.entries(myBallot.j).map(([k,v])=>({j:+k.slice(1),v:+v.a?.[dim]})).filter(x=>x.v>0).sort((a,b)=>a.j-b.j); }
function privateInsights(){
  const out=[], r=selfSeries('s_rend');
  if(r.length>=3){ const a=r.slice(-3); if(a[2].v>a[1].v&&a[1].v>a[0].v) out.push('Tu autovaloración de rendimiento ha subido en las tres últimas jornadas.'); else if(a[2].v<a[1].v&&a[1].v<a[0].v) out.push('Tu autovaloración de rendimiento ha bajado en las tres últimas jornadas.'); }
  const avgs=SELF_DIMS.map(([k,l])=>{ const s=selfSeries(k); return {l,avg:s.length? sum(s.map(x=>x.v))/s.length : null}; }).filter(x=>x.avg!=null);
  if(avgs.length>=2){ avgs.sort((a,b)=>b.avg-a.avg); if(avgs[0].avg>avgs.at(-1).avg) out.push(`Te ves más fuerte en ${avgs[0].l.toLowerCase()} (${dec(avgs[0].avg)}) y más flojo en ${avgs.at(-1).l.toLowerCase()} (${dec(avgs.at(-1).avg)}).`); }
  if(me && r.length){ const st=playerStats(me), sr=sum(r.map(x=>x.v))/r.length;
    if(st.pj) out.push(`Te pones un ${dec(sr)} de media y en pista llevas un ${pct(st.w,st.pj)} % de victorias. Son medidas distintas: úsalas como contraste, no como veredicto.`);
    const v=totalVotes(me); if(v) out.push(`Has recibido ${v} ${v>1?'votos':'voto'} para MVP de tus compañeros.`); }
  return out;
}

/* ===================== COMPONENTES ===================== */
function avatar(p, cls=''){
  if(!p) return `<span class="av ${cls}">?</span>`;
  const ini=p.name.split(' ').map(x=>x[0]).slice(0,2).join('');
  const src = photos[p.id]?.t || photos[p.id]?.d;
  return `<span class="av ${cls}">${esc(ini)}${src?`<img src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()">`:''}</span>`;
}
const crest = (id,cls='') => id===POLO? `<img class="crestimg ${cls}" src="${ASSET.crestSm}" alt="" aria-hidden="true">` : `<span class="crest ${cls}" aria-hidden="true">${esc(team(id).abbr)}</span>`;
const plink = (id, txt) => `<button class="lnk" data-player="${esc(id)}">${esc(txt ?? pname(id))}</button>`;
const resBadge = r => `<span class="res ${r||'P'}">${r==='W'?'G':r==='L'?'P':'–'}</span>`;
function formStrip(seq,n=5){ const a=seq.slice(-n); while(a.length<n) a.unshift(''); return `<span class="form" aria-label="Últimos resultados">${a.map((x,k)=>`<i class="${x}" style="--k:${k}"></i>`).join('')}</span>`; }
const count = (v, suf='') => `<span data-count="${v}" data-suf="${suf}">${v}${suf}</span>`;

function scoreboard(f, big=false){
  const t=tieFromRubbers(f.j), p=persp(f), rubs=tie(f.j)?.rubbers||[];
  const rows=[f.home,f.away].map(id=>{ const us=id===POLO; let k=0;
    const cells=RUBBERS.map((R,i)=>{ const c=rubs[i]? rubberCalc(rubs[i]).res : null; const won=c&&((us&&c==='W')||(!us&&c==='L'));
      const na = R.type==='D' && !c && dblDecider() && !(t&&t.needsDoubles); return `<span class="cell ${won?'w':''} ${na?'na':''}" style="--i:${won?k++:0}">${won?'●':''}</span>`; }).join('');
    const tot = isPlayed(f)? (id===f.home? f.hs : f.as) : (t&&t.decided? (us? t.w : t.l) : '–');
    return `<span class="board-n ${us?'us':''}">${esc(us? CLUB.teamShort : team(id).short)}${id===f.home?'<i class="loc">Local</i>':''}</span>${cells}<span class="board-t ${tot==='–'?'dim':''}">${tot}</span>`; }).join('');
  const status = isPlayed(f)? (f.status==='official'? 'Final' : 'Final, provisional') : (t&&t.decided? '<span class="live">En juego</span>' : countdown(f));
  return `<a class="board ${big?'big':''}" href="#jornada-${f.j}">
    <div class="board-top"><b>Jornada ${f.j}</b><span>${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h</span><span>${status}</span></div>
    <div class="board-grid"><span></span>${RUBBERS.map(R=>`<span class="board-h">${R.type==='D'?'D':R.n}</span>`).join('')}<span class="board-h">Total</span>${rows}</div>
    <div class="board-foot"><span>${p.home? 'En casa, '+esc(CLUB.medium) : 'Fuera, en las pistas del '+esc(clubName(p.rival))}</span><span>${big?'':'Ver jornada'}</span></div></a>`;
}
function courtSVG(){ return `<svg class="court" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="#E2C47C" stroke-opacity=".32" stroke-width="1"><rect x="60" y="30" width="280" height="240"/><rect x="85" y="30" width="230" height="240"/><path d="M85 95h230M85 205h230M200 95v110"/><path d="M60 150h280"/></g></svg>`; }
const titleLetters = t => [...t].map((c,i)=>c===' '?' ':`<span style="--i:${i}">${esc(c)}</span>`).join('');
function lineChart(points,{h=180,invert=false,min=1,max=7,labels=true,unit=''}={}){
  const W=600,pad={l:28,r:12,t:12,b:24},n=NJ(); const x=j=>pad.l+(j-1)*(W-pad.l-pad.r)/Math.max(1,n-1); const y=v=>{const t=(v-min)/(max-min||1); return pad.t+(invert?t:1-t)*(h-pad.t-pad.b);};
  let g=''; for(let v=min;v<=max;v++){ g+=`<line x1="${pad.l}" x2="${W-pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/>`; if(labels) g+=`<text x="${pad.l-8}" y="${y(v)+4}" text-anchor="end">${v}${unit}</text>`; }
  for(let j=1;j<=n;j++) g+=`<text x="${x(j)}" y="${h-6}" text-anchor="middle">J${j}</text>`;
  const path=points.map((p,i)=>`${i?'L':'M'}${x(p.j)},${y(p.v)}`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">${g}${points.length>1?`<path class="ln" d="${path}" fill="none" stroke="var(--brass)" stroke-width="2.5" stroke-linejoin="round"/>`:''}${points.map((p,k)=>`<circle class="dt" style="--k:${k}" cx="${x(p.j)}" cy="${y(p.v)}" r="5" fill="var(--brass)" stroke="var(--bg)" stroke-width="2"/>`).join('')}</svg>`;
}
function barsChart(items,h=170){
  const W=600,pad={l:24,r:8,t:10,b:24},n=Math.max(1,NJ()),max=5,bw=(W-pad.l-pad.r)/n; let g='';
  for(let v=0;v<=max;v++){ const yy=pad.t+(1-v/max)*(h-pad.t-pad.b); g+=`<line x1="${pad.l}" x2="${W-pad.r}" y1="${yy}" y2="${yy}" stroke="var(--line)"/><text x="${pad.l-6}" y="${yy+4}" text-anchor="end">${v}</text>`; }
  for(let j=1;j<=n;j++){ const it=items.find(i=>i.j===j), cx=pad.l+(j-.5)*bw; g+=`<text x="${cx}" y="${h-6}" text-anchor="middle">J${j}</text>`;
    if(it){ const ha=(it.a/max)*(h-pad.t-pad.b), hb=(it.b/max)*(h-pad.t-pad.b), base=h-pad.b;
      g+=`<rect class="br" style="--k:${j}" x="${cx-bw*.32}" y="${base-ha}" width="${bw*.3}" height="${ha}" rx="2" fill="var(--win)"/><rect class="br" style="--k:${j}" x="${cx+bw*.02}" y="${base-hb}" width="${bw*.3}" height="${hb}" rx="2" fill="var(--loss)" opacity=".75"/>`; } }
  return `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">${g}</svg>`;
}
function ring(v,label){ const C=2*Math.PI*46; return `<div class="ring"><svg width="110" height="110" viewBox="0 0 110 110"><circle class="bg" cx="55" cy="55" r="46"/><circle class="v" cx="55" cy="55" r="46" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${C*(1-(v||0))}"/></svg><b>${v==null?'–':count(Math.round(v*100),'%')}</b><small>${esc(label)}</small></div>`; }
function meter(l,s,v,txt,cls=''){ return `<div class="meter"><span>${l}<small>${s}</small></span><span class="bar"><i class="${cls}" data-w="${v==null?0:Math.round(Math.max(0,Math.min(1,v))*100)}"></i></span><b>${txt}</b></div>`; }
function standingsTable(rows,compact=false){
  return `<div class="tscroll"><table><thead><tr><th>Equipo</th><th>PJ</th>${compact?'':'<th>G</th><th>P</th><th>Partidos</th><th class="l">Forma</th>'}<th>Pts</th></tr></thead><tbody class="stagger">
  ${rows.map(r=>`<tr class="${r.id===POLO?'us':''}"><td><span class="pos">${r.pos}</span>${esc(compact? team(r.id).short : team(r.id).name)}</td><td>${r.stale?'–':r.pj}</td>${compact?'':(r.stale? '<td>–</td><td>–</td><td>–</td><td class="l"></td>' : `<td>${r.g}</td><td>${r.p}</td><td>${r.rw}-${r.rl}</td><td class="l">${formStrip(r.form,4)}</td>`)}<td><b>${r.pts}</b></td></tr>`).join('')}</tbody></table></div>`;
}

/* Carteles de partido */
function posters(j){
  const f=poloFix(j); if(!f) return ''; const t=tie(j); const p=persp(f); const tr=tieFromRubbers(j);
  const any = t && t.rubbers.some(r=>(r.polo||[]).length);
  if(!any || !lineupVisible(j)) return '';
  return `<div class="posters stagger">${t.rubbers.map((r,i)=>{ const c=rubberCalc(r);
    if(r.type==='D' && !(r.polo||[]).length && !(tr&&tr.needsDoubles)) return '';
    const left = r.type==='D'? `<span class="duo">${(r.polo.length?r.polo:['','']).map(id=>avatar(player(id))).join('')}</span><span>${r.polo.length? r.polo.map(id=>esc(pname(id).split(' ')[0])).join(' y ') : 'Pareja por decidir'}</span>` : `${avatar(player(r.polo[0]))}<span>${esc(pname(r.polo[0]))}</span>`;
    return `<button class="poster press" data-present="${j}:${i}">${c.res? resBadge(c.res):''}<span class="lab">${RUBBERS[i].label}</span>
      <span class="side">${left}</span><span class="vsx">VS</span><span class="side">${crest(p.rival)}<span>${esc(team(p.rival).short)}</span></span>
      <span class="score">${c.sets.length? c.sets.map(s=>s.join('-')).join('  ') : 'Toca para ver la presentación'}</span></button>`; }).join('')}</div>`;
}

