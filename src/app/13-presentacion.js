/* ===================== PRESENTACIÓN DE JUGADOR (gratis: se genera en la app, sin proveedores externos) ===================== */
const INTRO_W=720, INTRO_H=1280, INTRO_T=7.2;
const iz={ out:t=>1-Math.pow(1-t,3), inout:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, back:t=>{ const c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); } };
const iseg=(t,a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a)));
const introImg=src=>new Promise((r,j)=>{ const i=new Image(); i.onload=()=>r(i); i.onerror=j; i.src=src; });
function introData(pid){ const p=player(pid)||{name:'Jugador'}, st=playerStats(pid), d=playerStats(pid,null,'D'), mv=mvpCount(pid), pr=profiles[pid]||{};
  const nm=p.name.split(' '), first=nm.length>1? nm.slice(0,-1).join(' ') : '', last=nm.at(-1)||p.name;
  const stats=(st.pj||d.pj)? [[st.pj? Math.round(st.w*100/st.pj)+'%' : '–','WIN RATE'],[`${st.w}-${st.l}`,'INDIVIDUALES'],[String(mv),'MVP']]
    : [[pr.shot,'GOLPE'],[pr.hand,'MANO'],[pr.since&&String(pr.since),'DESDE'],[p.order&&('Nº '+p.order),'ORDEN FCT'],[p.cat,'CATEGORÍA'],[String(viewSeason).slice(2),'TEMPORADA']].filter(x=>x[0]).slice(0,3);
  return {p, top:pr.nick||first, last, stats, team:teamLabel(), season:viewSeason, ph:photos[pid]?.d||null, initials:nm.map(x=>x[0]).slice(0,2).join('').toUpperCase()}; }
