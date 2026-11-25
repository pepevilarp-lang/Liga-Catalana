/* =====================================================================
   Instalar la app en el móvil, con el mínimo de pasos posible
   - Android (Chrome, Samsung, Edge): un toque, con la ventana oficial del sistema (beforeinstallprompt).
   - iPhone: Apple no deja instalar desde una web; se guía paso a paso con una flecha que señala el botón de Safari.
   - Navegador dentro de WhatsApp, Instagram, Gmail…: desde ahí no se puede instalar ni entrar con Google;
     se avisa arriba y se ofrece abrir la app en Safari o Chrome.
   API: instSheet(motivo) abre la guía · maybeInstallSheet(motivo) la abre sola si toca.
   Depende de app.js: isIOS, isStandalone, installEvt, toast.
   ===================================================================== */
(function () {
  const UA = navigator.userAgent || '';
  const android = /android/i.test(UA);
  const ios = () => typeof isIOS === 'function' ? isIOS() : /iphone|ipad|ipod/i.test(UA);
  const standalone = () => typeof isStandalone === 'function' ? isStandalone() : matchMedia('(display-mode: standalone)').matches;
  const iosVer = () => +((/OS (\d+)_/.exec(UA) || [])[1] || 0);
  const iosBrowser = () => /CriOS/.test(UA) ? 'chrome' : /FxiOS|EdgiOS|OPiOS/.test(UA) ? 'other' : 'safari';
  // Navegadores dentro de otras apps: el de WhatsApp, Instagram, Facebook, Gmail/Google, LinkedIn, TikTok…
  function inApp() {
    if (standalone()) return '';
    const m = /(WhatsApp|Instagram|FBAN|FBAV|FB_IAB|LinkedInApp|GSA\/|Snapchat|musical_ly|TikTok|Twitter|Line\/)/i.exec(UA);
    if (m) return /whatsapp/i.test(m[1]) ? 'WhatsApp' : /instagram/i.test(m[1]) ? 'Instagram' : /FB/.test(m[1]) ? 'Facebook' : /GSA/.test(m[1]) ? 'la app de Google' : /linkedin/i.test(m[1]) ? 'LinkedIn' : /tiktok|musical/i.test(m[1]) ? 'TikTok' : 'otra app';
    if (ios() && !/Safari\//.test(UA)) return 'otra app';
    if (android && /; wv\)/.test(UA)) return 'otra app';
    return '';
  }
  const mobile = () => ios() || android;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const here = () => location.href.replace(/#$/, '');
  const ls = { get: k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

  const SHARE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 12v8h14v-8"/></svg>';
  const DOTS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
  const PLUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';

  function steps(list) { return `<ol class="ins-steps">${list.map((s, i) => `<li style="--i:${i}"><span class="ins-n">${i + 1}</span><span class="ins-t">${s}</span></li>`).join('')}</ol>`; }

  // Contenido según el móvil y el navegador. arrow: dónde señalar ('br' abajo derecha, 'bc' abajo centro, 'tr' arriba derecha)
  function content() {
    const app = inApp(), url = here(), host = location.host, path = location.pathname + location.search + location.hash;
    if (app) {
      const open = android
        ? `<a class="btn brass ins-big" href="intent://${esc(host + path)}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end">Abrir en Chrome</a>`
        : `<a class="btn brass ins-big" href="x-safari-${esc(url)}">Abrir en Safari</a>`;
      return { title: 'Ábrela en ' + (android ? 'Chrome' : 'Safari'), arrow: '',
        body: `<p>Estás viendo Lliga Catalana dentro de ${esc(app)}. Desde ahí no se puede instalar ni entrar con Google.</p>${open}
          <button class="btn ghost ins-big" data-ins="copy">Copiar el enlace</button>
          <p class="ins-small">Si no se abre, toca ${DOTS} o el menú de ${esc(app)} y elige «Abrir en el navegador», o pega el enlace en ${android ? 'Chrome' : 'Safari'}.</p>` };
    }
    if (android) {
      if (window.installEvt || (typeof installEvt !== 'undefined' && installEvt)) return { title: 'Instala la app', arrow: '',
        body: `<p>Un toque y la tienes en la pantalla principal, a pantalla completa y con avisos.</p><button class="btn brass ins-big" data-ins="install">Instalar</button>` };
      return { title: 'Instala la app', arrow: 'tr', body: steps([`Toca el menú ${DOTS} de arriba a la derecha`, '<b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>', 'Confirma con <b>Instalar</b>']) };
    }
    if (ios()) {
      const b = iosBrowser();
      if (b === 'chrome') return { title: 'Añádela a la pantalla de inicio', arrow: 'tr',
        body: steps([`Toca ${SHARE} <b>Compartir</b>, en la barra de direcciones (arriba a la derecha)`, `Elige ${PLUS} <b>Añadir a pantalla de inicio</b>`, 'Toca <b>Añadir</b>']) };
      if (b === 'other') return { title: 'Ábrela en Safari', arrow: '',
        body: `<p>Para instalarla en el iPhone, ábrela en Safari.</p><a class="btn brass ins-big" href="x-safari-${esc(url)}">Abrir en Safari</a><button class="btn ghost ins-big" data-ins="copy">Copiar el enlace</button>` };
      const v26 = iosVer() >= 26;
      return { title: 'Añádela a la pantalla de inicio', arrow: v26 ? 'br' : 'bc',
        body: steps(v26
          ? [`Toca ${DOTS} abajo a la derecha`, `Toca ${SHARE} <b>Compartir</b>`, `Baja y elige ${PLUS} <b>Añadir a pantalla de inicio</b>`, 'Toca <b>Añadir</b>: ya la tienes como una app']
          : [`Toca ${SHARE} <b>Compartir</b>, abajo en el centro`, `Baja y elige ${PLUS} <b>Añadir a pantalla de inicio</b>`, 'Toca <b>Añadir</b>: ya la tienes como una app']) };
    }
    return null;
  }

  function close() { const s = document.getElementById('ins'); if (!s) return; s.classList.remove('on'); setTimeout(() => s.remove(), 260); }
  function instSheet(reason) {
    if (standalone()) { if (typeof toast === 'function') toast('Ya la tienes instalada'); return; }
    const c = content(); if (!c) return;
    close(); document.getElementById('ins')?.remove();
    const d = document.createElement('div'); d.id = 'ins'; d.className = 'ins'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', c.title);
    d.innerHTML = `<div class="ins-bg" data-ins="close"></div><div class="ins-card"><button class="ins-x" data-ins="close" aria-label="Cerrar">✕</button>
      <div class="ins-ic"><img src="/icons/icon-192.png" alt="" width="64" height="64"></div><h2>${c.title}</h2>${c.body}
      <button class="ins-later" data-ins="close">Ahora no</button></div>${c.arrow ? `<div class="ins-arrow ins-${c.arrow}" aria-hidden="true"></div>` : ''}`;
    document.body.appendChild(d); requestAnimationFrame(() => d.classList.add('on'));
    const st = ls.get('lc-inst') || { n: 0 }; ls.set('lc-inst', { n: (st.n || 0) + 1, at: Date.now(), last: reason || '' });
    try { window.dxTrack && dxTrack('instalar-guia', { motivo: reason || '', plataforma: android ? 'android' : ios() ? 'ios' : 'otro', dentro_de: inApp() || '' }); } catch (e) {}
  }
  // Se abre sola: al entrar (si la app no está instalada) y después de la primera disponibilidad. Máximo 3 veces y no
  // más de una cada 2 días (desde otra app, siempre que se entra: sin abrirla en el navegador no se puede seguir)
  function maybeInstallSheet(reason) {
    if (!mobile() || standalone() || document.getElementById('ins')) return;
    if (document.getElementById('onb') || document.body.classList.contains('tour-on') || document.querySelector('.cropper.on, .pmodal.on')) return;
    const st = ls.get('lc-inst') || { n: 0, at: 0 };
    if (!inApp() && (st.n >= 3 || Date.now() - (st.at || 0) < 2 * 864e5)) return;
    setTimeout(() => instSheet(reason), reason === 'avail' ? 900 : 1200);
  }
  // Aviso fijo arriba cuando se abre dentro de otra app (también en la pantalla de entrada, antes de Google)
  function inAppBanner() {
    const app = inApp(); if (!app || document.getElementById('inapp')) return;
    const b = document.createElement('div'); b.id = 'inapp'; b.className = 'inapp';
    b.innerHTML = `<span>Estás dentro de ${esc(app)}: para entrar con Google y poder instalarla, ábrela en ${android ? 'Chrome' : 'Safari'}.</span><button data-ins="open">Abrir</button>`;
    document.body.appendChild(b); document.body.classList.add('has-inapp');
  }

  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-ins]'); if (!el) return; const a = el.dataset.ins;
    if (a === 'close') close();
    else if (a === 'open') instSheet('dentro-de-otra-app');
    else if (a === 'copy') { try { await navigator.clipboard.writeText(here()); el.textContent = 'Enlace copiado ✓'; } catch (err) { prompt('Copia este enlace:', here()); } }
    else if (a === 'install') { const ev = typeof installEvt !== 'undefined' ? installEvt : null; if (!ev) return close(); ev.prompt(); const c = await ev.userChoice.catch(() => null); try { installEvt = null; } catch (err) {} close(); if (c && c.outcome === 'accepted' && typeof toast === 'function') toast('Instalando…'); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inAppBanner); else inAppBanner();

  window.instSheet = instSheet; window.maybeInstallSheet = maybeInstallSheet; window.lcInApp = inApp;
})();
