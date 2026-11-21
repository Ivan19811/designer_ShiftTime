export const MARKETPLACE_SUPPLIER_SYNC_SCHEDULER_STAGE_01399='01399';
export const SUPPLIER_SYNC_MODES_01399=Object.freeze(['validate','approval','apply']);
export const SUPPLIER_SYNC_MEDIA_MODES_01399=Object.freeze(['external-only']);
const str=v=>String(v??'').trim();
const n=v=>Number(v);
export function normalizeSupplierSyncSchedule01399(input={}){
  const raw=n(input.cadenceMinutes),cadenceMinutes=Number.isFinite(raw)?Math.max(15,Math.min(10080,Math.trunc(raw))):1440;
  const mode=SUPPLIER_SYNC_MODES_01399.includes(str(input.mode))?str(input.mode):'validate';
  return {enabled:!!input.enabled,mode,cadenceMinutes,mediaMode:'external-only'};
}
export function nextSupplierSyncRunAt01399(from=new Date(),cadenceMinutes=1440){
  const base=from instanceof Date?from:new Date(from),ms=Number.isFinite(base.getTime())?base.getTime():Date.now(),mins=normalizeSupplierSyncSchedule01399({cadenceMinutes}).cadenceMinutes;
  return new Date(ms+mins*60_000).toISOString();
}
export function schedulerSourceSummary01399({rows=0,errors=0,fieldChanges=0,productCreate=0,productUpdate=0,variantCreate=0,variantUpdate=0,mediaRemote=0}={}){
  return {rows:Number(rows)||0,errors:Number(errors)||0,fieldChanges:Number(fieldChanges)||0,productCreate:Number(productCreate)||0,productUpdate:Number(productUpdate)||0,variantCreate:Number(variantCreate)||0,variantUpdate:Number(variantUpdate)||0,mediaRemote:Number(mediaRemote)||0};
}