function irr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function iline(c,a,b,x,y){ c.beginPath(); c.moveTo(a,b); c.lineTo(x,y); c.stroke(); }
function ispaced(c,txt,x,y,ls){ const al=c.textAlign; c.textAlign='left'; const ws=[...txt].map(ch=>c.measureText(ch).width), tot=ws.reduce((a,b)=>a+b,0)+ls*(ws.length-1); let cx=x-tot/2; [...txt].forEach((ch,i)=>{ c.fillText(ch,cx,y); cx+=ws[i]+ls; }); c.textAlign=al; }
function introDraw(c,t,D,A){ const W=INTRO_W,H=INTRO_H; c.save(); c.globalAlpha=1; c.clearRect(0,0,W,H);
  const g=c.createRadialGradient(W/2,H*.36,40,W/2,H*.5,H*.85); g.addColorStop(0,'#1d5a45'); g.addColorStop(.55,'#0c2d22'); g.addColorStop(1,'#04120d'); c.fillStyle=g; c.fillRect(0,0,W,H);
  // pista en perspectiva que se dibuja sola
  const pr=iz.out(iseg(t,.1,1.3)), hz=H*.57, bot=H*1.02, tl=W*.5-W*.22, tr=W*.5+W*.22, bl=W*.5-W*.95, br=W*.5+W*.95;
  c.save(); c.globalAlpha=.2*pr; c.strokeStyle='#e8efe9'; c.lineWidth=3; iline(c,tl,hz,tr,hz);
  iline(c,tl,hz,tl+(bl-tl)*pr,hz+(bot-hz)*pr); iline(c,tr,hz,tr+(br-tr)*pr,hz+(bot-hz)*pr);
  [.3,.62].forEach(f=>{ if(f<=pr){ const y=hz+(bot-hz)*f; iline(c,tl+(bl-tl)*f,y,tr+(br-tr)*f,y); } }); if(pr>.3) iline(c,W/2,hz+(bot-hz)*.3,W/2,hz+(bot-hz)*Math.min(pr,.62)); c.restore();
  // haces de luz del estadio
  [[W*.12,0],[W*.88,1.7]].forEach(([x0,ph])=>{ c.save(); c.globalAlpha=iz.out(iseg(t,.2,1.4)); c.translate(x0,-40); c.rotate(Math.sin(t*.9+ph)*.16+(x0<W/2? .38 : -.38));
    const lg=c.createLinearGradient(0,0,0,H*.9); lg.addColorStop(0,'rgba(255,248,225,.26)'); lg.addColorStop(1,'rgba(255,248,225,0)'); c.fillStyle=lg; c.beginPath(); c.moveTo(-16,0); c.lineTo(16,0); c.lineTo(170,H*.9); c.lineTo(-170,H*.9); c.closePath(); c.fill(); c.restore(); });
  // polvo en suspensión
  c.fillStyle='#f6e9c4'; A.parts.forEach(q=>{ let y=(q.y-t*q.s*60)%H; if(y<0) y+=H; c.globalAlpha=q.a*iz.out(iseg(t,.3,1.5)); c.beginPath(); c.arc(q.x+Math.sin(t+q.x)*6,y,q.r,0,7); c.fill(); }); c.globalAlpha=1;
  // tarjeta con la foto: sube, la cámara se acerca y un brillo la recorre
  const cw=500,ch=640,cx=(W-cw)/2,k=iz.out(iseg(t,.4,2.4)),cy=170+(1-k)*220,sc=1.14-.14*k;
  c.save(); c.globalAlpha=Math.min(1,iseg(t,.4,1.1)*1.2); c.shadowColor='rgba(0,0,0,.55)'; c.shadowBlur=60; c.shadowOffsetY=30; irr(c,cx,cy,cw,ch,34); c.fillStyle='#0b2a21'; c.fill(); c.shadowColor='transparent';
  c.save(); irr(c,cx,cy,cw,ch,34); c.clip();
  if(A.photo){ const im=A.photo, ir=im.width/im.height, tr2=cw/ch; let dw,dh; if(ir>tr2){ dh=ch*sc; dw=dh*ir; } else { dw=cw*sc; dh=dw/ir; } c.drawImage(im,cx+(cw-dw)/2,cy+(ch-dh)*.22,dw,dh); }
  else { const gg=c.createLinearGradient(cx,cy,cx+cw,cy+ch); gg.addColorStop(0,'#1B5A46'); gg.addColorStop(1,'#0A2A20'); c.fillStyle=gg; c.fillRect(cx,cy,cw,ch); c.fillStyle='#E2C47C'; c.font='800 220px '+A.font; c.textAlign='center'; c.textBaseline='middle'; c.fillText(D.initials,W/2,cy+ch/2); c.textBaseline='alphabetic'; }
  const fg=c.createLinearGradient(0,cy+ch*.55,0,cy+ch); fg.addColorStop(0,'rgba(4,18,13,0)'); fg.addColorStop(1,'rgba(4,18,13,.85)'); c.fillStyle=fg; c.fillRect(cx,cy,cw,ch);
  const sh=iseg(t,1.7,2.5); if(sh>0&&sh<1){ const sx=cx-200+(cw+400)*iz.inout(sh), sg=c.createLinearGradient(sx-120,cy,sx+120,cy+ch); sg.addColorStop(0,'rgba(255,255,255,0)'); sg.addColorStop(.5,'rgba(255,255,255,.28)'); sg.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=sg; c.fillRect(cx,cy,cw,ch); }
  c.restore(); const bp=iz.inout(iseg(t,1,2.4)); if(bp>0){ c.strokeStyle='#E2C47C'; c.lineWidth=4; c.setLineDash([2*(cw+ch)*bp,1e5]); irr(c,cx,cy,cw,ch,34); c.stroke(); c.setLineDash([]); } c.restore();
  // nombre
  c.textAlign='center'; const n1=iz.out(iseg(t,2.2,2.9)), n2=iz.back(iseg(t,2.4,3.2));
  if(D.top){ c.globalAlpha=n1; c.fillStyle='#E2C47C'; c.font='700 40px '+A.font; ispaced(c,D.top.toUpperCase(),W/2-(1-n1)*60,905,9); }
  const ln=D.last.toUpperCase(); let fs=160; c.font=`800 ${fs}px ${A.font}`; const wd=c.measureText(ln).width*.8; if(wd>660) fs=Math.floor(fs*660/wd);
  c.save(); c.globalAlpha=Math.min(1,n2*1.4); c.translate(W/2,1035); const zs=.85+.15*n2; c.scale(.8*zs,zs); c.font=`800 ${fs}px ${A.font}`; c.fillStyle='#F4F6F2'; c.fillText(ln,0,0); c.restore();
  // cifras
  D.stats.forEach((s,i)=>{ const a=iz.back(iseg(t,3.2+i*.22,3.8+i*.22)); if(a<=0) return; const bw=196,bh=110,gap=16,x=(W-(bw*3+gap*2))/2+i*(bw+gap),y=1075+(1-a)*40;
    c.globalAlpha=Math.min(1,a); irr(c,x,y,bw,bh,22); c.fillStyle='rgba(255,255,255,.08)'; c.fill(); c.strokeStyle='rgba(226,196,124,.45)'; c.lineWidth=2; c.stroke();
    let vf=54; c.font=`800 ${vf}px ${A.font}`; while(c.measureText(s[0]).width*.85>bw-24&&vf>22){ vf-=4; c.font=`800 ${vf}px ${A.font}`; }
    c.save(); c.translate(x+bw/2,y+62); c.scale(.85,1); c.fillStyle='#F4F6F2'; c.fillText(s[0],0,0); c.restore(); c.fillStyle='rgba(244,246,242,.6)'; c.font='700 18px '+A.font; ispaced(c,s[1],x+bw/2,y+92,3); });
  // escudo y equipo
  const fa=iz.out(iseg(t,4.6,5.4)); if(fa>0){ c.globalAlpha=fa; if(A.crest) c.drawImage(A.crest,W/2-150,1203,52,52*((A.crest.height/A.crest.width)||1)); c.textAlign='left'; c.fillStyle='#F4F6F2'; c.font='800 30px '+A.font; c.fillText(D.team.toUpperCase(),W/2-86,1232); c.fillStyle='rgba(244,246,242,.6)'; c.font='600 20px '+A.font; c.fillText('Lliga Catalana '+D.season,W/2-86,1258); c.textAlign='center'; }
  const fl=iseg(t,5.9,6.5); if(fl>0&&fl<1){ c.globalAlpha=Math.sin(fl*Math.PI)*.32; c.fillStyle='#fff7df'; c.fillRect(0,0,W,H); }
  const fi=1-iseg(t,0,.6); if(fi>0){ c.globalAlpha=fi; c.fillStyle='#000'; c.fillRect(0,0,W,H); }
  c.restore(); }
