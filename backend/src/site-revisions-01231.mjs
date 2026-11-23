import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {draftFingerprint01606G} from './site-canvas-draft-service-01606g.mjs';
import {nextFreeDraftSlot01613D3} from './site-revision-slots-01613d3.mjs';
import {classifyTestDraftDelete01623D} from './site-revision-delete-policy-01623d.mjs';
import {planOriginalPromotion01623U} from './site-original-promotion-01623u.mjs';
import {checkRevisionDeleteScope01623K} from './site-delete-audit-01623k.mjs';
import {mergeOwnerProject01646} from './site-owner-merge-01646.mjs';
import {saveOwnerHistoryInTransaction01646} from './site-owner-history-01646.mjs';

const clean=v=>String(v??'').trim();
const clone=v=>v==null?v:structuredClone(v);
function httpError(message,statusCode=400,code='ST_SITE_REVISION_INVALID'){const e=new Error(message);e.statusCode=statusCode;e.code=code;return e;}
function projectValue(value){return value&&typeof value==='object'&&!Array.isArray(value)?clone(value):{};}
function mapRow(row,{includeProject=false}={}){if(!row)return null;const out={
  id:clean(row.id),siteId:clean(row.site_id),kind:clean(row.kind),slot:Number(row.slot||0),label:clean(row.label),comment:String(row.comment??''),schemaVersion:clean(row.schema_version)||'01231',dirty:row.dirty===true,sourceRevisionId:clean(row.source_revision_id),
  createdByUserId:clean(row.created_by_user_id),
  createdAt:row.created_at?new Date(row.created_at).toISOString():null,updatedAt:row.updated_at?new Date(row.updated_at).toISOString():null,publishedAt:row.published_at?new Date(row.published_at).toISOString():null,baseOriginalRevision:row.base_original_revision==null?null:Number(row.base_original_revision),preparedOriginalRevision:row.prepared_original_revision==null?null:Number(row.prepared_original_revision),
};if(includeProject){out.project=projectValue(row.project_json);out.fingerprint=draftFingerprint01606G(out.project);}return out;}
async function assertSite(c,scope,siteId){const q=await c.query(`SELECT s.id,p.project_json,p.schema_version FROM shifttime_builder_sites s LEFT JOIN shifttime_builder_site_projects p ON p.site_id=s.id WHERE s.account_id=$1 AND s.workspace_id=$2 AND s.store_id=$3 AND s.id=$4 AND s.status<>'archived' LIMIT 1`,[scope.accountId,scope.workspaceId,scope.storeId,siteId]);if(!q.rowCount)throw httpError('Builder site not found',404,'ST_BUILDER_SITE_NOT_FOUND');return q.rows[0];}
function revisionId(){return `rev_${crypto.randomUUID().replaceAll('-','')}`;}

export async function listSiteRevisions01231(scope,siteId='',allowedSiteIds=null,run=withClient,userId=''){
  // 01605E: Store-scoped roles can list revisions normally. Site-scoped roles
  // must never enumerate revisions belonging to other sites in the same Store.
  if(Array.isArray(allowedSiteIds)&&allowedSiteIds.length===0)return [];
  return run(async c=>{const params=[scope.accountId,scope.workspaceId,scope.storeId];let where=`s.account_id=$1 AND s.workspace_id=$2 AND s.store_id=$3 AND r.kind IN ('draft','published')`;if(clean(siteId)){params.push(clean(siteId));where+=` AND s.id=$${params.length}`;}
    if(Array.isArray(allowedSiteIds)){params.push([...new Set(allowedSiteIds.filter(v=>typeof v==='string'&&v.length>0))]);where+=` AND s.id=ANY($${params.length}::text[])`;}
    if(clean(userId)){
      params.push(clean(userId));
      where+=` AND (r.kind='published' OR (r.created_by_user_id=$${params.length} AND EXISTS (
        SELECT 1 FROM shifttime_site_test_branches_01613d b WHERE b.revision_id=r.id AND b.author_user_id=$${params.length}
          AND b.account_id=s.account_id AND b.store_id=s.store_id)))`;
    }
    const q=await c.query(`SELECT r.* FROM shifttime_builder_site_revisions r JOIN shifttime_builder_sites s ON s.id=r.site_id WHERE ${where} ORDER BY r.site_id, CASE WHEN r.kind='published' THEN 0 ELSE 1 END, r.slot, r.updated_at DESC`,params);return q.rows.map(r=>mapRow(r));});
}

