/* Biblioteca Pack 6. Catálogo centralizado y estadísticas públicas de GitHub. */
(()=>{'use strict';
const owner='pastranaalex-glitch', slot=document.querySelector('[data-catalog-slot]'),isHome=document.body.dataset.pack6Page==='inicio';
const fmt=n=>Number(n).toLocaleString('es-ES');
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-ES');
const safe=(v)=>typeof v==='string'?v:'';
const menuToggle=document.getElementById('menu-toggle'),menu=document.getElementById('menu-principal');
if(menuToggle&&menu){
 document.documentElement.classList.add('has-v2-menu');
 const close=()=>{menu.classList.remove('is-open');menuToggle.setAttribute('aria-expanded','false');};
 menuToggle.addEventListener('click',()=>{let open=menu.classList.toggle('is-open');menuToggle.setAttribute('aria-expanded',String(open));});
 menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
 document.addEventListener('pointerdown',e=>{if(!menu.contains(e.target)&&!menuToggle.contains(e.target))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 window.addEventListener('resize',()=>{if(innerWidth>700)close();});
}
if(!slot)return;
const fallback=document.getElementById('catalog-fallback');
const validApp=a=>a&&a.publicado===true&&['android','windows'].includes(a.plataforma)&&/^[a-z0-9-]+$/.test(a.slug||'')&&(a.repo===owner+'/'+a.slug||(['menu-y-compra','mi-salud-familiar','mi-dinero-real','en-familia'].includes(a.slug)&&a.repo===owner+'/'+owner+'.github.io'))&&safe(a.nombre)&&safe(a.descripcion)&&safe(a.enlace)==='https://'+owner+'.github.io/'+a.slug+'.html';
const assetValid=(asset,a)=>asset&&typeof asset.name==='string'&&typeof asset.browser_download_url==='string'&&asset.browser_download_url.startsWith('https://github.com/'+a.repo+'/releases/download/')&&(a.plataforma==='windows'?/\.(zip|exe|msi)$/i:/\.apk$/i).test(asset.name)&&!/debug|unsigned|sin.firmar/i.test(asset.name)&&(a.slug!=='mi-salud-familiar'||(asset.name==='MiSaludFamiliar_2.9_Publicacion_Firmada.apk'&&asset.browser_download_url.startsWith('https://github.com/'+a.repo+'/releases/download/mi-salud-familiar-v2.9/')))&&(a.slug!=='menu-y-compra'||/^Menu_y_Compra_.*\.apk$/i.test(asset.name))&&(a.slug!=='en-familia'||(asset.name==='En_Familia_1.7.2_Publicacion_Firmada.apk'&&asset.digest==='sha256:ca60248d387a2b928e1745becb0332f576229e23b451759bb61bb4e07a9deb0e'&&asset.browser_download_url.startsWith('https://github.com/'+a.repo+'/releases/download/en-familia-v1.7.2/')));
const mk=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
let apps=[],platform='todos',category='todas',query='',compact=false;
function card(a){
 const article=mk('article','app-card');article.dataset.appCard='';article.dataset.platform=a.plataforma;article.dataset.categories=(a.categorias||[]).join(' ');article.dataset.search=normalize(a.nombre+' '+a.descripcion+' '+(a.categorias||[]).join(' '));article.dataset.repo=a.repo;
 const art=mk('div','card-art card-art-'+a.slug);
 const copy=mk('div','card-art-copy');copy.append(mk('span','art-tag',a.etiqueta||'APP GRATUITA'),mk('strong',null,a.eslogan||a.nombre),mk('span',null,a.plataforma==='windows'?'Para tu ordenador':'Para tu móvil'));art.append(copy);
 if(a.imagen&&/^[\w\s.()-]+\.(webp|jpeg|jpg|png)$/i.test(a.imagen)){const holder=mk('div','card-phone card-phone-'+a.slug);const img=mk('img');img.src=a.imagen;img.alt='Captura real de '+a.nombre;img.loading='lazy';img.decoding='async';holder.append(img);art.append(holder);}else{const holder=mk('div','pack6-art-logo');const mark=mk('img');mark.src=a.icono;mark.alt='';mark.loading='lazy';mark.decoding='async';holder.append(mark);art.append(holder);}
 const body=mk('div','card-body'),identity=mk('div','app-identity'),icon=mk('img','app-icon');icon.src=a.icono;icon.alt='';icon.loading='lazy';icon.width=54;icon.height=54;
 const names=mk('div');names.append(mk('h3',null,a.nombre),mk('p',null,(a.plataforma==='windows'?'Windows':'Android')+' · '+((a.categorias||[])[0]||'Herramientas')));identity.append(icon,names,mk('span','free-label','Gratis'));
 const desc=mk('p','app-description',a.descripcion),meta=mk('div','app-meta');meta.append(mk('span',null,'Versión '+(a.version||'actual')),mk('span',null,a.plataforma==='windows'?'Windows':'Android'));
 const footer=mk('div','card-footer'),stats=mk('div','downloads'),strong=mk('strong',null,'—'),label=mk('span',null,'Consultando descargas'),small=mk('small',null,'GitHub Releases');stats.append(strong,label,small);
 const actions=mk('div','card-actions'),detail=mk('a','button button-outline','Ver ficha'),dl=mk('a','button button-dark','Descargar ↓');detail.href=a.enlace;
 dl.href=a.slug==='mi-dinero-real'?'MiDineroReal2_2.5.1_Publicacion_Firmada.apk':a.slug==='menu-y-compra'?'Menu_y_Compra_1.4.3_Publicacion_Firmada.apk':a.slug==='mi-salud-familiar'?'https://github.com/'+a.repo+'/releases/tag/mi-salud-familiar-v2.9':a.slug==='en-familia'?'https://github.com/'+a.repo+'/releases/tag/en-familia-v1.7.2':'https://github.com/'+a.repo+'/releases/latest';dl.rel='noopener noreferrer';if(a.plataforma==='windows')dl.target='_blank';
 actions.append(detail,dl);footer.append(stats,actions);body.append(identity,desc,meta,footer);article.append(art,body);
 a.node=article;a.stat=strong;a.label=label;a.downloadLink=dl;return article;
}
function filters(){
 let visible=0;for(const a of apps){if(!a.node)continue;const match=(platform==='todos'||platform===a.plataforma)&&(category==='todas'||(a.categorias||[]).includes(category))&&query.split(/\s+/).filter(Boolean).every(w=>a.node.dataset.search.includes(w));a.node.hidden=!match;if(match)visible++;}
 document.querySelectorAll('[data-filter]').forEach(b=>{const on=b.dataset.filter===platform;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});
 document.querySelectorAll('[data-category-filter]').forEach(b=>{const on=b.dataset.categoryFilter===category;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});
 const empty=document.getElementById('empty-results');if(empty)empty.hidden=visible!==0;
 const status=document.getElementById('results-status');if(status)status.textContent=visible+' aplicaciones encontradas';
}
function wire(){
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{platform=b.dataset.filter;filters();}));
 document.querySelectorAll('[data-category-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.categoryFilter;filters();}));
 const search=document.getElementById('search-apps');if(search)search.addEventListener('input',()=>{query=normalize(search.value.trim());filters();});
 const reset=document.getElementById('reset-search');if(reset)reset.addEventListener('click',()=>{platform='todos';category='todas';query='';if(search){search.value='';search.focus();}filters();});
 const view=document.getElementById('view-toggle');if(view)view.addEventListener('click',()=>{compact=!compact;slot.classList.toggle('is-compact',compact);view.setAttribute('aria-pressed',String(compact));view.textContent=compact?'▦ Mostrar imágenes':'☷ Vista compacta';});
}
async function github(a){
 // Menú y Compra se distribuye como archivo local: nunca consultar releases de este repositorio,
 // ya que contienen APK de otras aplicaciones (por ejemplo Rutas a Pie).
 if(a.slug==='mi-dinero-real'||a.slug==='menu-y-compra'){a.count=undefined;return;}
 try{const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),9000);let resp;try{resp=await fetch('https://api.github.com/repos/'+a.repo+'/releases?per_page=100',{headers:{Accept:'application/vnd.github+json'},signal:ctrl.signal});}finally{clearTimeout(timer);}
 if(!resp.ok)throw Error('API '+resp.status);
 const rel=(await resp.json()).filter(r=>r&&!r.draft&&!r.prerelease&&(a.slug!=='mi-salud-familiar'||r.tag_name==='mi-salud-familiar-v2.9')&&(a.slug!=='en-familia'||r.tag_name==='en-familia-v1.7.2'));
 const list=rel.flatMap(r=>(r.assets||[]).filter(x=>assetValid(x,a)));if(a.slug==='menu-y-compra'&&!list.length){a.count=undefined;return;}a.count=list.reduce((n,x)=>n+(Number(x.download_count)||0),0);
 const chosen=rel.find(r=>(r.assets||[]).some(x=>assetValid(x,a)));const asset=chosen?.assets.find(x=>assetValid(x,a));
 if(asset){a.url=asset.browser_download_url;a.date=Date.parse(chosen.published_at||chosen.created_at||'')||0;a.releaseName=chosen.name||chosen.tag_name||a.nombre;a.hasRelease=true;}
 }catch(e){a.failed=true;}
}
function updateLink(a){if(!a.node)return;if(a.count!==undefined){a.stat.textContent=fmt(a.count);a.label.textContent=a.count===1?'Descarga pública':'Descargas públicas';}else a.label.textContent='Consultar en GitHub';if(a.slug==='mi-dinero-real'){a.downloadLink.href='MiDineroReal2_2.5.1_Publicacion_Firmada.apk';a.downloadLink.setAttribute('download','MiDineroReal2_2.5.1_Publicacion_Firmada.apk');a.label.textContent='Descarga directa';a.stat.textContent='APK';}else if(a.slug==='menu-y-compra'){a.downloadLink.href='Menu_y_Compra_1.4.3_Publicacion_Firmada.apk';a.downloadLink.setAttribute('download','Menu_y_Compra_1.4.3_Publicacion_Firmada.apk');a.label.textContent='Descarga directa';a.stat.textContent='APK';}else if(a.url){a.downloadLink.href=a.url;}}
function featureList(){
 const valid=apps.filter(a=>a.hasRelease),windows=valid.filter(a=>a.plataforma==='windows').sort((a,b)=>b.count-a.count),byDate=[...valid].sort((a,b)=>b.date-a.date),byCount=[...valid].sort((a,b)=>b.count-a.count);
 const selected=[];const add=a=>{if(a&&!selected.includes(a))selected.push(a);};
 add(byDate[0]);add(byCount[0]);add(windows[0]);
 [...byDate,...byCount,...apps].forEach(a=>{if(selected.length<3)add(a);});
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
 el.title='Mínimo de descargas registradas en GitHub Releases. No incluye las descargas directas ni datos no disponibles.';
}
async function start(){
 try{
 const r=await fetch('catalogo.json',{cache:'no-store'});if(!r.ok)throw Error('Catálogo');const data=await r.json();if(!data||!Array.isArray(data.aplicaciones))throw Error('Datos');
 const menu=data.aplicaciones.find(a=>a.slug==='menu-y-compra');
 if(menu&&!menu.publicado){try{const f=await fetch('Menu_y_Compra_1.4.3_Publicacion_Firmada.apk',{method:'HEAD',cache:'no-store'});if(f.ok)menu.publicado=true;}catch(_){}}
 apps=data.aplicaciones.filter(validApp).slice(0,60);if(!apps.length)throw Error('Sin apps');
 if(isHome){const defaults=[apps.find(a=>a.slug==='rutas-a-pie'),apps.find(a=>a.slug==='recetario-facil'),apps.find(a=>a.slug==='cocina-clara')].filter(Boolean);defaults.forEach(a=>slot.append(card(a)));}
 else apps.forEach(a=>slot.append(card(a)));
 if(fallback)fallback.remove();
 const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=String(v);};
 set('total-apps',apps.length);set('hero-apps',apps.length);set('android-apps',apps.filter(a=>a.plataforma==='android').length);set('windows-apps',apps.filter(a=>a.plataforma==='windows').length);
 const count=document.querySelector('[data-filter-count="todos"]');if(count)count.textContent=apps.length;
 if(!isHome){wire();filters();}
 await Promise.all(apps.map(github));
 if(isHome){const featured=featureList();slot.replaceChildren(...featured.map(a=>{if(!a.node)card(a);return a.node;}));}
 apps.forEach(updateLink);totals();if(isHome)headline();
 }catch(e){console.warn('La Biblioteca conserva sus enlaces alternativos.',e);}
}
start();
})();
