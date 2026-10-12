/* Ficha Rutas a Pie. GitHub counts from public releases; never invent counts. */
(()=>{'use strict';
const repo='pastranaalex-glitch/rutas-a-pie';
const link=document.getElementById('download-rutas'),version=document.getElementById('rutas-version'),count=document.getElementById('rutas-downloads');
const fallback='https://github.com/'+repo+'/releases/latest';
const good=a=>a&&typeof a.name==='string'&&/\.apk$/i.test(a.name)&&typeof a.browser_download_url==='string'&&a.browser_download_url.startsWith('https://github.com/'+repo+'/releases/download/');
async function getReleases(){try{
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
 let res;try{res=await fetch('https://api.github.com/repos/'+repo+'/releases?per_page=100',{headers:{Accept:'application/vnd.github+json'},signal:controller.signal})}finally{clearTimeout(timeout)};
 if(!res.ok)throw Error('GitHub API: '+res.status);
 const raw=await res.json();if(!Array.isArray(raw))throw Error('invalid');
 const releases=raw.filter(r=>r&&!r.draft&&!r.prerelease);const chosen=releases.find(r=>Array.isArray(r.assets)&&r.assets.some(good));if(!chosen)throw Error('No APK');
 const all=releases.flatMap(r=>(r.assets||[]).filter(good));const total=all.reduce((n,a)=>n+(Number(a.download_count)||0),0);
 version.textContent=String(chosen.tag_name||chosen.name||'1.5.1').replace(/^v/i,'');count.textContent=total.toLocaleString('es-ES');
 link.href=chosen.assets.find(a=>good(a)&&/1\.5\.1/i.test(a.name))?.browser_download_url||chosen.assets.find(good).browser_download_url;
}catch(_){count.textContent='Consultar en GitHub';link.href=fallback;}}
getReleases();
const images=[...document.querySelectorAll('[data-rutas-shot]')];
const dialog=document.getElementById('rutas-lightbox'),big=document.getElementById('rutas-bigshot'),label=document.getElementById('rutas-caption');let selected=0;
function display(i){selected=(i+images.length)%images.length;const chosen=images[selected];big.src=chosen.querySelector('img').getAttribute('src');big.alt=chosen.querySelector('img').alt;label.textContent=chosen.querySelector('span').textContent;}
images.forEach((b,i)=>b.addEventListener('click',()=>{display(i);if(dialog&&typeof dialog.showModal==='function')dialog.showModal();}));
document.getElementById('rutas-prev')?.addEventListener('click',()=>display(selected-1));document.getElementById('rutas-next')?.addEventListener('click',()=>display(selected+1));document.getElementById('rutas-close')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
dialog?.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')display(selected-1);if(e.key==='ArrowRight')display(selected+1)});
})();