export async function getSiteRevision01231(scope,siteId,revisionIdValue,userId=''){
  const sid=clean(siteId),rid=clean(revisionIdValue);return withClient(async c=>{await assertSite(c,scope,sid);const q=await c.query(`SELECT * FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2 AND kind IN ('draft','published') LIMIT 1`,[sid,rid]);if(!q.rowCount)throw httpError('Site revision not found',404,'ST_SITE_REVISION_NOT_FOUND');
   if(scope.role!=='owner'&&q.rows[0].kind==='draft'){
    const branch=await c.query(`SELECT author_user_id FROM shifttime_site_test_branches_01613d WHERE site_id=$1 AND revision_id=$2`,[sid,rid]);
    if(!branch.rowCount||branch.rows[0].author_user_id!==userId)throw httpError('Other manager revision is private',403,'ST_TEST_AUTHOR_REQUIRED_01613D');
   }
   return mapRow(q.rows[0],{includeProject:true});});
}

export async function createSiteDraft01231(scope,userId,siteId,input={}){
  const sid=clean(siteId);return withClient(async c=>{await c.query('BEGIN');try{await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[sid]);const site=await assertSite(c,scope,sid);const drafts=await c.query(`SELECT id,slot FROM shifttime_builder_site_revisions WHERE site_id=$1 AND kind='draft' ORDER BY slot FOR UPDATE`,[sid]);const slot=nextFreeDraftSlot01613D3(drafts.rows);
      let sourceProject=null,sourceRevisionId='';const requestedSource=clean(input.sourceRevisionId);if(requestedSource){const q=await c.query(`SELECT id,project_json,kind,created_by_user_id FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2 AND kind IN ('draft','published') LIMIT 1`,[sid,requestedSource]);if(!q.rowCount)throw httpError('Source revision not found',404,'ST_SITE_REVISION_SOURCE_NOT_FOUND');if(scope.role!=='owner'&&q.rows[0].kind==='draft'&&q.rows[0].created_by_user_id!==userId)throw httpError('Other manager revision is private',403,'ST_TEST_AUTHOR_REQUIRED_01613D');sourceProject=projectValue(q.rows[0].project_json);sourceRevisionId=clean(q.rows[0].id);}else if(input.project&&typeof input.project==='object'){sourceProject=projectValue(input.project);}else{sourceProject=projectValue(site.project_json);}
      const id=revisionId(),schemaVersion=clean(input.schemaVersion||sourceProject?.version||site.schema_version)||'01231',label=clean(input.label),comment=String(input.comment??'').slice(0,4000),dirty=input.dirty===true;
      // 01646: capture the original as a durable three-way merge baseline;
      // the client never supplies this authority. Owner and manager workspaces
      // stay separate even if the owner is editing an older starting snapshot.
      const base=scope.role==='owner'?await c.query('SELECT project_json,revision FROM shifttime_builder_site_projects WHERE site_id=$1 FOR UPDATE',[sid]):{rows:[]};
      const baseline=base.rows[0]||{};
      const q=await c.query(`INSERT INTO shifttime_builder_site_revisions(id,site_id,kind,slot,label,comment,schema_version,project_json,dirty,source_revision_id,created_by_user_id,updated_by_user_id,base_original_project_json,base_original_revision) VALUES($1,$2,'draft',$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$10,$11::jsonb,$12) RETURNING *`,[id,sid,slot,label,comment,schemaVersion,JSON.stringify(sourceProject),dirty,sourceRevisionId||null,userId,scope.role==='owner'&&baseline.project_json?JSON.stringify(baseline.project_json):null,scope.role==='owner'?baseline.revision??null:null]);
      if(scope.role==='owner'&&baseline.project_json){
        const exists=await c.query('SELECT slot FROM shifttime_builder_site_history_01646 WHERE site_id=$1 LIMIT 1',[sid]);
        if(!exists.rowCount)await saveOwnerHistoryInTransaction01646(c,sid,baseline.project_json,{reason:'original',label:'Original Render'});
      }
      await c.query('COMMIT');return mapRow(q.rows[0],{includeProject:true});
    }catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}});
}

