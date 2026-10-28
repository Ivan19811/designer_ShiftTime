// 01603 · Owner-only, one test worker per store; transactional role replacement.
// This is a REAL member/session. No impersonation or simulated authorization.
import crypto from 'node:crypto';
import {assertAccessPolicyManager01597,normalizeAccessAssignment01597} from './access-policy-core-01597.mjs';
const clean=v=>String(v??'').trim();
const fault=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
const runDefault=async fn=>(await import('./db.mjs')).withClient(fn);
const grants=rows=>rows.map(r=>({id:r.id,roleId:r.roleId,roleName:r.roleName,scopeKind:r.scopeKind,siteId:r.siteId||null}));
const result=(row,items=[])=>({stage:'01603',enrolled:!!row,membershipId:row?.membershipId||'',userId:row?.userId||'',role:row?.memberRole||'',assignmentId:row?.assignmentId||'',assignments:grants(items)});
const rowSql=`SELECT t.membership_id "membershipId",t.user_id "userId",t.assignment_id "assignmentId",m.role "memberRole"
 FROM platform_test_workers_01603 t JOIN platform_memberships m ON m.id=t.membership_id
 WHERE t.account_id=$1 AND t.store_id=$2`;
const assignmentSql=`SELECT a.id,a.role_id "roleId",r.name "roleName",a.scope_kind "scopeKind",a.site_id "siteId"
 FROM platform_role_assignments_01597 a JOIN platform_custom_roles_01597 r ON r.id=a.role_id AND r.account_id=a.account_id
 WHERE a.account_id=$1 AND a.store_id=$2 AND a.membership_id=$3 AND a.status='active' ORDER BY a.created_at DESC`;
