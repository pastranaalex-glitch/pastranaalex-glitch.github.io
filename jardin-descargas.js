/* Jardín de Joyas: contador acumulado aislado del generador de fichas.
 * Son descargas de APK publicadas en GitHub Releases, no jugadores únicos.
 * Eliminar una publicación impide consultar después sus descargas históricas.
 */
(async()=>{'use strict';
 const out=document.getElementById('jj-descargas-acumuladas');
 const catalog=document.querySelector('[data-catalog-slot]');
 if(!out&&!catalog)return;
 let suma=null;
 function actualizarTarjetas(){
  if(!Number.isFinite(suma))return;
  for(const tarjeta of document.querySelectorAll('[data-app-slug="jardin-de-joyas"]')){
   const valor=tarjeta.querySelector('.downloads strong');
   const etiqueta=tarjeta.querySelector('.downloads span');
   const nota=tarjeta.querySelector('.downloads small');
   if(valor)valor.textContent=suma.toLocaleString('es-ES');
   if(etiqueta)etiqueta.textContent='Descargas acumuladas';
   if(nota)nota.textContent='APK publicadas · GitHub Releases';
  }
 }
 // El catálogo crea y vuelve a actualizar las fichas de forma asíncrona.
 document.addEventListener('biblioteca:cards-ready',actualizarTarjetas);
 try{
  const api='https://api.github.com/repos/pastranaalex-glitch/pastranaalex-glitch.github.io/releases?per_page=100';
  const resp=await fetch(api,{headers:{Accept:'application/vnd.github+json'}});
  if(!resp.ok)throw Error('HTTP '+resp.status);
  const releases=await resp.json();
  if(!Array.isArray(releases))throw Error('Formato');
  const ids=new Set();let total=0,archivos=0;
  for(const release of releases){
   if(release.draft||release.prerelease)continue;
   const tag=String(release.tag_name||'');
   for(const asset of (Array.isArray(release.assets)?release.assets:[])){
    if(!asset||asset.state!=='uploaded'||ids.has(asset.id))continue;
    const name=String(asset.name||'');
    if(!/\.apk$/i.test(name))continue;
    if(!/^jardin-de-joyas-v/i.test(tag)&&!/^Jardin_de_Joyas[_.-]/i.test(name))continue;
    ids.add(asset.id);archivos++;total+=Math.max(0,Number(asset.download_count)||0);
   }
  }
  if(archivos<1)throw Error('No hay APK disponibles');
  suma=total;
  if(out){
   out.textContent=suma.toLocaleString('es-ES')+' descargas registradas en GitHub · '+archivos+' archivo'+(archivos===1?'':'s')+' de Jardín de Joyas';
   out.title='Suma de descargas de APK disponibles en GitHub Releases. Las versiones eliminadas pueden perderse del total. No representa jugadores únicos.';
  }
  actualizarTarjetas();
 }catch(_){
  if(out)out.textContent='Contador temporalmente no disponible. No afecta a las descargas.';
  // No interferir con las fichas ni con los botones de descarga.
 }
})();
