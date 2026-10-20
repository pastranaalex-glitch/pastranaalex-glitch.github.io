/* Ficha Mente Activa PRO. Catálogo aprobado para descargas; API solo para el contador. */
(()=>{'use strict';
 const repo='pastranaalex-glitch/pastranaalex-glitch.github.io',slug='mente-activa-pro';
 const actions=document.getElementById('ma-actions'),status=document.getElementById('ma-status'),counter=document.getElementById('ma-downloads');
 if(!actions||!status)return;
 function approved(a){
  if(!a||a.publicado!==true||a.disponible===false||a.slug!==slug||a.repo!==repo||a.plataforma!=='android')return null;
  const d=a.descarga;
  if(!d||d.version!==a.version||!/^[0-9]{1,6}(\.[0-9]{1,6}){1,3}$/.test(a.version||'')||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(d.tag||'')||d.tag.includes('..')||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,179}\.apk$/.test(d.archivo||'')||d.archivo.includes('..')||!/^[a-f0-9]{64}$/.test(d.sha256||''))return null;
  return {d,url:'https://github.com/'+repo+'/releases/download/'+encodeURIComponent(d.tag)+'/'+encodeURIComponent(d.archivo)};
 }
 async function readJSON(url){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),8000);
  try{const r=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'},signal:ctrl.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json();}
  finally{clearTimeout(timer);}
 }
 async function start(){
  let a,download;
  try{
   const data=await readJSON('catalogo.json'),matches=(data.aplicaciones||[]).filter(a=>a.slug===slug);
   a=matches.length===1?matches[0]:null;download=approved(a);
   if(!download){status.textContent='La versión está probada en móvil. La descarga se activará cuando su APK esté publicado y comprobado en GitHub.';return;}
  }catch(_){status.textContent='No se ha podido consultar la publicación. Vuelve a intentarlo más tarde.';return;}
  const link=document.createElement('a');link.className='button';link.textContent='Descargar Mente Activa PRO '+a.version+' ↓';link.href=download.url;link.rel='noopener noreferrer';actions.replaceChildren(link);
  document.querySelectorAll('[data-ma-version]').forEach(el=>el.textContent=a.version);
  status.textContent='Versión '+a.version+' disponible. APK con la firma permanente de Mente Activa PRO.';
  const file=document.getElementById('ma-file'),hash=document.getElementById('ma-hash'),label=document.getElementById('ma-hash-label');
  if(file)file.textContent='Archivo: '+download.d.archivo+'.';if(hash)hash.textContent=download.d.sha256;if(label)label.hidden=false;
  try{
   const release=await readJSON('https://api.github.com/repos/'+repo+'/releases/tags/'+encodeURIComponent(download.d.tag));
   if(release.draft||release.prerelease||release.tag_name!==download.d.tag)throw Error('Release');
   const asset=(release.assets||[]).find(x=>x.state==='uploaded'&&x.name===download.d.archivo&&x.digest==='sha256:'+download.d.sha256&&x.browser_download_url===download.url);
   if(!asset)throw Error('Asset');
   const count=Math.max(0,Number(asset.download_count)||0);
   if(counter)counter.textContent=count.toLocaleString('es-ES')+' '+(count===1?'descarga de esta versión':'descargas de esta versión')+' · GitHub Releases';
  }catch(_){if(counter)counter.textContent='Contador temporalmente no disponible. La descarga sigue activa.';}
 }
 start();
})();
