/* Biblioteca de herramientas. API de votos anónimos, un registro por navegador y aplicación.
 * Cloudflare Workers + D1 + Turnstile. Sin claves en el repositorio.
 */
const ORIGIN = 'https://pastranaalex-glitch.github.io';
const APPS = new Set([
  'lector-facil','recetario-facil','cocina-clara','cocina-a-punto',
  'rutas-a-pie','documentos-de-casa','menu-y-compra',
  'mi-salud-familiar','en-familia','jardin-de-joyas'
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cors = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};
function reply(value, status = 200) {
  return new Response(JSON.stringify(value), {status, headers: {...cors, 'Content-Type':'application/json; charset=utf-8'}});
}
async function hash(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2,'0')).join('');
}
async function stats(db) {
  const {results} = await db.prepare('SELECT app_slug, COUNT(*) AS votos, AVG(estrellas) AS media FROM valoraciones GROUP BY app_slug').all();
  const values = {};
  for(const row of results || []) {
    if (APPS.has(row.app_slug)) values[row.app_slug] = {count:Number(row.votos),average:Math.round(Number(row.media)*10)/10};
  }
  return values;
}
async function checkTurnstile(secret, token) {
  const fields = new FormData();
  fields.set('secret', secret);
  fields.set('response', token);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {method:'POST',body:fields});
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true && result.hostname === 'pastranaalex-glitch.github.io';
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (origin && origin !== ORIGIN) return reply({error:'Origen no permitido'}, 403);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
    const url = new URL(request.url);
    if (!env.DB) return reply({error:'Base de datos no configurada'},503);
    if(request.method === 'GET' && url.pathname === '/ratings') {
      try { return reply({ratings:await stats(env.DB)}); }
      catch { return reply({error:'Estadísticas temporalmente no disponibles'},503); }
    }
    if(request.method !== 'POST' || url.pathname !== '/vote') return reply({error:'Ruta no encontrada'},404);
    if(origin !== ORIGIN) return reply({error:'Solo se admiten votos desde la Biblioteca'},403);
    if(!env.TURNSTILE_SECRET || !env.VOTE_HASH_KEY) return reply({error:'Protección de votos no configurada'},503);
    if(!String(request.headers.get('Content-Type')||'').startsWith('application/json')) return reply({error:'Se necesita JSON'},415);
    const size = Number(request.headers.get('Content-Length') || 0);
    if(size > 4096) return reply({error:'Solicitud demasiado grande'},413);
    let data;
    try { const body=await request.text(); if(body.length>4096) return reply({error:'Solicitud demasiado grande'},413); data=JSON.parse(body); }
    catch { return reply({error:'Solicitud incorrecta'},400); }
    const slug = data?.slug;
    const stars = data?.stars;
    const visitorId = data?.visitorId;
    const token = data?.turnstileToken;
    if(!APPS.has(slug) || !Number.isInteger(stars) || stars<1 || stars>5
      || typeof visitorId !== 'string' || !UUID.test(visitorId)
      || typeof token !== 'string' || !token || token.length>2048) return reply({error:'Valoración no válida'},400);
    try {
      if(!(await checkTurnstile(env.TURNSTILE_SECRET, token))) return reply({error:'No se ha superado la verificación de seguridad'},403);
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const hour = Math.floor(Date.now()/3600000);
      const ipHash = await hash(env.VOTE_HASH_KEY, 'limite:' + hour + ':' + ip);
      const attempts = await env.DB.prepare(
        'INSERT INTO limite_hora (hora, clave, intentos) VALUES (?1, ?2, 1) ON CONFLICT(hora,clave) DO UPDATE SET intentos=intentos+1 RETURNING intentos'
      ).bind(hour,ipHash).first();
      if(Number(attempts?.intentos||0)>40) return reply({error:'Demasiadas votaciones desde esta conexión. Inténtalo más tarde.'},429);
      const voterHash = await hash(env.VOTE_HASH_KEY, 'voto:' + visitorId);
      await env.DB.prepare(
        'INSERT INTO valoraciones (app_slug, visitante, estrellas, actualizado) VALUES (?1,?2,?3,CURRENT_TIMESTAMP) ON CONFLICT(app_slug,visitante) DO UPDATE SET estrellas=excluded.estrellas, actualizado=CURRENT_TIMESTAMP'
      ).bind(slug,voterHash,stars).run();
      // El hash temporal de la conexión desaparece al terminar el periodo de retención.
      await env.DB.prepare('DELETE FROM limite_hora WHERE hora < ?1').bind(hour-24).run();
      return reply({ok:true,ratings:await stats(env.DB)});
    } catch {
      return reply({error:'No se pudo guardar el voto. Inténtalo más tarde.'},503);
    }
  }
};