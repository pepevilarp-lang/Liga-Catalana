/* ===================== DOCUMENTOS DEL EQUIPO (Fase 2) ===================== */
const DOC_KINDS={plantilla:'Listado de jugadores',calendario:'Calendario de la competición',orden:'Orden de juego',acta:'Acta oficial',resultados:'Resultados',clasificacion:'Clasificación',competicion:'Documentación de la competición',foto:'Fotografía',otro:'Otro'};
const AI_KINDS=['plantilla','calendario','orden','acta','resultados','clasificacion'];
const DOC_ST={subido:'Pendiente',procesando:'Procesando',revision:'En revisión',validado:'Validado',completado:'Completado',error:'Error'};
const CHUNK=906000, MAX_DOC=15*1024*1024;
let docs={}, docsSub=null, docsKey='';
const normTxt = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function guessKind(name, mime){ const n=normTxt(name);
  if(/image\//.test(mime||'')) return /acta|resultat|result/.test(n)? 'acta' : 'foto';
  if(/acta|resultat|result|marcador/.test(n)) return 'acta';
  if(/clasific|classific/.test(n)) return 'clasificacion';
  if(/orden|ordre|alineac/.test(n)) return 'orden';
  if(/partits|partidos|calendari|calendar|jornad|grupo|grup|lliga|liga/.test(n)) return 'calendario';
  if(/plantilla|jugador|llistat de jug|listado de jug|llicenc|licenc/.test(n)) return 'plantilla';
  return 'otro'; }
function ensureDocsSub(){ if(docsKey===SEASON_PATH) return; docsKey=SEASON_PATH; try{ docsSub&&docsSub(); }catch(e){} docs={};
  docsSub=B.watchColl(SEASON_PATH+'/docs', m=>{ docs=m; softRender(); }); }
function docGroups(){ const g={}; Object.entries(docs).forEach(([id,d])=>{ const k=d.group||id; (g[k] ||= []).push({id,...d}); }); Object.values(g).forEach(a=>a.sort((x,y)=>(y.version||1)-(x.version||1))); return g; }
const fmtSize = b => b>1048576? (b/1048576).toFixed(1)+' MB' : Math.max(1,Math.round(b/1024))+' KB';
const docIcon = d => /pdf/.test(d.mime)? '📄' : /sheet|excel|csv/.test(d.mime)||/\.(xlsx?|csv)$/i.test(d.name)? '📊' : /word/.test(d.mime)||/\.docx?$/i.test(d.name)? '📝' : /image/.test(d.mime)? '🖼️' : '📎';
function vDocs(){
  if(!canManage && !isManager) return `<div class="wrap"><div class="pagehead"><h1>Documentos</h1></div><div class="notice">Elige tu nombre en Yo para ver la documentación del equipo.</div></div>`;
  ensureDocsSub(); const groups=Object.values(docGroups()), js=[...new Set(S.fixtures.filter(f=>f.home===POLO||f.away===POLO).map(f=>f.j))].sort((a,b)=>a-b);
  const filt=ui.docKind||''; const shown=groups.filter(g=>!filt||g[0].kind===filt);
  const byJ={}; shown.forEach(g=>{ const k=g[0].j? 'j'+g[0].j : 'g'; (byJ[k] ||= []).push(g); });
  const order=['g',...js.map(j=>'j'+j), ...Object.keys(byJ).filter(k=>k!=='g'&&!js.includes(+k.slice(1)))].filter((k,i,a)=>a.indexOf(k)===i && byJ[k]);
  const row=g=>{ const d=g[0]; return `<li class="docrow"><span class="di">${docIcon(d)}</span><div class="dmain"><b>${esc(d.name)}</b><small><select class="kindsel" data-act="doc-kind" data-id="${esc(d.id)}" aria-label="Tipo de documento">${Object.entries(DOC_KINDS).map(([k,l])=>`<option value="${k}" ${d.kind===k?'selected':''}>${l}</option>`).join('')}</select> ${fmtSize(d.size||0)}, ${esc(d.byName||'')}, ${relTime(d.at)}${(d.version||1)>1? ', versión '+d.version : ''}</small>
      ${g.length>1? `<details class="dver"><summary>${g.length} versiones</summary>${g.map(v=>`<div><button class="textlink" data-act="doc-dl" data-id="${esc(v.id)}">v${v.version||1}</button> <span class="muted small">${relTime(v.at)}, ${esc(v.byName||'')}</span></div>`).join('')}</details>` : ''}</div>
      <span class="dst ${d.status}">${DOC_ST[d.status]||d.status}</span>
      <span class="dact"><button class="btn sm ghost" data-act="doc-dl" data-id="${esc(d.id)}">Descargar</button>${AI_KINDS.includes(d.kind)? `<a class="btn sm ${d.status==='revision'?'brass':'ghost'}" href="#${ui.docBase||'doc-'}${esc(d.id)}">${d.status==='revision'?'Revisar':d.status==='completado'?'Ver lectura':'Leer con IA'}</a>` : ''}<button class="iconbtn" data-act="doc-del" data-id="${esc(d.id)}" aria-label="Borrar">✕</button></span></li>`; };
  return `<div class="wrap"><div class="pagehead"><p class="qsec">${esc(curTeam().name)}, temporada ${esc(viewSeason)}</p><h1>Documentos</h1><p class="lede">Listados, órdenes de juego, actas, clasificaciones y fotos de cada jornada. Los originales se guardan y se pueden descargar siempre.</p></div>
  <section class="sec"><div class="dropzone" id="dropzone"><p><b>Arrastra aquí los archivos</b> o <label class="textlink" style="cursor:pointer">elígelos<input type="file" id="doc-files" multiple hidden accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.txt"></label></p>
    <p class="muted small">PDF, Excel, Word, JPG o PNG, hasta 15 MB por archivo.</p>
    <div class="row" style="justify-content:center;margin-top:8px"><label class="small">Jornada <select id="doc-j" style="width:auto"><option value="">General de la temporada</option>${js.map(j=>`<option value="${j}" ${ui.docJ==j?'selected':''}>Jornada ${j}</option>`).join('')}</select></label>
      <label class="small">Tipo <select id="doc-k" style="width:auto"><option value="">Detectar por el nombre</option>${Object.entries(DOC_KINDS).map(([k,l])=>`<option value="${k}" ${ui.docUpKind===k?'selected':''}>${l}</option>`).join('')}</select></label></div>
    <div id="doc-prog"></div></div></section>
  <section class="sec"><div class="chips"><button class="chip" data-act="doc-filter" data-v="" aria-pressed="${!filt}">Todos</button>${Object.entries(DOC_KINDS).map(([k,l])=>`<button class="chip" data-act="doc-filter" data-v="${k}" aria-pressed="${filt===k}">${l}</button>`).join('')}</div></section>
  ${order.length? order.map(k=>`<section class="sec"><div class="sec-h"><h2>${k==='g'?'General de la temporada':'Jornada '+k.slice(1)}</h2></div><ul class="doclist">${byJ[k].map(row).join('')}</ul></section>`).join('') : '<section class="sec"><div class="empty">Aún no hay documentos.</div></section>'}</div>`;
}
const fileToDataURL = f => new Promise((ok,ko)=>{ const r=new FileReader(); r.onload=()=>ok(r.result); r.onerror=()=>ko(r.error); r.readAsDataURL(f); });
async function uploadDocs(files, opt={}){
  const jSel= opt.j!=null? String(opt.j) : ($('#doc-j')?.value||''), kSel=opt.kind||$('#doc-k')?.value||'', prog=$('#doc-prog'), ids=[];
  for(const f of files){
    if(f.size>MAX_DOC){ toast(f.name+': supera 15 MB'); continue; }
    const kind=kSel||guessKind(f.name,f.type), j=jSel? +jSel : null, base=normTxt(f.name.replace(/\.[^.]+$/,''));
    const group=kind+'|'+(j||'g')+'|'+base, prev=Object.values(docs).filter(d=>d.group===group), version=prev.length? Math.max(...prev.map(d=>d.version||1))+1 : 1;
    const id=Date.now().toString(36)+Math.random().toString(36).slice(2,7); ids.push(id);
    if(prog) prog.innerHTML=`<p class="small">Subiendo ${esc(f.name)}…</p>`;
    try{ const data=(await fileToDataURL(f)).split(',')[1]||''; const n=Math.ceil(data.length/CHUNK)||1;
      for(let i=0;i<n;i++){ await trackWrite(B.set(`${SEASON_PATH}/docs/${id}/chunks/${i}`,{d:data.slice(i*CHUNK,(i+1)*CHUNK)})); if(prog) prog.innerHTML=`<p class="small">Subiendo ${esc(f.name)}: ${Math.round((i+1)*100/n)}%</p>`; }
      await trackWrite(B.set(`${SEASON_PATH}/docs/${id}`,{name:f.name, mime:f.type||'application/octet-stream', size:f.size, kind, j, group, version, chunks:n, status:'subido', at:Date.now(), by:authUser?.email||'', byName:(me&&player(me)?.name)||authUser?.name||authUser?.email||''}));
      toast(f.name+' subido'+(version>1?' (versión '+version+')':''));
    }catch(e){ toast('No se ha podido subir '+f.name); }
  }
  if(prog) prog.innerHTML='';
  return ids;
}
async function docBlob(id){ const d=docs[id]; const parts=[]; for(let i=0;i<(d.chunks||1);i++){ const c=await B.getDoc(`${SEASON_PATH}/docs/${id}/chunks/${i}`); parts.push(c?.d||''); }
  const bin=atob(parts.join('')), u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return new Blob([u8],{type:d.mime||'application/octet-stream'}); }
async function docDownload(id){ try{ const b=await docBlob(id), url=URL.createObjectURL(b), a=document.createElement('a'); a.href=url; a.download=docs[id].name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000); }catch(e){ toast('No se ha podido descargar'); } }
async function docDelete(id){ const d=docs[id]; if(!d||!confirm('¿Borrar '+d.name+'? Se borra el original.')) return; await safe(async()=>{ for(let i=0;i<(d.chunks||1);i++) await B.del(`${SEASON_PATH}/docs/${id}/chunks/${i}`); await B.del(`${SEASON_PATH}/docs/${id}`); },'Documento borrado'); }

