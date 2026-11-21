import crypto from 'node:crypto';
export const MARKETPLACE_SUPPLIER_SYNC_APPROVAL_STAGE_01400='01400';
const arr=v=>Array.isArray(v)?v:[];
function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object'){const o={};for(const k of Object.keys(v).sort())o[k]=stable(v[k]);return o;}return v;}
export function fingerprintSupplierSyncPlan01400({canonicalRows=[],mapping={},options={},diff={},baseRevision=0}={}){return crypto.createHash('sha256').update(JSON.stringify(stable({canonicalRows,mapping,options:{...options,copySupplierMedia:false},diff,baseRevision:Number(baseRevision)||0}))).digest('hex');}
export function safeSupplierSyncDiff01400(diff={},maxItems=2000){const all=arr(diff.items).filter(x=>x?.action==='create'||x?.changed),items=all.slice(0,maxItems).map(x=>({id:x.id,entity:x.entity,line:x.line,action:x.action,existingId:x.existingId||'',name:x.name||'',sku:x.sku||'',changed:!!x.changed,changes:arr(x.changes).slice(0,50)}));return {stage:'01390',summary:diff.summary||{},items,truncated:all.length>items.length,totalChangedEntities:all.length};}
