import crypto from 'node:crypto';
import {withClient,withTransaction} from './db.mjs';
import {
  MARKETPLACE_IMPORT_ROLLBACK_STAGE_01397,
  MARKETPLACE_IMPORT_ROLLBACK_NOT_FOUND_01397,
  MARKETPLACE_IMPORT_ROLLBACK_CONFLICT_01397,
  MARKETPLACE_IMPORT_ROLLBACK_ALREADY_RESTORED_01397,
  buildMarketplaceRollbackPatch01397,
  previewMarketplaceRollbackPatch01397
} from './marketplace-import-rollback-core-01397.mjs';
export {
  MARKETPLACE_IMPORT_ROLLBACK_STAGE_01397,
  MARKETPLACE_IMPORT_ROLLBACK_NOT_FOUND_01397,
  MARKETPLACE_IMPORT_ROLLBACK_CONFLICT_01397,
  MARKETPLACE_IMPORT_ROLLBACK_ALREADY_RESTORED_01397,
  fingerprintMarketplaceEntity01397,
  buildMarketplaceRollbackPatch01397,
  previewMarketplaceRollbackPatch01397
} from './marketplace-import-rollback-core-01397.mjs';

const str=v=>String(v??'').trim();const arr=v=>Array.isArray(v)?v:[];
const COLLECTIONS=Object.freeze(['products','categories','attributes','attributeValues','variants','media','collections','filters','recommendations','feeds']);
function nowIso(){return new Date().toISOString();}
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object'){const out={};for(const key of Object.keys(v).sort())out[key]=stable(v[key]);return out;}return v;}
function stableJson(v){return JSON.stringify(stable(v));}
function importCounts(s={}){const out={};for(const key of COLLECTIONS)out[key]=arr(s?.[key]).length;return out;}
function snapshotHash(s={}){const c=clone(s||{});delete c.revision;delete c.updatedAt;return crypto.createHash('sha256').update(stableJson(c)).digest('hex');}
export async function persistMarketplaceImportRollback01397(client,scope,{historyId='',sourceKind='',before={},after={},preRevision=0,postRevision=0}={}){
  const id=str(historyId);if(!id)return null;const patch=buildMarketplaceRollbackPatch01397(before,after);if(!patch.summary.total)return null;
  await client.query(`INSERT INTO commerce_import_rollbacks(id,account_id,workspace_id,store_id,created_by_user_id,source_kind,pre_revision,post_revision,status,rollback_payload,summary) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'available',$9::jsonb,$10::jsonb) ON CONFLICT(store_id,id) DO UPDATE SET source_kind=excluded.source_kind,pre_revision=excluded.pre_revision,post_revision=excluded.post_revision,status='available',rollback_payload=excluded.rollback_payload,summary=excluded.summary,restored_at=NULL,restored_by_user_id=NULL`,[id,scope.accountId,scope.workspaceId,scope.storeId,scope.userId||null,str(sourceKind).slice(0,80),Number(preRevision)||0,Number(postRevision)||0,JSON.stringify(patch),JSON.stringify(patch.summary)]);
  await client.query(`DELETE FROM commerce_import_rollbacks WHERE store_id=$1 AND id IN (SELECT id FROM commerce_import_rollbacks WHERE store_id=$1 ORDER BY created_at DESC OFFSET 50)`,[scope.storeId]);return {id,status:'available',summary:patch.summary};
}
function rowView(r={}){return {id:r.id,status:r.status,sourceKind:r.source_kind||'',preRevision:Number(r.pre_revision)||0,postRevision:Number(r.post_revision)||0,summary:r.summary||{},createdAt:r.created_at||'',restoredAt:r.restored_at||''};}
export async function listMarketplaceImportRollbacks01397(scope){return withClient(async client=>{const q=await client.query(`SELECT id,status,source_kind,pre_revision,post_revision,summary,created_at,restored_at FROM commerce_import_rollbacks WHERE store_id=$1 ORDER BY created_at DESC LIMIT 50`,[scope.storeId]);return {stage:MARKETPLACE_IMPORT_ROLLBACK_STAGE_01397,items:q.rows.map(rowView)};});}
async function loadRollbackRow(client,scope,id,{forUpdate=false}={}){const q=await client.query(`SELECT * FROM commerce_import_rollbacks WHERE store_id=$1 AND id=$2${forUpdate?' FOR UPDATE':''}`,[scope.storeId,str(id)]);if(!q.rowCount){const e=new Error(MARKETPLACE_IMPORT_ROLLBACK_NOT_FOUND_01397);e.code=MARKETPLACE_IMPORT_ROLLBACK_NOT_FOUND_01397;e.statusCode=404;throw e;}return q.rows[0];}
export async function previewMarketplaceImportRollback01397(scope,id){return withClient(async client=>{const row=await loadRollbackRow(client,scope,id);if(row.status==='restored')return {...rowView(row),ok:false,alreadyRestored:true,conflicts:[]};const q=await client.query(`SELECT snapshot,revision FROM commerce_store_snapshots WHERE store_id=$1`,[scope.storeId]);const current=q.rows[0]?.snapshot||{},preview=previewMarketplaceRollbackPatch01397(current,row.rollback_payload||{});return {...rowView(row),ok:preview.ok,conflicts:preview.conflicts,removedMediaCount:preview.removedMedia.length,currentRevision:Number(q.rows[0]?.revision)||0};});}
export async function restoreMarketplaceImportRollback01397(scope,id){return withTransaction(async client=>{const row=await loadRollbackRow(client,scope,id,{forUpdate:true});if(row.status==='restored'){const e=new Error(MARKETPLACE_IMPORT_ROLLBACK_ALREADY_RESTORED_01397);e.code=MARKETPLACE_IMPORT_ROLLBACK_ALREADY_RESTORED_01397;e.statusCode=409;throw e;}const q=await client.query(`SELECT snapshot,revision FROM commerce_store_snapshots WHERE store_id=$1 FOR UPDATE`,[scope.storeId]);if(!q.rowCount){const e=new Error('Marketplace snapshot not found');e.statusCode=404;throw e;}const current=clone(q.rows[0].snapshot||{}),preview=previewMarketplaceRollbackPatch01397(current,row.rollback_payload||{});if(!preview.ok){const e=new Error(MARKETPLACE_IMPORT_ROLLBACK_CONFLICT_01397);e.code=MARKETPLACE_IMPORT_ROLLBACK_CONFLICT_01397;e.statusCode=409;e.conflicts=preview.conflicts;throw e;}const next={...preview.candidate,revision:(Number(q.rows[0].revision)||0)+1,updatedAt:nowIso()};await client.query(`UPDATE commerce_store_snapshots SET revision=$2,snapshot=$3::jsonb,updated_at=now() WHERE store_id=$1`,[scope.storeId,next.revision,JSON.stringify(next)]);await client.query(`INSERT INTO commerce_outbox(account_id,workspace_id,store_id,event_type,aggregate_type,aggregate_id,payload) VALUES($1,$2,$3,'commerce.snapshot.rollback.01397','commerce-snapshot',$3,$4::jsonb)`,[scope.accountId,scope.workspaceId,scope.storeId,JSON.stringify({rollbackId:str(id),revision:next.revision,summary:preview.summary})]);await client.query(`UPDATE commerce_import_rollbacks SET status='restored',restored_at=now(),restored_by_user_id=$3 WHERE store_id=$1 AND id=$2`,[scope.storeId,str(id),scope.userId||null]);try{await client.query(`INSERT INTO commerce_store_imports(id,account_id,workspace_id,store_id,imported_by_user_id,source_kind,source_revision,imported_revision,snapshot_sha256,entity_counts) VALUES($1,$2,$3,$4,$5,'import-rollback-01397',$6,$7,$8,$9::jsonb)`,[`rollback_${crypto.randomUUID().replace(/-/g,'').slice(0,18)}`,scope.accountId,scope.workspaceId,scope.storeId,scope.userId||null,Number(q.rows[0].revision)||0,next.revision,snapshotHash(next),JSON.stringify(importCounts(next))]);}catch(e){if(e?.code!=='42P01')throw e;}return {stage:MARKETPLACE_IMPORT_ROLLBACK_STAGE_01397,restored:true,id:str(id),revision:next.revision,summary:preview.summary,removedMedia:preview.removedMedia};});}
