// 01613D · Server-owned test copies, visual-only Netlify draft previews and owner promotion.
// No manager operation writes to the primary site project or published deploy record.
import {withClient} from './db.mjs';
import {assertReviewSubmission01615A,assertReviewSubmissionAuthor01615A,assertReviewDecision01615A,reviewNote01615A} from './site-test-review-core-01615a.mjs';
import {compareSiteTestProjects01614B} from './site-test-compare-01614b.mjs';
import {chooseOriginalSource01613D2} from './site-test-source-01613d2.mjs';
import {nextFreeDraftSlot01613D3} from './site-revision-slots-01613d3.mjs';
import {config} from './config.mjs';
import {createNetlifyClient01143} from './netlify-client-01143.mjs';
import {buildProductionFiles01143} from './site-production-build-01143.mjs';
import {getAiConsultantPublishConfig01414} from './ai-consultant-public-01414.mjs';
import {assertTestActor01613D,assertProductionUnchanged01613D,assertDraftDeploy01613D,siteTestError01613D,newTestId01613D,newRevisionId01613D,projectSha01613D,previewModeFiles01613D,previewPermalink01613D} from './site-test-core-01613d.mjs';
const clean=v=>String(v??'').trim();
const client=createNetlifyClient01143({token:config.netlifyAuthToken,baseUrl:config.netlifyApiBaseUrl});
const existing=async(c,scope,siteId)=>{
 const q=await c.query(`SELECT s.id,s.name,s.slug,p.revision,p.project_json,p.schema_version,
    pub.netlify_site_id,pub.netlify_url,pub.netlify_ssl_url,pub.traffic_identity_token
   FROM shifttime_builder_sites s JOIN shifttime_builder_site_projects p ON p.site_id=s.id
   LEFT JOIN shifttime_published_sites pub ON pub.builder_site_id=s.id AND pub.account_id=s.account_id AND pub.workspace_id=s.workspace_id AND pub.store_id=s.store_id
   WHERE s.id=$1 AND s.account_id=$2 AND s.workspace_id=$3 AND s.store_id=$4 AND s.status='active'`,
   [siteId,scope.accountId,scope.workspaceId,scope.storeId]);
 if(!q.rowCount)throw siteTestError01613D('ST_TEST_SITE_NOT_FOUND_01613D',404);
 return q.rows[0];
};
const queryBranch=async(c,scope,siteId,branchId,{lock=false}={})=>{
 const q=await c.query(`SELECT b.*,r.project_json,r.schema_version,r.kind revision_kind,r.slot
 FROM shifttime_site_test_branches_01613d b
 JOIN shifttime_builder_site_revisions r ON r.id=b.revision_id AND r.site_id=b.site_id
 WHERE b.id=$1 AND b.site_id=$2 AND b.account_id=$3 AND b.workspace_id=$4 AND b.store_id=$5 ${lock?'FOR UPDATE OF b,r':''}`,
 [branchId,siteId,scope.accountId,scope.workspaceId,scope.storeId]);
 if(!q.rowCount)throw siteTestError01613D('ST_TEST_NOT_FOUND_01613D',404);
 return q.rows[0];
};
const publicBranch=b=>({id:b.id,siteId:b.site_id,revisionId:b.revision_id,authorUserId:b.author_user_id,baseProjectRevision:Number(b.base_project_revision),state:b.state,previewUrl:b.preview_url||'',previewDeployId:b.preview_deploy_id||'',previewCreatedAt:b.preview_created_at||null,previewMode:b.preview_netlify_site_id?'isolated':'draft',candidateReady:Boolean(b.candidate_deploy_id),submittedAt:b.submitted_at||null,approvedAt:b.approved_at||null,publishedAt:b.published_at||null,createdAt:b.created_at||null,updatedAt:b.updated_at||null,reviewCycle:Number(b.review_cycle||0),reviewSnapshotSha:b.review_snapshot_sha||''});
const tx=async fn=>withClient(async c=>{await c.query('BEGIN');try{const r=await fn(c);await c.query('COMMIT');return r;}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}});

