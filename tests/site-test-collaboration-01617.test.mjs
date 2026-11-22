import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeSiteTestCollaborators01617,assertOriginalWriteVersion01617} from '../src/site-test-collaboration-01617.mjs';
import {assertTestActor01613D} from '../src/site-test-core-01613d.mjs';
import {createBuilderSitesService01170} from '../src/builder-sites-core-01170.mjs';
const rows=[
 {author_user_id:'manager_a',state:'editing',updated_at:'2026-11-07T10:00:00Z'},
 {author_user_id:'manager_b',state:'in_review',updated_at:'2026-11-07T12:00:00Z'},
 {author_user_id:'manager_a',state:'approved',updated_at:'2026-11-07T11:00:00Z'}
];
test('01617 owner sees independent managers and status counts',()=>{
 const result=summarizeSiteTestCollaborators01617(rows,{owner:true,originalRevision:11});
 assert.equal(result.managerCount,2);assert.equal(result.pendingCount,1);
 assert.equal(result.activeCount,1);assert.equal(result.originalProjectRevision,11);
 assert.deepEqual(result.collaborators.map(g=>g.authorUserId),['manager_b','manager_a']);
 assert.equal(result.collaborators[1].branchCount,2);
});
test('01617 manager sees ONLY own collaborations',()=>{
 const result=summarizeSiteTestCollaborators01617(rows,{owner:false,userId:'manager_a',originalRevision:11});
 assert.equal(result.managerCount,1);assert.equal(result.pendingCount,0);
 assert.equal(result.collaborators[0].authorUserId,'manager_a');
});
test('01617 stale full-project writes rejected and guarded originals require version',()=>{
 assert.throws(()=>assertOriginalWriteVersion01617({currentRevision:9,protectedByTest:true}),{code:'ST_ORIGINAL_EXPECTED_REVISION_REQUIRED_01617'});
 assert.throws(()=>assertOriginalWriteVersion01617({currentRevision:9,expectedRevision:8}),{code:'ST_ORIGINAL_STALE_REVISION_01617'});
 assert.deepEqual(assertOriginalWriteVersion01617({currentRevision:9,expectedRevision:9}),{checked:true,revision:9});
 assert.deepEqual(assertOriginalWriteVersion01617({currentRevision:9,protectedByTest:false}),{checked:false});
});
test('01617 owner can review another manager but cannot edit their draft',()=>{
 const branch={author_user_id:'manager_b',state:'editing'};
 assert.equal(assertTestActor01613D({role:'owner'},'owner',branch),true);
 assert.throws(()=>assertTestActor01613D({role:'owner'},'owner',branch,{write:true}),{code:'ST_TEST_AUTHOR_REQUIRED_01613D'});
 assert.throws(()=>assertTestActor01613D({role:'manager'},'manager_a',branch,{write:true}),{code:'ST_TEST_AUTHOR_REQUIRED_01613D'});
 assert.equal(assertTestActor01613D({role:'manager'},'manager_b',branch,{write:true}),true);
});
test('01617 builder sites service preserves expectedRevision through input normalization',async()=>{
 let captured;
 const service=createBuilderSitesService01170({repo:{save:async(...args)=>{captured=args[3];return {id:'site_1'};}},netlify:{}});
 await service.save({},'owner','site_1',{name:'A',project:{site:{id:'site_1'}},expectedRevision:17});
 assert.equal(captured.expectedRevision,17);
});
