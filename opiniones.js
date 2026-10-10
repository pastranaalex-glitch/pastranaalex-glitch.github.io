/* Biblioteca de herramientas: solo se publican opiniones que el administrador ha aprobado.
   No hay envío de opiniones directo desde GitHub Pages; Google Forms las recibe. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const starText = n => '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(Math.max(0, 5 - n));
  async function readJSON(path) {
    const response = await fetch(path, {cache:'no-store'});
    if (!response.ok) throw new Error('Archivo no disponible');
    return response.json();
  }
  const normal = item => {
    if (!item || typeof item !== 'object') return null;
    const tipo = ['Valoración','Sugerencia','Error'].includes(item.tipo) ? item.tipo : 'Valoración';
    const estrellas = Number(item.estrellas);
    if (!Number.isInteger(estrellas) || estrellas < 0 || estrellas > 5 || (tipo === 'Valoración' && estrellas === 0)) return null;
    const nombre = typeof item.nombre === 'string' ? item.nombre.slice(0,60).trim() : '';
    const mensaje = typeof item.mensaje === 'string' ? item.mensaje.slice(0,1800).trim() : '';
    const fecha = typeof item.fecha === 'string' && /^\d{4}-\d{2}$/.test(item.fecha) ? item.fecha : '';
    return {tipo, estrellas, nombre:nombre||'Anónimo',mensaje,fecha};
  };
  function showRatings(items) {
    const vals = items.filter(x => x.estrellas >= 1 && x.estrellas <= 5);
    const average = vals.length ? vals.reduce((s,v)=>s+v.estrellas,0)/vals.length : 0;
    const roundedStars = Math.round(average);
    if ($('home-stars')) $('home-stars').textContent = starText(roundedStars);
    if ($('home-rating-caption')) $('home-rating-caption').textContent = vals.length
      ? `${average.toFixed(1).replace('.',',')} de 5 · ${vals.length} valoración${vals.length===1?'':'es'} aprobada${vals.length===1?'':'s'}`
      : 'Todavía sin valoraciones publicadas';
    if ($('opinion-media')) $('opinion-media').textContent = vals.length ? average.toFixed(1).replace('.',',') : '—';
    if ($('opinion-estrellas')) {
      $('opinion-estrellas').textContent = starText(roundedStars);
      $('opinion-estrellas').setAttribute('aria-label', vals.length ? `Puntuación media ${average.toFixed(1)} de 5` : 'Sin puntuaciones');
    }
    if ($('opinion-numero')) $('opinion-numero').textContent = vals.length
      ? `${vals.length} valoración${vals.length===1?'':'es'} aprobada${vals.length===1?'':'s'}`
      : 'Todavía no hay valoraciones publicadas';
    const list = $('opinion-lista'); if (!list) return;
    list.replaceChildren();
    if (!items.length) {
      const p = document.createElement('p');p.className='rating-empty';p.textContent='Todavía no hay opiniones publicadas.';list.append(p);return;
    }
    // Nunca usamos innerHTML con datos enviados por visitantes.
    for(const x of items.slice(0,100)) {
      const article=document.createElement('article');article.className='review-item';
      const head=document.createElement('div');head.className='review-item-header';
      const name=document.createElement('strong');name.textContent=x.nombre;head.append(name);
      const kind=document.createElement('span');kind.className='review-type';kind.textContent=x.tipo;head.append(kind);
      if (x.estrellas) {
        const stars=document.createElement('span');stars.className='rating-stars';stars.style.fontSize='1.05rem';
        stars.textContent=starText(x.estrellas);stars.setAttribute('aria-label',`${x.estrellas} de 5 estrellas`);head.append(stars);
      }
      if(x.fecha) {
        const time=document.createElement('span');time.className='rating-muted';time.textContent=x.fecha.slice(5) + '/' + x.fecha.slice(0,4);head.append(time);
      }
      article.append(head);
      if(x.mensaje){const p=document.createElement('p');p.className='review-item-text';p.textContent=x.mensaje;article.append(p);}
      list.append(article);
    }
  }
  function showForm(config) {
    if (!$('opinion-form-ready') || !config || !config.formUrl) return;
    try {
      const url = new URL(config.formUrl);
      if (!(url.protocol==='https:' && ['docs.google.com','forms.gle'].includes(url.hostname))) return;
      if (url.hostname==='docs.google.com' && !url.pathname.startsWith('/forms/')) return;
      $('opinion-form-link').href = url.href;
      $('opinion-form-ready').hidden=false;
      $('opinion-form-config').hidden=true;
      if(url.hostname==='docs.google.com' && /\/viewform\/?$/.test(url.pathname)) {
        const toggle=$('opinion-form-toggle');
        const zone=$('opinion-iframe-zone');
        const iframe=$('opinion-iframe');
        toggle.hidden=false;
        toggle.addEventListener('click',()=>{
          const opening=zone.hidden;
          zone.hidden=!opening;
          toggle.setAttribute('aria-expanded',String(opening));
          toggle.textContent=opening?'Cerrar formulario ↑':'Escribir aquí, sin salir de la web ↓';
          if(opening && !iframe.src) {
            const embed = new URL(url.href);
            embed.searchParams.set('embedded','true');
            iframe.src=embed.href;
          }
        });
      }
    }catch(_){}
  }
  Promise.allSettled([readJSON('opiniones-aprobadas.json'),readJSON('config-opiniones.json')])
    .then(results => {
      if(results[0].status==='fulfilled'){
        const file=results[0].value;
        const rows=Array.isArray(file.opiniones)?file.opiniones:[];
        showRatings(rows.map(normal).filter(Boolean));
      }
      if(results[1].status==='fulfilled') showForm(results[1].value);
    });
})();