const canRecord=()=>{ try{ return !!(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream); }catch(e){ return false; } };
function introRecord(cv,play,D){ return new Promise((res,rej)=>{ const type=['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm'].find(x=>{ try{ return MediaRecorder.isTypeSupported(x); }catch(e){ return false; } })||'';
  const stream=cv.captureStream(30); let rec; try{ rec=new MediaRecorder(stream, type? {mimeType:type, videoBitsPerSecond:5e6} : undefined); }catch(e){ return rej(e); }
  const chunks=[]; rec.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data); };
  rec.onstop=()=>{ stream.getTracks().forEach(t=>t.stop()); const mt=(rec.mimeType||type||'video/webm').split(';')[0], ext=mt.includes('mp4')? 'mp4' : 'webm', b=new Blob(chunks,{type:mt}); if(!b.size) return rej(new Error('vacío'));
    res(new File([b],`presentacion-${(D.p.name||'jugador').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-')}.${ext}`,{type:mt})); };
  rec.start(250); play(); setTimeout(()=>{ try{ rec.stop(); }catch(e){ rej(e); } }, INTRO_T*1000+500); }); }
async function introOpen(pid){ ensureIntroCss(); const D=introData(pid);
  const [photo,crest]=await Promise.all([D.ph? introImg(D.ph).catch(()=>null) : null, introImg(ASSET.crestSm).catch(()=>null)]);
  const A={photo,crest,font:getComputedStyle(document.body).fontFamily||'system-ui',parts:Array.from({length:70},(_,i)=>({x:(i*97)%INTRO_W,y:(i*211)%INTRO_H,r:1+(i*7)%3,s:.2+((i*13)%10)/20,a:.15+((i*17)%10)/40}))};
  document.getElementById('intro')?.remove(); const el=document.createElement('div'); el.id='intro';
  el.innerHTML=`<div class="in-back" data-in="close"></div><div class="in-box" role="dialog" aria-modal="true" aria-label="Presentación de ${esc(D.p.name)}"><canvas width="${INTRO_W}" height="${INTRO_H}"></canvas>
    <div class="in-bar"><button class="btn ghost sm" data-in="replay">Repetir</button>${canRecord()? '<button class="btn brass sm" data-in="rec">Guardar vídeo</button>' : '<span class="small" style="color:#cfd8d3">Este navegador no permite guardarla como vídeo</span>'}<button class="in-x" data-in="close" aria-label="Cerrar">✕</button></div><div class="in-out"></div></div>`;
  document.body.appendChild(el); document.body.classList.add('msg-on');
  const cv=el.querySelector('canvas'), c=cv.getContext('2d'), reduce=matchMedia('(prefers-reduced-motion: reduce)').matches, I={stop:false,raf:0}; ui.intro=I;
  const play=()=>{ cancelAnimationFrame(I.raf); const t0=performance.now(); const loop=now=>{ if(I.stop) return; const t=reduce? INTRO_T : Math.min(INTRO_T,(now-t0)/1000); introDraw(c,t,D,A); if(t<INTRO_T) I.raf=requestAnimationFrame(loop); }; I.raf=requestAnimationFrame(loop); };
  I.play=play; play();
  const close=()=>{ I.stop=true; cancelAnimationFrame(I.raf); el.remove(); document.body.classList.remove('msg-on'); ui.intro=null; document.removeEventListener('keydown',esc_); };
  const esc_=e=>{ if(e.key==='Escape') close(); }; document.addEventListener('keydown',esc_);
  el.addEventListener('click',async e=>{ const b=e.target.closest('[data-in]'); if(!b) return; const a=b.dataset.in;
    if(a==='close') close(); else if(a==='replay') play();
    else if(a==='rec'){ b.disabled=true; b.textContent='Grabando…'; const out=el.querySelector('.in-out'); out.innerHTML='';
      try{ const f=await introRecord(cv,play,D); I.file=f; const url=URL.createObjectURL(f);
        out.innerHTML=`<div class="in-done"><b>Vídeo listo</b>${navigator.canShare&&navigator.canShare({files:[f]})? '<button class="btn brass sm" data-in="share">Compartir</button>' : ''}<a class="btn ghost sm" href="${url}" download="${esc(f.name)}">Descargar</a></div>`;
      }catch(err){ out.innerHTML='<p class="small" style="color:#cfd8d3">No se ha podido grabar el vídeo en este navegador.</p>'; }
      b.disabled=false; b.textContent='Guardar vídeo'; }
    else if(a==='share'&&I.file){ try{ await navigator.share({files:[I.file], title:'Mi presentación, '+D.team}); }catch(err){} } }); }