/* ===================== LECTURA CON IA (Fase 3) ===================== */
const LIBS={pdf:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', pdfw:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js', xlsx:'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', mammoth:'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'};
// Carga una librería externa; si un intento falla, se borra para que el reintento la vuelva a pedir
const loadScript = src => new Promise((ok,ko)=>{ const ex=document.querySelector(`script[src="${src}"]`); if(ex && ex.dataset.ok) return ok(); if(ex) ex.remove(); const s=document.createElement('script'); s.src=src; s.onload=()=>{ s.dataset.ok='1'; ok(); }; s.onerror=()=>{ s.remove(); ko(new Error('No se ha podido cargar '+src.split('/').pop())); }; document.head.appendChild(s); });
async function imgToJpeg(src,max=1600){ const im=await new Promise((ok,ko)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=ko; i.src=src; }); const k=Math.min(1,max/Math.max(im.width,im.height)); const c=document.createElement('canvas'); c.width=Math.round(im.width*k); c.height=Math.round(im.height*k); c.getContext('2d').drawImage(im,0,0,c.width,c.height); return c.toDataURL('image/jpeg',.85); }
async function prepareDoc(id){   // texto e imágenes: solo lo necesario para la lectura
  const d=docs[id], blob=await docBlob(id), name=d.name.toLowerCase(), out={text:'',images:[]};
  if(/pdf/.test(d.mime)||name.endsWith('.pdf')){ await loadScript(LIBS.pdf); pdfjsLib.GlobalWorkerOptions.workerSrc=LIBS.pdfw;
    const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise; const pages=Math.min(pdf.numPages,15);
    for(let i=1;i<=pages;i++){ const pg=await pdf.getPage(i); const tc=await pg.getTextContent(); out.text+=tc.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join('')+'\n'; }
    if(d.kind==='acta' || out.text.replace(/\s/g,'').length<400){ if(out.text.replace(/\s/g,'').length<40) out.text=''; for(let i=1;i<=Math.min(pdf.numPages,3);i++){ const pg=await pdf.getPage(i), vp=pg.getViewport({scale:1}), sc=1600/Math.max(vp.width,vp.height), v2=pg.getViewport({scale:sc}), c=document.createElement('canvas'); c.width=v2.width; c.height=v2.height; await pg.render({canvasContext:c.getContext('2d'),viewport:v2}).promise; out.images.push(c.toDataURL('image/jpeg',.85)); } } }
  else if(/sheet|excel|csv/.test(d.mime)||/\.(xlsx?|csv)$/.test(name)){ await loadScript(LIBS.xlsx); const wb=XLSX.read(new Uint8Array(await blob.arrayBuffer()),{type:'array'}); out.text=wb.SheetNames.map(n=>'### '+n+'\n'+XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n\n'); }
  else if(name.endsWith('.docx')){ await loadScript(LIBS.mammoth); out.text=(await mammoth.extractRawText({arrayBuffer:await blob.arrayBuffer()})).value; }
  else if(name.endsWith('.doc')) throw new Error('Los .doc antiguos no se pueden leer: guárdalo como .docx o PDF');
  else if(/image/.test(d.mime)){ out.images.push(await imgToJpeg(URL.createObjectURL(blob))); }
  else if(/text/.test(d.mime)) out.text=await blob.text();
  out.text=out.text.slice(0,60000); return out; }
async function docRead(id, opt={}){
  const d=docs[id]; if(!d) return; if(B.mode!=='firebase') return toast('La lectura con IA funciona en la app publicada, no en la vista previa');
  const ref=`${SEASON_PATH}/docs/${id}`; (ui.readStage ||= {})[id]='prep'; renderQuiet(); await B.update(ref,{status:'procesando', procAt:Date.now()}).catch(()=>{});
  try{ const prep=await prepareDoc(id), tok=await B.idToken(); ui.readStage[id]='ai'; renderQuiet();
    const fx=d.j? poloFix(d.j) : null; const ctx={team:curTeam().name, players:S.players.map(p=>p.full||p.name), clubs:S.teams.map(t=>t.name), jornada:d.j||null, ...(fx? {rival:clubName(persp(fx).rival), fecha:fx.date} : {})};
    const r=await fetch('/api/extract',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({kind:d.kind,text:prep.text,images:prep.images,context:ctx})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error||('Error '+r.status));
    delete ui.readStage[id]; (ui.readDone ||= {})[id]=Date.now();
    await trackWrite(B.update(ref,{status:'revision', extraction:{kind:d.kind, data:j.data, provider:j.provider, model:j.model, usage:j.usage||null, at:Date.now(), images:j.imagesUsed||0}, error:DEL}));
    toast('Lectura lista: revísala'); if(!opt.stay) location.hash='doc-'+id;
  }catch(e){ delete (ui.readStage||{})[id]; await B.update(ref,{status:'error', error:String(e.message||e).slice(0,300)}).catch(()=>{}); toast('No se ha podido leer: '+(e.message||e)); renderQuiet(); }
}
/* ===================== SUBIR ACTA OFICIAL (Acta de resultats tècnics, FCT) ===================== */
// Emparejado tolerante para nombres escritos a mano: iniciales, apellidos sueltos y pequeñas faltas
function lev(a,b){ const m=a.length,n=b.length; if(!m) return n; if(!n) return m; let p=Array.from({length:n+1},(_,i)=>i); for(let i=1;i<=m;i++){ const c=[i]; for(let j=1;j<=n;j++) c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1)); p=c; } return p[n]; }
function guessPlayer(name){ const toks=normTxt(name).split(' ').filter(Boolean); if(!toks.length) return null;
  const sc=S.players.filter(p=>p.active!==false).map(p=>{ const pt=normTxt((p.full||'')+' '+p.name).split(' ').filter(Boolean); let tot=0, wsum=0;
    toks.forEach(t=>{ const w=t.length<=2? .5 : 1; let best=0; pt.forEach(q=>{ let s=0; if(t.length<=2) s= q.startsWith(t[0])? .75 : 0; else if(q===t) s=1; else if(t.length>=4 && (q.startsWith(t)||t.startsWith(q))) s=.9; else s=Math.max(0,1-lev(t,q)/Math.max(t.length,q.length)); if(s<.6) s=0; best=Math.max(best,s); }); tot+=best*w; wsum+=w; });
    return {id:p.id, s: wsum? tot/wsum : 0}; }).sort((a,b)=>b.s-a.s);
  const top=sc[0], second=sc[1]; if(!top || top.s<.45) return {id:'', conf:top?.s||0, ambiguous:false};
  return {id:top.id, conf:+top.s.toFixed(2), ambiguous: !!second && second.s>=top.s-.1 && top.s<.97, alts:sc.slice(0,3).map(x=>x.id)}; }
