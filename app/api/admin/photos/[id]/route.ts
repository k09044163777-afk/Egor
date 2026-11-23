import {env} from "cloudflare:workers";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const email=request.headers.get("oai-authenticated-user-email");
 if(!env.OWNER_EMAIL||email?.toLowerCase()!==env.OWNER_EMAIL.toLowerCase())return new Response("Доступ закрыт",{status:403});
 const {id}=await params;
 if(!id.startsWith("leads/")||!env.BUCKET)return new Response("Не найдено",{status:404});
 const photo=await env.BUCKET.get(id);if(!photo)return new Response("Не найдено",{status:404});
 return new Response(photo.body,{headers:{"Content-Type":photo.httpMetadata?.contentType||"application/octet-stream","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'"}});
}
