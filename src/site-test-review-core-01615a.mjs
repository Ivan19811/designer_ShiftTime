// 01615A · Fail-closed, independent review decision rules.
// Review is not promotion: no production project or Netlify operations here.
import {siteTestError01613D,projectSha01613D} from './site-test-core-01613d.mjs';
export const REVIEW_EVENTS_01615A=Object.freeze(['submitted','approved','changes_requested','rejected']);
export const REVIEW_DECISIONS_01615A=Object.freeze(['approved','changes_requested','rejected']);
export function reviewNote01615A(value,{required=false}={}){
 if(typeof value!=='string'&&value!==undefined&&value!==null)throw siteTestError01613D('ST_TEST_REVIEW_NOTE_INVALID_01615A',400);
 const note=String(value??'').trim();
 if(note.length>2000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(note))throw siteTestError01613D('ST_TEST_REVIEW_NOTE_INVALID_01615A',400);
 if(required&&!note)throw siteTestError01613D('ST_TEST_REVIEW_NOTE_REQUIRED_01615A',400);
 return note;
}
export function assertReviewSubmissionAuthor01615A(row,userId){
 if(!row||String(row.author_user_id)!==String(userId)||!userId)
  throw siteTestError01613D('ST_TEST_AUTHOR_REQUIRED_01613D',403);
 return true;
}
export function assertReviewSubmission01615A(row){
 if(!row||!['editing','preview'].includes(row.state)||row.revision_kind!=='draft')
  throw siteTestError01613D('ST_TEST_SUBMIT_STATE_DENIED_01615A',409);
 return projectSha01613D(row.project_json);
}
export function assertReviewDecision01615A({row,role,decision,currentRevision}){
 if(role!=='owner')throw siteTestError01613D('ST_TEST_OWNER_REQUIRED_01613D',403);
 if(!REVIEW_DECISIONS_01615A.includes(decision))throw siteTestError01613D('ST_TEST_REVIEW_DECISION_INVALID_01615A',400);
 if(row?.state!=='in_review'||row.revision_kind!=='draft')throw siteTestError01613D('ST_TEST_REVIEW_STATE_DENIED_01615A',409);
 if(!row.review_snapshot_sha||row.review_snapshot_sha!==projectSha01613D(row.project_json))
  throw siteTestError01613D('ST_TEST_REVIEW_CONTENT_CHANGED_01615A',409);
 // 01617: other managers may already have applied independent changes.
 // Approval freezes this branch's SHA but NEVER writes the original.
 // The mandatory three-way apply-plan later checks conflicts against LIVE Render.
 return {newState:decision==='changes_requested'?'editing':decision,
  requiresMergeCheck:decision==='approved'&&Number(row.base_project_revision)!==Number(currentRevision)};
}
