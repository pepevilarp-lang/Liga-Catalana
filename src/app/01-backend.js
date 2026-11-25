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
  // Igual que con Firebase: los datos de cada club viven bajo su raíz (clubs/<id>/… para los clubes nuevos)
  const ROOT=(CLUB.dataRoot||'').replace(/^\/+|\/+$/g,''), CC=new Set(['meta','public','claims','profiles','photos','phones','pushTokens','reports','seasons','private','invites']);
  const CP=p=> ROOT && CC.has(String(p).split('/')[0])? ROOT+'/'+p : p;
  const api = {
    mode:'demo',
    onAuth(cb){ authCb=cb; setTimeout(()=>cb(u),0); },
    // En la vista previa se puede entrar como otra persona para probar roles: localStorage 'polo-demo-as' = {uid,email,name,noAdmin}
    async signIn(){ let as=null; try{ as=JSON.parse(localStorage.getItem('polo-demo-as')||'null'); }catch(e){} u=as? {uid:as.uid,email:as.email,name:as.name||'Vista previa'} : {uid:'preview-user', email:'jugador.prueba@gmail.com', name:'Vista previa'}; try{ localStorage.setItem(KEY+'-u',JSON.stringify(u)); }catch(e){} authCb(u); },
    async signOut(){ u=null; try{ localStorage.removeItem(KEY+'-u'); }catch(e){} authCb(null); },
    watchDoc:(p,cb)=>watch(p,cb,false), watchColl:(p,cb)=>watch(p,cb,true),
    watchRecent:(p,field,n,cb)=>watch(p,m=>cb(Object.fromEntries(Object.entries(m||{}).sort((x,y)=>(y[1]?.[field]||0)-(x[1]?.[field]||0)).slice(0,n))),true),
    async set(p,d){ mem[p]=clone(d); persist(); emit(); },
    async castVote(base,voter,v){ const vp=base+'/votes/'+voter; if(mem[vp]) throw Object.assign(new Error('ya votado'),{code:'permission-denied'}); mem[vp]={v,at:Date.now()}; const t=mem[base]||{t:{},n:0}; t.t=t.t||{}; t.t[v]=(t.t[v]||0)+1; t.n=(t.n||0)+1; mem[base]=t; persist(); emit(); },
    async annulVote(base,voter,v){ const vp=base+'/votes/'+voter; if(!mem[vp]) return; v=v||mem[vp].v; delete mem[vp]; const t=mem[base]; if(t&&v&&t.t?.[v]){ t.t[v]--; if(!t.t[v]) delete t.t[v]; t.n=Math.max(0,(t.n||1)-1); } persist(); emit(); },
    async update(p,changes){ const doc=mem[p]||{}; Object.entries(changes).forEach(([k,v])=>{ const parts=k.split('.'); let o=doc; parts.slice(0,-1).forEach(x=>{ o[x]=o[x]&&typeof o[x]==='object'? o[x] : {}; o=o[x]; }); const last=parts.at(-1); if(v===DEL) delete o[last]; else o[last]=clone(v); }); mem[p]=doc; persist(); emit(); },
    async del(p){ delete mem[p]; persist(); emit(); },
    async claim(pid){ const c=mem['claims/'+pid]; if(c && c.email!==u.email) throw new Error('Ese nombre ya está elegido'); Object.keys(mem).forEach(k=>{ if(k.startsWith('claims/') && mem[k].email===u.email) delete mem[k]; }); mem['claims/'+pid]={uid:u.uid,email:u.email,at:Date.now()}; mem['users/'+u.uid]={pid,email:u.email}; persist(); emit(); },
    mePath:uid=>'users/'+uid, setRoot(){}, root:()=>'',
    async noteClub(uid,club){ mem['accounts/'+uid]={clubs:{...((mem['accounts/'+uid]||{}).clubs||{}),[club]:true}}; persist(); },
    async myClubs(uid){ const out=[]; for(const k of Object.keys(mem)){ const m=/^clubs\/([^/]+)\/members\/(.+)$/.exec(k); if(m && m[2]===uid){ const c=mem['clubs/'+m[1]]||{}; out.push({club:m[1], clubName:c.name||(m[1]===CLUB_DEFAULT?.id? CLUB_DEFAULT.name : m[1]), crestSm:c.crestSm||'', ...mem[k]}); } }
      if(mem['users/'+uid]?.pid && !out.some(x=>x.club===(window.CLUB_DEFAULT||CLUB).id)) out.push({club:(window.CLUB_DEFAULT||CLUB).id, clubName:(window.CLUB_DEFAULT||CLUB).name, pid:mem['users/'+uid].pid, roles:['jugador']}); return out; },
    async claimInvite(code,pid,opt={}){ const iv=mem['invites/'+code]; if(!iv||iv.usedBy||iv.revoked||iv.pid!==pid||(iv.exp||0)<Date.now()||(iv.email&&iv.email!==u.email)) throw Object.assign(new Error('invitación no válida'),{code:'permission-denied'});
      if(opt.member) mem['clubs/'+opt.member+'/members/'+u.uid]={uid:u.uid,pid,email:u.email,roles:['jugador'],status:'activo',invite:code,at:Date.now()};
      if(mem['claims/'+pid] && mem['claims/'+pid].email!==u.email) throw Object.assign(new Error('ya vinculado'),{code:'permission-denied'});
      mem['claims/'+pid]={uid:u.uid,email:u.email,at:Date.now(),invite:code}; mem['users/'+u.uid]={pid,email:u.email}; mem['invites/'+code]={...iv,usedBy:u.uid,usedAt:Date.now()}; persist(); emit(); },
    watchWhere(p,field,val,cb){ return watch(p,m=>cb(Object.fromEntries(Object.entries(m||{}).filter(([,x])=>x&&x[field]===val))),true); },
    async acceptGestorInvite(code,club){ const iv=mem['invites/'+code]; if(!iv||iv.role!=='gestor'||iv.club!==club||iv.usedBy||(iv.exp||0)<Date.now()) throw Object.assign(new Error('invitación no válida'),{code:'permission-denied'});
      mem['invites/'+code]={...iv,usedBy:u.uid,usedAt:Date.now()}; mem['clubs/'+club+'/members/'+u.uid]={uid:u.uid,email:u.email,roles:['gestor'],invite:code,approvedBy:iv.byEmail||'',at:Date.now()}; persist(); emit(); },
    async getColl(p){ const out={}, d=p.split('/').length+1; Object.keys(mem).forEach(k=>{ if(k.startsWith(p+'/') && k.split('/').length===d) out[k.split('/').pop()]=clone(mem[k]); }); return out; },
    async relink(){ return null; },
    async isAdmin(){ try{ return !JSON.parse(localStorage.getItem('polo-demo-as')||'null')?.noAdmin; }catch(e){ return true; } },
    async getDoc(p){ return clone(mem[p]??null); },
    async merge(p,obj){ const deep=(a,b)=>{ Object.entries(b).forEach(([k,v])=>{ if(v&&typeof v==='object'&&!Array.isArray(v)){ a[k]=a[k]&&typeof a[k]==='object'?a[k]:{}; deep(a[k],v); } else a[k]=clone(v); }); return a; }; mem[p]=deep(mem[p]||{},obj); persist(); emit(); },
    async diag(){ return [['Modo','Vista previa: no hay base de datos que comprobar',false]]; },
    async idToken(){ return null; }, async addPushToken(){ return null; },
    async reset(){ mem={}; persist(); emit(); }
  };
  // Rutas con la raíz del club: las funciones que reciben una ruta, y las rutas internas de claim/claimInvite/acceptGestorInvite
  ['watchDoc','watchColl','watchRecent','watchWhere','set','update','del','getDoc','getColl','merge','castVote','annulVote'].forEach(k=>{ const f=api[k]; api[k]=(p,...a)=>f(CP(p),...a); });
  const K=k=>CP(k);
  const claim0=api.claim, ci0=api.claimInvite, ag0=api.acceptGestorInvite;
  api.claim=async pid=>{ if(!ROOT) return claim0(pid); const c=mem[K('claims/'+pid)]; if(c && c.email!==u.email) throw new Error('Ese nombre ya está elegido'); mem[K('claims/'+pid)]={uid:u.uid,email:u.email,at:Date.now()}; mem['clubs/'+CLUB.id+'/members/'+u.uid]={...(mem['clubs/'+CLUB.id+'/members/'+u.uid]||{}),uid:u.uid,pid,email:u.email,roles:['jugador'],status:'activo'}; persist(); emit(); };
  api.claimInvite=async(code,pid,opt={})=>{ if(!ROOT) return ci0(code,pid,opt); const iv=mem[K('invites/'+code)]; if(!iv||iv.usedBy||iv.revoked||iv.pid!==pid||(iv.exp||0)<Date.now()||(iv.email&&iv.email!==u.email)) throw Object.assign(new Error('invitación no válida'),{code:'permission-denied'});
    if(mem[K('claims/'+pid)] && mem[K('claims/'+pid)].email!==u.email) throw Object.assign(new Error('ya vinculado'),{code:'permission-denied'});
    mem[K('claims/'+pid)]={uid:u.uid,email:u.email,at:Date.now(),invite:code}; mem['clubs/'+CLUB.id+'/members/'+u.uid]={...(mem['clubs/'+CLUB.id+'/members/'+u.uid]||{}),uid:u.uid,pid,email:u.email,roles:[...new Set([...((mem['clubs/'+CLUB.id+'/members/'+u.uid]||{}).roles||[]),'jugador'])],status:'activo',invite:code}; mem[K('invites/'+code)]={...iv,usedBy:u.uid,usedAt:Date.now()}; persist(); emit(); };
  api.acceptGestorInvite=async(code,club)=>{ if(!ROOT) return ag0(code,club); const iv=mem[K('invites/'+code)]; if(!iv||iv.role!=='gestor'||iv.club!==club||iv.usedBy||(iv.exp||0)<Date.now()) throw Object.assign(new Error('invitación no válida'),{code:'permission-denied'});
    mem[K('invites/'+code)]={...iv,usedBy:u.uid,usedAt:Date.now()}; mem['clubs/'+club+'/members/'+u.uid]={uid:u.uid,email:u.email,roles:['gestor'],invite:code,at:Date.now()}; persist(); emit(); };
  api.mePath=uid=> ROOT? 'clubs/'+CLUB.id+'/members/'+uid : 'users/'+uid;
  api.root=()=>ROOT;
  return api;
}
function makeFirebase(){
  firebase.initializeApp(CFG.firebase); const auth=firebase.auth(); const fs=firebase.firestore();
  try{ fs.enablePersistence({synchronizeTabs:true}).catch(()=>{}); }catch(e){}   // los cambios sin conexión se guardan y se suben al volver la red
  // Raíz de datos del club: hoy vacía para el Polo; en la fase 3 del plan multiclub será 'clubs/<id>/' (docs/MULTICLUB.md)
  // La raíz cambia a clubs/<id> cuando el club está migrado (clubs/<id>.migrated, lo comprueba accLoadBrand antes de cargar datos)
  let ROOT=(CLUB.dataRoot||'').replace(/^\/+|\/+$/g,''); const CLUB_COLLS=new Set(['meta','public','claims','profiles','photos','phones','pushTokens','reports','seasons','private','invites']);
  const CP=p=> ROOT && CLUB_COLLS.has(String(p).split('/')[0])? ROOT+'/'+p : p;
  const pathRef=p=>fs.doc(CP(p));
  return {
    mode:'firebase',
    setRoot(r){ ROOT=String(r||'').replace(/^\/+|\/+$/g,''); }, root:()=>ROOT,
    // Clubes de la cuenta: sus pertenencias (clubs/*/members con su uid) y, en el club original, su ficha en users/<uid>
    // Clubes de la cuenta: accounts/<uid>.clubs es solo un índice; cada club se comprueba con su pertenencia real
    async myClubs(uid){ const def=window.CLUB_DEFAULT||CLUB;   // lecturas en paralelo (antes, una tras otra por club)
      const [a, legacy]=await Promise.all([fs.doc('accounts/'+uid).get().catch(()=>null), fs.doc('users/'+uid).get().catch(()=>null)]);
      const ids=Object.keys((a && a.exists && a.data().clubs)||{});
      const rows=await Promise.all(ids.map(async club=>{ try{
        const [m, x]=await Promise.all([fs.doc('clubs/'+club+'/members/'+uid).get(), fs.doc('clubs/'+club).get().catch(()=>null)]);
        if(!m.exists) return null; const c= x && x.exists? x.data() : {};
        return {club, clubName:c.name||(club===def.id? def.name : club), crestSm:c.crestSm||'', ...m.data()}; }catch(e){ return null; } }));
      const out=rows.filter(Boolean);
      if(!out.some(x=>x.club===def.id) && legacy && legacy.exists && legacy.data().pid) out.push({club:def.id, clubName:def.name, pid:legacy.data().pid, roles:['jugador']});
      return out; },
    noteClub(uid,club){ return fs.doc('accounts/'+uid).set({clubs:{[club]:true}},{merge:true}).catch(()=>{}); },
    // Ficha de la cuenta en este club: users/<uid> en la raíz; clubs/<id>/members/<uid> después de migrar
    mePath:uid=> ROOT? 'clubs/'+CLUB.id+'/members/'+uid : 'users/'+uid,
    onAuth(cb){ auth.getRedirectResult().catch(e=>toast(authMsg(e))); auth.onAuthStateChanged(x=>cb(x? {uid:x.uid,email:(x.email||'').toLowerCase(),name:x.displayName,photo:x.photoURL} : null)); },
    async signIn(){ const p=new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt:'select_account'});
      try{ await auth.signInWithPopup(p); }catch(e){ if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/web-storage-unsupported'].includes(e.code)) return auth.signInWithRedirect(p); if(e.code!=='auth/popup-closed-by-user' && e.code!=='auth/cancelled-popup-request') toast(authMsg(e)); } },
    // Cierra la sesión y borra la copia local de Firestore (datos del club guardados para usarla sin conexión)
    async signOut(){ await auth.signOut(); try{ await fs.terminate(); await fs.clearPersistence(); }catch(e){ console.warn('clearPersistence',e.code||e); } },
    watchDoc(p,cb,onErr){ return pathRef(p).onSnapshot(s=>cb(s.exists? s.data():null), e=>{ console.warn(p,e.code); if(onErr) onErr(e); }); },
    watchRecent(p,field,n,cb){ return fs.collection(CP(p)).orderBy(field,'desc').limit(n).onSnapshot(q=>{ const o={}; q.forEach(d=>o[d.id]=d.data()); cb(o); }, e=>console.warn(p,e.code)); },
    watchColl(p,cb){ return fs.collection(CP(p)).onSnapshot(q=>{ const o={}; q.forEach(d=>o[d.id]=d.data()); cb(o); }, e=>console.warn(p,e.code)); },
    set:(p,d)=>pathRef(p).set(clone(d)),
    async diag(seasonPath, body){ const u=auth.currentUser, out=[];
      out.push(['Sesión', u? u.email+(u.emailVerified?'':' (correo sin verificar)') : 'Sin sesión', !!(u&&u.emailVerified)]); if(!u) return out;
      try{ const d=await pathRef('users/'+u.uid).get(); out.push(['Tu jugador', d.exists? 'Elegido: '+d.data().pid : 'No has elegido tu nombre', d.exists]); }catch(e){ out.push(['Tu jugador','No se puede leer ('+e.code+')',false]); }
      let ad=false; try{ ad=(await pathRef('admins/'+u.uid).get()).exists || (await pathRef('admins/'+(u.email||'').toLowerCase()).get()).exists; }catch(e){} out.push(['Administrador', ad? 'Sí' : 'No (no hace falta para editar)', true]);
      let ex=null; try{ ex=(await pathRef(seasonPath).get()).exists; out.push(['Leer la temporada', ex? 'Correcto' : 'Aún no existe en la base de datos', true]); }catch(e){ out.push(['Leer la temporada','Denegado ('+e.code+')',false]); }
      if(ex===true){ try{ await pathRef(seasonPath).update({diagAt:Date.now()}); out.push(['Guardar en la temporada','Correcto',true]); }catch(e){ out.push(['Guardar en la temporada','Denegado ('+e.code+')',false]); } }
      else if(ex===false){ try{ await pathRef(seasonPath).set(clone(body)); out.push(['Crear la temporada','Creada correctamente',true]); }catch(e){ out.push(['Crear la temporada','Denegado ('+e.code+')',false]); } }
      return out; },
    async castVote(base,voter,v){ const b=fs.batch(), inc=firebase.firestore.FieldValue.increment(1);
      b.set(pathRef(base+'/votes/'+voter),{v,at:Date.now()}); b.set(pathRef(base),{t:{[v]:inc},n:inc},{merge:true}); return b.commit(); },
    async annulVote(base,voter,v){ const b=fs.batch(), dec=firebase.firestore.FieldValue.increment(-1);
      b.delete(pathRef(base+'/votes/'+voter)); if(v) b.set(pathRef(base),{t:{[v]:dec},n:dec},{merge:true}); return b.commit(); },
    update:(p,changes)=>{ const o={}; Object.entries(changes).forEach(([k,v])=>o[k]= v===DEL? firebase.firestore.FieldValue.delete() : clone(v)); return pathRef(p).update(o); },
    del:(p)=>pathRef(p).delete(),
    async claim(pid){ const u=auth.currentUser; const email=(u.email||'').toLowerCase(); const b=fs.batch();
      b.set(pathRef('claims/'+pid),{uid:u.uid,email,at:Date.now()}); b.set(pathRef('users/'+u.uid),{pid,email}); await b.commit(); },
    // Vincular el Gmail a un jugador con una invitación: las reglas comprueban el código, el jugador, la caducidad y que no se haya usado
    // opt.member = id del club: alta como miembro (jugador) en el mismo lote, si aún no lo es. Después de migrar, la ficha vive ahí.
    async claimInvite(code,pid,opt={}){ const u=auth.currentUser; const email=(u.email||'').toLowerCase(); const b=fs.batch();
      b.set(pathRef('claims/'+pid),{uid:u.uid,email,at:Date.now(),invite:code});
      if(!ROOT) b.set(pathRef('users/'+u.uid),{pid,email});
      if(opt.member) b.set(fs.doc('accounts/'+u.uid),{clubs:{[opt.member]:true}},{merge:true});
      if(opt.member) b.set(fs.doc('clubs/'+opt.member+'/members/'+u.uid), opt.roles? {uid:u.uid,pid,email,roles:[...new Set([...opt.roles,'jugador'])],invite:code} : {uid:u.uid,pid,email,roles:['jugador'],status:'activo',invite:code,at:Date.now()}, opt.roles? {merge:true} : undefined);
      b.update(pathRef('invites/'+code),{usedBy:u.uid,usedAt:Date.now()}); await b.commit(); },
    watchWhere(p,field,val,cb){ return fs.collection(CP(p)).where(field,'==',val).onSnapshot(q=>{ const o={}; q.forEach(d=>o[d.id]=d.data()); cb(o); }, e=>console.warn(p,e.code)); },
    // Invitación de gestor: se marca como usada y se crea el miembro del club en el mismo lote (lo validan las reglas)
    async acceptGestorInvite(code,club){ const u=auth.currentUser; const b=fs.batch();
      b.update(pathRef('invites/'+code),{usedBy:u.uid,usedAt:Date.now()});
      b.set(fs.doc('accounts/'+u.uid),{clubs:{[club]:true}},{merge:true});
      b.set(fs.doc('clubs/'+club+'/members/'+u.uid),{uid:u.uid,email:(u.email||'').toLowerCase(),roles:['gestor'],invite:code,at:Date.now()}); await b.commit(); },
    async getColl(p){ const q=await fs.collection(CP(p)).get(); const o={}; q.forEach(d=>o[d.id]=d.data()); return o; },
    async relink(){ if(ROOT) return null; const u=auth.currentUser; const email=(u.email||'').toLowerCase(); const q=await fs.collection(CP('claims')).where('email','==',email).limit(1).get();
      if(q.empty) return null; const d=q.docs[0];
      if(d.data().uid!==u.uid){ const b=fs.batch(); b.set(d.ref,{uid:u.uid,email,at:Date.now()}); b.set(pathRef('users/'+u.uid),{pid:d.id,email}); await b.commit(); }
      return d.id; },
    async idToken(){ return auth.currentUser? auth.currentUser.getIdToken() : null; },
    async getDoc(p){ const x=await pathRef(p).get(); return x.exists? x.data() : null; },
    merge:(p,obj)=>pathRef(p).set(clone(obj),{merge:true}),
    async addPushToken(pid,token){ return pathRef('pushTokens/'+pid).set({tokens:firebase.firestore.FieldValue.arrayUnion(token),at:Date.now()},{merge:true}); },
    async isAdmin(email,uid){ try{ const [a,b]=await Promise.all([pathRef('admins/'+uid).get(), pathRef('admins/'+email).get()]); return a.exists||b.exists; }catch(e){ return false; } }
  };
}
function authMsg(e){ if(e?.code==='auth/unauthorized-domain') return 'Este dominio no está autorizado en Firebase > Authentication > Configuración'; return 'No se ha podido entrar: '+(e?.code||e?.message||'error'); }
let B;
if(CFG.firebase && CFG.firebase.apiKey && !window.firebase){ showFatal('No se han podido cargar las librerías de Firebase.', 'Comprueba la conexión a internet y que index.html incluye las tres líneas de gstatic.com/firebasejs.'); throw new Error('firebase-missing'); }
try{ B = (window.firebase && CFG.firebase && CFG.firebase.apiKey) ? makeFirebase() : makeDemo(); }
catch(e){ showFatal(e.code||e.message, CONFIG_HINT); throw e; }

