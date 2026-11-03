// 01612C | Server-side, global Brevo budget accounting. No recipient, subject, body or token stored.
import {withClient} from './db.mjs';
const clean=v=>String(v??'').trim();
export const EMAIL_BREVO_DAILY_LIMIT_01612C=300;
export function dailyLimit01612C(env=process.env){
 const requested=Number(env.BREVO_DAILY_LIMIT_01612C);
 return Number.isSafeInteger(requested)&&requested>0?Math.min(requested,EMAIL_BREVO_DAILY_LIMIT_01612C):EMAIL_BREVO_DAILY_LIMIT_01612C;
}
export const emailUsageModule01612C=value=>['password-reset','buyer-email-code','manager-reply','notification','system'].includes(clean(value))?clean(value):'system';
export const emailUsageSite01612C=value=>clean(value).replace(/[^a-zA-Z0-9_.-]/g,'').slice(0,120);
export const emailUsageThreshold01612C=(used,limit)=>{const p=Number(limit)>0?Math.round(100*Number(used)/Number(limit)):0;return p>=100?100:p>=90?90:p>=70?70:0;};
export const usageError01612C=(code,statusCode=429)=>Object.assign(new Error(code),{code,statusCode});
// A transaction-level advisory lock serializes reservations across every Render instance.
// The provider counts are estimates only: other Brevo senders and marketing sends are not visible.
export async function reserveEmailUsage01612C({module='system',siteId='',priority='normal',limit=dailyLimit01612C()}={}, {withDb=withClient}={}){
 return withDb(async db=>{
  await db.query('BEGIN');
  try{
   await db.query("SELECT pg_advisory_xact_lock(hashtext('shifttime_email_budget_01612c'))");
   const result=await db.query(`SELECT COUNT(*)::integer AS count FROM platform_email_usage_01612c
     WHERE created_at>=date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
       AND created_at < (date_trunc('day',now() AT TIME ZONE 'UTC') + interval '1 day') AT TIME ZONE 'UTC'
       AND status IN ('accepted','pending')`);
   const count=Number(result.rows[0]?.count)||0;
   // Reserve up to 10% for critical identity and email verification traffic.
   const normalLimit=Math.max(1,Math.floor(limit*.9)),critical=priority==='critical';
   const blocked=count >=(critical?limit:normalLimit);
   const inserted=await db.query(`INSERT INTO platform_email_usage_01612c(module,site_id,status,error_code)
      VALUES($1,$2,$3,$4) RETURNING id`,[
      emailUsageModule01612C(module),emailUsageSite01612C(siteId),blocked?'blocked':'pending',blocked?'EMAIL_DAILY_BUDGET_REACHED_01612C':'']);
   await db.query('COMMIT');
   if(blocked)throw usageError01612C('EMAIL_DAILY_BUDGET_REACHED_01612C');
   return {id:inserted.rows[0].id,count,limit};
  }catch(error){await db.query('ROLLBACK').catch(()=>{});throw error;}
 });
}
export async function finishEmailUsage01612C(id,{accepted=false,statusCode=0,errorCode=''}={}, {withDb=withClient}={}){
 if(!id)return;
 return withDb(db=>db.query(`UPDATE platform_email_usage_01612c SET status=$2,finished_at=now(),response_code=$3,error_code=$4
   WHERE id=$1 AND status='pending'`,[id,accepted?'accepted':'failed',Number(statusCode)||null,clean(errorCode).replace(/[^A-Z0-9_]/g,'').slice(0,90)]));
}
export async function getEmailUsage01612C({limit=dailyLimit01612C(),query=withClient}={}){
 return query(async db=>{
  const [summary,history,modules,events]=await Promise.all([
   db.query(`SELECT status,COUNT(*)::integer AS count FROM platform_email_usage_01612c
      WHERE (created_at AT TIME ZONE 'UTC')::date=(now() AT TIME ZONE 'UTC')::date GROUP BY status`),
   db.query(`SELECT (created_at AT TIME ZONE 'UTC')::date::text AS day,status,COUNT(*)::integer AS count
     FROM platform_email_usage_01612c WHERE created_at>=now()-interval '30 days'
     GROUP BY day,status ORDER BY day ASC`),
   db.query(`SELECT module,site_id,status,COUNT(*)::integer AS count FROM platform_email_usage_01612c
     WHERE (created_at AT TIME ZONE 'UTC')::date=(now() AT TIME ZONE 'UTC')::date
     GROUP BY module,site_id,status ORDER BY count DESC LIMIT 100`),
   db.query(`SELECT created_at,module,site_id,status,response_code,error_code FROM platform_email_usage_01612c
     ORDER BY created_at DESC LIMIT 30`)
  ]);
  const totals={attempts:0,accepted:0,failed:0,blocked:0,pending:0};
  for(const item of summary.rows){const count=Number(item.count)||0;totals.attempts+=count;if(Object.hasOwn(totals,item.status))totals[item.status]+=count;}
  const reserved=totals.accepted+totals.pending,remaining=Math.max(0,limit-reserved);
  return {stage:'01612C',source:'shifttime-backend-only',timezone:'UTC',limit,remaining,used:reserved,threshold:emailUsageThreshold01612C(reserved,limit),totals,
    history:history.rows.map(r=>({day:String(r.day),status:String(r.status),count:Number(r.count)||0})),
    modules:modules.rows.map(r=>({module:String(r.module),siteId:String(r.site_id),status:String(r.status),count:Number(r.count)||0})),
    events:events.rows.map(r=>({at:r.created_at,module:String(r.module),siteId:String(r.site_id),status:String(r.status),responseCode:Number(r.response_code)||0,errorCode:String(r.error_code||'')}))};
 });
}
