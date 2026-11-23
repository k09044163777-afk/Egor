import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('.sites-runtime/checks',{recursive:true});
await build({entryPoints:['app/api/leads/validation.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/checks/validation.mjs'});
const {validateFields,photoType}=await import(pathToFileURL(process.cwd()+'/.sites-runtime/checks/validation.mjs').href);
const now=new Date('2026-11-22T21:00:00+03:00');
function form(changes={}){const f=new FormData();Object.entries({name:'Проверка',phone:'8 (917) 777-61-39',consent:'yes',requestId:'a1111111-1111-4111-8111-111111111111',service:'Консультация',...changes}).forEach(([k,v])=>f.set(k,v));return f;}
assert.equal(validateFields(form(),now).phone,'+79177776139');
assert.throws(()=>validateFields(form({consent:'no'}),now),/согласие/);
assert.throws(()=>validateFields(form({phone:'123'}),now),/номер/);
assert.throws(()=>validateFields(form({date:'2026-11-21'}),now),/будущую/);
assert.throws(()=>validateFields(form({date:'2026-11-28'}),now),/будний/);
assert.throws(()=>validateFields(form({date:'2027-02-30'}),now),/дату/);
assert.throws(()=>validateFields(form({service:'Поддельная услуга'}),now),/списка/);
assert.equal(validateFields(form({date:'2026-11-23'}),now).preferredDate,'2026-11-23');
assert.equal(photoType(new Uint8Array([137,80,78,71,13,10,26,10])),'image/png');
assert.equal(photoType(new TextEncoder().encode('<svg onload="alert(1)">')),null);
assert.equal(photoType(new Uint8Array([255,216,255,224])),'image/jpeg');
assert.match(validateFields(form({damageZones:'["hood","front-bumper"]'}),now).description,/Капот/);
assert.match(validateFields(form({damageZones:'["hood","hood"]'}),now).description,/Отмеченные участки: Капот$/);
assert.throws(()=>validateFields(form({damageZones:'["unknown-part"]'}),now),/детали/);
assert.throws(()=>validateFields(form({damageZones:'null'}),now),/детали/);
assert.match(validateFields(form({damageZones:'["sill-left","sill-right"]'}),now).description,/Левый порог, Правый порог/);
for(const [service,repairScope,damageZones,label] of [
 ['Кузовной ремонт','body-complex','[]','Несколько зон / весь кузов'],
 ['Покраска автомобиля','paint-full','[]','Полная покраска'],
 ['Сварочные работы','weld-sills','["sill-left","sill-right"]','Оба порога'],
 ['Восстановление после ДТП','accident-complex','[]','Комплексное восстановление'],
 ['Стапельные работы','frame-front','["hood"]','Передняя часть'],
 ['Антикоррозийная обработка','anticor-bottom','["underbody","arches"]','Днище и арки'],
]){
 const saved=validateFields(form({service,repairScope,damageZones,description:'Пожелания клиента'}),now);
 assert.equal(saved.service,service);assert.ok(saved.description.includes(`Объём работ: ${label}`));assert.ok(saved.description.endsWith('Пожелания клиента'));
}
assert.throws(()=>validateFields(form({service:'Покраска автомобиля',repairScope:'anticor-bottom'}),now),/объём работ/);
assert.match(validateFields(form({damageZones:'["underbody","arches","cavities"]'}),now).description,/Днище, Колёсные арки, Скрытые полости/);
console.log('Проверки пройдены: контакты, даты, файлы, 18 зон, объём работ для всех 6 услуг и отклонение несовместимого выбора.');
