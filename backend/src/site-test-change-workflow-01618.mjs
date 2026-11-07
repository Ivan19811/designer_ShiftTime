// 01618 · Owner-only, audited, atomic application of chosen changes across
// multiple submitted manager branches. Does NOT publish LIVE or update commerce.
import {randomUUID} from 'node:crypto';
import {withClient} from './db.mjs';
import {siteTestError01613D,projectSha01613D} from './site-test-core-01613d.mjs';
import {listSelectableSiteTestChanges01618,composeSelectedSiteTestChanges01618,validateSiteTestChangeDecisions01618,siteTestSelectionPlanToken01618} from './site-test-change-select-01618.mjs';
const fail=(code,status=409)=>{throw siteTestError01613D(code,status);};
const clean=s=>String(s??'').trim();
function owner(scope){if(scope?.role!=='owner')fail('ST_TEST_OWNER_REQUIRED_01613D',403);}
const tx=async fn=>withClient(async c=>{await c.query('BEGIN');try{const v=await fn(c);await c.query('COMMIT');return v;}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}});
async function findSite(c,scope,siteId){
 const r=await c.query(`SELECT p.project_json,p.revision,p.schema_version FROM shifttime_builder_site_projects p
  JOIN shifttime_builder_sites s ON s.id=p.site_id WHERE p.site_id=$1 AND s.account_id=$2
  AND s.workspace_id=$3 AND s.store_id=$4 AND s.status='active'`,[siteId,scope.accountId,scope.workspaceId,scope.storeId]);
 if(!r.rowCount)fail('ST_TEST_SITE_NOT_FOUND_01613D',404);return r.rows[0];
}
async function submitted(c,scope,siteId,branchIds=[]){
 const params=[siteId,scope.accountId,scope.workspaceId,scope.storeId];
 const chosen=Array.isArray(branchIds)&&branchIds.length?` AND b.id=ANY($5::text[])`:'';
 if(chosen)params.push(branchIds);
 const q=await c.query(`SELECT b.id,b.author_user_id,b.state,b.revision_id,r.source_revision_id,b.review_snapshot_sha,
   b.updated_at,r.project_json,s.project_json AS baseline
   FROM shifttime_site_test_branches_01613d b
   JOIN shifttime_builder_site_revisions r ON r.id=b.revision_id AND r.site_id=b.site_id
   -- The immutable source revision is recorded on the draft revision (r),
   -- not on the manager branch (b); the latter has no source_revision_id column.
   JOIN shifttime_builder_site_revisions s ON s.id=r.source_revision_id AND s.site_id=b.site_id
   WHERE b.site_id=$1 AND b.account_id=$2 AND b.workspace_id=$3 AND b.store_id=$4
   AND b.state IN ('in_review','approved')${chosen} ORDER BY b.updated_at DESC,b.id DESC LIMIT 80`,params);
 const rows=[];
 for(const b of q.rows){
  if(!b.review_snapshot_sha||projectSha01613D(b.project_json)!==b.review_snapshot_sha)fail('ST_TEST_REVIEW_CONTENT_CHANGED_01615A');
  rows.push(b);
 }
 if(branchIds.length&&rows.length!==new Set(branchIds).size)fail('ST_TEST_CHANGE_BRANCH_UNAVAILABLE_01618',409);
 return rows;
}
function valueSummary(value){let raw=typeof value==='string'?value:JSON.stringify(value??'');return raw.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,180);}
function enrich(list,original,siteId){return list.map(c=>{const node=original?.storage?.pageSnapshots?.[`${siteId}:${c.pageId}`]?.siteFrameMain01040?.nodes?.[c.nodeId];return {...c,current:valueSummary(node?.[c.field])};});}
async function collect(c,scope,siteId,ids=[]){
 const original=await findSite(c,scope,siteId),branches=await submitted(c,scope,siteId,ids);
 const changesByTest=new Map(),projectsByTest=new Map(),sourceShas=[];
 const items=branches.map(b=>{
  const out=listSelectableSiteTestChanges01618({baseline:b.baseline,submitted:b.project_json,siteId,testId:b.id,authorUserId:b.author_user_id});
  changesByTest.set(b.id,out.changes);projectsByTest.set(b.id,b.project_json);sourceShas.push([b.id,b.review_snapshot_sha]);
  return {testId:b.id,authorUserId:b.author_user_id,state:b.state,changes:enrich(out.changes,original.project_json,siteId),structuralChanges:out.structuralChanges};
 });
 return {original,items,changesByTest,projectsByTest,sourceShas};
}
export async function getSiteTestChangeChoices01618(scope,userId,siteId){
 owner(scope);return withClient(async c=>{const {original,items}=await collect(c,scope,siteId);
  const history=await c.query(`SELECT id,choices_json,status,created_at,original_revision_after FROM shifttime_site_test_change_batches_01618
    WHERE site_id=$1 ORDER BY created_at DESC LIMIT 20`,[siteId]);
  return {stage:'01618',projectRevision:Number(original.revision),managers:items,batches:history.rows.map(r=>({id:r.id,choices:r.choices_json,status:r.status,createdAt:r.created_at,originalRevisionAfter:Number(r.original_revision_after)}))};
 });
}
async function prepare(c,scope,siteId,choices){
 const decisions=validateSiteTestChangeDecisions01618(choices);
 const ids=[...new Set(decisions.map(x=>x.testId))];
 const {original,changesByTest,projectsByTest,sourceShas}=await collect(c,scope,siteId,ids);
 const composition=composeSelectedSiteTestChanges01618({current:original.project_json,siteId,decisions,changesByTest,projectsByTest});
 const planToken=siteTestSelectionPlanToken01618({siteId,revision:Number(original.revision),beforeSha:composition.beforeSha,afterSha:composition.afterSha,decisions,sourceShas});
 return {decisions,composition,original,planToken};
}
export async function planSiteTestSelectedChanges01618(scope,userId,siteId,input={}){
 owner(scope);return tx(async c=>{
  // Advisory lock gives an unambiguous original snapshot for this plan.
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[siteId]);
  const {decisions,composition,original,planToken}=await prepare(c,scope,siteId,input.choices);
  return {stage:'01618',status:'ready',projectRevision:Number(original.revision),planToken,
   accepted:composition.applied,rejected:composition.rejected,overwrites:composition.overwrites,
   beforeSha:composition.beforeSha,afterSha:composition.afterSha,netlifyPublished:false};
 });
}
export async function applySiteTestSelectedChanges01618(scope,userId,siteId,input={}){
 owner(scope);
 if(input.confirm!==true||!/^([a-f0-9]{64})$/.test(clean(input.planToken)))fail('ST_TEST_CHANGE_CONFIRM_REQUIRED_01618',400);
 return tx(async c=>{
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[siteId]);
  await c.query('SELECT revision FROM shifttime_builder_site_projects WHERE site_id=$1 FOR UPDATE',[siteId]);
  const {decisions,composition,original,planToken}=await prepare(c,scope,siteId,input.choices);
  if(input.planToken!==planToken)fail('ST_TEST_CHANGE_PLAN_STALE_01618');
  const bid='rev_'+randomUUID().replaceAll('-',''),batchId='batch_'+randomUUID().replaceAll('-','');
  await c.query(`INSERT INTO shifttime_builder_site_revisions
   (id,site_id,kind,slot,label,schema_version,project_json,dirty,created_by_user_id,updated_by_user_id)
   VALUES($1,$2,'archived',0,$3,$4,$5::jsonb,false,$6,$6)`,
   [bid,siteId,`01618 selected changes backup · ${batchId}`,original.schema_version||'01170',JSON.stringify(original.project_json),userId]);
  const updated=await c.query(`UPDATE shifttime_builder_site_projects SET project_json=$1::jsonb,revision=revision+1,
    updated_by_user_id=$2,updated_at=now() WHERE site_id=$3 AND revision=$4 RETURNING revision`,
    [JSON.stringify(composition.project),userId,siteId,original.revision]);
  if(!updated.rowCount)fail('ST_TEST_CHANGE_PLAN_STALE_01618');
  const revision=Number(updated.rows[0].revision);
  await c.query(`INSERT INTO shifttime_site_test_change_batches_01618(id,site_id,actor_user_id,backup_revision_id,choices_json,
    before_sha,after_sha,original_revision_before,original_revision_after)
    VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)`,
    [batchId,siteId,userId,bid,JSON.stringify(decisions),composition.beforeSha,composition.afterSha,original.revision,revision]);
  return {stage:'01618',batchId,originalProjectRevision:revision,accepted:composition.applied,rejected:composition.rejected,netlifyPublished:false};
 });
}
export async function rollbackSiteTestSelectedChanges01618(scope,userId,siteId,batchId){
 owner(scope);return tx(async c=>{
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[siteId]);
  await c.query('SELECT revision FROM shifttime_builder_site_projects WHERE site_id=$1 FOR UPDATE',[siteId]);
  const original=await findSite(c,scope,siteId);
  const rows=await c.query(`SELECT * FROM shifttime_site_test_change_batches_01618 WHERE id=$1 AND site_id=$2 FOR UPDATE`,[batchId,siteId]);
  const row=rows.rows[0];
  if(!row||row.status!=='applied'||Number(row.original_revision_after)!==Number(original.revision)||row.after_sha!==projectSha01613D(original.project_json))fail('ST_TEST_CHANGE_ROLLBACK_STALE_01618');
  const backups=await c.query(`SELECT project_json,schema_version FROM shifttime_builder_site_revisions
    WHERE id=$1 AND site_id=$2 AND kind='archived'`,[row.backup_revision_id,siteId]);
  if(!backups.rowCount)fail('ST_TEST_CHANGE_BACKUP_MISSING_01618');
  const backup=backups.rows[0];
  const updated=await c.query(`UPDATE shifttime_builder_site_projects
    SET project_json=$1::jsonb,schema_version=$2,revision=revision+1,updated_by_user_id=$3,updated_at=now()
    WHERE site_id=$4 AND revision=$5 RETURNING revision`,[JSON.stringify(backup.project_json),backup.schema_version,userId,siteId,original.revision]);
  if(!updated.rowCount)fail('ST_TEST_CHANGE_ROLLBACK_STALE_01618');
  await c.query(`UPDATE shifttime_site_test_change_batches_01618 SET status='rolled_back',rolled_back_at=now() WHERE id=$1`,[batchId]);
  return {stage:'01618',batchId,originalProjectRevision:Number(updated.rows[0].revision),netlifyPublished:false};
 });
}
