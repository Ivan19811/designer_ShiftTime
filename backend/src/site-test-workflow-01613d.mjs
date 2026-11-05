// 01613D · Server-owned test copies, visual-only Netlify draft previews and owner promotion.
// No manager operation writes to the primary site project or published deploy record.
import {withClient} from './db.mjs';
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
 const q=await c.query(`SELECT b.*,r.project_json,r.schema_version,r.kind revision_kind
 FROM shifttime_site_test_branches_01613d b
 JOIN shifttime_builder_site_revisions r ON r.id=b.revision_id AND r.site_id=b.site_id
 WHERE b.id=$1 AND b.site_id=$2 AND b.account_id=$3 AND b.workspace_id=$4 AND b.store_id=$5 ${lock?'FOR UPDATE OF b,r':''}`,
 [branchId,siteId,scope.accountId,scope.workspaceId,scope.storeId]);
 if(!q.rowCount)throw siteTestError01613D('ST_TEST_NOT_FOUND_01613D',404);
 return q.rows[0];
};
const publicBranch=b=>({id:b.id,siteId:b.site_id,revisionId:b.revision_id,authorUserId:b.author_user_id,baseProjectRevision:Number(b.base_project_revision),state:b.state,previewUrl:b.preview_url||'',previewDeployId:b.preview_deploy_id||'',previewCreatedAt:b.preview_created_at||null,submittedAt:b.submitted_at||null,approvedAt:b.approved_at||null,publishedAt:b.published_at||null,createdAt:b.created_at||null,updatedAt:b.updated_at||null});
const tx=async fn=>withClient(async c=>{await c.query('BEGIN');try{const r=await fn(c);await c.query('COMMIT');return r;}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}});

