/* Only Cocina Clara: count publicly downloadable installers across GitHub Releases. */
(()=>{'use strict';
const repo='pastranaalex-glitch/cocina-clara', latest='https://github.com/'+repo+'/releases/latest';
const version=document.getElementById('clara-version'),count=document.getElementById('clara-downloads'),link=document.getElementById('download-clara');
const valid=a=>a&&typeof a.name==='string'&&/\.(zip|exe|msi)$/i.test(a.name)&&typeof a.browser_download_url==='string'&&a.browser_download_url.startsWith('https://github.com/'+repo+'/releases/download/');
async function run(){try{
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8500);
 let response;try{response=await fetch('https://api.github.com/repos/'+repo+'/releases?per_page=100',{headers:{Accept:'application/vnd.github+json'},signal:controller.signal})}finally{clearTimeout(timeout)}
 if(!response.ok)throw Error('API '+response.status);const raw=await response.json();if(!Array.isArray(raw))throw Error('Formato');
 const releases=raw.filter(r=>r&&!r.draft&&!r.prerelease);const candidate=releases.find(r=>Array.isArray(r.assets)&&r.assets.some(valid));if(!candidate)throw Error('Sin instalador público');
 version.textContent=(candidate.tag_name||candidate.name||'Disponible').replace(/^v/i,'');
 const all=releases.flatMap(r=>Array.isArray(r.assets)?r.assets.filter(valid):[]);
 count.textContent=all.reduce((n,a)=>n+(Number(a.download_count)||0),0).toLocaleString('es-ES');
 const installer=candidate.assets.find(a=>valid(a)&&/\.(exe|msi)$/i.test(a.name))||candidate.assets.find(valid);link.href=installer.browser_download_url;
}catch(_){count.textContent='Consultar en GitHub';link.href=latest;}}
run();
})();
