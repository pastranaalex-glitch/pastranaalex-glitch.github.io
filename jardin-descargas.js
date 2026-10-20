/* Jardín de Joyas: suma descargas de APK públicas de todas las versiones disponibles en GitHub.
 * GitHub no conserva aquí las cifras de archivos/releases eliminados; por eso mostramos
 * 'registradas' y no afirmamos conocer las instalaciones únicas ni todo el histórico.
 */
(async()=>{'use strict';
const out=document.getElementById('jj-descargas-acumuladas');
if(!out)return;
try{
 const api='https://api.github.com/repos/pastranaalex-glitch/pastranaalex-glitch.github.io/releases?per_page=100';
 const respuesta=await fetch(api,{headers:{Accept:'application/vnd.github+json'}});
 if(!respuesta.ok)throw Error('HTTP '+respuesta.status);
 const releases=await respuesta.json();
 if(!Array.isArray(releases))throw Error('Formato');
 const ids=new Set();let suma=0;let archivos=0;
 for(const release of releases){
  if(release.draft||release.prerelease)continue;
  const tag=String(release.tag_name||'');
  for(const asset of (Array.isArray(release.assets)?release.assets:[])){
   if(!asset||asset.state!=='uploaded'||ids.has(asset.id))continue;
   const name=String(asset.name||'');
   if(!/\.apk$/i.test(name))continue;
   if(!/^jardin-de-joyas-v/i.test(tag)&&!/^Jardin_de_Joyas[_-.]/i.test(name))continue;
   ids.add(asset.id);
   archivos++;suma+=Math.max(0,Number(asset.download_count)||0);
  }
 }
 if(archivos<1)throw Error('Sin publicaciones reconocidas');
 out.textContent=suma.toLocaleString('es-ES')+' descargas registradas en GitHub · '+archivos+' archivo'+(archivos===1?'':'s')+' de Jardín de Joyas';
 out.title='Suma de descargas de APK disponibles en GitHub Releases. Si se elimina una versión, su historial deja de estar disponible. No equivale a jugadores únicos.';
}catch(_){
 out.textContent='Contador temporalmente no disponible. No afecta a las descargas.';
}
})();
