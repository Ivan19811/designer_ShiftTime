// 01592 · Safe, platform-wide ShiftTime ID directory contracts. No frontend strings.
export const SERVICE_CODES_01592=Object.freeze(['builder','crm','messenger','site','shop']);
const codes=new Set(SERVICE_CODES_01592);
const clean=v=>String(v??'').trim();
export function normalizeServiceCode01592(v){const code=clean(v).toLowerCase();return codes.has(code)?code:'';}
export function platformSuperadminAllowed01592(userId,configured=process.env.PLATFORM_SUPERADMIN_USER_IDS){
  const id=clean(userId);
  if(!id)return false;
  return String(configured??'').split(/[,;\s]+/).map(s=>s.trim()).filter(Boolean).includes(id);
}
export function assertPlatformSuperadmin01592(userId,configured=process.env.PLATFORM_SUPERADMIN_USER_IDS){
  if(platformSuperadminAllowed01592(userId,configured))return true;
  const e=new Error('PLATFORM_SUPERADMIN_REQUIRED_01592');e.statusCode=403;throw e;
}
export function normalizeRegistryFilters01592(query={}){
  const limit=Math.min(100,Math.max(1,parseInt(query.limit,10)||30));
  const offset=Math.min(100000,Math.max(0,parseInt(query.offset,10)||0));
  const search=clean(query.q).slice(0,120);
  const service=clean(query.service)?normalizeServiceCode01592(query.service):'';
  if(clean(query.service)&&!service){const e=new Error('INVALID_SERVICE_FILTER_01592');e.statusCode=400;throw e;}
  const evidence=clean(query.evidence).toLowerCase();
  if(evidence&&!['confirmed','inferred'].includes(evidence)){const e=new Error('INVALID_EVIDENCE_FILTER_01592');e.statusCode=400;throw e;}
  const status=clean(query.status).toLowerCase();
  if(status&&!['active','invited','disabled'].includes(status)){const e=new Error('INVALID_STATUS_FILTER_01592');e.statusCode=400;throw e;}
  return {limit,offset,search,service,evidence,status};
}
export function serviceFlags01592(rows=[]){
  const flags=Object.fromEntries(SERVICE_CODES_01592.map(k=>[k,{status:'none',lastSeenAt:null}]));
  for(const row of rows){const k=normalizeServiceCode01592(row?.serviceCode??row?.service_code);if(!k)continue;
    flags[k]={status:row.evidence==='confirmed'?'confirmed':'inferred',lastSeenAt:row.lastSeenAt??row.last_seen_at??null};
  }
  return flags;
}
