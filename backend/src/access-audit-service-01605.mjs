// 01605 · Fail closed on uncatalogued account-topology/admin-import writes for
// legacy admin identities that have been explicitly enrolled in narrow roles.
// Existing non-enrolled administrators keep their pre-01600 behaviour.
const defaultRun=async fn=>(await import('./db.mjs')).withClient(fn);
const denied=()=>Object.assign(new Error('ST_ACCESS_UNMANAGED_ADMIN_DENIED_01605'),{code:'ST_ACCESS_UNMANAGED_ADMIN_DENIED_01605',statusCode:403});
export async function assertUnmanagedAdminOperation01605(scope,userId,{run=defaultRun}={}){
  if(!scope?.accountId||!scope?.storeId||!userId)throw denied();
  if(scope.role==='owner')return {mode:'owner'};
  if(scope.role!=='admin')throw denied();
  return run(async client=>{
    const q=await client.query(`SELECT 1 FROM platform_access_enrollments_01600
      WHERE account_id=$1 AND store_id=$2 AND user_id=$3 AND mode='custom' LIMIT 1`,
    [scope.accountId,scope.storeId,userId]);
    if(q.rowCount)throw denied();
    return {mode:'legacy-admin'};
  });
}
