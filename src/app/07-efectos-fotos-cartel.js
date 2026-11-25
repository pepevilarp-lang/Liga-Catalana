/* ===================== EFECTOS ===================== */
function afterRender(root){
  root.querySelectorAll('.stagger').forEach(l=>[...l.children].forEach((c,i)=>c.style.setProperty('--i',Math.min(i,14))));
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    root.querySelectorAll('[data-w]').forEach(el=>el.style.width=el.dataset.w+'%');
    root.querySelectorAll('.ring .v, .hx-ring .fg, .hx-wr .fg, .sv-ring .fg').forEach(el=>el.style.strokeDashoffset=el.dataset.off);
  }));
  const pc=root.querySelector('#poster-canvas'); if(pc) drawPoster(pc,+pc.dataset.j);
  root.querySelectorAll('[data-tilt]').forEach(c=>{ if(RM.matches) return; const mv=e=>{ const r=c.getBoundingClientRect(), x=((e.clientX??e.touches?.[0]?.clientX)-r.left)/r.width, y=((e.clientY??e.touches?.[0]?.clientY)-r.top)/r.height; if(!isFinite(x)) return; c.style.setProperty('--rx',((.5-y)*16).toFixed(2)+'deg'); c.style.setProperty('--ry',((x-.5)*20).toFixed(2)+'deg'); c.style.setProperty('--mx',(x*100).toFixed(1)+'%'); c.style.setProperty('--my',(y*100).toFixed(1)+'%'); };
    c.addEventListener('pointermove',mv); c.addEventListener('pointerleave',()=>{ c.style.setProperty('--rx','0deg'); c.style.setProperty('--ry','0deg'); }); });
  const els=root.querySelectorAll('[data-count]'); if(RM.matches) return;
  els.forEach(el=>{ const to=+el.dataset.count, suf=el.dataset.suf||''; if(!isFinite(to)||to===0) return; const t0=performance.now(), d=900;
    const step=t=>{ const k=Math.min(1,(t-t0)/d), e=1-Math.pow(1-k,3); el.textContent=Math.round(to*e)+suf; if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
}
function confetti(x,y,n=90){
  if(RM.matches) return; let c=$('#fx'); if(!c){ c=document.createElement('canvas'); c.id='fx'; document.body.appendChild(c); }
  const dpr=devicePixelRatio||1; c.width=innerWidth*dpr; c.height=innerHeight*dpr; const g=c.getContext('2d'); g.scale(dpr,dpr);
  const cols=['#E2C47C','#F1F4EF','#2A7A5F','#C9A85A','#D7E86A']; const P=Array.from({length:n},()=>({x,y,vx:(Math.random()-.5)*12,vy:-Math.random()*13-4,r:Math.random()*6+3,c:cols[Math.random()*cols.length|0],a:Math.random()*6,va:(Math.random()-.5)*.4,life:0}));
  const tick=()=>{ g.clearRect(0,0,innerWidth,innerHeight); let alive=0; P.forEach(p=>{ p.life++; p.vy+=.38; p.vx*=.985; p.x+=p.vx; p.y+=p.vy; p.a+=p.va; if(p.y<innerHeight+20&&p.life<160){ alive++; g.save(); g.translate(p.x,p.y); g.rotate(p.a); g.fillStyle=p.c; g.globalAlpha=Math.max(0,1-p.life/160); g.fillRect(-p.r/2,-p.r/4,p.r,p.r/2); g.restore(); } }); if(alive) requestAnimationFrame(tick); else g.clearRect(0,0,innerWidth,innerHeight); };
  tick();
}
/* Hoja rápida de jugador */
function openSheet(pid){
  const p=player(pid); if(!p) return; const st=playerStats(pid);
  let bg=$('.sheet-bg'), sh=$('.sheet'); if(!bg){ bg=document.createElement('div'); bg.className='sheet-bg'; sh=document.createElement('div'); sh.className='sheet'; sh.setAttribute('role','dialog'); sh.setAttribute('aria-modal','true'); document.body.append(bg,sh); bg.addEventListener('click',closeSheet); }
  const vs=Object.entries(st.vs);
  sh.innerHTML=`<div class="handle"></div><div class="top">${avatar(p,'lg')}<div><h2>${esc(p.name)}</h2><p class="muted small" style="margin:4px 0 0">Nº ${p.order}, ${esc(p.cat)}${p.captain?', capitán':''}${profiles[pid]?.nick? ', «'+esc(profiles[pid].nick)+'»' : ''}</p>${profiles[pid]?.motto? `<p class="sheetcry">📣 ${esc(profiles[pid].motto)}</p>` : ''}</div></div>
    <div class="row" style="gap:20px;margin-top:18px;align-items:center">${ring(st.pj?st.wr:null,'victorias')}<div class="figs stagger" style="flex:1;grid-template-columns:repeat(2,1fr)"><div class="fig"><b>${st.w}-${st.l}</b><span>individuales</span></div><div class="fig"><b>${(()=>{ const d=playerStats(pid,null,'D'); return d.w+'-'+d.l; })()}</b><span>dobles</span></div><div class="fig" style="border-left:0;padding-left:0;border-top:1px solid var(--line)"><b>${st.sw}-${st.sl}</b><span>sets</span></div><div class="fig" style="border-top:1px solid var(--line)"><b>${st.streak.n?(st.streak.t==='W'?'+':'−')+st.streak.n:'–'}</b><span>racha</span></div></div></div>
    <div style="margin-top:14px">${formStrip(st.seq,8)} <span class="muted small">últimos individuales</span></div>
    <div style="margin-top:10px">${meter('Juegos ganados','% del total',st.gw+st.gl?st.gw/(st.gw+st.gl):null,st.gw+st.gl?pct(st.gw,st.gw+st.gl)+'%':'–')}${meter('Votos','de los compañeros',totalVotes(pid)/Math.max(1,...S.players.map(x=>totalVotes(x.id))),totalVotes(pid),'sv')}</div>
    ${(()=>{ const av=availStats(pid); return av.total? meter('Disponibilidad',av.yes+' de '+av.total+' jornadas',av.pct,dec(av.pct*100)+'%') : ''; })()}
    ${vs.length?`<p class="small muted" style="margin:10px 0 0">${vs.map(([c,v])=>`${esc(team(c).short)} ${v.w}-${v.l}`).join(', ')}</p>`:''}
    <div class="row" style="margin-top:18px"><a class="btn" href="#jugador-${esc(pid)}" data-act="close-sheet">Ver ficha completa</a><button class="btn ghost" data-act="close-sheet">Cerrar</button></div>`;
  requestAnimationFrame(()=>{ bg.classList.add('on'); sh.classList.add('on'); afterRender(sh); });
  let y0=null; sh.ontouchstart=e=>{ if(sh.scrollTop<=0) y0=e.touches[0].clientY; }; sh.ontouchend=e=>{ if(y0!=null && e.changedTouches[0].clientY-y0>90) closeSheet(); y0=null; };
}
function closeSheet(){ $('.sheet-bg')?.classList.remove('on'); $('.sheet')?.classList.remove('on'); }
/* Presentación de partido */
let stageTimers=[];
function present(j,i){
  const f=poloFix(j), r=tie(j)?.rubbers?.[i]; if(!f||!r) return; const p=persp(f), c=rubberCalc(r);
  let st=$('.stage'); if(!st){ st=document.createElement('div'); st.className='stage'; st.setAttribute('role','dialog'); st.setAttribute('aria-modal','true'); document.body.appendChild(st); }
  const ids=r.polo||[]; const pls=ids.map(player).filter(Boolean);
  const leftName = pls.length? pls.map(x=>x.name.split(' ')[0]).join(' y ') : 'Por designar';
  const ghost = pls.length? pls[0].name.split(' ').slice(-1)[0] : 'POLO';
  const ps = ids.length===1? playerStats(ids[0]) : null; const dk=r.type==='D'?'D':'S'; const cs=clubSeason(p.rival); const vsRec = ps?.vs?.[p.rival];
  const avs = pls.length? pls.map(x=>avatar(x, pls.length>1?'lg':'xl')).join('') : avatar(null,'xl');
  st.innerHTML=`<div class="beam l"></div><div class="beam r"></div><button class="x" data-act="stage-close">Cerrar</button>
    <div class="ribbon">${RUBBERS[i].label}, jornada ${j}. ${p.home?'En casa':'Fuera'}, ${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}</div>
    <div class="versus"><div class="vside l"><span class="ghost">${esc(ghost)}</span><span class="duo" style="justify-content:center">${avs}</span><span class="nm">${esc(leftName)}</span><span class="meta"><img src="${ASSET.crestSm}" alt="" style="height:22px;vertical-align:-6px;margin-right:6px">${esc(CLUB.medium)}${pls.length===1?', nº '+pls[0].order:''}</span></div>
      <div class="vside r"><span class="ghost">${esc(team(p.rival).short)}</span>${crest(p.rival,'lg')}<span class="nm">${esc(team(p.rival).short)}</span><span class="meta">${esc(clubName(p.rival))}</span></div>
      <span class="vs">VS</span><span class="wave"></span><span class="wave w2"></span></div><div class="flash"></div>
    <div class="tape">${c.res?`<p style="text-align:center;font-stretch:62%;font-weight:800;font-size:2rem;margin:0 0 14px">${c.sets.map(s=>s.join('-')).join('  ')} ${resBadge(c.res)}</p>`:''}
      <div class="cols"><div><h3>${esc(leftName)} esta temporada</h3><dl>${ps? `<dt>Partidos</dt><dd>${ps.w}-${ps.l}</dd><dt>% victorias</dt><dd>${ps.pj?pct(ps.w,ps.pj)+'%':'–'}</dd><dt>Racha</dt><dd>${ps.streak.n?(ps.streak.t==='W'?'+':'−')+ps.streak.n:'–'}</dd><dt>Contra este club</dt><dd>${vsRec? vsRec.w+'-'+vsRec.l : 'Primera vez'}</dd>` : pls.length? pls.map(x=>{ const s=playerStats(x.id,null,dk); return `<dt>${esc(x.name)}, dobles</dt><dd>${s.w}-${s.l}</dd>`; }).join('') : '<dt>Jugador</dt><dd>Por designar</dd>'}</dl></div>
        <div><h3>${esc(team(p.rival).short)} esta temporada</h3><dl><dt>Posición</dt><dd>${cs.pj?cs.pos+'º':'–'}</dd><dt>Eliminatorias</dt><dd>${cs.g||0}-${cs.p||0}</dd><dt>Partidos</dt><dd>${cs.rw||0}-${cs.rl||0}</dd><dt>Puntos</dt><dd>${cs.pts||0}</dd></dl></div></div>
      <div class="row" style="justify-content:center;margin-top:10px">${ids.length? ids.map(id=>`<button class="btn light sm" data-player="${esc(id)}">Ficha de ${esc(pname(id).split(' ')[0])}</button>`).join(''):''}<button class="btn ghost sm" style="color:#fff;border-color:rgba(255,255,255,.3)" data-act="stage-close">Volver</button></div></div>
    <button class="skip" data-act="stage-skip">Saltar</button>`;
  stageTimers.forEach(clearTimeout); stageTimers=[]; st.className='stage';
  requestAnimationFrame(()=>{ st.classList.add('on'); document.body.style.overflow='hidden';
    if(RM.matches){ st.classList.add('s1','s2','s3','s4','s5'); return; }
    const seq=[[50,'s1'],[550,'s2'],[1150,'s3'],[1800,'s4'],[2700,'s5']];
    seq.forEach(([t,cl])=>stageTimers.push(setTimeout(()=>{ st.classList.add(cl); if(cl==='s4'){ st.classList.add('shake'); navigator.vibrate?.([30,40,60]); const b=st.querySelector('.vs').getBoundingClientRect(); confetti(b.left+b.width/2,b.top+b.height/2,50); setTimeout(()=>st.classList.remove('shake'),500); } },t)));
  });
}
function stageSkip(){ const st=$('.stage'); stageTimers.forEach(clearTimeout); st?.classList.add('s1','s2','s3','s4','s5'); }
function stageClose(){ stageTimers.forEach(clearTimeout); const st=$('.stage'); if(st){ st.classList.remove('on'); } document.body.style.overflow=''; }

/* ===================== FOTOS: subir, recortar y encuadrar ===================== */
let crop=null;
function openCropper(target, pick){
  const team=target==='_team', aspect=team? 16/9 : 3/4, outW=team? 1600 : 600, outH=Math.round(outW/aspect);
  let m=$('.cropper'); if(!m){ m=document.createElement('div'); m.className='cropper'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true'); document.body.appendChild(m); }
  m.innerHTML=`<div class="cbox"><div class="row" style="justify-content:space-between"><b>${team?'Foto del equipo':'Foto de '+esc(pname(target))}</b><button class="iconbtn" data-act="crop-close" aria-label="Cerrar">✕</button></div>
    <div class="cview" style="aspect-ratio:${aspect}"><canvas></canvas>${team?'':'<span class="cguide"></span>'}<p class="chint">Elige una imagen</p></div>
    <label class="f">Zoom</label><input type="range" min="1" max="4" step="0.01" value="1" class="czoom">
    <p class="muted small" style="margin:6px 0 0">Arrastra para encuadrar. ${team?'Formato 16:9.':'Formato vertical 3:4: deja la cara en el tercio superior; los círculos usan esa zona.'}</p>
    <div class="row" style="margin-top:14px"><label class="btn ghost sm">Elegir imagen<input type="file" accept="image/*" class="cfile" hidden></label><span style="flex:1"></span><button class="btn ghost sm" data-act="crop-close">Cancelar</button><button class="btn brass" data-act="crop-save" disabled>Guardar foto</button></div></div>`;
  m.classList.add('on'); document.body.style.overflow='hidden';
  const cv=m.querySelector('canvas'), view=m.querySelector('.cview'), zoom=m.querySelector('.czoom'), file=m.querySelector('.cfile'), save=m.querySelector('[data-act=crop-save]');
  crop={target,aspect,outW,outH,img:null,z:1,ox:0,oy:0,cv,view};
  const fit=()=>{ const r=view.getBoundingClientRect(), dpr=devicePixelRatio||1; cv.width=r.width*dpr; cv.height=r.height*dpr; crop.vw=r.width; crop.vh=r.height; };
  const base=()=>Math.max(crop.vw/crop.img.width, crop.vh/crop.img.height);
  const clamp=()=>{ const s=base()*crop.z, w=crop.img.width*s, h=crop.img.height*s; crop.ox=Math.min(0,Math.max(crop.vw-w,crop.ox)); crop.oy=Math.min(0,Math.max(crop.vh-h,crop.oy)); };
  const draw=()=>{ if(!crop?.img) return; clamp(); const g=cv.getContext('2d'), dpr=devicePixelRatio||1, s=base()*crop.z; g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,crop.vw,crop.vh); g.drawImage(crop.img,crop.ox,crop.oy,crop.img.width*s,crop.img.height*s);
    g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=1; for(let i=1;i<3;i++){ g.beginPath(); g.moveTo(crop.vw*i/3,0); g.lineTo(crop.vw*i/3,crop.vh); g.moveTo(0,crop.vh*i/3); g.lineTo(crop.vw,crop.vh*i/3); g.stroke(); } };
  const load=src=>{ const im=new Image(); if(/^https?:/.test(src)) im.crossOrigin='anonymous'; im.onload=()=>{ crop.img=im; crop.z=1; zoom.value=1; fit(); const s=base(); crop.ox=(crop.vw-im.width*s)/2; crop.oy=team? (crop.vh-im.height*s)/2 : 0; view.querySelector('.chint').hidden=true; save.disabled=false; draw(); }; im.src=src; };
  crop.draw=draw;
  file.onchange=()=>{ const f=file.files[0]; if(!f) return; const rd=new FileReader(); rd.onload=()=>load(rd.result); rd.readAsDataURL(f); };
  zoom.oninput=()=>{ if(!crop.img) return; const cx=crop.vw/2, cy=crop.vh/2, s0=base()*crop.z; crop.z=+zoom.value; const s1=base()*crop.z; crop.ox=cx-(cx-crop.ox)*s1/s0; crop.oy=cy-(cy-crop.oy)*s1/s0; draw(); };
  let drag=null; cv.onpointerdown=e=>{ drag={x:e.clientX,y:e.clientY,ox:crop.ox,oy:crop.oy}; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove=e=>{ if(!drag) return; crop.ox=drag.ox+e.clientX-drag.x; crop.oy=drag.oy+e.clientY-drag.y; draw(); }; cv.onpointerup=()=>drag=null;
  cv.onwheel=e=>{ e.preventDefault(); zoom.value=Math.min(4,Math.max(1,+zoom.value-e.deltaY*.002)); zoom.oninput(); };
  if(photos[target]?.d && !pick) setTimeout(()=>load(photos[target].d),30); else file.click();
}
function closeCropper(){ $('.cropper')?.classList.remove('on'); document.body.style.overflow=''; crop=null; }
async function saveCrop(){
  if(!crop?.img) return; const o=document.createElement('canvas'); o.width=crop.outW; o.height=crop.outH; const g=o.getContext('2d'), k=crop.outW/crop.vw, s=Math.max(crop.vw/crop.img.width,crop.vh/crop.img.height)*crop.z;
  g.fillStyle='#0A2A20'; g.fillRect(0,0,o.width,o.height); g.imageSmoothingQuality='high'; g.drawImage(crop.img,crop.ox*k,crop.oy*k,crop.img.width*s*k,crop.img.height*s*k);
  const target=crop.target; closeCropper();
  await photoStore(target, o, target==='_team');
}

/* ===================== CARTEL DE CONVOCATORIA ===================== */
const FMT={story:[1080,1920],square:[1080,1080],wide:[1920,1080]};
const imgCache={};
/* ---- Fotos: foto (máx. 600 px; equipo 1600 px) y miniatura (150 px; equipo 480 px). Se suben a Vercel Blob por
   /api/photo; si el almacén no está configurado, se guardan reducidas en Firestore como antes. ---- */
function encImg(canvas, cap){ let q=.82, d=canvas.toDataURL('image/webp',q); const t=d.startsWith('data:image/webp')?'image/webp':'image/jpeg'; if(t!=='image/webp') d=canvas.toDataURL(t,q);
  while(d.length>cap && q>.35){ q-=.1; d=canvas.toDataURL(t,q); } return d; }
function scaledCanvas(src, w){ const h=Math.round(w*src.height/src.width), c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); g.imageSmoothingQuality='high'; g.drawImage(src,0,0,w,h); return c; }
let photoCdn=null;   // ¿hay almacén de fotos en el servidor? (se pregunta una vez)
async function photoStore(target, canvas, team){
  const big = canvas.width > (team?1600:600) ? scaledCanvas(canvas, team?1600:600) : canvas;
  const full=encImg(big, team? 420000 : 220000), thumb=encImg(scaledCanvas(big, team?480:150), team? 40000 : 14000);
  photos[target]={d:full, t:thumb, at:Date.now()}; renderQuiet();
  if(B.mode==='firebase'){
    if(photoCdn===null){ try{ photoCdn=!!(await (await fetch('/api/photo')).json()).blob; }catch(e){ photoCdn=false; } }
    if(photoCdn){ try{ const tok=await B.idToken(); const r=await fetch('/api/photo',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({id:target, full, thumb})});
      if(r.ok){ photos[target]=await r.json(); renderQuiet(); toast('Foto guardada'); return true; } }catch(e){} }
  }
  await safe(()=>B.set('photos/'+target,photos[target]),'Foto guardada'); return true;
}
// Fotos antiguas (guardadas enteras en la base de datos): se reducen y se pasan al almacén. Lo lanza la gestión.
async function photosOptimize(){
  const ids=Object.keys(photos).filter(id=>{ const p=photos[id]; return p?.d && String(p.d).startsWith('data:') && (!p.t || p.d.length>300000 || photoCdn); });
  if(!ids.length) return toast('Todas las fotos ya están optimizadas');
  ui.photoOpt={n:0, of:ids.length}; renderQuiet();
  for(const id of ids){ const im=await loadImg(photos[id].d); if(im){ const c=scaledCanvas(im, Math.min(im.width, id==='_team'?1600:600)); await photoStore(id, c, id==='_team'); } ui.photoOpt.n++; renderQuiet(); }
  ui.photoOpt=null; renderQuiet(); toast(`Fotos optimizadas: ${ids.length}`); }
function photoOptCard(){ if(!canClub()) return ''; const big=Object.values(photos).filter(p=>p?.d && String(p.d).startsWith('data:'));
  const kb=Math.round(big.reduce((a,p)=>a+String(p.d).length*.75,0)/1024); if(!big.length && !ui.photoOpt) return '';
  return `<section class="sec"><div class="sec-h"><h2>Fotos</h2></div><p class="muted small">${ui.photoOpt? `Optimizando ${ui.photoOpt.n} de ${ui.photoOpt.of}…` : `${big.length} ${big.length===1?'foto está':'fotos están'} guardadas dentro de la base de datos (${kb>1024? (kb/1024).toFixed(1)+' MB' : kb+' KB'}). Cada jugador las descarga al abrir la app. Optimizarlas las reduce y crea miniaturas para las listas.`}</p>
    ${ui.photoOpt? '' : '<button class="btn brass" data-act="photos-opt">Optimizar las fotos</button>'}</section>`; }
function loadImg(src){ if(!src) return Promise.resolve(null); if(!imgCache[src]) imgCache[src]=new Promise(r=>{ const i=new Image(); if(/^https?:/.test(src)) i.crossOrigin='anonymous'; i.onload=()=>r(i); i.onerror=()=>r(null); i.src=src; }); return imgCache[src]; }
function coverImg(g,im,x,y,w,h,fx=.5,fy=.5){ const s=Math.max(w/im.width,h/im.height), dw=im.width*s, dh=im.height*s; g.drawImage(im,x+(w-dw)*fx,y+(h-dh)*fy,dw,dh); }
function dtext(g,t,x,y,{size,weight=700,cond=false,color='#fff',maxW=1e9,align='left',min=10,ls=0}){
  let s=size; const native='fontStretch' in g, sc=cond&&!native? .74 : 1;
  const set=()=>{ g.font=`${weight} ${s}px Archivo, "Arial Narrow", Arial, sans-serif`; if(native) g.fontStretch=cond?'extra-condensed':'normal'; if('letterSpacing' in g) g.letterSpacing=ls? ls+'px':'0px'; };
  set(); while(g.measureText(t).width*sc>maxW && s>min){ s-=2; set(); }
  g.fillStyle=color; g.textAlign=align; g.textBaseline='alphabetic';
  if(sc!==1){ g.save(); g.translate(x,y); g.scale(sc,1); g.fillText(t,0,0); g.restore(); } else g.fillText(t,x,y);
  if('letterSpacing' in g) g.letterSpacing='0px'; return s;
}
function rrect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function gridFit(n,w,h,ratio,gap){ let best=null; for(let c=1;c<=n;c++){ const r=Math.ceil(n/c), cw=Math.min((w-gap*(c-1))/c,((h-gap*(r-1))/r)*ratio); if(!best||cw>best.cw+0.5) best={c,r,cw,ch:cw/ratio}; } return best; }
async function drawCard(g,x,y,w,h,pid,role,U){
  const pl=player(pid), im=await loadImg(photos[pid]?.d), r=Math.max(10,w*.06);
  g.save(); rrect(g,x,y,w,h,r); g.clip();
  const bgG=g.createLinearGradient(x,y,x+w,y+h); bgG.addColorStop(0,'#1B5A46'); bgG.addColorStop(1,'#0A2A20'); g.fillStyle=bgG; g.fillRect(x,y,w,h);
  if(im) coverImg(g,im,x,y,w,h,.5,.2);
  else { const ini=(pl?.name||'?').split(' ').map(s=>s[0]).slice(0,2).join(''); dtext(g,ini,x+w/2,y+h*.5,{size:w*.42,weight:800,cond:true,color:'rgba(226,196,124,.55)',align:'center'}); }
  const sh=g.createLinearGradient(0,y+h*.42,0,y+h); sh.addColorStop(0,'rgba(6,24,18,0)'); sh.addColorStop(1,'rgba(6,24,18,.96)'); g.fillStyle=sh; g.fillRect(x,y+h*.42,w,h*.58);
  g.restore();
  g.save(); rrect(g,x,y,w,h,r); g.lineWidth=Math.max(2,3*U); g.strokeStyle='rgba(226,196,124,.85)'; g.stroke(); g.restore();
  const pad=w*.07, nm=(pl?.name||'').split(' '), first=nm.length>1? nm.slice(0,-1).join(' ') : '', last=nm.at(-1)||'';
  const ls=dtext(g,last.toUpperCase(),x+pad,y+h-pad,{size:w*.17,weight:800,cond:true,maxW:w-pad*2});
  if(first) dtext(g,first,x+pad,y+h-pad-ls*1.02,{size:Math.max(12,w*.085),weight:500,color:'#D9E3DD',maxW:w-pad*2});
  if(role){ const fs=Math.max(12,w*.062); g.font=`700 ${fs}px Archivo, Arial, sans-serif`; if('fontStretch' in g) g.fontStretch='normal'; const tw=g.measureText(role).width, ph=fs*1.7;
    g.fillStyle=role==='Suplente'?'rgba(241,244,239,.88)':'#E2C47C'; rrect(g,x+pad*.8,y+pad*.8,tw+fs*1.2,ph,ph/2); g.fill(); dtext(g,role,x+pad*.8+fs*.6,y+pad*.8+ph*.68,{size:fs,weight:700,color:'#0A2A20'}); }
}
async function drawPoster(cv,j){
  const o=posterOpts(j), [W,H]=FMT[o.fmt]; cv.width=W; cv.height=H; const g=cv.getContext('2d');
  try{ await Promise.all([document.fonts.load('800 80px Archivo'),document.fonts.load('500 40px Archivo')]); }catch(e){}
  const f=poloFix(j), p=persp(f), roles=rolesOf(j), U=Math.min(W,H)/1080, M=64*U;
  let list=lineupList(j); const isSub=pid=>(roles[pid]||[])[0]==='Suplente'; if(!o.showSubs) list=list.filter(x=>!isSub(x));
  const main=list.filter(x=>!isSub(x)), subs=list.filter(isSub);
  g.fillStyle='#0A2A20'; g.fillRect(0,0,W,H);
  if(o.bg==='team' && photos._team){ const im=await loadImg(photos._team.d); if(im){ coverImg(g,im,0,0,W,H,.5,.35); g.fillStyle='rgba(6,24,18,.74)'; g.fillRect(0,0,W,H); } }
  let rg=g.createRadialGradient(W*.15,H*.1,0,W*.15,H*.1,W*.8); rg.addColorStop(0,'rgba(42,122,95,.45)'); rg.addColorStop(1,'rgba(42,122,95,0)'); g.fillStyle=rg; g.fillRect(0,0,W,H);
  rg=g.createRadialGradient(W*.9,H*.95,0,W*.9,H*.95,W*.7); rg.addColorStop(0,'rgba(148,114,42,.35)'); rg.addColorStop(1,'rgba(148,114,42,0)'); g.fillStyle=rg; g.fillRect(0,0,W,H);
  g.save(); g.strokeStyle='rgba(226,196,124,.13)'; g.lineWidth=2*U; const cw=W*.86, chh=H*.9, cx=(W-cw)/2, cy=(H-chh)/2; g.strokeRect(cx,cy,cw,chh); g.strokeRect(cx+cw*.1,cy,cw*.8,chh); g.beginPath(); g.moveTo(cx+cw*.1,cy+chh*.25); g.lineTo(cx+cw*.9,cy+chh*.25); g.moveTo(cx+cw*.1,cy+chh*.75); g.lineTo(cx+cw*.9,cy+chh*.75); g.moveTo(W/2,cy+chh*.25); g.lineTo(W/2,cy+chh*.75); g.stroke(); g.restore();
  const wide=o.fmt==='wide', hx=M, hw=wide? W*.36 : W-M*2;
  let y=M+34*U; const ci=await loadImg(ASSET.crestSm); const ch=(o.fmt==='story'?96:78)*U;
  if(ci){ const cw2=ch*ci.width/ci.height; g.drawImage(ci, wide? hx : W-M-cw2, M-6*U, cw2, ch); }
  dtext(g,'REAL CLUB DE POLO DE BARCELONA',hx,y,{size:28*U,weight:700,color:'#E2C47C',maxW:wide? hw : hw-ch,ls:3*U});
  y+=(o.fmt==='story'?180:wide?150:128)*U; const ts=dtext(g,o.title,hx-4*U,y,{size:(o.fmt==='story'?190:wide?170:140)*U,weight:800,cond:true,maxW:hw});
  y+=46*U; dtext(g,o.sub,hx,y,{size:32*U,weight:500,color:'#A9BDB3',maxW:hw});
  y+=(o.fmt==='story'?92:70)*U;
  const cr=(o.fmt==='story'?46:40)*U, ccx=hx+cr, ccy=y-cr*.62;
  g.save(); g.beginPath(); g.arc(ccx,ccy,cr,0,Math.PI*2); g.fillStyle='#EEF3EF'; g.fill(); g.lineWidth=3*U; g.strokeStyle='#E2C47C'; g.stroke(); g.restore();
  dtext(g,team(p.rival).abbr,ccx,ccy+cr*.28,{size:cr*.72,weight:800,cond:true,color:'#0A2A20',align:'center',maxW:cr*1.6});
  dtext(g,'contra '+clubName(p.rival),hx+cr*2+18*U,y,{size:(o.fmt==='story'?60:50)*U,weight:800,cond:true,maxW:hw-cr*2-18*U});
  y+=(o.fmt==='story'?58:48)*U;
  const dline=fdate(f,{weekday:'long',day:'numeric',month:'long'}); dtext(g,`${dline.charAt(0).toUpperCase()+dline.slice(1)}, ${f.time} h. ${p.home?'En casa.':'Fuera.'}`,hx,y,{size:32*U,weight:600,color:'#F1F4EF',maxW:hw});
  const footH=90*U;
  const fy=H-M;
  dtext(g,o.tagline,hx,fy,{size:(wide?64:58)*U,weight:800,cond:true,color:'#E2C47C',maxW:wide? hw : (W-M*2)*.6});
  dtext(g,S.comp.group,wide? hx : W-M,wide? fy-80*U : fy,{size:24*U,weight:500,color:'#A9BDB3',align:wide?'left':'right',maxW:wide? hw : (W-M*2)*.4});
  const gx=wide? W*.42 : M, gw=wide? W-M-gx : W-M*2, gy=wide? M : y+56*U, gh=(wide? H-M : fy-footH)-gy;
  if(!list.length){ dtext(g,'Convocatoria pendiente',gx+gw/2,gy+gh/2,{size:48*U,weight:700,color:'#A9BDB3',align:'center'}); return; }
  const gap=(list.length>8?16:22)*U, labH=subs.length? 44*U : 0;
  let Lm=gridFit(main.length||1,gw,gh,.78,gap), Ls=null;
  if(subs.length){ let best=null;
    for(let sh=.16; sh<=.5; sh+=.02){ const m=gridFit(main.length||1,gw,gh*(1-sh)-labH,.78,gap), sb=gridFit(subs.length,gw,gh*sh,.78,gap);
      if(sb.cw < m.cw*.55) continue; const score=m.cw + Math.min(sb.cw,m.cw*.72)*.35; if(!best||score>best.score) best={score,m,sb}; }
    if(!best){ const m=gridFit(main.length||1,gw,gh*.6-labH,.78,gap); best={m,sb:gridFit(subs.length,gw,gh*.4,.78,gap)}; }
    Lm=best.m; Ls=best.sb; const cap=Lm.cw*.72; if(Ls.cw>cap){ Ls={...Ls,cw:cap,ch:cap/.78}; } }
  const sizeOf=(L,n)=>L? Math.ceil(n/L.c)*L.ch+(Math.ceil(n/L.c)-1)*gap : 0;
  const usedM=main.length? sizeOf(Lm,main.length) : 0, usedS=Ls? sizeOf(Ls,subs.length) : 0;
  const total=usedM+(Ls? labH+gap*.5+usedS : 0); let yy=gy+Math.max(0,(gh-total)/2);
  const place=async(ids,L,y0)=>{ let k=0; for(let r=0;k<ids.length;r++){ const inRow=Math.min(L.c,ids.length-k), rowW=inRow*L.cw+(inRow-1)*gap; let x0=gx+(gw-rowW)/2;
      for(let c=0;c<inRow;c++){ const pid=ids[k++]; await drawCard(g,x0,y0,L.cw,L.ch,pid,(roles[pid]||[]).join(' + '),U); x0+=L.cw+gap; } y0+=L.ch+gap; } };
  if(main.length){ await place(main,Lm,yy); yy+=usedM; }
  if(Ls){ yy+=gap*.5; g.save(); g.strokeStyle='rgba(226,196,124,.4)'; g.lineWidth=2*U; const lw=Math.min(gw*.25,160*U); g.beginPath(); g.moveTo(gx+gw/2-lw-90*U,yy+labH*.42); g.lineTo(gx+gw/2-90*U,yy+labH*.42); g.moveTo(gx+gw/2+90*U,yy+labH*.42); g.lineTo(gx+gw/2+lw+90*U,yy+labH*.42); g.stroke(); g.restore();
    dtext(g,'Suplentes',gx+gw/2,yy+labH*.6,{size:26*U,weight:700,color:'#E2C47C',align:'center'}); yy+=labH; await place(subs,Ls,yy); }
}
function posterBlob(cv){ return new Promise(r=>cv.toBlob(r,'image/png')); }
async function posterExport(j,how,cvEl){
  const cv=cvEl||document.createElement('canvas'); if(!cvEl) await drawPoster(cv,j);
  const o=posterOpts(j), name=`polo-convocatoria-j${j}-${o.fmt}.png`, blob=await posterBlob(cv); if(!blob) return toast('No se ha podido generar la imagen');
  const file=new File([blob],name,{type:'image/png'});
  if(how==='share' && navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file],title:'Convocatoria jornada '+j}); markPoster(j); }catch(e){} return; }
  const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),4000); markPoster(j);
  if(how==='share') toast('Este navegador no comparte imágenes: se ha descargado');
}
function markPoster(j){ if(!canManage) return; const t=ensureTie(j); t.poster={...(t.poster||{}),at:Date.now()}; saveState('Cartel listo'); }
function openPosterModal(j){
  let m=$('.pmodal'); if(!m){ m=document.createElement('div'); m.className='pmodal'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true'); document.body.appendChild(m); }
  const o=posterOpts(j);
  m.innerHTML=`<div class="pmbox"><div class="row" style="justify-content:space-between"><b>Convocatoria, jornada ${j}</b><button class="iconbtn" data-act="pm-close" aria-label="Cerrar">✕</button></div>
    <div class="chips" style="margin:10px 0">${[['story','Vertical'],['square','Cuadrado'],['wide','Horizontal']].map(([k,l])=>`<button class="chip" data-act="pm-fmt" data-j="${j}" data-v="${k}" aria-pressed="${(ui.pmFmt||o.fmt)===k}">${l}</button>`).join('')}</div>
    <canvas class="pcanvas"></canvas><div class="row" style="margin-top:12px"><button class="btn brass" data-act="pm-dl" data-j="${j}">Descargar</button>${navigator.share?`<button class="btn" data-act="pm-share" data-j="${j}">Compartir</button>`:''}</div></div>`;
  m.classList.add('on'); document.body.style.overflow='hidden';
  const t=tie(j), save=t.poster; t.poster={...(save||{}),fmt:ui.pmFmt||o.fmt}; drawPoster(m.querySelector('canvas'),j).then(()=>{ t.poster=save; });
}
function closePosterModal(){ $('.pmodal')?.classList.remove('on'); document.body.style.overflow=''; }

