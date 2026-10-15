/* Cuentas atrás por aplicación: sin fechas ficticias ni publicaciones automáticas por vencimiento. */
(() => {
  'use strict';
  const cards = [...document.querySelectorAll('[data-proxima]')];
  if (!cards.length) return;
  const pad = n => String(n).padStart(2, '0');
  const known = new Map();
  // Verde solo cuando una app tiene la publicación habilitada, aprobada y completamente configurada.
  const isConfigured = app => !!app
    && app.publicacionAutomatica === true
    && app.revisionAprobada === true
    && typeof app.repo === 'string'
    && (/^pastranaalex-glitch\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(app.repo) || (app.slug === 'mi-salud-familiar' && app.repo === 'pastranaalex-glitch/pastranaalex-glitch.github.io'))
    && typeof app.versionAprobada === 'string' && app.versionAprobada.trim() !== ''
    && ['android', 'windows'].includes(app.plataforma)
    && typeof app.fechaEstreno === 'string'
    && Number.isFinite(Date.parse(app.fechaEstreno));
  const setAutomation = (card, app) => {
    const el = card.querySelector('.pack6-auto-indicator');
    if (!el) return;
    const enabled = isConfigured(app);
    el.dataset.autoStatus = enabled ? 'active' : 'pending';
    const state = enabled ? 'Publicación automática activada; APK verificado' : (app?.slug === 'mi-salud-familiar' ? (app.apkSubido === true ? 'APK subido a GitHub; verificando su contenido' : 'Programación instalada; pendiente de subir APK a GitHub') : 'Publicación automática pendiente');
    el.title = state;
    el.setAttribute('aria-label', state);
    const label = el.querySelector('[data-auto-label]');
    if (label) label.textContent = enabled ? 'Automatizada' : (app?.slug === 'mi-salud-familiar' ? (app.apkSubido === true ? 'Verificando APK' : 'Esperando APK') : 'Sin automatizar');
  };
  const say = (card, message) => {
    const target = card.querySelector('.pack6-countdown-message');
    if (target && target.textContent !== message) target.textContent = message;
  };
  function tick() {
    const now = Date.now();
    cards.forEach(card => {
      if (card.hidden) return;
      const cfg = known.get(card.dataset.proxima);
      if (!cfg || typeof cfg.fechaEstreno !== 'string') return;
      const date = Date.parse(cfg.fechaEstreno);
      if (!Number.isFinite(date)) return;
      const remaining = Math.max(0, Math.ceil((date - now) / 1000));
      const values = {
        days: Math.floor(remaining / 86400),
        hours: Math.floor((remaining % 86400) / 3600),
        minutes: Math.floor((remaining % 3600) / 60),
        seconds: remaining % 60
      };
      Object.entries(values).forEach(([unit, value]) => {
        const el = card.querySelector('[data-unit="' + unit + '"]');
        if (el) el.textContent = pad(value);
      });
      if (remaining === 0) {
        say(card, 'Fecha prevista alcanzada. Pendiente de confirmar la publicación.');
      } else {
        const dateText = new Intl.DateTimeFormat('es-ES', {timeZone: 'Europe/Madrid',day: 'numeric',month: 'long',year: 'numeric',hour: '2-digit',minute: '2-digit'}).format(date);
        say(card, 'Lanzamiento previsto: ' + dateText + ' (hora de Madrid)');
      }
    });
  }
  async function start() {
    try {
      const [launchResponse, catalogueResponse] = await Promise.all([
        fetch('proximas-apps.json', {cache:'no-store'}),
        fetch('catalogo.json', {cache:'no-store'})
      ]);
      if (catalogueResponse.ok) {
        const catalogue = await catalogueResponse.json();
        const live = new Set((catalogue.aplicaciones || []).filter(a => a && a.publicado === true).map(a => a.slug));
        try{const apk=await fetch('Menu_y_Compra_1.4.3_Publicacion_Firmada.apk',{method:'HEAD',cache:'no-store'});if(apk.ok)live.add('menu-y-compra');}catch(_){}
        cards.forEach(card => {
          if (!live.has(card.dataset.proxima)) return;
          card.hidden = true;
        });
        if (cards.every(card => card.hidden)) {
          const grid = document.querySelector('.pack6-coming-grid');
          if (grid) {
            const msg = document.createElement('p');
            msg.className = 'pack6-all-published';
            msg.textContent = '¡Las aplicaciones anunciadas ya están en el catálogo! Puedes encontrarlas en la sección de descargas.';
            grid.after(msg);
          }
        }
      }
      if (!launchResponse.ok) throw Error('Fechas no disponibles');
      const config = await launchResponse.json();
      if (!config || !Array.isArray(config.aplicaciones)) throw Error('Configuración inválida');
      config.aplicaciones.forEach(app => {
        if (app && typeof app.slug === 'string') known.set(app.slug, app);
      });
      cards.forEach(card => setAutomation(card, known.get(card.dataset.proxima)));
      tick();
      if (cards.some(card => !card.hidden && known.get(card.dataset.proxima)?.fechaEstreno)) setInterval(tick, 1000);
    } catch (_) {
      cards.forEach(card => say(card, 'Fecha pendiente de confirmar'));
    }
  }
  start();
})();