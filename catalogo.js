/* Biblioteca Pack 8: catálogo ampliable sin tocar las páginas HTML. */
(() => {
  'use strict';
  const slots={android:document.getElementById('catalog-android-extra'),windows:document.getElementById('catalog-windows-extra')};
  if (!slots.android && !slots.windows) return;
  const mk=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=String(value);return el;};
  const allowedLink=(input)=>{
    try {
      const u=new URL(input,location.href);
      if(u.protocol!=='https:' && !(u.origin===location.origin && u.protocol==='http:'))return null;
      // Public detail pages here, or official public GitHub release pages (not arbitrary websites).
      if(u.origin===location.origin && /\.(?:html)(?:$)/i.test(u.pathname))return u.href;
      if(u.hostname==='github.com' && /^\/[^/]+\/[^/]+\/releases(?:\/.*)?$/.test(u.pathname))return u.href;
      return null;
    }catch(_){return null;}
  };
  async function start(){
    try {
      const response=await fetch('catalogo.json',{cache:'no-store'});
      if(!response.ok)return;
      const parsed=await response.json();
      if(!parsed || !Array.isArray(parsed.aplicaciones))return;
      const count={android:0,windows:0};
      const seen=new Set();
      for(const a of parsed.aplicaciones.slice(0,60)){
        if(!a || a.publicado!==true || !['android','windows'].includes(a.plataforma))continue;
        const title=typeof a.nombre==='string' ? a.nombre.trim().slice(0,90):'';
        const desc=typeof a.descripcion==='string' ? a.descripcion.trim().slice(0,500):'';
        const href=allowedLink(a.enlace);
        const key=a.plataforma+':'+title.toLowerCase();
        if(!title || !desc || !href || seen.has(key))continue;
        seen.add(key);
        const slot=slots[a.plataforma];if(!slot)continue;
        const article=mk('article','pack8-extra-app');
        article.append(mk('div','pack8-extra-symbol',a.plataforma==='windows'?'W':'A'));
        const content=mk('div');
        content.append(mk('h3',null,title));
        content.append(mk('p',null,desc));
        const meta=mk('div','pack8-extra-meta');
        meta.append(mk('span',null,a.plataforma==='windows'?'Windows':'Android'));
        meta.append(mk('span',null,'Gratuito'));
        if(typeof a.version==='string' && a.version.trim())meta.append(mk('span',null,'Versión '+a.version.trim().slice(0,22)));
        content.append(meta);
        const link=mk('a',null,'Ver aplicación y descarga →');
        link.href=href;link.rel='noopener noreferrer';
        if(new URL(href).origin!==location.origin)link.target='_blank';
        content.append(link);article.append(content);slot.append(article);
        count[a.plataforma]++;
      }
      const a=document.getElementById('catalog-android-count');
      if(a && count.android)a.textContent=(count.android+1)+' aplicaciones disponibles';
      const w=document.getElementById('catalog-windows-count');
      if(w && count.windows)w.textContent=count.windows===1?'1 aplicación disponible':count.windows+' aplicaciones disponibles';
      if(count.windows){const empty=document.getElementById('catalog-windows-empty');if(empty)empty.hidden=true;}
    } catch(_) { /* La lista estable de Lector Fácil sigue disponible si el archivo no carga. */ }
  }
  start();
})();
