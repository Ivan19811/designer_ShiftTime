// 01623M — authoritative, scope-bound guards. No modification to archived/published revisions.
import {withClient} from './db.mjs';

const clean=value=>String(value??'').trim();
const CONFIRM='ВИДАЛИТИ ВСІ РЕДАКЦІЇ';
function fail(message,statusCode,code,extra={}){
  const error=new Error(message);error.statusCode=statusCode;error.code=code;error.data=extra;return error;
}
function ownerOnly(scope){
  if(scope?.role!=='owner')throw fail('Only the site owner may perform this destructive action',403,'ST_SITE_DELETE_OWNER_ONLY_01623M');
}
async function getScopedSite(c,scope,siteId,{lock=false}={}){
  const sql=`SELECT id,name,slug FROM shifttime_builder_sites
    WHERE account_id=$1 AND workspace_id=$2 AND store_id=$3 AND id=$4 ${lock?'FOR UPDATE':''}`;
  const q=await c.query(sql,[scope.accountId,scope.workspaceId,scope.storeId,siteId]);
  if(!q.rowCount)throw fail('Builder site not found',404,'ST_BUILDER_SITE_NOT_FOUND');
  return q.rows[0];
}
async function revisionCounts(c,siteId){
  const result=await c.query(`SELECT
    COUNT(*)::int total,
    COUNT(*) FILTER (WHERE kind='draft')::int drafts,
    COUNT(*) FILTER (WHERE kind='published')::int published,
    COUNT(*) FILTER (WHERE kind='archived')::int archived
    FROM shifttime_builder_site_revisions WHERE site_id=$1`,[siteId]);
  const r=result.rows[0]||{};
  return {total:Number(r.total||0),drafts:Number(r.drafts||0),published:Number(r.published||0),archived:Number(r.archived||0)};
}
export function assertSiteDeleteEmpty01623M(counts){
  if(Number(counts?.total||0)>0)throw fail(
    'Спочатку видаліть усі редакції сайту. Опубліковані та архівні версії захищені від випадкового стирання.',
    409,'ST_SITE_HAS_REVISIONS_01623M',{revisions:counts});
}
export async function getSiteDeleteCheck01623M(scope,siteId,run=withClient){
  ownerOnly(scope);const id=clean(siteId);
  return run(async c=>{
    const site=await getScopedSite(c,scope,id);
    const revisions=await revisionCounts(c,id);
    return {stage:'01623M',siteId:id,siteName:site.name||site.slug||site.id,
      revisions,canDelete:revisions.total===0};
  });
}
// One atomic operation. Protected review/published/archive history is NEVER erased.
// 01647: Delete ONLY the exact owner-authored revisions that the browser displayed.
// The server checks both author identity and the complete server-owned set.
// Foreign manager drafts, legacy unattributed drafts and review history are untouchable.
export async function deleteAllDraftRevisions01623M(scope,siteId,
  {confirmation='',expectedCount=null,revisionIds=[]}={},run=withClient,userId=''){
  ownerOnly(scope);
  const id=clean(siteId),uid=clean(userId),expected=Number(expectedCount);
  const ids=Array.isArray(revisionIds)?revisionIds.map(clean):[];
  if(confirmation!==CONFIRM||!uid||!Number.isSafeInteger(expected)||expected<1||expected>100||
     ids.length!==expected||new Set(ids).size!==expected||ids.some(v=>!/^rev_[a-zA-Z0-9]+$/.test(v)))
    throw fail('Explicit, authenticated selection of owner drafts required',400,'ST_REVISION_BULK_CONFIRM_REQUIRED_01647');
  return run(async c=>{
    await c.query('BEGIN');
    try{
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[id]);
      await getScopedSite(c,scope,id,{lock:true});
      const before=await revisionCounts(c,id);
      const own=await c.query(`SELECT id FROM shifttime_builder_site_revisions
        WHERE site_id=$1 AND kind='draft' AND created_by_user_id=$2 ORDER BY id FOR UPDATE`,[id,uid]);
      const onServer=own.rows.map(row=>clean(row.id)).sort();
      const selected=[...ids].sort();
      if(onServer.length!==expected||selected.some((value,index)=>value!==onServer[index]))
        throw fail('Visible owner drafts changed. Refresh and confirm again',409,'ST_REVISION_BULK_STALE_01647',
          {visibleCount:expected,serverOwnerCount:onServer.length});
      const protectedRows=await c.query(`SELECT r.id FROM shifttime_builder_site_revisions r
        JOIN shifttime_site_test_branches_01613d b ON b.revision_id=r.id AND b.site_id=r.site_id
        WHERE r.site_id=$1 AND r.id=ANY($2::text[]) AND r.kind='draft' AND (
          b.state NOT IN ('editing','preview')
          OR EXISTS (SELECT 1 FROM shifttime_site_test_review_events_01615a ev WHERE ev.test_id=b.id)
          OR EXISTS (SELECT 1 FROM shifttime_site_test_apply_events_01615b ev WHERE ev.test_id=b.id)
        ) LIMIT 1`,[id,ids]);
      if(protectedRows.rowCount)throw fail('Protected review history must be handled individually',409,'ST_REVISION_BULK_PROTECTED_01623M');
      const deleted=await c.query(`DELETE FROM shifttime_builder_site_revisions
        WHERE site_id=$1 AND id=ANY($2::text[]) AND created_by_user_id=$3 AND kind='draft' RETURNING id`,[id,ids,uid]);
      const after=await revisionCounts(c,id);
      if(deleted.rowCount!==expected||after.total!==before.total-expected||after.drafts!==before.drafts-expected||
         after.published!==before.published||after.archived!==before.archived)
        throw fail('Deletion scope mismatch; all changes rolled back',409,'ST_REVISION_BULK_SCOPE_MISMATCH_01623M');
      await c.query('COMMIT');
      console.warn('[ST_DELETE_AUDIT_01647]',JSON.stringify({event:'owner-selected-drafts-deleted',siteId:id,
        actorId:uid,deletedCount:deleted.rowCount,before,after}));
      return {stage:'01647',deleted:true,deletedCount:deleted.rowCount,siteId:id,remaining:after};
    }catch(error){try{await c.query('ROLLBACK');}catch{}
      console.warn('[ST_DELETE_AUDIT_01647]',JSON.stringify({event:'owner-drafts-rollback',siteId:id,
        code:clean(error?.code)||'UNKNOWN'}));throw error;}
  });
}
