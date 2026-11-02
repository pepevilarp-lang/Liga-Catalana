// Envía notificaciones push a los jugadores (Firebase Cloud Messaging).
// Solo pueden llamarla administradores o capitanes de la temporada.
// Necesita en Vercel la variable de entorno FIREBASE_SERVICE_ACCOUNT con el JSON de la cuenta de servicio.
const admin = require('firebase-admin');

function getAdmin() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  return admin;
}
const won = sc => { const s = String(sc || '').split(/[\s,;]+/).map(x => x.match(/^(\d{1,2})[-\/](\d{1,2})$/)).filter(Boolean); let a = 0, b = 0; s.forEach(m => { if (+m[1] > +m[2]) a++; else if (+m[2] > +m[1]) b++; }); return s.length >= 2 && a !== b; };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(501).json({ error: 'not-configured' });
  try {
    const A = getAdmin(), db = A.firestore();
    const idToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = await A.auth().verifyIdToken(idToken);
    const email = String(user.email || '').toLowerCase();
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { type, season, j, origin } = body;
    if (!/^[\w-]{2,20}$/.test(String(season || ''))) return res.status(400).json({ error: 'season' });

    const S = (await db.doc('seasons/' + season).get()).data();
    if (!S) return res.status(404).json({ error: 'season-not-found' });
    const [a1, a2, me] = await Promise.all([db.doc('admins/' + user.uid).get(), db.doc('admins/' + email).get(), db.doc('users/' + user.uid).get()]);
    const myPid = me.exists ? me.data().pid : null;
    const teamOn = (S.rules || {}).teamManage !== false;
    const allowed = a1.exists || a2.exists || (myPid && ((S.captains || []).includes(myPid) || teamOn));
    if (!allowed) return res.status(403).json({ error: 'forbidden' });

    const k = 'j' + j, tie = (S.ties || {})[k] || {};
    const fix = (S.fixtures || []).find(f => +f.j === +j && (f.home === 'polo' || f.away === 'polo'));
    const rivalId = fix ? (fix.home === 'polo' ? fix.away : fix.home) : null;
    const rival = ((S.teams || []).find(t => t.id === rivalId) || {}).name || 'el rival';
    const fecha = fix ? new Date(fix.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
    const active = (S.players || []).filter(p => p.active !== false).map(p => p.id);
    const base = String(origin || '').replace(/\/$/, '') || '';
    let pids = [], title = '', text = '', url = '/';

    if (type === 'avail') { pids = active; title = `¿Juegas la jornada ${j}?`; text = `Polo contra ${rival}, ${fecha} a las ${fix?.time || ''}. Responde en la app.`; url = `/#disponibilidad-${j}`; }
    else if (type === 'availRem') {
      const snap = await db.collection(`seasons/${season}/avail`).get(); const done = new Set();
      snap.forEach(d => { if ((d.data().j || {})[k]) done.add(d.id); });
      pids = active.filter(p => !done.has(p)); title = 'Falta tu disponibilidad'; text = `¿Puedes jugar contra ${rival} el ${fecha}? Responde en un toque.`; url = `/#disponibilidad-${j}`;
    }
    else if (type === 'lineup') {
      const set = new Set([...(tie.convocados || []), ...(tie.subs || []), ...((tie.rubbers || []).flatMap(r => r.polo || []))]);
      pids = [...set]; title = `Convocado para la jornada ${j}`; text = `Polo contra ${rival}, ${fecha}. Mira el orden de juego.`; url = `/#jornada-${j}`;
    }
    else if (type === 'survey') {
      const set = new Set(); (tie.rubbers || []).forEach(r => { if (r.res !== 'NP' && (r.res || won(r.score))) (r.polo || []).forEach(p => set.add(p)); });
      pids = [...set]; title = `Encuesta de la jornada ${j}`; text = `Has jugado contra ${rival}. Cuéntanos qué tal: 2 minutos.`; url = `/#encuesta-${j}`;
    }
    else if (type === 'mvp') { pids = active; title = `🏆 Vota al MVP de la jornada ${j}`; text = `Polo contra ${rival}. Un voto por jugador.`; url = `/#mvp-${j}`; }
    else if (type === 'awards') { pids = active; title = `🏆 MVP de la jornada ${j}`; text = 'Ya tenemos MVP. Entra a descubrirlo.'; url = `/#jornada-${j}`; }
    else return res.status(400).json({ error: 'type' });

    const tokens = [], owner = {};
    const docs = await Promise.all(pids.map(p => db.doc('pushTokens/' + p).get()));
    docs.forEach((d, i) => (d.exists ? d.data().tokens || [] : []).forEach(t => { tokens.push(t); owner[t] = pids[i]; }));
    let sent = 0; const bad = [];
    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500);
      const r = await A.messaging().sendEachForMulticast({ tokens: chunk, data: { title, body: text, url: base + url, tag: `${type}-${k}` }, webpush: { headers: { Urgency: 'high', TTL: '86400' } } });
      sent += r.successCount;
      r.responses.forEach((x, n) => { const c = x.error && x.error.code; if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token' || c === 'messaging/invalid-argument') bad.push(chunk[n]); });
    }
    await Promise.all(bad.map(t => db.doc('pushTokens/' + owner[t]).update({ tokens: A.firestore.FieldValue.arrayRemove(t) }).catch(() => {})));
    const reached = new Set(tokens.filter(t => !bad.includes(t)).map(t => owner[t])).size;
    return res.status(200).json({ recipients: pids.length, reached, sent });
  } catch (e) {
    return res.status(500).json({ error: e.code || e.message });
  }
};
