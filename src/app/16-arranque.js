/* ===================== ARRANQUE ===================== */
function unsubAll(){ subs.forEach(u=>{ try{u()}catch(e){} }); subs=[]; if(mineSub){ try{mineSub()}catch(e){} mineSub=null; } }
function watchMine(){ if(mineSub){ try{mineSub()}catch(e){} mineSub=null; } if(me) mineSub=B.watchDoc(SEASON_PATH+'/ballots/'+me, d=>{ myBallot=d; softRender(); }); else myBallot=me? ballots[me]||null : null; }
if(B.mode==='demo'){ const d=document.createElement('div'); d.className='demo'; d.textContent='Vista previa: datos solo en este navegador'; document.body.appendChild(d); }
let dataSubs=[];
let privSubs=[];
let privKey='';
function subscribePriv(){ const key=(canManage?1:0)+'|'+(canPrivate?1:0)+'|'+SEASON_PATH; if(key===privKey && privSubs.length) return; privKey=key;
  privSubs.forEach(u=>{ try{u()}catch(e){} }); privSubs=[];
  if(!(canPrivate||canClub()||(me&&(meta?.captainPids||[]).includes(me)))) return;   // teléfonos: capitanes y gestión (firestore.rules)
  privSubs.push(B.watchColl('phones', m=>{ phones=Object.fromEntries(Object.entries(m).map(([k,v])=>[k,v.phone])); softRender(); }));
  if(!canPrivate) return;
  privSubs.push(B.watchColl(SEASON_PATH+'/ballots', m=>{ ballots=m; softRender(); }));
  privSubs.push(B.watchColl(SEASON_PATH+'/availNotes', m=>{ notes=m; softRender(); }));
}
function subscribeData(){ // se rehace al identificarse o al cambiar de temporada
  dataSubs.forEach(u=>{ try{u()}catch(e){} }); dataSubs=[];
  if(!me && !isAdmin && !isManager) return;
  dataSubs.push(B.watchDoc('meta/app', d=>{ meta=d; checkManager(d);
    if(!IS_POLO && clubTeams().length && !clubTeams().some(t=>t.id===teamId)){ setTimeout(()=>switchTeam(clubTeams()[0].id),0); } if(!ui.seasonPicked && d?.current && d.current!==viewSeason){ switchSeason(d.current,true); return; } softRender(); }));
  dataSubs.push(B.watchColl('photos', m=>{ photos=m; softRender(); }));
  dataSubs.push(B.watchColl('profiles', m=>{ profiles=m; profilesLoaded=true; softRender(); }));
  dataSubs.push(B.watchDoc(SEASON_PATH, d=>{ ui.sLoaded=SEASON_PATH; serverS= d? normalize(clone(d)) : null; S=d? normalize(clone(d)) : (!IS_POLO || teamId!=='polo-a'? emptyTeamSeed(teamId) : viewSeason===SEASON_ID? seed() : normalize({seasonId:viewSeason,fixtures:[],ties:{},published:{},official:{asOf:0,order:[]}}));
    updRoles(); subscribePriv(); syncMvpSubs(); softRender(); }));
  dataSubs.push(B.watchColl(SEASON_PATH+'/avail', m=>{ avail=m; softRender(); }));
  if(me){ dataSubs.push(B.watchDoc(SEASON_PATH+'/availNotes/'+me, d=>{ if(!canPrivate){ notes={[me]:d||{}}; softRender(); } }));
    dataSubs.push(B.watchDoc('phones/'+me, d=>{ if(d?.phone) phones[me]=d.phone; waOptIn=d?.wa===true; softRender(); })); }
  updRoles(); subscribePriv(); syncMvpSubs(true);
}
let mvpCounts={};
function syncMvpSubs(force){
  const keys=Object.keys(S.mvp||{}).sort().join(',')+'|'+(canPrivate?1:0)+'|'+me+'|'+SEASON_PATH; if(!force && keys===mvpKeys) return; mvpKeys=keys;
  mvpSubs.forEach(u=>{ try{u()}catch(e){} }); mvpSubs=[]; myVotes={}; mvpVotes={}; mvpCounts={};
  Object.keys(S.mvp||{}).forEach(k=>{
    mvpSubs.push(B.watchDoc(SEASON_PATH+'/mvp/'+k, d=>{ mvpCounts[k]=d||{t:{},n:0}; softRender(); }));        // recuento (público)
    if(me) mvpSubs.push(B.watchDoc(SEASON_PATH+'/mvp/'+k+'/votes/'+me, d=>{ myVotes[k]=d?.v||null; softRender(); }));
    if(canPrivate) mvpSubs.push(B.watchColl(SEASON_PATH+'/mvp/'+k+'/votes', m=>{ mvpVotes[k]=m; softRender(); }));   // quién votó a quién (privado)
  });
}
function emptyTeamSeed(tid){ const t=clubTeams().find(x=>x.id===tid)||{short:CLUB.teamShort,cat:''};
  return normalize({seasonId:viewSeason, teamId:tid, comp:{name:'Lliga Catalana per Equips', group:teamCat(t), memorial:''}, teams:[{id:POLO,name:CLUB.short+' '+String(t.short||'').replace(new RegExp('^'+CLUB.teamShort+'\\s*'),''),short:t.short||CLUB.teamShort,abbr:CLUB.abbr}],
    players:[], fixtures:[], ties:{}, published:{}, official:{asOf:0,order:[]}, captains:[], mvp:{}}); }
