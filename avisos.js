"use strict";
(() => {
  const pendiente = document.getElementById('avisos-pendiente');
  const activo = document.getElementById('avisos-activo');
  const boton = document.getElementById('mostrar-formulario');
  const enlace = document.getElementById('abrir-formulario');
  const contenedor = document.getElementById('brevo-container');
  const marco = document.getElementById('brevo-frame');
  const candidate = window.BIBLIOTECA_AVISOS?.formUrl;
  if (typeof candidate !== 'string' || !candidate.trim()) return;
  let url;
  try { url = new URL(candidate.trim()); } catch { return; }
  // Accept ONLY Brevo-hosted public subscription form links. Prevent redirecting users elsewhere.
  const host = url.hostname.toLowerCase();
  const trusted = host === 'sibforms.com' || host.endsWith('.sibforms.com');
  if (url.protocol !== 'https:' || !trusted || !url.pathname.startsWith('/serve/')) return;
  pendiente.hidden = true;
  activo.hidden = false;
  enlace.href = url.href;
  enlace.hidden = false;
  boton.addEventListener('click', () => {
    if (contenedor.hidden) {
      // Third-party code is loaded ONLY after a deliberate visitor action.
      marco.src = url.href;
      contenedor.hidden = false;
      boton.textContent = 'Ocultar formulario';
    } else {
      contenedor.hidden = true;
      marco.removeAttribute('src');
      boton.textContent = 'Mostrar formulario de suscripción ↗';
    }
  });
})();
