/* Radio Fácil PRO: muestra el recuento verificado que publica GitHub Actions.
   No consulta la API de GitHub desde el navegador ni carga imágenes de terceros. */
(() => {
  'use strict';
  const outputs = [...document.querySelectorAll('[data-radio-download-count]')];
  if (!outputs.length) return;
  async function load() {
    try {
      const response = await fetch('radio-facil-pro-descargas.json', {cache:'no-store'});
      if (!response.ok) throw new Error('Recuento todavía no publicado');
      const data = await response.json();
      if(data?.aplicacion !== 'radio-facil-pro'
        || !Number.isSafeInteger(data.total_descargas)
        || data.total_descargas < 0
        || !Number.isSafeInteger(data.archivos_contabilizados)
        || data.archivos_contabilizados < 1) throw new Error('Datos no verificados');
      const value = data.total_descargas.toLocaleString('es-ES');
      const when = data.actualizado ? new Date(data.actualizado) : null;
      const updated = when && Number.isFinite(when.getTime())
        ? when.toLocaleString('es-ES', {dateStyle:'short',timeStyle:'short'})
        : 'fecha no disponible';
      for (const el of outputs) {
        el.textContent = value;
        el.title = 'Descargas de '+data.archivos_contabilizados+
          ' APK en GitHub Releases. Última actualización: '+updated+
          '. No son instalaciones únicas.';
      }
    } catch (_) {
      for (const el of outputs) {
        el.textContent = 'Actualización pendiente';
        el.title = 'Las estadísticas se publicarán cuando finalice la consulta automática en GitHub.';
      }
    }
  }
  load();
})();