// 01615B: protect immutable Test submissions from generic owner revision tools.
async function assertEditableSiteTestRevision01615B(client,siteId,revisionId,{operation='write',userId='',role='owner'}={}){
 const q=await client.query(`SELECT state,author_user_id FROM shifttime_site_test_branches_01613d
   WHERE site_id=$1 AND revision_id=$2 FOR UPDATE`,[siteId,revisionId]);
 if(!q.rowCount){if(role!=='owner')throw httpError('Draft is not a personal ShiftTime Test copy',403,'ST_TEST_DRAFT_REQUIRED_01613D');return;}
 if(userId&&q.rows[0].author_user_id!==userId)throw httpError('Other manager revision is protected',403,'ST_TEST_AUTHOR_REQUIRED_01613D');
 if(operation==='write'&&['editing','preview'].includes(q.rows[0].state))return;
 throw httpError('ShiftTime Test revision is protected',409,'ST_TEST_DRAFT_LOCKED_01614A');
}
export async function saveSiteDraft01231(scope,userId,siteId,revisionIdValue,input={}){
  const sid=clean(siteId),rid=clean(revisionIdValue);return withClient(async c=>{await c.query('BEGIN');try{await assertSite(c,scope,sid);await assertEditableSiteTestRevision01615B(c,sid,rid,{userId,role:scope.role});// 01661: a late pre-publish autosave must not erase the owner preflight.
      // JSONB equality is authoritative (not serialized JS key order). An identical
      // PUT is idempotent and retains the preflight; a genuinely changed draft
      // invalidates preflight and must be prepared again before a new publish.
      const q=await c.query(`UPDATE shifttime_builder_site_revisions
        SET project_json=$1::jsonb,schema_version=$2,label=COALESCE(NULLIF($3,''),label),dirty=$4,
          prepared_original_revision=CASE WHEN project_json=$1::jsonb AND schema_version=$2
            THEN prepared_original_revision ELSE NULL END,
          updated_by_user_id=$5,updated_at=now()
        WHERE site_id=$6 AND id=$7 AND kind='draft'
        RETURNING *`,[JSON.stringify(projectValue(input.project)),clean(input.schemaVersion||input.project?.version)||'01231',clean(input.label),input.dirty!==false,userId,sid,rid]);
      if(!q.rowCount)throw httpError('Draft revision not found',404,'ST_SITE_REVISION_NOT_FOUND');
      await c.query(`UPDATE shifttime_site_test_branches_01613d SET state='editing',preview_snapshot_sha=NULL,candidate_deploy_id=NULL,preview_deploy_id=NULL,preview_url=NULL,submitted_at=NULL,updated_at=now()
        WHERE revision_id=$1 AND site_id=$2`,[rid,sid]);
      await c.query('COMMIT');return mapRow(q.rows[0],{includeProject:true});}catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}});
}


