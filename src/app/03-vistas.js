/* ===================== VISTAS ===================== */
/* ---------- Portada por perfiles: diseño propio, con su estilo incluido en la app ---------- */
const IC={pin:'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',cal:'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  mega:'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12',
  lock:'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3', team:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.4 3.3-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16.5 4.3a3.4 3.4 0 0 1 0 6.4M18 14.6c2 .7 3.3 2.6 3.6 5.4',
  score:'M4 5h16v14H4zM12 5v14M4 12h16', trophy:'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 13v4M8 20h8M10 17h4',
  check:'M5 12.5l4.5 4.5L19 7.5', x:'M6 6l12 12M18 6L6 18', clock:'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', list:'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  vote:'M4 13l4 4 12-12M4 21h16', ball:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM5.6 5.6c3.5 3.5 3.5 9.3 0 12.8M18.4 5.6c-3.5 3.5-3.5 9.3 0 12.8', arrow:'M5 12h14M13 6l6 6-6 6'};
const svgi=(k,s=20,w=1.9)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[k]}"/></svg>`;
const hxDaysTo = f => Math.ceil((new Date(f.date+'T'+(f.time||'15:00')).getTime()-Date.now())/864e5);
const whenTxt = f => countdown(f);
function miniRing(v,max,label,tone=''){ const C=2*Math.PI*17, fr=max? Math.max(0,Math.min(1,v/max)) : 0;
  return `<div class="hx-ring ${tone}"><svg viewBox="0 0 42 42" width="54" height="54"><circle cx="21" cy="21" r="17" class="bg"/><circle cx="21" cy="21" r="17" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${C*(1-fr)}"/></svg><b>${v}</b><span>${label}</span></div>`; }
