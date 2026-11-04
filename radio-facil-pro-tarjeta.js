/* Recuento independiente Radio Fácil PRO. No modifica las demás tarjetas.
   GitHub Releases registra descargas de archivos, no instalaciones únicas. */
(() => {
  'use strict';
  const slug='radio-facil-pro';
  const version='1.21.0';
  const owner='pastranaalex-glitch';
  const repo='pastranaalex-glitch.github.io';
  const asset='RadioFacilPRO_1.21.0.apk';
  const tag='radio-facil-pro-v1.21.0';
  const release='https://github.com/'+owner+'/'+repo+'/releases/tag/'+tag;
  const badge='https://img.shields.io/github/downloads/'+owner+'/'+repo+'/'+tag+'/'+asset+
     '?label=descargas&style=flat-square&color=147e83&cacheSeconds=300';
  const api='https://api.github.com/repos/'+owner+'/'+repo+'/releases/tags/'+tag;
  const selector='[data-app-slug="'+slug+'"] .downloads';
  let lastTarget=null, attempted=false;

  function update() {
    const container=document.querySelector(selector);
    if(!container)return;
    const number=container.querySelector('strong');
    const label=container.querySelector('span');
    const small=container.querySelector('small');
    if(!number)return;
    const present=number.textContent.trim();
    // Si el contador general ya entrega una cifra, conservarla.
    if (/^(?:≥\s*)?\d[\d.]*$/.test(present))return;
    if(number.querySelector('[data-radio-fallback]'))return;
    const link=document.createElement('a');
    link.href=release;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.title='Ver descargas de Radio Fácil PRO en GitHub';
    link.setAttribute('data-radio-fallback','');
    const img=document.createElement('img');
    img.src=badge;
    img.alt='Descargas de la APK 1.21.0 según GitHub Releases';
    img.width=148;
    img.height=20;
    img.style.cssText='display:block;max-width:100%;height:20px;object-fit:contain;object-position:left;';
    img.addEventListener('error',()=>{
      link.replaceChildren(document.createTextNode('Ver descargas en GitHub'));
    },{once:true});
    link.append(img);
    number.replaceChildren(link);
    if(label)label.textContent='Versión 1.21.0 · GitHub';
    if(small)small.textContent='Recuento de la APK';
    container.title='Descargas registradas del archivo APK; no instalaciones únicas.';
    if(lastTarget!==container){lastTarget=container;attempted=false;}
    if(!attempted){attempted=true;confirmViaApi(container);}
  }

  async function confirmViaApi(container){
    const abort=new AbortController();
    const timeout=setTimeout(()=>abort.abort(),6500);
    try{
      const response=await fetch(api,{headers:{Accept:'application/vnd.github+json'},signal:abort.signal,cache:'no-store'});
      if(!response.ok)return;
      const data=await response.json();
      const item=Array.isArray(data.assets)?data.assets.find(a=>a.name===asset&&a.state==='uploaded'):null;
      const n=item?.download_count;
      if(!Number.isSafeInteger(n)||n<0)return;
      const strong=container.querySelector('strong');
      if(!strong || !document.contains(container))return;
      strong.textContent=n.toLocaleString('es-ES');
      const label=container.querySelector('span');
      if(label)label.textContent=n===1?'Descarga de APK 1.21.0':'Descargas de APK 1.21.0';
      const small=container.querySelector('small');
      if(small)small.textContent='GitHub Releases';
    }catch(_){ /* Permanece la insignia alternativa. */ }
    finally{clearTimeout(timeout);}
  }

  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;update();});
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{schedule();observe();},{once:true});
  }else{schedule();observe();}
  function observe(){
    const grid=document.getElementById('apps-grid');
    if(!grid)return;
    const observer=new MutationObserver(schedule);
    observer.observe(grid,{childList:true,subtree:true,characterData:true});
  }
})();