/* Navegación común. El catálogo y las descargas conservan sus propios controles. */
(() => {
  'use strict';
  // Compartir la Biblioteca desde la portada o desde cualquier sección.
  // No usa servicios de terceros: Web Share nativo y copia local de la URL.
  const shareUrl = 'https://pastranaalex-glitch.github.io/';
  const shareData = {
    title: 'Biblioteca de herramientas',
    text: 'Aplicaciones y juegos gratuitos para Android y Windows, sin anuncios.',
    url: shareUrl
  };
  let feedback;
  const notify = message => {
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'library-share-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      document.body.append(feedback);
    }
    feedback.textContent = message;
    feedback.hidden = false;
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => { feedback.hidden = true; }, 4500);
  };
  const copyShareUrl = async () => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      } catch (_) { /* Algunos navegadores bloquean el portapapeles. */ }
    }
    // Alternativa para navegadores sin Clipboard API.
    const field = document.createElement('textarea');
    field.value = shareUrl;
    field.readOnly = true;
    field.setAttribute('aria-label', 'Enlace de la Biblioteca');
    field.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.append(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch (_) { /* No disponible. */ }
    field.remove();
    return copied;
  };
  const share = async event => {
    const control = event.target.closest('[data-library-share]');
    if (!control) return;
    event.preventDefault();
    // El navegador exige la activación directa del usuario para abrir Web Share.
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') return;
      }
    }
    if (await copyShareUrl()) {
      notify('Enlace copiado. Ya puedes pegarlo en WhatsApp, correo o donde quieras.');
    } else {
      // La dirección permanece visible para copiarla a mano si todo lo demás falla.
      window.prompt('Copia el enlace de la Biblioteca:', shareUrl);
    }
  };
  document.addEventListener('click', share);
  const headerMenu = document.querySelector('.site-header .site-nav');
  if (headerMenu && !headerMenu.querySelector('[data-library-share]')) {
    const shareButton = document.createElement('button');
    shareButton.type = 'button';
    shareButton.className = 'ui-share-nav';
    shareButton.dataset.libraryShare = 'biblioteca';
    shareButton.textContent = '↗ Compartir';
    shareButton.setAttribute('aria-label', 'Compartir Biblioteca de herramientas');
    const explore = headerMenu.querySelector('.nav-cta');
    headerMenu.insertBefore(shareButton, explore || null);
  }
  const button = document.getElementById('menu-toggle');
  const menu = document.getElementById('menu-principal');
  if (!button || !menu) return;
  document.documentElement.classList.add('library-js');
  const close = (restoreFocus = false) => {
    const wasOpen = button.getAttribute('aria-expanded') === 'true';
    menu.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Abrir menú de navegación');
    if (restoreFocus && wasOpen) button.focus();
  };
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    menu.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
  });
  menu.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(true); });
  document.addEventListener('pointerdown', e => {
    if (!menu.contains(e.target) && !button.contains(e.target)) close();
  });
  document.addEventListener('focusin', e => {
    if (!menu.contains(e.target) && !button.contains(e.target)) close();
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) close(); });
  let textScale = 100;
  document.querySelectorAll('[data-text-size]').forEach(control => {
    control.addEventListener('click', () => {
      textScale = Math.max(87.5, Math.min(150, textScale + (control.dataset.textSize === 'up' ? 12.5 : -12.5)));
      document.documentElement.style.fontSize = textScale + '%';
    });
  });
})();
