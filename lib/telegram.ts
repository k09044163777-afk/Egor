import {env} from 'cloudflare:workers';
import {decryptBotToken} from './telegram-security';
export async function telegramSetting(key:string){
 if(!env.DB)return null;
 return (await env.DB.prepare('SELECT value FROM telegram_settings WHERE key = ?').bind(key).first<{value:string}>())?.value||null;
}
export async function putTelegramSetting(key:string,value:string){
 if(!env.DB)throw new Error('Storage unavailable');
 await env.DB.prepare('INSERT INTO telegram_settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,value).run();
}
export async function getTelegramToken(){
 if(env.TELEGRAM_BOT_TOKEN)return env.TELEGRAM_BOT_TOKEN;
 if(!env.TELEGRAM_STORAGE_KEY)return null;
 const encrypted=await telegramSetting('bot_token');
 return encrypted?decryptBotToken(encrypted,env.TELEGRAM_STORAGE_KEY):null;
}
export async function getTelegramOwner(){return env.TELEGRAM_CHAT_ID||await telegramSetting('owner_chat_id');}
export async function telegramCall<T>(token:string,method:string,payload:unknown):Promise<T>{
 const response=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(8000)});
 const result=await response.json() as {ok:boolean;result:T;description?:string};
 if(method==='editMessageText'&&result.description?.includes('message is not modified'))return true as T;
 if(!response.ok||!result.ok)throw new Error('Telegram request failed');
 return result.result;
}
export async function notifyTelegram(text:string,origin:string):Promise<'sent'|'failed'|'not_configured'>{
 try{
  const token=await getTelegramToken();if(!token)return 'not_configured';
  const chatId=await getTelegramOwner();if(!chatId)return 'not_configured';
  await telegramCall(token,'sendMessage',{chat_id:chatId,text,reply_markup:{inline_keyboard:[[{text:'Открыть заявки',url:origin+'/manage'}]]}});
  return 'sent';
 }catch{return 'failed';}
}
