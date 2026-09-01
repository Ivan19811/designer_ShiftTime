// 01088 · Authorized Account/Workspace/Store context catalog for one signed-in user.
const ROLE_RANK=Object.freeze({owner:1,admin:2,manager:3,editor:4,'catalog-manager':5,'order-manager':5,viewer:6});
const clean=(v)=>String(v??'').trim();
const rank=(role)=>ROLE_RANK[clean(role)]??99;

function scopeMode(row){
  if(clean(row?.membership_store_id))return 'store';
  if(clean(row?.membership_workspace_id))return 'workspace';
  return 'account';
}

export function normalizeAuthorizedStoreContexts01088(rows=[]){
  const byStore=new Map();
  for(const row of Array.isArray(rows)?rows:[]){
    const storeId=clean(row?.store_id);if(!storeId)continue;
    const item={
      membershipId:clean(row?.membership_id),
      accountId:clean(row?.account_id),accountName:clean(row?.account_name),
      workspaceId:clean(row?.workspace_id),workspaceName:clean(row?.workspace_name),
      storeId,storeName:clean(row?.store_name),role:clean(row?.role),
      permissions:Array.isArray(row?.permissions)?row.permissions:[],scopeMode:scopeMode(row),
    };
    const prev=byStore.get(storeId);
    if(!prev||rank(item.role)<rank(prev.role))byStore.set(storeId,item);
  }
  return [...byStore.values()].sort((a,b)=>
    a.accountName.localeCompare(b.accountName,'uk')||a.workspaceName.localeCompare(b.workspaceName,'uk')||a.storeName.localeCompare(b.storeName,'uk')
  );
}

export async function listAuthorizedStoreContexts01088(userId){
  const uid=clean(userId);if(!uid)return [];
  const {withClient}=await import('./db.mjs');
  return withClient(async client=>{
    const q=await client.query(`SELECT st.id store_id,st.name store_name,st.workspace_id,ws.name workspace_name,ws.account_id,a.name account_name,
      m.id membership_id,m.workspace_id membership_workspace_id,m.store_id membership_store_id,m.role,m.permissions
      FROM platform_stores st
      JOIN platform_workspaces ws ON ws.id=st.workspace_id AND ws.status='active'
      JOIN platform_accounts a ON a.id=ws.account_id AND a.status='active'
      JOIN platform_memberships m ON m.user_id=$1 AND m.account_id=a.id AND m.status='active'
       AND (m.workspace_id IS NULL OR m.workspace_id=ws.id)
       AND (m.store_id IS NULL OR m.store_id=st.id)
      WHERE st.status<>'archived'
      ORDER BY a.name,ws.name,st.name,m.created_at`,[uid]);
    return normalizeAuthorizedStoreContexts01088(q.rows);
  });
}
