// 01490 · Canonical category identity: transactional create-or-find and safe duplicate merge.
// Operates ONLY on the existing authorized commerce_store_snapshots row; no parallel repository.
import crypto from 'node:crypto';
import {withTransaction} from './db.mjs';
import {loadSnapshot} from './commerce-snapshot-service.mjs';
import {text,clone,fail,duplicates,pretty,slug,buildCategoryMergePreview01490} from './marketplace-category-identity-core-01490.mjs';
async function getLocked(client,scope){const q=await client.query('SELECT snapshot,revision FROM commerce_store_snapshots WHERE store_id=$1 FOR UPDATE',[scope.storeId]);if(!q.rowCount)fail('MARKETPLACE_CATEGORY_STORE_NOT_FOUND_01490',404);return {state:clone(q.rows[0].snapshot||{}),revision:Number(q.rows[0].revision)||0};}
async function persist(client,scope,state,revision,event,payload){const nextRevision=revision+1;state.revision=nextRevision;state.updatedAt=new Date().toISOString();await client.query('UPDATE commerce_store_snapshots SET snapshot=$2::jsonb, revision=$3, updated_at=now() WHERE store_id=$1',[scope.storeId,JSON.stringify(state),nextRevision]);await client.query(`INSERT INTO commerce_outbox(account_id,workspace_id,store_id,event_type,aggregate_type,aggregate_id,payload) VALUES($1,$2,$3,$4,'commerce-snapshot',$3,$5::jsonb)`,[scope.accountId,scope.workspaceId,scope.storeId,event,JSON.stringify(payload)]);return nextRevision;}
export async function resolveCategoryPath01490(scope,body={}){
 const parts=Array.isArray(body.parts)?body.parts.map(pretty).filter(Boolean):[];
 if(!parts.length||parts.length>12||parts.some(v=>v.length>160||v.includes('>')))fail('MARKETPLACE_CATEGORY_PATH_INVALID_01490',400);
 return withTransaction(async client=>{const {state,revision}=await getLocked(client,scope),categories=Array.isArray(state.categories)?state.categories:[];let parentId=null,created=0,current=null;
  for(const name of parts){const matches=duplicates(categories,parentId,name);if(matches.length>1)fail('MARKETPLACE_CATEGORY_AMBIGUOUS_01490');if(matches.length){current=matches[0];}
   else {const now=new Date().toISOString();current={id:`cat_${crypto.randomUUID().replace(/-/g,'').slice(0,18)}`,name,slug:slug(name),parentId,status:'active',createdAt:now,updatedAt:now};categories.push(current);created++;}parentId=current.id;}
  if(created){state.categories=categories;await persist(client,scope,state,revision,'commerce.categories.path-resolved.01490',{categoryId:current.id,created});}
  return {stage:'01490',categoryId:current.id,category:clone(current),created,reused:parts.length-created,revision:revision+(created?1:0),path:parts.join(' > ')};
 });
}
export async function previewCategoryMerge01490(scope,body={}){const state=await loadSnapshot(scope);const result=buildCategoryMergePreview01490(state,text(body.keepId),Array.isArray(body.removeIds)?body.removeIds.map(text):[]);const {candidate,...safe}=result;return {...safe,expectedRevision:Number(state.revision)||0};}
export async function executeCategoryMerge01490(scope,body={}){
 return withTransaction(async client=>{const {state,revision}=await getLocked(client,scope);if(!Number.isInteger(body.expectedRevision)||Number(body.expectedRevision)!==revision)fail('MARKETPLACE_CATEGORY_MERGE_STALE_01490');const plan=buildCategoryMergePreview01490(state,text(body.keepId),Array.isArray(body.removeIds)?body.removeIds.map(text):[]);if(!plan.ok)fail('MARKETPLACE_CATEGORY_MERGE_CONFLICT_01490');const nextRevision=await persist(client,scope,plan.candidate,revision,'commerce.categories.merged.01490',{keepId:plan.keepId,removeIds:plan.removeIds,refsChanged:plan.refsChanged});const {candidate,...safe}=plan;return {...safe,revision:nextRevision};});
}
