import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {assertReviewSubmission01615A,assertReviewSubmissionAuthor01615A,assertReviewDecision01615A,reviewNote01615A} from '../src/site-test-review-core-01615a.mjs';
import {projectSha01613D} from '../src/site-test-core-01613d.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {assertOnlineSiteAccess01613B} from '../src/secure-online-site-01613b.mjs';
const src=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const fail=(fn,code)=>assert.throws(fn,e=>e.code===code);
const row={state:'in_review',revision_kind:'draft',base_project_revision:2,project_json:{site:{id:'a'},storage:{text:'updated'}}};
const reviewed={...row,review_snapshot_sha:projectSha01613D(row.project_json)};
test('01615A send saved test without Netlify preview',()=>{
 assert.equal(assertReviewSubmission01615A({...row,state:'editing'}),reviewed.review_snapshot_sha);
 assert.equal(assertReviewSubmission01615A({...row,state:'preview'}),reviewed.review_snapshot_sha);
 for(const state of ['processing','in_review','approved','rejected','published'])fail(()=>assertReviewSubmission01615A({...row,state}),'ST_TEST_SUBMIT_STATE_DENIED_01615A');
 fail(()=>assertReviewSubmission01615A({...row,state:'editing',revision_kind:'archived'}),'ST_TEST_SUBMIT_STATE_DENIED_01615A');
 const service=src('../src/site-test-workflow-01613d.mjs');
 assert.match(service,/const sha=assertReviewSubmission01615A\(b\)/);
 assert.doesNotMatch(service.slice(service.indexOf('export async function submitSiteTest01613D'),service.indexOf('export async function decideSiteTest01615A')),/preview_deploy_id/);
});
test('01615A owner cannot impersonate manager during submission',()=>{
 assert.equal(assertReviewSubmissionAuthor01615A({author_user_id:'manager_a'},'manager_a'),true);
 fail(()=>assertReviewSubmissionAuthor01615A({author_user_id:'manager_a'},'owner'),'ST_TEST_AUTHOR_REQUIRED_01613D');
});
test('01617 approval is owner-only, locks SHA, and defers parallel changes to apply-plan',()=>{
 assert.deepEqual(assertReviewDecision01615A({row:reviewed,role:'owner',decision:'approved',currentRevision:2}),{newState:'approved',requiresMergeCheck:false});
 fail(()=>assertReviewDecision01615A({row:reviewed,role:'manager',decision:'approved',currentRevision:2}),'ST_TEST_OWNER_REQUIRED_01613D');
 assert.deepEqual(assertReviewDecision01615A({row:reviewed,role:'owner',decision:'approved',currentRevision:3}),{newState:'approved',requiresMergeCheck:true});
 fail(()=>assertReviewDecision01615A({row:{...reviewed,project_json:{site:{id:'changed'}}},role:'owner',decision:'approved',currentRevision:2}),'ST_TEST_REVIEW_CONTENT_CHANGED_01615A');
 for(const state of ['editing','preview','approved','rejected','published'])fail(()=>assertReviewDecision01615A({row:{...reviewed,state},role:'owner',decision:'approved',currentRevision:2}),'ST_TEST_REVIEW_STATE_DENIED_01615A');
});
test('01615A changes requested returns editable draft, reject remains locked',()=>{
 assert.equal(assertReviewDecision01615A({row:reviewed,role:'owner',decision:'changes_requested',currentRevision:99}).newState,'editing');
 assert.equal(assertReviewDecision01615A({row:reviewed,role:'owner',decision:'rejected',currentRevision:99}).newState,'rejected');
 fail(()=>assertReviewDecision01615A({row:reviewed,role:'owner',decision:'something_else',currentRevision:2}),'ST_TEST_REVIEW_DECISION_INVALID_01615A');
});
test('01615A review notes bounded and reasons mandatory for adverse decisions',()=>{
 assert.equal(reviewNote01615A(' Review details '),'Review details');
 fail(()=>reviewNote01615A('',{required:true}),'ST_TEST_REVIEW_NOTE_REQUIRED_01615A');
 fail(()=>reviewNote01615A('a'.repeat(2001)),'ST_TEST_REVIEW_NOTE_INVALID_01615A');
 fail(()=>reviewNote01615A('\u0001bad'),'ST_TEST_REVIEW_NOTE_INVALID_01615A');
 fail(()=>reviewNote01615A({html:'no'}),'ST_TEST_REVIEW_NOTE_INVALID_01615A');
});
test('01615A review route ACL rejects manager even with edit grant',()=>{
 const p=['api','v1','sites','site_1','test','t_1','review'];
 assert.equal(classifyProtectedAction01600('POST',p)?.permission,'site.publish.execute');
 const g={allowed:true,mode:'custom',permission:'site.publish.execute',permissions:['site.pages.edit','api.mode.site_actions','site.publish.execute']};
 fail(()=>assertOnlineSiteAccess01613B({role:'manager'},g,'POST',p),'ST_TEST_OWNER_REQUIRED_01613D');
 assert.equal(assertOnlineSiteAccess01613B({role:'owner'},{allowed:true,mode:'owner'},'POST',p),true);
});
test('01615A pending review inbox is owner-only and scoped to site and tenant',()=>{
 const service=src('../src/site-test-workflow-01613d.mjs'),server=src('../src/server.mjs');
 const acl=classifyProtectedAction01600('GET',['api','v1','sites','site_1','test','inbox']);
 assert.equal(acl?.siteId,'site_1');
 assert.equal(acl?.permission,'site.pages.view');
 assert.match(service,/export async function getSiteTestReviewInbox01615A/);
 assert.match(service,/if\(scope.role!=='owner'\)throw siteTestError01613D/);
 assert.match(service,/account_id=\$1 AND workspace_id=\$2 AND store_id=\$3 AND site_id=\$4 AND state='in_review'/);
 assert.match(server,/testId==='inbox'/);
});
test('01615A review transaction records events; legacy production promotion disabled',()=>{
 const service=src('../src/site-test-workflow-01613d.mjs'),server=src('../src/server.mjs'),migration=src('../sql/075_site_test_owner_review_01615a.sql');
 assert.match(service,/throw siteTestError01613D\('ST_TEST_PROMOTION_DISABLED_01615A',403\)/);
 assert.match(service,/INSERT INTO shifttime_site_test_review_events_01615a/);
 assert.match(service,/const old=await c.query\(`UPDATE shifttime_builder_site_revisions/);
 assert.match(service,/editableRevisionId=newRevisionId01613D\(\)/);
 assert.match(service,/review_snapshot_sha=\$2/);
 assert.match(service,/state='in_review'/);
 assert.match(service,/WHERE id=\$1 AND state='in_review' RETURNING/);
 assert.match(server,/action==='review'\)return sendJson\(res,200,await decideSiteTest01615A/);
 assert.match(migration,/ADD COLUMN IF NOT EXISTS review_snapshot_sha text/);
 assert.match(migration,/state IN \('editing','processing','preview','in_review','approved','rejected','published'\)/);
});
