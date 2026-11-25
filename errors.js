/* Registro de errores de la app (el primer script que se carga).
   Cada error de JavaScript en el móvil de un usuario se manda a /api/client-error (registros de Vercel), sin datos
   personales: mensaje, archivo y línea, pantalla (sin ids), versión y club. Si la persona ha aceptado las estadísticas,
   también va a PostHog (Error tracking), con la sesión en la que pasó. */
(function () {
  const MAX = 10, queue = [], seen = {}; let sent = 0, t = null;
  const screen = () => String(location.hash || '#inicio').replace(/^#/, '').replace(/-[\w-]*$/, '') || 'inicio';
  const app = () => (window.DX_ANALYTICS && window.DX_ANALYTICS.app) || (/americana|legends/i.test(location.host) ? 'americana' : 'lliga');
  function flush() {
    t = null; if (!queue.length) return; const errors = queue.splice(0, queue.length);
    const body = JSON.stringify({ errors });
    try { if (!(navigator.sendBeacon && navigator.sendBeacon('/api/client-error', new Blob([body], { type: 'application/json' })))) fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {}); } catch (e) {}
  }
  function report(err, extra) {
    try {
      const msg = String((err && err.message) || err || '').slice(0, 300);
      if (!msg || msg === 'Script error.' || /ResizeObserver loop|Transition was skipped|AbortError|Load failed|NetworkError|Failed to fetch/i.test(msg)) return;
      const src = String((extra && extra.src) || '').replace(location.origin, '');
      if (src && !/^\/[\w.-]*\.js/.test(src) && !/^\/?$/.test(src)) return;   // extensiones del navegador y scripts de terceros
      const key = msg + '|' + src + '|' + ((extra && extra.line) || 0);
      if (seen[key]) { seen[key].n++; return; }
      if (sent >= MAX) return; sent++;
      const e = { msg, src, line: (extra && extra.line) || 0, col: (extra && extra.col) || 0, stack: String((err && err.stack) || '').replace(new RegExp(location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').slice(0, 1200),
        screen: screen(), app: app(), v: window.LC_VERSION || '', club: (window.CLUB && window.CLUB.id) || '', n: 1 };
      seen[key] = e; queue.push(e);
      try { if (window.posthog && window.posthog.captureException && localStorage.getItem('dx-consent-v1') === 'yes') window.posthog.captureException(err instanceof Error ? err : new Error(msg), { pantalla: e.screen, version: e.v }); } catch (x) {}
      if (!t) t = setTimeout(flush, 2000);
    } catch (x) {}
  }
  addEventListener('error', ev => { if (ev && ev.message) report(ev.error || ev.message, { src: ev.filename, line: ev.lineno, col: ev.colno }); });
  addEventListener('unhandledrejection', ev => { const r = ev && ev.reason; report(r instanceof Error ? r : String((r && r.message) || r || 'Promesa rechazada'), {}); });
  addEventListener('pagehide', flush);
  window.lcReportError = report;
})();
