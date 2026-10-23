/* Estadística real de descarga para Mi Dinero Real 2.
   GitHub Releases cuenta descargas de activos, no accesos directos de GitHub Pages.
   No almacena datos personales ni registra clics de forma independiente. */
(() => {
  'use strict';
  const nodes = Array.from(document.querySelectorAll('[data-mdr-download-count]'));
  if (!nodes.length) return;
  const repo = 'pastranaalex-glitch/pastranaalex-glitch.github.io';
  const tag = 'mi-dinero-real-v2.5.2';
  const file = 'MiDineroReal2_2_5_2_FIRMA_PERMANENTE.apk';
  const digest = 'sha256:d0d3e6c0e42b42c956e0e5227bb5bfde35b21c2175324906a71c986d6398ea16';
  const update = (message) => nodes.forEach(node => { node.textContent = message; });
  (async () => {
    try {
      const response = await fetch('https://api.github.com/repos/' + repo + '/releases/tags/' + tag, {
        headers: {Accept: 'application/vnd.github+json'},
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('GitHub Releases ' + response.status);
      const release = await response.json();
      const asset = Array.isArray(release.assets)
        ? release.assets.find(a => a && a.name === file && a.state === 'uploaded' && a.digest === digest)
        : null;
      if (!asset || !Number.isSafeInteger(asset.download_count)) throw new Error('Dato no verificado');
      const n = asset.download_count;
      update(n.toLocaleString('es-ES') + (n === 1 ? ' descarga registrada' : ' descargas registradas'));
    } catch (_) {
      update('Estadística temporalmente no disponible');
    }
  })();
})();
