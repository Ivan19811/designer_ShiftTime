import crypto from 'node:crypto';
import {withClient} from './db.mjs';

const clean=v=>String(v??'').trim();
const clone=v=>v==null?v:structuredClone(v);
const MAX_DRAFTS_01231=5;
function httpError(message,statusCode=400,code='ST_SITE_REVISION_INVALID'){const e=new Error(message);e.statusCode=statusCode;e.code=code;return e;}
function projectValue(value){return value&&typeof value==='object'&&!Array.isArray(value)?clone(value):{};}
function mapRow(row,{includeProject=false}={}){if(!row)return null;const out={
  id:clean(row.id),siteId:clean(row.site_id),kind:clean(row.kind),slot:Number(row.slot||0),label:clean(row.label),schemaVersion:clean(row.schema_version)||'01231',dirty:row.dirty===true,sourceRevisionId:clean(row.source_revision_id),
  createdAt:row.created_at?new Date(row.created_at).toISOString():null,updatedAt:row.updated_at?new Date(row.updated_at).toISOString():null,publishedAt:row.published_at?new Date(row.published_at).toISOString():null,
};if(includeProject)out.project=projectValue(row.project_json);return out;}
async function assertSite(c,scope,siteId){const q=await c.query(`SELECT s.id,p.project_json,p.schema_version FROM shifttime_builder_sites s LEFT JOIN shifttime_builder_site_projects p ON p.site_id=s.id WHERE s.account_id=$1 AND s.workspace_id=$2 AND s.store_id=$3 AND s.id=$4 AND s.status<>'archived' LIMIT 1`,[scope.accountId,scope.workspaceId,scope.storeId,siteId]);if(!q.rowCount)throw httpError('Builder site not found',404,'ST_BUILDER_SITE_NOT_FOUND');return q.rows[0];}
function revisionId(){return `rev_${crypto.randomUUID().replaceAll('-','')}`;}
function smallestFreeSlot(rows){const used=new Set(rows.map(r=>Number(r.slot||0)).filter(n=>n>=1&&n<=MAX_DRAFTS_01231));for(let i=1;i<=MAX_DRAFTS_01231;i++)if(!used.has(i))return i;return 0;}

export async function listSiteRevisions01231(scope,siteId=''){
  return withClient(async c=>{const params=[scope.accountId,scope.workspaceId,scope.storeId];let where=`s.account_id=$1 AND s.workspace_id=$2 AND s.store_id=$3 AND r.kind IN ('draft','published')`;if(clean(siteId)){params.push(clean(siteId));where+=` AND s.id=$4`;}
    const q=await c.query(`SELECT r.* FROM shifttime_builder_site_revisions r JOIN shifttime_builder_sites s ON s.id=r.site_id WHERE ${where} ORDER BY r.site_id, CASE WHEN r.kind='published' THEN 0 ELSE 1 END, r.slot, r.updated_at DESC`,params);return q.rows.map(r=>mapRow(r));});
}

export async function getSiteRevision01231(scope,siteId,revisionIdValue){
  const sid=clean(siteId),rid=clean(revisionIdValue);return withClient(async c=>{await assertSite(c,scope,sid);const q=await c.query(`SELECT * FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2 AND kind IN ('draft','published') LIMIT 1`,[sid,rid]);if(!q.rowCount)throw httpError('Site revision not found',404,'ST_SITE_REVISION_NOT_FOUND');return mapRow(q.rows[0],{includeProject:true});});
}

