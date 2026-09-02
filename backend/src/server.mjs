import http from 'node:http';
import {config} from './config.mjs';
import {pool} from './db.mjs';
import {authenticateRequest,resolveAuthorizedStore,assertWriteRole,assertAdminRole,assertOrderWriteRole} from './auth.mjs';
import {listAuthorizedStoreContexts01088} from './auth-context-service-01088.mjs';
import {buildAuthSessionResponse01089} from './auth-session-response-01089.mjs';
import {registerUser01084,loginUser01084,activatePasswordForUser01084,revokeSession01084} from './auth-service-01084.mjs';
import {applyCors,sendJson,sendNoContent,readJson,requestId} from './http-utils.mjs';
import {loadSnapshot,replaceSnapshot,resetSnapshot,listResource,getResource,createResource,updateResource,deleteResource,getSeo,updateSeo,RESOURCE_PATHS_01071} from './commerce-snapshot-service.mjs';
import {getAuthorizedPlatformSnapshot,createAuthorizedWorkspace,createAuthorizedStore} from './platform-service.mjs';
import {getNetworkView,ensureSeller,updateSeller,updatePolicy,publishProduct as publishNetworkProduct,syncProduct as syncNetworkProduct,unpublishListing} from './marketplace-network-service.mjs';
import {searchPublicMarketplace} from './marketplace-public-catalog-service.mjs';
import {getPublicCart,addPublicCartOffer,setPublicCartQuantity,removePublicCartItem,clearPublicCart,refreshPublicCart} from './marketplace-cart-service.mjs';
import {checkoutPublicCart,listAuthorizedSellerOrders,updateAuthorizedSellerOrder} from './marketplace-order-service.mjs';
import {ensureAuthorizedPaymentForOrder,listAuthorizedPayments,listAuthorizedPayouts,transitionAuthorizedPayment,markAuthorizedPayout} from './marketplace-payment-service.mjs';
import {listAuthorizedInventory01077,listAuthorizedInventoryReservations01077,devTransitionInventoryReservation01077,expireAuthorizedInventoryReservations01077} from './marketplace-inventory-service.mjs';
import {listAuthorizedShippingProviders01078,listAuthorizedSellerDeliveries01078,updateAuthorizedSellerDelivery01078,simulateAuthorizedSellerDelivery01078} from './marketplace-shipping-service.mjs';
import {getDeploymentStatus01080,sanitizeImportSource01080} from './deployment-service.mjs';
import {importLocalOperationalBundle01080} from './deployment-local-import-service.mjs';
import {getCloudMediaStorageInfo01081,listAuthorizedCloudMediaAssets01081,beginAuthorizedCloudMediaUpload01081,completeAuthorizedCloudMediaUpload01081,deleteAuthorizedCloudMediaAsset01081,getPublicCloudMediaDelivery01081} from './media-cloud-service.mjs';
import {assertAdminView01087,assertCapability01087,getEffectiveCapabilities01087,getRoleCatalog01087} from './admin-access-01087.mjs';
import {getAdminOverview01087,listMembers01087,updateMembership01087,listInvitations01087,createInvitation01087,revokeInvitation01087,inspectInvitation01087} from './admin-service-01087.mjs';
import {getDatabaseOverview01087,listDatabaseTables01087,getDatabaseTableSchema01087,getDatabaseTableRows01087,listDatabaseMigrations01087} from './database-explorer-service-01087.mjs';
import {listAuthorizedTables01092,getAuthorizedTable01092,createAuthorizedTable01092,updateAuthorizedTable01092,deleteAuthorizedTable01092,createAuthorizedTableField01092,updateAuthorizedTableField01092,deleteAuthorizedTableField01092,createAuthorizedTableRecord01092,updateAuthorizedTableRecord01092,deleteAuthorizedTableRecord01092,createAuthorizedTableView01092,updateAuthorizedTableView01092,deleteAuthorizedTableView01092} from './tables-service-01092.mjs';
function pathParts(url){return new URL(url,'http://localhost').pathname.split('/').filter(Boolean).map(decodeURIComponent);}
function setScopeHeaders(res,scope,rid){res.setHeader('x-st-request-id',rid);res.setHeader('x-st-account-id',scope.accountId);res.setHeader('x-st-workspace-id',scope.workspaceId);res.setHeader('x-st-store-id',scope.storeId);}
async function route(req,res){applyCors(req,res,config.corsOrigin);if(req.method==='OPTIONS')return sendNoContent(res,204);const rid=requestId(req);res.setHeader('x-st-request-id',rid);const p=pathParts(req.url);
  if(req.method==='GET'&&p.length===1&&p[0]==='health'){try{await pool.query('SELECT 1');return sendJson(res,200,{ok:true,stage:'01094',database:'postgresql',time:new Date().toISOString(),requestId:rid});}catch(e){return sendJson(res,503,{ok:false,stage:'01094',database:'unavailable',error:e.message,requestId:rid});}}
  if(p[0]!=='api'||p[1]!=='v1')return sendJson(res,404,{error:'Not found',requestId:rid});
  if(req.method==='POST'&&p[2]==='auth'&&p[3]==='register'){
    const out=await registerUser01084(await readJson(req));
    return sendJson(res,201,{token:out.token,expiresAt:out.expiresAt,user:out.user,scope:out.scope,stage:'01084',requestId:rid});
  }
  if(req.method==='POST'&&p[2]==='auth'&&p[3]==='login'){
    const out=await loginUser01084(await readJson(req));
    const scope=await resolveAuthorizedStore(out.user.id,'');
    return sendJson(res,200,{token:out.token,expiresAt:out.expiresAt,user:out.user,scope,stage:'01084',requestId:rid});
  }
  if(req.method==='GET'&&p[2]==='auth'&&p[3]==='invitations'&&p[4])return sendJson(res,200,{...(await inspectInvitation01087(p[4])),stage:'01087',requestId:rid});
  if(req.method==='GET'&&p[2]==='public'&&p[3]==='media'&&p[4]){const out=await getPublicCloudMediaDelivery01081(p[4]);res.statusCode=302;res.setHeader('location',out.url);res.setHeader('cache-control',out.public?'public, max-age=300':'private, no-store');return res.end();}
  if(req.method==='GET'&&p[2]==='public'&&p[3]==='marketplace'&&p[4]==='search'){const u=new URL(req.url,'http://localhost');return sendJson(res,200,await searchPublicMarketplace(Object.fromEntries(u.searchParams.entries())));}
  if(req.method==='POST'&&p[2]==='public'&&p[3]==='marketplace'&&p[4]==='orders'){const token=String(req.headers['x-st-cart-id']||'');const out=await checkoutPublicCart(token,await readJson(req));return sendJson(res,201,out,{'x-st-cart-id':out.nextCartId});}
  if(p[2]==='public'&&p[3]==='marketplace'&&p[4]==='cart'){const token=String(req.headers['x-st-cart-id']||'');
    if(req.method==='GET'&&p.length===5){const out=await getPublicCart(token);return sendJson(res,200,out,{'x-st-cart-id':out.id});}
    if(req.method==='DELETE'&&p.length===5){const out=await clearPublicCart(token);return sendJson(res,200,out,{'x-st-cart-id':out.id});}
    if(req.method==='POST'&&p[5]==='refresh'){const out=await refreshPublicCart(token);return sendJson(res,200,out,{'x-st-cart-id':out.id});}
    if(req.method==='POST'&&p[5]==='items'&&!p[6]){const out=await addPublicCartOffer(token,await readJson(req));return sendJson(res,200,out,{'x-st-cart-id':out.id});}
    if(req.method==='PATCH'&&p[5]==='items'&&p[6]){const out=await setPublicCartQuantity(token,p[6],await readJson(req));return sendJson(res,200,out,{'x-st-cart-id':out.id});}
    if(req.method==='DELETE'&&p[5]==='items'&&p[6]){const out=await removePublicCartItem(token,p[6]);return sendJson(res,200,out,{'x-st-cart-id':out.id});}
    return sendJson(res,404,{error:'Cart route not found',requestId:rid});
  }
  const session=await authenticateRequest(req);
  if(req.method==='POST'&&p[2]==='auth'&&p[3]==='activate-password'){const out=await activatePasswordForUser01084(session.userId,await readJson(req));return sendJson(res,200,{...out,stage:'01084',requestId:rid});}
  if(req.method==='POST'&&p[2]==='auth'&&p[3]==='logout'){await revokeSession01084(session.sessionId);return sendJson(res,200,{ok:true,stage:'01084',requestId:rid});}
  if(req.method==='GET'&&p[2]==='auth'&&p[3]==='contexts')return sendJson(res,200,{stage:'01094',contexts:await listAuthorizedStoreContexts01088(session.userId),requestId:rid});
  const scope=await resolveAuthorizedStore(session.userId,req.headers['x-st-store-id']);setScopeHeaders(res,scope,rid);
  if(req.method==='GET'&&p[2]==='auth'&&p[3]==='session')return sendJson(res,200,buildAuthSessionResponse01089({session,scope,requestId:rid}));
  if(req.method==='GET'&&p[2]==='session')return sendJson(res,200,buildAuthSessionResponse01089({session,scope,requestId:rid}));
  if(p[2]==='admin'){
    assertAdminView01087(scope);
    if(req.method==='GET'&&p[3]==='overview')return sendJson(res,200,{...(await getAdminOverview01087(scope,session.userId)),actor:{userId:session.userId,email:session.email,name:session.name,role:scope.role,capabilities:getEffectiveCapabilities01087(scope)},scope});
    if(req.method==='GET'&&p[3]==='roles')return sendJson(res,200,{stage:'01087',roles:getRoleCatalog01087(),actorRole:scope.role,actorCapabilities:getEffectiveCapabilities01087(scope)});
    if(req.method==='GET'&&p[3]==='members'&&!p[4])return sendJson(res,200,{stage:'01087',members:await listMembers01087(scope)});
    if(req.method==='PATCH'&&p[3]==='members'&&p[4]){assertCapability01087(scope,'admin.users.manage','User management permission required');return sendJson(res,200,{stage:'01087',member:await updateMembership01087(scope,session.userId,p[4],await readJson(req))});}
    if(req.method==='GET'&&p[3]==='invitations'&&!p[4])return sendJson(res,200,{stage:'01087',invitations:await listInvitations01087(scope)});
    if(req.method==='POST'&&p[3]==='invitations'&&!p[4]){assertCapability01087(scope,'admin.invites.manage','Invitation permission required');return sendJson(res,201,{stage:'01087',...(await createInvitation01087(scope,session.userId,await readJson(req)))});}
    if(req.method==='POST'&&p[3]==='invitations'&&p[4]&&p[5]==='revoke'){assertCapability01087(scope,'admin.invites.manage','Invitation permission required');return sendJson(res,200,{stage:'01087',invitation:await revokeInvitation01087(scope,session.userId,p[4])});}
    if(req.method==='GET'&&p[3]==='database'&&p[4]==='overview')return sendJson(res,200,await getDatabaseOverview01087(scope));
    if(req.method==='GET'&&p[3]==='database'&&p[4]==='tables'&&!p[5])return sendJson(res,200,{stage:'01087',tables:await listDatabaseTables01087(scope)});
    if(req.method==='GET'&&p[3]==='database'&&p[4]==='tables'&&p[5]&&p[6]==='schema')return sendJson(res,200,await getDatabaseTableSchema01087(scope,p[5]));
    if(req.method==='GET'&&p[3]==='database'&&p[4]==='tables'&&p[5]&&p[6]==='rows'){const u=new URL(req.url,'http://localhost');return sendJson(res,200,await getDatabaseTableRows01087(scope,p[5],{limit:u.searchParams.get('limit'),offset:u.searchParams.get('offset')}));}
    if(req.method==='GET'&&p[3]==='database'&&p[4]==='migrations')return sendJson(res,200,{stage:'01087',migrations:await listDatabaseMigrations01087(scope)});
    return sendJson(res,404,{error:'Admin route not found',stage:'01087',requestId:rid});
  }
  if(req.method==='GET'&&p[2]==='deployment'&&p[3]==='status')return sendJson(res,200,await getDeploymentStatus01080(scope));
  if(p[2]==='media'){
    if(req.method==='GET'&&p[3]==='storage'&&p[4]==='status')return sendJson(res,200,getCloudMediaStorageInfo01081());
    if(req.method==='GET'&&p[3]==='assets'&&!p[4])return sendJson(res,200,await listAuthorizedCloudMediaAssets01081(scope));
    if(req.method==='POST'&&p[3]==='uploads'&&!p[4]){assertWriteRole(scope);return sendJson(res,201,await beginAuthorizedCloudMediaUpload01081(scope,await readJson(req)));}
    if(req.method==='POST'&&p[3]==='uploads'&&p[4]&&p[5]==='complete'){assertWriteRole(scope);return sendJson(res,200,await completeAuthorizedCloudMediaUpload01081(scope,p[4],await readJson(req)));}
    if(req.method==='DELETE'&&p[3]==='assets'&&p[4]){assertWriteRole(scope);return sendJson(res,200,await deleteAuthorizedCloudMediaAsset01081(scope,p[4]));}
    return sendJson(res,404,{error:'Media cloud route not found',requestId:rid});
  }
  if(req.method==='POST'&&p[2]==='deployment'&&p[3]==='import-local-operational'){assertAdminRole(scope);return sendJson(res,200,await importLocalOperationalBundle01080(scope,await readJson(req)));}
  if(req.method==='GET'&&p[2]==='platform'&&p[3]==='context')return sendJson(res,200,await getAuthorizedPlatformSnapshot(session.userId,scope));
  if(req.method==='POST'&&p[2]==='platform'&&p[3]==='workspaces')return sendJson(res,201,await createAuthorizedWorkspace(session.userId,scope.accountId,await readJson(req)));
  if(req.method==='POST'&&p[2]==='platform'&&p[3]==='stores'){const body=await readJson(req);return sendJson(res,201,await createAuthorizedStore(session.userId,String(body.workspaceId||scope.workspaceId),body));}
  if(p[2]==='tables'){
    const tableId=p[3]||'',resource=p[4]||'',resourceId=p[5]||'';
    if(req.method==='GET'&&!tableId)return sendJson(res,200,{stage:'01094',tables:await listAuthorizedTables01092(scope,session.userId)});
    if(req.method==='POST'&&!tableId)return sendJson(res,201,await createAuthorizedTable01092(scope,session.userId,await readJson(req)));
    if(req.method==='GET'&&tableId&&!resource)return sendJson(res,200,await getAuthorizedTable01092(scope,session.userId,tableId));
    if(req.method==='PATCH'&&tableId&&!resource)return sendJson(res,200,await updateAuthorizedTable01092(scope,session.userId,tableId,await readJson(req)));
    if(req.method==='DELETE'&&tableId&&!resource){await deleteAuthorizedTable01092(scope,session.userId,tableId);return sendNoContent(res,204);}
    if(resource==='fields'&&req.method==='POST'&&!resourceId)return sendJson(res,201,await createAuthorizedTableField01092(scope,session.userId,tableId,await readJson(req)));
    if(resource==='fields'&&req.method==='PATCH'&&resourceId)return sendJson(res,200,await updateAuthorizedTableField01092(scope,session.userId,tableId,resourceId,await readJson(req)));
    if(resource==='fields'&&req.method==='DELETE'&&resourceId){await deleteAuthorizedTableField01092(scope,session.userId,tableId,resourceId);return sendNoContent(res,204);}
    if(resource==='records'&&req.method==='POST'&&!resourceId)return sendJson(res,201,await createAuthorizedTableRecord01092(scope,session.userId,tableId,await readJson(req)));
    if(resource==='records'&&req.method==='PATCH'&&resourceId)return sendJson(res,200,await updateAuthorizedTableRecord01092(scope,session.userId,tableId,resourceId,await readJson(req)));
    if(resource==='records'&&req.method==='DELETE'&&resourceId){await deleteAuthorizedTableRecord01092(scope,session.userId,tableId,resourceId);return sendNoContent(res,204);}
    if(resource==='views'&&req.method==='POST'&&!resourceId)return sendJson(res,201,await createAuthorizedTableView01092(scope,session.userId,tableId,await readJson(req)));
    if(resource==='views'&&req.method==='PATCH'&&resourceId)return sendJson(res,200,await updateAuthorizedTableView01092(scope,session.userId,tableId,resourceId,await readJson(req)));
    if(resource==='views'&&req.method==='DELETE'&&resourceId){await deleteAuthorizedTableView01092(scope,session.userId,tableId,resourceId);return sendNoContent(res,204);}
    return sendJson(res,404,{error:'Tables route not found',stage:'01094',requestId:rid});
  }
  if(p[2]==='network'&&p[3]==='inventory'){
    if(req.method==='GET'&&p.length===4)return sendJson(res,200,await listAuthorizedInventory01077(scope));
    if(req.method==='GET'&&p[4]==='reservations')return sendJson(res,200,await listAuthorizedInventoryReservations01077(scope));
    if(req.method==='POST'&&p[4]==='expire'){assertWriteRole(scope);return sendJson(res,200,await expireAuthorizedInventoryReservations01077(scope));}
    if(req.method==='PATCH'&&p[4]==='reservations'&&p[5]){assertWriteRole(scope);return sendJson(res,200,await devTransitionInventoryReservation01077(scope,p[5],await readJson(req)));}
    return sendJson(res,404,{error:'Inventory route not found',requestId:rid});
  }
  if(p[2]==='network'&&p[3]==='shipping'){
    if(req.method==='GET'&&p.length===4)return sendJson(res,200,await listAuthorizedSellerDeliveries01078(scope));
    if(req.method==='GET'&&p[4]==='providers')return sendJson(res,200,await listAuthorizedShippingProviders01078(scope));
    if(req.method==='PATCH'&&p[4]){assertOrderWriteRole(scope);return sendJson(res,200,await updateAuthorizedSellerDelivery01078(scope,p[4],await readJson(req)));}
    if(req.method==='POST'&&p[4]&&p[5]==='simulate'){assertOrderWriteRole(scope);return sendJson(res,200,await simulateAuthorizedSellerDelivery01078(scope,p[4],await readJson(req)));}
    return sendJson(res,404,{error:'Shipping route not found',requestId:rid});
  }
  if(p[2]==='network'&&p[3]==='payments'){
    if(req.method==='GET'&&p.length===4)return sendJson(res,200,await listAuthorizedPayments(scope));
    if(req.method==='POST'&&p[4]==='order'&&p[5]){assertWriteRole(scope);return sendJson(res,201,await ensureAuthorizedPaymentForOrder(scope,p[5]));}
    if(req.method==='PATCH'&&p[4]){assertWriteRole(scope);return sendJson(res,200,await transitionAuthorizedPayment(scope,p[4],await readJson(req)));}
    return sendJson(res,404,{error:'Payment route not found',requestId:rid});
  }
  if(p[2]==='network'&&p[3]==='payouts'){
    if(req.method==='GET'&&p.length===4)return sendJson(res,200,await listAuthorizedPayouts(scope));
    if(req.method==='PATCH'&&p[4]){assertWriteRole(scope);return sendJson(res,200,await markAuthorizedPayout(scope,p[4],await readJson(req)));}
    return sendJson(res,404,{error:'Payout route not found',requestId:rid});
  }
  if(p[2]==='network'&&p[3]==='orders'){
    if(req.method==='GET'&&p.length===4)return sendJson(res,200,await listAuthorizedSellerOrders(scope));
    if(req.method==='PATCH'&&p[4]){assertOrderWriteRole(scope);return sendJson(res,200,await updateAuthorizedSellerOrder(scope,p[4],await readJson(req)));}
    return sendJson(res,404,{error:'Seller order route not found',requestId:rid});
  }
  if(p[2]==='network'){
    if(req.method==='GET'&&p[3]==='context')return sendJson(res,200,await getNetworkView(scope));
    if(req.method==='POST'&&p[3]==='join'){assertWriteRole(scope);return sendJson(res,200,await ensureSeller(scope,await readJson(req)));}
    if(req.method==='PATCH'&&p[3]==='seller'){assertWriteRole(scope);return sendJson(res,200,await updateSeller(scope,await readJson(req)));}
    if(req.method==='PATCH'&&p[3]==='policy'){assertWriteRole(scope);return sendJson(res,200,await updatePolicy(scope,await readJson(req)));}
    if(req.method==='POST'&&p[3]==='products'&&p[5]==='publish'){assertWriteRole(scope);await readJson(req);return sendJson(res,200,await publishNetworkProduct(scope,p[4]));}
    if(req.method==='POST'&&p[3]==='products'&&p[5]==='sync'){assertWriteRole(scope);await readJson(req);return sendJson(res,200,await syncNetworkProduct(scope,p[4]));}
    if(req.method==='POST'&&p[3]==='listings'&&p[5]==='unpublish'){assertWriteRole(scope);await readJson(req);return sendJson(res,200,await unpublishListing(scope,p[4]));}
    return sendJson(res,404,{error:'Network route not found',requestId:rid});
  }
  if(p[2]!=='marketplace')return sendJson(res,404,{error:'Not found',requestId:rid});
  if(p[3]==='snapshot'){
    if(req.method==='GET'&&p.length===4)return sendJson(res,200,await loadSnapshot(scope));
    if(req.method==='GET'&&p[4]==='export')return sendJson(res,200,await loadSnapshot(scope),{'content-disposition':`attachment; filename="marketplace-${scope.storeId}.json"`});
    if(req.method==='PUT'&&p.length===4){const sourceKind=sanitizeImportSource01080(req.headers['x-st-import-source']);if(sourceKind==='studio-local-migration-01080')assertAdminRole(scope);else assertWriteRole(scope);return sendJson(res,200,await replaceSnapshot(scope,await readJson(req),{sourceKind}));}
    if(req.method==='DELETE'&&p.length===4){assertWriteRole(scope);await resetSnapshot(scope);return sendNoContent(res,204);}
  }
  if(p[3]==='seo'){
    if(req.method==='GET')return sendJson(res,200,await getSeo(scope));
    if(req.method==='PATCH'){assertWriteRole(scope);return sendJson(res,200,await updateSeo(scope,await readJson(req)));}
  }
  const key=RESOURCE_PATHS_01071[p[3]];
  if(key){const id=p[4]||'';
    if(req.method==='GET'&&!id)return sendJson(res,200,await listResource(scope,key));
    if(req.method==='GET'&&id){const one=await getResource(scope,key,id);return one?sendJson(res,200,one):sendJson(res,404,{error:'Entity not found',requestId:rid});}
    if(req.method==='POST'&&!id){assertWriteRole(scope);return sendJson(res,201,await createResource(scope,key,await readJson(req)));}
    if(req.method==='PATCH'&&id){assertWriteRole(scope);return sendJson(res,200,await updateResource(scope,key,id,await readJson(req)));}
    if(req.method==='DELETE'&&id){assertWriteRole(scope);const removed=await deleteResource(scope,key,id);return removed?sendNoContent(res,204):sendJson(res,404,{error:'Entity not found',requestId:rid});}
  }
  return sendJson(res,404,{error:'Not found',requestId:rid});
}
const server=http.createServer((req,res)=>{route(req,res).catch(err=>{console.error('[01094]',err);if(!res.headersSent){applyCors(req,res,config.corsOrigin);sendJson(res,err.statusCode||500,{error:err.message||'Internal Server Error',stage:'01094',requestId:res.getHeader('x-st-request-id')||requestId(req)});}else res.end();});});
server.listen(config.port,config.host,()=>console.log(`[01094] ShiftTime Tables + Commerce Backend http://${config.host}:${config.port}`));
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>server.close(()=>pool.end().finally(()=>process.exit(0))));
