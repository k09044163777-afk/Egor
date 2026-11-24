export type BotButton={text:string;url?:string;callback_data?:string};
export type BotReply={text:string;reply_markup:{inline_keyboard:BotButton[][]}};
export const botCommands=[
 {command:'start',description:'Главное меню'},
 {command:'services',description:'Услуги мастерской'},
 {command:'contacts',description:'Телефоны, адрес и график'},
 {command:'photo',description:'Оценить ремонт по фото'},
 {command:'help',description:'Как записаться'},
];
export function botReply(action:string,origin:string,owner=false):BotReply{
 const booking={text:'Запись и оценка по фото',url:origin+'/#booking'};
 const contact={text:'Написать Данилу',url:'https://t.me/cherep_43'};
 const menu=[[booking],[{text:'Услуги',callback_data:'services'},{text:'Контакты',callback_data:'contacts'}],[contact]];
 if(owner)menu.push([{text:'Открыть заявки',url:origin+'/manage'}]);
 if(action==='services')return {text:'Услуги «Малярка43»\n\n• Кузовной ремонт\n• Покраска автомобиля\n• Сварочные работы, пороги и днище\n• Восстановление после ДТП\n• Стапельные работы\n• Антикоррозийная обработка\n\nОбъём, стоимость и срок согласуем после оценки повреждений.',reply_markup:{inline_keyboard:[[booking],[{text:'В главное меню',callback_data:'start'}]]}};
 if(action==='contacts')return {text:'Малярка43 · Данил\n\n+7 (917) 777-61-39\n+7 (912) 374-66-36\n\nКиров, Ульяновская улица, 39/3\nПн–пт: 10:00–20:00\nСб–вс: выходные\n\nПочта: Cherepanov1945@icloud.ru',reply_markup:{inline_keyboard:[[contact],[{text:'Маршрут в 2ГИС',url:'https://2gis.ru/kirov/firm/70000001105162492'}],[{text:'В главное меню',callback_data:'start'}]]}};
 if(action==='photo')return {text:'Оценка ремонта по фото\n\nОткройте форму на сайте и приложите до трёх фотографий: общий вид, снимок под углом и повреждение крупным планом.\n\nТак фотографии попадут в заявку вместе с вашими контактами. Предварительная оценка — по фото, итоговая стоимость — после осмотра.',reply_markup:{inline_keyboard:[[booking],[contact],[{text:'В главное меню',callback_data:'start'}]]}};
 if(action==='help')return {text:'Как записаться\n\n1. Откройте форму и расскажите об автомобиле.\n2. Приложите фото повреждений и оставьте телефон.\n3. Данил свяжется с вами и подтвердит время осмотра.\n\nОтправленная заявка сама по себе не подтверждает запись.',reply_markup:{inline_keyboard:[[booking],[contact],[{text:'В главное меню',callback_data:'start'}]]}};
 if(action==='status'&&owner)return {text:'Уведомления о новых заявках подключены к этому чату. Заявки и фотографии доступны в разделе владельца.',reply_markup:{inline_keyboard:[[{text:'Открыть заявки',url:origin+'/manage'}],[{text:'В главное меню',callback_data:'start'}]]}};
 return {text:'Малярка43 — кузовной ремонт в Кирове.\n\nПоможем с покраской, порогами, восстановлением после ДТП и защитой кузова.\n\nВыберите услугу, посмотрите контакты или оставьте заявку на сайте.',reply_markup:{inline_keyboard:menu}};
}
