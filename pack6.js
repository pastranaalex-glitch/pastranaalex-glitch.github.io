/* Biblioteca Pack 6. Catálogo centralizado y estadísticas públicas de GitHub. */
(()=>{'use strict';
const owner='pastranaalex-glitch', slot=document.querySelector('[data-catalog-slot]'),isHome=document.body.dataset.pack6Page==='inicio';
const fmt=n=>Number(n).toLocaleString('es-ES');
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-ES');
const safe=(v)=>typeof v==='string'?v:'';
if(!slot)return;
const fallback=document.getElementById('catalog-fallback');
const validApp=a=>a&&a.publicado===true&&['android','windows'].includes(a.plataforma)&&/^[a-z0-9-]+$/.test(a.slug||'')&&(a.repo===owner+'/'+a.slug||(['menu-y-compra','mi-salud-familiar','mi-dinero-real','en-familia','jardin-de-joyas','mente-activa-pro'].includes(a.slug)&&a.repo===owner+'/'+owner+'.github.io'))&&safe(a.nombre)&&safe(a.descripcion)&&safe(a.enlace)==='https://'+owner+'.github.io/'+a.slug+'.html';
/* La descarga nunca depende de una consulta a la API de GitHub.
   Fijamos versión, nombre y SHA-256 a los metadatos verificados del catálogo. */
const approvedDownload=a=>{
 if(a&&a.disponible===false)return '';
 const d=a&&a.descarga;
 if(!d||d.version!==a.version||typeof a.repo!=='string'
   ||!/^[a-zA-Z0-9._-]+$/.test(d.tag||'')
   ||!/^[a-zA-Z0-9._()-]+\.(apk|exe|zip|msi)$/i.test(d.archivo||'')
   ||!/^[a-f0-9]{64}$/.test(d.sha256||'')
   ||(a.plataforma==='windows'?!/\.(exe|zip|msi)$/i.test(d.archivo):!/\.apk$/i.test(d.archivo)))return '';
 return 'https://github.com/'+a.repo+'/releases/download/'+d.tag+'/'+d.archivo;
};
const assetValid=(asset,a)=>{
 const url=approvedDownload(a);
 return !!(url&&asset&&asset.state==='uploaded'
   &&asset.name===a.descarga.archivo
   &&asset.digest==='sha256:'+a.descarga.sha256
   &&asset.browser_download_url===url);
};
const mk=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
let apps=[],platform='todos',category='todas',query='',compact=false;
function card(a){
 const paused=a.disponible===false;
 const article=mk('article','app-card');article.dataset.appCard='';article.dataset.appSlug=a.slug;article.dataset.platform=a.plataforma;article.dataset.categories=(a.categorias||[]).join(' ');article.dataset.search=normalize(a.nombre+' '+a.descripcion+' '+(a.categorias||[]).join(' '));article.dataset.repo=a.repo;
 if(a.valoracionesDisponibles===false)article.dataset.ratingDisabled='true';
 const art=mk('div','card-art card-art-'+a.slug);
 const copy=mk('div','card-art-copy');copy.append(mk('span','art-tag',a.etiqueta||'APP GRATUITA'),mk('strong',null,a.eslogan||a.nombre),mk('span',null,a.plataforma==='windows'?'Para tu ordenador':'Para tu móvil'));art.append(copy);
 const image=a.portada||a.imagen,isCover=Boolean(a.portada)||a.slug==='jardin-de-joyas';if(isCover)art.classList.add('is-promo-cover');
 if(image&&/^[\w\s.()-]+\.(webp|jpeg|jpg|png)$/i.test(image)){const holder=mk('div','card-phone card-phone-'+a.slug);const img=mk('img');img.src=image;img.alt=(isCover?'Portada promocional de ':'Captura real de ')+a.nombre;img.loading='lazy';img.decoding='async';holder.append(img);art.append(holder);}else{const holder=mk('div','pack6-art-logo');const mark=mk('img');mark.src=a.icono;mark.alt='';mark.loading='lazy';mark.decoding='async';holder.append(mark);art.append(holder);}
 const body=mk('div','card-body'),identity=mk('div','app-identity'),icon=mk('img','app-icon');icon.src=a.icono;icon.alt='';icon.loading='lazy';icon.width=54;icon.height=54;
 const names=mk('div');names.append(mk('h3',null,a.nombre),mk('p',null,(a.plataforma==='windows'?'Windows':'Android')+' · '+((a.categorias||[])[0]||'Herramientas')));identity.append(icon,names,mk('span','free-label',paused?'En reparación':'Gratis'));
 const short={'lector-facil':'Lee PDF y Word, prepara exposiciones y guarda marcadores.','recetario-facil':'52 recetas ilustradas, con búsqueda y preparación paso a paso.','rutas-a-pie':'Explora 225 rutas por España y graba tus recorridos con GPS.'};
 const desc=mk('p','app-description',isHome&&short[a.slug]?short[a.slug]:a.descripcion),meta=mk('div','app-meta');meta.append(mk('span',null,'Versión '+(a.version||'actual')),mk('span',null,a.plataforma==='windows'?'Windows':'Android'));
 const footer=mk('div','card-footer'),stats=mk('div','downloads'),strong=mk('strong',null,'—'),label=mk('span',null,'Consultando descargas'),small=mk('small',null,'GitHub Releases');stats.append(strong,label,small);
 const actions=mk('div','card-actions'),detail=mk('a','button button-outline','Ver aplicación →'),dl=mk(paused?'button':'a','button button-dark',paused?'Descarga suspendida':'Descargar ↓');detail.href=a.enlace;
 const direct=approvedDownload(a);
 if(paused){dl.type='button';dl.disabled=true;dl.setAttribute('aria-disabled','true');dl.title='Jardín de Joyas temporalmente no disponible hasta completar la reparación';dl.style.opacity='0.65';dl.style.cursor='not-allowed';}
 else if(direct){dl.href=direct;dl.title='Descargar la versión '+a.version+' desde GitHub Releases';}
 else{dl.href=a.enlace;dl.textContent='Ver descarga →';dl.title='Consultar la ficha antes de descargar';}
 if(!paused){dl.rel='noopener noreferrer';if(a.plataforma==='windows')dl.target='_blank';}
 actions.append(detail,dl);footer.append(stats,actions);body.append(identity,desc);if(paused){body.append(mk('p','ui-warning','Temporalmente no disponible hasta completar la reparación.'));strong.textContent='—';label.textContent='Consultando historial';small.textContent='GitHub Releases';}if(a.slug==='cocina-a-punto'){const notice=mk('a','ui-warning','1 detección en VirusTotal · En revisión');notice.href='cocina-a-punto.html#informacion-descarga';body.append(notice);}body.append(meta,footer);article.append(art,body);
 a.node=article;a.stat=strong;a.label=label;a.downloadLink=dl;return article;
}
function filters(){
 let visible=0;for(const a of apps){if(!a.node)continue;const match=(platform==='todos'||platform===a.plataforma)&&(category==='todas'||(a.categorias||[]).includes(category))&&query.split(/\s+/).filter(Boolean).every(w=>a.node.dataset.search.includes(w));a.node.hidden=!match;if(match)visible++;}
 document.querySelectorAll('[data-filter]').forEach(b=>{const on=b.dataset.filter===platform;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});
 document.querySelectorAll('[data-category-filter]').forEach(b=>{const on=b.dataset.categoryFilter===category;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});
 const empty=document.getElementById('empty-results');if(empty)empty.hidden=visible!==0;
 const status=document.getElementById('results-status');if(status)status.textContent=visible===1?'1 aplicación encontrada':visible+' aplicaciones encontradas';
}
function wire(){
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{platform=b.dataset.filter;filters();}));
 document.querySelectorAll('[data-category-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.categoryFilter;filters();}));
 const search=document.getElementById('search-apps');if(search)search.addEventListener('input',()=>{query=normalize(search.value.trim());filters();});
 const reset=document.getElementById('reset-search');if(reset)reset.addEventListener('click',()=>{platform='todos';category='todas';query='';if(search){search.value='';search.focus();}filters();});
 const view=document.getElementById('view-toggle');if(view)view.addEventListener('click',()=>{compact=!compact;slot.classList.toggle('is-compact',compact);view.setAttribute('aria-pressed',String(compact));view.textContent=compact?'▦ Mostrar imágenes':'☷ Vista compacta';});
}
/* Contadores acumulados de GitHub Releases.
   Suma todas las publicaciones públicas aún disponibles, no solo la versión actual.
   Los APK de aplicaciones distintas alojadas en el mismo repositorio no se mezclan.
   Cada repositorio se consulta una sola vez, con paginación para conservar el historial. */
const sharedRepo=owner+'/'+owner+'.github.io';
const releaseRequests=new Map();
const extraRepos={'rutas-a-pie':[sharedRepo]};
function listReleases(repo){
 if(!releaseRequests.has(repo)){
  releaseRequests.set(repo,(async()=>{
   const all=[];
   for(let page=1;page<=10;page++){
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),8500);
    let response;
    try{
     response=await fetch('https://api.github.com/repos/'+repo+'/releases?per_page=100&page='+page,
      {headers:{Accept:'application/vnd.github+json'},signal:ctrl.signal});
    }finally{clearTimeout(timer);}
    if(!response.ok)throw Error('GitHub API '+response.status);
    const chunk=await response.json();
    if(!Array.isArray(chunk))throw Error('Respuesta de GitHub no válida');
    all.push(...chunk);
    if(chunk.length<100)return all;
   }
   throw Error('Hay más páginas de las que se han podido consultar');
  })());
 }
 return releaseRequests.get(repo);
}
function belongsToApp(asset,release,a,repo){
 if(!asset||asset.state!=='uploaded'||typeof asset.name!=='string'
  ||typeof asset.browser_download_url!=='string')return false;
 const name=asset.name,tag=String(release.tag_name||'');
 if(!/\.(apk|exe|msi|zip)$/i.test(name)||/debug|unsigned|sin[._-]?firmar/i.test(name))return false;
 if(!asset.browser_download_url.startsWith('https://github.com/'+repo+'/releases/download/'))return false;
 if(a.plataforma==='android'?!/\.apk$/i.test(name):!/\.(exe|msi|zip)$/i.test(name))return false;
 if(repo!==sharedRepo)return repo===a.repo;
 switch(a.slug){
  case 'jardin-de-joyas':
   return (/^jardin-de-joyas-v/i.test(tag)||tag==='V.1.4.1')&&/^Jardin[_-]de[_-]Joyas/i.test(name);
  case 'mente-activa-pro':
   return /^mente-activa-pro-v/i.test(tag)&&/^Mente[_-]Activa[_-]PRO/i.test(name);
  case 'en-familia':
   return /^en-familia-v/i.test(tag)&&/^En[_-]Familia/i.test(name);
  case 'mi-salud-familiar':
   return /^mi-salud-familiar-v/i.test(tag)&&/^Mi[_-]?Salud[_-]?Familiar/i.test(name);
  case 'menu-y-compra':
   return (/^menu-y-compra-v/i.test(tag)||tag==='v.1.4.3')&&/^Menu[_-]y[_-]Compra/i.test(name);
  case 'rutas-a-pie':
   return tag==='v.1.5.1'&&name==='RutasAPie_1.5.1.apk';
  default:return false;
 }
}
async function github(a){
 try{
  const repos=[a.repo,...(extraRepos[a.slug]||[])];
  const sources=await Promise.all(repos.map(async repo=>({repo,releases:await listReleases(repo)})));
  const ids=new Set(),usedRepos=new Set();let total=0;
  for(const source of sources){
   for(const release of source.releases){
    if(!release||release.draft||release.prerelease)continue;
    for(const asset of (Array.isArray(release.assets)?release.assets:[])){
     if(!belongsToApp(asset,release,a,source.repo))continue;
     const id=source.repo+':'+(asset.id??(release.tag_name+':'+asset.name));
     if(ids.has(id))continue;
     ids.add(id);usedRepos.add(source.repo);
     const n=Number(asset.download_count);
     if(Number.isFinite(n)&&n>=0)total+=n;
    }
   }
  }
  if(!ids.size){a.failed=true;return;}
  a.count=total;a.countedAssets=ids.size;a.countedRepos=usedRepos.size;
  const current=sources[0].releases.find(r=>r&&!r.draft&&!r.prerelease&&r.tag_name===a.descarga?.tag);
  const verified=current?.assets?.find(x=>assetValid(x,a));
  if(verified){
   a.date=Date.parse(current.published_at||current.created_at||'')||0;
   a.releaseName=current.name||current.tag_name||a.nombre;a.hasRelease=true;
  }
 }catch(_){a.failed=true;}
}
function updateLink(a){
 if(!a.node)return;
 if(Number.isFinite(a.count)){
  a.stat.textContent=fmt(a.count);
  a.label.textContent=a.count===1?'Descarga acumulada':'Descargas acumuladas';
  const releases=a.countedAssets;
  a.node.querySelector('.downloads small').textContent=
   'GitHub · '+releases+' archivo'+(releases===1?'':'s')+(a.countedRepos>1?' · '+a.countedRepos+' repos':'');
  a.node.querySelector('.downloads').title=
   'Todas las versiones disponibles en GitHub Releases. No incluye descargas directas desde la web ni publicaciones eliminadas. No son instalaciones únicas.';
 }else{
  a.stat.textContent='—';a.label.textContent='Contador no disponible';
  a.node.querySelector('.downloads small').textContent='La descarga sigue disponible';
 }
 const direct=approvedDownload(a);
 if(direct&&a.downloadLink?.tagName==='A')a.downloadLink.href=direct;
}
function featureList(){
 const selected=['lector-facil','recetario-facil','rutas-a-pie'].map(slug=>apps.find(a=>a.slug===slug)).filter(Boolean);
 for(const a of apps){if(selected.length<3&&a.slug!=='jardin-de-joyas'&&!selected.includes(a))selected.push(a);}
 return selected.slice(0,3);
}
function headline(){const latest=apps.filter(a=>a.hasRelease).sort((a,b)=>b.date-a.date)[0];if(!latest)return;
 const d=document.getElementById('latest-news-description'),link=document.getElementById('latest-news-link');
 if(d)d.textContent='Última versión publicada: '+latest.nombre+' ('+(latest.version||latest.releaseName)+'). Descubre sus funciones y novedades.';
 if(link){link.href=latest.enlace;link.textContent='Ver '+latest.nombre+' →';}
}
function totals(){
 const el=document.getElementById('hero-downloads');if(!el)return;
 const known=apps.filter(a=>Number.isFinite(a.count)&&a.count>=0);
 if(!known.length){el.textContent='—';el.title='GitHub no ha proporcionado datos de descargas';return;}
 const counted=known.reduce((n,a)=>n+a.count,0);
 el.textContent='≥ '+fmt(counted);
 el.title='Suma de descargas acumuladas de todas las versiones todavía publicadas en GitHub Releases. No incluye descargas directas, publicaciones eliminadas ni usuarios únicos.';
}
async function start(){
 try{
 const r=await fetch('catalogo.json',{cache:'no-store'});if(!r.ok)throw Error('Catálogo');const data=await r.json();if(!data||!Array.isArray(data.aplicaciones))throw Error('Datos');
 apps=data.aplicaciones.filter(validApp).slice(0,60);if(!apps.length)throw Error('Sin apps');
 if(isHome){slot.replaceChildren(...featureList().map(card));}
 else apps.forEach(a=>slot.append(card(a)));
 if(fallback)fallback.remove();
 document.dispatchEvent(new Event('biblioteca:cards-ready'));
 const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v);};
 set('total-apps',apps.length);set('hero-apps',apps.length);set('android-apps',apps.filter(a=>a.plataforma==='android').length);set('windows-apps',apps.filter(a=>a.plataforma==='windows').length);
 const count=document.querySelector('[data-filter-count="todos"]');if(count)count.textContent=apps.length;
 if(!isHome){const params=new URLSearchParams(location.search);const raw=(params.get('q')||'').slice(0,120);query=normalize(raw);const search=document.getElementById('search-apps');if(search)search.value=raw;const p=params.get('platform'),c=params.get('category');if(['android','windows'].includes(p))platform=p;if(apps.some(a=>(a.categorias||[]).includes(c)))category=c;wire();filters();}
 await Promise.all(apps.map(async a=>{await github(a);updateLink(a);}));
 if(isHome){const featured=featureList();slot.replaceChildren(...featured.map(a=>{if(!a.node)card(a);return a.node;}));}
 document.dispatchEvent(new Event('biblioteca:cards-ready'));
 totals();if(isHome)headline();
 }catch(e){console.warn('La Biblioteca conserva sus enlaces alternativos.',e);}
}
start();
})();


