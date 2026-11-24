import {headers} from "next/headers";
import {getTelegramToken,getTelegramOwner} from "../../lib/telegram";
import {isOwnerAuthorized} from "../../lib/owner-access";
import {env} from "cloudflare:workers";
import {getDb} from "../../db";
import {leads} from "../../db/schema";
import {desc} from "drizzle-orm";
export const dynamic="force-dynamic";
export const metadata={title:"Заявки — Малярка43",robots:{index:false,follow:false}};
const statusLabel:Record<string,string>={sent:"отправлено",failed:"ошибка отправки",not_configured:"ещё не подключено"};
export default async function Manage(){
 const h=await headers();
 if(!await isOwnerAuthorized(env,h))return <main className="legal-page"><a href="/">На сайт</a><h1>Доступ владельца</h1><p>Заявки и фотографии доступны только владельцу сайта.</p><p>Для входа используйте данные владельца.</p></main>;
 const items=await getDb().select().from(leads).orderBy(desc(leads.createdAt)).limit(100);
 const telegramReady=!!(await getTelegramToken().catch(()=>null))&&!!(await getTelegramOwner().catch(()=>null));
 return <main className="manage-page"><a href="/">На сайт</a><h1>Заявки · Малярка43</h1><p><a href="/manage/telegram">Настройки Telegram-бота</a></p><p>Последние 100 обращений. Указанная дата требует подтверждения мастером.</p><div className="manage-card"><p>Почта: {env.RESEND_API_KEY&&env.NOTIFICATION_FROM_EMAIL?"подключена":"ожидает подключения почтового сервиса"}</p><p>Telegram: {telegramReady?"подключён":"ожидает подключения бота"}</p></div>{items.length===0&&<p>Заявок пока нет.</p>}{items.map(item=><article className="manage-card" key={item.id}><h2>{item.name} · {item.service}</h2><p>{new Intl.DateTimeFormat("ru-RU",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Moscow"}).format(new Date(item.createdAt))} · № {item.id.slice(0,8)}</p><a href={`tel:${item.phone}`}>{item.phone}</a><p>Автомобиль: {item.car||"не указан"}</p><p>Удобная дата: {item.preferredDate||"согласовать"}</p><p>{item.description}</p><p className="manage-status">Почта: {statusLabel[item.emailStatus]} · Telegram: {statusLabel[item.telegramStatus]}</p><div className="manage-photos">{(JSON.parse(item.photos) as {key:string;name:string}[]).map(photo=><a key={photo.key} href={`/api/admin/photos/${encodeURIComponent(photo.key)}`} target="_blank" rel="noopener noreferrer"><img src={`/api/admin/photos/${encodeURIComponent(photo.key)}`} alt={photo.name}/></a>)}</div></article>)}</main>;
}
