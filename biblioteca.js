/* Biblioteca de herramientas: integración Cocina a Punto 1.4.1.
   Mantiene las fichas y los contadores públicos de GitHub existentes. */
(function(){
'use strict';
const repo='pastranaalex-glitch/cocina-a-punto';
const list=document.querySelector('.apps-list');
if(list&&!list.querySelector('[data-repo="'+repo+'"]')){
 list.insertAdjacentHTML('beforeend',`<article class="app" data-app-card data-repo="pastranaalex-glitch/cocina-a-punto" data-releases-url="https://github.com/pastranaalex-glitch/cocina-a-punto/releases/latest"><div class="app-icon" aria-hidden="true">⏱️</div><div><h3>Cocina a Punto</h3><p>Cronómetros de cocina simultáneos con atajos editables, avisos, vibración y tiempos personalizados.</p><div class="chips"><span class="chip android">Android</span><span class="chip">Versión 1.4.1</span><span class="chip">Alarmas</span><span class="chip">Sin publicidad</span></div><div class="actions-row"><a class="button primary" data-download-button href="https://github.com/pastranaalex-glitch/cocina-a-punto/releases/latest" target="_blank" rel="noopener noreferrer">Descargar</a><a class="button ghost" href="cocina-a-punto.html">Ver ficha y fotos</a></div></div><div class="app-stat"><span class="download-value" data-download-value>—</span><span class="download-label" data-download-label>Cargando contador…</span><div class="download-meta" data-download-meta>Origen: GitHub Releases</div></div></article>`);
}
const cards=Array.from(document.querySelectorAll('[data-app-card]'));
const count=document.getElementById('total-apps');if(count)count.textContent=String(cards.length);
const android=document.getElementById('android-apps');if(android)android.textContent=String(cards.filter(x=>!!x.querySelector('.chip.android')).length);
const windows=document.getElementById('windows-apps');if(windows)windows.textContent=String(cards.filter(x=>!!x.querySelector('.chip.windows')).length);
const mock=document.querySelector('.mock-bottom span:last-child');if(mock)mock.textContent=cards.length+' aplicaciones publicadas';
const totalDownloadsEl=document.getElementById('total-downloads');
const format=n=>Number(n||0).toLocaleString('es-ES');
const assetFor=(r,repo)=>{const arr=Array.isArray(r.assets)?r.assets:[];const android=/lector-facil|recetario-facil|cocina-a-punto/.test(repo);return arr.find(a=>a&&typeof a.name==='string'&&(android?/\.apk$/i:/\.(?:exe|msi|zip)$/i).test(a.name)&&typeof a.browser_download_url==='string'&&a.browser_download_url.startsWith(`https://github.com/${repo}/releases/download/`))||null;};
async function load(card){
 const repo=card.dataset.repo;const fallback=card.dataset.releasesUrl||`https://github.com/${repo}/releases/latest`;
 const value=card.querySelector('[data-download-value]');const label=card.querySelector('[data-download-label]');const meta=card.querySelector('[data-download-meta]');const button=card.querySelector('[data-download-button]');
 try{
 const response=await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`,{headers:{Accept:'application/vnd.github+json'}});
 if(!response.ok)throw new Error('API no disponible');
 const releases=(await response.json()).filter(r=>!r.draft&&!r.prerelease);
 const assets=releases.flatMap(r=>Array.isArray(r.assets)?r.assets:[]);
 if(!assets.length){if(label)label.textContent='Sin descargas públicas';if(value)value.textContent='—';if(meta)meta.textContent='Visitar versiones en GitHub';if(button)button.href=fallback;return 0;}
 const total=assets.reduce((s,a)=>s+(Number(a.download_count)||0),0);
 if(value)value.textContent=format(total);if(label)label.textContent=total===1?'Descarga pública':'Descargas públicas';if(meta)meta.textContent=`${assets.length} archivos publicados · GitHub`;
 const latest=releases.find(r=>assetFor(r,repo));const apk=latest?assetFor(latest,repo):null;
 if(button)button.href=apk?apk.browser_download_url:fallback;
 return total;
 }catch(_){if(value)value.textContent='—';if(label)label.textContent='Consultar en GitHub';if(meta)meta.textContent='El contador no está disponible temporalmente';if(button)button.href=fallback;return null;}
}
if(cards.length)Promise.all(cards.map(load)).then(totals=>{if(totalDownloadsEl)totalDownloadsEl.textContent=totals.some(t=>t===null)?'—':format(totals.reduce((a,b)=>a+b,0));});
})();