const actaDocFor = j => Object.entries(docs).map(([id,d])=>({id,...d})).filter(d=>d.kind==='acta' && +d.j===+j).sort((a,b)=>(b.at||0)-(a.at||0))[0]||null;
const rubIdx = r => r.type==='S'? (r.n>=1&&r.n<=4? r.n-1 : -1) : (r.n===1? 4 : -1);
function actaDraft(j,d){ const x=d.extraction?.data||{};
  const rows=(x.matches||[]).map(m=>{ const type=m.type==='D'?'D':'S'; const gs=(m.polo_players||[]).slice(0,type==='D'?2:1).map(nm=>({nm, g:guessPlayer(nm)}));
    return {type, n:+m.order||null, names:gs.map(z=>z.nm), pids:gs.map(z=>z.g&&z.g.id&&z.g.conf>=.55? z.g.id : ''), pconf:gs.map(z=>z.g?.conf||0), pamb:gs.map(z=>!!z.g?.ambiguous),
      rival:m.rival_text||'', written:m.score_written||'', side:m.score_side||null, score:String(m.score||'').trim(), winner:m.winner||'', note:m.retired_or_wo||'', conf:isFinite(+m.confidence)? +m.confidence : .5}; })
    .sort((a,b)=>(a.type===b.type? (a.n||9)-(b.n||9) : a.type==='S'? -1 : 1));
  return {id:d.id, j, rows, punt:x.puntuacion||{}, rival:x.rival||'', date:x.date||null, numero:x.acta_numero||null, unclear:Array.isArray(x.unclear)? x.unclear : [], override:false}; }
function actaCheck(A){ const f=poloFix(A.j), t=tie(A.j)||blankTie(), issues=[], used={}, seen={};
  A.rows.forEach((r,i)=>{ r.err=[]; r.warn=[]; const idx=rubIdx(r); if(idx>=0){ if(seen[idx]) r.err.push('Partido repetido en el acta: revisa el número de fila'); seen[idx]=1; }
    if(idx<0){ r.warn.push(r.type==='S'? `Fila ${r.n||'?'} de individuales: la Lliga juega 4 individuales; no se guardará` : `Segunda pareja de dobles: la Lliga juega 1 dobles; no se guardará`); return; }
    const need=r.type==='D'?2:1; r.pids.slice(0,need).forEach((pid,k)=>{ if(!pid) r.err.push(`Elige el jugador del ${US}${r.names[k]? ' («'+r.names[k]+'»)' : ''}`); else { if(r.pconf[k] && (r.pconf[k]<.8||r.pamb[k]) && r.names[k]) r.warn.push(`Comprueba que «${r.names[k]}» es ${pname(pid)}`); if(r.type==='S'){ if(used[pid]) r.err.push(pname(pid)+' aparece en dos individuales'); used[pid]=1; } } });
    if(r.type==='D' && r.pids[0] && r.pids[0]===r.pids[1]) r.err.push('La pareja repite jugador');
    if(!r.score && !r.winner) r.err.push('Falta el marcador');
    const res = !r.score && r.winner? (r.winner==='polo'?'W':'L') : null;
    validateRubber({type:r.type, polo:r.pids.filter(Boolean), score:r.score, res}).filter(e=>!/Falta el jugador|Falta la pareja/.test(e)).forEach(e=>r.err.push(e));
    const c=rubberCalc({score:r.score}); if(r.winner && c.res && (c.res==='W')!==(r.winner==='polo')) r.err.push('El ganador no coincide con el marcador: revisa si el marcador está escrito desde el lado del '+US+'');
    if(r.conf<.75) r.warn.push('Lectura dudosa: compáralo con el acta');
    const ex=t.rubbers[idx]; if(ex && (ex.score||ex.res) && ex.score!==r.score) r.warn.push(`Ya había otro marcador guardado (${ex.score||ex.res}); se sustituirá`); });
  // resultado global: suma de los partidos frente a la «Puntuació» del acta
  let w=0,l=0,dRes=null; A.rows.forEach(r=>{ if(rubIdx(r)<0) return; const c=rubberCalc({score:r.score}); const rr=c.res|| (r.winner? (r.winner==='polo'?'W':'L') : null); if(!rr) return; if(r.type==='S') rr==='W'? w++ : l++; else dRes=rr; });
  if(dRes && ((w===2&&l===2) || !dblDecider())) dRes==='W'? w++ : l++;
  const pp=A.punt||{}; const has=pp.polo!=null && pp.rival!=null;
  if(has && (+pp.polo!==w || +pp.rival!==l)) issues.push({lvl:'err', t:`La «Puntuació» del acta dice ${pp.polo}-${pp.rival}, pero los partidos suman ${w}-${l}. Revisa los marcadores o el ganador de algún partido.`});
  if(A.rival && f){ const m=matchTeam(A.rival); if(m && m!==persp(f).rival) issues.push({lvl:'warn', t:`El acta indica como rival «${A.rival}», pero la jornada ${A.j} es contra ${clubName(persp(f).rival)}. Comprueba que es el acta correcta.`}); }
  if(A.date && f && A.date!==f.date) issues.push({lvl:'warn', t:`La fecha del acta (${A.date}) no coincide con la de la jornada (${f.date}).`});
  if(f?.status==='official' && t.rubbers.some(r=>r.score||r.res)) issues.push({lvl:'auth', t:'Esta jornada tiene un resultado ya confirmado como oficial. Para sustituirlo, marca la casilla de autorización.'});
  A.unclear.forEach(u=>issues.push({lvl:'warn', t:'La IA avisa: '+u}));
  return {w,l,issues, blocking: A.rows.some(r=>r.err.length) || issues.some(i=>i.lvl==='err') || (issues.some(i=>i.lvl==='auth') && !A.override)};
}
function actaPanel(j){
  ensureDocsSub(); const d=actaDocFor(j), f=poloFix(j);
  if(d && !(ui.docUrls||{})[d.id] && !(ui.docUrlLoading||{})[d.id]){ (ui.docUrlLoading ||= {})[d.id]=1; docBlob(d.id).then(b=>{ (ui.docUrls ||= {})[d.id]=URL.createObjectURL(b); renderQuiet(); }).catch(()=>{}); }
  const steps=[['subido','Acta subida'],['procesando','Leyendo el acta'],['revision','Pendiente de revisión'],['completado','Resultados confirmados']];
  const cur=d? (d.status==='error'?'subido':d.status) : null, ci=steps.findIndex(s=>s[0]===cur);
  const stepper=`<ol class="actasteps">${steps.map(([k,l],i)=>`<li class="${i<ci?'done':i===ci?'cur':''}"><span>${i<ci?'✓':i+1}</span>${l}</li>`).join('')}${d?.status==='completado' && f?.status!=='official'? '<li class="cur"><span>!</span>Pendiente de validación</li>' : ''}</ol>`;
  const pick=`<label class="btn brass big actapick"><input type="file" accept="image/*,application/pdf" data-acta-file="${j}" hidden>📷 ${d?'Subir otra acta':'Hacer foto o elegir el acta'}</label>`;
  if(!d) return `<section class="sec"><div class="panel actapanel"><b>Subir el acta oficial de la jornada ${j}</b><p class="muted small" style="margin:4px 0 12px">Haz una foto del acta firmada o sube el PDF. La app lee los nombres del ${US}, los marcadores y quién gana cada partido. No se guarda nada hasta que lo revises y lo confirmes.</p>${pick}<div id="doc-prog"></div></div></section>`;
  const prev=`<div class="actaprev">${ui.docUrls?.[d.id]? (/image/.test(d.mime)? `<a href="${ui.docUrls[d.id]}" target="_blank" rel="noopener"><img src="${ui.docUrls[d.id]}" alt="Acta de la jornada ${j}"></a>` : `<a class="btn ghost" href="${ui.docUrls[d.id]}" target="_blank" rel="noopener">Abrir el acta (PDF)</a>`) : `<button class="btn ghost sm" data-act="acta-preview" data-id="${esc(d.id)}">Ver el acta</button>`}
    <div class="row" style="margin-top:6px"><button class="btn ghost sm" data-act="doc-dl" data-id="${esc(d.id)}">Descargar</button><span class="muted small">${esc(d.name)}, subida por ${esc(d.byName||d.by||'')} ${relTime(d.at)}</span></div></div>`;
  let body='';
  if(isReading(d.id,d)) body=scanView(d.id,d);
  else if(d.status==='subido' || d.status==='error') body=`${d.status==='error'? `<div class="vbox err">No se ha podido leer: ${esc(d.error||'')}. Puedes reintentar o introducir los resultados a mano.</div>` : ''}<button class="btn brass big" data-act="acta-read" data-id="${esc(d.id)}">Leer el acta con IA</button>`;
  else if(isReading(d.id,d)) body=scanView(d.id,d);
  else if(d.status==='procesando') body=`<button class="btn brass big" data-act="acta-read" data-id="${esc(d.id)}">Volver a leer</button>`;
  else if(d.status==='revision') body=actaReview(j,d);
  else if(d.status==='completado') body=`<div class="final"><b>✓ Resultados confirmados</b><span>Validado por ${esc(d.validatedBy||'')} ${d.validatedAt? relTime(d.validatedAt) : ''}. Ya están en la jornada, las estadísticas y la clasificación.${f?.status!=='official'? ' Queda pendiente de validación oficial.' : ''}</span></div>`;
  return `<section class="sec"><div class="panel actapanel"><b>Acta oficial, jornada ${j}</b>${stepper}${prev}<div style="margin-top:12px">${body}</div>${isReading(d.id,d)? '' : `<div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap">${d.status==='revision'? pick.replace('btn brass big','btn ghost') : pick}<button class="btn ghost sm" data-act="acta-unlink" data-id="${esc(d.id)}" data-j="${j}">No es el acta de esta jornada</button></div>`}<div id="doc-prog"></div></div></section>`;
}
function actaReview(j,d){
  if(!ui.acta || ui.acta.id!==d.id) ui.acta=actaDraft(j,d);
  const A=ui.acta, chk=actaCheck(A), conv=new Set((tie(j)||{}).convocados||[]);
  const order=[...S.players.filter(x=>conv.has(x.id)), ...S.players.filter(x=>!conv.has(x.id)&&x.active!==false)].map(x=>x.id);
  const popts=sel=>`<option value="">Elegir jugador</option>`+order.map(id=>`<option value="${esc(id)}" ${sel===id?'selected':''}>${esc(pname(id))}</option>`).join('');
  const confChip=c=>`<span class="conf ${c>=.85?'hi':c>=.65?'mid':'lo'}">${c>=.85?'Alta':c>=.65?'Media':'Baja'}</span>`;
  const rows=A.rows.map((r,i)=>{ const idx=rubIdx(r), need=r.type==='D'?2:1;
    return `<div class="actarow ${r.err.length?'bad':r.warn.length?'warn':''} ${idx<0?'extra':''}">
      <div class="ar-h"><b>${r.type==='S'? 'Individual '+(r.n||'?') : 'Dobles '+(r.n||'?')}</b>${confChip(r.conf)}</div>
      <div class="ar-g">${Array.from({length:need},(_,k)=>`<label><span>Jugador del ${US}${need>1?' '+(k+1):''}${r.names[k]? ` <i>«${esc(r.names[k])}»</i>` : ''}</span><select data-acta-row="${i}" data-k="pid${k}" ${idx<0?'disabled':''}>${popts(r.pids[k])}</select></label>`).join('')}
        <label><span>Rival</span><input type="text" value="${esc(r.rival)}" disabled></label>
        <label><span>Marcador (${US} primero)${r.written? ` <i>escrito: «${esc(r.written)}»</i>` : ''}</span><input type="text" inputmode="numeric" data-acta-row="${i}" data-k="score" value="${esc(r.score)}" placeholder="6-4 6-3" ${idx<0?'disabled':''}></label>
        <label><span>Ganador</span><select data-acta-row="${i}" data-k="winner" ${idx<0?'disabled':''}><option value="">–</option><option value="polo" ${r.winner==='polo'?'selected':''}>${US}</option><option value="rival" ${r.winner==='rival'?'selected':''}>Rival</option></select></label></div>
      ${r.note? `<p class="small" style="margin:4px 0 0">Anotación: <b>${esc(r.note)}</b></p>` : ''}
      ${r.err.map(e=>`<p class="rerr">${esc(e)}</p>`).join('')}${r.warn.map(e=>`<p class="rwarn">${esc(e)}</p>`).join('')}</div>`; }).join('');
  const pp=A.punt||{};
  return `<div class="actarev ${justRead(d.id)?'fadein':''}">${justRead(d.id)? '<p class="readok">✓ Lectura completada</p>' : ''}<p class="muted small" style="margin:0 0 10px">Revisa cada partido con el acta delante. Puedes cambiar cualquier dato. El marcador se guarda desde el lado del ${US} (si ganó el rival, sus juegos van segundos).</p>
    ${rows || '<div class="empty">La IA no ha encontrado partidos en el acta. Prueba con una foto más nítida o introduce los resultados a mano.</div>'}
    <div class="actatot ${chk.issues.some(x=>x.lvl==='err')?'bad':''}"><div><span class="muted small">Suma de los partidos</span><b>${US} ${chk.w}-${chk.l}</b></div><div><span class="muted small">Puntuació del acta</span><b>${pp.polo!=null&&pp.rival!=null? `${US} ${pp.polo}-${pp.rival}` : 'No se lee'}</b></div><div>${pp.polo!=null&&pp.rival!=null? (+pp.polo===chk.w && +pp.rival===chk.l? '<span class="ccb win">Coincide</span>' : '<span class="ccb loss">No coincide</span>') : '<span class="ccb confirm">Sin comprobar</span>'}</div></div>
    ${chk.issues.map(x=>`<div class="vbox ${x.lvl==='err'?'err':'warn'}">${esc(x.t)}${x.lvl==='auth'? `<label class="row" style="margin-top:6px;gap:8px"><input type="checkbox" data-act="acta-override" ${A.override?'checked':''}> Autorizo sustituir el resultado oficial</label>` : ''}</div>`).join('')}
    <div class="revbar"><button class="btn brass" data-act="acta-confirm" data-j="${j}" ${chk.blocking?'disabled':''}>Confirmar resultados</button><button class="btn ghost" data-act="acta-manual" data-j="${j}">Corregir manualmente</button><button class="btn ghost sm" data-act="acta-read" data-id="${esc(d.id)}">Volver a leer</button></div>
    ${chk.blocking? '<p class="muted small" style="margin:6px 0 0">Corrige lo marcado en rojo para poder confirmar.</p>' : ''}</div>`;
}
function actaToTie(j){ const A=ui.acta, t=ensureTie(j); A.rows.forEach(r=>{ const idx=rubIdx(r); if(idx<0) return; const rb=t.rubbers[idx];
  rb.polo=r.pids.slice(0,r.type==='D'?2:1).filter(Boolean); rb.score=r.score.trim(); rb.res= !rb.score && r.winner? (r.winner==='polo'?'W':'L') : null; rb.note=r.note||rb.note||''; rb.riv=String(r.rival||rb.riv||'').trim().slice(0,60); }); return t; }
