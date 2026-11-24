type OwnerEnvironment={AUTH_MODE?:string;ADMIN_USER?:string;ADMIN_PASSWORD?:string;OWNER_EMAIL?:string};
export async function isOwnerAuthorized(env:OwnerEnvironment,headers:Pick<Headers,'get'>):Promise<boolean>{
 if(env.AUTH_MODE==='password'){
  if(!env.ADMIN_PASSWORD||env.ADMIN_PASSWORD.length<20)return false;
  const authorization=headers.get('authorization');if(!authorization?.startsWith('Basic '))return false;
  let actual:string;try{actual=atob(authorization.slice(6));}catch{return false;}
  const expected=`${env.ADMIN_USER||'danil'}:${env.ADMIN_PASSWORD}`;
  const digest=async(text:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
  const[left,right]=await Promise.all([digest(actual),digest(expected)]);let difference=0;
  for(let i=0;i<left.length;i++)difference|=left[i]^right[i];return difference===0;
 }
 const email=headers.get('oai-authenticated-user-email');return Boolean(env.OWNER_EMAIL&&email?.toLowerCase()===env.OWNER_EMAIL.toLowerCase());
}