export async function createSiteDraft01231(scope,userId,siteId,input={}){
  const sid=clean(siteId);return withClient(async c=>{await c.query('BEGIN');try{await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[sid]);const site=await assertSite(c,scope,sid);const drafts=await c.query(`SELECT id,slot FROM shifttime_builder_site_revisions WHERE site_id=$1 AND kind='draft' ORDER BY slot FOR UPDATE`,[sid]);if(drafts.rowCount>=MAX_DRAFTS_01231)throw httpError('Draft revision limit reached',409,'ST_SITE_REVISION_LIMIT');const slot=smallestFreeSlot(drafts.rows);if(!slot)throw httpError('Draft revision limit reached',409,'ST_SITE_REVISION_LIMIT');
      let sourceProject=null,sourceRevisionId='';const requestedSource=clean(input.sourceRevisionId);if(requestedSource){const q=await c.query(`SELECT id,project_json FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2 AND kind IN ('draft','published') LIMIT 1`,[sid,requestedSource]);if(!q.rowCount)throw httpError('Source revision not found',404,'ST_SITE_REVISION_SOURCE_NOT_FOUND');sourceProject=projectValue(q.rows[0].project_json);sourceRevisionId=clean(q.rows[0].id);}else if(input.project&&typeof input.project==='object'){sourceProject=projectValue(input.project);}else{sourceProject=projectValue(site.project_json);}
      const id=revisionId(),schemaVersion=clean(input.schemaVersion||sourceProject?.version||site.schema_version)||'01231',label=clean(input.label),dirty=input.dirty===true;
      const q=await c.query(`INSERT INTO shifttime_builder_site_revisions(id,site_id,kind,slot,label,schema_version,project_json,dirty,source_revision_id,created_by_user_id,updated_by_user_id) VALUES($1,$2,'draft',$3,$4,$5,$6::jsonb,$7,$8,$9,$9) RETURNING *`,[id,sid,slot,label,schemaVersion,JSON.stringify(sourceProject),dirty,sourceRevisionId||null,userId]);await c.query('COMMIT');return mapRow(q.rows[0],{includeProject:true});
    }catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}});
}

export async function saveSiteDraft01231(scope,userId,siteId,revisionIdValue,input={}){
  const sid=clean(siteId),rid=clean(revisionIdValue);return withClient(async c=>{await c.query('BEGIN');try{await assertSite(c,scope,sid);const q=await c.query(`UPDATE shifttime_builder_site_revisions SET project_json=$1::jsonb,schema_version=$2,label=COALESCE(NULLIF($3,''),label),dirty=$4,updated_by_user_id=$5,updated_at=now() WHERE site_id=$6 AND id=$7 AND kind='draft' RETURNING *`,[JSON.stringify(projectValue(input.project)),clean(input.schemaVersion||input.project?.version)||'01231',clean(input.label),input.dirty!==false,userId,sid,rid]);if(!q.rowCount)throw httpError('Draft revision not found',404,'ST_SITE_REVISION_NOT_FOUND');await c.query('COMMIT');return mapRow(q.rows[0],{includeProject:true});}catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}});
}

export async function deleteSiteDraft01231(scope,siteId,revisionIdValue){
  const sid=clean(siteId),rid=clean(revisionIdValue);return withClient(async c=>{await c.query('BEGIN');try{await assertSite(c,scope,sid);const q=await c.query(`DELETE FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2 AND kind='draft' RETURNING id,slot`,[sid,rid]);if(!q.rowCount)throw httpError('Draft revision not found',404,'ST_SITE_REVISION_NOT_FOUND');await c.query('COMMIT');return {deleted:true,id:clean(q.rows[0].id),slot:Number(q.rows[0].slot||0)};}catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}});
}

export async function publishSiteRevision01231(scope,userId,siteId,revisionIdValue){
  const sid=clean(siteId),rid=clean(revisionIdValue);return withClient(async c=>{await c.query('BEGIN');try{await assertSite(c,scope,sid);const d=await c.query(`SELECT * FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2 AND kind='draft' FOR UPDATE`,[sid,rid]);if(!d.rowCount)throw httpError('Draft revision not found',404,'ST_SITE_REVISION_NOT_FOUND');await c.query(`UPDATE shifttime_builder_site_revisions SET kind='archived',slot=0,updated_at=now() WHERE site_id=$1 AND kind='published'`,[sid]);const q=await c.query(`UPDATE shifttime_builder_site_revisions SET kind='published',slot=0,dirty=false,published_at=now(),updated_by_user_id=$1,updated_at=now() WHERE site_id=$2 AND id=$3 RETURNING *`,[userId,sid,rid]);await c.query('COMMIT');return mapRow(q.rows[0],{includeProject:true});}catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}});
}

export const SITE_REVISION_LIMIT_01231=MAX_DRAFTS_01231;
