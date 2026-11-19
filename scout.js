/* =====================================================================
   INFORME DE PARTIDO · encuesta tenística tras cada partido, informe del jugador e informe del rival.
   Adaptado de La Americana Legends Cup a la Lliga Catalana por equipos:
   - Tras su partido, cada jugador responde por cada partido que ha jugado (individual o dobles):
     contra quién, sus golpes, el juego del rival, cómo fue y las condiciones. Se guarda en su
     encuesta de la jornada (seasons/<temp>/ballots/<pid>.j.<jornada>.x), que es privada.
   - «Mi informe»: lo ve el propio jugador (y capitanes y administración). Se calcula en el móvil.
   - «Informe del rival»: los rivales son de otros clubes y no usan la app; su informe sale de lo que
     dicen de ellos los jugadores del equipo. Los capitanes publican solo cifras agregadas en
     seasons/<temp>/scout/rivals, que puede leer todo el equipo. Nunca respuestas sueltas.
   ===================================================================== */

const IX = {
  shots:['Saque','Resto','Derecha','Revés','Volea','Dejada','Globo','Remate'],
  estilo:['Pega fuerte desde el fondo','Muy regular, no falla','Sube a la red','Saque y volea','Cortados y cambios de ritmo','Muy físico, lo corre todo'],
  rend:['Muy mal','Mal','Normal','Bien','Muy bien'],
  fis:['Fundido','Justo','Normal','Bien','Muy fino'],
  cab:['Se cae','Irregular','Normal','Sólido','Muy fuerte'],
  factor:['Saque','Regularidad','Físico','Cabeza','Errores no forzados','Táctica'],
  pista:['Lenta','Normal','Rápida','Mucha tierra suelta','Dura, poca tierra','Irregular, con botes raros'],
  clima:['Perfecto','Calor','Frío','Viento','Humedad','Pista mojada']
};
const IX_PAIR = {mc:'lc', lc:'mc', rd:'rw', rw:'rd'};
const IX_DUP = new Set(['s_rend','s_fisico']);   // ya se preguntan en la ficha del partido
const IX_POS = { Saque:[96,10], Resto:[204,10], Derecha:[98,92], 'Revés':[202,92], Globo:[150,58], Dejada:[150,180], Volea:[104,232], Remate:[196,224] };
const IX_TIP = {
  Saque:'Su saque no le da confianza: resta un paso más adentro y ataca los segundos saques.',
  Resto:'Su resto es el punto flaco: prioriza primeros saques dentro y ataca con el primer golpe.',
  Derecha:'Carga el juego a su derecha: es donde menos confía.',
  'Revés':'Juega cruzado y profundo a su revés: es su lado flojo.',
  Volea:'Hazle subir con una dejada y pásale: no está cómodo en la red.',
  Dejada:'Quédate atrás sin miedo: casi no se fía de su dejada.',
  Globo:'Sube a la red cuando puedas: su globo no le salva.',
  Remate:'Usa el globo alto: no se siente seguro rematando.'
};
const IX_AVOID = {
  Saque:'Su saque es su arma: resta con margen y alarga el punto.',
  Resto:'Resta muy bien: varía el saque y no regales segundos flojos.',
  Derecha:'Evita su derecha: es donde hace daño.',
  'Revés':'Ojo con su revés: es su golpe de confianza.',
  Volea:'No le dejes subir a la red: ahí cierra los puntos.',
  Dejada:'Atento a la dejada: juega más cerca de la línea de fondo.',
  Globo:'Si subes a la red, cuidado con su globo.',
  Remate:'No le regales globos cortos: remata con confianza.'
};
const IX_STYLE_TIP = {
  'Pega fuerte desde el fondo':'Pega fuerte: haz que tenga que pegar tres o cuatro bolas buenas para ganar el punto. Profundidad y altura, toma la bola pronto y usa su ritmo; con el marcador apretado acabará precipitándose.',
  'Muy regular, no falla':'No falla: paciencia y margen sobre la red. Profundo al centro para no darle ángulos y, con la primera bola corta, aproxima profundo y sube.',
  'Sube a la red':'Le gusta subir: resto y passing bajos, a los pies, sin buscar el ganador al primer golpe. Si se pega a la red, globo por encima de su revés.',
  'Saque y volea':'Saca y volea: devuelve muchos primeros saques, bajos y al centro. Con el segundo, adelántate y oblígale a una volea difícil.',
  'Cortados y cambios de ritmo':'Corta y cambia ritmos: flexiona, golpea con margen y llévale a un peloteo profundo; ataca las bolas cortas que te deja.',
  'Muy físico, lo corre todo':'Lo corre todo: no busques el ganador demasiado pronto. Muévelo de esquina a esquina y cierra en la red, donde tiene que pasarte.'
};
const IX_DRILL = {
  Saque:'20 saques a zona (abierto, cuerpo y T). Objetivo: 7 de 10 dentro con el segundo.',
  Resto:'Restos bloqueados profundos al centro contra saque desde la línea de saque.',
  Derecha:'3 series de 15 derechas cruzadas a la zona profunda sin fallo.',
  'Revés':'Revés cruzado y paralelo alternos: altura sobre la red antes que potencia.',
  Volea:'3 × 2 minutos de voleas desde la T con un compañero en el fondo.',
  Dejada:'Dejadas desde media pista a zonas marcadas, con la misma preparación que el drive.',
  Globo:'Globos defensivos desde fuera de pista que pasen la línea de saque.',
  Remate:'Remates con desplazamiento lateral, señalando la bola con la mano libre.'
};
/* Jugadas de pizarra: [tipo, desde, hasta, texto]. «b» = bola, «m» = movimiento. Coordenadas para rival diestro. */
const IX_PLAYS = {
  'Revés':['Martillo al revés',[['b',[165,470],[205,168],'Saque abierto a su revés'],['b',[105,430],[212,72],'Cruzado profundo, otra vez a su revés'],['b',[160,330],[82,92],'Cuando flote la bola, al hueco de su derecha']]],
  Derecha:['Martillo a la derecha',[['b',[135,470],[95,168],'Saque abierto a su derecha'],['b',[195,430],[88,72],'Cruzado profundo, otra vez a su derecha'],['b',[140,330],[218,92],'Cuando flote la bola, al hueco de su revés']]],
  Volea:['Atráele a la red',[['b',[150,452],[124,208],'Dejada corta para que suba'],['m',[176,110],[176,226],'Él sube a la red'],['b',[118,350],[228,58],'Passing o globo por encima']]],
  Globo:['Presión en la red',[['b',[140,425],[206,74],'Aproximación profunda a su revés'],['m',[140,425],[150,300],'Sube a la red'],['b',[150,300],[72,112],'Volea al hueco: su globo no le salva']]],
  Remate:['Lluvia de globos',[['b',[150,452],[124,208],'Dejada para que suba'],['b',[150,445],[168,52],'Globo alto al fondo'],['b',[150,330],[230,100],'Ataca su devolución apurada']]],
  Saque:['Resto agresivo',[['m',[150,484],[150,446],'Adelántate a restar'],['b',[150,446],[206,96],'Resto profundo a su revés'],['b',[150,330],[80,80],'Ataca la bola corta']]],
  Resto:['Saque y primer golpe',[['b',[165,470],[96,166],'Saque abierto, que reste estirado'],['b',[150,420],[222,82],'Primer golpe al hueco contrario']]],
  Dejada:['Ancla y profundidad',[['b',[150,440],[150,70],'Profundo y alto al centro'],['b',[110,420],[216,70],'Cambia de dirección a la línea']]]
};
const ixGames = c => { let f=0,a=0; (c.sets||[]).forEach(([x,y])=>{ if(Math.max(x,y)>=10){ x>y? f++ : a++; } else { f+=x; a+=y; } }); return [f,a]; };   // el súper tie-break cuenta como un juego
const IX_FAC_L = { Saque:'Su saque decidió: resta con margen al centro y juega cada punto de resto.', Regularidad:'Fue más regular: alarga el punto con margen y espera la bola corta para atacar.', 'Físico':'Ganó por físico: no entres en peloteos largos sin sentido; acorta con la primera bola corta.', Cabeza:'Se decidió por cabeza: plan sencillo y, en los puntos importantes, tu golpe más seguro.', 'Errores no forzados':'Perdimos por errores no forzados: más margen sobre la red y lejos de las líneas.', 'Táctica':'Nos ganó tácticamente: sigue el plan de esta página aunque cueste al principio.' };
const IX_DUELS = [['Saque','Resto','Tu saque contra su resto'],['Resto','Saque','Tu resto contra su saque'],['Derecha','Revés','Tu derecha contra su revés'],['Revés','Derecha','Tu revés contra su derecha'],['Dejada','Volea','Tu dejada contra su juego en la red'],['Globo','Remate','Tu globo contra su remate'],['Volea','Globo','Tu volea contra su globo'],['Remate','Globo','Tu remate contra su globo']];

