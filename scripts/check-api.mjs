import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173';
function fields(id=crypto.randomUUID()){const form=new FormData();for(const [key,value] of Object.entries({name:'Тест API — локально',phone:'+79000000000',service:'Консультация',consent:'yes',requestId:id}))form.set(key,value);return form;}
const send=(form,origin=base)=>fetch(base+'/api/leads',{method:'POST',headers:{origin,'user-agent':'Malyarka43-local-check'},body:form});
assert.equal((await send(fields(),'https://example.org')).status,403);
const noConsent=fields();noConsent.delete('consent');assert.equal((await send(noConsent)).status,400);
const badFile=fields();badFile.set('photos',new Blob(['<svg/>'],{type:'image/png'}),'fake.png');assert.equal((await send(badFile)).status,400);
const valid=fields();const first=await send(valid);assert.equal(first.status,201);const firstBody=await first.json();assert.equal(firstBody.notified,false);
const again=await send(valid);assert.equal(again.status,200);assert.equal((await again.json()).id,firstBody.id);
assert.equal((await fetch(base+'/api/admin/photos/leads%2Ftest%2Ftest')).status,403);
const manage=await (await fetch(base+'/manage')).text();assert.match(manage,/Доступ владельца/);assert.ok(!manage.includes('Тест API'));
console.log('7 проверок API пройдено: origin, согласие, ложное фото, сохранение, отсутствие ложного уведомления, повтор, защита данных.');