async function actaConfirm(j){ const A=ui.acta; if(!A) return; const chk=actaCheck(A); if(chk.blocking) return toast('Corrige lo marcado antes de confirmar');
  const d=docs[A.id]; const t=actaToTie(j); const v=validateTie(t); if(v.errors.length){ toast(v.errors[0]); renderQuiet(); return; }
  t.actaId=A.id; finishTieSave(j, A.punt?.polo??'', A.punt?.rival??'');
  await safe(()=>B.update(`${SEASON_PATH}/docs/${A.id}`,{status:'completado', kind:'acta', validatedBy:(me&&player(me)?.name)||authUser?.email||'', validatedAt:Date.now(), applied:`Resultados de la jornada ${j}`}), 'Resultados confirmados desde el acta');
  ui.acta=null; renderQuiet(); }

// Guarda el marcador de la eliminatoria a partir de los partidos (lo usan el formulario manual y el acta)
function finishTieSave(j, psIn, rsIn){ const t=ensureTie(j);
    const f=poloFix(j), calc=tieFromRubbers(j), home=f.home===POLO; let ps=psIn===null||psIn===undefined? '' : String(psIn), rs=rsIn===null||rsIn===undefined? '' : String(rsIn), src='manual';
    if(calc.complete){ ps=calc.w; rs=calc.l; src='rubbers'; }
    else if(ps!==''&&rs!=='' && calc.decided && (+ps!==calc.w || +rs!==calc.l) && calc.decided>=(+ps)+(+rs)) toast('El marcador por equipos no coincide con los partidos introducidos');
    const val=validateTie(t);
    const prevScore=[f.hs,f.as].join('-');
    if(ps!==''&&rs!==''){ f.hs=home?+ps:+rs; f.as=home?+rs:+ps; f.src=src; } else { f.hs=null; f.as=null; f.src=null; }
    if([f.hs,f.as].join('-')!==prevScore || !f.status) f.status = f.hs==null? null : 'provisional';
    val.warnings.forEach(w=>toast(w));
    const wasPlayed=!!t._played; t._played=isPlayed(f);
    saveState(isPlayed(f)? 'Resultados guardados: estadísticas actualizadas' : 'Jornada '+j+' guardada');
    if(isPlayed(f) && !wasPlayed){ if(!S.mvp[jid(j)]){ S.mvp[jid(j)]={open:true,openedAt:Date.now(),deadline:Date.now()+(+S.rules.mvpHours||48)*3600e3}; saveState('Votación del MVP abierta'); setTimeout(()=>notify('mvp',j),1400); }
      setTimeout(()=>notify('survey',j),400); ui.compose={kind:'survey',j,text:composeText('survey',j)}; renderQuiet(); } }
