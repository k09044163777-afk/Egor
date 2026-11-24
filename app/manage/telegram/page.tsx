"use client";
import {useEffect,useState,type FormEvent} from 'react';
import {CheckCircle2,Send,LoaderCircle,RefreshCw} from 'lucide-react';
type Status={configured:boolean;username:string|null;ownerConnected:boolean;webhookConnected:boolean;storageReady:boolean};
export default function TelegramSetup(){
 const[status,setStatus]=useState<Status|null>(null),[token,setToken]=useState(''),[link,setLink]=useState<string|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function refresh(){
  const response=await fetch('/api/admin/telegram',{cache:'no-store'});const body=await response.json() as Status&{error?:string};
  if(!response.ok)throw new Error(body.error||'Не удалось получить настройки.');setStatus(body);
 }
 useEffect(()=>{refresh().catch(e=>setError(e.message));},[]);
 async function action(payload:unknown){
  setBusy(true);setError('');
  try{const response=await fetch('/api/admin/telegram',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const body=await response.json() as {error?:string;ownerLink?:string};
   if(!response.ok)throw new Error(body.error||'Не удалось подключить Telegram.');
   setToken('');if(body.ownerLink)setLink(body.ownerLink);await refresh();
  }catch(e){setError(e instanceof Error?e.message:'Повторите попытку.');}finally{setBusy(false);}
 }
 function submit(event:FormEvent){event.preventDefault();void action({token});}
 return <main className="manage-page telegram-setup"><a href="/manage">К заявкам</a><div className="telegram-heading"><Send size={36}/><div><h1>Telegram · Малярка43</h1><p>Новые заявки — сразу в чате Данила.</p></div></div>
  <section className="manage-card"><h2>Подключение бота</h2>
   {!status&&<p>Получаем настройки…</p>}
   {status&&!status.configured&&<><p>Создайте бота у <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">@BotFather</a> командой /newbot, затем вставьте полученный токен.</p><form onSubmit={submit}><label>Токен от BotFather<input type="password" name="telegram_token" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" spellCheck={false} required placeholder="Вставьте токен сюда"/></label><p className="small-text">Токен не показывается посетителям и не публикуется в исходниках сайта.</p><button className="button button-primary" disabled={busy||!status.storageReady} type="submit">{busy?<LoaderCircle className="spin" size={18}/>:<Send size={18}/>}ПОДКЛЮЧИТЬ БОТА</button></form></>}
   {status?.configured&&<><p className="telegram-connected"><CheckCircle2 size={20}/>Бот подключён: <a href={`https://t.me/${status.username}`} target="_blank" rel="noopener noreferrer">@{status.username}</a></p>{!status.webhookConnected&&<><p>Нужно завершить подключение к сайту.</p><button className="button button-primary" disabled={busy} onClick={()=>action({action:'activate'})}>ЗАВЕРШИТЬ ПОДКЛЮЧЕНИЕ</button></>}</>}
  </section>
  {status?.configured&&<section className="manage-card"><h2>Получатель заявок</h2>{status.ownerConnected?<p className="telegram-connected"><CheckCircle2 size={20}/>Чат Данила подключён. Новые заявки будут приходить туда.</p>:<><p>Откройте ссылку ниже в Telegram Данила и нажмите «Запустить». Эта ссылка предназначена только для получателя заявок.</p>{link?<><a className="button button-primary" href={link} target="_blank" rel="noopener noreferrer"><Send size={18}/>ПОЛУЧАТЬ ЗАЯВКИ В TELEGRAM</a><p className="small-text">Ссылка действует 10 минут. После первого подключения она станет недействительна.</p></>:<button className="button button-primary" disabled={busy||!status.webhookConnected} onClick={()=>action({action:'owner_link'})}>ПОЛУЧИТЬ ССЫЛКУ ДЛЯ ДАНИЛА</button>}</>}
   <button className="text-button telegram-refresh" disabled={busy} onClick={()=>{setError('');refresh().catch(e=>setError(e.message));}}><RefreshCw size={16}/>Обновить статус</button>
  </section>}
  {error&&<p className="form-error" role="alert">{error}</p>}
  <p className="small-text">Бот помогает с услугами и записью. Отправленная клиентом заявка не подтверждает время визита — его согласует мастер.</p>
 </main>;
}
