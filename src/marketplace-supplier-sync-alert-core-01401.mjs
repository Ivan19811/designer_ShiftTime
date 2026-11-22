export const MARKETPLACE_SUPPLIER_SYNC_ALERT_STAGE_01401='01401';
export const SUPPLIER_SYNC_RISK_LEVELS_01401=Object.freeze(['low','medium','high','critical']);
const arr=v=>Array.isArray(v)?v:[];
const num=v=>Number(v);
const finite=v=>Number.isFinite(num(v));
const str=v=>String(v??'').trim();
function addType(set,type){if(type)set.add(type);}
function numericPercent(before,after){if(!finite(before)||!finite(after))return 0;const b=Math.abs(num(before));if(b<1e-9)return num(after)===0?0:100;return Math.abs(num(after)-num(before))/b*100;}
export function analyzeSupplierSyncRisk01401(diff={},summary={}){
  const types=new Set(),reasons=[];let maxPriceChangePct=0,stockToZero=0,stockChanges=0,priceChanges=0;
  const items=arr(diff?.items);
  for(const item of items){
    const entity=str(item?.entity),action=str(item?.action);
    if(action==='create')addType(types,entity==='variant'?'variant-create':entity==='product'?'product-create':entity==='category'?'category-create':entity==='media'?'media-create':'create');
    for(const change of arr(item?.changes)){
      const field=str(change?.field).toLowerCase();
      if(field.includes('price')){addType(types,'price');priceChanges++;maxPriceChangePct=Math.max(maxPriceChangePct,numericPercent(change?.before,change?.after));}
      else if(field.includes('stock')){addType(types,'stock');stockChanges++;if(finite(change?.before)&&finite(change?.after)&&num(change.before)>0&&num(change.after)<=0)stockToZero++;}
      else if(field.includes('availability'))addType(types,'availability');
      else if(field.includes('status'))addType(types,'status');
      else if(field.includes('media')||field.includes('image'))addType(types,'media');
      else if(field.includes('categor'))addType(types,'category');
      else if(field.includes('attribute')||field.includes('option'))addType(types,'attribute');
      else addType(types,'other');
    }
  }
  const fieldChanges=Math.max(0,Number(summary?.fieldChanges??diff?.summary?.fieldChanges)||0);
  const totalChangedEntities=Math.max(0,Number(diff?.totalChangedEntities)||items.filter(x=>x?.action==='create'||x?.changed).length);
  let level='low',score=10;
  if(maxPriceChangePct>=50||stockToZero>=100||totalChangedEntities>=5000||fieldChanges>=10000){level='critical';score=95;}
  else if(maxPriceChangePct>=25||stockToZero>=20||totalChangedEntities>=1000||fieldChanges>=3000){level='high';score=75;}
  else if(maxPriceChangePct>=10||stockToZero>=5||totalChangedEntities>=200||fieldChanges>=500){level='medium';score=45;}
  else if(fieldChanges||totalChangedEntities){score=20;}
  else score=0;
  if(maxPriceChangePct>=50)reasons.push('price-change-critical');else if(maxPriceChangePct>=25)reasons.push('price-change-high');else if(maxPriceChangePct>=10)reasons.push('price-change-medium');
  if(stockToZero>=100)reasons.push('stock-zero-critical');else if(stockToZero>=20)reasons.push('stock-zero-high');else if(stockToZero>=5)reasons.push('stock-zero-medium');
  if(totalChangedEntities>=5000)reasons.push('volume-critical');else if(totalChangedEntities>=1000)reasons.push('volume-high');else if(totalChangedEntities>=200)reasons.push('volume-medium');
  return {stage:MARKETPLACE_SUPPLIER_SYNC_ALERT_STAGE_01401,level,score,types:[...types].sort(),reasons,maxPriceChangePct:Number(maxPriceChangePct.toFixed(2)),stockToZero,stockChanges,priceChanges,totalChangedEntities,fieldChanges};
}
export function normalizeSupplierSyncAlertFilters01401(input={}){const status=['unread','read','dismissed'].includes(str(input.status))?str(input.status):'',kind=['approval-ready','risk-detected','price-change','stock-zero','scheduler-error'].includes(str(input.kind))?str(input.kind):'',severity=['info','warning','high','critical'].includes(str(input.severity))?str(input.severity):'';return {status,kind,severity,sourceId:str(input.sourceId).slice(0,160)};}
