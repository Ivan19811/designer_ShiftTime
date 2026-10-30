import {normalizeCanvasAtomicInput01606F,applyCanvasAtomic01606F} from './site-canvas-atomic-core-01606f.mjs';
const err=(code,statusCode)=>Object.assign(new Error(code),{code,statusCode});
const defaultRun=async fn=>(await import('./db.mjs')).withClient(fn);
export function createCanvasAtomicService01606F({run=defaultRun}={}){
  return async function applyCanvas(scope,userId,siteId,input){
    const request=normalizeCanvasAtomicInput01606F(input);
    if(!siteId||!scope?.accountId||!scope?.workspaceId||!scope?.storeId||!userId)throw err('ST_CANVAS_SCOPE_REQUIRED_01606F',403);
    return run(async client=>{
      await client.query('BEGIN');
      try{
        // Lock one project row, with tenant scope checked in the same query.
        const found=await client.query(`SELECT p.project_json,p.revision FROM shifttime_builder_site_projects p
          JOIN shifttime_builder_sites s ON s.id=p.site_id
          WHERE s.id=$1 AND s.account_id=$2 AND s.workspace_id=$3 AND s.store_id=$4 AND s.status='active'
          FOR UPDATE OF p`,[siteId,scope.accountId,scope.workspaceId,scope.storeId]);
        if(!found.rowCount)throw err('ST_CANVAS_SITE_NOT_FOUND_01606F',404);
        const current=found.rows[0];
        if(Number(current.revision)!==request.expectedRevision)throw err('ST_CANVAS_REVISION_CONFLICT_01606F',409);
        const applied=applyCanvasAtomic01606F(current.project_json,siteId,request);
        const updated=await client.query(`UPDATE shifttime_builder_site_projects SET project_json=$1::jsonb,revision=revision+1,
          updated_by_user_id=$2,updated_at=now() WHERE site_id=$3 RETURNING revision`,[JSON.stringify(applied.project),userId,siteId]);
        await client.query(`UPDATE shifttime_builder_sites SET updated_at=now() WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4`,[siteId,scope.accountId,scope.workspaceId,scope.storeId]);
        await client.query('COMMIT');
        return {stage:'01606F',siteId,revision:Number(updated.rows[0].revision),pageId:applied.pageId,snapshot:applied.snapshot,operationsApplied:applied.operationsApplied};
      }catch(e){try{await client.query('ROLLBACK');}catch{}throw e;}
    });
  };
}
export const applySiteCanvas01606F=createCanvasAtomicService01606F();
