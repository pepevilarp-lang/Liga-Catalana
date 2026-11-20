/* DEMO · solo en la rama «demo». Nunca se fusiona a main.
   - Sin Firebase: todo se guarda en el navegador (modo vista previa de app.js).
   - Las llamadas a /api/* se cortan aquí: nada sale hacia el servidor ni hacia la base de datos real.
   - Fecha simulada: 2 de febrero de 2027 (segunda vuelta), para que haya partidos, encuestas y rivales repetidos.
   - Datos inventados: resultados, rivales y fichas de partido. */
(function () {
  // ---------- Fecha simulada ----------
  const SIM = new Date('2027-02-02T10:00:00').getTime();
  const _D = Date, OFF = SIM - _D.now();
  class DemoDate extends _D {
    constructor(...a) { if (a.length) super(...a); else super(_D.now() + OFF); }
    static now() { return _D.now() + OFF; }
  }
  window.Date = DemoDate;

  // ---------- Nada sale hacia el servidor ----------
  const f0 = window.fetch;
  window.fetch = (u, o) => {
    const s = typeof u === 'string' ? u : (u && u.url) || '';
    if (/^(\/|https?:\/\/[^/]+\/)api\//.test(s)) {
      return Promise.resolve(new Response(JSON.stringify({ ok: false, demo: true, configured: false, clubs: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return f0(u, o);
  };

  // ---------- Personas de la demo ----------
  const WHO = {
    pepe: { uid: 'demo-pepe', email: 'pepe@demo.dossau', name: 'Pepe Vilar', pid: 'pepe-vilar' },          // gestor + jugador
    joan: { uid: 'demo-joan', email: 'joan@demo.dossau', name: 'Joan Villaseca', pid: 'joan-villaseca', noAdmin: true } // jugador
  };
  const VER = '2';
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
  function as(w) {
    ls.set('polo-demo-as', JSON.stringify({ uid: w.uid, email: w.email, name: w.name, noAdmin: !!w.noAdmin }));
    ls.set('lc-privacy-' + w.uid, '2026-11-14');
    ls.set('polo-tour-off', '1');
    ls.set('lc-flow', null);   // sin recorrido de acceso a medias: entra directo
    try { sessionStorage.setItem('polo-intro', '1'); } catch (e) {}
  }
  if (ls.get('lc-demo') !== VER) {
    // Primera visita: vaciar lo que hubiera de la vista previa y entrar como Pepe
    ['polo-preview-v2', 'polo-preview-v2-u'].forEach(k => ls.set(k, null));
    as(WHO.pepe);
  }

  // ---------- Datos inventados ----------
  async function seedAll() {
    const S0 = JSON.parse(JSON.stringify(seed()));
    let k = 11; const rnd = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const some = (a, n) => { const c = a.slice(), o = []; for (let i = 0; i < n && c.length; i++) o.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return o; };
    const g = () => Math.floor(rnd() * 5);
    const sc = w => rnd() < .3 ? (w ? `${g()}-6 6-${g()} 6-${g()}` : `6-${g()} ${g()}-6 ${g()}-6`) : (w ? `6-${g()} 7-6` : `${g()}-6 ${g()}-6`);
    const NAMES = ['Marc Puig', 'Pol Serra', 'Arnau Vidal', 'Jan Roca', 'Oriol Font', 'Biel Mas', 'Nil Soler', 'Guillem Pons', 'Àlex Riera', 'Eric Camps'];
    const P = S0.players.filter(p => p.active !== false).map(p => p.id);
    const OTH = P.filter(p => p !== WHO.pepe.pid && p !== WHO.joan.pid);
    const roster = {}, prof = {};
    S0.fixtures.forEach(f => {
      if (f.date >= '2027-02-01') { f.hs = null; f.as = null; f.status = null; return; }
      const us = f.home === 'polo' || f.away === 'polo';
      if (!us) { const h = Math.floor(rnd() * 6); f.hs = h; f.as = 5 - h; f.status = 'official'; return; }
      const riv = f.home === 'polo' ? f.away : f.home; roster[riv] ||= some(NAMES, 5);
      roster[riv].forEach(n => { prof[riv + n] ||= { hand: rnd() < .25 ? 'Zurdo' : 'Diestro', est: some(['Pega fuerte desde el fondo', 'Muy regular, no falla', 'Sube a la red', 'Cortados y cambios de ritmo', 'Muy físico, lo corre todo'], 1 + (rnd() < .4 ? 1 : 0)), strong: some(['Saque', 'Derecha', 'Revés', 'Volea', 'Resto'], 2), weak: some(['Revés', 'Volea', 'Dejada', 'Globo', 'Remate', 'Saque'], 2), cab: pick(['Se cae', 'Irregular', 'Normal', 'Sólido', 'Muy fuerte']) }; });
      const usW = []; for (let i = 0; i < 5; i++) usW.push(rnd() < .58);
      const ps = usW.filter(Boolean).length; if (f.home === 'polo') { f.hs = ps; f.as = 5 - ps; } else { f.hs = 5 - ps; f.as = ps; } f.status = 'official';
      const rv = some(roster[riv], 4), o = some(OTH, 2);
      const lineup = [[WHO.joan.pid], [WHO.pepe.pid], [o[0]], [o[1]]];
      S0.ties['j' + f.j] = { rubbers: [0, 1, 2, 3].map(i => ({ type: 'S', n: i + 1, polo: lineup[i], score: sc(usW[i]), riv: rv[i] }))
        .concat([{ type: 'D', n: 1, polo: [WHO.joan.pid, WHO.pepe.pid], score: sc(usW[4]), riv: rv[0] + ' / ' + rv[1] }]) };
    });
    const base = 'seasons/' + docIdFor('polo-a', viewSeason);
    await B.set('meta/app', { current: viewSeason, seasons: [viewSeason] });
    await B.set(base, S0);
    const SH = ['Saque', 'Resto', 'Derecha', 'Revés', 'Volea', 'Dejada', 'Globo', 'Remate'];
    const self = {}; P.forEach(pid => { self[pid] = { good: some(SH, 2), bad: some(SH, 2) }; });
    self[WHO.pepe.pid] = { good: ['Derecha', 'Saque'], bad: ['Revés', 'Volea'] };
    self[WHO.joan.pid] = { good: ['Revés', 'Resto'], bad: ['Dejada', 'Remate'] };
    const ballots = {};
    Object.entries(S0.ties).forEach(([kk, t]) => {
      const f = S0.fixtures.find(x => 'j' + x.j === kk && (x.home === 'polo' || x.away === 'polo')); const riv = f.home === 'polo' ? f.away : f.home;
      const pista = some(['Lenta', 'Normal', 'Rápida', 'Mucha tierra suelta'], 1), clima = some(['Perfecto', 'Calor', 'Frío', 'Viento'], 1);
      t.rubbers.forEach((r, i) => {
        r.polo.forEach(pid => {
          const ours = pid === WHO.pepe.pid || pid === WHO.joan.pid; if (!ours && rnd() < .12) return;
          const b = ballots[pid] ||= { j: {} };
          const e = b.j[kk] ||= { a: { q_jornada: 6 + Math.floor(rnd() * 4), q_ambiente: 7 + Math.floor(rnd() * 3) }, x: { v: 1, m: {}, pista, clima }, at: Date.now() };
          const pr = prof[riv + (r.type === 'S' ? r.riv : r.riv.split(' / ')[0])] || { hand: 'Diestro', est: [], strong: ['Saque'], weak: ['Revés'], cab: 'Normal' }, s = self[pid];
          const m = { riv: r.riv, hand: r.type === 'S' ? pr.hand : undefined, est: pr.est,
            mc: some(s.good.concat(pick(SH)), 1 + (rnd() < .6 ? 1 : 0)).filter((v, ii, a) => a.indexOf(v) === ii), lc: some(s.bad, 1),
            rd: some(pr.strong, 1 + (rnd() < .5 ? 1 : 0)), rw: some(pr.weak, 1 + (rnd() < .5 ? 1 : 0)),
            rend: pick(['Mal', 'Normal', 'Bien', 'Bien', 'Muy bien']), fis: pick(['Justo', 'Normal', 'Bien', 'Muy fino']),
            fac: some(['Saque', 'Regularidad', 'Físico', 'Cabeza', 'Errores no forzados', 'Táctica'], 1), cab: rnd() < .7 ? pr.cab : pick(['Se cae', 'Irregular', 'Normal', 'Sólido', 'Muy fuerte']) };
          m.lc = m.lc.filter(v => !m.mc.includes(v)); m.rw = m.rw.filter(v => !m.rd.includes(v)); if (!m.hand) delete m.hand;
          e.x.m[i] = m;
        });
      });
    });
    // Pepe deja sin responder la última jornada: así puede probar la encuesta
    const pj = Object.keys(ballots[WHO.pepe.pid]?.j || {}).sort((a, b) => +b.slice(1) - +a.slice(1))[0];
    if (pj) delete ballots[WHO.pepe.pid].j[pj];
    // …y la anterior la respondió con la encuesta antigua (sin ficha): le sale «Completa la ficha de tu partido»
    const pj2 = Object.keys(ballots[WHO.pepe.pid]?.j || {}).sort((a, b) => +b.slice(1) - +a.slice(1))[0];
    if (pj2) delete ballots[WHO.pepe.pid].j[pj2].x;
    for (const [pid, b] of Object.entries(ballots)) await B.set(base + '/ballots/' + pid, b);
  }

  async function link(w) { as(w); await B.signIn(); await new Promise(r => setTimeout(r, 300)); await B.claim(w.pid); }

  async function boot() {
    if (ls.get('lc-demo') === VER) return;
    const ov = document.createElement('div'); ov.id = 'demo-ov';
    ov.innerHTML = '<div><b>Preparando la demo…</b><small>Datos inventados, solo en este navegador</small></div>';
    document.body.appendChild(ov);
    try {
      await link(WHO.joan);              // Joan queda vinculado a su ficha
      as(WHO.pepe); await B.signIn(); await new Promise(r => setTimeout(r, 300));
      await seedAll();
      await B.claim(WHO.pepe.pid);       // y se entra como Pepe
      ls.set('lc-demo', VER); ls.set('lc-flow', null);
      location.hash = ''; location.reload();
    } catch (e) { ov.innerHTML = '<div><b>No se ha podido preparar la demo</b><small>' + String(e && e.message || e) + '</small></div>'; }
  }

  function bar() {
    const st = document.createElement('style');
    st.textContent = `.demo{display:none!important}
#demo-ov{position:fixed;inset:0;z-index:99999;background:#071510;color:#EAF1EC;display:grid;place-items:center;font:600 16px/1.4 system-ui,sans-serif;text-align:center}
#demo-ov small{display:block;font-weight:400;opacity:.7;margin-top:6px}
#demo-bar{position:fixed;left:10px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:9999;font:600 12px/1.2 system-ui,sans-serif}
#demo-bar>button{background:#C6E65A;color:#121614;border:0;border-radius:999px;padding:8px 12px;box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer;font:inherit}
#demo-bar .p{display:none;margin-top:8px;background:#121614;color:#EEF0EC;border-radius:14px;padding:12px;width:240px;box-shadow:0 8px 30px rgba(0,0,0,.35)}
#demo-bar.o .p{display:block}
#demo-bar .p p{margin:0 0 10px;font-weight:400;color:#8E9792;line-height:1.4}
#demo-bar .p button{display:block;width:100%;text-align:left;margin:6px 0 0;background:#1D2420;color:#EEF0EC;border:1px solid #2b332e;border-radius:10px;padding:9px 10px;cursor:pointer;font:inherit}
#demo-bar .p button b{color:#C6E65A}`;
    document.head.appendChild(st);
    const cur = (() => { try { return JSON.parse(ls.get('polo-demo-as') || '{}').uid; } catch (e) { return ''; } })();
    const d = document.createElement('div'); d.id = 'demo-bar';
    d.innerHTML = `<button data-d="t">DEMO · ${cur === WHO.joan.uid ? 'Joan' : 'Pepe'} ▾</button><div class="p">
      <p>Datos inventados, solo en este navegador. No toca la web real. Fecha simulada: 2 feb 2027.</p>
      <button data-d="pepe">${cur === WHO.pepe.uid ? '<b>●</b> ' : ''}Entrar como Pepe <small>(gestor + jugador)</small></button>
      <button data-d="joan">${cur === WHO.joan.uid ? '<b>●</b> ' : ''}Entrar como Joan <small>(jugador)</small></button>
      <button data-d="yo">Mi informe de jugador</button>
      <button data-d="rival">Informe del próximo rival</button>
      <button data-d="reset">Reiniciar la demo</button></div>`;
    document.body.appendChild(d);
    d.addEventListener('click', async e => {
      const a = e.target.closest('[data-d]')?.dataset.d; if (!a) return;
      if (a === 't') { d.classList.toggle('o'); return; }
      if (a === 'pepe' || a === 'joan') { as(WHO[a]); await B.signIn(); location.hash = ''; location.reload(); return; }
      if (a === 'yo') { location.hash = 'informe-' + (cur === WHO.joan.uid ? WHO.joan.pid : WHO.pepe.pid); d.classList.remove('o'); return; }
      if (a === 'rival') { const f = typeof nextPoloFix === 'function' && nextPoloFix(); location.hash = f ? 'rival-' + f.j : 'inicio'; d.classList.remove('o'); return; }
      if (a === 'reset') { ['lc-demo', 'polo-preview-v2', 'polo-preview-v2-u'].forEach(k => ls.set(k, null)); location.hash = ''; location.reload(); }
    });
  }

  window.addEventListener('load', () => { bar(); setTimeout(boot, 600); });
})();
