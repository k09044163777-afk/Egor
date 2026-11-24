import {env} from 'cloudflare:workers';
export interface PhotoStorage {
 put(key:string,value:ArrayBuffer,contentType:string):Promise<void>;
 get(key:string):Promise<{body:BodyInit;contentType:string}|null>;
 delete(key:string):Promise<void>;
}
export function getPhotoStorage():PhotoStorage|null {
 if(env.PHOTO_STORE){const store=env.PHOTO_STORE;return {
  async put(key,value,contentType){await store.put(key,value,{metadata:{contentType}});},
  async get(key){const photo=await store.getWithMetadata<{contentType:string}>(key,'arrayBuffer');return photo.value?{body:photo.value,contentType:photo.metadata?.contentType||'application/octet-stream'}:null;},
  async delete(key){await store.delete(key);},
 };}
 if(env.BUCKET){const bucket=env.BUCKET;return {
  async put(key,value,contentType){await bucket.put(key,value,{httpMetadata:{contentType}});},
  async get(key){const photo=await bucket.get(key);return photo?{body:photo.body,contentType:photo.httpMetadata?.contentType||'application/octet-stream'}:null;},
  async delete(key){await bucket.delete(key);},
 };}
 return null;
}
