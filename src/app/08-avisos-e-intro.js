/* ===================== WHATSAPP ===================== */
function waPhone(raw){ let d=String(raw||'').replace(/[^\d+]/g,''); if(d.startsWith('+')) d=d.slice(1); else if(d.startsWith('00')) d=d.slice(2); else if(d.length===9) d='34'+d; return d; }
function waOpen(text,phone){ const url=`https://wa.me/${phone||''}?text=${encodeURIComponent(text)}`; const l=document.createElement('a'); l.href=url; l.target='_blank'; l.rel='noopener'; document.body.appendChild(l); l.click(); l.remove(); }
function logSend(kind,j,extra){ const t=ensureTie(j), now=Date.now();
  if(kind==='req') t.availReq={at:now,n:(t.availReq?.n||0)+1};
  else if(kind==='rem') t.remLog=[...(t.remLog||[]),{at:now,...(extra||{})}].slice(-40);
  else if(kind==='lineup'){ t.lineupAnnounced=now; t.lineupSig=lineupSig(j); }
  else if(kind==='survey') t.surveyAnnounced=now;
  else if(kind==='mvp') t.mvpAnnounced=now;
  saveState(kind==='req'?'Solicitud registrada':kind==='lineup'?'Anuncio registrado':'Recordatorio registrado'); }

/* ===================== NOTIFICACIONES E INSTALACIÓN ===================== */
async function notify(type,j,extra){
  if(B.mode!=='firebase') return;
  try{ const tok=await B.idToken(); if(!tok) return;
    const r=await fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({type,season:viewSeason,j,origin:location.origin,...(extra||{})})});
    if(r.status===501||r.status===404){ toast('Notificaciones aún no configuradas en Vercel: usa WhatsApp'); return null; }
    if(r.status===429){ toast('Espera unos segundos antes de enviar otro mensaje'); return null; }
    const d=await r.json().catch(()=>({})); if(r.ok){ toast(d.recipients? `Notificación enviada: ${d.reached} de ${d.recipients} la tienen activada` : 'No hay destinatarios'); return d; } toast('No se ha podido notificar: '+(d.error||r.status)); return null;
  }catch(e){ console.warn('notify',e); return null; }
}
function initPushState(){ try{ if(!('Notification' in window)) { pushState='off'; return; } pushState = Notification.permission==='denied'? 'denied' : (Notification.permission==='granted' && localStorage.getItem('polo-push')? 'on' : 'off'); }catch(e){ pushState='off'; } }
async function enablePush(){
  if(B.mode!=='firebase') return toast('Las notificaciones funcionan en la app publicada, no en esta vista previa');
  if(!('Notification' in window) || !('serviceWorker' in navigator)) return toast(isIOS()&&!isStandalone()? 'En iPhone, instala primero la app (Compartir, Añadir a pantalla de inicio) y actívalas desde ella' : 'Este navegador no admite notificaciones');
  if(!CFG.vapidKey) return toast('Falta la clave de notificaciones (vapidKey) en config.js');
  try{
    if(!firebase.messaging || !(await firebase.messaging.isSupported())) return toast('Este navegador no admite notificaciones push');
    const perm=await Notification.requestPermission(); if(perm!=='granted'){ pushState=perm==='denied'?'denied':'off'; renderQuiet(); return toast('No se han activado las notificaciones'); }
    const reg=await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready;
    const token=await firebase.messaging().getToken({vapidKey:CFG.vapidKey, serviceWorkerRegistration:reg});
    if(!token) throw new Error('sin token');
    if(me) await B.addPushToken(me,token);
    try{ localStorage.setItem('polo-push',token); }catch(e){}
    pushState='on'; renderQuiet(); toast('Notificaciones activadas'); listenForeground();
  }catch(e){ toast('No se han podido activar: '+(e.code||e.message)); }
}
let fgOn=false;
function listenForeground(){ if(fgOn||B.mode!=='firebase'||!window.firebase?.messaging) return; try{ firebase.messaging().onMessage(pl=>{ const d=pl.data||{}; toast((d.title||''+US+' A')+(d.body? ': '+d.body : '')); softRender(); }); fgOn=true; }catch(e){} }
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installEvt=e; softRender(); });
window.addEventListener('appinstalled',()=>{ installEvt=null; toast('App instalada'); softRender(); });
if('serviceWorker' in navigator && B.mode==='firebase' && location.protocol==='https:') navigator.serviceWorker.register('/sw.js').then(()=>{ if(Notification?.permission==='granted') listenForeground(); }).catch(()=>{});
initPushState();

