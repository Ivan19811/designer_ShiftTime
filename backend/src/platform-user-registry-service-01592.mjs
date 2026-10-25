// 01592 · Read-only globally protected user directory and trusted service-use tracking.
import {withClient} from './db.mjs';
import {normalizeServiceCode01592,normalizeRegistryFilters01592,serviceFlags01592,assertPlatformSuperadmin01592} from './platform-user-registry-core-01592.mjs';
const fault=(code,statusCode=400)=>Object.assign(new Error(code),{statusCode});

// Call only after a REAL server-authenticated action: never take a userId from browser input.
// The inferred -> confirmed transition is one-way; do not over-write first_seen_at.
export async function recordTrustedService01592(client,userId,service,source){
  const code=normalizeServiceCode01592(service);
  const safeSource=String(source??'').trim();
  const trusted=Object.freeze({builder:'builder_context',crm:'crm_sso_exchange'});
  if(!userId||!code||trusted[code]!==safeSource)throw fault('INVALID_SERVICE_EVENT_01592');
  await client.query(`INSERT INTO platform_user_services_01592
    (user_id,service_code,evidence,evidence_source,first_seen_at,last_seen_at,updated_at)
    VALUES ($1,$2,'confirmed',$3,now(),now(),now())
    ON CONFLICT (user_id,service_code) DO UPDATE SET
      evidence='confirmed', evidence_source=EXCLUDED.evidence_source,
      last_seen_at=now(), updated_at=now()`,[userId,code,safeSource]);
}
export async function noteServiceUse01592(userId,service,source){
  return withClient(db=>recordTrustedService01592(db,userId,service,source));
}
// Usage analytics must not interrupt a successful login if optional tracking fails.
export async function noteServiceUseSafely01592(userId,service,source,logger=console){
  try{await noteServiceUse01592(userId,service,source);return true;}
  catch(e){logger.warn?.('[01592] trusted service tracking unavailable',{service,code:e?.code||'DB_ERROR'});return false;}
}

