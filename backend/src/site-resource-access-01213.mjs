// 01213 · Membership-aware access for per-site resource inventory.
const str=value=>String(value??'').trim();
const arr=value=>Array.isArray(value)?value:[];

function membershipCanViewTraffic01213(membership={}){
  const role=str(membership?.role).toLowerCase(),permissions=arr(membership?.permissions).map(str);
  return role==='owner'||role==='admin'||permissions.includes('admin.traffic.view');
}

function membershipMatchesSite01213(membership={},site={}){
  if(!membershipCanViewTraffic01213(membership))return false;
  if(str(membership?.accountId)!==str(site?.accountId||membership?.accountId))return false;
  const workspaceId=str(membership?.workspaceId),storeId=str(membership?.storeId);
  if(workspaceId&&workspaceId!==str(site?.workspaceId))return false;
  if(storeId&&storeId!==str(site?.storeId))return false;
  return true;
}

export function filterAuthorizedSitesByMemberships01213({accountId='',sites=[],memberships=[]}={}){
  const account=str(accountId),eligible=arr(memberships).filter(m=>str(m?.accountId)===account&&membershipCanViewTraffic01213(m));
  return arr(sites).filter(site=>str(site?.accountId||account)===account&&eligible.some(m=>membershipMatchesSite01213(m,{...site,accountId:account}))).sort((a,b)=>str(a?.name).localeCompare(str(b?.name),'en',{numeric:true,sensitivity:'base'}));
}

async function safeRows01213(query,sql,args=[]){
  try{return (await query(sql,args))?.rows||[];}catch(error){if(['42P01','42703'].includes(str(error?.code)))return [];throw error;}
}

export async function loadAuthorizedSiteAccess01213(scope={},userId='',options={}){
  const accountId=str(scope?.accountId),actorUserId=str(userId);
  if(!accountId)throw Object.assign(new Error('Account scope is required for Site Resource Inventory.'),{statusCode:400});
  if(!actorUserId)throw Object.assign(new Error('Authenticated user is required for Site Resource Inventory.'),{statusCode:401});
  let query=typeof options.query==='function'?options.query:null;if(!query){const {pool}=await import('./db.mjs');query=(sql,args)=>pool.query(sql,args);}
  const [membershipRows,siteRows]=await Promise.all([
    safeRows01213(query,`SELECT account_id,workspace_id,store_id,role,permissions FROM platform_memberships WHERE user_id=$1 AND account_id=$2 AND status='active'`,[actorUserId,accountId]),
    safeRows01213(query,`SELECT s.id AS site_id,s.name AS site_name,s.workspace_id,s.store_id,s.status,w.name AS workspace_name,st.name AS store_name FROM shifttime_builder_sites s LEFT JOIN platform_workspaces w ON w.id=s.workspace_id LEFT JOIN platform_stores st ON st.id=s.store_id WHERE s.account_id=$1 AND s.status<>'archived' ORDER BY s.name,s.id`,[accountId]),
  ]);
  const memberships=membershipRows.map(row=>({accountId:str(row.account_id),workspaceId:str(row.workspace_id),storeId:str(row.store_id),role:str(row.role),permissions:arr(row.permissions)}));
  const sites=siteRows.map(row=>({id:str(row.site_id),name:str(row.site_name),accountId,workspaceId:str(row.workspace_id),workspaceName:str(row.workspace_name),storeId:str(row.store_id),storeName:str(row.store_name),status:str(row.status)}));
  const eligible=memberships.filter(membershipCanViewTraffic01213),authorizedSites=filterAuthorizedSitesByMemberships01213({accountId,sites,memberships});
  const accountWide=eligible.some(m=>!str(m.workspaceId)&&!str(m.storeId));
  const allowedWorkspaceIds=new Set(eligible.filter(m=>str(m.workspaceId)&&!str(m.storeId)).map(m=>str(m.workspaceId)));
  const allowedStoreIds=new Set(eligible.filter(m=>str(m.storeId)).map(m=>str(m.storeId)));
  return Object.freeze({accountId,userId:actorUserId,memberships:Object.freeze(memberships),sites:Object.freeze(authorizedSites),allowedSiteIds:new Set(authorizedSites.map(site=>site.id)),accountWide,allowedWorkspaceIds,allowedStoreIds});
}
