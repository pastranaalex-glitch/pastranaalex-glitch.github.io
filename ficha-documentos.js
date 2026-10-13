/* Documentos de Casa: datos reales de GitHub Releases. */
(()=>{'use strict';
const repo='pastranaalex-glitch/documentos-de-casa',fallback='https://github.com/'+repo+'/releases/tag/V1.7.6';
const dl=document.getElementById('docs-download'),version=document.getElementById('docs-version'),count=document.getElementById('docs-count');
const valid=a=>a&&typeof a.name==='string'&&/\.apk$/i.test(a.name)&&!/debug|unsigned|sin.firmar/i.test(a.name)&&typeof a.browser_download_url==='string'&&a.browser_download_url.startsWith('https://github.com/'+repo+'/releases/download/');
async function run(){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),9000);
try{const response=await fetch('https://api.github.com/repos/'+repo+'/releases?per_page=100',{headers:{Accept:'application/vnd.github+json'},signal:ctl.signal});
if(!response.ok)throw new Error('No GitHub');const releases=(await response.json()).filter(r=>r&&!r.draft&&!r.prerelease);
const first=releases.find(r=>(r.assets||[]).some(valid));if(!first)throw new Error('Sin APK');
const asset=first.assets.find(valid),total=releases.flatMap(r=>(r.assets||[]).filter(valid)).reduce((n,a)=>n+(Number(a.download_count)||0),0);
dl.href=asset.browser_download_url;version.textContent=String(first.tag_name||'1.7.6').replace(/^v/i,'');count.textContent=total.toLocaleString('es-ES');
}catch(_){count.textContent='Ver en GitHub';dl.href=fallback;dl.textContent='↓ Descargar desde GitHub';}
finally{clearTimeout(timer);}}
run();

const shots=[...document.querySelectorAll('[data-docs-shot]')],modal=document.getElementById('docs-lightbox'),big=document.getElementById('docs-bigshot'),caption=document.getElementById('docs-caption');let current=0;
function show(i){if(!shots.length||!big)return;current=(i+shots.length)%shots.length;const chosen=shots[current];const img=chosen.querySelector('img');big.src=img.getAttribute('src');big.alt=img.alt;caption.textContent=chosen.querySelector('span').textContent;}
shots.forEach((b,i)=>b.addEventListener('click',()=>{show(i);if(modal?.showModal)modal.showModal()}));
document.getElementById('docs-prev')?.addEventListener('click',()=>show(current-1));
document.getElementById('docs-next')?.addEventListener('click',()=>show(current+1));
document.getElementById('docs-close')?.addEventListener('click',()=>modal?.close());
modal?.addEventListener('click',e=>{if(e.target===modal)modal.close()});
modal?.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')show(current-1);if(e.key==='ArrowRight')show(current+1)});

})();