function opsCard(){
  if(!canManage || !S.fixtures.length) return ''; const j=adminJ(); const f=j&&poloFix(j); if(!f) return '';
  const ph=phases(j), idx=ph.findIndex(x=>x.st!=='done'), pa=pendingAction(), a=availFor(j), t=tie(j)||{}, tr=tieFromRubbers(j)||{}, p=persp(f);
  const na= idx<0? null : nextAction(j), urgent=!!pa, roster=a.total||S.players.filter(x=>x.active!==false).length;
  const icons=['cal','mega','lock','team','score','trophy'], names=['Calendario','Disponibilidad','Cierre','Convocatoria','Resultados','MVP'];
  const pendRes=(t.rubbers||[]).filter(r=>(r.type==='S'||tr.needsDoubles) && !rubberCalc(r).res).length, after=Date.now()>new Date(f.date+'T'+(f.time||'15:00')).getTime();
  return `<section class="sec"><div class="hx-ops ${urgent?'urgent':''}" data-home-j="${j}">
    <div class="hx-ops-top"><span class="hx-k">Tu gestión, jornada ${j}</span><a class="hx-open" href="#admin" data-act="go-admin" data-j="${j}" data-t="${idx<0?'post':ph[idx].k}">Abrir gestión ${svgi('arrow',15)}</a></div>
    <div class="hx-match"><div class="hx-side">${crest(POLO,'lg')}<b>${esc(CLUB.teamShort)}</b></div><div class="hx-vs"><span>${p.home?'en casa':'fuera'}</span><b>vs</b><em>${esc(whenTxt(f))}</em></div><div class="hx-side">${crest(p.rival,'lg')}<b>${esc(clubName(p.rival))}</b></div></div>
    <p class="hx-date">${svgi('cal',15)} ${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h</p>
    <ol class="hx-steps">${ph.map((x,i)=>`<li class="${x.st} ${i===idx?'now':''}" title="${esc(x.l)}: ${esc(x.d)}"><i>${x.st==='done'? svgi('check',15,2.4) : svgi(icons[i],15)}</i><span>${names[i]}</span></li>`).join('')}</ol>
    ${na? `<div class="hx-next"><div><span class="hx-k2">${urgent?'Siguiente paso':'Próximo paso, aún hay margen'}</span><b>${esc(na.t)}</b><p>${esc(na.d)}</p></div><div class="hx-btns">${na.b}</div></div>`
         : `<div class="hx-next done"><div><span class="hx-k2">Jornada completada</span><b>Todo publicado</b><p>Estadísticas, clasificación y perfiles al día.</p></div></div>`}
    <div class="hx-rings">${miniRing(a.yes.length,roster,'disponibles','ok')}${miniRing(a.none.length,roster,'sin responder',a.none.length&&!deadlinePassed(j)?'warn':'')}${miniRing((t.convocados||[]).length,Math.max(5,(t.convocados||[]).length),'convocados')}${after? miniRing(pendRes,5,'sin resultado',pendRes?'warn':'ok') : ''}</div>
  </div></section>`;
}
function myJornadaBlock(f){
  if(!f) return ''; const j=f.j, t=tie(j)||{}, pub=!!t.lineupPub, av=me? avOf(me,j) : null, open=availOpen(f);
  if(!me) return '';
  let conv='Aún no publicada', cTone='', cIc='list';
  if(pub){ const ri=(t.rubbers||[]).map((r,i)=>(r.polo||[]).includes(me)? i : -1).filter(i=>i>=0);
    if(ri.length){ conv='Convocado: '+ri.map(i=>i<4? 'individual '+(i+1) : 'dobles').join(' y '); cTone='ok'; cIc='check'; }
    else if((t.convocados||[]).includes(me)){ conv='Convocado como suplente'; cTone='ok'; cIc='check'; } else { conv='No convocado esta vez'; cIc='x'; } }
  const A = av? ({yes:['Disponible','ok','check'],no:['No disponible','ko','x'],maybe:['Por confirmar','mid','clock']}[av.s]||[av.s,'','clock']) : open? ['Sin responder','todo','clock'] : deadlinePassed(j)? ['Plazo cerrado','','lock'] : ['Aún no se ha pedido','','clock'];
  return `<section class="sec"><div class="hx-my"><div class="hx-my-h"><span class="hx-k3">Tu próxima jornada</span><b>Jornada ${j}</b><em>${esc(whenTxt(f))}</em></div>
    <div class="hx-tiles"><a class="hx-tile ${A[1]}" href="${open? '#disponibilidad-'+j : '#jornada-'+j}"><i>${svgi(A[2],22,2.2)}</i><div><span>Tu disponibilidad</span><b>${esc(A[0])}</b>${open? `<em>${av?'Cambiar respuesta':'Responder ahora'} ${svgi('arrow',13)}</em>` : ''}</div></a>
      <a class="hx-tile ${cTone}" href="#jornada-${j}"><i>${svgi(cIc,22,2.2)}</i><div><span>Convocatoria</span><b>${esc(conv)}</b><em>Ver la jornada ${svgi('arrow',13)}</em></div></a></div>
    ${pub? `<div style="margin-top:14px">${posters(j)}</div>` : ''}</div></section>`;
}
function myStatsBlock(){
  if(!me || !player(me)) return ''; const s=playerStats(me), d=playerStats(me,null,'D'), mv=mvpCount(me);
  if(!s.pj && !d.pj) return `<section class="sec"><div class="hx-empty"><div class="hx-ballwrap"><span class="hx-ball"></span></div><div><span class="hx-k3">Tus estadísticas</span><b>Tu temporada empieza en tu primer partido</b><p>Aquí verás tu win rate, tu racha, tus partidos de dobles y tus MVP en cuanto juegues.</p><a class="btn sm" href="#mi-ficha">Completa tu ficha mientras tanto</a></div></div></section>`;
  const wr=s.pj? Math.round(s.w*100/s.pj) : 0, C=2*Math.PI*44, seq=(s.seq||[]).slice(-5);
  return `<section class="sec"><div class="sec-h"><h2>Tus estadísticas</h2><a href="#jugador-${esc(me)}">Tu perfil</a></div>
    <div class="hx-stats"><div class="hx-wr"><svg viewBox="0 0 100 100" width="118" height="118"><circle cx="50" cy="50" r="44" class="bg"/><circle cx="50" cy="50" r="44" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${C*(1-wr/100)}"/></svg><div><b>${s.pj? count(wr,'%') : '–'}</b><span>win rate</span></div></div>
      <div class="hx-sg"><div><b>${count(s.w)}<small>-${s.l}</small></b><span>individuales</span></div><div><b>${count(d.w)}<small>-${d.l}</small></b><span>dobles</span></div>
        <div><b class="hx-seq">${seq.length? seq.map(x=>`<i class="${x==='W'?'w':'l'}"></i>`).join('') : '–'}</b><span>últimos individuales</span></div><div><b>${count(mv)}</b><span>${mv===1?'MVP':'MVP'}</span></div></div></div></section>`;
}
function teamEvents(){ const ev=[];
  S.fixtures.filter(f=>f.home===POLO||f.away===POLO).forEach(f=>{ const j=f.j, t=tie(j)||{}, k=jid(j), p=persp(f), riv=clubName(p.rival);
    if(isPlayed(f)){ const w=p.ps>p.rs; ev.push({at:new Date(f.date+'T'+(f.time||'15:00')).getTime()+3*36e5, ic:w?'win':'loss', i:'score', t:`${w?'Victoria':'Derrota'} ${p.ps}-${p.rs} contra ${riv}`, s:`Jornada ${j}${f.status==='official'?'':', pendiente de validar'}`, href:'#jornada-'+j}); }
    (t.msgLog||[]).forEach(m=>ev.push({at:m.at, ic:'info', i:'mega', t:'Mensaje del equipo: '+m.text.slice(0,70)+(m.text.length>70?'…':''), s:`Jornada ${j}, ${m.ch==='push'?'notificación':'WhatsApp'}`, href:'#jornada-'+j}));
    if(t.availReq?.at) ev.push({at:t.availReq.at, ic:'info', i:'mega', t:`Disponibilidad abierta para la jornada ${j}`, s:`Contra ${riv}`, href:'#disponibilidad-'+j});
    if(t.lineupPub && t.lineupPubAt) ev.push({at:t.lineupPubAt, ic:'info', i:'team', t:`Convocatoria publicada, jornada ${j}`, s:`${(t.convocados||[]).length} convocados contra ${riv}`, href:'#jornada-'+j});
    if(S.mvp?.[k]?.openedAt) ev.push({at:S.mvp[k].openedAt, ic:'gold', i:'vote', t:`Votación del MVP abierta, jornada ${j}`, s:'Un voto por jugador', href:'#mvp-'+j});
    if(S.published?.[k]?.mvp && S.published[k].at) ev.push({at:S.published[k].at, ic:'gold', i:'trophy', t:`${pname(S.published[k].mvp)}, MVP de la jornada ${j}`, s:`Contra ${riv}`, href:'#jornada-'+j, pid:S.published[k].mvp}); });
  return ev.filter(e=>e.at<=Date.now()+6e4).sort((a,b)=>b.at-a.at).slice(0,6); }
function activityBlock(){ const ev=teamEvents(); if(!ev.length) return '';
  return `<section class="sec"><div class="sec-h"><h2>Actividad del equipo</h2></div><ol class="hx-feed">${ev.map(e=>`<li><a href="${e.href}"><i class="${e.ic}">${e.pid? avatar(player(e.pid),'sm') : svgi(e.i,17)}</i><div><b>${esc(e.t)}</b><span>${esc(e.s)}</span></div><time>${relTime(e.at)}</time></a></li>`).join('')}</ol></section>`; }
