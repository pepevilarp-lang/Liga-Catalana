/* ===================== CENTRO DE AUTOMATIZACIÓN DEL CAPITÁN =====================
   Lo que la app hace sola para cada jornada (servidor: api/remind.js, dos veces al día) y lo que el capitán comparte
   en el grupo de WhatsApp del equipo. Sin integraciones simuladas: los avisos automáticos llegan por notificación
   de la app y, a quien no la tiene, por correo. WhatsApp: mensajes preparados + enlace del grupo (ver docs/WHATSAPP.md).
   Configuración del equipo en la temporada: S.auto (la edita el capitán) y S.wa = { group, mode }.
   Registro de envíos automáticos: S.autoLog.<jornada> (lo escribe el servidor). */
const AUTO_DEF = { on: false, every: 1, firstAfterH: 24, lastCallH: 48, max: 3, dayBefore: true, sched: true, result: true, email: true };
const CRON_UTC = [8, 16];   // horas (UTC) de las dos ejecuciones diarias de /api/remind (vercel.json)
const WA_GROUP_RE = /^https:\/\/chat\.whatsapp\.com\/(invite\/)?[A-Za-z0-9]{10,40}\/?$/;
function autoCfg(d) { d = d || S; return { ...AUTO_DEF, ...((d.rules || {}).autoRemind || {}), ...(d.auto || {}) }; }
function waCfg(d) { d = d || S; return { group: '', mode: 'both', ...(d.wa || {}) }; }
// Próxima ejecución de la tarea automática a partir de t (ms)
function nextRun(t) {
  const d = new Date(t); for (let i = 0; i < 4; i++) for (const h of CRON_UTC) {
    const c = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + i, h, 0); if (c >= t) return c; }
  return t;
}
const axWhen = ms => { const d = new Date(ms), now = new Date(), day = Math.round((new Date(d.toDateString()) - new Date(now.toDateString())) / 864e5);
  const h = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return (day === 0 ? 'hoy' : day === 1 ? 'mañana' : d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })) + ' a las ' + h; };
const AX_KIND = { avail: 'Recordatorio de disponibilidad', last: 'Último aviso antes del cierre', sched: 'Aviso de cambio de horario', day: 'Recordatorio a los convocados', result: 'Petición del resultado al capitán' };

// Firma de la convocatoria publicada: si cambia después de anunciarla, se ofrece la versión actualizada
function lineupSig(j) { const t = tie(j) || {}; return JSON.stringify([(t.rubbers || []).map(r => [r.type, r.n, r.polo || []]), [...(t.convocados || [])].sort()]); }
function lineupChanged(j) { const t = tie(j) || {}; return !!(t.lineupPub && t.lineupAnnounced && t.lineupSig && t.lineupSig !== lineupSig(j)); }

// Plan de la jornada: qué hará la app y cuándo (estimado con las mismas reglas que el servidor)
function autoPlan(j) {
  const f = poloFix(j), t = tie(j) || blankTie(), a = availFor(j), cfg = autoCfg(), now = Date.now();
  const ko = kickoff(f)?.getTime?.() || new Date(f.date + 'T' + (f.time || '15:00')).getTime(), dl = deadline(j)?.getTime() || ko;
  const log = ((S.autoLog || {})[jid(j)] || []), sent = log.filter(x => x.kind === 'avail' || x.kind === 'last');
  const closed = deadlinePassed(j) || isPlayed(f), items = [];
  // Disponibilidad
  if (!t.availReq && !closed) items.push({ k: 'req', st: 'todo', t: 'Disponibilidad sin pedir', d: 'Pídela y la app se encarga de los recordatorios.' });
  else if (t.availReq && !closed) {
    let next = null, who = a.none.length;
    if (cfg.on && who) {
      const first = sent.length ? sent.at(-1).at + cfg.every * 864e5 - 3 * 36e5 : t.availReq.at + cfg.firstAfterH * 36e5 - 3 * 36e5;
      const lastCall = dl - cfg.lastCallH * 36e5, hadLast = log.some(x => x.kind === 'last');
      const cands = [first, hadLast ? Infinity : lastCall].map(x => nextRun(Math.max(now, x))).filter(x => x < dl);
      next = cands.length ? Math.min(...cands) : null;
    }
    items.push({ k: 'rem', st: !who ? 'done' : cfg.on ? (next ? 'auto' : 'wait') : 'off',
      t: !who ? 'Han respondido todos' : `${who} sin responder`,
      d: !who ? 'Ya no se envían más recordatorios.' : !cfg.on ? 'Los recordatorios automáticos están en pausa.' : next ? `Próximo recordatorio ${axWhen(next)} a quien siga sin responder (máximo ${cfg.max} por persona).` : 'No quedan recordatorios antes del cierre.',
      n: sent.reduce((s, x) => s + (x.n || 0), 0) });
    items.push({ k: 'close', st: 'auto', t: 'Cierre de la disponibilidad', d: `${fmtDT(new Date(dl))}. A partir de ahí se dejan de enviar recordatorios.` });
  } else if (!isPlayed(f)) items.push({ k: 'close', st: 'done', t: 'Disponibilidad cerrada', d: `${a.answered} de ${a.total} respondieron.` });
  // Convocatoria y recordatorio a los convocados
  if (!isPlayed(f)) {
    if (!t.lineupPub) items.push({ k: 'conv', st: 'todo', t: 'Convocatoria pendiente de preparar', d: 'Decides tú quién juega. Al publicarla se avisa a los convocados y se prepara el mensaje y el cartel.' });
    else {
      items.push({ k: 'conv', st: lineupChanged(j) ? 'warn' : 'done', t: lineupChanged(j) ? 'La convocatoria ha cambiado desde que la anunciaste' : 'Convocatoria publicada', d: lineupChanged(j) ? 'Comparte la versión actualizada en el grupo.' : t.lineupAnnounced ? 'Anunciada ' + relTime(t.lineupAnnounced) + '.' : 'Aún no la has compartido en el grupo.' });
      const dayAt = log.find(x => x.kind === 'day');
      if (cfg.dayBefore) items.push({ k: 'day', st: dayAt ? 'done' : cfg.on ? 'auto' : 'off', t: 'Recordatorio a los convocados', d: dayAt ? 'Enviado ' + relTime(dayAt.at) + '.' : cfg.on ? `Saldrá ${axWhen(nextRun(Math.max(now, ko - 36 * 36e5)))} (entre 36 y 6 horas antes).` : 'En pausa.' });
    }
    if (cfg.sched) items.push({ k: 'sched', st: cfg.on ? 'auto' : 'off', t: 'Cambios de fecha u hora', d: 'Si la jornada se mueve, la app avisa sola a los afectados.' });
  }
  // Después del partido
  if (cfg.result) {
    const asked = log.find(x => x.kind === 'result');
    if (!isPlayed(f)) items.push({ k: 'result', st: asked ? 'done' : cfg.on ? 'auto' : 'off', t: 'Pedir el resultado', d: asked ? 'Te lo pedimos ' + relTime(asked.at) + '.' : `Si a las 3 horas del partido no hay resultado, te avisamos (${axWhen(nextRun(Math.max(now, ko + 3 * 36e5)))}).` });
  }
  return { items, log, cfg, next: items.filter(x => x.st === 'auto' && /Próximo|Saldrá|avisamos/.test(x.d)) };
}

