// 01625 · Site and Store remain independent. Many-to-many links are explicit grants,
// not permission to read another workspace or to publish foreign store snapshots.
import {withClient,withTransaction} from './db.mjs';
const clean=v=>String(v??'').trim();
const denied=(message='ST_STORE_SITE_FORBIDDEN_01625',statusCode=403)=>Object.assign(new Error(message),{statusCode});
async function assertWorkspaceManager(client,scope,userId){
 const q=await client.query(`SELECT 1 FROM platform_memberships m WHERE m.user_id=$1 AND m.account_id=$2 AND m.status='active' AND m.role IN ('owner','admin') AND m.store_id IS NULL AND (m.workspace_id IS NULL OR m.workspace_id=$3) LIMIT 1`,[userId,scope.accountId,scope.workspaceId]);
 if(!q.rowCount)throw denied();
}
export async function storeSiteLinksView01625(scope,userId){return withClient(async c=>{
 await assertWorkspaceManager(c,scope,userId);
 const [stores,sites,links]=await Promise.all([
  c.query(`SELECT s.id,s.name,s.status FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id WHERE w.account_id=$1 AND s.workspace_id=$2 AND s.status<>'archived' ORDER BY s.name,s.id`,[scope.accountId,scope.workspaceId]),
  c.query(`SELECT id,name,store_id "primaryStoreId",status FROM shifttime_builder_sites WHERE account_id=$1 AND workspace_id=$2 AND status='active' ORDER BY name,id`,[scope.accountId,scope.workspaceId]),
  c.query(`SELECT site_id "siteId",store_id "storeId" FROM shifttime_store_site_links_01625 WHERE account_id=$1 AND workspace_id=$2`,[scope.accountId,scope.workspaceId])
 ]);
 const joined=new Map(links.rows.map(x=>[`${x.siteId}:${x.storeId}`,x]));for(const site of sites.rows){const k=`${site.id}:${site.primaryStoreId}`;joined.set(k,{siteId:site.id,storeId:site.primaryStoreId,primary:true});}
 return {stage:'01625',stores:stores.rows,sites:sites.rows,links:[...joined.values()]};
});}
export async function changeStoreSiteLink01625(scope,userId,{siteId,storeId,attach=true}={}){return withTransaction(async c=>{
 await assertWorkspaceManager(c,scope,userId);const site=clean(siteId),store=clean(storeId);if(!site||!store||site.length>200||store.length>200)throw denied('ST_STORE_SITE_INPUT_INVALID_01625',400);
 const targets=await c.query(`SELECT s.store_id "primaryStoreId",ps.id "targetStoreId" FROM shifttime_builder_sites s JOIN platform_stores ps ON ps.id=$4 AND ps.workspace_id=s.workspace_id AND ps.status='active' WHERE s.id=$3 AND s.account_id=$1 AND s.workspace_id=$2 AND s.status='active' LIMIT 1`,[scope.accountId,scope.workspaceId,site,store]);
 if(!targets.rowCount)throw denied('ST_STORE_SITE_TARGET_INVALID_01625',404);
 const primary=targets.rows[0].primaryStoreId===store;if(!attach&&primary)throw denied('ST_STORE_SITE_PRIMARY_LINK_REQUIRED_01625',409);
 if(attach)await c.query(`INSERT INTO shifttime_store_site_links_01625(account_id,workspace_id,site_id,store_id,linked_by_user_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(site_id,store_id) DO NOTHING`,[scope.accountId,scope.workspaceId,site,store,userId]);
 else await c.query(`DELETE FROM shifttime_store_site_links_01625 WHERE account_id=$1 AND workspace_id=$2 AND site_id=$3 AND store_id=$4`,[scope.accountId,scope.workspaceId,site,store]);
 return {stage:'01625',siteId:site,storeId:store,linked:attach,primary};
});}
