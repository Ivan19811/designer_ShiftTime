import test from 'node:test';
import assert from 'node:assert/strict';
import {REVIEW_PRIORITIES_01561,validatePriority01561,validateNote01561,noteKey01561,sealNote01561,unsealNote01561,setReviewPriority01561,createReviewNote01561,getReviewActivity01561} from '../src/orders-review-manager-01561.mjs';
import {parseReviewList01558,listReviewOrders01558} from '../src/orders-review-read-01558.mjs';
const draft='orderdraft_'+'a'.repeat(32),scope={storeId:'s-1',accountId:'a-1',workspaceId:'w-1',userId:'u-owner',role:'owner'},editor={...scope,role:'editor'};
const key=noteKey01561({SHIFTTIME_CHECKOUT_PII_KEY:'f'.repeat(64)});
test('01561 strict priority, bounded note and role contracts',()=>{
 assert.deepEqual(REVIEW_PRIORITIES_01561,['low','normal','high','urgent']);
 assert.deepEqual(validatePriority01561({priority:'urgent',revision:0}),{priority:'urgent',revision:0});
 for(const bad of [{priority:'paid',revision:0},{priority:'urgent',revision:1,createOrder:true},{priority:'high',revision:'0'}])assert.throws(()=>validatePriority01561(bad));
 assert.equal(validateNote01561({text:' internal text \r\nline 2 '}),'internal text \nline 2');
 for(const bad of [{text:''},{text:'x'},{text:'x'.repeat(1201)},{text:'hello\0world'},{text:'okay',recipientPhone:'12345'}])assert.throws(()=>validateNote01561(bad));
});
test('01561 AES-256-GCM domain separated, draft/store-bound at rest; no plaintext in SQL',()=>{
 const sealed=sealNote01561('Private internal sample',scope,draft,key);
 assert.equal(unsealNote01561({iv_b64:sealed.iv,ciphertext_b64:sealed.ciphertext,tag_b64:sealed.tag},scope,draft,key),'Private internal sample');
 assert.equal(JSON.stringify(sealed).includes('Private internal sample'),false);
 assert.throws(()=>unsealNote01561({iv_b64:sealed.iv,ciphertext_b64:sealed.ciphertext,tag_b64:sealed.tag},{...scope,storeId:'s-other'},draft,key));
 assert.throws(()=>unsealNote01561({iv_b64:sealed.iv,ciphertext_b64:sealed.ciphertext,tag_b64:sealed.tag},scope,'orderdraft_'+'b'.repeat(32),key));
 assert.throws(()=>noteKey01561({}),/KEY_01561/);
});
test('01561 priority update locks draft, checks version and appends audit; no payment or checkout mutation',async()=>{
 const calls=[];const query=async(sql,args)=>{calls.push({sql,args});if(sql.startsWith('SELECT r.draft_id'))return {rowCount:1,rows:[{draft_id:draft}]};if(sql.startsWith('SELECT priority,version'))return {rowCount:0,rows:[]};return {rowCount:1,rows:[]};};
 const out=await setReviewPriority01561(scope,draft,{priority:'urgent',revision:0},{transaction:fn=>fn({query})});
 assert.equal(out.priority,'urgent');assert.equal(out.revision,1);assert.equal(calls.length,4);assert.deepEqual(calls[0].args,[draft,'s-1','a-1','w-1']);assert.match(calls[0].sql,/FOR UPDATE OF r/);assert.match(calls[3].sql,/priority_audit_01561/);
 assert.doesNotMatch(calls.map(c=>c.sql).join(' '),/UPDATE shifttime_checkout|waybill|crm_outbox|payments|inventory_reservations/i);
 await assert.rejects(()=>setReviewPriority01561(editor,draft,{priority:'urgent',revision:0},{transaction:fn=>fn({query})}),/FORBIDDEN_01561/);
});
test('01561 stale priority revision and cross-store ownership prevent modification',async()=>{
 let calls=0;const q=async(sql)=>{calls++;if(sql.startsWith('SELECT r.draft_id'))return {rowCount:1,rows:[{}]};return {rowCount:1,rows:[{priority:'high',version:3}]};};
 await assert.rejects(()=>setReviewPriority01561(scope,draft,{priority:'urgent',revision:2},{transaction:fn=>fn({query:q})}),/CONFLICT_01561/);assert.equal(calls,2);
 await assert.rejects(()=>setReviewPriority01561(scope,draft,{priority:'urgent',revision:2},{transaction:fn=>fn({query:async()=>({rowCount:0,rows:[]})})}),/NOT_FOUND_01561/);
});
test('01561 notes persist ciphertext and audited metadata, not raw text',async()=>{
 const calls=[];const query=async(sql,args)=>{calls.push({sql,args});if(sql.startsWith('SELECT r.draft_id'))return {rowCount:1,rows:[{}]};return {rowCount:1,rows:[{id:13,created_at:'2026-10-24T00:00:00Z'}]};};
 const out=await createReviewNote01561(scope,draft,{text:'Call supplier first'},{transaction:fn=>fn({query}),keyProvider:()=>key});
 assert.equal(out.noteId,13);assert.equal(out.previewOnly,true);assert.equal(calls.length,2);assert.equal(JSON.stringify(calls).includes('Call supplier first'),false);assert.match(calls[1].sql,/notes_01561/);
});
test('01561 activity includes scoped workflow, priority and decrypted internal notes only',async()=>{
 const encrypted=sealNote01561('Check packaging details',scope,draft,key);const calls=[];
 const lookup=async fn=>fn({query:async(sql,args)=>{calls.push({sql,args});if(sql.startsWith('SELECT r.draft_id'))return {rowCount:1,rows:[{}]};if(sql.startsWith('SELECT priority,version'))return {rows:[{priority:'high',version:2}]};if(sql.includes('priority_audit_01561'))return {rows:[{id:1,previous_priority:'normal',next_priority:'high',created_at:'2026-10-23T02:00:00Z',actor_name:'Staff'}]};if(sql.includes('review_audit_01560'))return {rows:[{id:2,previous_status:'awaiting_review',next_status:'in_review',created_at:'2026-10-23T01:00:00Z',actor_name:'Staff'}]};return {rows:[{id:3,iv_b64:encrypted.iv,ciphertext_b64:encrypted.ciphertext,tag_b64:encrypted.tag,created_at:'2026-10-24T03:00:00Z',actor_name:'Staff'}]};}});
 const out=await getReviewActivity01561(scope,draft,{lookup,keyProvider:()=>key});
 assert.equal(out.priority,'high');assert.equal(out.events.length,3);assert.equal(out.events[0].kind,'note');assert.equal(out.events[0].text,'Check packaging details');assert.deepEqual(calls[0].args,[draft,'s-1','a-1','w-1']);
 assert.deepEqual(calls[4].args,[draft,'s-1']);assert.ok(!JSON.stringify(out).includes('ciphertext_b64'));assert.match(JSON.stringify(out),/Check packaging details/);
});
test('01561 server-side search works over entire scoped queue with safe parameterization',async()=>{
 const filters=new URLSearchParams('limit=10&offset=20&search=PAN-0001&status=in_review&priority=urgent&assigneeId=u1');const parsed=parseReviewList01558(filters);
 assert.equal(parsed.search,'PAN-0001');assert.equal(parsed.priority,'urgent');
 for(const invalid of ['priority=paid','status=shipped','assigneeId=!!','search='+encodeURIComponent('x'.repeat(122))])assert.throws(()=>parseReviewList01558(new URLSearchParams(invalid)));
 const calls=[];await listReviewOrders01558(scope,filters,{lookup:async fn=>fn({query:async(sql,args)=>{calls.push({sql,args});return {rows:sql.includes('count(*)')?[{total:0}]:[]};}})});
 assert.equal(calls.length,3);assert.match(calls[1].sql,/jsonb_array_elements\(d.items\)/);assert.match(calls[1].sql,/COALESCE\(mp.priority/);assert.match(calls[1].sql,/COALESCE\(w.status/);assert.match(calls[1].sql,/w.assigned_user_id/);assert.match(calls[2].sql,/LIMIT \$\d+ OFFSET \$\d+/);
 assert.equal(calls[1].args.at(-1),'%PAN-0001%');assert.deepEqual(calls[0].args,['s-1','a-1','w-1']);
});
