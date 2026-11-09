x'use strict';
window.__poloBoot = true;
function showFatal(msg, hint){
  const a=document.getElementById('app'); if(!a || a.dataset.ok || a.dataset.fatal) return; a.dataset.fatal='1';
  document.body.classList.add('gate');
  a.innerHTML=`<div class="wrap" style="padding:48px 20px;max-width:640px"><h1 style="font-stretch:72%;font-size:2.2rem;margin:0 0 10px">La app no ha podido arrancar</h1>
    <p class="notice" style="word-break:break-word"><b>Error:</b> ${String(msg||'desconocido').replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</p>
    <p>${hint||'Haz una captura de esta pantalla y pásasela a quien mantiene la app.'}</p></div>`;
}
window.addEventListener('error', e=>showFatal(e.message));
window.addEventListener('unhandledrejection', e=>{ const m=e.reason?.code||e.reason?.message||''; if(/auth\/|firebase|invalid-api-key/i.test(m)) showFatal(m, CONFIG_HINT); });
const CONFIG_HINT='Revisa <b>config.js</b>: los seis valores deben ser exactamente los de Firebase (⚙️ Configuración del proyecto → Tus apps), cada uno entre comillas y con coma al final salvo el último. La primera línea debe ser <code>window.POLO_CONFIG = {</code>.';
/* =========================================================
   POLO A, LLIGA CATALANA 2026-27
   Fuentes oficiales: calendario FCT (grupo 4622), plantilla del capitán,
   clasificación FCT tras la J1.
   Formato: cada eliminatoria la juegan 4 jugadores en 4 individuales.
   Si quedan 2-2 se juega un dobles decisivo. Partidos a dos sets;
   con un set cada uno, tercer set.
   ========================================================= */
const SEASON_ID = '2026-27';
// Equipos del club. Polo A conserva su ruta original (seasons/2026-27); el resto: seasons/<temporada>-<equipo>
const DEFAULT_CLUB_TEAMS=[{id:'polo-a',name:'Absoluto Masculino A',short:'Polo A',cat:'Absoluto',gender:'Masculino'},{id:'polo-b',name:'Absoluto Masculino B',short:'Polo B',cat:'Absoluto',gender:'Masculino'},{id:'fem-a',name:'Absoluto Femenino A',short:'Femenino A',cat:'Absoluto',gender:'Femenino'}];
let teamId=(()=>{ try{ return localStorage.getItem('polo-team')||'polo-a'; }catch(e){ return 'polo-a'; } })();
const docIdFor=(tid,season)=> tid==='polo-a'? season : season+'-'+tid;
let SEASON_PATH = 'seasons/' + docIdFor(teamId, SEASON_ID);
let viewSeason = SEASON_ID;
const POLO = 'polo';
const COMP = { name:'13a Lliga Catalana Absolut i Sènior per Equips', group:'Absolut masculino, Barcelona, Divisió 1', memorial:'Memorial Carlos Punzano' };

const TEAMS0 = [
  {id:'polo',      name:'RC de Polo',            short:'Polo',            abbr:'RCP'},
  {id:'masram',    name:'CE Mas-Ram',            short:'Mas-Ram',         abbr:'MR'},
  {id:'pompeia',   name:'RST Pompeia',           short:'Pompeia',         abbr:'RSTP'},
  {id:'turo',      name:'Club Turò David Lloyd', short:'Turò David Lloyd',abbr:'TDL'},
  {id:'vallparc',  name:'CT Vall Parc',          short:'Vall Parc',       abbr:'VP'},
  {id:'vallhebron',name:"Vall d'Hebron",         short:"Vall d'Hebron",   abbr:'VH'},
  {id:'rctb',      name:'RCT Barcelona-1899',    short:'Barcelona-1899',  abbr:'RCTB'}
];
const FIX0 = [
 [1,'2026-10-17','turo','vallparc',4,1],[1,'2026-10-17','pompeia','polo',5,0],[1,'2026-10-17','masram','vallhebron',4,1],
 [2,'2026-10-31','polo','masram'],[2,'2026-10-31','vallparc','pompeia'],[2,'2026-10-31','rctb','turo'],
 [3,'2026-11-07','pompeia','rctb'],[3,'2026-11-07','masram','vallparc'],[3,'2026-11-07','vallhebron','polo'],
 [4,'2026-11-21','vallparc','vallhebron'],[4,'2026-11-21','rctb','masram'],[4,'2026-11-21','turo','pompeia'],
 [5,'2026-12-12','masram','turo'],[5,'2026-12-12','vallhebron','rctb'],[5,'2026-12-12','polo','vallparc'],
 [6,'2026-12-19','rctb','polo'],[6,'2026-12-19','turo','vallhebron'],[6,'2026-12-19','pompeia','masram'],
 [7,'2027-01-09','vallhebron','pompeia'],[7,'2027-01-09','polo','turo'],[7,'2027-01-09','vallparc','rctb'],
 [8,'2027-01-16','vallparc','turo'],[8,'2027-01-16','polo','pompeia'],[8,'2027-01-16','vallhebron','masram'],
 [9,'2027-01-30','masram','polo'],[9,'2027-01-30','pompeia','vallparc'],[9,'2027-01-30','turo','rctb'],
 [10,'2027-02-13','rctb','pompeia'],[10,'2027-02-13','vallparc','masram'],[10,'2027-02-13','polo','vallhebron'],
 [11,'2027-02-27','vallhebron','vallparc'],[11,'2027-02-27','masram','rctb'],[11,'2027-02-27','pompeia','turo'],
 [12,'2027-03-13','turo','masram'],[12,'2027-03-13','rctb','vallhebron'],[12,'2027-03-13','vallparc','polo'],
 [13,'2027-04-03','polo','rctb'],[13,'2027-04-03','vallhebron','turo'],[13,'2027-04-03','masram','pompeia'],
 [14,'2027-04-10','pompeia','vallhebron'],[14,'2027-04-10','turo','polo'],[14,'2027-04-10','rctb','vallparc']
];
const PLAYERS0 = [
 [1,'Joan Villaseca Sitjar','Joan Villaseca','Absolut',184],[2,'Alvaro Dagoberto Garcia Ramírez','Alvaro Garcia','Absolut',182],
 [3,'Ignacio Corbat Duffo','Ignacio Corbat','Sènior +35',147],[4,'Carlos Rovira Arazuri','Carlos Rovira','Sènior +25',143],
 [5,'Marc Huet Franquet','Marc Huet','Absolut',104],[6,'Carlos Miarnau Pascual','Carlos Miarnau','Sènior +30',54],
 [7,'Carlos Casacuberta Bausili','Carlos Casacuberta','Sènior +35',46],[8,'Alejandro Sanjuan Gancedo','Alejandro Sanjuan','Sènior +30',45],
 [9,'Carlos Franco Alavedra','Carlos Franco','Absolut',41],[10,'Ignacio Velasco Piera','Ignacio Velasco','Sènior +30',40],
 [11,'Pepe Vilar Prat','Pepe Vilar','Absolut',30],[12,'Ricardo Manen De Yzaguirre','Ricardo Manen','Sènior +25',23],
 [13,'Pablo Bosch Garcia','Pablo Bosch','Sènior +30',13],[14,'Pablo Manen De Yzaguirre','Pablo Manen','Sènior +25',10],
 [15,'Ignacio Viola Perez','Ignacio Viola','Sènior +35',3],[16,'Erik Roig Cortasa','Erik Roig','Absolut',1],
 [17,'Pau Masana Preciado','Pau Masana','Sènior +30',0],[18,'Javier Oliver Tarre','Javier Oliver','Sènior +25',0],
 [19,'Antonio Mañas Vilaclara','Antonio Mañas','Sènior +30',0]
];
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const RUBBERS = [{n:1,type:'S',label:'Individual 1'},{n:2,type:'S',label:'Individual 2'},{n:3,type:'S',label:'Individual 3'},{n:4,type:'S',label:'Individual 4'},{n:5,type:'D',label:'Dobles'}];

const DEFAULT_Q = [
 {id:'q_jornada',   scope:'team', type:'scale',  text:'¿Cómo valorarías la jornada del equipo?'},
 {id:'q_ambiente',  scope:'team', type:'scale',  text:'¿Qué nota le das al ambiente del equipo?'},
 {id:'s_rend',      scope:'self', type:'scale',  text:'¿Cómo valorarías tu propio rendimiento?'},
 {id:'s_fisico',    scope:'self', type:'scale',  text:'¿Cómo te has sentido físicamente?'},
 {id:'s_conc',      scope:'self', type:'scale',  text:'¿Cómo valorarías tu nivel de concentración?'},
 {id:'s_actitud',   scope:'self', type:'scale',  text:'¿Cómo valorarías tu actitud competitiva?'},
 {id:'s_mejor',     scope:'self', type:'text',   text:'¿Qué crees que has hecho mejor?'},
 {id:'s_mejorar',   scope:'self', type:'text',   text:'¿Qué deberías mejorar para la próxima jornada?'},
 {id:'o_anecdota',  scope:'open', type:'text',   text:'Una anécdota o un momento de la jornada'}
];
const DEFAULT_MSGS = {
  req: '¡Buenas equipo! 🎾\n\nTenemos eliminatoria contra {rival} el próximo {fecha} a las {hora} ({lugar}).\n\nNecesitamos saber quién está disponible para organizar la convocatoria.\n\nPor favor, responded a través de este enlace antes del {limite}:\n\n{enlace}\n\n¡Vamos Polo!',
  rem: 'Recordatorio 🎾\n\nAún nos falta saber si podéis jugar contra {rival} el {fecha} a las {hora}: {pendientes}.\n\nResponded antes del {limite} aquí:\n{enlace}\n\n¡Gracias!',
  remOne: '¡Hola {nombre}! 🎾 ¿Puedes jugar contra {rival} el {fecha} a las {hora}? Responde antes del {limite} aquí: {enlace}',
  survey: '🎾 Jornada {jornada} terminada: {resultado}.\n\nLos que habéis jugado ({jugadores}), os toca la encuesta postpartido. Son 2 minutos:\n{enlaceEncuesta}\n\n¡Gracias!',
  summary: '🎾 Jornada {jornada}: {resultado}.\n\n{cronica}\n\n{partidos}\n\nTodo en la app: {enlaceJornada}',
  mvp: '🏆 Ya podéis votar al MVP de la jornada {jornada} ({resultado}).\n\nUn voto por cabeza y no vale votarse a uno mismo. Hasta el {limiteMvp}:\n{enlaceMvp}',
  lineup: '📋 Convocatoria jornada {jornada}\n\nPolo contra {rival}, {fecha} a las {hora} ({lugar}).\n\n{lista}\n\nTodo en la app: {enlaceJornada}\n\n¡Vamos Polo!'
};
const AV_LABEL = {yes:'Disponible', no:'No disponible', maybe:'Pendiente de confirmar', none:'Sin respuesta'};
const AV_CHIPS = ['Puedo jugar, pero solo a partir de las 12:00','Tengo molestias','Estoy pendiente de confirmar','Puedo jugar individual o dobles','Prefiero dobles','Llego justo de tiempo'];
const SCOPE_LABEL = {team:'Sobre el equipo', self:'Sobre ti (privado)', open:'Comentarios (privado)'};
const SELF_DIMS = [['s_rend','Rendimiento'],['s_fisico','Estado físico'],['s_conc','Concentración'],['s_actitud','Actitud']];

function seed(){
  return {
    seasonId: SEASON_ID,
    comp: {...COMP},
    rules: {win:3, loss:1, availDays:6, deadlineDays:2, deadlineTime:'21:00', mvpHours:48, teamManage:true, doubles:'always'},
    mvp: {},
    msgs: {...DEFAULT_MSGS},
    teams: TEAMS0.map(t=>({...t})),
    players: PLAYERS0.map(([o,full,short,cat,pts])=>({id:slug(short), order:o, full, name:short, cat, pts, captain: short==='Pablo Bosch', active:true})),
    fixtures: FIX0.map(([j,date,home,away,hs,as])=>({j,date,time:'15:00',home,away,hs:hs??null,as:as??null,status:hs!=null?'official':null})),
    ties: {},
    survey: {closed:{}, questions: DEFAULT_Q.map(q=>({...q}))},
    published: {},
    official: {asOf:1, order:['masram','pompeia','turo','vallparc','polo','vallhebron','rctb']},
    captains: ['pablo-bosch'],
    updatedAt: null
  };
}
function normalize(d){
  const s=seed(); if(!d||typeof d!=='object') return s;
  const o={...s,...d}; o.rules={...s.rules,...(d.rules||{})}; o.survey={...s.survey,...(d.survey||{})};
  o.comp={...s.comp,...(d.comp||{})}; o.msgs={...s.msgs,...(d.msgs||{})};
  if(!o.survey.closed) o.survey.closed={};
  if(!Array.isArray(o.survey.questions)||!o.survey.questions.length) o.survey.questions=s.survey.questions;
  o.survey.questions=o.survey.questions.filter(q=>q.scope!=='peer' && q.type!=='player');
  o.mvp=o.mvp||{};
  for(const k of ['teams','players','fixtures']) if(!Array.isArray(o[k])) o[k]=s[k];
  o.fixtures.forEach(f=>{ if(f.hs!=null && !f.status) f.status= f.j===1? 'official' : 'provisional'; });
  o.memberIds=o.players.filter(p=>p.active!==false).map(p=>p.id);
  o.teams.forEach(t=>{ if(!t.abbr) t.abbr=(TEAMS0.find(x=>x.id===t.id)||{}).abbr||t.short.slice(0,3).toUpperCase(); });
  o.ties=o.ties||{}; o.published=o.published||{}; if(!d.official) o.official=s.official;
  if(!Array.isArray(d.captains)) o.captains=o.players.filter(p=>p.captain).map(p=>p.id);
  o.players.forEach(p=>p.captain=o.captains.includes(p.id));
  Object.values(o.ties).forEach(t=>{ t.rubbers = RUBBERS.map((R,i)=>({n:R.n,type:R.type,polo:[],score:'',res:null,note:'',...(t.rubbers?.[i]||{}), n:R.n, type:R.type})); t.convocados=t.convocados||[]; t.subs=t.subs||[]; t.poster=t.poster||{}; });
  return o;
}

/* ===================== BACKEND: Firebase o vista previa ===================== */
const CFG = window.POLO_CONFIG || {};
const DEL = Symbol('borrar');
const clone = x => x==null? x : JSON.parse(JSON.stringify(x));
function makeDemo(){
  const KEY='polo-preview-v2'; let mem={}; let u=null; const L=[]; let authCb=()=>{};
  try{ mem=JSON.parse(localStorage.getItem(KEY)||'{}'); u=JSON.parse(localStorage.getItem(KEY+'-u')||'null'); }catch(e){}
  const persist=()=>{ try{ const o={}; Object.keys(mem).forEach(k=>{ if(!k.includes('/chunks/')) o[k]=mem[k]; }); localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){} };
  const fire=l=>{ if(l.coll){ const out={}, d=l.path.split('/').length+1; Object.keys(mem).forEach(k=>{ if(k.startsWith(l.path+'/') && k.split('/').length===d) out[k.split('/').pop()]=clone(mem[k]); }); l.cb(out); } else l.cb(clone(mem[l.path]??null)); };
  const emit=()=>setTimeout(()=>L.slice().forEach(fire),0);
  const watch=(path,cb,coll)=>{ const l={path,cb,coll}; L.push(l); setTimeout(()=>fire(l),0); return ()=>{ const i=L.indexOf(l); if(i>=0) L.splice(i,1); }; };
  return {
    mode:'demo',
    onAuth(cb){ authCb=cb; setTimeout(()=>cb(u),0); },
    async signIn(){ u={uid:'preview-user', email:'jugador.prueba@gmail.com', name:'Vista previa'}; try{ localStorage.setItem(KEY+'-u',JSON.stringify(u)); }catch(e){} authCb(u); },
    async signOut(){ u=null; try{ localStorage.removeItem(KEY+'-u'); }catch(e){} authCb(null); },
    watchDoc:(p,cb)=>watch(p,cb,false), watchColl:(p,cb)=>watch(p,cb,true),
    async set(p,d){ mem[p]=clone(d); persist(); emit(); },
    async castVote(base,voter,v){ const vp=base+'/votes/'+voter; if(mem[vp]) throw Object.assign(new Error('ya votado'),{code:'permission-denied'}); mem[vp]={v,at:Date.now()}; const t=mem[base]||{t:{},n:0}; t.t=t.t||{}; t.t[v]=(t.t[v]||0)+1; t.n=(t.n||0)+1; mem[base]=t; persist(); emit(); },
    async annulVote(base,voter,v){ const vp=base+'/votes/'+voter; if(!mem[vp]) return; v=v||mem[vp].v; delete mem[vp]; const t=mem[base]; if(t&&v&&t.t?.[v]){ t.t[v]--; if(!t.t[v]) delete t.t[v]; t.n=Math.max(0,(t.n||1)-1); } persist(); emit(); },
    async update(p,changes){ const doc=mem[p]||{}; Object.entries(changes).forEach(([k,v])=>{ const parts=k.split('.'); let o=doc; parts.slice(0,-1).forEach(x=>{ o[x]=o[x]&&typeof o[x]==='object'? o[x] : {}; o=o[x]; }); const last=parts.at(-1); if(v===DEL) delete o[last]; else o[last]=clone(v); }); mem[p]=doc; persist(); emit(); },
    async del(p){ delete mem[p]; persist(); emit(); },
    async claim(pid){ const c=mem['claims/'+pid]; if(c && c.email!==u.email) throw new Error('Ese nombre ya está elegido'); Object.keys(mem).forEach(k=>{ if(k.startsWith('claims/') && mem[k].email===u.email) delete mem[k]; }); mem['claims/'+pid]={uid:u.uid,email:u.email,at:Date.now()}; mem['users/'+u.uid]={pid,email:u.email}; persist(); emit(); },
    async relink(){ return null; },
    async isAdmin(){ return true; },
    async getDoc(p){ return clone(mem[p]??null); },
    async merge(p,obj){ const deep=(a,b)=>{ Object.entries(b).forEach(([k,v])=>{ if(v&&typeof v==='object'&&!Array.isArray(v)){ a[k]=a[k]&&typeof a[k]==='object'?a[k]:{}; deep(a[k],v); } else a[k]=clone(v); }); return a; }; mem[p]=deep(mem[p]||{},obj); persist(); emit(); },
    async diag(){ return [['Modo','Vista previa: no hay base de datos que comprobar',false]]; },
    async idToken(){ return null; }, async addPushToken(){ return null; },
    async reset(){ mem={}; persist(); emit(); }
  };
}
function makeFirebase(){
  firebase.initializeApp(CFG.firebase); const auth=firebase.auth(); const fs=firebase.firestore();
  try{ fs.enablePersistence({synchronizeTabs:true}).catch(()=>{}); }catch(e){}   // los cambios sin conexión se guardan y se suben al volver la red
  const pathRef=p=>fs.doc(p);
  return {
    mode:'firebase',
    onAuth(cb){ auth.getRedirectResult().catch(e=>toast(authMsg(e))); auth.onAuthStateChanged(x=>cb(x? {uid:x.uid,email:(x.email||'').toLowerCase(),name:x.displayName,photo:x.photoURL} : null)); },
    async signIn(){ const p=new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt:'select_account'});
      try{ await auth.signInWithPopup(p); }catch(e){ if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/web-storage-unsupported'].includes(e.code)) return auth.signInWithRedirect(p); if(e.code!=='auth/popup-closed-by-user' && e.code!=='auth/cancelled-popup-request') toast(authMsg(e)); } },
    signOut:()=>auth.signOut(),
    watchDoc(p,cb){ return pathRef(p).onSnapshot(s=>cb(s.exists? s.data():null), e=>console.warn(p,e.code)); },
    watchColl(p,cb){ return fs.collection(p).onSnapshot(q=>{ const o={}; q.forEach(d=>o[d.id]=d.data()); cb(o); }, e=>console.warn(p,e.code)); },
    set:(p,d)=>pathRef(p).set(clone(d)),
    async diag(seasonPath, body){ const u=auth.currentUser, out=[];
      out.push(['Sesión', u? u.email+(u.emailVerified?'':' (correo sin verificar)') : 'Sin sesión', !!(u&&u.emailVerified)]); if(!u) return out;
      try{ const d=await fs.doc('users/'+u.uid).get(); out.push(['Tu jugador', d.exists? 'Elegido: '+d.data().pid : 'No has elegido tu nombre', d.exists]); }catch(e){ out.push(['Tu jugador','No se puede leer ('+e.code+')',false]); }
      let ad=false; try{ ad=(await fs.doc('admins/'+u.uid).get()).exists || (await fs.doc('admins/'+(u.email||'').toLowerCase()).get()).exists; }catch(e){} out.push(['Administrador', ad? 'Sí' : 'No (no hace falta para editar)', true]);
      let ex=null; try{ ex=(await fs.doc(seasonPath).get()).exists; out.push(['Leer la temporada', ex? 'Correcto' : 'Aún no existe en la base de datos', true]); }catch(e){ out.push(['Leer la temporada','Denegado ('+e.code+')',false]); }
      if(ex===true){ try{ await fs.doc(seasonPath).update({diagAt:Date.now()}); out.push(['Guardar en la temporada','Correcto',true]); }catch(e){ out.push(['Guardar en la temporada','Denegado ('+e.code+')',false]); } }
      else if(ex===false){ try{ await fs.doc(seasonPath).set(clone(body)); out.push(['Crear la temporada','Creada correctamente',true]); }catch(e){ out.push(['Crear la temporada','Denegado ('+e.code+')',false]); } }
      return out; },
    async castVote(base,voter,v){ const b=fs.batch(), inc=firebase.firestore.FieldValue.increment(1);
      b.set(fs.doc(base+'/votes/'+voter),{v,at:Date.now()}); b.set(fs.doc(base),{t:{[v]:inc},n:inc},{merge:true}); return b.commit(); },
    async annulVote(base,voter,v){ const b=fs.batch(), dec=firebase.firestore.FieldValue.increment(-1);
      b.delete(fs.doc(base+'/votes/'+voter)); if(v) b.set(fs.doc(base),{t:{[v]:dec},n:dec},{merge:true}); return b.commit(); },
    update:(p,changes)=>{ const o={}; Object.entries(changes).forEach(([k,v])=>o[k]= v===DEL? firebase.firestore.FieldValue.delete() : clone(v)); return pathRef(p).update(o); },
    del:(p)=>pathRef(p).delete(),
    async claim(pid){ const u=auth.currentUser; const email=(u.email||'').toLowerCase(); const b=fs.batch();
      b.set(fs.doc('claims/'+pid),{uid:u.uid,email,at:Date.now()}); b.set(fs.doc('users/'+u.uid),{pid,email}); await b.commit(); },
    async relink(){ const u=auth.currentUser; const email=(u.email||'').toLowerCase(); const q=await fs.collection('claims').where('email','==',email).limit(1).get();
      if(q.empty) return null; const d=q.docs[0];
      if(d.data().uid!==u.uid){ const b=fs.batch(); b.set(d.ref,{uid:u.uid,email,at:Date.now()}); b.set(fs.doc('users/'+u.uid),{pid:d.id,email}); await b.commit(); }
      return d.id; },
    async idToken(){ return auth.currentUser? auth.currentUser.getIdToken() : null; },
    async getDoc(p){ const x=await fs.doc(p).get(); return x.exists? x.data() : null; },
    merge:(p,obj)=>pathRef(p).set(clone(obj),{merge:true}),
    async addPushToken(pid,token){ return fs.doc('pushTokens/'+pid).set({tokens:firebase.firestore.FieldValue.arrayUnion(token),at:Date.now()},{merge:true}); },
    async isAdmin(email,uid){ try{ const [a,b]=await Promise.all([fs.doc('admins/'+uid).get(), fs.doc('admins/'+email).get()]); return a.exists||b.exists; }catch(e){ return false; } }
  };
}
function authMsg(e){ if(e?.code==='auth/unauthorized-domain') return 'Este dominio no está autorizado en Firebase > Authentication > Configuración'; return 'No se ha podido entrar: '+(e?.code||e?.message||'error'); }
let B;
if(CFG.firebase && CFG.firebase.apiKey && !window.firebase){ showFatal('No se han podido cargar las librerías de Firebase.', 'Comprueba la conexión a internet y que index.html incluye las tres líneas de gstatic.com/firebasejs.'); throw new Error('firebase-missing'); }
try{ B = (window.firebase && CFG.firebase && CFG.firebase.apiKey) ? makeFirebase() : makeDemo(); }
catch(e){ showFatal(e.code||e.message, CONFIG_HINT); throw e; }

/* ===================== ESTADO ===================== */
let S = seed();
let authUser=null, authReady=false, me=null, isAdmin=false, adminSkip=false, isCaptain=false, canManage=false;
let profiles={}, installEvt=null, pushState=null, myVotes={}, mvpVotes={}, mvpSubs=[], mvpKeys='';
let canPrivate=false;   // datos privados (respuestas individuales, comentarios, quién votó a quién): solo administradores y capitanes marcados
const teamMode = () => S.rules?.teamManage !== false;
function updRoles(){ isCaptain=!!(me && (S.captains||[]).includes(me)); canPrivate=isAdmin||isCaptain; canManage=canPrivate || isManager || (teamMode() && !!me && (!S.memberIds?.length || S.memberIds.includes(me))); return canManage; }
let claims={}, avail={}, picks={}, ballots={}, myBallot=null, notes={}, photos={}, phones={}, meta=null;
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
  if(!(r.polo||[]).length) errs.push('Falta el jugador del Polo'); if(r.type==='D' && (r.polo||[]).length<2) errs.push('Falta la pareja de dobles');
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
function participants(j){ const t=tie(j); const played=new Set(); (t?.rubbers||[]).forEach(r=>{ if(rubberCalc(r).res) (r.polo||[]).forEach(p=>played.add(p)); }); return played.size? [...played] : convocados(j); }
function pendingSurveys(){
  if(!me) return [];
  return playedJornadas().filter(j=>{ const f=poloFix(j); if(!f) return false; const k=jid(j);
    return !S.survey.closed?.[k] && tie(j) && participants(j).includes(me) && !myBallot?.j?.[k]; });
}

/* ---------- Estadísticas ---------- */
// kind 'S' = individuales (por defecto, base de todas las estadísticas principales); 'D' = dobles, siempre aparte
function playerStats(pid, onlyJ, kind='S'){
  const st={pid,kind,partners:{},pj:0,w:0,l:0,sw:0,sl:0,gw:0,gl:0,tbW:0,tbL:0,seq:[],byJ:{},byPos:{},three:{w:0,l:0},dbl:{w:0,l:0},comebacks:0,bagels:0,tbs:0,jornadas:new Set(),matches:[],vs:{}};
  for(let j=1;j<=NJ();j++){ if(onlyJ&&onlyJ!==j) continue; const t=tie(j); if(!t) continue; const f=poloFix(j);
    t.rubbers.forEach(r=>{ if(r.type!==kind || !(r.polo||[]).includes(pid)) return; const c=rubberCalc(r); if(!c.res) return; const W=c.res==='W';
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
  let s = p.ps>p.rs? `El Polo ${p.rs===0?'arrasa':'se impone'} ${p.ps}-${p.rs} ${where}` : `El Polo ${p.ps===0?'cae con claridad':'cae'} ${p.ps}-${p.rs} ${where}`;
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
  const src = photos[p.id]?.d;
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
    return `<span class="board-n ${us?'us':''}">${esc(us? 'Polo' : team(id).short)}${id===f.home?'<i class="loc">Local</i>':''}</span>${cells}<span class="board-t ${tot==='–'?'dim':''}">${tot}</span>`; }).join('');
  const status = isPlayed(f)? (f.status==='official'? 'Final' : 'Final, provisional') : (t&&t.decided? '<span class="live">En juego</span>' : countdown(f));
  return `<a class="board ${big?'big':''}" href="#jornada-${f.j}">
    <div class="board-top"><b>Jornada ${f.j}</b><span>${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h</span><span>${status}</span></div>
    <div class="board-grid"><span></span>${RUBBERS.map(R=>`<span class="board-h">${R.type==='D'?'D':R.n}</span>`).join('')}<span class="board-h">Total</span>${rows}</div>
    <div class="board-foot"><span>${p.home? 'En casa, Real Club de Polo' : 'Fuera, en las pistas del '+esc(clubName(p.rival))}</span><span>${big?'':'Ver jornada'}</span></div></a>`;
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

/* ===================== VISTAS ===================== */
/* ---------- Portada por perfiles: diseño propio, con su estilo incluido en la app ---------- */
const IC={cal:'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
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
    <div class="hx-match"><div class="hx-side">${crest(POLO,'lg')}<b>Polo</b></div><div class="hx-vs"><span>${p.home?'en casa':'fuera'}</span><b>vs</b><em>${esc(whenTxt(f))}</em></div><div class="hx-side">${crest(p.rival,'lg')}<b>${esc(clubName(p.rival))}</b></div></div>
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
  const photo = `${courtSVG()}<span class="ball" aria-hidden="true"></span>${photos._team?.d?`<div class="hero-media"><img src="${esc(photos._team.d)}" alt="Equipo masculino absoluto del Real Club de Polo"></div>`:''}`;
  let h=`<section class="hero">${photo}<div class="wrap hero-in">
    <p class="hero-comp">${esc(S.comp.name)}, ${esc(S.comp.group)}</p>
    <h1 class="hero-title" aria-label="${esc(teamLabel())}">${titleLetters(teamLabel())}</h1>
    <p class="hero-sub">Real Club de Polo de Barcelona, temporada ${esc(S.seasonId||viewSeason)}</p>
    ${nx? scoreboard(nx) : ''}</div></section><div class="wrap">`;
  // 1) capitán: centro de operaciones  2) tareas del jugador  3) su próxima jornada  4) resultados  5) clasificación  6) sus números  7) actividad
  ui.homeMyj=true; const co=callouts(nx); ui.homeMyj=false;
  h+=appsNudge()+opsCard()+myJornadaBlock(nx)+(co? `<section class="sec"><div class="sec-h"><h2>Tienes pendiente</h2></div><div class="tasks">${co}</div></section>` : '');
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
  ps.forEach(j=>{ h+=`<div class="callout"><div><b>Encuesta de la jornada ${j}</b><span>Jugaste contra ${esc(clubName(persp(poloFix(j)).rival))}. Tardas dos minutos.</span></div><div class="row"><a class="btn light" href="#encuesta-${j}">Responder</a></div></div>`; });
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
function ligaCalendar(){
  const nx=nextPoloFix(); let h=`<section class="sec"><div class="sec-h"><h2>Calendario</h2><div class="chips"><button class="chip" data-act="liga-filter" data-v="0" aria-pressed="${!ui.ligaAll}">Solo el ${esc(teamLabel())}</button><button class="chip" data-act="liga-filter" data-v="1" aria-pressed="${ui.ligaAll}">Todo</button></div></div><ul class="jlist stagger">`;
  const jOrder = ui.ligaAll? Array.from({length:NJ()},(_,i)=>i+1) : Array.from({length:NJ()},(_,i)=>i+1).sort((a,b)=>{ const fa=poloFix(a)||S.fixtures.find(f=>f.j===a), fb=poloFix(b)||S.fixtures.find(f=>f.j===b); return (fa&&fb? kickoff(fa)-kickoff(fb) : 0)||a-b; });
  for(const j of jOrder){ const fs=S.fixtures.filter(f=>f.j===j), pf=fs.find(f=>f.home===POLO||f.away===POLO), d=pf||fs[0]; if(!d) continue;
    if(!ui.ligaAll){ if(pf){ const p=persp(pf);
        h+=`<li><a class="jrow ${nx&&nx.j===j?'next':''}" href="#jornada-${j}"><span class="jn">${j}<small>${esc(fdate(d))}</small></span><span><span class="vs">${p.home?'Polo contra '+esc(clubName(p.rival)):esc(clubName(p.rival))+' contra Polo'}</span><div class="meta">${p.home?'En casa':'Fuera'}, ${esc(d.time)} h ${movedTag(pf)}</div></span><span class="score">${p.played?`${resBadge(p.ps>p.rs?'W':'L')} ${pf.hs}-${pf.as}`:'<span class="muted small">Pendiente</span>'}</span></a></li>`;
      } else h+=`<li><a class="jrow rest" href="#jornada-${j}"><span class="jn">${j}<small>${esc(fdate(d))}</small></span><span class="vs">Descansa el Polo</span><span></span></a></li>`;
    } else h+=`<li style="padding:12px 0;border-bottom:1px solid var(--line)"><a href="#jornada-${j}" style="text-decoration:none;display:flex;justify-content:space-between"><b>Jornada ${j}</b><span class="muted small">${esc(fdate(d,{weekday:'long',day:'numeric',month:'long'}))}</span></a>
      <table style="margin-top:4px"><tbody>${fs.map(f=>`<tr class="${f===pf?'us':''}"><td>${esc(team(f.home).name)} <span class="muted">contra</span> ${esc(team(f.away).name)}</td><td>${isPlayed(f)?`<b>${f.hs}-${f.as}</b>`:'<span class="muted">Pendiente</span>'}</td></tr>`).join('')}${pf?'':'<tr><td class="muted">Descansa: Polo</td><td></td></tr>'}</tbody></table></li>`; }
  return h+`</ul><p class="source">Fuente: calendario oficial FCT${fctAgo()? `, resultados actualizados ${esc(fctAgo())}` : ''}.</p></section>`;
}
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
  if(!pf) h+=`<section class="sec"><div class="empty">El Polo descansa en esta jornada.</div></section>`;
  else { const p=persp(pf), c=cronica(j), t=tie(j);
    h+=`<section class="sec">${scoreboard(pf,true)}${c?`<p class="cronica">${esc(c.txt)}<small>Crónica generada a partir de los resultados confirmados.${c.partial?' Faltan los resultados individuales.':''}</small></p>`:''}</section>`;
    if(isPlayed(pf)) h+=`<section class="sec">${mvpCard(j)}${t?.moment?`<p class="cronica" style="font-size:1rem"><b>Momento de la jornada.</b> ${esc(t.moment)}</p>`:''}</section>`;
    const pst=posters(j);
    if(lineupVisible(j) && lineupList(j).length) h+=`<section class="sec"><div class="sec-h"><h2>Convocatoria</h2>${canManage&&!t.lineupPub?'<span class="muted small">Borrador, solo la ven los administradores</span>':''}</div>${lineupStrip(j)}<div class="row" style="margin-top:14px"><button class="btn" data-act="poster-open" data-j="${j}">Ver el cartel</button>${canManage?`<button class="btn ghost sm" data-act="go-admin" data-j="${j}" data-t="conv">Editar</button>`:''}</div></section>`;
    h+=`<section class="sec"><div class="sec-h"><h2>Partidos</h2></div>${pst? pst+`<div style="margin-top:14px">${t.rubbers.map((r,i)=>rubberRow(r,i,pf)).join('')}</div>` : '<div class="empty">El orden de juego aparecerá cuando el capitán publique la convocatoria.</div>'}</section>`;
    if(!isPlayed(pf)) h+=`<section class="sec"><div class="sec-h"><h2>Disponibilidad</h2>${canManage?`<button class="textlink" data-act="go-admin" data-j="${j}" data-t="disp">Panel del capitán</button>`:''}</div>${availBlock(pf)}</section>`;
    if(pendingSurveys().includes(j)) h+=`<section class="sec"><div class="callout"><div><b>Tu encuesta de esta jornada</b><span>Solo la responden quienes jugaron.</span></div><div class="row"><a class="btn light" href="#encuesta-${j}">Responder</a></div></div></section>`;
    const hist=teamStats().vs[p.rival];
    h+=`<section class="sec"><div class="sec-h"><h2>Contra ${esc(clubName(p.rival))}</h2></div>${crest(p.rival,'')}${hist? `<p>Esta temporada: ${hist.w} ${hist.w===1?'victoria':'victorias'} y ${hist.l} ${hist.l===1?'derrota':'derrotas'}, ${hist.rw}-${hist.rl} en partidos.</p>`:'<p class="muted">Primer enfrentamiento de la temporada.</p>'}</section>`; }
  h+=`<section class="sec"><div class="sec-h"><h2>Resto de la jornada</h2></div><table><tbody>${fs.filter(f=>f!==pf).map(f=>`<tr><td>${esc(team(f.home).name)} <span class="muted">contra</span> ${esc(team(f.away).name)}</td><td>${isPlayed(f)?`<b>${f.hs}-${f.as}</b>`:'<span class="muted">Pendiente</span>'}</td></tr>`).join('')}</tbody></table><p class="source">Fuente: FCT.</p></section></div>`;
  return h;
}
const PORRA_OPTS=[[4,0],[3,1],[3,2],[2,3],[1,3],[0,4]];
function porraBlock(f){
  const k=jid(f.j), locked=Date.now()>=kickoff(f).getTime(), p=persp(f), mine=me? picks[me]?.j?.[k] : null;
  const all=Object.entries(picks).map(([pid,v])=>({pid,pk:v.j?.[k]})).filter(x=>x.pk);
  let h='';
  if(!locked && me) h+=`<p class="muted small">¿Cómo acabará? Se cierra al empezar la jornada.</p><div class="chips" style="margin:10px 0">${PORRA_OPTS.map(([a,b])=>`<button class="chip" data-act="pick" data-j="${f.j}" data-p="${a}" data-r="${b}" aria-pressed="${mine&&mine.p===a&&mine.r===b}">Polo ${a}-${b}</button>`).join('')}</div>`;
  if(all.length) h+=`<table class="stagger" style="margin-top:6px"><tbody>${all.map(x=>{ let pts=''; if(isPlayed(f)){ const s=porraPoints(x.pk,p); pts=`<b>${s} ${s===1?'punto':'puntos'}</b>`; } return `<tr><td>${plink(x.pid)}</td><td>Polo ${x.pk.p}-${x.pk.r}</td><td>${pts}</td></tr>`; }).join('')}</tbody></table>`;
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
  ${fichaDisplay(id, own)}
  <section class="sec"><div class="split cardsplit"><div class="cardcol">${playerCard(id)}<p class="source" style="text-align:center">Índice Polo: se calcula solo con sus resultados, su disponibilidad y los votos publicados. Se recalcula cada jornada. No es un ranking oficial.</p></div>
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
  <div class="chips" style="margin-top:18px">${tabs.map(([k,l])=>`<button class="chip" data-act="stats-tab" data-v="${k}" aria-pressed="${ui.statsTab===k}">${l}</button>`).join('')}</div>`;
  return h+(ui.statsTab==='equipo'?statsEquipo():ui.statsTab==='jugadores'?statsJugadores():ui.statsTab==='disponibilidad'?statsDisponibilidad():ui.statsTab==='mvp'?`<section class="sec">${mvpRanking(false)}</section>${statsMvpHistory()}`:ui.statsTab==='rankings'?statsRankings():statsRecords())+`</div>`;
}
function statsEquipo(){
  const ts=teamStats(), evo=playedJornadas().map(j=>({j,v:standings(j).find(r=>r.id===POLO).pos}));
  let h=`<section class="sec"><div class="figs stagger"><div class="fig"><b>${ts.tw}-${ts.tl}</b><span>eliminatorias</span></div><div class="fig"><b>${ts.rw+ts.rl? count(pct(ts.rw,ts.rw+ts.rl),'%'):'–'}</b><span>partidos ganados (${ts.rw}-${ts.rl})</span></div><div class="fig"><b>${ts.sw}-${ts.sl}</b><span>sets</span></div><div class="fig"><b>${ts.dbl.w}-${ts.dbl.l}</b><span>dobles decisivos</span></div></div>
    <p class="source">Eliminatorias y partidos: marcador oficial. Sets, juegos y dobles: partidos con marcador introducido.</p></section>
  <section class="sec"><div class="sec-h"><h2>Partidos por jornada</h2></div>${barsChart(ts.byJ.map(b=>({j:b.j,a:b.ps,b:b.rs})))}<div class="legend"><span><i style="background:var(--win)"></i>Ganados</span><span><i style="background:var(--loss)"></i>Perdidos</span></div></section>
  <section class="sec"><div class="split"><div><div class="sec-h"><h2>Contra cada club</h2></div><table><tbody class="stagger">${S.teams.filter(t=>t.id!==POLO).map(t=>{ const v=ts.vs[t.id]; return `<tr><td>${esc(t.name)}</td><td>${v?v.w+'-'+v.l:'<span class="muted">Pendiente</span>'}</td><td>${v?v.rw+'-'+v.rl:''}</td></tr>`; }).join('')}</tbody></table></div>
  <div><div class="sec-h"><h2>Posición</h2></div>${evo.length? lineChart(evo,{invert:true,min:1,max:S.teams.length,unit:'º',h:200}):'<div class="empty">Sin datos.</div>'}</div></div></section>`;
  const sv=Object.entries(S.published).filter(([,p])=>p.ratings?.q_jornada).map(([k,p])=>({j:+k.slice(1),v:p.ratings.q_jornada}));
  if(sv.length) h+=`<section class="sec"><div class="sec-h"><h2>Nota del equipo a cada jornada</h2></div>${lineChart(sv,{min:1,max:10,h:160})}<p class="source">Media de la encuesta publicada.</p></section>`;
  return h;
}
function statsJugadores(){
  const kind=ui.statKind||'S', rows=S.players.filter(p=>p.active!==false).map(p=>({p,st:playerStats(p.id,null,kind)})), key=ui.sortKey;
  const val=r=> key==='wr'? wilson(r.st.w,r.st.pj) : key==='sd'?r.st.sw-r.st.sl : key==='gd'?r.st.gw-r.st.gl : key==='pj'?r.st.pj : key==='streak'?r.st.bestStreak : r.st.w;
  rows.sort((a,b)=>val(b)-val(a)||b.st.pj-a.st.pj||a.p.order-b.p.order);
  const th=(k,l)=>`<th><button data-act="sort" data-v="${k}">${l}${key===k?' ↓':''}</button></th>`;
  let h=`<section class="sec"><div class="chips"><button class="chip" data-act="stat-kind" data-v="S" aria-pressed="${kind==='S'}">Individuales</button><button class="chip" data-act="stat-kind" data-v="D" aria-pressed="${kind==='D'}">Dobles</button></div>
    <p class="muted small" style="margin:8px 0 0">${kind==='S'? 'Estadística principal: solo partidos individuales. Los dobles se consultan aparte.' : 'Solo dobles. No influyen en las estadísticas individuales.'} El orden por % tiene en cuenta cuántos partidos ha jugado cada uno.</p>
    <div class="tscroll" style="margin-top:10px"><table><thead><tr><th>Jugador</th>${th('pj','PJ')}${th('w','G')}<th>P</th>${th('wr','%')}${th('sd','Sets')}${th('gd','Juegos')}${kind==='S'? th('streak','Mejor racha')+'<th class="l">Forma</th>' : '<th class="l">Parejas</th>'}</tr></thead><tbody class="stagger">
    ${rows.filter(r=>kind==='S'||r.st.pj).map(({p,st})=>`<tr><td>${plink(p.id)}</td><td>${st.pj}</td><td>${st.w}</td><td>${st.l}</td><td>${st.pj?pct(st.w,st.pj)+'%':'–'}</td><td>${st.sw}-${st.sl}</td><td>${st.gw}-${st.gl}</td>${kind==='S'? `<td>${st.bestStreak}</td><td class="l">${formStrip(st.seq)}</td>` : `<td class="l small">${Object.entries(st.partners).map(([m,v])=>esc(pname(m).split(' ')[0])+' '+v.w+'-'+v.l).join(', ')}</td>`}</tr>`).join('') || `<tr><td colspan="8" class="muted">Aún no se han jugado ${kind==='S'?'individuales':'dobles'}.</td></tr>`}</tbody></table></div></section>`;
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
  const pairList=Object.entries(pairs).map(([k,v])=>({ids:k.split('|'),v,n:v.w+v.l})).sort((a,b)=>wilson(b.v.w,b.n)-wilson(a.v.w,a.n)||b.v.w-a.v.w).slice(0,5);
  return `<section class="sec"><select data-act="rank-filter" style="max-width:280px"><option value="season">Temporada ${esc(S.seasonId||viewSeason)} completa</option>${Array.from({length:NJ()},(_,i)=>i+1).filter(j=>poloFix(j)).map(j=>`<option value="${j}" ${ui.rankFilter==j?'selected':''}>Jornada ${j}</option>`).join('')}</select></section>
  <section class="sec"><div class="sec-h"><h2>Individuales</h2><span class="muted small">La estadística principal</span></div><div class="rgrid">
    ${mk('Victorias individuales','Individuales ganados.',id=>S_(id).w||null,v=>v,id=>'de '+S_(id).pj)}
    ${mk('Win rate individual','Ordenado con un intervalo de confianza: con pocos partidos, el % pesa menos.',id=>{ const s=S_(id); return s.pj? pct(s.w,s.pj) : null; },v=>v+'%',id=>{ const s=S_(id); return s.w+'-'+s.l; },id=>{ const s=S_(id); return wilson(s.w,s.pj); })}
    ${mk('Individuales disputados','Partidos individuales jugados.',id=>S_(id).pj||null)}
    ${mk('Mejor racha individual','Victorias seguidas en individuales.',id=>playerStats(id).bestStreak||null)}
    ${mk('Consistencia','Jornadas con balance positivo o igualado en individuales, mínimo 2.',id=>{ const s=S_(id); return s.njor>=2?Math.round(s.consist*100):null; },v=>v+'%')}
    ${mk('Evolución','Win rate individual de sus 3 últimas jornadas frente a las anteriores, mínimo 4.',id=>f?null:evo(id),v=>(v>0?'+':'')+v)}</div></section>
  <section class="sec"><div class="sec-h"><h2>Dobles</h2><span class="muted small">Ranking independiente</span></div><div class="rgrid">
    ${mk('Victorias en dobles','Dobles ganados.',id=>D_(id).w||null,v=>v,id=>'de '+D_(id).pj)}
    ${mk('Win rate en dobles','Mismo criterio de confianza.',id=>{ const s=D_(id); return s.pj? pct(s.w,s.pj) : null; },v=>v+'%',id=>{ const s=D_(id); return s.w+'-'+s.l; },id=>{ const s=D_(id); return wilson(s.w,s.pj); })}
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
  const bt=ts.byJ.slice().sort((a,b)=>(b.ps-b.rs)-(a.ps-a.rs))[0]; if(bt&&bt.ps>bt.rs) recs.push(['Mayor victoria por equipos',`Polo ${bt.ps}-${bt.rs} ${clubName(bt.rival)}, J${bt.j}`]);
  const lg=all.slice().sort((a,b)=>(b.c.gw+b.c.gl)-(a.c.gw+a.c.gl))[0]; if(lg) recs.push(['Partido con más juegos',`${lg.r.polo.map(pname).join(' y ')}: ${lg.c.sets.map(s=>s.join('-')).join(' ')}, J${lg.j}`]);
  let t=top(s=>s.bestStreak); if(t&&t.v>=2) recs.push(['Racha más larga en individuales',`${t.p.name}, ${t.v} victorias seguidas`]);
  t=top(s=>s.bagels); if(t&&t.v) recs.push(['Más sets ganados 6-0',`${t.p.name}, ${t.v}`]);
  t=top(s=>s.comebacks); if(t&&t.v) recs.push(['Más remontadas',`${t.p.name}, ${t.v}`]);
  t=top(s=>s.three.w); if(t&&t.v) recs.push(['Más victorias a tres sets',`${t.p.name}, ${t.v}`]);
  const mv=S.players.map(p=>({p,v:mvpCount(p.id)})).sort((a,b)=>b.v-a.v)[0]; if(mv&&mv.v) recs.push(['Más veces MVP',`${mv.p.name}, ${mv.v}`]);
  const pr={}; S.players.forEach(p=>Object.entries(playerStats(p.id,null,'D').partners).forEach(([m,v])=>{ pr[[p.id,m].sort().join('|')]=v; })); const bp=Object.entries(pr).sort((a,b)=>(b[1].w-b[1].l)-(a[1].w-a[1].l))[0];
  if(bp && bp[1].w) recs.push(['Mejor pareja de dobles',`${bp[0].split('|').map(pname).join(' y ')}, ${bp[1].w}-${bp[1].l}`]);
  const nThree=all.filter(x=>x.c.three).length, nTb=sum(all.map(x=>x.c.tbs));
  return `<section class="sec"><div class="sec-h"><h2>Récords de la temporada</h2></div>${recs.length? `<table><tbody class="stagger">${recs.map(([a,b])=>`<tr><td class="muted">${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">Los récords aparecerán cuando haya resultados individuales.</div>'}</section>
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
    <div class="avhead">${crest(p.rival,'')}<div><h1 class="q" style="margin:0">Polo contra ${esc(clubName(p.rival))}</h1><p class="muted" style="margin:4px 0 0">${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h. ${p.home?'En casa.':'Fuera, en las pistas del '+esc(clubName(p.rival))+'.'}</p></div></div>
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
  return `<section class="sec"><p class="lede">Disponibilidad declarada frente a convocatoria. Cuentan las jornadas del Polo con el plazo cerrado o ya disputadas (${js.length}). «Sin respuesta» se cuenta aparte de «No disponible».</p></section>
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
/* ===================== MI FICHA DE JUGADOR ===================== */
const SHOTS=['Saque','Derecha','Revés','Volea','Dejada','Globo','Resto','Smash','Passing'];
const FICHA=[
  {sec:'Tu juego', sub:'Cómo juegas en la pista', fields:[
    {k:'hand',l:'Mano',t:'chips',o:['Diestro','Zurdo'],i:'✋'},
    {k:'backhand',l:'Revés',t:'chips',o:['A una mano','A dos manos'],i:'↩️'},
    {k:'style',l:'Estilo de juego',t:'chips',o:['Fondo de pista','Agresivo desde el fondo','Saque y red','Todoterreno','Contragolpeador'],i:'🧠'},
    {k:'surface',l:'Superficie favorita',t:'chips',o:['Tierra batida','Pista rápida','Hierba','Indoor'],i:'🟤'},
    {k:'shot',l:'Golpe favorito',t:'chips',o:SHOTS,i:'💥'},
    {k:'weak',l:'Talón de Aquiles',t:'chips',o:[...SHOTS,'Segundo saque','Bolas altas','Los nervios'],i:'🎯'},
    {k:'dbl',l:'Lado en dobles',t:'chips',o:['Drive (derecha)','Revés (izquierda)','Me da igual'],i:'🤝'}]},
  {sec:'Tu tenis', sub:'Lo que te inspira', fields:[
    {k:'idol',l:'Jugador favorito',t:'text',o:['Rafa Nadal','Roger Federer','Novak Djokovic','Carlos Alcaraz','Jannik Sinner','Andre Agassi','Pete Sampras','Juan Carlos Ferrero','Carlos Moyà','Àlex Corretja'],i:'⭐',ph:'¿A quién te pareces jugando?'},
    {k:'tournament',l:'Torneo soñado',t:'chips',o:['Roland Garros','Wimbledon','US Open','Open de Australia','Conde de Godó','Mutua Madrid Open','Copa Davis'],i:'🏆'},
    {k:'racket',l:'Raqueta',t:'text',o:['Babolat Pure Aero','Babolat Pure Drive','Wilson Blade','Wilson Pro Staff','Head Speed','Head Radical','Yonex EZONE','Yonex VCORE','Tecnifibre TF40'],i:'🎾',ph:'Marca y modelo'},
    {k:'since',l:'Juega desde',t:'year',i:'📅',ph:'Año'}]},
  {sec:'Tu personalidad en pista', sub:'Lo que te hace único', fields:[
    {k:'nick',l:'Apodo',t:'text',o:[],i:'🏷️',ph:'Cómo te llaman en el equipo'},
    {k:'motto',l:'Grito de guerra más usado',t:'text',o:['¡Vamos!','¡Come on!','¡Venga!','¡Sí señor!','¡Allez!','¡Vamos Polo!'],i:'📣',ph:'Lo que gritas tras un gran punto'},
    {k:'ritual',l:'Ritual antes de sacar',t:'text',o:['Tres botes y al lío','Mirar las cuerdas','Secarme con la toalla','Elegir la bola buena'],i:'🔁',ph:'Tu manía antes del saque'},
    {k:'song',l:'Canción para calentar',t:'text',o:[],i:'🎧',ph:'Lo que suena en tus cascos'},
    {k:'quote',l:'Frase que te define',t:'text',o:[],i:'💬',ph:'En una línea'},
    {k:'bio',l:'Sobre mí',t:'text',o:[],i:'✍️',ph:'Una o dos líneas sobre ti'}]}];
const FICHA_FIELDS=FICHA.flatMap(s=>s.fields);
const TENNIS_FIELDS=FICHA_FIELDS.map(f=>[f.k,f.l,f.t==='chips'?'select':f.t,f.o]);
function fichaPct(pid, pr){ pr=pr||profiles[pid]||{}; const n=FICHA_FIELDS.filter(f=>String(pr[f.k]||'').trim()).length+(photos[pid]?1:0); return Math.round(n*100/(FICHA_FIELDS.length+1)); }
function fichaDisplay(pid, own){
  const pr=profiles[pid]||{}, has=f=>String(pr[f.k]||'').trim();
  if(!FICHA_FIELDS.some(has)) return own? `<section class="sec"><a class="fcta" href="#mi-ficha"><span class="fci">✍️</span><span><b>Completa tu ficha de jugador</b><small>Golpe favorito, jugador favorito, grito de guerra, ritual… Sale aquí, en tu carta y en la plantilla.</small></span><span class="btn sm brass">Empezar</span></a></section>` : '';
  const tiles=FICHA_FIELDS.filter(f=>has(f) && !['motto','quote','nick','bio'].includes(f.k));
  return `<section class="sec"><div class="sec-h"><h2>El jugador</h2>${own?'<a href="#mi-ficha">Editar mi ficha</a>':''}</div>
    ${has({k:'motto'})? `<div class="warcry"><span class="wl">📣 Grito de guerra</span><span class="wt">${esc(pr.motto)}</span></div>` : ''}
    ${tiles.length? `<div class="ftiles stagger">${tiles.map(f=>`<div class="ftile ${f.k==='idol'?'wide':''}"><span class="fi">${f.i}</span><span class="fl">${f.l}</span><b>${esc(pr[f.k])}</b></div>`).join('')}</div>` : ''}
    ${has({k:'bio'})? `<p class="fbio">${esc(pr.bio)}</p>` : ''}${has({k:'quote'})? `<p class="fquote">«${esc(pr.quote)}»</p>` : ''}</section>`;
}
function fePreviewHTML(){
  const pr=ui.fe.draft, pct=fichaPct(me,pr);
  return `${playerCard(me)}
    <div class="fe-prog"><div class="row" style="justify-content:space-between"><b>Ficha completada</b><b id="fe-pct">${pct}%</b></div><span class="fbar"><i style="width:${pct}%"></i></span>
      <small>${pct>=100? '¡Ficha completa! 🎾' : pct>=60? 'Ya casi. Te faltan '+(FICHA_FIELDS.length+1-Math.round(pct*(FICHA_FIELDS.length+1)/100))+' datos.' : 'Cuanto más rellenes, mejor luce tu perfil.'}</small></div>
    ${pr.motto? `<div class="warcry sm"><span class="wl">📣 Grito de guerra</span><span class="wt">${esc(pr.motto)}</span></div>` : ''}`;
}
function feRefresh(){ const ob=document.querySelector('.ob-banner'); if(ob && ui.onboard){ const t=document.createElement('div'); t.innerHTML=onboardBanner(); ob.replaceWith(t.firstElementChild); } const box=$('#fe-preview'); if(!box||!ui.fe) return; const saved=profiles[me]; profiles[me]=ui.fe.draft; box.innerHTML=fePreviewHTML(); profiles[me]=saved; afterRender(box); }
function feStatus(t,cls=''){ const el=$('#fe-status'); if(el){ el.textContent=t; el.className='fe-status '+cls; } }
function feQueue(){ if(!ui.fe) return; ui.fe.dirty=true; ui.fe.touched=true; feStatus('Guardando…','saving'); clearTimeout(ui.fe.t); ui.fe.t=setTimeout(feFlush,900); }
async function feFlush(){ if(!ui.fe||!me||!ui.fe.dirty) return; clearTimeout(ui.fe.t); const o={}; Object.entries(ui.fe.draft).forEach(([k,v])=>{ if(k!=='at' && v!=null && String(v).trim()!=='') o[k]=String(v).trim(); }); o.at=Date.now();
  ui.fe.dirty=false; try{ await trackWrite(B.set('profiles/'+me,o)); profiles[me]=o; feStatus('Guardado ✓','ok'); if(fichaPct(me,o)>=100 && !ui.fe.celebrated){ ui.fe.celebrated=true; confetti(innerWidth/2,innerHeight/3,110); } }catch(e){ ui.fe.dirty=true; feStatus('No se ha guardado. Toca el aviso rojo para ver el motivo','ko'); } }
function vMiFicha(){
  if(!me) return `<div class="wrap"><div class="pagehead"><h1>Mi ficha</h1></div><div class="notice">Primero elige tu nombre de la lista en la pestaña Yo.</div></div>`;
  if(!player(me)) S.players.length; const _pp=player(me)||{id:me,name:rosterAll().find(x=>x.id===me)?.name||'Jugador'};
  if(!ui.fe || ui.fe.pid!==me || (!ui.fe.touched && JSON.stringify(ui.fe.base)!==JSON.stringify(profiles[me]||{})))
    ui.fe={pid:me, base:clone(profiles[me]||{}), draft:{...(profiles[me]||{})}, phone:phones[me]||'', dirty:false, touched:false};
  const p=_pp, d=ui.fe.draft, ph=photos[me]?.d;
  const field=f=>{ const v=d[f.k]||'';
    if(f.t==='chips') return `<div class="fe-f"><label class="fe-l"><span>${f.i}</span>${f.l}</label><div class="fe-chips" data-group="${f.k}">${f.o.map(o=>`<button type="button" class="fchip press" data-act="fe-chip" data-k="${f.k}" data-v="${esc(o)}" aria-pressed="${v===o}">${esc(o)}</button>`).join('')}</div></div>`;
    return `<div class="fe-f"><label class="fe-l" for="fe-${f.k}"><span>${f.i}</span>${f.l}</label><input id="fe-${f.k}" data-fe="${f.k}" type="${f.t==='year'?'number':'text'}" ${f.t==='year'?'min="1950" max="2026" inputmode="numeric"':'maxlength="80"'} value="${esc(v)}" placeholder="${esc(f.ph||'')}" ${f.o?.length?`list="dl-${f.k}"`:''}>
      ${f.o?.length? `<datalist id="dl-${f.k}">${f.o.map(o=>`<option value="${esc(o)}">`).join('')}</datalist><div class="sugs">${f.o.slice(0,6).map(o=>`<button type="button" class="sug" data-act="fe-sug" data-k="${f.k}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>` : ''}</div>`; };
  ensureTourCss(); return `<div class="wrap fe"><div class="pagehead"><a class="textlink" href="#yo">← Yo</a><h1 style="margin-top:10px">Mi ficha</h1><p class="lede">Lo que rellenes sale en tu perfil, en tu carta de jugador y en la plantilla. Todo es opcional y se guarda solo.</p>${onboardBanner()}</div>
    <div class="fe-grid"><aside class="fe-side"><div id="fe-preview">${(()=>{ const s=profiles[me]; profiles[me]=d; const h=fePreviewHTML(); profiles[me]=s; return h; })()}</div>
      <div class="row" style="margin-top:14px;justify-content:center"><a class="btn ghost sm" href="#jugador-${esc(me)}">Ver mi perfil</a></div></aside>
    <div class="fe-main">
      <section class="fe-card"><h2>Tu foto</h2><p class="muted small">Vertical, con la cara en el tercio de arriba. Se usa en tu perfil, la carta, la plantilla, los rankings y los carteles de convocatoria.</p>
        <div class="fe-photo"><div class="fe-ph">${ph? `<img src="${esc(ph)}" alt="Tu foto">` : `<span>${esc(p.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span>`}</div>
          <div class="fe-phbtns"><button class="btn brass" data-act="crop" data-target="${esc(me)}" data-pick="1">${ph?'Subir otra foto':'Subir mi foto'}</button>${ph? `<button class="btn ghost" data-act="crop" data-target="${esc(me)}">Reencuadrar</button><button class="btn ghost sm" data-act="photo-del" data-target="${esc(me)}">Quitar</button>` : ''}
            <p class="muted small">Desde el móvil puedes hacerte una foto en el momento.</p></div></div></section>
      ${FICHA.map(s=>`<section class="fe-card"><h2>${s.sec}</h2><p class="muted small">${s.sub}</p>${s.fields.map(field).join('')}</section>`).join('')}
      <section class="fe-card"><h2>Tu teléfono</h2><p class="muted small">Privado: solo lo usa el equipo para avisarte por WhatsApp si falta tu respuesta. No se muestra en tu perfil.</p>
        <div class="fe-f"><label class="fe-l" for="fe-phone"><span>📱</span>Móvil</label><input id="fe-phone" data-fe-phone type="tel" value="${esc(ui.fe.phone)}" placeholder="+34 600 000 000"></div></section>
    </div></div>
    <div class="fe-bar"><span id="fe-status" class="fe-status">${ui.fe.dirty?'Guardando…':'Todo guardado'}</span><a class="btn sm" href="#jugador-${esc(me)}">Ver cómo queda</a></div></div>`;
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
function installCard(){
  if(isStandalone()) return `<div class="mcard ok"><span class="mi">📲</span><div><b>App instalada</b><small>La tienes en la pantalla de inicio.</small></div></div>`;
  if(installEvt) return `<div class="mcard"><span class="mi">📲</span><div><b>Instala la app</b><small>Acceso directo, pantalla completa y notificaciones.</small></div><button class="btn brass sm" data-act="install">Instalar</button></div>`;
  if(isIOS()) return `<div class="mcard"><span class="mi">📲</span><div><b>Instálala en el iPhone</b><small>En Safari pulsa <b>Compartir</b> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/></svg> y luego <b>Añadir a pantalla de inicio</b>. Las notificaciones en iPhone solo funcionan con la app instalada.</small></div></div>`;
  return `<div class="mcard"><span class="mi">📲</span><div><b>Instala la app</b><small>En el menú del navegador elige <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.</small></div></div>`;
}
function pushCard(){
  if(!CFG.vapidKey) return isAdmin? `<div class="mcard"><span class="mi">🔔</span><div><b>Notificaciones sin configurar</b><small>Falta la clave vapidKey en config.js (Firebase, Cloud Messaging). Solo lo ves tú.</small></div></div>` : '';
  const st=pushState;
  if(st==='on') return `<div class="mcard ok"><span class="mi">🔔</span><div><b>Notificaciones activadas</b><small>Te avisaremos de la disponibilidad, la convocatoria y tu encuesta.</small></div><button class="btn ghost sm" data-act="push-test">Probar</button></div>`;
  if(st==='denied') return `<div class="mcard"><span class="mi">🔕</span><div><b>Notificaciones bloqueadas</b><small>Actívalas en los ajustes del navegador para esta web y vuelve a intentarlo.</small></div><button class="btn ghost sm" data-act="push-on">Reintentar</button></div>`;
  return `<div class="mcard"><span class="mi">🔔</span><div><b>Activa las notificaciones</b><small>Disponibilidad, convocatoria y encuesta, directas al móvil.</small></div><button class="btn brass sm" data-act="push-on">Activar</button></div>`;
}
function diagHint(d){ const bad=d.find(x=>!x[2]); if(!bad) return '<p class="notice" style="margin-top:10px">Todo correcto: puedes guardar y editar.</p>';
  const k=bad[0], m=bad[1];
  const tip = k==='Tu jugador'? 'Elige tu nombre de la lista (cierra sesión y vuelve a entrar si no te lo pide).'
    : /permission/.test(m)? 'Firebase sigue usando reglas antiguas. Ve a Firestore → Reglas, pega las reglas nuevas y pulsa Publicar; comprueba arriba que pone «Publicado» con la hora de ahora. Si al pegarlas sale una línea en rojo, no se publican: mándame una captura.'
    : k==='Sesión'? 'Vuelve a entrar con Google.' : 'Mándame una captura de esta lista.';
  return `<p class="notice" style="margin-top:10px"><b>${esc(k)}:</b> ${esc(tip)}</p>`; }
function connCard(){
  const fb=B.mode==='firebase', online=navigator.onLine!==false;
  const rows=[['Datos', fb? '<b class="ok">Conectado a la base de datos del equipo</b>' : '<b class="ko">Vista previa: los datos se guardan solo en este navegador</b>'],
    ['Conexión', online? 'En línea' : '<b class="ko">Sin conexión</b> (los cambios se subirán al volver)'],
    ['Cuenta', esc(authUser?.email||'–')],
    ['Puede editar la temporada', canManage? '<b class="ok">Sí</b> ('+(isAdmin?'administrador':'capitán')+')' : 'No (solo lo suyo: disponibilidad, encuesta, voto, foto y ficha)'],
    ['Último guardado', sync.at? relTime(sync.at) : 'Ninguno en esta sesión'+(sync.st==='error'? '. <b class="ko">'+esc(sync.msg)+'</b>' : '')],
    ['Temporada', esc(viewSeason)+(S.updatedAt? ', actualizada '+relTime(S.updatedAt) : '')]];
  return `<section class="sec"><div class="sec-h"><h2>Conexión y datos</h2></div><dl class="conn">${rows.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
    ${!fb? '<p class="notice" style="margin-top:10px">Para que todos veáis lo mismo, abrid siempre la web de Vercel con la configuración de Firebase puesta, no el enlace de vista previa.</p>':''}
    <div class="row" style="margin-top:12px"><button class="btn sm" data-act="diag">Comprobar permisos</button></div>
    ${ui.diag? `<ul class="diag">${ui.diag.map(([a,b,ok])=>`<li class="${ok?'ok':'ko'}"><span>${ok?'✓':'✗'}</span><b>${esc(a)}</b><em>${esc(b)}</em></li>`).join('')}</ul>${diagHint(ui.diag)}` : ''}</section>`;
}
function vYo(){
  if(!me) return `<div class="wrap"><div class="pagehead"><h1>Yo</h1></div><div class="notice">Tu usuario de administrador no está ligado a ningún jugador. <button class="textlink" data-act="unskip">Elegir mi nombre</button></div><section class="sec">${installCard()}${pushCard()}</section></div>`;
  const p=player(me)||{id:me, name:rosterAll().find(x=>x.id===me)?.name||'Jugador', order:'', cat:''}, pr=profiles[me]||{}, tasks=[];
  S.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&availOpen(f)).forEach(f=>{ const v=avOf(me,f.j); tasks.push(`<a class="task ${v?'done':''}" href="#disponibilidad-${f.j}"><span class="ti">${v?'✓':'?'}</span><span><b>Disponibilidad, jornada ${f.j}</b><small>${v? 'Has dicho: '+AV_LABEL[v.s]+'. Puedes cambiarla hasta el '+esc(fmtDT(deadline(f.j))) : 'Contra '+esc(clubName(persp(f).rival))+'. Responde antes del '+esc(fmtDT(deadline(f.j)))}</small></span></a>`); });
  pendingMvp().forEach(j=>tasks.push(`<a class="task hot" href="#mvp-${j}"><span class="ti">🏆</span><span><b>Vota al MVP, jornada ${j}</b><small>Un voto, hasta el ${esc(fmtDT(new Date(mvpState(j).deadline)))}.</small></span></a>`));
  pendingSurveys().forEach(j=>tasks.push(`<a class="task hot" href="#encuesta-${j}"><span class="ti">!</span><span><b>Encuesta de la jornada ${j}</b><small>Has jugado contra ${esc(clubName(persp(poloFix(j)).rival))}. 2 minutos.</small></span></a>`));
  const roles=[isCaptain?'Capitán':'',isAdmin?'Administrador':''].filter(Boolean);
  return `<div class="wrap"><div class="phead">${avatar(p,'lg')}<div><h1>${esc(p.name)}</h1><p>${roles.length? roles.join(' y ')+'. ':''}Entras como ${esc(authUser?.email||'')}.</p><div class="row" style="margin-top:8px"><a class="btn sm" href="#jugador-${esc(me)}">Ver mi perfil</a>${canManage?'<a class="btn sm brass" href="#admin">Panel de capitán</a>':''}<button class="btn sm ghost" data-act="signout">Salir</button></div></div></div>
  <section class="sec"><div class="row" style="justify-content:flex-end;margin-bottom:-6px"><button class="btn sm ghost" data-act="tour-again">Ver la introducción</button></div><div class="roles"><span class="op-k">Tus perfiles</span><div class="role-list">
    <span class="role">Jugador${me&&player(me)? ' del '+esc(teamLabel()) : ''}</span>
    ${canManage? `<a class="role cap" href="#admin">Capitán${!isCaptain&&!isAdmin&&teamMode()? ' (todo el equipo gestiona)' : ''} <em>Gestión ›</em></a>` : ''}
    ${canClub()? `<a class="role mgr" href="#club">${isManager? 'Gestor deportivo' : 'Administrador'} <em>Gestión deportiva ›</em></a>` : ''}</div></div></section>
  <section class="sec"><a class="fcta big press" href="#mi-ficha">${avatar(p,'lg')}<span><b>Mi ficha de jugador</b><small>${(()=>{ const pc=fichaPct(me); return pc? pc+'% completada. ' : ''; })()}Foto, golpe favorito, jugador favorito, grito de guerra, ritual…</small><span class="fbar"><i style="width:${fichaPct(me)}%"></i></span></span><span class="btn brass sm">${fichaPct(me)?'Editar':'Empezar'}</span></a></section>
  <section class="sec"><div class="sec-h"><h2>Pendiente</h2></div>${tasks.length? `<div class="tasks stagger">${tasks.join('')}</div>` : '<div class="empty">Todo al día. Cuando haya disponibilidad que responder o una encuesta tuya, aparecerá aquí.</div>'}</section>
  <section class="sec"><div class="sec-h"><h2>En tu móvil</h2></div><div class="mcards">${installCard()}${pushCard()}</div></section>
  ${connCard()}
</div>`;
}
function vEncuesta(j){
  const f=poloFix(j); if(!f) return vNotFound(); const k=jid(j), parts=participants(j);
  const head=`<div class="wrap"><div class="pagehead"><p class="qsec">Encuesta postpartido</p><h1>Jornada ${j}</h1><p class="lede">Polo contra ${esc(clubName(persp(f).rival))}${isPlayed(f)?', '+persp(f).ps+'-'+persp(f).rs:''}.</p></div>`;
  if(!isPlayed(f)) return head+`<div class="empty">La encuesta se abre cuando se cargue el resultado de la eliminatoria.</div></div>`;
  if(!parts.includes(me)) return head+`<div class="empty">Esta encuesta es solo para los que jugaron la eliminatoria.</div></div>`;
  if(S.survey.closed?.[k]) return head+`<div class="empty">El capitán ya ha cerrado esta encuesta.</div></div>`;
  if(ui.survey && ui.survey.j===j) return head+`<section class="sec">${surveyCard()}</section></div>`;
  const done=myBallot?.j?.[k];
  return head+`<section class="sec"><div class="panel done">${done? `<p class="q">Encuesta enviada ✓</p><p class="muted">Gracias. El capitán publicará los resultados agregados y el MVP.</p><button class="btn ghost" data-act="survey-start" data-j="${j}">Cambiar mis respuestas</button>` : `<p class="q">${surveyQuestions().length} preguntas rápidas</p><p class="muted">Las preguntas sobre compañeros se publican solo como votos agregados. Lo que digas de ti y tus comentarios son privados.</p><button class="btn brass" data-act="survey-start" data-j="${j}">Empezar</button>`}</div></section></div>`;
}
const surveyQuestions = () => S.survey.questions.filter(q=>q.text&&q.type);
function surveyCard(){
  const qs=surveyQuestions(), j=ui.survey.j, i=ui.survey.step;
  if(i>=qs.length) return `<div class="survey"><div class="prog"><i style="width:100%"></i></div><p class="q">Todo listo</p><p class="qsec">Revisa si quieres o envía tus respuestas de la jornada ${j}.</p><div class="nav"><button class="btn ghost" data-act="survey-prev">Atrás</button><button class="btn brass" data-act="survey-send">Enviar respuestas</button></div></div>`;
  const q=qs[i], a=ui.survey.a[q.id]; let body='';
  if(q.type==='scale') body=`<div class="scale">${Array.from({length:10},(_,n)=>`<button data-act="ans" data-q="${q.id}" data-v="${n+1}" aria-pressed="${a===n+1}">${n+1}</button>`).join('')}</div>`;
  else if(q.type==='player'){ const list=participants(j).map(player).filter(Boolean).filter(p=>p.id!==me);
    body=`<div class="picker">${list.map(p=>`<button data-act="ans" data-q="${q.id}" data-v="${esc(p.id)}" aria-pressed="${a===p.id}">${avatar(p)}${esc(p.name)}</button>`).join('')}</div>`; }
  else body=`<textarea data-act="ans-text" data-q="${q.id}" placeholder="Escribe aquí (opcional)" style="margin:20px 0">${esc(a||'')}</textarea>`;
  return `<div class="survey"><div class="qsec">Jornada ${j}. ${esc(SCOPE_LABEL[q.scope]||'')}, ${i+1} de ${qs.length}</div><div class="prog"><i style="width:${Math.round(i*100/qs.length)}%"></i></div>
    <div class="qbody" key="${i}"><p class="q">${esc(q.text)}</p>${body}</div>
    <div class="nav"><button class="btn ghost" data-act="survey-prev" ${i===0?'disabled':''}>Atrás</button><button class="btn" data-act="survey-next">${a!=null&&a!==''?'Siguiente':'Saltar'}</button></div></div>`;
}

/* ---------------- Puerta de acceso ---------------- */
function vLogin(){
  return `<div class="gatebox">${courtSVG()}<span class="ball" aria-hidden="true"></span><div class="inner">
    <img class="gate-crest" src="${ASSET.crest}" alt="Real Club de Polo de Barcelona">
    <p class="hero-comp">${esc(S.comp.name)}, ${esc(S.comp.group)}</p><h1 class="hero-title" aria-label="${esc(teamLabel())}">${titleLetters(teamLabel())}</h1>
    <p class="hero-sub">${route().startsWith('disponibilidad-')? 'Entra para decir si puedes jugar la jornada '+esc(route().slice(15))+'.' : 'La app privada del equipo masculino absoluto del Real Club de Polo de Barcelona.'}</p>
    <button class="gbtn" data-act="signin"><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Entrar con Google</button>
    <p class="small" style="color:var(--onGreenMuted);margin-top:14px">Después eliges tu nombre de la lista del equipo. Solo se hace una vez: tu nombre queda ligado a tu Gmail en cualquier dispositivo.</p></div></div>`;
}
function vClaim(){
  const taken=new Set(Object.keys(claims).filter(pid=>claims[pid]?.email!==authUser.email));
  return `<div class="wrap" style="padding-top:30px;padding-bottom:40px"><p class="muted small">Has entrado como ${esc(authUser.email)}. <button class="textlink" data-act="signout">Cambiar de cuenta</button></p>
    <h1 class="q" style="font-size:clamp(2.2rem,8vw,3.2rem);margin-top:10px">¿Quién eres?</h1><p class="muted">Elige tu nombre de la lista del club. Quedará ligado a este Gmail.</p>
    <div class="claimgrid stagger">${rosterAll().sort((a,b)=>(a.teams[0]||'').localeCompare(b.teams[0]||'')||(a.order||0)-(b.order||0)).map(p=>`<button data-act="claim" data-id="${esc(p.id)}" ${taken.has(p.id)?'disabled':''}>${avatar(p)}<span>${esc(p.name)}<small class="muted" style="display:block;font-weight:400">${esc(p.teams.map(t=>clubTeams().find(x=>x.id===t)?.short||t).join(', '))}</small>${taken.has(p.id)?'<br><span class="muted small" style="font-weight:400">ya elegido</span>':''}</span></button>`).join('')}</div>
    ${isAdmin?`<p style="margin-top:20px"><button class="textlink" data-act="skip">Soy administrador y no juego</button></p>`:''}
    <p class="source">¿Tu nombre aparece como elegido y no has sido tú? Avisa al capitán para que lo libere.</p></div>`;
}

/* ---------------- Administración ---------------- */
function vAdmin(){
  if(!canManage) return `<div class="wrap"><div class="pagehead"><h1>Gestión</h1></div><div class="notice">${me? 'La gestión está limitada a los capitanes marcados. Un administrador puede abrirla a todo el equipo en Temporadas y ajustes.' : 'Elige tu nombre en Yo para poder gestionar.'}</div></div>`;
  if(ui.adminTab==='preguntas') ui.adminTab='temporadas';
  const tabs=[['jornada','Jornada'],['docs-go','Documentos'],['calendario','Liga'],...(canManage?[['plantilla','Plantilla'],['temporadas','Ajustes']]:[])];
  if(!tabs.some(x=>x[0]===ui.adminTab)) ui.adminTab='jornada'; const t=ui.adminTab;
  return `<div class="wrap"><div class="pagehead"><h1>Gestión</h1><p class="lede">Todo se edita aquí y se actualiza solo en el resto de la app.${viewSeason!==currentSeason()?` <b>Estás editando la temporada ${esc(viewSeason)}.</b>`:''}</p></div>
    <div class="atabs">${tabs.map(([k,l])=>`<button class="chip" data-act="admin-tab" data-v="${k}" aria-pressed="${t===k}">${l}</button>`).join('')}</div>
    ${t==='jornada'?aJornada():t==='plantilla'?aPlantilla():t==='calendario'?aCalendario():t==='preguntas'?aPreguntas():aTemporadas()+`<div class="sec-h" style="margin-top:28px"><h2>Encuesta postpartido</h2></div>`+aPreguntas()}</div>`;
}
function jSelect(act,cur,onlyPolo=true){ const js= onlyPolo? poloOrder() : Array.from({length:NJ()},(_,i)=>i+1); return `<select data-act="${act}" style="max-width:380px">${js.map(j=>{ const f=poloFix(j); return `<option value="${j}" ${cur===j?'selected':''}>Jornada ${j}${f?', '+(f.home===POLO?'Polo contra '+team(f.away).short:team(f.home).short+' contra Polo')+', '+fdate(f)+(f.moved?.from&&f.moved.from!==f.date? (f.date<f.moved.from?' (adelantada)':' (aplazada)') : ''):''}</option>`; }).join('')}</select>`; }
function adminJ(){ if(ui.adminJ && poloFix(ui.adminJ)) return ui.adminJ; const nx=nextPoloFix(); if(nx) return nx.j; const l=lastPoloPlayed(); if(l) return l.j; const f=S.fixtures.find(x=>x.home===POLO||x.away===POLO); return f? f.j : null; }
/* ===================== MATCHDAY MANAGEMENT ===================== */
function phases(j){
  const f=poloFix(j), t=tie(j)||blankTie(), a=availFor(j), tr=tieFromRubbers(j)||{}, p=persp(f), pub=S.published[jid(j)]||{}, closed=deadlinePassed(j)||isPlayed(f);
  const resDone = !!(tr.complete) || (isPlayed(f) && f.status==='official' && !tr.decided);
  return [
    {k:'prep', l:'Calendario confirmado', st: t.calOk||isPlayed(f)? 'done' : 'todo', d: t.calOk? 'Confirmado' : isPlayed(f)? 'Disputada' : 'Confirma fecha, hora y rival'},
    {k:'disp', l:'Disponibilidad solicitada', st: t.availReq||closed? 'done' : availOpen(f)? 'doing' : 'todo', d: t.availReq? 'Pedida '+relTime(t.availReq.at) : closed? 'Plazo cerrado' : 'Sin pedir'},
    {k:'disp', l:'Disponibilidad cerrada', st: closed? 'done' : (t.availReq||a.answered)? 'doing' : 'todo', d: `${a.answered} de ${a.total} respuestas`},
    {k:'conv', l:'Convocatoria publicada', st: t.lineupPub? 'done' : (t.convocados?.length||t.rubbers.some(r=>r.polo.length))? 'doing' : 'todo', d: t.lineupPub? 'Publicada' : t.convocados?.length? 'Borrador' : 'Pendiente'},
    {k:'res', l:'Resultados introducidos', st: resDone? 'done' : (tr.decided||isPlayed(f))? 'doing' : 'todo', d: resDone? `Polo ${p.ps}-${p.rs}${f.status==='official'?', oficial':''}` : tr.decided? `${tr.decided} partidos con resultado` : 'Pendiente'},
    {k:'post', l:'MVP publicado', st: pub.mvp? 'done' : mvpState(j)? 'doing' : 'todo', d: pub.mvp? pname(pub.mvp) : mvpOpen(j)? `Votando: ${mvpVoteCount(jid(j))}` : mvpState(j)? 'Por publicar' : 'Tras el partido'}];
}
function nextAction(j){
  const f=poloFix(j), t=tie(j)||blankTie(), a=availFor(j), ph=phases(j), cur=ph.find(x=>x.st!=='done');
  if(!cur) return {t:'Jornada completada', d:'Todo está publicado. Las estadísticas, la clasificación y los perfiles ya están al día.', b:''};
  const B=(act,label,extra='')=>`<button class="btn brass" data-act="${act}" data-j="${j}" ${extra}>${label}</button>`;
  switch(ph.indexOf(cur)){
    case 0: return {t:'Confirma el calendario', d:`${fdate(f,{weekday:'long',day:'numeric',month:'long'})} a las ${f.time} h, ${persp(f).home?'en casa':'fuera'} contra ${clubName(persp(f).rival)}.`, b:B('cal-ok','Confirmar calendario')+`<button class="btn ghost" data-act="jtab" data-v="prep">Editar</button>`};
    case 1: return {t:'Pide la disponibilidad', d:'Se prepara el mensaje de WhatsApp con el enlace y se envía la notificación al equipo.', b:`<button class="btn brass" data-act="go-compose" data-kind="req" data-j="${j}">Solicitar disponibilidad</button>`};
    case 2: return {t: a.none.length? `Faltan ${a.none.length} por responder` : 'Ya han respondido todos', d:`${a.yes.length} disponibles, ${a.maybe.length} pendientes de confirmar, ${a.no.length} no. Plazo: ${fmtDT(deadline(j))}.`, b:(a.none.length? `<button class="btn brass" data-act="go-compose" data-kind="rem" data-j="${j}">Recordar a los ${a.none.length}</button>`:'')+`<button class="btn ${a.none.length?'ghost':'brass'}" data-act="avail-close" data-j="${j}">Cerrar disponibilidad</button>`};
    case 3: return {t:'Prepara la convocatoria', d:`${a.yes.length} disponibles. Elige convocados, individuales y la pareja de dobles.`, b:`<button class="btn brass" data-act="jtab" data-v="conv">Ir a la convocatoria</button>`};
    case 4: return {t: isPlayed(f)&&!tieFromRubbers(j)?.decided? 'Faltan los partidos' : 'Introduce los resultados', d:'Sube el acta oficial (la IA la lee y tú confirmas) o escríbelos a mano. Al guardarlos se recalcula todo y se abren la encuesta y el MVP.', b:`<button class="btn brass" data-act="jtab" data-v="res" data-mode="acta">Subir el acta</button><button class="btn ghost" data-act="jtab" data-v="res" data-mode="manual">A mano</button>`};
    default: return {t: mvpOpen(j)? 'Votación del MVP en marcha' : 'Publica el MVP', d: mvpOpen(j)? `Han votado ${mvpVoteCount(jid(j))}. Plazo: ${fmtDT(new Date(mvpState(j).deadline))}.` : 'Revisa el recuento y publica al ganador.', b:`<button class="btn brass" data-act="jtab" data-v="post">Ver el MVP</button>`};
  }
}
function aJornada(){
  const j=adminJ(); if(!j) return `<div class="empty">No hay eliminatorias del Polo en el calendario. Añádelas en «Liga y calendario».</div>`;
  const f=poloFix(j), p=persp(f), t=tie(j)||blankTie(), a=availFor(j), ph=phases(j), na=nextAction(j), tr=tieFromRubbers(j)||{}, agg=aggregate(jid(j)), parts=participants(j);
  if(!ui.jTabSet || ui.jTabFor!==j){ ui.jTabFor=j; ui.jTabSet=true; const c=ph.find(x=>x.st!=='done'); ui.jTab = c? c.k : 'post'; }
  const stIcon={done:'✓',doing:'•',todo:''}, stTxt={done:'Completada',doing:'En curso',todo:'Pendiente'};
  const pendRes=t.rubbers.filter((r,i)=> (r.type==='S' || tr.needsDoubles) && !rubberCalc(r).res).length;
  const tabs=[['prep','Preparar'],['conv','Convocar'],['res','Resultados'],['post','Postpartido']], jt=ui.jTab==='disp'?'prep':ui.jTab;
  return `<section class="sec" style="padding-top:6px">
    <div class="mdhead"><div>${jSelect('admin-j',j)}<p class="mdtitle">${crest(p.rival)}<span>Polo contra ${esc(clubName(p.rival))}</span></p><p class="muted small" style="margin:0">${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h, ${p.home?'en casa':'fuera'}. ${isPlayed(f)? 'Resultado: Polo '+p.ps+'-'+p.rs+(f.status==='official'?' (oficial)':' (provisional)') : countdown(f)}</p></div></div>
    <div class="row" style="margin:12px 0 0"><button class="btn ghost" data-act="msg-open" data-j="${j}">${svgi('mega',16)} Mensaje al equipo</button></div>
    <div class="mdkpis stagger"><div><b>${a.yes.length}</b><span>disponibles</span></div><div class="${a.none.length?'warn':''}"><b>${a.none.length}</b><span>sin responder</span></div><div><b>${(t.convocados||[]).length}</b><span>convocados</span></div><div class="${pendRes&&(t.lineupPub||isPlayed(f))?'warn':''}"><b>${pendRes}</b><span>partidos sin resultado</span></div><div><b>${isPlayed(f)? agg.n+'/'+parts.length : '–'}</b><span>encuestas</span></div><div><b>${mvpState(j)? mvpVoteCount(jid(j)) : '–'}</b><span>votos MVP</span></div></div>
    <ol class="steps">${ph.map((x,i)=>`<li class="${x.st}"><button data-act="jtab" data-v="${x.k}"><span class="sn">${stIcon[x.st]||i+1}</span><span class="sl"><b>${x.l}</b><small>${stTxt[x.st]}. ${esc(x.d)}</small></span></button></li>`).join('')}</ol>
    <div class="nextcard"><div><span class="nk">Siguiente paso</span><b>${esc(na.t)}</b><p>${esc(na.d)}</p></div><div class="row">${na.b}</div></div>
    <div class="mdtabs">${tabs.map(([k,l],i)=>`<button class="chip" data-act="jtab" data-v="${k}" aria-pressed="${jt===k}"><span class="tn">${i+1}</span>${l}</button>`).join('')}</div></section>
    ${ui.jTab==='prep'||ui.jTab==='disp'? aPrep(j)+`<div class="sec-h" style="margin-top:8px"><h2>Disponibilidad</h2></div>`+aDisp(j) :ui.jTab==='conv'?aConv(j)+(t.lineupPub||lineupList(j).length? `<div class="sec-h" style="margin-top:30px"><h2>Cartel de la convocatoria</h2></div>`+aCartel(j):''):ui.jTab==='res'?aResultados(j):aPost(j)}`;
}
function aPrep(j){
  const f=poloFix(j), p=persp(f), t=tie(j)||blankTie(), topts=sel=>S.teams.filter(x=>x.id!==POLO).map(x=>`<option value="${x.id}" ${sel===x.id?'selected':''}>${esc(x.name)}</option>`).join('');
  return `<section class="sec"><div class="split"><div><div class="sec-h"><h2>Datos de la eliminatoria</h2></div>
    <div class="mvbox"><div><span class="hx-k3">Fecha del partido</span><b>${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h</b>${movedTag(f)}${f.fctDate&&f.fctDate!==f.date? `<p class="notice" style="margin:8px 0 0">La FCT todavía tiene este partido el ${esc(shortD(f.fctDate))}. La app mantiene tu fecha; cuando la Federació lo cambie, el aviso desaparecerá.</p>` : ''}<p class="muted small" style="margin:4px 0 0">¿Se adelanta o se aplaza? Cambia la fecha aquí, aunque sea otra jornada en el calendario: la app se reordena sola.</p></div>
      <div class="mvf"><label>Nueva fecha<input type="date" id="pp-date" value="${f.date}"></label><label>Hora<input type="time" id="pp-time" value="${f.time}"></label></div>
      <div class="row"><button class="btn brass" data-act="prep-save" data-j="${j}">Guardar fecha</button>${f.moved?.from&&f.moved.from!==f.date? `<button class="btn ghost sm" data-act="move-reset" data-j="${j}">Volver al ${esc(shortD(f.moved.from))}</button><a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`📅 Cambio de fecha: la jornada ${j} contra ${clubName(p.rival)} se juega el ${fdate(f,{weekday:'long',day:'numeric',month:'long'})} a las ${f.time} h (${p.home?'en casa':'fuera'}). Antes era el ${shortD(f.moved.from)}. Todo en la app: ${location.origin}/#jornada-${j}`)}">Avisar al equipo por WhatsApp</a>` : ''}</div></div>
    <div class="tfields">
      <label>Rival<select id="pp-rival">${topts(p.rival)}</select></label><label>Dónde<select id="pp-home"><option value="1" ${p.home?'selected':''}>En casa</option><option value="0" ${!p.home?'selected':''}>Fuera</option></select></label></div>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="prep-save" data-j="${j}">Guardar cambios</button>${t.calOk? '<span class="okmark">✓ Calendario confirmado</span>' : `<button class="btn brass" data-act="cal-ok" data-j="${j}">Confirmar calendario</button>`}</div>
    <p class="muted small">Al cambiar fecha u hora se actualizan solos el calendario, la portada, la página de la jornada, el plazo de disponibilidad y los mensajes. El resto de enfrentamientos de la liga se editan en «Liga y calendario».</p></div>
    <div><div class="sec-h"><h2>Orden de juego</h2></div>${lineupList(j).length? lineupStrip(j) : '<div class="empty">Aún sin convocatoria.</div>'}
      <div class="row" style="margin-top:12px"><a class="btn ghost sm" href="#jornada-${j}">Ver la página de la jornada</a><button class="btn ghost sm" data-act="docs-j" data-j="${j}">Documentos de la jornada (${(ensureDocsSub(), Object.values(docs).filter(d=>d.j===j).length)})</button></div></div></div></section>`;
}
const CAP_FIELDS=[['valoracion','Valoración general','¿Cómo ha ido la eliminatoria en conjunto?'],['desarrollo','Desarrollo de la jornada','Cómo fueron los partidos, momentos clave'],['destacados','Jugadores destacados','Quién y por qué'],['positivos','Aspectos positivos',''],['mejorar','Aspectos a mejorar',''],['incidencias','Incidencias','Lesiones, retrasos, pistas, arbitraje…'],['compromiso','Disponibilidad y compromiso del equipo',''],['observaciones','Observaciones adicionales','']];
function captainReportForm(j){ const t=tie(j)||{}, r=t.captainReport||{};
  return `<div class="panel caprep"><b>Informe del capitán</b><p class="muted small" style="margin:4px 0 10px">Lo lee el gestor deportivo y forma parte del informe semanal del club. Escribe solo lo que quieras que conste; la IA puede ordenarlo, pero no añade nada que no hayas escrito.</p>
    <label class="f">Nota de la jornada (1 a 10)<select data-capr="nota" style="width:auto;margin-left:8px"><option value="">Sin nota</option>${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option ${+r.nota===n?'selected':''}>${n}</option>`).join('')}</select></label>
    ${CAP_FIELDS.map(([k,l,ph])=>`<label class="f" for="capr-${k}">${l}</label><textarea id="capr-${k}" data-capr="${k}" rows="2" placeholder="${esc(ph)}">${esc(r[k]||'')}</textarea>`).join('')}
    <div class="row" style="margin-top:10px"><button class="btn brass" data-act="capr-save" data-j="${j}">Guardar informe</button>${r.at? `<span class="muted small">Guardado por ${esc(r.by||'')} ${relTime(r.at)}</span>` : ''}</div></div>`; }
function aPost(j){
  const f=poloFix(j); if(!isPlayed(f)) return `<section class="sec"><div class="empty">El postpartido se activa al guardar los resultados: se abren la encuesta para los que jugaron y la votación del MVP.</div></section>`;
  const c=cronica(j);
  return `<section class="sec"><div class="sec-h"><h2>Resumen de la jornada</h2></div><div class="panel"><p class="cronica" style="margin:0">${esc(c?.txt||'')}</p>
      <div class="row" style="margin-top:12px"><button class="btn ghost sm" data-act="compose" data-kind="summary" data-j="${j}">Compartir el resumen por WhatsApp</button><a class="btn ghost sm" href="#jornada-${j}">Ver la jornada</a></div>${composer('summary',j,'Resumen de la jornada')}
      <p class="source">Estadísticas individuales y de dobles, clasificación, rankings y perfiles ya están actualizados con estos resultados.</p></div></section>
    <div class="sec-h" style="margin-top:20px"><h2>Informe del capitán</h2></div>${captainReportForm(j)}
    <div class="sec-h" style="margin-top:20px"><h2>Votación del MVP</h2></div>${aMvp(j)}
    <div class="sec-h" style="margin-top:20px"><h2>Encuesta postpartido</h2></div>${aEncuesta(j)}`;
}

/* --- WhatsApp --- */
const appLink = h => location.origin + location.pathname + '#' + h;
function msgVars(j){ const f=poloFix(j), p=persp(f); return {rival:clubName(p.rival), fecha:fdate(f,{weekday:'long',day:'numeric',month:'long'}), hora:f.time, limite:fmtDT(deadline(j)), enlace:appLink('disponibilidad-'+j), enlaceJornada:appLink('jornada-'+j), jornada:j, lugar:p.home?'en casa':'fuera, en las pistas del '+clubName(p.rival)}; }
const fillMsg = (tpl,v) => String(tpl||'').replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null? v[k] : m);
function composeText(kind,j){ const v=msgVars(j), a=availFor(j);
  if(kind==='summary'){ const p=persp(poloFix(j)); v.resultado=p.played? `Polo ${p.ps}-${p.rs} ${clubName(p.rival)}` : ''; v.cronica=cronica(j)?.txt||''; v.partidos=(tie(j)?.rubbers||[]).filter(r=>rubberCalc(r).res).map(r=>{ const c=rubberCalc(r); return `${c.res==='W'?'✅':'❌'} ${r.type==='D'?'Dobles':'Ind. '+r.n}: ${(r.polo||[]).map(x=>pname(x)).join(' y ')} ${c.sets.map(x=>x.join('-')).join(' ')}`; }).join('\n'); }
  if(kind==='mvp'){ const p=persp(poloFix(j)); v.resultado=p.played? `Polo ${p.ps}-${p.rs} ${clubName(p.rival)}` : ''; v.enlaceMvp=appLink('mvp-'+j); v.limiteMvp=mvpState(j)?.deadline? fmtDT(new Date(mvpState(j).deadline)) : ''; }
  if(kind==='survey'){ const p=persp(poloFix(j)); v.resultado=p.played? `Polo ${p.ps}-${p.rs} ${clubName(p.rival)}` : 'resultado pendiente'; v.jugadores=participants(j).map(x=>pname(x).split(' ')[0]).join(', '); v.enlaceEncuesta=appLink('encuesta-'+j); }
  if(kind==='rem') v.pendientes=a.none.map(pname).join(', ')||'nadie';
  if(kind==='lineup'){ const roles=rolesOf(j); v.lista=lineupList(j).map(pid=>`• ${pname(pid)}: ${(roles[pid]||[]).join(' + ')}`).join('\n'); }
  return fillMsg(S.msgs[kind], v); }
function composer(kind,j,title){
  const c=ui.compose&&ui.compose.kind===kind&&ui.compose.j===j? ui.compose : null;
  if(!c) return '';
  return `<div class="panel composer"><b>${title}</b><p class="muted small" style="margin:4px 0 10px">Revísalo y edítalo antes de enviarlo. WhatsApp no deja elegir el grupo desde un enlace: al abrirse, elige el grupo del equipo.</p>
    <textarea id="compose-text" rows="10">${esc(c.text)}</textarea>
    <div class="row" style="margin-top:10px"><button class="btn brass" data-act="wa-send" data-kind="${kind}" data-j="${j}"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>Abrir WhatsApp</button>
      ${navigator.share?`<button class="btn ghost" data-act="wa-share" data-kind="${kind}" data-j="${j}">Compartir…</button>`:''}<button class="btn ghost" data-act="wa-copy" data-kind="${kind}" data-j="${j}">Copiar texto</button><button class="btn ghost sm" data-act="compose-close">Cancelar</button></div></div>`;
}
function respChart(j){
  const k=jid(j), ev=[]; Object.entries(avail).forEach(([pid,d])=>(d.h?.[k]||[]).forEach(e=>ev.push({pid,...e})));
  if(!ev.length) return '';
  ev.sort((a,b)=>a.at-b.at); const t0=Math.min(tie(j)?.availReq?.at||ev[0].at, ev[0].at), t1=Math.max(Date.now(), ev.at(-1).at+1), st={}; const pts=[];
  ev.forEach(e=>{ st[e.pid]=e.s; pts.push({t:e.at, n:Object.keys(st).length, y:Object.values(st).filter(x=>x==='yes').length}); });
  const W=600,H=170,pad={l:28,r:10,t:10,b:24}, tot=Math.max(1,availFor(j).total);
  const X=t=>pad.l+(t-t0)/(t1-t0||1)*(W-pad.l-pad.r), Y=v=>pad.t+(1-v/tot)*(H-pad.t-pad.b);
  const step=key=>{ let d=`M${X(t0)},${Y(0)}`, prev=0; pts.forEach(q=>{ d+=`L${X(q.t)},${Y(prev)}L${X(q.t)},${Y(q[key])}`; prev=q[key]; }); return d+`L${X(t1)},${Y(prev)}`; };
  let g=''; [0,Math.round(tot/2),tot].forEach(v=>g+=`<line x1="${pad.l}" x2="${W-pad.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${pad.l-6}" y="${Y(v)+4}" text-anchor="end">${v}</text>`);
  g+=`<text x="${pad.l}" y="${H-6}">${new Date(t0).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</text><text x="${W-pad.r}" y="${H-6}" text-anchor="end">ahora</text>`;
  return `<div class="sec-h" style="margin-top:22px"><h3>Evolución de las respuestas</h3></div><svg class="chart" viewBox="0 0 ${W} ${H}">${g}<path class="ln" d="${step('n')}" fill="none" stroke="var(--muted)" stroke-width="2"/><path class="ln" d="${step('y')}" fill="none" stroke="var(--win)" stroke-width="2.5"/></svg><div class="legend"><span><i style="background:var(--muted)"></i>Han respondido</span><span><i style="background:var(--win)"></i>Disponibles</span></div>`;
}
function aDisp(j){
  const f=poloFix(j), t=tie(j)||blankTie(), a=availFor(j), dl=deadline(j);
  const dlv=new Date(dl.getTime()-dl.getTimezoneOffset()*6e4).toISOString().slice(0,16);
  const row=(pid,k)=>{ const v=avOf(pid,j), n=noteOf(pid,j), hist=(avail[pid]?.h?.[jid(j)]||[]).length, ph=phones[pid];
    const hs=availStats(pid);
    return `<li><div class="row" style="gap:10px;flex-wrap:nowrap">${avatar(player(pid),'sm')}<div style="flex:1;min-width:0"><b>${esc(pname(pid))}</b> <span class="hist" title="Disponibilidad en la temporada">${hs.total? Math.round(hs.pct*100)+'% temp.' : ''}</span>${n?.c?`<div class="small">«${esc(n.c)}»</div>`:''}<div class="muted small">${v?.at? relTime(v.at) : 'Sin respuesta'}${hist>1? ', cambió '+(hist-1)+(hist>2?' veces':' vez'):''}</div></div>
      ${k==='none'? (ph? `<button class="btn sm ghost" data-act="wa-one" data-pid="${esc(pid)}" data-j="${j}">Recordar</button>` : '<span class="muted small">sin teléfono</span>') : ''}
      <select data-act="av-admin" data-pid="${esc(pid)}" data-j="${j}" aria-label="Anotar a mano" style="width:auto;min-height:32px;padding:4px 8px;font-size:.8rem"><option value="">Anotar</option><option value="yes">Disponible</option><option value="maybe">Pendiente</option><option value="no">No disponible</option></select></div></li>`; };
  return `<section class="sec"><div class="split"><div><div class="row" style="gap:20px;align-items:center">${ring(a.total? a.pct : null,'disponible')}<div style="flex:1">${availSummary(j)}</div></div>
      <p class="muted small">${a.yes.length} disponibles de ${a.total} jugadores en plantilla. ${t.availReq? 'Pedida '+relTime(t.availReq.at)+(t.availReq.n>1?' ('+t.availReq.n+' envíos)':'')+'.' : 'Aún no se ha pedido por WhatsApp.'}${(t.remLog||[]).length? ' Recordatorios enviados: '+t.remLog.length+'.' : ''}</p>
      ${deadlinePassed(j)? `<div class="final"><b>Resumen definitivo</b><span>${a.yes.length} disponibles: ${a.yes.map(x=>pname(x).split(' ')[0]).join(', ')||'nadie'}.${a.maybe.length?' Pendientes de confirmar: '+a.maybe.map(x=>pname(x).split(' ')[0]).join(', ')+'.':''} Sin respuesta: ${a.none.length}.</span><div class="row" style="margin-top:8px">${t.availClosed?`<button class="btn sm ghost" data-act="avail-reopen" data-j="${j}">Reabrir disponibilidad</button>`:''}<button class="btn sm brass" data-act="jtab" data-v="conv">Preparar la convocatoria</button></div></div>` : ''}
      <div class="row" style="margin-top:12px"><button class="btn brass" data-act="compose" data-kind="req" data-j="${j}">Solicitar disponibilidad</button>${!deadlinePassed(j)?`<button class="btn ghost sm" data-act="avail-close" data-j="${j}">Cerrar disponibilidad</button>`:''}<button class="btn ghost" data-act="compose" data-kind="rem" data-j="${j}" ${a.none.length?'':'disabled'}>Recordar a quien no ha respondido (${a.none.length})</button><a class="btn ghost sm" href="#disponibilidad-${j}">Ver la encuesta</a></div>
      ${composer('req',j,'Mensaje para el grupo')}${composer('rem',j,'Recordatorio para el grupo')}
      <div class="panel" style="margin-top:16px"><label class="f" style="margin-top:0" for="dl">Fecha límite para responder</label><div class="row"><input type="datetime-local" id="dl" value="${dlv}" style="max-width:260px"><button class="btn sm" data-act="dl-save" data-j="${j}">Guardar plazo</button>${t.deadline?`<button class="btn sm ghost" data-act="dl-reset" data-j="${j}">Usar el plazo por defecto</button>`:''}</div><p class="muted small" style="margin:6px 0 0">Por defecto, ${S.rules.deadlineDays} días antes a las ${esc(S.rules.deadlineTime)}. Pasado el plazo, solo los administradores pueden cambiar respuestas.</p></div>
      ${respChart(j)}</div>
    <div>${['yes','maybe','no','none'].map(k=>`<div class="avgroup ${k}"><h3>${AV_LABEL[k]} <span class="muted">${a[k].length}</span></h3>${a[k].length?`<ul class="avlist">${a[k].map(pid=>row(pid,k)).join('')}</ul>`:'<p class="muted small">Nadie.</p>'}</div>`).join('')}
      <p class="source">Los recordatorios individuales usan el teléfono guardado en «Plantilla y fotos». Los comentarios solo los ven los administradores y su autor.</p></div></div></section>`;
}
function aConv(j){
  const t=tie(j)||blankTie(), a=availFor(j), conv=new Set(t.convocados?.length? t.convocados : a.yes);
  const order=[...a.yes,...a.maybe,...a.none,...a.no];
  const badge=pid=>{ const v=avOf(pid,j)?.s||'none'; return `<em class="av-${v}">${{yes:'disponible',maybe:'pendiente',no:'no disponible',none:'sin respuesta'}[v]}</em>`; };
  const popts=sel=>`<option value="">Elegir</option>`+order.map(id=>`<option value="${esc(id)}" ${sel===id?'selected':''}>${esc(pname(id))}${conv.has(id)?'':' (no convocado)'}</option>`).join('');
  const assigned=new Set(t.rubbers.flatMap(r=>r.polo||[])); const subs=[...conv].filter(x=>!assigned.has(x));
  const dupe=t.rubbers.filter(r=>r.type==='S').map(r=>r.polo[0]).filter(Boolean); const hasDupe=new Set(dupe).size!==dupe.length;
  const warn=[...assigned].filter(x=>(avOf(x,j)?.s||'none')!=='yes');
  return `<section class="sec"><div class="sec-h"><h2>Convocados</h2><span class="muted small">${conv.size} seleccionados</span></div>
    <div class="cvgrid">${order.map(id=>{ const n=noteOf(id,j); return `<label title="${esc(n?.c||'')}"><input type="checkbox" name="conv" value="${esc(id)}" ${conv.has(id)?'checked':''}> ${esc(pname(id))}${badge(id)}</label>`; }).join('')}</div></section>
  <section class="sec"><div class="sec-h"><h2>Orden de juego</h2></div><p class="muted small">4 individuales y la pareja de dobles (${dblDecider()?'solo cuenta si queda 2-2':'cuenta siempre que se juegue'}). Los convocados sin partido asignado quedan como suplentes.</p>
    ${t.rubbers.map((r,i)=>`<div class="redit" data-r="${i}" style="grid-template-columns:150px 1fr 1fr"><span class="rn">${RUBBERS[i].label}${r.type==='D'?'<small>'+dblHint()+'</small>':''}</span><select name="p1">${popts(r.polo[0])}</select>${r.type==='D'?`<select name="p2">${popts(r.polo[1])}</select>`:'<span></span>'}</div>`).join('')}
    <p class="small" style="margin-top:10px">Suplentes: ${subs.length? subs.map(pname).join(', ') : 'ninguno'}.</p>
    ${hasDupe?'<div class="notice" style="margin-top:8px">Hay un jugador repetido en los individuales.</div>':''}
    ${warn.length?`<div class="notice" style="margin-top:8px">Sin «disponible» confirmado: ${warn.map(pname).join(', ')}.</div>`:''}
    <div class="row" style="margin-top:16px"><button class="btn ghost" data-act="conv-save" data-j="${j}">Guardar borrador</button>${t.lineupPub?`<button class="btn ghost" data-act="conv-pub" data-j="${j}" data-v="0">Retirar publicación</button><button class="btn brass" data-act="conv-save" data-j="${j}" data-pub="1">Guardar y mantener publicada</button>`:`<button class="btn brass" data-act="conv-save" data-j="${j}" data-pub="1">Publicar convocatoria</button>`}</div>
    ${t.lineupPub?`<div class="row" style="margin-top:12px"><button class="btn ghost" data-act="compose" data-kind="lineup" data-j="${j}">Anunciar por WhatsApp</button><button class="btn ghost" data-act="poster-scroll">Ver el cartel</button></div>`:''}
    ${composer('lineup',j,'Anuncio de la convocatoria')}</section>`;
}
function posterOpts(j){ const t=tie(j)||{}; const p=t.poster||{}; const f=poloFix(j);
  return {fmt:p.fmt||'story', bg:p.bg||(photos._team?'team':'court'), title:p.title||'Convocatoria', sub:p.sub||`Jornada ${j}, ${S.comp.name.replace(/^\d+a /,'')}`, tagline:p.tagline||'¡Vamos Polo!', showSubs:p.showSubs!==false, order:p.order||[], hidden:p.hidden||[]}; }
function aCartel(j){
  const t=tie(j); if(!t || !lineupList(j).length) return `<section class="sec"><div class="empty">Primero elige los convocados y el orden de juego en «Convocatoria».</div></section>`;
  const o=posterOpts(j), all=(()=>{ const save=t.poster; t.poster={...(save||{}),hidden:[]}; const l=lineupList(j); t.poster=save; return l; })(), roles=rolesOf(j);
  return `<section class="sec"><div class="split"><div>
    <div class="chips">${[['story','Vertical 9:16'],['square','Cuadrado'],['wide','Horizontal']].map(([k,l])=>`<button class="chip" data-act="poster-set" data-k="fmt" data-v="${k}" aria-pressed="${o.fmt===k}">${l}</button>`).join('')}</div>
    <div class="chips" style="margin-top:8px">${[['court','Pista'],['team','Foto del equipo']].map(([k,l])=>`<button class="chip" data-act="poster-set" data-k="bg" data-v="${k}" aria-pressed="${o.bg===k}" ${k==='team'&&!photos._team?'disabled title="Sube la foto del equipo en Temporadas y ajustes"':''}>${l}</button>`).join('')}</div>
    <label class="f">Título</label><input type="text" id="pt-title" value="${esc(o.title)}">
    <label class="f">Subtítulo</label><input type="text" id="pt-sub" value="${esc(o.sub)}">
    <label class="f">Lema</label><input type="text" id="pt-tag" value="${esc(o.tagline)}">
    <label class="f">Jugadores en el cartel (orden y visibilidad)</label>
    <ul class="plist">${all.map((pid,i)=>`<li><label><input type="checkbox" data-act="poster-hide" data-pid="${esc(pid)}" ${o.hidden.includes(pid)?'':'checked'}> ${esc(pname(pid))} <span class="muted small">${esc((roles[pid]||[]).join(' + '))}</span></label><span><button class="iconbtn" data-act="poster-move" data-pid="${esc(pid)}" data-d="-1" ${i===0?'disabled':''} aria-label="Subir">↑</button><button class="iconbtn" data-act="poster-move" data-pid="${esc(pid)}" data-d="1" ${i===all.length-1?'disabled':''} aria-label="Bajar">↓</button></span></li>`).join('')}</ul>
    <div class="row" style="margin-top:12px"><button class="btn ghost sm" data-act="poster-texts" data-j="${j}">Aplicar textos</button>${t.poster&&Object.keys(t.poster).length?`<button class="btn ghost sm" data-act="poster-reset" data-j="${j}">Volver al diseño automático</button>`:''}</div>
    </div><div><canvas id="poster-canvas" data-j="${j}" class="pcanvas"></canvas>
    <div class="row" style="margin-top:12px"><button class="btn brass" data-act="poster-dl" data-j="${j}">Descargar imagen</button>${navigator.share?`<button class="btn" data-act="poster-share" data-j="${j}">Compartir</button>`:''}</div>
    <p class="muted small">Se compone solo según el número de jugadores. Las fotos salen de sus perfiles.</p></div></div></section>`;
}
function aResultados(j){
  const ad=actaDocFor(j), mode=(ui.resMode||{})[j] || (ad && ['subido','procesando','revision','error'].includes(ad.status)? 'acta' : 'manual');
  const sw=`<section class="sec" style="padding-bottom:0"><div class="seg resmode" role="group" aria-label="Cómo añadir los resultados"><button data-act="res-mode" data-j="${j}" data-v="manual" aria-pressed="${mode==='manual'}">Introducir manualmente</button><button data-act="res-mode" data-j="${j}" data-v="acta" aria-pressed="${mode==='acta'}">Subir acta oficial</button></div></section>`;
  return sw + (mode==='acta'? actaPanel(j) : aResultadosManual(j));
}
function aResultadosManual(j){
  const f=poloFix(j), t=tie(j)||blankTie(), p=persp(f), conv=new Set(t.convocados||[]);
  const order=[...S.players.filter(x=>conv.has(x.id)), ...S.players.filter(x=>!conv.has(x.id)&&x.active!==false)].map(x=>x.id);
  const popts=sel=>`<option value="">Elegir</option>`+order.map(id=>`<option value="${esc(id)}" ${sel===id?'selected':''}>${esc(pname(id))}</option>`).join('');
  const v=validateTie(t), tr=tieFromRubbers(j)||{}, fx=poloFix(j);
  const status = isPlayed(fx)? (fx.status==='official'? '<span class="badge ok">Oficial</span>' : '<span class="badge prov">Provisional, pendiente de validar</span>') : '<span class="badge">Sin resultado</span>';
  const fctWarn = fx?.fctScore? `<div class="vbox warn" style="margin-bottom:12px">La FCT tiene un resultado distinto para esta jornada: <b>${esc(fx.home===POLO? fx.fctScore : fx.fctScore.split('-').reverse().join('-'))}</b> (marcador del Polo primero). Revisa el acta o avisa a la Federació.</div>` : '';
  return `<section class="sec"><div class="resbar"><div><span class="muted small">Eliminatoria</span><b>Polo ${tr.decided? tr.w+'-'+tr.l : (p.ps??'–')+'-'+(p.rs??'–')}</b></div><div>${status}</div></div>${fctWarn}
    ${v.errors.length? `<div class="vbox err"><b>Corrige antes de guardar</b><ul>${v.errors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}${v.warnings.length? `<div class="vbox warn"><ul>${v.warnings.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
    <p class="muted small">Marcador desde el punto de vista del Polo, sets separados por espacios: <b>6-4 3-6 6-3</b>. El resultado se calcula solo; fuerza uno a mano para W.O. o abandono. Los jugadores vienen de la convocatoria; cámbialos si hubo cambios de última hora.</p>
    ${t.rubbers.map((r,i)=>`<div class="redit" data-r="${i}"><span class="rn">${RUBBERS[i].label}${r.type==='D'?'<small>'+dblHint()+'</small>':''}</span>
      <select name="p1" aria-label="Jugador">${popts(r.polo[0])}</select>${r.type==='D'?`<select name="p2" aria-label="Pareja">${popts(r.polo[1])}</select>`:'<span></span>'}
      <input type="text" name="score" placeholder="6-4 6-3" value="${esc(r.score)}">
      <select name="res"><option value="">Auto</option><option value="W" ${r.res==='W'?'selected':''}>Gana Polo</option><option value="L" ${r.res==='L'?'selected':''}>Pierde Polo</option></select>
      <input type="text" name="note" placeholder="Nota: W.O., abandono…" value="${esc(r.note)}" style="grid-column:2 / -2"><button class="btn sm ghost" data-act="res-clear" data-j="${j}" data-r="${i}" ${r.score||r.res?'':'disabled'}>Borrar</button>
      ${(()=>{ const e=validateRubber(r); return e.length&&(r.score||r.res)? `<p class="rerr">${esc(e.join('. '))}</p>` : (rubberCalc(r).res? `<p class="rok">${rubberCalc(r).res==='W'?'Gana el Polo':'Gana el rival'}</p>`:''); })()}</div>`).join('')}
    <label class="f" for="moment">Momento de la jornada (público)</label><input type="text" id="moment" value="${esc(t.moment||'')}">
    <div class="panel" style="margin-top:16px"><b>Marcador por equipos</b><p class="muted small" style="margin:4px 0 10px">Se calcula solo con los 4 individuales y el dobles (${dblDecider()?'este solo si hubo 2-2':'si se jugó'}). Si solo tienes el oficial, escríbelo aquí.</p>
      <div class="row"><label>Polo <input type="number" id="ps" min="0" max="5" value="${p.ps??''}" style="width:80px"></label><label>${esc(clubName(p.rival))} <input type="number" id="rs" min="0" max="5" value="${p.rs??''}" style="width:80px"></label></div></div>
    <div class="row" style="margin-top:16px"><button class="btn brass" data-act="save-tie" data-j="${j}">Guardar resultados</button>${isPlayed(fx)&&fx.status!=='official'?`<button class="btn ghost" data-act="res-confirm" data-j="${j}">Confirmar como resultado oficial</button>`:''}${fx.status==='official'&&isPlayed(fx)?`<button class="btn ghost sm" data-act="res-unconfirm" data-j="${j}">Marcar como provisional</button>`:''}<a class="textlink" href="#jornada-${j}">Ver la jornada</a></div>
    <p class="muted small">Si corriges o borras un resultado, todas las estadísticas, rankings y perfiles se recalculan solos. «Oficial» significa que coincide con el acta de la federación.</p>
    ${isPlayed(f)&&false? `<div class="panel" style="margin-top:20px"><b>Encuesta para los que jugaron</b><p class="muted small" style="margin:4px 0 10px">Se abre sola para ${participants(j).map(pname).join(', ')||'los jugadores con resultado'}. Al guardar el resultado se les envía una notificación; aquí puedes avisarles también por WhatsApp.${t.surveyAnnounced?' Último aviso por WhatsApp '+relTime(t.surveyAnnounced)+'.':''}</p>
      <div class="row"><button class="btn ghost" data-act="compose" data-kind="survey" data-j="${j}">Avisar por WhatsApp</button><button class="btn ghost sm" data-act="notify" data-type="survey" data-j="${j}">Reenviar notificación</button></div>${composer('survey',j,'Aviso de la encuesta')}</div>`:''}</section>`;
}
function aggregate(k){
  const out={n:0,votes:{},ratings:{},texts:[],who:[]}, sums={}, cnt={};
  Object.entries(ballots).forEach(([pid,b])=>{ const r=b.j?.[k]; if(!r) return; out.n++; out.who.push(pid);
    S.survey.questions.forEach(q=>{ const v=r.a?.[q.id]; if(v==null||v==='') return;
      if(q.scope==='peer'){ (out.votes[q.id] ||= {}); out.votes[q.id][v]=(out.votes[q.id][v]||0)+1; }
      else if(q.scope==='team'&&q.type==='scale'){ sums[q.id]=(sums[q.id]||0)+(+v); cnt[q.id]=(cnt[q.id]||0)+1; }
      else if(q.type==='text') out.texts.push({pid,q:q.text,v}); }); });
  Object.keys(sums).forEach(q=>out.ratings[q]=sums[q]/cnt[q]); return out;
}
function aEncuesta(j){
  if(!canPrivate) return `<section class="sec"><div class="panel"><b>Encuesta de la jornada ${j}</b><p class="muted small" style="margin:6px 0 10px">Se abre sola para los que jugaron. Sus respuestas individuales son privadas: solo las ven los administradores y capitanes marcados, que publican la nota media del equipo.</p><div class="row"><button class="btn sm ghost" data-act="compose" data-kind="survey" data-j="${j}">Avisar por WhatsApp</button><button class="btn sm ghost" data-act="notify" data-type="survey" data-j="${j}">Reenviar notificación</button></div>${composer('survey',j,'Aviso de la encuesta')}</div></section>`;
  const k=jid(j), agg=aggregate(k), parts=participants(j), closed=!!S.survey.closed?.[k], missing=parts.filter(pid=>!agg.who.includes(pid));
  return `<section class="sec"><div class="panel"><b>Encuesta de la jornada ${j}: ${closed?'cerrada':isPlayed(poloFix(j))?'abierta para los que jugaron':'se abrirá al cargar el resultado'}</b>
    <p class="muted small" style="margin:6px 0 10px">${agg.n} de ${parts.length} han respondido.${missing.length?' Faltan: '+missing.map(pname).join(', ')+'.':''}</p>
    <div class="row"><button class="btn sm ghost" data-act="survey-toggle" data-j="${j}">${closed?'Reabrir encuesta':'Cerrar encuesta'}</button><button class="btn sm ghost" data-act="compose" data-kind="survey" data-j="${j}">Avisar por WhatsApp</button><button class="btn sm ghost" data-act="notify" data-type="survey" data-j="${j}">Reenviar notificación</button></div>${composer('survey',j,'Aviso de la encuesta')}</div></section>
  <section class="sec"><div class="sec-h"><h2>Valoración del equipo</h2></div><p>${Object.entries(agg.ratings).map(([q,v])=>`${esc(S.survey.questions.find(x=>x.id===q)?.text||q)} <b>${dec(v)}</b>`).join('. ')||'<span class="muted">Sin respuestas todavía.</span>'}</p>
    <div class="row" style="margin-top:10px"><button class="btn sm" data-act="ratings-pub" data-j="${j}">Publicar la nota media del equipo</button></div><p class="source">Las autovaloraciones y los comentarios nunca se publican.</p></section>
  ${agg.texts.length?`<section class="sec"><div class="sec-h"><h2>Comentarios privados</h2></div><ul class="insights">${agg.texts.map(x=>`<li>${esc(x.v)}<small>${esc(pname(x.pid))}, ${esc(x.q)}</small></li>`).join('')}</ul></section>`:''}`;
}
function mvpTally(k){ if(canPrivate && mvpVotes[k] && Object.keys(mvpVotes[k]).length){ const t={}; Object.values(mvpVotes[k]).forEach(v=>{ if(v?.v) t[v.v]=(t[v.v]||0)+1; }); return t; } return {...(mvpCounts[k]?.t||{})}; }
const mvpVoteCount = k => canPrivate && mvpVotes[k] && Object.keys(mvpVotes[k]).length? Object.keys(mvpVotes[k]).length : (mvpCounts[k]?.n||0);
function aMvp(j){
  const k=jid(j), f=poloFix(j), m=mvpState(j), pub=S.published[k], votes=mvpVotes[k]||{}, tally=mvpTally(k), voters=S.players.filter(p=>p.active!==false).map(p=>p.id);
  const nVotes=mvpVoteCount(k), voted=canPrivate? voters.filter(v=>votes[v]) : [], missing=canPrivate? voters.filter(v=>!votes[v]) : [], sorted=Object.entries(tally).sort((a,b)=>b[1]-a[1]), top=sorted[0]?.[1]||0, tied=sorted.filter(x=>x[1]===top).map(x=>x[0]);
  if(!isPlayed(f)) return `<section class="sec"><div class="empty">La votación del MVP se abre sola al guardar el resultado de la eliminatoria.</div></section>`;
  const dl=m?.deadline? new Date(+m.deadline) : new Date(Date.now()+(S.rules.mvpHours||48)*3600e3), dlv=new Date(dl.getTime()-dl.getTimezoneOffset()*6e4).toISOString().slice(0,16);
  const state = pub?.mvp? 'Publicado' : mvpOpen(j)? 'Abierta' : m? 'Cerrada, pendiente de publicar' : 'Sin abrir';
  return `<section class="sec"><div class="split"><div>
    <div class="row" style="gap:20px;align-items:center">${ring(voters.length? nVotes/voters.length : null,'han votado')}<div><b style="font-stretch:72%;font-size:1.5rem">Votación: ${state}</b><p class="muted small" style="margin:4px 0 0">${nVotes} de ${voters.length} jugadores han votado.${m?.deadline&&!pub?.mvp?' Plazo: '+esc(fmtDT(dl))+'.':''}</p></div></div>
    <div class="panel" style="margin-top:14px"><label class="f" style="margin-top:0" for="mvp-dl">Fecha límite</label><div class="row"><input type="datetime-local" id="mvp-dl" value="${dlv}" style="max-width:240px">
      ${!m||!m.open? `<button class="btn brass sm" data-act="mvp-open" data-j="${j}">${m?'Reabrir votación':'Abrir votación'}</button>` : `<button class="btn sm" data-act="mvp-open" data-j="${j}">Cambiar plazo</button><button class="btn ghost sm" data-act="mvp-close" data-j="${j}">Cerrar ahora</button>`}</div>
      <div class="row" style="margin-top:10px"><button class="btn ghost sm" data-act="compose" data-kind="mvp" data-j="${j}">Avisar por WhatsApp</button><button class="btn ghost sm" data-act="notify" data-type="mvp" data-j="${j}">Enviar notificación</button></div>${composer('mvp',j,'Aviso de la votación')}</div>
    <div class="sec-h" style="margin-top:22px"><h3>Participación</h3></div>
    ${canPrivate? `<p class="small"><b>Han votado:</b> ${voted.map(pname).join(', ')||'nadie todavía'}.</p><p class="small muted"><b>Faltan:</b> ${missing.map(pname).join(', ')||'nadie'}.</p>` : `<p class="small muted">El voto es secreto: quién ha votado a quién solo lo ven los administradores y capitanes marcados.</p>`}</div>
  <div><div class="sec-h"><h2>Recuento</h2></div>${sorted.length? `<ol class="tally">${sorted.map(([pid,n])=>`<li>${avatar(player(pid),'sm')}<span>${esc(pname(pid))}</span><span class="tb"><i data-w="${Math.round(n/top*100)}"></i></span><b>${n}</b></li>`).join('')}</ol>` : '<div class="empty">Aún no hay votos.</div>'}
    ${tied.length>1?`<div class="notice" style="margin-top:10px">Empate a ${top} entre ${tied.map(pname).join(' y ')}. Elige al MVP abajo.</div>`:''}
    <div class="panel" style="margin-top:14px"><b>Publicar el MVP</b>
      <label class="f">MVP</label><select id="mvp-pick">${(tied.length? tied : mvpCandidates(j)).concat(mvpCandidates(j).filter(x=>!tied.includes(x))).filter((x,i,a)=>a.indexOf(x)===i).map(pid=>`<option value="${esc(pid)}" ${(pub?.mvp||tied[0])===pid?'selected':''}>${esc(pname(pid))} (${tally[pid]||0} ${tally[pid]===1?'voto':'votos'})</option>`).join('')}</select>
      <p class="muted small" style="margin:6px 0 0">Por defecto, el más votado. Elegir a otro queda marcado como decisión del capitán.</p>
      <div class="row" style="margin-top:12px"><button class="btn brass" data-act="mvp-publish" data-j="${j}">${pub?.mvp?'Actualizar MVP publicado':'Cerrar y publicar el MVP'}</button>${pub?.mvp?`<button class="btn ghost sm" data-act="mvp-unpublish" data-j="${j}">Retirar publicación</button>`:''}</div></div>
    ${canPrivate? '' : '<!--'}<details class="panel" style="margin-top:14px"><summary><b>Incidencias</b> <span class="muted small">(anular un voto)</span></summary>
      ${voted.length? `<ul class="avlist" style="margin-top:10px">${voted.map(v=>`<li class="row" style="justify-content:space-between"><span class="small">${esc(pname(v))} votó a <b>${esc(pname(votes[v].v))}</b> <span class="muted">${relTime(votes[v].at)}</span></span><button class="btn sm ghost" data-act="mvp-annul" data-j="${j}" data-voter="${esc(v)}">Anular</button></li>`).join('')}</ul>` : '<p class="muted small">Sin votos.</p>'}
      <p class="muted small">Al anular un voto, ese jugador puede volver a votar mientras la votación siga abierta.</p></details>${canPrivate? '' : '-->'}</div></div></section>`;
}
function vMvp(j){
  const f=poloFix(j); if(!f) return vNotFound(); const k=jid(j), p=persp(f), pub=S.published[k], mine=myVotes[k], m=mvpState(j);
  let h=`<div class="wrap"><div class="pagehead"><p class="qsec">🏆 Votación MVP</p><h1>Jornada ${j}</h1><p class="lede">Polo ${p.played? p.ps+'-'+p.rs : 'contra'} ${esc(clubName(p.rival))}, ${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}.</p></div>`;
  if(pub?.mvp) return h+`<section class="sec">${mvpCard(j)}</section><section class="sec">${mvpRanking(true)}</section></div>`;
  if(!m) return h+`<div class="empty">La votación se abre cuando se cargue el resultado de la eliminatoria.</div></div>`;
  if(mine) return h+`<section class="sec"><div class="panel done"><p class="q">Has votado a ${esc(pname(mine))} ✓</p><p class="muted">Tu voto es único y ya no se puede cambiar. El resultado se publicará al cerrar la votación${mvpOpen(j)?', el '+esc(fmtDT(new Date(m.deadline))):''}.</p></div></section></div>`;
  if(!mvpOpen(j)) return h+`<div class="empty">La votación está cerrada. El capitán publicará el resultado.</div></div>`;
  if(!me) return h+`<div class="notice">Elige tu nombre en Yo para poder votar.</div></div>`;
  const cands=mvpCandidates(j).filter(x=>x!==me), roles=rolesOf(j), t=tie(j);
  const res=pid=>(t?.rubbers||[]).filter(r=>(r.polo||[]).includes(pid)).map(r=>{ const c=rubberCalc(r); return `<span class="vr ${c.res||''}">${r.type==='D'?'D':'I'+r.n} ${c.sets.map(s=>s.join('-')).join(' ')}</span>`; }).join('');
  return h+`<section class="sec"><p class="muted" style="margin-top:0">Elige al mejor jugador de la eliminatoria. Un solo voto, no puedes votarte y no se puede cambiar. Hasta el ${esc(fmtDT(new Date(m.deadline)))}.</p>
    <div class="vgrid stagger">${cands.map(pid=>{ const pl=player(pid), ph=photos[pid]?.d; return `<button class="vcard press" data-act="mvp-pick" data-pid="${esc(pid)}" aria-pressed="${ui.mvpPick===pid}"><span class="vc-photo">${ph?`<img src="${esc(ph)}" alt="">`:`<i>${esc(pl.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</i>`}</span><span class="vc-n">${esc(pl.name)}</span><span class="vc-r">${res(pid)}</span></button>`; }).join('')}</div>
    ${cands.length?'':'<div class="empty">No hay jugadores con resultado en esta jornada.</div>'}</section>
    <div class="vbar ${ui.mvpPick?'on':''}"><span>${ui.mvpPick? 'Tu voto: <b>'+esc(pname(ui.mvpPick))+'</b>' : ''}</span><button class="btn brass" data-act="mvp-cast" data-j="${j}" ${ui.mvpPick?'':'disabled'}>Confirmar voto</button></div></div>`;
}
function mvpRanking(compact){
  const rows=S.players.map(p=>({p,m:mvpCount(p.id),v:totalVotes(p.id)})).filter(x=>x.m||x.v).sort((a,b)=>b.m-a.m||b.v-a.v);
  if(!rows.length) return `<div class="sec-h"><h2>Ranking MVP de la temporada</h2></div><div class="empty">Aún no se ha publicado ningún MVP.</div>`;
  const pod=rows.slice(0,3), order=[pod[1],pod[0],pod[2]].filter(Boolean);
  return `<div class="sec-h"><h2>Ranking MVP de la temporada</h2></div><div class="podium">${order.map(x=>{ const i=rows.indexOf(x), ph=photos[x.p.id]?.d; return `<button class="pod p${i+1}" data-player="${esc(x.p.id)}"><span class="pod-ph">${ph?`<img src="${esc(ph)}" alt="">`:`<i>${esc(x.p.name.split(' ').map(y=>y[0]).slice(0,2).join(''))}</i>`}</span><span class="pod-n">${esc(x.p.name)}</span><span class="pod-b"><b>${x.m}</b> MVP<small>${x.v} votos</small></span><span class="pod-s">${i+1}</span></button>`; }).join('')}</div>
    ${compact||rows.length<=3? '' : `<table style="margin-top:18px"><thead><tr><th>Jugador</th><th>MVP</th><th>Votos</th></tr></thead><tbody class="stagger">${rows.map(x=>`<tr><td>${plink(x.p.id)}</td><td><b>${x.m}</b></td><td>${x.v}</td></tr>`).join('')}</tbody></table>`}
    <p class="source">Un voto por jugador en cada jornada. Gana el más votado.</p>`;
}
function aPreguntas(){
  const sc=v=>Object.entries(SCOPE_LABEL).map(([k,l])=>`<option value="${k}" ${v===k?'selected':''}>${l}</option>`).join('');
  const ty=v=>[['scale','Nota 1-10'],['player','Elegir jugador'],['text','Texto libre']].map(([k,l])=>`<option value="${k}" ${v===k?'selected':''}>${l}</option>`).join('');
  return `<section class="sec"><div class="sec-h"><h2>Preguntas de la encuesta</h2></div><p class="muted small">«Sobre tus compañeros» se publica como votos agregados y solo deja elegir entre los que jugaron. «Sobre el equipo» como nota media. «Sobre ti» y «Comentarios» son privados.</p>
    <div id="qlist">${S.survey.questions.map((q,i)=>`<div class="qedit" data-i="${i}"><input type="text" name="text" value="${esc(q.text)}" aria-label="Pregunta"><select name="scope">${sc(q.scope)}</select><select name="type">${ty(q.type)}</select><button class="iconbtn" data-act="q-del" data-i="${i}" aria-label="Eliminar">✕</button></div>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn ghost sm" data-act="q-add">Añadir pregunta</button><button class="btn brass" data-act="q-save">Guardar preguntas</button><button class="btn ghost sm" data-act="q-reset">Restaurar</button></div></section>`;
}
function aPlantilla(){
  return `<section class="sec"><div class="sec-h"><h2>Plantilla</h2><span class="muted small">${S.players.length} jugadores</span></div><p class="muted small">Los marcados como capitanes pueden pedir disponibilidad, convocar, preparar el cartel, poner resultados y gestionar la encuesta. Cada jugador puede subir su propia foto, su teléfono y su ficha desde «Yo». Cada foto se sube una vez y se usa en toda la app: perfiles, equipo, rankings, convocatorias y carteles. El teléfono solo lo ven los administradores y sirve para los recordatorios individuales por WhatsApp.</p>
    <div id="plist">${S.players.slice().sort((a,b)=>a.order-b.order).map(p=>`<div class="pedit" data-id="${esc(p.id)}">
      <button class="phbtn" data-act="crop" data-target="${esc(p.id)}" title="Subir o recortar la foto">${avatar(p)}<span>${photos[p.id]?'Cambiar':'Subir'} foto</span></button>
      <div class="pf"><label>Nombre<input type="text" name="name" value="${esc(p.name)}"></label><label>Nombre completo<input type="text" name="full" value="${esc(p.full)}"></label></div>
      <div class="pf sm"><label>Orden<input type="number" name="order" value="${p.order}"></label><label>Categoría<input type="text" name="cat" value="${esc(p.cat)}"></label><label>Puntos FCT<input type="number" name="pts" value="${p.pts??0}"></label><label>Teléfono<input type="tel" name="phone" value="${esc(phones[p.id]||'')}" placeholder="+34 600 000 000"></label></div>
      <div class="row small" style="gap:12px"><label><input type="checkbox" name="captain" value="${esc(p.id)}" ${(S.captains||[]).includes(p.id)?'checked':''} ${isAdmin?'':'disabled'}> Capitán</label><label><input type="checkbox" name="active" ${p.active!==false?'checked':''}> En plantilla</label>${photos[p.id]?`<button class="textlink" data-act="photo-del" data-target="${esc(p.id)}">Quitar foto</button>`:''}<span class="muted">${claims[p.id]? 'Entra como '+esc(claims[p.id].email) : 'Aún no ha entrado'}</span>${claims[p.id]&&isAdmin?`<button class="textlink" data-act="unclaim" data-pid="${esc(p.id)}">Liberar acceso</button>`:''}</div></div>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn brass" data-act="players-save">Guardar plantilla</button></div>
    <div class="panel" style="margin-top:24px"><b>Añadir jugador</b><div class="row" style="margin-top:10px"><input type="text" id="np-name" placeholder="Nombre corto" style="max-width:200px"><input type="text" id="np-full" placeholder="Nombre completo" style="max-width:240px"><input type="text" id="np-cat" placeholder="Categoría" style="max-width:140px"><button class="btn sm" data-act="player-add">Añadir</button></div></div></section>`;
}
const FCT_GROUPS={'2026-27':4622,'2026-27-polo-a':4622,'2026-27-polo-b':4621,'2026-27-fem-a':4599};
const fctDefaultGroup = () => FCT_GROUPS[SEASON_PATH.split('/')[1]]||null;
function fctAgo(){ const L=S.fctLast; return L?.at? relTime(L.at) : null; }
function fctPanel(){ const L=S.fctLast, has=S.comp.fctGroup||fctDefaultGroup();
  return `<section class="sec"><div class="sec-h"><h2>Resultados de la FCT</h2></div><div class="panel"><p class="muted small" style="margin:0 0 10px">Cada noche la app consulta el portal de la Federació (grupo ${esc(String(has||'sin configurar'))}) y copia los resultados de toda la liga y los cambios de fecha. Acta cerrada en la FCT = oficial; si no, provisional. Los resultados del Polo que ya hayáis puesto no se cambian: si no coinciden, se avisa.</p>
    ${L? `<p class="small" style="margin:0 0 10px">Última consulta ${esc(fctAgo())}: ${L.results||0} resultados y ${L.dates||0} fechas actualizadas${L.diffs?.length? `. <b>La FCT tiene otro resultado en la jornada ${L.diffs.map(x=>x.j).join(', ')}</b>` : ''}${L.dateDiffs?.length? `. <b>La FCT tiene otra fecha en la jornada ${L.dateDiffs.map(x=>x.j).join(', ')}</b> (se mantiene la que puso el capitán)` : ''}${L.newTeams?.length? `. Clubes nuevos añadidos: ${esc(L.newTeams.join(', '))}; revisa en «Clubes» que no estén repetidos` : ''}.</p>` : ''}
    <button class="btn ghost sm" data-act="fct-sync" ${has?'':'disabled'}>Actualizar ahora desde la FCT</button></div></section>`; }
function aCalendario(){
  const j=ui.calJ || currentJ() || 1, fs=S.fixtures.filter(f=>f.j===j), topts=sel=>S.teams.map(t=>`<option value="${t.id}" ${sel===t.id?'selected':''}>${esc(t.short)}</option>`).join('');
  const js=[...new Set(S.fixtures.map(f=>f.j))].sort((a,b)=>a-b);
  return `<section class="sec"><div class="sec-h"><h2>Competición</h2></div>
    <label class="f">Nombre</label><input type="text" id="c-name" value="${esc(S.comp.name)}"><label class="f">Grupo</label><input type="text" id="c-group" value="${esc(S.comp.group)}"><label class="f">Memorial o subtítulo</label><input type="text" id="c-mem" value="${esc(S.comp.memorial||'')}">
    <label class="f">Código del grupo en la FCT</label><input type="text" inputmode="numeric" id="c-fct" value="${esc(String(S.comp.fctGroup||fctDefaultGroup()||''))}" placeholder="Por ejemplo, 4622" style="max-width:160px">
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-act="comp-save">Guardar competición</button></div></section>
  ${fctPanel()}
  <section class="sec"><div class="sec-h"><h2>Clubes</h2></div><div id="tlist">${S.teams.map(t=>`<div class="qedit" data-id="${t.id}" style="grid-template-columns:1fr 1fr 90px 40px"><input type="text" name="name" value="${esc(t.name)}" aria-label="Nombre del club"><input type="text" name="short" value="${esc(t.short)}" aria-label="Nombre corto"><input type="text" name="abbr" value="${esc(t.abbr)}" aria-label="Siglas">${t.id===POLO?'<span></span>':`<button class="iconbtn" data-act="team-del" data-id="${t.id}" aria-label="Quitar club">✕</button>`}</div>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-act="teams-save">Guardar clubes</button><input type="text" id="nt-name" placeholder="Nuevo club" style="max-width:220px"><button class="btn sm ghost" data-act="team-add">Añadir club</button></div></section>
  <section class="sec"><div class="sec-h"><h2>Calendario y resultados</h2></div>
    <div class="row"><select data-act="cal-j" style="max-width:260px">${js.map(x=>`<option value="${x}" ${x===j?'selected':''}>Jornada ${x}</option>`).join('')}</select><button class="btn sm ghost" data-act="jornada-add">Añadir jornada</button></div>
    <div id="flist" style="margin-top:12px">${fs.map(f=>`<div class="qedit" data-k="${S.fixtures.indexOf(f)}" style="grid-template-columns:140px 90px 1fr 1fr 60px 60px 40px"><input type="date" name="date" value="${f.date}"><input type="time" name="time" value="${f.time}"><select name="home">${topts(f.home)}</select><select name="away">${topts(f.away)}</select><input type="number" name="hs" min="0" max="5" value="${f.hs??''}" aria-label="Local"><input type="number" name="as" min="0" max="5" value="${f.as??''}" aria-label="Visitante"><button class="iconbtn" data-act="fix-del" data-k="${S.fixtures.indexOf(f)}" aria-label="Quitar enfrentamiento">✕</button></div>`).join('')||'<div class="empty">Sin enfrentamientos en esta jornada.</div>'}</div>
    <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-act="fix-add" data-j="${j}">Añadir enfrentamiento</button><label class="small">Cambiar la fecha de toda la jornada <input type="date" id="jdate" style="max-width:170px"></label><button class="btn sm ghost" data-act="jdate" data-j="${j}">Aplicar</button></div>
    <p class="muted small">Cambiar fecha u hora actualiza solo el calendario, la portada, la página de la jornada, el plazo de disponibilidad y los mensajes.</p>
    <div class="row" style="margin-top:12px"><button class="btn brass" data-act="fixtures-save" data-j="${j}">Guardar jornada ${j}</button></div></section>
  <section class="sec"><div class="sec-h"><h2>Clasificación oficial</h2></div><p class="muted small">Copia el orden que publica la FCT. Mientras corresponda a la última jornada disputada, la app lo respeta tal cual.</p>
    <label class="f">Tras la jornada</label><input type="number" id="off-j" min="0" max="${NJ()}" value="${S.official?.asOf??''}" style="max-width:100px">
    <div id="offlist" style="margin-top:8px">${S.teams.map((_,i)=>`<div class="row" style="padding:4px 0"><span style="width:24px">${i+1}</span><select style="max-width:280px">${topts(S.official?.order?.[i])}</select></div>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-act="official-save">Guardar orden oficial</button></div></section>`;
}
const currentSeason = () => meta?.current || SEASON_ID;
const clubTeams = () => { const base=(Array.isArray(meta?.teams) && meta.teams.length)? meta.teams : []; return [...base, ...DEFAULT_CLUB_TEAMS.filter(d=>!base.some(t=>t.id===d.id))].map(t=>({gender:'',...t})); };
const curTeam = () => clubTeams().find(t=>t.id===teamId) || clubTeams()[0];
const teamLabel = () => curTeam()?.short || 'Polo A';
const teamCat = t => [t?.cat, (t?.gender||'').toLowerCase()].filter(Boolean).join(' ');
function aTemporadas(){
  const list=meta?.seasons?.length? meta.seasons : [SEASON_ID];
  const vars='{rival} {fecha} {hora} {lugar} {limite} {enlace} {enlaceJornada} {jornada} {pendientes} {nombre} {lista} {resultado} {jugadores} {enlaceEncuesta} {enlaceMvp} {limiteMvp} {cronica} {partidos}';
  return `${autoRemindPanel()}${isAdmin? `<section class="sec"><div class="sec-h"><h2>Quién gestiona</h2></div><div class="panel"><label class="row" style="gap:10px;flex-wrap:nowrap"><input type="checkbox" id="team-manage" ${teamMode()?'checked':''}> <span><b>Todo el equipo</b> puede gestionar jornadas, convocatorias, resultados, MVP, calendario, plantilla y fotos.<br><span class="muted small">Si lo desactivas, solo los capitanes marcados y los administradores. Las respuestas individuales de la encuesta y quién votó a quién siguen siendo privadas en ambos casos.</span></span></label><div class="row" style="margin-top:10px"><button class="btn sm" data-act="team-save">Guardar</button></div></div></section>` : ''}
  ${isAdmin? '' : '<!--'}<section class="sec"><div class="sec-h"><h2>Temporadas</h2></div>
    <table><tbody>${list.map(id=>`<tr><td><b>${esc(id)}</b>${id===currentSeason()?' <span class="tag">actual</span>':''}${id===viewSeason?' <span class="tag">viendo</span>':''}</td><td>${id!==viewSeason?`<button class="btn sm ghost" data-act="season-view" data-id="${esc(id)}">Ver</button>`:''} ${id!==currentSeason()?`<button class="btn sm ghost" data-act="season-current" data-id="${esc(id)}">Hacer actual</button>`:''}</td></tr>`).join('')}</tbody></table>
    <div class="panel" style="margin-top:16px"><b>Nueva temporada</b><p class="muted small" style="margin:4px 0 10px">Las temporadas anteriores se conservan enteras: resultados, disponibilidad, encuestas y MVP. La nueva copia plantilla y clubes; el calendario empieza vacío.</p>
      <div class="row"><input type="text" id="ns-id" placeholder="2027-28" style="max-width:140px"><label class="small"><input type="checkbox" id="ns-copy" checked> Copiar plantilla y clubes</label><button class="btn sm" data-act="season-new">Crear temporada</button></div></div></section>
  ${isAdmin? '' : '-->'}<section class="sec"><div class="sec-h"><h2>Foto del equipo</h2></div>${photos._team?`<img src="${esc(photos._team.d)}" alt="" style="border-radius:12px;max-height:240px;object-fit:cover;width:100%">`:'<div class="empty">Aún no hay foto. Saldrá a pantalla completa en la portada y como fondo opcional de los carteles.</div>'}
    <div class="row" style="margin-top:12px"><button class="btn brass" data-act="crop" data-target="_team">${photos._team?'Cambiar':'Subir'} foto del equipo</button>${photos._team?'<button class="btn ghost sm" data-act="photo-del" data-target="_team">Quitar</button>':''}</div></section>
  <section class="sec"><div class="sec-h"><h2>Mensajes de WhatsApp</h2></div><p class="muted small">Variables: ${esc(vars)}</p>
    ${[['req','Solicitud de disponibilidad'],['rem','Recordatorio al grupo'],['remOne','Recordatorio individual'],['lineup','Anuncio de convocatoria'],['survey','Aviso de encuesta postpartido'],['mvp','Aviso de votación MVP'],['summary','Resumen de la jornada']].map(([k,l])=>`<label class="f">${l}</label><textarea id="msg-${k}" rows="6">${esc(S.msgs[k])}</textarea>`).join('')}
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-act="msgs-save">Guardar mensajes</button><button class="btn ghost sm" data-act="msgs-reset">Restaurar</button></div></section>
  <section class="sec"><div class="sec-h"><h2>Reglas</h2></div><div class="row"><label>Victoria <input type="number" id="r-win" value="${S.rules.win}" style="width:80px"></label><label>Derrota <input type="number" id="r-loss" value="${S.rules.loss}" style="width:80px"></label></div>
    <div class="row" style="margin-top:10px"><label>Avisar en la app <input type="number" id="r-av" value="${S.rules.availDays}" min="1" max="21" style="width:70px"> días antes</label><label>Plazo por defecto <input type="number" id="r-dd" value="${S.rules.deadlineDays}" min="0" max="14" style="width:70px"> días antes, a las <input type="time" id="r-dt" value="${esc(S.rules.deadlineTime)}" style="width:120px"></label></div>
    <div class="row" style="margin-top:10px"><label>Dobles <select id="r-dbl" style="width:auto"><option value="always" ${!dblDecider()?'selected':''}>Cuenta siempre que se juegue</option><option value="decider" ${dblDecider()?'selected':''}>Solo cuenta si queda 2-2</option></select></label></div>
    <div class="row" style="margin-top:10px"><label>Votación MVP abierta <input type="number" id="r-mvp" value="${S.rules.mvpHours||48}" min="1" max="240" style="width:80px"> horas tras el resultado</label></div>
    <div class="row" style="margin-top:12px"><button class="btn sm" data-act="rules-save">Guardar reglas</button></div></section>
`;
}
const vNotFound = () => `<div class="wrap"><div class="pagehead"><h1>No encontrado</h1><p class="lede"><a class="textlink" href="#inicio">Volver al inicio</a></p></div></div>`;

/* ===================== EFECTOS ===================== */
function afterRender(root){
  root.querySelectorAll('.stagger').forEach(l=>[...l.children].forEach((c,i)=>c.style.setProperty('--i',Math.min(i,14))));
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    root.querySelectorAll('[data-w]').forEach(el=>el.style.width=el.dataset.w+'%');
    root.querySelectorAll('.ring .v, .hx-ring .fg, .hx-wr .fg').forEach(el=>el.style.strokeDashoffset=el.dataset.off);
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
    <div class="versus"><div class="vside l"><span class="ghost">${esc(ghost)}</span><span class="duo" style="justify-content:center">${avs}</span><span class="nm">${esc(leftName)}</span><span class="meta"><img src="${ASSET.crestSm}" alt="" style="height:22px;vertical-align:-6px;margin-right:6px">Real Club de Polo${pls.length===1?', nº '+pls[0].order:''}</span></div>
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
  const load=src=>{ const im=new Image(); im.onload=()=>{ crop.img=im; crop.z=1; zoom.value=1; fit(); const s=base(); crop.ox=(crop.vw-im.width*s)/2; crop.oy=team? (crop.vh-im.height*s)/2 : 0; view.querySelector('.chint').hidden=true; save.disabled=false; draw(); }; im.src=src; };
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
  let q=.86, d=o.toDataURL('image/webp',q); if(!d.startsWith('data:image/webp')) d=o.toDataURL('image/jpeg',q);
  while(d.length>850000 && q>.4){ q-=.12; d=o.toDataURL(d.startsWith('data:image/webp')?'image/webp':'image/jpeg',q); }
  const target=crop.target; photos[target]={d,at:Date.now()}; closeCropper(); renderQuiet();
  await safe(()=>B.set('photos/'+target,photos[target]),'Foto guardada');
}

/* ===================== CARTEL DE CONVOCATORIA ===================== */
const FMT={story:[1080,1920],square:[1080,1080],wide:[1920,1080]};
const imgCache={};
function loadImg(src){ if(!src) return Promise.resolve(null); if(!imgCache[src]) imgCache[src]=new Promise(r=>{ const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src=src; }); return imgCache[src]; }
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

/* ===================== WHATSAPP ===================== */
function waPhone(raw){ let d=String(raw||'').replace(/[^\d+]/g,''); if(d.startsWith('+')) d=d.slice(1); else if(d.startsWith('00')) d=d.slice(2); else if(d.length===9) d='34'+d; return d; }
function waOpen(text,phone){ const url=`https://wa.me/${phone||''}?text=${encodeURIComponent(text)}`; const l=document.createElement('a'); l.href=url; l.target='_blank'; l.rel='noopener'; document.body.appendChild(l); l.click(); l.remove(); }
function logSend(kind,j,extra){ const t=ensureTie(j), now=Date.now();
  if(kind==='req') t.availReq={at:now,n:(t.availReq?.n||0)+1};
  else if(kind==='rem') t.remLog=[...(t.remLog||[]),{at:now,...(extra||{})}].slice(-40);
  else if(kind==='lineup') t.lineupAnnounced=now;
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
function listenForeground(){ if(fgOn||B.mode!=='firebase'||!window.firebase?.messaging) return; try{ firebase.messaging().onMessage(pl=>{ const d=pl.data||{}; toast((d.title||'Polo A')+(d.body? ': '+d.body : '')); softRender(); }); fgOn=true; }catch(e){} }
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installEvt=e; softRender(); });
window.addEventListener('appinstalled',()=>{ installEvt=null; toast('App instalada'); softRender(); });
if('serviceWorker' in navigator && B.mode==='firebase' && location.protocol==='https:') navigator.serviceWorker.register('/sw.js').then(()=>{ if(Notification?.permission==='granted') listenForeground(); }).catch(()=>{});
initPushState();

/* ===================== INTRO: THE BALL OPENS THE GAME ===================== */
const ASSET = { ball:'img/ball.webp', crest:'img/escudo.webp', crestSm:'img/escudo-sm.webp', court:'img/court.jpg', felt:'img/felt.jpg', fuzz:'img/fuzz.webp' };
function introSeen(){ try{ return sessionStorage.getItem('polo-intro')==='1'; }catch(e){ return false; } }
function preload(src){ return new Promise(r=>{ const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src=src; if(i.complete&&i.naturalWidth) r(i); }); }
async function playIntro(){
  if(introSeen()) return; try{ sessionStorage.setItem('polo-intro','1'); }catch(e){}
  const el=document.createElement('div'); el.id='intro'; el.setAttribute('aria-hidden','true'); el.innerHTML='<div class="i-black"></div>';
  document.body.appendChild(el); document.body.classList.add('intro-on');
  const reduce=RM.matches, low=(navigator.connection&&navigator.connection.saveData) || (navigator.hardwareConcurrency||4)<2;
  const imgs=await Promise.race([Promise.all([preload(ASSET.ball),preload(ASSET.crest),preload(ASSET.court),preload(ASSET.felt),preload(ASSET.fuzz)]), new Promise(r=>setTimeout(()=>r(null),1800))]);
  const ok=imgs && imgs.every(Boolean);
  let done=false; const finish=()=>{ if(done) return; done=true; el.remove(); document.body.classList.remove('intro-on'); };
  const skip=()=>{ if(done) return; el.getAnimations({subtree:true}).forEach(a=>a.cancel()); el.classList.add('i-skip'); render(); setTimeout(finish,380); };
  if(reduce || low || !ok){
    el.innerHTML=`<div class="i-simple"><img src="${ASSET.crest}" alt=""><span>${esc(teamLabel())}</span></div>`;
    el.animate([{opacity:1},{opacity:1},{opacity:0}],{duration:reduce?900:1300,easing:'ease-in-out'}).finished.then(finish); return;
  }
  const W=innerWidth, H=innerHeight, D=Math.round(Math.min(W*.88, H*.66)), ground=H*(W/H<.8? .76 : .82), cx=W/2, cy=ground-D/2;
  const endScale=Math.hypot(W,H)/D*1.7, dy=H/2-cy;
  const dust=Array.from({length:14},(_,i)=>{ const a=Math.PI*(1+i/13), r=D*(.45+Math.random()*.35); return {x:Math.cos(a)*r, y:Math.sin(a)*r*.35-D*.02, s:4+Math.random()*7}; });
  el.innerHTML=`<div class="i-world">
      <div class="i-sky"><i style="left:12%"></i><i style="left:30%"></i><i style="left:50%"></i><i style="left:70%"></i><i style="left:88%"></i></div>
      <div class="i-persp"><div class="i-floor" style="background-image:url(${ASSET.court})"><span class="i-line"></span><span class="i-line l2"></span></div></div>
      <div class="i-pool" style="left:${cx}px;top:${ground}px;width:${D*2.4}px;height:${D*.9}px"></div>
      <div class="i-shadow" style="left:${cx-D*.42}px;top:${ground-D*.08}px;width:${D*.84}px;height:${D*.18}px"></div>
      ${dust.map((p,i)=>`<span class="i-dust" style="left:${cx}px;top:${ground}px;width:${p.s}px;height:${p.s}px;--dx:${p.x}px;--dy:${p.y}px"></span>`).join('')}
    </div>
    <div class="i-streaks"></div>
    ${[3,2,1].map(n=>`<div class="i-bpos i-ghost g${n}" style="left:${cx-D/2}px;top:${cy-D/2}px;width:${D}px;height:${D}px"><div class="i-bsq"><div class="i-ball"><img src="${ASSET.ball}" alt=""></div></div></div>`).join('')}
    <div class="i-bpos i-main" style="left:${cx-D/2}px;top:${cy-D/2}px;width:${D}px;height:${D}px"><div class="i-bsq"><div class="i-ball"><img src="${ASSET.ball}" alt=""><span class="i-fz" style="background-image:url(${ASSET.fuzz})"></span></div><span class="i-shade"></span><span class="i-glint"></span></div></div>
    <div class="i-felt" style="background-image:url(${ASSET.felt})"><svg class="i-seam" viewBox="0 0 ${W} ${H}"><path pathLength="100" d="M${-W*.15} ${H*.12} C ${W*.3} ${H*.2}, ${W*.4} ${H*.8}, ${W*1.15} ${H*.9}"/></svg></div>
    <div class="i-crestwrap"><img class="i-crest" src="${ASSET.crest}" alt=""><span class="i-shine"></span><p class="i-tag">${esc(teamLabel())}<small>Lliga Catalana ${esc(S.seasonId||'')}</small></p></div>
    <div class="i-ring"></div><div class="i-flash"></div>
    <button class="i-skip-btn" type="button">Saltar</button>`;
  el.querySelector('.i-skip-btn').addEventListener('click',skip);
  const A=(s,kf,o)=>el.querySelectorAll(s).forEach(x=>x.animate(kf,{fill:'both',...o}));
  const F=(s,kf,o)=>el.querySelectorAll(s).forEach(x=>x.animate(kf,{fill:'forwards',...o}));
  const fall='cubic-bezier(.55,0,.9,.4)', rise='cubic-bezier(.1,.6,.4,1)';
  // 1. Se encienden las luces y aparece la pista
  A('.i-sky',[{opacity:0},{opacity:1}],{duration:900,easing:'ease-out'});
  A('.i-sky i',[{transform:'scale(.6)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:700,easing:'ease-out',delay:120});
  A('.i-persp',[{opacity:0,filter:'brightness(.3)'},{opacity:1,filter:'brightness(1)'}],{duration:800,easing:'ease-out'});
  A('.i-world',[{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:1400,easing:'cubic-bezier(.2,.7,.2,1)'});
  // 2. La pelota cae desde arriba y bota dos veces (aplastamiento en cada impacto)
  const T1=1150;
  A('.i-main',[
    {transform:`translateY(${-cy-D}px)`,easing:fall},
    {transform:'translateY(0)',offset:.36,easing:rise},
    {transform:`translateY(${-D*.42}px)`,offset:.55,easing:fall},
    {transform:'translateY(0)',offset:.72,easing:rise},
    {transform:`translateY(${-D*.12}px)`,offset:.84,easing:fall},
    {transform:'translateY(0)'}],{duration:T1});
  A('.i-main .i-bsq',[
    {transform:'scale(1)'},{transform:'scale(.985,1.015)',offset:.33},{transform:'scale(1.045,.955)',offset:.365},{transform:'scale(.99,1.01)',offset:.4},
    {transform:'scale(1)',offset:.46},{transform:'scale(1.025,.975)',offset:.725},{transform:'scale(1)',offset:.76},{transform:'scale(1)'}],{duration:T1});
  A('.i-main .i-ball',[{transform:'rotate(-120deg)'},{transform:'rotate(-20deg)',offset:.36},{transform:'rotate(10deg)',offset:.72},{transform:'rotate(18deg)'}],{duration:T1,easing:'ease-out'});
  A('.i-shadow',[{opacity:0,transform:'scale(.2)'},{opacity:.85,transform:'scale(1.1)',offset:.36},{opacity:.4,transform:'scale(.65)',offset:.55},{opacity:.85,transform:'scale(1.02)',offset:.72},{opacity:.7,transform:'scale(.9)',offset:.84},{opacity:.85,transform:'scale(1)'}],{duration:T1});
  A('.i-pool',[{opacity:0},{opacity:.9,offset:.36},{opacity:.75}],{duration:T1});
  A('.i-dust',[{opacity:0,transform:'translate(0,0) scale(.4)'},{opacity:0,offset:.35},{opacity:.85,transform:'translate(calc(var(--dx)*.3),calc(var(--dy)*.3)) scale(1)',offset:.42},{opacity:0,transform:'translate(var(--dx),var(--dy)) scale(1.6)'}],{duration:T1,easing:'cubic-bezier(.2,.7,.3,1)'});
  A('.i-world',[{transform:'translateY(0)'},{transform:'translateY(0)',offset:.36},{transform:`translateY(${D*.025}px)`,offset:.38},{transform:`translateY(${-D*.012}px)`,offset:.41},{transform:'translateY(0)',offset:.45},{transform:'translateY(0)'}],{duration:T1,composite:'add'});
  // 3. La luz recorre la pelota mientras gira
  A('.i-glint',[{transform:'translate(-60%,-40%)',opacity:0},{opacity:.8,offset:.4},{transform:'translate(40%,10%)',opacity:0}],{duration:1100,delay:700,easing:'ease-in-out'});
  F('.i-main .i-ball',[{transform:'rotate(18deg)'},{transform:'rotate(60deg)'}],{duration:450,delay:T1,easing:'ease-in-out'});
  // 4. Despega hacia la cámara: el suelo cae, líneas de velocidad, estela
  const T2=T1+380, TB=900;
  F('.i-main .i-bsq',[{transform:'scale(1)'},{transform:'scale(1.03,.97)',offset:.6},{transform:'scale(1)'}],{duration:220,delay:T2-220});
  const fly=[{transform:'translateY(0) scale(1)'},{transform:`translateY(${dy*.35-D*.25}px) scale(1.45)`,offset:.35,easing:'cubic-bezier(.5,0,.9,.6)'},{transform:`translateY(${dy}px) scale(${endScale})`}];
  F('.i-main',fly,{duration:TB,delay:T2,easing:'cubic-bezier(.4,0,.8,.4)'});
  F('.i-main .i-ball',[{transform:'rotate(60deg)'},{transform:'rotate(560deg)'}],{duration:TB,delay:T2,easing:'cubic-bezier(.5,0,.9,.5)'});
  [[1,35,.45],[2,70,.28],[3,105,.15]].forEach(([n,d,o])=>{ F('.g'+n,fly,{duration:TB,delay:T2+d,easing:'cubic-bezier(.4,0,.8,.4)'}); A('.g'+n,[{opacity:0},{opacity:0,offset:.3},{opacity:o,offset:.6},{opacity:0}],{duration:TB,delay:T2+d}); });
  F('.i-floor',[{transform:'rotateX(72deg) translateY(0)'},{transform:'rotateX(84deg) translateY(30%)'}],{duration:TB,delay:T2,easing:'cubic-bezier(.5,0,.9,.6)'});
  F('.i-sky',[{transform:'none',filter:'blur(0)'},{transform:'scaleX(1.6) translateY(-30%)',filter:'blur(6px)'}],{duration:TB,delay:T2,easing:'ease-in'});
  F('.i-shadow',[{opacity:.85},{opacity:0}],{duration:300,delay:T2});
  A('.i-streaks',[{opacity:0,transform:'scale(1.4)'},{opacity:.85,transform:'scale(1)',offset:.6},{opacity:0,transform:'scale(.7)'}],{duration:TB,delay:T2+150});
  // 5. Fieltro, costura y escudo
  const TF=T2+TB-200;
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

/* ===================== GESTIÓN DEPORTIVA DEL CLUB ===================== */
let isManager=false, clubData={}, clubSubs=[], clubKey='', roster=null;
// Lista de nombres de todos los equipos (solo nombre e id), para que cualquier jugador pueda elegir su nombre al entrar
function rosterAll(){ const out=new Map(); const add=(tid,list)=>(list||[]).forEach(p=>{ if(!out.has(p.id)) out.set(p.id,{...p,teams:[tid]}); else if(!out.get(p.id).teams.includes(tid)) out.get(p.id).teams.push(tid); });
  Object.entries(roster?.teams||{}).forEach(([t,l])=>add(t,l));
  if(!roster?.teams?.['polo-a']) add('polo-a', seed().players.map(p=>({id:p.id,name:p.name,order:p.order})));
  if(S.players.length && !roster?.teams?.[teamId]) add(teamId, S.players.map(p=>({id:p.id,name:p.name,order:p.order})));
  return [...out.values()]; }
function syncRoster(){ if(B.mode!=='firebase'&&B.mode!=='demo') return; const list=S.players.filter(p=>p.active!==false).map(p=>({id:p.id,name:p.name,order:p.order||0}));
  roster={...(roster||{}), teams:{...(roster?.teams||{}), [teamId]:list}}; B.merge('public/roster',{teams:{[teamId]:list}}).catch(()=>{}); }
const canClub = () => isAdmin || isManager;
function checkManager(m){ const em=(authUser?.email||'').toLowerCase(); isManager = !!(em && (m?.managerEmails||[]).includes(em)); }
function ensureClubSubs(){ const key=clubTeams().map(t=>t.id).join(',')+'|'+viewSeason; if(key===clubKey) return; clubKey=key;
  clubSubs.forEach(u=>{ try{u()}catch(e){} }); clubSubs=[]; clubData={};
  clubTeams().forEach(t=>clubSubs.push(B.watchDoc('seasons/'+docIdFor(t.id,viewSeason), d=>{ clubData[t.id]= d? normalize(clone(d)) : null; softRender(); }))); }
function withS(d,fn){ const keep=S; S=d; try{ return fn(); } finally { S=keep; } }
const ymd = d => { const x=new Date(d); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); };
function weekendSat(ref){ const x=new Date(ref||Date.now()); x.setHours(12,0,0,0); const day=x.getDay(); x.setDate(x.getDate()+(day===6?0:day===0?-1:-(day+1))); return x; }
function weekendRange(satIso){ const sat=new Date(satIso+'T12:00:00'), fri=new Date(sat), sun=new Date(sat); fri.setDate(sat.getDate()-1); sun.setDate(sat.getDate()+1); return {from:ymd(fri), to:ymd(sun), sat, sun}; }
function tieState(d,f){ return withS(d,()=>{ const p=persp(f), tr=tieFromRubbers(f.j)||{}, t=tie(f.j), r=(t?.rubbers||[]).map(x=>({x,c:rubberCalc(x)})).filter(y=>y.c.res);
  const singles=r.filter(y=>y.x.type==='S').length, dbl=r.filter(y=>y.x.type==='D').length;
  const future=new Date(f.date+'T23:59:00').getTime()>Date.now();
  let st = p.played? (p.ps>p.rs?'win':'loss') : future? 'next' : 'pending';
  return {p, rival:clubName(p.rival), st, confirm: p.played && f.status!=='official', singles, dbl, partial: !p.played && tr.decided>0}; }); }
const ST_LABEL={win:'Victoria',loss:'Derrota',pending:'Pendiente de resultado',next:'Programada'};
const CLUB_TABS=[['club','Inicio','M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],['club-equipos','Equipos','M8 8a3.5 3.5 0 1 0 0-.01M2.5 20c.8-3.6 3.3-5.5 5.5-5.5s4.7 1.9 5.5 5.5M16 7a3 3 0 1 0 0-.01M15 14c2.6 0 5 1.6 6.5 5'],['club-docs','Documentación','M6 2h9l5 5v15H6zM14 2v6h6'],['club-resumen','Resumen','M4 20V10M10 20V4M16 20v-7M22 20H2'],['club-ajustes','Configuración','M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6']];
const clubRouteKey = r => String(r||'').replace(/^club-doc-.*/,'club-docs').replace(/^club-equipo-.*/,'club-equipos');
// Dentro de la gestión deportiva, la barra superior (y la inferior en el móvil) muestra SUS apartados, no los del equipo
function setNavMode(club){
  const top=$('.topnav'), bar=$('.tabbar'); if(!top||!bar) return;
  if(!ui.navOrig) ui.navOrig={top:top.innerHTML, bar:bar.innerHTML};
  if(club && !ui.navClub){ ui.navClub=true;
    top.innerHTML=CLUB_TABS.map(([k,l])=>`<a href="#${k}" data-club="${k}">${l}</a>`).join('');
    bar.innerHTML=CLUB_TABS.map(([k,l,d])=>`<a href="#${k}" data-club="${k}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>${l==='Documentación'?'Docs':l==='Configuración'?'Ajustes':l}</a>`).join(''); }
  else if(!club && ui.navClub){ ui.navClub=false; top.innerHTML=ui.navOrig.top; bar.innerHTML=ui.navOrig.bar; }
  if(club){ const k=clubRouteKey(route()); document.querySelectorAll('[data-club]').forEach(a=>a.dataset.club===k? a.setAttribute('aria-current','page') : a.removeAttribute('aria-current')); }
}
function clubNav(){ return ''; }
function clubWeekRows(){
  const sat=ui.clubSat||ymd(weekendSat()), rg=weekendRange(sat), out=[], idle=[];
  clubTeams().forEach(t=>{ const d=clubData[t.id]; if(ui.clubTeam && ui.clubTeam!==t.id) return; if(ui.clubCat && t.cat!==ui.clubCat) return;
    if(!d){ idle.push({t, why: clubData.hasOwnProperty(t.id)? 'Sin calendario cargado' : 'Cargando…'}); return; }
    const fx=d.fixtures.filter(f=>(f.home===POLO||f.away===POLO) && f.date>=rg.from && f.date<=rg.to);
    if(!fx.length){ idle.push({t, why: d.fixtures.length? 'No juega este fin de semana' : 'Sin calendario cargado'}); return; }
    fx.forEach(f=>{ const s=tieState(d,f); if(ui.clubRes && ui.clubRes!==(s.confirm?'confirm':s.st)) return; out.push({t,d,f,s}); }); });
  return {rg, sat, rows:out, idle};
}
function clubAttention(){ const out=[], today=ymd(new Date()), lim=ymd(new Date(Date.now()-28*864e5)); ensureClubDocs();
  clubTeams().forEach(t=>{ const d=clubData[t.id];
    if(!d || !d.fixtures.length){ if(clubData.hasOwnProperty(t.id)) out.push({lvl:'info', t:`${t.short}: falta cargar el calendario y la plantilla`, href:'#club-docs', tid:t.id, go:'docs'}); return; }
    d.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&f.date<today&&f.date>=lim).forEach(f=>{ const s=tieState(d,f);
      if(s.st==='pending') out.push({lvl:'warn', t:`${t.short}, jornada ${f.j} contra ${s.rival}: sin resultado`, href:'#club-equipo-'+t.id});
      else if(s.confirm) out.push({lvl:'info', t:`${t.short}, jornada ${f.j}: resultado ${s.p.ps}-${s.p.rs} pendiente de validar`, href:'#club-equipo-'+t.id}); });
    const rv=Object.values(clubDocs[t.id]||{}).filter(x=>x.status==='revision'||x.status==='error').length;
    if(rv) out.push({lvl:'info', t:`${t.short}: ${rv} ${rv===1?'documento':'documentos'} por revisar`, href:'#club-docs', tid:t.id, go:'docs'}); });
  return out.sort((a,b)=>(a.lvl==='warn'?0:1)-(b.lvl==='warn'?0:1)); }
function vClub(){
  if(!canClub()) return `<div class="wrap"><div class="pagehead"><h1>Gestión deportiva</h1></div><div class="notice">Esta zona es para el gestor deportivo del club y los administradores.</div></div>`;
  ensureClubSubs(); const W=clubWeekRows(), rows=W.rows, all=clubTeams();
  const k={teams:all.length, played:rows.filter(r=>r.s.p.played).length, win:rows.filter(r=>r.s.st==='win').length, loss:rows.filter(r=>r.s.st==='loss').length,
    pending:rows.filter(r=>r.s.st==='pending').length, confirm:rows.filter(r=>r.s.confirm).length};
  const fmt=d=>d.toLocaleDateString('es-ES',{day:'numeric',month:'long'});
  const cats=[...new Set(all.map(t=>t.cat).filter(Boolean))];
  const next=all.map(t=>{ const d=clubData[t.id]; if(!d) return null; const f=d.fixtures.filter(x=>(x.home===POLO||x.away===POLO)&&!isPlayed(x)&&x.date>=ymd(new Date())).sort((a,b)=>a.date.localeCompare(b.date))[0]; return f? {t,d,f} : null; }).filter(Boolean);
  return `<div class="wrap club"><div class="pagehead"><p class="qsec">Real Club de Polo de Barcelona</p><h1>Inicio</h1><p class="lede">Todos los equipos del club en la Lliga Catalana, temporada ${esc(viewSeason)}.</p></div>
  
  <section class="sec"><div class="wknav"><button class="btn ghost sm" data-act="club-wk" data-d="-7" aria-label="Fin de semana anterior">‹</button><div><span class="muted small">Fin de semana</span><b>${fmt(W.rg.sat)} y ${fmt(W.rg.sun)}</b></div><button class="btn ghost sm" data-act="club-wk" data-d="7" aria-label="Fin de semana siguiente">›</button>
    <input type="date" data-act="club-date" value="${W.sat}" aria-label="Elegir fecha" style="max-width:170px"><button class="btn ghost sm" data-act="club-wk" data-d="0">Último</button></div>
    <div class="row" style="margin-top:10px"><select data-act="club-f" data-k="clubTeam" style="max-width:220px"><option value="">Todos los equipos</option>${all.map(t=>`<option value="${esc(t.id)}" ${ui.clubTeam===t.id?'selected':''}>${esc(t.short)}</option>`).join('')}</select>
      ${cats.length>1?`<select data-act="club-f" data-k="clubCat" style="max-width:220px"><option value="">Todas las categorías</option>${cats.map(c=>`<option ${ui.clubCat===c?'selected':''}>${esc(c)}</option>`).join('')}</select>`:''}
      <select data-act="club-f" data-k="clubRes" style="max-width:220px"><option value="">Todos los resultados</option>${[['win','Victorias'],['loss','Derrotas'],['pending','Pendientes de resultado'],['confirm','Por confirmar'],['next','Programadas']].map(([v,l])=>`<option value="${v}" ${ui.clubRes===v?'selected':''}>${l}</option>`).join('')}</select></div></section>
  ${(()=>{ const at=clubAttention(); return `<section class="sec"><div class="sec-h"><h2>Requiere atención</h2></div>${at.length? `<ul class="attn">${at.slice(0,8).map(x=>`<li class="${x.lvl}"><a href="${x.href}" ${x.go==='docs'?`data-act="club-doc-team-go" data-t="${esc(x.tid)}"`:''}>${esc(x.t)}<span>›</span></a></li>`).join('')}</ul>` : '<p class="attn-ok">✓ Nada pendiente: resultados, validaciones y documentos al día.</p>'}</section>`; })()}
  <section class="sec"><div class="mdkpis four stagger"><div><b>${k.played}<small>/${k.teams}</small></b><span>equipos han competido</span></div><div><b style="color:var(--win)">${k.win}</b><span>victorias</span></div><div><b style="color:var(--loss)">${k.loss}</b><span>derrotas</span></div><div><b>${k.pending+k.confirm}</b><span>por cerrar o validar</span></div></div></section>
  <section class="sec"><div class="sec-h"><h2>Equipos del fin de semana</h2><a href="#club-resumen">Resumen para imprimir</a></div>
    ${rows.length? `<div class="ccards stagger">${rows.map(({t,d,f,s})=>`<a class="ccard ${s.st}" href="#club-equipo-${esc(t.id)}">
      <span class="cc-top"><b>${esc(t.name)}</b><small>${esc(teamCat(t))}</small></span>
      <span class="cc-vs">${crest(POLO,'sm')} Real Club de Polo <i>contra</i> ${esc(s.rival)}</span>
      <span class="cc-date">Jornada ${f.j}, ${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h, ${s.p.home?'en casa':'fuera'}</span>
      <span class="cc-res">${s.p.played? `Polo ${s.p.ps}-${s.p.rs}` : s.partial? 'En curso' : '–'}</span>
      <span class="cc-badges"><span class="ccb ${s.st}">${ST_LABEL[s.st]}</span>${s.confirm?'<span class="ccb confirm">Pendiente de confirmar</span>':''}</span>
      <span class="cc-meta">${s.singles} ${s.singles===1?'individual':'individuales'} y ${s.dbl} ${s.dbl===1?'dobles':'dobles'} con resultado</span></a>`).join('')}</div>` : '<div class="empty">Ningún equipo con eliminatoria en este fin de semana con los filtros elegidos.</div>'}
    ${W.idle.length? `<div class="idle"><span class="muted small">Sin eliminatoria:</span> ${W.idle.map(x=>`<a class="chip" href="#club-equipo-${esc(x.t.id)}">${esc(x.t.short)}: <span class="muted">${esc(x.why)}</span></a>`).join('')}</div>` : ''}</section>
  <section class="sec"><div class="split"><div><div class="sec-h"><h2>Próximas jornadas</h2></div>${next.length? `<ul class="insights">${next.map(({t,d,f})=>`<li><b>${esc(t.short)}</b> contra ${esc(withS(d,()=>clubName(persp(f).rival)))}<small>Jornada ${f.j}, ${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h</small></li>`).join('')}</ul>` : '<div class="empty">Sin jornadas programadas.</div>'}</div>
    <div><div class="sec-h"><h2>Última actividad</h2></div><ul class="insights">${all.map(t=>{ const d=clubData[t.id], a=d?.audit?.[0]; return `<li><b>${esc(t.short)}</b>: ${d?.updatedAt? 'actualizado '+relTime(d.updatedAt) : 'sin datos'}${a? `<small>${esc(a.by)}: ${esc(a.what.join(', '))}</small>` : ''}</li>`; }).join('')}</ul></div></div></section></div>`;
}
function clubTeamRow(t){ const d=clubData[t.id];
  if(!d) return {t, cat:t.cat||'', gender:t.gender||'', caps:'', n:0, next:null, nextTxt:'Sin calendario', act:'sin', actTxt:'Sin datos', upd:0};
  const nx=d.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&!isPlayed(f)&&f.date>=ymd(new Date())).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const pend=d.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&f.date<ymd(new Date())&&!isPlayed(f)).length;
  const upd=d.updatedAt||0, days=upd? (Date.now()-upd)/864e5 : 999;
  const act= !d.fixtures.length? 'sin' : pend? 'pend' : days<=14? 'ok' : 'idle';
  return {t, cat:t.cat||'', gender:t.gender||'', caps:(d.captains||[]).map(id=>withS(d,()=>pname(id))).join(', '), n:d.players.filter(p=>p.active!==false).length,
    next:nx? nx.date : null, nextTxt: nx? `J${nx.j}, ${withS(d,()=>fdate(nx,{day:'numeric',month:'short'}))}, contra ${withS(d,()=>clubName(persp(nx).rival))}` : (d.fixtures.length? 'Temporada acabada' : 'Sin calendario'),
    act, actTxt:{ok:'Al día',pend:pend+' sin resultado',idle:'Sin cambios recientes',sin:'Sin calendario'}[act], upd};
}
function vClubEquipos(){
  if(!canClub()) return vClub(); ensureClubSubs();
  const view=ui.eqView||(()=>{ try{ return localStorage.getItem('polo-eqview')||'cards'; }catch(e){ return 'cards'; } })();
  let rows=clubTeams().map(clubTeamRow);
  const cats=[...new Set(rows.map(r=>r.cat).filter(Boolean))], gens=[...new Set(rows.map(r=>r.gender).filter(Boolean))];
  if(ui.eqCat) rows=rows.filter(r=>r.cat===ui.eqCat); if(ui.eqGen) rows=rows.filter(r=>r.gender===ui.eqGen);
  const sk=ui.eqSort||'name', dir=ui.eqDir||1, val=r=>sk==='n'?r.n: sk==='next'?(r.next||'9999'): sk==='act'?r.act: sk==='cat'?r.cat+r.gender : r.t.name;
  rows.sort((a,b)=>{ const x=val(a), y=val(b); return (x>y?1:x<y?-1:0)*dir; });
  const th=(k,l)=>`<th><button data-act="eq-sort" data-v="${k}">${l}${sk===k?(dir>0?' ↑':' ↓'):''}</button></th>`;
  const filters=`<div class="row eqtools"><div class="seg" role="group" aria-label="Vista"><button data-act="eq-view" data-v="cards" aria-pressed="${view==='cards'}">Tarjetas</button><button data-act="eq-view" data-v="table" aria-pressed="${view==='table'}">Tabla</button></div>
    <select data-act="eq-sortsel" aria-label="Ordenar">${[['name','Ordenar por nombre'],['cat','Por categoría'],['n','Por jugadores'],['next','Por próxima jornada'],['act','Por actividad']].map(([k,l])=>`<option value="${k}" ${sk===k?'selected':''}>${l}</option>`).join('')}</select>
    ${cats.length>1?`<select data-act="eq-f" data-k="eqCat" aria-label="Categoría"><option value="">Todas las categorías</option>${cats.map(c=>`<option ${ui.eqCat===c?'selected':''}>${esc(c)}</option>`).join('')}</select>`:''}
    ${gens.length>1?`<select data-act="eq-f" data-k="eqGen" aria-label="Género"><option value="">Todos los géneros</option>${gens.map(g=>`<option ${ui.eqGen===g?'selected':''}>${esc(g)}</option>`).join('')}</select>`:''}</div>`;
  const cards=`<div class="ccards stagger">${rows.map(r=>{ const d=clubData[r.t.id]; if(!d) return `<a class="ccard idle" href="#club-equipo-${esc(r.t.id)}"><span class="cc-top"><b>${esc(r.t.name)}</b><small>${esc(teamCat(r.t))}</small></span><span class="cc-meta">Sin calendario ni plantilla cargados todavía</span></a>`;
      const st=withS(d,()=>standings()), me_=st.find(x=>x.id===POLO)||{}, ts=withS(d,()=>teamStats());
      return `<a class="ccard" href="#club-equipo-${esc(r.t.id)}"><span class="cc-top"><b>${esc(r.t.name)}</b><small>${esc(teamCat(r.t))}${d.comp?.group? ', '+esc(d.comp.group):''}</small></span>
        <span class="cc-res">${me_.pj? me_.pos+'º' : '–'}<small> ${me_.pts||0} pts</small></span><span class="cc-meta">${r.n} jugadores. Eliminatorias ${ts.tw}-${ts.tl}, partidos ${ts.rw}-${ts.rl}.</span><span class="cc-badges"><span class="ccb act-${r.act}">${esc(r.actTxt)}</span></span></a>`; }).join('')}</div>`;
  const table=`<table class="eqtable"><thead><tr>${th('name','Equipo')}${th('cat','Categoría')}<th>Capitán</th>${th('n','Jugadores')}${th('next','Próxima jornada')}${th('act','Actividad')}</tr></thead><tbody>
    ${rows.map(r=>`<tr data-href="#club-equipo-${esc(r.t.id)}"><td data-l="Equipo"><a href="#club-equipo-${esc(r.t.id)}"><b>${esc(r.t.name)}</b></a></td><td data-l="Categoría">${esc(teamCat(r.t))||'–'}</td><td data-l="Capitán">${esc(r.caps)||'<span class="muted">Sin asignar</span>'}</td><td data-l="Jugadores">${r.n}</td><td data-l="Próxima jornada">${esc(r.nextTxt)}</td><td data-l="Actividad"><span class="ccb act-${r.act}">${esc(r.actTxt)}</span></td></tr>`).join('')}</tbody></table>`;
  return `<div class="wrap club"><div class="pagehead"><h1>Equipos</h1><p class="lede">Equipos del Real Club de Polo en la Lliga Catalana, temporada ${esc(viewSeason)}.</p></div>
    <section class="sec">${filters}<div style="margin-top:12px">${view==='table'? table : cards}</div></section></div>`;
}

function vClubTeam(tid){
  if(!canClub()) return vClub(); ensureClubSubs(); const t=clubTeams().find(x=>x.id===tid); if(!t) return vNotFound(); const d=clubData[tid];
  const head=`<div class="wrap club"><div class="pagehead"><a class="textlink" href="#club-equipos">← Equipos</a><h1 style="margin-top:10px">${esc(t.name)}</h1><p class="lede">${esc(t.cat||'')}${d?.comp?.group? ', '+esc(d.comp.group):''}. Temporada ${esc(viewSeason)}.</p>
    <div class="row" style="margin-top:12px"><button class="btn brass" data-act="team-open" data-t="${esc(tid)}">Abrir la app del equipo</button><button class="btn ghost" data-act="team-docs" data-t="${esc(tid)}">Documentación</button></div></div>`;
  if(!d) return head+`<section class="sec"><div class="empty">Este equipo aún no tiene calendario ni plantilla cargados. Ábrelo y cárgalos desde Gestión, o envía los documentos de la FCT.</div></section></div>`;
  return withS(d,()=>{ const st=standings(), mine=st.find(r=>r.id===POLO)||{}, ts=teamStats(), caps=(d.captains||[]).map(pname);
    const fx=d.fixtures.filter(f=>f.home===POLO||f.away===POLO).sort((a,b)=>a.j-b.j);
    const pend=fx.filter(f=>{ const s=tieState(d,f); return s.confirm || s.st==='pending' || (isPlayed(f) && !(tieFromRubbers(f.j)||{}).decided); });
    const last=[...fx].reverse().find(f=>isPlayed(f));
    return head+`<section class="sec"><div class="mdkpis stagger"><div><b>${(mine.pj||mine.off)? mine.pos+'º':'–'}</b><span>clasificación</span></div><div><b>${mine.pts||0}</b><span>puntos</span></div><div><b>${ts.tw}-${ts.tl}</b><span>eliminatorias</span></div><div><b>${ts.rw}-${ts.rl}</b><span>partidos</span></div><div><b>${d.players.length}</b><span>jugadores</span></div><div class="${pend.length?'warn':''}"><b>${pend.length}</b><span>por validar</span></div></div></section>
    <section class="sec"><div class="split"><div><div class="sec-h"><h2>Jornadas</h2></div>${fx.length? `<div class="tscroll"><table><thead><tr><th>J</th><th class="l">Fecha</th><th class="l">Rival</th><th>Resultado</th><th class="l">Estado</th><th>Ind.</th><th>Dob.</th></tr></thead><tbody>${fx.map(f=>{ const s=tieState(d,f); return `<tr><td>${f.j}</td><td class="l">${esc(fdate(f))}</td><td class="l">${esc(s.rival)}</td><td>${s.p.played? s.p.ps+'-'+s.p.rs : '–'}</td><td class="l"><span class="ccb ${s.st}">${ST_LABEL[s.st]}</span>${s.confirm?' <span class="ccb confirm">Por confirmar</span>':''}</td><td>${s.singles}</td><td>${s.dbl}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">Sin calendario.</div>'}</div>
      <div><div class="sec-h"><h2>Clasificación</h2></div>${st.length>1? standingsTable(st,true) : '<div class="empty">Sin clasificación.</div>'}</div></div></section>
    ${last? `<section class="sec"><div class="sec-h"><h2>Última eliminatoria: jornada ${last.j}</h2></div><p class="lede" style="margin:0 0 8px">Polo ${persp(last).ps}-${persp(last).rs} ${esc(clubName(persp(last).rival))}, ${esc(fdate(last,{day:'numeric',month:'long'}))}.</p>${(tie(last.j)?.rubbers||[]).map((r,i)=>((r.polo||[]).length||rubberCalc(r).res)? rubberRow(r,i,last) : '').join('') || '<div class="empty">Sin partidos introducidos.</div>'}</section>` : ''}
    <section class="sec"><div class="split"><div><div class="sec-h"><h2>Plantilla</h2></div><p class="muted small" style="margin-top:-6px">Capitán: ${caps.length? esc(caps.join(', ')) : 'sin asignar'}</p>
      ${d.players.length? `<div class="tscroll"><table><thead><tr><th>Jugador</th><th>Cat.</th><th>Individuales</th><th>Dobles</th></tr></thead><tbody>${d.players.filter(p=>p.active!==false).sort((a,b)=>a.order-b.order).map(p=>{ const a=playerStats(p.id), b=playerStats(p.id,null,'D'); return `<tr><td>${esc(p.name)}</td><td>${esc(p.cat||'')}</td><td>${a.w}-${a.l}</td><td>${b.w}-${b.l}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">Sin plantilla.</div>'}</div>
      <div><div class="sec-h"><h2>Pendiente de validar</h2></div>${pend.length? `<ul class="insights">${pend.map(f=>{ const s=tieState(d,f); return `<li>Jornada ${f.j} contra ${esc(s.rival)}<small>${s.confirm? 'Resultado provisional, falta confirmarlo como oficial' : s.st==='pending'? 'Sin resultado' : 'Marcador sin los partidos individuales'}</small></li>`; }).join('')}</ul>` : '<div class="empty">Nada pendiente.</div>'}
      <div class="sec-h" style="margin-top:20px"><h2>Documentación</h2><a href="#club-docs" data-act="club-f-team" data-t="${esc(tid)}">Ver documentos</a></div>${(()=>{ ensureClubDocs(); const ds=Object.values(clubDocs[tid]||{}); return ds.length? `<p class="small">${ds.length} ${ds.length===1?'documento':'documentos'}${ds.filter(x=>x.status==='revision').length? ', '+ds.filter(x=>x.status==='revision').length+' por revisar':''}.</p>` : '<p class="muted small">Sin documentos.</p>'; })()}
      <div class="sec-h" style="margin-top:20px"><h2>Últimas actualizaciones</h2></div>${(d.audit||[]).length? `<ul class="insights">${d.audit.slice(0,8).map(a=>`<li>${esc(a.what.join(', '))}<small>${esc(a.by)}, ${relTime(a.at)}</small></li>`).join('')}</ul>` : '<div class="empty">Sin cambios registrados todavía.</div>'}</div></div></section></div>`; });
}
/* ===================== INFORME EJECUTIVO SEMANAL (PDF) ===================== */
const PDFMAKE={js:'https://cdn.jsdelivr.net/npm/pdfmake@0.2.10/build/pdfmake.min.js', fonts:'https://cdn.jsdelivr.net/npm/pdfmake@0.2.10/build/vfs_fonts.js'};
const RC={navy:'#12284C',crimson:'#9E1B32',gold:'#B08D3C',ink:'#1C2430',grey:'#6B7280',line:'#D9DEE6',soft:'#F3F5F8',win:'#1F6B45'};
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function weekendLabel(rg){ const a=rg.sat, b=rg.sun; return a.getMonth()===b.getMonth()? `${a.getDate()}–${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}` : `${a.getDate()} ${MESES[a.getMonth()]}–${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}`; }
// ---- datos del fin de semana: solo lo registrado en la app (misma fuente que el Resumen)
const onceColl = path => new Promise(ok=>{ let u=null, done=false; const fin=m=>{ if(done) return; done=true; try{ u&&u(); }catch(e){} ok(m||{}); }; u=B.watchColl(path, fin); setTimeout(()=>fin({}),6000); });
function teamWeekFacts(t,d,f,s,av){ return withS(d,()=>{
  const tt=tie(f.j)||{rubbers:[]}, rub=(tt.rubbers||[]).map((r,i)=>({type:r.type,n:r.n,label:RUBBERS[i]?.label||'',players:(r.polo||[]).map(pname),c:rubberCalc(r),note:r.note||''}));
  const mk=x=>({n:x.n,label:x.label,jugadores:x.players,marcador:x.c.sets.map(z=>z.join('-')).join(' ')||'',resultado:x.c.res==='W'?'ganado':x.c.res==='L'?'perdido':'sin resultado',nota:x.note});
  const singles=rub.filter(x=>x.type==='S'&&(x.players.length||x.c.res)).map(mk), doubles=rub.filter(x=>x.type==='D'&&(x.players.length||x.c.res)).map(mk);
  const st=standings(), mine=st.find(r=>r.id===POLO)||{}, evo=playedJornadas().map(j=>({j,pos:standings(j).find(r=>r.id===POLO)?.pos})).filter(x=>x.pos);
  // balance de temporada separado
  let ssw=0,ssl=0,sdw=0,sdl=0; const seq=[];
  S.fixtures.filter(x=>(x.home===POLO||x.away===POLO)&&isPlayed(x)).sort((a,b)=>a.j-b.j).forEach(x=>{ const p=persp(x); seq.push(p.ps>p.rs?'G':'P'); (tie(x.j)?.rubbers||[]).forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; if(r.type==='S') c.res==='W'?ssw++:ssl++; else c.res==='W'?sdw++:sdl++; }); });
  let streak=0; for(let i=seq.length-1;i>=0&&seq[i]===seq[seq.length-1];i--) streak++;
  const wsw=singles.filter(x=>x.resultado==='ganado').length, wsl=singles.filter(x=>x.resultado==='perdido').length, wdw=doubles.filter(x=>x.resultado==='ganado').length, wdl=doubles.filter(x=>x.resultado==='perdido').length;
  const players=new Set([...singles,...doubles].flatMap(x=>x.jugadores));
  const cr=tt.captainReport||null, tr=tieFromRubbers(f.j)||{}, k=jid(f.j);
  return { id:t.id, equipo:t.name, categoria:teamCat(t), capitan:(d.captains||[]).map(pname).join(', '), rival:s.rival, jornada:f.j, fecha:fdate(f,{weekday:'long',day:'numeric',month:'long'}), hora:f.time, casa:s.p.home,
    resultado: s.p.played? `${s.p.ps}-${s.p.rs}` : null, estado: s.st==='win'?'victoria':s.st==='loss'?'derrota':'pendiente', validado: s.p.played && f.status==='official',
    convocados:(tt.convocados||[]).map(pname), individuales:singles, dobles:doubles,
    fin_de_semana:{individuales:`${wsw}-${wsl}`, dobles:`${wdw}-${wdl}`, jugadores_utilizados:players.size},
    temporada:{individuales:`${ssw}-${ssl}`, dobles:`${sdw}-${sdl}`, eliminatorias:`${seq.filter(x=>x==='G').length}-${seq.filter(x=>x==='P').length}`, racha: seq.length>=3? `${streak} ${seq[seq.length-1]==='G'?'victorias':'derrotas'} seguidas` : null},
    clasificacion: (mine.pj||mine.off)? {posicion:mine.pos, puntos:mine.pts, jugadas:mine.pj, equipos:st.length, tabla:st.slice(0,10).map(r=>({pos:r.pos,club:clubName(r.id),pts:r.pts,pj:r.pj,nuestro:r.id===POLO}))} : null,
    evolucion: evo.length>=2? evo : [],
    informe_capitan: cr? Object.fromEntries(Object.entries(cr).filter(([k])=>!['by','at'].includes(k))) : null, informe_por: cr?.by||null,
    disponibilidad: (()=>{ const keep=avail; avail=av||{}; const a=availFor(f.j); avail=keep; const prob=[];
      if(a.total && a.yes.length<4) prob.push(`solo ${a.yes.length} ${a.yes.length===1?'jugador disponible':'jugadores disponibles'}`);
      if(a.none.length && deadlinePassed(f.j)) prob.push(`${a.none.length} sin responder al cerrar el plazo`);
      if(a.maybe.length) prob.push(`${a.maybe.length} pendientes de confirmar`);
      return {disponibles:a.yes.length, no_disponibles:a.no.length, pendientes:a.maybe.length, sin_respuesta:a.none.length, plantilla:a.total, convocados:(tt.convocados||[]).length, problemas:prob}; })(),
    pendientes: { sin_validar: s.p.played && f.status!=='official', partidos_incompletos: !tr.complete && !!(tr.decided||s.p.played), mvp_sin_publicar: s.p.played && !S.published[k]?.mvp, sin_informe_capitan: !cr } }; }); }
async function reportFacts(sat){
  const rg=weekendRange(sat), out=[], next=[], ns=new Date(sat+'T12:00:00'); ns.setDate(ns.getDate()+7); const rn=weekendRange(ymd(ns));
  for(const t of clubTeams()){ const d=clubData[t.id]; if(!d) continue;
    const fx=d.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&f.date>=rg.from&&f.date<=rg.to).map(f=>({f,s:tieState(d,f)})).filter(x=>x.s.st!=='next');
    const av= fx.length? await onceColl('seasons/'+docIdFor(t.id,viewSeason)+'/avail') : {};
    fx.forEach(({f,s})=>out.push(teamWeekFacts(t,d,f,s,av)));
    d.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&f.date>=rn.from&&f.date<=rn.to).forEach(f=>withS(d,()=>{ const p=persp(f); const ACT=['Confirmar el calendario','Pedir la disponibilidad','Cerrar la disponibilidad','Publicar la convocatoria']; const ph=phases(f.j).slice(0,4).map((x,i)=>x.st!=='done'? ACT[i] : null).filter(Boolean);
      next.push({equipo:t.name, jornada:f.j, fecha:fdate(f,{weekday:'long',day:'numeric',month:'long'}), hora:f.time, rival:clubName(p.rival), casa:p.home, tareas:ph}); })); }
  ensureClubDocs(); const docsPend=clubTeams().flatMap(t=>Object.values(clubDocs[t.id]||{}).filter(x=>x.status==='revision'||x.status==='error').map(x=>({equipo:t.name, documento:x.name, estado:DOC_ST[x.status]||x.status})));
  const sum=k=>out.reduce((a,x)=>{ const [w,l]=x.fin_de_semana[k].split('-').map(Number); return [a[0]+w,a[1]+l]; },[0,0]);
  const tot={equipos:out.length, victorias:out.filter(x=>x.estado==='victoria').length, derrotas:out.filter(x=>x.estado==='derrota').length, empates:0, pendientes:out.filter(x=>x.estado==='pendiente').length,
    sin_validar:out.filter(x=>x.pendientes.sin_validar).length, individuales:sum('individuales').join('-'), dobles:sum('dobles').join('-')};
  return {club:'Real Club de Polo de Barcelona', temporada:viewSeason, fin_de_semana:weekendLabel(rg), sat, totales:tot, equipos:out, proximo_fin_de_semana:{fechas:weekendLabel(rn), eliminatorias:next}, documentacion_pendiente:docsPend};
}
// ---- textos de respaldo si la IA no está disponible: solo datos, sin interpretación
function factualTexts(F){ const T=F.totales;
  const r={resumen_ejecutivo: !T.equipos? 'No hubo eliminatorias de equipos del club este fin de semana.' : `${T.equipos} ${T.equipos===1?'equipo compitió':'equipos compitieron'} este fin de semana: ${T.victorias} ${T.victorias===1?'victoria':'victorias'}, ${T.derrotas} ${T.derrotas===1?'derrota':'derrotas'} y ${T.pendientes} ${T.pendientes===1?'resultado pendiente':'resultados pendientes'}. Balance de individuales ${T.individuales} y de dobles ${T.dobles}.${T.sin_validar? ` ${T.sin_validar} ${T.sin_validar===1?'resultado está':'resultados están'} pendientes de validación.`:''}`,
    conclusiones: F.equipos.map(x=>`${x.equipo}: ${x.resultado? (x.estado==='victoria'?'victoria ':'derrota ')+x.resultado : 'resultado pendiente'} contra ${x.rival}${x.validado?'':' (pendiente de validación)'}.`),
    sintesis_capitan:{}, areas_mejora:[], seguimiento:[]};
  F.equipos.forEach(x=>{ if(x.pendientes.sin_validar) r.seguimiento.push(`Validar el resultado de ${x.equipo} (jornada ${x.jornada}).`); if(x.pendientes.sin_informe_capitan) r.seguimiento.push(`Pedir el informe postpartido al capitán de ${x.equipo}.`); if(x.pendientes.mvp_sin_publicar) r.seguimiento.push(`Publicar el MVP de ${x.equipo}.`); });
  return r; }
// ---- PDF
async function crestPng(h=300){ const im=await new Promise((ok,ko)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=ko; i.src=ASSET.crest||ASSET.crestSm; }); const c=document.createElement('canvas'); const k=h/im.height; c.width=Math.round(im.width*k); c.height=h; c.getContext('2d').drawImage(im,0,0,c.width,c.height); return c.toDataURL('image/png'); }
function buildReportDoc(F, A, crest, meta_){
  const T=F.totales, gen=new Date().toLocaleString('es-ES',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const H=(num,title)=>[{text:'SECCIÓN '+num,style:'kicker',margin:[0,0,0,2]},{text:title,style:'h1'},{canvas:[{type:'line',x1:0,y1:0,x2:60,y2:0,lineWidth:2,lineColor:RC.gold}],margin:[0,4,0,14]}];
  const tbl=(head,rows,widths)=>({table:{headerRows:1,dontBreakRows:true,widths:widths||head.map(()=>'*'),body:[head.map(h=>({text:h,style:'th'})),...rows.map(r=>r.map(c=>typeof c==='object'?c:{text:String(c??'–'),style:'td'}))]},layout:{hLineWidth:(i,n)=>i===0||i===1||i===n.table.body.length?0.8:0.4,vLineWidth:()=>0,hLineColor:i=>i<=1?RC.navy:RC.line,paddingTop:()=>5,paddingBottom:()=>5,paddingLeft:()=>4,paddingRight:()=>4,fillColor:(i)=>i===0?RC.soft:null},margin:[0,0,0,12]});
  const kv=rows=>({table:{widths:[120,'*'],body:rows.map(([k,v])=>[{text:k,style:'k'},{text:v??'–',style:'v'}])},layout:{hLineWidth:()=>0.4,vLineWidth:()=>0,hLineColor:()=>RC.line,paddingTop:()=>4,paddingBottom:()=>4},margin:[0,0,0,12]});
  const kpi=(n,l,c)=>({stack:[{text:String(n),fontSize:24,bold:true,color:c||RC.navy},{text:l.toUpperCase(),fontSize:7,color:RC.grey,characterSpacing:.6}],margin:[0,6,0,6]});
  const resTxt=x=>x.resultado? `${x.estado==='victoria'?'Victoria':'Derrota'} ${x.resultado}` : 'Pendiente';
  const valTxt=x=>!x.resultado? 'Sin resultado' : x.validado? 'Validado (oficial)' : 'Pendiente de validación';
  // gráfico discreto: barras horizontales de individuales y dobles ganados/perdidos por equipo
  const chart=()=>{ if(!F.equipos.length) return {text:''}; const W=470, rowH=26, L=150, scale=(W-L-40)/Math.max(5,...F.equipos.map(x=>{ const [a,b]=x.fin_de_semana.individuales.split('-').map(Number); const [c,d]=x.fin_de_semana.dobles.split('-').map(Number); return a+b+c+d; }));
    const cv=[], txt=[]; F.equipos.forEach((x,i)=>{ const y=i*rowH; const [sw,sl]=x.fin_de_semana.individuales.split('-').map(Number), [dw,dl]=x.fin_de_semana.dobles.split('-').map(Number); let X=L;
      [[sw,RC.navy],[sl,RC.crimson],[dw,'#5B7BB0'],[dl,'#D98C9A']].forEach(([n,c])=>{ if(n){ cv.push({type:'rect',x:X,y:y+6,w:n*scale-2,h:12,color:c}); X+=n*scale; } }); });
    return {stack:[{canvas:cv,absolutePosition:undefined},
      {columns:[{width:L,stack:F.equipos.map(x=>({text:x.equipo,fontSize:8.5,color:RC.ink,margin:[0,0,0,0],lineHeight:1,height:rowH,marginBottom:rowH-10}))},{text:''}],relativePosition:{x:0,y:-F.equipos.length*rowH+2}},
      {text:[{text:'Individuales ganados',color:RC.navy,bold:true},'   ',{text:'Individuales perdidos',color:RC.crimson,bold:true},'   ',{text:'Dobles ganados',color:'#5B7BB0',bold:true},'   ',{text:'Dobles perdidos',color:'#D98C9A',bold:true}],fontSize:7.5,margin:[0,6,0,14]}]}; };
  const c=[];
  // PORTADA (fondo azul marino en el background)
  c.push({stack:[{image:crest,width:118,alignment:'center',margin:[0,86,0,34]},
    {text:'WEEKEND SPORTS REPORT',alignment:'center',color:'#FFFFFF',fontSize:26,bold:true,characterSpacing:4},
    {canvas:[{type:'line',x1:200,y1:0,x2:299,y2:0,lineWidth:1.5,lineColor:RC.gold}],margin:[0,16,0,16]},
    {text:'Real Club de Polo de Barcelona',alignment:'center',color:'#FFFFFF',fontSize:15},
    {text:F.fin_de_semana,alignment:'center',color:RC.gold,fontSize:13,bold:true,margin:[0,22,0,4]},
    {text:`Temporada ${F.temporada}`,alignment:'center',color:'#C9D2E0',fontSize:10.5},
    {text:'Lliga Catalana de Tennis per Equips',alignment:'center',color:'#C9D2E0',fontSize:10.5,margin:[0,2,0,0]},
    {text:'DOCUMENTO INTERNO',alignment:'center',color:'#C9D2E0',fontSize:8,characterSpacing:2,margin:[0,140,0,4]},
    {text:`Generado el ${gen}`,alignment:'center',color:'#8FA0BA',fontSize:8}],pageBreak:'after'});
  // 01 RESUMEN EJECUTIVO
  c.push(...H('01','Resumen ejecutivo'));
  c.push({columns:[kpi(T.equipos,'Equipos'),kpi(T.victorias,'Victorias',RC.win),kpi(T.derrotas,'Derrotas',RC.crimson),kpi(T.pendientes,'Pendientes'),kpi(T.sin_validar,'Por validar',RC.gold)],margin:[0,0,0,6]});
  c.push({columns:[kv([['Individuales',T.individuales+' (ganados-perdidos)']]),kv([['Dobles',T.dobles+' (ganados-perdidos)']])],columnGap:20});
  c.push({text:A.resumen_ejecutivo||'',style:'p'});
  if(A.conclusiones?.length) c.push({text:'Conclusiones',style:'h3'},{ul:A.conclusiones.map(x=>({text:x,style:'li'})),margin:[0,0,0,12]});
  if(F.equipos.length) c.push({text:'Partidos por equipo',style:'h3'},chart());
  c.push({text:A._ia? 'Textos de resumen y conclusiones redactados con IA a partir exclusivamente de los datos registrados.' : 'Textos generados directamente a partir de los datos registrados.',style:'note'});
  // 02 FICHAS DE EQUIPO
  F.equipos.forEach((x,i)=>{ c.push({text:'',pageBreak:'before'}); if(i===0) c.push(...H('02','Resultados por equipo'));
    c.push({table:{widths:['*'],body:[[{stack:[{text:x.equipo,color:'#fff',fontSize:15,bold:true},{text:x.categoria,color:'#C9D2E0',fontSize:9}],fillColor:RC.navy,margin:[10,8,10,8]}]]},layout:'noBorders',margin:[0,0,0,10]});
    c.push(kv([['Capitán',x.capitan||'Sin asignar'],['Rival',`${x.rival} (${x.casa?'en casa':'fuera'})`],['Fecha y jornada',`Jornada ${x.jornada}, ${x.fecha}, ${x.hora} h`],['Resultado global',resTxt(x)],['Estado del resultado',valTxt(x)]]));
    const jug=[...new Set([...x.individuales,...x.dobles].flatMap(m=>m.jugadores))];
    c.push({text:'Jugadores participantes',style:'h3'},{text:jug.length? jug.join(', ') : (x.convocados.length? 'Convocados: '+x.convocados.join(', ') : 'Sin jugadores registrados.'),style:'p'});
    c.push({text:'Individuales',style:'h3'}, x.individuales.length? tbl(['Orden','Jugador','Marcador','Resultado'],x.individuales.map(m=>[m.n,m.jugadores.join(', ')||'–',m.marcador||'–',m.resultado+(m.nota?` (${m.nota})`:'')]),[40,'*',90,90]) : {text:'Sin partidos individuales registrados.',style:'p'});
    c.push({text:'Dobles',style:'h3'}, x.dobles.length? tbl(['Pareja','Marcador','Resultado'],x.dobles.map(m=>[m.jugadores.join(' y ')||'–',m.marcador||'–',m.resultado+(m.nota?` (${m.nota})`:'')]),['*',90,90]) : {text:'No se jugó dobles o no está registrado.',style:'p'});
    if(x.clasificacion){ c.push({unbreakable:true,stack:[{text:'Clasificación actual',style:'h3'},{text:`${x.clasificacion.posicion}º de ${x.clasificacion.equipos}, ${x.clasificacion.puntos} puntos tras ${x.clasificacion.jugadas} ${x.clasificacion.jugadas===1?'jornada':'jornadas'}.`,style:'p'},
      tbl(['Pos.','Club','PJ','Pts'],x.clasificacion.tabla.map(r=>[{text:r.pos,style:'td',bold:r.nuestro},{text:r.club,style:'td',bold:r.nuestro},{text:r.pj,style:'td'},{text:r.pts,style:'td',bold:r.nuestro}]),[34,'*',34,40])]}); }
    if(x.evolucion.length) c.push({text:'Evolución en la clasificación',style:'h3'},{text:x.evolucion.map(e=>`J${e.j}: ${e.pos}º`).join('     '),style:'p'});
  });
  // 03 INFORME DE LOS CAPITANES
  c.push({text:'',pageBreak:'before'},...H('03','Informe del capitán'));
  if(!F.equipos.length) c.push({text:'Sin eliminatorias este fin de semana.',style:'p'});
  F.equipos.forEach(x=>{ const r=x.informe_capitan; const blk=[{text:x.equipo,style:'h2'}];
    if(!r) blk.push({text:'El capitán no ha completado el informe postpartido.',style:'p',italics:true,color:RC.crimson});
    else { if(A.sintesis_capitan?.[x.equipo]) blk.push({text:[{text:'Síntesis. ',bold:true},A.sintesis_capitan[x.equipo]],style:'p'},{text:'Redactada con IA a partir de las respuestas del capitán; no añade valoraciones propias.',style:'note',margin:[0,-6,0,8]});
      blk.push(kv([['Nota de la jornada',r.nota? r.nota+' / 10':'–'],...CAP_FIELDS.map(([k,l])=>[l, r[k]||'Sin respuesta'])]),{text:`Informe de ${x.informe_por||'el capitán'}.`,style:'note'}); }
    c.push({stack:blk,unbreakable:!r||Object.keys(r).length<5,margin:[0,0,0,10]}); });
  // 04 ANÁLISIS Y MEJORAS
  c.push({text:'',pageBreak:'before'},...H('04','Análisis y mejoras'));
  c.push({text:'Rendimiento deportivo (datos objetivos)',style:'h3'});
  c.push(F.equipos.length? tbl(['Equipo','Ind. fin de semana','Dob. fin de semana','Jugadores','Ind. temporada','Dob. temporada','Eliminatorias','Racha'],F.equipos.map(x=>[x.equipo,x.fin_de_semana.individuales,x.fin_de_semana.dobles,x.fin_de_semana.jugadores_utilizados,x.temporada.individuales,x.temporada.dobles,x.temporada.eliminatorias,x.temporada.racha||'Pocos datos']),['*',46,46,40,46,46,48,62]) : {text:'Sin datos.',style:'p'});
  c.push({text:'Individuales y dobles se cuentan por separado (ganados-perdidos). La racha solo se indica con tres o más eliminatorias jugadas.',style:'note'});
  const evos=F.equipos.filter(x=>x.evolucion.length);
  c.push({text:'Evolución de los equipos',style:'h3'},{text: evos.length? '' : 'Aún no hay jornadas suficientes para mostrar una evolución.',style:'p'});
  if(evos.length) c.push(tbl(['Equipo','Posición por jornada'],evos.map(x=>[x.equipo,x.evolucion.map(e=>`J${e.j}: ${e.pos}º`).join('   ')]),[150,'*']));
  c.push({text:'Disponibilidad',style:'h3'});
  c.push(F.equipos.length? tbl(['Equipo','Disponibles','No','Por confirmar','Sin respuesta','Convocados','Observaciones'],F.equipos.map(x=>{ const v=x.disponibilidad; return [x.equipo,v.disponibles,v.no_disponibles,v.pendientes,v.sin_respuesta,v.convocados,v.problemas.length? v.problemas.join('; ') : 'Sin problemas']; }),['*',50,30,48,48,48,120]) : {text:'Sin datos.',style:'p'});
  const pend=[]; F.equipos.forEach(x=>{ const p=x.pendientes; if(p.sin_validar) pend.push([x.equipo,'Resultado pendiente de validación']); if(p.partidos_incompletos) pend.push([x.equipo,'Faltan partidos por registrar']); if(p.mvp_sin_publicar) pend.push([x.equipo,'MVP sin publicar']); if(p.sin_informe_capitan) pend.push([x.equipo,'Informe del capitán pendiente']); if(x.informe_capitan?.incidencias && !/^(ningun[ao]?|no|nada|sin incidencias|-+)\.?$/i.test(x.informe_capitan.incidencias.trim())) pend.push([x.equipo,'Incidencia comunicada: '+x.informe_capitan.incidencias]); x.disponibilidad.problemas.forEach(pr=>pend.push([x.equipo,'Disponibilidad: '+pr])); });
  F.documentacion_pendiente.forEach(dd=>pend.push([dd.equipo,`Documento «${dd.documento}»: ${dd.estado}`]));
  c.push({text:'Aspectos que requieren seguimiento',style:'h3'}, pend.length? tbl(['Equipo','Asunto'],pend,[150,'*']) : {text:'No hay resultados, documentos ni tareas pendientes.',style:'p'});
  c.push({text:'Recomendaciones',style:'h3'});
  if(A.areas_mejora?.length) c.push({ul:A.areas_mejora.map(m=>({stack:[{text:(m.equipo? m.equipo+': ' : '')+m.texto,style:'li',bold:true},{text:'Basado en: '+m.fundamento,style:'li',color:RC.grey}],margin:[0,0,0,6]})),margin:[0,0,0,8]});
  if(A.seguimiento?.length) c.push({ol:A.seguimiento.map(x=>({text:x,style:'li'})),margin:[0,0,0,8]});
  if(!A.areas_mejora?.length && !A.seguimiento?.length) c.push({text:'No hay base suficiente en los datos ni en los informes de los capitanes para proponer recomendaciones concretas.',style:'p'});
  c.push({text: A._ia? 'Recomendaciones redactadas con IA a partir exclusivamente de los datos y de lo escrito por los capitanes; cada una indica en qué se basa.' : 'Recomendaciones generadas directamente a partir de los pendientes registrados.',style:'note'});
  // 06 PRÓXIMO FIN DE SEMANA
  c.push({text:'',pageBreak:'before'},...H('05','Próximas jornadas'),{text:'Fin de semana del '+F.proximo_fin_de_semana.fechas,style:'p',bold:true});
  const nx=F.proximo_fin_de_semana.eliminatorias;
  c.push(nx.length? tbl(['Equipo','Jornada','Fecha y hora','Rival','Tareas pendientes del capitán'],nx.map(x=>[x.equipo,x.jornada,`${x.fecha}, ${x.hora} h`,`${x.rival} (${x.casa?'casa':'fuera'})`,x.tareas.length? x.tareas.join('; ') : 'Al día']),[90,38,90,100,'*']) : {text:'Ningún equipo del club tiene eliminatoria programada el próximo fin de semana.',style:'p'});
  return { pageSize:'A4', pageMargins:[50,72,50,62], info:{title:'Weekend Sports Report | Real Club de Polo | '+F.fin_de_semana, author:'Real Club de Polo de Barcelona', subject:'Informe deportivo semanal'},
    background:(page)=> page===1? {canvas:[{type:'rect',x:0,y:0,w:595.28,h:841.89,color:RC.navy},{type:'rect',x:0,y:828,w:595.28,h:13.5,color:RC.crimson}]} : null,
    header:(page)=> page===1? null : {margin:[50,26,50,0],columns:[{image:crest,width:16},{text:'WEEKEND SPORTS REPORT',fontSize:7.5,bold:true,color:RC.navy,characterSpacing:1.5,margin:[8,4,0,0]},{text:`Real Club de Polo de Barcelona  |  ${F.fin_de_semana}`,fontSize:7.5,color:RC.grey,alignment:'right',margin:[0,4,0,0]}]},
    footer:(page,pages)=> page===1? null : {margin:[50,20,50,0],columns:[{text:`Documento interno  |  Generado el ${gen}`,fontSize:7,color:RC.grey},{text:`Página ${page} de ${pages}`,fontSize:7,color:RC.grey,alignment:'right'}]},
    content:c, defaultStyle:{font:'Roboto',fontSize:9.5,color:RC.ink,lineHeight:1.25},
    styles:{kicker:{fontSize:8,bold:true,color:RC.gold,characterSpacing:1.6},h1:{fontSize:22,bold:true,color:RC.navy},h2:{fontSize:13,bold:true,color:RC.navy,margin:[0,6,0,6]},h3:{fontSize:10.5,bold:true,color:RC.navy,margin:[0,8,0,6]},
      p:{fontSize:9.5,margin:[0,0,0,10],lineHeight:1.35},li:{fontSize:9.5,lineHeight:1.3},note:{fontSize:7.5,color:RC.grey,italics:true,margin:[0,0,0,10]},
      th:{fontSize:7.5,bold:true,color:RC.navy,characterSpacing:.3},td:{fontSize:8.8},k:{fontSize:8.5,color:RC.grey},v:{fontSize:9,bold:true,color:RC.ink}} };
}
const b64OfBlob = blob => new Promise((ok,ko)=>{ const r=new FileReader(); r.onload=()=>ok(String(r.result).split(',')[1]); r.onerror=ko; r.readAsDataURL(blob); });
async function buildWeekendPdf(sat, onStep){
  const step=t=>{ try{ onStep&&onStep(t); }catch(e){} };
  step('Recopilando los datos del fin de semana…'); ensureClubSubs(); ensureClubDocs();
  const F=await reportFacts(sat);
  step('Redactando las conclusiones…'); let A=null, aiNote='';
  try{ const tok=await B.idToken(); const r=await fetch('/api/write-report',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({facts:F})});
    const j=await r.json().catch(()=>({})); if(r.ok && j.ok) A={...j.data,_ia:true}; else aiNote=j.error||('Error '+r.status); }catch(e){ aiNote=e.message; }
  const fb=factualTexts(F); if(!A) A=fb; else { if(!A.resumen_ejecutivo) A.resumen_ejecutivo=fb.resumen_ejecutivo; if(!A.seguimiento?.length) A.seguimiento=fb.seguimiento; }
  step('Componiendo el PDF…'); await loadScript(PDFMAKE.js); await loadScript(PDFMAKE.fonts);
  if(!window.pdfMake?.createPdf) throw new Error('No se ha podido cargar el generador de PDF');
  const crest=await crestPng(320), doc=buildReportDoc(F,A,crest);
  const blob=await new Promise((ok,ko)=>{ const to=setTimeout(()=>ko(new Error('El PDF tarda demasiado en generarse')),30000); try{ pdfMake.createPdf(doc).getBlob(b=>{ clearTimeout(to); ok(b); }); }catch(e){ clearTimeout(to); ko(e); } });
  if(!blob || blob.size<1500) throw new Error('El PDF generado está vacío');
  const b64=await b64OfBlob(blob);
  return {blob, b64, file:`Weekend_Sports_Report_RCPB_${sat}.pdf`, ia:!!A._ia, aiNote, teams:F.totales.equipos};
}
/* ---------- Envío del resumen por correo ---------- */
let mailInfo=null, reportLog={}, reportSub=null;
async function mailStatus(){ if(mailInfo) return mailInfo; try{ const r=await fetch('/api/send-report'); mailInfo=r.ok? await r.json() : {configured:false}; }catch(e){ mailInfo={configured:false}; } softRender(); return mailInfo; }
function ensureReportLog(){ if(reportSub) return; reportSub=B.watchColl('reports', m=>{ reportLog=m; softRender(); }); }
function reportData(){
  const W=clubWeekRows(), rows=W.rows, fmt=d=>d.toLocaleDateString('es-ES',{day:'numeric',month:'long'});
  const items=rows.map(({t,d,f,s})=>withS(d,()=>{ const tt=tie(f.j); let sw=0,sl=0,dw=0,dl=0; const S_=[],D_=[];
    (tt?.rubbers||[]).forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; const line={who:(r.polo||[]).map(pname).join(' y '),n:r.n,res:c.res,sets:c.sets.map(x=>x.join('-')).join(' ')};
      if(r.type==='S'){ c.res==='W'? sw++ : sl++; S_.push(line); } else { c.res==='W'? dw++ : dl++; D_.push(line); } });
    return {team:t.name, rival:s.rival, j:f.j, date:fdate(f,{weekday:'long',day:'numeric',month:'long'}), res:s.p.played? `${s.p.ps}-${s.p.rs}` : '–', st:ST_LABEL[s.st]+(s.confirm?', por confirmar':''), sw,sl,dw,dl,S_,D_}; }));
  const win=rows.filter(r=>r.s.st==='win').length, loss=rows.filter(r=>r.s.st==='loss').length, next=rows.filter(r=>r.s.st==='next').length, pend=rows.filter(r=>r.s.st==='pending'||r.s.confirm).length;
  return {range:`${fmt(W.rg.sat)} y ${fmt(W.rg.sun)}`, items, win, loss, next, pend};
}
function reportEmail(extra, attach){
  const R=reportData(), subject=`Resumen del fin de semana (${R.range}), Real Club de Polo`;
  const text=[`RESUMEN DEL FIN DE SEMANA: ${R.range}`, `Eliminatorias: ${R.items.length}. Victorias: ${R.win}. Derrotas: ${R.loss}. Programadas: ${R.next}. Pendientes: ${R.pend}.`, extra? '\n'+extra : '', '',
    ...R.items.map(x=>`${x.team} contra ${x.rival} (jornada ${x.j}, ${x.date}): ${x.res}. ${x.st}. Individuales ${x.sw}-${x.sl}, dobles ${x.dw}-${x.dl}.`+(x.S_.length? '\n'+x.S_.map(m=>`  ${m.res==='W'?'G':'P'} ${m.who}, individual ${m.n}: ${m.sets}`).join('\n'):'')+(x.D_.length? '\n'+x.D_.map(m=>`  ${m.res==='W'?'G':'P'} Dobles ${m.who}: ${m.sets}`).join('\n'):'')),
    '', attach? 'Se adjunta el informe completo en PDF: '+attach : '', 'Detalle completo en la app: '+location.origin+'/#club-resumen'].join('\n');
  const td='style="padding:6px 8px;border-bottom:1px solid #e3e6df;font-size:14px"';
  const html=`<div style="font-family:Arial,Helvetica,sans-serif;color:#13261F;max-width:640px">
    <p style="font-size:12px;color:#94722A;text-transform:uppercase;letter-spacing:.06em;margin:0">Real Club de Polo de Barcelona, gestión deportiva</p>
    <h1 style="font-size:24px;margin:4px 0 2px">Resumen del fin de semana</h1><p style="margin:0 0 14px;color:#5b6b63">${esc(R.range)}</p>
    ${extra? `<p style="background:#f4f1e8;padding:10px 12px;border-radius:8px">${esc(extra).replace(/\n/g,'<br>')}</p>` : ''}
    <p><b>${R.items.length}</b> eliminatorias: <b style="color:#2F7D4F">${R.win} victorias</b>, <b style="color:#B4472F">${R.loss} derrotas</b>, ${R.next} programadas, ${R.pend} pendientes.</p>
    ${R.items.length? `<table style="border-collapse:collapse;width:100%"><tr><th align="left" ${td}>Equipo</th><th align="left" ${td}>Rival</th><th ${td}>Resultado</th><th align="left" ${td}>Estado</th><th ${td}>Ind.</th><th ${td}>Dob.</th></tr>
      ${R.items.map(x=>`<tr><td ${td}>${esc(x.team)}</td><td ${td}>${esc(x.rival)}</td><td align="center" ${td}><b>${esc(x.res)}</b></td><td ${td}>${esc(x.st)}</td><td align="center" ${td}>${x.sw}-${x.sl}</td><td align="center" ${td}>${x.dw}-${x.dl}</td></tr>`).join('')}</table>` : '<p>No hubo eliminatorias este fin de semana.</p>'}
    ${R.items.filter(x=>x.S_.length||x.D_.length).map(x=>`<h3 style="font-size:16px;margin:18px 0 4px">${esc(x.team)}</h3>${x.S_.map(m=>`<div style="font-size:14px;padding:2px 0">${m.res==='W'?'✅':'❌'} ${esc(m.who)}, individual ${m.n}: ${esc(m.sets)}</div>`).join('')}${x.D_.map(m=>`<div style="font-size:14px;padding:2px 0">${m.res==='W'?'✅':'❌'} Dobles, ${esc(m.who)}: ${esc(m.sets)}</div>`).join('')}`).join('')}
    ${attach? `<p style="margin-top:18px;padding:10px 12px;border:1px solid #d9dee6;border-radius:8px">📎 Se adjunta el informe completo en PDF: <b>${esc(attach)}</b></p>` : ''}
    <p style="margin-top:20px"><a href="${esc(location.origin)}/#club-resumen" style="color:#94722A">Ver el detalle en la app</a></p>
    <p style="font-size:12px;color:#8a978f">Generado con los resultados registrados en la app. Los marcados como pendientes aún no están confirmados.</p></div>`;
  return {subject, text, html};
}
function mailPanel(){
  ensureReportLog(); mailStatus();
  const my=(authUser?.email||'').toLowerCase(), mgr=(meta?.managers||[]).filter(x=>x.email);
  const opts=[...mgr.map(x=>({email:x.email,label:(x.name? x.name+', ' : '')+x.email})), ...(my && !mgr.some(x=>x.email===my)? [{email:my,label:'Yo, '+my}] : [])];
  ui.mailTo ||= new Set(mgr.slice(0,1).map(x=>x.email));
  const log=Object.entries(reportLog).map(([id,x])=>({id,...x})).sort((a,b)=>b.at-a.at).slice(0,5);
  const ok=mailInfo?.configured;
  return `<section class="sec noprint"><div class="panel"><b>Enviar el resumen por correo</b>
    ${opts.length? `<div class="mailto">${opts.map(o=>`<label><input type="checkbox" data-act="mail-to" value="${esc(o.email)}" ${ui.mailTo.has(o.email)?'checked':''}> ${esc(o.label)}</label>`).join('')}</div>` : '<p class="muted small">Aún no hay gestores con correo. Añádelos en Configuración.</p>'}
    <textarea id="mail-extra" rows="2" placeholder="Mensaje opcional (se añade al principio)">${esc(ui.mailExtra||'')}</textarea>
    <div class="row" style="margin-top:10px"><button class="btn brass" data-act="mail-send" ${ok&&ui.mailTo.size&&!ui.mailSending?'':'disabled'}>${ui.mailSending?'Enviando…':'Enviar desde la app'}</button><button class="btn ghost" data-act="mail-open" ${ui.mailTo.size&&!ui.mailSending?'':'disabled'}>Abrir en mi correo</button></div>
    <p class="muted small" style="margin:6px 0 0">«Enviar desde la app» adjunta automáticamente el informe en PDF (Weekend Sports Report). «Abrir en mi correo» no puede adjuntar archivos.</p>
    ${ui.mailSending? `<p class="small" style="margin:8px 0 0"><span class="spin"></span> ${esc(ui.mailStep||'')}</p>` : ''}
    ${ui.mailErr? `<div class="vbox err" style="margin-top:8px">${esc(ui.mailErr)}</div>` : ''}
    ${ui.lastPdf? `<p class="small" style="margin:8px 0 0">Último PDF enviado: <a href="${ui.lastPdf.url}" download="${esc(ui.lastPdf.file)}">${esc(ui.lastPdf.file)}</a>${ui.lastPdf.ia? '' : ' (conclusiones generadas solo con datos'+(ui.lastPdf.aiNote? ': la IA no respondió' : '')+')'}</p>` : ''}
    <p class="muted small" style="margin:8px 0 0">${ok? `Se enviará desde <b>${esc(mailInfo.from||'el correo configurado')}</b>. Solo se puede enviar a gestores del club o a ti.` : mailInfo? 'El envío automático aún no está configurado (falta el correo de envío en Vercel). Mientras tanto, «Abrir en mi correo» lo deja escrito en tu Mail o Gmail para que lo envíes tú.' : 'Comprobando…'}</p>
    ${log.length? `<p class="small" style="margin:12px 0 4px"><b>Últimos envíos</b></p><ul class="insights">${log.map(x=>`<li>${x.status==='enviado'?'✓':'✗'} ${esc((x.to||[]).join(', '))}<small>${esc(x.range||'')}, ${relTime(x.at)}, ${esc(x.by||'')}${x.status==='enviado'? (x.attachment? ', con '+esc(x.attachment) : '') : ': '+esc(x.error||'error')}</small></li>`).join('')}</ul>` : ''}</div></section>`;
}
async function mailSend(){
  const to=[...ui.mailTo]; if(!to.length) return toast('Elige al menos un destinatario');
  if(ui.mailSending) return; const extra=$('#mail-extra')?.value.trim()||''; ui.mailExtra=extra; ui.mailErr=null;
  const sat=ui.clubSat||ymd(weekendSat()), R=reportData();
  ui.mailSending=true; ui.mailStep='Generando el informe PDF…'; renderQuiet();
  // 1) PDF: si no se puede generar, NO se envía el correo
  let pdf=null;
  try{ pdf=await buildWeekendPdf(sat, t=>{ ui.mailStep=t; renderQuiet(); }); }
  catch(e){ ui.mailSending=false; ui.mailStep=''; ui.mailErr='No se ha podido generar el informe PDF ('+(e.message||e)+'). No se ha enviado nada. Pulsa «Enviar desde la app» para reintentar.'; renderQuiet(); return; }
  // 2) correo de siempre, con el PDF adjunto
  ui.mailStep='Enviando el correo…'; renderQuiet();
  const m=reportEmail(extra, pdf.file);
  const base={at:Date.now(), by:authUser?.email||'', to, range:R.range, subject:m.subject, attachment:pdf.file, attachmentSize:pdf.blob.size, aiText:pdf.ia};
  try{ const tok=await B.idToken(); const r=await fetch('/api/send-report',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},
      body:JSON.stringify({to,subject:m.subject,html:m.html,text:m.text,attachments:[{filename:pdf.file,content:pdf.b64,contentType:'application/pdf'}]})});
    const j=await r.json().catch(()=>({})); if(!r.ok || !j.ok) throw new Error(j.error||('Error '+r.status));
    await B.set('reports/'+Date.now().toString(36),{...base,status:'enviado',provider:j.provider||'',messageId:j.id||''}).catch(()=>{});
    if(ui.lastPdf?.url) URL.revokeObjectURL(ui.lastPdf.url); ui.lastPdf={url:URL.createObjectURL(pdf.blob), file:pdf.file, ia:pdf.ia, aiNote:pdf.aiNote};
    toast('Enviado a '+to.join(', ')+' con el PDF adjunto');
  }catch(e){ ui.mailErr='No se ha enviado: '+(e.message||e); await B.set('reports/'+Date.now().toString(36),{...base,status:'error',error:String(e.message||e).slice(0,200)}).catch(()=>{}); toast(ui.mailErr); }
  ui.mailSending=false; ui.mailStep=''; renderQuiet();
}
function mailOpen(){ const to=[...ui.mailTo]; const m=reportEmail($('#mail-extra')?.value.trim()||'');
  let body=m.text; if(body.length>1800) body=body.slice(0,1750)+'\n…\nDetalle completo en la app: '+location.origin+'/#club-resumen';
  location.href=`mailto:${to.map(encodeURIComponent).join(',')}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(body)}`; }

function vClubResumen(){
  if(!canClub()) return vClub(); ensureClubSubs(); const W=clubWeekRows(), rows=W.rows, fmt=d=>d.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
  const win=rows.filter(r=>r.s.st==='win').length, loss=rows.filter(r=>r.s.st==='loss').length, pend=rows.filter(r=>r.s.st==='pending'||r.s.confirm).length;
  const perf=rows.map(({t,d,f})=>withS(d,()=>{ const tt=tie(f.j); const S_=[], D_=[]; (tt?.rubbers||[]).forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; (r.type==='S'?S_:D_).push({who:(r.polo||[]).map(pname).join(' y '), n:r.n, res:c.res, sets:c.sets.map(x=>x.join('-')).join(' ')}); }); return {t,S_,D_}; }));
  const played=rows.filter(r=>r.s.p.played);
  const concl = !rows.length? 'No hubo eliminatorias de equipos del club este fin de semana.'
    : `${played.length} ${played.length===1?'equipo compitió':'equipos compitieron'} este fin de semana: ${win} ${win===1?'victoria':'victorias'} y ${loss} ${loss===1?'derrota':'derrotas'}.${pend? ' Quedan '+pend+' '+(pend===1?'resultado':'resultados')+' por cerrar o confirmar.' : ''}`;
  return `<div class="wrap club report"><div class="pagehead noprint"></div>
    <div class="rep-head"><img src="${ASSET.crestSm}" alt=""><div><p class="qsec">Real Club de Polo de Barcelona, gestión deportiva</p><h1>Resumen del fin de semana</h1><p class="lede">${fmt(W.rg.sat)} y ${fmt(W.rg.sun)}. Temporada ${esc(viewSeason)}.</p></div></div>
    <div class="row noprint" style="margin:6px 0 16px"><button class="btn ghost sm" data-act="club-wk" data-d="-7">‹ Anterior</button><button class="btn ghost sm" data-act="club-wk" data-d="7">Siguiente ›</button><button class="btn brass" data-act="club-print">Imprimir o guardar en PDF</button><button class="btn" data-act="mail-toggle">Enviar por correo</button></div>${ui.mailOpen? mailPanel() : ''}
    <section class="sec"><h2>1. Resumen</h2><div class="mdkpis"><div><b>${rows.length}</b><span>eliminatorias</span></div><div><b>${win}</b><span>victorias</span></div><div><b>${loss}</b><span>derrotas</span></div><div><b>${rows.filter(r=>r.s.st==='next').length}</b><span>programadas</span></div><div><b>${pend}</b><span>pendientes</span></div></div></section>
    <section class="sec"><h2>2. Resultados por equipo</h2>${rows.length? `<table><thead><tr><th>Equipo</th><th class="l">Rival</th><th>Resultado</th><th class="l">Estado</th><th>Ind.</th><th>Dob.</th></tr></thead><tbody>${rows.map(({t,d,f,s})=>{ const g=withS(d,()=>{ const tt=tie(f.j); let sw=0,sl=0,dw=0,dl=0; (tt?.rubbers||[]).forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; if(r.type==='S') c.res==='W'? sw++ : sl++; else c.res==='W'? dw++ : dl++; }); return {sw,sl,dw,dl}; });
      return `<tr><td>${esc(t.name)}</td><td class="l">${esc(s.rival)}</td><td>${s.p.played? s.p.ps+'-'+s.p.rs : '–'}</td><td class="l">${ST_LABEL[s.st]}${s.confirm?', por confirmar':''}</td><td>${g.sw}-${g.sl}</td><td>${g.dw}-${g.dl}</td></tr>`; }).join('')}</tbody></table>` : '<p class="muted">Sin eliminatorias.</p>'}</section>
    <section class="sec"><h2>3. Rendimiento de jugadores</h2>${perf.some(x=>x.S_.length||x.D_.length)? perf.map(x=>`<h3>${esc(x.t.name)}</h3>${x.S_.length?`<p class="small muted">Individuales</p><ul class="replist">${x.S_.map(m=>`<li><b>${m.res==='W'?'G':'P'}</b> ${esc(m.who)}, individual ${m.n}: ${esc(m.sets)}</li>`).join('')}</ul>`:''}${x.D_.length?`<p class="small muted">Dobles</p><ul class="replist">${x.D_.map(m=>`<li><b>${m.res==='W'?'G':'P'}</b> ${esc(m.who)}: ${esc(m.sets)}</li>`).join('')}</ul>`:''}`).join('') : '<p class="muted">Sin partidos individuales registrados.</p>'}</section>
    <section class="sec"><h2>4. Seguimiento</h2><ul class="insights">${clubTeams().map(t=>{ const d=clubData[t.id]; if(!d) return `<li><b>${esc(t.short)}</b>: sin calendario cargado.</li>`; const nx=d.fixtures.filter(x=>(x.home===POLO||x.away===POLO)&&!isPlayed(x)&&x.date>W.rg.to).sort((a,b)=>a.date.localeCompare(b.date))[0];
      return `<li><b>${esc(t.short)}</b>: ${nx? 'próxima jornada '+nx.j+' contra '+esc(withS(d,()=>clubName(persp(nx).rival)))+', '+esc(fdate(nx,{day:'numeric',month:'long'})) : 'sin próximas jornadas'}.</li>`; }).join('')}</ul></section>
    <section class="sec"><h2>5. Conclusión</h2><p>${esc(concl)}</p><p class="source">Informe generado a partir de los resultados registrados en la app. Solo incluye datos introducidos por los equipos; los marcados como pendientes aún no están confirmados.</p></section></div>`;
}
function vClubAjustes(){
  if(!canClub()) return vClub();
  if(!isAdmin) return `<div class="wrap club"><div class="pagehead"><h1>Configuración</h1><p class="lede">Equipos y gestores del club. Solo un administrador puede cambiarlos.</p></div><section class="sec"><ul class="insights">${clubTeams().map(t=>`<li><b>${esc(t.name)}</b><small>${esc([t.cat,t.gender].filter(Boolean).join(', '))}</small></li>`).join('')}</ul></section><section class="sec"><div class="sec-h"><h2>Gestores</h2></div><ul class="insights">${(meta?.managers||[]).map(x=>`<li><b>${esc(x.name||'')}</b> ${esc(x.email)}</li>`).join('')||'<li class="muted">Ninguno</li>'}</ul></section></div>`;
  const m=meta||{}, teams=clubTeams(), mgr=m.managers||[];
  return `<div class="wrap club"><div class="pagehead"><h1>Configuració</h1></div>
    <section class="sec"><div class="sec-h"><h2>Gestores deportivos</h2></div><p class="muted small">Ven todos los equipos del club y pueden corregir datos. Entran con su Google; no necesitan ser jugadores.</p>
      ${mgr.length? `<ul class="insights">${mgr.map((x,i)=>`<li class="row" style="justify-content:space-between"><span><b>${esc(x.name||'')}</b> ${esc(x.email)}</span><button class="btn sm ghost" data-act="mgr-del" data-i="${i}">Quitar</button></li>`).join('')}</ul>` : '<div class="empty">Aún no hay gestores.</div>'}
      <div class="row" style="margin-top:10px"><input type="text" id="mgr-name" placeholder="Nombre (por ejemplo, Albert)" style="max-width:200px"><input type="email" id="mgr-email" placeholder="correo@gmail.com" style="max-width:260px"><button class="btn sm brass" data-act="mgr-add">Añadir gestor</button></div></section>
    <section class="sec"><div class="sec-h"><h2>Equipos del club</h2></div><p class="muted small">Cada equipo tiene su propia temporada: calendario, plantilla, resultados, disponibilidad y MVP. Jugadores, fotos y fichas son del club.</p>
      <div id="ctlist">${teams.map(t=>`<div class="qedit" data-id="${esc(t.id)}" style="grid-template-columns:1fr 110px 1fr 120px"><input type="text" name="name" value="${esc(t.name)}" aria-label="Nombre"><input type="text" name="short" value="${esc(t.short)}" aria-label="Nombre corto"><input type="text" name="cat" value="${esc(t.cat||'')}" aria-label="Categoría"><select name="gender" aria-label="Género"><option value="">Género</option>${['Masculino','Femenino','Mixto'].map(g=>`<option ${t.gender===g?'selected':''}>${g}</option>`).join('')}</select></div>`).join('')}</div>
      <div class="row" style="margin-top:10px"><button class="btn sm brass" data-act="cteams-save">Guardar equipos</button><input type="text" id="ct-name" placeholder="Nuevo equipo (por ejemplo, Veteranos +35)" style="max-width:280px"><input type="text" id="ct-short" placeholder="Nombre corto" style="max-width:140px"><button class="btn sm ghost" data-act="cteam-add">Añadir equipo</button></div></section></div>`;
}
async function saveMeta(patch,msg){ const m={current:currentSeason(), seasons:meta?.seasons||[viewSeason], ...(meta||{}), ...patch}; meta=m; renderQuiet(); await safe(()=>B.set('meta/app',m),msg); }
function teamMenuHTML(){ const ts=clubTeams(), inClub=route().startsWith('club'); return `${ts.map(t=>`<button data-act="team-pick" data-t="${esc(t.id)}" aria-pressed="${!inClub && t.id===teamId}"><b>${esc(t.short)}</b><small>${esc(t.name)}</small></button>`).join('')}${canClub()? `<a href="#club" data-act="team-menu-close" aria-pressed="${inClub}"><b>Gestión deportiva</b><small>Todos los equipos del club</small></a>` : ''}`; }

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
      <label class="small">Tipo <select id="doc-k" style="width:auto"><option value="">Detectar por el nombre</option>${Object.entries(DOC_KINDS).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></label></div>
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
    const need=r.type==='D'?2:1; r.pids.slice(0,need).forEach((pid,k)=>{ if(!pid) r.err.push(`Elige el jugador del Polo${r.names[k]? ' («'+r.names[k]+'»)' : ''}`); else { if(r.pconf[k] && (r.pconf[k]<.8||r.pamb[k]) && r.names[k]) r.warn.push(`Comprueba que «${r.names[k]}» es ${pname(pid)}`); if(r.type==='S'){ if(used[pid]) r.err.push(pname(pid)+' aparece en dos individuales'); used[pid]=1; } } });
    if(r.type==='D' && r.pids[0] && r.pids[0]===r.pids[1]) r.err.push('La pareja repite jugador');
    if(!r.score && !r.winner) r.err.push('Falta el marcador');
    const res = !r.score && r.winner? (r.winner==='polo'?'W':'L') : null;
    validateRubber({type:r.type, polo:r.pids.filter(Boolean), score:r.score, res}).filter(e=>!/Falta el jugador|Falta la pareja/.test(e)).forEach(e=>r.err.push(e));
    const c=rubberCalc({score:r.score}); if(r.winner && c.res && (c.res==='W')!==(r.winner==='polo')) r.err.push('El ganador no coincide con el marcador: revisa si el marcador está escrito desde el lado del Polo');
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
  if(!d) return `<section class="sec"><div class="panel actapanel"><b>Subir el acta oficial de la jornada ${j}</b><p class="muted small" style="margin:4px 0 12px">Haz una foto del acta firmada o sube el PDF. La app lee los nombres del Polo, los marcadores y quién gana cada partido. No se guarda nada hasta que lo revises y lo confirmes.</p>${pick}<div id="doc-prog"></div></div></section>`;
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
      <div class="ar-g">${Array.from({length:need},(_,k)=>`<label><span>Jugador del Polo${need>1?' '+(k+1):''}${r.names[k]? ` <i>«${esc(r.names[k])}»</i>` : ''}</span><select data-acta-row="${i}" data-k="pid${k}" ${idx<0?'disabled':''}>${popts(r.pids[k])}</select></label>`).join('')}
        <label><span>Rival</span><input type="text" value="${esc(r.rival)}" disabled></label>
        <label><span>Marcador (Polo primero)${r.written? ` <i>escrito: «${esc(r.written)}»</i>` : ''}</span><input type="text" inputmode="numeric" data-acta-row="${i}" data-k="score" value="${esc(r.score)}" placeholder="6-4 6-3" ${idx<0?'disabled':''}></label>
        <label><span>Ganador</span><select data-acta-row="${i}" data-k="winner" ${idx<0?'disabled':''}><option value="">–</option><option value="polo" ${r.winner==='polo'?'selected':''}>Polo</option><option value="rival" ${r.winner==='rival'?'selected':''}>Rival</option></select></label></div>
      ${r.note? `<p class="small" style="margin:4px 0 0">Anotación: <b>${esc(r.note)}</b></p>` : ''}
      ${r.err.map(e=>`<p class="rerr">${esc(e)}</p>`).join('')}${r.warn.map(e=>`<p class="rwarn">${esc(e)}</p>`).join('')}</div>`; }).join('');
  const pp=A.punt||{};
  return `<div class="actarev ${justRead(d.id)?'fadein':''}">${justRead(d.id)? '<p class="readok">✓ Lectura completada</p>' : ''}<p class="muted small" style="margin:0 0 10px">Revisa cada partido con el acta delante. Puedes cambiar cualquier dato. El marcador se guarda desde el lado del Polo (si ganó el rival, sus juegos van segundos).</p>
    ${rows || '<div class="empty">La IA no ha encontrado partidos en el acta. Prueba con una foto más nítida o introduce los resultados a mano.</div>'}
    <div class="actatot ${chk.issues.some(x=>x.lvl==='err')?'bad':''}"><div><span class="muted small">Suma de los partidos</span><b>Polo ${chk.w}-${chk.l}</b></div><div><span class="muted small">Puntuació del acta</span><b>${pp.polo!=null&&pp.rival!=null? `Polo ${pp.polo}-${pp.rival}` : 'No se lee'}</b></div><div>${pp.polo!=null&&pp.rival!=null? (+pp.polo===chk.w && +pp.rival===chk.l? '<span class="ccb win">Coincide</span>' : '<span class="ccb loss">No coincide</span>') : '<span class="ccb confirm">Sin comprobar</span>'}</div></div>
    ${chk.issues.map(x=>`<div class="vbox ${x.lvl==='err'?'err':'warn'}">${esc(x.t)}${x.lvl==='auth'? `<label class="row" style="margin-top:6px;gap:8px"><input type="checkbox" data-act="acta-override" ${A.override?'checked':''}> Autorizo sustituir el resultado oficial</label>` : ''}</div>`).join('')}
    <div class="revbar"><button class="btn brass" data-act="acta-confirm" data-j="${j}" ${chk.blocking?'disabled':''}>Confirmar resultados</button><button class="btn ghost" data-act="acta-manual" data-j="${j}">Corregir manualmente</button><button class="btn ghost sm" data-act="acta-read" data-id="${esc(d.id)}">Volver a leer</button></div>
    ${chk.blocking? '<p class="muted small" style="margin:6px 0 0">Corrige lo marcado en rojo para poder confirmar.</p>' : ''}</div>`;
}
function actaToTie(j){ const A=ui.acta, t=ensureTie(j); A.rows.forEach(r=>{ const idx=rubIdx(r); if(idx<0) return; const rb=t.rubbers[idx];
  rb.polo=r.pids.slice(0,r.type==='D'?2:1).filter(Boolean); rb.score=r.score.trim(); rb.res= !rb.score && r.winner? (r.winner==='polo'?'W':'L') : null; rb.note=r.note||rb.note||''; }); return t; }
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
    if(!rv.rows.some(r=>r.h===POLO||r.a===POLO)) warn.push('No se ha encontrado al Polo en ningún enfrentamiento: revisa los clubes'); }
  if(rv.kind==='orden'||rv.kind==='acta'||rv.kind==='resultados'){ const fx=rv.j? poloFix(+rv.j) : null; if(!fx) warn.push('Elige la jornada a la que corresponde');
    if(fx && isPlayed(fx) && fx.status==='official' && rv.kind!=='orden') warn.push('Esta jornada tiene un resultado confirmado como oficial: solo se sobrescribirá si lo marcas abajo');
    const t=fx? tie(fx.j) : null;
    body=`<div class="row" style="margin-bottom:10px"><label class="small">Jornada <select data-rev="j" style="width:auto"><option value="">Elegir</option>${S.fixtures.filter(f=>f.home===POLO||f.away===POLO).map(f=>`<option value="${f.j}" ${+rv.j===f.j?'selected':''}>Jornada ${f.j}, contra ${esc(clubName(persp(f).rival))}</option>`).join('')}</select></label></div>
      <table><thead><tr><th class="l">Partido</th><th class="l">En el documento</th><th class="l">Jugadores en la app</th>${rv.kind!=='orden'?'<th>Marcador (Polo primero)</th>':''}<th>Conf.</th></tr></thead><tbody>${rv.rows.map((r,i)=>{ const cur=t? t.rubbers.find(x=>x.n===r.n) : null; const e=rv.kind!=='orden'? validateRubber({type:r.type,polo:r.pids.filter(Boolean),score:r.score,res:null}) : [];
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


/* ===================== BIENVENIDA (onboarding): bienvenida → tour con demo → perfil → entrar ===================== */
// Todo lo que se ve en el tour es una capa de DEMOSTRACIÓN: vive solo aquí y nunca se escribe en la base de datos.
let profilesLoaded=false;
const tourKey = () => 'polo-tour-'+(me||authUser?.email||'');
const onbKey  = () => 'polo-onb-'+(me||authUser?.email||'');
function tourDone(){ try{ if(localStorage.getItem(tourKey())) return true; }catch(e){} return !!(me && profiles[me]?.tourAt); }
const DEMO={ team:'Polo A', rivals:['CT Mirador','Tennis Atalaya','Club Brisamar','CT Sant Roc'],
  players:[['Marc Soler','1a',['#2b5876','#4e4376'],1],['Pau Ferrer','1a',['#614385','#516395']],['Àlex Puig','2a',['#134E5E','#71B280']],['Jordi Vidal','2a',['#8e6b56','#c9a27e']],
           ['Oriol Mas','2a',['#3a6186','#89253e']],['Nil Serra','3a',['#4b6cb7','#182848']],['Biel Roca','3a',['#9d4b62','#d7a08f']],['Hugo Costa','3a',['#0f2027','#2c5364']]],
  results:[[1,'Tennis Atalaya','4-1','W','17 oct'],[2,'Club Brisamar','2-3','L','24 oct'],[3,'CT Sant Roc','3-2','W','31 oct']],
  table:[['CT Mirador',9],['Polo',6,1],['Club Brisamar',6],['Tennis Atalaya',3],['CT Sant Roc',0]] };
// Retrato ilustrado de demostración (no son fotos reales de nadie)
function demoFace(i,size=44,label=true){ const p=DEMO.players[i%DEMO.players.length], id='df'+i+'_'+size;
  return `<span class="dm-face" style="width:${size}px;height:${size}px"><svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[2][0]}"/><stop offset="1" stop-color="${p[2][1]}"/></linearGradient></defs><rect width="40" height="40" fill="url(#${id})"/><circle cx="20" cy="15.5" r="7" fill="rgba(255,255,255,.88)"/><path d="M6 40c1.6-8 7.4-12 14-12s12.4 4 14 12z" fill="rgba(255,255,255,.88)"/></svg>${label&&p[3]? '<i class="dm-cap">C</i>' : ''}</span>`; }
const EJ='<span class="tm-ej">Ejemplo</span>';
const dmScreen = (title, inner, tab) => `<div class="dm-phone">${EJ}<div class="dm-scr"><div class="dm-top"><img src="${ASSET.crestSm}" alt=""><b>${title}</b></div>${inner}</div>${tab!=null? dmBar(tab) : ''}</div>`;
function dmBar(on){ const t=[['Inicio','M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],['Clasif.','M7 4h10v4a5 5 0 0 1-10 0zM12 13v4M8 21h8'],['Calendario',IC.cal],['Equipo',IC.team],['Stats','M4 20V10M10 20V4M16 20v-7'],['Yo',IC.clock]];
  return `<div class="dm-bar">${t.map(([l,d],i)=>`<span class="${i===on?'on':''}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>${l}</span>`).join('')}</div>`; }
const dmRow = (a,b,cls='') => `<div class="dm-row ${cls}"><span>${a}</span><b>${b}</b></div>`;
// ---- pantallas del tour, por perfil (texto corto + ejemplo completo)
function slidesPlayer(){ return [
  {t:'Inicio: tu jornada de un vistazo', d:'Próximo rival, si estás disponible, si estás convocado y lo último del equipo.', w:'Pestaña Inicio', m:dmScreen('Inicio',`<div class="dm-match"><div>${demoFace(0,34,false)}<b>Polo</b></div><em>vs</em><div><span class="dm-crest">CM</span><b>CT Mirador</b></div></div><p class="dm-sub">Sábado, 15:00 h, en casa · En 3 días</p>
     <div class="dm-tiles"><div class="ok">${svgi('check',15,2.4)}<span>Disponible</span></div><div class="ok">${svgi('list',15,2.2)}<span>Individual 2</span></div></div>
     <div class="dm-feed"><div><i class="w">${svgi('score',13)}</i>Victoria 3-2 contra CT Sant Roc</div><div><i class="g">${svgi('trophy',13)}</i>Pau Ferrer, MVP de la jornada 3</div></div>`,0)},
  {t:'Equipo: tus compañeros', d:'La plantilla con fotos, categoría y capitán. Toca a cualquiera para ver su perfil.', w:'Pestaña Equipo', m:dmScreen('Equipo',`<div class="dm-grid">${DEMO.players.map((p,i)=>`<div>${demoFace(i,46)}<b>${p[0].split(' ')[0]}</b><span>${p[1]}</span></div>`).join('')}</div>`,3)},
  {t:'Calendario: lo jugado y lo que viene', d:'Cada jornada con su resultado, y la próxima destacada.', w:'Pestaña Calendario', m:dmScreen('Calendario',`<div class="dm-cal">${DEMO.results.map(r=>`<div><span class="j">${r[0]}</span><b>${r[1]}</b><em class="${r[3]==='W'?'w':'l'}">${r[3]==='W'?'G':'P'} ${r[2]}</em></div>`).join('')}<div class="nx"><span class="j">4</span><b>CT Mirador</b><em>Sáb 15:00</em></div><div class="fut"><span class="j">5</span><b>Tennis Atalaya</b><em>Pendiente</em></div></div>`,2)},
  {t:'Disponibilidad: un toque', d:'Cuando el capitán la pide, respondes desde el aviso o el enlace de WhatsApp.', w:'Aviso en Inicio', m:dmScreen('Jornada 4',`<p class="dm-q">¿Puedes jugar el sábado?</p><div class="dm-av"><span class="on">${svgi('check',15,2.4)} Disponible</span><span>${svgi('x',15,2.4)} No puedo</span><span>${svgi('clock',15,2)} Por confirmar</span></div><p class="dm-sub">8 de 10 compañeros ya han respondido</p>`,0)},
  {t:'Convocatoria: si juegas y en qué partido', d:'Al publicarse, ves el orden de juego y tu partido resaltado.', w:'Calendario, página de la jornada', m:dmScreen('Convocatoria',`<div class="dm-lu">${['Individual 1','Individual 2','Individual 3','Individual 4','Dobles'].map((l,i)=>`<div class="${i===1?'me':''}">${i===1? demoFace(5,26,false) : demoFace([0,5,2,3,1][i],26,false)}<span>${l}</span><b>${i===1?'Tú':[DEMO.players[0][0],'',DEMO.players[2][0],DEMO.players[3][0],'Pau y Oriol'][i]}</b></div>`).join('')}</div>`,2)},
  {t:'Estadísticas: tu temporada', d:'Win rate, individuales y dobles por separado, tu racha y tus MVP.', w:'Stats y tu perfil', m:dmScreen('Tus estadísticas',`<div class="dm-st"><div class="dm-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="bg"/><circle cx="50" cy="50" r="42" class="fg" stroke-dasharray="264" stroke-dashoffset="77"/></svg><b>71%</b></div><div class="dm-sg"><div><b>5-2</b><span>individuales</span></div><div><b>3-1</b><span>dobles</span></div><div><span class="dm-seq"><i class="w"></i><i class="w"></i><i></i><i class="w"></i><i class="w"></i></span><span>racha</span></div><div><b>2</b><span>MVP</span></div></div></div><div class="dm-bars">${[2,1,2,1].map((w,i)=>`<i style="height:${w*22}px" class="${i===1||i===3?'l':''}"></i>`).join('')}</div>`,4)},
  {t:'Tu perfil: tu ficha deportiva', d:'Tu carta, foto, golpe favorito y todo tu historial. Lo rellenas en un momento.', w:'Yo, Mi ficha', m:dmScreen('Perfil',`<div class="dm-prof"><div class="dm-card">${demoFace(1,64,false)}<b>78</b><span>PAU FERRER</span><em>VIC 82 · SET 76</em></div><div class="dm-pf">${dmRow('Golpe favorito','Revés')}${dmRow('Ídolo','Federer')}${dmRow('Grito','¡Vamos!')}</div></div>`,5)} ]; }
function slidesCaptain(){ return [
  {t:'Gestión: tu centro de operaciones', d:'Como capitán ves en Inicio el estado de la jornada y el siguiente paso.', w:'Arriba a la derecha: «Gestión» (punto rojo si hay algo pendiente)', m:`<div class="dm-ops">${EJ}<div class="dm-hd"><img src="${ASSET.crestSm}" alt=""><b>Polo A</b><span class="dm-gest">Gestión<i></i></span></div><div class="dm-k">Tu gestión, jornada 4</div><div class="dm-osteps">${['cal','mega','lock','team','score','trophy'].map((k,i)=>`<i class="${i<2?'done':i===2?'now':''}">${i<2? svgi('check',12,2.6) : svgi(k,12)}</i>`).join('')}</div><div class="dm-onext"><span>Siguiente paso</span><b>Cierra la disponibilidad</b><em>8 disponibles, 2 sin responder</em></div></div>`},
  {t:'Una jornada completa, paso a paso', d:'Toca cada fase para ver cómo queda: disponibilidad, convocatoria, orden de juego, resultados y cierre.', w:'Gestión, Jornada', cycle:true, m:`<div class="dm-cycle" id="dm-cycle">${EJ}<div class="dm-ctabs">${['Disponibilidad','Convocatoria','Orden','Resultados','Final'].map((l,i)=>`<button data-cyc="${i}" class="${i===0?'on':''}">${l}</button>`).join('')}</div><div class="dm-cbody">${cyclePane(0)}</div></div>`},
  {t:'Resultados: sube el acta', d:'Foto del acta y la IA lee nombres, marcadores y ganador. Tú revisas y confirmas.', w:'Gestión, Jornada, Resultados', m:`<div class="dm-acta">${EJ}<div class="dm-doc"><b>ACTA DE RESULTATS</b>${'<i></i>'.repeat(8)}<div class="dm-laser"></div></div><div class="dm-rev">${dmRow('Individual 1','6-3 6-4 · Marc','ok')}${dmRow('Individual 2','4-6 2-6 · Tú','ko')}${dmRow('Total','Polo 4-1','ok')}</div></div>`} ]; }
function cyclePane(i){ const P=DEMO.players;
  return [`<div class="dm-resp">${P.slice(0,8).map((p,k)=>`<div>${demoFace(k,30,false)}<i class="${k<6?'y':k===6?'m':'n'}">${k<6? svgi('check',10,3) : k===6? '?' : svgi('x',10,3)}</i></div>`).join('')}</div><p class="dm-sub">6 disponibles, 1 por confirmar, 1 no puede</p>`,
    `<div class="dm-sel">${P.slice(0,7).map((p,k)=>`<label class="${k<6?'on':''}">${demoFace(k,24,false)}<span>${p[0]}</span><i>${k<6? svgi('check',11,3) : ''}</i></label>`).join('')}</div>`,
    `<div class="dm-lu">${['Individual 1','Individual 2','Individual 3','Individual 4','Dobles'].map((l,k)=>`<div>${demoFace(k,24,false)}<span>${l}</span><b>${k<4? P[k][0] : P[4][0].split(' ')[0]+' y '+P[1][0].split(' ')[0]}</b></div>`).join('')}</div>`,
    `<div class="dm-sb"><div><b>Polo</b><span><i class="w"></i><i class="w"></i><i></i><i class="w"></i><i class="w"></i></span><strong>4</strong></div><div><b>CT Mirador</b><span><i></i><i></i><i class="w"></i><i></i><i></i></span><strong>1</strong></div></div>`,
    `<div class="dm-final">${svgi('trophy',30,1.7)}<b>Jornada finalizada</b><span>MVP: ${P[1][0]} · Informe del capitán enviado</span></div>`][i]; }
function slidesManager(){ return [
  {t:'Gestión deportiva: todo el club', d:'Primero lo que requiere atención; después cómo fue el fin de semana.', w:'Icono de la casa, arriba', m:`<div class="dm-club">${EJ}<div class="dm-hd dark"><b>Gestión deportiva</b><span class="dm-house">${svgi('cal',13)}</span></div>${['Polo B, jornada 4: sin resultado','Femenino A: resultado por validar','Polo A: 2 documentos por revisar'].map(x=>`<div class="dm-at">${x}<span>›</span></div>`).join('')}<div class="dm-kp"><div><b>3/4</b><span>compitieron</span></div><div><b class="w">2</b><span>victorias</span></div><div><b class="l">1</b><span>derrotas</span></div></div></div>`},
  {t:'Equipos y resultados', d:'Todos los equipos en tarjetas o en tabla, con su clasificación y próxima jornada.', w:'Gestión deportiva, Equipos', m:`<div class="dm-club">${EJ}${[['Absoluto Masculino A','2º','J4 vs CT Mirador'],['Absoluto Masculino B','5º','J4 vs Club Brisamar'],['Absoluto Femenino A','1º','J4 vs Tennis Atalaya'],['Veteranos +35','3º','J4 vs CT Sant Roc']].map(r=>`<div class="dm-team"><b>${r[0]}</b><em>${r[1]}</em><span>${r[2]}</span></div>`).join('')}</div>`},
  {t:'Documentación con IA', d:'Elige equipo, sube actas o listados, la IA los lee y tú validas.', w:'Gestión deportiva, Documentación', m:`<div class="dm-club">${EJ}${[['Acta jornada 3.pdf','Incorporado','ok'],['Listado jugadores.xlsx','Por revisar','mid'],['Orden de juego J4.jpg','Leyendo…','scan']].map(r=>`<div class="dm-docrow"><i>${svgi('list',14)}</i><b>${r[0]}</b><em class="${r[2]}">${r[1]}</em></div>`).join('')}</div>`},
  {t:'Informe del fin de semana', d:'Un botón genera el PDF profesional y lo envía por correo a los gestores.', w:'Gestión deportiva, Resumen', m:`<div class="dm-pdf">${EJ}<div class="dm-cover"><img src="${ASSET.crestSm}" alt=""><b>WEEKEND SPORTS REPORT</b><span>7–8 noviembre 2026</span></div><div class="dm-sent">${svgi('check',14,2.6)} Enviado a Albert con el PDF adjunto</div></div>`} ]; }
function onbRoles(){ return [...(me? [['player','Jugador','Consulta tu jornada, tus estadísticas y tu equipo']] : []), ...(me&&(isCaptain||isAdmin)? [['captain','Capitán','Gestiona convocatorias, resultados y actas']] : []), ...(canClub()? [['manager', isManager? 'Gestor deportivo' : 'Administrador', isManager? 'Supervisa todos los equipos del club' : 'Acceso completo, también a la gestión deportiva']] : [])]; }
function onbSave(){ try{ const o=ui.onb; localStorage.setItem(onbKey(), JSON.stringify({stage:o.stage,i:o.i,step:o.step,roles:o.roles})); }catch(e){} }
function startOnb(opts={}){ ensureOnbCss(); let st=null; try{ st=JSON.parse(localStorage.getItem(onbKey())||'null'); }catch(e){}
  const roles=onbRoles().map(r=>r[0]);
  ui.onb = (!opts.force && st && st.stage && st.stage!=='tour')? {...st, roles} : {stage:'welcome', i:0, step:0, roles};
  drawOnb(); }
const startTour = force => startOnb({force:true});
function onbSlides(){ const R=ui.onb.roles||[]; return [...(R.includes('player')? slidesPlayer() : []), ...(R.includes('captain')? slidesCaptain() : []), ...(R.includes('manager')? slidesManager() : [])]; }
function initFe(){ if(!me) return; if(!ui.fe || ui.fe.pid!==me) ui.fe={pid:me, base:clone(profiles[me]||{}), draft:{...(profiles[me]||{})}, phone:phones[me]||'', dirty:false, touched:false}; }
const PSTEPS=[['photo','Tu foto'],['you','Tú'],['game','Tu juego'],['doubles','Dobles y años'],['about','Sobre ti']];
function chipRow(k,opts){ const v=ui.fe.draft[k]||''; return `<div class="ob-chips">${opts.map(o=>`<button type="button" data-onb-chip="${k}" data-v="${esc(o)}" aria-pressed="${v===o}">${esc(o)}</button>`).join('')}</div>`; }
function profileStep(s){ const d=ui.fe.draft, p=player(me), ph=photos[me]?.d;
  if(s==='photo') return `<div class="ob-photo"><div class="ob-ph">${ph? `<img src="${esc(ph)}" alt="Tu foto">` : `<span>${esc((p?.name||'').split(' ').map(x=>x[0]).slice(0,2).join(''))}</span>`}</div><div class="ob-phb"><button class="btn brass big" data-act="crop" data-target="${esc(me)}" data-pick="1">${ph?'Cambiar foto':'Subir foto'}</button>${ph? `<button class="btn ghost" data-act="crop" data-target="${esc(me)}">Reencuadrar</button>` : ''}<p class="muted small">Desde el móvil puedes hacerla en el momento. Vertical y con la cara arriba.</p></div></div>`;
  if(s==='you') return `<label class="ob-f"><span>Tu nombre en el equipo</span><input type="text" value="${esc(p?.full||p?.name||'')}" disabled></label><p class="muted small" style="margin:-4px 0 12px">Si no es correcto, avisa a tu capitán: lo cambia en la plantilla.</p>
    <label class="ob-f"><span>Nombre deportivo o apodo (opcional)</span><input type="text" data-onb-k="nick" maxlength="40" value="${esc(d.nick||'')}" placeholder="Cómo te llaman en el equipo"></label>`;
  if(s==='game') return `<div class="ob-q"><span>Mano dominante</span>${chipRow('hand',['Diestro','Zurdo'])}</div><div class="ob-q"><span>Revés</span>${chipRow('backhand',['A una mano','A dos manos'])}</div><div class="ob-q"><span>Golpe favorito</span>${chipRow('shot',SHOTS)}</div><div class="ob-q"><span>Estilo de juego</span>${chipRow('style',['Fondo de pista','Agresivo desde el fondo','Saque y red','Todoterreno','Contragolpeador'])}</div>`;
  if(s==='doubles') return `<div class="ob-q"><span>En dobles prefieres jugar</span>${chipRow('dbl',['Drive (derecha)','Revés (izquierda)','Me da igual'])}</div><label class="ob-f"><span>Juegas al tenis desde (año, opcional)</span><input type="number" inputmode="numeric" min="1950" max="2026" data-onb-k="since" value="${esc(d.since||'')}" placeholder="Por ejemplo, 2008"></label>`;
  return `<label class="ob-f"><span>Unas líneas sobre ti (opcional)</span><textarea rows="3" maxlength="200" data-onb-k="bio" placeholder="Cómo vives el tenis, qué te gusta del equipo…">${esc(d.bio||'')}</textarea></label>
    <label class="ob-f"><span>Jugador favorito</span><input type="text" data-onb-k="idol" maxlength="60" value="${esc(d.idol||'')}" placeholder="Nadal, Alcaraz, Federer…"></label><label class="ob-f"><span>Grito de guerra</span><input type="text" data-onb-k="motto" maxlength="60" value="${esc(d.motto||'')}" placeholder="¡Vamos!"></label>`; }
function drawOnb(){ const O=ui.onb; let el=document.getElementById('onb');
  if(O && O.stage==='spot'){ if(el) el.remove(); document.body.classList.remove('tour-on'); onbSave(); return spotShow(O.i||0); }
  if(!O){ clearInterval(ui.cycT); if(el){ el.classList.add('out'); setTimeout(()=>el.remove(),280); } document.body.classList.remove('tour-on'); return; }
  if(!el){ el=document.createElement('div'); el.id='onb'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); document.body.appendChild(el); document.body.classList.add('tour-on');
    el.addEventListener('click',onbClick); el.addEventListener('input',onbInput);
    let x0=null; el.addEventListener('touchstart',e=>{ x0=e.touches[0].clientX; },{passive:true}); el.addEventListener('touchend',e=>{ if(x0==null||ui.onb?.stage!=='tour') return; const dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>55) onbGo(dx<0?1:-1); x0=null; }); }
  clearInterval(ui.cycT); onbSave(); const nm=(me&&player(me)?.name||(authUser?.name&&!/vista previa/i.test(authUser.name)? authUser.name : '')||'').split(' ')[0];
  let h='';
  if(O.stage==='welcome'){ const R=onbRoles();
    h=`<div class="ob-card ob-welcome"><div class="ob-wbg"></div><img class="ob-crest" src="${ASSET.crestSm}" alt=""><span class="hx-k">Real Club de Polo de Barcelona</span><h1>¡Bienvenido a Lliga Catalana${nm? ', '+esc(nm) : ''}!</h1><p>Todo lo que necesitas para vivir y gestionar la competición de tu equipo, en un solo lugar.</p>
      ${R.length? `<div class="ob-access"><span>Tu acceso</span><div>${R.map(([k,l])=>`<i class="${k}">${l}</i>`).join('')}</div></div>` : ''}
      <button class="btn brass big ob-cta" data-onb="discover">Descubrir la plataforma ${svgi('arrow',16)}</button><button class="ob-later" data-onb="skipall">Ahora no</button></div>`; }
  else if(O.stage==='tour'){ const S_=onbSlides(), n=S_.length, s=S_[Math.min(O.i,n-1)];
    h=`<div class="ob-card"><div class="ob-top"><div class="ob-prog"><i style="width:${Math.round((O.i+1)*100/n)}%"></i></div><button class="ob-skip" data-onb="skiptour">Saltar</button></div>
      <div class="ob-mock">${s.m}</div><div class="ob-txt"><span class="ob-n">${O.i+1} de ${n}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p>${s.w? `<p class="ob-where">${svgi('arrow',13)} ${esc(s.w)}</p>` : ''}</div>
      <div class="ob-nav"><button class="btn ghost" data-onb="prev" ${O.i? '' : 'disabled'}>Atrás</button><div class="ob-dots">${S_.map((_,k)=>`<i class="${k===O.i?'on':k<O.i?'past':''}"></i>`).join('')}</div><button class="btn brass" data-onb="next">${O.i===n-1? (me? 'Completar mi perfil' : 'Terminar') : 'Siguiente'}</button></div></div>`;
    if(s.cycle && !matchMedia('(prefers-reduced-motion: reduce)').matches){ let c=0; ui.cycT=setInterval(()=>{ c=(c+1)%5; onbCycle(c); },2200); } }
  else if(O.stage==='perfil'){ initFe(); const k=Math.min(O.step,PSTEPS.length-1), [sk,sl]=PSTEPS[k];
    h=`<div class="ob-card"><div class="ob-top"><div class="ob-prog"><i style="width:${Math.round((k+1)*100/PSTEPS.length)}%"></i></div><button class="ob-skip" data-onb="pskip">Ahora no</button></div>
      <div class="ob-txt" style="padding-top:14px"><span class="ob-n">Tu perfil, paso ${k+1} de ${PSTEPS.length}</span><h2>${k===0?'Ahora, vamos a completar tu perfil':esc(sl)}</h2><p>${k===0? 'Así tendrás una ficha deportiva completa y personal dentro de tu equipo. Empezamos por tu foto.' : 'Toca lo que encaje contigo. Todo es opcional y se guarda solo.'}</p></div>
      <div class="ob-form">${profileStep(sk)}</div>
      <div class="ob-nav"><button class="btn ghost" data-onb="pprev" ${k? '' : 'disabled'}>Atrás</button><span class="ob-saved">${ui.fe?.dirty? 'Guardando…' : 'Guardado'}</span><button class="btn brass" data-onb="pnext">${k===PSTEPS.length-1? 'Terminar' : 'Siguiente'}</button></div></div>`; }
  else if(O.stage==='apps'){ h=appsStage(); }
  else if(O.stage==='done'){ onbMarkDone(); const p=player(me);
    h=`<div class="ob-card ob-done"><div class="ob-wbg"></div><div class="ob-burst">${photos[me]?.d? `<img src="${esc(photos[me].d)}" alt="">` : `<b>${esc((p?.name||'?').split(' ').map(x=>x[0]).slice(0,2).join(''))}</b>`}</div><h1>¡Tu perfil está listo!</h1><p>Ya formas parte de tu equipo. Ahora puedes empezar a utilizar Lliga Catalana.</p><button class="btn brass big ob-cta" data-onb="enter">Entrar en mi equipo ${svgi('arrow',16)}</button></div>`; }
  el.innerHTML=h; el.querySelector('.ob-cta, [data-onb="next"], [data-onb="pnext"]')?.focus({preventScroll:true});
}
function onbCycle(c){ const box=document.getElementById('dm-cycle'); if(!box) return; box.querySelectorAll('[data-cyc]').forEach(b=>b.classList.toggle('on',+b.dataset.cyc===c)); const body=box.querySelector('.dm-cbody'); body.innerHTML=cyclePane(c); body.classList.remove('dm-in'); void body.offsetWidth; body.classList.add('dm-in'); }
function onbGo(d){ const O=ui.onb; if(!O||O.stage!=='tour') return; const n=onbSlides().length, i=O.i+d; if(i<0) return; if(i>=n){ return onbToProfile(); } O.i=i; drawOnb(); }
function onbToProfile(){ const O=ui.onb; if(!me){ return onbFinish(); } O.stage='perfil'; O.step=0; drawOnb(); }
function onbMarkDone(){ try{ localStorage.setItem(tourKey(), String(Date.now())); localStorage.removeItem(onbKey()); }catch(e){}
  if(me && !profiles[me]?.tourAt){ const at=Date.now(); const ex=profiles[me]&&Object.keys(profiles[me]).length; (profiles[me] ||= {}).tourAt=at; (ex? B.update('profiles/'+me,{tourAt:at}) : B.set('profiles/'+me,{...profiles[me]})).catch(()=>{}); } }
async function onbFinish(){ try{ if(ui.fe?.dirty) await feFlush(); }catch(e){} try{ localStorage.setItem(tourKey(), String(Date.now())); localStorage.removeItem(onbKey()); }catch(e){}
  if(me){ const at=Date.now(); const ex=profiles[me]&&Object.keys(profiles[me]).length; (profiles[me] ||= {}).tourAt=at; (ex? B.update('profiles/'+me,{tourAt:at}) : B.set('profiles/'+me,{...profiles[me]})).catch(()=>{}); }
  ui.onb=null; ui.tourSeen=true; drawOnb(); location.hash= me? 'inicio' : 'club'; setTimeout(()=>{ confetti(innerWidth/2,innerHeight/3,100); },350); }
function onbClick(e){ const O=ui.onb; if(!O) return; const r=e.target.closest('[data-onb-role]'); if(r){ const k=r.dataset.onbRole; O.roles = O.roles.includes(k)? O.roles.filter(x=>x!==k) : [...O.roles,k]; if(!O.roles.length) O.roles=[k]; drawOnb(); return; }
  const cy=e.target.closest('[data-cyc]'); if(cy){ clearInterval(ui.cycT); onbCycle(+cy.dataset.cyc); return; }
  const ch=e.target.closest('[data-onb-chip]'); if(ch){ initFe(); const k=ch.dataset.onbChip, v=ch.dataset.v; ui.fe.draft[k]= ui.fe.draft[k]===v? '' : v; ch.parentElement.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===ui.fe.draft[k]))); feQueue(); onbSavedLabel(); return; }
  const b=e.target.closest('[data-onb]'); if(!b) return; const a=b.dataset.onb;
  if(a==='discover'){ O.stage='spot'; O.i=0; drawOnb(); }
  else if(a==='skipall'){ ui.onb=null; ui.tourSeen=true; drawOnb(); onbMarkDone(); toast('Puedes ver la introducción cuando quieras desde Yo'); }
  else if(a==='appsnext'||a==='appslater'){ if(a==='appslater'){ try{ localStorage.setItem('polo-nudge',String(Date.now()-4*864e5)); }catch(e){} } O.stage='done'; drawOnb(); }
  else if(a==='next') onbGo(1); else if(a==='prev') onbGo(-1); else if(a==='skiptour') onbToProfile();
  else if(a==='pnext'){ if(O.step>=PSTEPS.length-1){ if(ui.fe?.dirty) feFlush(); O.stage='apps'; drawOnb(); } else { O.step++; drawOnb(); } }
  else if(a==='pprev'){ if(O.step>0){ O.step--; drawOnb(); } } else if(a==='pskip'){ if(ui.fe?.dirty) feFlush(); O.stage='apps'; drawOnb(); } else if(a==='enter') onbFinish(); }
function onbInput(e){ const el=e.target; if(!el.dataset?.onbK) return; initFe(); ui.fe.draft[el.dataset.onbK]=el.value; feQueue(); onbSavedLabel(); }
function onbSavedLabel(){ const s=document.querySelector('#onb .ob-saved'); if(s){ s.textContent='Guardando…'; clearTimeout(ui.obsT); ui.obsT=setTimeout(()=>{ if(s.isConnected) s.textContent='Guardado'; },1300); } }
function maybeTour(){ if(ui.onb || ui.tourSeen || !authReady || !authUser) return; try{ if(localStorage.getItem('polo-tour-off')) return; }catch(e){} if(!me && !isManager) return; if(me && !profilesLoaded) return;
  if(!['inicio','club',''].includes(route())) return; ui.tourSeen=true; if(tourDone()) return;
  let st=null; try{ st=JSON.parse(localStorage.getItem(onbKey())||'null'); }catch(e){} if(st?.later && Date.now()-st.later<20*36e5) return;
  setTimeout(()=>{ if(!ui.onb && !tourDone()) startOnb(); },350); }
function onboardBanner(){ return ''; }

const ONB_CSS=`
body.tour-on{overflow:hidden}
.cropper{z-index:260!important}
#onb{position:fixed;inset:0;z-index:240;display:grid;place-items:center;padding:14px;background:radial-gradient(800px 500px at 50% 0%,rgba(26,80,62,.55),transparent 70%),rgba(5,20,15,.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:obin .3s ease}
#onb.out{animation:obout .28s ease forwards}@keyframes obin{from{opacity:0}to{opacity:1}}@keyframes obout{to{opacity:0}}
.ob-card{position:relative;width:min(460px,100%);max-height:calc(100dvh - 28px);overflow:auto;border-radius:30px;background:var(--surface,#fff);color:var(--ink,#13261F);box-shadow:0 40px 90px -40px rgba(0,0,0,.8);display:grid;animation:obpop .4s cubic-bezier(.2,.8,.2,1)}
@keyframes obpop{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
.ob-welcome,.ob-done{padding:34px 24px 22px;text-align:center;justify-items:center;overflow:hidden;color:#F2F5F0;background:linear-gradient(165deg,#164a3a 0%,#0b2a21 70%)}
.ob-wbg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(300px 200px at 85% 0%,rgba(226,196,124,.28),transparent 70%),linear-gradient(rgba(255,255,255,.05),rgba(255,255,255,.05)) 50% 0/1px 100% no-repeat,linear-gradient(rgba(255,255,255,.04),rgba(255,255,255,.04)) 0 62%/100% 1px no-repeat}
.ob-crest{position:relative;width:96px;filter:drop-shadow(0 16px 22px rgba(0,0,0,.45));animation:obfloat 3.4s ease-in-out infinite;margin-bottom:10px}
@keyframes obfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.ob-welcome h1,.ob-done h1{position:relative;margin:6px 0 8px;font-stretch:62%;font-weight:800;font-size:clamp(2.1rem,9vw,2.8rem);line-height:.98}
.ob-welcome>p,.ob-done>p{position:relative;margin:0 0 18px;color:rgba(242,245,240,.8);font-size:1rem;line-height:1.45;max-width:34ch}
.ob-roles{position:relative;display:grid;gap:8px;width:100%;margin:0 0 18px;text-align:left}
.ob-roles>span{font-size:.78rem;color:rgba(242,245,240,.65)}
.ob-roles button{position:relative;display:grid;gap:2px;padding:12px 44px 12px 14px;border-radius:16px;border:1.5px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#F2F5F0;text-align:left;cursor:pointer;transition:all .2s}
.ob-roles button b{font-size:1rem}.ob-roles button em{font-style:normal;font-size:.8rem;color:rgba(242,245,240,.65)}
.ob-roles button i{position:absolute;right:14px;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:50%;display:grid;place-items:center;border:2px solid rgba(255,255,255,.3);color:transparent}
.ob-roles button[aria-pressed="true"]{border-color:#E2C47C;background:rgba(226,196,124,.12)}.ob-roles button[aria-pressed="true"] i{background:#E2C47C;border-color:#E2C47C;color:#0b2a21}
.ob-roles.one button{padding-right:14px;cursor:default}
.ob-access{position:relative;display:grid;gap:8px;justify-items:center;margin:0 0 20px}.ob-access>span{font-size:.72rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:rgba(242,245,240,.6)}.ob-access div{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}.ob-access i{font-style:normal;font-weight:700;font-size:.86rem;padding:7px 13px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)}.ob-access i.manager{background:rgba(226,196,124,.16);border-color:rgba(226,196,124,.5);color:#E2C47C}
.ob-cta{position:relative;width:100%;justify-content:center;gap:8px;background:linear-gradient(180deg,#C9A24D,#94722A)!important;border-color:#94722A!important;color:#fff!important;box-shadow:0 14px 28px -14px rgba(201,162,77,.9)}
.ob-later{position:relative;margin-top:10px;border:0;background:none;color:rgba(242,245,240,.6);font-weight:600;cursor:pointer}
.ob-top{display:flex;align-items:center;gap:12px;padding:16px 18px 0}
.ob-prog{flex:1;height:4px;border-radius:4px;background:var(--surface2,#eef0eb);overflow:hidden}.ob-prog i{display:block;height:100%;background:linear-gradient(90deg,#94722A,#E2C47C);transition:width .45s cubic-bezier(.2,.8,.2,1)}
.ob-skip{border:0;background:none;color:var(--muted,#5b6b63);font-weight:700;font-size:.85rem;cursor:pointer}
.ob-mock{display:grid;place-items:center;padding:14px 16px 2px;min-height:300px;animation:obslide .4s cubic-bezier(.2,.8,.2,1)}
@keyframes obslide{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:none}}
.ob-txt{padding:6px 22px 2px}.ob-n{font-size:.7rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--brass,#94722A)}
.ob-txt h2{margin:4px 0 6px;font-stretch:72%;font-weight:750;font-size:1.55rem;line-height:1.08}
.ob-txt p{margin:0 0 8px;color:var(--muted,#5b6b63);font-size:.95rem;line-height:1.45}
.ob-where{display:inline-flex!important;align-items:center;gap:6px;font-size:.78rem!important;font-weight:700;color:var(--brass,#94722A)!important;background:#F6EFDD;padding:5px 11px;border-radius:999px}
.ob-nav{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;padding:12px 18px 18px}
.ob-dots{display:flex;justify-content:center;gap:4px;flex-wrap:wrap}.ob-dots i{width:6px;height:6px;border-radius:50%;background:var(--line,#dfe3dc);transition:all .3s}.ob-dots i.past{background:#d4c08f}.ob-dots i.on{width:18px;border-radius:4px;background:#94722A}
.ob-saved{justify-self:center;font-size:.78rem;font-weight:700;color:var(--muted,#5b6b63)}
.ob-form{padding:6px 22px 4px;display:grid;gap:4px}
.ob-q{display:grid;gap:7px;margin-bottom:12px}.ob-q>span,.ob-f>span{font-size:.8rem;font-weight:700;color:var(--ink,#13261F)}
.ob-chips{display:flex;flex-wrap:wrap;gap:6px}.ob-chips button{border:1.5px solid var(--line,#e3e6df);background:var(--bg,#f4f5f1);border-radius:999px;padding:9px 13px;font-weight:600;font-size:.88rem;min-height:40px;cursor:pointer;transition:all .18s}
.ob-chips button[aria-pressed="true"]{background:#13261F;border-color:#13261F;color:#fff;box-shadow:inset 0 0 0 2px #E2C47C}
.ob-f{display:grid;gap:6px;margin-bottom:12px}.ob-f input,.ob-f textarea{font-size:1rem}
.ob-photo{display:grid;grid-template-columns:140px 1fr;gap:16px;align-items:center;padding:4px 0 10px}
.ob-ph{aspect-ratio:3/4;border-radius:18px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(160deg,#1B5A46,#0A2A20);border:2px solid #E2C47C;box-shadow:0 16px 30px -18px rgba(0,0,0,.6)}
.ob-ph img{width:100%;height:100%;object-fit:cover;object-position:50% 22%}.ob-ph span{font-stretch:62%;font-weight:800;font-size:2.8rem;color:#E2C47C}
.ob-phb{display:grid;gap:8px;justify-items:start}
@media (max-width:420px){.ob-photo{grid-template-columns:110px 1fr}}
.ob-burst{position:relative;width:118px;height:118px;border-radius:50%;display:grid;place-items:center;overflow:hidden;border:3px solid #E2C47C;background:#123d30;box-shadow:0 0 0 10px rgba(226,196,124,.12),0 0 0 22px rgba(226,196,124,.06);margin:6px 0 14px;animation:obpop .6s cubic-bezier(.2,.8,.2,1)}
.ob-burst img{width:100%;height:100%;object-fit:cover;object-position:50% 22%}.ob-burst b{font-stretch:62%;font-weight:800;font-size:2.8rem;color:#E2C47C}
.tm-ej{position:absolute;top:10px;right:10px;z-index:3;font-size:.6rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:#F3EAD3;color:#94722A}
.dm-face{position:relative;display:inline-block;border-radius:50%;overflow:visible;flex:none}.dm-face svg{border-radius:50%;display:block}
.dm-cap{position:absolute;right:-3px;bottom:-3px;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:.55rem;font-weight:800;background:#E2C47C;color:#13261F;border:2px solid #fff}
.dm-phone{position:relative;width:250px;border-radius:32px;padding:10px;background:#0b2a21;box-shadow:0 24px 44px -24px rgba(0,0,0,.85)}
.dm-scr{border-radius:23px;background:#F4F5F1;padding:12px 12px 14px;min-height:230px}
.dm-top{display:flex;align-items:center;gap:6px;margin-bottom:10px}.dm-top img{width:16px}.dm-top b{font-size:.78rem;color:#13261F}
.dm-bar{display:grid;grid-template-columns:repeat(6,1fr);padding:8px 2px 2px}.dm-bar span{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:.48rem;color:rgba(242,245,240,.55)}.dm-bar span.on{color:#E2C47C}
.dm-match{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;text-align:center;padding:10px;border-radius:16px;background:#0f3b2e;color:#F2F5F0}.dm-match>div{display:grid;justify-items:center;gap:4px}.dm-match b{font-size:.72rem}.dm-match em{font-style:normal;font-weight:800;color:#E2C47C}
.dm-crest{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:.62rem;font-weight:800;background:rgba(255,255,255,.14)}
.dm-sub{font-size:.62rem;color:#5b6b63;margin:7px 0;text-align:center}
.dm-tiles{display:grid;grid-template-columns:1fr 1fr;gap:6px}.dm-tiles div{display:flex;align-items:center;gap:6px;padding:8px;border-radius:12px;background:#DDF1E6;color:#1F7A4D;font-weight:700;font-size:.68rem}
.dm-feed{display:grid;gap:5px;margin-top:8px}.dm-feed div{display:flex;align-items:center;gap:7px;font-size:.62rem;font-weight:600;color:#13261F;padding:6px 7px;border-radius:10px;background:#fff}.dm-feed i{width:20px;height:20px;border-radius:50%;display:grid;place-items:center}.dm-feed i.w{background:#DDF1E6;color:#1F7A4D}.dm-feed i.g{background:#F3EAD3;color:#94722A}
.dm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px 4px}.dm-grid div{display:grid;justify-items:center;gap:2px}.dm-grid b{font-size:.6rem;color:#13261F}.dm-grid span{font-size:.52rem;color:#5b6b63}
.dm-cal{display:grid;gap:5px}.dm-cal div{display:grid;grid-template-columns:20px 1fr auto;gap:6px;align-items:center;padding:8px;border-radius:11px;background:#fff;font-size:.66rem}.dm-cal .j{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;background:#eef0eb;font-weight:800;font-size:.6rem}
.dm-cal em{font-style:normal;font-weight:800;font-size:.6rem;padding:2px 6px;border-radius:999px}.dm-cal em.w{background:#DDF1E6;color:#1F7A4D}.dm-cal em.l{background:#F7E1DC;color:#B4472F}.dm-cal .nx{background:#0f3b2e;color:#F2F5F0}.dm-cal .nx .j{background:#E2C47C;color:#0b2a21}.dm-cal .nx em{color:#E2C47C}.dm-cal .fut{opacity:.6}
.dm-q{font-stretch:62%;font-weight:800;font-size:1.3rem;color:#13261F;margin:2px 0 8px}
.dm-av{display:grid;gap:6px}.dm-av span{display:flex;align-items:center;gap:7px;padding:9px 11px;border-radius:12px;background:#fff;font-weight:700;font-size:.74rem;color:#13261F;border:1.5px solid #e3e6df}.dm-av span.on{border-color:#1F7A4D;background:#EAF6EF;color:#1F7A4D}
.dm-lu{display:grid;gap:5px}.dm-lu div{display:grid;grid-template-columns:26px 1fr auto;gap:7px;align-items:center;padding:6px 8px;border-radius:11px;background:#fff;font-size:.64rem}.dm-lu span{color:#5b6b63}.dm-lu b{color:#13261F}.dm-lu .me{background:#13261F}.dm-lu .me span{color:rgba(242,245,240,.7)}.dm-lu .me b{color:#E2C47C}
.dm-st{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center}.dm-ring{position:relative;width:86px;height:86px}.dm-ring svg{transform:rotate(-90deg)}.dm-ring .bg{fill:none;stroke:#e3e6df;stroke-width:9}.dm-ring .fg{fill:none;stroke:#1F7A4D;stroke-width:9;stroke-linecap:round;animation:dmring 1.3s cubic-bezier(.2,.8,.2,1)}@keyframes dmring{from{stroke-dashoffset:264}}
.dm-ring b{position:absolute;inset:0;display:grid;place-items:center;font-stretch:62%;font-weight:800;font-size:1.4rem;color:#13261F}
.dm-sg{display:grid;grid-template-columns:1fr 1fr;gap:6px}.dm-sg b{display:block;font-stretch:62%;font-weight:800;font-size:1.05rem;color:#13261F}.dm-sg span{font-size:.54rem;color:#5b6b63}
.dm-seq{display:flex;gap:3px}.dm-seq i{width:11px;height:11px;border-radius:50%;background:#d5dbd7}.dm-seq i.w{background:radial-gradient(circle at 35% 30%,#f2ff8a,#c9e033 60%,#a8bf22)}
.dm-bars{display:flex;align-items:flex-end;gap:10px;height:50px;margin-top:10px;padding:0 6px;border-bottom:1px solid #e3e6df}.dm-bars i{flex:1;border-radius:5px 5px 0 0;background:#1F7A4D;animation:dmgrow .9s cubic-bezier(.2,.8,.2,1) both;transform-origin:bottom}.dm-bars i.l{background:#d9a79c}@keyframes dmgrow{from{transform:scaleY(0)}}
.dm-prof{display:grid;gap:10px;justify-items:center}.dm-card{width:132px;padding:12px 8px;border-radius:16px;display:grid;justify-items:center;gap:3px;background:linear-gradient(160deg,#F3DE9C,#B08D3C);color:#3b2b06;box-shadow:0 16px 26px -16px rgba(148,114,42,.9)}.dm-card b{font-stretch:62%;font-weight:800;font-size:1.7rem;line-height:1}.dm-card span{font-size:.62rem;font-weight:800}.dm-card em{font-style:normal;font-size:.55rem}
.dm-pf,.dm-rev{display:grid;gap:4px;width:100%}.dm-row{display:flex;justify-content:space-between;gap:8px;padding:6px 8px;border-radius:9px;background:#fff;font-size:.64rem}.dm-row span{color:#5b6b63}.dm-row.ok b{color:#1F7A4D}.dm-row.ko b{color:#B4472F}
.dm-ops,.dm-club,.dm-acta,.dm-pdf,.dm-cycle{position:relative;width:min(310px,100%);border-radius:24px;padding:16px;display:grid;gap:10px}
.dm-ops{background:linear-gradient(160deg,#123d30,#0b2a21);color:#F2F5F0}
.dm-hd{display:flex;align-items:center;gap:7px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.1)}.dm-hd img{width:18px}.dm-hd b{font-size:.8rem;flex:1}.dm-hd.dark{border-color:#e3e6df}.dm-hd.dark b{color:#13261F}
.dm-gest{position:relative;font-size:.68rem;font-weight:800;padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.12);box-shadow:0 0 0 2px #E2C47C;animation:hxpulse 2s infinite}.dm-gest i{position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:#E5533D}
.dm-house{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#0f3b2e;color:#E2C47C;box-shadow:0 0 0 2px #E2C47C}
.dm-k{font-size:.58rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#E2C47C}
.dm-osteps{display:flex;justify-content:space-between}.dm-osteps i{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;border:2px solid rgba(255,255,255,.2);color:rgba(242,245,240,.6)}.dm-osteps i.done{background:#E2C47C;border-color:#E2C47C;color:#0b2a21}.dm-osteps i.now{border-color:#E2C47C;color:#E2C47C;animation:hxpulse 2s infinite}
.dm-onext{border-radius:14px;background:#F7F5EF;color:#13261F;padding:11px;display:grid;gap:3px}.dm-onext span{font-size:.56rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94722A}.dm-onext b{font-size:.92rem}.dm-onext em{font-style:normal;font-size:.66rem;color:#5b6b63}
.dm-cycle{background:var(--surface,#fff);border:1px solid var(--line,#e3e6df)}
.dm-cycle>.tm-ej{top:auto;bottom:10px}.dm-ctabs{display:flex;gap:4px;overflow-x:auto}.dm-ctabs button{flex:none;border:0;border-radius:999px;padding:6px 9px;font-size:.66rem;font-weight:700;background:var(--bg,#f4f5f1);color:var(--muted,#5b6b63);cursor:pointer}.dm-ctabs button.on{background:#13261F;color:#E2C47C}
.dm-cbody{min-height:170px}.dm-in{animation:obslide .35s ease}
.dm-resp{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;justify-items:center}.dm-resp div{position:relative}.dm-resp i{position:absolute;right:-4px;bottom:-4px;width:15px;height:15px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:.55rem;font-weight:800;border:2px solid #fff;color:#fff}.dm-resp i.y{background:#1F7A4D}.dm-resp i.m{background:#94722A}.dm-resp i.n{background:#B4472F}
.dm-sel{display:grid;gap:4px}.dm-sel label{display:grid;grid-template-columns:24px 1fr 18px;gap:7px;align-items:center;padding:5px 7px;border-radius:10px;background:var(--bg,#f4f5f1);font-size:.64rem}.dm-sel label i{width:16px;height:16px;border-radius:5px;border:1.5px solid #cfd6d1;display:grid;place-items:center}.dm-sel label.on i{background:#13261F;border-color:#13261F;color:#E2C47C}
.dm-sb{border-radius:14px;background:#0b2a21;color:#F2F5F0;padding:12px;display:grid;gap:8px}.dm-sb div{display:grid;grid-template-columns:1fr auto 18px;gap:8px;align-items:center;font-size:.78rem}.dm-sb span{display:flex;gap:3px}.dm-sb span i{width:11px;height:11px;border-radius:3px;background:rgba(255,255,255,.14)}.dm-sb span i.w{background:#E2C47C}.dm-sb strong{font-stretch:62%;font-size:1.3rem;text-align:right}
.dm-final{display:grid;justify-items:center;gap:6px;text-align:center;padding:16px 8px;border-radius:16px;background:linear-gradient(140deg,#F6E7B8,#D9B45A);color:#3b2b06}.dm-final b{font-size:1rem}.dm-final span{font-size:.68rem}
.dm-acta{background:var(--bg,#f4f5f1);justify-items:center}
.dm-doc{position:relative;width:160px;height:150px;border-radius:10px;background:#fff;border:1px solid #e3e6df;padding:12px;display:grid;align-content:start;gap:8px;overflow:hidden}.dm-doc b{font-size:.55rem}.dm-doc i{height:5px;border-radius:3px;background:#e6eaef}.dm-doc i:nth-child(3n){width:70%}
.dm-laser{position:absolute;left:0;right:0;top:0;height:2px;background:#ff6f61;box-shadow:0 0 8px 2px rgba(255,90,78,.6);animation:dmscan 2.2s ease-in-out infinite}@keyframes dmscan{0%{top:2%;opacity:0}10%{opacity:1}90%{opacity:1}100%{top:96%;opacity:0}}
.dm-club{background:var(--surface,#fff);border:1px solid var(--line,#e3e6df)}
.dm-at{display:flex;justify-content:space-between;padding:8px 10px;border-radius:10px;background:var(--bg,#f4f5f1);font-size:.68rem;box-shadow:inset 3px 0 0 #94722A}
.dm-kp{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.dm-kp div{padding:6px;border-radius:10px;background:var(--bg,#f4f5f1)}.dm-kp b{display:block;font-stretch:62%;font-weight:800;font-size:1.2rem}.dm-kp b.w{color:#1F7A4D}.dm-kp b.l{color:#B4472F}.dm-kp span{font-size:.56rem;color:#5b6b63}
.dm-team{display:grid;grid-template-columns:1fr auto;gap:2px 8px;padding:9px 10px;border-radius:12px;background:var(--bg,#f4f5f1)}.dm-team b{font-size:.72rem}.dm-team em{font-style:normal;font-stretch:62%;font-weight:800;font-size:1.1rem;grid-row:span 2;align-self:center}.dm-team span{font-size:.6rem;color:#5b6b63}
.dm-docrow{display:grid;grid-template-columns:26px 1fr auto;gap:7px;align-items:center;padding:8px;border-radius:11px;background:var(--bg,#f4f5f1)}.dm-docrow i{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:#fff;color:#5b6b63}.dm-docrow b{font-size:.66rem}.dm-docrow em{font-style:normal;font-size:.58rem;font-weight:800;padding:2px 7px;border-radius:999px}.dm-docrow em.ok{background:#DDF1E6;color:#1F7A4D}.dm-docrow em.mid{background:#F3EAD3;color:#94722A}.dm-docrow em.scan{background:#fde4e1;color:#c2463a}
.dm-pdf{background:var(--bg,#f4f5f1);justify-items:center}.dm-cover{width:150px;height:200px;border-radius:8px;background:#12284C;color:#fff;display:grid;justify-items:center;align-content:center;gap:8px;box-shadow:0 18px 30px -16px rgba(18,40,76,.9);border-bottom:6px solid #9E1B32}.dm-cover img{width:44px}.dm-cover b{font-size:.62rem;letter-spacing:.12em;text-align:center}.dm-cover span{font-size:.56rem;color:#E2C47C}
.dm-sent{display:flex;align-items:center;gap:6px;font-size:.72rem;font-weight:700;color:#1F7A4D;background:#DDF1E6;padding:7px 11px;border-radius:999px}
@media (max-width:420px){.ob-mock{min-height:280px}.dm-phone{width:236px}}
@media (prefers-reduced-motion: reduce){#onb,.ob-card,.ob-mock,.ob-crest,.ob-burst,.dm-ring .fg,.dm-bars i,.dm-laser,.dm-gest,.dm-osteps i.now,.dm-in{animation:none!important}}
`;
function ensureOnbCss(){ if(document.getElementById('onb-css')) return; const s=document.createElement('style'); s.id='onb-css'; s.textContent=ONB_CSS+(typeof SPOT_CSS!=='undefined'? SPOT_CSS : ''); document.head.appendChild(s); }
const ensureTourCss = ensureOnbCss;

document.addEventListener('keydown',e=>{ if(!ui.onb||ui.onb.stage!=='tour') return; if(e.key==='ArrowRight') onbGo(1); else if(e.key==='ArrowLeft') onbGo(-1); });
/* ---------- Tour guiado sobre la app real: foco en cada elemento + explicación ---------- */
const navSel = k => `.tabbar a[data-nav="${k}"], .topnav a[data-nav="${k}"]`;
function spotSteps(){ const R=ui.onb?.roles||[], st=[];
  if(R.includes('player')){
    st.push({r:'inicio', sel:'.hero .board', t:'Tu próxima jornada', d:'Rival, fecha y hora. El día del partido, el marcador se actualiza en directo.'});
    st.push({r:'inicio', sel:'.hx-my', t:'Tu estado en la jornada', d:'Si estás disponible y si estás convocado. Un toque para responder.', ex:`<div class="dm-tiles"><div class="ok">${svgi('check',14,2.4)}<span>Disponible</span></div><div class="ok">${svgi('list',14,2.2)}<span>Individual 2</span></div></div>`});
    st.push({r:'inicio', sel:'.hx-stats, .hx-empty', t:'Tus números y la actividad', d:'Tu win rate, tu racha y lo último del equipo: resultados, convocatorias y MVP.', ex:`<div class="dm-st"><div class="dm-ring" style="width:64px;height:64px"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="bg"/><circle cx="50" cy="50" r="42" class="fg" stroke-dasharray="264" stroke-dashoffset="77"/></svg><b style="font-size:1.1rem">71%</b></div><div class="dm-sg"><div><b>5-2</b><span>individuales</span></div><div><b>3-1</b><span>dobles</span></div></div></div>`});
    st.push({r:'clasificacion', sel:navSel('clasificacion'), t:'Clasificación', d:'La tabla de la liga y cómo evoluciona el equipo jornada a jornada.', ex:`<div style="display:grid;gap:4px">${DEMO.table.slice(0,4).map((r,i)=>dmRow(`${i+1}. ${r[0]}`,`${r[1]} pts`,r[2]?'ok':'')).join('')}</div>`});
    st.push({r:'calendario', sel:navSel('calendario'), t:'Calendario', d:'Todas las jornadas, jugadas y por jugar. Toca una para ver la convocatoria y los partidos.', ex:`<div class="dm-cal">${DEMO.results.slice(1).map(r=>`<div><span class="j">${r[0]}</span><b>${r[1]}</b><em class="${r[3]==='W'?'w':'l'}">${r[3]==='W'?'G':'P'} ${r[2]}</em></div>`).join('')}<div class="nx"><span class="j">4</span><b>CT Mirador</b><em>Sáb 15:00</em></div></div>`});
    st.push({r:'equipo', sel:navSel('equipo'), t:'Equipo', d:'La plantilla con fotos. Toca a un compañero para ver su perfil y sus estadísticas.', ex:`<div class="dm-grid">${[0,1,2,3].map(i=>`<div>${demoFace(i,38)}<b>${DEMO.players[i][0].split(' ')[0]}</b></div>`).join('')}</div>`});
    st.push({r:'stats', sel:navSel('stats'), t:'Estadísticas', d:'Rankings de individuales y dobles, MVP de la temporada y récords del equipo.', ex:`<div style="display:grid;gap:4px">${[['Pau Ferrer','6-1 · 86%'],['Marc Soler','5-2 · 71%'],['Àlex Puig','4-2 · 67%']].map((r,i)=>dmRow(`${i+1}. ${r[0]}`,r[1],i?'':'ok')).join('')}${dmRow('MVP de la temporada','Pau Ferrer (2)')}</div>`});
    st.push({r:'yo', sel:navSel('yo'), t:'Yo', d:'Tu ficha, tus avisos pendientes, instalar la app y las notificaciones. Y esta introducción, por si quieres repetirla.'}); }
  if(R.includes('captain')){
    st.push({r:'inicio', sel:'.hx-ops', t:'Tu centro de operaciones', d:'Como capitán ves aquí el estado de la jornada y el siguiente paso, con su botón.'});
    st.push({r:'inicio', sel:'.adminlink', t:'Gestión', d:'Todo lo del capitán está aquí. Si hay algo pendiente, verás un punto rojo.'});
    st.push({r:'admin', sel:'.mdtabs', t:'Las fases de cada jornada', d:'Preparar (disponibilidad), Convocar (orden de juego y cartel), Resultados (con el acta y la IA) y Postpartido (informe y MVP).'}); }
  if(R.includes('manager')){
    st.push({r:me?'inicio':'club', sel:'.clublink', t:'Gestión deportiva', d:'El icono de la casa abre la vista de todo el club, separada de la de tu equipo.'});
    st.push({r:'club', sel:'.attn, .attn-ok', t:'Lo que requiere atención', d:'Resultados sin poner, por validar y documentos por revisar de todos los equipos, lo primero.', ex:`<div style="display:grid;gap:6px">${['Polo B, jornada 4: sin resultado','Femenino A: resultado por validar','Polo A: 2 documentos por revisar'].map(x=>`<div class="dm-at">${x}<span>›</span></div>`).join('')}</div>`});
    st.push({r:'club-resumen', sel:'[data-act=mail-toggle]', t:'Informe del fin de semana', d:'Genera el PDF profesional y lo envía por correo a los gestores, con un botón.'}); }
  return st; }
function visibleEl(sel){ return [...document.querySelectorAll(sel)].find(e=>{ const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); return r.width>0 && r.height>0 && cs.visibility!=='hidden' && cs.display!=='none'; }); }
function spotShow(i){ ensureOnbCss(); const S_=spotSteps(); if(!S_.length) return onbAfterSpot(); i=Math.max(0,Math.min(i,S_.length-1)); ui.onb.i=i; onbSave();
  const s=S_[i]; let el=document.getElementById('spot');
  if(!el){ el=document.createElement('div'); el.id='spot'; el.innerHTML='<div class="sp-hole"></div><div class="sp-tip" role="dialog" aria-live="polite"></div>'; document.body.appendChild(el);
    el.addEventListener('click',e=>{ const b=e.target.closest('[data-sp]'); if(!b) return; const a=b.dataset.sp; if(a==='next') spotGo(1); else if(a==='prev') spotGo(-1); else if(a==='skip') onbAfterSpot(); });
    ui.spotRe=()=>{ clearTimeout(ui.spotT); ui.spotT=setTimeout(()=>spotPlace(false),60); }; addEventListener('resize',ui.spotRe); addEventListener('scroll',ui.spotRe,{passive:true}); }
  const tip=el.querySelector('.sp-tip'); const n=S_.length;
  tip.innerHTML=`<div class="sp-head"><span>${i+1} de ${n}</span><button class="sp-skip" data-sp="skip">Saltar</button></div><div class="sp-bar"><i style="width:${Math.round((i+1)*100/n)}%"></i></div>
    <h3>${esc(s.t)}</h3><p>${esc(s.d)}</p>${s.ex? `<div class="sp-ex"><span class="tm-ej">Ejemplo</span>${s.ex}</div>` : ''}
    <div class="sp-nav"><button class="btn ghost sm" data-sp="prev" ${i?'':'disabled'}>Atrás</button><button class="btn brass" data-sp="next">${i===n-1? 'Continuar' : 'Siguiente'}</button></div>`;
  tip.classList.remove('in'); void tip.offsetWidth; tip.classList.add('in');
  if(route()!==s.r){ location.hash=s.r; setTimeout(()=>spotPlace(true),480); } else setTimeout(()=>spotPlace(true),60); }
function spotPlace(scroll){ const el=document.getElementById('spot'); if(!el||!ui.onb||ui.onb.stage!=='spot') return; const s=spotSteps()[ui.onb.i]; if(!s) return;
  const t=visibleEl(s.sel), hole=el.querySelector('.sp-hole'), tip=el.querySelector('.sp-tip');
  if(t && scroll){ const r0=t.getBoundingClientRect(); if(r0.top<70 || r0.bottom>innerHeight-90) { t.scrollIntoView({block:'center'}); return setTimeout(()=>spotPlace(false),120); } }
  const W=innerWidth, H=innerHeight, mob=W<700;
  if(!t){ hole.style.cssText='left:50%;top:40%;width:0;height:0;'; tip.style.cssText= mob? 'left:12px;right:12px;bottom:16px;' : `left:${Math.round(W/2-190)}px;top:${Math.round(H/2-120)}px;width:380px`; return; }
  let r=t.getBoundingClientRect(); const pad=6, th=tip.offsetHeight||240; let side=null;
  if(r.height+th+pad*2+44 <= H){            // cabe con la tarjeta: arriba o abajo, desplazando si hace falta
    if(H-r.bottom-pad-14 >= th) side='below'; else if(r.top-pad-14 >= th) side='above';
    else if(scroll){ scrollBy(0, r.top-pad-16); return setTimeout(()=>spotPlace(false),140); }
    else { side='below'; const tipTop=H-th-10; if(r.bottom+pad+12>tipTop){ r={left:r.left, top:r.top, width:r.width, height:Math.max(60, tipTop-12-pad-r.top)}; r.bottom=r.top+r.height; } }
  } else {                                   // más alto que la pantalla: su parte superior, y la tarjeta debajo
    if(scroll && Math.abs(r.top-64)>8){ scrollBy(0, r.top-64); return setTimeout(()=>spotPlace(false),140); }
    r={left:r.left, top:r.top, width:r.width, height:Math.max(80, H-th-48-r.top-pad)}; r.bottom=r.top+r.height; side='below'; }
  hole.style.cssText=`left:${r.left-pad}px;top:${r.top-pad}px;width:${r.width+pad*2}px;height:${r.height+pad*2}px;border-radius:${Math.min(22,Math.max(10,r.height/2))}px`;
  const top = side==='below'? Math.min(H-th-10, r.bottom+pad+12) : Math.max(10, r.top-pad-12-th);
  if(mob) tip.style.cssText=`left:12px;right:12px;top:${top}px`;
  else { const w=360, left=Math.max(12,Math.min(W-w-12, r.left+r.width/2-w/2)); tip.style.cssText=`left:${left}px;top:${top}px;width:${w}px`; } }
function spotGo(d){ const n=spotSteps().length, i=ui.onb.i+d; if(i<0) return; if(i>=n) return onbAfterSpot(); spotShow(i); }
function spotEnd(){ const el=document.getElementById('spot'); if(el){ el.classList.add('out'); setTimeout(()=>el.remove(),250); } if(ui.spotRe){ removeEventListener('resize',ui.spotRe); removeEventListener('scroll',ui.spotRe); ui.spotRe=null; } }
function onbAfterSpot(){ spotEnd(); scrollTo(0,0); if(me){ ui.onb.stage='perfil'; ui.onb.step=0; } else ui.onb.stage='apps'; location.hash= me? 'inicio' : 'club'; setTimeout(drawOnb,120); }
// ---- instalar la app y activar avisos
function appsStage(){ const inst=isStandalone(), push=pushState;
  const instBox = inst? `<div class="ob-app ok"><i>${svgi('check',20,2.4)}</i><div><b>App instalada</b><span>Ya la tienes en la pantalla de inicio.</span></div></div>`
    : installEvt? `<div class="ob-app"><i>📲</i><div><b>Instala la app</b><span>Acceso directo, pantalla completa y más rápida.</span></div><button class="btn brass sm" data-act="install">Instalar</button></div>`
    : isIOS()? `<div class="ob-app"><i>📲</i><div><b>Instálala en el iPhone</b><span>En Safari pulsa <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b>.</span></div></div>`
    : `<div class="ob-app"><i>📲</i><div><b>Instala la app</b><span>En el menú del navegador, elige <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.</span></div></div>`;
  const pushBox = !pushReady()? (isAdmin? `<div class="ob-app"><i>🔔</i><div><b>Notificaciones sin configurar</b><span>Solo lo ves tú (administrador): falta la clave vapidKey en config.js. Mientras tanto, el resto del equipo no verá esta opción.</span></div></div>` : '')
    : push==='on'? `<div class="ob-app ok"><i>${svgi('check',20,2.4)}</i><div><b>Notificaciones activadas</b><span>Te avisaremos de disponibilidad, convocatoria, encuesta y MVP.</span></div></div>`
    : push==='denied'? `<div class="ob-app"><i>🔕</i><div><b>Notificaciones bloqueadas</b><span>Actívalas en los ajustes del navegador para esta web.</span></div><button class="btn ghost sm" data-act="push-on">Reintentar</button></div>`
    : `<div class="ob-app"><i>🔔</i><div><b>Activa las notificaciones</b><span>Disponibilidad, convocatoria, encuesta y MVP, directas al móvil.${isIOS()&&!inst? ' En iPhone, primero instala la app.' : ''}</span></div><button class="btn brass sm" data-act="push-on">Activar</button></div>`;
  return `<div class="ob-card"><div class="ob-txt" style="padding-top:22px"><span class="ob-n">Casi listo</span><h2>Llévala en el móvil</h2><p>Instálala y activa los avisos para no perderte ninguna convocatoria.</p></div><div class="ob-form" style="gap:10px">${instBox}${pushBox}</div>
    <div class="ob-nav"><button class="btn ghost" data-onb="appslater">Más tarde</button><span></span><button class="btn brass" data-onb="appsnext">Siguiente</button></div></div>`; }
// ---- recordatorio en Inicio si quedó pendiente (se puede cerrar)
const pushReady = () => !!CFG.vapidKey;
function appsNudge(){ if(!me || ui.onb) return ''; const needI=!isStandalone(), needP=pushState!=='on' && pushReady(); if(!needI && !needP) return '';
  try{ const d=+localStorage.getItem('polo-nudge')||0; if(Date.now()-d<5*864e5) return ''; }catch(e){}
  return `<section class="sec"><div class="nudge"><i>${needI? '📲' : '🔔'}</i><div><b>${needI&&needP? 'Instala la app y activa los avisos' : needI? 'Instala la app' : 'Activa las notificaciones'}</b><span>Para enterarte al momento de la convocatoria y la disponibilidad.</span></div><div class="row">${needI&&installEvt? '<button class="btn brass sm" data-act="install">Instalar</button>' : ''}${needP? '<button class="btn brass sm" data-act="push-on">Activar avisos</button>' : ''}${needI&&!installEvt? '<a class="btn ghost sm" href="#yo">Cómo instalar</a>' : ''}<button class="btn ghost sm" data-act="nudge-off" aria-label="Cerrar">✕</button></div></div></section>`; }
const SPOT_CSS=`
#spot{position:fixed;inset:0;z-index:240;pointer-events:auto}
#spot.out{opacity:0;transition:opacity .25s}
.sp-hole{position:fixed;border-radius:16px;box-shadow:0 0 0 2px #E2C47C,0 0 0 9999px rgba(5,20,15,.74);transition:all .45s cubic-bezier(.2,.8,.2,1);pointer-events:none;animation:sppulse 2.2s ease-out infinite}
@keyframes sppulse{0%{box-shadow:0 0 0 2px #E2C47C,0 0 0 2px rgba(226,196,124,.5),0 0 0 9999px rgba(5,20,15,.74)}100%{box-shadow:0 0 0 2px #E2C47C,0 0 0 14px rgba(226,196,124,0),0 0 0 9999px rgba(5,20,15,.74)}}
.sp-tip{position:fixed;z-index:2;padding:16px 16px 14px;border-radius:22px;background:var(--surface,#fff);color:var(--ink,#13261F);box-shadow:0 26px 60px -24px rgba(0,0,0,.75);transition:top .4s cubic-bezier(.2,.8,.2,1),left .4s cubic-bezier(.2,.8,.2,1)}
.sp-tip.in{animation:spin .35s cubic-bezier(.2,.8,.2,1)}@keyframes spin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.sp-head{display:flex;justify-content:space-between;align-items:center}.sp-head span{font-size:.7rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#94722A}
.sp-skip{border:0;background:none;color:var(--muted,#5b6b63);font-weight:700;font-size:.82rem;cursor:pointer}
.sp-bar{height:3px;border-radius:3px;background:var(--surface2,#eef0eb);margin:8px 0 10px;overflow:hidden}.sp-bar i{display:block;height:100%;background:linear-gradient(90deg,#94722A,#E2C47C);transition:width .4s}
.sp-tip h3{margin:0 0 4px;font-stretch:72%;font-weight:750;font-size:1.35rem;line-height:1.1}
.sp-tip p{margin:0;color:var(--muted,#5b6b63);font-size:.92rem;line-height:1.4}
.sp-ex{position:relative;margin-top:10px;padding:12px;border-radius:14px;background:var(--bg,#f4f5f1)}
.sp-ex .tm-ej{top:6px;right:6px}
.sp-nav{display:flex;justify-content:space-between;align-items:center;margin-top:12px}
.ob-app{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;padding:14px;border-radius:18px;background:var(--bg,#f4f5f1);border:1px solid var(--line,#e3e6df)}
.ob-app>i{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:var(--surface,#fff);font-style:normal;font-size:1.3rem}
.ob-app b{display:block;font-size:1rem}.ob-app span{display:block;font-size:.82rem;color:var(--muted,#5b6b63);line-height:1.35;margin-top:2px}.ob-app span b{display:inline;font-size:inherit;color:var(--ink,#13261F)}
.ob-app.ok{background:#EAF6EF;border-color:#bfe3cf}.ob-app.ok>i{background:#1F7A4D;color:#fff}
@media (max-width:420px){.ob-app{grid-template-columns:40px 1fr}.ob-app .btn{grid-column:1 / -1;justify-content:center}}
.nudge{display:grid;grid-template-columns:42px 1fr auto;gap:12px;align-items:center;padding:12px 14px;border-radius:18px;background:linear-gradient(135deg,#FBF6E8,#F3EAD3);border:1px solid #E8D9AE}
.nudge>i{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:#fff;font-style:normal;font-size:1.2rem}
.nudge b{display:block;font-size:.95rem}.nudge span{display:block;font-size:.8rem;color:#6b5a2e}
.nudge .row{gap:6px;flex-wrap:nowrap}
@media (max-width:560px){.nudge{grid-template-columns:42px 1fr}.nudge .row{grid-column:1 / -1;flex-wrap:wrap}}
@media (prefers-reduced-motion: reduce){.sp-hole{animation:none;transition:none}.sp-tip,.sp-tip.in{animation:none;transition:none}}
`;

/* ===================== MENSAJE AL EQUIPO + RECORDATORIOS AUTOMÁTICOS ===================== */
const MSG_AUD = {all:'Todos', pending:'Sin responder', convoked:'Convocados'};
function msgAudience(j){ const t=tie(j)||blankTie(), a=availFor(j);
  return { all:S.players.filter(p=>p.active!==false).map(p=>p.id), pending:a.none, convoked:[...new Set([...(t.convocados||[]),...(t.subs||[]),...(t.rubbers||[]).flatMap(r=>r.polo||[])])] }; }
function msgTemplates(j){ const f=poloFix(j), p=persp(f), riv=clubName(p.rival), fd=fdate(f,{weekday:'long',day:'numeric',month:'long'}), where=p.home?'en casa':'fuera', mv=!!(f.moved?.from&&f.moved.from!==f.date);
  return [
    {k:'avail', l:'Pedir disponibilidad', aud:'pending', title:'Falta tu disponibilidad', text:`Falta tu respuesta para la jornada ${j} contra ${riv} (${fd}). Responde en la app, es un toque.`},
    {k:'lineup', l:'Convocatoria', aud:'convoked', title:`Convocatoria, jornada ${j}`, text:`Convocatoria publicada para la jornada ${j} contra ${riv}. Mira tu partido en la app.`},
    {k:'date', l: mv? 'Cambio de fecha' : 'Fecha y hora', aud:'all', title: mv? 'Cambio de fecha' : `Jornada ${j}: ${fd}`, text: mv? `Cambio de fecha: la jornada ${j} contra ${riv} ahora es el ${fd} a las ${f.time} h (${where}). Antes era el ${shortD(f.moved.from)}.` : `Jornada ${j} contra ${riv}: ${fd} a las ${f.time} h (${where}).`},
    {k:'day', l:'Recordatorio del partido', aud:'convoked', title:`Jugamos contra ${riv}`, text:`Recordatorio: ${fd} a las ${f.time} h contra ${riv} (${where}). Llegad con tiempo para calentar.`},
    {k:'free', l:'Mensaje libre', aud:'all', title:`Jornada ${j}: mensaje del capitán`, text:''} ]; }
function msgOpen(j){ ensureMsgCss(); const T=msgTemplates(j), a=availFor(j); const first=(a.none.length && !deadlinePassed(j))? T[0] : T[4];
  ui.msg={j, tpl:first.k, aud:first.aud, title:first.title, text:first.text, busy:false}; drawMsg(); }
function msgClose(){ ui.msg=null; drawMsg(); }
function drawMsg(){ const M=ui.msg; let el=document.getElementById('msgm');
  if(!M){ if(el){ el.classList.add('out'); setTimeout(()=>el.remove(),220); } document.body.classList.remove('msg-on'); return; }
  if(!el){ el=document.createElement('div'); el.id='msgm'; document.body.appendChild(el); document.body.classList.add('msg-on'); el.addEventListener('click',msgClick);
    el.addEventListener('input',e=>{ if(e.target.id!=='mg-text'||!ui.msg) return; ui.msg.text=e.target.value; const c=el.querySelector('.mg-cnt'); if(c) c.textContent=e.target.value.length+'/220'; msgBtns(); }); }
  const T=msgTemplates(M.j), au=msgAudience(M.j), p=persp(poloFix(M.j)), log=((tie(M.j)||{}).msgLog||[]).slice(-3).reverse();
  el.innerHTML=`<div class="mg-back" data-mg="close"></div><div class="mg-sheet" role="dialog" aria-modal="true" aria-label="Mensaje al equipo">
    <div class="mg-h"><div><b>Mensaje al equipo</b><span>Jornada ${M.j}, Polo contra ${esc(clubName(p.rival))}</span></div><button class="mg-x" data-mg="close" aria-label="Cerrar">✕</button></div>
    <div class="mg-chips">${T.map(t=>`<button data-mg="tpl" data-k="${t.k}" aria-pressed="${t.k===M.tpl}">${esc(t.l)}</button>`).join('')}</div>
    <div class="mg-aud"><span>Para</span>${Object.entries(MSG_AUD).map(([k,l])=>`<button data-mg="aud" data-k="${k}" aria-pressed="${k===M.aud}">${l}<em>${au[k].length}</em></button>`).join('')}</div>
    <label class="mg-f"><span>Mensaje <i class="mg-cnt">${M.text.length}/220</i></span><textarea id="mg-text" rows="4" maxlength="220" placeholder="Escribe el mensaje para el equipo">${esc(M.text)}</textarea></label>
    <div class="mg-btns"><button class="btn brass big" data-mg="push">${svgi('mega',17)} Enviar notificación a la app</button><button class="btn" data-mg="wa">Enviar por WhatsApp</button><button class="btn ghost" data-mg="copy">Copiar</button></div>
    <p class="mg-note"><b>Notificación:</b> llega al móvil de quien la tenga activada. <b>WhatsApp:</b> se abre con el mensaje listo para que elijas el grupo y pulses enviar; WhatsApp no permite que una app escriba sola en un grupo.</p>
    ${log.length? `<div class="mg-log"><span>Últimos mensajes</span>${log.map(m=>`<div><b>${esc(m.text.slice(0,80))}${m.text.length>80?'…':''}</b><small>${esc(MSG_AUD[m.aud]||'')}, ${m.ch==='push'? 'notificación'+(m.reached!=null? ' ('+m.reached+' de '+m.n+')' : '') : 'WhatsApp'}, ${relTime(m.at)}</small></div>`).join('')}</div>` : ''}</div>`;
  msgBtns(); }
function msgBtns(){ const M=ui.msg, el=document.getElementById('msgm'); if(!M||!el) return; const n=msgAudience(M.j)[M.aud].length, ok=M.text.trim().length>=3;
  const b=el.querySelector('[data-mg=push]'); if(b){ b.disabled=M.busy||!ok||!n; b.title= !n? 'No hay nadie en este grupo' : !ok? 'Escribe el mensaje' : ''; }
  ['wa','copy'].forEach(k=>{ const x=el.querySelector(`[data-mg=${k}]`); if(x) x.disabled=!ok; }); }
function msgLogAdd(ch,d){ const M=ui.msg, t=ensureTie(M.j);
  t.msgLog=[...(t.msgLog||[]),{at:Date.now(), by:(me&&player(me)?.name)||authUser?.email||'', aud:M.aud, ch, text:M.text.replace(/\s+/g,' ').trim().slice(0,220), n:msgAudience(M.j)[M.aud].length, ...(d&&d.reached!=null? {reached:d.reached} : {})}].slice(-30);
  saveState(ch==='push'? 'Mensaje enviado' : 'Mensaje preparado'); }
async function msgClick(e){ const M=ui.msg; if(!M) return; const b=e.target.closest('[data-mg]'); if(!b) return; const a=b.dataset.mg;
  if(a==='close') return msgClose();
  if(a==='tpl'){ const t=msgTemplates(M.j).find(x=>x.k===b.dataset.k); if(t){ Object.assign(M,{tpl:t.k,aud:t.aud,title:t.title,text:t.text}); drawMsg(); if(t.k==='free') document.getElementById('mg-text')?.focus(); } return; }
  if(a==='aud'){ M.aud=b.dataset.k; drawMsg(); return; }
  const text=M.text.trim(); if(text.length<3) return toast('Escribe el mensaje');
  if(a==='copy'){ try{ await navigator.clipboard.writeText(text+'\n'+location.origin+'/#jornada-'+M.j); toast('Copiado'); }catch(err){ toast('No se ha podido copiar'); } return; }
  if(a==='wa'){ waOpen(text+'\n\n'+location.origin+'/#jornada-'+M.j); msgLogAdd('wa'); msgClose(); return; }
  if(a==='push'){ if(B.mode!=='firebase') return toast('En la vista previa no se envían notificaciones; funcionan en la app publicada. Para probar, usa WhatsApp.');
    if(!msgAudience(M.j)[M.aud].length) return toast('No hay nadie en ese grupo');
    M.busy=true; msgBtns(); const d=await notify('custom',M.j,{aud:M.aud,title:M.title,text:text.replace(/\s+/g,' ')}); if(!ui.msg) return; M.busy=false;
    if(d){ msgLogAdd('push',d); msgClose(); } else msgBtns(); } }
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && ui.msg) msgClose(); });
function autoRemindPanel(){ ensureMsgCss(); const ar=S.rules.autoRemind||{}, on=!!ar.on, every=+ar.every||1, day=ar.dayBefore!==false;
  return `<section class="sec"><div class="sec-h"><h2>Recordatorios automáticos</h2></div><div class="panel ar">
    <div class="ar-top"><div><b>La app avisa sola al equipo</b><span class="muted small">Notificación al móvil, sin que el capitán tenga que acordarse.</span></div><label class="sw" aria-label="Activar recordatorios automáticos"><input type="checkbox" data-ar="on" ${on?'checked':''}><i></i></label></div>
    <div class="ar-opts ${on?'':'off'}"><label class="ar-r"><span>Disponibilidad pendiente</span><select data-ar="every" ${on?'':'disabled'}>${[1,2,3].map(n=>`<option value="${n}" ${every===n?'selected':''}>${n===1?'Cada día':'Cada '+n+' días'}</option>`).join('')}</select></label>
      <p class="muted small" style="margin:0 0 8px">Solo a quien no ha respondido, desde que se pide la disponibilidad hasta que se cierra o vence el plazo.</p>
      <label class="ar-c"><input type="checkbox" data-ar="day" ${day?'checked':''} ${on?'':'disabled'}> Recordar a los convocados el día antes del partido</label></div>
    <p class="muted small">Se envía una vez al día, a media tarde. Llega a quien tenga las notificaciones activadas; para el resto usa «Mensaje al equipo» por WhatsApp.</p>
    ${CFG.vapidKey? '' : '<p class="notice">Faltan por configurar las notificaciones (clave vapidKey en config.js y FIREBASE_SERVICE_ACCOUNT en Vercel). Mientras tanto, esta opción no enviará nada.</p>'}
    <div class="row"><button class="btn ghost sm" data-act="ar-now">Enviar ahora los recordatorios pendientes</button></div></div></section>`; }
const MSG_CSS=`
body.msg-on{overflow:hidden}
#msgm{position:fixed;inset:0;z-index:230;display:grid;align-items:end;justify-items:center}
#msgm.out{opacity:0;transition:opacity .22s}
.mg-back{position:absolute;inset:0;background:rgba(5,20,15,.6);backdrop-filter:blur(4px);animation:mgfade .2s ease}
.mg-sheet{position:relative;width:min(560px,100%);max-height:92dvh;overflow:auto;background:var(--surface,#fff);color:var(--ink,#13261F);border-radius:26px 26px 0 0;padding:18px 18px 22px;box-shadow:0 -24px 60px -30px rgba(0,0,0,.7);animation:mgup .3s cubic-bezier(.2,.8,.2,1)}
@keyframes mgup{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}@keyframes mgfade{from{opacity:0}to{opacity:1}}
@media (min-width:700px){#msgm{align-items:center}.mg-sheet{border-radius:26px}}
.mg-h{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.mg-h b{display:block;font-stretch:72%;font-weight:750;font-size:1.45rem;line-height:1.05}.mg-h span{font-size:.82rem;color:var(--muted,#5b6b63)}
.mg-x{border:0;background:var(--surface2,#eef0eb);width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:.9rem}
.mg-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}.mg-chips button,.mg-aud button{border:1.5px solid var(--line,#e3e6df);background:var(--bg,#f4f5f1);border-radius:999px;padding:8px 13px;font-weight:600;font-size:.85rem;min-height:38px;cursor:pointer;color:inherit}
.mg-chips button[aria-pressed="true"],.mg-aud button[aria-pressed="true"]{background:#13261F;border-color:#13261F;color:#fff;box-shadow:inset 0 0 0 2px #E2C47C}
.mg-aud{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:12px}.mg-aud>span{font-size:.78rem;font-weight:700;color:var(--muted,#5b6b63);margin-right:2px}
.mg-aud em{font-style:normal;font-size:.72rem;font-weight:800;margin-left:6px;opacity:.75}
.mg-f{display:grid;gap:6px;margin-bottom:12px}.mg-f>span{display:flex;justify-content:space-between;font-size:.8rem;font-weight:700}.mg-f i{font-style:normal;font-weight:600;color:var(--muted,#5b6b63)}.mg-f textarea{font-size:1rem;width:100%}
.mg-btns{display:grid;gap:8px;grid-template-columns:1fr 1fr}.mg-btns .big{grid-column:1 / -1;justify-content:center;gap:8px}.mg-btns .btn{justify-content:center}.mg-btns button:disabled{opacity:.45;cursor:not-allowed}
.mg-note{font-size:.78rem;color:var(--muted,#5b6b63);line-height:1.45;margin:12px 0 0}
.mg-log{margin-top:14px;border-top:1px solid var(--line,#e3e6df);padding-top:10px;display:grid;gap:8px}.mg-log>span{font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94722A}.mg-log b{display:block;font-size:.88rem;font-weight:600}.mg-log small{color:var(--muted,#5b6b63);font-size:.76rem}
.ar-top{display:flex;justify-content:space-between;gap:14px;align-items:center}.ar-top b{display:block}
.sw{position:relative;flex:none;width:52px;height:30px}.sw input{position:absolute;inset:0;opacity:0;width:100%;height:100%;margin:0;cursor:pointer;z-index:2}.sw i{position:absolute;inset:0;border-radius:999px;background:#cfd6d1;transition:background .2s}.sw i::after{content:"";position:absolute;left:3px;top:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .2s}.sw input:checked+i{background:#1F7A4D}.sw input:checked+i::after{transform:translateX(22px)}
.ar-opts{margin:14px 0 6px;padding-top:12px;border-top:1px solid var(--line,#e3e6df)}.ar-opts.off{opacity:.5}.ar-r{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;font-weight:600}.ar-r select{max-width:180px}.ar-c{display:flex;gap:8px;align-items:center;font-weight:600;font-size:.92rem}
@media (prefers-reduced-motion: reduce){.mg-sheet,.mg-back{animation:none}}
`;
function ensureMsgCss(){ if(document.getElementById('msg-css')) return; const s=document.createElement('style'); s.id='msg-css'; s.textContent=MSG_CSS; document.head.appendChild(s); }

/* ===================== ROUTER Y RENDER ===================== */
const route = () => (location.hash||'#inicio').slice(1)||'inicio';
function render(){
  if(me && ui.sLoaded===SEASON_PATH && !ui.teamAuto && !S.players.some(p=>p.id===me)){ const hit=rosterAll().find(p=>p.id===me), other=hit?.teams.find(t=>t!==teamId); if(other){ ui.teamAuto=true; setTimeout(()=>switchTeam(other),0); } }
  ensureHomeCss(); updRoles(); if(authReady && authUser && !me && isManager && !adminSkip){ adminSkip=true; if(!route().startsWith('club')) history.replaceState(null,'','#club'); }
  const app=$('#app'), gate=!authReady || !authUser || (!me && !adminSkip);
  document.body.classList.toggle('gate', gate);
  let html, nav=route();
  if(!authReady) html=`<div class="gatebox">${courtSVG()}</div>`;
  else if(!authUser) html=vLogin();
  else if(!me && !adminSkip) html=vClaim();
  else { const r=nav;
    const split=!!document.querySelector('[data-nav="calendario"]');   // barra con Clasificación y Calendario separados
    if(r==='docs'||r.startsWith('doc-')){ ui.docBase='doc-'; ui.docBack='docs'; }   // documentos dentro del equipo
    if(r==='inicio') html=vInicio(); else if(r==='liga') html=vLiga(split?'calendario':'liga'); else if(r==='clasificacion'||r==='clasificación') html=vLiga('clasificacion'); else if(r==='calendario') html=vLiga('calendario');
    else if(r.startsWith('jornada-')){ html=vJornada(+r.slice(8)); nav=split?'calendario':'liga'; }
    else if(r==='equipo') html=vEquipo();
    else if(r.startsWith('jugador-')){ html=vJugador(r.slice(8)); nav='equipo'; }
    else if(r.startsWith('disponibilidad-')){ html=vDisponibilidad(+r.slice(15)); nav='yo'; }
    else if(r.startsWith('encuesta-')){ html=vEncuesta(+r.slice(9)); nav='yo'; }
    else if(r.startsWith('mvp-')){ html=vMvp(+r.slice(4)); nav='yo'; }
    else if(r==='mi-ficha'){ html=vMiFicha(); nav='yo'; }
    else if(r==='club'){ html=vClub(); nav='club'; } else if(r==='club-equipos'){ html=vClubEquipos(); nav='club'; } else if(r==='club-resumen'){ html=vClubResumen(); nav='club'; } else if(r==='club-ajustes'){ html=vClubAjustes(); nav='club'; } else if(r==='club-docs'){ html=vClubDocs(); nav='club'; }
    else if(r.startsWith('club-equipo-')){ html=vClubTeam(r.slice(12)); nav='club'; }
    else if(r.startsWith('club-doc-')){ ui.docBase='club-doc-'; ui.docBack='club-docs'; html=vDoc(r.slice(9)); nav='club'; }
    else if(r==='docs') html=vDocs(); else if(r.startsWith('doc-')) html=vDoc(r.slice(4));
    else if(r==='stats') html=vStats(); else if(r==='yo'||r==='votar') { html=vYo(); nav='yo'; } else if(r==='admin') html=vAdmin(); else html=vNotFound();
    html+=`<footer class="wrap">Datos oficiales: Federació Catalana de Tennis. App privada del ${esc(curTeam()?.short||'equipo')} (${esc(teamCat(curTeam()))}) del Real Club de Polo de Barcelona.${S.updatedAt?' Actualizado el '+new Date(S.updatedAt).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'.':''}</footer>`; }
  app.innerHTML=`<div class="page">${html}</div>`; app.dataset.ok='1';
  document.querySelectorAll('[data-nav]').forEach(a=>{ if(a.dataset.nav===nav) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  const al=$('.adminlink'); al.classList.toggle('on',canManage);
  if(!al.querySelector('.al-t')){ al.insertAdjacentHTML('beforeend','<span class="al-t">Gestión</span><span class="al-dot" aria-hidden="true"></span>'); al.setAttribute('aria-label','Gestión'); al.title='Gestión'; }
  let pend=null; try{ pend=canManage? pendingAction() : null; }catch(e){} al.classList.toggle('pending', !!pend); al.setAttribute('aria-label', pend? 'Gestión: hay un paso pendiente' : 'Gestión');
  const bs=$('.brand span'); if(bs) bs.innerHTML= nav==='club'? `Gestión deportiva <small>Real Club de Polo</small>` : `${esc(teamLabel())} <small>Lliga Catalana ${esc(String(viewSeason).replace(/^20(\d\d)-(\d\d)$/,'$1-$2'))}</small>`;
  let tw=$('.teamsw'); if(!tw){ tw=document.createElement('button'); tw.className='teamsw'; tw.type='button'; tw.setAttribute('aria-label','Cambiar de equipo'); tw.dataset.act='team-menu'; tw.textContent='▾'; $('.brand').after(tw); }
  const inClub = nav==='club'; tw.hidden = !(clubTeams().length>1 || canClub());
  tw.textContent = inClub? 'Ir a un equipo ▾' : '▾'; tw.style.cssText = inClub? 'width:auto;padding:0 10px;margin-left:10px;white-space:nowrap;font-size:.78rem;font-weight:600' : '';
  tw.setAttribute('aria-label', inClub? 'Ir a la app de un equipo' : 'Cambiar de equipo');
  let cl=$('.clublink'); if(!cl){ cl=document.createElement('a'); cl.className='clublink'; cl.href='#club'; cl.title='Gestión deportiva'; cl.setAttribute('aria-label','Gestión deportiva'); cl.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>'; $('.topicons').prepend(cl); }
  cl.classList.toggle('on',canClub()); if(nav==='club') cl.setAttribute('aria-current','page'); else cl.removeAttribute('aria-current');
  document.body.classList.toggle('clubmode', nav==='club');
  setNavMode(nav==='club'); if(authReady&&authUser&&!gate&&route()==='intro'&&!ui.onb){ history.replaceState(null,'','#inicio'); startOnb({force:true}); }
  if(authReady&&authUser){ checkCssVersion(); if(!gate) maybeTour(); if(ui.onb?.stage==='perfil' && ui.onb.step===0 && !document.querySelector('.cropper.on')) drawOnb(); if(ui.onb?.stage==='apps') drawOnb(); if(ui.onb?.stage==='spot' && document.getElementById('spot')) setTimeout(()=>spotPlace(false),30); } document.body.classList.toggle('noplayer', !me);
  const mb=$('.mebtn'); if(mb) mb.innerHTML = me? avatar(player(me)) : (authUser? `<span class="av">${esc((authUser.email||'?')[0].toUpperCase())}</span>`:'');
  const dot=document.querySelector('.tabbar [data-nav="yo"]'); if(dot){ dot.querySelector('.dot')?.remove(); const nx=nextPoloFix(); if(pendingSurveys().length || pendingMvp().length || (nx&&me&&availOpen(nx)&&!avOf(me,nx.j))) dot.insertAdjacentHTML('beforeend','<span class="dot"></span>'); }
  afterRender(app);
}
function editing(){ const a=document.activeElement; return a && a.closest('#app') && /INPUT|TEXTAREA|SELECT/.test(a.tagName); }
function softRender(){ if($('.cropper.on')||$('.pmodal.on')){ ui.pendingRender=true; return; } if(editing()||ui.survey&&route().startsWith('encuesta')&&document.activeElement?.tagName==='TEXTAREA'){ ui.pendingRender=true; return; } renderQuiet(); }
function renderQuiet(){ // re-render sin repetir la animación de entrada
  const y=scrollY; render(); const pg=$('#app .page'); if(pg) pg.style.animation='none'; $('#app').querySelectorAll('.stagger>*').forEach(c=>c.style.animation='none'); scrollTo(0,y);
}
document.addEventListener('focusout',()=>setTimeout(()=>{ if(ui.pendingRender&&!editing()){ ui.pendingRender=false; renderQuiet(); } },150));
let lastRoute=null;
window.addEventListener('hashchange',()=>{ if(ui.fe?.dirty) feFlush(); ui.survey=null; ui.avDraft=null; ui.compose=ui.composeAfter||null; ui.composeAfter=null; if(ui.compose) setTimeout(()=>$('#compose-text')?.scrollIntoView({behavior:'smooth',block:'center'}),250); closeSheet(); stageClose(); closePosterModal(); render(); if(route()!==lastRoute) scrollTo(0,0); lastRoute=route(); });
function toast(m){ const t=$('#toast'); if(!t) return; t.textContent=m; t.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('on'),2600); }

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
  else if(a==='signout'){ B.signOut(); closeSheet(); }
  else if(a==='me'){ if(me) openSheet(me); else if(authUser && confirm('¿Cerrar sesión?')) B.signOut(); }
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
    avail[me]=next; renderQuiet(); if(el.dataset.v==='yes'){ const b=el.getBoundingClientRect(); confetti(b.left+b.width/2,b.top,40); }
    await safe(()=>B.set(SEASON_PATH+'/avail/'+me,next), el.dataset.v==='yes'?'Apuntado: juegas':'Anotado: no puedes'); }
  else if(a==='pick'){ if(!me) return; const k=jid(+el.dataset.j), cur=picks[me]||{j:{}}; const next={j:{...(cur.j||{}),[k]:{p:+el.dataset.p,r:+el.dataset.r}},at:Date.now()}; picks[me]=next; renderQuiet(); await safe(()=>B.set(SEASON_PATH+'/picks/'+me,next),'Pronóstico guardado'); }
  else if(a==='survey-start'){ const j=+el.dataset.j; ui.survey={j,step:0,a:{...(myBallot?.j?.[jid(j)]?.a||{})}}; render(); scrollTo({top:0}); }
  else if(a==='survey-prev'){ ui.survey.step=Math.max(0,ui.survey.step-1); renderQuiet(); }
  else if(a==='survey-next'){ ui.survey.step++; renderQuiet(); }
  else if(a==='ans'){ const q=S.survey.questions.find(x=>x.id===el.dataset.q); ui.survey.a[el.dataset.q]=q?.type==='scale'? +el.dataset.v : el.dataset.v; renderQuiet(); setTimeout(()=>{ if(ui.survey){ ui.survey.step++; renderQuiet(); } },220); }
  else if(a==='survey-send'){ const k=jid(ui.survey.j); const body={j:{...(myBallot?.j||{}),[k]:{a:ui.survey.a,at:Date.now()}}};
    try{ await trackWrite(B.set(SEASON_PATH+'/ballots/'+me,body)); myBallot=body; ui.survey=null; render(); scrollTo(0,0); toast('Respuestas enviadas'); confetti(innerWidth/2,innerHeight/3); }catch(err){ toast('No se ha podido enviar: '+(err?.code||err?.message||'error')); } }
  else if(a==='save-tie'){ const j=+el.dataset.j, t=ensureTie(j);
    document.querySelectorAll('.redit').forEach(row=>{ const r=t.rubbers[+row.dataset.r]; const g=n=>row.querySelector(`[name=${n}]`)?.value??'';
      r.polo=[g('p1'),r.type==='D'?g('p2'):''].filter(Boolean); r.score=g('score').trim(); r.res=g('res')||null; r.note=g('note').trim(); });
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
  else if(a==='mail-to'){ ui.mailTo ||= new Set(); el.checked? ui.mailTo.add(el.value) : ui.mailTo.delete(el.value); ui.mailExtra=$('#mail-extra')?.value||''; renderQuiet(); }
  else if(a==='mail-send'){ mailSend(); }
  else if(a==='mail-open'){ mailOpen(); }
  else if(a==='club-doc-dl'){ clubDocDownload(el.dataset.t, el.dataset.id); }
  else if(a==='club-doc-open'){ switchTeam(el.dataset.t); location.hash='doc-'+el.dataset.id; }
  else if(a==='docs-j'){ ui.docJ=+el.dataset.j; location.hash='docs'; }
  else if(a==='club-f-team'){ ui.clubTeam=el.dataset.t; }
  else if(a==='team-docs'){ switchTeam(el.dataset.t); location.hash='docs'; }
  else if(a==='mgr-add'){ const name=$('#mgr-name').value.trim(), email=$('#mgr-email').value.trim().toLowerCase(); if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast('Escribe un correo válido');
    const managers=[...(meta?.managers||[]).filter(x=>x.email!==email),{name,email}]; await saveMeta({managers, managerEmails:managers.map(x=>x.email)},'Gestor añadido: '+(name||email)); }
  else if(a==='mgr-del'){ const managers=(meta?.managers||[]).filter((_,i)=>i!==+el.dataset.i); await saveMeta({managers, managerEmails:managers.map(x=>x.email)},'Gestor quitado'); }
  else if(a==='cteams-save'){ const teams=clubTeams().map(t=>{ const row=document.querySelector(`#ctlist [data-id="${t.id}"]`); const g=n=>row?.querySelector(`[name=${n}]`)?.value.trim(); return {...t, name:g('name')||t.name, short:g('short')||t.short, cat:g('cat')||'', gender:g('gender')||''}; }); await saveMeta({teams},'Equipos guardados'); }
  else if(a==='cteam-add'){ const name=$('#ct-name').value.trim(), short=$('#ct-short').value.trim()||name; if(!name) return toast('Escribe el nombre del equipo'); let id=slug(short); while(clubTeams().some(t=>t.id===id)) id+='-2'; await saveMeta({teams:[...clubTeams(),{id,name,short,cat:''}]},'Equipo añadido: '+short); clubKey=''; }
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
    const old=f.date; f.home=home? POLO : rv; f.away=home? rv : POLO; if(tm) f.time=tm;
    if(d && d!==old){ const orig=f.moved?.from||old; f.date=d; if(d===orig) delete f.moved; else f.moved={from:orig, at:Date.now(), by:(me&&player(me)?.name)||authUser?.email||''}; ui.adminJ=j; saveState(d<orig? 'Partido adelantado: la app se ha reordenado' : d>orig? 'Partido aplazado: la app se ha reordenado' : 'Vuelve a su fecha original'); }
    else saveState('Eliminatoria actualizada'); }
  else if(a==='move-reset'){ const f=poloFix(+el.dataset.j); if(f?.moved?.from){ f.date=f.moved.from; delete f.moved; saveState('Vuelve a su fecha original'); } }
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
  else if(a==='players-save'){ const caps=isAdmin? [...document.querySelectorAll('input[name=captain]:checked')].map(x=>x.value) : (S.captains||[]);
    const ph={...phones}; const phChanged=[];
    document.querySelectorAll('#plist [data-id]').forEach(row=>{ const p=player(row.dataset.id); if(!p) return; const g=n=>row.querySelector(`[name=${n}]`);
      p.name=g('name').value.trim()||p.name; p.full=g('full').value.trim()||p.name; p.order=+g('order').value||p.order; p.cat=g('cat').value.trim(); p.pts=+g('pts').value||0; p.active=g('active').checked; p.captain=caps.includes(p.id);
      const v=g('phone').value.trim(); if((ph[p.id]||'')!==v){ phChanged.push([p.id,v]); if(v) ph[p.id]=v; else delete ph[p.id]; } });
    S.captains=caps; phones=ph; phChanged.forEach(([pid,v])=>safe(()=> v? B.set('phones/'+pid,{phone:v,at:Date.now()}) : B.del('phones/'+pid)));
    saveState('Plantilla guardada'); }
  else if(a==='player-add'){ const name=$('#np-name').value.trim(); if(!name) return toast('Escribe el nombre'); let id=slug(name); while(player(id)) id+='-2';
    S.players.push({id,name,full:$('#np-full').value.trim()||name,cat:$('#np-cat').value.trim(),pts:0,order:Math.max(...S.players.map(p=>p.order))+1,captain:false,active:true}); saveState(name+' añadido'); }
  else if(a==='teams-save'){ document.querySelectorAll('#tlist [data-id]').forEach(row=>{ const t=team(row.dataset.id); ['name','short','abbr'].forEach(n=>{ const v=row.querySelector(`[name=${n}]`).value.trim(); if(v) t[n]=v; }); }); saveState('Clubes guardados'); }
  else if(a==='fixtures-save'){ document.querySelectorAll('#flist [data-k]').forEach(row=>{ const f=S.fixtures[+row.dataset.k], g=n=>row.querySelector(`[name=${n}]`).value; f.date=g('date')||f.date; f.time=g('time')||f.time; f.home=g('home'); f.away=g('away'); const hs=g('hs'),as=g('as'); if(hs!==''&&as!==''){ f.hs=+hs; f.as=+as; } else { f.hs=null; f.as=null; } }); saveState('Jornada '+el.dataset.j+' guardada'); }
  else if(a==='official-save'){ const order=[...document.querySelectorAll('#offlist select')].map(x=>x.value); if(new Set(order).size!==order.length) return toast('Hay clubes repetidos'); S.official={asOf:+$('#off-j').value||0,order}; saveState('Clasificación oficial guardada'); }
  else if(a==='rules-save'){ S.rules={...S.rules,win:+$('#r-win').value,loss:+$('#r-loss').value,availDays:Math.max(1,Math.min(21,+$('#r-av').value||6)), mvpHours:Math.max(1,Math.min(240,+($('#r-mvp')?.value)||48)), doubles:$('#r-dbl')?.value||'always'}; saveState('Reglas guardadas'); }
  else if(a==='go-admin'){ ui.adminTab='jornada'; ui.adminJ=+el.dataset.j; const tt=el.dataset.t||'disp'; ui.jTab= tt==='enc'||tt==='mvp'? 'post' : tt==='cartel'? 'conv' : tt; ui.jTabSet=true; ui.jTabFor=+el.dataset.j; location.hash='admin'; }
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
  else if(a==='wa-send'||a==='wa-share'||a==='wa-copy'){ const j=+el.dataset.j, kind=el.dataset.kind, text=$('#compose-text')?.value||''; ui.compose.text=text;
    if(a==='wa-send') waOpen(text);
    else if(a==='wa-share'){ try{ await navigator.share({text}); }catch(e){ return; } }
    else { try{ await navigator.clipboard.writeText(text); toast('Texto copiado'); }catch(e){ toast('Selecciona el texto y cópialo a mano'); return; } }
    logSend(kind,j,kind==='rem'?{n:availFor(j).none.length}:null); if(kind==='req') notify('avail',j); else if(kind==='rem') notify('availRem',j); }
  else if(a==='wa-one'){ const j=+el.dataset.j, pid=el.dataset.pid; const text=fillMsg(S.msgs.remOne,{...msgVars(j),nombre:pname(pid).split(' ')[0]}); waOpen(text,waPhone(phones[pid])); logSend('rem',j,{pid}); }
  else if(a==='dl-save'){ const j=+el.dataset.j, v=$('#dl').value; if(!v) return toast('Elige fecha y hora'); ensureTie(j).deadline=v; saveState('Plazo guardado'); }
  else if(a==='dl-reset'){ const t=ensureTie(+el.dataset.j); delete t.deadline; saveState('Plazo por defecto'); }
  else if(a==='conv-save'){ const j=+el.dataset.j, t=ensureTie(j);
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
    S.fixtures.push({j:n,date:d.toISOString().slice(0,10),time:last?.time||'15:00',home:POLO,away:others[0]?.id||POLO,hs:null,as:null}); ui.calJ=n; saveState('Jornada '+n+' añadida'); }
  else if(a==='fix-add'){ const j=+el.dataset.j, ref=S.fixtures.find(f=>f.j===j); S.fixtures.push({j,date:ref?.date||new Date().toISOString().slice(0,10),time:ref?.time||'15:00',home:S.teams[0].id,away:S.teams[1]?.id||S.teams[0].id,hs:null,as:null}); saveState('Enfrentamiento añadido'); }
  else if(a==='fix-del'){ const k=+el.dataset.k, f=S.fixtures[k]; if(!f||!confirm('¿Quitar '+team(f.home).short+' contra '+team(f.away).short+'?')) return; S.fixtures.splice(k,1); saveState('Enfrentamiento quitado'); }
  else if(a==='jdate'){ const v=$('#jdate').value; if(!v) return toast('Elige la fecha'); S.fixtures.filter(f=>f.j===+el.dataset.j).forEach(f=>f.date=v); saveState('Fecha de la jornada cambiada'); }
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
  else if(a==='install'){ if(!installEvt) return; installEvt.prompt(); const c=await installEvt.userChoice.catch(()=>null); installEvt=null; renderQuiet(); if(c?.outcome==='accepted') toast('Instalando…'); }
  else if(a==='push-on') enablePush();
  else if(a==='push-test'){ try{ const reg=await navigator.serviceWorker.ready; reg.showNotification('Polo A',{body:'Así te llegarán los avisos del equipo 🎾',icon:'/icons/icon-192.png',badge:'/icons/badge-96.png'}); }catch(e){ toast('No se ha podido mostrar la prueba'); } }
  else if(a==='phone-save'){ const v=$('#my-phone').value.trim(); phones[me]=v; await safe(()=> v? B.set('phones/'+me,{phone:v,at:Date.now()}) : B.del('phones/'+me),'Teléfono guardado'); }
  else if(a==='tf-save'){ const o={}; document.querySelectorAll('[data-tf]').forEach(x=>{ const v=x.value.trim(); if(v) o[x.dataset.tf]=v; }); o.at=Date.now(); profiles[me]=o; await safe(()=>B.set('profiles/'+me,o),'Ficha guardada'); renderQuiet(); }
  else if(a==='notify'){ notify(el.dataset.type,+el.dataset.j); }
  else if(a==='demo-reset'){ if(confirm('¿Borrar todos los datos de la vista previa?')){ await B.reset(); location.reload(); } }
});
document.addEventListener('change', e=>{ const el=e.target, a=el.dataset?.act;
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
  if(el.hasAttribute?.('data-fe-phone') && ui.fe && me){ ui.fe.phone=el.value; clearTimeout(ui.fe.ft); feStatus('Guardando…','saving'); ui.fe.ft=setTimeout(async()=>{ const v=ui.fe.phone.trim(); phones[me]=v; try{ await trackWrite(v? B.set('phones/'+me,{phone:v,at:Date.now()}) : B.del('phones/'+me)); feStatus('Guardado ✓','ok'); }catch(err){ feStatus('No se ha guardado','ko'); } },900); } if(el.dataset?.act==='ans-text'&&ui.survey) ui.survey.a[el.dataset.q]=el.value; if(el.dataset?.act==='av-text'&&ui.avDraft) ui.avDraft.c=el.value; if(el.id==='compose-text'&&ui.compose) ui.compose.text=el.value; });
document.addEventListener('dragover', e=>{ const z=e.target.closest?.('#dropzone'); if(z){ e.preventDefault(); z.classList.add('over'); } });
document.addEventListener('dragleave', e=>{ const z=e.target.closest?.('#dropzone'); if(z) z.classList.remove('over'); });
document.addEventListener('drop', e=>{ const z=e.target.closest?.('#dropzone'); if(z){ e.preventDefault(); z.classList.remove('over'); const fs=[...(e.dataTransfer?.files||[])]; if(fs.length) uploadDocs(fs); } });
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeSheet(); stageClose(); closePosterModal(); closeCropper(); } });
function readQuestions(){ document.querySelectorAll('#qlist .qedit').forEach(row=>{ const q=S.survey.questions[+row.dataset.i]; if(!q) return; q.text=row.querySelector('[name=text]').value.trim(); q.scope=row.querySelector('[name=scope]').value; q.type=row.querySelector('[name=type]').value; if(q.scope==='peer') q.type='player'; }); S.survey.questions=S.survey.questions.filter(q=>q.text); }

/* ===================== ARRANQUE ===================== */
function unsubAll(){ subs.forEach(u=>{ try{u()}catch(e){} }); subs=[]; if(mineSub){ try{mineSub()}catch(e){} mineSub=null; } }
function watchMine(){ if(mineSub){ try{mineSub()}catch(e){} mineSub=null; } if(me) mineSub=B.watchDoc(SEASON_PATH+'/ballots/'+me, d=>{ myBallot=d; softRender(); }); else myBallot=me? ballots[me]||null : null; }
if(B.mode==='demo'){ const d=document.createElement('div'); d.className='demo'; d.textContent='Vista previa: datos solo en este navegador'; document.body.appendChild(d); }
let dataSubs=[];
let privSubs=[];
let privKey='';
function subscribePriv(){ const key=(canManage?1:0)+'|'+(canPrivate?1:0)+'|'+SEASON_PATH; if(key===privKey && privSubs.length) return; privKey=key;
  privSubs.forEach(u=>{ try{u()}catch(e){} }); privSubs=[];
  if(!canManage) return;
  privSubs.push(B.watchColl('phones', m=>{ phones=Object.fromEntries(Object.entries(m).map(([k,v])=>[k,v.phone])); softRender(); }));
  if(!canPrivate) return;
  privSubs.push(B.watchColl(SEASON_PATH+'/ballots', m=>{ ballots=m; softRender(); }));
  privSubs.push(B.watchColl(SEASON_PATH+'/availNotes', m=>{ notes=m; softRender(); }));
}
function subscribeData(){ // se rehace al identificarse o al cambiar de temporada
  dataSubs.forEach(u=>{ try{u()}catch(e){} }); dataSubs=[];
  if(!me && !isAdmin && !isManager) return;
  dataSubs.push(B.watchDoc('meta/app', d=>{ meta=d; checkManager(d); if(!ui.seasonPicked && d?.current && d.current!==viewSeason){ switchSeason(d.current,true); return; } softRender(); }));
  dataSubs.push(B.watchColl('photos', m=>{ photos=m; softRender(); }));
  dataSubs.push(B.watchColl('profiles', m=>{ profiles=m; profilesLoaded=true; softRender(); }));
  dataSubs.push(B.watchDoc(SEASON_PATH, d=>{ ui.sLoaded=SEASON_PATH; serverS= d? normalize(clone(d)) : null; S=d? normalize(clone(d)) : (teamId!=='polo-a'? emptyTeamSeed(teamId) : viewSeason===SEASON_ID? seed() : normalize({seasonId:viewSeason,fixtures:[],ties:{},published:{},official:{asOf:0,order:[]}}));
    updRoles(); subscribePriv(); syncMvpSubs(); softRender(); }));
  dataSubs.push(B.watchColl(SEASON_PATH+'/avail', m=>{ avail=m; softRender(); }));
  if(me){ dataSubs.push(B.watchDoc(SEASON_PATH+'/availNotes/'+me, d=>{ if(!canPrivate){ notes={[me]:d||{}}; softRender(); } }));
    dataSubs.push(B.watchDoc('phones/'+me, d=>{ if(d?.phone) phones[me]=d.phone; softRender(); })); }
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
function emptyTeamSeed(tid){ const t=clubTeams().find(x=>x.id===tid)||{short:'Polo',cat:''};
  return normalize({seasonId:viewSeason, teamId:tid, comp:{name:'Lliga Catalana per Equips', group:teamCat(t), memorial:''}, teams:[{id:POLO,name:'RC de Polo '+String(t.short||'').replace(/^Polo\s*/,''),short:t.short||'Polo',abbr:'RCP'}],
    players:[], fixtures:[], ties:{}, published:{}, official:{asOf:0,order:[]}, captains:[], mvp:{}}); }
function switchTeam(tid){ ui.teamAuto=true; if(tid===teamId) return; teamId=tid; try{ localStorage.setItem('polo-team',tid); }catch(e){} S=emptyTeamSeed(tid); serverS=null; ui.fe=null; switchSeason(viewSeason, !ui.seasonPicked); }
function switchSeason(id,auto){ privKey=''; docsKey=''; ui.rev=null; if(!auto) ui.seasonPicked=true; viewSeason=id; SEASON_PATH='seasons/'+docIdFor(teamId,id); avail={}; picks={}; ballots={}; notes={}; myBallot=null; privSubs.forEach(u=>{ try{u()}catch(e){} }); privSubs=[]; ui.adminJ=null; ui.calJ=null; subscribeData(); watchMine(); render(); }
B.onAuth(async u=>{
  unsubAll(); dataSubs.forEach(x=>{ try{x()}catch(e){} }); dataSubs=[];
  authUser=u; me=null; isAdmin=false; adminSkip=false; claims={}; avail={}; picks={}; ballots={}; myBallot=null; S=seed();
  if(!u){ authReady=true; render(); return; }
  isAdmin=await B.isAdmin(u.email,u.uid);
  try{ const m0=await B.getDoc('meta/app'); if(m0){ meta=m0; } checkManager(m0); }catch(e){}
  try{ await B.relink(); }catch(e){}
  subs.push(B.watchColl('claims', m=>{ claims=m; softRender(); }));
  subs.push(B.watchDoc('public/roster', d=>{ roster=d; softRender(); }));
  let first=true;
  subs.push(B.watchDoc('users/'+u.uid, d=>{ const nm=d?.pid||null;
    if(nm!==me || first){ first=false; me=nm; subscribeData(); watchMine(); authReady=true; render(); } else softRender(); }));
});
lastRoute=route(); render(); playIntro();
