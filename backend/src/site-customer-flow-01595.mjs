// 01595 · Secure hosted-identity flow. Passwords exist only on Render-owned origin.
import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {registerSiteCustomer01595,loginSiteCustomer01595,createCustomerSession01595} from './site-customer-account-service-01595.mjs';
import {customerSessionHash01595,customerSiteScope01595,siteAccountFault01595} from './site-customer-account-core-01595.mjs';
const clean=v=>String(v??'').trim();
const safeB64=/^[A-Za-z0-9_-]{32,128}$/;
const siteFlowId01595=()=>`sitx_${crypto.randomBytes(24).toString('base64url')}`;
const oneTimeCode01595=()=>`sic_${crypto.randomBytes(32).toString('base64url')}`;
const origin01595=raw=>{
  try{const url=new URL(clean(raw));if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/'&&url.pathname!=='')throw Error('bad');return url.origin;}
  catch{throw siteAccountFault01595('SITE_ACCOUNT_ORIGIN_INVALID_01595',400);}
};
const path01595=raw=>{
  const value=clean(raw);
  if(!value.startsWith('/')||value.startsWith('//')||value.includes('\\')||value.length>280||/[?#\r\n]/.test(value))throw siteAccountFault01595('SITE_ACCOUNT_PATH_INVALID_01595');
  try{const u=new URL(value,'https://st.invalid');if(u.origin!=='https://st.invalid'||u.pathname.startsWith('//')||u.search||u.hash)throw Error('bad');return u.pathname;}
  catch{throw siteAccountFault01595('SITE_ACCOUNT_PATH_INVALID_01595');}
};
export function authOrigin01595(configured=process.env.SITE_CUSTOMER_AUTH_ORIGIN){
  const origin=origin01595(configured);if(!origin||origin==='null')throw siteAccountFault01595('SITE_ACCOUNT_AUTH_ORIGIN_MISSING_01595',503);return origin;
}
const normalOrigin01595=value=>{try{const input=clean(value);return input?new URL(/^https?:\/\//i.test(input)?input:`https://${input}`).origin:'';}catch{return '';}};
export function assertPublishedReturnOrigin01595(requested,row){
  const origin=origin01595(requested);
  // Custom domains require separate ownership verification; never trust a typed Store domain here.
  const candidates=[row.netlify_ssl_url,row.netlify_url].map(normalOrigin01595).filter(Boolean);
  if(!candidates.includes(origin))throw siteAccountFault01595('SITE_ACCOUNT_ORIGIN_DENIED_01595',403);
  return origin;
}
async function lookupSiteForFlow01595(db,siteId){
  const q=await db.query(`SELECT ps.id,ps.builder_site_id,ps.account_id,ps.store_id,ps.site_name,
    ps.netlify_ssl_url,ps.netlify_url,st.domain store_domain
    FROM shifttime_published_sites ps LEFT JOIN platform_stores st ON st.id=ps.store_id
    WHERE ps.builder_site_id=$1 AND ps.last_deploy_state IN ('ready','published')
    ORDER BY ps.last_published_at DESC NULLS LAST LIMIT 1`,[siteId]);
  // Conservative: only sites with a successful deployment can receive a redirect.
  if(!q.rowCount)throw siteAccountFault01595('SITE_ACCOUNT_SITE_NOT_PUBLISHED_01595',403);
  return q.rows[0];
}
export async function startSiteCustomerFlow01595(site,data,{query=withClient,base=authOrigin01595()}={}){
  const scope=customerSiteScope01595(site),challenge=clean(data?.codeChallenge),state=clean(data?.state);
  if(!safeB64.test(challenge)||challenge.length!==43||!safeB64.test(state))throw siteAccountFault01595('SITE_ACCOUNT_PKCE_REQUIRED_01595');
  const returnPath=path01595(data?.returnPath),requestedMode=clean(data?.mode)==='register'?'register':'login',flowId=siteFlowId01595();
  return query(async db=>{
    const row=await lookupSiteForFlow01595(db,scope.siteId);
    if(row.id!==scope.publishedSiteId)throw siteAccountFault01595('SITE_ACCOUNT_SITE_MISMATCH_01595',403);
    const requested=assertPublishedReturnOrigin01595(data?.returnOrigin,row);
    await db.query(`INSERT INTO platform_site_customer_flows_01595
      (id,site_id,published_site_id,redirect_origin,redirect_path,client_state,code_challenge,requested_mode)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[flowId,scope.siteId,scope.publishedSiteId,requested,returnPath,state,challenge,requestedMode]);
    return {stage:'01595',loginUrl:base+'/identity/site/?tx='+encodeURIComponent(flowId)};
  });
}
async function loadFlow01595(db,flowId,{lock=false}={}){
  if(!/^sitx_[A-Za-z0-9_-]{32}$/.test(clean(flowId)))throw siteAccountFault01595('SITE_ACCOUNT_FLOW_INVALID_01595',400);
  const q=await db.query(`SELECT f.*,ps.site_name,ps.account_id,ps.store_id
    FROM platform_site_customer_flows_01595 f JOIN shifttime_published_sites ps ON ps.id=f.published_site_id
    WHERE f.id=$1 AND f.expires_at>now() AND f.consumed_at IS NULL LIMIT 1${lock?' FOR UPDATE OF f':''}`,[flowId]);
  if(!q.rowCount)throw siteAccountFault01595('SITE_ACCOUNT_FLOW_EXPIRED_01595',410);
  return q.rows[0];
}
export async function flowPublicInfo01595(flowId,{query=withClient}={}){
  return query(async db=>{const row=await loadFlow01595(db,flowId);return {stage:'01595',siteName:row.site_name,requestedMode:row.requested_mode||'login',registrationEnabled:String(process.env.SITE_CUSTOMER_REGISTRATION_ENABLED||'').toLowerCase()==='true'};});
}
export async function finishHostedIdentity01595(flowId,action,data,{query=withClient,authenticate=null}={}){
  if(!['register','login'].includes(action))throw siteAccountFault01595('SITE_ACCOUNT_ACTION_INVALID_01595');
  // Transaction is short. Credential validation is delegated to the shared identity service.
  const row=await query(db=>loadFlow01595(db,flowId));
  if(row.user_id||row.code_hash)throw siteAccountFault01595('SITE_ACCOUNT_FLOW_USED_01595',409);
  const scope={siteId:row.site_id,publishedSiteId:row.published_site_id,accountId:row.account_id,storeId:row.store_id};
  const auth=authenticate?await authenticate(scope,action,data):(action==='register'?await registerSiteCustomer01595(scope,data):await loginSiteCustomer01595(scope,data));
  const code=oneTimeCode01595(),hash=customerSessionHash01595(code);
  return query(async db=>{
    const changed=await db.query(`UPDATE platform_site_customer_flows_01595 SET user_id=$1,code_hash=$2
      WHERE id=$3 AND expires_at>now() AND consumed_at IS NULL AND user_id IS NULL AND code_hash IS NULL`,[auth.user.id,hash,flowId]);
    if(!changed.rowCount)throw siteAccountFault01595('SITE_ACCOUNT_FLOW_USED_01595',409);
    const url=new URL(row.redirect_path,row.redirect_origin);
    url.hash=new URLSearchParams({st_site_code:code,st_site_state:row.client_state}).toString();
    return {stage:'01595',redirectUrl:url.toString()};
  });
}
export async function exchangeSiteCustomerCode01595(site,code,verifier,{query=withClient}={}){
  const scope=customerSiteScope01595(site),validCode=/^sic_[A-Za-z0-9_-]{43}$/.test(clean(code));
  const validVerifier=safeB64.test(clean(verifier))&&clean(verifier).length>=43;
  if(!validCode||!validVerifier)throw siteAccountFault01595('SITE_ACCOUNT_EXCHANGE_INVALID_01595',400);
  const challenge=crypto.createHash('sha256').update(clean(verifier)).digest('base64url');
  return query(async db=>{
    await db.query('BEGIN');
    try{
      const q=await db.query(`SELECT id,user_id,code_challenge FROM platform_site_customer_flows_01595
        WHERE code_hash=$1 AND site_id=$2 AND published_site_id=$3 AND consumed_at IS NULL AND expires_at>now()
        FOR UPDATE`,[customerSessionHash01595(code),scope.siteId,scope.publishedSiteId]);
      const row=q.rows[0];
      if(!row?.user_id||row.code_challenge!==challenge)throw siteAccountFault01595('SITE_ACCOUNT_EXCHANGE_INVALID_01595',401);
      const user=await db.query('SELECT id,name,email,email_verified_at FROM platform_users WHERE id=$1 AND status=\'active\' LIMIT 1',[row.user_id]);
      if(!user.rowCount)throw siteAccountFault01595('SITE_ACCOUNT_LOGIN_REQUIRED_01595',401);
      const session=await createCustomerSession01595(db,row.user_id,scope);
      await db.query('UPDATE platform_site_customer_flows_01595 SET consumed_at=now() WHERE id=$1',[row.id]);
      await db.query('COMMIT');
      return {stage:'01595',user:{id:user.rows[0].id,name:user.rows[0].name,email:user.rows[0].email,emailVerified:Boolean(user.rows[0].email_verified_at)},siteId:scope.siteId,storeId:scope.storeId,...session};
    }catch(error){await db.query('ROLLBACK').catch(()=>{});throw error;}
  });
}