const HOME_CSS = `
.mvtag{display:inline-block;font-size:.72rem;font-weight:700;padding:2px 8px;border-radius:999px;margin-left:6px;vertical-align:middle}.mvtag.ad{background:#E7EEF6;color:#3c5f86}.mvtag.ap{background:#F3EAD3;color:#94722A}
.mvbox{display:grid;gap:12px;padding:14px 16px;border-radius:18px;border:1px solid var(--line,#e3e6df);background:var(--surface,#fff);margin-bottom:14px}.mvbox b{display:block;font-stretch:72%;font-size:1.3rem;line-height:1.15;margin:2px 0}.mvf{display:grid;grid-template-columns:1fr 140px;gap:10px}
.hx-k{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold,#E2C47C)}
.hx-k2{display:block;font-size:.68rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--brass,#94722A)}
.hx-k3{display:block;font-size:.7rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--brass,#94722A)}
.hx-ops{position:relative;overflow:hidden;border-radius:24px;padding:20px 20px 18px;color:#F2F5F0;background:radial-gradient(420px 220px at 105% -10%,rgba(226,196,124,.22),transparent 60%),radial-gradient(380px 260px at -10% 120%,rgba(255,255,255,.07),transparent 60%),linear-gradient(160deg,#123d30 0%,#0b2a21 100%);box-shadow:0 24px 48px -30px rgba(6,30,22,.9);display:grid;gap:16px;isolation:isolate}
.hx-ops::before{content:"";position:absolute;inset:16px;border:1px solid rgba(255,255,255,.07);border-radius:16px;pointer-events:none;z-index:-1;background:linear-gradient(rgba(255,255,255,.06),rgba(255,255,255,.06)) center/1px 100% no-repeat,linear-gradient(rgba(255,255,255,.05),rgba(255,255,255,.05)) center/100% 1px no-repeat}
.hx-ops-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
.hx-open{display:inline-flex;align-items:center;gap:6px;color:#F2F5F0;text-decoration:none;font-weight:700;font-size:.82rem;padding:7px 12px;border-radius:999px;background:rgba(255,255,255,.1);transition:background .2s}
.hx-open:hover{background:rgba(255,255,255,.18)}
.hx-match{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px}
.hx-side{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;min-width:0}
.hx-side b{font-stretch:72%;font-weight:750;font-size:1.25rem;line-height:1.05;overflow-wrap:anywhere}
.hx-side .crestimg,.hx-side .crest{width:58px!important;height:58px!important;font-size:.85rem}
.hx-side .crest{display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-weight:800}
.hx-vs{display:flex;flex-direction:column;align-items:center;gap:2px}
.hx-vs span{font-size:.66rem;letter-spacing:.08em;text-transform:uppercase;color:rgba(242,245,240,.6)}
.hx-vs b{font-stretch:62%;font-weight:800;font-size:2.3rem;line-height:1;color:var(--gold,#E2C47C)}
.hx-vs em{font-style:normal;font-size:.74rem;font-weight:700;padding:3px 9px;border-radius:999px;background:rgba(226,196,124,.16);color:var(--gold,#E2C47C)}
.hx-date{display:flex;align-items:center;justify-content:center;gap:6px;margin:-4px 0 0;font-size:.86rem;color:rgba(242,245,240,.75)}
.hx-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(6,1fr);position:relative}
.hx-steps::before{content:"";position:absolute;left:8%;right:8%;top:15px;height:2px;background:rgba(255,255,255,.12)}
.hx-steps li{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;padding:0!important;text-align:center}
.hx-steps i{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#0b2a21;border:2px solid rgba(255,255,255,.18);color:rgba(242,245,240,.55);transition:all .3s}
.hx-steps .done i{background:var(--gold,#E2C47C);border-color:var(--gold,#E2C47C);color:#0b2a21}
.hx-steps .doing i{border-color:rgba(226,196,124,.6);color:var(--gold,#E2C47C)}
.hx-steps .now i{border-color:var(--gold,#E2C47C);color:var(--gold,#E2C47C);box-shadow:0 0 0 0 rgba(226,196,124,.5);animation:hxpulse 2s infinite}
.hx-steps span{font-size:.62rem;color:rgba(242,245,240,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.hx-steps .now span,.hx-steps .done span{color:#F2F5F0;font-weight:700}
@keyframes hxpulse{0%{box-shadow:0 0 0 0 rgba(226,196,124,.45)}100%{box-shadow:0 0 0 9px rgba(226,196,124,0)}}
.hx-next{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:16px;border-radius:18px;background:#F7F5EF;color:#13261F;box-shadow:0 10px 24px -18px rgba(0,0,0,.6)}
.hx-ops:not(.urgent) .hx-next{background:rgba(255,255,255,.08);color:#F2F5F0;box-shadow:none}
.hx-ops:not(.urgent) .hx-next .hx-k2{color:rgba(242,245,240,.6)}
.hx-next b{display:block;font-stretch:72%;font-weight:750;font-size:1.35rem;line-height:1.1;margin-top:3px}
.hx-next p{margin:5px 0 0;font-size:.86rem;opacity:.78;line-height:1.35}
.hx-next.done{background:rgba(226,196,124,.14);color:#F2F5F0;grid-template-columns:1fr}
.hx-btns{display:flex;flex-wrap:wrap;gap:8px}
.hx-ops .hx-btns .btn.brass{background:linear-gradient(180deg,#B9923F,#94722A);border-color:#94722A;color:#fff;box-shadow:0 8px 18px -10px rgba(148,114,42,.9)}
.hx-ops:not(.urgent) .hx-btns .btn{background:transparent;color:#F2F5F0;border:1px solid rgba(255,255,255,.35);box-shadow:none}
.hx-ops .hx-btns .btn.ghost{background:transparent;border:1px solid rgba(19,38,31,.25)}
.hx-rings{display:grid;grid-template-columns:repeat(auto-fit,minmax(70px,1fr));gap:6px}
.hx-ring{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center}
.hx-ring svg{transform:rotate(-90deg)}
.hx-ring .bg{fill:none;stroke:rgba(255,255,255,.12);stroke-width:4}
.hx-ring .fg{fill:none;stroke:#F2F5F0;stroke-width:4;stroke-linecap:round;transition:stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)}
.hx-ring.ok .fg{stroke:#6FCF97}.hx-ring.warn .fg{stroke:var(--gold,#E2C47C)}
.hx-ring b{position:absolute;top:13px;left:0;right:0;font-stretch:62%;font-weight:800;font-size:1.25rem}
.hx-ring span{font-size:.66rem;color:rgba(242,245,240,.7);line-height:1.15}
@media (max-width:560px){.hx-next{grid-template-columns:1fr}.hx-btns .btn{flex:1;justify-content:center}.hx-side b{font-size:1.05rem}.hx-steps span{font-size:.56rem}}
.hx-my{border-radius:24px;padding:18px;background:var(--surface,#fff);border:1px solid var(--line,#e3e6df);box-shadow:0 18px 40px -34px rgba(0,0,0,.45)}
.hx-my-h{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.hx-my-h .hx-k3{width:100%}
.hx-my-h b{font-stretch:62%;font-weight:800;font-size:2rem;line-height:1}
.hx-my-h em{font-style:normal;font-size:.74rem;font-weight:700;padding:3px 9px;border-radius:999px;background:var(--surface2,#eef0eb);color:var(--muted,#5b6b63)}
.hx-tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.hx-tile{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:18px;text-decoration:none;color:var(--ink,#13261F);background:var(--bg,#f4f5f1);border:1px solid transparent;transition:transform .15s,border-color .2s,box-shadow .2s}
.hx-tile:hover{border-color:var(--line,#e3e6df);box-shadow:0 10px 22px -18px rgba(0,0,0,.5)}
.hx-tile:active{transform:scale(.98)}
.hx-tile i{flex:none;width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:var(--surface,#fff);color:var(--muted,#5b6b63)}
.hx-tile span{display:block;font-size:.72rem;font-weight:600;color:var(--muted,#5b6b63)}
.hx-tile b{display:block;font-size:1.02rem;line-height:1.2;margin-top:2px}
.hx-tile em{display:inline-flex;align-items:center;gap:4px;font-style:normal;font-size:.76rem;font-weight:700;color:var(--brass,#94722A);margin-top:6px}
.hx-tile.ok i{background:#DDF1E6;color:#1F7A4D}.hx-tile.ok b{color:#1F7A4D}
.hx-tile.ko i{background:#F7E1DC;color:#B4472F}.hx-tile.ko b{color:#B4472F}
.hx-tile.mid i,.hx-tile.todo i{background:#F3EAD3;color:#94722A}
.hx-tile.todo{border-color:rgba(148,114,42,.45);background:linear-gradient(180deg,#FBF7EC,#F4F5F1)}
@media (max-width:440px){.hx-tiles{grid-template-columns:1fr}}
.hx-stats{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center;padding:18px;border-radius:24px;background:var(--surface,#fff);border:1px solid var(--line,#e3e6df)}
.hx-wr{position:relative;display:grid;place-items:center}
.hx-wr svg{transform:rotate(-90deg)}
.hx-wr .bg{fill:none;stroke:var(--surface2,#eef0eb);stroke-width:8}
.hx-wr .fg{fill:none;stroke:url(#none);stroke:#1F7A4D;stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)}
.hx-wr>div{position:absolute;text-align:center}
.hx-wr b{display:block;font-stretch:62%;font-weight:800;font-size:2rem;line-height:1}
.hx-wr span{font-size:.68rem;color:var(--muted,#5b6b63)}
.hx-sg{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px}
.hx-sg b{display:block;font-stretch:62%;font-weight:800;font-size:1.8rem;line-height:1}
.hx-sg b small{font-size:1.1rem;color:var(--muted,#5b6b63);font-weight:700}
.hx-sg span{font-size:.72rem;color:var(--muted,#5b6b63)}
.hx-seq{display:flex!important;gap:4px;align-items:center;height:28px}
.hx-seq i{width:16px;height:16px;border-radius:50%;display:block;background:#d5dbd7}
.hx-seq i.w{background:radial-gradient(circle at 35% 30%,#f2ff8a,#c9e033 60%,#a8bf22);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.6)}
@media (max-width:420px){.hx-stats{grid-template-columns:1fr;justify-items:center}.hx-sg{width:100%}}
.hx-empty{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center;padding:20px;border-radius:24px;background:linear-gradient(135deg,var(--surface,#fff),var(--bg,#f4f5f1));border:1px solid var(--line,#e3e6df)}
.hx-empty b{display:block;font-stretch:72%;font-weight:750;font-size:1.3rem;line-height:1.15;margin:3px 0 4px}
.hx-empty p{margin:0 0 12px;color:var(--muted,#5b6b63);font-size:.9rem}
.hx-ballwrap{width:74px;height:74px;display:grid;place-items:center;border-radius:22px;background:#123d30}
.hx-ball{width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f2ff8a,#c9e033 60%,#9fb51e);position:relative;animation:hxbounce 1.6s cubic-bezier(.3,0,.3,1) infinite}
.hx-ball::after{content:"";position:absolute;inset:4px;border-radius:50%;border:2px solid rgba(255,255,255,.75);border-left-color:transparent;border-right-color:transparent;transform:rotate(25deg)}
@keyframes hxbounce{0%,100%{transform:translateY(-6px)}50%{transform:translateY(5px) scale(1.04,.96)}}
@media (max-width:420px){.hx-empty{grid-template-columns:1fr;text-align:center;justify-items:center}}
.hx-feed{list-style:none;margin:0;padding:0;position:relative}
.hx-feed::before{content:"";position:absolute;left:19px;top:10px;bottom:10px;width:2px;background:var(--line,#e3e6df)}
.hx-feed a{position:relative;display:grid;grid-template-columns:40px 1fr auto;gap:12px;align-items:center;padding:10px 0;text-decoration:none;color:var(--ink,#13261F)}
.hx-feed i{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--surface,#fff);border:2px solid var(--line,#e3e6df);color:var(--muted,#5b6b63);z-index:1;overflow:hidden}
.hx-feed i .av{width:36px;height:36px}
.hx-feed i.win{background:#DDF1E6;border-color:#bfe3cf;color:#1F7A4D}.hx-feed i.loss{background:#F7E1DC;border-color:#efc9bf;color:#B4472F}.hx-feed i.gold{background:#F3EAD3;border-color:#e6d6ad;color:#94722A}.hx-feed i.info{background:#E7EEF6;border-color:#d3dfeb;color:#3c5f86}
.hx-feed b{display:block;font-size:.95rem;font-weight:700;line-height:1.25}
.hx-feed span{display:block;font-size:.8rem;color:var(--muted,#5b6b63);margin-top:1px}
.hx-feed time{font-size:.74rem;color:var(--muted,#5b6b63);white-space:nowrap}
.hx-feed li+li a{border-top:1px solid transparent}
@media (prefers-reduced-motion: reduce){.hx-steps .now i,.hx-ball{animation:none}.hx-ring .fg,.hx-wr .fg{transition:none}}
`;
function ensureHomeCss(){ if(document.getElementById('hx-css')) return; const st=document.createElement('style'); st.id='hx-css'; st.textContent=HOME_CSS; document.head.appendChild(st); }
const CSS_VERSION='20261108';
function checkCssVersion(){ if(ui.cssChecked) return; ui.cssChecked=true; try{ const v=getComputedStyle(document.documentElement).getPropertyValue('--polo-css').trim().replace(/["']/g,''); if(v!==CSS_VERSION && (isAdmin||canManage)) setTimeout(()=>toast('Aviso para el administrador: falta subir el styles.css nuevo a GitHub; algunas pantallas pueden verse sin diseño.'),1500); }catch(e){} }

function vInicio(){
  const nx=nextPoloFix(), last=lastPoloPlayed(), st=standings(), mine=st.find(r=>r.id===POLO), ts=teamStats();
  const photo = `${courtSVG()}<span class="ball" aria-hidden="true"></span>${photos._team?.d?`<div class="hero-media"><img src="${esc(photos._team.d)}" alt="Equipo del ${esc(CLUB.medium)}"></div>`:''}`;
  let h=`<section class="hero">${photo}<div class="wrap hero-in">
    <p class="hero-comp">${esc(S.comp.name)}, ${esc(S.comp.group)}</p>
    <h1 class="hero-title" aria-label="${esc(teamLabel())}">${titleLetters(teamLabel())}</h1>
    <p class="hero-sub">${esc(CLUB.name)}, temporada ${esc(S.seasonId||viewSeason)}</p>
    ${nx? scoreboard(nx) : ''}</div></section><div class="wrap">`;
  // 1) capitán: centro de operaciones  2) tareas del jugador  3) su próxima jornada  4) resultados  5) clasificación  6) sus números  7) actividad
  ui.homeMyj=true; const co=callouts(nx); ui.homeMyj=false;
  h+=appsNudge()+opsCard()+myJornadaBlock(nx)+(nx? `<section class="sec">${ixJornadaCta(nx.j)}</section>` : '')+(co? `<section class="sec"><div class="sec-h"><h2>Tienes pendiente</h2></div><div class="tasks">${co}</div></section>` : '');
  if(last){ const c=cronica(last.j);
    h+=`<section class="sec"><div class="sec-h"><h2>Último resultado</h2><a href="#jornada-${last.j}">Ver jornada ${last.j}</a></div>
    <div class="split"><div>${scoreboard(last,true)}</div><div><p class="cronica" style="margin-top:0">${esc(c.txt)}${c.partial?'<small>Faltan los resultados individuales; la crónica se completará cuando se carguen.</small>':''}</p>${S.published[jid(last.j)]?.mvp? mvpCard(last.j) : ''}</div></div></section>`; }
  h+=`<section class="sec"><div class="sec-h"><h2>Clasificación</h2><a href="#clasificacion">${(mine.pj||mine.off)? mine.pos+'º, '+mine.pts+' puntos' : 'Liga completa'}</a></div>${standingsTable(st,true)}<p class="source">${standingsSource()}</p></section>`;
  h+=myStatsBlock()+activityBlock()+`</div>`;
  return h;
}
function leadersBlock(){
  const rows=S.players.filter(p=>p.active!==false).map(p=>({p,st:playerStats(p.id)})).filter(x=>x.st.pj).sort((a,b)=>wilson(b.st.w,b.st.pj)-wilson(a.st.w,a.st.pj)||b.st.w-a.st.w).slice(0,5);
  if(!rows.length) return '';
  return `<section class="sec"><div class="sec-h"><h2>Líderes en individuales</h2><a href="#stats" data-act="stats-go" data-v="jugadores">Todas las estadísticas</a></div><div class="leaders stagger">${rows.map((x,i)=>`<button class="leader press" data-player="${esc(x.p.id)}"><span class="lp">${i+1}</span>${avatar(x.p)}<span class="ln">${esc(x.p.name)}<small>${x.st.pj} ${x.st.pj===1?'individual':'individuales'}</small></span><span class="lw">${pct(x.st.w,x.st.pj)}%<small>${x.st.w}-${x.st.l}</small></span></button>`).join('')}</div>
    <p class="source">Solo individuales. El orden tiene en cuenta el número de partidos jugados.</p></section>`;
}
function standingsSource(){ const lastJ=Math.max(0,...playedJornadas()), O=S.official, rules=`Victoria ${S.rules.win} puntos, derrota ${S.rules.loss}.`;
  if(O && Array.isArray(O.order) && O.asOf>0){
    if(O.asOf===lastJ) return `Orden oficial FCT tras la jornada ${O.asOf}. ${rules}`;
    if(O.asOf>lastJ) return `Clasificación oficial FCT tras la jornada ${O.asOf}. En la app solo hay resultados hasta la jornada ${lastJ||'ninguna'}: los partidos jugados, ganados y perdidos se completarán al registrar los que faltan.`;
    return `Calculada con los resultados introducidos. La clasificación oficial subida es de la jornada ${O.asOf}, anterior a tus últimos resultados. ${rules}`; }
  return `Calculada con los resultados introducidos. ${rules}`; }
function pendingAction(){
  if(!(isCaptain||isAdmin) || !S.fixtures.length) return null;
  const j=adminJ(); const f=j&&poloFix(j); if(!f) return null;
  const ph=phases(j), idx=ph.findIndex(x=>x.st!=='done'); if(idx<0) return null;
  const start=new Date(f.date+'T'+(f.time||'15:00')+':00').getTime(), days=(start-Date.now())/864e5, a=availFor(j), t=tie(j)||{};
  const ok=[ days<=(+S.rules.availDays||6)+2,                       // confirmar calendario: solo cuando se acerca
             availOpen(f),                                              // pedir disponibilidad: ventana abierta
             !a.none.length && a.total>0,                               // cerrar: solo si ya han respondido todos
             deadlinePassed(j) || days<=2,                              // convocatoria: plazo cerrado o partido muy cerca
             Date.now()>start+2*36e5,                                   // resultados: tras el partido
             !!mvpState(j) && !mvpOpen(j) && !S.published[jid(j)]?.mvp  // MVP: votación cerrada sin publicar
           ][idx];
  return ok? {j, idx, na:nextAction(j)} : null;
}
function captainNote(){ const p=pendingAction(); if(!p) return '';
  return `<section class="sec"><div class="nextcard capnote" data-home-j="${p.j}"><div><span class="nk">Gestión, jornada ${p.j}: siguiente paso</span><b>${esc(p.na.t)}</b><p>${esc(p.na.d)}</p></div><div class="row">${p.na.b}</div></div></section>`; }
function callouts(nx){
  let h=''; const ps=pendingSurveys();
  pendingMvp().forEach(j=>{ h+=`<div class="callout"><div><b>🏆 Vota al MVP de la jornada ${j}</b><span>Un voto por jugador. Abierta hasta el ${esc(fmtDT(new Date(mvpState(j).deadline)))}.</span></div><div class="row"><a class="btn light" href="#mvp-${j}">Votar</a></div></div>`; });
  ps.forEach(j=>{ h+= ixFichaPending(j)
    ? `<div class="callout"><div><b>Completa la ficha de tu partido, jornada ${j}</b><span>Ya respondiste la encuesta. Falta la ficha contra ${esc(clubName(persp(poloFix(j)).rival))} para tu informe de jugador. Un minuto.</span></div><div class="row"><a class="btn light" href="#encuesta-${j}">Completar</a></div></div>`
    : `<div class="callout"><div><b>Encuesta de la jornada ${j}</b><span>Jugaste contra ${esc(clubName(persp(poloFix(j)).rival))}. Tardas dos minutos.</span></div><div class="row"><a class="btn light" href="#encuesta-${j}">Responder</a></div></div>`; });
  S.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&availOpen(f)).forEach(f=>{ if(!me || avOf(me,f.j) || (nx && f.j===nx.j && ui.homeMyj)) return; const p=persp(f);
    h+=`<div class="callout"><div><b>¿Puedes jugar el ${esc(fdate(f,{weekday:'long',day:'numeric'}))}?</b><span>Jornada ${f.j} contra ${esc(clubName(p.rival))}. Responde antes del ${esc(fmtDT(deadline(f.j)))}.</span></div><div class="row"><a class="btn light" href="#disponibilidad-${f.j}">Responder</a></div></div>`; });
  return h;
}
function availSummary(j,{compact=false}={}){
  const a=availFor(j); const seg=(k,c)=>a[k].length? `<i style="flex:${a[k].length};background:${c}" title="${AV_LABEL[k]}: ${a[k].length}"></i>`:'';
  return `<div class="avsum"><div class="avbar">${seg('yes','var(--win)')}${seg('maybe','var(--brass)')}${seg('no','var(--loss)')}${seg('none','var(--surface2)')}</div>
    <div class="avlegend"><span><b>${a.yes.length}</b> disponibles</span><span><b>${a.maybe.length}</b> pendientes de confirmar</span><span><b>${a.no.length}</b> no disponibles</span><span><b>${a.none.length}</b> sin responder</span><span class="pc">Disponibilidad <b>${dec(a.pct*100)} %</b></span></div></div>`;
}
function availBlock(f){
  const j=f.j, a=availFor(j), mine=me? avOf(me,j) : null, open=availOpen(f), dl=deadline(j);
  let h=`<div class="panel"><div class="row" style="justify-content:space-between;align-items:baseline"><b>Disponibilidad</b><span class="muted small">${open? 'Plazo hasta el '+esc(fmtDT(dl)) : deadlinePassed(j)? 'Plazo cerrado' : 'Se abre cuando el capitán la solicite'}</span></div>
    ${availSummary(j)}
    ${me && (open||mine)? `<div class="row" style="margin:6px 0 4px"><span class="small">Tu respuesta: <b>${mine? AV_LABEL[mine.s] : 'sin responder'}</b></span>${open?`<a class="btn sm ${mine?'ghost':'brass'}" href="#disponibilidad-${j}">${mine?'Cambiar':'Responder'}</a>`:''}</div>`:''}
    <div class="avail stagger" style="margin-top:10px">${['yes','maybe','no'].flatMap(k=>a[k].map(id=>`<span class="${k}">${avatar(player(id),'sm')}${esc(pname(id))}</span>`)).join('')}</div></div>`;
  return h;
}
const mvpState = j => S.mvp?.[jid(j)] || null;
function mvpOpen(j){ const m=mvpState(j); return !!(m && m.open && Date.now()<(+m.deadline||0) && !S.published[jid(j)]?.mvp); }
const mvpCandidates = j => participants(j);
function pendingMvp(){ if(!me) return []; return playedJornadas().filter(j=>poloFix(j) && mvpOpen(j) && !myVotes[jid(j)]); }
function mvpCard(j){
  const f=poloFix(j), p=S.published[jid(j)];
  if(!p?.mvp){ if(!f||!isPlayed(f)) return '';
    if(mvpOpen(j)) return `<a class="mvpvote press" href="#mvp-${j}"><span class="mv-ic">🏆</span><span><b>${myVotes[jid(j)]? 'Ya has votado al MVP' : 'Vota al MVP de la jornada'}</b><small>Abierta hasta el ${esc(fmtDT(new Date(mvpState(j).deadline)))}</small></span><span class="mv-go">${myVotes[jid(j)]?'✓':'Votar'}</span></a>`;
    return `<p class="source">MVP de la jornada: ${mvpState(j)? 'votación cerrada, pendiente de publicar.' : 'la votación se abre al cargar el resultado.'}</p>`; }
  const pl=player(p.mvp), rv=persp(f).rival, open=ui.revealed[j], ph=photos[p.mvp]?.d;
  return `<button class="mvphero press ${open?'open':''}" data-act="reveal" data-j="${j}">
    <span class="mh-photo">${ph?`<img src="${esc(ph)}" alt="">`:`<i>${esc((pl?.name||'?').split(' ').map(x=>x[0]).slice(0,2).join(''))}</i>`}</span>
    <span class="mh-txt"><span class="mh-k">🏆 MVP de la jornada ${j}</span><span class="mh-n hid">${esc(pl?.name||'')}</span>
      <span class="mh-m hid">${p.votes} ${p.votes===1?'voto':'votos'}${p.voters?' de '+p.voters:''}${p.manual?' (decisión del capitán)':''}</span>
      <span class="mh-r">Contra ${esc(clubName(rv))}, ${esc(fdate(f,{day:'numeric',month:'long'}))}</span><span class="tap">Toca para revelarlo</span></span></button>`;
}
function momentsList(){
  const items=[];
  playedJornadas().slice().reverse().forEach(j=>{ if(!poloFix(j)) return; const c=cronica(j), p=S.published[jid(j)], t=tie(j);
    if(t?.moment) items.push({j,t:t.moment,s:'Momento de la jornada'}); if(p?.mvp) items.push({j,t:`${pname(p.mvp)}, MVP de la jornada ${j}.`,s:'Votación del equipo'}); if(c) items.push({j,t:c.txt,s:'Crónica automática'}); });
  if(!items.length) return `<div class="empty">Aquí aparecerán las crónicas, los MVP y los momentos de cada jornada.</div>`;
  return `<ul class="insights stagger">${items.slice(0,6).map(i=>`<li><a href="#jornada-${i.j}" style="text-decoration:none">${esc(i.t)}</a><small>J${i.j}, ${esc(i.s)}</small></li>`).join('')}</ul>`;
}
function rubberRow(r,i,f){
  const c=rubberCalc(r), tr=tieFromRubbers(f.j); const skip = r.type==='D' && !c.res && dblDecider() && !(tr&&tr.needsDoubles) && !(r.polo||[]).length;
  const who=(r.polo||[]).length? r.polo.map(id=>plink(id)).join(' y ') : '<span class="muted">Por designar</span>';
  return `<div class="rubber ${skip?'skip':''}"><span class="rn">${r.type==='D'?'D':r.n}</span><div><div class="p">${who}</div><div class="r">${RUBBERS[i].label} contra ${esc(clubName(persp(f).rival))}${skip?'. Solo si hay 2-2':''}</div></div>
  <div class="sets">${c.sets.length? c.sets.map(s=>s.join('-')).join('  ') : '–'}${r.note?`<small>${esc(r.note)}</small>`:''}<div style="margin-top:4px">${resBadge(c.res)}</div></div></div>`;
}

function ligaLede(){
  const nT=S.teams.length, nJ=NJ(), nums=['','un','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce'];
  const base=esc([S.comp.name, S.comp.memorial].filter(Boolean).join(', '))+(S.comp.group? '. '+esc(S.comp.group) : '')+'.';
  if(nT<2||!nJ) return base+' Calendario pendiente de cargar.';
  const per=S.fixtures.filter(f=>f.j===1).length, w=nums[nT]||String(nT);
  return `${base} ${w.charAt(0).toUpperCase()+w.slice(1)} clubes, ${nJ} jornadas${nT%2 && per*2<nT? '; cada jornada descansa uno' : ''}.`;
}
function ligaCalendar(){ return svCalendar(); }   // season-views.js
function ligaTable(){
  const st=standings(), evo=playedJornadas().map(j=>({j,v:standings(j).find(r=>r.id===POLO).pos}));
  return `<section class="sec"><div class="sec-h"><h2>Clasificación</h2></div>${standingsTable(st)}<p class="source">${standingsSource()}</p></section>
  <section class="sec"><div class="sec-h"><h2>Evolución del ${esc(teamLabel())}</h2></div>${evo.length? lineChart(evo,{invert:true,min:1,max:S.teams.length,unit:'º'}) : '<div class="empty">Sin jornadas disputadas.</div>'}</section>`;
}
// view: 'liga' (todo junto, como antes), 'clasificacion' o 'calendario' (pestañas separadas de la barra)
function vLiga(view='liga'){
  const title=view==='clasificacion'?'Clasificación':view==='calendario'?'Calendario':'La liga';
  return `<div class="wrap"><div class="pagehead"><h1>${title}</h1><p class="lede">${ligaLede()}</p></div>${view!=='calendario'? ligaTable() : ''}${view!=='clasificacion'? ligaCalendar() : ''}</div>`;
}

function vJornada(j){
  if(!(j>=1&&j<=NJ())) return vNotFound();
  const fs=S.fixtures.filter(f=>f.j===j), pf=fs.find(f=>f.home===POLO||f.away===POLO);
  let h=`<div class="wrap"><div class="pagehead"><div class="row" style="justify-content:space-between"><a class="textlink" href="#calendario">Calendario</a><span class="row">${j>1?`<a class="chip" href="#jornada-${j-1}">J${j-1}</a>`:''}${j<NJ()?`<a class="chip" href="#jornada-${j+1}">J${j+1}</a>`:''}</span></div>
    <h1 style="margin-top:14px">Jornada ${j}</h1><p class="lede">${esc(fdate(poloFix(j)||fs[0],{weekday:'long',day:'numeric',month:'long',year:'numeric'}))}, ${esc((poloFix(j)||fs[0]).time)} h ${movedTag(poloFix(j))}</p></div>`;
  if(!pf) h+=`<section class="sec"><div class="empty">El ${US} descansa en esta jornada.</div></section>`;
  else { const p=persp(pf), c=cronica(j), t=tie(j);
    h+=`<section class="sec">${scoreboard(pf,true)}${c?`<p class="cronica">${esc(c.txt)}<small>Crónica generada a partir de los resultados confirmados.${c.partial?' Faltan los resultados individuales.':''}</small></p>`:''}</section>`;
    if(isPlayed(pf)) h+=`<section class="sec">${mvpCard(j)}${t?.moment?`<p class="cronica" style="font-size:1rem"><b>Momento de la jornada.</b> ${esc(t.moment)}</p>`:''}</section>`;
    const pst=posters(j);
    if(lineupVisible(j) && lineupList(j).length) h+=`<section class="sec"><div class="sec-h"><h2>Convocatoria</h2>${canManage&&!t.lineupPub?'<span class="muted small">Borrador, solo la ven los administradores</span>':''}</div>${lineupStrip(j)}<div class="row" style="margin-top:14px"><button class="btn" data-act="poster-open" data-j="${j}">Ver el cartel</button>${canManage?`<button class="btn ghost sm" data-act="go-admin" data-j="${j}" data-t="conv">Editar</button>`:''}</div></section>`;
    h+=`<section class="sec"><div class="sec-h"><h2>Partidos</h2></div>${pst? pst+`<div style="margin-top:14px">${t.rubbers.map((r,i)=>rubberRow(r,i,pf)).join('')}</div>` : '<div class="empty">El orden de juego aparecerá cuando el capitán publique la convocatoria.</div>'}</section>`;
    if(!isPlayed(pf)) h+=`<section class="sec"><div class="sec-h"><h2>Disponibilidad</h2>${canManage?`<button class="textlink" data-act="go-admin" data-j="${j}" data-t="disp">Panel del capitán</button>`:''}</div>${availBlock(pf)}</section>`;
    if(pendingSurveys().includes(j)) h+=`<section class="sec"><div class="callout"><div><b>${ixFichaPending(j)? 'Falta la ficha de tu partido' : 'Tu encuesta de esta jornada'}</b><span>${ixFichaPending(j)? 'Con ella se construye tu informe de jugador.' : 'Solo la responden quienes jugaron.'}</span></div><div class="row"><a class="btn light" href="#encuesta-${j}">${ixFichaPending(j)? 'Completar' : 'Responder'}</a></div></div></section>`;
    const hist=teamStats().vs[p.rival];
    h+=`<section class="sec">${ixJornadaCta(j)}</section>`;
    h+=`<section class="sec"><div class="sec-h"><h2>Contra ${esc(clubName(p.rival))}</h2></div>${crest(p.rival,'')}${hist? `<p>Esta temporada: ${hist.w} ${hist.w===1?'victoria':'victorias'} y ${hist.l} ${hist.l===1?'derrota':'derrotas'}, ${hist.rw}-${hist.rl} en partidos.</p>`:'<p class="muted">Primer enfrentamiento de la temporada.</p>'}</section>`; }
  h+=`<section class="sec"><div class="sec-h"><h2>Resto de la jornada</h2></div><table><tbody>${fs.filter(f=>f!==pf).map(f=>`<tr><td>${esc(team(f.home).name)} <span class="muted">contra</span> ${esc(team(f.away).name)}</td><td>${isPlayed(f)?`<b>${f.hs}-${f.as}</b>`:'<span class="muted">Pendiente</span>'}</td></tr>`).join('')}</tbody></table><p class="source">Fuente: FCT.</p></section></div>`;
  return h;
}
const PORRA_OPTS=[[4,0],[3,1],[3,2],[2,3],[1,3],[0,4]];
function porraBlock(f){
  const k=jid(f.j), locked=Date.now()>=kickoff(f).getTime(), p=persp(f), mine=me? picks[me]?.j?.[k] : null;
  const all=Object.entries(picks).map(([pid,v])=>({pid,pk:v.j?.[k]})).filter(x=>x.pk);
  let h='';
  if(!locked && me) h+=`<p class="muted small">¿Cómo acabará? Se cierra al empezar la jornada.</p><div class="chips" style="margin:10px 0">${PORRA_OPTS.map(([a,b])=>`<button class="chip" data-act="pick" data-j="${f.j}" data-p="${a}" data-r="${b}" aria-pressed="${mine&&mine.p===a&&mine.r===b}">${US} ${a}-${b}</button>`).join('')}</div>`;
  if(all.length) h+=`<table class="stagger" style="margin-top:6px"><tbody>${all.map(x=>{ let pts=''; if(isPlayed(f)){ const s=porraPoints(x.pk,p); pts=`<b>${s} ${s===1?'punto':'puntos'}</b>`; } return `<tr><td>${plink(x.pid)}</td><td>${US} ${x.pk.p}-${x.pk.r}</td><td>${pts}</td></tr>`; }).join('')}</tbody></table>`;
  else h+=`<p class="muted small">Todavía no hay pronósticos.</p>`;
  return h;
}
function porraPoints(pk,p){ if(!p.played) return 0; if(pk.p===p.ps&&pk.r===p.rs) return 3; if((pk.p>pk.r)===(p.ps>p.rs)) return 1; return 0; }

function vEquipo(){
  const cap=S.players.find(p=>p.captain);
  return `<div class="wrap"><div class="pagehead"><h1>El equipo</h1><p class="lede">Plantilla del ${esc(teamLabel())} para la temporada ${esc(S.seasonId||viewSeason)}, en el orden de la lista del equipo. Capitán: ${esc(cap?.name||'')}. Toca a un jugador para ver sus números.</p></div>
  <section class="sec"><div class="pgrid stagger">${S.players.filter(p=>p.active!==false).sort((a,b)=>a.order-b.order).map(p=>{ const st=playerStats(p.id);
    return `<button class="pcard" data-player="${esc(p.id)}">${avatar(p)}<span><span class="nm">${esc(p.name)}${p.captain?'<span class="cap">Capitán</span>':''}</span><span class="sub">Nº ${p.order}, ${esc(p.cat)}</span></span><span class="rec">${(()=>{ const o=attrs(p.id).ovr; return o==null? '<span class="muted small">0 PJ</span>' : `<span class="ovrchip">${o}</span>`; })()}<small class="muted" style="display:block;font-size:.72rem">${st.pj? st.w+'-'+st.l+' ind.' : ''}</small></span></button>`; }).join('')}</div>
  <p class="source">Fuente: listado FCT del equipo. Índice y balance calculados con sus individuales.</p></section></div>`;
}
