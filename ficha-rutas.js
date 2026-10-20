/* Ficha Rutas a Pie. GitHub counts from public releases; never invent counts. */
(()=>{'use strict';
const repo='pastranaalex-glitch/rutas-a-pie';
const link=document.getElementById('download-rutas'),version=document.getElementById('rutas-version'),count=document.getElementById('rutas-downloads');
const fallback='https://github.com/'+repo+'/releases/latest';
function fallbackLink(){if(link){link.href=fallback;link.removeAttribute('aria-disabled');link.removeAttribute('tabindex');link.style.pointerEvents='';link.style.opacity='';link.textContent='↓ Descargar desde GitHub';link.title='Abrir la descarga publicada en GitHub Releases';}if(count)count.textContent='Consultar en GitHub';}
const good=a=>a&&typeof a.name==='string'&&/\.apk$/i.test(a.name)&&typeof a.browser_download_url==='string'&&a.browser_download_url.startsWith('https://github.com/'+repo+'/releases/download/');
async function getReleases(){try{
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
 let res;try{res=await fetch('https://api.github.com/repos/'+repo+'/releases?per_page=100',{headers:{Accept:'application/vnd.github+json'},signal:controller.signal})}finally{clearTimeout(timeout)};
 if(!res.ok)throw Error('GitHub API: '+res.status);
 const raw=await res.json();if(!Array.isArray(raw))throw Error('invalid');
 const releases=raw.filter(r=>r&&!r.draft&&!r.prerelease);const chosen=releases.find(r=>Array.isArray(r.assets)&&r.assets.some(good));if(!chosen)throw Error('No APK');
 const all=releases.flatMap(r=>(r.assets||[]).filter(good));
 let total=all.reduce((n,a)=>n+Math.max(0,Number(a.download_count)||0),0);
 let mirrorAvailable=false;
 // El mismo proyecto también tuvo una descarga pública desde el repo de la Biblioteca.
 try{
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),7500);
  let other;
  try{other=await fetch('https://api.github.com/repos/pastranaalex-glitch/pastranaalex-glitch.github.io/releases?per_page=100',{headers:{Accept:'application/vnd.github+json'},signal:ctrl.signal});}
  finally{clearTimeout(timer);}
  if(!other.ok)throw Error('Mirror unavailable');
  const shared=await other.json();if(!Array.isArray(shared))throw Error('Invalid data');
  for(const rel of shared){
   if(rel.draft||rel.tag_name!=='v.1.5.1')continue;
   for(const asset of (rel.assets||[])){
    if(asset?.name==='RutasAPie_1.5.1.apk'&&asset.state==='uploaded'
      &&asset.digest==='sha256:f4b9f6d2442d1785bebf96c3d58e32e107591a443b58c0b6d8a121a8501fc74b'
      &&asset.browser_download_url==='https://github.com/pastranaalex-glitch/pastranaalex-glitch.github.io/releases/download/v.1.5.1/RutasAPie_1.5.1.apk')
      total+=Math.max(0,Number(asset.download_count)||0);
   }
  }
  mirrorAvailable=true;
 }catch(_){/* Sin inventar cifras cuando falta una fuente histórica. */}
 version.textContent=String(chosen.tag_name||chosen.name||'1.5.1').replace(/^v\.?/i,'');
 count.textContent=(mirrorAvailable?'':'≥ ')+total.toLocaleString('es-ES');
 count.title=mirrorAvailable?'Descargas acumuladas en los dos repositorios oficiales de GitHub Releases; no instalaciones únicas.':'Mínimo registrado en el repositorio principal. El histórico de la Biblioteca no está disponible ahora.';
 link.href=chosen.assets.find(a=>good(a)&&/1\.5\.1/i.test(a.name))?.browser_download_url||chosen.assets.find(good).browser_download_url;link.removeAttribute('aria-disabled');link.removeAttribute('tabindex');link.style.pointerEvents='';link.style.opacity='';link.textContent='↓ Descargar gratis';link.removeAttribute('title');
}catch(_){fallbackLink();}}
getReleases();
const images=[...document.querySelectorAll('[data-rutas-shot]')];
const dialog=document.getElementById('rutas-lightbox'),big=document.getElementById('rutas-bigshot'),label=document.getElementById('rutas-caption');let selected=0;
function display(i){selected=(i+images.length)%images.length;const chosen=images[selected];big.src=chosen.querySelector('img').getAttribute('src');big.alt=chosen.querySelector('img').alt;label.textContent=chosen.querySelector('span').textContent;}
images.forEach((b,i)=>b.addEventListener('click',()=>{display(i);if(dialog&&typeof dialog.showModal==='function')dialog.showModal();}));
document.getElementById('rutas-prev')?.addEventListener('click',()=>display(selected-1));document.getElementById('rutas-next')?.addEventListener('click',()=>display(selected+1));document.getElementById('rutas-close')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
dialog?.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')display(selected-1);if(e.key==='ArrowRight')display(selected+1)});
})();
