/* Panel privado. No almacenar nunca tokens en localStorage, cookies ni direcciones URL. */
(() => {
  'use strict';
  const endpoint = 'https://herramientas-teocraticas-estadisticas.pastranaalex.workers.dev/api/admin/estadisticas';
  const $ = id => document.getElementById(id);
  const form = $('access-form');
  const input = $('access-token');
  const msg = $('feedback');
  const nf = new Intl.NumberFormat('es-ES');
  let currentToken = '';
  let busy = false;
  const setMessage = (message,error=false) => { msg.textContent = message; msg.classList.toggle('error',error); };
  async function loadStats(token) {
    if (busy) return;
    busy = true;
    $('load-btn').disabled = true;
    $('refresh-btn').disabled = true;
    setMessage('Consultando estadísticas privadas…');
    try {
      const r = await fetch(endpoint, {
        method:'GET', headers:{Authorization:`Bearer ${token}`},
        cache:'no-store', credentials:'omit', referrerPolicy:'no-referrer'
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if(r.status === 401) throw Error('Token incorrecto. Usa ABRIR_ESTADISTICAS.bat para obtener el token de este panel.');
        throw Error(data.error || 'No se pueden consultar las estadísticas en este momento.');
      }
      if (data.ok !== true || !data.today || !data.week || !data.total) throw Error('La respuesta del servidor está incompleta.');
      const count = v => nf.format(Math.max(0,Number(v)||0));
      $('today').textContent = count(data.today.visits);
      $('week').textContent = count(data.week.visits);
      $('total').textContent = count(data.total.visits);
      $('since').textContent = `desde el ${new Date(data.since+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}`;
      $('views').textContent = `Páginas vistas: hoy ${count(data.today.pageviews)} · 7 días ${count(data.week.pageviews)} · acumuladas ${count(data.total.pageviews)}.`;
      $('as-of').textContent = 'Actualizado: ' + new Date(data.as_of).toLocaleString('es-ES',{timeZone:'Europe/Madrid',dateStyle:'medium',timeStyle:'short'});
      $('metrics').hidden = false;
      $('details').hidden = false;
      currentToken = token;
      input.value = '';
      setMessage('Consulta completada. Los datos solo se muestran tras autorizar el acceso.');
    } catch(e) {
      setMessage(e.message || 'No se ha podido conectar con el servicio.',true);
    } finally {
      busy = false;
      $('load-btn').disabled = false;
      $('refresh-btn').disabled = false;
    }
  }
  form.addEventListener('submit', e => {e.preventDefault();const token=input.value.trim();if(token)loadStats(token);});
  $('refresh-btn').addEventListener('click', () => {if(currentToken)loadStats(currentToken);});
  $('exit-btn').addEventListener('click', () => {currentToken='';input.value='';$('metrics').hidden=true;$('details').hidden=true;setMessage('Sesión cerrada. El token ya no está en esta página.');input.focus();});
})();