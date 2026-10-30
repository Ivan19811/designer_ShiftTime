// 01606G: transactionally edit only one Main tree in an existing draft.
// Preserve all other draft data; reject concurrent edits using a fingerprint.
import crypto from 'node:crypto';
import {normalizeCanvasAtomicInput01606F,applyCanvasAtomic01606F} from './site-canvas-atomic-core-01606f.mjs';
const err=(code,statusCode)=>Object.assign(new Error(code),{code,statusCode});
export function draftFingerprint01606G(project){return crypto.createHash('sha256').update(JSON.stringify(project??{})).digest('hex');}
export function normalizeDraftCanvasInput01606G(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||!Object.hasOwn(value,'expectedFingerprint')||Object.keys(value).some(k=>!['expectedFingerprint','pageId','operations','expectedRevision'].includes(k)))throw err('ST_CANVAS_DRAFT_INVALID_01606G',400);
  if(typeof value.expectedFingerprint!=='string'||!/^[a-f0-9]{64}$/.test(value.expectedFingerprint))throw err('ST_CANVAS_DRAFT_INVALID_01606G',400);
  // Reuse the exact operation validator; draft revisions use the project hash,
  // not the separate site-project integer revision.
  const normalized=normalizeCanvasAtomicInput01606F({pageId:value.pageId,operations:value.operations,expectedRevision:1});
  if(Object.hasOwn(value,'expectedRevision'))throw err('ST_CANVAS_DRAFT_INVALID_01606G',400);
  return {...normalized,expectedFingerprint:value.expectedFingerprint};
}
export function createDraftCanvasService01606G({run=null}={}){
  return async function applyDraftCanvas(scope,userId,siteId,revisionId,input){
    const request=normalizeDraftCanvasInput01606G(input);
    if(!userId||!siteId||!revisionId||!scope?.accountId||!scope?.workspaceId||!scope?.storeId)throw err('ST_CANVAS_DRAFT_SCOPE_REQUIRED_01606G',403);
    const execute=run||(await import('./db.mjs')).withClient;
    return execute(async client=>{
      await client.query('BEGIN');
      try{
        const found=await client.query(`SELECT r.project_json,r.id FROM shifttime_builder_site_revisions r
          JOIN shifttime_builder_sites s ON s.id=r.site_id
          WHERE r.site_id=$1 AND r.id=$2 AND r.kind='draft'
            AND s.account_id=$3 AND s.workspace_id=$4 AND s.store_id=$5 AND s.status<>'archived'
          FOR UPDATE OF r`,[siteId,revisionId,scope.accountId,scope.workspaceId,scope.storeId]);
        if(!found.rowCount)throw err('ST_CANVAS_DRAFT_NOT_FOUND_01606G',404);
        const before=found.rows[0].project_json;
        if(draftFingerprint01606G(before)!==request.expectedFingerprint)throw err('ST_CANVAS_DRAFT_CONFLICT_01606G',409);
        const applied=applyCanvasAtomic01606F(before,siteId,request);
        const updated=await client.query(`UPDATE shifttime_builder_site_revisions SET project_json=$1::jsonb,dirty=true,
           updated_by_user_id=$2,updated_at=now()
           WHERE site_id=$3 AND id=$4 AND kind='draft' RETURNING id`,
           [JSON.stringify(applied.project),userId,siteId,revisionId]);
        if(!updated.rowCount)throw err('ST_CANVAS_DRAFT_NOT_FOUND_01606G',404);
        await client.query('COMMIT');
        return {stage:'01606G',siteId,revisionId,pageId:applied.pageId,
          fingerprint:draftFingerprint01606G(applied.project),snapshot:applied.snapshot,
          operationsApplied:applied.operationsApplied};
      }catch(error){try{await client.query('ROLLBACK');}catch{}throw error;}
    });
  };
}
export const applyDraftCanvas01606G=createDraftCanvasService01606G();