export async function updateSiteDraftDetails01232(scope,userId,siteId,revisionIdValue,input={}){
  const sid=clean(siteId),rid=clean(revisionIdValue),label=clean(input.label),comment=String(input.comment??'').slice(0,4000);
  return withClient(async c=>{await c.query('BEGIN');try{await assertSite(c,scope,sid);await assertEditableSiteTestRevision01615B(c,sid,rid,{userId,role:scope.role});const q=await c.query(`UPDATE shifttime_builder_site_revisions SET label=CASE WHEN $1<>'' THEN $1 ELSE label END,comment=$2,updated_by_user_id=$3,updated_at=now() WHERE site_id=$4 AND id=$5 AND kind='draft' RETURNING *`,[label,comment,userId,sid,rid]);if(!q.rowCount)throw httpError('Draft revision not found',404,'ST_SITE_REVISION_NOT_FOUND');await c.query('COMMIT');return mapRow(q.rows[0],{includeProject:true});}catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}});
}

// 01623K diagnostic: state fingerprint is restricted to ONE site and contains no content or credentials.
async function snapshotDeleteScope01623K(c,siteId,revisionId){
  const q=await c.query(`SELECT
    (SELECT COUNT(*)::int FROM shifttime_builder_sites WHERE id=$1) AS site_count,
    (SELECT COUNT(*)::int FROM shifttime_builder_site_projects WHERE site_id=$1) AS project_count,
    (SELECT COUNT(*)::int FROM shifttime_builder_site_revisions WHERE site_id=$1) AS total,
    (SELECT COUNT(*)::int FROM shifttime_builder_site_revisions WHERE site_id=$1 AND kind='draft') AS drafts,
    (SELECT COUNT(*)::int FROM shifttime_builder_site_revisions WHERE site_id=$1 AND kind='archived') AS archived,
    (SELECT COUNT(*)::int FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2) AS target`,[siteId,revisionId]);
  return q.rows[0];
}
function logDelete01623K(event,siteId,revisionId,counts,extra={}){
  console.info('[ST_DELETE_AUDIT_01623K]',JSON.stringify({event,siteId,revisionId,...counts,...extra}));
}
function assertDeleteScope01623K(before,after,{archived=false}={}){
  if(!checkRevisionDeleteScope01623K(before,after,{archived}))
    throw httpError('Deletion affected unexpected records; transaction rolled back',409,'ST_REVISION_DELETE_SCOPE_MISMATCH_01623K');
}

// 01623D: authoritatively authorize deletion, with history/approval protection.

