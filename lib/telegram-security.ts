const encode=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode=(value:string)=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export function newConnectNonce(){return encode(crypto.getRandomValues(new Uint8Array(24)));}
export async function hashNonce(value:string){return encode(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));}
export async function secureEqual(left:string,right:string){
 const[a,b]=await Promise.all([hashNonce(left),hashNonce(right)]);let difference=0;
 for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0;
}
async function storageKey(secret:string,algorithm:'AES-GCM'|'HMAC',usages:KeyUsage[]){
 const bytes=decode(secret);if(bytes.length!==32)throw new Error('Telegram storage is not configured');
 return crypto.subtle.importKey('raw',bytes,algorithm==='HMAC'?{name:'HMAC',hash:'SHA-256'}:{name:'AES-GCM'},false,usages);
}
export async function encryptBotToken(token:string,secret:string){
 const iv=crypto.getRandomValues(new Uint8Array(12));const key=await storageKey(secret,'AES-GCM',['encrypt']);
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('malyarka43-telegram-v1')},key,new TextEncoder().encode(token));
 return `v1.${encode(iv)}.${encode(new Uint8Array(encrypted))}`;
}
export async function decryptBotToken(value:string,secret:string){
 const[version,iv,payload,...extra]=value.split('.');if(version!=='v1'||!iv||!payload||extra.length)throw new Error('Invalid stored token');
 const key=await storageKey(secret,'AES-GCM',['decrypt']);
 return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(iv),additionalData:new TextEncoder().encode('malyarka43-telegram-v1')},key,decode(payload)));
}
export async function webhookSecret(secret:string){
 const key=await storageKey(secret,'HMAC',['sign']);
 return encode(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('malyarka43-telegram-webhook-v1'))));
}
