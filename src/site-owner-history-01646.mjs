import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {nextOwnerHistorySlot01646} from './site-owner-merge-01646.mjs';
const str=v=>String(v??'').trim();
const err=(code,message,statusCode=409)=>Object.assign(new Error(message),{code,statusCode});
async function assertOwner(c,scope,siteId){
 if(scope?.role!=='owner')throw err('ST_HISTORY_OWNER_REQUIRED_01646','Історія доступна лише власнику.',403);
 const q=await c.query(`SELECT p.project_json,p.revision,p.schema_version FROM shifttime_builder_sites s JOIN shifttime_builder_site_projects p ON p.site_id=s.id WHERE s.account_id=$1 AND s.workspace_id=$2 AND s.store_id=$3 AND s.id=$4 AND s.status<>'archived'`,[scope.accountId,scope.workspaceId,scope.storeId,siteId]);
 if(!q.rowCount)throw err('ST_HISTORY_SITE_NOT_FOUND_01646','Сайт не знайдено.',404);
 return q.rows[0];
}
export async function saveOwnerHistoryInTransaction01646(c,siteId,project,{reason='saved',label='',revisionId=''}={}){
 const sid=str(siteId);
 if(str(project?.site?.id)!==sid||!project?.storage?.pageSnapshots)throw err('ST_HISTORY_PROJECT_INVALID_01646','Неповна редакція сайту.');
 const q=await c.query('SELECT slot FROM shifttime_builder_site_history_01646 WHERE site_id=$1 ORDER BY slot FOR UPDATE',[sid]);
 const slot=nextOwnerHistorySlot01646(q.rows.map(r=>r.slot));
 const row=await c.query(`INSERT INTO shifttime_builder_site_history_01646(site_id,slot,label,reason,source_revision_id,project_json)
 VALUES ($1,$2,$3,$4,$5,$6::jsonb)
 ON CONFLICT (site_id,slot) DO UPDATE SET label=EXCLUDED.label,reason=EXCLUDED.reason,
  source_revision_id=EXCLUDED.source_revision_id,project_json=EXCLUDED.project_json,saved_at=now()
 RETURNING id,slot,label,reason,source_revision_id,saved_at`,[sid,slot,str(label).slice(0,120),reason,str(revisionId)||null,JSON.stringify(project)]);
 return {slot:Number(row.rows[0].slot),label:row.rows[0].label,reason:row.rows[0].reason,savedAt:new Date(row.rows[0].saved_at).toISOString()};
}
export async function listOwnerHistory01646(scope,siteId){const sid=str(siteId);return withClient(async c=>{
 await assertOwner(c,scope,sid);const q=await c.query('SELECT slot,label,reason,source_revision_id,saved_at FROM shifttime_builder_site_history_01646 WHERE site_id=$1 ORDER BY slot DESC',[sid]);
 return q.rows.map(r=>({slot:Number(r.slot),label:r.label,reason:r.reason,sourceRevisionId:r.source_revision_id,savedAt:new Date(r.saved_at).toISOString()}));});}
export async function saveOwnerHistory01646(scope,siteId,userId,revisionId,{reason='saved'}={}){const sid=str(siteId),rid=str(revisionId);
 if(!['saved'].includes(reason))throw err('ST_HISTORY_REASON_INVALID_01646','Некоректна дія.');
 return withClient(async c=>{await c.query('BEGIN');try{
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[sid]);await assertOwner(c,scope,sid);
  const row=await c.query("SELECT project_json,created_by_user_id,kind FROM shifttime_builder_site_revisions WHERE site_id=$1 AND id=$2 FOR UPDATE",[sid,rid]);
  if(!row.rowCount||row.rows[0].kind!=='draft'||str(row.rows[0].created_by_user_id)!==str(userId))throw err('ST_HISTORY_DRAFT_REQUIRED_01646','Спочатку збережи свою робочу редакцію.');
  const result=await saveOwnerHistoryInTransaction01646(c,sid,row.rows[0].project_json,{reason:'saved',label:'Збережено',revisionId:rid});
  await c.query('COMMIT');return result;
 }catch(e){await c.query('ROLLBACK');throw e;}});}
export async function restoreOwnerHistory01646(scope,siteId,userId,slot){const sid=str(siteId),n=Number(slot);
 if(!Number.isInteger(n)||n<1||n>50)throw err('ST_HISTORY_SLOT_INVALID_01646','Невідома редакція.');
 return withClient(async c=>{await c.query('BEGIN');try{
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[sid]);const canonical=await assertOwner(c,scope,sid);
  const history=await c.query('SELECT project_json FROM shifttime_builder_site_history_01646 WHERE site_id=$1 AND slot=$2',[sid,n]);
  if(!history.rowCount)throw err('ST_HISTORY_NOT_FOUND_01646','Редакція не знайдена.',404);
  const project=history.rows[0].project_json;
  if(str(project?.site?.id)!==sid)throw err('ST_HISTORY_PROJECT_INVALID_01646','Редакція не належить сайту.');
  const slots=await c.query("SELECT slot FROM shifttime_builder_site_revisions WHERE site_id=$1 AND kind='draft' FOR UPDATE",[sid]);
  const used=new Set(slots.rows.map(r=>Number(r.slot)));let draftSlot=1;while(used.has(draftSlot))draftSlot++;
  const id=`rev_${crypto.randomUUID().replaceAll('-','')}`;
  const q=await c.query(`INSERT INTO shifttime_builder_site_revisions(id,site_id,kind,slot,label,comment,schema_version,project_json,dirty,created_by_user_id,updated_by_user_id,base_original_project_json,base_original_revision)
  VALUES($1,$2,'draft',$3,$4,'', $5,$6::jsonb,false,$7,$7,$8::jsonb,$9) RETURNING *`,[id,sid,draftSlot,`Відновлено №${n}`,str(project.version||canonical.schema_version||'01231'),JSON.stringify(project),userId,JSON.stringify(canonical.project_json),canonical.revision]);
  await c.query('COMMIT');return {id:q.rows[0].id,siteId:sid,kind:'draft',slot:Number(q.rows[0].slot),label:q.rows[0].label,createdByUserId:userId};
 }catch(e){await c.query('ROLLBACK');throw e;}});}