export async function deleteSiteDraft01231(scope,siteId,revisionIdValue,userId=''){
  const sid=clean(siteId),rid=clean(revisionIdValue);
  return withClient(async c=>{
    await c.query('BEGIN');
    try{
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[sid]);
      await assertSite(c,scope,sid);
      const before01623K=await snapshotDeleteScope01623K(c,sid,rid);
      logDelete01623K('revision-delete-before',sid,rid,before01623K);
      const existing=await c.query(`SELECT id,slot,kind FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2 FOR UPDATE`,[sid,rid]);
      if(!existing.rowCount||existing.rows[0].kind!=='draft')throw httpError('Draft revision not found',404,'ST_SITE_REVISION_NOT_FOUND');
      const test=await c.query(`SELECT id,state,author_user_id,review_cycle,review_snapshot_sha FROM shifttime_site_test_branches_01613d WHERE site_id=$1 AND revision_id=$2 FOR UPDATE`,[sid,rid]);
      if(test.rowCount){
        const branch=test.rows[0];
        const history=await c.query(`SELECT EXISTS(SELECT 1 FROM shifttime_site_test_review_events_01615a WHERE test_id=$1) AS has_review,
          EXISTS(SELECT 1 FROM shifttime_site_test_apply_events_01615b WHERE test_id=$1) AS has_apply`,[branch.id]);
        const decision=classifyTestDraftDelete01623D({role:scope.role,userId,authorUserId:branch.author_user_id,state:branch.state,
          hasHistory:!!history.rows[0]?.has_review||!!history.rows[0]?.has_apply});
        if(decision&&decision!=='archive')throw httpError('Protected test revision cannot be deleted',decision==='ST_TEST_AUTHOR_REQUIRED_01613D'?403:409,decision);
        if(decision==='archive'){
          // Preserve review events and snapshot lineage. Removing an in-review
          // version is a rejection by the site owner, never an implicit approval.
          if(['in_review','approved'].includes(branch.state)){
            if(scope.role!=='owner')throw httpError('Owner must finish review first',403,'ST_TEST_REVIEW_DELETE_BLOCKED_01623D');
            await c.query(`UPDATE shifttime_site_test_branches_01613d
              SET state='rejected',approved_at=NULL,approved_by_user_id=NULL,updated_at=now()
              WHERE id=$1`,[branch.id]);
            await c.query(`INSERT INTO shifttime_site_test_review_events_01615a
              (test_id,site_id,actor_user_id,revision_id,review_cycle,action,project_sha,note)
              VALUES($1,$2,$3,$4,$5,'rejected',$6,$7)`,
              [branch.id,sid,userId,rid,Number(branch.review_cycle)||0,clean(branch.review_snapshot_sha),'Archived by site owner via revision deletion']);
          }
          if(['editing','preview'].includes(branch.state)){
            // A rework draft can already have prior review history. Closing its
            // branch prevents a dangling editable TEST pointing to an archive.
            await c.query(`UPDATE shifttime_site_test_branches_01613d
              SET state='rejected',preview_deploy_id=NULL,candidate_deploy_id=NULL,
                preview_url=NULL,approved_at=NULL,approved_by_user_id=NULL,updated_at=now()
              WHERE id=$1`,[branch.id]);
          }
          const archived=await c.query(`UPDATE shifttime_builder_site_revisions
            SET kind='archived',slot=0,updated_at=now()
            WHERE site_id=$1 AND id=$2 AND kind='draft' RETURNING id`,[sid,rid]);
          if(!archived.rowCount)throw httpError('Draft revision not found',404,'ST_SITE_REVISION_NOT_FOUND');
          const after01623K=await snapshotDeleteScope01623K(c,sid,rid);
          logDelete01623K('revision-delete-after-archive',sid,rid,after01623K);
          assertDeleteScope01623K(before01623K,after01623K,{archived:true});
          await c.query('COMMIT');
          return {deleted:true,archived:true,id:rid,slot:Number(existing.rows[0].slot||0)};
        }
      }else if(scope.role!=='owner')throw httpError('Not an owned test draft',403,'ST_TEST_DRAFT_REQUIRED_01613D');
      // Hard delete only private, unreviewed drafts; cascades their unreviewed
      // test branch without removing any immutable review or publication audit.
      const q=await c.query(`DELETE FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2 AND kind='draft' RETURNING id,slot`,[sid,rid]);
      if(!q.rowCount)throw httpError('Draft revision not found',404,'ST_SITE_REVISION_NOT_FOUND');
      const after01623K=await snapshotDeleteScope01623K(c,sid,rid);
      logDelete01623K('revision-delete-after',sid,rid,after01623K);
      assertDeleteScope01623K(before01623K,after01623K,{archived:false});
      await c.query('COMMIT');
      return {deleted:true,archived:false,id:clean(q.rows[0].id),slot:Number(q.rows[0].slot||0)};
    }catch(e){
      try{await c.query('ROLLBACK');}catch{}
      console.error('[ST_DELETE_AUDIT_01623K]',JSON.stringify({event:'revision-delete-rollback',siteId:sid,revisionId:rid,code:String(e?.code||'UNKNOWN'),status:Number(e?.statusCode||500)}));
      throw e;
    }
  });
}


