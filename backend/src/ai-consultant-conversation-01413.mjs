import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {searchAiProductDocuments01412} from './ai-consultant-product-query-core-01412.mjs';
import {AI_CONSULTANT_CONVERSATION_STAGE_01413,buildAiConsultantResponseCode01413,mergeAiProductQueryContext01413} from './ai-consultant-conversation-core-01413.mjs';
import {assertAiConsultantSiteConfig01413,loadAiConsultantStoreProducts01413} from './ai-consultant-store-catalog-01413.mjs';
import {loadAiConsultantSalesRules01415,attachAiConsultantSalesOffers01415,salesOfferSummary01415} from './ai-consultant-sales-rules-01415.mjs';

const str=value=>String(value??'').trim();
function fail(code,statusCode=400){const error=new Error(code);error.code=code;error.statusCode=statusCode;return error;}
const id=(prefix)=>`${prefix}_${crypto.randomUUID().replace(/-/g,'')}`;
const safeObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
async function findSession(client,scope,siteId,sessionId){
  const sid=str(sessionId);if(!sid)return null;
  const q=await client.query(`SELECT id,consultant_id "consultantId",site_id "siteId",channel,status,context,created_at "createdAt",updated_at "updatedAt",last_activity_at "lastActivityAt" FROM shifttime_ai_consultant_sessions WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND site_id=$5 LIMIT 1`,[sid,scope.accountId,scope.workspaceId,scope.storeId,siteId]);
  if(!q.rowCount)throw fail('AI_CONSULTANT_SESSION_NOT_FOUND_01413',404);if(q.rows[0].status!=='active')throw fail('AI_CONSULTANT_SESSION_CLOSED_01413',409);return q.rows[0];
}
async function createSession(client,scope,site,actorUserId){
  const sessionId=id('aics');await client.query(`INSERT INTO shifttime_ai_consultant_sessions(id,consultant_id,account_id,workspace_id,store_id,site_id,channel,status,context,created_by) VALUES($1,$2,$3,$4,$5,$6,'builder-preview','active','{}'::jsonb,$7)`,[sessionId,site.consultantId,scope.accountId,scope.workspaceId,scope.storeId,site.id,str(actorUserId)||null]);return {id:sessionId,consultantId:site.consultantId,siteId:site.id,channel:'builder-preview',status:'active',context:{}};
}
async function listTurns(client,sessionId){const q=await client.query(`SELECT id,role,message,response_code "responseCode",query_plan "queryPlan",result_summary "resultSummary",created_at "createdAt" FROM shifttime_ai_consultant_turns WHERE session_id=$1 ORDER BY created_at,id LIMIT 80`,[sessionId]);return q.rows;}
async function addTurn(client,sessionId,{role,message='',responseCode='',queryPlan={},resultSummary={}}){await client.query(`INSERT INTO shifttime_ai_consultant_turns(id,session_id,role,message,response_code,query_plan,result_summary) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)`,[id('aict'),sessionId,role,str(message).slice(0,4000),str(responseCode),JSON.stringify(safeObject(queryPlan)),JSON.stringify(safeObject(resultSummary))]);}
export async function queryAiConsultantConversation01413(scope,siteId,input={},actorUserId=''){
  return withClient(async client=>{await client.query('BEGIN');try{
    const site=await assertAiConsultantSiteConfig01413(client,scope,siteId,{productSearch:true,conversation:true});const message=str(input?.message).slice(0,1200);if(!message)throw fail('AI_CONSULTANT_QUERY_REQUIRED_01413');
    let session=await findSession(client,scope,site.id,input?.sessionId);if(!session)session=await createSession(client,scope,site,actorUserId);
    const previous=safeObject(session.context).productQueryPlan;const plan=mergeAiProductQueryContext01413(previous,message);const documents=await loadAiConsultantStoreProducts01413(client,scope);const result=searchAiProductDocuments01412(documents,plan);const salesRules=site.discountsEnabled?await loadAiConsultantSalesRules01415(client,scope,site.id):[];const items=attachAiConsultantSalesOffers01415(result.items,salesRules,{discountsEnabled:Boolean(site.discountsEnabled)});const offerSummary=salesOfferSummary01415(items);
    const summary={storeProducts:documents.length,matched:result.total,returned:items.length,...offerSummary};const responseCode=offerSummary.offeredProducts>0?'products_found_with_offer':buildAiConsultantResponseCode01413(result);
    await addTurn(client,session.id,{role:'user',message,queryPlan:plan,resultSummary:summary});await addTurn(client,session.id,{role:'assistant',responseCode,queryPlan:plan,resultSummary:summary});
    const nextContext={...safeObject(session.context),productQueryPlan:plan,lastResponseCode:responseCode,lastResultIds:items.map(item=>item.id).filter(Boolean).slice(0,24)};
    await client.query(`UPDATE shifttime_ai_consultant_sessions SET context=$2::jsonb,updated_at=now(),last_activity_at=now() WHERE id=$1`,[session.id,JSON.stringify(nextContext)]);
    const turns=await listTurns(client,session.id);await client.query('COMMIT');return {stage:AI_CONSULTANT_CONVERSATION_STAGE_01413,site:{id:site.id,name:site.name||''},session:{id:session.id,status:'active',channel:'builder-preview'},plan,summary,items,response:{code:responseCode,vars:{count:result.total,discount:offerSummary.bestDiscount}},turns};
  }catch(error){await client.query('ROLLBACK');throw error;}});
}
