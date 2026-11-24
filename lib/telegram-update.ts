export type BotMessage={message_id:number;chat:{id:number;type:string};from?:{id:number;is_bot?:boolean};text?:string;photo?:unknown[]};
export type BotUpdate={update_id:number;message?:BotMessage;callback_query?:{id:string;from:{id:number;is_bot?:boolean};data?:string;message?:BotMessage}};
export function privateBotMessage(update:BotUpdate):BotMessage|null{
 const callback=update.callback_query;const message=callback?.message||update.message;
 if(!message||message.chat?.type!=='private'||!Number.isSafeInteger(message.chat.id)||message.chat.id<=0)return null;
 if(callback){if(callback.from?.is_bot||callback.from?.id!==message.chat.id)return null;}
 else if(message.from?.is_bot)return null;
 return message;
}
