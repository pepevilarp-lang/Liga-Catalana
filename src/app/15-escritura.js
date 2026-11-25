/* ===================== ESCRITURA ===================== */
let chain=Promise.resolve();
let serverS=null;                 // última versión confirmada de la temporada (para guardar solo lo que cambia)
const SPLIT=['ties','mvp','published'];
function diffState(a,b){ const out={}, J=x=>JSON.stringify(x===undefined? null : x);
  new Set([...Object.keys(a||{}),...Object.keys(b||{})]).forEach(k=>{ if(k==='updatedAt') return;
    if(SPLIT.includes(k) && a&&a[k]&&typeof a[k]==='object' && b&&b[k]&&typeof b[k]==='object'){
      new Set([...Object.keys(a[k]),...Object.keys(b[k])]).forEach(x=>{ if(J(a[k][x])!==J(b[k][x])) out[k+'.'+x]= b[k][x]===undefined? DEL : b[k][x]; }); }
    else if(J(a?.[k])!==J(b?.[k])) out[k]= b?.[k]===undefined? DEL : b[k]; });
  return out; }
function errMsg(e){ const c=e?.code||''; if(/permission/.test(c)) return !me? 'No se ha podido guardar: primero elige tu nombre en la pestaña Yo.' : `Firebase ha rechazado el cambio (${c}${e?.what? ', al guardar: '+e.what : ''}). Toca aquí para ver la comprobación de permisos.`;
  if(/unavailable|network|offline/.test(c)||/offline|network/i.test(e?.message||'')) return 'Sin conexión: el cambio se subirá cuando vuelva la red.';
  if(/not-found/.test(c)) return 'La temporada aún no existe en la base de datos. Un administrador debe guardar algo primero.';
  return 'No se ha podido guardar ('+(c||e?.message||'error')+').'; }
const sync={st:'idle',msg:'',at:null,pending:0};
function setSync(st,msg){ sync.st=st; if(msg!=null) sync.msg=msg; if(st==='saved') sync.at=Date.now(); drawSync(); }
function drawSync(){ let el=document.getElementById('syncpill'); if(!el){ el=document.createElement('button'); el.id='syncpill'; el.type='button'; el.addEventListener('click',()=>{ if(sync.st==='error'){ toast(sync.msg); if(/permission|rechazado/.test(sync.msg)) location.hash='yo'; } if(sync.st!=='saving') { sync.st='idle'; drawSync(); } }); document.body.appendChild(el); }
  const t={saving:'Guardando…',offline:'Pendiente de subir (sin conexión)',saved:'Guardado',error:'No se ha guardado. Toca para ver el motivo'}[sync.st]||'';
  el.className='syncpill '+sync.st; el.textContent=t; el.hidden=!t;
  clearTimeout(drawSync._t); if(sync.st==='saved') drawSync._t=setTimeout(()=>{ if(sync.st==='saved'){ sync.st='idle'; drawSync(); } },2200); }
function trackWrite(promise,msg){ sync.pending++; setSync('saving'); const slow=setTimeout(()=>{ if(sync.st==='saving') setSync('offline'); },5000);
  return promise.then(r=>{ clearTimeout(slow); sync.pending=Math.max(0,sync.pending-1); if(!sync.pending) setSync('saved'); if(msg) toast(msg); return r; })
    .catch(e=>{ clearTimeout(slow); sync.pending=Math.max(0,sync.pending-1); setSync('error',errMsg(e)); toast(errMsg(e)); if(/permission/.test(e?.code||'') && B.mode==='firebase'){ B.diag(SEASON_PATH, clone(serverS||S)).then(d=>{ ui.diag=d; }).catch(()=>{}); } throw e; }); }
window.addEventListener('beforeunload',e=>{ if(sync.pending && B.mode==='firebase'){ e.preventDefault(); e.returnValue=''; } });
function auditLabel(k){ const m=k.match(/^(ties|mvp|published)\.j(\d+)$/); if(m) return {ties:'Convocatoria o resultados',mvp:'Votación MVP',published:'Publicación MVP'}[m[1]]+', jornada '+m[2];
  return {fixtures:'Calendario y marcadores',players:'Plantilla',teams:'Clubes',rules:'Reglas',survey:'Encuesta',msgs:'Mensajes',comp:'Competición',official:'Clasificación oficial',captains:'Capitanes'}[k]||k; }
function saveState(msg='Guardado'){ S.updatedAt=Date.now(); S.captains=S.captains||S.players.filter(p=>p.captain).map(p=>p.id);
  try{ const ch=serverS? Object.keys(diffState(serverS,S)).filter(k=>k!=='audit') : ['temporada'];
    if(ch.length) S.audit=[{at:Date.now(), by:((me && player(me)?.name) || authUser?.name || authUser?.email || '?'), what:[...new Set(ch.map(auditLabel))].slice(0,6)}, ...(S.audit||[])].slice(0,60); }catch(e){}
  if(isAdmin && !meta){ meta={current:viewSeason,seasons:[viewSeason]}; B.set('meta/app',meta).catch(()=>{}); }
  const body=clone(S), base=serverS? clone(serverS) : null;
  let keys=[];
  chain=chain.catch(()=>{}).then(()=>{ if(!base){ keys=['temporada completa (creación)']; return B.set(SEASON_PATH,body); }
      const ch=diffState(base,body); if(!Object.keys(ch).length) return null; keys=Object.keys(ch); ch.updatedAt=body.updatedAt; return B.update(SEASON_PATH,ch); })
    .then(()=>{ const pl=JSON.stringify((base||{}).players)!==JSON.stringify(body.players); serverS=body; silentSnapshot(body); if(pl || !roster?.teams?.[teamId]) syncRoster(); })
    .catch(e=>{ if(/not-found/.test(e?.code||'') && base) return B.set(SEASON_PATH,body).then(()=>{ serverS=body; }); e.what=keys.join(', '); throw e; });
  trackWrite(chain,msg).catch(()=>{ if(serverS){ S=normalize(clone(serverS)); renderQuiet(); } });   // si falla, no se muestra como guardado
  renderQuiet(); }
function silentSnapshot(body){ if(!canManage||B.mode!=='firebase') return; const d=new Date().toISOString().slice(0,10), key=viewSeason+d; if(ui.snap===key) return; ui.snap=key; B.set(SEASON_PATH+'/snapshots/'+d,body).catch(()=>{}); }
async function safe(fn,ok){ try{ await trackWrite(Promise.resolve().then(fn), ok); }catch(e){ if(e?.message?.includes('elegido')) toast(e.message); } }