// 01646: before Netlify sees any files, reconcile the saved owner draft with
// the CURRENT Render original in one server transaction. This returns the
// precise project to export, never a mixture of browser/editor snapshots.
export async function prepareOwnerPublication01646(scope,userId,siteId,revisionIdValue,{expectedFingerprint}={}){
 const sid=clean(siteId),rid=clean(revisionIdValue);
 return withClient(async c=>{await c.query('BEGIN');try{
  if(scope.role!=='owner')throw httpError('Only owner can publish',403,'ST_OWNER_PUBLISH_REQUIRED_01646');
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[sid]);
  await assertSite(c,scope,sid);
  const d=await c.query("SELECT * FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2 AND kind='draft' FOR UPDATE",[sid,rid]);
  if(!d.rowCount||clean(d.rows[0].created_by_user_id)!==clean(userId))throw httpError('Own draft required',403,'ST_OWNER_DRAFT_REQUIRED_01646');
  const draft=d.rows[0];
  if(clean(expectedFingerprint)&&draftFingerprint01606G(draft.project_json)!==clean(expectedFingerprint))throw httpError('Draft changed',409,'ST_PUBLISH_DRAFT_CHANGED_01623U');
  if(!draft.base_original_project_json||draft.base_original_revision==null)throw httpError('This is a legacy revision. Open Edit to start from the verified original.',409,'ST_OWNER_DRAFT_BASE_REQUIRED_01646');
  const o=await c.query('SELECT project_json,revision FROM shifttime_builder_site_projects WHERE site_id=$1 FOR UPDATE',[sid]);
  if(!o.rowCount)throw httpError('Original not found',404,'ST_OWNER_ORIGINAL_NOT_FOUND_01646');
  const current=o.rows[0],merged=mergeOwnerProject01646({siteId:sid,base:draft.base_original_project_json,edited:draft.project_json,current:current.project_json});
  const q=await c.query(`UPDATE shifttime_builder_site_revisions SET project_json=$1::jsonb,prepared_original_revision=$2,updated_at=now()
    WHERE site_id=$3 AND id=$4 AND kind='draft' RETURNING *`,[JSON.stringify(merged),current.revision,sid,rid]);
  await c.query('COMMIT');return mapRow(q.rows[0],{includeProject:true});
 }catch(error){try{await c.query('ROLLBACK');}catch{}throw error;}});
}

