import {env} from "cloudflare:workers";
import {getPhotoStorage} from "../../../../../lib/photo-storage";
import {isOwnerAuthorized} from "../../../../../lib/owner-access";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await isOwnerAuthorized(env,request.headers))return new Response("Доступ закрыт",{status:403});
 const {id}=await params;
 const photoStorage=getPhotoStorage();
 if(!id.startsWith("leads/")||!photoStorage)return new Response("Не найдено",{status:404});
 const photo=await photoStorage.get(id);if(!photo)return new Response("Не найдено",{status:404});
 return new Response(photo.body,{headers:{"Content-Type":photo.contentType||"application/octet-stream","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'"}});
}