export async function listSiteTests01613D(scope,userId,siteId){
 return withClient(async c=>{
  await existing(c,scope,siteId);
  const q=await c.query(`SELECT b.* FROM shifttime_site_test_branches_01613d b
   WHERE account_id=$1 AND workspace_id=$2 AND store_id=$3 AND site_id=$4
   AND ($5::boolean OR author_user_id=$6) ORDER BY created_at DESC LIMIT 30`,
   [scope.accountId,scope.workspaceId,scope.storeId,siteId,scope.role==='owner',userId]);
  return {stage:'01613D',tests:q.rows.map(publicBranch)};
 });
}
export async function createSiteTest01613D(scope,userId,siteId){
 return tx(async c=>{
  const site=await existing(c,scope,siteId);
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[siteId]);
  // A published revision may hold the complete Canvas when the legacy main
  // project record is only metadata. Never create a blank delegated clone.
  const published=await c.query(`SELECT project_json,schema_version FROM shifttime_builder_site_revisions
    WHERE site_id=$1 AND kind='published' ORDER BY published_at DESC NULLS LAST,updated_at DESC LIMIT 1`,[siteId]);
  const fullProject=value=>value&&typeof value==='object'&&!Array.isArray(value)&&
    value.site&&typeof value.site==='object'&&Array.isArray(value.site.pages)&&value.site.pages.length>0;
  const original=fullProject(site.project_json)?site.project_json:
    (fullProject(published.rows[0]?.project_json)?published.rows[0].project_json:null);
  if(!original)throw siteTestError01613D('ST_TEST_ORIGINAL_CONTENT_MISSING_01613D',409);
  const originalSchema=original===site.project_json?site.schema_version:published.rows[0]?.schema_version;
  const drafts=await c.query(`SELECT slot FROM shifttime_builder_site_revisions WHERE site_id=$1 AND kind='draft' FOR UPDATE`,[siteId]);
  const used=new Set(drafts.rows.map(x=>Number(x.slot)));
  let slot=0;for(let n=1;n<=5;n++)if(!used.has(n)){slot=n;break;}
  if(!slot)throw siteTestError01613D('ST_TEST_DRAFT_LIMIT_01613D',409);
  const rid=newRevisionId01613D(),bid=newTestId01613D();
  const revision=await c.query(`INSERT INTO shifttime_builder_site_revisions(id,site_id,kind,slot,label,schema_version,project_json,dirty,created_by_user_id,updated_by_user_id)
   VALUES($1,$2,'draft',$3,$4,$5,$6::jsonb,false,$7,$7) RETURNING id`,
   [rid,siteId,slot,`ShiftTime Test · ${site.name}`,originalSchema||'01170',JSON.stringify(original),userId]);
  if(!revision.rowCount)throw siteTestError01613D('ST_TEST_CREATE_FAILED_01613D',500);
  const q=await c.query(`INSERT INTO shifttime_site_test_branches_01613d(id,account_id,workspace_id,store_id,site_id,revision_id,author_user_id,base_project_revision)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
   [bid,scope.accountId,scope.workspaceId,scope.storeId,siteId,rid,userId,site.revision]);
  return {stage:'01613D',test:publicBranch(q.rows[0])};
 });
}
export async function requireSiteTestRevisionAccess01613D(scope,userId,siteId,revisionId,{write=false}={}){
 if(scope.role==='owner')return;
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
  assertTestActor01613D(scope,userId,q.rows[0],{write});
  if(write&&!['editing','preview','in_review'].includes(q.rows[0].state))throw siteTestError01613D('ST_TEST_DRAFT_LOCKED_01613D',409);
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
  if(!['editing','preview','in_review'].includes(b.state))throw siteTestError01613D('ST_TEST_BUSY_01613D',409);
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
  // Prepare two draft deploys, NEVER a production deploy:
  // (1) safe visual preview (API disabled), (2) unchanged production candidate,
  // whose unshared deploy id is only used after owner approval.
  const preview=assertDraftDeploy01613D(await netlify.deployFiles({siteId:entry.site.netlify_site_id,files:previewModeFiles01613D(files),draft:true}));
  const candidate=assertDraftDeploy01613D(await netlify.deployFiles({siteId:entry.site.netlify_site_id,files,draft:true}));
  const link=previewPermalink01613D(preview);
  const result=await tx(async c=>{
   const b=await queryBranch(c,scope,siteId,branchId,{lock:true});
   if(b.state!=='processing'||projectSha01613D(b.project_json)!==entry.sha)throw siteTestError01613D('ST_TEST_CONCURRENT_EDIT_01613D',409);
   const q=await c.query(`UPDATE shifttime_site_test_branches_01613d SET state='preview',preview_deploy_id=$2,candidate_deploy_id=$3,preview_url=$4,preview_snapshot_sha=$5,preview_created_at=now(),submitted_at=NULL,approved_at=NULL,approved_by_user_id=NULL,updated_at=now() WHERE id=$1 RETURNING *`,
     [branchId,preview.id,candidate.id,link,entry.sha]);
   return publicBranch(q.rows[0]);
  });
  return {stage:'01613D',test:result};
 }catch(error){
  await withClient(c=>c.query(`UPDATE shifttime_site_test_branches_01613d SET state='editing',updated_at=now() WHERE id=$1 AND state='processing'`,[branchId])).catch(()=>{});
  throw error;
 }
}
export async function submitSiteTest01613D(scope,userId,siteId,branchId){
 return tx(async c=>{
  const b=await queryBranch(c,scope,siteId,branchId,{lock:true});
  assertTestActor01613D(scope,userId,b,{write:true});
  if(b.state!=='preview'||!b.preview_deploy_id||!b.candidate_deploy_id||projectSha01613D(b.project_json)!==b.preview_snapshot_sha)
   throw siteTestError01613D('ST_TEST_PREVIEW_REQUIRED_01613D',409);
  const q=await c.query(`UPDATE shifttime_site_test_branches_01613d SET state='in_review',submitted_at=now(),updated_at=now() WHERE id=$1 RETURNING *`,[branchId]);
  return {stage:'01613D',test:publicBranch(q.rows[0])};
 });
}
export async function promoteSiteTest01613D(scope,userId,siteId,branchId,{netlify=client}={}){
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
