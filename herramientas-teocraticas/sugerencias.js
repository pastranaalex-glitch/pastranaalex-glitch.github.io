/* Herramientas Teocráticas v11.1 | Formulario privado sin registro. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const button = $('suggestion-open');
  const dialog = $('suggestion-dialog');
  const form = $('suggestion-form');
  const close = $('suggestion-close');
  const status = $('suggestion-feedback');
  const bannerState = $('suggestion-state');
  const send = $('suggestion-submit');
  const captchaBox = $('suggestion-captcha');
  const config = window.HT_CONFIG || {};
  const endpoint = String(config.suggestionEndpoint || '').trim().replace(/\/+$/, '');
  const sitekey = String(config.turnstileSiteKey || '').trim();
  let widgetId = null;
  let loading = false;
  let connected = false;
  let lastFocus = null;

  function validHttps(value) {
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && u.pathname === '/' && !u.search && !u.hash; }
    catch { return false; }
  }
  const ready = validHttps(endpoint) && !!sitekey;
  const isLocal = location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
  function message(value) { status.textContent = value; }
  function canSend() { send.disabled = !ready || isLocal || !connected; }
  if (ready) {
    bannerState.textContent = 'Buzón privado preparado. No publiques datos personales en la sugerencia.';
  } else {
    bannerState.textContent = 'Formulario disponible. El envío se activará cuando se conecte el buzón privado.';
  }

  async function ensureTurnstile() {
    if (!ready) { message('El buzón todavía no está conectado. El administrador debe configurar Cloudflare.'); return; }
    if (isLocal) { message('Para enviar, abre la web publicada con HTTPS. Turnstile no funciona desde un archivo local.'); return; }
    if (widgetId !== null) { connected = true; canSend(); return; }
    if (loading) return;
    loading = true;
    message('Preparando comprobación antispam…');
    try {
      if (!window.turnstile) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      if (!window.turnstile) throw new Error('Turnstile no disponible');
      widgetId = window.turnstile.render(captchaBox, {
        sitekey, theme: 'light',
        callback: () => message('Verificación completada. Ya puedes enviar la propuesta.'),
        'expired-callback': () => message('La verificación ha caducado. Complétala otra vez.'),
        'error-callback': () => message('No se ha podido completar la verificación. Comprueba tu conexión.')
      });
      connected = true;
      canSend();
      message('Completa la verificación antispam antes de enviar.');
    } catch { message('No se pudo cargar la protección antispam. Comprueba tu conexión.'); }
    finally { loading = false; }
  }

  button.addEventListener('click', () => {
    lastFocus = document.activeElement;
    dialog.showModal();
    $('suggestion-subject').focus();
    canSend();
    ensureTurnstile();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { if (lastFocus?.isConnected) lastFocus.focus(); });

  const personal = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?\d[\s.-]*){9,}/;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!ready || isLocal || !connected) { canSend(); return; }
    if (!form.reportValidity()) return;
    const category = $('suggestion-type').value;
    const title = $('suggestion-subject').value.trim();
    const body = $('suggestion-text').value.trim();
    if (title.length < 5 || title.length > 100 || body.length < 15 || body.length > 1600) {
      message('Revisa la longitud del título y de la propuesta.'); return;
    }
    if (personal.test(title + ' ' + body)) { message('Por privacidad, elimina direcciones de correo y números de teléfono.'); return; }
    const token = window.turnstile?.getResponse(widgetId) || '';
    if (!token) { message('Completa primero la verificación antispam.'); return; }
    send.disabled = true;
    message('Enviando…');
    try {
      const reply = await fetch(endpoint + '/api/sugerencias', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        credentials: 'omit', referrerPolicy:'no-referrer',
        body: JSON.stringify({category, title, body, website:$('suggestion-website').value, turnstileToken:token})
      });
      if (!reply.ok) {
        const result = await reply.json().catch(() => ({}));
        throw Error(typeof result.error === 'string' ? result.error : 'El servidor no aceptó el envío.');
      }
      form.reset();
      message('¡Gracias! Tu sugerencia se ha recibido en el buzón privado.');
      if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
    } catch (error) {
      message('No se ha enviado. ' + (error.message || 'Comprueba la conexión.'));
      if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
    } finally { canSend(); }
  });
})();
