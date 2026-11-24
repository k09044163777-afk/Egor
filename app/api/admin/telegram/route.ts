import {env} from 'cloudflare:workers';
import {isOwnerAuthorized} from '../../../../lib/owner-access';
import {botCommands} from '../../../../lib/telegram-menu';
import {getTelegramToken,getTelegramOwner,telegramCall,telegramSetting} from '../../../../lib/telegram';
import {encryptBotToken,newConnectNonce,hashNonce,webhookSecret} from '../../../../lib/telegram-security';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function ownerLink(origin:string,username:string){
 if(!env.DB)throw new Error('Storage unavailable');
 if(await getTelegramOwner())return null;
 const nonce=newConnectNonce();
 await env.DB.batch([
  env.DB.prepare("INSERT INTO telegram_settings(key,value) VALUES('connect_hash',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(await hashNonce(nonce)),
  env.DB.prepare("INSERT INTO telegram_settings(key,value) VALUES('connect_expires',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(Date.now()+600000)),
 ]);
 return `https://t.me/${username}?start=owner_${nonce}`;
}
async function activate(token:string,origin:string){
 if(!env.TELEGRAM_STORAGE_KEY)throw new Error('Storage unavailable');
 const existing=await telegramCall<{url:string}>(token,'getWebhookInfo',{});
 if(existing.url&&existing.url!==origin+'/api/telegram')throw new Error('OTHER_WEBHOOK');
 await telegramCall(token,'setWebhook',{url:origin+'/api/telegram',secret_token:await webhookSecret(env.TELEGRAM_STORAGE_KEY),allowed_updates:['message','callback_query'],max_connections:3});
 await telegramCall(token,'setMyCommands',{commands:botCommands});
}
export async function GET(request:Request){
 if(!await isOwnerAuthorized(env,request.headers))return json({error:'Доступ закрыт'},403);
 try{
  const token=await getTelegramToken();const username=await telegramSetting('bot_username');const owner=await getTelegramOwner();
  let connected=false;
  if(token){try{connected=(await telegramCall<{url:string}>(token,'getWebhookInfo',{})).url===new URL(request.url).origin+'/api/telegram';}catch{/* Status stays unavailable without revealing credentials. */}}
  return json({configured:!!token,username,ownerConnected:!!owner,webhookConnected:connected,storageReady:!!env.TELEGRAM_STORAGE_KEY});
 }catch{return json({error:'Не удалось получить настройки. Попробуйте ещё раз.'},503);}
}
export async function POST(request:Request){
 if(!await isOwnerAuthorized(env,request.headers))return json({error:'Доступ закрыт'},403);
 const origin=new URL(request.url).origin;
 if(request.headers.get('origin')!==origin)return json({error:'Обновите страницу и попробуйте ещё раз.'},403);
 if(!env.DB||!env.TELEGRAM_STORAGE_KEY)return json({error:'Подключение ещё не подготовлено.'},503);
 if(Number(request.headers.get('content-length')||0)>2048)return json({error:'Слишком большой запрос.'},413);
 let input:{action?:string;token?:string};
 try{const text=await request.text();if(text.length>2048)return json({error:'Слишком большой запрос.'},413);input=JSON.parse(text);}catch{return json({error:'Неверный запрос.'},400);}
 if(!input||typeof input!=='object'||Array.isArray(input))return json({error:'Неверный запрос.'},400);
 try{
  if(input.action==='owner_link'){
   const username=await telegramSetting('bot_username');if(!username)return json({error:'Сначала подключите бота.'},400);
   return json({ownerLink:await ownerLink(origin,username)});
  }
  if(input.action==='activate'){
   const token=await getTelegramToken();if(!token)return json({error:'Сначала подключите бота.'},400);
   await activate(token,origin);return json({ok:true});
  }
  const token=input.token?.trim()||'';
  if(!/^\d{5,15}:[A-Za-z0-9_-]{30,100}$/.test(token))return json({error:'Проверьте токен, полученный от BotFather.'},400);
  const bot=await telegramCall<{is_bot:boolean;username?:string}>(token,'getMe',{});
  if(!bot.is_bot||!bot.username||!/^\w{5,32}$/.test(bot.username))return json({error:'Не удалось проверить бота.'},400);
  const previous=await telegramSetting('bot_username');
  if(previous&&previous.toLowerCase()!==bot.username.toLowerCase())return json({error:'На сайте уже подключён другой бот. Сначала обратитесь к владельцу.'},409);
  const info=await telegramCall<{url:string}>(token,'getWebhookInfo',{});
  if(info.url&&info.url!==origin+'/api/telegram')return json({error:'Этот бот уже используется на другом сайте. Создайте отдельного бота для «Малярка43».'},409);
  const encrypted=await encryptBotToken(token,env.TELEGRAM_STORAGE_KEY);
  await env.DB.batch([
   env.DB.prepare("INSERT INTO telegram_settings(key,value) VALUES('bot_token',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(encrypted),
   env.DB.prepare("INSERT INTO telegram_settings(key,value) VALUES('bot_username',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(bot.username),
  ]);
  await activate(token,origin);
  return json({ok:true,username:bot.username,ownerLink:await ownerLink(origin,bot.username)});
 }catch(error){
  return json({error:error instanceof Error&&error.message==='OTHER_WEBHOOK'?'Бот уже подключён к другому сайту.':'Не удалось подключить Telegram. Проверьте токен и повторите попытку.'},503);
 }
}
