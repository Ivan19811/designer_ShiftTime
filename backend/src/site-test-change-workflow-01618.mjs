// 01618 · Owner-only, audited, atomic application of chosen changes across
// multiple submitted manager branches. Does NOT publish LIVE or update commerce.
import {randomUUID} from 'node:crypto';
import {assertUnusedAcceptances01619B,acceptanceAudit01619B} from './site-test-approval-ledger-01619b.mjs';
import {assertSelectedMainScope01619Q,assertRepairPageScope01619Q} from './site-test-scope-guard-01619q.mjs';
import {inspectSiteTestOriginalDrift01618H,composeSiteTestOriginalRepair01618H,siteTestOriginalRepairToken01618H} from './site-test-original-repair-01618h.mjs';
import {withClient} from './db.mjs';
import {siteTestError01613D,projectSha01613D} from './site-test-core-01613d.mjs';
import {listSelectableSiteTestChanges01618,composeSelectedSiteTestChanges01618,validateSiteTestChangeDecisions01618,siteTestSelectionPlanToken01618,resolveSiteTestChangeTarget01618E,listManualSiteTestTargets01618G} from './site-test-change-select-01618.mjs';
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
function enrich(list,baseline,original,submittedProject,siteId,stalePages=new Set()){return list.map(change=>{
  if(stalePages.has(change.pageId))return {...change,current:'',matchStatus:'blocked',matchReason01618F:'original-stale-01618h',manualTargets01618G:[],pageNeedsRepair01618H:true};
  try{
   const match=resolveSiteTestChangeTarget01618E({baseline,current:original,submitted:submittedProject,siteId,change});
   return {...change,current:valueSummary(match.node?.[change.field]),matchStatus:match.method,matchedNodeId:match.nodeId};
  }catch(error){return {...change,current:'',matchStatus:'blocked',matchError:clean(error.code||error.message),matchReason01618F:clean(error.matchReason01618F),
    manualTargets01618G:listManualSiteTestTargets01618G({baseline,current:original,submitted:submittedProject,siteId,change})};}
 });}
