/* Radio Fácil PRO: contador real de descargas acumuladas de APK
   publicados en GitHub Releases. No cuenta visitas ni instalaciones.
   Si la API no responde, muestra el mínimo histórico (si existe). */
(() => {
  'use strict';
  const outputs = [...document.querySelectorAll('[data-radio-download-count]')];
  if (!outputs.length) return;
  const owner = 'pastranaalex-glitch';
  const repo = owner + '/' + owner + '.github.io';
  const maxPages = 10;
  const validName = /^RadioFacilPRO_[0-9].*\.apk$/i;
  const excludes = /(?:debug|unsigned|sin[._-]?firmar)/i;
  const fmt = n => n.toLocaleString('es-ES');
  function render(value, approximate, note) {
    outputs.forEach(el => {
      if (Number.isSafeInteger(value) && value >= 0) {
        el.textContent = (approximate ? '≥ ' : '') + fmt(value);
        el.title = note || 'Descargas acumuladas de APK en GitHub Releases; no son usuarios únicos.';
      } else {
        el.textContent = 'No disponible';
        el.title = note || 'No se pudo consultar GitHub en este momento.';
      }
    });
  }
  async function withTimeout(url) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 8500);
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: abort.signal,
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('GitHub: ' + response.status);
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  async function minimumSnapshot() {
    try {
      const response = await fetch('descargas-acumuladas.json', {cache:'no-store'});
      if (!response.ok) return null;
      const obj = await response.json();
      const n = obj?.conteos?.['radio-facil-pro'];
      return Number.isSafeInteger(n) && n >= 0 ? {value:n,date:obj.fecha} : null;
    } catch (_) { return null; }
  }
  async function run() {
    const snapshot = await minimumSnapshot();
    try {
      let count = 0;
      const ids = new Set();
      let ended = false;
      for (let page = 1; page <= maxPages; page++) {
        const url = 'https://api.github.com/repos/' + repo + '/releases?per_page=100&page=' + page;
        const releases = await withTimeout(url);
        if (!Array.isArray(releases)) throw new Error('Respuesta inesperada');
        for (const release of releases) {
          if (!release || release.draft || !Array.isArray(release.assets)) continue;
          for (const asset of release.assets) {
            if (asset.state !== 'uploaded' || !validName.test(asset.name || '')
              || excludes.test(asset.name || '') || !String(asset.browser_download_url || '')
                 .startsWith('https://github.com/' + repo + '/releases/download/')) continue;
            const id = String(asset.id || release.tag_name + ':' + asset.name);
            if (ids.has(id)) continue;
            ids.add(id);
            const n = Number(asset.download_count);
            if (Number.isSafeInteger(n) && n >= 0) count += n;
          }
        }
        if (releases.length < 100) { ended = true; break; }
      }
      if (!ended) throw new Error('Paginación incompleta');
      if (!ids.size) {
        if (snapshot) return render(snapshot.value, true, 'Mínimo histórico hasta ' + snapshot.date);
        return render(null, false, 'No se encontró ninguna APK publicada de Radio Fácil PRO.');
      }
      if (snapshot && snapshot.value > count) {
        render(snapshot.value, true, 'Mínimo histórico confirmado hasta ' + snapshot.date);
      } else {
        render(count, false, 'Descargas de ' + ids.size + ' APK publicadas en GitHub Releases. No son instalaciones únicas.');
      }
    } catch (_) {
      if (snapshot) render(snapshot.value, true, 'Mínimo histórico hasta ' + snapshot.date + '. GitHub no responde.');
      else render(null, false, 'GitHub no ha devuelto el contador. La descarga sigue disponible.');
    }
  }
  run();
})();