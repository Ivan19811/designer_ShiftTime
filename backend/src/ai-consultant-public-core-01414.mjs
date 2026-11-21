import crypto from 'node:crypto';
const str=value=>String(value??'').trim();
const buckets=new Map();
const digest=value=>crypto.createHash('sha256').update(String(value||'')).digest('hex');
function fail(code,statusCode=400){const error=new Error(code);error.code=code;error.statusCode=statusCode;return error;}
function consume(key,max,windowMs,now){const previous=buckets.get(key),bucket=!previous||now-previous.startedAt>=windowMs?{startedAt:now,count:0}:previous;bucket.count+=1;buckets.set(key,bucket);if(bucket.count>max)return {ok:false,retryAfter:Math.max(1,Math.ceil((windowMs-(now-bucket.startedAt))/1000)),limit:max,remaining:0,resetAt:bucket.startedAt+windowMs};return {ok:true,limit:max,remaining:Math.max(0,max-bucket.count),resetAt:bucket.startedAt+windowMs};}
export function assertAiConsultantPublicRateLimit01414(identity,meta={},visitorKey='',now=Date.now()){
  const site=str(identity?.siteId),remote=str(meta?.remoteAddress)||'unknown',visitor=str(visitorKey)||'unknown',windowMs=60_000;
  const visitorRate=consume(`visitor:${digest(`${site}|${visitor}`)}`,12,windowMs,now);if(!visitorRate.ok){const error=fail('AI_CONSULTANT_PUBLIC_RATE_LIMITED_01414',429);error.retryAfter=visitorRate.retryAfter;throw error;}
  const networkRate=consume(`network:${digest(`${site}|${remote}`)}`,120,windowMs,now);if(!networkRate.ok){const error=fail('AI_CONSULTANT_PUBLIC_RATE_LIMITED_01414',429);error.retryAfter=networkRate.retryAfter;throw error;}
  if(buckets.size>20_000){for(const [key,row] of buckets){if(now-row.startedAt>windowMs*4)buckets.delete(key);}}
  return {limit:visitorRate.limit,remaining:Math.min(visitorRate.remaining,networkRate.remaining),resetAt:Math.max(visitorRate.resetAt,networkRate.resetAt)};
}
