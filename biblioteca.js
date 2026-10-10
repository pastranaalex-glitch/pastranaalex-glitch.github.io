/* Biblioteca de herramientas · Pack 4. No requiere cuentas ni cookies de seguimiento. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const repo = 'pastranaalex-glitch/lector-facil';
  const githubBase = `https://github.com/${repo}/releases`;
  const esNumber = n => Number(n).toLocaleString('es-ES');
  const formatMb = bytes => Number.isFinite(bytes) && bytes > 0 ? `${new Intl.NumberFormat('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1}).format(bytes / 1e6)} MB` : 'Consultar en GitHub';
  const setText = (id, value) => { const el=$(id); if(el) el.textContent=value; };
  const getApks = release => (Array.isArray(release.assets) ? release.assets : []).filter(a => a && typeof a.name === 'string' && /\.apk$/i.test(a.name));
  const allowedGitHubUrl = url => {
    try {
      const parsed=new URL(url);
      return parsed.protocol === 'https:' && parsed.hostname === 'github.com' && parsed.pathname.startsWith(`/${repo}/releases/download/`) ? parsed.href : null;
    } catch (_) {return null;}
  };
  const make = (tag, name, textValue) => {
    const node=document.createElement(tag);
    if(name) node.className=name;
    if(textValue!==undefined) node.textContent=String(textValue);
    return node;
  };
  function renderReleases(releases) {
    const box=$('releases-list');
    if(!box) return;
    box.replaceChildren();
    const valid=releases.filter(r => getApks(r).length).slice(0,8);
    if(!valid.length){box.append(make('p','release-empty','Todavía no hay versiones con APK en el historial público.'));return;}
    for(const r of valid){
      const card=make('article','release-card');
      const line=make('div','release-titleline');
      const name=make('h3',null,r.name || r.tag_name || 'Versión');
      line.append(name);
      const published=Date.parse(r.published_at);
      if(Number.isFinite(published)) {
        const date=make('time','release-date',new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric'}).format(new Date(published)));
        date.dateTime=new Date(published).toISOString().slice(0,10);
        line.append(date);
      }
      card.append(line);
      const body=typeof r.body === 'string' ? r.body.trim() : '';
      if(body) card.append(make('p','release-note-text',body.slice(0,550)+(body.length>550?'…':'')));
      const actions=make('div','release-actions');
      const apk=getApks(r).find(a=>allowedGitHubUrl(a.browser_download_url));
      if(apk){
        const a=make('a',null,'Descargar APK ↓');a.href=allowedGitHubUrl(apk.browser_download_url);a.target='_blank';a.rel='noopener noreferrer';actions.append(a);
      }
      const info=make('a',null,'Ver detalles en GitHub ↗');
      // Do not interpolate unsanitized remote links; use the known repository base.
      info.href=githubBase;
      info.target='_blank';info.rel='noopener noreferrer';actions.append(info);
      card.append(actions);box.append(card);
    }
  }
  async function loadReleases() {
    try{
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),9000);
      let response;
      try{
        response=await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`,{
          headers:{Accept:'application/vnd.github+json'}, signal:controller.signal
        });
      } finally {clearTimeout(timeout);}
      if(!response.ok) throw new Error('API not available');
      const data=await response.json();
      if(!Array.isArray(data)) throw new Error('Wrong API response');
      const releases=data.filter(r => r && !r.draft && !r.prerelease && r.tag_name);
      const apks=releases.flatMap(getApks);
      const total=apks.reduce((sum,asset)=>sum+Math.max(0,Number(asset.download_count)||0),0);
      setText('download-count',esNumber(total));
      setText('download-caption',total===1?'1 descarga registrada en GitHub Releases.':'Descargas acumuladas de los APK publicados en GitHub Releases.');
      const latest=releases.find(r => getApks(r).some(a => allowedGitHubUrl(a.browser_download_url)));
      if(latest){
        setText('version-chip',document.body.querySelector('.detail-hero')?`Versión ${latest.tag_name}`:`Disponible · ${latest.tag_name}`);
        setText('latest-version-label',`Última versión: ${latest.tag_name}`);
        setText('version-metric',latest.tag_name);
        const asset=getApks(latest).find(a => allowedGitHubUrl(a.browser_download_url));
        if(asset){
          setText('apk-size',formatMb(Number(asset.size)));
          if($('download-link')) $('download-link').href=allowedGitHubUrl(asset.browser_download_url);
        }
      } else {
        setText('version-metric','Consultar en GitHub');
        setText('apk-size','Consultar en GitHub');
      }
      renderReleases(releases);
    } catch (_){
      setText('download-count','—');
      setText('download-caption','Estadísticas temporalmente no disponibles; puedes descargar desde GitHub.');
      setText('version-metric','Consultar en GitHub');
      setText('apk-size','Consultar en GitHub');
      setText('latest-version-label','Puedes consultar las últimas versiones en GitHub.');
      const box=$('releases-list');
      if(box){
        box.replaceChildren();
        const p=make('p','release-empty','No se ha podido cargar el historial. Puedes consultarlo directamente en GitHub.');
        const a=make('a',null,'Abrir versiones en GitHub ↗');a.href=githubBase;a.rel='noopener noreferrer';a.target='_blank';
        box.append(p,a);
      }
      // Se conserva el enlace APK existente en el HTML.
    }
  }
  function setupTextSize(){
    const buttons=[...document.querySelectorAll('[data-text-size]')];
    if(!buttons.length)return;
    const steps=[100,110,120,130];
    let size=100;
    try { const stored=Number(localStorage.getItem('biblioteca-text-size'));if(steps.includes(stored))size=stored; }catch(_){}
    const apply=()=>{
      document.documentElement.style.fontSize=`${size}%`;
      buttons.forEach(b=>{b.disabled=(b.dataset.textSize==='down' && size===steps[0])||(b.dataset.textSize==='up' && size===steps.at(-1));});
    };
    apply();
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const direction=button.dataset.textSize==='up'?1:-1;
      size=steps[Math.max(0,Math.min(steps.length-1,steps.indexOf(size)+direction))];
      try{localStorage.setItem('biblioteca-text-size',String(size));}catch(_){}
      apply();
    }));
  }
  function setupShare(){
    document.querySelectorAll('[data-share="site"]').forEach(button=>button.addEventListener('click',async()=>{
      const url=button.dataset.shareUrl||window.location.href;
      const title=button.dataset.shareTitle||document.title;
      const label=button.textContent;
      try{
        if(navigator.share){await navigator.share({title,url});return;}
        if(navigator.clipboard && navigator.clipboard.writeText){
          await navigator.clipboard.writeText(url);
          button.textContent='¡Enlace copiado!';
          window.setTimeout(()=>button.textContent=label,2200);
          return;
        }
      }catch(error){if(error && error.name==='AbortError')return;}
      // Copia manual fiable incluso en navegadores sin permisos Clipboard.
      window.prompt('Copia el enlace para compartir:',url);
    }));
  }
  setupTextSize();
  setupShare();
  if($("download-count") || $("releases-list")) loadReleases();
})();