async function collect(c,scope,siteId,ids=[]){
 const original=await findSite(c,scope,siteId),branches=await submitted(c,scope,siteId,ids);
 const publishedRows=await c.query(`SELECT id,project_json FROM shifttime_builder_site_revisions WHERE site_id=$1 AND kind='published' ORDER BY published_at DESC NULLS LAST,updated_at DESC LIMIT 1`,[siteId]);
 const published=publishedRows.rows[0]||null;
 const sourceAligned=Boolean(published&&branches.some(b=>b.source_revision_id===published.id));
 const pages=new Set(branches.flatMap(b=>(b.project_json?.site?.pages||[]).map(p=>p.id)).filter(Boolean));
 const originalDrifts=sourceAligned?[...pages].map(pageId=>inspectSiteTestOriginalDrift01618H({current:original.project_json,published:published?.project_json,siteId,pageId,publishedRevisionId:published?.id||''})).filter(d=>d.stale):[];
 const stalePages=new Set(originalDrifts.map(x=>x.pageId));
 const recovery={available:sourceAligned&&originalDrifts.length>0,sourceAligned,originalDrifts};
 const changesByTest=new Map(),projectsByTest=new Map(),baselinesByTest=new Map(),revisionByTest=new Map(),sourceShas=[],publishedBasedTests=new Set(branches.filter(row=>row.source_revision_id===published?.id).map(row=>row.id));
 const items=branches.map(b=>{
  const out=listSelectableSiteTestChanges01618({baseline:b.baseline,submitted:b.project_json,siteId,testId:b.id,authorUserId:b.author_user_id});
  changesByTest.set(b.id,out.changes);projectsByTest.set(b.id,b.project_json);baselinesByTest.set(b.id,b.baseline);revisionByTest.set(b.id,b.revision_id);sourceShas.push([b.id,b.review_snapshot_sha]);
  return {testId:b.id,authorUserId:b.author_user_id,state:b.state,changes:enrich(out.changes,b.baseline,original.project_json,b.project_json,siteId,publishedBasedTests.has(b.id)?stalePages:new Set()),structuralChanges:out.structuralChanges};
 });
 return {original,items,changesByTest,projectsByTest,baselinesByTest,revisionByTest,sourceShas,recovery,publishedBasedTests};
}
export async function getSiteTestChangeChoices01618(scope,userId,siteId){
 owner(scope);return withClient(async c=>{const {original,items,recovery,revisionByTest}=await collect(c,scope,siteId);
  const revisions=[...new Set(revisionByTest.values())];
  const ledger=revisions.length?await c.query(`SELECT revision_id,change_id,batch_id,actor_user_id,applied_at,status,rolled_back_at
    FROM shifttime_site_test_change_ledger_01619b WHERE site_id=$1 AND revision_id=ANY($2::text[])`,[siteId,revisions]):{rows:[]};
  const byKey=new Map(ledger.rows.map(row=>[`${row.revision_id}\u241f${row.change_id}`,row]));
  for(const manager of items){const revisionId=revisionByTest.get(manager.testId);
   for(const change of manager.changes){const history=byKey.get(`${revisionId}\u241f${change.id}`);
    if(history)change.alreadyAccepted01619B={batchId:history.batch_id,actorUserId:history.actor_user_id,
      appliedAt:history.applied_at,status:history.status,rolledBackAt:history.rolled_back_at};
   }
  }
  const history=await c.query(`SELECT b.id,b.choices_json,b.status,b.created_at,b.original_revision_after,b.actor_user_id,
    COALESCE(jsonb_agg(jsonb_build_object('testId',l.test_id,'changeId',l.change_id,
     'revisionId',l.revision_id,'pageId',l.page_id,'nodeId',l.node_id,'field',l.field,
     'before',l.before_preview,'after',l.after_preview,'status',l.status)
     ORDER BY l.applied_at) FILTER(WHERE l.change_id IS NOT NULL),'[]'::jsonb) AS applied_items
    FROM shifttime_site_test_change_batches_01618 b
    LEFT JOIN shifttime_site_test_change_ledger_01619b l ON l.batch_id=b.id
    WHERE b.site_id=$1 GROUP BY b.id ORDER BY b.created_at DESC LIMIT 20`,[siteId]);
  return {stage:'01619B',projectRevision:Number(original.revision),originalRepair01618H:recovery,managers:items,
   batches:history.rows.map(r=>({id:r.id,choices:r.choices_json,status:r.status,createdAt:r.created_at,
    actorUserId:r.actor_user_id,appliedItems:r.applied_items,originalRevisionAfter:Number(r.original_revision_after)}))};
 });
}
async function prepare(c,scope,siteId,choices,{allowOverwrite01619Q=false}={}){
 if(typeof allowOverwrite01619Q!=='boolean')fail('ST_TEST_CHANGE_OVERWRITE_INVALID_01619Q',400);
 const decisions=validateSiteTestChangeDecisions01618(choices);
 const ids=[...new Set(decisions.map(x=>x.testId))];
 const {original,changesByTest,projectsByTest,baselinesByTest,revisionByTest,sourceShas,recovery,publishedBasedTests}=await collect(c,scope,siteId,ids);
 const revisions=[...new Set(revisionByTest.values())];
 const ledger=revisions.length?await c.query(`SELECT revision_id,change_id FROM shifttime_site_test_change_ledger_01619b
  WHERE site_id=$1 AND revision_id=ANY($2::text[])`,[siteId,revisions]):{rows:[]};
 assertUnusedAcceptances01619B(decisions,revisionByTest,ledger.rows);
 if(decisions.some(d=>d.decision==='accept'&&publishedBasedTests.has(d.testId)&&recovery.originalDrifts.some(x=>x.pageId===(changesByTest.get(d.testId)||[]).find(ch=>ch.id===d.changeId)?.pageId)))fail('ST_TEST_ORIGINAL_PAGE_NOT_SYNCED_01618H',409);
 const composition=composeSelectedSiteTestChanges01618({current:original.project_json,siteId,decisions,changesByTest,projectsByTest,baselinesByTest});
 assertSelectedMainScope01619Q({before:original.project_json,after:composition.project,siteId,applied:composition.applied});
 const collisions=[...composition.overwrites,...composition.concurrentConflicts01619Q];
 const needsOverwriteConfirmation01619Q=collisions.length>0;
 const planToken=siteTestSelectionPlanToken01618({siteId,revision:Number(original.revision),beforeSha:composition.beforeSha,afterSha:composition.afterSha,decisions,sourceShas,allowOverwrite01619Q});
 return {decisions,composition,original,planToken,revisionByTest,needsOverwriteConfirmation01619Q};
}
export async function planSiteTestSelectedChanges01618(scope,userId,siteId,input={}){
 owner(scope);return tx(async c=>{
  // Advisory lock gives an unambiguous original snapshot for this plan.
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[siteId]);
  const {decisions,composition,original,planToken,needsOverwriteConfirmation01619Q}=await prepare(c,scope,siteId,input.choices,{allowOverwrite01619Q:input.allowOverwrite01619Q??false});
  if(needsOverwriteConfirmation01619Q&&input.allowOverwrite01619Q!==true)
   return {stage:'01619Q',status:'conflict',canApply:false,projectRevision:Number(original.revision),
    accepted:composition.applied,rejected:composition.rejected,overwrites:composition.overwrites,
    concurrentConflicts01619Q:composition.concurrentConflicts01619Q,netlifyPublished:false};
  return {stage:'01619Q',status:'ready',projectRevision:Number(original.revision),planToken,
   allowOverwrite01619Q:input.allowOverwrite01619Q===true,needsOverwriteConfirmation01619Q,
   concurrentConflicts01619Q:composition.concurrentConflicts01619Q,
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
  const {decisions,composition,original,planToken,revisionByTest,needsOverwriteConfirmation01619Q}=await prepare(c,scope,siteId,input.choices,{allowOverwrite01619Q:input.allowOverwrite01619Q??false});
  if(needsOverwriteConfirmation01619Q&&input.allowOverwrite01619Q!==true)fail('ST_TEST_CHANGE_CONFLICT_CONFIRM_REQUIRED_01619Q',409);
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
  // This INSERT is part of the SAME transaction as the original update and
  // the backup. The unique primary key fails closed if an accepted revision's
  // item is submitted a second time, without mutating the original.
  const audit=acceptanceAudit01619B({siteId,applied:composition.applied,before:original.project_json,after:composition.project,revisionByTest});
  for(const entry of audit){
   const saved=await c.query(`INSERT INTO shifttime_site_test_change_ledger_01619b
    (site_id,test_id,revision_id,change_id,batch_id,actor_user_id,page_id,node_id,field,match_method,
     before_preview,after_preview,before_field_sha,after_field_sha,original_revision_after)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT(site_id,revision_id,change_id) DO NOTHING`,
    [siteId,entry.testId,entry.revisionId,entry.changeId,batchId,userId,entry.pageId,entry.nodeId,
     entry.field,entry.matchMethod,entry.beforePreview,entry.afterPreview,entry.beforeFieldSha,entry.afterFieldSha,revision]);
   if(saved.rowCount!==1)fail('ST_TEST_CHANGE_ALREADY_ACCEPTED_01619B',409);
  }
  return {stage:'01619B',batchId,originalProjectRevision:revision,accepted:composition.applied,rejected:composition.rejected,
   auditCount:audit.length,netlifyPublished:false};
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
  await c.query(`UPDATE shifttime_site_test_change_ledger_01619b SET status='rolled_back',rolled_back_at=now() WHERE batch_id=$1`,[batchId]);
  return {stage:'01618',batchId,originalProjectRevision:Number(updated.rows[0].revision),netlifyPublished:false};
 });
}

