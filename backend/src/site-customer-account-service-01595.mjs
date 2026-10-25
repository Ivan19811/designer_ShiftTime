// 01595 · Shared ShiftTime ID + independent, site-scoped customer-only sessions.
import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {hashPassword01084,verifyPassword01084} from './auth-service-01084.mjs';
import {customerInput01595,customerSiteScope01595,customerSessionHash01595,newCustomerToken01595,customerPublicUser01595,siteAccountFault01595} from './site-customer-account-core-01595.mjs';
const id=prefix=>`${prefix}_${crypto.randomUUID().replaceAll('-','').slice(0,20)}`;
const ENABLED=()=>String(process.env.SITE_CUSTOMER_REGISTRATION_ENABLED||'').toLowerCase()==='true';
const scopeOf=site=>customerSiteScope01595(site);
const safeHeaders={ 'cache-control':'private, no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff' };
export const siteAccountHeaders01595=Object.freeze(safeHeaders);

async function linkCustomer01595(db,userId,scope){
  await db.query(`INSERT INTO platform_user_site_memberships_01592(user_id,site_id,role,status)
    VALUES($1,$2,'customer','active') ON CONFLICT(user_id,site_id) DO NOTHING`,[userId,scope.siteId]);
  const siteLink=await db.query('SELECT status FROM platform_user_site_memberships_01592 WHERE user_id=$1 AND site_id=$2',[userId,scope.siteId]);
  if(siteLink.rows[0]?.status!=='active')throw siteAccountFault01595('SITE_ACCOUNT_DISABLED_01595',403);
  if(scope.storeId){
    await db.query(`INSERT INTO platform_user_shop_customers_01592(user_id,store_id,status)
      VALUES($1,$2,'active') ON CONFLICT(user_id,store_id) DO NOTHING`,[userId,scope.storeId]);
    const shopLink=await db.query('SELECT status FROM platform_user_shop_customers_01592 WHERE user_id=$1 AND store_id=$2',[userId,scope.storeId]);
    if(shopLink.rows[0]?.status!=='active')throw siteAccountFault01595('SITE_ACCOUNT_DISABLED_01595',403);
  }
  for(const code of scope.storeId?['site','shop']:['site']){
    await db.query(`INSERT INTO platform_user_services_01592(user_id,service_code,evidence,evidence_source,first_seen_at,last_seen_at,updated_at)
      VALUES($1,$2,'confirmed','published_site_customer_01595',now(),now(),now())
      ON CONFLICT(user_id,service_code) DO UPDATE SET evidence='confirmed',evidence_source='published_site_customer_01595',last_seen_at=now(),updated_at=now()`,[userId,code]);
  }
}
export async function createCustomerSession01595(db,userId,scope){
  const token=newCustomerToken01595(),sessionId=id('site_session');
  const q=await db.query(`INSERT INTO platform_site_customer_sessions_01595(id,user_id,site_id,token_hash,expires_at)
    VALUES($1,$2,$3,$4,now()+interval '7 days') RETURNING expires_at "expiresAt"`,[sessionId,userId,scope.siteId,customerSessionHash01595(token)]);
  return {token,expiresAt:q.rows[0]?.expiresAt||null};
}

