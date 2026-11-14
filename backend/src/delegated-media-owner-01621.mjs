// 01621 · A delegated editor can complete ONLY the image upload they started.
const err=()=>Object.assign(new Error('ST_DELEGATED_IMAGE_UPLOAD_OWNER_DENIED_01621'),{code:'ST_DELEGATED_IMAGE_UPLOAD_OWNER_DENIED_01621',statusCode:403});
export async function verifyDelegatedUploadOwner01621(scope,userId,assetId,{run=async cb=>(await import('./db.mjs')).withClient(cb)}={}){
 if(!scope?.accountId||!scope?.workspaceId||!scope?.storeId||!userId||!assetId)throw err();
 const q=await run(c=>c.query(`SELECT kind,metadata FROM media_cloud_assets WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND status='uploading'`,[assetId,scope.accountId,scope.workspaceId,scope.storeId]));
 if(q.rows[0]?.kind!=='image'||q.rows[0]?.metadata?.uploadedByUserId01621!==userId)throw err();
 return true;
}
