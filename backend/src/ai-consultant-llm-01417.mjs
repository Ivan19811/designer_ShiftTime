import crypto from 'node:crypto';
import {config} from './config.mjs';
import {withClient} from './db.mjs';
import {aiConsultantFreeConsultationSettings01417,buildAiConsultantGrounding01417,buildAiConsultantInstructions01417,buildAiConsultantInput01417,extractAiConsultantResponseText01417,usageFromAiConsultantResponse01417} from './ai-consultant-llm-core-01417.mjs';

export const AI_CONSULTANT_LLM_STAGE_01417='01417';
const str=value=>String(value??'').trim();
const safeObject=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const id=prefix=>`${prefix}_${crypto.randomUUID().replace(/-/g,'')}`;
function fail(code,statusCode=400){const error=new Error(code);error.code=code;error.statusCode=statusCode;return error;}

export function aiConsultantLlmProviderStatus01417(){return {stage:AI_CONSULTANT_LLM_STAGE_01417,provider:'openai',configured:Boolean(config.aiConsultantOpenAiApiKey),model:config.aiConsultantLlmModel,timeoutMs:config.aiConsultantLlmTimeoutMs,maxOutputTokens:config.aiConsultantLlmMaxOutputTokens};}

async function audit01417(client,{scope={},site={},sessionId='',status='skipped',responseId='',inputChars=0,outputChars=0,usage={},latencyMs=0,errorCode=''}={}){
  if(!site?.consultantId)return;
  if(!client)return withClient(next=>audit01417(next,{scope,site,sessionId,status,responseId,inputChars,outputChars,usage,latencyMs,errorCode}));
  await client.query(`INSERT INTO shifttime_ai_consultant_llm_runs(id,consultant_id,session_id,account_id,workspace_id,store_id,site_id,provider,model,status,response_id,input_chars,output_chars,input_tokens,output_tokens,total_tokens,latency_ms,error_code) VALUES($1,$2,$3,$4,$5,$6,$7,'openai',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,[id('aillm'),site.consultantId,str(sessionId)||null,scope.accountId,scope.workspaceId,scope.storeId,site.id,config.aiConsultantLlmModel,status,str(responseId),Math.max(0,inputChars|0),Math.max(0,outputChars|0),Math.max(0,Number(usage.inputTokens)||0),Math.max(0,Number(usage.outputTokens)||0),Math.max(0,Number(usage.totalTokens)||0),Math.max(0,latencyMs|0),str(errorCode).slice(0,160)]);
}

export async function getAiConsultantLlmStatus01417(scope,siteId){
  const sid=str(siteId);if(!sid)throw fail('AI_CONSULTANT_SITE_REQUIRED_01417');
  return withClient(async client=>{const q=await client.query(`SELECT s.id,s.name,c.id "consultantId",c.settings FROM shifttime_builder_sites s LEFT JOIN shifttime_ai_consultants c ON c.site_id=s.id AND c.account_id=s.account_id AND c.workspace_id=s.workspace_id AND c.store_id=s.store_id WHERE s.id=$1 AND s.account_id=$2 AND s.workspace_id=$3 AND s.store_id=$4 AND s.status<>'archived' LIMIT 1`,[sid,scope.accountId,scope.workspaceId,scope.storeId]);if(!q.rowCount)throw fail('AI_CONSULTANT_SITE_NOT_FOUND_01417',404);const row=q.rows[0],settings=aiConsultantFreeConsultationSettings01417(row.settings);return {...aiConsultantLlmProviderStatus01417(),site:{id:row.id,name:row.name||''},consultantConfigured:Boolean(row.consultantId),freeConsultationEnabled:settings.enabled};});
}

export async function generateAiConsultantReply01417({client,scope={},site={},sessionId='',message='',turns=[],items=[],plan={},summary={}}={}){
  const settings=aiConsultantFreeConsultationSettings01417(site?.settings);if(!settings.enabled)return {used:false,status:'disabled',message:''};
  const provider=aiConsultantLlmProviderStatus01417();if(!provider.configured){await audit01417(client,{scope,site,sessionId,status:'skipped',errorCode:'AI_CONSULTANT_LLM_NOT_CONFIGURED_01417'});return {used:false,status:'unconfigured',message:''};}
  const groundedItems=(Array.isArray(items)?items:[]).slice(0,settings.maxCatalogItems),grounding=buildAiConsultantGrounding01417({site,consultant:{name:site.consultantName||site.name||''},plan,summary,items:groundedItems});
  const input=buildAiConsultantInput01417({message,turns,grounding,maxHistoryTurns:settings.maxHistoryTurns});
  const body={model:provider.model,instructions:buildAiConsultantInstructions01417(),input,max_output_tokens:provider.maxOutputTokens,store:false};
  const inputChars=JSON.stringify(body).length,start=Date.now(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),provider.timeoutMs);
  try{
    const response=await fetch(`${config.aiConsultantOpenAiBaseUrl}/responses`,{method:'POST',headers:{authorization:`Bearer ${config.aiConsultantOpenAiApiKey}`,'content-type':'application/json',accept:'application/json'},body:JSON.stringify(body),signal:controller.signal});
    const data=await response.json().catch(()=>({}));const latencyMs=Date.now()-start;
    if(!response.ok){const code=str(data?.error?.code||data?.error?.type)||`HTTP_${response.status}`;await audit01417(client,{scope,site,sessionId,status:'failed',responseId:data?.id,inputChars,latencyMs,errorCode:code});return {used:false,status:'failed',message:'',errorCode:code};}
    const text=extractAiConsultantResponseText01417(data),usage=usageFromAiConsultantResponse01417(data);if(!text){await audit01417(client,{scope,site,sessionId,status:'failed',responseId:data?.id,inputChars,usage,latencyMs,errorCode:'AI_CONSULTANT_LLM_EMPTY_RESPONSE_01417'});return {used:false,status:'failed',message:'',errorCode:'AI_CONSULTANT_LLM_EMPTY_RESPONSE_01417'};}
    await audit01417(client,{scope,site,sessionId,status:'completed',responseId:data?.id,inputChars,outputChars:text.length,usage,latencyMs});return {used:true,status:'completed',message:text,model:provider.model,usage};
  }catch(error){const latencyMs=Date.now()-start,code=error?.name==='AbortError'?'AI_CONSULTANT_LLM_TIMEOUT_01417':'AI_CONSULTANT_LLM_REQUEST_FAILED_01417';await audit01417(client,{scope,site,sessionId,status:'failed',inputChars,latencyMs,errorCode:code}).catch(()=>{});return {used:false,status:'failed',message:'',errorCode:code};}finally{clearTimeout(timer);}
}