function switchTeam(tid){ ui.teamAuto=true; if(tid===teamId) return; teamId=tid; try{ localStorage.setItem(IS_POLO? 'polo-team' : 'lc-team-'+CLUB.id,tid); }catch(e){} S=emptyTeamSeed(tid); serverS=null; ui.fe=null; switchSeason(viewSeason, !ui.seasonPicked); }
function switchSeason(id,auto){ privKey=''; docsKey=''; ui.rev=null; if(!auto) ui.seasonPicked=true; viewSeason=id; SEASON_PATH='seasons/'+docIdFor(teamId,id); avail={}; picks={}; ballots={}; notes={}; myBallot=null; privSubs.forEach(u=>{ try{u()}catch(e){} }); privSubs=[]; ui.adminJ=null; ui.calJ=null; subscribeData(); watchMine(); render(); }
// Fichas vinculadas (quién entra con qué cuenta): la gestión y los capitanes ven todas; un jugador, solo la suya
let claimsSub=null;
function watchClaims(pid){ try{ claimsSub&&claimsSub(); }catch(e){} claimsSub=null; claims={}; if(!authUser) return;
  const all= canClub() || (pid && (meta?.captainPids||[]).includes(pid));
  claimsSub= all? B.watchColl('claims', m=>{ claims=m; softRender(); }) : B.watchWhere('claims','email',authUser.email, m=>{ claims=m; softRender(); }); }
B.onAuth(async u=>{
  try{ claimsSub&&claimsSub(); }catch(e){} claimsSub=null; cmReset();
  unsubAll(); dataSubs.forEach(x=>{ try{x()}catch(e){} }); dataSubs=[];
  authUser=u; me=null; isAdmin=false; adminSkip=false; claims={}; avail={}; picks={}; ballots={}; myBallot=null; S=seed();
  ACC.priv=undefined; ACC.ctx=null; ACC.capTeams=null; ACC.capKey=''; ACC.req=undefined; ACC.member=null; ACC.memberOf={}; ACC.menu=false; accMenuDraw();
  if(!u){ authReady=true; render(); return; }
  // Arranque en paralelo (antes eran ~10 lecturas en fila y la pantalla de inicio se quedaba vacía 3-4 s).
  // accLoadBrand fija la raíz de datos del club (migrado o no): lo que depende de ella espera a brandP.
  const brandP=accLoadBrand();
  const [adm]=await Promise.all([B.isAdmin(u.email,u.uid), accLoadPrivacy(u), brandP, accLoadMember(u, brandP)]);
  isAdmin=adm;
  await Promise.all([
    B.getDoc('meta/app').then(m0=>{ if(m0){ meta=m0; } checkManager(m0); }).catch(()=>{}),   // checkManager usa ACC.member (ya cargado)
    B.relink().catch(()=>{})
  ]);
  subs.push(B.watchDoc('public/roster', d=>{ roster=d; softRender(); }));
  let first=true;
  // Ficha de la cuenta en este club. Un miembro desactivado por la gestión no entra con su ficha (las reglas tampoco le dejan leer nada)
  subs.push(B.watchDoc(B.mePath(u.uid), async d=>{ let nm= accMemberOff()? null : (d?.status==='inactivo'? null : d?.pid||null);
    if(nm && B.mode==='firebase' && !B.root()){ try{ const c=await B.getDoc('claims/'+nm); if(!c || c.uid!==u.uid) nm=null; }catch(e){ nm=null; } }   // ficha desvinculada por la gestión if(nm!==me || first) watchClaims(nm);
    if(nm!==me || first){ const was=first; first=false; me=nm; subscribeData(); watchMine(); authReady=true; render(); if(was && (me || isManager || isAdmin) && !ACC.flow) playIntro();   /* con un recorrido de entrada en curso, la intro sale al entrar (accFinish) */ } else softRender(); }));
});
lastRoute=route(); render();   // la intro con el escudo del club se reproduce al entrar (B.onAuth), no antes

