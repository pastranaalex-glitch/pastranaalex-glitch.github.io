(() => {
  'use strict';
  const apps = Array.isArray(window.CATALOGO_HT) ? window.CATALOGO_HT : [];
  const grid = document.getElementById('app-grid');
  const input = document.getElementById('search');
  const count = document.getElementById('catalog-count');
  const empty = document.getElementById('empty-results');
  const dialog = document.getElementById('app-dialog');
  const dialogContent = document.getElementById('dialog-content');
  const close = document.getElementById('dialog-close');
  let lastFocus = null;

  const iconPaths = {
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 6 2 2 5-5"/>',
    notebook: '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18M12 8h5m-4 4h4m-4 4h4"/>',
    book: '<path d="M12 7v14M3 18V4.5A1.5 1.5 0 0 1 4.5 3H8a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3.5A1.5 1.5 0 0 1 21 4.5V18h-5a4 4 0 0 0-4 3 4 4 0 0 0-4-3H3Z"/>',
    mobile: '<rect x="6.5" y="2" width="11" height="20" rx="2"/><path d="M10 18.5h4"/>',
    desktop: '<rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2H3ZM17 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 5v1h-3"/>'
  };
  const statuses = {'publicado':'Disponible','en-pruebas':'En pruebas','aprobado':'Pendiente de APK','pruebas-locales':'APK local en pruebas','lista-local':'Disponible en local','en-desarrollo':'En desarrollo','en-revision':'En revisión','idea':'En proyecto'};
  const categories = {reuniones:'Reuniones',predicacion:'Predicación',estudio:'Estudio personal',organizacion:'Organización'};
  const escape = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const imageIcon = a => typeof a.imagen === 'string' && /^imagenes\/[\w.\-]+\.(png|webp|jpg)$/i.test(a.imagen) ? `<img src="${escape(a.imagen)}" alt="" loading="lazy">` : icon(a.icono);
  const icon = name => `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || iconPaths.book}</svg>`;
  const norm = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
  // Mostrar descarga solo cuando exista un archivo local real en la carpeta descargas/.
  const validFile = app => ['publicado','pruebas-locales','lista-local'].includes(app.estado) && typeof app.archivo === 'string' && /^descargas\/[\w.\-%/]+\.(apk|zip|exe|msi)$/i.test(app.archivo) && !app.archivo.includes('..');
  function render(){
    const term=norm(input.value.trim());
    const shown=apps.filter(a=>norm([a.nombre,a.descripcion,a.subtitulo,categories[a.categoria],...(a.funciones||[])].join(' ')).includes(term));
    grid.innerHTML=shown.map(a=>`<article class="app-card">
      <div class="card-top"><span class="app-pictogram ${escape(a.color)}">${imageIcon(a)}</span><span class="status status-${escape(a.estado)}">${escape(statuses[a.estado]||'En proyecto')}</span></div>
      <div class="card-meta">${escape(categories[a.categoria]||'Herramienta')} <span class="meta-sep">·</span> ${escape(a.plataforma==='android'?'Android':'Windows')}</div>
      <h3>${escape(a.nombre)}</h3><p class="card-subtitle">${escape(a.subtitulo)}</p><p class="card-description">${escape(a.descripcion)}</p>${validFile(a) ? `<p class="ht-download-counter" data-ht-count="${escape(a.id)}">📥 Recuento pendiente</p>` : ""}${a.relacionado ? `<p class="connected-note">${icon("users")} Compatible con su aplicación complementaria</p>` : ""}
      <div class="card-footer"><span class="platform-chip">${icon(a.plataforma==='android'?'mobile':'desktop')}${escape(a.plataforma==='android'?'Android':'Windows')}</span><button class="card-action" type="button" data-id="${escape(a.id)}" aria-label="Ver ficha de ${escape(a.nombre)}">Ver ficha <svg class="icon"><use href="#ico-arrow"/></svg></button></div>
    </article>`).join('');
    count.textContent=`${shown.length} ${shown.length===1?'herramienta':'herramientas'}`;
    empty.hidden=shown.length!==0;
  }
  function openApp(id){
    const a=apps.find(item=>item.id===id);
    if(!a)return;
    if(!dialog.open)lastFocus=document.activeElement;
    const benefits=Array.isArray(a.funciones)?a.funciones.map(item=>`<li>${escape(item)}</li>`).join(''):'';
    const available=validFile(a) && window.HT_CONFIG?.downloadsIncluded!==false;
    const edition=[a.version?`Versión ${escape(a.version)}`:null,a.pack?`Pack ${escape(a.pack)}`:null].filter(Boolean).join(' · ');
    const groups=Array.isArray(a.ficha)?a.ficha.map(group=>`<section class="feature-group"><h3>${escape(group.titulo)}</h3><ul class="feature-list">${(group.puntos||[]).map(item=>`<li>${escape(item)}</li>`).join('')}</ul></section>`).join(''):'';
    const paired=apps.find(item=>a.relacionado===item.id);
    const pairMarkup=paired?`<section class="paired-app"><div class="paired-tag">${icon('users')} SE COMPLEMENTAN</div><h3>${escape(a.relacionTitulo||'Puedes usar estas dos aplicaciones juntas')}</h3><p>${escape(a.relacionDescripcion||'')}</p><button class="related-app-link" type="button" data-related="${escape(paired.id)}">Ver también: ${escape(paired.nombre)} ${icon('desktop')}</button></section>`:'';
    dialogContent.innerHTML=`<div class="dialog-icon ${escape(a.color)}">${imageIcon(a)}</div><div class="dialog-kicker">${escape(categories[a.categoria]||'Herramienta')} · ${escape(a.plataforma==='android'?'Android':'Windows')}</div><h2 id="dialog-title">${escape(a.nombre)}</h2><p class="dialog-lead">${escape(a.descripcion)}</p>${edition ? `<p class="app-edition">${edition}</p>` : ""}${groups?`<div class="feature-groups">${groups}</div>`:`<h3>Qué ofrece</h3><ul class="feature-list">${benefits}</ul>`}${pairMarkup}<div class="download-section"><span class="status status-${escape(a.estado)}">${escape(statuses[a.estado]||'En proyecto')}</span>${available?`<a class="btn btn-primary" href="${escape(a.archivo)}" download data-ht-download="${escape(a.id)}">Descargar ${a.estado==='pruebas-locales'?(a.plataforma==='android'?'APK de prueba':'instalador de prueba'):escape(a.plataforma==='android'?'APK':'programa')} <svg class="icon"><use href="#ico-download"/></svg></a><p class="ht-download-counter" data-ht-count="${escape(a.id)}">📥 Recuento pendiente</p><p>Versión ${escape(a.version||'sin especificar')}${a.fecha?' · '+escape(a.fecha):''}. ${a.estado==='pruebas-locales'?(a.plataforma==='android'?'Solo para pruebas locales: comprueba su funcionamiento en Android. No publicar todavía.':'Solo para pruebas locales: verifica la instalación en Windows y conserva una copia de tus datos. No publicar todavía.'):'Descarga disponible. Conserva una copia de tus datos antes de actualizar.'}</p>`:(window.HT_CONFIG?.downloadsIncluded===false && validFile(a) ? '<p>Esta es la vista ligera, sin archivos instalables. La descarga está disponible en la biblioteca completa.</p>' : '<p>Esta aplicación todavía no tiene una descarga pública. La activaremos cuando haya superado las pruebas y tengamos el archivo definitivo.</p>')}</div>`;
    if(!dialog.open)dialog.showModal();close.focus();
  }
  function toast(text){
    const target=document.getElementById('toast');
    target.textContent='';
    requestAnimationFrame(()=>{target.textContent=text;});
  }
  async function share(){
    if(location.protocol==='file:'){
      toast('Para compartir una dirección pública, primero debemos publicar la página.');
      alert('Esta es una copia de prueba. El enlace público se podrá compartir cuando la web esté publicada.');
      return;
    }
    const url=location.origin+location.pathname;
    if(navigator.share){
      try {await navigator.share({title:'Herramientas Teocráticas',text:'Herramientas gratuitas, independientes y no oficiales.',url});return;}
      catch(error){if(error.name==='AbortError')return;}
    }
    try {await navigator.clipboard.writeText(url);toast('Enlace copiado al portapapeles');
      alert('Enlace de la página copiado. Ya puedes compartirlo.');
    } catch(error){prompt('Copia el enlace para compartir:',url);}
  }

  input.addEventListener('input',render);
  grid.addEventListener('click',event=>{const b=event.target.closest('button[data-id]');if(b)openApp(b.dataset.id);});
  dialogContent.addEventListener('click',event=>{
    const link=event.target.closest('button[data-related]');
    if(link && apps.some(a=>a.id===link.dataset.related))openApp(link.dataset.related);
  });
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{if(lastFocus?.isConnected)lastFocus.focus();});
  ['share-header','share-hero'].forEach(id=>document.getElementById(id).addEventListener('click',share));
  document.getElementById('year').textContent=new Date().getFullYear();

  // El formulario de sugerencias de la v11.1 se gestiona en sugerencias.js.
  render();
})();
