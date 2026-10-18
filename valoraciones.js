/* Valoraciones anónimas en web: un voto por navegador y app; sin identificar instalaciones. */
(()=>{'use strict';
const key='biblioteca-estrellas-identificador-v1',selector='[data-app-card][data-app-slug],[data-rating-ficha][data-app-slug]';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let api='',siteKey='',ratings={},ready=false,formUrl='',modal=null,slug='',selected=0,token='',widget=null,loadPromise=null;
let message,submitButton,starRow,captcha,low,feedback;
function cards(){return document.querySelectorAll(selector);}
function make(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;}
function redraw(){
 for(const c of cards()){
  const s=c.dataset.appSlug;let row=c.querySelector('.bv-line');
  if(!row){
   row=make('div','bv-line');
   const buttons=make('span','bv-stars');
   for(let i=1;i<=5;i++){
    const b=make('button','bv-star','★');b.type='button';b.title='Dar '+i+' estrellas';
    b.addEventListener('click',()=>open(s,i));buttons.append(b);
   }
   row.append(buttons,make('span','bv-info'));
   const desc=c.querySelector('.app-description');
   if(desc)desc.insertAdjacentElement('afterend',row);
   else if(c.hasAttribute('data-rating-ficha'))c.append(row);
   else c.querySelector('.card-body')?.prepend(row);
  }
  const data=ratings[s],count=Number(data?.count)||0,avg=Number(data?.average)||0;
  row.querySelector('.bv-info').textContent=count
   ? avg.toFixed(1).replace('.',',')+' de 5 · '+count.toLocaleString('es-ES')+' voto'+(count===1?'':'s')
   : ready?'Todavía sin votos':'Valoraciones pendientes de activar';
  row.querySelectorAll('button').forEach((b,i)=>{
   b.disabled=!ready;b.classList.toggle('bv-filled',count>0&&i<Math.round(avg));
   b.setAttribute('aria-label','Dar '+(i+1)+' estrella'+(i?'s':'')+' a '+(c.querySelector('h3')?.textContent||s));
  });
 }
}
function buildModal(){
 if(modal)return;
 modal=make('dialog','bv-dialog');const title=make('h2','bv-title','Valora esta aplicación'),name=make('p','bv-appname');
 name.id='bv-app-name';modal.setAttribute('aria-labelledby',name.id);starRow=make('div','bv-modalstars');
 for(let i=1;i<=5;i++){
  const b=make('button',null,'★');b.type='button';b.setAttribute('aria-label',i+' estrellas');
  b.addEventListener('click',()=>choose(i));starRow.append(b);
 }
 const note=make('p','bv-privacy','Un voto por navegador y aplicación. Puedes modificarlo. Al votar se guarda un identificador aleatorio en este navegador.');
 captcha=make('div','bv-captcha');message=make('p','bv-message');message.setAttribute('role','status');
 low=make('div','bv-low');low.hidden=true;
 low.append(make('p',null,'Gracias por tu opinión. ¿Quieres contarnos qué podemos mejorar? Es opcional.'));
 feedback=make('a','bv-form-link','Contarnos qué ha fallado ↗');feedback.target='_blank';feedback.rel='noopener noreferrer';low.append(feedback);
 const actions=make('div','bv-actions'),close=make('button','bv-close','Cerrar');close.type='button';close.addEventListener('click',()=>modal.close());
 submitButton=make('button','bv-send','Guardar valoración');submitButton.type='button';submitButton.addEventListener('click',send);
 actions.append(close,submitButton);modal.append(title,name,starRow,note,captcha,message,low,actions);document.body.append(modal);
 modal.addEventListener('close',()=>{if(widget!==null&&window.turnstile){window.turnstile.remove(widget);widget=null;}slug='';token='';});
}
function choose(n){
 selected=n;
 [...starRow.children].forEach((b,i)=>{b.classList.toggle('bv-active',i<n);b.setAttribute('aria-pressed',String(i===n-1));});
 submitButton.disabled=!(token&&selected);
}
function loadTurnstile(){
 if(window.turnstile?.render)return Promise.resolve();
 if(loadPromise)return loadPromise;
 loadPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async=true;script.onload=()=>window.turnstile?.render?resolve():reject(Error('Turnstile no disponible'));
  script.onerror=()=>reject(Error('No se pudo cargar Turnstile'));document.head.append(script);
 });
 return loadPromise.catch(e=>{loadPromise=null;throw e;});
}
async function captchaStart(){
 token='';submitButton.disabled=true;captcha.replaceChildren();
 try{
  await loadTurnstile();if(!modal.open)return;
  widget=window.turnstile.render(captcha,{sitekey:siteKey,theme:'light',
   callback:t=>{token=t;submitButton.disabled=!selected;},
   'expired-callback':()=>{token='';submitButton.disabled=true;},
   'error-callback':()=>{token='';submitButton.disabled=true;message.textContent='Verificación fallida. Cierra y vuelve a intentarlo.';}
  });
 }catch{message.textContent='No se pudo cargar la verificación. Revisa tu conexión o bloqueador.';}
}
function open(s,n){
 if(!ready)return;buildModal();slug=s;
 modal.querySelector('.bv-appname').textContent=Array.from(cards()).find(c=>c.dataset.appSlug===s)?.querySelector('h3')?.textContent||document.querySelector('main h1')?.textContent||s;
 message.textContent='';low.hidden=true;feedback.hidden=!formUrl;if(formUrl)feedback.href=formUrl;
 submitButton.hidden=false;modal.showModal();choose(n);captchaStart();
}
function voterId(){
 let id=localStorage.getItem(key);
 if(!id||!uuid.test(id)){id=crypto.randomUUID();localStorage.setItem(key,id);}
 if(localStorage.getItem(key)!==id)throw Error('No es posible guardar el identificador en este navegador');
 return id;
}
async function send(){
 if(!ready||!token||!slug||!selected)return;
 submitButton.disabled=true;message.textContent='Guardando voto…';
 try{
  const response=await fetch(api+'/vote',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({slug,stars:selected,visitorId:voterId(),turnstileToken:token})});
  const data=await response.json();
  if(!response.ok||!data.ok)throw Error(data.error||'Error al guardar');
  ratings=data.ratings||ratings;redraw();message.textContent='¡Voto guardado! Gracias por ayudar a mejorar la Biblioteca.';
  submitButton.hidden=true;if(selected<=2&&formUrl)low.hidden=false;
  if(widget!==null&&window.turnstile){window.turnstile.remove(widget);widget=null;}token='';
 }catch(e){
  message.textContent=String(e.message||'No se pudo guardar').slice(0,160);
  if(widget!==null&&window.turnstile){window.turnstile.remove(widget);widget=null;}
  await captchaStart();
 }
}
async function start(){
 if(!document.querySelector('[data-catalog-slot]')){
  const name=location.pathname.split('/').pop().replace(/\.html$/,'');
  if(document.querySelector('main h1')&&/^[a-z0-9-]+$/.test(name)){
   const spot=make('div','bv-ficha-rating');spot.dataset.ratingFicha='';spot.dataset.appSlug=name;
   document.querySelector('main h1').insertAdjacentElement('afterend',spot);
  }
 }
 document.addEventListener('biblioteca:cards-ready',redraw);redraw();
 try{
  const [config,op]=await Promise.all([fetch('valoraciones-config.json',{cache:'no-store'}),fetch('config-opiniones.json',{cache:'no-store'}).catch(()=>null)]);
  if(op?.ok){const f=await op.json();if(typeof f.formUrl==='string'&&/^https:\/\/docs\.google\.com\/forms\//.test(f.formUrl))formUrl=f.formUrl;}
  if(!config.ok)return;
  const settings=await config.json();if(typeof settings.apiUrl!=='string'||typeof settings.turnstileSiteKey!=='string')return;
  const parsed=new URL(settings.apiUrl);
  if(parsed.protocol!=='https:'||!parsed.hostname||settings.turnstileSiteKey.length<10)return;
  api=parsed.href.replace(/\/$/,'');siteKey=settings.turnstileSiteKey;
  const response=await fetch(api+'/ratings',{cache:'no-store'});if(!response.ok)throw Error('API no disponible');
  const data=await response.json();if(typeof data.ratings!=='object'||!data.ratings)throw Error('Respuesta incorrecta');
  ratings=data.ratings;ready=data.enabled===true;redraw();
 }catch{ready=false;redraw();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();