// 01618H · A stale editable project can hold placeholder Main nodes while
// immutable published revision (also used for manager test copies) has the
// actual authored page. Explicitly replace ONE page snapshot only on owner
// confirmation; archive the entire previous original for controlled rollback.
async function prepareOriginalRepair01618H(c,scope,siteId,pageId){
 owner(scope);if(pageId!=='page_home')fail('ST_TEST_ORIGINAL_REPAIR_PAGE_INVALID_01618H',400);
 const original=await findSite(c,scope,siteId);
 const pub=await c.query(`SELECT id,project_json FROM shifttime_builder_site_revisions WHERE site_id=$1 AND kind='published' ORDER BY published_at DESC NULLS LAST,updated_at DESC LIMIT 1`,[siteId]);
 const published=pub.rows[0];
 if(!published)fail('ST_TEST_ORIGINAL_REPAIR_SOURCE_MISSING_01618H',409);
 // The published revision must be the immutable source of at least one manager
 // branch; otherwise an unrelated publication could replace owner edits.
 const source=await c.query(`SELECT 1 FROM shifttime_site_test_branches_01613d b
 JOIN shifttime_builder_site_revisions r ON r.id=b.revision_id AND r.site_id=b.site_id
 WHERE b.site_id=$1 AND b.account_id=$2 AND b.workspace_id=$3 AND b.store_id=$4
 AND r.source_revision_id=$5 AND b.state IN ('in_review','approved') LIMIT 1`,
 [siteId,scope.accountId,scope.workspaceId,scope.storeId,published.id]);
 if(!source.rowCount)fail('ST_TEST_ORIGINAL_REPAIR_SOURCE_UNVERIFIED_01618H',409);
 let composition;try{composition=composeSiteTestOriginalRepair01618H({current:original.project_json,published:published.project_json,siteId,pageId,publishedRevisionId:published.id});}
 catch(e){fail(e.code||'ST_TEST_ORIGINAL_REPAIR_NOT_NEEDED_01618H',409);}
 assertRepairPageScope01619Q({before:original.project_json,after:composition.project,siteId,pageId});
 const planToken=siteTestOriginalRepairToken01618H({siteId,pageId,projectRevision:Number(original.revision),revisionId:published.id,beforeSha:composition.beforeSha,afterSha:composition.afterSha});
 return {original,published,composition,planToken,pageId};
}
export async function planSiteTestOriginalRepair01618H(scope,userId,siteId,input={}){
 owner(scope);return tx(async c=>{await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[siteId]);
  const p=await prepareOriginalRepair01618H(c,scope,siteId,input.pageId);
  return {stage:'01618H',status:'ready',pageId:p.pageId,projectRevision:Number(p.original.revision),publishedRevisionId:p.published.id,
   currentNodes:p.composition.diag.currentNodes,publishedNodes:p.composition.diag.publishedNodes,
   beforeSha:p.composition.beforeSha,afterSha:p.composition.afterSha,planToken:p.planToken,netlifyPublished:false};
 });
}
export async function applySiteTestOriginalRepair01618H(scope,userId,siteId,input={}){
 owner(scope);if(input.confirm!==true||!(/^[a-f0-9]{64}$/).test(clean(input.planToken)))fail('ST_TEST_ORIGINAL_REPAIR_CONFIRM_REQUIRED_01618H',400);
 return tx(async c=>{
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[siteId]);
  await c.query('SELECT revision FROM shifttime_builder_site_projects WHERE site_id=$1 FOR UPDATE',[siteId]);
  const p=await prepareOriginalRepair01618H(c,scope,siteId,input.pageId);
  if(input.planToken!==p.planToken)fail('ST_TEST_ORIGINAL_REPAIR_STALE_01618H',409);
  const backupId='rev_'+randomUUID().replaceAll('-',''),batchId='batch_'+randomUUID().replaceAll('-','');
  await c.query(`INSERT INTO shifttime_builder_site_revisions
   (id,site_id,kind,slot,label,schema_version,project_json,dirty,created_by_user_id,updated_by_user_id)
   VALUES($1,$2,'archived',0,$3,$4,$5::jsonb,false,$6,$6)`,
   [backupId,siteId,`01618H original home snapshot backup · ${batchId}`,p.original.schema_version||'01170',JSON.stringify(p.original.project_json),userId]);
  const updated=await c.query(`UPDATE shifttime_builder_site_projects SET project_json=$1::jsonb,revision=revision+1,
   updated_by_user_id=$2,updated_at=now() WHERE site_id=$3 AND revision=$4 RETURNING revision`,
   [JSON.stringify(p.composition.project),userId,siteId,p.original.revision]);
  if(!updated.rowCount)fail('ST_TEST_ORIGINAL_REPAIR_STALE_01618H',409);
  await c.query(`INSERT INTO shifttime_site_test_change_batches_01618
   (id,site_id,actor_user_id,backup_revision_id,choices_json,before_sha,after_sha,original_revision_before,original_revision_after)
   VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)`,
   [batchId,siteId,userId,backupId,JSON.stringify([{kind:'original-page-repair-01618H',pageId:p.pageId,publishedRevisionId:p.published.id}]),p.composition.beforeSha,p.composition.afterSha,p.original.revision,updated.rows[0].revision]);
  return {stage:'01618H',status:'repaired',pageId:p.pageId,batchId,backupRevisionId:backupId,originalProjectRevision:Number(updated.rows[0].revision),netlifyPublished:false};
 });
}
