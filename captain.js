/* =====================================================================
   Herramientas del capitán
   - Documentos a mano: listado de jugadores, calendario, documentación de la FCT y actas.
   - Rotación: jornadas jugadas por cada jugador, disponibilidad y mínimo de jornadas.
   - Sugerencia de convocatoria: siempre es una propuesta. No se guarda nada hasta que
     el capitán pulsa «Guardar borrador» o «Publicar» en la convocatoria.
   Todo sale de los datos de la temporada (S.ties, S.fixtures, disponibilidad, clasificación).
   ===================================================================== */

const CAP_DEF = { on: true, minJ: 0, maybe: false, focus: 'equilibrio', order: 'pts' };
const CAP_FOCUS = { ganar: 'Ganar la eliminatoria', equilibrio: 'Equilibrio', rotar: 'Repartir jornadas' };
function capCfg(d) { return { ...CAP_DEF, ...(((d || S).rules || {}).suggest || {}) }; }

/* ---------- datos ---------- */
const capFixtures = () => S.fixtures.filter(f => f.home === POLO || f.away === POLO).sort((a, b) => kickoff(a) - kickoff(b) || a.j - b.j);
function capPlayedIn(j) {   // quién jugó de verdad (partido con resultado, sin W.O.)
  const out = { S: new Set(), D: new Set() };
  (tie(j)?.rubbers || []).forEach(r => { if (isWO(r) || !rubberCalc(r).res) return; (r.polo || []).forEach(p => out[r.type === 'D' ? 'D' : 'S'].add(p)); });
  return out;
}
function capDone(f) { return isPlayed(f) || capPlayedIn(f.j).S.size > 0; }
function capRemaining(fromJ) { return capFixtures().filter(f => !capDone(f) || f.j === fromJ).length; }
function capRow(pid, skipJ) {
  const r = { pid, jug: 0, ind: 0, dob: 0, cells: [] }, a = availStats(pid);
  capFixtures().forEach(f => {
    const v = avOf(pid, f.j)?.s || 'none';
    if (f.j === skipJ || !capDone(f)) { r.cells.push({ j: f.j, k: 'fu', v }); return; }
    const pl = capPlayedIn(f.j), s = pl.S.has(pid), d = pl.D.has(pid);
    if (s || d) r.jug++; if (s) r.ind++; if (d) r.dob++;
    r.cells.push({ j: f.j, k: s || d ? 'pl' : v === 'yes' ? 'av' : v === 'no' ? 'no' : v === 'maybe' ? 'mb' : 'nr', v, s, d });
  });
  const st = playerStats(pid), sd = playerStats(pid, null, 'D');
  r.w = st.w + sd.w; r.l = st.l + sd.l;
  r.av = a; r.benched = r.cells.filter(c => c.k === 'av').length;   // disponible y no jugó
  const c = capCfg(), left = capRemaining(skipJ);
  r.need = c.minJ ? Math.max(0, c.minJ - r.jug) : 0; r.left = left;
  r.st = !c.minJ ? '' : !r.need ? 'ok' : r.need > left ? 'imp' : r.need === left ? 'crit' : r.need / Math.max(1, left) >= .5 ? 'risk' : 'low';
  return r;
}

// Fuerza de un rival: 1 = líder, 0 = último (solo rivales, sin contar al equipo)
function capRivalStrength(rid) {
  const st = standings().filter(x => x.id !== POLO);
  if (!st.some(x => x.pj)) return .5;
  const i = st.findIndex(x => x.id === rid); if (i < 0 || st.length < 2) return .5;
  return 1 - i / (st.length - 1);
}
const capStrLabel = s => s >= .67 ? 'de la parte alta' : s <= .33 ? 'de la parte baja' : 'de la zona media';