function introBlock(id,own){ const pr=profiles[id]||{}; if(pr.introOff && !own) return ''; ensureIntroCss(); const ph=photos[id]?.d, nm=(player(id)?.name||'');
  return `<section class="sec"><button class="in-poster" data-act="intro-open" data-id="${esc(id)}">${ph? `<img src="${esc(ph)}" alt="">` : `<span class="in-ini">${esc(nm.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span>`}<span class="in-play">▶</span>
    <span class="in-txt"><b>${own? 'Tu presentación de jugador' : 'Presentación de jugador'}</b><em>${own? (pr.introOff? 'Oculta en tu perfil. ' : '')+'Mírala, guárdala como vídeo y compártela' : '7 segundos, estilo salida a pista'}</em></span></button></section>`; }
const INTRO_CSS=`
#intro{position:fixed;inset:0;z-index:250;display:grid;place-items:center}
.in-back{position:absolute;inset:0;background:rgba(2,10,7,.88);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.in-box{position:relative;display:grid;gap:12px;justify-items:center;padding:12px}
.in-box canvas{height:min(76dvh,calc((100vw - 24px)*16/9));width:auto;aspect-ratio:9/16;border-radius:22px;box-shadow:0 30px 80px -30px #000;background:#04120d}
.in-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center}.in-bar .btn.ghost{color:#fff;border-color:rgba(255,255,255,.4);background:transparent}
.in-x{border:0;background:rgba(255,255,255,.14);color:#fff;width:38px;height:38px;border-radius:50%;cursor:pointer}
.in-done{display:flex;gap:8px;align-items:center;color:#fff;flex-wrap:wrap;justify-content:center}.in-done .btn.ghost{color:#fff;border-color:rgba(255,255,255,.4)}
.in-poster{position:relative;display:grid;grid-template-columns:72px 1fr;gap:14px;align-items:center;width:100%;padding:12px 16px 12px 12px;border-radius:20px;border:0;background:linear-gradient(120deg,#164a3a,#0a2a20);color:#F2F5F0;text-align:left;cursor:pointer;box-shadow:0 18px 36px -26px rgba(0,0,0,.7);transition:transform .15s}
.in-poster:active{transform:scale(.99)}
.in-poster img,.in-ini{width:72px;height:96px;border-radius:12px;object-fit:cover;object-position:50% 22%;border:2px solid #E2C47C}
.in-ini{display:grid;place-items:center;font-weight:800;font-size:1.6rem;color:#E2C47C;background:#123d30}
.in-play{position:absolute;left:48px;top:50%;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(226,196,124,.95);color:#0a2a20;font-size:.8rem;padding-left:3px;box-shadow:0 6px 16px rgba(0,0,0,.4)}
.in-txt b{display:block;font-stretch:72%;font-weight:750;font-size:1.25rem}.in-txt em{font-style:normal;font-size:.82rem;color:rgba(242,245,240,.72)}
`;
function ensureIntroCss(){ if(document.getElementById('intro-css')) return; const s=document.createElement('style'); s.id='intro-css'; s.textContent=INTRO_CSS; document.head.appendChild(s); }