export async function registerSiteCustomer01595(site,input,{query=withClient,issueSession=false}={}){
  const scope=scopeOf(site);
  if(!ENABLED())throw siteAccountFault01595('SITE_ACCOUNT_REGISTRATION_DISABLED_01595',403);
  const user=customerInput01595(input,true),passwordHash=await hashPassword01084(user.password),userId=id('usr');
  return query(async db=>{
    await db.query('BEGIN');
    try{
      const existing=await db.query('SELECT id FROM platform_users WHERE lower(email)=lower($1) LIMIT 1',[user.email]);
      if(existing.rowCount)throw siteAccountFault01595('SITE_ACCOUNT_ALREADY_EXISTS_01595',409);
      await db.query(`INSERT INTO platform_users(id,name,email,status) VALUES($1,$2,$3,'active')`,[userId,user.name,user.email]);
      await db.query(`INSERT INTO platform_user_credentials(id,user_id,kind,algorithm,secret_hash)
        VALUES($1,$2,'password','scrypt-v1',$3)`,[id('cred'),userId,passwordHash]);
      await linkCustomer01595(db,userId,scope);
      const session=issueSession?await createCustomerSession01595(db,userId,scope):{};
      await db.query('COMMIT');
      return {stage:'01595',user:{id:userId,name:user.name,email:user.email,emailVerified:false},siteId:scope.siteId,storeId:scope.storeId,...session};
    }catch(error){await db.query('ROLLBACK').catch(()=>{});
      if(error.code==='23505')throw siteAccountFault01595('SITE_ACCOUNT_ALREADY_EXISTS_01595',409);
      throw error;
    }
  });
}
export async function loginSiteCustomer01595(site,input,{query=withClient,issueSession=false}={}){
  const scope=scopeOf(site),user=customerInput01595(input);
  return query(async db=>{
    const q=await db.query(`SELECT u.id,u.name,u.email,u.email_verified_at,u.created_at,c.secret_hash
      FROM platform_users u JOIN platform_user_credentials c ON c.user_id=u.id AND c.kind='password'
      WHERE lower(u.email)=lower($1) AND u.status='active' LIMIT 1`,[user.email]);
    const row=q.rows[0];
    if(!row||!(await verifyPassword01084(user.password,row.secret_hash)))throw siteAccountFault01595('SITE_ACCOUNT_CREDENTIALS_01595',401);
    await db.query('BEGIN');
    try{
      await linkCustomer01595(db,row.id,scope);
      const session=issueSession?await createCustomerSession01595(db,row.id,scope):{};
      await db.query('COMMIT');
      return {stage:'01595',user:customerPublicUser01595(row),siteId:scope.siteId,storeId:scope.storeId,...session};
    }catch(error){await db.query('ROLLBACK').catch(()=>{});throw error;}
  });
}
function validCustomerBearer01595(token){return /^stc_[A-Za-z0-9_-]{40,120}$/.test(String(token||''));}
export async function customerSession01595(site,token,{query=withClient,updateSeen=true}={}){
  const scope=scopeOf(site);
  if(!validCustomerBearer01595(token))throw siteAccountFault01595('SITE_ACCOUNT_LOGIN_REQUIRED_01595',401);
  return query(async db=>{
    const q=await db.query(`SELECT s.id "sessionId",u.id,u.name,u.email,u.email_verified_at,u.created_at,s.expires_at "expiresAt"
      FROM platform_site_customer_sessions_01595 s JOIN platform_users u ON u.id=s.user_id
      JOIN platform_user_site_memberships_01592 sm ON sm.user_id=u.id AND sm.site_id=s.site_id AND sm.status='active'
      WHERE s.token_hash=$1 AND s.site_id=$2 AND s.status='active' AND s.expires_at>now() AND u.status='active'
      AND ($3='' OR EXISTS (SELECT 1 FROM platform_user_shop_customers_01592 sc WHERE sc.user_id=u.id AND sc.store_id=$3 AND sc.status='active')) LIMIT 1`,[customerSessionHash01595(token),scope.siteId,scope.storeId]);
    if(!q.rowCount)throw siteAccountFault01595('SITE_ACCOUNT_LOGIN_REQUIRED_01595',401);
    if(updateSeen)await db.query('UPDATE platform_site_customer_sessions_01595 SET last_seen_at=now() WHERE id=$1',[q.rows[0].sessionId]);
    return {stage:'01595',user:customerPublicUser01595(q.rows[0]),siteId:scope.siteId,storeId:scope.storeId,expiresAt:q.rows[0].expiresAt};
  });
}
export async function logoutSiteCustomer01595(site,token,{query=withClient}={}){
  const scope=scopeOf(site);
  if(!validCustomerBearer01595(token))return {stage:'01595',ok:true};
  return query(async db=>{
    await db.query(`UPDATE platform_site_customer_sessions_01595 SET status='revoked',revoked_at=now()
      WHERE token_hash=$1 AND site_id=$2 AND status='active'`,[customerSessionHash01595(token),scope.siteId]);
    return {stage:'01595',ok:true};
  });
}
