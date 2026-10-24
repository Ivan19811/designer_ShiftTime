// 01579 · Read-only identity data for the builder account view.
// Verification is exclusively server-derived. Never infer proof from password login.
const clean=v=>String(v??'').trim();
export function normalizeAccountProfile01579(row={}){
  const email=clean(row.email),phone=clean(row.phone_e164);
  return Object.freeze({
    id:clean(row.id),name:clean(row.name),email,
    phone,
    createdAt:row.created_at||null,
    emailVerified:!!(email&&row.email_verified_at),
    phoneVerified:!!(phone&&row.phone_verified_at),
    emailVerifiedAt:email&&row.email_verified_at||null,
    phoneVerifiedAt:phone&&row.phone_verified_at||null,
  });
}
export async function getAccountProfile01579(session,{query}={}){
  const userId=clean(session?.userId);
  if(!userId){const e=new Error('AUTH_REQUIRED_01579');e.statusCode=401;throw e;}
  const run=query||((sql,params)=>import('./db.mjs').then(({withClient})=>withClient(c=>c.query(sql,params))));
  const result=await run(`SELECT id,name,email,phone_e164,email_verified_at,phone_verified_at,created_at
    FROM platform_users WHERE id=$1 AND status='active' LIMIT 1`,[userId]);
  if(!result?.rows?.length){const e=new Error('PROFILE_NOT_FOUND_01579');e.statusCode=404;throw e;}
  return normalizeAccountProfile01579(result.rows[0]);
}
