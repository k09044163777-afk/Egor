import handler from 'vinext/server/fetch-handler';
import{isOwnerAuthorized}from'../lib/owner-access';
export default{async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
 const headers=new Headers(request.headers);
 for(const name of [...headers.keys()])if(name.startsWith('oai-authenticated-'))headers.delete(name);
 const safeRequest=new Request(request,{headers});const pathname=new URL(request.url).pathname;
 const protectedPath=pathname==='/manage'||pathname.startsWith('/manage/')||pathname.startsWith('/api/admin/');
 if(protectedPath){
  if(env.AUTH_MODE!=='password'||!env.ADMIN_PASSWORD)return new Response('Доступ владельца ещё не настроен.',{status:503,headers:{'Cache-Control':'no-store'}});
  if(!await isOwnerAuthorized(env,headers))return new Response('Доступ только для владельца.',{status:401,headers:{'WWW-Authenticate':'Basic realm="Malyarka43", charset="UTF-8"','Cache-Control':'no-store'}});
 }
 return handler.fetch(safeRequest,env,ctx);
}};