// Nivel de un jugador: resultados de la temporada ponderados por la fuerza del rival,
// mezclados con su ranking (puntos FCT u orden de la plantilla) cuando hay pocos partidos
function capRating(pid) {
  const roster = S.players.filter(p => p.active !== false), me_ = player(pid) || {};
  const maxPts = Math.max(0, ...roster.map(p => +p.pts || 0));
  const ord = roster.slice().sort((a, b) => (a.order || 99) - (b.order || 99)).findIndex(p => p.id === pid);
  const prior = maxPts > 0 ? (+me_.pts || 0) / maxPts : roster.length > 1 ? 1 - Math.max(0, ord) / (roster.length - 1) : .5;
  const one = kind => { const st = playerStats(pid, null, kind); let aw = 0, al = 0, sw = 0, sn = 0;
    st.matches.forEach(m => { const f = poloFix(m.j); const s = f ? capRivalStrength(persp(f).rival) : .5, W = m.c.res === 'W';
      if (W) aw += .6 + .8 * s; else al += 1.4 - .8 * s; if (s >= .67) { sn++; if (W) sw++; } });
    return { st, perf: (aw + 1) / (aw + al + 2), n: st.pj, sw, sn }; };
  const S1 = one('S'), D1 = one('D'), a = S1.n / (S1.n + 3), ad = D1.n / (D1.n + 3);
  const rating = a * S1.perf + (1 - a) * prior;
  return { rating, dbl: ad * D1.perf + (1 - ad) * rating, prior, s: S1, d: D1 };
}

/* ---------- sugerencia ---------- */
function capSuggest(j) {
  const c = capCfg(), f = poloFix(j); if (!f) return null;
  const rival = persp(f).rival, rs = capRivalStrength(rival), av = availFor(j);
  const pool = [...av.yes, ...(c.maybe ? av.maybe : [])].filter(pid => player(pid));
  const wRot = { ganar: .15, equilibrio: .55, rotar: 1.1 }[c.focus] ?? .55;
  const P = {}; pool.forEach(pid => { const R = capRating(pid), rot = capRow(pid, j);
    const urg = rot.need ? rot.need / Math.max(1, rot.left) : 0;
    const must = !!(c.minJ && rot.need && rot.need >= rot.left);
    // contra rivales flojos pesa más dar jornadas; contra los fuertes, el nivel
    P[pid] = { pid, R, rot, urg, must, score: R.rating + wRot * urg * (1.15 - rs) + (must ? 5 : 0) }; });
  const ranked = Object.values(P).sort((x, y) => y.score - x.score);
  const singles = ranked.slice(0, 4).map(x => x.pid);
  const hasPts = singles.some(pid => (+player(pid)?.pts || 0) > 0);
  if (c.order === 'pts' && hasPts) singles.sort((a, b) => (+player(b).pts || 0) - (+player(a).pts || 0) || P[b].R.rating - P[a].R.rating);
  else singles.sort((a, b) => P[b].R.rating - P[a].R.rating);
  // dobles: mejor pareja entre los disponibles (historial juntos + nivel en dobles + jornadas que les faltan)
  let dbl = [], best = -1; const cand = ranked.slice(0, 8).map(x => x.pid);
  for (let i = 0; i < cand.length; i++) for (let k = i + 1; k < cand.length; k++) {
    const a = P[cand[i]], b = P[cand[k]], h = a.R.d.st.partners[b.pid];
    const tog = h ? ((h.w + 1) / (h.w + h.l + 2) - .5) * Math.min(1, (h.w + h.l) / 3) : 0;
    const rot = [a, b].reduce((s, x) => s + (singles.includes(x.pid) ? 0 : wRot * x.urg * (1.15 - rs) + (x.must ? 5 : 0)), 0);
    const sc = (a.R.dbl + b.R.dbl) / 2 + tog + rot;
    if (sc > best) { best = sc; dbl = [a.pid, b.pid]; }
  }
  const used = new Set([...singles, ...dbl]);
  const subs = ranked.filter(x => !used.has(x.pid)).slice(0, 1).map(x => x.pid);
  // motivos (lo que el capitán necesita para decidir, sin adornos)
  const why = {}; Object.values(P).forEach(x => { const w = [], st = x.R.s.st;
    if (x.must) w.push(`Le faltan ${x.rot.need} ${x.rot.need === 1 ? 'jornada' : 'jornadas'} para el mínimo y quedan ${x.rot.left}`);
    else if (x.rot.need) w.push(`Ha jugado ${x.rot.jug} de ${c.minJ} jornadas mínimas; quedan ${x.rot.left}`);
    if (st.pj) w.push(`Individuales: ${st.w}-${st.l}${x.R.s.sn ? `, ${x.R.s.sw}-${x.R.s.sn - x.R.s.sw} contra rivales de la parte alta` : ''}`);
    else w.push('Sin individuales esta temporada' + ((+player(x.pid)?.pts || 0) > 0 ? `, ${player(x.pid).pts} puntos FCT` : ''));
    if (x.rot.benched >= 2) w.push(`${x.rot.benched} jornadas disponible sin jugar`);
    if (avOf(x.pid, j)?.s === 'maybe') w.push('Pendiente de confirmar');
    why[x.pid] = w; });
  const dbWhy = (() => { const h = P[dbl[0]]?.R.d.st.partners[dbl[1]]; return h ? `Juntos en dobles: ${h.w}-${h.l}` : dbl.length === 2 ? 'No han jugado juntos esta temporada' : ''; })();
  const warn = [];
  if (pool.length < 4) warn.push(`Solo hay ${pool.length} ${pool.length === 1 ? 'jugador disponible' : 'jugadores disponibles'}${c.maybe ? '' : ' (los pendientes de confirmar no cuentan)'}. Faltan para cubrir los 4 individuales.`);
  if (c.minJ) S.players.filter(p => p.active !== false && !P[p.id]).forEach(p => { const r = capRow(p.id, j);
    if (r.need && r.need >= r.left) warn.push(`${p.name} necesita jugar ${r.need === 1 ? 'esta jornada' : 'las ' + r.left + ' que quedan'} para llegar al mínimo y no está disponible.`); });
  Object.values(P).filter(x => x.must && !used.has(x.pid)).forEach(x => warn.push(`${pname(x.pid)} necesita jugar y no entra en la propuesta: hay más jugadores en su situación que plazas.`));
  return { j, singles, dbl, subs, why, dbWhy, warn, rs, rival, pool: pool.length, c };
}

