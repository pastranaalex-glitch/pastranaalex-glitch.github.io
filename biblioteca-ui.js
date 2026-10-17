/* Navegación común. El catálogo y las descargas conservan sus propios controles. */
(() => {
  'use strict';
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