function autoCenter(j) {
  if (!canManage || !poloFix(j)) return '';
  ensureMsgCss();   // estilos del interruptor (.sw)
  const P = autoPlan(j), cfg = P.cfg, wa = waCfg(), open = !!ui.axOpen, t = tie(j) || {};
  const ic = { done: svgi('check', 14, 2.6), auto: svgi('clock', 14, 2.2), todo: '•', wait: '…', off: '‖', warn: '!' };
  const logRows = [...P.log].reverse().slice(0, 6).map(x => `<li><b>${esc(AX_KIND[x.kind] || x.kind)}</b><span>${relTime(x.at)} · ${x.n} ${x.n === 1 ? 'persona' : 'personas'}: ${x.push || 0} por notificación${x.email ? ', ' + x.email + ' por correo' : ''}${x.none ? ', ' + x.none + ' sin canal' : ''}</span></li>`).join('');
  return `<section class="sec ax" id="ax-${j}"><div class="ax-card ${cfg.on ? 'on' : 'off'}">
    <div class="ax-head"><div><span class="ax-k">${cfg.on ? 'Automático' : 'En pausa'}</span><h3>Lo que la app gestiona por ti</h3></div>
      <label class="sw" title="${cfg.on ? 'Pausar' : 'Activar'} las automatizaciones del equipo"><input type="checkbox" data-ax="on" ${cfg.on ? 'checked' : ''}><i></i></label></div>
    <ol class="ax-list">${P.items.map(x => `<li class="st-${x.st}"><span class="ax-ic">${ic[x.st] || '•'}</span><div><b>${esc(x.t)}</b><small>${esc(x.d)}</small></div>${x.n ? `<em>${x.n} enviados</em>` : ''}</li>`).join('')}</ol>
    <div class="ax-wa">${wa.group ? `<span>${svgi('mega', 15)} Grupo de WhatsApp vinculado</span><a class="btn ghost sm" href="${esc(wa.group)}" target="_blank" rel="noopener">Abrir el grupo</a>` : `<span class="muted small">Vincula el grupo de WhatsApp del equipo para abrirlo desde aquí con el mensaje copiado.</span><button class="btn ghost sm" data-ax="open">Vincular grupo</button>`}</div>
    <div class="row ax-acts"><button class="btn ghost sm" data-act="ar-now">Ejecutar ahora</button><button class="btn ghost sm" data-ax="open">${open ? 'Ocultar ajustes' : 'Ajustes'}</button>${logRows ? `<button class="btn ghost sm" data-ax="log">${ui.axLog ? 'Ocultar historial' : 'Historial'}</button>` : ''}</div>
    ${ui.axLog && logRows ? `<ul class="ax-log">${logRows}</ul>` : ''}
    ${open ? autoSettings() : ''}
    <p class="ax-foot">Los avisos automáticos llegan como notificación de la app y, a quien no la tenga activada, por correo. Los mensajes para el grupo de WhatsApp los compartes tú: la app los deja preparados.</p>
  </div></section>`;
}