/* ---------- Escáner láser mientras la IA lee un documento (sincronizado con el estado real) ---------- */
// Fases reales: 'prep' = preparando el documento en el dispositivo; 'ai' = esperando la respuesta de la IA
const isReading = (id,d) => !!(ui.readStage||{})[id] || (d?.status==='procesando' && Date.now()-(d.procAt||0)<120000);
function ensureThumb(id){ const d=docs[id]; if(!d) return; ui.thumbs ||= {}; ui.thumbLoading ||= {}; if(ui.thumbs[id] || ui.thumbLoading[id]) return; ui.thumbLoading[id]=1;
  (async()=>{ try{ const blob=await docBlob(id);
      if(/image/.test(d.mime||'')) ui.thumbs[id]=URL.createObjectURL(blob);
      else if(/pdf/.test(d.mime||'') || /\.pdf$/i.test(d.name)){ await loadScript(LIBS.pdf); pdfjsLib.GlobalWorkerOptions.workerSrc=LIBS.pdfw;
        const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise, pg=await pdf.getPage(1), v1=pg.getViewport({scale:1}), vp=pg.getViewport({scale:Math.min(2,900/v1.width)});
        const c=document.createElement('canvas'); c.width=vp.width; c.height=vp.height; await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise; ui.thumbs[id]=c.toDataURL('image/jpeg',.82); }
      else ui.thumbs[id]='sheet';
    }catch(e){ ui.thumbs[id]='sheet'; } renderQuiet(); })(); }
function scanView(id,d){ ensureThumb(id); const th=(ui.thumbs||{})[id], st=(ui.readStage||{})[id];
  const label = st==='prep'? 'Preparando el documento…' : 'IA analizando documento…';
  const steps = st? `<div class="scan-steps"><span class="${st==='prep'?'cur':'done'}">${st==='prep'?'':'✓ '}Documento preparado</span><span class="${st==='ai'?'cur':''}">Lectura con IA</span></div>`
                  : `<p class="muted small" style="margin:2px 0 0">La lectura se inició en otro dispositivo. Esta pantalla se actualiza sola al terminar.</p>`;
  return `<div class="scanbox" role="status" aria-live="polite">
    <div class="scan-doc ${th? 'ready' : ''}">${th && th!=='sheet'? `<img src="${th}" alt="Documento en lectura">` : `<div class="scan-sheet" aria-hidden="true"><b></b>${'<i></i>'.repeat(16)}</div>`}
      <div class="scan-dim"></div><div class="scan-track" aria-hidden="true"><div class="scan-line"></div></div></div>
    <div class="scan-meta"><span class="scan-dot" aria-hidden="true"></span><b>${label}</b></div>${steps}</div>`; }
const justRead = id => (ui.readDone||{})[id] && Date.now()-ui.readDone[id]<2500;

/* ---------- emparejar nombres del documento con la app ---------- */
const STOP=new Set(['club','de','del','la','el','tenis','tennis','rc','rst','ct','ce','rct','real','sant','sport','esportiu','s','i','y','a','b']);
function matchTeam(name){ const n=normTxt(name); if(/\bpolo\b/.test(n)) return POLO; const toks=n.split(' ').filter(t=>t&&!STOP.has(t)); let best=null,bs=0;
  S.teams.forEach(t=>{ const tt=new Set(normTxt(t.name+' '+t.short).split(' ').filter(x=>x&&!STOP.has(x))); const sc=toks.filter(x=>tt.has(x)).length; if(sc>bs){ bs=sc; best=t.id; } }); return bs? best : null; }
function matchPlayer(name){ const toks=normTxt(name).split(' ').filter(Boolean); let best=null,bs=0;
  S.players.forEach(p=>{ const pt=new Set(normTxt((p.full||'')+' '+p.name).split(' ')); const sc=toks.filter(x=>pt.has(x)).length; if(sc>bs){ bs=sc; best=p.id; } }); return bs>=2 || (bs===1&&toks.length===1)? best : null; }
// «VILLASECA FONT, JOAN» → «Joan Villaseca Font»; respeta partículas (de, del, i, y)
const titleCase = s => String(s||'').toLowerCase().split(/\s+/).filter(Boolean).map((w,i)=> i && /^(de|del|la|las|los|i|y|d'|van|von)$/.test(w)? w : w.replace(/(^|[-'])(\p{L})/gu,(m,a,b)=>a+b.toUpperCase())).join(' ');
const personName = raw => { const t=String(raw||'').trim(); if(t.includes(',')){ const [sur,given]=t.split(',').map(x=>x.trim()); return titleCase(given+' '+sur); } return /[a-z]/.test(t)? t : titleCase(t); };
const shortName = full => { const t=personName(full).split(/\s+/); return t.length>=2? t[0]+' '+t[1] : t[0]||''; };
const confBadge = c => c==null? '' : `<span class="conf ${c>=.85?'hi':c>=.6?'mid':'lo'}">${c>=.85?'Alta':c>=.6?'Media':'Baja'}</span>`;
// Qué jornada es una clasificación y si cuadra con lo que hay en la app
function inferClassJ(rv){ const rows=(rv.rows||[]).filter(r=>r.t&&r.points!=null&&isFinite(+r.points)); if(rows.length<3) return null;
  for(const j of [...playedJornadas()].reverse()){ const comp=standings(j,true); if(rows.every(r=>comp.find(c=>c.id===r.t)?.pts===+r.points)) return j; } return null; }
function classCheck(rv){ const out={block:[],warn:[]}, today=ymd(new Date()), rows=rv.rows||[], matched=rows.filter(r=>r.t), j=+rv.j||0, lastJ=Math.max(0,...playedJornadas());
  if(!j){ const sug=Math.max(0,...S.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&f.date<=today).map(f=>f.j)); out.block.push('Indica tras qué jornada es esta clasificación'+(sug? ` (la última disputada según el calendario es la jornada ${sug})` : '')); }
  if(rows.some(r=>!r.t)) out.block.push('Hay clubes sin emparejar: elige cuál es cada uno');
  const ts=matched.map(r=>r.t); if(ts.length!==new Set(ts).size) out.block.push('Hay clubes repetidos');
  if(matched.length && S.teams.length && matched.length!==S.teams.length) out.warn.push(`El documento trae ${matched.length} equipos y la competición tiene ${S.teams.length}: revisa que no falte ninguno.`);
  if(j){
    if(lastJ<j) out.warn.push(`En la app solo hay resultados hasta la jornada ${lastJ||'ninguna'}, y esta clasificación es de la jornada ${j}. Se aplicará igualmente; los partidos jugados se completarán al registrar los resultados que faltan.`);
    if(lastJ>j) out.warn.push(`La app ya tiene resultados de la jornada ${lastJ}, más recientes que esta clasificación (jornada ${j}). La tabla seguirá calculándose con tus resultados hasta que subas una clasificación de la jornada ${lastJ} o posterior.`);
    const comp=standings(j,true), diffs=matched.filter(r=>r.points!=null&&isFinite(+r.points)&&comp.find(c=>c.id===r.t)&&comp.find(c=>c.id===r.t).pts!==+r.points).map(r=>`${clubName(r.t)}: el documento dice ${r.points} y la app calcula ${comp.find(c=>c.id===r.t).pts}`);
    if(diffs.length) out.warn.push(`Los puntos no coinciden con los resultados registrados en la app (${diffs.slice(0,4).join('; ')}${diffs.length>4?'; …':''}). Prevalece el documento oficial; revisa si falta algún resultado.`); }
  const miss=S.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&f.date<today&&!isPlayed(f)&&(!j||f.j<=j));
  if(miss.length) out.warn.push('Sin resultado en la app: '+miss.map(f=>`jornada ${f.j} contra ${clubName(persp(f).rival)} (${shortD(f.date)})`).join(', ')+'. Introdúcelo en Gestión, Jornada, Resultados.');
  return out; }
