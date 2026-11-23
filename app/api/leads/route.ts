import {env} from "cloudflare:workers";
import {getDb} from "../../../db";
import {leads} from "../../../db/schema";
import {and,eq,gte,sql} from "drizzle-orm";
import {MAX_FILE_SIZE,photoType,validateFields} from "./validation";

function json(body:unknown,status=200){return Response.json(body,{status,headers:{"Cache-Control":"no-store"}});}
export async function POST(request:Request){
 const url=new URL(request.url);
 if(request.headers.get("origin")!==url.origin)return json({error:"Не удалось проверить источник заявки. Обновите страницу."},403);
 if(!request.headers.get("content-type")?.includes("multipart/form-data"))return json({error:"Неверный формат заявки."},415);
 if(Number(request.headers.get("content-length")||0)>16*1024*1024)return json({error:"Размер заявки превышает 16 МБ."},413);
 if(!env.DB||!env.BUCKET)return json({error:"Онлайн-запись временно недоступна. Позвоните Данилу или напишите в Telegram."},503);
 let data:FormData;
 try{data=await request.formData();}catch{return json({error:"Не удалось прочитать заявку. Уменьшите размер фотографий."},400);}
 if(data.get("website"))return json({error:"Не удалось проверить заявку. Свяжитесь с нами по телефону."},400);
 let fields:ReturnType<typeof validateFields>;
 try{fields=validateFields(data);}catch(e){return json({error:(e as Error).message},400);}
 const db=getDb();
 const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(`${request.headers.get("cf-connecting-ip")||"local"}|${request.headers.get("user-agent")||""}|m43-v1`)))).map(x=>x.toString(16).padStart(2,"0")).join("");
 const previous=await db.select().from(leads).where(eq(leads.id,fields.id)).get();
 if(previous){if(previous.fingerprint!==fingerprint)return json({error:"Обновите страницу и попробуйте ещё раз."},409);return json({id:previous.id,notified:previous.emailStatus==="sent"||previous.telegramStatus==="sent"});}
 const recent=await db.select({count:sql<number>`count(*)`}).from(leads).where(and(eq(leads.fingerprint,fingerprint),gte(leads.createdAt,new Date(Date.now()-15*60*1000).toISOString()))).get();
 if((recent?.count||0)>=3)return json({error:"Вы уже отправили несколько заявок. Попробуйте через 15 минут или позвоните Данилу."},429);
 const photos=data.getAll("photos").filter((f):f is File=>f instanceof File&&f.size>0);
 if(photos.length>3)return json({error:"Можно прикрепить до 3 фотографий."},400);
 const checked:{file:File;type:string}[]=[];
 for(const file of photos){
  if(file.size>MAX_FILE_SIZE)return json({error:"Каждое фото должно быть не больше 5 МБ."},400);
  const type=photoType(new Uint8Array(await file.slice(0,12).arrayBuffer()));
  if(!type||type!==file.type)return json({error:"Подойдут только настоящие фотографии JPG, PNG или WebP."},400);
  checked.push({file,type});
 }
 const stored:{key:string;type:string;name:string}[]=[];
 try{
  for(const {file,type} of checked){const key=`leads/${fields.id}/${crypto.randomUUID()}`;await env.BUCKET.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:type}});stored.push({key,type,name:file.name.slice(0,120)});}
  await db.insert(leads).values({...fields,createdAt:new Date().toISOString(),photos:JSON.stringify(stored),consentVersion:"2026-11-22",fingerprint,emailStatus:"not_configured",telegramStatus:"not_configured"});
 }catch{
  await Promise.allSettled(stored.map(p=>env.BUCKET!.delete(p.key)));
  return json({error:"Не удалось сохранить заявку. Попробуйте ещё раз или напишите Данилу."},503);
 }
 const text=`Новая заявка — Малярка43\n№ ${fields.id.slice(0,8)}\nИмя: ${fields.name}\nТелефон: ${fields.phone}\nАвтомобиль: ${fields.car||"Не указан"}\nУслуга: ${fields.service}\nДата (пожелание): ${fields.preferredDate||"Согласовать"}\nОписание: ${fields.description||"Не указано"}\nФото: ${stored.length}\nВсе данные и фото: ${url.origin}/manage`;
 async function deliver(endpoint:string,payload:unknown,headers:Record<string,string>={}){try{const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json",...headers},body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)});return res.ok?"sent":"failed";}catch{return "failed";}}
 const [emailStatus,telegramStatus]=await Promise.all([
  env.RESEND_API_KEY&&env.NOTIFICATION_FROM_EMAIL?deliver("https://api.resend.com/emails",{from:env.NOTIFICATION_FROM_EMAIL,to:[env.NOTIFICATION_EMAIL||"Cherepanov1945@icloud.ru"],subject:`Малярка43: заявка от ${fields.name.replace(/[\r\n]/g," ")}`,text},{Authorization:`Bearer ${env.RESEND_API_KEY}`}):Promise.resolve("not_configured"),
  env.TELEGRAM_BOT_TOKEN&&env.TELEGRAM_CHAT_ID?deliver(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{chat_id:env.TELEGRAM_CHAT_ID,text}):Promise.resolve("not_configured")
 ]);
 await db.update(leads).set({emailStatus,telegramStatus}).where(eq(leads.id,fields.id));
 return json({id:fields.id,notified:emailStatus==="sent"||telegramStatus==="sent"},201);
}
