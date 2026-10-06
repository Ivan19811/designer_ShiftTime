import crypto from 'node:crypto';
import {withClient} from './db.mjs';

export const AI_CONSULTANT_STAGE_01411='01411';
const str=value=>String(value??'').trim();
const bool=(value,fallback=false)=>value===undefined?fallback:Boolean(value);
const MODES=new Set(['assist','recommend']);
function fail(code,statusCode=400){const error=new Error(code);error.code=code;error.statusCode=statusCode;return error;}
function id01411(){return `aic_${crypto.randomUUID().replace(/-/g,'')}`;}
function cleanName(value){return str(value).replace(/\u0000/g,'').slice(0,160);}
function safeSettings(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function rowView(row={}){return {id:row.id||'',siteId:row.siteId||'',enabled:Boolean(row.enabled),name:row.name||'',mode:row.mode||'assist',productSearchEnabled:Boolean(row.productSearchEnabled),discountsEnabled:Boolean(row.discountsEnabled),conversationEnabled:Boolean(row.conversationEnabled),settings:safeSettings(row.settings),createdAt:row.createdAt||null,updatedAt:row.updatedAt||null};}
function defaultView(siteId=''){return {id:'',siteId:str(siteId),enabled:false,name:'',mode:'assist',productSearchEnabled:true,discountsEnabled:false,conversationEnabled:true,settings:{},createdAt:null,updatedAt:null};}
async function assertSite(client,scope,siteId){const id=str(siteId);if(!id)throw fail('AI_CONSULTANT_SITE_REQUIRED_01411');const q=await client.query(`SELECT id,name FROM shifttime_builder_sites WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND status<>'archived' LIMIT 1`,[id,scope.accountId,scope.workspaceId,scope.storeId]);if(!q.rowCount)throw fail('AI_CONSULTANT_SITE_NOT_FOUND_01411',404);return q.rows[0];}
async function selectRow(client,scope,siteId){const q=await client.query(`SELECT id,site_id "siteId",enabled,name,mode,product_search_enabled "productSearchEnabled",discounts_enabled "discountsEnabled",conversation_enabled "conversationEnabled",settings,created_at "createdAt",updated_at "updatedAt" FROM shifttime_ai_consultants WHERE account_id=$1 AND workspace_id=$2 AND store_id=$3 AND site_id=$4 LIMIT 1`,[scope.accountId,scope.workspaceId,scope.storeId,siteId]);return q.rows[0]||null;}

export async function getAiConsultantSettings01411(scope,siteId){return withClient(async client=>{const site=await assertSite(client,scope,siteId);const row=await selectRow(client,scope,site.id);return {stage:AI_CONSULTANT_STAGE_01411,site:{id:site.id,name:site.name||''},item:row?rowView(row):defaultView(site.id)};});}

export async function saveAiConsultantSettings01411(scope,siteId,input={},actorUserId=''){
  return withClient(async client=>{await client.query('BEGIN');try{const site=await assertSite(client,scope,siteId);const existing=await selectRow(client,scope,site.id);const mode=str(input.mode||existing?.mode||'assist');if(!MODES.has(mode))throw fail('AI_CONSULTANT_MODE_INVALID_01411');const item={
      id:existing?.id||id01411(),enabled:bool(input.enabled,existing?.enabled??false),name:cleanName(input.name!==undefined?input.name:existing?.name||''),mode,
      productSearchEnabled:bool(input.productSearchEnabled,existing?.productSearchEnabled??true),discountsEnabled:bool(input.discountsEnabled,existing?.discountsEnabled??false),conversationEnabled:bool(input.conversationEnabled,existing?.conversationEnabled??true),settings:safeSettings(input.settings!==undefined?input.settings:existing?.settings||{})
    };
    await client.query(`INSERT INTO shifttime_ai_consultants(id,account_id,workspace_id,store_id,site_id,enabled,name,mode,product_search_enabled,discounts_enabled,conversation_enabled,settings,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$13) ON CONFLICT(store_id,site_id) DO UPDATE SET enabled=EXCLUDED.enabled,name=EXCLUDED.name,mode=EXCLUDED.mode,product_search_enabled=EXCLUDED.product_search_enabled,discounts_enabled=EXCLUDED.discounts_enabled,conversation_enabled=EXCLUDED.conversation_enabled,settings=EXCLUDED.settings,updated_by=EXCLUDED.updated_by,updated_at=now()`,[item.id,scope.accountId,scope.workspaceId,scope.storeId,site.id,item.enabled,item.name,item.mode,item.productSearchEnabled,item.discountsEnabled,item.conversationEnabled,JSON.stringify(item.settings),str(actorUserId)||null]);
    const row=await selectRow(client,scope,site.id);await client.query('COMMIT');return {stage:AI_CONSULTANT_STAGE_01411,site:{id:site.id,name:site.name||''},item:rowView(row)};
  }catch(error){await client.query('ROLLBACK');throw error;}});
}