document.addEventListener('click', async e=>{
  if(!e.target.closest('#teammenu') && !e.target.closest('.teamsw')) $('#teammenu')?.remove();
  const pl=e.target.closest('[data-player]'); if(pl){ e.preventDefault(); stageClose(); openSheet(pl.dataset.player); return; }
  const pr=e.target.closest('[data-present]'); if(pr){ const [j,i]=pr.dataset.present.split(':').map(Number); present(j,i); return; }
  const el=e.target.closest('[data-act]'); if(!el) return; const a=el.dataset.act;
  if(a==='signin') B.signIn();
  else if(a==='signout'){ closeSheet(); ACC.menu=true; ACC.menuState='confirm'; accMenuDraw(); }
  else if(a==='me'){ if(authUser) accMenuToggle(); }
  else if(a==='skip'){ adminSkip=true; render(); }
  else if(a==='unskip'){ adminSkip=false; render(); }
  else if(a==='claim'){ const id=el.dataset.id; await safe(()=>B.claim(id)); }
  else if(a==='unclaim'){ const pid=el.dataset.pid, c=claims[pid]; if(!confirm('¿Liberar '+pname(pid)+'? Tendrá que volver a elegir su nombre.')) return; await safe(async()=>{ await B.del('claims/'+pid); if(c?.uid) await B.del('users/'+c.uid).catch(()=>{}); },'Liberado'); }
  else if(a==='close-sheet') closeSheet();
  else if(a==='stage-close') stageClose();
  else if(a==='stage-skip') stageSkip();
  else if(a==='reveal'){ const j=+el.dataset.j; if(!ui.revealed[j]){ ui.revealed[j]=true; el.classList.add('open'); const b=el.getBoundingClientRect(); confetti(b.left+b.width/2,b.top+30); navigator.vibrate?.(40); } }
  else if(a==='liga-filter'){ ui.ligaAll=el.dataset.v==='1'; render(); }
  else if(a==='stats-tab'){ ui.statsTab=el.dataset.v; render(); }
  else if(a==='sort'){ ui.sortKey=el.dataset.v; renderQuiet(); }
  else if(a==='stats-go'){ ui.statsTab=el.dataset.v; }
  else if(a==='stat-kind'){ ui.statKind=el.dataset.v; renderQuiet(); }
  else if(a==='cmp'){ ui.cmpA=el.dataset.id; ui.statsTab='jugadores'; }
  else if(a==='admin-tab' && el.dataset.v!=='docs-go'){ ui.adminTab=el.dataset.v; render(); }
  else if(a==='avail'){ if(!me) return; const k=jid(+el.dataset.j); const cur=avail[me]||{j:{}}; const next={j:{...(cur.j||{}),[k]:el.dataset.v},at:Date.now()};
    avail[me]=next; renderQuiet(); try{ navigator.vibrate?.(el.dataset.v==='yes'? [10,40,14] : 10); }catch(e){} if(!ui.instAfterAvail){ ui.instAfterAvail=true; window.maybeInstallSheet?.('avail'); } if(el.dataset.v==='yes'){ const b=el.getBoundingClientRect(); confetti(b.left+b.width/2,b.top,40); }
    await safe(()=>B.set(SEASON_PATH+'/avail/'+me,next), el.dataset.v==='yes'?'Apuntado: juegas':'Anotado: no puedes'); }
  else if(a==='pick'){ if(!me) return; const k=jid(+el.dataset.j), cur=picks[me]||{j:{}}; const next={j:{...(cur.j||{}),[k]:{p:+el.dataset.p,r:+el.dataset.r}},at:Date.now()}; picks[me]=next; renderQuiet(); await safe(()=>B.set(SEASON_PATH+'/picks/'+me,next),'Pronóstico guardado'); }
  else if(a==='survey-start'){ const j=+el.dataset.j; ui.survey={j,step:0,a:{...(myBallot?.j?.[jid(j)]?.a||{})},xs:ixSteps(j),x:ixInit(j),onlyX:el.dataset.only==='1'}; render(); scrollTo({top:0}); }
  else if(a==='survey-prev'){ ui.survey.step=Math.max(0,ui.survey.step-1); renderQuiet(); }
  else if(a==='survey-next'){ ui.survey.step++; renderQuiet(); }
  else if(a==='ans'){ const q=S.survey.questions.find(x=>x.id===el.dataset.q); ui.survey.a[el.dataset.q]=q?.type==='scale'? +el.dataset.v : el.dataset.v; renderQuiet(); setTimeout(()=>{ if(ui.survey){ ui.survey.step++; renderQuiet(); } },220); }
  else if(a==='survey-send'){ const k=jid(ui.survey.j); const xr=ixClean(ui.survey.x), body={j:{...(myBallot?.j||{}),[k]:{a:ui.survey.a,...(xr&&Object.keys(xr.m).length? {x:xr} : {}),at:Date.now()}}};
    try{ await trackWrite(B.set(SEASON_PATH+'/ballots/'+me,body)); myBallot=body; ui.survey=null; render(); scrollTo(0,0); toast('Respuestas enviadas'); confetti(innerWidth/2,innerHeight/3); }catch(err){ toast('No se ha podido enviar: '+(err?.code||err?.message||'error')); } }
  else if(a==='save-tie'){ const j=+el.dataset.j, t=ensureTie(j);
    document.querySelectorAll('.redit').forEach(row=>{ const r=t.rubbers[+row.dataset.r]; const g=n=>row.querySelector(`[name=${n}]`)?.value??'';
      r.polo=[g('p1'),r.type==='D'?g('p2'):''].filter(Boolean); r.score=g('score').trim(); r.res=g('res')||null; r.note=g('note').trim(); r.riv=g('riv').trim().slice(0,60); r.wo=!r.score && /\bw\.?\s*o\b/i.test(r.note); });
    t.moment=$('#moment').value.trim();
    const val=validateTie(t); if(val.errors.length){ renderQuiet(); toast('Hay errores en los resultados: revísalos'); return; }
    finishTieSave(j, $('#ps')?.value??'', $('#rs')?.value??'');
    if(ui.actaManual===j){ const ad=actaDocFor(j); ui.actaManual=null; if(ad && ad.status!=='completado') safe(()=>B.update(`${SEASON_PATH}/docs/${ad.id}`,{status:'completado', validatedBy:(me&&player(me)?.name)||authUser?.email||'', validatedAt:Date.now(), applied:`Resultados de la jornada ${j} (corregidos a mano)`})); } }
  else if(a==='acta-preview'){ const id=el.dataset.id; try{ const b=await docBlob(id); (ui.docUrls ||= {})[id]=URL.createObjectURL(b); renderQuiet(); }catch(e){ toast('No se ha podido abrir el acta'); } }
  else if(a==='acta-read'){ const id=el.dataset.id; ui.acta=null; renderQuiet(); await docRead(id,{stay:true}); renderQuiet(); }
  else if(a==='acta-confirm'){ actaConfirm(+el.dataset.j); }
  else if(a==='acta-manual'){ const j=+el.dataset.j; if(ui.acta){ actaToTie(j); ui.actaManual=j; } (ui.resMode ||= {})[j]='manual'; renderQuiet(); toast('Datos del acta pasados al formulario: corrige y pulsa «Guardar resultados»'); }
  else if(a==='acta-unlink'){ const id=el.dataset.id, j=+el.dataset.j, d=docs[id]; if(!d) return;
    const applied=(tie(j)||{}).actaId===id;
    if(!confirm(`¿Quitar «${d.name}» de la jornada ${j}? El archivo se queda en Documentos, sin jornada asignada.${applied? '\n\nLos resultados que se guardaron con esta acta se mantienen: sube el acta correcta o corrígelos a mano.' : ''}`)) return;
    ui.acta=null; await safe(()=>B.update(`${SEASON_PATH}/docs/${id}`,{j:null, status:'subido', validatedBy:DEL, validatedAt:DEL, applied:DEL, extraction:DEL}), 'Acta quitada de la jornada '+j); renderQuiet(); }
  else if(a==='res-mode'){ (ui.resMode ||= {})[+el.dataset.j]=el.dataset.v; renderQuiet(); }
  else if(a==='acta-override'){ if(ui.acta){ ui.acta.override=el.checked; renderQuiet(); } }
  else if(a==='team-save'){ if(!isAdmin) return; S.rules={...S.rules,teamManage:$('#team-manage').checked}; saveState(S.rules.teamManage? 'Gestión abierta a todo el equipo' : 'Gestión solo para capitanes'); }
  else if(a==='diag'){ ui.diag=[['Comprobando…','',true]]; renderQuiet(); try{ ui.diag=await B.diag(SEASON_PATH, clone(S)); }catch(e){ ui.diag=[['Error',e.code||e.message,false]]; } renderQuiet(); }
  else if(a==='fe-chip'){ const k=el.dataset.k, v=el.dataset.v; ui.fe.draft[k] = ui.fe.draft[k]===v? '' : v;
    el.closest('.fe-chips').querySelectorAll('.fchip').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.v===ui.fe.draft[k]))); feRefresh(); feQueue(); }
  else if(a==='fe-sug'){ const k=el.dataset.k, inp=document.getElementById('fe-'+k); if(inp){ inp.value=el.dataset.v; } ui.fe.draft[k]=el.dataset.v; feRefresh(); feQueue(); }
  else if(a==='team-menu'){ let m=$('#teammenu'); if(m){ m.remove(); return; } m=document.createElement('div'); m.id='teammenu'; m.innerHTML=teamMenuHTML(); document.body.appendChild(m); const r=el.getBoundingClientRect(); m.style.top=(r.bottom+6)+'px'; m.style.left=Math.max(8,r.left-120)+'px'; }
  else if(a==='team-pick'){ $('#teammenu')?.remove(); switchTeam(el.dataset.t); if(route().startsWith('club')) location.hash='inicio'; toast('Equipo: '+teamLabel()); }
  else if(a==='team-menu-close'){ $('#teammenu')?.remove(); }
  else if(a==='team-open'){ switchTeam(el.dataset.t); location.hash='inicio'; }
  else if(a==='club-wk'){ const dd=+el.dataset.d; const base=ui.clubSat||ymd(weekendSat()); const x=new Date(base+'T12:00:00'); if(dd) x.setDate(x.getDate()+dd); ui.clubSat= dd? ymd(x) : ymd(weekendSat()); renderQuiet(); }
  else if(a==='club-print'){ window.print(); }
  else if(a==='msg-open'){ msgOpen(+el.dataset.j); }
  else if(a==='intro-open'){ introOpen(el.dataset.id); }
  else if(a==='fct-gedit'){ ui.fctEdit=el.dataset.tid; renderQuiet(); setTimeout(()=>document.getElementById('fct-g-'+el.dataset.tid)?.focus(),60); }
  else if(a==='fct-gsave'){ const tid=el.dataset.tid, v=+(document.getElementById('fct-g-'+tid)?.value||0); if(!(v>0&&v<1e7)) return toast('Escribe el código del grupo FCT (un número)');
    const t=clubTeams().find(x=>x.id===tid), info=fctTeamInfo(t); if(info.d) await safe(()=>B.update('seasons/'+info.sid,{comp:{...(info.d.comp||{}),fctGroup:v}}),'Grupo FCT guardado'); else { FCT_GROUPS[info.sid]=v; toast('Grupo guardado: pulsa «Crear y sincronizar»'); } ui.fctEdit=null; renderQuiet(); }
  else if(a==='fct-one'){ if(B.mode!=='firebase') return toast('Funciona en la app publicada, no en esta vista previa'); const tid=el.dataset.tid, t=clubTeams().find(x=>x.id===tid), nw=ui.fctNew?.tid===tid; if(nw){ ui.fctNew={...ui.fctNew,state:'sync'}; renderQuiet(); } const x=await fctSyncTeam(tid,nw); if(nw) ui.fctNew= x&&!x.error&&!x.skipped? {...ui.fctNew,state:'done',res:x} : {...ui.fctNew,state:'error',res:x,msg:'No se ha podido sincronizar. Revisa el código del grupo.'}; if(x) toast(fctSummary(t,x)); renderQuiet(); }
  else if(a==='fct-all'){ if(B.mode!=='firebase') return toast('Funciona en la app publicada, no en esta vista previa'); const out=[]; for(const t of clubTeams()){ if(!fctTeamInfo(t).grp) continue; const x=await fctSyncTeam(t.id); if(x) out.push(fctSummary(t,x)); } toast(out.length? out.join('. ') : 'Ningún equipo tiene grupo FCT'); }
  else if(a==='ar-now'){ if(B.mode!=='firebase') return toast('Funciona en la app publicada, no en esta vista previa'); el.disabled=true;
    try{ const tok=await B.idToken(); const r=await fetch('/api/remind',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({season:viewSeason,origin:location.origin})});
      if(r.status===501||r.status===404) toast('Aún no está configurado en Vercel (FIREBASE_SERVICE_ACCOUNT y CRON_SECRET)');
      else { const d=await r.json().catch(()=>({})); if(!r.ok) toast('No se ha podido enviar: '+(d.error||r.status)); else { const rs=(d.results||[])[0]||{}, aa=(rs.availability||[]).map(x=>`J${x.j}: ${x.reached} de ${x.recipients}`), dd=(rs.dayBefore||[]).map(x=>`J${x.j}: ${x.reached} de ${x.recipients}`);
        toast(d.avisos? `Enviado. Disponibilidad: ${aa.join(', ')||'nada pendiente'}. Día antes: ${dd.join(', ')||'nada que avisar'}.` : 'No había nada pendiente que recordar'); } }
    }catch(err){ toast('No se ha podido enviar'); } el.disabled=false; }
  else if(a==='ob-finish'){ if(ui.fe?.dirty) await feFlush(); ui.onboard=false; location.hash='inicio'; setTimeout(()=>{ confetti(innerWidth/2,innerHeight/3,90); toast('¡Bienvenido al equipo! Ya está todo listo.'); },300); }
  else if(a==='tour-again'){ startOnb({force:true}); }
  else if(a==='nudge-off'){ try{ localStorage.setItem('polo-nudge',String(Date.now())); }catch(e){} renderQuiet(); }
  else if(a==='club-doc-team-go'){ if(el.dataset.t) switchTeam(el.dataset.t); }
  else if(a==='capr-save'){ const j=+el.dataset.j, t=ensureTie(j), r={}; document.querySelectorAll('[data-capr]').forEach(x=>{ const v=x.value.trim(); if(v) r[x.dataset.capr]= x.dataset.capr==='nota'? +v : v.slice(0,2000); });
    if(!Object.keys(r).length) return toast('Escribe algo antes de guardar'); t.captainReport={...r, by:(me&&player(me)?.name)||authUser?.email||'', at:Date.now()}; saveState('Informe del capitán guardado'); }
  else if(a==='eq-view'){ ui.eqView=el.dataset.v; try{ localStorage.setItem('polo-eqview',ui.eqView); }catch(e){} renderQuiet(); }
  else if(a==='eq-sort'){ const v=el.dataset.v; ui.eqDir= ui.eqSort===v? -(ui.eqDir||1) : 1; ui.eqSort=v; renderQuiet(); }
  else if(a==='mail-toggle'){ ui.mailOpen=!ui.mailOpen; renderQuiet(); }
  else if(a==='fct-alerts'){ await saveMeta({fctAlerts:{...(meta?.fctAlerts||{}), on:el.checked}}, el.checked? 'Avisos de la FCT activados' : 'Avisos de la FCT desactivados'); }
  else if(a==='ar-on'){ await saveMeta({autoReport:{...(meta?.autoReport||{}), on:el.checked}}, el.checked? 'Informe automático activado' : 'Informe automático desactivado'); }
  else if(a==='ar-send'){ if(B.mode!=='firebase') return toast('Funciona en la app publicada, no en esta vista previa'); if(!confirm('¿Generar y enviar ahora el informe del último fin de semana a los gestores?')) return;
    ui.arSending=true; renderQuiet();
    try{ const tok=await B.idToken(); const r=await fetch('/api/auto-report',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:'{}'}); const j=await r.json().catch(()=>({}));
      toast(r.ok? `Informe enviado a ${j.to.length} ${j.to.length===1?'gestor':'gestores'}` : 'No se ha enviado: '+(j.error||r.status)); }
    catch(err){ toast('Sin conexión con el servidor'); } finally{ ui.arSending=false; renderQuiet(); } }
  else if(a==='mail-to'){ ui.mailTo ||= new Set(); el.checked? ui.mailTo.add(el.value) : ui.mailTo.delete(el.value); ui.mailExtra=$('#mail-extra')?.value||''; renderQuiet(); }
  else if(a==='mail-send'){ mailSend(); }
  else if(a==='mail-open'){ mailOpen(); }
  else if(a==='club-doc-dl'){ clubDocDownload(el.dataset.t, el.dataset.id); }
  else if(a==='club-doc-open'){ switchTeam(el.dataset.t); location.hash='doc-'+el.dataset.id; }
  else if(a==='docs-j'){ ui.docJ=+el.dataset.j; location.hash='docs'; }
  else if(a==='club-f-team'){ ui.clubTeam=el.dataset.t; }
  else if(a==='team-docs'){ switchTeam(el.dataset.t); location.hash='docs'; }
  else if(a==='mgr-add'){ const name=$('#mgr-name').value.trim(), email=$('#mgr-email').value.trim().toLowerCase(); if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast('Escribe un correo válido');
    const managers=[...(meta?.managers||[]).filter(x=>x.email!==email),{name,email}]; await saveMeta({managers, managerEmails:managers.map(x=>x.email)},'Gestor añadido: '+(name||email)); accAudit('gestor-anadido',{email}); }
  else if(a==='mgr-del'){ const gone=(meta?.managers||[])[+el.dataset.i]?.email||'', managers=(meta?.managers||[]).filter((_,i)=>i!==+el.dataset.i); await saveMeta({managers, managerEmails:managers.map(x=>x.email)},'Gestor quitado'); accAudit('gestor-quitado',{email:gone}); }
  else if(a==='cteams-save'){ const teams=clubTeams().map(t=>{ const row=document.querySelector(`#ctlist [data-id="${t.id}"]`); const g=n=>row?.querySelector(`[name=${n}]`)?.value.trim(); return {...t, name:g('name')||t.name, short:g('short')||t.short, cat:g('cat')||'', gender:g('gender')||''}; }); await saveMeta({teams},'Equipos guardados'); }
  else if(a==='cteam-add'){ const name=$('#ct-name').value.trim(), short=$('#ct-short').value.trim()||name; if(!name) return toast('Escribe el nombre del equipo'); let id=slug(short); while(clubTeams().some(t=>t.id===id)) id+='-2'; await saveMeta({teams:[...clubTeams(),{id,name,short,cat:''}], removedTeams:(meta?.removedTeams||[]).filter(x=>x!==id)},'Equipo añadido: '+short); clubKey=''; }
  else if(a==='cteam-del'){ teamDelete(el.dataset.t); }
  else if(a==='fct-new-open'){ ui.fctNewOpen=true; ui.fctNew=null; ui.fctFind=null; ui.fctBulk=null; if(route()==='club-fct') renderQuiet(); }
  else if(a==='fct-new-close'){ ui.fctNewOpen=false; ui.fctNew=null; ui.fctFind=null; ui.fctBulk=null; renderQuiet(); }
  else if(a==='fct-find'){ if(route()!=='club-fct') location.hash='club-fct'; fctFind(); }
  else if(a==='fct-pick'){ const F=ui.fctFind; if(F?.sel){ el.checked? F.sel.add(el.dataset.k) : F.sel.delete(el.dataset.k); renderQuiet(); } }
  else if(a==='fct-pick-all'){ const F=ui.fctFind; if(F?.teams){ F.sel=new Set(el.checked? F.teams.filter(t=>!t.have).map(t=>t.key) : []); renderQuiet(); } }
  else if(a==='fct-bulk'){ fctBulkAdd(); }
  else if(a==='fct-new-go'){ fctNewTeam(); }
  else if(a==='admin-tab' && el.dataset.v==='docs-go'){ location.hash='docs'; return; }
  else if(a==='team-docs'){ switchTeam(el.dataset.t); location.hash='docs'; }
  else if(a==='doc-filter'){ ui.docKind=el.dataset.v||''; renderQuiet(); }
  else if(a==='doc-dl'){ docDownload(el.dataset.id); }
  else if(a==='doc-del'){ docDelete(el.dataset.id); }
  else if(a==='doc-read'){ ui.rev=null; el.disabled=true; docRead(el.dataset.id,{stay:true}); }
  else if(a==='doc-preview'){ docPreview(el.dataset.id); }
  else if(a==='doc-discard'){ ui.rev=null; await safe(()=>B.update(`${SEASON_PATH}/docs/${el.dataset.id}`,{status:'subido', extraction:DEL}),'Lectura descartada'); }
  else if(a==='doc-apply'){ applyReview(); }
  else if(a==='poster-scroll'){ $('#poster-canvas')?.scrollIntoView({behavior:'smooth',block:'center'}); }
  else if(a==='cal-ok'){ const t=ensureTie(+el.dataset.j); t.calOk=true; saveState('Calendario confirmado'); }
  else if(a==='prep-save'){ const j=+el.dataset.j, f=poloFix(j), rv=$('#pp-rival').value, home=$('#pp-home').value==='1', d=$('#pp-date').value, tm=$('#pp-time').value;
    const clash=S.fixtures.find(x=>x!==f && x.j===j && (x.home===rv||x.away===rv)); if(clash) return toast(clubName(rv)+' ya juega otro enfrentamiento en esta jornada');
    const old=f.date; f.home=home? POLO : rv; f.away=home? rv : POLO; if(tm && tm!==f.time){ f.time=tm; lockFix(f,'time'); } if(d && d!==old) lockFix(f,'date');
    if(d && d!==old){ const orig=f.moved?.from||old; f.date=d; if(d===orig) delete f.moved; else f.moved={from:orig, at:Date.now(), by:(me&&player(me)?.name)||authUser?.email||''}; ui.adminJ=j; saveState(d<orig? 'Partido adelantado: la app se ha reordenado' : d>orig? 'Partido aplazado: la app se ha reordenado' : 'Vuelve a su fecha original'); }
    else saveState('Eliminatoria actualizada'); }
  else if(a==='use-fct'){ const f=poloFix(+el.dataset.j); if(!f) return; if(f.fctDate){ f.date=f.fctDate; delete f.moved; } if(f.fctTime) f.time=f.fctTime; delete f.fctDate; delete f.fctTime; delete f.lock; saveState('Fecha y hora de la FCT'); }
  else if(a==='move-reset'){ const f=poloFix(+el.dataset.j); if(f?.moved?.from){ f.date=f.moved.from; delete f.moved; if(f.lock) delete f.lock.date; saveState('Vuelve a su fecha original'); } }
  else if(a==='avail-close'){ const t=ensureTie(+el.dataset.j); if(availFor(+el.dataset.j).none.length && !confirm('Aún falta gente por responder. ¿Cerrar la disponibilidad igualmente?')) return; t.availClosed=true; t.availClosedAt=Date.now(); ui.jTab='disp'; saveState('Disponibilidad cerrada'); }
  else if(a==='avail-reopen'){ const t=ensureTie(+el.dataset.j); t.availClosed=false; saveState('Disponibilidad reabierta'); }
  else if(a==='go-compose'){ const j=+el.dataset.j, kind=el.dataset.kind; if(route()!=='admin'){ ui.adminTab='jornada'; ui.adminJ=j; ui.jTabSet=true; ui.jTabFor=j; ui.jTab='disp'; ui.composeAfter={kind,j,text:composeText(kind,j)}; location.hash='admin'; return; } ui.jTab='disp'; ui.compose={kind,j,text:composeText(kind,j)}; render(); setTimeout(()=>$('#compose-text')?.scrollIntoView({behavior:'smooth',block:'center'}),80); }
  else if(a==='res-clear'){ const j=+el.dataset.j, t=ensureTie(j), r=t.rubbers[+el.dataset.r]; if(!confirm('¿Borrar el resultado de '+RUBBERS[+el.dataset.r].label+'?')) return; r.score=''; r.res=null; r.note='';
    const f=poloFix(j), c=tieFromRubbers(j); if(f.src==='rubbers' && !c.complete){ f.hs=null; f.as=null; f.status=null; f.src=null; } saveState('Resultado borrado: estadísticas recalculadas'); }
  else if(a==='res-confirm'){ const f=poloFix(+el.dataset.j); f.status='official'; saveState('Resultado confirmado como oficial'); }
  else if(a==='res-unconfirm'){ const f=poloFix(+el.dataset.j); f.status='provisional'; saveState('Marcado como provisional'); }
  else if(a==='survey-toggle'){ const k=jid(+el.dataset.j); S.survey.closed={...(S.survey.closed||{})}; if(S.survey.closed[k]) delete S.survey.closed[k]; else S.survey.closed[k]=true; saveState(S.survey.closed[k]?'Encuesta cerrada':'Encuesta reabierta'); }
  else if(a==='q-add'){ readQuestions(); S.survey.questions.push({id:'q_'+Date.now().toString(36),scope:'team',type:'scale',text:'Nueva pregunta'}); renderQuiet(); }
  else if(a==='q-del'){ readQuestions(); S.survey.questions.splice(+el.dataset.i,1); renderQuiet(); }
  else if(a==='q-save'){ readQuestions(); saveState('Preguntas guardadas'); }
  else if(a==='q-reset'){ S.survey.questions=DEFAULT_Q.map(q=>({...q})); saveState('Preguntas restauradas'); }
  else if(a==='players-save'){
    // Capitanes: la gestión marca los oficiales y cualquier capitán; el capitán oficial puede nombrar capitanes adicionales
    // de su equipo (las reglas impiden que toque a los oficiales o a jugadores de fuera del equipo)
    const offOld=accOfficial(S), mayCaps=canClub()||accIsOfficialCap();
    const offNew=canClub()? [...document.querySelectorAll('input[name=official]:checked')].map(x=>x.value) : offOld;
    let caps=mayCaps? [...new Set([...document.querySelectorAll('input[name=captain]:checked')].map(x=>x.value).concat(offNew))] : (S.captains||[]);
    const ph={...phones}; const phChanged=[];
    document.querySelectorAll('#plist [data-id]').forEach(row=>{ const p=player(row.dataset.id); if(!p) return; const g=n=>row.querySelector(`[name=${n}]`);
      p.name=g('name').value.trim()||p.name; p.full=g('full').value.trim()||p.name; p.order=+g('order').value||p.order; p.cat=g('cat').value.trim(); p.pts=+g('pts').value||0; p.active=g('active').checked; p.captain=caps.includes(p.id);
      const v=g('phone').value.trim(); if((ph[p.id]||'')!==v){ phChanged.push([p.id,v]); if(v) ph[p.id]=v; else delete ph[p.id]; } });
    if(!canClub()) caps=caps.filter(id=>S.players.some(p=>p.id===id && p.active!==false));
    const capOld=S.captains||[]; S.captains=caps; if(canClub() || !Array.isArray(S.officialCaptains)) S.officialCaptains=offNew; phones=ph; phChanged.forEach(([pid,v])=>safe(()=> v? B.merge('phones/'+pid,{phone:v,at:Date.now()}) : B.del('phones/'+pid)));
    saveState('Plantilla guardada');
    if(offNew.join()!==offOld.join()) accAudit('capitanes-oficiales', {team:teamId, antes:offOld, ahora:offNew});
    if(caps.join()!==capOld.join()){ accAudit(canClub()? 'capitanes' : 'capitan-adicional', {team:teamId, antes:capOld, ahora:caps}); setTimeout(()=>accSyncCaptainPids(true),1500); } }
  else if(a==='player-add'){ const name=$('#np-name').value.trim(); if(!name) return toast('Escribe el nombre'); let id=slug(name); while(player(id)) id+='-2';
    S.players.push({id,name,full:$('#np-full').value.trim()||name,cat:$('#np-cat').value.trim(),pts:0,order:Math.max(...S.players.map(p=>p.order))+1,captain:false,active:true}); saveState(name+' añadido'); }
  else if(a==='teams-save'){ document.querySelectorAll('#tlist [data-id]').forEach(row=>{ const t=team(row.dataset.id); ['name','short','abbr'].forEach(n=>{ const v=row.querySelector(`[name=${n}]`).value.trim(); if(v) t[n]=v; }); }); saveState('Clubes guardados'); }
  else if(a==='fixtures-save'){ document.querySelectorAll('#flist [data-k]').forEach(row=>{ const f=S.fixtures[+row.dataset.k], g=n=>row.querySelector(`[name=${n}]`).value, nd=g('date'), nt=g('time'); if(nd && nd!==f.date){ f.date=nd; lockFix(f,'date'); } if(nt && nt!==f.time){ f.time=nt; lockFix(f,'time'); } f.home=g('home'); f.away=g('away'); const hs=g('hs'),as=g('as'); if(hs!==''&&as!==''){ f.hs=+hs; f.as=+as; } else { f.hs=null; f.as=null; } }); saveState('Jornada '+el.dataset.j+' guardada'); }
  else if(a==='official-save'){ const order=[...document.querySelectorAll('#offlist select')].map(x=>x.value); if(new Set(order).size!==order.length) return toast('Hay clubes repetidos'); S.official={asOf:+$('#off-j').value||0,order}; saveState('Clasificación oficial guardada'); }
  else if(a==='rules-save'){ S.rules={...S.rules,win:+$('#r-win').value,loss:+$('#r-loss').value,deadlineDays:Math.max(0,Math.min(14,+($('#r-dd')?.value??S.rules.deadlineDays))),deadlineTime:$('#r-dt')?.value||S.rules.deadlineTime,availDays:Math.max(1,Math.min(21,+$('#r-av').value||6)), mvpHours:Math.max(1,Math.min(240,+($('#r-mvp')?.value)||48)), doubles:$('#r-dbl')?.value||'always'}; saveState('Reglas guardadas'); }
  else if(a==='go-admin'){ ui.adminTab='jornada'; ui.adminJ=+el.dataset.j; const tt=el.dataset.t||'disp'; ui.jTab= tt==='enc'||tt==='mvp'? 'post' : tt==='cartel'? 'conv' : tt; ui.jTabSet=true; ui.jTabFor=+el.dataset.j; location.hash='admin'; }
  else if(a==='cal-pick'){ const j=+el.dataset.j; ui.calOpen= ui.calOpen===j? null : j; ui.calJ=j; renderQuiet(); }
  else if(a==='msg-pick'){ ui.msgPick=el.dataset.v; document.querySelectorAll('.msged').forEach(x=>x.hidden=x.dataset.msg!==ui.msgPick); document.querySelectorAll('.msgpick .chip').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===ui.msgPick)); }
  else if(a==='msg-var'){ const ta=$('#msg-'+el.dataset.k); if(!ta) return; const v=el.dataset.v, i0=ta.selectionStart??ta.value.length, i1=ta.selectionEnd??i0; ta.value=ta.value.slice(0,i0)+v+ta.value.slice(i1); ta.focus(); ta.selectionStart=ta.selectionEnd=i0+v.length; }
  else if(a==='jtab'){ const hj=el.closest('[data-home-j]')?.dataset.homeJ; ui.jTab=el.dataset.v; ui.compose=null; if(el.dataset.mode) (ui.resMode ||= {})[+(hj||adminJ())]=el.dataset.mode; if(hj || route()!=='admin'){ if(hj){ ui.adminJ=+hj; ui.jTabFor=+hj; } ui.jTabSet=true; ui.adminTab='jornada'; if(route()==='admin') render(); else location.hash='admin'; return; } render(); }
  else if(a==='av-pick'){ ui.avDraft.s=el.dataset.v; const ta=$('#av-c'); if(ta) ui.avDraft.c=ta.value; renderQuiet(); }
  else if(a==='av-chip'){ const ta=$('#av-c'); const c=(ta?.value||'').trim(); ui.avDraft.c = c? (c.includes(el.dataset.v)? c : c+'. '+el.dataset.v) : el.dataset.v; renderQuiet(); }
  else if(a==='av-save'){ const j=+el.dataset.j, k=jid(j), now=Date.now(), d=ui.avDraft; if(!me||!d?.s) return; d.c=($('#av-c')?.value||'').trim();
    const cur=avail[me]||{}; const prev=avOf(me,j);
    const next={j:{...(cur.j||{}),[k]:{s:d.s,at:now}}, h:{...(cur.h||{}),[k]:[...((cur.h||{})[k]||[]),{s:d.s,at:now}].slice(-30)}};
    avail[me]=next; const curN=notes[me]||{}, prevC=curN.j?.[k]?.c||'';
    try{ await trackWrite(B.set(SEASON_PATH+'/avail/'+me,next));
      if(d.c!==prevC){ const nn={j:{...(curN.j||{}),[k]:{c:d.c,at:now}}, h:{...(curN.h||{}),[k]:[...((curN.h||{})[k]||[]),{c:d.c,at:now}].slice(-20)}}; notes[me]=nn; await B.set(SEASON_PATH+'/availNotes/'+me,nn); }
      toast(prev? 'Respuesta actualizada' : 'Respuesta enviada'); if(d.s==='yes'){ const b=el.getBoundingClientRect(); confetti(b.left+b.width/2,b.top,50); } renderQuiet();
    }catch(err){ toast('No se ha podido guardar: '+(err?.code||err?.message||'error')); } }
  else if(a==='compose'){ const j=+el.dataset.j, kind=el.dataset.kind; ui.compose={kind,j,text:composeText(kind,j)}; renderQuiet(); setTimeout(()=>$('#compose-text')?.focus(),50); }
  else if(a==='compose-close'){ ui.compose=null; renderQuiet(); }
  else if(a==='wa-send'||a==='wa-share'||a==='wa-copy'||a==='wa-group'){ const j=+el.dataset.j, kind=el.dataset.kind, text=$('#compose-text')?.value||''; ui.compose.text=text;
    if(a==='wa-send') waOpen(text);
    else if(a==='wa-group'){ let ok=true; try{ await navigator.clipboard.writeText(text); }catch(e){ ok=false; } const l=document.createElement('a'); l.href=waCfg().group; l.target='_blank'; l.rel='noopener'; document.body.appendChild(l); l.click(); l.remove(); toast(ok? 'Texto copiado: pégalo en el grupo' : 'No se ha podido copiar: cópialo a mano'); }
    else if(a==='wa-share'){ try{ await navigator.share({text}); }catch(e){ return; } }
    else { try{ await navigator.clipboard.writeText(text); toast('Texto copiado'); }catch(e){ toast('Selecciona el texto y cópialo a mano'); return; } }
    logSend(kind,j,kind==='rem'?{n:availFor(j).none.length}:null); if(kind==='req') notify('avail',j); else if(kind==='rem') notify('availRem',j); }
  else if(a==='wa-one'){ const j=+el.dataset.j, pid=el.dataset.pid; const text=withLinks('remOne',S.msgs.remOne,{...msgVars(j),nombre:pname(pid).split(' ')[0]}); waOpen(text,waPhone(phones[pid])); logSend('rem',j,{pid}); }
  else if(a==='sede-save'){ const f=poloFix(+el.dataset.j), v=String($('#sede-addr')?.value||'').trim().slice(0,160); let t=S.teams.find(x=>x.id===f.home);
    if(!t) return toast('No se encuentra el club local'); t.venue=v; saveState(v? 'Dirección guardada' : 'Dirección quitada'); }
  else if(a==='dl-save'){ const j=+el.dataset.j, v=$('#dl').value; if(!v) return toast('Elige fecha y hora'); ensureTie(j).deadline=v; saveState('Plazo guardado'); }
  else if(a==='dl-reset'){ const t=ensureTie(+el.dataset.j); delete t.deadline; saveState('Plazo por defecto'); }
  else if(a==='conv-save'){ const j=+el.dataset.j, t=ensureTie(j); ui.capDraft=null;
    const conv=[...document.querySelectorAll('input[name=conv]:checked')].map(x=>x.value);
    document.querySelectorAll('.redit').forEach(row=>{ const r=t.rubbers[+row.dataset.r]; const g=n=>row.querySelector(`[name=${n}]`)?.value??''; r.polo=[g('p1'),r.type==='D'?g('p2'):''].filter(Boolean); });
    const assigned=new Set(t.rubbers.flatMap(r=>r.polo)); assigned.forEach(x=>{ if(!conv.includes(x)) conv.push(x); });
    t.convocados=conv; t.subs=conv.filter(x=>!assigned.has(x));
    let firstPub=false; if(el.dataset.pub==='1'){ if(!t.lineupPub){ t.lineupPubAt=Date.now(); firstPub=true; } t.lineupPub=true; }
    if(firstPub) setTimeout(()=>notify('lineup',j),400);
    saveState(el.dataset.pub==='1'?'Convocatoria publicada':'Borrador guardado'); if(el.dataset.pub==='1') confetti(innerWidth/2,innerHeight/2,60); }
  else if(a==='conv-pub'){ const t=ensureTie(+el.dataset.j); t.lineupPub=el.dataset.v==='1'; saveState(t.lineupPub?'Publicada':'Publicación retirada'); }
  else if(a==='poster-set'){ const j=adminJ(), t=ensureTie(j); t.poster={...(t.poster||{}),[el.dataset.k]:el.dataset.v}; saveState('Cartel actualizado'); }
  else if(a==='poster-texts'){ const t=ensureTie(+el.dataset.j); t.poster={...(t.poster||{}),title:$('#pt-title').value.trim(),sub:$('#pt-sub').value.trim(),tagline:$('#pt-tag').value.trim()}; saveState('Textos aplicados'); }
  else if(a==='poster-move'){ const j=adminJ(), t=ensureTie(j), save=t.poster||{}; t.poster={...save,hidden:[]}; const all=lineupList(j); t.poster=save; const i=all.indexOf(el.dataset.pid), k=i+(+el.dataset.d); if(k<0||k>=all.length) return; [all[i],all[k]]=[all[k],all[i]]; t.poster={...save,order:all}; saveState('Orden actualizado'); }
  else if(a==='poster-reset'){ const t=ensureTie(+el.dataset.j); t.poster={at:t.poster?.at}; saveState('Diseño automático'); }
  else if(a==='poster-dl'||a==='poster-share'){ posterExport(+el.dataset.j, a==='poster-share'?'share':'dl', $('#poster-canvas')); }
  else if(a==='poster-open'){ ui.pmFmt=null; openPosterModal(+el.dataset.j); }
  else if(a==='pm-fmt'){ ui.pmFmt=el.dataset.v; openPosterModal(+el.dataset.j); }
  else if(a==='pm-dl'||a==='pm-share'){ posterExport(+el.dataset.j, a==='pm-share'?'share':'dl', $('.pmodal canvas')); }
  else if(a==='pm-close') closePosterModal();
  else if(a==='crop'){ const t=el.dataset.target; if(t===me || canManage || isAdmin) openCropper(t, el.dataset.pick==='1'); }
  else if(a==='crop-close') closeCropper();
  else if(a==='crop-save') saveCrop();
  else if(a==='photo-del'){ const t=el.dataset.target; if(!confirm('¿Quitar la foto?')) return; delete photos[t]; renderQuiet(); await safe(()=>B.del('photos/'+t),'Foto quitada'); }
  else if(a==='comp-save'){ const g=$('#c-fct')?.value.replace(/\D/g,''); S.comp={...S.comp, name:$('#c-name').value.trim()||S.comp.name, group:$('#c-group').value.trim(), memorial:$('#c-mem').value.trim(), fctGroup: g? +g : null}; saveState('Competición guardada'); }
  else if(a==='fct-sync'){ if(B.mode!=='firebase') return toast('Funciona en la app publicada, no en esta vista previa'); el.disabled=true; const t0=el.textContent; el.textContent='Consultando la FCT…';
    try{ const tok=await B.idToken(); const r=await fetch('/api/fct-sync',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({season:SEASON_PATH.split('/')[1]})});
      if(r.status===501) toast('Falta configurar FIREBASE_SERVICE_ACCOUNT en Vercel');
      else { const d=await r.json().catch(()=>({})); const x=(d.results||[])[0]||{};
        if(!r.ok) toast('No se ha podido actualizar: '+(d.error||r.status)); else if(x.error) toast('FCT: '+x.error); else if(x.skipped==='sin-grupo-fct') toast('Pon primero el código del grupo FCT y guarda');
        else toast(x.changed? `Actualizado: ${x.results} resultados, ${x.dates} cambios de fecha${x.created? ', '+x.created+' partidos nuevos':''}${x.diffs?.length? '. Ojo: '+x.diffs.length+' diferencia con tu resultado':''}` : 'Todo al día: no había nada nuevo en la FCT'); } }
    catch(e){ toast('No se ha podido actualizar'); } el.disabled=false; el.textContent=t0; }
  else if(a==='team-add'){ const n=$('#nt-name').value.trim(); if(!n) return toast('Escribe el nombre del club'); let id=slug(n); while(S.teams.find(t=>t.id===id)) id+='-2'; S.teams.push({id,name:n,short:n,abbr:n.split(/\s+/).map(w=>w[0]).join('').slice(0,4).toUpperCase()}); saveState(n+' añadido'); }
  else if(a==='team-del'){ const id=el.dataset.id; if(S.fixtures.some(f=>f.home===id||f.away===id)) return toast('Quita antes sus enfrentamientos del calendario'); S.teams=S.teams.filter(t=>t.id!==id); saveState('Club quitado'); }
  else if(a==='jornada-add'){ const n=NJ()+1, last=S.fixtures.filter(f=>f.j===NJ())[0]; let d=new Date(); if(last){ d=new Date(last.date+'T12:00:00'); d.setDate(d.getDate()+7); } const others=S.teams.filter(t=>t.id!==POLO);
    S.fixtures.push({j:n,date:d.toISOString().slice(0,10),time:last?.time||'15:00',home:POLO,away:others[0]?.id||POLO,hs:null,as:null}); ui.calJ=n; ui.calOpen=n; saveState('Jornada '+n+' añadida'); }
  else if(a==='fix-add'){ const j=+el.dataset.j, ref=S.fixtures.find(f=>f.j===j); S.fixtures.push({j,date:ref?.date||new Date().toISOString().slice(0,10),time:ref?.time||'15:00',home:S.teams[0].id,away:S.teams[1]?.id||S.teams[0].id,hs:null,as:null}); saveState('Enfrentamiento añadido'); }
  else if(a==='fix-del'){ const k=+el.dataset.k, f=S.fixtures[k]; if(!f||!confirm('¿Quitar '+team(f.home).short+' contra '+team(f.away).short+'?')) return; S.fixtures.splice(k,1); saveState('Enfrentamiento quitado'); }
  else if(a==='jdate'){ const v=$('#jdate').value; if(!v) return toast('Elige la fecha'); S.fixtures.filter(f=>f.j===+el.dataset.j).forEach(f=>{ if(f.date!==v){ f.date=v; lockFix(f,'date'); } }); saveState('Fecha de la jornada cambiada'); }
  else if(a==='msgs-save'){ ['req','rem','remOne','lineup','survey','mvp','summary'].forEach(k=>{ const v=$('#msg-'+k)?.value; if(v!=null) S.msgs[k]=v; }); saveState('Mensajes guardados'); }
  else if(a==='msgs-reset'){ S.msgs={...DEFAULT_MSGS}; saveState('Mensajes restaurados'); }
  else if(a==='season-view'){ switchSeason(el.dataset.id); }
  else if(a==='season-current'){ const m={...(meta||{seasons:[SEASON_ID]}),current:el.dataset.id}; meta=m; await safe(()=>B.set('meta/app',m),'Temporada actual: '+el.dataset.id); render(); }
  else if(a==='season-new'){ const id=($('#ns-id').value||'').trim(); if(!/^[\w-]{2,20}$/.test(id)) return toast('Usa un nombre como 2027-28');
    const list=meta?.seasons?.length? meta.seasons : [SEASON_ID]; if(list.includes(id)) return toast('Esa temporada ya existe');
    const copy=$('#ns-copy').checked, base=normalize(null);
    const ns={...base, seasonId:id, comp:clone(S.comp), rules:clone(S.rules), msgs:clone(S.msgs), survey:{closed:{},questions:clone(S.survey.questions)}, teams: copy? clone(S.teams) : [clone(team(POLO))], players: copy? clone(S.players) : [], fixtures:[], ties:{}, published:{}, official:{asOf:0,order:[]}, updatedAt:Date.now()};
    await safe(async()=>{ await B.set('seasons/'+docIdFor(teamId,id),ns); meta={current:id,seasons:[...list,id]}; await B.set('meta/app',meta); },'Temporada '+id+' creada'); switchSeason(id); }
  else if(a==='mvp-pick'){ ui.mvpPick=el.dataset.pid; renderQuiet(); }
  else if(a==='mvp-cast'){ const j=+el.dataset.j, k=jid(j), v=ui.mvpPick; if(!v||!me||v===me) return; if(!confirm('¿Votar a '+pname(v)+' como MVP? No se puede cambiar.')) return;
    try{ await trackWrite(B.castVote(SEASON_PATH+'/mvp/'+k, me, v)); myVotes[k]=v; ui.mvpPick=null; render(); scrollTo(0,0); toast('Voto registrado'); confetti(innerWidth/2,innerHeight/3,90); navigator.vibrate?.(40); }
    catch(err){ toast(/permission/i.test(err?.code||err?.message||'')? 'No se ha podido votar: la votación está cerrada o ya has votado' : 'No se ha podido votar: '+(err?.code||err?.message)); } }
  else if(a==='mvp-open'){ const j=+el.dataset.j, k=jid(j), v=$('#mvp-dl')?.value; const dl=v? new Date(v).getTime() : Date.now()+(+S.rules.mvpHours||48)*3600e3; if(dl<=Date.now()) return toast('La fecha límite tiene que ser futura');
    const was=S.mvp[k]?.open; S.mvp[k]={...(S.mvp[k]||{}),open:true,openedAt:S.mvp[k]?.openedAt||Date.now(),deadline:dl}; saveState(was?'Plazo actualizado':'Votación abierta'); if(!was) setTimeout(()=>notify('mvp',j),400); }
  else if(a==='mvp-close'){ const k=jid(+el.dataset.j); if(S.mvp[k]){ S.mvp[k].open=false; S.mvp[k].closedAt=Date.now(); } saveState('Votación cerrada'); }
  else if(a==='mvp-publish'){ const j=+el.dataset.j, k=jid(j), pick=$('#mvp-pick')?.value; if(!pick) return toast('No hay candidatos');
    const tally=mvpTally(k), top=Math.max(0,...Object.values(tally)), first=!S.published[k]?.mvp;
    S.published[k]={...(S.published[k]||{}), mvp:pick, votes:tally[pick]||0, tally, voters:mvpVoteCount(k), manual:(tally[pick]||0)<top, at:Date.now()};
    if(S.mvp[k]){ S.mvp[k].open=false; S.mvp[k].closedAt=S.mvp[k].closedAt||Date.now(); } ui.revealed[j]=false;
    saveState('MVP publicado'); confetti(innerWidth/2,innerHeight/2,120); if(first) setTimeout(()=>notify('awards',j),500); }
  else if(a==='mvp-unpublish'){ const k=jid(+el.dataset.j); if(S.published[k]){ delete S.published[k].mvp; delete S.published[k].tally; delete S.published[k].votes; } saveState('Publicación retirada'); }
  else if(a==='mvp-annul'){ const j=+el.dataset.j, voter=el.dataset.voter, vv=mvpVotes[jid(j)]?.[voter]?.v; if(!confirm('¿Anular el voto de '+pname(voter)+'?')) return; await safe(()=>B.annulVote(SEASON_PATH+'/mvp/'+jid(j), voter, vv),'Voto anulado'); }
  else if(a==='ratings-pub'){ const j=+el.dataset.j, k=jid(j), agg=aggregate(k); S.published[k]={...(S.published[k]||{}),ratings:agg.ratings,n:agg.n}; saveState('Nota del equipo publicada'); }
  else if(a==='photos-opt'){ if(!ui.photoOpt) photosOptimize(); }
  else if(a==='inst-how'){ window.instSheet?.('boton'); }
  else if(a==='install'){ if(!installEvt) return; installEvt.prompt(); const c=await installEvt.userChoice.catch(()=>null); installEvt=null; renderQuiet(); if(c?.outcome==='accepted') toast('Instalando…'); }
  else if(a==='push-on') enablePush();
  else if(a==='push-test'){ try{ const reg=await navigator.serviceWorker.ready; reg.showNotification(teamLabel(),{body:'Así te llegarán los avisos del equipo 🎾',icon:'/icons/icon-192.png',badge:'/icons/badge-96.png'}); }catch(e){ toast('No se ha podido mostrar la prueba'); } }
  else if(a==='wa-optin'){ if(!me) return; const on=el.checked, v=(phones[me]||'').trim(); if(on && !v){ el.checked=false; return toast('Escribe primero tu móvil'); } waOptIn=on; await safe(()=>B.merge('phones/'+me, on? {phone:v, wa:true, waAt:Date.now()} : {wa:false, waOffAt:Date.now()}), on? 'Recibirás los avisos por WhatsApp' : 'Ya no recibirás avisos por WhatsApp'); renderQuiet(); }
  else if(a==='phone-save'){ const v=$('#my-phone').value.trim(); phones[me]=v; await safe(()=> v? B.merge('phones/'+me,{phone:v,at:Date.now()}) : B.del('phones/'+me),'Teléfono guardado'); }
  else if(a==='tf-save'){ const o={}; document.querySelectorAll('[data-tf]').forEach(x=>{ const v=x.value.trim(); if(v) o[x.dataset.tf]=v; }); o.at=Date.now(); profiles[me]=o; await safe(()=>B.set('profiles/'+me,o),'Ficha guardada'); renderQuiet(); }
  else if(a==='notify'){ notify(el.dataset.type,+el.dataset.j); }
  else if(a==='demo-reset'){ if(confirm('¿Borrar todos los datos de la vista previa?')){ await B.reset(); location.reload(); } }
});
document.addEventListener('change', e=>{ const el=e.target, a=el.dataset?.act;
  if(el.dataset && 'introVis' in el.dataset && ui.fe){ ui.fe.draft.introOff=!el.checked; feQueue(); return; }
  if(el.dataset?.ar){ const ar={...(S.rules.autoRemind||{})}; if(el.dataset.ar==='on') ar.on=el.checked; else if(el.dataset.ar==='every') ar.every=+el.value; else if(el.dataset.ar==='day') ar.dayBefore=el.checked; S.rules={...S.rules,autoRemind:ar}; saveState(el.dataset.ar==='on'? (ar.on? 'Recordatorios automáticos activados' : 'Recordatorios automáticos desactivados') : 'Recordatorios actualizados'); return; }
  if(el.dataset?.actaFile){ const j=+el.dataset.actaFile, fl=el.files?.[0]; el.value=''; if(fl){ if(!/image|pdf/.test(fl.type) && !/\.(pdf|jpe?g|png|heic|webp)$/i.test(fl.name)) return toast('Sube una foto o un PDF del acta'); ui.acta=null; uploadDocs([fl],{kind:'acta', j}).then(()=>renderQuiet()); } return; }
  if(el.dataset?.actaRow!==undefined && ui.acta){ const r=ui.acta.rows[+el.dataset.actaRow], k=el.dataset.k; if(!r) return;
    if(k==='score'){ r.score=el.value.trim().replace(/\s+/g,' '); const c=rubberCalc({score:r.score}); if(c.res) r.winner=c.res==='W'?'polo':'rival'; }
    else if(k==='winner') r.winner=el.value; else if(k.startsWith('pid')){ const n=+k.slice(3); r.pids[n]=el.value; r.pconf[n]=1; r.pamb[n]=false; }
    renderQuiet(); return; }
  if(el.id==='doc-files' && el.files?.length){ uploadDocs([...el.files]); el.value=''; return; }
  if(el.dataset?.rev && ui.rev){ const k=el.dataset.rev, i=+el.dataset.i, r=ui.rev.rows?.[i];
    if(k==='act'){ r.act=el.value; if(r.act==='link'&&!r.pid) r.pid=matchPlayer(r.name); } else if(k==='pid') r.pid=el.value||null; else if(k==='use') r.use=el.checked;
    else if(k==='h') r.h=el.value||null; else if(k==='a') r.a=el.value||null; else if(k==='t') r.t=el.value||null; else if(k==='rp') r.pids[+el.dataset.k]=el.value||null;
    else if(k==='score') r.score=el.value.trim(); else if(k==='j') ui.rev.j=el.value? +el.value : null; else if(k==='force') ui.rev.force=el.checked;
    renderQuiet(); return; }
  if(a==='eq-sortsel'){ ui.eqSort=el.value; ui.eqDir=el.value==='n'? -1 : 1; renderQuiet(); }
  else if(a==='eq-f'){ ui[el.dataset.k]=el.value||null; renderQuiet(); }
  else if(a==='club-doc-team'){ switchTeam(el.value); renderQuiet(); }
  else if(a==='club-date'){ if(el.value){ ui.clubSat=ymd(weekendSat(new Date(el.value+'T12:00:00'))); renderQuiet(); } }
  else if(a==='club-f'){ ui[el.dataset.k]=el.value||null; renderQuiet(); }
  else if(a==='ar-day'){ saveMeta({autoReport:{...(meta?.autoReport||{}), day:el.value}}, el.value==='mon'? 'Se enviará el lunes por la noche' : 'Se enviará el domingo por la noche'); }
  else if(a==='doc-kind'){ const id=el.dataset.id, d=docs[id]; if(!d || d.kind===el.value) return;
    const log=[...(d.kindLog||[]), {from:d.kind, to:el.value, by:(me&&player(me)?.name)||authUser?.email||'', at:Date.now()}].slice(-20);
    safe(()=>B.update(`${SEASON_PATH}/docs/${id}`,{kind:el.value, kindLog:log}),'Tipo cambiado a «'+(DOC_KINDS[el.value]||el.value)+'». El archivo, su jornada y su historial se conservan.'); }
  else if(a==='admin-j'){ ui.adminJ=+el.value; ui.compose=null; ui.jTabSet=false; render(); }
  else if(a==='cal-j'){ ui.calJ=+el.value; render(); }
  else if(a==='poster-hide'){ const j=adminJ(), t=ensureTie(j), h=new Set(t.poster?.hidden||[]); el.checked? h.delete(el.dataset.pid) : h.add(el.dataset.pid); t.poster={...(t.poster||{}),hidden:[...h]}; saveState('Cartel actualizado'); }
  else if(a==='av-admin'){ const j=+el.dataset.j, pid=el.dataset.pid, k=jid(j), now=Date.now(), cur=avail[pid]||{};
    const next= el.value? {j:{...(cur.j||{}),[k]:{s:el.value,at:now,by:'capitán'}}, h:{...(cur.h||{}),[k]:[...((cur.h||{})[k]||[]),{s:el.value,at:now,by:'capitán'}].slice(-30)}} : null;
    if(next){ avail[pid]=next; safe(()=>B.set(SEASON_PATH+'/avail/'+pid,next),'Anotado para '+pname(pid)); renderQuiet(); } } else if(a==='rank-filter'){ ui.rankFilter=el.value; renderQuiet(); }
  else if(a==='cmp-a'){ ui.cmpA=el.value; renderQuiet(); } else if(a==='cmp-b'){ ui.cmpB=el.value; renderQuiet(); } });
