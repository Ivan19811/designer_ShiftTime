// ShiftTime 01606B · Secondary product-operation gate. NEVER an alternative to 01600 base permission.
// No client-provided actor or permission can influence this gate: only authenticated DB grants.
export const PRODUCT_ACTION_MODE_01606B='api.mode.product_actions';
const controlled=(name,uiControl='')=>Object.freeze({permission:`shop.products.actions.${name}`,uiControl});
const EXACT=Object.freeze({
  export:controlled('export'),snapshotReplace:controlled('snapshot_replace'),
  replaceApply:controlled('replace_apply','ui.control.categoryreplaceapply'),
  rollbackRestore:controlled('rollback_restore'),
  variantsCreate:controlled('variants_create'),variantsEdit:controlled('variants_edit'),variantsDelete:controlled('variants_delete')
});
export function classifyProductAction01606B(method,parts){
  const m=String(method||'').toUpperCase(),p=parts;
  if(!Array.isArray(p)||p[0]!=='api'||p[1]!=='v1'||p[2]!=='marketplace')return null;
  if(p[3]==='snapshot'){
    if(p.length===5&&p[4]==='export'&&m==='GET')return EXACT.export;
    if(p.length===4&&m==='PUT')return EXACT.snapshotReplace;
  }
  if(p[3]==='products'&&p[4]==='replacement-apply'&&p.length===5&&m==='POST')return EXACT.replaceApply;
  if(p[3]==='import-rollbacks'&&p[4]&&p[5]==='restore'&&p.length===6&&m==='POST')return EXACT.rollbackRestore;
  if(p[3]==='variants'){
    if(p.length===4&&m==='POST')return EXACT.variantsCreate;
    if(p.length===5&&p[4]&&m==='PATCH')return EXACT.variantsEdit;
    if(p.length===5&&p[4]&&m==='DELETE')return EXACT.variantsDelete;
  }
  return null;
}
const denied=(permission)=>Object.assign(new Error('ST_ACCESS_PRODUCT_ACTION_DENIED_01606B'),{code:'ST_ACCESS_PRODUCT_ACTION_DENIED_01606B',statusCode:403,permission});
// The two modes are optional. ui.mode.controls now also limits API actions that can
// change product status or other sensitive catalog state; the UI flag itself grants nothing.
export function assertProductAction01606B(decision,action){
  if(!action||decision?.mode!=='custom')return true;
  const grants=new Set(Array.isArray(decision.permissions)?decision.permissions:[]);
  const uiRestricted=grants.has('ui.mode.controls');
  if(!grants.has(PRODUCT_ACTION_MODE_01606B)&&!uiRestricted)return true;
  if(!grants.has(action.permission))throw denied(action.permission);
  if(uiRestricted&&action.uiControl&&!grants.has(action.uiControl))throw denied(action.uiControl);
  return true;
}
export function productStatusAction01606B(input,{bulk=false}={}){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  if(!Object.hasOwn(input,'status'))return null;
  const status=input.status;
  if(status==='active')return controlled('activate',bulk?'ui.control.categorybulkactivate':'');
  if(status==='draft')return controlled('deactivate',bulk?'ui.control.categorybulkdeactivate':'');
  if(status==='archived'&&!bulk)return controlled('archive');
  // Unknown status must never bypass a precise-mode gate on generic product writes.
  // For bulk, existing 01523 validates status and returns 400 before any transaction.
  return bulk?null:controlled('status_unsupported');
}
