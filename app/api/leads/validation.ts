import { services } from "../../site-data";
import { damageZones } from "../../damage-zones";
import { getRepairScope } from "../../repair-plan";
export const MAX_FILE_SIZE=5*1024*1024;
export function validateFields(data:FormData,now=new Date()){
 const name=String(data.get("name")||"").trim();
 let phone=String(data.get("phone")||"").replace(/\D/g,"");
 if(!name||name.length>80)throw new Error("Укажите имя — до 80 символов.");
 if(!/^[78]\d{10}$/.test(phone))throw new Error("Укажите российский номер: +7 и ещё 10 цифр.");
 phone="+7"+phone.slice(1);
 if(data.get("consent")!=="yes")throw new Error("Подтвердите согласие на обработку заявки.");
 const car=String(data.get("car")||"").trim(),service=String(data.get("service")||"Консультация"),description=String(data.get("description")||"").trim(),preferredDate=String(data.get("date")||"");
 if(car.length>100||description.length>2000)throw new Error("Сократите описание автомобиля или повреждений.");
 if(!["Консультация",...services.map(s=>s.title)].includes(service))throw new Error("Выберите услугу из списка.");
 if(preferredDate){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate))throw new Error("Проверьте дату.");
  const date=new Date(`${preferredDate}T12:00:00+03:00`);
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==preferredDate)throw new Error("Проверьте дату.");
  const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Moscow"}).format(now);
  if(preferredDate<today)throw new Error("Выберите сегодняшнюю или будущую дату.");
  if([0,6].includes(date.getUTCDay()))throw new Error("Мастерская работает с понедельника по пятницу. Выберите будний день.");
 }
 const id=String(data.get("requestId")||"");
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))throw new Error("Обновите страницу и попробуйте ещё раз.");
 let selected:string[];
 try{selected=JSON.parse(String(data.get("damageZones")||"[]"));}catch{throw new Error("Проверьте отмеченные детали кузова.");}
 if(!Array.isArray(selected)||selected.length>damageZones.length||selected.some(id=>typeof id!=="string"||!damageZones.some(zone=>zone.id===id)))throw new Error("Проверьте отмеченные детали кузова.");
 const scopeId=String(data.get("repairScope")||"custom"),scope=getRepairScope(service,scopeId);
 if(!scope)throw new Error("Проверьте выбранный объём работ.");
 const marked=damageZones.filter(zone=>selected.includes(zone.id)).map(zone=>zone.label);
 const summary=[scopeId!=="custom"?`Объём работ: ${scope.label}`:"",marked.length?`Отмеченные участки: ${marked.join(", ")}`:"",description].filter(Boolean).join("\n");
 return {id,name,phone,car,service,description:summary,preferredDate};
}
export function photoType(bytes:Uint8Array){
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return "image/jpeg";
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return "image/png";
 if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP")return "image/webp";
 return null;
}