function initReview(id){ const d=docs[id], x=clone(d.extraction?.data||{}); const rv={id,kind:d.extraction?.kind||d.kind,x,j:x.jornada||x.after_jornada||d.j||null,force:false};
  if(d.kind==='plantilla') rv.rows=(x.players||[]).map(p=>{ const m=matchPlayer(p.name); return {...p, act: m? 'link':'new', pid:m}; });
  if(d.kind==='calendario') rv.rows=(x.fixtures||[]).map(f=>({...f, h:matchTeam(f.home), a:matchTeam(f.away), use: f.jornada!=null && !!f.date}));
  if(d.kind==='orden'){ rv.rows=[...(x.singles||[]).map(s=>({type:'S',n:s.order,names:[s.player],pids:[matchPlayer(s.player)],confidence:s.confidence})), ...(x.doubles||[]).slice(0,1).map(s=>({type:'D',n:5,names:s.players||[],pids:(s.players||[]).map(matchPlayer),confidence:s.confidence}))]; }
  if(d.kind==='acta'||d.kind==='resultados'){ let si=0; rv.rows=(x.matches||[]).map(m=>{ const isD=m.type==='D'; const n=isD?5:(m.order||++si); return {type:isD?'D':'S',n,names:m.polo_players||[],pids:(m.polo_players||[]).map(matchPlayer),score:m.score||'',winner:m.winner,confidence:m.confidence}; }); }
  if(d.kind==='clasificacion'){ rv.rows=(x.rows||[]).map(r=>({...r, t:matchTeam(r.team)})); if(!rv.j){ const inf=inferClassJ(rv); if(inf){ rv.j=inf; rv.jInferred=`Jornada ${inf}: los puntos coinciden con los resultados de la app.`; } } }
  ui.rev=rv; }