document.addEventListener('input', e=>{ const el=e.target;
  if(el.dataset?.fe && ui.fe){ ui.fe.draft[el.dataset.fe]=el.value; clearTimeout(ui.fe.pt); ui.fe.pt=setTimeout(feRefresh,180); feQueue(); }
  if(el.hasAttribute?.('data-fe-phone') && ui.fe && me){ ui.fe.phone=el.value; clearTimeout(ui.fe.ft); feStatus('Guardando…','saving'); ui.fe.ft=setTimeout(async()=>{ const v=ui.fe.phone.trim(); phones[me]=v; try{ await trackWrite(v? B.merge('phones/'+me,{phone:v,at:Date.now()}) : B.del('phones/'+me)); feStatus('Guardado ✓','ok'); }catch(err){ feStatus('No se ha guardado','ko'); } },900); } if(el.dataset?.act==='ans-text'&&ui.survey) ui.survey.a[el.dataset.q]=el.value; if(el.dataset?.act==='av-text'&&ui.avDraft) ui.avDraft.c=el.value; if(el.id==='compose-text'&&ui.compose) ui.compose.text=el.value; });
document.addEventListener('dragover', e=>{ const z=e.target.closest?.('#dropzone'); if(z){ e.preventDefault(); z.classList.add('over'); } });
document.addEventListener('dragleave', e=>{ const z=e.target.closest?.('#dropzone'); if(z) z.classList.remove('over'); });
document.addEventListener('drop', e=>{ const z=e.target.closest?.('#dropzone'); if(z){ e.preventDefault(); z.classList.remove('over'); const fs=[...(e.dataTransfer?.files||[])]; if(fs.length) uploadDocs(fs); } });
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeSheet(); stageClose(); closePosterModal(); closeCropper(); } });
function readQuestions(){ document.querySelectorAll('#qlist .qedit').forEach(row=>{ const q=S.survey.questions[+row.dataset.i]; if(!q) return; q.text=row.querySelector('[name=text]').value.trim(); q.scope=row.querySelector('[name=scope]').value; q.type=row.querySelector('[name=type]').value; if(q.scope==='peer') q.type='player'; }); S.survey.questions=S.survey.questions.filter(q=>q.text); }