/* ---------- vistas ---------- */
function capSuggestBlock(j) {
  ensureCapCss(); const c = capCfg(), f = poloFix(j);
  if (!c.on || !f || capDone(f)) return '';
  const av = availFor(j), sg = capSuggest(j);
  if (!sg || sg.pool < 2) return `<div class="cap-sug"><div class="cs-h"><b>Sugerencia de convocatoria</b><span class="cs-tag">Propuesta</span></div><p class="muted small" style="margin:6px 0 0">Aparecerá cuando haya jugadores disponibles (${av.yes.length} de ${av.total} por ahora).</p></div>`;
  const row = (lbl, ids, note) => `<li><span class="cs-l">${lbl}</span><span class="cs-p">${ids.map(pid => `<span class="cs-who">${avatar(player(pid), 'sm')}<span><b>${esc(pname(pid))}</b><small>${esc((sg.why[pid] || []).slice(0, 2).join('. '))}</small></span></span>`).join('')}${note ? `<em class="cs-note">${esc(note)}</em>` : ''}</span></li>`;
  const ctx = [`${clubName(sg.rival)}, rival ${capStrLabel(sg.rs)}`, `prioridad: ${CAP_FOCUS[c.focus] || c.focus}`, c.minJ ? `mínimo ${c.minJ} ${c.minJ === 1 ? 'jornada' : 'jornadas'} por jugador` : 'sin mínimo de jornadas'];
  return `<div class="cap-sug" id="cap-sug"><div class="cs-h"><b>Sugerencia de convocatoria</b><span class="cs-tag">Propuesta, decides tú</span></div>
    <p class="cs-ctx">${esc(ctx.join(' · '))}</p>
    <ol class="cs-list">${sg.singles.map((pid, i) => row('Individual ' + (i + 1), [pid])).join('')}${sg.dbl.length === 2 ? row('Dobles', sg.dbl, sg.dbWhy) : ''}${sg.subs.length ? row('Suplente', sg.subs) : ''}</ol>
    ${sg.warn.length ? `<ul class="cs-warn">${sg.warn.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
    <div class="row" style="margin-top:12px"><button class="btn brass sm" data-cx="apply" data-j="${j}">Usar esta propuesta</button><button class="btn ghost sm" data-cx="settings">Cambiar criterios</button></div>
    <p class="muted small cs-foot">Se calcula con los resultados de la temporada (pesan más las victorias contra rivales fuertes), los puntos FCT, la disponibilidad y vuestras reglas. ${c.order === 'pts' ? 'Los individuales se ordenan por puntos FCT. ' : ''}Al usarla solo se rellena la convocatoria de abajo: no se guarda ni se publica nada hasta que pulses el botón.</p></div>`;
}

// Borrador aplicado (sin guardar): aConv lo usa en lugar de lo guardado
function capDraft(j) { const d = ui.capDraft; return d && d.j === j ? d : null; }
function capDraftNote(j) { return capDraft(j) ? `<div class="notice cs-draft"><b>Propuesta aplicada, sin guardar.</b> Cambia lo que quieras y pulsa «Guardar borrador» o «Publicar convocatoria». <button class="textlink" data-cx="discard">Descartar</button></div>` : ''; }

function capRotation() {
  ensureCapCss(); const c = capCfg(), fx = capFixtures(), done = fx.filter(capDone).length, left = fx.length - done;
  const rows = S.players.filter(p => p.active !== false).map(p => capRow(p.id));
  const key = ui.capSort || 'jug', dir = key === 'jug' || key === 'need' ? 1 : -1;
  const val = r => key === 'jug' ? r.jug : key === 'need' ? -r.need : key === 'disp' ? (r.av.pct ?? -1) : key === 'bench' ? r.benched : key === 'wl' ? (r.w + r.l ? r.w / (r.w + r.l) : -1) : r.jug;
  rows.sort((a, b) => dir * (val(a) - val(b)) || (player(a.pid).order || 0) - (player(b.pid).order || 0));
  const under = rows.filter(r => r.need), crit = rows.filter(r => r.st === 'crit' || r.st === 'imp');
  const th = (k, l) => `<th><button data-cx="sort" data-v="${k}">${l}${key === k ? ' ↓' : ''}</button></th>`;
  const stLbl = r => !c.minJ ? '' : r.st === 'ok' ? '<span class="cr-ok">Cumplido</span>' : r.st === 'imp' ? `<span class="cr-imp">No llega (le faltan ${r.need})</span>` : r.st === 'crit' ? `<span class="cr-crit">Debe jugar todas (${r.need})</span>` : `<span class="cr-${r.st}">Le ${r.need === 1 ? 'falta 1' : 'faltan ' + r.need}</span>`;
  const cell = x => `<i class="rc ${x.k}" title="J${x.j}: ${x.k === 'pl' ? 'jugó' + (x.s && x.d ? ' individual y dobles' : x.d ? ' dobles' : ' individual') : x.k === 'fu' ? 'por jugar' + (x.v !== 'none' ? ', ' + AV_LABEL[x.v].toLowerCase() : '') : x.k === 'av' ? 'disponible, no jugó' : x.k === 'no' ? 'no disponible' : x.k === 'mb' ? 'pendiente, no jugó' : 'sin respuesta'}"></i>`;
  return `<section class="sec"><p class="lede" style="margin-top:0">Cuántas jornadas ha jugado cada uno, cuándo ha estado disponible y a quién le faltan partidos. Te sirve para preparar la convocatoria; la app no decide por ti.</p>
    <div class="figs stagger"><div class="fig"><b>${done}</b><span>jornadas disputadas</span></div><div class="fig"><b>${left}</b><span>por jugar</span></div>
      <div class="fig"><b>${c.minJ || '–'}</b><span>${c.minJ ? 'jornadas mínimas por jugador' : 'sin mínimo de jornadas'} <button class="textlink" data-cx="settings">${c.minJ ? 'Cambiar' : 'Fijar'}</button></span></div>
      ${c.minJ ? `<div class="fig"><b>${under.length}</b><span>por debajo del mínimo${crit.length ? `, ${crit.length} sin margen` : ''}</span></div>` : ''}</div></section>
  ${crit.length ? `<section class="sec"><div class="notice"><b>Sin margen:</b> ${crit.map(r => esc(pname(r.pid)) + (r.st === 'imp' ? ' (ya no llega)' : ' (tiene que jugar todas las que quedan)')).join(', ')}.</div></section>` : ''}
  <section class="sec"><div class="tscroll"><table class="cap-rot"><thead><tr><th>Jugador</th>${th('jug', 'Jugadas')}<th>Ind.</th><th>Dob.</th>${th('disp', 'Disponible')}${th('bench', 'Disp. sin jugar')}${th('wl', 'V-D')}${c.minJ ? th('need', 'Mínimo') : ''}<th class="l">Jornada a jornada</th></tr></thead><tbody class="stagger">
    ${rows.map(r => `<tr><td>${plink(r.pid)}</td><td><b>${r.jug}</b></td><td>${r.ind}</td><td>${r.dob}</td><td>${r.av.total ? `${r.av.yes}/${r.av.total}` : '–'}</td><td>${r.benched || '–'}</td><td>${r.w + r.l ? r.w + '-' + r.l : '–'}</td>${c.minJ ? `<td>${stLbl(r)}</td>` : ''}<td class="l"><span class="rstrip">${r.cells.map(cell).join('')}</span></td></tr>`).join('')}</tbody></table></div>
    <div class="legend"><span><i style="background:var(--win)"></i>Jugó</span><span><i style="background:var(--brass)"></i>Disponible, no jugó</span><span><i style="background:var(--loss)"></i>No disponible</span><span><i style="background:var(--surface2)"></i>Sin respuesta</span><span><i style="background:transparent;box-shadow:inset 0 0 0 1.5px var(--line)"></i>Por jugar</span></div>
    <p class="muted small" style="margin-top:10px">«Jugadas» cuenta las jornadas con al menos un partido con resultado (individual o dobles); los W.O. no cuentan. «Disponible» se cuenta sobre las jornadas con el plazo cerrado.</p></section>`;
}

function capSettings() {
  ensureCapCss(); const c = capCfg();
  const sel = (k, opts) => `<select data-cx-set="${k}">${opts.map(([v, l]) => `<option value="${v}" ${String(c[k]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return `<div class="cap-set">
    <label class="row" style="gap:10px;flex-wrap:nowrap;align-items:flex-start"><input type="checkbox" data-cx-set="on" ${c.on ? 'checked' : ''}> <span><b>Mostrar la sugerencia</b> en la convocatoria.<br><span class="muted small">Es solo una propuesta: no guarda ni publica nada. Si la desactivas, la convocatoria queda como siempre.</span></span></label>
    <div class="sgrid" style="margin-top:12px">
      <label>Jornadas mínimas por jugador${sel('minJ', [[0, 'Sin mínimo'], [1, '1 jornada'], [2, '2 jornadas'], [3, '3 jornadas'], [4, '4 jornadas'], [5, '5 jornadas'], [6, '6 jornadas']])}</label>
      <label>Prioridad${sel('focus', [['ganar', 'Ganar la eliminatoria'], ['equilibrio', 'Equilibrio'], ['rotar', 'Repartir jornadas']])}</label>
      <label>Orden de los individuales${sel('order', [['pts', 'Por puntos FCT'], ['nivel', 'Por resultados de la temporada']])}</label>
      <label>Pendientes de confirmar${sel('maybe', [['false', 'No contar con ellos'], ['true', 'Contar con ellos']])}</label></div>
    <p class="muted small" style="margin:10px 0 0">Con «Repartir jornadas», contra rivales de la parte baja entra antes quien está por debajo del mínimo; contra los de arriba pesa más el nivel. Quien ya no tiene margen para llegar al mínimo entra siempre que esté disponible.</p></div>`;
}
function capSettingsSub() { const c = capCfg(); return c.on ? `Sugerencia activada · ${c.minJ ? 'mínimo ' + c.minJ + (c.minJ === 1 ? ' jornada' : ' jornadas') : 'sin mínimo'} · ${(CAP_FOCUS[c.focus] || '').toLowerCase()}` : 'Sugerencia desactivada'; }

// Documentos a mano (cabecera de Gestión)
const CAP_DOCS = [['plantilla', 'Listado de jugadores', 'equipo'], ['calendario', 'Calendario', 'calendario'], ['competicion', 'Documentación FCT', ''], ['acta', 'Última acta', '']];
function capDocsStrip() {
  ensureCapCss(); ensureDocsSub(); const g = Object.values(docGroups()).map(x => x[0]);
  const latest = k => g.filter(d => d.kind === k).sort((a, b) => (b.j || 0) - (a.j || 0) || (b.at || 0) - (a.at || 0))[0];
  return `<div class="cap-docs" aria-label="Documentos a mano">${CAP_DOCS.map(([k, l, alt]) => { const d = latest(k);
    return `<div class="cd"><span class="cd-i">${d ? docIcon(d) : '＋'}</span><span class="cd-t"><b>${l}</b><small>${d ? esc(d.name) + (d.j ? ', J' + d.j : '') : 'Sin subir'}</small></span>
      <span class="cd-a">${d ? `<button class="btn sm ghost" data-cx="doc" data-id="${esc(d.id)}">Abrir</button>` : `<button class="btn sm ghost" data-cx="up" data-k="${k}">Subir</button>`}${alt && !d ? `<a class="textlink small" href="#${alt}">Ver en la app</a>` : ''}${k === 'plantilla' || k === 'calendario' ? `<button class="textlink small" data-cx="csv" data-k="${k}" title="Hoja de cálculo con los datos actuales de la app">Exportar</button>` : ''}</span></div>`; }).join('')}
    <a class="cd cd-all" href="#docs"><span class="cd-t"><b>Todos los documentos</b><small>${g.length} ${g.length === 1 ? 'archivo' : 'archivos'}</small></span><span aria-hidden="true">›</span></a></div>`;
}
function capCsv(kind) {
  const q = v => { const s = String(v ?? ''); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  let rows, name;
  if (kind === 'plantilla') { name = 'listado-jugadores'; rows = [['Orden', 'Nombre', 'Nombre completo', 'Categoría', 'Puntos FCT', 'Capitán', 'Jornadas jugadas']]
      .concat(S.players.filter(p => p.active !== false).sort((a, b) => a.order - b.order).map(p => [p.order, p.name, p.full, p.cat, p.pts ?? '', (S.captains || []).includes(p.id) ? 'Sí' : '', capRow(p.id).jug])); }
  else { name = 'calendario'; rows = [['Jornada', 'Fecha', 'Hora', 'Local', 'Visitante', 'Resultado', 'Estado']]
      .concat(capFixtures().map(f => [f.j, f.date, f.time || '', clubName(f.home), clubName(f.away), isPlayed(f) ? f.hs + '-' + f.as : '', f.status === 'official' ? 'Oficial' : isPlayed(f) ? 'Provisional' : ''])); }
  const blob = new Blob(['﻿' + rows.map(r => r.map(q).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${name}-${(curTeam()?.short || 'equipo').replace(/\s+/g, '-').toLowerCase()}-${viewSeason}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ---------- eventos ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-cx]'); if (!el) return; const k = el.dataset.cx;
  if (k === 'apply') { if (!canManage) return; const j = +el.dataset.j, sg = capSuggest(j); if (!sg) return;
    const rub = [0, 1, 2, 3].map(i => sg.singles[i] ? [sg.singles[i]] : []).concat([sg.dbl]);
    ui.capDraft = { j, conv: [...new Set([...sg.singles, ...sg.dbl, ...sg.subs])], rub };
    renderQuiet(); setTimeout(() => document.querySelector('.cs-draft')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60); toast('Propuesta aplicada: revísala y guarda'); }
  else if (k === 'discard') { ui.capDraft = null; renderQuiet(); }
  else if (k === 'settings') { ui.adminTab = 'temporadas'; (ui.open ||= {})['s-cap'] = true; if (route() !== 'admin') location.hash = 'admin'; else render(); setTimeout(() => document.querySelector('[data-k="s-cap"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80); }
  else if (k === 'sort') { ui.capSort = el.dataset.v; renderQuiet(); }
  else if (k === 'doc') docDownload(el.dataset.id);
  else if (k === 'up') { ui.docUpKind = el.dataset.k; location.hash = 'docs'; }
  else if (k === 'csv') capCsv(el.dataset.k);
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-cx-set]'); if (!el || !canManage) return; const k = el.dataset.cxSet;
  const v = k === 'on' ? el.checked : k === 'minJ' ? +el.value : k === 'maybe' ? el.value === 'true' : el.value;
  S.rules = { ...S.rules, suggest: { ...capCfg(), [k]: v } };
  saveState(k === 'on' ? (v ? 'Sugerencia activada' : 'Sugerencia desactivada') : 'Criterio guardado');
});

/* ---------- estilos ---------- */
const CAP_CSS = `
.cap-docs{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin:4px 0 18px}
.cap-docs .cd{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:inherit;text-decoration:none;min-width:0}
.cap-docs .cd-i{font-size:1.2rem;width:28px;text-align:center;flex:none;opacity:.85}
.cap-docs .cd-t{display:flex;flex-direction:column;min-width:0;flex:1}
.cap-docs .cd-t b{font-size:.9rem}.cap-docs .cd-t small{color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.76rem}
.cap-docs .cd-a{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex:none}
.cap-docs .cd-all{justify-content:space-between;background:transparent}
.cap-sug{border:1px solid var(--brassLine);border-radius:16px;padding:16px;margin:0 0 22px;background:linear-gradient(180deg,rgba(201,168,90,.09),transparent 70%)}
.cap-sug .cs-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.cap-sug .cs-h b{font-size:1.05rem}
.cap-sug .cs-tag{font-size:.72rem;font-weight:600;padding:3px 8px;border-radius:999px;border:1px solid var(--brassLine);color:var(--brass)}
.cap-sug .cs-ctx{margin:6px 0 10px;color:var(--muted);font-size:.85rem}
.cap-sug .cs-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.cap-sug .cs-list li{display:grid;grid-template-columns:96px 1fr;gap:10px;align-items:start;padding-top:8px;border-top:1px solid var(--line)}
.cap-sug .cs-l{font-size:.78rem;font-weight:600;color:var(--muted);padding-top:8px}
.cap-sug .cs-p{display:flex;flex-direction:column;gap:6px;min-width:0}
.cap-sug .cs-who{display:flex;gap:8px;align-items:center;min-width:0}.cap-sug .cs-who>span{display:flex;flex-direction:column;min-width:0}
.cap-sug .cs-who small{color:var(--muted);font-size:.76rem;line-height:1.3}
.cap-sug .cs-note{font-style:normal;font-size:.76rem;color:var(--muted)}
.cap-sug .cs-warn{margin:12px 0 0;padding-left:18px;font-size:.84rem;color:var(--loss)}
.cap-sug .cs-foot{margin:10px 0 0}
.cs-draft{margin:0 0 16px}
.cap-rot td,.cap-rot th{white-space:nowrap}
.rstrip{display:inline-flex;gap:3px}.rstrip .rc{width:11px;height:11px;border-radius:3px;display:inline-block;background:var(--surface2)}
.rstrip .rc.pl{background:var(--win)}.rstrip .rc.av,.rstrip .rc.mb{background:var(--brass)}.rstrip .rc.no{background:var(--loss)}.rstrip .rc.fu{background:transparent;box-shadow:inset 0 0 0 1.5px var(--line)}
.cr-ok{color:var(--win);font-weight:600}.cr-low{color:var(--muted)}.cr-risk{color:var(--brass);font-weight:600}.cr-crit,.cr-imp{color:var(--loss);font-weight:700}
.cap-set .sgrid select{max-width:100%}
@media(max-width:560px){.cap-sug .cs-list li{grid-template-columns:1fr;gap:4px}.cap-sug .cs-l{padding-top:0}}
`;
function ensureCapCss() { if (document.getElementById('cap-css')) return; const s = document.createElement('style'); s.id = 'cap-css'; s.textContent = CAP_CSS; document.head.appendChild(s); }