// Compact owner inbox counter for the Builder badge; no project JSON is fetched.
export async function getSiteTestReviewInbox01615A(scope,siteId){
 if(scope.role!=='owner')throw siteTestError01613D('ST_TEST_OWNER_REQUIRED_01613D',403);
 return withClient(async c=>{
  const scoped=await c.query(`SELECT 1 FROM shifttime_builder_sites
    WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND status='active'`,
    [siteId,scope.accountId,scope.workspaceId,scope.storeId]);
  if(!scoped.rowCount)throw siteTestError01613D('ST_TEST_SITE_NOT_FOUND_01613D',404);
  const q=await c.query(`SELECT count(*)::int AS pending_count FROM shifttime_site_test_branches_01613d
    WHERE account_id=$1 AND workspace_id=$2 AND store_id=$3 AND site_id=$4 AND state='in_review'`,
    [scope.accountId,scope.workspaceId,scope.storeId,siteId]);
  return {stage:'01615A',pendingCount:Number(q.rows[0]?.pending_count||0)};
 });
}
export async function listSiteTests01613D(scope,userId,siteId){
 return withClient(async c=>{
  await existing(c,scope,siteId);
  const q=await c.query(`SELECT b.* FROM shifttime_site_test_branches_01613d b
   WHERE account_id=$1 AND workspace_id=$2 AND store_id=$3 AND site_id=$4
   AND ($5::boolean OR author_user_id=$6) ORDER BY created_at DESC LIMIT 30`,
   [scope.accountId,scope.workspaceId,scope.storeId,siteId,scope.role==='owner',userId]);
  const source=await loadOriginalSource01613D2(c,await existing(c,scope,siteId)).catch(()=>null);
  const branches=q.rows.map(publicBranch);
  const history=branches.length?await c.query(`SELECT e.test_id,e.actor_user_id,e.revision_id,e.review_cycle,e.action,e.note,e.created_at
      FROM shifttime_site_test_review_events_01615a e WHERE e.site_id=$1 AND e.test_id=ANY($2::text[])
      ORDER BY e.created_at DESC,e.id DESC LIMIT 300`,[siteId,branches.map(b=>b.id)]):{rows:[]};
  const events=new Map(branches.map(b=>[b.id,[]]));
  for(const e of history.rows)events.get(e.test_id)?.push({actorUserId:e.actor_user_id,revisionId:e.revision_id,cycle:Number(e.review_cycle),action:e.action,note:e.note,createdAt:e.created_at});
  return {stage:'01615A',tests:branches.map(b=>({...b,reviewHistory:events.get(b.id)||[]})),source:source?{kind:source.sourceKind,summary:source.summary}:null};
 });
}
async function loadOriginalSource01613D2(c,site){
 const published=await c.query(`SELECT id,project_json,schema_version FROM shifttime_builder_site_revisions
   WHERE site_id=$1 AND kind='published' ORDER BY published_at DESC NULLS LAST,updated_at DESC LIMIT 1`,[site.id]);
 const row=published.rows[0]||{};
 const selected=chooseOriginalSource01613D2({siteProject:site.project_json,publishedProject:row.project_json,
   siteId:site.id,siteSchema:site.schema_version,publishedSchema:row.schema_version,publishedRevisionId:row.id});
 if(!selected)throw siteTestError01613D('ST_TEST_ORIGINAL_CONTENT_MISSING_01613D',409);
 return selected;
}
export async function compareSiteTest01614B(scope,userId,siteId,branchId){
 return withClient(async c=>{
  const site=await existing(c,scope,siteId),b=await queryBranch(c,scope,siteId,branchId);
  assertTestActor01613D(scope,userId,b);
  if(b.revision_kind!=='draft'&&b.state!=='published')throw siteTestError01613D('ST_TEST_REVISION_INVALID_01613D',409);
  const source=await loadOriginalSource01613D2(c,site);
  return {testId:branchId,...compareSiteTestProjects01614B(source.project,b.project_json)};
 });
}
export async function createSiteTest01613D(scope,userId,siteId){
 return tx(async c=>{
  const site=await existing(c,scope,siteId);
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[siteId]);
  const source=await loadOriginalSource01613D2(c,site);
  if(source.sourceKind!=='published')throw siteTestError01613D('ST_TEST_CANONICAL_PUBLISHED_REQUIRED_01613D2',409);
  // Replacing a manager's existing editable copy is atomic: preserve the old
  // revision as an archive and reuse the same test branch + slot. This is NOT
  // allowed for copies submitted for review or already published.
  const reusable=await c.query(`SELECT b.id,b.revision_id,r.slot
    FROM shifttime_site_test_branches_01613d b
    JOIN shifttime_builder_site_revisions r ON r.id=b.revision_id AND r.site_id=b.site_id
    WHERE b.site_id=$1 AND b.account_id=$2 AND b.workspace_id=$3 AND b.store_id=$4
      AND b.author_user_id=$5 AND b.state IN ('editing','preview') AND r.kind='draft'
    ORDER BY b.updated_at DESC,b.id DESC LIMIT 1 FOR UPDATE OF b,r`,
    [siteId,scope.accountId,scope.workspaceId,scope.storeId,userId]);
  const previous=reusable.rows[0]||null;
  let slot;
  if(previous){
    slot=Number(previous.slot);
    if(!Number.isInteger(slot)||slot<1)throw siteTestError01613D('ST_TEST_RESET_SLOT_INVALID_01613D2',409);
    await c.query(`UPDATE shifttime_builder_site_revisions SET kind='archived',slot=0,updated_at=now()
      WHERE id=$1 AND site_id=$2 AND kind='draft'`,[previous.revision_id,siteId]);
  }else{
    const drafts=await c.query(`SELECT slot FROM shifttime_builder_site_revisions
      WHERE site_id=$1 AND kind='draft' FOR UPDATE`,[siteId]);
    slot=nextFreeDraftSlot01613D3(drafts.rows);
  }
  const rid=newRevisionId01613D(),bid=previous?.id||newTestId01613D();
  const revision=await c.query(`INSERT INTO shifttime_builder_site_revisions(id,site_id,kind,slot,label,schema_version,project_json,dirty,source_revision_id,created_by_user_id,updated_by_user_id)
   VALUES($1,$2,'draft',$3,$4,$5,$6::jsonb,false,$7,$8,$8) RETURNING id`,
   [rid,siteId,slot,`ShiftTime Test · ${site.name}`,source.schemaVersion||'01170',JSON.stringify(source.project),source.sourceRevisionId||null,userId]);
  if(!revision.rowCount)throw siteTestError01613D('ST_TEST_CREATE_FAILED_01613D',500);
  const q=previous
   ?await c.query(`UPDATE shifttime_site_test_branches_01613d
       SET revision_id=$2,base_project_revision=$3,state='editing',
         preview_deploy_id=NULL,candidate_deploy_id=NULL,preview_url=NULL,preview_snapshot_sha=NULL,
         preview_created_at=NULL,submitted_at=NULL,approved_at=NULL,approved_by_user_id=NULL,review_snapshot_sha=NULL,
         updated_at=now() WHERE id=$1 AND site_id=$4 AND author_user_id=$5 RETURNING *`,
       [bid,rid,site.revision,siteId,userId])
   :await c.query(`INSERT INTO shifttime_site_test_branches_01613d(id,account_id,workspace_id,store_id,site_id,revision_id,author_user_id,base_project_revision)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
       [bid,scope.accountId,scope.workspaceId,scope.storeId,siteId,rid,userId,site.revision]);
  if(!q.rowCount)throw siteTestError01613D('ST_TEST_CREATE_FAILED_01613D',500);
  return {stage:'01613D3',test:publicBranch(q.rows[0]),source:{kind:source.sourceKind,summary:source.summary},
    replacedRevisionId:previous?.revision_id||null};
 });
}
// An existing copy can be safely restarted from the canonical source. The old
// draft is ARCHIVED, not overwritten or deleted, for forensic recovery.
export async function resetSiteTest01613D2(scope,userId,siteId,branchId){
 return tx(async c=>{
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[siteId]);
  const site=await existing(c,scope,siteId);
  const b=await queryBranch(c,scope,siteId,branchId,{lock:true});
  assertTestActor01613D(scope,userId,b,{write:true});
  if(!['editing','preview'].includes(b.state))throw siteTestError01613D('ST_TEST_RESET_STATE_DENIED_01613D2',409);
  const source=await loadOriginalSource01613D2(c,site);
  if(source.sourceKind!=='published')throw siteTestError01613D('ST_TEST_CANONICAL_PUBLISHED_REQUIRED_01613D2',409);
  const slot=Number(b.slot);
  if(!Number.isInteger(slot)||slot<1)throw siteTestError01613D('ST_TEST_RESET_SLOT_INVALID_01613D2',409);
  await c.query(`UPDATE shifttime_builder_site_revisions SET kind='archived',slot=0,updated_at=now() WHERE id=$1 AND site_id=$2 AND kind='draft'`,[b.revision_id,siteId]);
  const rid=newRevisionId01613D();
  await c.query(`INSERT INTO shifttime_builder_site_revisions(id,site_id,kind,slot,label,schema_version,project_json,dirty,source_revision_id,created_by_user_id,updated_by_user_id)
    VALUES($1,$2,'draft',$3,$4,$5,$6::jsonb,false,$7,$8,$8)`,
    [rid,siteId,slot,`ShiftTime Test · ${site.name}`,source.schemaVersion||'01170',JSON.stringify(source.project),source.sourceRevisionId,userId]);
  const q=await c.query(`UPDATE shifttime_site_test_branches_01613d SET revision_id=$2,base_project_revision=$3,state='editing',
   preview_deploy_id=NULL,candidate_deploy_id=NULL,preview_url=NULL,preview_snapshot_sha=NULL,preview_created_at=NULL,
   submitted_at=NULL,approved_at=NULL,approved_by_user_id=NULL,review_snapshot_sha=NULL,updated_at=now() WHERE id=$1 RETURNING *`,
   [branchId,rid,site.revision]);
  return {stage:'01613D2',test:publicBranch(q.rows[0]),source:{kind:source.sourceKind,summary:source.summary},archivedRevisionId:b.revision_id};
 });
}
export async function requireSiteTestRevisionAccess01613D(scope,userId,siteId,revisionId,{write=false}={}){
 if(scope.role==='owner'&&!write)return;
 return withClient(async c=>{
  const q=await c.query(`SELECT b.* FROM shifttime_site_test_branches_01613d b WHERE b.site_id=$1 AND b.revision_id=$2
    AND b.account_id=$3 AND b.workspace_id=$4 AND b.store_id=$5`,[siteId,revisionId,scope.accountId,scope.workspaceId,scope.storeId]);
  if(!q.rowCount){
   if(write)throw siteTestError01613D('ST_TEST_DRAFT_REQUIRED_01613D',403);
   // Only a published revision is publicly readable to site editors.
   const published=await c.query(`SELECT 1 FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2 AND kind='published'`,[siteId,revisionId]);
   if(!published.rowCount)throw siteTestError01613D('ST_TEST_REVISION_ACCESS_DENIED_01613D',403);
   return;
  }
  if(scope.role!=='owner')assertTestActor01613D(scope,userId,q.rows[0],{write});
  if(write&&!['editing','preview'].includes(q.rows[0].state))throw siteTestError01613D('ST_TEST_DRAFT_LOCKED_01613D',409);
 });
}
export function assertNoOriginalWrite01613D(scope,p,method){
 if(scope.role==='owner'||p?.[2]!=='sites'||!p?.[3])return;
 const m=String(method||'').toUpperCase();
 if((p.length===4&&m==='PUT')||p[4]==='canvas'&&m==='POST'||p[4]==='metadata'&&m==='PATCH')
  throw siteTestError01613D('ST_TEST_ORIGINAL_WRITE_DENIED_01613D',403);
}
export async function previewSiteTest01613D(scope,userId,siteId,branchId,input,{netlify=client,buildFiles=buildProductionFiles01143}={}){
 const pkg=input?.pkg,project=input?.capturedProject;
 if(!pkg||pkg.version!=='01143'||pkg.exporterVersion!=='01151'||pkg.preflight?.ok!==true||clean(pkg.site?.id)!==siteId||!project)
  throw siteTestError01613D('ST_TEST_PACKAGE_INVALID_01613D',400);
 // Atomic transition prevents simultaneous double previews and prevents accepting stale edits.
 const entry=await tx(async c=>{
  const site=await existing(c,scope,siteId),b=await queryBranch(c,scope,siteId,branchId,{lock:true});
  assertTestActor01613D(scope,userId,b,{write:true});
  if(!['editing','preview'].includes(b.state))throw siteTestError01613D('ST_TEST_BUSY_01613D',409);
  if(!clean(site.netlify_site_id))throw siteTestError01613D('ST_TEST_PUBLISH_ORIGINAL_FIRST_01613D',409);
  if(b.revision_kind!=='draft')throw siteTestError01613D('ST_TEST_REVISION_INVALID_01613D',409);
  if(projectSha01613D(project)!==projectSha01613D(b.project_json))throw siteTestError01613D('ST_TEST_UNSAVED_OR_CHANGED_01613D',409);
  const sha=projectSha01613D(b.project_json);
  await c.query(`UPDATE shifttime_site_test_branches_01613d SET state='processing',updated_at=now() WHERE id=$1`,[branchId]);
  return {site,sha};
 });
 try{
  const aiConfig=await getAiConsultantPublishConfig01414(scope,siteId);
  const origin=clean(entry.site.netlify_ssl_url||entry.site.netlify_url);
  const files=buildFiles(pkg,{canonicalBaseUrl:origin,apiProxyTarget:config.publicApiBaseUrl,
    publishedSiteIdentity:{siteId,token:entry.site.traffic_identity_token||''},aiConsultantPublicConfig:aiConfig});
  if(!(files instanceof Map)||!files.has('index.html'))throw siteTestError01613D('ST_TEST_BUILD_INVALID_01613D',400);
  // 01614B: visual previews go to an entirely SEPARATE Netlify site.
  // Even if Netlify ignores a draft flag, the original LIVE site cannot change.
  const found=await withClient(c=>queryBranch(c,scope,siteId,branchId));
  let isolatedId=clean(found.preview_netlify_site_id);
  if(!isolatedId){
    const created=await netlify.createSiteWithSafeName({preferredName:`shifttime-test-${siteId.slice(-12)}-${branchId.slice(-8)}`});
    isolatedId=clean(created?.id);
    if(!isolatedId||isolatedId===clean(entry.site.netlify_site_id))throw siteTestError01613D('ST_TEST_ISOLATED_SITE_REQUIRED_01614B',502);
    await withClient(c=>c.query(`UPDATE shifttime_site_test_branches_01613d SET preview_netlify_site_id=$2 WHERE id=$1 AND preview_netlify_site_id IS NULL`,[branchId,isolatedId]));
  }
  if(isolatedId===clean(entry.site.netlify_site_id))throw siteTestError01613D('ST_TEST_ISOLATED_SITE_REQUIRED_01614B',502);
  // Never put a production site's telemetry identity into a public test origin.
  const isolatedFiles=buildFiles(pkg,{canonicalBaseUrl:origin,apiProxyTarget:config.publicApiBaseUrl,
    publishedSiteIdentity:{siteId,token:''},aiConsultantPublicConfig:null});
  const preview=await netlify.deployFiles({siteId:isolatedId,files:previewModeFiles01613D(isolatedFiles),draft:false});
  if(!clean(preview?.id))throw siteTestError01613D('ST_TEST_PREVIEW_LINK_MISSING_01613D',502);
  // Netlify can return 'prepared' / 'uploading' before a deploy is publicly ready.
  let verifiedPreview;
  for(let attempt=0;attempt<14;attempt++){
    verifiedPreview=await netlify.getDeploy({deployId:preview.id});
    if(clean(verifiedPreview?.state)==='ready')break;
    if(['error','failed'].includes(clean(verifiedPreview?.state)))throw siteTestError01613D('ST_TEST_PREVIEW_NOT_READY_01614B',502);
    if(attempt<13)await new Promise(resolve=>setTimeout(resolve,1100));
  }
  if(clean(verifiedPreview?.state)!=='ready')throw siteTestError01613D('ST_TEST_PREVIEW_NOT_READY_01614B',503);
  if(clean(verifiedPreview.site_id)!==isolatedId)throw siteTestError01613D('ST_TEST_ISOLATED_SITE_REQUIRED_01614B',502);
  const link=clean(verifiedPreview.deploy_ssl_url||verifiedPreview.deploy_url||verifiedPreview.ssl_url||verifiedPreview.url);
  if(!/^https:\/\//i.test(link))throw siteTestError01613D('ST_TEST_PREVIEW_LINK_MISSING_01613D',502);
  // 01614B intentionally does not create ANY deploy on the production Netlify site.
  // Owner promotion remains blocked (candidate_deploy_id=NULL) until 01614C
  // can generate a trusted candidate from the server-side saved project.
  const candidateId=null;
  const result=await tx(async c=>{
   const b=await queryBranch(c,scope,siteId,branchId,{lock:true});
   if(b.state!=='processing'||projectSha01613D(b.project_json)!==entry.sha)throw siteTestError01613D('ST_TEST_CONCURRENT_EDIT_01613D',409);
   const q=await c.query(`UPDATE shifttime_site_test_branches_01613d SET state='preview',preview_deploy_id=$2,candidate_deploy_id=$3,preview_url=$4,preview_snapshot_sha=$5,preview_created_at=now(),submitted_at=NULL,approved_at=NULL,approved_by_user_id=NULL,review_snapshot_sha=NULL,updated_at=now() WHERE id=$1 RETURNING *`,
     [branchId,preview.id,candidateId,link,entry.sha]);
   return publicBranch(q.rows[0]);
  });
  return {stage:'01613D',test:result};
 }catch(error){
  await withClient(c=>c.query(`UPDATE shifttime_site_test_branches_01613d SET state='editing',updated_at=now() WHERE id=$1 AND state='processing'`,[branchId])).catch(()=>{});
  throw error;
 }
}
// 01615A: submitting a saved draft must NOT require Netlify publishing.
// The SHA locks an exact server revision for the owner's review.
export async function submitSiteTest01613D(scope,userId,siteId,branchId,input={}){
 const note=reviewNote01615A(input?.note);
 return tx(async c=>{
  const b=await queryBranch(c,scope,siteId,branchId,{lock:true});
  assertTestActor01613D(scope,userId,b,{write:true});
  assertReviewSubmissionAuthor01615A(b,userId);
  const sha=assertReviewSubmission01615A(b);
  const q=await c.query(`UPDATE shifttime_site_test_branches_01613d
   SET state='in_review',submitted_at=now(),review_snapshot_sha=$2,
   review_cycle=review_cycle+1,approved_at=NULL,approved_by_user_id=NULL,updated_at=now()
   WHERE id=$1 AND state IN ('editing','preview') RETURNING *`,[branchId,sha]);
  if(!q.rowCount)throw siteTestError01613D('ST_TEST_SUBMIT_STATE_DENIED_01615A',409);
  await c.query(`INSERT INTO shifttime_site_test_review_events_01615a(test_id,site_id,actor_user_id,revision_id,review_cycle,action,project_sha,note)
   VALUES($1,$2,$3,$4,$5,'submitted',$6,$7)`,[branchId,siteId,userId,b.revision_id,q.rows[0].review_cycle,sha,note]);
  return {stage:'01615A',test:publicBranch(q.rows[0])};
 });
}
// Owner-only review decisions. Deliberately no production write/deploy.
export async function decideSiteTest01615A(scope,userId,siteId,branchId,input={}){
 const decision=clean(input?.decision);
 const note=reviewNote01615A(input?.note,{required:decision==='changes_requested'||decision==='rejected'});
 return tx(async c=>{
  if(scope.role!=='owner')throw siteTestError01613D('ST_TEST_OWNER_REQUIRED_01613D',403);
  const site=await existing(c,scope,siteId);
  const b=await queryBranch(c,scope,siteId,branchId,{lock:true});
  const result=assertReviewDecision01615A({row:b,role:scope.role,decision,currentRevision:site.revision});
  // A requested revision remains immutable in history. On returning it to
  // the manager, archive the reviewed snapshot and branch a NEW editable copy.
  // The original server project and production deploy are not touched.
  let editableRevisionId=null;
  if(decision==='changes_requested'){
   const slot=Number(b.slot);
   if(!Number.isInteger(slot)||slot<1)throw siteTestError01613D('ST_TEST_RESET_SLOT_INVALID_01613D2',409);
   const old=await c.query(`UPDATE shifttime_builder_site_revisions
     SET kind='archived',slot=0,updated_at=now() WHERE id=$1 AND site_id=$2 AND kind='draft' RETURNING id`,[b.revision_id,siteId]);
   if(!old.rowCount)throw siteTestError01613D('ST_TEST_REVIEW_CONTENT_CHANGED_01615A',409);
   editableRevisionId=newRevisionId01613D();
   await c.query(`INSERT INTO shifttime_builder_site_revisions
    (id,site_id,kind,slot,label,schema_version,project_json,dirty,source_revision_id,created_by_user_id,updated_by_user_id)
    VALUES($1,$2,'draft',$3,$4,$5,$6::jsonb,false,$7,$8,$8)`,
    [editableRevisionId,siteId,slot,`ShiftTime Test · review ${b.review_cycle+1}`,b.schema_version||'01170',JSON.stringify(b.project_json),b.revision_id,b.author_user_id]);
  }
  const q=await c.query(`UPDATE shifttime_site_test_branches_01613d SET
   state=$2,approved_at=CASE WHEN $2='approved' THEN now() ELSE NULL END,
   approved_by_user_id=CASE WHEN $2='approved' THEN $3 ELSE NULL END,
   submitted_at=CASE WHEN $2='editing' THEN NULL ELSE submitted_at END,
   revision_id=COALESCE($4,revision_id),
   review_snapshot_sha=CASE WHEN $2='editing' THEN NULL ELSE review_snapshot_sha END,
   preview_deploy_id=CASE WHEN $2='editing' THEN NULL ELSE preview_deploy_id END,
   candidate_deploy_id=CASE WHEN $2='editing' THEN NULL ELSE candidate_deploy_id END,
   preview_url=CASE WHEN $2='editing' THEN NULL ELSE preview_url END,
   preview_snapshot_sha=CASE WHEN $2='editing' THEN NULL ELSE preview_snapshot_sha END,
   preview_created_at=CASE WHEN $2='editing' THEN NULL ELSE preview_created_at END,
   updated_at=now() WHERE id=$1 AND state='in_review' RETURNING *`,[branchId,result.newState,userId,editableRevisionId]);
  if(!q.rowCount)throw siteTestError01613D('ST_TEST_REVIEW_STATE_DENIED_01615A',409);
  await c.query(`INSERT INTO shifttime_site_test_review_events_01615a(test_id,site_id,actor_user_id,revision_id,review_cycle,action,project_sha,note)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[branchId,siteId,userId,b.revision_id,b.review_cycle,decision,b.review_snapshot_sha,note]);
  return {stage:'01615A',test:publicBranch(q.rows[0])};
 });
}
export async function promoteSiteTest01613D(scope,userId,siteId,branchId,{netlify=client}={}){
 throw siteTestError01613D('ST_TEST_PROMOTION_DISABLED_01615A',403); // 01615A: approval never mutates LIVE
 if(scope.role!=='owner')throw siteTestError01613D('ST_TEST_OWNER_REQUIRED_01613D',403);
 return tx(async c=>{
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[siteId]);
  const site=await existing(c,scope,siteId),b=await queryBranch(c,scope,siteId,branchId,{lock:true});
  if(b.state!=='in_review')throw siteTestError01613D('ST_TEST_REVIEW_REQUIRED_01613D',409);
  assertProductionUnchanged01613D(b.base_project_revision,site.revision);
  if(!b.candidate_deploy_id||!b.preview_deploy_id||projectSha01613D(b.project_json)!==b.preview_snapshot_sha)
   throw siteTestError01613D('ST_TEST_PREVIEW_OUTDATED_01613D',409);
  const candidate=await netlify.getDeploy({deployId:b.candidate_deploy_id});
  if(candidate.site_id!==site.netlify_site_id||candidate.draft!==true||candidate.state!=='ready')
   throw siteTestError01613D('ST_TEST_CANDIDATE_NOT_READY_01613D',409);
  // Owner-only transition. Netlify publishes the EXACT unchanged production candidate,
  // not the read-only preview. The previous production deploy remains restorable.
  const restored=await netlify.restoreSiteDeploy({siteId:site.netlify_site_id,deployId:b.candidate_deploy_id});
  const id=clean(restored?.id||b.candidate_deploy_id);
  await c.query(`UPDATE shifttime_builder_site_projects SET project_json=$1::jsonb,schema_version=$2,revision=revision+1,updated_by_user_id=$3,updated_at=now() WHERE site_id=$4`,
   [JSON.stringify(b.project_json),b.schema_version||'01170',userId,siteId]);
  await c.query(`UPDATE shifttime_builder_site_revisions SET kind='archived',slot=0,updated_at=now() WHERE site_id=$1 AND kind='published'`,[siteId]);
  await c.query(`UPDATE shifttime_builder_site_revisions SET kind='published',slot=0,dirty=false,published_at=now(),updated_by_user_id=$2,updated_at=now() WHERE id=$1 AND site_id=$3 AND kind='draft'`,[b.revision_id,userId,siteId]);
  await c.query(`UPDATE shifttime_published_sites SET last_deploy_id=$1,last_deploy_state='ready',requested_revision=$2,published_revision=$2,last_publish_error='',last_published_at=now(),updated_at=now() WHERE account_id=$3 AND workspace_id=$4 AND store_id=$5 AND builder_site_id=$6`,
   [id,b.preview_snapshot_sha,scope.accountId,scope.workspaceId,scope.storeId,siteId]);
  const updated=await c.query(`UPDATE shifttime_site_test_branches_01613d SET state='published',approved_by_user_id=$2,approved_at=now(),published_at=now(),updated_at=now() WHERE id=$1 RETURNING *`,[branchId,userId]);
  return {stage:'01613D',test:publicBranch(updated.rows[0]),productionUrl:clean(site.netlify_ssl_url||site.netlify_url)};
 });
}
