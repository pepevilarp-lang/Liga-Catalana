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
const CLUB = window.CLUB || {name:'Club', medium:'Club', short:'Club', teamShort:'Club', abbr:'CLB', fileTag:'CLUB', crest:'', crestSm:'', teams:[], fctGroups:{}};   // identidad del club: club-config.js
const DEFAULT_CLUB_TEAMS=CLUB.teams;
const US = CLUB.teamShort || 'Club';   // cómo se llama al equipo propio en los textos («Polo contra…», «Sabadell contra…»)
const IS_POLO = !CLUB.generic;   // el club original: sus datos, equipos y temporada inicial están en este código
const MAIN_TEAM = IS_POLO? ((CLUB.teams[0]||{}).id || 'polo-a') : '-';   // su temporada conserva la ruta original (seasons/2026-27)
let teamId=(()=>{ try{ return localStorage.getItem(IS_POLO? 'polo-team' : 'lc-team-'+CLUB.id)||(IS_POLO? MAIN_TEAM : ''); }catch(e){ return IS_POLO? MAIN_TEAM : ''; } })();
const docIdFor=(tid,season)=> tid===MAIN_TEAM? season : season+'-'+tid;
let SEASON_PATH = 'seasons/' + docIdFor(teamId, SEASON_ID);
let viewSeason = SEASON_ID;
const POLO = 'polo';
const COMP = { name:'13a Lliga Catalana Absolut i Sènior per Equips', group:'Absolut masculino, Barcelona, Divisió 1', memorial:'Memorial Carlos Punzano' };

const TEAMS0 = [
  {id:'polo',      name:CLUB.short,              short:CLUB.teamShort,    abbr:CLUB.abbr},
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
  req: '¡Buenas equipo! 🎾\n\nTenemos eliminatoria contra {rival} el próximo {fecha} a las {hora} ({lugar}).\n📍 {sede}: {mapa}\n\nNecesitamos saber quién está disponible para organizar la convocatoria.\n\n👉 Da tu disponibilidad aquí antes del {limite}:\n{enlace}\n\n¡Vamos '+CLUB.teamShort+'!',
  rem: 'Recordatorio 🎾\n\nAún nos falta saber si podéis jugar contra {rival} el {fecha} a las {hora}: {pendientes}.\n📍 {sede}: {mapa}\n\n👉 Da tu disponibilidad aquí antes del {limite}:\n{enlace}\n\n¡Gracias!',
  remOne: '¡Hola {nombre}! 🎾 ¿Puedes jugar contra {rival} el {fecha} a las {hora} ({lugar})?\n\n👉 Da tu disponibilidad aquí antes del {limite}: {enlace}\n📍 {sede}: {mapa}',
  survey: '🎾 Jornada {jornada} terminada: {resultado}.\n\nLos que habéis jugado ({jugadores}), os toca la encuesta postpartido. Son 2 minutos:\n{enlaceEncuesta}\n\n¡Gracias!',
  summary: '🎾 Jornada {jornada}: {resultado}.\n\n{cronica}\n\n{partidos}\n\nTodo en la app: {enlaceJornada}',
  mvp: '🏆 Ya podéis votar al MVP de la jornada {jornada} ({resultado}).\n\nUn voto por cabeza y no vale votarse a uno mismo. Hasta el {limiteMvp}:\n{enlaceMvp}',
  lineup: '📋 Convocatoria jornada {jornada}\n\n'+CLUB.teamShort+' contra {rival}, {fecha} a las {hora} ({lugar}).\n📍 {sede}: {mapa}\n\n{lista}\n\nTodo en la app: {enlaceJornada}\n\n¡Vamos '+CLUB.teamShort+'!'
};
const AV_LABEL = {yes:'Disponible', no:'No disponible', maybe:'Pendiente de confirmar', none:'Sin respuesta'};
const AV_CHIPS = ['Puedo jugar, pero solo a partir de las 12:00','Tengo molestias','Estoy pendiente de confirmar','Puedo jugar individual o dobles','Prefiero dobles','Llego justo de tiempo'];
const SCOPE_LABEL = {team:'Sobre el equipo', self:'Sobre ti (privado)', open:'Comentarios (privado)'};
const SELF_DIMS = [['s_rend','Rendimiento'],['s_fisico','Estado físico'],['s_conc','Concentración'],['s_actitud','Actitud']];

function seed(){
  if(!IS_POLO) return { seasonId: SEASON_ID, comp:{name:'Lliga Catalana per Equips', group:'', memorial:''},
    rules: {win:3, loss:1, availDays:6, deadlineDays:2, deadlineTime:'21:00', mvpHours:48, teamManage:true, doubles:'always'}, mvp:{}, msgs:{...DEFAULT_MSGS},
    teams:[{id:POLO, name:CLUB.short, short:CLUB.teamShort, abbr:CLUB.abbr}], players:[], fixtures:[], ties:{}, survey:{closed:{}, questions: DEFAULT_Q.map(q=>({...q}))},
    published:{}, official:{asOf:0, order:[]}, captains:[], updatedAt:null };
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

