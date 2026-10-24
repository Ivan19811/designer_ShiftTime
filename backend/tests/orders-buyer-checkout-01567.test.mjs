import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {validateBuyerPlacement01567,placeBuyerOrder01567,buyerOrderStatus01567} from '../src/orders-buyer-checkout-01567.mjs';
const token=randomBytes(32).toString('base64url');
const input=()=>({token,requestId:randomUUID(),confirmPlacement:true,acceptEstimatedShipping:true});
const failure=(fn,code)=>assert.throws(fn,e=>e.code===code);
test('01567 rejects unexpected prices, missing consent, malformed tokens and invalid idempotency ids',()=>{
 assert.equal(validateBuyerPlacement01567(input()).hash.length,64);
 failure(()=>validateBuyerPlacement01567({...input(),total:0}),'BUYER_CHECKOUT_CONSENT_REQUIRED_01567');
 failure(()=>validateBuyerPlacement01567({...input(),confirmPlacement:false}),'BUYER_CHECKOUT_CONSENT_REQUIRED_01567');
 failure(()=>validateBuyerPlacement01567({...input(),requestId:'123'}),'BUYER_CHECKOUT_CONSENT_REQUIRED_01567');
 failure(()=>validateBuyerPlacement01567({...input(),token:'bad'}),'BUYER_CHECKOUT_LINK_INVALID_01567');
});
test('01567 link lookup is always first and fake link cannot create an order',async()=>{
 const queries=[];const transaction=async(fn)=>fn({query:async(sql)=>{queries.push(sql);return {rowCount:0,rows:[]};}});
 await assert.rejects(placeBuyerOrder01567(input(),{transaction}),e=>e.code==='BUYER_CHECKOUT_LINK_INVALID_01567');
 assert.equal(queries.length,1);assert.match(queries[0],/WHERE token_hash=\$1/);
});
test('01567 locks the draft before looking up accepted quote, and refuses expired proposal',async()=>{
 const queries=[];const db={query:async(sql)=>{
  queries.push(sql);
  if(sql.includes('SELECT draft_id,store_id'))return {rowCount:1,rows:[{draft_id:'orderdraft_'+ 'a'.repeat(32),store_id:'store-1'}]};
  if(sql.startsWith('SELECT id FROM shifttime_checkout_drafts_01554'))return {rowCount:1,rows:[{id:'orderdraft_'+ 'a'.repeat(32)}]};
  return {rowCount:1,rows:[{store_id:'store-1',draft_id:'orderdraft_'+ 'a'.repeat(32),revoked_at:null,accepted_at:null,expires_at:new Date(Date.now()+100_000).toISOString()}]};
 }};
 await assert.rejects(placeBuyerOrder01567(input(),{transaction:fn=>fn(db)}),e=>e.code==='BUYER_CHECKOUT_OFFER_EXPIRED_01567');
 assert.match(queries[1],/FOR UPDATE/);assert.match(queries[2],/FOR UPDATE OF o,r,q,c/);
});
test('01567 order-status reveals only a bounded read of accepted order',async()=>{
 const q=[];const lookup=async fn=>fn({query:async(sql)=>{q.push(sql);if(q.length===1)return {rowCount:1,rows:[{id:randomUUID(),store_id:'store-1',draft_id:'orderdraft_'+ 'a'.repeat(32),expires_at:new Date(Date.now()+100_000).toISOString(),revoked_at:null}]};return {rowCount:0,rows:[]};}});
 const result=await buyerOrderStatus01567(token,{lookup});assert.equal(result.found,false);assert.equal(result.stage,'01567');assert.equal(q.length,2);
});
test('01567 buyer endpoint uses no browser-provided price and is outside administrator auth',async()=>{
 const {readFileSync}=await import('node:fs');const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 const pre=server.indexOf("p[4]==='checkout'"),auth=server.indexOf('const session=await authenticateRequest(req)');assert.ok(pre>0&&pre<auth);
 assert.match(server,/enforceOfferRate01564\(requestClientAddress01414\(req\)\)/);
 const production=readFileSync(new URL('../src/orders-buyer-checkout-01567.mjs',import.meta.url),'utf8');
 assert.match(production,/validateProductionSnapshot01566/);assert.match(production,/FOR UPDATE/);assert.match(production,/placement_channel/);
 assert.doesNotMatch(production,/console\.log/);
});
