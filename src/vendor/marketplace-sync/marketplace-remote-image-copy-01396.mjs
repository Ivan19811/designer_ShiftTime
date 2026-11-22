// 01406 · Backend-safe scheduled-sync media policy helpers.
// Scheduler never copies supplier assets; it keeps external URLs by design.
const str=v=>String(v??'').trim();const arr=v=>Array.isArray(v)?v:[];
function normalizeUrl(v){return str(v).replace(/\\/g,'/').replace(/([^:]\/)\/{2,}/g,'$1');}
export async function rollbackCopiedImportAssets01396(uploadedAssets=[]){return {deleted:0,total:arr(uploadedAssets).length};}
export function summarizeMediaCopyPlan01396(canonicalRows=[],enabled=false){let refs=0,unique=0;const seen=new Set();for(const row of arr(canonicalRows))for(const raw of [...arr(row?.images),...arr(row?.variant?.images)]){refs++;const url=normalizeUrl(raw);if(/^https?:\/\//i.test(url)&&!seen.has(url)){seen.add(url);unique++;}}return {enabled:!!enabled,sourceRefs:refs,remoteUnique:unique,externalWhenDisabled:enabled?0:unique,copyRequested:enabled?unique:0};}