async function readCurrent(c,scope,{lock=false}={}){
  const q=await c.query(`${rowSql} ${lock?'FOR UPDATE OF t':''}`,[scope.accountId,scope.storeId]);
  if(!q.rowCount)return result(null);
  const row=q.rows[0],active=await c.query(assignmentSql,[scope.accountId,scope.storeId,row.membershipId]);
  return result(row,active.rows);
}
async function assertViewer(c,scope,membershipId,actorId){
  if(!/^member_[a-f0-9]{16,40}$/.test(clean(membershipId)))throw fault('ST_TEST_WORKER_MEMBER_INVALID_01603');
  const q=await c.query(`SELECT m.id,m.user_id "userId",m.role FROM platform_memberships m
    WHERE m.id=$1 AND m.account_id=$2 AND m.status='active' AND m.role='viewer'
      AND (m.workspace_id IS NULL OR m.workspace_id=$3)
      AND (m.store_id IS NULL OR m.store_id=$4) FOR UPDATE`,[membershipId,scope.accountId,scope.workspaceId,scope.storeId]);
  if(!q.rowCount||q.rows[0].userId===actorId)throw fault('ST_TEST_WORKER_VIEWER_REQUIRED_01603',403);
  const user=q.rows[0].userId;
  // Reject broader memberships in this Account, including owner/admin through another scope.
  const conflicts=await c.query(`SELECT 1 FROM platform_memberships WHERE account_id=$1 AND user_id=$2
    AND status='active' AND role<>'viewer' LIMIT 1`,[scope.accountId,user]);
  if(conflicts.rowCount)throw fault('ST_TEST_WORKER_BROAD_ROLE_01603',409);
  return q.rows[0];
}
async function audit(c,scope,actor,action,targetId,detail={}){
  await c.query(`INSERT INTO platform_admin_audit_log(account_id,workspace_id,store_id,actor_user_id,action,target_type,target_id,payload)
    VALUES($1,$2,$3,$4,$5,'test_worker',$6,$7::jsonb)`,[scope.accountId,scope.workspaceId,scope.storeId,actor,action,targetId,JSON.stringify(detail)]);
}
export function createTestWorkerRoleService01603({run=runDefault}={}){
  return {
    async current(scope){assertAccessPolicyManager01597(scope);return run(c=>readCurrent(c,scope));},
    async enroll(scope,actor,input={}){assertAccessPolicyManager01597(scope);
      if(!input||typeof input!=='object'||Array.isArray(input))throw fault('ST_TEST_WORKER_INPUT_INVALID_01603');
      const membershipId=clean(input.membershipId);
      return run(async c=>{await c.query('BEGIN');try{
        await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[scope.accountId,scope.storeId]);
        const existing=await readCurrent(c,scope,{lock:true});
        if(existing.enrolled){if(existing.membershipId!==membershipId)throw fault('ST_TEST_WORKER_ALREADY_SET_01603',409);await c.query('COMMIT');return existing;}
        const member=await assertViewer(c,scope,membershipId,actor);
        const active=await c.query(assignmentSql,[scope.accountId,scope.storeId,membershipId]);
        if(active.rowCount)throw fault('ST_TEST_WORKER_EXISTING_GRANTS_01603',409);
        await c.query(`INSERT INTO platform_test_workers_01603(account_id,store_id,membership_id,user_id,enrolled_by_user_id)
          VALUES($1,$2,$3,$4,$5)`,[scope.accountId,scope.storeId,membershipId,member.userId,actor]);
        await audit(c,scope,actor,'access.test_worker.enroll',membershipId,{userId:member.userId});
        await c.query('COMMIT');return result({membershipId,userId:member.userId,memberRole:'viewer',assignmentId:''});
      }catch(e){await c.query('ROLLBACK');throw e;}});
    },
    async replace(scope,actor,input={}){assertAccessPolicyManager01597(scope);
      if(!input||typeof input!=='object'||Array.isArray(input))throw fault('ST_TEST_WORKER_INPUT_INVALID_01603');
      const roleId=clean(input.roleId),scopeKind=clean(input.scopeKind)||'store',siteId=clean(input.siteId);
      // Empty roleId explicitly means reset to no custom role (viewer baseline).
      if(!roleId&&(scopeKind!=='store'||siteId))throw fault('ST_TEST_WORKER_RESET_SCOPE_01603');
      return run(async c=>{await c.query('BEGIN');try{
        await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[scope.accountId,scope.storeId]);
        const current=await readCurrent(c,scope,{lock:true});
        if(!current.enrolled)throw fault('ST_TEST_WORKER_NOT_SET_01603',404);
        await assertViewer(c,scope,current.membershipId,actor);
        // Reject grants outside the test-controlled pointer, rather than silently modifying real employee grants.
        if(current.assignments.some(a=>a.id!==current.assignmentId)||current.assignments.length>1)
          throw fault('ST_TEST_WORKER_UNMANAGED_GRANTS_01603',409);
        let normalized=null;
        if(roleId){
          normalized=normalizeAccessAssignment01597({roleId,membershipId:current.membershipId,scopeKind,siteId});
          const r=await c.query(`SELECT id,status FROM platform_custom_roles_01597 WHERE id=$1 AND account_id=$2 FOR UPDATE`,[roleId,scope.accountId]);
          if(!r.rowCount||r.rows[0].status!=='active')throw fault('ST_TEST_WORKER_ROLE_INVALID_01603',409);
          if(normalized.scopeKind==='site'){
            const s=await c.query(`SELECT id FROM shifttime_builder_sites WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND status='active'`,[normalized.siteId,scope.accountId,scope.workspaceId,scope.storeId]);
            if(!s.rowCount)throw fault('ST_TEST_WORKER_SITE_DENIED_01603',403);
          }
        }
        if(current.assignmentId){
          await c.query(`UPDATE platform_role_assignments_01597 SET status='revoked',revoked_at=now()
            WHERE id=$1 AND account_id=$2 AND store_id=$3 AND membership_id=$4 AND status='active'`,[current.assignmentId,scope.accountId,scope.storeId,current.membershipId]);
        }
        let newAssignmentId=null;
        if(normalized){
          // Sticky explicit-access enrollment: dropping the final grant must not restore legacy rights.
          await c.query(`INSERT INTO platform_access_enrollments_01600(account_id,store_id,user_id) VALUES($1,$2,$3)
            ON CONFLICT(account_id,store_id,user_id) DO NOTHING`,[scope.accountId,scope.storeId,current.userId]);
          newAssignmentId=`agrant_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
          await c.query(`INSERT INTO platform_role_assignments_01597(id,account_id,role_id,membership_id,store_id,site_id,scope_kind,assigned_by_user_id)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[newAssignmentId,scope.accountId,roleId,current.membershipId,scope.storeId,normalized.siteId,normalized.scopeKind,actor]);
        }
        await c.query(`UPDATE platform_test_workers_01603 SET assignment_id=$3,updated_at=now()
          WHERE account_id=$1 AND store_id=$2`,[scope.accountId,scope.storeId,newAssignmentId]);
        await audit(c,scope,actor,'access.test_worker.replace',current.membershipId,{previousAssignmentId:current.assignmentId||null,newAssignmentId,roleId:roleId||null,scopeKind:normalized?.scopeKind||null,siteId:normalized?.siteId||null});
        await c.query('COMMIT');return {stage:'01603',changed:true,membershipId:current.membershipId,userId:current.userId,assignmentId:newAssignmentId||'',roleId:roleId||'',scopeKind:normalized?.scopeKind||'',siteId:normalized?.siteId||null};
      }catch(e){await c.query('ROLLBACK');throw e;}});
    }
  };
}
export const testWorkerRoleService01603=createTestWorkerRoleService01603();
