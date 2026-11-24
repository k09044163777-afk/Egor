import {env} from 'cloudflare:workers';
import {botReply} from '../../../lib/telegram-menu';
import {getTelegramToken,getTelegramOwner,telegramCall,telegramSetting} from '../../../lib/telegram';
import {hashNonce,secureEqual,webhookSecret} from '../../../lib/telegram-security';
import {privateBotMessage,type BotUpdate} from '../../../lib/telegram-update';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 if(!env.TELEGRAM_STORAGE_KEY||!env.DB)return json({ok:false},503);
 const supplied=request.headers.get('X-Telegram-Bot-Api-Secret-Token')||'';
 if(!supplied||!await secureEqual(supplied,await webhookSecret(env.TELEGRAM_STORAGE_KEY)))return json({ok:false},403);
 if(Number(request.headers.get('content-length')||0)>65536)return json({ok:false},413);
 let update:BotUpdate;
 try{const text=await request.text();if(text.length>65536)return json({ok:false},413);update=JSON.parse(text);}catch{return json({ok:false},400);}
 if(!Number.isSafeInteger(update?.update_id)||update.update_id<0)return json({ok:false},400);
 const callback=update.callback_query;const message=privateBotMessage(update);
 if(!message)return json({ok:true});
 const chatId=String(message.chat.id);const db=env.DB;const now=Date.now();
 const inserted=await db.prepare("INSERT OR IGNORE INTO telegram_updates(update_id,chat_id,status,updated_at) VALUES (?,?,'processing',?)").bind(update.update_id,chatId,now).run();
 if(!inserted.meta.changes){
  const existing=await db.prepare('SELECT status FROM telegram_updates WHERE update_id=?').bind(update.update_id).first<{status:string}>();
  if(existing?.status==='done')return json({ok:true});
  const leased=await db.prepare("UPDATE telegram_updates SET status='processing',updated_at=? WHERE update_id=? AND (status='failed' OR updated_at<?)").bind(now,update.update_id,now-60000).run();
  if(!leased.meta.changes)return json({ok:false},503);
 }
 try{
  const token=await getTelegramToken();if(!token)throw new Error('Bot is not configured');
  const recent=await db.prepare('SELECT count(*) AS count FROM telegram_updates WHERE chat_id=? AND updated_at>?').bind(chatId,now-60000).first<{count:number}>();
  if((recent?.count||0)>20){await db.prepare("UPDATE telegram_updates SET status='done' WHERE update_id=?").bind(update.update_id).run();return json({ok:true});}
  if(callback?.id)await telegramCall(token,'answerCallbackQuery',{callback_query_id:callback.id}).catch(()=>{});
  const origin=new URL(request.url).origin;
  const command=callback?.data||message.text?.split(/\s+/)[0]?.split('@')[0]?.replace(/^\//,'')|| (message.photo?'photo':'start');
  const parameter=message.text?.trim().split(/\s+/)[1];
  let owner=await getTelegramOwner();
  if(command==='start'&&parameter?.startsWith('owner_')){
   const nonce=parameter.slice(6);const storedHash=await telegramSetting('connect_hash');const expires=Number(await telegramSetting('connect_expires')||0);
   if(owner===chatId){await telegramCall(token,'sendMessage',{chat_id:chatId,...botReply('status',origin,true)});}
   else if(owner||!storedHash||expires<now||!await secureEqual(await hashNonce(nonce),storedHash)){
    await telegramCall(token,'sendMessage',{chat_id:chatId,text:'Ссылка подключения недействительна или уже использована. Получите новую ссылку в разделе владельца сайта.'});
   }else{
    await db.batch([
     db.prepare("INSERT OR IGNORE INTO telegram_settings(key,value) SELECT 'owner_chat_id',? WHERE EXISTS(SELECT 1 FROM telegram_settings WHERE key='connect_hash' AND value=?)").bind(chatId,storedHash),
     db.prepare("DELETE FROM telegram_settings WHERE key IN ('connect_hash','connect_expires') AND EXISTS(SELECT 1 FROM telegram_settings WHERE key='owner_chat_id' AND value=?)").bind(chatId),
    ]);
    owner=await getTelegramOwner();
    await telegramCall(token,'sendMessage',{chat_id:chatId,text:owner===chatId?'Готово! Новые заявки с сайта «Малярка43» будут приходить в этот чат. Фотографии доступны в защищённом разделе владельца.':'Эта ссылка уже использована. Обратитесь к владельцу сайта.',reply_markup:owner===chatId?{inline_keyboard:[[{text:'Открыть заявки',url:origin+'/manage'}]]}:undefined});
   }
  }else{
   const reply=botReply(command,origin,owner===chatId);
   if(callback)await telegramCall(token,'editMessageText',{chat_id:chatId,message_id:message.message_id,...reply});
   else await telegramCall(token,'sendMessage',{chat_id:chatId,...reply});
  }
  await db.prepare("UPDATE telegram_updates SET status='done',updated_at=? WHERE update_id=?").bind(Date.now(),update.update_id).run();
  if(update.update_id%100===0)await db.prepare('DELETE FROM telegram_updates WHERE updated_at<?').bind(now-86400000).run();
  return json({ok:true});
 }catch{
  await db.prepare("UPDATE telegram_updates SET status='failed' WHERE update_id=?").bind(update.update_id).run();
  return json({ok:false},503);
 }
}