function vDoc(id){
  ensureDocsSub(); const d=docs[id]; if(!d) return `<div class="wrap"><div class="pagehead"><a class="textlink" href="#${ui.docBack||'docs'}">← ${ui.docBack==='club-docs'?'Documentación':'Documentos'}</a><h1>Documento</h1></div><div class="empty">Cargando…</div></div>`;
  const head=`<div class="wrap"><div class="pagehead"><a class="textlink" href="#${ui.docBack||'docs'}">← ${ui.docBack==='club-docs'?'Documentación':'Documentos'}</a><h1 style="margin-top:10px">${esc(d.name)}</h1><p class="lede">${d.j?'Jornada '+d.j+'. ':''}Estado: <b>${DOC_ST[d.status]||d.status}</b>.${d.validatedBy? ' Validado por '+esc(d.validatedBy)+' '+relTime(d.validatedAt)+'.' : ''}</p>
    <div class="row" style="margin-top:10px;gap:12px"><label class="small">Tipo de documento <select data-act="doc-kind" data-id="${esc(id)}" style="width:auto">${Object.entries(DOC_KINDS).map(([k,l])=>`<option value="${k}" ${d.kind===k?'selected':''}>${l}</option>`).join('')}</select></label>
      <span class="ccb confirm">Se aplicará a: ${esc(curTeam().name)}, temporada ${esc(viewSeason)}</span></div>
    ${(d.kindLog||[]).length? `<p class="muted small" style="margin:6px 0 0">Tipo cambiado de «${esc(DOC_KINDS[d.kindLog.at(-1).from]||d.kindLog.at(-1).from)}» a «${esc(DOC_KINDS[d.kindLog.at(-1).to]||d.kindLog.at(-1).to)}» por ${esc(d.kindLog.at(-1).by)}, ${relTime(d.kindLog.at(-1).at)}.</p>` : ''}
    ${d.extraction?.kind && d.extraction.kind!==d.kind? `<div class="vbox warn" style="margin-top:10px">Este documento se leyó como «${esc(DOC_KINDS[d.extraction.kind])}». La revisión de abajo es de esa lectura. Si quieres los datos como «${esc(DOC_KINDS[d.kind])}», pulsa «Volver a leer».</div>` : ''}</div>`;
  if(isReading(id,d)) return head+`<section class="sec">${scanView(id,d)}</section></div>`;
  const preview=`<div class="docprev" id="docprev"><button class="btn ghost sm" data-act="doc-preview" data-id="${esc(id)}">Ver el documento original</button></div>`;
  if(!d.extraction){ return head+`<section class="sec"><div class="panel"><b>Lectura automática</b><p class="muted small" style="margin:4px 0 12px">La IA leerá el documento y propondrá los datos. No se guarda nada hasta que lo revises y lo valides. ${d.status==='error'? '<br><b style="color:var(--loss)">Último intento: '+esc(d.error||'error')+'</b>' : ''}</p>
      ${(()=>{ const busy=d.status==='procesando' && Date.now()-(d.procAt||0)<120000; return `<button class="btn brass" data-act="doc-read" data-id="${esc(id)}" ${busy?'disabled':''}>${busy?'Leyendo…':d.status==='procesando'?'Volver a leer':'Leer con IA'}</button>`; })()}</div></section><section class="sec">${preview}</section></div>`; }
  if(!ui.rev || ui.rev.id!==id) initReview(id); const rv=ui.rev, x=rv.x, unclear=(x.unclear||[]).filter(Boolean);
  const pOpts=sel=>`<option value="">Sin asignar</option>`+S.players.map(p=>`<option value="${esc(p.id)}" ${sel===p.id?'selected':''}>${esc(p.name)}</option>`).join('');
  const tOpts=sel=>`<option value="">Club nuevo</option>`+S.teams.map(t=>`<option value="${esc(t.id)}" ${sel===t.id?'selected':''}>${esc(t.name)}</option>`).join('');
  let body='', warn=[];
  if(rv.kind==='plantilla') body=`<table><thead><tr><th class="l">En el documento</th><th>Conf.</th><th class="l">En la app</th><th>Cat.</th><th>Pts</th></tr></thead><tbody>${rv.rows.map((r,i)=>`<tr><td class="l">${esc(r.name||'?')}</td><td>${confBadge(r.confidence)}</td><td class="l"><select data-rev="act" data-i="${i}" style="width:auto"><option value="new" ${r.act==='new'?'selected':''}>Jugador nuevo: ${esc(shortName(r.name))}</option><option value="link" ${r.act==='link'?'selected':''}>Es un jugador existente</option><option value="skip" ${r.act==='skip'?'selected':''}>Ignorar</option></select>${r.act==='link'?`<select data-rev="pid" data-i="${i}" style="width:auto">${pOpts(r.pid)}</select>`:''}${r.act==='new'&&matchPlayer(r.name)?'<small class="dup"> posible duplicado</small>':''}</td><td>${esc(r.category||'–')}</td><td>${r.points??'–'}</td></tr>`).join('')}</tbody></table>`;
  if(rv.kind==='calendario'){ body=`<table><thead><tr><th></th><th>J</th><th>Fecha</th><th class="l">Local</th><th class="l">Visitante</th><th>Marcador</th><th>Conf.</th><th class="l">En la app</th></tr></thead><tbody>${rv.rows.map((r,i)=>{ const ex=S.fixtures.find(f=>f.j===+r.jornada && ((f.home===r.h&&f.away===r.a))); const st=!ex? 'Nuevo' : (ex.date!==r.date||ex.time!==(r.time||ex.time))? 'Cambia fecha u hora' : (r.home_score!=null && isPlayed(ex) && (ex.hs!==r.home_score||ex.as!==r.away_score))? 'Marcador distinto' : 'Igual';
      if(st==='Marcador distinto') warn.push(`J${r.jornada}: el marcador del documento no coincide con el de la app`);
      return `<tr><td><input type="checkbox" data-rev="use" data-i="${i}" ${r.use?'checked':''}></td><td>${r.jornada??'?'}</td><td>${esc(r.date||'?')} ${esc(r.time||'')}</td><td class="l">${esc(r.home)}<br><select data-rev="h" data-i="${i}" style="width:auto">${tOpts(r.h)}</select></td><td class="l">${esc(r.away)}<br><select data-rev="a" data-i="${i}" style="width:auto">${tOpts(r.a)}</select></td><td>${r.home_score!=null? r.home_score+'-'+r.away_score : '–'}</td><td>${confBadge(r.confidence)}</td><td class="l small">${st}</td></tr>`; }).join('')}</tbody></table>`;
    if(!rv.rows.some(r=>r.h===POLO||r.a===POLO)) warn.push('No se ha encontrado al '+US+' en ningún enfrentamiento: revisa los clubes'); }
  if(rv.kind==='orden'||rv.kind==='acta'||rv.kind==='resultados'){ const fx=rv.j? poloFix(+rv.j) : null; if(!fx) warn.push('Elige la jornada a la que corresponde');
    if(fx && isPlayed(fx) && fx.status==='official' && rv.kind!=='orden') warn.push('Esta jornada tiene un resultado confirmado como oficial: solo se sobrescribirá si lo marcas abajo');
    const t=fx? tie(fx.j) : null;
    body=`<div class="row" style="margin-bottom:10px"><label class="small">Jornada <select data-rev="j" style="width:auto"><option value="">Elegir</option>${S.fixtures.filter(f=>f.home===POLO||f.away===POLO).map(f=>`<option value="${f.j}" ${+rv.j===f.j?'selected':''}>Jornada ${f.j}, contra ${esc(clubName(persp(f).rival))}</option>`).join('')}</select></label></div>
      <table><thead><tr><th class="l">Partido</th><th class="l">En el documento</th><th class="l">Jugadores en la app</th>${rv.kind!=='orden'?'<th>Marcador ('+US+' primero)</th>':''}<th>Conf.</th></tr></thead><tbody>${rv.rows.map((r,i)=>{ const cur=t? t.rubbers.find(x=>x.n===r.n) : null; const e=rv.kind!=='orden'? validateRubber({type:r.type,polo:r.pids.filter(Boolean),score:r.score,res:null}) : [];
        if(cur && rv.kind!=='orden' && cur.score && cur.score!==r.score) warn.push(`${r.type==='D'?'Dobles':'Individual '+r.n}: en la app ya hay «${cur.score}»`);
        return `<tr><td class="l">${r.type==='D'?'Dobles':'Individual '+r.n}</td><td class="l">${esc((r.names||[]).join(' y ')||'?')}</td><td class="l">${(r.type==='D'?[0,1]:[0]).map(k=>`<select data-rev="rp" data-i="${i}" data-k="${k}" style="width:auto">${pOpts(r.pids[k])}</select>`).join(' ')}</td>${rv.kind!=='orden'?`<td><input type="text" data-rev="score" data-i="${i}" value="${esc(r.score||'')}" style="width:120px">${e.length&&r.score?`<small class="dup">${esc(e[0])}</small>`:''}</td>`:''}<td>${confBadge(r.confidence)}</td></tr>`; }).join('')}</tbody></table>
      ${rv.kind!=='orden'&&fx&&fx.status==='official'? `<label class="small" style="display:block;margin-top:10px"><input type="checkbox" data-rev="force" ${rv.force?'checked':''}> Sí, quiero sustituir el resultado oficial de esta jornada</label>`:''}`; }
  if(rv.kind==='clasificacion'){ body=`<div class="row" style="margin-bottom:10px"><label class="small">Tras la jornada <select data-rev="j" style="width:auto"><option value="">Elegir</option>${Array.from({length:NJ()},(_,i)=>i+1).map(jj=>`<option value="${jj}" ${+rv.j===jj?'selected':''}>Jornada ${jj}${poloFix(jj)? ', '+shortD(poloFix(jj).date) : ''}</option>`).join('')}</select></label>${rv.jInferred? `<span class="muted small">${esc(rv.jInferred)}</span>` : ''}</div><table><thead><tr><th>Pos.</th><th class="l">En el documento</th><th class="l">Club en la app</th><th>Pts</th><th>Conf.</th></tr></thead><tbody>${rv.rows.map((r,i)=>`<tr><td>${r.pos}</td><td class="l">${esc(r.team)}</td><td class="l"><select data-rev="t" data-i="${i}" style="width:auto">${tOpts(r.t)}</select></td><td>${r.points??'–'}</td><td>${confBadge(r.confidence)}</td></tr>`).join('')}</tbody></table>`;
    { const cc=classCheck(rv); warn.push(...cc.block, ...cc.warn); } }
  const done=d.status==='completado';
  return head+`<div class="docrev ${justRead(id)?'fadein':''}">${justRead(id)? '<p class="readok" style="margin:12px 0 0">✓ Lectura completada</p>' : ''}<section class="sec"><div class="sec-h"><h2>Datos leídos</h2><span class="muted small">${esc(d.extraction.provider||'')} ${esc(d.extraction.model||'')}${d.extraction.usage?.total_tokens? ', '+d.extraction.usage.total_tokens+' tokens':''}</span></div>
      <p class="muted small" style="margin-top:-6px">La IA propone; tú decides. Revisa cada fila, corrige lo que haga falta y valida. Nada cambia en la app hasta que pulses «Validar y aplicar».</p>
      ${unclear.length? `<div class="vbox warn"><b>No se ha podido leer con seguridad</b><ul>${unclear.map(u=>`<li>${esc(u)}</li>`).join('')}</ul></div>`:''}
      ${warn.length? `<div class="vbox err"><b>Discrepancias o avisos</b><ul>${[...new Set(warn)].map(u=>`<li>${esc(u)}</li>`).join('')}</ul></div>`:''}
      <div class="tscroll">${body||'<div class="empty">La lectura no ha devuelto datos.</div>'}</div>
      ${done? `<div class="final" style="margin-top:16px"><b>✓ Aplicado${d.applied? ': '+esc(d.applied) : ''}</b><span>Ya está en la app: ${({calendario:'calendario, páginas de cada jornada, Matchday y clasificación',plantilla:'plantilla, perfiles y estadísticas',orden:'convocatoria y orden de juego de la jornada',acta:'resultados, estadísticas, clasificación y MVP',resultados:'resultados, estadísticas, clasificación y MVP',clasificacion:'clasificación oficial'})[d.kind]||'la app'}.</span>
        <div class="row" style="margin-top:8px">${d.kind==='calendario'?'<a class="btn sm brass" href="#calendario">Ver el calendario</a><a class="btn sm ghost" href="#admin">Ir a Matchday</a>':d.kind==='plantilla'?'<a class="btn sm brass" href="#equipo">Ver la plantilla</a>':d.kind==='clasificacion'?'<a class="btn sm brass" href="#clasificacion">Ver la clasificación</a>':rv.j?`<a class="btn sm brass" href="#jornada-${+rv.j}">Ver la jornada ${+rv.j}</a><a class="btn sm ghost" href="#admin">Ir a Matchday</a>`:''}</div></div>` : ''}
      <div class="revbar">${(done && rv.kind!=='clasificacion')? '' : `<button class="btn brass" data-act="doc-apply" data-id="${esc(id)}" ${rv.kind==='clasificacion'&&classCheck(rv).block.length?'disabled':''}>${({calendario:'Validar y añadir al calendario',plantilla:'Validar y actualizar la plantilla',orden:'Validar y poner la convocatoria',acta:'Validar y guardar los resultados',resultados:'Validar y guardar los resultados',clasificacion:'Validar y guardar la clasificación'})[rv.kind]||'Validar y aplicar'}</button>`}<button class="btn ghost sm" data-act="doc-read" data-id="${esc(id)}">Volver a leer</button>${!done?`<button class="btn ghost sm" data-act="doc-discard" data-id="${esc(id)}">Descartar lectura</button>`:''}</div></section>
    <section class="sec">${preview}</section></div></div>`;
}
async function docPreview(id){ const box=$('#docprev'); if(!box) return; box.innerHTML='<p class="muted small">Cargando…</p>';
  try{ const b=await docBlob(id), url=URL.createObjectURL(b), d=docs[id];
    box.innerHTML= /image/.test(d.mime)? `<img src="${url}" alt="" style="max-width:100%;border-radius:12px">` : /pdf/.test(d.mime)? `<iframe src="${url}" title="Documento original" style="width:100%;height:70vh;border:1px solid var(--line);border-radius:12px"></iframe>` : `<p class="small">Este formato no se puede ver aquí. <button class="textlink" data-act="doc-dl" data-id="${esc(id)}">Descárgalo</button>.</p>`;
  }catch(e){ box.innerHTML='<p class="muted small">No se ha podido cargar el original.</p>'; } }
