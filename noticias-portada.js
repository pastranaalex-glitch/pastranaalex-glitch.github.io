/* Noticias de la Biblioteca: caducan 72 horas después de publicarse.
   Cada tarjeta .biblio-news-card necesita data-publicado con fecha ISO 8601 y zona horaria.
   El filtro afecta solamente a las noticias, nunca al catálogo ni a las descargas. */
(() => {
  'use strict';
  const DURACION_MS = 3 * 24 * 60 * 60 * 1000;

  function actualizarNoticias() {
    const bloque = document.getElementById('noticias');
    if (!bloque) return;
    const ahora = Date.now();
    bloque.querySelectorAll('.biblio-news-card').forEach((noticia) => {
      const valor = noticia.getAttribute('data-publicado');
      const publicada = valor ? Date.parse(valor) : NaN;
      // Evitar noticias perpetuas por fechas ausentes o inválidas.
      if (!Number.isFinite(publicada) || publicada > ahora || ahora - publicada > DURACION_MS) {
        noticia.remove();
      }
    });
    // No mostrar un bloque vacío cuando no haya novedades recientes.
    if (!bloque.querySelector('.biblio-news-card')) bloque.remove();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', actualizarNoticias, { once: true });
  } else {
    actualizarNoticias();
  }
  // Revisar de nuevo al volver a una pestaña que llevaba días abierta.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) actualizarNoticias();
  });
})();