/* ---------- utilidades ---------- */
const ixNorm = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z\s]/g,' ').split(/\s+/).filter(w=>w.length>1).sort().join(' ');
const ixTitle = s => String(s||'').trim().toLowerCase().replace(/(^|[\s'-])\S/g,c=>c.toUpperCase());
const ixMotion = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
const ixArr = v => Array.isArray(v)? v : (v? [v] : []);
function ixStable(o){ if(Array.isArray(o)) return '['+o.map(ixStable).join(',')+']'; if(o&&typeof o==='object') return '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+ixStable(o[k])).join(',')+'}'; return JSON.stringify(o); }
const ixTop = m => { const e=Object.entries(m||{}).sort((a,b)=>b[1]-a[1]); return e.length? e[0] : null; };
const ixRec = (w,l) => `${w}-${l}`;

/* =====================================================================
   1 · ENCUESTA: «ficha del partido» antes de las preguntas del equipo
   ===================================================================== */
function ixMyRubbers(j, pid){ pid=pid||me; const t=tie(j); if(!t||!pid) return [];
  return t.rubbers.map((r,i)=>({r,i})).filter(x=>(x.r.polo||[]).includes(pid) && rubberCalc(x.r).res && !isWO(x.r)); }
function ixSteps(j){ const rs=ixMyRubbers(j), st=[];
  rs.forEach(x=>st.push({k:'riv',i:x.i},{k:'mine',i:x.i},{k:'his',i:x.i},{k:'how',i:x.i}));
  if(rs.length) st.push({k:'cond'}); return st; }
function ixInit(j){ const saved=myBallot?.j?.[jid(j)]?.x; const x=saved? JSON.parse(JSON.stringify(saved)) : {m:{},pista:[],clima:[]}; x.m=x.m||{};
  ixMyRubbers(j).forEach(({r,i})=>{ const m=x.m[i] ||= {}; if(m.riv==null && r.riv) m.riv=r.riv; });
  return x; }
function ixClean(x){ if(!x||!x.m) return null; const out={v:1,m:{},pista:ixArr(x.pista),clima:ixArr(x.clima)};
  Object.entries(x.m).forEach(([i,m])=>{ const c={}; ['riv','hand','rend','fis','cab'].forEach(k=>{ if(m[k]) c[k]=String(m[k]).slice(0,60); }); ['est','mc','lc','rd','rw','fac'].forEach(k=>{ const a=ixArr(m[k]); if(a.length) c[k]=a; }); out.m[i]=c; });
  return out; }
const ixBaseQs = () => surveyQuestions().filter(q=>!(ui.survey?.xs?.length && IX_DUP.has(q.id)));
const ixQCount = j => { const xs=ixSteps(j).length; return xs + surveyQuestions().filter(q=>!(xs && IX_DUP.has(q.id))).length; };

function ixChips(field, list, tgt, r, multi){ const cur=ixArr(tgt[field]);
  return `<div class="ix-opts">${list.map(v=>{ const on=cur.includes(v); return `<button type="button" class="ix-o${on?' on':''}" data-ix="${multi?'tog':'one'}" data-f="${field}" data-r="${r??''}" data-v="${esc(v)}" aria-pressed="${on}">${esc(v)}</button>`; }).join('')}</div>`; }

function ixStepCard(){
  const u=ui.survey, st=u.xs[u.step], j=u.j, total=u.xs.length+ixBaseQs().length;
  const t=tie(j), R=st.i!=null? t.rubbers[st.i] : null, dbl=R?.type==='D', m=st.i!=null? (u.x.m[st.i] ||= {}) : null;
  const c=R? rubberCalc(R) : null, won=c?.res==='W';
  const tag=R? `${RUBBERS[st.i].label}${dbl&&R.polo?.length===2? ' con '+esc(pname(R.polo.find(p=>p!==me)).split(' ')[0]) : ''} · ${won?'Ganaste':'Perdiste'}${R.score? ' '+esc(R.score) : ''}` : 'La jornada';
  let q='', body='';
  if(st.k==='riv'){
    const club=persp(poloFix(j)).rival, known=Object.values(ixRivals()).filter(a=>a.club===club).map(ixName).slice(0,6);
    q=dbl? '¿Contra qué pareja jugasteis?' : '¿Contra quién jugaste?';
    body=`<label class="ix-lab" for="ix-riv">${dbl?'Nombres de la pareja rival':'Nombre del rival'} <small>tal como sale en el acta</small></label>
      <input id="ix-riv" class="ix-in" type="text" autocomplete="off" maxlength="60" data-ix-in="riv" data-r="${st.i}" value="${esc(m.riv||'')}" placeholder="${dbl?'Ej.: Marc Puig / Pol Serra':'Ej.: Marc Puig Soler'}">
      ${known.length? `<p class="ix-hint">¿Era alguno de estos? Ya hay informe suyo:</p><div class="ix-opts">${known.map(n=>`<button type="button" class="ix-o sm${ixNorm(n)===ixNorm(m.riv)?' on':''}" data-ix="riv" data-r="${st.i}" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>` : ''}
      ${dbl? '' : `<h4 class="ix-h4">¿Diestro o zurdo?</h4>${ixChips('hand',['Diestro','Zurdo'],m,st.i,false)}`}
      <h4 class="ix-h4">${dbl?'¿Cómo jugaban?':'¿Cómo juega?'} <small>puedes marcar varias</small></h4>${ixChips('est',IX.estilo,m,st.i,true)}`;
  } else if(st.k==='mine'){
    q='Tus golpes del partido';
    body=`<p class="ix-hint">Puedes marcar varios en cada pregunta.</p><h4 class="ix-h4 good">¿Con qué golpes jugaste con más confianza?</h4>${ixChips('mc',IX.shots,m,st.i,true)}
      <h4 class="ix-h4 bad">¿Con cuáles jugaste con menos confianza?</h4>${ixChips('lc',IX.shots,m,st.i,true)}`;
  } else if(st.k==='his'){
    q=dbl? 'El juego de la pareja rival' : 'El juego de tu rival';
    body=`<p class="ix-hint">Esto alimenta el informe del rival que verá el equipo, siempre en cifras agregadas.</p>
      <h4 class="ix-h4 bad">${dbl?'¿Cuáles eran sus golpes fuertes?':'¿Cuáles son sus golpes fuertes?'} <small>los que más daño te hicieron</small></h4>${ixChips('rd',IX.shots,m,st.i,true)}
      <h4 class="ix-h4 good">${dbl?'¿Dónde les encontrasteis el punto débil?':'¿Dónde le encontraste el punto débil?'}</h4>${ixChips('rw',IX.shots,m,st.i,true)}
      <h4 class="ix-h4">${dbl?'¿Cómo competían de cabeza?':'¿Cómo compite de cabeza?'} <small>en los puntos importantes y cuando va por detrás</small></h4>${ixChips('cab',IX.cab,m,st.i,false)}`;
  } else if(st.k==='how'){
    q='¿Cómo fue el partido?';
    body=`<h4 class="ix-h4">Tu rendimiento</h4>${ixChips('rend',IX.rend,m,st.i,false)}<h4 class="ix-h4">Físicamente</h4>${ixChips('fis',IX.fis,m,st.i,false)}
      <h4 class="ix-h4">¿Qué decidió el partido? <small>varias</small></h4>${ixChips('fac',IX.factor,m,st.i,true)}`;
  } else {
    q='¿Cómo estaban la pista y el día?';
    body=`<h4 class="ix-h4">La pista <small>varias</small></h4>${ixChips('pista',IX.pista,u.x,'',true)}<h4 class="ix-h4">El tiempo <small>varias</small></h4>${ixChips('clima',IX.clima,u.x,'',true)}`;
  }
  const filled = st.k==='riv'? !!(m.riv||'').trim() : st.k==='mine'? ixArr(m.mc).length+ixArr(m.lc).length>0 : st.k==='his'? ixArr(m.rd).length+ixArr(m.rw).length>0 || !!m.cab : st.k==='how'? !!(m.rend||m.fis) : ixArr(u.x.pista).length+ixArr(u.x.clima).length>0;
  return `<div class="survey ix-sv"><div class="qsec"><span class="ix-tag">🎾 ${tag}</span> ${u.step+1} de ${total}</div><div class="prog"><i style="width:${Math.round(u.step*100/total)}%"></i></div>
    <div class="qbody" key="ix${u.step}"><p class="q">${q}</p>${body}</div>
    <div class="nav"><button class="btn ghost" data-act="survey-prev" ${u.step===0?'disabled':''}>Atrás</button><button class="btn${filled?' brass':''}" data-act="survey-next">${filled?'Siguiente':'Saltar'}</button></div></div>`;
}

document.addEventListener('click', e=>{
  const b=e.target.closest('[data-ix]'); if(!b||!ui.survey?.x) return;
  const u=ui.survey, f=b.dataset.f, r=b.dataset.r, v=b.dataset.v, tgt= r!==''&&r!=null? (u.x.m[r] ||= {}) : u.x, mode=b.dataset.ix;
  if(mode==='one') tgt[f]= tgt[f]===v? null : v;
  else if(mode==='tog'){ const a=ixArr(tgt[f]).slice(), i=a.indexOf(v); if(i>=0) a.splice(i,1); else { a.push(v); const o=IX_PAIR[f]; if(o&&tgt[o]) tgt[o]=ixArr(tgt[o]).filter(z=>z!==v); } tgt[f]=a; }
  else if(mode==='riv') tgt.riv=v;
  renderQuiet();
});
document.addEventListener('input', e=>{ const el=e.target; if(el?.dataset?.ixIn && ui.survey?.x){ (ui.survey.x.m[el.dataset.r] ||= {})[el.dataset.ixIn]=el.value.slice(0,60); } });

/* =====================================================================
   2 · DATOS: entradas por partido, agregados del jugador y de los rivales
   ===================================================================== */
function ixEntries(pid, bal){ const out=[];
  Object.entries(bal?.j||{}).forEach(([k,b])=>{ const x=b?.x; if(!x?.m) return; const j=+String(k).slice(1), t=S.ties[k], f=poloFix(j); if(!t||!f) return;
    Object.entries(x.m).forEach(([i,m])=>{ const R=t.rubbers[+i]; if(!R||!(R.polo||[]).includes(pid)||isWO(R)) return; const c=rubberCalc(R); if(!c.res) return;
      out.push({j,k,i:+i,type:R.type,res:c.res,score:R.score||'',club:persp(f).rival,riv:String(m.riv||R.riv||'').trim(),hand:m.hand||'',est:ixArr(m.est),mc:ixArr(m.mc),lc:ixArr(m.lc),rd:ixArr(m.rd),rw:ixArr(m.rw),
        gf:ixGames(c)[0], ga:ixGames(c)[1], cab:IX.cab.indexOf(m.cab)+1, rend:IX.rend.indexOf(m.rend)+1, fis:IX.fis.indexOf(m.fis)+1, fac:ixArr(m.fac), pista:ixArr(x.pista), clima:ixArr(x.clima), partner:(R.polo||[]).find(p=>p!==pid)||''}); }); });
  return out.sort((a,b)=>a.j-b.j||a.i-b.i); }
const ixCnt = (E,f) => { const o={}; E.forEach(e=>[...new Set(e[f])].forEach(v=>{ if(v) o[v]=(o[v]||0)+1; })); return o; };
function ixSelf(E){ const n=E.length; if(!n) return null;
  const mc=ixCnt(E,'mc'), lc=ixCnt(E,'lc'), L=E.slice(-3), mc3=ixCnt(L,'mc'), lc3=ixCnt(L,'lc');
  const avg=(f,X=E)=>{ const v=X.map(e=>e[f]).filter(x=>x>0); return v.length? v.reduce((a,b)=>a+b,0)/v.length : null; };
  const bucket=(list,key)=>{ const o={}; list.forEach(e=>[].concat(key(e)).forEach(v=>{ if(!v) return; const c=o[v] ||= {w:0,l:0}; c[e.res==='W'?'w':'l']++; })); return o; };
  const w=E.filter(e=>e.res==='W').length, S5=E.slice(-5);
  return {n, w, l:n-w, mc, lc, n3:L.length,
    sc:k=>((mc[k]||0)-(lc[k]||0))/n, sc3:k=>L.length? ((mc3[k]||0)-(lc3[k]||0))/L.length : 0,
    rend:avg('rend'), fis:avg('fis'), rend5:avg('rend',S5), fis5:avg('fis',S5), wr5:S5.filter(e=>e.res==='W').length/S5.length,
    fac:ixCnt(E,'fac'), cond:bucket(E,e=>[...e.pista,...e.clima]), vsEst:bucket(E.filter(e=>e.type==='S'),e=>e.est), vsHand:bucket(E.filter(e=>e.type==='S'&&e.hand),e=>e.hand), E}; }
/* Suma una ficha al rival (solo individuales, por nombre) y al club (individuales y dobles). «src» evita contarla dos veces. */
function ixAdd(R,C,pid,e){ const id=pid+':'+e.j+':'+e.i, add=(o,l)=>[...new Set(l)].forEach(v=>o[v]=(o[v]||0)+1);
  const c=C[e.club] ||= {n:0,w:0,l:0,est:{},rd:{},rw:{},facW:{},facL:{},src:[]};
  if(!c.src.includes(id)){ c.src.push(id); c.n++; if(e.cab>0){ c.cab=(c.cab||0)+e.cab; c.cabN=(c.cabN||0)+1; } e.res==='W'? c.l++ : c.w++; add(c.est,e.est); add(c.rd,e.rd); add(c.rw,e.rw); add(e.res==='W'? c.facW : c.facL, e.fac); }
  if(e.type!=='S'||!e.riv) return; const nk=ixNorm(e.riv); if(!nk) return;
  const a=R[e.club+'|'+nk] ||= {club:e.club,nm:{},n:0,w:0,l:0,gF:0,gA:0,hand:{},est:{},rd:{},rw:{},facW:{},facL:{},by:{},js:[],src:[]};
  a.src ||= []; if(a.src.includes(id)) return; a.src.push(id);
  a.nm[e.riv]=(a.nm[e.riv]||0)+1; a.n++; e.res==='W'? a.l++ : a.w++;      // w y l, desde el punto de vista del rival
  a.gF=(a.gF||0)+e.gf; a.gA=(a.gA||0)+e.ga; if(e.cab>0){ a.cab=(a.cab||0)+e.cab; a.cabN=(a.cabN||0)+1; } if(e.hand) a.hand[e.hand]=(a.hand[e.hand]||0)+1;
  add(a.est,e.est); add(a.rd,e.rd); add(a.rw,e.rw); add(e.res==='W'? (a.facW ||= {}) : (a.facL ||= {}), e.fac);
  const by=a.by[pid] ||= {w:0,l:0}; by[e.res==='W'?'w':'l']++; if(!a.js.includes(e.j)) a.js.push(e.j); }
function ixRivalAgg(all){ const R={}, C={}; Object.entries(all||{}).forEach(([pid,b])=>ixEntries(pid,b).forEach(e=>ixAdd(R,C,pid,e))); return {r:R,c:C}; }
const ixCab = a => a?.cabN? a.cab/a.cabN : null;
const ixCabLbl = v => v>=4.3? 'Muy fuerte de cabeza' : v>=3.5? 'Sólido de cabeza' : v>=2.7? 'Normal de cabeza' : v>=2? 'Irregular de cabeza' : 'Se cae de cabeza';
const ixCabTip = v => v>=3.8? 'Compite muy bien de cabeza: no regales puntos fáciles en los momentos importantes. Juega esos puntos con tu golpe más seguro y no esperes que se caiga solo.' : v<=2.6? 'Le cuesta competir de cabeza: alarga los puntos y los juegos, ponle presión en los marcadores ajustados y no le dejes respirar cuando vaya por detrás.' : '';
const ixName = a => ixTitle(ixTop(a.nm)?.[0]||'Rival');
const ixHand = a => (a.hand?.Zurdo||0) > (a.hand?.Diestro||0)? 'zurdo' : (a.hand?.Diestro? 'diestro' : '');
const ixDanger = (a,k) => a.n? ((a.rd[k]||0)-(a.rw[k]||0))/a.n : 0;
const ixArma = a => IX.shots.filter(k=>(a.rd[k]||0)>(a.rw[k]||0)).sort((p,q)=>((a.rd[q]||0)-(a.rw[q]||0))-((a.rd[p]||0)-(a.rw[p]||0))||(a.rd[q]||0)-(a.rd[p]||0))[0];
const ixWeak = a => IX.shots.filter(k=>(a.rw[k]||0)>(a.rd[k]||0)).sort((p,q)=>((a.rw[q]||0)-(a.rd[q]||0))-((a.rw[p]||0)-(a.rd[p]||0))||(a.rw[q]||0)-(a.rw[p]||0))[0];
function ixThreat(a){ const g=a.w+a.l, wr=(a.w+1)/(g+2), gs=((a.gA||0)+3)/((a.gF||0)+(a.gA||0)+6);
  const sr=Object.values(a.rd).reduce((x,y)=>x+y,0), sw=Object.values(a.rw).reduce((x,y)=>x+y,0), bal=(sr+sw)? (sr-sw)/(sr+sw) : 0;
  const conf=Math.min(1,a.n/3);   // con pocas fichas el balance de golpes pesa menos
  const cb=ixCab(a); return Math.max(0,Math.min(100,Math.round(100*(0.35*wr + 0.40*gs + 0.25*(0.5+0.5*bal*conf)) + (cb? (cb-3)*3 : 0)))); }
const ixThreatLbl = v => v>=72? 'PELIGRO MÁXIMO' : v>=56? 'RIVAL DURO' : v>=40? 'PARTIDO ABIERTO' : 'ASEQUIBLE';
const ixThreatCol = v => v>=72? 'var(--ix-bad)' : v>=56? '#F08A4B' : v>=40? 'var(--ix-mid)' : 'var(--ix-good)';
function ixForm(s){ const r=s.rend5? (s.rend5-1)/4 : .5, f=s.fis5? (s.fis5-1)/4 : .5; return Math.round(100*(0.5*s.wr5 + 0.25*r + 0.25*f)); }
const ixFormLbl = v => v>=75? 'EN LLAMAS' : v>=58? 'EN FORMA' : v>=42? 'REGULAR' : 'A RECUPERAR';
const ixFormCol = v => v>=75? 'var(--ix-good)' : v>=58? '#9BD36A' : v>=42? 'var(--ix-mid)' : 'var(--ix-bad)';

/* Publicación: los capitanes leen todas las encuestas y publican solo los agregados de los rivales */
let ixPub=null, ixPubKey='', ixPubUnsub=null, ixPubT=null, ixLast='';
function ixWatch(){ if(typeof B==='undefined'||!B||!authUser||!SEASON_PATH||ixPubKey===SEASON_PATH) return;
  try{ ixPubUnsub&&ixPubUnsub(); }catch(e){} ixPubKey=SEASON_PATH; ixPub=null; ixLast='';
  ixPubUnsub=B.watchDoc(SEASON_PATH+'/scout/rivals', d=>{ ixPub=d; if(/^(rival|scout)-/.test(route())) softRender(); }); }
async function ixPublish(){ if(!canPrivate||!Object.keys(ballots||{}).length) return;
  const g=ixRivalAgg(ballots), s=ixStable(g); if(s===ixLast) return;
  if(s===ixStable({r:ixPub?.r||{},c:ixPub?.c||{}})){ ixLast=s; return; }
  ixLast=s; try{ await B.set(SEASON_PATH+'/scout/rivals',{v:2,at:Date.now(),r:g.r,c:g.c}); }catch(e){ ixLast=''; console.warn('scout', e?.code||e); } }
function ixAggAll(){ if(canPrivate && Object.keys(ballots||{}).length) return ixRivalAgg(ballots);
  const g={r:JSON.parse(JSON.stringify(ixPub?.r||{})), c:JSON.parse(JSON.stringify(ixPub?.c||{}))};
  if(me && myBallot) ixEntries(me,myBallot).forEach(e=>ixAdd(g.r,g.c,me,e));   // tu encuesta cuenta al momento, sin esperar a que el capitán publique
  return g; }
function ixRivals(){ return ixAggAll().r; }
function ixClubAgg(club){ return ixAggAll().c[club]||null; }
function ixClubRivals(club){ return Object.entries(ixRivals()).filter(([,a])=>a.club===club).map(([k,a])=>({k,a,t:ixThreat(a)})).sort((x,y)=>y.t-x.t||y.a.n-x.a.n||ixName(x.a).localeCompare(ixName(y.a))); }

/* Se llama al final de cada render */
let ixAnim='';
function ixTick(){
  ixCss(); ixWatch();
  if(canPrivate){ clearTimeout(ixPubT); ixPubT=setTimeout(ixPublish,2500); }
  const root=document.querySelector('.ix-rep'); if(!root) return;
  const key=route(), first=ixAnim!==key; ixAnim=key;
  root.querySelectorAll('[data-ixc]').forEach(el=>{ const to=+el.dataset.ixc||0;
    if(!first||!ixMotion()){ el.textContent=to; return; }
    const t0=performance.now(), d=900, f=t=>{ const k=Math.min(1,(t-t0)/d), e=1-Math.pow(1-k,3); el.textContent=Math.round(to*e); if(k<1) requestAnimationFrame(f); }; el.textContent='0'; requestAnimationFrame(f); });
  root.classList.toggle('still', !first);
}

/* =====================================================================
   3 · GRÁFICOS (SVG)
   ===================================================================== */
function ixClay(uid){ return `<defs><linearGradient id="clay${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D86E3E"/><stop offset=".5" stop-color="#C45E33"/><stop offset="1" stop-color="#A84C27"/></linearGradient>
  <pattern id="grain${uid}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="rgba(255,255,255,.07)"/><circle cx="4" cy="4" r=".5" fill="rgba(0,0,0,.09)"/></pattern>
  ${['good','mid','bad'].map(k=>`<radialGradient id="h${k}${uid}"><stop offset="0" stop-color="var(--ix-${k})" stop-opacity=".95"/><stop offset=".55" stop-color="var(--ix-${k})" stop-opacity=".45"/><stop offset="1" stop-color="var(--ix-${k})" stop-opacity="0"/></radialGradient>`).join('')}</defs>
  <rect x="6" y="-20" width="288" height="514" rx="12" fill="url(#clay${uid})"/><rect x="6" y="-20" width="288" height="514" rx="12" fill="url(#grain${uid})"/>
  <rect x="6" y="250" width="288" height="244" fill="rgba(6,22,16,.42)"/>`; }
function ixLines(){ return `<g class="ix-lines"><rect x="40" y="40" width="220" height="420"/><line x1="62" y1="40" x2="62" y2="460"/><line x1="238" y1="40" x2="238" y2="460"/>
  <line x1="62" y1="142" x2="238" y2="142"/><line x1="62" y1="358" x2="238" y2="358"/><line x1="150" y1="142" x2="150" y2="358"/><line x1="150" y1="40" x2="150" y2="46"/><line x1="150" y1="454" x2="150" y2="460"/></g>
  <line x1="28" y1="250" x2="272" y2="250" class="ix-net"/>`; }
const ixArc=(a,b,lift=60)=>{ const mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2-lift; return `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`; };
/* mode 'self': verde = confía, rojo = le cuesta. mode 'rival': verde = atacable, rojo = su arma */
function ixCourt(data, mode, hand, uid){
  const X=x=>hand==='zurdo'? 300-x : x, mv=ixMotion(), maxUse=Math.max(1,...data.map(d=>d.use));
  const tone=sc=>sc>=0.25?'good':sc<=-0.25?'bad':'mid';
  const heat=data.filter(d=>d.use).map((d,i)=>{ const [x0,y]=IX_POS[d.k], x=X(x0), R=30+34*Math.sqrt(d.use/maxUse);
    return `<circle cx="${x}" cy="${y}" r="${R.toFixed(1)}" fill="url(#h${tone(d.score)}${uid})" class="ix-heat" style="--d:${(0.15*i).toFixed(2)}s"/>`; }).join('');
  const dots=data.map((d,i)=>{ const [x0,y]=IX_POS[d.k], x=X(x0), r=d.use? 9+7*Math.sqrt(d.use/maxUse) : 6;
    return `<g class="ix-spot${d.use?'':' off'}" style="--d:${(0.4+0.12*i).toFixed(2)}s"><circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" class="ix-core ${d.use?'t-'+tone(d.score):''}"/>
      <text x="${x}" y="${(y-r-5).toFixed(1)}" class="ix-lbl">${esc(d.k)}</text>${d.use?`<text x="${x}" y="${(y+r+11).toFixed(1)}" class="ix-cnt">+${d.plus} · −${d.minus}</text>`:''}</g>`; }).join('');
  // rival: la bola va a su punto más atacable; propio: al golpe que más hay que reforzar
  const pick = mode==='rival'? data.filter(d=>d.use&&d.score>0).sort((a,b)=>b.score-a.score||b.use-a.use)[0]
                             : data.filter(d=>d.use&&d.score<0).sort((a,b)=>a.score-b.score||b.use-a.use)[0];
  let aim='';
  if(pick){ const [x0,y]=IX_POS[pick.k], x=X(x0), d=ixArc([150,440],[x,y+4],90);
    aim=`<g class="ix-aim"><path d="${d}" class="ix-traj"/><circle cx="${x}" cy="${y}" r="22" class="ix-ring"/><circle cx="${x}" cy="${y}" r="22" class="ix-ring r2"/>
      ${mv? `<circle r="5.5" class="ix-ball"><animateMotion dur="2.2s" repeatCount="indefinite" path="${d}" keyPoints="0;1;1" keyTimes="0;.75;1" calcMode="linear"/></circle>` : `<circle cx="${x}" cy="${y+4}" r="5.5" class="ix-ball"/>`}
      <text x="150" y="476" class="ix-aimtxt">${mode==='rival'? '🎯 ATACA AQUÍ · ' : '🛠️ A REFORZAR · '}${esc(pick.k.toUpperCase())}</text></g>`; }
  return `<svg class="ix-court" viewBox="0 -26 300 526" role="img" aria-label="${mode==='rival'?'Mapa de sus golpes en la pista':'Mapa de tus golpes en la pista'}">${ixClay(uid)}${ixLines()}
    <text x="150" y="268" class="ix-side">RED</text><text x="150" y="405" class="ix-side big">${mode==='rival'?'TU CAMPO':'PISTA'}</text>${heat}${aim}${dots}</svg>`;
}
function ixRadar(series){   // series: [{v:k=>-1..1, cls, color}]
  const ks=IX.shots, n=ks.length, cx=150, cy=140, R=100;
  const pt=(i,v)=>{ const a=-Math.PI/2+i*2*Math.PI/n, r=R*v; return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; };
  const poly=f=>ks.map((k,i)=>pt(i,(Math.max(-1,Math.min(1,f(k)))+1)/2).map(x=>x.toFixed(1)).join(',')).join(' ');
  const rings=[.25,.5,.75,1].map(g=>`<polygon points="${ks.map((_,i)=>pt(i,g).map(x=>x.toFixed(1)).join(',')).join(' ')}" class="ix-rg"/>`).join('');
  const spokes=ks.map((_,i)=>{ const [x,y]=pt(i,1); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="ix-rg"/>`; }).join('');
  const labels=ks.map((k,i)=>{ const [x,y]=pt(i,1.2); return `<text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" class="ix-rl">${esc(k)}</text>`; }).join('');
  return `<svg viewBox="0 0 300 285" class="ix-radar" role="img" aria-label="ADN de golpes">${rings}${spokes}<circle cx="${cx}" cy="${cy}" r="${R/2}" class="ix-mid"/>
    ${series.map(s=>`<polygon points="${poly(s.v)}" class="${s.cls}" style="--c:${s.color||'var(--ix-acc)'}"/>`).join('')}${labels}</svg>`;
}
function ixRing(v, lbl, col, cap){ const C=263.9, off=C*(1-v/100);
  return `<div class="ix-ringbox"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="bg"/><circle cx="50" cy="50" r="42" class="v" style="--off:${off.toFixed(1)};stroke:${col}"/></svg>
    <div class="ix-rv"><b data-ixc="${v}">${v}</b><span>${esc(cap)}</span><em style="color:${col}">${esc(lbl)}</em></div></div>`; }
function ixDonut(map){ const cols=['#5DBB83','#E2C47C','#6FA8DC','#E07A62','#B48EDB','#4FC3B5'], e=Object.entries(map||{}).sort((a,b)=>b[1]-a[1]); let acc=0; const C=2*Math.PI*36, tot=e.reduce((t,x)=>t+x[1],0)||1;
  const segs=e.map(([k,v],i)=>{ const len=C*v/tot, s=`<circle cx="50" cy="50" r="36" class="ix-seg" style="stroke:${cols[i%6]};stroke-dasharray:${len.toFixed(1)} ${C.toFixed(1)};stroke-dashoffset:${(-acc).toFixed(1)}"/>`; acc+=len; return s; }).join('');
  return e.length? `<div class="ix-donut"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" class="bg"/>${segs}</svg><ul>${e.map(([k,v],i)=>`<li><i style="background:${cols[i%6]}"></i>${esc(k)}<b>${Math.round(v/tot*100)}%</b></li>`).join('')}</ul></div>` : '<p class="ix-mini">Aún sin datos.</p>'; }
function ixPlay(key, hand, idx){ const P0=IX_PLAYS[key]; if(!P0) return '';
  const [name,steps]=P0, X=p=>hand==='zurdo'? [300-p[0],p[1]] : p, mv=ixMotion(), slot=1.15, T=steps.length*slot+1.1;
  const paths=steps.map((s,i)=>{ const a=X(s[1]), b=X(s[2]), d=s[0]==='m'? `M${a[0]},${a[1]} L${b[0]},${b[1]}` : ixArc(a,b,s[1][1]-s[2][1]>200?110:55), st=(i*slot)/T, en=(i*slot+0.95)/T;
    return `<path d="${d}" class="ix-p ${s[0]}"/><g class="ix-num"><circle cx="${b[0]}" cy="${b[1]}" r="11"/><text x="${b[0]}" y="${b[1]+4}">${i+1}</text></g>
      ${s[0]==='b'? (mv? `<circle r="5" class="ix-ball"><animateMotion dur="${T}s" repeatCount="indefinite" path="${d}" keyPoints="0;0;1;1" keyTimes="0;${st.toFixed(3)};${en.toFixed(3)};1" calcMode="linear"/><animate attributeName="opacity" dur="${T}s" repeatCount="indefinite" values=".15;1;1;.15;.15" keyTimes="0;${Math.max(st,0.001).toFixed(3)};${en.toFixed(3)};${Math.min(en+0.02,0.999).toFixed(3)};1"/></circle>` : `<circle cx="${b[0]}" cy="${b[1]}" r="5" class="ix-ball"/>`) : ''}`; }).join('');
  return `<div class="ix-play"><div class="ix-play-h"><span class="ix-chip">JUGADA ${idx+1}</span><b>${esc(name)}</b></div>
    <svg viewBox="0 -26 300 526" class="ix-mini-court">${ixClay('P'+idx)}${ixLines()}${paths}</svg><ol>${steps.map(s=>`<li class="${s[0]}">${esc(s[3])}</li>`).join('')}</ol></div>`; }
function ixTimeline(E){ const W=420, H=200, P=26, n=E.length; if(n<2){ const e=E[0]; return e? `<div class="ix-one"><span class="ix-oneres ${e.res==='W'?'w':'l'}">${e.res==='W'?'V':'D'}</span><div><b>Jornada ${e.j} · ${e.type==='D'?'Dobles':'Individual'}${e.score?' · '+esc(e.score):''}</b><small>${e.riv? 'Contra '+esc(e.riv)+'. ' : ''}${e.rend? 'Rendimiento '+IX.rend[e.rend-1].toLowerCase()+'. ' : ''}${e.fis? 'Físico: '+IX.fis[e.fis-1].toLowerCase()+'.' : ''}</small></div></div><p class="ix-mini">Con la siguiente ficha verás la línea de tu evolución.</p>` : ''; }
  const x=i=>P+i*(W-2*P)/(n-1), y=v=>H-36-(v-1)/4*(H-70);
  const line=f=>E.map((e,i)=>e[f]>0? `${x(i).toFixed(1)},${y(e[f]).toFixed(1)}` : null).filter(Boolean).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" class="ix-tl" role="img" aria-label="Evolución partido a partido">
    ${[1,3,5].map(v=>`<line x1="${P}" x2="${W-P}" y1="${y(v)}" y2="${y(v)}" class="ix-tg"/><text x="4" y="${y(v)+4}" class="ix-tt">${v}</text>`).join('')}
    <polyline points="${line('fis')}" class="ix-tf"/><polyline points="${line('rend')}" class="ix-tr"/>
    ${E.map((e,i)=>`<g style="--d:${(0.06*i).toFixed(2)}s" class="ix-tp"><circle cx="${x(i)}" cy="${H-14}" r="11" class="${e.res==='W'?'w':'l'}"/><text x="${x(i)}" y="${H-9.5}" class="ix-tw">${e.res==='W'?'V':'D'}</text>${e.rend>0?`<circle cx="${x(i)}" cy="${y(e.rend)}" r="4.5" class="ix-trd"/>`:''}<text x="${x(i)}" y="16" class="ix-tj">J${e.j}${e.type==='D'?'·D':''}</text></g>`).join('')}</svg>
    <div class="ix-legend"><span><i class="lg-r"></i>Tu rendimiento</span><span><i class="lg-f"></i>Físico</span><span><i class="lg-w"></i>Victoria</span><span><i class="lg-l"></i>Derrota</span></div>`; }

/* =====================================================================
   4 · VISTAS
   ===================================================================== */
const ixSec = (i,title,body,cls='') => `<section class="ix-sec ${cls}" style="--d:${(0.07*i).toFixed(2)}s"><h3 class="ix-h">${title}</h3>${body}</section>`;
function ixHero(o){ return `<div class="ix-hero"><div class="ix-glow"></div><div class="ix-gridbg"></div>
  <div class="ix-photo">${o.photo? `<img src="${esc(o.photo)}" alt="">` : o.crest? o.crest : `<span>${esc(o.ini||'?')}</span>`}</div><div class="ix-scan"></div>
  <div class="ix-ht"><div class="ix-stamp">${esc(o.stamp)}</div><div class="ix-kick">${esc(o.kick)}</div><h1 class="ix-name">${esc(o.name)}</h1>${o.sub?`<div class="ix-sub">${o.sub}</div>`:''}${o.chips?`<div class="ix-chips">${o.chips}</div>`:''}</div>${o.ring||''}</div>`; }
const ixBack = (href,txt) => `<a class="ix-back" href="${href}">← ${esc(txt)}</a>`;

/* ---------- Informe del jugador ---------- */
function vIxPlayer(pid){
  const p=player(pid); if(!p) return vNotFound();
  const own=pid===me, bal=own? myBallot : ballots?.[pid];
  if(!own && !canPrivate) return `<div class="wrap"><div class="pagehead"><h1>Informe privado</h1><p class="lede">Cada informe de jugador lo ven solo el propio jugador y los capitanes.</p></div></div>`;
  const E=ixEntries(pid,bal), s=ixSelf(E), first=p.name.split(' ')[0], hand=/zurd/i.test(profiles?.[pid]?.hand||'')? 'zurdo' : 'diestro';
  const hero=ixHero({stamp:own?'EXPEDIENTE · PERSONAL':'EXPEDIENTE · CAPITÁN', kick:`Informe de jugador · ${teamLabel()} · ${viewSeason}`, name:p.name, photo:photos?.[pid]?.d, ini:p.name.split(' ').map(x=>x[0]).slice(0,2).join(''),
    sub: s? `${s.n} ${s.n===1?'partido analizado':'partidos analizados'}` : 'Aún sin fichas de partido',
    chips: s? `<span>🏆 ${s.w}V · ${s.l}D</span><span>🎾 ${E.filter(e=>e.type==='S').length} ind. · ${E.filter(e=>e.type==='D').length} dob.</span><span>✋ ${hand==='zurdo'?'Zurdo':'Diestro'}</span>` : '',
    ring: s? ixRing(ixForm(s),ixFormLbl(ixForm(s)),ixFormCol(ixForm(s)),'FORMA') : ''});
  const back=ixBack(own? '#yo' : '#jugador-'+pid, own? 'Yo' : p.name);
  if(!s) return `<div class="ix-rep">${back}${hero}<div class="ix-body"><div class="ix-locked"><div class="ix-lock">🔒</div><b>Tu informe se desbloquea con tu primera ficha de partido</b>
    <p>Después de cada jornada, la encuesta te pregunta en un minuto por tus golpes, el juego de tu rival, cómo te encontraste y cómo estaba la pista. Con eso construimos tu mapa de golpes, tu evolución y lo que más te conviene trabajar.</p>
    ${pendingSurveys().length&&own? `<a class="btn brass" href="#encuesta-${pendingSurveys()[0]}">Responder la encuesta de la jornada ${pendingSurveys()[0]}</a>` : ''}</div></div></div>`;
  const data=IX.shots.map(k=>({k, plus:s.mc[k]||0, minus:s.lc[k]||0, use:(s.mc[k]||0)+(s.lc[k]||0), score:s.sc(k)}));
  const arma=data.filter(d=>d.score>0).sort((a,b)=>b.score-a.score||b.use-a.use)[0], weak=data.filter(d=>d.score<0).sort((a,b)=>a.score-b.score||b.use-a.use)[0];
  const pct=x=>Math.round(x/s.n*100);
  const cond=Object.entries(s.cond).map(([v,r])=>({v,...r,g:r.w+r.l,p:r.w/Math.max(1,r.w+r.l)}));
  const best=cond.filter(c=>c.w>0&&c.g>=1).sort((a,b)=>b.p-a.p||b.g-a.g)[0], worst=cond.filter(c=>c.l>0&&c.g>=1&&c.v!==best?.v).sort((a,b)=>a.p-b.p||b.g-a.g)[0];
  const est=Object.entries(s.vsEst).map(([v,r])=>({v,...r,g:r.w+r.l,p:r.w/Math.max(1,r.w+r.l)})).filter(x=>x.g>=1);
  const kryp=est.filter(x=>x.l>0).sort((a,b)=>a.p-b.p||b.g-a.g)[0], fav=est.filter(x=>x.w>0&&x.v!==kryp?.v).sort((a,b)=>b.p-a.p||b.g-a.g)[0];
  const tips=[weak? `<b>${esc(weak.k)}:</b> ${esc(IX_DRILL[weak.k])}` : '', arma? `<b>Tu arma, ${esc(arma.k.toLowerCase())}:</b> constrúyele el punto. Es tu golpe de confianza en el ${pct(s.mc[arma.k]||0)}% de tus partidos.` : '',
    s.fis&&s.fis<3? '<b>Físico:</b> llegas justo a los partidos. Una sesión de resistencia a la semana se nota en el tercer set.' : '',
    kryp&&kryp.g>=2&&kryp.p<.5? `<b>${esc(kryp.v)}:</b> es el tipo de rival que más te cuesta (${ixRec(kryp.w,kryp.l)}). ${esc(IX_STYLE_TIP[kryp.v]||'')}` : ''].filter(Boolean);
  const gauge=(v,lbl,emo)=>{ const w=v? (v-1)/4*100 : 0; return `<div class="ix-gauge"><div class="ix-gk">${emo}</div><div class="ix-gb"><div class="ix-gtrack"><i style="--w:${w.toFixed(0)}%"></i></div><div class="ix-gv"><b>${v? v.toFixed(1) : '–'}</b><small>/5</small> ${esc(lbl)}</div></div></div>`; };
  const fisL=v=>!v?'':v>=4.3?'Llegas muy fino':v>=3.5?'Llegas bien':v>=2.7?'Normal':'Llegas justo';
  const rendL=v=>!v?'':v>=4?'Te ves fuerte':v>=3?'Equilibrado':'Muy autocrítico';
  const bars=IX.shots.map(k=>{ const pl=s.mc[k]||0, mi=s.lc[k]||0; return `<div class="ix-brow"><span class="ix-bl">${mi?`<i style="--w:${(mi/s.n*100).toFixed(0)}%"></i><em>${mi}</em>`:''}</span><b>${esc(k)}</b><span class="ix-br">${pl?`<i style="--w:${(pl/s.n*100).toFixed(0)}%"></i><em>${pl}</em>`:''}</span></div>`; }).join('');
  const hs=Object.entries(s.vsHand);
  return `<div class="ix-rep">${back}${hero}<div class="ix-body">
    <div class="ix-duo">
      ${ixSec(1,'🗺️ Tu mapa de golpes',`<div class="ix-tilt">${ixCourt(data,'self',hand,'S')}</div><div class="ix-legend"><span><i class="lg-good"></i>Confías</span><span><i class="lg-mid"></i>Depende</span><span><i class="lg-bad"></i>Te cuesta</span><span class="ix-mini">Más grande = lo nombras más</span></div>`,'dark')}
      <div class="ix-col">
        <div class="ix-card weapon"><div class="ix-k">⚔️ Tu arma</div><div class="ix-big">${arma? esc(arma.k) : '–'}</div><div class="ix-bar"><i style="--w:${arma? pct(s.mc[arma.k]||0) : 0}%"></i></div><div class="ix-s">${arma? `Golpe de confianza en el <b data-ixc="${pct(s.mc[arma.k]||0)}">${pct(s.mc[arma.k]||0)}</b>% de tus partidos` : 'Marca tus golpes de confianza en la próxima encuesta.'}</div></div>
        <div class="ix-card weak"><div class="ix-k">🛠️ A reforzar</div><div class="ix-big">${weak? esc(weak.k) : '–'}</div><div class="ix-bar"><i style="--w:${weak? pct(s.lc[weak.k]||0) : 0}%"></i></div><div class="ix-s">${weak? `Te cuesta en el <b data-ixc="${pct(s.lc[weak.k]||0)}">${pct(s.lc[weak.k]||0)}</b>% de tus partidos` : 'Sin un golpe flojo claro. Muy bien.'}</div></div>
        <div class="ix-card plan"><div class="ix-k">📋 Tu plan para esta semana</div><ul>${tips.map((t,i)=>`<li style="--d:${(0.5+0.15*i).toFixed(2)}s">${t}</li>`).join('')||'<li>Sigue respondiendo las encuestas: con dos o tres partidos aparecen las pistas.</li>'}</ul></div>
      </div></div>
    <div class="ix-duo">
      ${ixSec(2,'🧬 Tu ADN de golpes',`${ixRadar([{v:s.sc,cls:'ix-pa'},...(s.n>3? [{v:s.sc3,cls:'ix-pb'}] : [])])}<div class="ix-legend"><span><i class="lg-a"></i>Temporada</span>${s.n>3?'<span><i class="lg-b"></i>Últimos 3 partidos</span>':''}<span class="ix-mini">Hacia fuera = más confianza</span></div>`)}
      ${ixSec(3,'📈 Partido a partido',ixTimeline(E))}
    </div>
    <div class="ix-trio">
      <div class="ix-card"><div class="ix-k">Cómo te ves</div>${gauge(s.rend,rendL(s.rend),'🪞')}</div>
      <div class="ix-card"><div class="ix-k">Físico</div>${gauge(s.fis,fisL(s.fis),'💪')}</div>
      <div class="ix-card"><div class="ix-k">Contra zurdos y diestros</div>${hs.length? hs.map(([h,r])=>`<div class="ix-hrow"><span>${h==='Zurdo'?'🫲 Zurdos':'🫱 Diestros'}</span><b>${ixRec(r.w,r.l)}</b></div>`).join('') : '<p class="ix-mini">Marca la mano de tu rival en la encuesta.</p>'}</div>
    </div>
    <div class="ix-duo">
      ${ixSec(4,"🎾 Golpes · <span class='bad-t'>te cuesta</span> vs <span class='good-t'>confías</span>",`<div class="ix-bars">${bars}</div>`)}
      ${ixSec(5,'🧭 Dónde y contra quién rindes',`<div class="ix-cond">${best?`<div class="good"><b>Rindes mejor</b><span>${esc(best.v)}</span><em>${ixRec(best.w,best.l)}</em></div>`:''}${worst?`<div class="bad"><b>Sufres con</b><span>${esc(worst.v)}</span><em>${ixRec(worst.w,worst.l)}</em></div>`:''}${fav?`<div class="good"><b>Tu terreno</b><span>${esc(fav.v)}</span><em>${ixRec(fav.w,fav.l)}</em></div>`:''}${kryp?`<div class="bad"><b>Tu kryptonita</b><span>${esc(kryp.v)}</span><em>${ixRec(kryp.w,kryp.l)}</em></div>`:''}${!best&&!worst&&!fav&&!kryp?'<p class="ix-mini">Aparece cuando marques pista, tiempo y estilo del rival.</p>':''}</div>
        <h3 class="ix-h" style="margin-top:18px">🔑 Qué decide tus partidos</h3>${ixDonut(s.fac)}`)}
    </div>
    <p class="ix-foot">Basado en ${s.n} ${s.n===1?'ficha':'fichas'} de partido que ${own?'has respondido':`ha respondido ${esc(first)}`} después de cada jornada. ${own?'Solo lo ves tú y los capitanes.':'Solo lo ven el jugador y los capitanes.'} La forma combina los últimos cinco resultados, cómo te has visto y cómo has llegado físicamente; es orientativa.</p>
  </div></div>`;
}

/* ---------- Informe del rival: el club ---------- */
function vIxClub(j){
  const f=poloFix(j); if(!f) return vNotFound(); const club=persp(f).rival, list=ixClubRivals(club), hist=teamStats().vs[club];
  const when=`Jornada ${j} · ${fdate(f,{weekday:'long',day:'numeric',month:'long'})}${f.time? ', '+esc(f.time)+' h' : ''} · ${f.home===POLO? 'en casa' : 'fuera'}`;
  const all=list.map(x=>x.a), C=ixClubAgg(club)||{n:0,w:0,l:0,est:{},rd:{},rw:{},facW:{},facL:{}};
  const zurdos=all.filter(a=>ixHand(a)==='zurdo').length, w=all.reduce((t,a)=>t+a.l,0), l=all.reduce((t,a)=>t+a.w,0);
  const hero=ixHero({stamp:'DOSIER · CONFIDENCIAL', kick:'Informe del rival', name:clubName(club), crest:`<span class="ix-crest">${esc(team(club).abbr||'?')}</span>`, sub:esc(when),
    chips:`<span>📋 ${list.length} ${list.length===1?'jugador analizado':'jugadores analizados'} · ${C.n} ${C.n===1?'ficha':'fichas'}</span>${hist?`<span>🤝 Esta temporada ${ixRec(hist.w,hist.l)}</span>`:''}${list.length?`<span>🎾 Nuestros individuales contra ellos ${ixRec(w,l)}</span>`:''}`});
  const back=ixBack('#jornada-'+j,'Jornada '+j);
  if(!list.length && !C.n) return `<div class="ix-rep">${back}${hero}<div class="ix-body"><div class="ix-locked"><div class="ix-lock">🔎</div><b>Todavía no hay informes de jugadores de ${esc(clubName(club))}</b>
    <p>El informe del rival se construye con las fichas de partido del equipo: quién era el rival, si es zurdo, cómo juega, con qué golpes hace daño y dónde se le encuentra el punto débil. ${isPlayed(f)? 'Si respondéis la encuesta de esta jornada, estará listo para la vuelta.' : 'En cuanto alguien del equipo juegue contra ellos y responda la encuesta, aparecerá aquí.'}</p></div></div></div>`;
  const net=(A,B)=>{ const k=IX.shots.filter(x=>(A[x]||0)>(B[x]||0)).sort((p,q)=>((A[q]||0)-(B[q]||0))-((A[p]||0)-(B[p]||0)))[0]; return k? [k,A[k]] : null; };
  const tE=ixTop(C.est), tD=net(C.rd,C.rw), tW=net(C.rw,C.rd), fL=ixTop(C.facL), fW=ixTop(C.facW);
  const keys=[tE? `<li><b>Juegan sobre todo así:</b> ${esc(tE[0].toLowerCase())}. ${esc((s=>s.charAt(0).toUpperCase()+s.slice(1))(String(IX_STYLE_TIP[tE[0]]||'').replace(/^[^:]*:\s*/,'')))}</li>` : '', tW? `<li><b>Por dónde atacarles:</b> ${esc(tW[0].toLowerCase())} (${tW[1]} ${tW[1]===1?'vez':'veces'}).</li>` : '', tD? `<li><b>Lo que más daño nos hace:</b> ${esc(tD[0].toLowerCase())}.</li>` : '', fL&&fW&&fL[0]===fW[0]? `<li><b>Lo que decide contra ellos:</b> ${esc(fL[0].toLowerCase())}, tanto cuando ganamos como cuando perdimos. ${esc(String(IX_FAC_L[fL[0]]||'').replace(/^[^:]*:\s*/,'').replace(/^./,c=>c.toUpperCase()))}</li>` : [fL? `<li><b>Cuando perdimos:</b> ${esc(IX_FAC_L[fL[0]]||fL[0])}</li>` : '', fW? `<li><b>Cuando ganamos:</b> lo decidió ${esc(fW[0].toLowerCase())}.</li>` : ''].join(''), ixCab(C)? `<li><b>De cabeza:</b> ${esc(ixCabLbl(ixCab(C)).replace(' de cabeza','').toLowerCase())} (${ixCab(C).toFixed(1)}/5). ${esc(ixCabTip(ixCab(C)))}</li>` : '', zurdos? `<li><b>${zurdos} ${zurdos===1?'zurdo':'zurdos'}</b> entre los jugadores analizados.</li>` : ''].filter(Boolean).join('');
  const cards=list.map((x,i)=>{ const a=x.a, nm=ixName(a), hd=ixHand(a), sd=ixArma(a), sw=ixWeak(a);
    const faced=Object.entries(a.by).map(([pid,r])=>`${esc(pname(pid).split(' ')[0])} ${r.w>r.l?'le ganó':r.w<r.l?'perdió':'empató'} ${ixRec(r.w,r.l)}`).join(' · ');
    return `<a class="ix-rcard" href="#scout-${j}-${i}" style="--d:${(0.06*i).toFixed(2)}s"><div class="ix-rc-t"><b>${esc(nm)}</b>${hd?`<span class="ix-hb">${hd==='zurdo'?'Zurdo':'Diestro'}</span>`:''}</div>
      <div class="ix-rc-m"><div class="ix-mring" style="--v:${x.t};--c:${ixThreatCol(x.t)}"><span>${x.t}</span></div><div>${sd?`<p><i class="d bad"></i>Arma: <b>${esc(sd)}</b></p>`:''}${sw?`<p><i class="d good"></i>Débil: <b>${esc(sw)}</b></p>`:''}<p class="ix-mini">${faced}</p></div></div>
      <div class="ix-rc-f">${esc(ixThreatLbl(x.t))}<span>Ver informe →</span></div></a>`; }).join('');
  let match='';
  if(canPrivate){ const mates=S.players.filter(p=>p.active!==false).map(p=>({p,s:ixSelf(ixEntries(p.id,ballots?.[p.id]).filter(e=>e.type==='S'))})).filter(x=>x.s);
    const rows=list.map(x=>{ const best=mates.map(m=>{ const ds=IX_DUELS.map(([mine,his,txt])=>({txt,e:m.s.sc(mine)-ixDanger(x.a,his)})).sort((a,b)=>b.e-a.e); const prev=x.a.by[m.p.id]; return {m,sc:ds.slice(0,3).reduce((t,d)=>t+d.e,0)+(prev? 0.4*(prev.w-prev.l) : 0),d:ds[0],prev}; }).sort((a,b)=>b.sc-a.sc)[0];
      return best? `<div class="ix-mrow"><span>${esc(ixName(x.a))}</span><b>${esc(best.m.p.name.split(' ')[0])}</b><em>${best.prev&&best.prev.w? 'ya le ganó · ' : ''}${esc(best.d.txt.toLowerCase())}</em></div>` : ''; }).join('');
    if(rows) match=ixSec(3,'🧩 Quién encaja contra cada uno <span class="ix-cap">solo capitanes</span>',`<div class="ix-match">${rows}</div><p class="ix-note">Orientativo: cruza la confianza de cada jugador del equipo en sus golpes con el arma y el punto débil de cada rival, y suma si ya le ganó. La convocatoria la decides tú.</p>`); }
  return `<div class="ix-rep">${back}${hero}<div class="ix-body">
    ${keys? ixSec(1,'🧠 Claves contra '+esc(team(club).short||clubName(club)),`<ul class="ix-keys">${keys}</ul>`) : ''}
    ${list.length? ixSec(2,'👥 Jugadores analizados',`<div class="ix-rgrid">${cards}</div>`,'flat') : `<p class="ix-note">Las claves salen de ${C.n} ${C.n===1?'ficha':'fichas'} del equipo (individuales y dobles). La ficha de cada jugador rival aparece cuando se pone su nombre en un individual.</p>`}
    ${match}
    <p class="ix-foot">Construido con las fichas de partido de los jugadores del ${esc(US)} que se han enfrentado a ellos. Solo cifras agregadas: nunca se muestran respuestas individuales. Los rivales se identifican por el nombre que pone cada jugador; si un nombre aparece repetido con otra grafía, se cuenta aparte.</p>
  </div></div>`;
}

/* ---------- Informe del rival: el jugador ---------- */
function vIxScout(j, idx){
  const f=poloFix(j); if(!f) return vNotFound(); const club=persp(f).rival, x=ixClubRivals(club)[idx];
  if(!x) return `<div class="wrap">${ixBack('#rival-'+j,'Informe del rival')}<div class="empty">Este informe ya no existe.</div></div>`;
  const a=x.a, nm=ixName(a), hand=ixHand(a)||'diestro', n=a.n;
  const data=IX.shots.map(k=>({k, plus:a.rw[k]||0, minus:a.rd[k]||0, use:(a.rw[k]||0)+(a.rd[k]||0), score:-ixDanger(a,k)}));   // + = atacable, − = su arma
  const ak=ixArma(a), wk=ixWeak(a), arma=ak? [ak,a.rd[ak]] : null, weak=wk? [wk,a.rw[wk]] : null, tE=ixTop(a.est), fL=ixTop(a.facL||{}), fW=ixTop(a.facW||{}), myHand=/zurd/i.test(profiles?.[me]?.hand||'')? 'zurdo' : 'diestro';
  const myS=me? ixSelf(ixEntries(me,myBallot).filter(e=>e.type==='S')) : null;
  const duels=myS? IX_DUELS.map(([mine,his,txt])=>({txt,e:myS.sc(mine)-ixDanger(a,his)})).filter(d=>Math.abs(d.e)>0.01).sort((p,q)=>Math.abs(q.e)-Math.abs(p.e)).slice(0,4) : [];
  const plan=[weak? IX_TIP[weak[0]] : '', arma? IX_AVOID[arma[0]] : '', tE? IX_STYLE_TIP[tE[0]] : '', ixCab(a)? ixCabTip(ixCab(a)) : '', fL? IX_FAC_L[fL[0]] : (fW? `Cuando le ganamos, lo decidió ${fW[0].toLowerCase()}: repite la receta.` : ''),
    hand==='zurdo'? (myHand==='zurdo'? 'Es zurdo como tú: los patrones de siempre cambian de lado; tu derecha cruzada va a su derecha.' : 'Es zurdo: en el lado de ventaja su saque cortado se abre a tu revés. Resta un paso más a la izquierda, entra en diagonal hacia la bola y devuelve cruzado.') : ''].filter(Boolean).slice(0,6);
  const playKeys=[...new Set([...data.filter(d=>d.score>0&&d.k!==ak).sort((p,q)=>q.score-p.score).map(d=>d.k), ak==='Revés'? 'Derecha' : 'Revés'])].filter(k=>IX_PLAYS[k]&&k!==ak).slice(0,2);   // nunca una jugada contra su arma
  const faced=Object.entries(a.by).map(([pid,r])=>`<div class="ix-hrow"><span>${avatar(player(pid))} ${esc(pname(pid))}</span><b class="${r.w>r.l?'good-t':r.w<r.l?'bad-t':''}">${ixRec(r.w,r.l)}</b></div>`).join('');
  const pct=v=>Math.round(v/n*100);
  const hero=ixHero({stamp:'EXPEDIENTE · CONFIDENCIAL', kick:`Informe de scouting · ${clubName(club)}`, name:nm, crest:`<span class="ix-crest">${esc(team(club).abbr||'?')}</span>`,
    sub:`${n} ${n===1?'informe':'informes'} del equipo · jornadas ${a.js.slice().sort((p,q)=>p-q).join(', ')}`,
    chips:`<span>🏆 Contra nosotros ${ixRec(a.w,a.l)}</span>${(a.gF||a.gA)? `<span>🎾 Juegos ${a.gA||0}-${a.gF||0}</span>` : ''}<span>✋ ${hand==='zurdo'?'Zurdo':'Diestro'}</span>${tE?`<span>🎾 ${esc(tE[0])}</span>`:''}${ixCab(a)?`<span>🧠 ${esc(ixCabLbl(ixCab(a)))} · ${ixCab(a).toFixed(1)}/5</span>`:''}${n<2?'<span class="warn">Muestra pequeña</span>':''}`,
    ring:ixRing(x.t,ixThreatLbl(x.t),ixThreatCol(x.t),'AMENAZA')});
  return `<div class="ix-rep">${ixBack('#rival-'+j,'Informe de '+clubName(club))}${hero}<div class="ix-body">
    <div class="ix-duo">
      ${ixSec(1,'🗺️ Su mapa de golpes',`<div class="ix-tilt">${ixCourt(data,'rival',hand,'R')}</div><div class="ix-legend"><span><i class="lg-good"></i>Atacable</span><span><i class="lg-mid"></i>Depende</span><span><i class="lg-bad"></i>Su arma</span><span class="ix-mini">+ punto débil · − le hizo daño al equipo</span></div>`,'dark')}
      <div class="ix-col">
        <div class="ix-card weak"><div class="ix-k">⚔️ Su arma</div><div class="ix-big">${arma? esc(arma[0]) : '–'}</div><div class="ix-bar"><i style="--w:${arma? pct(arma[1]) : 0}%"></i></div><div class="ix-s">${arma? `Nos hizo daño en el <b data-ixc="${pct(arma[1])}">${pct(arma[1])}</b>% de los partidos` : 'Sin datos aún.'}</div></div>
        <div class="ix-card weapon"><div class="ix-k">🎯 Punto débil</div><div class="ix-big">${weak? esc(weak[0]) : '–'}</div><div class="ix-bar"><i style="--w:${weak? pct(weak[1]) : 0}%"></i></div><div class="ix-s">${weak? `Se lo encontramos en el <b data-ixc="${pct(weak[1])}">${pct(weak[1])}</b>% de los partidos` : 'Sin datos aún.'}</div></div>
        <div class="ix-card plan"><div class="ix-k">🧠 Plan de partido</div><ul>${plan.map((t,i)=>`<li style="--d:${(0.5+0.15*i).toFixed(2)}s">${esc(t)}</li>`).join('')||'<li>Sin pistas claras todavía.</li>'}</ul></div>
      </div></div>
    ${playKeys.length? ixSec(2,'📋 Pizarra táctica',`<div class="ix-plays">${playKeys.map((k,i)=>ixPlay(k,hand,i)).join('')}</div><p class="ix-note">La bola amarilla marca el golpe; la línea discontinua, el movimiento.</p>`,'dark') : ''}
    <div class="ix-duo">
      ${duels.length? ixSec(3,'🥊 Tus duelos contra él',`<div class="ix-duels">${duels.map(d=>{ const w=Math.min(50,Math.abs(d.e)*25), good=d.e>0.2, bad=d.e<-0.2;
          return `<div class="ix-duel"><div class="ix-dt">${esc(d.txt)}</div><div class="ix-dbar"><i class="${d.e>=0?'r':'l'}" style="--w:${w.toFixed(0)}%"></i><span class="ix-center"></span></div><div class="ix-dv ${good?'good':bad?'bad':''}">${good?'Ventaja tuya':bad?'Ventaja suya':'Igualado'}</div></div>`; }).join('')}</div><p class="ix-note">Cruza tu confianza en cada golpe (tus fichas) con lo que el equipo dice de él.</p>`)
        : ixSec(3,'🥊 Tus duelos contra él','<p class="ix-mini">Aparecen cuando tengas tus propias fichas de partido: cruzan tus golpes de confianza con su arma y su punto débil.</p>')}
      ${ixSec(4,'🤝 Quién del equipo ha jugado contra él',`${faced}${(fL||fW)? `<h3 class="ix-h" style="margin-top:16px">🔑 Qué decidió los partidos</h3><div class="ix-tags">${Object.entries(a.facL||{}).sort((p,q)=>q[1]-p[1]).map(([v,c])=>`<span class="bad">${esc(v)} <b>${c}</b></span>`).join('')}${Object.entries(a.facW||{}).sort((p,q)=>q[1]-p[1]).map(([v,c])=>`<span class="good">${esc(v)} <b>${c}</b></span>`).join('')}</div><p class="ix-note">En rojo, cuando perdimos; en verde, cuando ganamos.</p>` : ''}${tE? `<h3 class="ix-h" style="margin-top:16px">🎾 Cómo juega</h3><div class="ix-tags">${Object.entries(a.est).sort((p,q)=>q[1]-p[1]).map(([v,c])=>`<span>${esc(v)} <b>${c}</b></span>`).join('')}</div>` : ''}`)}
    </div>
    <p class="ix-foot">Basado en ${n} ${n===1?'ficha':'fichas'} de partido de jugadores del ${esc(US)}. Solo cifras agregadas. El nivel de amenaza combina sus resultados contra el equipo y el balance entre su arma y su punto débil; es orientativo.</p>
  </div></div>`;
}

/* ---------- Accesos desde el resto de la app ---------- */
function ixJornadaCta(j){ const f=poloFix(j); if(!f||!me&&!canPrivate) return ''; const club=persp(f).rival, n=ixClubRivals(club).length;
  return `<a class="ix-cta" href="#rival-${j}"><span class="ix-cta-i">🔎</span><span><b>Informe del rival</b><small>${n? `${n} ${n===1?'jugador':'jugadores'} de ${esc(team(club).short||clubName(club))} analizados: arma, punto débil y plan de partido.` : `Se construye con vuestras fichas de partido contra ${esc(team(club).short||clubName(club))}.`}</small></span><span class="ix-cta-go">→</span></a>`; }
function ixPlayerCta(pid){ if(pid!==me && !canPrivate) return ''; const own=pid===me, n=ixEntries(pid, own? myBallot : ballots?.[pid]).length;
  return `<section class="sec"><a class="ix-cta" href="#informe-${esc(pid)}"><span class="ix-cta-i">📊</span><span><b>${own?'Tu informe de jugador':'Informe de jugador'}</b><small>${n? `${n} ${n===1?'partido analizado':'partidos analizados'}: mapa de golpes, forma, evolución y plan de la semana.` : 'Se desbloquea con la primera ficha de partido de la encuesta.'}${own?'':' Solo capitanes.'}</small></span><span class="ix-cta-go">→</span></a></section>`; }

/* =====================================================================
   5 · ESTILOS (se inyectan una vez)
   ===================================================================== */
function ixCss(){ if(document.getElementById('ix-css')) return; const st=document.createElement('style'); st.id='ix-css'; st.textContent=`
.ix-rep{--ix-bg:#071510;--ix-bg2:#0C2219;--ix-card:#10291F;--ix-line:rgba(226,235,229,.12);--ix-ink:#EAF1EC;--ix-mut:#9DB3A8;--ix-good:#5DBB83;--ix-mid:#E2C47C;--ix-bad:#E5765C;--ix-acc:var(--brass,#D2AE5E);
  background:radial-gradient(120% 60% at 80% 0%,#163C2D 0%,var(--ix-bg) 55%);color:var(--ix-ink);min-height:100vh;padding-bottom:40px;overflow:hidden}
.ix-back{display:inline-block;margin:14px 20px 0;color:var(--ix-mut);text-decoration:none;font-size:.9rem;font-weight:600}
.ix-hero{position:relative;max-width:1080px;margin:0 auto;padding:22px 20px 26px;display:grid;grid-template-columns:auto 1fr auto;gap:22px;align-items:center}
.ix-glow{position:absolute;inset:-40px -10% auto;height:260px;background:radial-gradient(40% 70% at 20% 40%,rgba(210,174,94,.22),transparent 70%);filter:blur(10px);pointer-events:none}
.ix-gridbg{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:28px 28px;mask-image:linear-gradient(#000,transparent);pointer-events:none}
.ix-photo{position:relative;width:118px;height:118px;border-radius:24px;overflow:hidden;background:linear-gradient(145deg,#1E4A38,#0E2A1F);display:grid;place-items:center;box-shadow:0 0 0 2px rgba(210,174,94,.5),0 20px 40px -18px #000}
.ix-photo img{width:100%;height:100%;object-fit:cover}.ix-photo>span{font:800 2.4rem/1 inherit;color:var(--ix-acc)}
.ix-crest{font:800 2rem/1 inherit;letter-spacing:.04em;color:var(--ix-acc)}
.ix-scan{position:absolute;left:20px;top:22px;width:118px;height:118px;border-radius:24px;background:linear-gradient(180deg,transparent 0%,rgba(93,187,131,.35) 50%,transparent 52%);background-size:100% 220%;animation:ixscan 2.6s ease-in-out 2;pointer-events:none;opacity:.8}
@keyframes ixscan{from{background-position:0 120%}to{background-position:0 -120%}}
.ix-ht{position:relative;min-width:0}
.ix-stamp{display:inline-block;font-size:.66rem;font-weight:800;letter-spacing:.18em;color:var(--ix-bad);border:1.5px solid currentColor;border-radius:6px;padding:3px 8px;transform:rotate(-2deg);margin-bottom:8px}
.ix-kick{font-size:.72rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ix-acc)}
.ix-name{margin:4px 0 2px;font-size:clamp(1.9rem,6vw,3.1rem);line-height:1;font-weight:900;font-style:italic;letter-spacing:-.02em;text-transform:uppercase;text-shadow:0 2px 0 rgba(0,0,0,.35)}
.ix-sub{color:var(--ix-mut);font-size:.9rem}
.ix-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.ix-chips span{font-size:.78rem;font-weight:600;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid var(--ix-line)}.ix-chips .warn{color:var(--ix-mid);border-color:rgba(226,196,124,.4)}
.ix-ringbox{position:relative;width:132px;height:132px}.ix-ringbox svg{width:100%;height:100%;transform:rotate(-90deg)}
.ix-ringbox .bg{fill:none;stroke:rgba(255,255,255,.08);stroke-width:8}.ix-ringbox .v{fill:none;stroke-width:8;stroke-linecap:round;stroke-dasharray:263.9;stroke-dashoffset:var(--off);animation:ixring 1.3s var(--ease,ease) both}
@keyframes ixring{from{stroke-dashoffset:263.9}}
.ix-rv{position:absolute;inset:0;display:grid;place-content:center;text-align:center}.ix-rv b{font-size:2.3rem;line-height:1;font-weight:900}.ix-rv span{font-size:.55rem;font-weight:800;letter-spacing:.14em;color:var(--ix-mut)}.ix-rv em{font-style:normal;font-size:.58rem;font-weight:900;letter-spacing:.04em;line-height:1.15;margin:3px auto 0;max-width:84px}
.ix-body{max-width:1080px;margin:0 auto;padding:0 20px}
.ix-duo{display:grid;grid-template-columns:1fr;gap:16px;margin-top:16px}@media(min-width:860px){.ix-duo{grid-template-columns:1fr 1fr}}
.ix-col{display:flex;flex-direction:column;gap:12px}
.ix-trio{display:grid;grid-template-columns:1fr;gap:12px;margin-top:16px}@media(min-width:700px){.ix-trio{grid-template-columns:repeat(3,1fr)}}
.ix-sec,.ix-card{background:var(--ix-card);border:1px solid var(--ix-line);border-radius:18px;padding:16px;animation:ixup .6s var(--ease,ease) both;animation-delay:var(--d,0s)}
.ix-sec.dark{background:linear-gradient(160deg,#0E271D,#0A1C15)}.ix-sec.flat{background:transparent;border:0;padding:0}
@keyframes ixup{from{opacity:0;transform:translateY(16px)}}
.ix-rep.still .ix-sec,.ix-rep.still .ix-card,.ix-rep.still .ix-rcard,.ix-rep.still .ix-heat,.ix-rep.still .ix-spot,.ix-rep.still li,.ix-rep.still .ix-ringbox .v,.ix-rep.still .ix-bar i,.ix-rep.still .ix-bl i,.ix-rep.still .ix-br i,.ix-rep.still .ix-tp{animation:none}
.ix-h{margin:0 0 12px;font-size:.95rem;font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:.02em}
.ix-cap{font-size:.62rem;font-style:normal;letter-spacing:.1em;color:var(--ix-acc);border:1px solid currentColor;border-radius:999px;padding:2px 7px;margin-left:6px;vertical-align:middle}
.ix-tilt{perspective:900px;display:flex;justify-content:center}.ix-court{width:100%;max-width:340px;transform:rotateX(14deg);transform-origin:50% 100%;filter:drop-shadow(0 24px 30px rgba(0,0,0,.5))}
.ix-lines rect,.ix-lines line{fill:none;stroke:rgba(255,255,255,.88);stroke-width:2}.ix-net{stroke:#F5EBDD;stroke-width:3;stroke-dasharray:3 2}
.ix-side{fill:rgba(255,255,255,.35);font-size:9px;font-weight:800;letter-spacing:.3em;text-anchor:middle}.ix-side.big{font-size:15px}
.ix-heat{transform-box:fill-box;transform-origin:center;animation:ixheat 3.2s ease-in-out infinite,ixpop .7s var(--ease,ease) both;animation-delay:var(--d),var(--d);mix-blend-mode:screen}
@keyframes ixheat{50%{transform:scale(1.08);opacity:.85}}@keyframes ixpop{from{transform:scale(.2);opacity:0}}
.ix-spot{animation:ixpop .5s var(--ease,ease) both;animation-delay:var(--d);transform-box:fill-box;transform-origin:center}.ix-spot.off{opacity:.45}
.ix-core{fill:#7F8C86;stroke:#fff;stroke-width:2}.ix-core.t-good{fill:var(--ix-good)}.ix-core.t-mid{fill:var(--ix-mid)}.ix-core.t-bad{fill:var(--ix-bad)}
.ix-lbl{fill:#fff;font-size:10px;font-weight:800;text-anchor:middle;paint-order:stroke;stroke:rgba(0,0,0,.45);stroke-width:3px}
.ix-cnt{fill:rgba(255,255,255,.85);font-size:8.5px;font-weight:700;text-anchor:middle;paint-order:stroke;stroke:rgba(0,0,0,.4);stroke-width:2.5px}
.ix-traj{fill:none;stroke:#F4E04D;stroke-width:2;stroke-dasharray:5 5;opacity:.85}.ix-ring{fill:none;stroke:#F4E04D;stroke-width:2.5;transform-box:fill-box;transform-origin:center;animation:ixping 1.8s ease-out infinite}.ix-ring.r2{animation-delay:.9s}
@keyframes ixping{from{transform:scale(.6);opacity:1}to{transform:scale(1.8);opacity:0}}
.ix-ball{fill:#E6F24A;stroke:#9DA52B;stroke-width:1}.ix-aimtxt{fill:#F4E04D;font-size:11px;font-weight:900;letter-spacing:.06em;text-anchor:middle;paint-order:stroke;stroke:rgba(0,0,0,.5);stroke-width:3px}
.ix-legend{display:flex;flex-wrap:wrap;gap:10px 14px;justify-content:center;margin-top:10px;font-size:.76rem;color:var(--ix-mut)}.ix-legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.lg-good{background:var(--ix-good)}.lg-mid{background:var(--ix-mid)}.lg-bad{background:var(--ix-bad)}.lg-a{background:var(--ix-acc)}.lg-b{background:#6FA8DC}.lg-r{background:var(--ix-acc)}.lg-f{background:#6FA8DC}.lg-w{background:var(--ix-good)}.lg-l{background:var(--ix-bad)}
.ix-mini{font-size:.78rem;color:var(--ix-mut);margin:4px 0 0}.ix-note{font-size:.76rem;color:var(--ix-mut);margin:10px 0 0}
.ix-k{font-size:.7rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--ix-mut)}
.ix-big{font-size:2.1rem;font-weight:900;font-style:italic;text-transform:uppercase;line-height:1.05;margin:4px 0 8px;letter-spacing:-.01em}
.ix-card.weapon .ix-big{color:var(--ix-good);text-shadow:0 0 24px rgba(93,187,131,.35)}.ix-card.weak .ix-big{color:var(--ix-bad);text-shadow:0 0 24px rgba(229,118,92,.35)}
.ix-card.weapon{box-shadow:inset 0 0 0 1px rgba(93,187,131,.35)}.ix-card.weak{box-shadow:inset 0 0 0 1px rgba(229,118,92,.35)}
.ix-card.plan{background:linear-gradient(150deg,#173A2C,#10291F)}.ix-card.plan ul{margin:8px 0 0;padding-left:18px}.ix-card.plan li{margin:6px 0;font-size:.9rem;line-height:1.4;animation:ixup .5s var(--ease,ease) both;animation-delay:var(--d)}
.ix-bar{height:6px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden}.ix-bar i{display:block;height:100%;width:var(--w);background:currentColor;border-radius:inherit;animation:ixgrow 1.1s var(--ease,ease) both .3s}
.ix-card.weapon .ix-bar{color:var(--ix-good)}.ix-card.weak .ix-bar{color:var(--ix-bad)}@keyframes ixgrow{from{width:0}}
.ix-s{font-size:.82rem;color:var(--ix-mut);margin-top:6px}.ix-s b{color:var(--ix-ink)}
.ix-radar{width:100%;max-width:360px;display:block;margin:0 auto}.ix-rg{fill:none;stroke:rgba(255,255,255,.1)}.ix-mid{fill:none;stroke:rgba(255,255,255,.25);stroke-dasharray:3 3}
.ix-rl{fill:var(--ix-mut);font-size:10.5px;font-weight:700;text-anchor:middle}
.ix-pa{fill:rgba(210,174,94,.28);stroke:var(--ix-acc);stroke-width:2.5;animation:ixpop .9s var(--ease,ease) both;transform-origin:150px 140px}
.ix-pb{fill:rgba(111,168,220,.12);stroke:#6FA8DC;stroke-width:2;stroke-dasharray:5 4;animation:ixpop .9s var(--ease,ease) both .3s;transform-origin:150px 140px}
.ix-tl{width:100%;display:block}.ix-one{display:flex;gap:14px;align-items:center;padding:6px 0 10px}.ix-one b{display:block}.ix-one small{color:var(--ix-mut);font-size:.85rem;line-height:1.4}.ix-oneres{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:900;color:#071510}.ix-oneres.w{background:var(--ix-good)}.ix-oneres.l{background:var(--ix-bad)}.ix-tg{stroke:rgba(255,255,255,.08)}.ix-tt{fill:var(--ix-mut);font-size:12px}
.ix-tr{fill:none;stroke:var(--ix-acc);stroke-width:3;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:1200;animation:ixdraw 1.6s ease both .2s}.ix-tf{fill:none;stroke:#6FA8DC;stroke-width:2;stroke-dasharray:6 5;opacity:.9}
@keyframes ixdraw{from{stroke-dashoffset:1200}to{stroke-dashoffset:0}}
.ix-tp{animation:ixpop .5s var(--ease,ease) both;animation-delay:var(--d)}.ix-tp .w{fill:var(--ix-good)}.ix-tp .l{fill:var(--ix-bad)}.ix-tw{fill:#071510;font-size:12px;font-weight:900;text-anchor:middle}
.ix-trd{fill:var(--ix-acc);stroke:#071510;stroke-width:1.5}.ix-tj{fill:var(--ix-mut);font-size:12px;font-weight:700;text-anchor:middle}
.ix-gauge{display:flex;gap:12px;align-items:center;margin-top:8px}.ix-gk{font-size:1.6rem}.ix-gb{flex:1}.ix-gtrack{height:8px;border-radius:8px;background:linear-gradient(90deg,var(--ix-bad),var(--ix-mid),var(--ix-good));position:relative;opacity:.9}
.ix-gtrack i{position:absolute;top:-4px;left:var(--w);width:6px;height:16px;border-radius:3px;background:#fff;box-shadow:0 0 0 2px #071510;transform:translateX(-50%)}.ix-gv{margin-top:6px;font-size:.85rem;color:var(--ix-mut)}.ix-gv b{font-size:1.4rem;color:var(--ix-ink)}
.ix-hrow{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--ix-line);font-size:.9rem}.ix-hrow:last-child{border:0}.ix-hrow span{display:flex;align-items:center;gap:8px}.ix-hrow .av{width:26px;height:26px;font-size:.65rem}
.ix-bars{display:flex;flex-direction:column;gap:7px}.ix-brow{display:grid;grid-template-columns:1fr 78px 1fr;align-items:center;gap:8px;font-size:.82rem}.ix-brow>b{text-align:center}
.ix-bl,.ix-br{height:16px;position:relative;display:flex;align-items:center}.ix-bl{justify-content:flex-end}.ix-bl i,.ix-br i{display:block;height:100%;width:var(--w);border-radius:4px;animation:ixgrow 1s var(--ease,ease) both .2s}
.ix-bl i{background:var(--ix-bad)}.ix-br i{background:var(--ix-good)}.ix-bl em,.ix-br em{font-style:normal;font-size:.72rem;font-weight:800;margin:0 5px;color:var(--ix-mut)}.ix-bl em{order:-1}
.bad-t{color:var(--ix-bad)}.good-t{color:var(--ix-good)}
.ix-cond{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ix-cond>div{border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:2px;border:1px solid var(--ix-line)}
.ix-cond .good{background:rgba(93,187,131,.08)}.ix-cond .bad{background:rgba(229,118,92,.08)}.ix-cond b{font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ix-mut)}.ix-cond span{font-weight:700;font-size:.9rem}.ix-cond em{font-style:normal;font-weight:900;font-size:1.1rem}
.ix-cond .good em{color:var(--ix-good)}.ix-cond .bad em{color:var(--ix-bad)}
.ix-donut{display:flex;gap:14px;align-items:center}.ix-donut svg{width:110px;height:110px;flex:none;transform:rotate(-90deg)}.ix-donut .bg{fill:none;stroke:rgba(255,255,255,.06);stroke-width:12}.ix-seg{fill:none;stroke-width:12}
.ix-donut ul{list-style:none;margin:0;padding:0;font-size:.82rem;flex:1}.ix-donut li{display:flex;align-items:center;gap:6px;padding:2px 0}.ix-donut li i{width:9px;height:9px;border-radius:50%}.ix-donut li b{margin-left:auto}
.ix-plays{display:grid;grid-template-columns:1fr;gap:14px}@media(min-width:700px){.ix-plays{grid-template-columns:1fr 1fr}}
.ix-play{background:rgba(255,255,255,.03);border:1px solid var(--ix-line);border-radius:14px;padding:12px}.ix-play-h{display:flex;gap:8px;align-items:center;margin-bottom:8px}.ix-play-h b{font-style:italic;text-transform:uppercase}
.ix-chip{font-size:.62rem;font-weight:900;letter-spacing:.1em;padding:3px 7px;border-radius:6px;background:var(--ix-acc);color:#071510}
.ix-mini-court{width:100%;max-width:260px;display:block;margin:0 auto}.ix-p{fill:none;stroke:#F4E04D;stroke-width:2.2}.ix-p.m{stroke:#fff;stroke-dasharray:5 5;opacity:.8}
.ix-num circle{fill:#071510;stroke:#F4E04D;stroke-width:1.5}.ix-num text{fill:#F4E04D;font-size:11px;font-weight:900;text-anchor:middle}
.ix-play ol{margin:8px 0 0;padding-left:20px;font-size:.85rem}.ix-play li.m{color:var(--ix-mut)}
.ix-duels{display:flex;flex-direction:column;gap:12px}.ix-dt{font-size:.85rem;font-weight:700;margin-bottom:5px}.ix-dbar{position:relative;height:10px;border-radius:10px;background:rgba(255,255,255,.07)}
.ix-dbar i{position:absolute;top:0;bottom:0;width:var(--w);border-radius:10px;animation:ixgrow 1s var(--ease,ease) both .3s}.ix-dbar i.r{left:50%;background:var(--ix-good)}.ix-dbar i.l{right:50%;background:var(--ix-bad)}
.ix-center{position:absolute;left:50%;top:-3px;bottom:-3px;width:2px;background:rgba(255,255,255,.5)}.ix-dv{font-size:.68rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase;margin-top:4px;color:var(--ix-mut)}.ix-dv.good{color:var(--ix-good)}.ix-dv.bad{color:var(--ix-bad)}
.ix-tags{display:flex;flex-wrap:wrap;gap:6px}.ix-tags span{font-size:.8rem;padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid var(--ix-line)}.ix-tags b{color:var(--ix-acc);margin-left:4px}.ix-tags .bad{border-color:rgba(224,122,98,.5)}.ix-tags .bad b{color:var(--ix-bad)}.ix-tags .good{border-color:rgba(93,187,131,.5)}.ix-tags .good b{color:var(--ix-good)}
.ix-keys{margin:0;padding-left:18px}.ix-keys li{margin:7px 0;line-height:1.45;animation:ixup .5s var(--ease,ease) both}
.ix-rgrid{display:grid;grid-template-columns:1fr;gap:12px}@media(min-width:640px){.ix-rgrid{grid-template-columns:1fr 1fr}}@media(min-width:960px){.ix-rgrid{grid-template-columns:repeat(3,1fr)}}
.ix-rcard{display:flex;flex-direction:column;gap:10px;text-decoration:none;color:inherit;background:linear-gradient(160deg,#133426,#0D241B);border:1px solid var(--ix-line);border-radius:18px;padding:14px;animation:ixup .6s var(--ease,ease) both;animation-delay:var(--d);transition:transform .2s,border-color .2s}
.ix-rcard:hover{transform:translateY(-2px);border-color:rgba(210,174,94,.5)}.ix-rc-t{display:flex;justify-content:space-between;align-items:center;gap:8px}.ix-rc-t b{font-size:1.05rem;font-style:italic;text-transform:uppercase}
.ix-hb{font-size:.66rem;font-weight:800;letter-spacing:.08em;padding:3px 7px;border-radius:6px;background:rgba(255,255,255,.08)}
.ix-rc-m{display:flex;gap:12px;align-items:center}.ix-rc-m p{margin:2px 0;font-size:.85rem}.ix-rc-m .d{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}.ix-rc-m .d.good{background:var(--ix-good)}.ix-rc-m .d.bad{background:var(--ix-bad)}
.ix-mring{flex:none;width:58px;height:58px;border-radius:50%;background:conic-gradient(var(--c) calc(var(--v)*1%),rgba(255,255,255,.08) 0);display:grid;place-items:center}
.ix-mring span{width:46px;height:46px;border-radius:50%;background:#0D241B;display:grid;place-items:center;font-weight:900;font-size:1.05rem}
.ix-rc-f{display:flex;justify-content:space-between;font-size:.68rem;font-weight:900;letter-spacing:.1em;color:var(--ix-mut)}.ix-rc-f span{color:var(--ix-acc);letter-spacing:0;font-size:.8rem}
.ix-match{display:flex;flex-direction:column}.ix-mrow{display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:9px 0;border-bottom:1px solid var(--ix-line)}.ix-mrow:last-child{border:0}
.ix-mrow b{color:var(--ix-good)}.ix-mrow em{grid-column:1 / -1;font-style:normal;font-size:.78rem;color:var(--ix-mut)}
.ix-locked{text-align:center;max-width:560px;margin:24px auto;padding:26px 20px;border:1px dashed rgba(255,255,255,.2);border-radius:20px}.ix-lock{font-size:2.4rem}.ix-locked p{color:var(--ix-mut);line-height:1.5}
.ix-foot{font-size:.75rem;color:var(--ix-mut);margin:20px 0 0;line-height:1.5}
@media(max-width:640px){.ix-hero{grid-template-columns:auto 1fr;gap:14px}.ix-photo,.ix-scan{width:84px;height:84px;border-radius:18px}.ix-ringbox{grid-column:1 / -1;justify-self:center}.ix-big{font-size:1.7rem}}
@media (prefers-reduced-motion: reduce){.ix-rep *{animation:none!important}}
/* Encuesta */
.ix-sv .q{margin-bottom:6px}.ix-tag{display:inline-block;font-weight:700;color:var(--ink);background:var(--surface2);border-radius:999px;padding:2px 10px;margin-right:6px}
.ix-h4{margin:18px 0 8px;font-size:.92rem}.ix-h4 small{font-weight:500;color:var(--muted)}.ix-h4.good{color:var(--win)}.ix-h4.bad{color:var(--loss)}
.ix-hint{font-size:.84rem;color:var(--muted);margin:4px 0 0}.ix-lab{display:block;font-weight:700;margin:14px 0 6px}.ix-lab small{font-weight:500;color:var(--muted)}
.ix-in{width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:var(--surface);font-size:1rem}
.ix-opts{display:flex;flex-wrap:wrap;gap:8px}.ix-o{border:1.5px solid var(--line);background:var(--surface);border-radius:999px;padding:9px 14px;font-weight:600;font-size:.92rem;transition:transform .12s,background .15s}
.ix-o.sm{padding:6px 11px;font-size:.84rem}
@media (max-width:820px){.redit input[name=riv]{grid-column:1 / -1 !important}}.ix-o:active{transform:scale(.96)}.ix-o.on{background:var(--green);border-color:var(--green);color:var(--onGreen)}
/* Accesos */
.ix-cta{display:flex;gap:14px;align-items:center;text-decoration:none;color:#EAF1EC;background:radial-gradient(120% 140% at 100% 0%,#1E4A38,#0B2018);border:1px solid rgba(210,174,94,.35);border-radius:18px;padding:16px 18px;position:relative;overflow:hidden}
.ix-cta::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.08) 50%,transparent 70%);background-size:220% 100%;animation:ixshine 3.5s ease-in-out infinite}
@keyframes ixshine{from{background-position:120% 0}to{background-position:-120% 0}}
.ix-cta-i{font-size:1.7rem}.ix-cta b{display:block;font-size:1.02rem}.ix-cta small{display:block;color:#A9BDB3;font-size:.85rem;line-height:1.35;margin-top:2px}.ix-cta-go{margin-left:auto;font-size:1.3rem;color:var(--brass,#D2AE5E)}
`; document.head.appendChild(st); }

window.IXF={vIxPlayer,vIxClub,vIxScout,ixSteps,ixInit,ixClean,ixStepCard,ixBaseQs,ixQCount,ixTick,ixJornadaCta,ixPlayerCta,ixRivalAgg,ixEntries,ixSelf};
