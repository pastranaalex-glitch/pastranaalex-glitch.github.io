/* Herramientas Teocráticas: recuentos públicos de descargas de GitHub Releases.
   No se cuentan las visitas ni se guardan datos personales de los visitantes. */
(() => {
  'use strict';
  const fileNames=Object.freeze({
    'mis-horas-predicacion':'MisHorasPredicacion_1.5.0_Pack7.7.apk',
    'lector-facil':'LectorFacil-v1.0.5.apk',
    'panel-del-precursor':'PanelDelPrecursor_Setup_2.1.1.exe'
  });
  const prefix='https://github.com/pastranaalex-glitch/pastranaalex-glitch.github.io/releases/download/';
  let data=null;
  function record(id) {
    const d=data?.aplicaciones?.[id];
    if (!d || !Number.isSafeInteger(d.descargas) || d.descargas<0 || d.disponible!==true) return null;
    if (typeof d.enlace!=='string' || !d.enlace.startsWith(prefix)) return null;
    try {
      const u=new URL(d.enlace);
      if (u.origin!=='https://github.com' || u.search || u.hash ||
          decodeURIComponent(u.pathname.split('/').pop()||'')!==fileNames[id]) return null;
    } catch {return null;}
    return d;
  }
  function updateUI() {
    document.querySelectorAll('[data-ht-count]').forEach(el=>{
      const id=el.dataset.htCount;
      if (!Object.hasOwn(fileNames,id)) return;
      const d=record(id);
      const label=d ? d.descargas.toLocaleString('es-ES')+(d.descargas===1?' descarga registrada':' descargas registradas') : 'Recuento pendiente';
      if(el.textContent!=='📥 '+label) el.textContent='📥 '+label;
      el.title=d ? 'Descargas de GitHub Releases desde la activación del contador. No son instalaciones ni personas únicas.' : 'La descarga sigue disponible mientras se activa el contador.';
    });
    document.querySelectorAll('a[data-ht-download]').forEach(el=>{
      const id=el.dataset.htDownload;
      if (!Object.hasOwn(fileNames,id)) return;
      const d=record(id);
      if (d) {
        el.href=d.enlace;
        el.removeAttribute('download');
        el.rel='noopener noreferrer';
        el.title='Descarga registrada por GitHub Releases';
      }
    });
  }
  const dialog=document.getElementById('dialog-content');
  if(dialog) new MutationObserver(updateUI).observe(dialog,{childList:true});
  async function load() {
    try {
      const r=await fetch('descargas-teocraticas.json',{cache:'no-store'});
      if(!r.ok) throw Error('Sin datos');
      const parsed=await r.json();
      if(parsed?.version!==1 || !parsed?.aplicaciones || typeof parsed.aplicaciones!=='object') throw Error('Formato incorrecto');
      data=parsed;
    } catch {data=null;}
    updateUI();
  }
  updateUI();
  load();
})();