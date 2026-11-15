/* El Paraíso Perdido: descargas reales acumuladas de APK en GitHub Releases.
 * El recuento no identifica usuarios ni registra clics propios. */
(() => {
  'use strict';
  const slug = 'el-paraiso-perdido';
  const api = 'https://api.github.com/repos/pastranaalex-glitch/pastranaalex-glitch.github.io/releases/tags/el-paraiso-perdido-v0.9.4';
  const file = 'El_Paraiso_Perdido_PACK9_4.apk';
  const digest = 'sha256:97cfafe0f42a548fbf220973a79df0df5ea9b36786ac76b7c51a3d648b318f6e';
  const format = (n) => n.toLocaleString('es-ES');
  let total = null;

  function paint() {
    if (!Number.isSafeInteger(total) || total < 0) return;
    for (const node of document.querySelectorAll('[data-paraiso-descargas]')) {
      node.textContent = format(total);
      node.title = 'Descargas verificadas en GitHub Releases; no son instalaciones ni personas únicas.';
    }
    const detail = document.getElementById('paraiso-descargas-acumuladas');
    if (detail) {
      detail.textContent = format(total) +
        (total === 1 ? ' descarga registrada' : ' descargas registradas') +
        ' · GitHub Releases';
    }
    // Las tarjetas del catálogo se crean de forma asíncrona.
    for (const card of document.querySelectorAll('[data-app-slug="el-paraiso-perdido"]')) {
      const box = card.querySelector('.downloads');
      if (!box) continue;
      const value = box.querySelector('strong');
      const title = box.querySelector('span');
      const note = box.querySelector('small');
      if (value) value.textContent = format(total);
      if (title) title.textContent = 'Descargas acumuladas';
      if (note) note.textContent = 'APK publicadas · GitHub Releases';
    }
  }

  document.addEventListener('biblioteca:cards-ready', paint);
  async function update() {
    // Copia persistente: impide perder el histórico cuando haya nuevas versiones.
    try {
      const r = await fetch('descargas-acumuladas.json', {cache: 'no-store'});
      if (r.ok) {
        const data = await r.json();
        const n = data && data.conteos && data.conteos[slug];
        if (Number.isSafeInteger(n) && n >= 0) {
          total = n;
          paint();
        }
      }
    } catch (_) {}

    // Recuento actual del APK oficial. Sin incrementar en los clics ni en visitas.
    try {
      const r = await fetch(api, {
        headers: {Accept: 'application/vnd.github+json'},
        cache: 'no-store'
      });
      if (!r.ok) throw new Error('GitHub API ' + r.status);
      const release = await r.json();
      if (release.draft || release.prerelease) throw new Error('Release no pública');
      const asset = (Array.isArray(release.assets) ? release.assets : []).find(a =>
        a && a.name === file && a.state === 'uploaded' && a.digest === digest);
      if (!asset || !Number.isSafeInteger(asset.download_count) || asset.download_count < 0) {
        throw new Error('Contador no verificable');
      }
      total = Math.max(total ?? 0, asset.download_count);
      paint();
    } catch (_) {
      if (total === null) {
        const detail = document.getElementById('paraiso-descargas-acumuladas');
        if (detail) detail.textContent = 'Contador temporalmente no disponible';
        for (const node of document.querySelectorAll('[data-paraiso-descargas]')) {
          node.textContent = '—';
        }
      }
    }
  }
  update();
})();
