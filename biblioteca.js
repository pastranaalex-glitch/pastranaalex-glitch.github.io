(function(){
  const cards = Array.from(document.querySelectorAll('[data-app-card]'));
  const totalDownloadsEl = document.getElementById('total-downloads');
  if (!cards.length) return;

  const format = n => Number(n || 0).toLocaleString('es-ES');

  function setCardError(card, message){
    const value = card.querySelector('[data-download-value]');
    const label = card.querySelector('[data-download-label]');
    const meta = card.querySelector('[data-download-meta]');
    if (value) value.textContent = '—';
    if (label) label.textContent = message || 'No disponible';
    if (meta) meta.textContent = 'Comprueba que el repositorio y los lanzamientos públicos existan.';
  }

  function chooseLatestAsset(releases){
    for (const release of releases) {
      if (release.draft || release.prerelease) continue;
      if (Array.isArray(release.assets) && release.assets.length) return release.assets[0];
    }
    return null;
  }

  async function loadCard(card){
    const repo = card.dataset.repo;
    const releasesUrl = card.dataset.releasesUrl || `https://github.com/${repo}/releases/latest`;
    const value = card.querySelector('[data-download-value]');
    const label = card.querySelector('[data-download-label]');
    const meta = card.querySelector('[data-download-meta]');
    const button = card.querySelector('[data-download-button]');

    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`, {
        headers: { 'Accept':'application/vnd.github+json' }
      });
      if (!response.ok) throw new Error('No se pudieron leer los lanzamientos');
      const releases = await response.json();
      const published = releases.filter(r => !r.draft && !r.prerelease);
      const assets = published.flatMap(r => Array.isArray(r.assets) ? r.assets : []);
      if (!assets.length) {
        setCardError(card, 'Sin descargas públicas');
        if (button) button.href = releasesUrl;
        return 0;
      }

      const total = assets.reduce((sum, asset) => sum + (Number(asset.download_count) || 0), 0);
      const latestAsset = chooseLatestAsset(published);

      if (value) value.textContent = format(total);
      if (label) label.textContent = total === 1 ? 'Descarga pública' : 'Descargas públicas';
      if (meta) {
        const assetText = assets.length === 1 ? '1 archivo publicado' : `${assets.length} archivos publicados`;
        meta.textContent = `${assetText} · Contador automático de GitHub`;
      }
      if (button && latestAsset && latestAsset.browser_download_url) {
        button.href = latestAsset.browser_download_url;
      } else if (button) {
        button.href = releasesUrl;
      }
      return total;
    } catch (error) {
      setCardError(card, 'No se pudo leer');
      if (button) button.href = releasesUrl;
      return 0;
    }
  }

  Promise.all(cards.map(loadCard)).then(totals => {
    if (totalDownloadsEl) {
      const grandTotal = totals.reduce((sum, value) => sum + (Number(value) || 0), 0);
      totalDownloadsEl.textContent = format(grandTotal);
    }
  }).catch(() => {
    if (totalDownloadsEl) totalDownloadsEl.textContent = '—';
  });
})();