function applyReview(){
  const rv=ui.rev, d=docs[rv.id]; if(!rv||!d) return; const kind=rv.kind; let summary='';
  if(kind==='plantilla'){ let nNew=0,nUpd=0; rv.rows.forEach(r=>{ if(r.act==='skip') return;
      if(r.act==='link'&&r.pid){ const p=player(r.pid); if(p){ if(r.category) p.cat=r.category; if(r.points!=null) p.pts=r.points; if(r.order!=null) p.order=r.order; nUpd++; } }
      else if(r.act==='new'&&r.name){ const nm=shortName(r.name); let id=slug(nm); if(player(id)){ const ex=player(id); if(normTxt(ex.full)===normTxt(personName(r.name))) return; id+='-2'; }
        S.players.push({id,name:nm,full:personName(r.name),cat:r.category||'',pts:r.points??0,order:r.order??(Math.max(0,...S.players.map(p=>p.order||0))+1),captain:false,active:true}); nNew++; } });
    if(rv.x.captain){ const c=matchPlayer(rv.x.captain); if(c && !(S.captains||[]).length && isAdmin) S.captains=[c]; }
    summary=`${nNew} jugadores nuevos, ${nUpd} actualizados`; }
  if(kind==='calendario'){ let nNew=0,nUpd=0; const made={}; const mk=(raw)=>{ const key=normTxt(raw); if(made[key]) return made[key]; const hit=matchTeam(raw); if(hit){ made[key]=hit; return hit; } let id=slug(raw); while(S.teams.find(t=>t.id===id)) id+='-2'; S.teams.push({id,name:raw,short:raw.replace(/,.*$/,'').trim()||raw,abbr:normTxt(raw).split(' ').filter(t=>!STOP.has(t)).map(w=>w[0]).join('').slice(0,4).toUpperCase()||'?'}); made[key]=id; return id; };
    rv.rows.filter(r=>r.use&&r.jornada).forEach(r=>{ const h=r.h||mk(r.home), a=r.a||mk(r.away); r.h=h; r.a=a;
      let f=S.fixtures.find(x=>x.j===+r.jornada&&x.home===h&&x.away===a);
      if(!f){ if(!r.date) return; f={j:+r.jornada,date:r.date,time:r.time||'15:00',home:h,away:a,hs:null,as:null}; S.fixtures.push(f); nNew++; }
      else { if(r.date) f.date=r.date; if(r.time) f.time=r.time; nUpd++; }
      if(r.home_score!=null && r.away_score!=null && (r.home_score+r.away_score)>0 && (!isPlayed(f) || f.status!=='official' || rv.force)){ f.hs=+r.home_score; f.as=+r.away_score; f.status='official'; } });
    if(rv.x.group && (!S.comp.group || S.comp.group===curTeam()?.cat || S.comp.group===teamCat(curTeam()))) S.comp.group=rv.x.group; if(rv.x.competition && (!S.comp.name||S.comp.name==='Lliga Catalana per Equips')) S.comp.name=rv.x.competition;
    S.fixtures.sort((a,b)=>a.j-b.j); summary=`${nNew} enfrentamientos nuevos, ${nUpd} actualizados`; }
  if(kind==='orden'||kind==='acta'||kind==='resultados'){ const j=+rv.j, f=poloFix(j); if(!f) return toast('Elige la jornada');
    if(kind!=='orden' && f.status==='official' && isPlayed(f) && !rv.force) return toast('Marca la casilla para sustituir el resultado oficial');
    const t=ensureTie(j);
    for(const r of rv.rows){ const ru=t.rubbers.find(x=>x.n===r.n); if(!ru) continue; const pids=r.pids.filter(Boolean); if(pids.length) ru.polo=pids;
      if(kind!=='orden' && r.score){ const e=validateRubber({type:ru.type,polo:ru.polo,score:r.score,res:null}); if(e.length) return toast(`${ru.type==='D'?'Dobles':'Individual '+ru.n}: ${e[0]}`); ru.score=r.score; ru.res=null; } }
    const set=new Set([...(t.convocados||[]), ...t.rubbers.flatMap(x=>x.polo||[])]); t.convocados=[...set]; const assigned=new Set(t.rubbers.flatMap(x=>x.polo||[])); t.subs=t.convocados.filter(x=>!assigned.has(x));
    if(kind!=='orden'){ const c=tieFromRubbers(j); if(c.complete){ const home=f.home===POLO; f.hs=home?c.w:c.l; f.as=home?c.l:c.w; f.src='rubbers'; f.status='provisional'; }
      if(!S.mvp[jid(j)] && isPlayed(f)) S.mvp[jid(j)]={open:true,openedAt:Date.now(),deadline:Date.now()+(+S.rules.mvpHours||48)*3600e3}; }
    summary=kind==='orden'? `orden de juego de la jornada ${j}` : `resultados de la jornada ${j}`; }
  if(kind==='clasificacion'){ const cc=classCheck(rv); if(cc.block.length) return toast(cc.block[0]);
    const order=rv.rows.slice().sort((a,b)=>a.pos-b.pos).map(r=>r.t).filter(Boolean), pts={}; rv.rows.forEach(r=>{ if(r.t&&r.points!=null&&isFinite(+r.points)) pts[r.t]=+r.points; });
    S.official={asOf:+rv.j, order, pts, at:Date.now(), by:(me&&player(me)?.name)||authUser?.email||'', doc:rv.id}; summary=`clasificación oficial tras la jornada ${rv.j}`; }
  S.audit=[{at:Date.now(), by:(me&&player(me)?.name)||authUser?.name||authUser?.email||'?', what:['Documento validado: '+d.name+' ('+summary+')']}, ...(S.audit||[])].slice(0,60);
  saveState('Aplicado: '+summary);
  B.update(`${SEASON_PATH}/docs/${rv.id}`,{status:'completado', validatedBy:(me&&player(me)?.name)||authUser?.email||'', validatedAt:Date.now(), applied:summary}).catch(()=>{});
}

/* ---------- Documentación de todos los equipos (gestor del club) ---------- */
let clubDocs={}, clubDocSubs=[], clubDocKey='';
function ensureClubDocs(){ const key=clubTeams().map(t=>t.id).join(',')+'|'+viewSeason; if(key===clubDocKey) return; clubDocKey=key;
  clubDocSubs.forEach(u=>{ try{u()}catch(e){} }); clubDocSubs=[]; clubDocs={};
  clubTeams().forEach(t=>clubDocSubs.push(B.watchColl('seasons/'+docIdFor(t.id,viewSeason)+'/docs', m=>{ clubDocs[t.id]=m; softRender(); }))); }
async function clubDocDownload(tid,id){ const d=clubDocs[tid]?.[id]; if(!d) return; const base='seasons/'+docIdFor(tid,viewSeason)+'/docs/'+id;
  try{ const parts=[]; for(let i=0;i<(d.chunks||1);i++){ const c=await B.getDoc(base+'/chunks/'+i); parts.push(c?.d||''); }
    const bin=atob(parts.join('')), u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
    const url=URL.createObjectURL(new Blob([u8],{type:d.mime||'application/octet-stream'})), a=document.createElement('a'); a.href=url; a.download=d.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000);
  }catch(e){ toast('No se ha podido descargar'); } }
function vClubDocs(){
  if(!canClub()) return vClub(); ensureClubSubs(); ensureClubDocs(); ui.docBase='club-doc-'; ui.docBack='club-docs';
  const teams=clubTeams(), all=teams.flatMap(t=>Object.values(clubDocs[t.id]||{}));
  const cnt=tid=>{ const ds=Object.values(clubDocs[tid]||{}); const rv=ds.filter(d=>d.status==='revision').length; return ds.length? ` (${ds.length}${rv? ', '+rv+' por revisar':''})` : ''; };
  const body=vDocs().replace(/^<div class="wrap"><div class="pagehead">[\s\S]*?<\/div>/,'').replace(/<\/div>\s*$/,'');
  return `<div class="wrap club"><div class="pagehead"><h1>Documentación</h1><p class="lede">Elige un equipo y trabaja su documentación aquí: subir, leer con IA, revisar y validar. Cada documento queda vinculado a su equipo, temporada y jornada.</p></div>
    <section class="sec"><div class="teampick"><label for="cdt">Equipo</label><select id="cdt" data-act="club-doc-team">${teams.map(t=>`<option value="${esc(t.id)}" ${t.id===teamId?'selected':''}>${esc(t.name)}${cnt(t.id)}</option>`).join('')}</select></div>
      <div class="mdkpis" style="margin-top:12px"><div><b>${all.length}</b><span>documentos del club</span></div><div class="${all.some(d=>d.status==='revision')?'warn':''}"><b>${all.filter(d=>d.status==='revision').length}</b><span>por revisar</span></div><div><b>${all.filter(d=>d.status==='completado').length}</b><span>incorporados</span></div><div class="${all.some(d=>d.status==='error')?'warn':''}"><b>${all.filter(d=>d.status==='error').length}</b><span>con error</span></div></div></section>
    ${body}</div>`;
}


