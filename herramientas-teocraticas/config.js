/* Configuración PÚBLICA. No introducir contraseñas, tokens privados ni secretos aquí.
   Tras desplegar Cloudflare, copiar la URL HTTPS del Worker y la sitekey PUBLICA.
   Si ambos están vacíos, el formulario se abre para revisar, pero el envío está inactivo. */
window.HT_CONFIG = {
  downloadsIncluded: true,
  suggestionEndpoint: '', // https://nombre-del-worker.nombre-de-cuenta.workers.dev (sin /api/sugerencias)
  turnstileSiteKey: ''     // SITEKEY PÚBLICA de Cloudflare Turnstile
};
