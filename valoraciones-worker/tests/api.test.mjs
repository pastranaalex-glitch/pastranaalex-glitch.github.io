import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const endpoint='https://prueba.workers.dev';
const allowed='https://pastranaalex-glitch.github.io';
const db={prepare(){return {
  all:async()=>({results:[{app_slug:'lector-facil',votos:2,media:4.5}]}),
  bind(){return this;},first:async()=>({intentos:1}),run:async()=>({success:true})
};}};
const env={DB:db};
function post(body,origin=allowed){
 return new Request(endpoint+'/vote',{method:'POST',headers:{
  'Origin':origin,'Content-Type':'application/json'
 },body:JSON.stringify(body)});
}
const sample={slug:'lector-facil',stars:5,visitorId:'5a029581-86a4-4bb7-8e38-d6559255216f',turnstileToken:'test-token'};
test('Sin base de datos devuelve 503',async()=>{
 const r=await worker.fetch(new Request(endpoint+'/ratings'),{});
 assert.equal(r.status,503);
});
test('Sin secretos no se habilita votación',async()=>{
 const r=await worker.fetch(new Request(endpoint+'/ratings'),env);
 const data=await r.json();
 assert.equal(r.status,200);assert.equal(data.enabled,false);
 assert.deepEqual(data.ratings['lector-facil'],{count:2,average:4.5});
});
test('Solo se acepta POST de la web oficial',async()=>{
 const r=await worker.fetch(post(sample,'https://evil.example'),env);
 assert.equal(r.status,403);
});
test('No admite apps desconocidas',async()=>{
 const r=await worker.fetch(post({...sample,slug:'otra-app'}),{...env,TURNSTILE_SECRET:'x',VOTE_HASH_KEY:'y'});
 assert.equal(r.status,400);
});
test('No admite votos fuera del rango 1..5',async()=>{
 for(const n of [0,6,2.5,-4]){
  const r=await worker.fetch(post({...sample,stars:n}),{...env,TURNSTILE_SECRET:'x',VOTE_HASH_KEY:'y'});
  assert.equal(r.status,400);
 }
});
test('Rechaza identificadores inválidos',async()=>{
 const r=await worker.fetch(post({...sample,visitorId:'otro'}),{...env,TURNSTILE_SECRET:'x',VOTE_HASH_KEY:'y'});
 assert.equal(r.status,400);
});
