/* Biblioteca de herramientas · Portada Pack 5
   Filtros locales y cifras reales de GitHub Releases. Nunca se inventan descargas.
   Si la API falla, el visitante conserva el enlace a Releases. */
(() => {
  'use strict';
  const cards = Array.from(document.querySelectorAll('[data-app-card]'));
  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const searchInput = document.getElementById('search-apps');
  const empty = document.getElementById('empty-results');
  const reset = document.getElementById('reset-search');
  const resultsStatus = document.getElementById('results-status');
  const formatNumber = value => Number(value).toLocaleString('es-ES');
  const put = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = String(value); };
  let platformFilter = 'todos';

  const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-ES');
  function filterCards() {
    const words = normalize(searchInput ? searchInput.value.trim() : '').split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const matchesPlatform = platformFilter === 'todos' || card.dataset.platform === platformFilter;
      const searchText = normalize(card.dataset.search || card.textContent);
      const matchesText = words.every(word => searchText.includes(word));
      card.hidden = !(matchesPlatform && matchesText);
      if (!card.hidden) visible++;
    }
    for (const button of filterButtons) {
      const active = button.dataset.filter === platformFilter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    if (empty) empty.hidden = visible !== 0;
    if (resultsStatus) resultsStatus.textContent = `${visible} ${visible === 1 ? 'aplicación disponible' : 'aplicaciones disponibles'}`;
  }
  for (const button of filterButtons) button.addEventListener('click', () => { platformFilter = button.dataset.filter; filterCards(); });
  if (searchInput) searchInput.addEventListener('input', filterCards);
  if (reset) reset.addEventListener('click', () => {platformFilter='todos';if(searchInput)searchInput.value='';filterCards();if(searchInput)searchInput.focus();});
  put('total-apps', cards.length);
  put('hero-apps', cards.length);
  put('android-apps', cards.filter(card => card.dataset.platform === 'android').length);
  put('windows-apps', cards.filter(card => card.dataset.platform === 'windows').length);
  const totalFilterCount = document.querySelector('[data-filter-count="todos"]');
  if (totalFilterCount) totalFilterCount.textContent = String(cards.length);
  filterCards();

  function validAsset(asset, repo) {
    if (!asset || typeof asset.name !== 'string' || typeof asset.browser_download_url !== 'string') return false;
    if (!asset.browser_download_url.startsWith(`https://github.com/${repo}/releases/download/`)) return false;
    return /cocina-clara$/.test(repo) ? /\.(zip|exe|msi)$/i.test(asset.name) : /\.apk$/i.test(asset.name);
  }
  async function loadCard(card) {
    const repo = card.dataset.repo;
    // Only the repos shipped in our reviewed HTML are contacted.
    if (!/^pastranaalex-glitch\/(lector-facil|recetario-facil|cocina-clara|cocina-a-punto)$/.test(repo)) return null;
    const fallback = card.dataset.fallback || `https://github.com/${repo}/releases/latest`;
    const value = card.querySelector('[data-download-value]');
    const label = card.querySelector('[data-download-label]');
    const meta = card.querySelector('[data-download-meta]');
    const button = card.querySelector('[data-download-button]');
    if (button) button.href = fallback;
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`, {headers: {Accept:'application/vnd.github+json'}});
      if (!response.ok) throw new Error(`GitHub API: ${response.status}`);
      const json = await response.json();
      if (!Array.isArray(json)) throw new Error('Respuesta inesperada');
      const releases = json.filter(r => r && !r.draft && !r.prerelease);
      const assets = releases.flatMap(r => Array.isArray(r.assets) ? r.assets.filter(a => validAsset(a, repo)) : []);
      if (!assets.length) {
        if (value) value.textContent = '—';
        if (label) label.textContent = 'Sin archivos descargables';
        if (meta) meta.textContent = 'Consultar GitHub';
        return 0;
      }
      const count = assets.reduce((sum, a) => sum + (Number(a.download_count) || 0), 0);
      if (value) value.textContent = formatNumber(count);
      if (label) label.textContent = count === 1 ? 'Descarga pública' : 'Descargas públicas';
      if (meta) meta.textContent = 'GitHub Releases';
      const release = releases.find(r => Array.isArray(r.assets) && r.assets.some(a => validAsset(a, repo)));
      const asset = release && release.assets.find(a => validAsset(a, repo));
      if (button && asset) button.href = asset.browser_download_url;
      return count;
    } catch (_error) {
      if (value) value.textContent = '—';
      if (label) label.textContent = 'Ver descargas en GitHub';
      if (meta) meta.textContent = 'Contador no disponible';
      return null;
    }
  }
  Promise.all(cards.map(loadCard)).then(totals => {
    // A partial figure could be mistaken for the total: hide it if any request failed.
    const total = totals.some(value => value === null) ? '—' : formatNumber(totals.reduce((sum, value) => sum + value, 0));
    put('hero-downloads', total);
  });
})();