export async function publishSiteRevision01231(scope,userId,siteId,revisionIdValue,input={},run=withClient){
  const sid=clean(siteId),rid=clean(revisionIdValue);
  return run(async c=>{await c.query('BEGIN');try{
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[sid]);
    await assertSite(c,scope,sid);
    await assertEditableSiteTestRevision01615B(c,sid,rid,{operation:'publish',role:scope.role,userId});
    const d=await c.query(`SELECT * FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2 AND kind='draft' FOR UPDATE`,[sid,rid]);
    if(!d.rowCount)throw httpError('Draft revision not found',404,'ST_SITE_REVISION_NOT_FOUND');
    const draft=d.rows[0], fingerprint=draftFingerprint01606G(draft.project_json);
    const expected=clean(input?.expectedFingerprint);
    if(expected&&expected!==fingerprint)throw httpError('Draft changed during publication',409,'ST_PUBLISH_DRAFT_CHANGED_01623U');
    // Same lock order as original writes / manager approval; never erase an independent original.
    const original=await c.query(`SELECT p.revision,p.project_json,
      EXISTS (SELECT 1 FROM shifttime_builder_site_revisions r WHERE r.site_id=p.site_id AND r.kind='published' AND r.project_json=p.project_json) AS previous_matches,
      p.project_json=$2::jsonb AS next_matches,
      (EXISTS (SELECT 1 FROM shifttime_site_test_apply_events_01615b WHERE site_id=p.site_id) OR
       EXISTS (SELECT 1 FROM shifttime_site_test_change_batches_01618 WHERE site_id=p.site_id)) AS reviewed
      FROM shifttime_builder_site_projects p WHERE p.site_id=$1 FOR UPDATE OF p`,[sid,JSON.stringify(draft.project_json)]);
    const base=original.rows[0]||{};
    if(scope.role==='owner'&&draft.base_original_project_json){
      // A publish without a confirmed preflight could upload files from a
      // different Canvas. Refuse it, without touching either original or live.
      if(draft.prepared_original_revision==null||Number(draft.prepared_original_revision)!==Number(base.revision)){
        // Diagnosis only: no project content, user data, or credentials in logs.
        console.warn('[ST_OWNER_PUBLISH_SYNC_01661]',JSON.stringify({siteId:sid,
          reason:draft.prepared_original_revision==null?'preflight-invalidated':'original-revision-changed',
          preparedRevision:draft.prepared_original_revision==null?null:Number(draft.prepared_original_revision),
          currentRevision:Number(base.revision)}));
        throw httpError('Original changed during publication. Retry using the current owner revision.',409,'ST_OWNER_PUBLISH_STALE_01646');
      }
      const updated=await c.query(`UPDATE shifttime_builder_site_projects SET project_json=$1::jsonb,schema_version=$2,revision=revision+1,updated_by_user_id=$3,updated_at=now()
        WHERE site_id=$4 AND revision=$5 RETURNING revision`,[JSON.stringify(draft.project_json),draft.schema_version,userId,sid,base.revision]);
      if(!updated.rowCount)throw httpError('Original changed',409,'ST_OWNER_PUBLISH_STALE_01646');
      await c.query("UPDATE shifttime_builder_site_revisions SET kind='archived',slot=0,updated_at=now() WHERE site_id=$1 AND kind='published'",[sid]);
      const published=await c.query(`UPDATE shifttime_builder_site_revisions SET kind='published',slot=0,dirty=false,published_at=now(),updated_by_user_id=$1,updated_at=now() WHERE site_id=$2 AND id=$3 RETURNING *`,[userId,sid,rid]);
      await saveOwnerHistoryInTransaction01646(c,sid,draft.project_json,{reason:'published',label:'Published',revisionId:rid});
      await c.query('COMMIT');return {...mapRow(published.rows[0],{includeProject:true}),originalSync01623U:{status:'synced',reason:'owner-merged-01646',revision:Number(updated.rows[0].revision)}};
    }
    const plan=planOriginalPromotion01623U({siteId:sid,role:scope.role,confirmed:!!expected,
      canonical:base.project_json,revision:base.revision,previousMatches:base.previous_matches,nextMatches:base.next_matches,reviewed:base.reviewed,project:draft.project_json});
    let originalSync01623U=plan;
    if(plan.status==='sync'){
      const updated=await c.query(`UPDATE shifttime_builder_site_projects SET project_json=$1::jsonb,schema_version=$2,revision=revision+1,updated_by_user_id=$3,updated_at=now() WHERE site_id=$4 AND revision=$5 RETURNING revision`,[JSON.stringify(draft.project_json),draft.schema_version,userId,sid,base.revision]);
      if(!updated.rowCount)throw httpError('Original changed during publication',409,'ST_ORIGINAL_STALE_REVISION_01617');
      originalSync01623U={...plan,status:'synced',revision:Number(updated.rows[0].revision)};
    }
    await c.query(`UPDATE shifttime_builder_site_revisions SET kind='archived',slot=0,updated_at=now() WHERE site_id=$1 AND kind='published'`,[sid]);
    const q=await c.query(`UPDATE shifttime_builder_site_revisions SET kind='published',slot=0,dirty=false,published_at=now(),updated_by_user_id=$1,updated_at=now() WHERE site_id=$2 AND id=$3 RETURNING *`,[userId,sid,rid]);
    await c.query('COMMIT');
    console.info('[ST_ORIGINAL_SYNC_01623U]',JSON.stringify({siteId:sid,revisionId:rid,...originalSync01623U}));
    return {...mapRow(q.rows[0],{includeProject:true}),originalSync01623U};
  }catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}});
}

// No application-level maximum number of draft revisions per site (01613D3).
