import crypto from 'node:crypto';
const clean=v=>String(v??'').trim();
const fail=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
export async function assertManagerDemo01624A({scope,userId,siteId,pkg,query}){
 if(scope?.role==='owner')return true;
 const proof=pkg?.testDraft01624A;
 if(!clean(proof?.branchId)||!clean(proof?.revisionId)||!clean(proof?.fingerprint)||clean(pkg?.site?.id)!==clean(siteId))throw fail('ST_TEST_DEMO_BRANCH_REQUIRED_01624A',403);
 const result=await query(`SELECT b.state,b.author_user_id,r.kind,r.project_json FROM shifttime_site_test_branches_01613d b
 JOIN shifttime_builder_site_revisions r ON r.id=b.revision_id AND r.site_id=b.site_id
 JOIN shifttime_builder_sites s ON s.id=b.site_id AND s.account_id=b.account_id AND s.workspace_id=b.workspace_id AND s.store_id=b.store_id
 WHERE b.id=$1 AND b.revision_id=$2 AND b.site_id=$3 AND b.account_id=$4 AND b.workspace_id=$5 AND b.store_id=$6 AND b.author_user_id=$7 AND s.status='active'`,
 [proof.branchId,proof.revisionId,siteId,scope.accountId,scope.workspaceId,scope.storeId,userId]);
 const row=result?.rows?.[0];if(!row||clean(row.author_user_id)!==clean(userId))throw fail('ST_TEST_DEMO_BRANCH_REQUIRED_01624A',403);
 if(row.kind!=='draft'||!['editing','preview'].includes(row.state))throw fail('ST_TEST_DEMO_BRANCH_LOCKED_01624A');
 const project=row.project_json;
 if(clean(project?.site?.id)!==clean(siteId)||crypto.createHash('sha256').update(JSON.stringify(project??{})).digest('hex')!==clean(proof.fingerprint))throw fail('ST_TEST_DEMO_DRAFT_CHANGED_01624A');
 const expected=(project.site.pages||[]).map(p=>clean(p.id)).filter(Boolean),actual=new Set((pkg?.preflight?.pages||[]).map(p=>clean(p.pageId)));
 if(!expected.length||expected.some(id=>!actual.has(id)))throw fail('ST_TEST_DEMO_MANIFEST_MISMATCH_01624A');
 return true;
}
