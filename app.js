'use strict';
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
const DEFAULT_CLUB_TEAMS=[{id:'polo-a',name:'Absoluto Masculino A',short:'Polo A',cat:'Absoluto masculino'},{id:'polo-b',name:'Absoluto Masculino B',short:'Polo B',cat:'Absoluto masculino'}];
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
  const persist=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(mem)); }catch(e){} };
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
function updRoles(){ isCaptain=!!(me && (S.captains||[]).includes(me)); canPrivate=isAdmin||isCaptain; canManage=canPrivate || (teamMode() && !!me); return canManage; }
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

function standings(uptoJ){
  const rows=S.teams.map(t=>({id:t.id,pj:0,g:0,p:0,pts:0,rw:0,rl:0,form:[]})); const R=Object.fromEntries(rows.map(r=>[r.id,r]));
  S.fixtures.filter(f=>isPlayed(f)&&(uptoJ==null||f.j<=uptoJ)).sort((a,b)=>a.j-b.j).forEach(f=>{ const h=R[f.home],a=R[f.away]; if(!h||!a) return;
    h.pj++; a.pj++; h.rw+=f.hs; h.rl+=f.as; a.rw+=f.as; a.rl+=f.hs;
    if(f.hs>f.as){ h.g++; a.p++; h.pts+=S.rules.win; a.pts+=S.rules.loss; h.form.push('W'); a.form.push('L'); }
    else if(f.as>f.hs){ a.g++; h.p++; a.pts+=S.rules.win; h.pts+=S.rules.loss; a.form.push('W'); h.form.push('L'); } });
  const lastJ = uptoJ ?? Math.max(0,...S.fixtures.filter(isPlayed).map(f=>f.j));
  const off = S.official && S.official.asOf===lastJ && Array.isArray(S.official.order)? S.official.order : null;
  const oi = id => { const i=off? off.indexOf(id) : -1; return i<0? 99 : i; };
  rows.sort((x,y)=> off? (oi(x.id)-oi(y.id)||y.pts-x.pts) : (y.pts-x.pts||(y.rw-y.rl)-(x.rw-x.rl)||y.rw-x.rw||team(x.id).short.localeCompare(team(y.id).short)));
  rows.forEach((r,i)=>r.pos=i+1); return rows;
}
const playedJornadas = () => [...new Set(S.fixtures.filter(isPlayed).map(f=>f.j))].sort((a,b)=>a-b);
function nextPoloFix(){ const now=Date.now(); return S.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&!isPlayed(f)&&kickoff(f).getTime()>now-8*3600e3).sort((a,b)=>a.j-b.j)[0]||null; }
function lastPoloPlayed(){ return S.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&isPlayed(f)).sort((a,b)=>b.j-a.j)[0]||null; }
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
  ${rows.map(r=>`<tr class="${r.id===POLO?'us':''}"><td><span class="pos">${r.pos}</span>${esc(compact? team(r.id).short : team(r.id).name)}</td><td>${r.pj}</td>${compact?'':`<td>${r.g}</td><td>${r.p}</td><td>${r.rw}-${r.rl}</td><td class="l">${formStrip(r.form,4)}</td>`}<td><b>${r.pts}</b></td></tr>`).join('')}</tbody></table></div>`;
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
function vInicio(){
  const nx=nextPoloFix(), last=lastPoloPlayed(), st=standings(), mine=st.find(r=>r.id===POLO), ts=teamStats();
  const photo = `${courtSVG()}<span class="ball" aria-hidden="true"></span>${photos._team?.d?`<div class="hero-media"><img src="${esc(photos._team.d)}" alt="Equipo masculino absoluto del Real Club de Polo"></div>`:''}`;
  let h=`<section class="hero">${photo}<div class="wrap hero-in">
    <p class="hero-comp">${esc(S.comp.name)}, ${esc(S.comp.group)}</p>
    <h1 class="hero-title" aria-label="${esc(teamLabel())}">${titleLetters(teamLabel())}</h1>
    <p class="hero-sub">Real Club de Polo de Barcelona, temporada ${esc(S.seasonId||viewSeason)}</p>
    ${nx? scoreboard(nx) : ''}</div></section><div class="wrap">`;
  h+=callouts(nx);
  h+=`<section class="sec"><div class="figs stagger">
    <div class="fig"><b>${mine.pj? count(mine.pos,'º'):'–'}</b><span>en la clasificación</span></div>
    <div class="fig"><b>${count(mine.pts)}</b><span>puntos</span></div>
    <div class="fig"><b>${ts.tw}-${ts.tl}</b><span>eliminatorias</span></div>
    <div class="fig"><b>${ts.rw}-${ts.rl}</b><span>partidos individuales</span></div></div></section>`;
  if(nx){ const p=persp(nx);
    h+=`<section class="sec"><div class="sec-h"><h2>Jornada ${nx.j}</h2><a href="#jornada-${nx.j}">Abrir</a></div>
      <p class="lede">Polo contra ${esc(clubName(p.rival))}, ${esc(fdate(nx,{weekday:'long',day:'numeric',month:'long'}))} a las ${esc(nx.time)} h. ${p.home?'Jugamos en casa.':'Jugamos fuera.'}</p>
      <div style="margin-top:16px">${posters(nx.j) || availBlock(nx)}</div></section>`; }
  h+=leadersBlock();
  if(last){ const c=cronica(last.j);
    h+=`<section class="sec"><div class="sec-h"><h2>Última jornada</h2><a href="#jornada-${last.j}">Ver jornada ${last.j}</a></div>
    <div class="split"><div>${scoreboard(last,true)}</div><div><p class="cronica" style="margin-top:0">${esc(c.txt)}${c.partial?'<small>Faltan los resultados individuales; la crónica se completará cuando se carguen.</small>':''}</p>${mvpCard(last.j)}</div></div></section>`; }
  h+=`<section class="sec"><div class="split"><div><div class="sec-h"><h2>Clasificación</h2><a href="#liga">Liga completa</a></div>${standingsTable(st,true)}<p class="source">${standingsSource()}</p></div>
    <div><div class="sec-h"><h2>Momentos</h2></div>${momentsList()}</div></div></section>${Object.values(S.published).some(p=>p.mvp)? `<section class="sec">${mvpRanking(true)}</section>`:''}</div>`;
  return h;
}
function leadersBlock(){
  const rows=S.players.filter(p=>p.active!==false).map(p=>({p,st:playerStats(p.id)})).filter(x=>x.st.pj).sort((a,b)=>wilson(b.st.w,b.st.pj)-wilson(a.st.w,a.st.pj)||b.st.w-a.st.w).slice(0,5);
  if(!rows.length) return '';
  return `<section class="sec"><div class="sec-h"><h2>Líderes en individuales</h2><a href="#stats" data-act="stats-go" data-v="jugadores">Todas las estadísticas</a></div><div class="leaders stagger">${rows.map((x,i)=>`<button class="leader press" data-player="${esc(x.p.id)}"><span class="lp">${i+1}</span>${avatar(x.p)}<span class="ln">${esc(x.p.name)}<small>${x.st.pj} ${x.st.pj===1?'individual':'individuales'}</small></span><span class="lw">${pct(x.st.w,x.st.pj)}%<small>${x.st.w}-${x.st.l}</small></span></button>`).join('')}</div>
    <p class="source">Solo individuales. El orden tiene en cuenta el número de partidos jugados.</p></section>`;
}
function standingsSource(){ return S.official && S.official.asOf===Math.max(0,...playedJornadas())? `Orden oficial FCT tras la jornada ${S.official.asOf}. Victoria ${S.rules.win} puntos, derrota ${S.rules.loss}.` : `Calculada con los resultados introducidos. Victoria ${S.rules.win} puntos, derrota ${S.rules.loss}.`; }
function callouts(nx){
  let h=''; const ps=pendingSurveys();
  pendingMvp().forEach(j=>{ h+=`<div class="callout"><div><b>🏆 Vota al MVP de la jornada ${j}</b><span>Un voto por jugador. Abierta hasta el ${esc(fmtDT(new Date(mvpState(j).deadline)))}.</span></div><div class="row"><a class="btn light" href="#mvp-${j}">Votar</a></div></div>`; });
  ps.forEach(j=>{ h+=`<div class="callout"><div><b>Encuesta de la jornada ${j}</b><span>Jugaste contra ${esc(clubName(persp(poloFix(j)).rival))}. Tardas dos minutos.</span></div><div class="row"><a class="btn light" href="#encuesta-${j}">Responder</a></div></div>`; });
  S.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&availOpen(f)).forEach(f=>{ if(!me || avOf(me,f.j)) return; const p=persp(f);
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

function vLiga(){
  const st=standings(), evo=playedJornadas().map(j=>({j,v:standings(j).find(r=>r.id===POLO).pos})), nx=nextPoloFix();
  let h=`<div class="wrap"><div class="pagehead"><h1>La liga</h1><p class="lede">${esc(S.comp.name)}, ${esc(S.comp.memorial)}. ${esc(S.comp.group)}. Siete clubes, catorce jornadas a doble vuelta; cada jornada descansa uno.</p></div>
  <section class="sec"><div class="sec-h"><h2>Clasificación</h2></div>${standingsTable(st)}<p class="source">${standingsSource()}</p></section>
  <section class="sec"><div class="sec-h"><h2>Evolución del Polo</h2></div>${evo.length? lineChart(evo,{invert:true,min:1,max:S.teams.length,unit:'º'}) : '<div class="empty">Sin jornadas disputadas.</div>'}</section>
  <section class="sec"><div class="sec-h"><h2>Calendario</h2><div class="chips"><button class="chip" data-act="liga-filter" data-v="0" aria-pressed="${!ui.ligaAll}">Solo el Polo</button><button class="chip" data-act="liga-filter" data-v="1" aria-pressed="${ui.ligaAll}">Todo</button></div></div><ul class="jlist stagger">`;
  for(let j=1;j<=NJ();j++){ const fs=S.fixtures.filter(f=>f.j===j), pf=fs.find(f=>f.home===POLO||f.away===POLO), d=fs[0];
    if(!ui.ligaAll){ if(pf){ const p=persp(pf);
        h+=`<li><a class="jrow ${nx&&nx.j===j?'next':''}" href="#jornada-${j}"><span class="jn">${j}<small>${esc(fdate(d))}</small></span><span><span class="vs">${p.home?'Polo contra '+esc(clubName(p.rival)):esc(clubName(p.rival))+' contra Polo'}</span><div class="meta">${p.home?'En casa':'Fuera'}, ${esc(d.time)} h</div></span><span class="score">${p.played?`${resBadge(p.ps>p.rs?'W':'L')} ${pf.hs}-${pf.as}`:'<span class="muted small">Pendiente</span>'}</span></a></li>`;
      } else h+=`<li><a class="jrow rest" href="#jornada-${j}"><span class="jn">${j}<small>${esc(fdate(d))}</small></span><span class="vs">Descansa el Polo</span><span></span></a></li>`;
    } else h+=`<li style="padding:12px 0;border-bottom:1px solid var(--line)"><a href="#jornada-${j}" style="text-decoration:none;display:flex;justify-content:space-between"><b>Jornada ${j}</b><span class="muted small">${esc(fdate(d,{weekday:'long',day:'numeric',month:'long'}))}</span></a>
      <table style="margin-top:4px"><tbody>${fs.map(f=>`<tr class="${f===pf?'us':''}"><td>${esc(team(f.home).name)} <span class="muted">contra</span> ${esc(team(f.away).name)}</td><td>${isPlayed(f)?`<b>${f.hs}-${f.as}</b>`:'<span class="muted">Pendiente</span>'}</td></tr>`).join('')}${pf?'':'<tr><td class="muted">Descansa: Polo</td><td></td></tr>'}</tbody></table></li>`; }
  return h+`</ul><p class="source">Fuente: calendario oficial FCT. Todos los partidos a las 15:00 en las pistas del club local.</p></section></div>`;
}

function vJornada(j){
  if(!(j>=1&&j<=NJ())) return vNotFound();
  const fs=S.fixtures.filter(f=>f.j===j), pf=fs.find(f=>f.home===POLO||f.away===POLO);
  let h=`<div class="wrap"><div class="pagehead"><div class="row" style="justify-content:space-between"><a class="textlink" href="#liga">Calendario</a><span class="row">${j>1?`<a class="chip" href="#jornada-${j-1}">J${j-1}</a>`:''}${j<NJ()?`<a class="chip" href="#jornada-${j+1}">J${j+1}</a>`:''}</span></div>
    <h1 style="margin-top:14px">Jornada ${j}</h1><p class="lede">${esc(fdate(fs[0],{weekday:'long',day:'numeric',month:'long',year:'numeric'}))}, ${esc(fs[0].time)} h</p></div>`;
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
    {k:'weak',l:'Talón de Aquiles',t:'chips',o:[...SHOTS,'Segundo saque','Bolas altas','Los nervios'],i:'🎯'}]},
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
    {k:'quote',l:'Frase que te define',t:'text',o:[],i:'💬',ph:'En una línea'}]}];
const FICHA_FIELDS=FICHA.flatMap(s=>s.fields);
const TENNIS_FIELDS=FICHA_FIELDS.map(f=>[f.k,f.l,f.t==='chips'?'select':f.t,f.o]);
function fichaPct(pid, pr){ pr=pr||profiles[pid]||{}; const n=FICHA_FIELDS.filter(f=>String(pr[f.k]||'').trim()).length+(photos[pid]?1:0); return Math.round(n*100/(FICHA_FIELDS.length+1)); }
function fichaDisplay(pid, own){
  const pr=profiles[pid]||{}, has=f=>String(pr[f.k]||'').trim();
  if(!FICHA_FIELDS.some(has)) return own? `<section class="sec"><a class="fcta" href="#mi-ficha"><span class="fci">✍️</span><span><b>Completa tu ficha de jugador</b><small>Golpe favorito, jugador favorito, grito de guerra, ritual… Sale aquí, en tu carta y en la plantilla.</small></span><span class="btn sm brass">Empezar</span></a></section>` : '';
  const tiles=FICHA_FIELDS.filter(f=>has(f) && !['motto','quote','nick'].includes(f.k));
  return `<section class="sec"><div class="sec-h"><h2>El jugador</h2>${own?'<a href="#mi-ficha">Editar mi ficha</a>':''}</div>
    ${has({k:'motto'})? `<div class="warcry"><span class="wl">📣 Grito de guerra</span><span class="wt">${esc(pr.motto)}</span></div>` : ''}
    ${tiles.length? `<div class="ftiles stagger">${tiles.map(f=>`<div class="ftile ${f.k==='idol'?'wide':''}"><span class="fi">${f.i}</span><span class="fl">${f.l}</span><b>${esc(pr[f.k])}</b></div>`).join('')}</div>` : ''}
    ${has({k:'quote'})? `<p class="fquote">«${esc(pr.quote)}»</p>` : ''}</section>`;
}
function fePreviewHTML(){
  const pr=ui.fe.draft, pct=fichaPct(me,pr);
  return `${playerCard(me)}
    <div class="fe-prog"><div class="row" style="justify-content:space-between"><b>Ficha completada</b><b id="fe-pct">${pct}%</b></div><span class="fbar"><i style="width:${pct}%"></i></span>
      <small>${pct>=100? '¡Ficha completa! 🎾' : pct>=60? 'Ya casi. Te faltan '+(FICHA_FIELDS.length+1-Math.round(pct*(FICHA_FIELDS.length+1)/100))+' datos.' : 'Cuanto más rellenes, mejor luce tu perfil.'}</small></div>
    ${pr.motto? `<div class="warcry sm"><span class="wl">📣 Grito de guerra</span><span class="wt">${esc(pr.motto)}</span></div>` : ''}`;
}
function feRefresh(){ const box=$('#fe-preview'); if(!box||!ui.fe) return; const saved=profiles[me]; profiles[me]=ui.fe.draft; box.innerHTML=fePreviewHTML(); profiles[me]=saved; afterRender(box); }
function feStatus(t,cls=''){ const el=$('#fe-status'); if(el){ el.textContent=t; el.className='fe-status '+cls; } }
function feQueue(){ if(!ui.fe) return; ui.fe.dirty=true; ui.fe.touched=true; feStatus('Guardando…','saving'); clearTimeout(ui.fe.t); ui.fe.t=setTimeout(feFlush,900); }
async function feFlush(){ if(!ui.fe||!me||!ui.fe.dirty) return; clearTimeout(ui.fe.t); const o={}; Object.entries(ui.fe.draft).forEach(([k,v])=>{ if(k!=='at' && v!=null && String(v).trim()!=='') o[k]=String(v).trim(); }); o.at=Date.now();
  ui.fe.dirty=false; try{ await trackWrite(B.set('profiles/'+me,o)); profiles[me]=o; feStatus('Guardado ✓','ok'); if(fichaPct(me,o)>=100 && !ui.fe.celebrated){ ui.fe.celebrated=true; confetti(innerWidth/2,innerHeight/3,110); } }catch(e){ ui.fe.dirty=true; feStatus('No se ha guardado. Toca el aviso rojo para ver el motivo','ko'); } }
function vMiFicha(){
  if(!me) return `<div class="wrap"><div class="pagehead"><h1>Mi ficha</h1></div><div class="notice">Primero elige tu nombre de la lista en la pestaña Yo.</div></div>`;
  if(!ui.fe || ui.fe.pid!==me || (!ui.fe.touched && JSON.stringify(ui.fe.base)!==JSON.stringify(profiles[me]||{})))
    ui.fe={pid:me, base:clone(profiles[me]||{}), draft:{...(profiles[me]||{})}, phone:phones[me]||'', dirty:false, touched:false};
  const p=player(me), d=ui.fe.draft, ph=photos[me]?.d;
  const field=f=>{ const v=d[f.k]||'';
    if(f.t==='chips') return `<div class="fe-f"><label class="fe-l"><span>${f.i}</span>${f.l}</label><div class="fe-chips" data-group="${f.k}">${f.o.map(o=>`<button type="button" class="fchip press" data-act="fe-chip" data-k="${f.k}" data-v="${esc(o)}" aria-pressed="${v===o}">${esc(o)}</button>`).join('')}</div></div>`;
    return `<div class="fe-f"><label class="fe-l" for="fe-${f.k}"><span>${f.i}</span>${f.l}</label><input id="fe-${f.k}" data-fe="${f.k}" type="${f.t==='year'?'number':'text'}" ${f.t==='year'?'min="1950" max="2026" inputmode="numeric"':'maxlength="80"'} value="${esc(v)}" placeholder="${esc(f.ph||'')}" ${f.o?.length?`list="dl-${f.k}"`:''}>
      ${f.o?.length? `<datalist id="dl-${f.k}">${f.o.map(o=>`<option value="${esc(o)}">`).join('')}</datalist><div class="sugs">${f.o.slice(0,6).map(o=>`<button type="button" class="sug" data-act="fe-sug" data-k="${f.k}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>` : ''}</div>`; };
  return `<div class="wrap fe"><div class="pagehead"><a class="textlink" href="#yo">← Yo</a><h1 style="margin-top:10px">Mi ficha</h1><p class="lede">Lo que rellenes sale en tu perfil, en tu carta de jugador y en la plantilla. Todo es opcional y se guarda solo.</p></div>
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
  const p=player(me), pr=profiles[me]||{}, tasks=[];
  S.fixtures.filter(f=>(f.home===POLO||f.away===POLO)&&availOpen(f)).forEach(f=>{ const v=avOf(me,f.j); tasks.push(`<a class="task ${v?'done':''}" href="#disponibilidad-${f.j}"><span class="ti">${v?'✓':'?'}</span><span><b>Disponibilidad, jornada ${f.j}</b><small>${v? 'Has dicho: '+AV_LABEL[v.s]+'. Puedes cambiarla hasta el '+esc(fmtDT(deadline(f.j))) : 'Contra '+esc(clubName(persp(f).rival))+'. Responde antes del '+esc(fmtDT(deadline(f.j)))}</small></span></a>`); });
  pendingMvp().forEach(j=>tasks.push(`<a class="task hot" href="#mvp-${j}"><span class="ti">🏆</span><span><b>Vota al MVP, jornada ${j}</b><small>Un voto, hasta el ${esc(fmtDT(new Date(mvpState(j).deadline)))}.</small></span></a>`));
  pendingSurveys().forEach(j=>tasks.push(`<a class="task hot" href="#encuesta-${j}"><span class="ti">!</span><span><b>Encuesta de la jornada ${j}</b><small>Has jugado contra ${esc(clubName(persp(poloFix(j)).rival))}. 2 minutos.</small></span></a>`));
  const roles=[isCaptain?'Capitán':'',isAdmin?'Administrador':''].filter(Boolean);
  return `<div class="wrap"><div class="phead">${avatar(p,'lg')}<div><h1>${esc(p.name)}</h1><p>${roles.length? roles.join(' y ')+'. ':''}Entras como ${esc(authUser?.email||'')}.</p><div class="row" style="margin-top:8px"><a class="btn sm" href="#jugador-${esc(me)}">Ver mi perfil</a>${canManage?'<a class="btn sm brass" href="#admin">Panel de capitán</a>':''}<button class="btn sm ghost" data-act="signout">Salir</button></div></div></div>
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
    <h1 class="q" style="font-size:clamp(2.2rem,8vw,3.2rem);margin-top:10px">¿Quién eres?</h1><p class="muted">Elige tu nombre de la lista del equipo. Quedará ligado a este Gmail.</p>
    <div class="claimgrid stagger">${S.players.filter(p=>p.active!==false).sort((a,b)=>a.order-b.order).map(p=>`<button data-act="claim" data-id="${esc(p.id)}" ${taken.has(p.id)?'disabled':''}>${avatar(p)}<span>${esc(p.name)}${taken.has(p.id)?'<br><span class="muted small" style="font-weight:400">ya elegido</span>':''}</span></button>`).join('')}</div>
    ${isAdmin?`<p style="margin-top:20px"><button class="textlink" data-act="skip">Soy administrador y no juego</button></p>`:''}
    <p class="source">¿Tu nombre aparece como elegido y no has sido tú? Avisa al capitán para que lo libere.</p></div>`;
}

/* ---------------- Administración ---------------- */
function vAdmin(){
  if(!canManage) return `<div class="wrap"><div class="pagehead"><h1>Gestión</h1></div><div class="notice">${me? 'La gestión está limitada a los capitanes marcados. Un administrador puede abrirla a todo el equipo en Temporadas y ajustes.' : 'Elige tu nombre en Yo para poder gestionar.'}</div></div>`;
  const tabs=[['jornada','Matchday'],['calendario','Liga y calendario'],['preguntas','Encuesta'],...(canManage?[['plantilla','Plantilla y fotos'],['temporadas','Temporadas y ajustes']]:[])];
  if(!tabs.some(x=>x[0]===ui.adminTab)) ui.adminTab='jornada'; const t=ui.adminTab;
  return `<div class="wrap"><div class="pagehead"><h1>Gestión</h1><p class="lede">Todo se edita aquí y se actualiza solo en el resto de la app.${viewSeason!==currentSeason()?` <b>Estás editando la temporada ${esc(viewSeason)}.</b>`:''}</p></div>
    <div class="atabs">${tabs.map(([k,l])=>`<button class="chip" data-act="admin-tab" data-v="${k}" aria-pressed="${t===k}">${l}</button>`).join('')}</div>
    ${t==='jornada'?aJornada():t==='plantilla'?aPlantilla():t==='calendario'?aCalendario():t==='preguntas'?aPreguntas():aTemporadas()}</div>`;
}
function jSelect(act,cur,onlyPolo=true){ return `<select data-act="${act}" style="max-width:360px">${Array.from({length:NJ()},(_,i)=>i+1).filter(j=>!onlyPolo||poloFix(j)).map(j=>{ const f=poloFix(j); return `<option value="${j}" ${cur===j?'selected':''}>Jornada ${j}${f?', '+(f.home===POLO?'Polo contra '+team(f.away).short:team(f.home).short+' contra Polo')+', '+fdate(f):''}</option>`; }).join('')}</select>`; }
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
    case 4: return {t: isPlayed(f)&&!tieFromRubbers(j)?.decided? 'Faltan los partidos' : 'Introduce los resultados', d:'Al guardarlos se recalcula todo y se abren la encuesta y la votación del MVP.', b:`<button class="btn brass" data-act="jtab" data-v="res">Introducir resultados</button>`};
    default: return {t: mvpOpen(j)? 'Votación del MVP en marcha' : 'Publica el MVP', d: mvpOpen(j)? `Han votado ${mvpVoteCount(jid(j))}. Plazo: ${fmtDT(new Date(mvpState(j).deadline))}.` : 'Revisa el recuento y publica al ganador.', b:`<button class="btn brass" data-act="jtab" data-v="post">Ver el MVP</button>`};
  }
}
function aJornada(){
  const j=adminJ(); if(!j) return `<div class="empty">No hay eliminatorias del Polo en el calendario. Añádelas en «Liga y calendario».</div>`;
  const f=poloFix(j), p=persp(f), t=tie(j)||blankTie(), a=availFor(j), ph=phases(j), na=nextAction(j), tr=tieFromRubbers(j)||{}, agg=aggregate(jid(j)), parts=participants(j);
  if(!ui.jTabSet || ui.jTabFor!==j){ ui.jTabFor=j; ui.jTabSet=true; const c=ph.find(x=>x.st!=='done'); ui.jTab = c? c.k : 'post'; }
  const stIcon={done:'✓',doing:'•',todo:''}, stTxt={done:'Completada',doing:'En curso',todo:'Pendiente'};
  const pendRes=t.rubbers.filter((r,i)=> (r.type==='S' || tr.needsDoubles) && !rubberCalc(r).res).length;
  const tabs=[['prep','1. Preparación'],['disp','2. Disponibilidad'],['conv','3. Convocatoria'],['res','4. Resultados'],['post','5. Postpartido']];
  return `<section class="sec" style="padding-top:6px">
    <div class="mdhead"><div>${jSelect('admin-j',j)}<p class="mdtitle">${crest(p.rival)}<span>Polo contra ${esc(clubName(p.rival))}</span></p><p class="muted small" style="margin:0">${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h, ${p.home?'en casa':'fuera'}. ${isPlayed(f)? 'Resultado: Polo '+p.ps+'-'+p.rs+(f.status==='official'?' (oficial)':' (provisional)') : countdown(f)}</p></div></div>
    <div class="mdkpis stagger"><div><b>${a.yes.length}</b><span>disponibles</span></div><div class="${a.none.length?'warn':''}"><b>${a.none.length}</b><span>sin responder</span></div><div><b>${(t.convocados||[]).length}</b><span>convocados</span></div><div class="${pendRes&&(t.lineupPub||isPlayed(f))?'warn':''}"><b>${pendRes}</b><span>partidos sin resultado</span></div><div><b>${isPlayed(f)? agg.n+'/'+parts.length : '–'}</b><span>encuestas</span></div><div><b>${mvpState(j)? mvpVoteCount(jid(j)) : '–'}</b><span>votos MVP</span></div></div>
    <ol class="steps">${ph.map((x,i)=>`<li class="${x.st}"><button data-act="jtab" data-v="${x.k}"><span class="sn">${stIcon[x.st]||i+1}</span><span class="sl"><b>${x.l}</b><small>${stTxt[x.st]}. ${esc(x.d)}</small></span></button></li>`).join('')}</ol>
    <div class="nextcard"><div><span class="nk">Siguiente paso</span><b>${esc(na.t)}</b><p>${esc(na.d)}</p></div><div class="row">${na.b}</div></div>
    <div class="mdtabs">${tabs.map(([k,l])=>`<button class="chip" data-act="jtab" data-v="${k}" aria-pressed="${ui.jTab===k}">${l}</button>`).join('')}</div></section>
    ${ui.jTab==='prep'?aPrep(j):ui.jTab==='disp'?aDisp(j):ui.jTab==='conv'?aConv(j)+(t.lineupPub||lineupList(j).length? `<div class="sec-h" style="margin-top:30px"><h2>Cartel de la convocatoria</h2></div>`+aCartel(j):''):ui.jTab==='res'?aResultados(j):aPost(j)}`;
}
function aPrep(j){
  const f=poloFix(j), p=persp(f), t=tie(j)||blankTie(), topts=sel=>S.teams.filter(x=>x.id!==POLO).map(x=>`<option value="${x.id}" ${sel===x.id?'selected':''}>${esc(x.name)}</option>`).join('');
  return `<section class="sec"><div class="split"><div><div class="sec-h"><h2>Datos de la eliminatoria</h2></div>
    <div class="tfields"><label>Fecha<input type="date" id="pp-date" value="${f.date}"></label><label>Hora<input type="time" id="pp-time" value="${f.time}"></label>
      <label>Rival<select id="pp-rival">${topts(p.rival)}</select></label><label>Dónde<select id="pp-home"><option value="1" ${p.home?'selected':''}>En casa</option><option value="0" ${!p.home?'selected':''}>Fuera</option></select></label></div>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="prep-save" data-j="${j}">Guardar cambios</button>${t.calOk? '<span class="okmark">✓ Calendario confirmado</span>' : `<button class="btn brass" data-act="cal-ok" data-j="${j}">Confirmar calendario</button>`}</div>
    <p class="muted small">Al cambiar fecha u hora se actualizan solos el calendario, la portada, la página de la jornada, el plazo de disponibilidad y los mensajes. El resto de enfrentamientos de la liga se editan en «Liga y calendario».</p></div>
    <div><div class="sec-h"><h2>Orden de juego</h2></div>${lineupList(j).length? lineupStrip(j) : '<div class="empty">Aún sin convocatoria.</div>'}
      <div class="row" style="margin-top:12px"><a class="btn ghost sm" href="#jornada-${j}">Ver la página de la jornada</a></div></div></div></section>`;
}
function aPost(j){
  const f=poloFix(j); if(!isPlayed(f)) return `<section class="sec"><div class="empty">El postpartido se activa al guardar los resultados: se abren la encuesta para los que jugaron y la votación del MVP.</div></section>`;
  const c=cronica(j);
  return `<section class="sec"><div class="sec-h"><h2>Resumen de la jornada</h2></div><div class="panel"><p class="cronica" style="margin:0">${esc(c?.txt||'')}</p>
      <div class="row" style="margin-top:12px"><button class="btn ghost sm" data-act="compose" data-kind="summary" data-j="${j}">Compartir el resumen por WhatsApp</button><a class="btn ghost sm" href="#jornada-${j}">Ver la jornada</a></div>${composer('summary',j,'Resumen de la jornada')}
      <p class="source">Estadísticas individuales y de dobles, clasificación, rankings y perfiles ya están actualizados con estos resultados.</p></div></section>
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
  const f=poloFix(j), t=tie(j)||blankTie(), p=persp(f), conv=new Set(t.convocados||[]);
  const order=[...S.players.filter(x=>conv.has(x.id)), ...S.players.filter(x=>!conv.has(x.id)&&x.active!==false)].map(x=>x.id);
  const popts=sel=>`<option value="">Elegir</option>`+order.map(id=>`<option value="${esc(id)}" ${sel===id?'selected':''}>${esc(pname(id))}</option>`).join('');
  const v=validateTie(t), tr=tieFromRubbers(j)||{}, fx=poloFix(j);
  const status = isPlayed(fx)? (fx.status==='official'? '<span class="badge ok">Oficial</span>' : '<span class="badge prov">Provisional, pendiente de validar</span>') : '<span class="badge">Sin resultado</span>';
  return `<section class="sec"><div class="resbar"><div><span class="muted small">Eliminatoria</span><b>Polo ${tr.decided? tr.w+'-'+tr.l : (p.ps??'–')+'-'+(p.rs??'–')}</b></div><div>${status}</div></div>
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
function aCalendario(){
  const j=ui.calJ || currentJ() || 1, fs=S.fixtures.filter(f=>f.j===j), topts=sel=>S.teams.map(t=>`<option value="${t.id}" ${sel===t.id?'selected':''}>${esc(t.short)}</option>`).join('');
  const js=[...new Set(S.fixtures.map(f=>f.j))].sort((a,b)=>a-b);
  return `<section class="sec"><div class="sec-h"><h2>Competición</h2></div>
    <label class="f">Nombre</label><input type="text" id="c-name" value="${esc(S.comp.name)}"><label class="f">Grupo</label><input type="text" id="c-group" value="${esc(S.comp.group)}"><label class="f">Memorial o subtítulo</label><input type="text" id="c-mem" value="${esc(S.comp.memorial||'')}">
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-act="comp-save">Guardar competición</button></div></section>
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
const clubTeams = () => (Array.isArray(meta?.teams) && meta.teams.length? meta.teams : DEFAULT_CLUB_TEAMS);
const curTeam = () => clubTeams().find(t=>t.id===teamId) || clubTeams()[0];
const teamLabel = () => curTeam()?.short || 'Polo A';
function aTemporadas(){
  const list=meta?.seasons?.length? meta.seasons : [SEASON_ID];
  const vars='{rival} {fecha} {hora} {lugar} {limite} {enlace} {enlaceJornada} {jornada} {pendientes} {nombre} {lista} {resultado} {jugadores} {enlaceEncuesta} {enlaceMvp} {limiteMvp} {cronica} {partidos}';
  return `${isAdmin? `<section class="sec"><div class="sec-h"><h2>Quién gestiona</h2></div><div class="panel"><label class="row" style="gap:10px;flex-wrap:nowrap"><input type="checkbox" id="team-manage" ${teamMode()?'checked':''}> <span><b>Todo el equipo</b> puede gestionar jornadas, convocatorias, resultados, MVP, calendario, plantilla y fotos.<br><span class="muted small">Si lo desactivas, solo los capitanes marcados y los administradores. Las respuestas individuales de la encuesta y quién votó a quién siguen siendo privadas en ambos casos.</span></span></label><div class="row" style="margin-top:10px"><button class="btn sm" data-act="team-save">Guardar</button></div></div></section>` : ''}
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
    root.querySelectorAll('.ring .v').forEach(el=>el.style.strokeDashoffset=el.dataset.off);
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
async function notify(type,j){
  if(B.mode!=='firebase') return;
  try{ const tok=await B.idToken(); if(!tok) return;
    const r=await fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok},body:JSON.stringify({type,season:viewSeason,j,origin:location.origin})});
    if(r.status===501||r.status===404){ toast('Notificaciones aún no configuradas en Vercel: usa WhatsApp'); return; }
    const d=await r.json().catch(()=>({})); if(r.ok) toast(d.recipients? `Notificación enviada: ${d.reached} de ${d.recipients} la tienen activada` : 'No hay destinatarios'); else toast('No se ha podido notificar: '+(d.error||r.status));
  }catch(e){ console.warn('notify',e); }
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
let isManager=false, clubData={}, clubSubs=[], clubKey='';
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
function clubNav(cur){ const tabs=[['club','Dashboard'],['club-equipos','Equipos'],['club-resumen','Resumen del fin de semana'],...(isAdmin?[['club-ajustes','Configuración']]:[])];
  return `<div class="chips clubnav">${tabs.map(([k,l])=>`<a class="chip" href="#${k}" aria-pressed="${cur===k}">${l}</a>`).join('')}</div>`; }
function clubWeekRows(){
  const sat=ui.clubSat||ymd(weekendSat()), rg=weekendRange(sat), out=[], idle=[];
  clubTeams().forEach(t=>{ const d=clubData[t.id]; if(ui.clubTeam && ui.clubTeam!==t.id) return; if(ui.clubCat && t.cat!==ui.clubCat) return;
    if(!d){ idle.push({t, why: clubData.hasOwnProperty(t.id)? 'Sin calendario cargado' : 'Cargando…'}); return; }
    const fx=d.fixtures.filter(f=>(f.home===POLO||f.away===POLO) && f.date>=rg.from && f.date<=rg.to);
    if(!fx.length){ idle.push({t, why: d.fixtures.length? 'No juega este fin de semana' : 'Sin calendario cargado'}); return; }
    fx.forEach(f=>{ const s=tieState(d,f); if(ui.clubRes && ui.clubRes!==(s.confirm?'confirm':s.st)) return; out.push({t,d,f,s}); }); });
  return {rg, sat, rows:out, idle};
}
function vClub(){
  if(!canClub()) return `<div class="wrap"><div class="pagehead"><h1>Gestión deportiva</h1></div><div class="notice">Esta zona es para el gestor deportivo del club y los administradores.</div></div>`;
  ensureClubSubs(); const W=clubWeekRows(), rows=W.rows, all=clubTeams();
  const k={teams:all.length, played:rows.filter(r=>r.s.p.played).length, win:rows.filter(r=>r.s.st==='win').length, loss:rows.filter(r=>r.s.st==='loss').length,
    pending:rows.filter(r=>r.s.st==='pending').length, confirm:rows.filter(r=>r.s.confirm).length};
  const fmt=d=>d.toLocaleDateString('es-ES',{day:'numeric',month:'long'});
  const cats=[...new Set(all.map(t=>t.cat).filter(Boolean))];
  const next=all.map(t=>{ const d=clubData[t.id]; if(!d) return null; const f=d.fixtures.filter(x=>(x.home===POLO||x.away===POLO)&&!isPlayed(x)&&x.date>=ymd(new Date())).sort((a,b)=>a.date.localeCompare(b.date))[0]; return f? {t,d,f} : null; }).filter(Boolean);
  return `<div class="wrap club"><div class="pagehead"><p class="qsec">Real Club de Polo de Barcelona</p><h1>Gestión deportiva</h1><p class="lede">Todos los equipos del club en la Lliga Catalana, temporada ${esc(viewSeason)}.</p></div>
  ${clubNav('club')}
  <section class="sec"><div class="wknav"><button class="btn ghost sm" data-act="club-wk" data-d="-7" aria-label="Fin de semana anterior">‹</button><div><span class="muted small">Fin de semana</span><b>${fmt(W.rg.sat)} y ${fmt(W.rg.sun)}</b></div><button class="btn ghost sm" data-act="club-wk" data-d="7" aria-label="Fin de semana siguiente">›</button>
    <input type="date" data-act="club-date" value="${W.sat}" aria-label="Elegir fecha" style="max-width:170px"><button class="btn ghost sm" data-act="club-wk" data-d="0">Último</button></div>
    <div class="row" style="margin-top:10px"><select data-act="club-f" data-k="clubTeam" style="max-width:220px"><option value="">Todos los equipos</option>${all.map(t=>`<option value="${esc(t.id)}" ${ui.clubTeam===t.id?'selected':''}>${esc(t.short)}</option>`).join('')}</select>
      ${cats.length>1?`<select data-act="club-f" data-k="clubCat" style="max-width:220px"><option value="">Todas las categorías</option>${cats.map(c=>`<option ${ui.clubCat===c?'selected':''}>${esc(c)}</option>`).join('')}</select>`:''}
      <select data-act="club-f" data-k="clubRes" style="max-width:220px"><option value="">Todos los resultados</option>${[['win','Victorias'],['loss','Derrotas'],['pending','Pendientes de resultado'],['confirm','Por confirmar'],['next','Programadas']].map(([v,l])=>`<option value="${v}" ${ui.clubRes===v?'selected':''}>${l}</option>`).join('')}</select></div></section>
  <section class="sec"><div class="mdkpis stagger"><div><b>${k.teams}</b><span>equipos del club</span></div><div><b>${k.played}</b><span>han competido</span></div><div><b style="color:var(--win)">${k.win}</b><span>victorias</span></div><div><b style="color:var(--loss)">${k.loss}</b><span>derrotas</span></div><div class="${k.pending?'warn':''}"><b>${k.pending}</b><span>pendientes de resultado</span></div><div class="${k.confirm?'warn':''}"><b>${k.confirm}</b><span>por confirmar</span></div></div></section>
  <section class="sec"><div class="sec-h"><h2>Equipos del fin de semana</h2><a href="#club-resumen">Resumen para imprimir</a></div>
    ${rows.length? `<div class="ccards stagger">${rows.map(({t,d,f,s})=>`<a class="ccard ${s.st}" href="#club-equipo-${esc(t.id)}">
      <span class="cc-top"><b>${esc(t.name)}</b><small>${esc(t.cat||'')}</small></span>
      <span class="cc-vs">${crest(POLO,'sm')} Real Club de Polo <i>contra</i> ${esc(s.rival)}</span>
      <span class="cc-date">Jornada ${f.j}, ${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h, ${s.p.home?'en casa':'fuera'}</span>
      <span class="cc-res">${s.p.played? `Polo ${s.p.ps}-${s.p.rs}` : s.partial? 'En curso' : '–'}</span>
      <span class="cc-badges"><span class="ccb ${s.st}">${ST_LABEL[s.st]}</span>${s.confirm?'<span class="ccb confirm">Pendiente de confirmar</span>':''}</span>
      <span class="cc-meta">${s.singles} ${s.singles===1?'individual':'individuales'} y ${s.dbl} ${s.dbl===1?'dobles':'dobles'} con resultado</span></a>`).join('')}</div>` : '<div class="empty">Ningún equipo con eliminatoria en este fin de semana con los filtros elegidos.</div>'}
    ${W.idle.length? `<div class="idle"><span class="muted small">Sin eliminatoria:</span> ${W.idle.map(x=>`<a class="chip" href="#club-equipo-${esc(x.t.id)}">${esc(x.t.short)}: <span class="muted">${esc(x.why)}</span></a>`).join('')}</div>` : ''}</section>
  <section class="sec"><div class="split"><div><div class="sec-h"><h2>Próximas jornadas</h2></div>${next.length? `<ul class="insights">${next.map(({t,d,f})=>`<li><b>${esc(t.short)}</b> contra ${esc(withS(d,()=>clubName(persp(f).rival)))}<small>Jornada ${f.j}, ${esc(fdate(f,{weekday:'long',day:'numeric',month:'long'}))}, ${esc(f.time)} h</small></li>`).join('')}</ul>` : '<div class="empty">Sin jornadas programadas.</div>'}</div>
    <div><div class="sec-h"><h2>Última actividad</h2></div><ul class="insights">${all.map(t=>{ const d=clubData[t.id], a=d?.audit?.[0]; return `<li><b>${esc(t.short)}</b>: ${d?.updatedAt? 'actualizado '+relTime(d.updatedAt) : 'sin datos'}${a? `<small>${esc(a.by)}: ${esc(a.what.join(', '))}</small>` : ''}</li>`; }).join('')}</ul></div></div></section></div>`;
}
function vClubEquipos(){
  if(!canClub()) return vClub(); ensureClubSubs();
  return `<div class="wrap club"><div class="pagehead"><h1>Equipos</h1><p class="lede">Equipos del Real Club de Polo en la Lliga Catalana, temporada ${esc(viewSeason)}.</p></div>${clubNav('club-equipos')}
    <section class="sec"><div class="ccards stagger">${clubTeams().map(t=>{ const d=clubData[t.id]; if(!d) return `<a class="ccard idle" href="#club-equipo-${esc(t.id)}"><span class="cc-top"><b>${esc(t.name)}</b><small>${esc(t.cat||'')}</small></span><span class="cc-meta">Sin calendario ni plantilla cargados todavía</span></a>`;
      const st=withS(d,()=>standings()), me_=st.find(r=>r.id===POLO)||{}, ts=withS(d,()=>teamStats());
      return `<a class="ccard" href="#club-equipo-${esc(t.id)}"><span class="cc-top"><b>${esc(t.name)}</b><small>${esc(t.cat||'')}${d.comp?.group? ', '+esc(d.comp.group):''}</small></span>
        <span class="cc-res">${me_.pj? me_.pos+'º' : '–'}<small> ${me_.pts||0} pts</small></span><span class="cc-meta">${d.players.length} jugadores. Eliminatorias ${ts.tw}-${ts.tl}, partidos ${ts.rw}-${ts.rl}.</span></a>`; }).join('')}</div></section></div>`;
}
function vClubTeam(tid){
  if(!canClub()) return vClub(); ensureClubSubs(); const t=clubTeams().find(x=>x.id===tid); if(!t) return vNotFound(); const d=clubData[tid];
  const head=`<div class="wrap club"><div class="pagehead"><a class="textlink" href="#club">← Gestión deportiva</a><h1 style="margin-top:10px">${esc(t.name)}</h1><p class="lede">${esc(t.cat||'')}${d?.comp?.group? ', '+esc(d.comp.group):''}. Temporada ${esc(viewSeason)}.</p>
    <div class="row" style="margin-top:12px"><button class="btn brass" data-act="team-open" data-t="${esc(tid)}">Abrir la app del equipo</button></div></div>`;
  if(!d) return head+`<section class="sec"><div class="empty">Este equipo aún no tiene calendario ni plantilla cargados. Ábrelo y cárgalos desde Gestión, o envía los documentos de la FCT.</div></section></div>`;
  return withS(d,()=>{ const st=standings(), mine=st.find(r=>r.id===POLO)||{}, ts=teamStats(), caps=(d.captains||[]).map(pname);
    const fx=d.fixtures.filter(f=>f.home===POLO||f.away===POLO).sort((a,b)=>a.j-b.j);
    const pend=fx.filter(f=>{ const s=tieState(d,f); return s.confirm || s.st==='pending' || (isPlayed(f) && !(tieFromRubbers(f.j)||{}).decided); });
    const last=[...fx].reverse().find(f=>isPlayed(f));
    return head+`<section class="sec"><div class="mdkpis stagger"><div><b>${mine.pj? mine.pos+'º':'–'}</b><span>clasificación</span></div><div><b>${mine.pts||0}</b><span>puntos</span></div><div><b>${ts.tw}-${ts.tl}</b><span>eliminatorias</span></div><div><b>${ts.rw}-${ts.rl}</b><span>partidos</span></div><div><b>${d.players.length}</b><span>jugadores</span></div><div class="${pend.length?'warn':''}"><b>${pend.length}</b><span>por validar</span></div></div></section>
    <section class="sec"><div class="split"><div><div class="sec-h"><h2>Jornadas</h2></div>${fx.length? `<div class="tscroll"><table><thead><tr><th>J</th><th class="l">Fecha</th><th class="l">Rival</th><th>Resultado</th><th class="l">Estado</th><th>Ind.</th><th>Dob.</th></tr></thead><tbody>${fx.map(f=>{ const s=tieState(d,f); return `<tr><td>${f.j}</td><td class="l">${esc(fdate(f))}</td><td class="l">${esc(s.rival)}</td><td>${s.p.played? s.p.ps+'-'+s.p.rs : '–'}</td><td class="l"><span class="ccb ${s.st}">${ST_LABEL[s.st]}</span>${s.confirm?' <span class="ccb confirm">Por confirmar</span>':''}</td><td>${s.singles}</td><td>${s.dbl}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">Sin calendario.</div>'}</div>
      <div><div class="sec-h"><h2>Clasificación</h2></div>${st.length>1? standingsTable(st,true) : '<div class="empty">Sin clasificación.</div>'}</div></div></section>
    ${last? `<section class="sec"><div class="sec-h"><h2>Última eliminatoria: jornada ${last.j}</h2></div><p class="lede" style="margin:0 0 8px">Polo ${persp(last).ps}-${persp(last).rs} ${esc(clubName(persp(last).rival))}, ${esc(fdate(last,{day:'numeric',month:'long'}))}.</p>${(tie(last.j)?.rubbers||[]).map((r,i)=>((r.polo||[]).length||rubberCalc(r).res)? rubberRow(r,i,last) : '').join('') || '<div class="empty">Sin partidos introducidos.</div>'}</section>` : ''}
    <section class="sec"><div class="split"><div><div class="sec-h"><h2>Plantilla</h2></div><p class="muted small" style="margin-top:-6px">Capitán: ${caps.length? esc(caps.join(', ')) : 'sin asignar'}</p>
      ${d.players.length? `<div class="tscroll"><table><thead><tr><th>Jugador</th><th>Cat.</th><th>Individuales</th><th>Dobles</th></tr></thead><tbody>${d.players.filter(p=>p.active!==false).sort((a,b)=>a.order-b.order).map(p=>{ const a=playerStats(p.id), b=playerStats(p.id,null,'D'); return `<tr><td>${esc(p.name)}</td><td>${esc(p.cat||'')}</td><td>${a.w}-${a.l}</td><td>${b.w}-${b.l}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">Sin plantilla.</div>'}</div>
      <div><div class="sec-h"><h2>Pendiente de validar</h2></div>${pend.length? `<ul class="insights">${pend.map(f=>{ const s=tieState(d,f); return `<li>Jornada ${f.j} contra ${esc(s.rival)}<small>${s.confirm? 'Resultado provisional, falta confirmarlo como oficial' : s.st==='pending'? 'Sin resultado' : 'Marcador sin los partidos individuales'}</small></li>`; }).join('')}</ul>` : '<div class="empty">Nada pendiente.</div>'}
      <div class="sec-h" style="margin-top:20px"><h2>Últimas actualizaciones</h2></div>${(d.audit||[]).length? `<ul class="insights">${d.audit.slice(0,8).map(a=>`<li>${esc(a.what.join(', '))}<small>${esc(a.by)}, ${relTime(a.at)}</small></li>`).join('')}</ul>` : '<div class="empty">Sin cambios registrados todavía.</div>'}</div></div></section></div>`; });
}
function vClubResumen(){
  if(!canClub()) return vClub(); ensureClubSubs(); const W=clubWeekRows(), rows=W.rows, fmt=d=>d.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
  const win=rows.filter(r=>r.s.st==='win').length, loss=rows.filter(r=>r.s.st==='loss').length, pend=rows.filter(r=>r.s.st==='pending'||r.s.confirm).length;
  const perf=rows.map(({t,d,f})=>withS(d,()=>{ const tt=tie(f.j); const S_=[], D_=[]; (tt?.rubbers||[]).forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; (r.type==='S'?S_:D_).push({who:(r.polo||[]).map(pname).join(' y '), n:r.n, res:c.res, sets:c.sets.map(x=>x.join('-')).join(' ')}); }); return {t,S_,D_}; }));
  const played=rows.filter(r=>r.s.p.played);
  const concl = !rows.length? 'No hubo eliminatorias de equipos del club este fin de semana.'
    : `${played.length} ${played.length===1?'equipo compitió':'equipos compitieron'} este fin de semana: ${win} ${win===1?'victoria':'victorias'} y ${loss} ${loss===1?'derrota':'derrotas'}.${pend? ' Quedan '+pend+' '+(pend===1?'resultado':'resultados')+' por cerrar o confirmar.' : ''}`;
  return `<div class="wrap club report"><div class="pagehead noprint">${clubNav('club-resumen')}</div>
    <div class="rep-head"><img src="${ASSET.crestSm}" alt=""><div><p class="qsec">Real Club de Polo de Barcelona, gestión deportiva</p><h1>Resumen del fin de semana</h1><p class="lede">${fmt(W.rg.sat)} y ${fmt(W.rg.sun)}. Temporada ${esc(viewSeason)}.</p></div></div>
    <div class="row noprint" style="margin:6px 0 16px"><button class="btn ghost sm" data-act="club-wk" data-d="-7">‹ Anterior</button><button class="btn ghost sm" data-act="club-wk" data-d="7">Siguiente ›</button><button class="btn brass" data-act="club-print">Imprimir o guardar en PDF</button></div>
    <section class="sec"><h2>1. Resumen</h2><div class="mdkpis"><div><b>${rows.length}</b><span>eliminatorias</span></div><div><b>${win}</b><span>victorias</span></div><div><b>${loss}</b><span>derrotas</span></div><div><b>${pend}</b><span>pendientes</span></div></div></section>
    <section class="sec"><h2>2. Resultados por equipo</h2>${rows.length? `<table><thead><tr><th>Equipo</th><th class="l">Rival</th><th>Resultado</th><th class="l">Estado</th><th>Ind.</th><th>Dob.</th></tr></thead><tbody>${rows.map(({t,d,f,s})=>{ const g=withS(d,()=>{ const tt=tie(f.j); let sw=0,sl=0,dw=0,dl=0; (tt?.rubbers||[]).forEach(r=>{ const c=rubberCalc(r); if(!c.res) return; if(r.type==='S') c.res==='W'? sw++ : sl++; else c.res==='W'? dw++ : dl++; }); return {sw,sl,dw,dl}; });
      return `<tr><td>${esc(t.name)}</td><td class="l">${esc(s.rival)}</td><td>${s.p.played? s.p.ps+'-'+s.p.rs : '–'}</td><td class="l">${ST_LABEL[s.st]}${s.confirm?', por confirmar':''}</td><td>${g.sw}-${g.sl}</td><td>${g.dw}-${g.dl}</td></tr>`; }).join('')}</tbody></table>` : '<p class="muted">Sin eliminatorias.</p>'}</section>
    <section class="sec"><h2>3. Rendimiento de jugadores</h2>${perf.some(x=>x.S_.length||x.D_.length)? perf.map(x=>`<h3>${esc(x.t.name)}</h3>${x.S_.length?`<p class="small muted">Individuales</p><ul class="replist">${x.S_.map(m=>`<li><b>${m.res==='W'?'G':'P'}</b> ${esc(m.who)}, individual ${m.n}: ${esc(m.sets)}</li>`).join('')}</ul>`:''}${x.D_.length?`<p class="small muted">Dobles</p><ul class="replist">${x.D_.map(m=>`<li><b>${m.res==='W'?'G':'P'}</b> ${esc(m.who)}: ${esc(m.sets)}</li>`).join('')}</ul>`:''}`).join('') : '<p class="muted">Sin partidos individuales registrados.</p>'}</section>
    <section class="sec"><h2>4. Seguimiento</h2><ul class="insights">${clubTeams().map(t=>{ const d=clubData[t.id]; if(!d) return `<li><b>${esc(t.short)}</b>: sin calendario cargado.</li>`; const nx=d.fixtures.filter(x=>(x.home===POLO||x.away===POLO)&&!isPlayed(x)&&x.date>W.rg.to).sort((a,b)=>a.date.localeCompare(b.date))[0];
      return `<li><b>${esc(t.short)}</b>: ${nx? 'próxima jornada '+nx.j+' contra '+esc(withS(d,()=>clubName(persp(nx).rival)))+', '+esc(fdate(nx,{day:'numeric',month:'long'})) : 'sin próximas jornadas'}.</li>`; }).join('')}</ul></section>
    <section class="sec"><h2>5. Conclusión</h2><p>${esc(concl)}</p><p class="source">Informe generado a partir de los resultados registrados en la app. Solo incluye datos introducidos por los equipos; los marcados como pendientes aún no están confirmados.</p></section></div>`;
}
function vClubAjustes(){
  if(!isAdmin) return vClub();
  const m=meta||{}, teams=clubTeams(), mgr=m.managers||[];
  return `<div class="wrap club"><div class="pagehead"><h1>Configuración del club</h1></div>${clubNav('club-ajustes')}
    <section class="sec"><div class="sec-h"><h2>Gestores deportivos</h2></div><p class="muted small">Ven todos los equipos del club y pueden corregir datos. Entran con su Google; no necesitan ser jugadores.</p>
      ${mgr.length? `<ul class="insights">${mgr.map((x,i)=>`<li class="row" style="justify-content:space-between"><span><b>${esc(x.name||'')}</b> ${esc(x.email)}</span><button class="btn sm ghost" data-act="mgr-del" data-i="${i}">Quitar</button></li>`).join('')}</ul>` : '<div class="empty">Aún no hay gestores.</div>'}
      <div class="row" style="margin-top:10px"><input type="text" id="mgr-name" placeholder="Nombre (por ejemplo, Albert)" style="max-width:200px"><input type="email" id="mgr-email" placeholder="correo@gmail.com" style="max-width:260px"><button class="btn sm brass" data-act="mgr-add">Añadir gestor</button></div></section>
    <section class="sec"><div class="sec-h"><h2>Equipos del club</h2></div><p class="muted small">Cada equipo tiene su propia temporada: calendario, plantilla, resultados, disponibilidad y MVP. Jugadores, fotos y fichas son del club.</p>
      <div id="ctlist">${teams.map(t=>`<div class="qedit" data-id="${esc(t.id)}" style="grid-template-columns:1fr 120px 1fr"><input type="text" name="name" value="${esc(t.name)}" aria-label="Nombre"><input type="text" name="short" value="${esc(t.short)}" aria-label="Nombre corto"><input type="text" name="cat" value="${esc(t.cat||'')}" aria-label="Categoría"></div>`).join('')}</div>
      <div class="row" style="margin-top:10px"><button class="btn sm brass" data-act="cteams-save">Guardar equipos</button><input type="text" id="ct-name" placeholder="Nuevo equipo (por ejemplo, Veteranos +35)" style="max-width:280px"><input type="text" id="ct-short" placeholder="Nombre corto" style="max-width:140px"><button class="btn sm ghost" data-act="cteam-add">Añadir equipo</button></div></section></div>`;
}
async function saveMeta(patch,msg){ const m={current:currentSeason(), seasons:meta?.seasons||[viewSeason], ...(meta||{}), ...patch}; meta=m; renderQuiet(); await safe(()=>B.set('meta/app',m),msg); }
function teamMenuHTML(){ const ts=clubTeams(); return `${ts.map(t=>`<button data-act="team-pick" data-t="${esc(t.id)}" aria-pressed="${t.id===teamId}"><b>${esc(t.short)}</b><small>${esc(t.name)}</small></button>`).join('')}${canClub()? `<a href="#club" data-act="team-menu-close"><b>Gestión deportiva</b><small>Todos los equipos del club</small></a>` : ''}`; }

/* ===================== ROUTER Y RENDER ===================== */
const route = () => (location.hash||'#inicio').slice(1)||'inicio';
function render(){
  updRoles(); if(authReady && authUser && !me && isManager && !adminSkip){ adminSkip=true; if(!route().startsWith('club')) history.replaceState(null,'','#club'); }
  const app=$('#app'), gate=!authReady || !authUser || (!me && !adminSkip);
  document.body.classList.toggle('gate', gate);
  let html, nav=route();
  if(!authReady) html=`<div class="gatebox">${courtSVG()}</div>`;
  else if(!authUser) html=vLogin();
  else if(!me && !adminSkip) html=vClaim();
  else { const r=nav;
    if(r==='inicio') html=vInicio(); else if(r==='liga') html=vLiga();
    else if(r.startsWith('jornada-')){ html=vJornada(+r.slice(8)); nav='liga'; }
    else if(r==='equipo') html=vEquipo();
    else if(r.startsWith('jugador-')){ html=vJugador(r.slice(8)); nav='equipo'; }
    else if(r.startsWith('disponibilidad-')){ html=vDisponibilidad(+r.slice(15)); nav='yo'; }
    else if(r.startsWith('encuesta-')){ html=vEncuesta(+r.slice(9)); nav='yo'; }
    else if(r.startsWith('mvp-')){ html=vMvp(+r.slice(4)); nav='yo'; }
    else if(r==='mi-ficha'){ html=vMiFicha(); nav='yo'; }
    else if(r==='club'){ html=vClub(); nav='club'; } else if(r==='club-equipos'){ html=vClubEquipos(); nav='club'; } else if(r==='club-resumen'){ html=vClubResumen(); nav='club'; } else if(r==='club-ajustes'){ html=vClubAjustes(); nav='club'; }
    else if(r.startsWith('club-equipo-')){ html=vClubTeam(r.slice(12)); nav='club'; }
    else if(r==='stats') html=vStats(); else if(r==='yo'||r==='votar') { html=vYo(); nav='yo'; } else if(r==='admin') html=vAdmin(); else html=vNotFound();
    html+=`<footer class="wrap">Datos oficiales: Federació Catalana de Tennis. App privada del ${esc((curTeam()?.name||'equipo').toLowerCase())} del Real Club de Polo de Barcelona.${S.updatedAt?' Actualizado el '+new Date(S.updatedAt).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'.':''}</footer>`; }
  app.innerHTML=`<div class="page">${html}</div>`; app.dataset.ok='1';
  document.querySelectorAll('[data-nav]').forEach(a=>{ if(a.dataset.nav===nav) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  $('.adminlink').classList.toggle('on',canManage);
  const bs=$('.brand span'); if(bs) bs.innerHTML=`${esc(teamLabel())} <small>Lliga Catalana ${esc(String(viewSeason).replace(/^20(\d\d)-(\d\d)$/,'$1-$2'))}</small>`;
  let tw=$('.teamsw'); if(!tw){ tw=document.createElement('button'); tw.className='teamsw'; tw.type='button'; tw.setAttribute('aria-label','Cambiar de equipo'); tw.dataset.act='team-menu'; tw.textContent='▾'; $('.brand').after(tw); }
  tw.hidden = !(clubTeams().length>1 || canClub());
  let cl=$('.clublink'); if(!cl){ cl=document.createElement('a'); cl.className='clublink'; cl.href='#club'; cl.title='Gestión deportiva'; cl.setAttribute('aria-label','Gestión deportiva'); cl.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>'; $('.topicons').prepend(cl); }
  cl.classList.toggle('on',canClub()); if(nav==='club') cl.setAttribute('aria-current','page'); else cl.removeAttribute('aria-current');
  document.body.classList.toggle('clubmode', nav==='club'); document.body.classList.toggle('noplayer', !me);
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
window.addEventListener('hashchange',()=>{ if(ui.fe?.dirty) feFlush(); ui.survey=null; ui.avDraft=null; ui.compose=null; closeSheet(); stageClose(); closePosterModal(); render(); if(route()!==lastRoute) scrollTo(0,0); lastRoute=route(); });
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
    .then(()=>{ serverS=body; silentSnapshot(body); })
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
  else if(a==='admin-tab'){ ui.adminTab=el.dataset.v; render(); }
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
    const f=poloFix(j), calc=tieFromRubbers(j), home=f.home===POLO; let ps=$('#ps').value, rs=$('#rs').value, src='manual';
    if(calc.complete){ ps=calc.w; rs=calc.l; src='rubbers'; }
    else if(ps!==''&&rs!=='' && calc.decided && (+ps!==calc.w || +rs!==calc.l) && calc.decided>=(+ps)+(+rs)) toast('El marcador por equipos no coincide con los partidos introducidos');
    const prevScore=[f.hs,f.as].join('-');
    if(ps!==''&&rs!==''){ f.hs=home?+ps:+rs; f.as=home?+rs:+ps; f.src=src; } else { f.hs=null; f.as=null; f.src=null; }
    if([f.hs,f.as].join('-')!==prevScore || !f.status) f.status = f.hs==null? null : 'provisional';
    val.warnings.forEach(w=>toast(w));
    const wasPlayed=!!t._played; t._played=isPlayed(f);
    saveState(isPlayed(f)? 'Resultados guardados: estadísticas actualizadas' : 'Jornada '+j+' guardada');
    if(isPlayed(f) && !wasPlayed){ if(!S.mvp[jid(j)]){ S.mvp[jid(j)]={open:true,openedAt:Date.now(),deadline:Date.now()+(+S.rules.mvpHours||48)*3600e3}; saveState('Votación del MVP abierta'); setTimeout(()=>notify('mvp',j),1400); }
      setTimeout(()=>notify('survey',j),400); ui.compose={kind:'survey',j,text:composeText('survey',j)}; renderQuiet(); } }
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
  else if(a==='mgr-add'){ const name=$('#mgr-name').value.trim(), email=$('#mgr-email').value.trim().toLowerCase(); if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast('Escribe un correo válido');
    const managers=[...(meta?.managers||[]).filter(x=>x.email!==email),{name,email}]; await saveMeta({managers, managerEmails:managers.map(x=>x.email)},'Gestor añadido: '+(name||email)); }
  else if(a==='mgr-del'){ const managers=(meta?.managers||[]).filter((_,i)=>i!==+el.dataset.i); await saveMeta({managers, managerEmails:managers.map(x=>x.email)},'Gestor quitado'); }
  else if(a==='cteams-save'){ const teams=clubTeams().map(t=>{ const row=document.querySelector(`#ctlist [data-id="${t.id}"]`); const g=n=>row?.querySelector(`[name=${n}]`)?.value.trim(); return {...t, name:g('name')||t.name, short:g('short')||t.short, cat:g('cat')||''}; }); await saveMeta({teams},'Equipos guardados'); }
  else if(a==='cteam-add'){ const name=$('#ct-name').value.trim(), short=$('#ct-short').value.trim()||name; if(!name) return toast('Escribe el nombre del equipo'); let id=slug(short); while(clubTeams().some(t=>t.id===id)) id+='-2'; await saveMeta({teams:[...clubTeams(),{id,name,short,cat:''}]},'Equipo añadido: '+short); clubKey=''; }
  else if(a==='poster-scroll'){ $('#poster-canvas')?.scrollIntoView({behavior:'smooth',block:'center'}); }
  else if(a==='cal-ok'){ const t=ensureTie(+el.dataset.j); t.calOk=true; saveState('Calendario confirmado'); }
  else if(a==='prep-save'){ const j=+el.dataset.j, f=poloFix(j), rv=$('#pp-rival').value, home=$('#pp-home').value==='1', d=$('#pp-date').value, tm=$('#pp-time').value;
    const clash=S.fixtures.find(x=>x!==f && x.j===j && (x.home===rv||x.away===rv)); if(clash) return toast(clubName(rv)+' ya juega otro enfrentamiento en esta jornada');
    f.home=home? POLO : rv; f.away=home? rv : POLO; if(d) f.date=d; if(tm) f.time=tm; saveState('Eliminatoria actualizada'); }
  else if(a==='avail-close'){ const t=ensureTie(+el.dataset.j); if(availFor(+el.dataset.j).none.length && !confirm('Aún falta gente por responder. ¿Cerrar la disponibilidad igualmente?')) return; t.availClosed=true; t.availClosedAt=Date.now(); ui.jTab='disp'; saveState('Disponibilidad cerrada'); }
  else if(a==='avail-reopen'){ const t=ensureTie(+el.dataset.j); t.availClosed=false; saveState('Disponibilidad reabierta'); }
  else if(a==='go-compose'){ const j=+el.dataset.j, kind=el.dataset.kind; ui.jTab='disp'; ui.compose={kind,j,text:composeText(kind,j)}; render(); setTimeout(()=>$('#compose-text')?.scrollIntoView({behavior:'smooth',block:'center'}),80); }
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
  else if(a==='jtab'){ ui.jTab=el.dataset.v; ui.compose=null; render(); }
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
  else if(a==='comp-save'){ S.comp={name:$('#c-name').value.trim()||S.comp.name, group:$('#c-group').value.trim(), memorial:$('#c-mem').value.trim()}; saveState('Competición guardada'); }
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
  if(a==='club-date'){ if(el.value){ ui.clubSat=ymd(weekendSat(new Date(el.value+'T12:00:00'))); renderQuiet(); } }
  else if(a==='club-f'){ ui[el.dataset.k]=el.value||null; renderQuiet(); }
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
  dataSubs.push(B.watchColl('profiles', m=>{ profiles=m; softRender(); }));
  dataSubs.push(B.watchDoc(SEASON_PATH, d=>{ serverS= d? normalize(clone(d)) : null; S=d? normalize(clone(d)) : (teamId!=='polo-a'? emptyTeamSeed(teamId) : viewSeason===SEASON_ID? seed() : normalize({seasonId:viewSeason,fixtures:[],ties:{},published:{},official:{asOf:0,order:[]}}));
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
  return normalize({seasonId:viewSeason, teamId:tid, comp:{name:'Lliga Catalana per Equips', group:t.cat||'', memorial:''}, teams:[{id:POLO,name:'RC de Polo '+String(t.short||'').replace(/^Polo\s*/,''),short:t.short||'Polo',abbr:'RCP'}],
    players:[], fixtures:[], ties:{}, published:{}, official:{asOf:0,order:[]}, captains:[], mvp:{}}); }
function switchTeam(tid){ if(tid===teamId) return; teamId=tid; try{ localStorage.setItem('polo-team',tid); }catch(e){} S=emptyTeamSeed(tid); serverS=null; ui.fe=null; switchSeason(viewSeason, !ui.seasonPicked); }
function switchSeason(id,auto){ privKey=''; if(!auto) ui.seasonPicked=true; viewSeason=id; SEASON_PATH='seasons/'+docIdFor(teamId,id); avail={}; picks={}; ballots={}; notes={}; myBallot=null; privSubs.forEach(u=>{ try{u()}catch(e){} }); privSubs=[]; ui.adminJ=null; ui.calJ=null; subscribeData(); watchMine(); render(); }
B.onAuth(async u=>{
  unsubAll(); dataSubs.forEach(x=>{ try{x()}catch(e){} }); dataSubs=[];
  authUser=u; me=null; isAdmin=false; adminSkip=false; claims={}; avail={}; picks={}; ballots={}; myBallot=null; S=seed();
  if(!u){ authReady=true; render(); return; }
  isAdmin=await B.isAdmin(u.email,u.uid);
  try{ const m0=await B.getDoc('meta/app'); if(m0){ meta=m0; } checkManager(m0); }catch(e){}
  try{ await B.relink(); }catch(e){}
  subs.push(B.watchColl('claims', m=>{ claims=m; softRender(); }));
  let first=true;
  subs.push(B.watchDoc('users/'+u.uid, d=>{ const nm=d?.pid||null;
    if(nm!==me || first){ first=false; me=nm; subscribeData(); watchMine(); authReady=true; render(); } else softRender(); }));
});
lastRoute=route(); render(); playIntro();
