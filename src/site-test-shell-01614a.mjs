// 01614A · Save only Header/Footer of a server-owned ShiftTime Test draft.
// Deliberately does NOT accept whole project JSON, Main Canvas or commerce data.
import {draftFingerprint01606G} from './site-canvas-draft-service-01606g.mjs';
import {assertTestActor01613D,siteTestError01613D} from './site-test-core-01613d.mjs';

const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const obj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const permitted=Object.freeze(['headerState','headerPageModes','headerGlobalMode','headerHidden','headerTemplateIds','globalStyleStore',
  'footerState','footerPageModes','footerGlobalMode','footerHidden','footerTemplateIds']);
const objectKeys=new Set(['headerState','footerState','headerPageModes','footerPageModes','globalStyleStore']);
const arrayKeys=new Set(['headerTemplateIds','footerTemplateIds']);
const scalarKeys=new Set(['headerGlobalMode','headerHidden','footerGlobalMode','footerHidden']);
const fail=(code,statusCode=400)=>{throw siteTestError01613D(code,statusCode);};
const safeKey=k=>!['__proto__','constructor','prototype'].includes(k);
const guardHtml=s=>!/<\s*(?:script|iframe|object|embed|base|form)\b|\bon[a-z]+\s*=|javascript\s*:|srcdoc\s*=|data\s*:\s*text\/html/i.test(s);
function safeStrings(value,depth=0){
 if(depth>90)fail('ST_TEST_SHELL_INVALID_01614A');
 if(typeof value==='string'){
  if(value.length>800000||!guardHtml(value))fail('ST_TEST_SHELL_UNSAFE_CONTENT_01614A');
  return;
 }
 if(Array.isArray(value)){if(value.length>30000)fail('ST_TEST_SHELL_INVALID_01614A');for(const v of value)safeStrings(v,depth+1);return;}
 if(obj(value)){for(const [k,v] of Object.entries(value)){
  if(!safeKey(k))fail('ST_TEST_SHELL_INVALID_01614A');
  safeStrings(v,depth+1);
 }return;}
 if(value===null||typeof value==='number'||typeof value==='boolean')return;
 fail('ST_TEST_SHELL_INVALID_01614A');
}
export function normalizeSiteTestShell01614A(payload,project){
 if(!obj(payload)||Object.keys(payload).some(k=>!['expectedFingerprint','shell'].includes(k))||
   !/^[a-f0-9]{64}$/.test(payload.expectedFingerprint||'')||!obj(payload.shell)||
   !obj(project?.site)||!obj(project?.storage))fail('ST_TEST_SHELL_INVALID_01614A');
 const keys=Object.keys(payload.shell);
 if(!keys.length||keys.some(k=>!permitted.includes(k)))fail('ST_TEST_SHELL_INVALID_01614A');
 const pageIds=new Set((Array.isArray(project.site.pages)?project.site.pages:[]).map(p=>String(p?.id||'')).filter(Boolean));
 const result={};
 for(const key of keys){
  const value=payload.shell[key];
  if(objectKeys.has(key)&&!obj(value))fail('ST_TEST_SHELL_INVALID_01614A');
  if(arrayKeys.has(key)&&!Array.isArray(value))fail('ST_TEST_SHELL_INVALID_01614A');
  if(scalarKeys.has(key)&&value!==null&&typeof value!=='string')fail('ST_TEST_SHELL_INVALID_01614A');
  if(key==='headerState'||key==='footerState'){
   if(!obj(value.global)||!obj(value.pages)||Object.keys(value).some(k=>!['global','pages'].includes(k))||
     Object.keys(value.pages).some(k=>!safeKey(k)||!pageIds.has(k)))fail('ST_TEST_SHELL_INVALID_01614A');
  }
  if(key==='headerPageModes'||key==='footerPageModes'){
   if(Object.keys(value).some(k=>!safeKey(k)||!pageIds.has(k)))fail('ST_TEST_SHELL_INVALID_01614A');
  }
  if(JSON.stringify(value).length>1200000)fail('ST_TEST_SHELL_TOO_LARGE_01614A',413);
  safeStrings(value);
  result[key]=structuredClone(value);
 }
 return result;
}
export async function saveSiteTestShell01614A(scope,userId,siteId,revisionId,payload,{run=null}={}){
 const execute=run||(await import('./db.mjs')).withClient;
 return execute(async c=>{
  await c.query('BEGIN');
  try{
   const q=await c.query(`SELECT b.*,r.kind revision_kind,r.project_json
     FROM shifttime_site_test_branches_01613d b
     JOIN shifttime_builder_site_revisions r ON r.id=b.revision_id AND r.site_id=b.site_id
     JOIN shifttime_builder_sites s ON s.id=b.site_id
     WHERE b.site_id=$1 AND b.revision_id=$2 AND b.account_id=$3 AND b.workspace_id=$4 AND b.store_id=$5
       AND s.status='active' FOR UPDATE OF b,r`,
    [siteId,revisionId,scope.accountId,scope.workspaceId,scope.storeId]);
   if(!q.rowCount)fail('ST_TEST_DRAFT_REQUIRED_01613D',403);
   const branch=q.rows[0];
   assertTestActor01613D(scope,userId,branch,{write:true});
   if(branch.revision_kind!=='draft'||!['editing','preview'].includes(branch.state))fail('ST_TEST_DRAFT_LOCKED_01614A',409);
   const before=branch.project_json;
   if(draftFingerprint01606G(before)!==payload?.expectedFingerprint)fail('ST_TEST_DRAFT_CONFLICT_01614A',409);
   const shell=normalizeSiteTestShell01614A(payload,before);
   const project=structuredClone(before);
   let changed=false;
   for(const [key,value] of Object.entries(shell)){
    if(JSON.stringify(project.storage[key]??null)!==JSON.stringify(value??null)){
     project.storage[key]=value;changed=true;
    }
   }
   if(changed){
    await c.query(`UPDATE shifttime_builder_site_revisions SET project_json=$1::jsonb,dirty=true,updated_by_user_id=$2,updated_at=now()
      WHERE id=$3 AND site_id=$4 AND kind='draft'`,[JSON.stringify(project),userId,revisionId,siteId]);
    await c.query(`UPDATE shifttime_site_test_branches_01613d SET state='editing',preview_snapshot_sha=NULL,
      candidate_deploy_id=NULL,preview_deploy_id=NULL,preview_url=NULL,submitted_at=NULL,updated_at=now()
      WHERE id=$1`,[branch.id]);
   }
   await c.query('COMMIT');
   return {stage:'01614A',siteId,revisionId,saved:changed,fingerprint:draftFingerprint01606G(project)};
  }catch(error){await c.query('ROLLBACK').catch(()=>{});throw error;}
 });
}