const siteCountSql=`(SELECT COUNT(*)::int FROM shifttime_builder_sites b WHERE b.owner_user_id=u.id AND b.status<>'archived')`;
const storeCountSql=`(SELECT COUNT(DISTINCT s.id)::int FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id JOIN platform_accounts a ON a.id=w.account_id WHERE s.status<>'archived' AND w.status='active' AND a.status='active' AND (EXISTS (SELECT 1 FROM platform_memberships m WHERE m.user_id=u.id AND m.status='active' AND m.account_id=a.id AND (m.workspace_id IS NULL OR m.workspace_id=w.id) AND (m.store_id IS NULL OR m.store_id=s.id)) OR EXISTS(SELECT 1 FROM platform_user_shop_customers_01592 sc WHERE sc.user_id=u.id AND sc.store_id=s.id AND sc.status='active')))`;
const servicesSql=`COALESCE((SELECT jsonb_agg(jsonb_build_object('serviceCode',us.service_code,'evidence',us.evidence,'lastSeenAt',us.last_seen_at) ORDER BY us.service_code) FROM platform_user_services_01592 us WHERE us.user_id=u.id),'[]'::jsonb)`;
function predicates01592(f){
  const where=['true'];const params=[];
  if(f.search){params.push(f.search.toLowerCase());where.push(`(position($${params.length} in lower(u.name))>0 OR position($${params.length} in lower(u.email))>0 OR position($${params.length} in lower(u.id))>0)`);}
  if(f.status){params.push(f.status);where.push(`u.status=$${params.length}`);}
  if(f.service){params.push(f.service);const serviceBind=params.length;
    if(f.evidence){params.push(f.evidence);where.push(`EXISTS (SELECT 1 FROM platform_user_services_01592 sv WHERE sv.user_id=u.id AND sv.service_code=$${serviceBind} AND sv.evidence=$${params.length})`);}
    else where.push(`EXISTS (SELECT 1 FROM platform_user_services_01592 sv WHERE sv.user_id=u.id AND sv.service_code=$${serviceBind})`);
  }else if(f.evidence){params.push(f.evidence);where.push(`EXISTS (SELECT 1 FROM platform_user_services_01592 sv WHERE sv.user_id=u.id AND sv.evidence=$${params.length})`);}
  return {where:where.join(' AND '),params};
}
export async function listPlatformUsers01592(actorId,query={}){
  assertPlatformSuperadmin01592(actorId);
  const f=normalizeRegistryFilters01592(query),{where,params}=predicates01592(f);
  return withClient(async db=>{
    const c=await db.query(`SELECT COUNT(*)::int AS total FROM platform_users u WHERE ${where}`,params);
    const r=await db.query(`SELECT u.id,u.name,u.email,u.status,u.created_at "createdAt",u.email_verified_at "emailVerifiedAt",u.phone_verified_at "phoneVerifiedAt",u.phone_e164 "phoneE164", ${siteCountSql} "siteCount", ${storeCountSql} "storeCount", ${servicesSql} services FROM platform_users u WHERE ${where} ORDER BY u.created_at DESC,u.id DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,f.limit,f.offset]);
    return {stage:'01592',total:Number(c.rows[0]?.total||0),limit:f.limit,offset:f.offset,items:r.rows.map(row=>({...row,services:serviceFlags01592(row.services)}))};
  });
}
export async function getPlatformUser01592(actorId,targetId){
  assertPlatformSuperadmin01592(actorId);
  const id=String(targetId||'').trim();if(!/^usr_[a-z0-9]{10,64}$/i.test(id))throw fault('INVALID_USER_ID_01592');
  return withClient(async db=>{
    const q=await db.query(`SELECT u.id,u.name,u.email,u.status,u.created_at "createdAt",u.email_verified_at "emailVerifiedAt",u.phone_verified_at "phoneVerifiedAt",u.phone_e164 "phoneE164",${servicesSql} services FROM platform_users u WHERE u.id=$1`,[id]);
    if(!q.rowCount)throw fault('USER_NOT_FOUND_01592',404);
    const memberships=await db.query(`SELECT m.id,m.role,m.status,m.permissions,m.account_id "accountId",a.name "accountName",m.workspace_id "workspaceId",w.name "workspaceName",m.store_id "storeId",s.name "storeName" FROM platform_memberships m JOIN platform_accounts a ON a.id=m.account_id LEFT JOIN platform_workspaces w ON w.id=m.workspace_id LEFT JOIN platform_stores s ON s.id=m.store_id WHERE m.user_id=$1 ORDER BY m.created_at DESC`,[id]);
    const sites=await db.query(`SELECT b.id,b.name,b.slug,b.status,b.store_id "storeId",b.created_at "createdAt",CASE WHEN b.owner_user_id=$1 THEN 'owner' ELSE sm.role END role FROM shifttime_builder_sites b LEFT JOIN platform_user_site_memberships_01592 sm ON sm.site_id=b.id AND sm.user_id=$1 AND sm.status='active' WHERE b.owner_user_id=$1 OR sm.user_id IS NOT NULL ORDER BY b.created_at DESC LIMIT 200`,[id]);
    const stores=await db.query(`SELECT DISTINCT s.id,s.name,s.slug,s.status,s.workspace_id "workspaceId",w.account_id "accountId",CASE WHEN EXISTS(SELECT 1 FROM platform_memberships mx WHERE mx.user_id=$1 AND mx.status='active' AND mx.account_id=a.id AND (mx.workspace_id IS NULL OR mx.workspace_id=w.id) AND (mx.store_id IS NULL OR mx.store_id=s.id)) THEN 'staff' ELSE 'customer' END "accessKind" FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id JOIN platform_accounts a ON a.id=w.account_id LEFT JOIN platform_user_shop_customers_01592 sc ON sc.store_id=s.id AND sc.user_id=$1 AND sc.status='active' WHERE s.status<>'archived' AND (sc.user_id IS NOT NULL OR EXISTS(SELECT 1 FROM platform_memberships m WHERE m.user_id=$1 AND m.status='active' AND m.account_id=a.id AND (m.workspace_id IS NULL OR m.workspace_id=w.id) AND (m.store_id IS NULL OR m.store_id=s.id))) ORDER BY s.name LIMIT 200`,[id]);
    const row=q.rows[0];return {stage:'01592',user:{...row,services:serviceFlags01592(row.services)},memberships:memberships.rows,sites:sites.rows,stores:stores.rows};
  });
}
export async function myServices01592(actorId){
  return withClient(async db=>{
    const q=await db.query(`SELECT service_code "serviceCode",evidence,last_seen_at "lastSeenAt" FROM platform_user_services_01592 WHERE user_id=$1`,[actorId]);
    return {stage:'01592',services:serviceFlags01592(q.rows)};
  });
}