function autoSettings() {
  const c = autoCfg(), wa = waCfg(), sel = (k, opts) => `<select data-ax="${k}">${opts.map(([v, l]) => `<option value="${v}" ${String(c[k]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const chk = (k, l) => `<label class="ax-c"><input type="checkbox" data-ax="${k}" ${c[k] ? 'checked' : ''}> ${l}</label>`;
  return `<div class="ax-set">
    <h4>Recordatorios de disponibilidad</h4>
    <div class="ax-grid"><label>Primer recordatorio${sel('firstAfterH', [[12, '12 h sin responder'], [24, '24 h sin responder'], [48, '48 h sin responder']])}</label>
      <label>Después${sel('every', [[1, 'Cada día'], [2, 'Cada 2 días'], [3, 'Cada 3 días']])}</label>
      <label>Último aviso${sel('lastCallH', [[24, '24 h antes del cierre'], [48, '48 h antes del cierre'], [72, '72 h antes del cierre'], [0, 'Sin último aviso']])}</label>
      <label>Máximo por persona${sel('max', [[1, '1 recordatorio'], [2, '2 recordatorios'], [3, '3 recordatorios'], [4, '4 recordatorios']])}</label></div>
    <h4>Otras comunicaciones automáticas</h4>
    ${chk('dayBefore', 'Recordar a los convocados el día antes')}${chk('sched', 'Avisar si cambia la fecha o la hora de una jornada')}${chk('result', 'Pedirme el resultado si no está a las 3 horas del partido')}${chk('email', 'Usar el correo con quien no tenga activadas las notificaciones')}
    <h4>Grupo de WhatsApp del equipo</h4>
    <div class="row ax-grp"><input type="url" id="ax-group" placeholder="https://chat.whatsapp.com/…" value="${esc(wa.group)}" autocomplete="off"><button class="btn sm" data-ax="group-save">Guardar</button>${wa.group ? '<button class="btn sm ghost" data-ax="group-del">Quitar</button>' : ''}</div>
    <p class="muted small" style="margin:6px 0 10px">En WhatsApp: grupo, «Invitar mediante enlace», «Copiar enlace». Solo lo ven los jugadores del equipo y la gestión del club. La app no lee ni escribe en el grupo: lo abre con el mensaje ya copiado.</p>
    <label class="ax-lbl">Recordatorios por WhatsApp${`<select data-ax="mode">${[['both', 'Al grupo y a cada jugador'], ['group', 'Solo al grupo'], ['individual', 'Solo a cada jugador']].map(([v, l]) => `<option value="${v}" ${wa.mode === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`}</label>
  </div>`;
}

// Etiquetas para la supervisión del gestor (Equipos del club)
function autoBadges(d) {
  const c = autoCfg(d), wa = waCfg(d);
  return `<span class="ccb ${c.on ? 'act-ok' : 'act-idle'}">${c.on ? 'Avisos automáticos' : 'Avisos en pausa'}</span><span class="ccb ${wa.group ? 'act-ok' : 'act-idle'}">${wa.group ? 'Grupo de WhatsApp' : 'Sin grupo'}</span>`;
}

function axSave(patch, msg) { S.auto = { ...(S.auto || {}), ...patch }; saveState(msg || 'Ajustes guardados'); }
document.addEventListener('change', e => {
  const el = e.target.closest('[data-ax]'); if (!el || !canManage) return; const k = el.dataset.ax;
  if (k === 'on') { if (el.checked && !S.auto) S.auto = { ...autoCfg(), on: true }; axSave({ on: el.checked }, el.checked ? 'Automatizaciones activadas' : 'Automatizaciones en pausa'); }
  else if (['every', 'firstAfterH', 'lastCallH', 'max'].includes(k)) axSave({ [k]: +el.value });
  else if (['dayBefore', 'sched', 'result', 'email'].includes(k)) axSave({ [k]: el.checked });
  else if (k === 'mode') { S.wa = { ...waCfg(), mode: el.value }; saveState('Preferencia guardada'); }
});
document.addEventListener('click', e => {
  const el = e.target.closest('button[data-ax]'); if (!el) return; const k = el.dataset.ax;
  if (k === 'open') { ui.axOpen = !ui.axOpen; renderQuiet(); if (ui.axOpen) setTimeout(() => $('#ax-group')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60); }
  else if (k === 'log') { ui.axLog = !ui.axLog; renderQuiet(); }
  else if (k === 'group-save') {
    const v = String($('#ax-group')?.value || '').trim();
    if (!WA_GROUP_RE.test(v)) return toast('Pega el enlace de invitación del grupo: empieza por https://chat.whatsapp.com/');
    S.wa = { ...waCfg(), group: v }; saveState('Grupo vinculado');
  } else if (k === 'group-del') { S.wa = { ...waCfg(), group: '' }; saveState('Grupo desvinculado'); }
  else if (k === 'req-app') { const j = +el.dataset.j; logSend('req', j); notify('avail', j); }
});