/* ===================== INTRO: THE BALL OPENS THE GAME ===================== */
const ASSET = { ball:'img/ball.webp', crest:CLUB.crest||'img/escudo.webp', crestSm:CLUB.crestSm||'img/escudo-sm.webp', court:'img/court.jpg', felt:'img/felt.jpg', fuzz:'img/fuzz.webp' };
function introSeen(){ try{ return sessionStorage.getItem('polo-intro')==='1'; }catch(e){ return false; } }
function preload(src){ return new Promise(r=>{ const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src=src; if(i.complete&&i.naturalWidth) r(i); }); }
async function playIntro(){
  if(introSeen()) return; try{ sessionStorage.setItem('polo-intro','1'); }catch(e){}
  const el=document.createElement('div'); el.id='intro'; el.setAttribute('aria-hidden','true');
  document.body.appendChild(el); document.body.classList.add('intro-on');
  const reduce=RM.matches, low=(navigator.connection&&navigator.connection.saveData) || (navigator.hardwareConcurrency||4)<2;
  let done=false; const finish=()=>{ if(done) return; done=true; el.remove(); document.body.classList.remove('intro-on'); };
  const skip=()=>{ if(done) return; el.getAnimations({subtree:true}).forEach(a=>a.cancel()); el.classList.add('i-skip'); render(); setTimeout(finish,380); };
  if(reduce || low){
    el.innerHTML=`<div class="i-simple"><img src="${ASSET.crest}" alt=""><span>${esc(teamLabel())}</span></div>`;
    el.animate([{opacity:1},{opacity:1},{opacity:0}],{duration:reduce?900:1300,easing:'ease-in-out'}).finished.then(finish); return;
  }
  // Pista verde en perspectiva, dibujada al momento (no espera a ninguna descarga)
  const W=innerWidth, H=innerHeight, cx=W/2, hz=H*.16, Hk=H*.86, Wk=Math.min(W*1.05, H*1.0), LEN=23.77, WID=10.97;
  const z=v=>1+2.2*(1-v), P=(u,v,h=0)=>{ const Z=z(v); return [cx+(u-.5)*Wk/Z, hz+Hk/Z - h*(Wk/WID)/Z]; };
  const pt=(u,v)=>P(u,v).map(n=>n.toFixed(1)).join(','), seg=(u1,v1,u2,v2,w)=>`<line x1="${P(u1,v1)[0]}" y1="${P(u1,v1)[1]}" x2="${P(u2,v2)[0]}" y2="${P(u2,v2)[1]}" stroke-width="${w}"/>`;
  const us=(WID-8.23)/2/WID, sv=(LEN/2-6.40)/LEN, lw=v=>(Wk/WID*.09/z(v)).toFixed(2);
  const lines=[seg(0,0,1,0,lw(0)),seg(0,1,1,1,lw(1)),seg(0,0,0,1,lw(.5)),seg(1,0,1,1,lw(.5)),seg(us,0,us,1,lw(.5)),seg(1-us,0,1-us,1,lw(.5)),seg(us,sv,1-us,sv,lw(sv)),seg(us,1-sv,1-us,1-sv,lw(1-sv)),seg(.5,sv,.5,1-sv,lw(.5)),seg(.5,0,.5,.012,lw(0)),seg(.5,1,.5,.988,lw(1))].join('');
  const [nlx,nly]=P(-.06,.5), [nrx]=P(1.06,.5), netH=1.0*(Wk/WID)/z(.5);
  const court=`<svg class="i-court" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="iSurf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7d4f"/><stop offset="1" stop-color="#3f9a60"/></linearGradient>
      <radialGradient id="iLight" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <polygon points="${pt(-.35,-.25)} ${pt(1.35,-.25)} ${pt(1.35,1.3)} ${pt(-.35,1.3)}" fill="#1d5a39"/>
    <polygon points="${pt(0,0)} ${pt(1,0)} ${pt(1,1)} ${pt(0,1)}" fill="url(#iSurf)"/>
    <g stroke="#f4f7f2" stroke-linecap="square" opacity=".95">${lines}</g>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#iLight)"/>
    <rect class="i-net" x="${nlx}" y="${nly-netH}" width="${nrx-nlx}" height="${netH}" fill="url(#iNet)"/>
    <pattern id="iNet" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0L6 6M6 0L0 6" stroke="rgba(20,30,25,.55)" stroke-width=".8"/></pattern>
    <line x1="${nlx}" y1="${nly-netH}" x2="${nrx}" y2="${nly-netH}" stroke="#f4f7f2" stroke-width="${(netH*.09).toFixed(1)}"/>
    <line x1="${nlx}" y1="${nly}" x2="${nlx}" y2="${nly-netH*1.05}" stroke="#123326" stroke-width="${(netH*.08).toFixed(1)}"/><line x1="${nrx}" y1="${nly}" x2="${nrx}" y2="${nly-netH*1.05}" stroke="#123326" stroke-width="${(netH*.08).toFixed(1)}"/>
  </svg>`;
  el.innerHTML=`<div class="i-world">${court}<div class="i-shadow"></div></div><div class="i-vig"></div>`;
  el.animate([{opacity:0},{opacity:1}],{duration:260,easing:'ease-out'});
  el.querySelector('.i-world').animate([{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:2200,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});
  // Mientras se ve la pista, se cargan la pelota y el escudo (máximo 0,9 s)
  const imgs=await Promise.race([Promise.all([preload(ASSET.ball),preload(ASSET.crest),preload(ASSET.felt)]), new Promise(r=>setTimeout(()=>r(null),900))]);
  if(done) return;
  const hasBall=!!(imgs&&imgs[0]), hasArt=!!(imgs&&imgs.every(Boolean));
  // Trayectoria real: saque desde el fondo, bote en el cuadro de saque cercano y subida hacia la cámara
  const D=Math.round(Wk*.14);                     // diámetro de la pelota a distancia 1 (exagerado para que se lea)
  const p0={u:.66,v:.02,h:2.9}, pb={u:.40,v:.74,h:0}, ta=.58, N=22, kb=[], ks=[];
  const Sf=Math.hypot(W,H)/D*1.25, bz=z(pb.v), [bx,by]=P(pb.u,pb.v,0), Xb=bx-cx, Yb=by-H/2-D/bz/2, Sb=1/bz;
  for(let i=0;i<=N;i++){ const t=i/N;
    if(t<=ta){ const q=t/ta, u=p0.u+(pb.u-p0.u)*q, v=p0.v+(pb.v-p0.v)*q, h=p0.h*(1-q)+4.2*q*(1-q), Z=z(v), [x,y]=P(u,v,h), [sx,sy]=P(u,v,0);
      kb.push({transform:`translate(${(x-cx).toFixed(1)}px,${(y-H/2-D/Z/2).toFixed(1)}px) scale(${(1/Z).toFixed(3)})`, offset:t});
      ks.push({transform:`translate(${(sx-cx).toFixed(1)}px,${(sy-H/2).toFixed(1)}px) scale(${(1/Z*(1-Math.min(h,3)/6)).toFixed(3)})`, opacity:Math.max(.15,.75-h*.18), offset:t}); }
    else { // tras el bote sube hacia la cámara: se acerca al centro y crece cada vez más rápido hasta llenar la pantalla
      const q=(t-ta)/(1-ta), e=Math.pow(q,1.3), lift=Math.sin(Math.PI*Math.min(1,q*1.15))*H*.10*(1-q);
      const S=Sb*Math.pow(Sf/Sb,Math.pow(q,2.1));
      kb.push({transform:`translate(${(Xb*(1-e)).toFixed(1)}px,${(Yb*(1-e)-lift).toFixed(1)}px) scale(${S.toFixed(3)})`, offset:t});
      ks.push({transform:`translate(${(bx-cx).toFixed(1)}px,${(by-H/2).toFixed(1)}px) scale(${(Sb*(1+q)).toFixed(3)})`, opacity:Math.max(0,.75*(1-q*3)), offset:t}); } }
  const T=1500, TF=T-140;
  el.insertAdjacentHTML('beforeend',`
    <div class="i-bpos i-main" style="left:${cx-D/2}px;top:${H/2-D/2}px;width:${D}px;height:${D}px"><div class="i-bsq"><div class="i-ball ${hasBall?'':'css'}">${hasBall?`<img src="${ASSET.ball}" alt="">`:''}</div><span class="i-shade"></span></div></div>
    ${hasArt? `<div class="i-felt" style="background-image:url(${ASSET.felt})"><svg class="i-seam" viewBox="0 0 ${W} ${H}"><path pathLength="100" d="M${-W*.15} ${H*.12} C ${W*.3} ${H*.2}, ${W*.4} ${H*.8}, ${W*1.15} ${H*.9}"/></svg></div>` : '<div class="i-felt plain"></div>'}
    <div class="i-crestwrap"><img class="i-crest" src="${ASSET.crest}" alt=""><span class="i-shine"></span><p class="i-tag">${esc(teamLabel())}<small>Lliga Catalana ${esc(S.seasonId||'')}</small></p></div>
    <div class="i-ring"></div><div class="i-flash"></div>
    <button class="i-skip-btn" type="button">Saltar</button>`);
  const sh=el.querySelector('.i-shadow'); sh.style.cssText=`left:${cx-D*.55}px;top:${H/2-D*.12}px;width:${D*1.1}px;height:${D*.26}px`;
  el.querySelector('.i-skip-btn').addEventListener('click',skip);
  const A=(s,kf,o)=>el.querySelectorAll(s).forEach(x=>x.animate(kf,{fill:'both',...o}));
  A('.i-main',kb,{duration:T,easing:'linear'});
  A('.i-shadow',ks,{duration:T,easing:'linear'});
  A('.i-main .i-bsq',[{transform:'scale(1)'},{transform:'scale(1)',offset:ta-.03},{transform:'scale(1.22,.8)',offset:ta},{transform:'scale(.94,1.06)',offset:ta+.05},{transform:'scale(1)',offset:ta+.1},{transform:'scale(1)'}],{duration:T,easing:'ease-out'});
  A('.i-main .i-ball',[{transform:'rotate(0deg)'},{transform:'rotate(-260deg)',offset:ta},{transform:'rotate(-700deg)'}],{duration:T,easing:'linear'});
  A('.i-world',[{transform:'translateY(0)'},{transform:'translateY(0)',offset:ta},{transform:`translateY(${(H*.006).toFixed(1)}px)`,offset:ta+.02},{transform:'translateY(0)',offset:ta+.07},{transform:'translateY(0)'}],{duration:T,composite:'add'});
  A('.i-world',[{filter:'blur(0)'},{filter:'blur(0)',offset:.7},{filter:'blur(5px)'}],{duration:T});
  // 5. Fieltro, costura y escudo
  A('.i-felt',[{opacity:0},{opacity:1}],{duration:260,delay:TF,easing:'ease-out'});
  A('.i-seam path',[{strokeDashoffset:100},{strokeDashoffset:0}],{duration:640,delay:TF+60,easing:'cubic-bezier(.2,.7,.2,1)'});
  A('.i-flash',[{opacity:0},{opacity:.5},{opacity:0}],{duration:420,delay:TF+80});
  A('.i-crestwrap',[{opacity:0,transform:'translate(-50%,-50%) scale(.7)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.04)',offset:.7},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:560,delay:TF+200,easing:'cubic-bezier(.2,.8,.2,1)'});
  A('.i-shine',[{transform:'translateX(-120%) skewX(-18deg)'},{transform:'translateX(220%) skewX(-18deg)'}],{duration:700,delay:TF+500,easing:'ease-in-out'});
  A('.i-tag',[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:400,delay:TF+440,easing:'ease-out'});
  // 6. Iris: el escudo se abre y revela la app
  const TI=TF+1080;
  setTimeout(()=>{ if(done) return; render(); const R=Math.hypot(W,H)/2+40, t0=performance.now(), dur=700, ring=el.querySelector('.i-ring');
    A('.i-crestwrap',[{opacity:1,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.35)'}],{duration:480,easing:'ease-in'});
    const step=t=>{ if(done) return; const p=Math.min(1,(t-t0)/dur), e=p<.5? 4*p*p*p : 1-Math.pow(-2*p+2,3)/2, r=e*R;
      const m=`radial-gradient(circle at 50% 50%, transparent ${r}px, #000 ${r+1.5}px)`; el.style.webkitMaskImage=m; el.style.maskImage=m;
      ring.style.width=ring.style.height=(r*2)+'px'; ring.style.opacity=String(p<.02? p*50 : 1-p*.6);
      if(p<1) requestAnimationFrame(step); else finish(); };
    requestAnimationFrame(step); }, TI);
  setTimeout(finish, TI+1500);
}

