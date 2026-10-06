import http from 'node:http';
import {config} from './config.mjs';
import {pool} from './db.mjs';
import {authenticateRequest,resolveAuthorizedStore,assertWriteRole,assertAdminRole,assertOrderWriteRole} from './auth.mjs';
import {listAuthorizedStoreContexts01088} from './auth-context-service-01088.mjs';
import {buildAuthSessionResponse01089} from './auth-session-response-01089.mjs';
import {registerUser01084,loginUser01084,activatePasswordForUser01084,revokeSession01084} from './auth-service-01084.mjs';
import {applyCors,sendJson,sendNoContent,readJson,readBuffer,requestId} from './http-utils.mjs';
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
import {getCloudMediaStorageInfo01081,listAuthorizedCloudMediaAssets01081,beginAuthorizedCloudMediaUpload01081,completeAuthorizedCloudMediaUpload01081,uploadAuthorizedCloudMediaBytes01108,deleteAuthorizedCloudMediaAsset01081,getPublicCloudMediaDelivery01081,resolveAuthorizedMediaTrafficSite01206} from './media-cloud-service.mjs';
import {fetchRemoteImage01396} from './media-remote-image-01396.mjs';
import {listMarketplaceImportRollbacks01397,previewMarketplaceImportRollback01397,restoreMarketplaceImportRollback01397} from './marketplace-import-rollback-01397.mjs';
import {getGoogleSheetsOAuthStatus01398,startGoogleSheetsOAuth01398,completeGoogleSheetsOAuth01398,readPrivateGoogleSheet01398,disconnectGoogleSheetsOAuth01398} from './google-sheets-oauth-01398.mjs';
import {listSupplierSyncSchedules01399,saveSupplierSyncSchedule01399,deleteSupplierSyncSchedule01399,runSupplierSyncNow01399,startSupplierSyncScheduler01399,stopSupplierSyncScheduler01399} from './marketplace-supplier-sync-scheduler-01399.mjs';
import {listSupplierSyncApprovals01400,getSupplierSyncApprovalDetail01400,approveSupplierSyncApproval01400,rejectAndUpdateSupplierSyncApproval01400} from './marketplace-supplier-sync-approval-01400.mjs';
import {listSupplierSyncAlerts01401,setSupplierSyncAlertStatus01401} from './marketplace-supplier-sync-alerts-01401.mjs';
import {getSupplierSyncAlertRules01402,saveSupplierSyncAlertRules01402,resetSupplierSyncAlertRules01402} from './marketplace-supplier-sync-alert-rules-01402.mjs';
import {createPublicCustomerMessage01404,listOrderNotifications01404,listCustomerMessageNotifications01404,setNotificationReceipt01404} from './notification-inbox-01404.mjs';
import {listCustomerMessagesInbox01410,getCustomerMessageThread01410,updateCustomerMessage01410,addCustomerMessageThreadEntry01410,listCustomerMessageManagers01410} from './customer-messages-inbox-01410.mjs';
import {getAiConsultantSettings01411,saveAiConsultantSettings01411} from './ai-consultant-foundation-01411.mjs';
import {queryAiConsultantProducts01412} from './ai-consultant-product-query-01412.mjs';
import {queryAiConsultantConversation01413} from './ai-consultant-conversation-01413.mjs';
import {getPublicAiConsultantBootstrap01414,queryPublicAiConsultant01414,getPublicAiConsultantSession01414} from './ai-consultant-public-01414.mjs';
import {listAiConsultantSalesRules01415,createAiConsultantSalesRule01415,updateAiConsultantSalesRule01415,deleteAiConsultantSalesRule01415} from './ai-consultant-sales-rules-01415.mjs';
import {listNotificationRules01408,createNotificationRule01408,updateNotificationRule01408,deleteNotificationRule01408,duplicateNotificationRule01408} from './notification-rule-engine-01408.mjs';
import {getNotificationTransportStatus01409} from './notification-transports-01409.mjs';
import {listNotificationDeliveries01409,retryNotificationDelivery01409,sendNotificationTransportTest01409} from './notification-delivery-01409.mjs';
import {assertAdminView01087,assertCapability01087,getEffectiveCapabilities01087,getRoleCatalog01087} from './admin-access-01087.mjs';
import {getAdminOverview01087,listMembers01087,updateMembership01087,listInvitations01087,createInvitation01087,revokeInvitation01087,inspectInvitation01087} from './admin-service-01087.mjs';
import {getDatabaseOverview01087,listDatabaseTables01087,getDatabaseTableSchema01087,getDatabaseTableRows01087,listDatabaseMigrations01087} from './database-explorer-service-01087.mjs';
import {listAuthorizedTables01092,getAuthorizedTable01092,createAuthorizedTable01092,updateAuthorizedTable01092,deleteAuthorizedTable01092,createAuthorizedTableField01092,updateAuthorizedTableField01092,deleteAuthorizedTableField01092,createAuthorizedTableRecord01092,updateAuthorizedTableRecord01092,deleteAuthorizedTableRecord01092,createAuthorizedTableView01092,updateAuthorizedTableView01092,deleteAuthorizedTableView01092} from './tables-service-01092.mjs';
import {TABLE_RICH_TEXT_VERSION_01108} from './tables-rich-text-01108.mjs';
import {publishSite01143,getSitePublishStatus01143} from './site-publishing-service-01143.mjs';
import {listBuilderSites01170,getBuilderSite01170,createBuilderSite01170,saveBuilderSite01170,saveBuilderSiteMetadata01231,deleteBuilderSite01170} from './builder-sites-service-01170.mjs';
import {listSiteRevisions01231,getSiteRevision01231,createSiteDraft01231,saveSiteDraft01231,updateSiteDraftDetails01232,deleteSiteDraft01231,publishSiteRevision01231} from './site-revisions-01231.mjs';
import {attachHttpTrafficMeter01194,setTrafficScope01194,setTrafficMetadata01228,closeTrafficRecorder01194} from './traffic-recorder-01194.mjs';
import {getTrafficSummary01194,listTrafficEvents01194,listTrafficIntegrationEvents01201,listTrafficSites01203,listTrafficStorage01206,listTrafficR2Inventory01210,refreshTrafficR2Inventory01210,listTrafficSiteResourceInventory01213,getTrafficSiteResourceInventory01213,cleanupTrafficSiteBrokenReference01219,listTrafficCleanupAudit01221} from './traffic-service-01194.mjs';
import {getSiteGrowthAnalytics01228} from './site-growth-service-01228.mjs';
import {runTrafficContext01201,updateTrafficContext01201,updateAuthenticatedTrafficContext01204} from './traffic-integration-01201.mjs';
import {resolvePublishedSiteTrafficIdentity01203} from './published-site-identity-01203.mjs';
function pathParts(url){return new URL(url,'http://localhost').pathname.split('/').filter(Boolean).map(decodeURIComponent);}
function setScopeHeaders(res,scope,rid){res.setHeader('x-st-request-id',rid);res.setHeader('x-st-account-id',scope.accountId);res.setHeader('x-st-workspace-id',scope.workspaceId);res.setHeader('x-st-store-id',scope.storeId);}
function sameTrafficTenant01203(a={},b={}){return String(a.accountId||'')===String(b.accountId||'')&&String(a.workspaceId||'')===String(b.workspaceId||'')&&String(a.storeId||'')===String(b.storeId||'');}
function sendGoogleOAuthPopup01398(res,{ok=false,code='',targetOrigin=''}={}){const origin=String(targetOrigin||'').trim()||'*',message=JSON.stringify({type:'st:google-sheets-oauth:01398',ok:!!ok,code:String(code||'')}).replace(/</g,'\u003c'),target=JSON.stringify(origin).replace(/</g,'\u003c'),body=`<!doctype html><meta charset=\"utf-8\"><script>try{window.opener&&window.opener.postMessage(${message},${target})}catch{};try{window.close()}catch{}</script>`;res.writeHead(ok?200:400,{'content-type':'text/html; charset=utf-8','content-length':Buffer.byteLength(body),'cache-control':'no-store'});res.end(body);}
async function resolveRequestPublishedTrafficIdentity01203(req){const token=String(req?.headers?.['x-st-site-token']||'').trim();return token?resolvePublishedSiteTrafficIdentity01203(token):null;}
function requestClientAddress01414(req){return String(req?.headers?.['x-forwarded-for']||req?.socket?.remoteAddress||'').split(',')[0].trim();}
async function route(req,res,rid=requestId(req)){applyCors(req,res,config.corsOrigin);if(req.method==='OPTIONS')return sendNoContent(res,204);res.setHeader('x-st-request-id',rid);const p=pathParts(req.url);
  if(req.method==='GET'&&p.length===1&&p[0]==='health'){try{await pool.query('SELECT 1');return sendJson(res,200,{ok:true,stage:config.stage,database:'postgresql',time:new Date().toISOString(),requestId:rid});}catch(e){return sendJson(res,503,{ok:false,stage:config.stage,database:'unavailable',error:e.message,requestId:rid});}}
  if(p[0]!=='api'||p[1]!=='v1')return sendJson(res,404,{error:'Not found',requestId:rid});
  const publishedTrafficIdentity=await resolveRequestPublishedTrafficIdentity01203(req);if(publishedTrafficIdentity){setTrafficScope01194(res,publishedTrafficIdentity);updateTrafficContext01201(publishedTrafficIdentity);}
  if(req.method==='POST'&&p[2]==='public'&&p[3]==='traffic'&&p[4]==='ping'){if(!publishedTrafficIdentity)return sendJson(res,401,{error:'Published site identity required',stage:'01228',requestId:rid});const body=await readJson(req,{limit:8192});setTrafficMetadata01228(res,{sessionId:String(body?.sessionId||'').trim().slice(0,120),pagePath:String(body?.pagePath||'').trim().slice(0,500),referrerPath:String(body?.referrerPath||'').trim().slice(0,500),clientStage:'01228'});return sendJson(res,200,{ok:true,stage:'01228',siteId:publishedTrafficIdentity.siteId,requestId:rid});}
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
  if(req.method==='POST'&&p[2]==='public'&&p[3]==='site'&&p[4]==='messages'){if(!publishedTrafficIdentity)return sendJson(res,401,{error:'PUBLISHED_SITE_IDENTITY_REQUIRED_01404',stage:'01404',requestId:rid});const out=await createPublicCustomerMessage01404(publishedTrafficIdentity,await readJson(req,{limit:32*1024}),{remoteAddress:req.socket?.remoteAddress||'',userAgent:req.headers['user-agent']||''});return sendJson(res,201,{...out,requestId:rid});}
  if(p[2]==='public'&&p[3]==='ai-consultant'){
    if(!publishedTrafficIdentity)return sendJson(res,401,{error:'PUBLISHED_SITE_IDENTITY_REQUIRED_01414',stage:'01414',requestId:rid});
    if(req.method==='GET'&&p[4]==='bootstrap'&&p.length===5)return sendJson(res,200,{...(await getPublicAiConsultantBootstrap01414(publishedTrafficIdentity)),requestId:rid});
    if(req.method==='POST'&&p[4]==='query'&&p.length===5){const body=await readJson(req,{limit:16*1024});const visitorKey=String(req.headers['x-st-ai-visitor']||body?.visitorKey||'').trim();const out=await queryPublicAiConsultant01414(publishedTrafficIdentity,{...body,visitorKey},{visitorKey,remoteAddress:requestClientAddress01414(req),userAgent:req.headers['user-agent']||''});return sendJson(res,200,{...out,requestId:rid});}
    if(req.method==='GET'&&p[4]==='session'&&p.length===5){const u=new URL(req.url,'http://localhost'),visitorKey=String(req.headers['x-st-ai-visitor']||'').trim();const out=await getPublicAiConsultantSession01414(publishedTrafficIdentity,{sessionId:u.searchParams.get('sessionId')||'',visitorKey});return sendJson(res,200,{...out,requestId:rid});}
    return sendJson(res,404,{error:'AI_CONSULTANT_PUBLIC_ROUTE_NOT_FOUND_01414',stage:'01414',requestId:rid});
  }
  if(p[2]==='public'&&p[3]==='marketplace'&&p[4]==='cart'){const token=String(req.headers['x-st-cart-id']||'');
    if(req.method==='GET'&&p.length===5){const out=await getPublicCart(token);return sendJson(res,200,out,{'x-st-cart-id':out.id});}
    if(req.method==='DELETE'&&p.length===5){const out=await clearPublicCart(token);return sendJson(res,200,out,{'x-st-cart-id':out.id});}
    if(req.method==='POST'&&p[5]==='refresh'){const out=await refreshPublicCart(token);return sendJson(res,200,out,{'x-st-cart-id':out.id});}
    if(req.method==='POST'&&p[5]==='items'&&!p[6]){const out=await addPublicCartOffer(token,await readJson(req));return sendJson(res,200,out,{'x-st-cart-id':out.id});}
    if(req.method==='PATCH'&&p[5]==='items'&&p[6]){const out=await setPublicCartQuantity(token,p[6],await readJson(req));return sendJson(res,200,out,{'x-st-cart-id':out.id});}
    if(req.method==='DELETE'&&p[5]==='items'&&p[6]){const out=await removePublicCartItem(token,p[6]);return sendJson(res,200,out,{'x-st-cart-id':out.id});}
    return sendJson(res,404,{error:'Cart route not found',requestId:rid});
  }
  if(req.method==='GET'&&p[2]==='integrations'&&p[3]==='google-sheets'&&p[4]==='oauth'&&p[5]==='callback'){
    const u=new URL(req.url,'http://localhost');try{const out=await completeGoogleSheetsOAuth01398({code:u.searchParams.get('code')||'',state:u.searchParams.get('state')||'',error:u.searchParams.get('error')||''});return sendGoogleOAuthPopup01398(res,{ok:true,code:'connected',targetOrigin:out.returnOrigin});}catch(e){return sendGoogleOAuthPopup01398(res,{ok:false,code:e?.code||e?.message||'oauth_failed',targetOrigin:e?.returnOrigin||''});}
  }
  const session=await authenticateRequest(req);
  if(req.method==='POST'&&p[2]==='auth'&&p[3]==='activate-password'){const out=await activatePasswordForUser01084(session.userId,await readJson(req));return sendJson(res,200,{...out,stage:'01084',requestId:rid});}
  if(req.method==='POST'&&p[2]==='auth'&&p[3]==='logout'){await revokeSession01084(session.sessionId);return sendJson(res,200,{ok:true,stage:'01084',requestId:rid});}
  if(req.method==='GET'&&p[2]==='auth'&&p[3]==='contexts')return sendJson(res,200,{stage:'01094',contexts:await listAuthorizedStoreContexts01088(session.userId),requestId:rid});
  const scope=await resolveAuthorizedStore(session.userId,req.headers['x-st-store-id']);setScopeHeaders(res,scope,rid);const publishedSiteId=publishedTrafficIdentity&&sameTrafficTenant01203(publishedTrafficIdentity,scope)?publishedTrafficIdentity.siteId:'';setTrafficScope01194(res,{...scope,actorUserId:session.userId,siteId:publishedSiteId});updateAuthenticatedTrafficContext01204({scope,actorUserId:session.userId,publishedSiteId});
  if(req.method==='GET'&&p[2]==='auth'&&p[3]==='session')return sendJson(res,200,buildAuthSessionResponse01089({session,scope,requestId:rid}));
  if(p[2]==='notifications'){
    if(req.method==='GET'&&p[3]==='orders'&&p.length===4){assertOrderWriteRole(scope);return sendJson(res,200,await listOrderNotifications01404(scope));}
    if(req.method==='GET'&&p[3]==='messages'&&p.length===4){assertOrderWriteRole(scope);return sendJson(res,200,await listCustomerMessageNotifications01404(scope));}
    if(p[3]==='messages'&&p[4]==='inbox'){
      assertOrderWriteRole(scope);
      if(req.method==='GET'&&p.length===5){const u=new URL(req.url,'http://localhost');return sendJson(res,200,await listCustomerMessagesInbox01410(scope,Object.fromEntries(u.searchParams.entries())));}
      if(req.method==='GET'&&p[5]==='managers'&&p.length===6)return sendJson(res,200,await listCustomerMessageManagers01410(scope));
      const messageId=p[5]||'';
      if(req.method==='GET'&&messageId&&p.length===6){const u=new URL(req.url,'http://localhost');return sendJson(res,200,await getCustomerMessageThread01410(scope,messageId,{markRead:u.searchParams.get('markRead')==='1',actorUserId:session.userId}));}
      if(req.method==='PATCH'&&messageId&&p.length===6){assertWriteRole(scope);return sendJson(res,200,await updateCustomerMessage01410(scope,messageId,await readJson(req,{limit:16384}),{userId:session.userId,name:session.name,email:session.email}));}
      if(req.method==='POST'&&messageId&&p[6]==='thread'){assertWriteRole(scope);return sendJson(res,201,await addCustomerMessageThreadEntry01410(scope,messageId,await readJson(req,{limit:16384}),{userId:session.userId,name:session.name,email:session.email}));}
      return sendJson(res,404,{error:'CUSTOMER_MESSAGES_INBOX_ROUTE_NOT_FOUND_01410',stage:'01410',requestId:rid});
    }
    if(req.method==='GET'&&p[3]==='transports'&&p[4]==='status'&&p.length===5)return sendJson(res,200,getNotificationTransportStatus01409());
    if(req.method==='POST'&&p[3]==='transports'&&p[4]&&p[5]==='test'){assertWriteRole(scope);await readJson(req,{limit:4096});return sendJson(res,200,await sendNotificationTransportTest01409(scope,p[4]));}
    if(req.method==='GET'&&p[3]==='deliveries'&&p.length===4){const u=new URL(req.url,'http://localhost');return sendJson(res,200,await listNotificationDeliveries01409(scope,Object.fromEntries(u.searchParams.entries())));}
    if(req.method==='POST'&&p[3]==='deliveries'&&p[4]&&p[5]==='retry'){assertWriteRole(scope);await readJson(req,{limit:4096});return sendJson(res,200,await retryNotificationDelivery01409(scope,p[4]));}
    if(p[3]==='rules'){
      const ruleId=p[4]||'';
      if(req.method==='GET'&&!ruleId)return sendJson(res,200,await listNotificationRules01408(scope));
      if(req.method==='POST'&&!ruleId){assertWriteRole(scope);return sendJson(res,201,await createNotificationRule01408(scope,await readJson(req,{limit:32768})));}
      if(req.method==='PUT'&&ruleId&&p.length===5){assertWriteRole(scope);return sendJson(res,200,await updateNotificationRule01408(scope,ruleId,await readJson(req,{limit:32768})));}
      if(req.method==='DELETE'&&ruleId&&p.length===5){assertWriteRole(scope);return sendJson(res,200,await deleteNotificationRule01408(scope,ruleId));}
      if(req.method==='POST'&&ruleId&&p[5]==='duplicate'){assertWriteRole(scope);await readJson(req,{limit:4096});return sendJson(res,201,await duplicateNotificationRule01408(scope,ruleId));}
      return sendJson(res,404,{error:'NOTIFICATION_RULE_ROUTE_NOT_FOUND_01408',stage:'01408',requestId:rid});
    }
    if(req.method==='POST'&&['orders','messages'].includes(p[3])&&p[4]&&['read','dismiss'].includes(p[5])){assertWriteRole(scope);await readJson(req,{limit:4096});return sendJson(res,200,await setNotificationReceipt01404(scope,p[3],p[4],p[5]==='read'?'read':'dismissed',session.userId));}
    return sendJson(res,404,{error:'NOTIFICATION_ROUTE_NOT_FOUND_01408',stage:'01408',requestId:rid});
  }
  if(p[2]==='ai-consultant'){
    if(p[3]==='settings'){
      const u=new URL(req.url,'http://localhost'),siteId=u.searchParams.get('siteId')||'';
      if(req.method==='GET'&&p.length===4)return sendJson(res,200,await getAiConsultantSettings01411(scope,siteId));
      if(req.method==='PUT'&&p.length===4){assertWriteRole(scope);return sendJson(res,200,await saveAiConsultantSettings01411(scope,siteId,await readJson(req,{limit:32768}),session.userId));}
      return sendJson(res,404,{error:'AI_CONSULTANT_SETTINGS_ROUTE_NOT_FOUND_01411',stage:'01411',requestId:rid});
    }
    if(p[3]==='product-query'){
      const u=new URL(req.url,'http://localhost'),siteId=u.searchParams.get('siteId')||'';
      if(req.method==='POST'&&p.length===4)return sendJson(res,200,await queryAiConsultantProducts01412(scope,siteId,await readJson(req,{limit:8192})));
      return sendJson(res,404,{error:'AI_CONSULTANT_PRODUCT_QUERY_ROUTE_NOT_FOUND_01412',stage:'01412',requestId:rid});
    }
    if(p[3]==='sales-rules'){
      const u=new URL(req.url,'http://localhost'),siteId=u.searchParams.get('siteId')||'',ruleId=p[4]||'';
      if(req.method==='GET'&&!ruleId&&p.length===4)return sendJson(res,200,await listAiConsultantSalesRules01415(scope,siteId));
      if(req.method==='POST'&&!ruleId&&p.length===4){assertWriteRole(scope);return sendJson(res,201,await createAiConsultantSalesRule01415(scope,siteId,await readJson(req,{limit:32768}),session.userId));}
      if(req.method==='PUT'&&ruleId&&p.length===5){assertWriteRole(scope);return sendJson(res,200,await updateAiConsultantSalesRule01415(scope,siteId,ruleId,await readJson(req,{limit:32768}),session.userId));}
      if(req.method==='DELETE'&&ruleId&&p.length===5){assertWriteRole(scope);return sendJson(res,200,await deleteAiConsultantSalesRule01415(scope,siteId,ruleId));}
      return sendJson(res,404,{error:'AI_CONSULTANT_SALES_RULE_ROUTE_NOT_FOUND_01415',stage:'01415',requestId:rid});
    }
    if(p[3]==='conversation-query'){
      const u=new URL(req.url,'http://localhost'),siteId=u.searchParams.get('siteId')||'';
      if(req.method==='POST'&&p.length===4)return sendJson(res,200,await queryAiConsultantConversation01413(scope,siteId,await readJson(req,{limit:16384}),session.userId));
      return sendJson(res,404,{error:'AI_CONSULTANT_CONVERSATION_ROUTE_NOT_FOUND_01413',stage:'01413',requestId:rid});
    }
    return sendJson(res,404,{error:'AI_CONSULTANT_ROUTE_NOT_FOUND_01415',stage:'01415',requestId:rid});
  }
  if(req.method==='GET'&&p[2]==='session')return sendJson(res,200,buildAuthSessionResponse01089({session,scope,requestId:rid}));
  if(p[2]==='integrations'&&p[3]==='google-sheets'){
    if(req.method==='GET'&&p[4]==='oauth'&&p[5]==='status')return sendJson(res,200,await getGoogleSheetsOAuthStatus01398(scope));
    if(req.method==='POST'&&p[4]==='oauth'&&p[5]==='start'){assertWriteRole(scope);return sendJson(res,200,await startGoogleSheetsOAuth01398(scope,await readJson(req,{limit:16*1024})));}
    if(req.method==='POST'&&p[4]==='oauth'&&p[5]==='disconnect'){assertWriteRole(scope);await readJson(req,{limit:4096});return sendJson(res,200,await disconnectGoogleSheetsOAuth01398(scope));}
    if(req.method==='POST'&&p[4]==='read'){assertWriteRole(scope);return sendJson(res,200,await readPrivateGoogleSheet01398(scope,await readJson(req,{limit:64*1024})));}
    return sendJson(res,404,{error:'Google Sheets integration route not found',stage:'01398',requestId:rid});
  }
  if(req.method==='GET'&&p[2]==='site-revisions'&&p.length===3)return sendJson(res,200,{stage:'01231',revisions:await listSiteRevisions01231(scope)});
  if(p[2]==='sites'&&p[3]&&p[4]==='revisions'){
    const siteId=p[3],revisionId=p[5]||'',action=p[6]||'';
    if(req.method==='GET'&&p.length===5)return sendJson(res,200,{stage:'01231',revisions:await listSiteRevisions01231(scope,siteId)});
    if(req.method==='POST'&&p.length===5){assertWriteRole(scope);return sendJson(res,201,{stage:'01231',revision:await createSiteDraft01231(scope,session.userId,siteId,await readJson(req,{limit:32*1024*1024}))});}
    if(req.method==='GET'&&revisionId&&p.length===6)return sendJson(res,200,{stage:'01231',revision:await getSiteRevision01231(scope,siteId,revisionId)});
    if(req.method==='PUT'&&revisionId&&p.length===6){assertWriteRole(scope);return sendJson(res,200,{stage:'01232',revision:await saveSiteDraft01231(scope,session.userId,siteId,revisionId,await readJson(req,{limit:32*1024*1024}))});}
    if(req.method==='PATCH'&&revisionId&&action==='details'&&p.length===7){assertWriteRole(scope);return sendJson(res,200,{stage:'01232',revision:await updateSiteDraftDetails01232(scope,session.userId,siteId,revisionId,await readJson(req,{limit:64*1024}))});}
    if(req.method==='DELETE'&&revisionId&&p.length===6){assertWriteRole(scope);return sendJson(res,200,{stage:'01232',...(await deleteSiteDraft01231(scope,siteId,revisionId))});}
    if(req.method==='POST'&&revisionId&&action==='publish'&&p.length===7){assertWriteRole(scope);return sendJson(res,200,{stage:'01231',revision:await publishSiteRevision01231(scope,session.userId,siteId,revisionId)});}
    return sendJson(res,404,{error:'Site revision route not found',stage:'01232',requestId:rid});
  }
  if(p[2]==='sites'&&p[3]&&p[4]==='publish-status'&&req.method==='GET')return sendJson(res,200,await getSitePublishStatus01143(scope,p[3]));
  if(p[2]==='sites'&&p[3]&&p[4]==='publish'&&req.method==='POST'){assertWriteRole(scope);return sendJson(res,202,await publishSite01143(scope,session.userId,p[3],await readJson(req,{limit:32*1024*1024})));}
  if(p[2]==='sites'&&req.method==='GET'&&p.length===3)return sendJson(res,200,{stage:'01170',sites:await listBuilderSites01170(scope)});
  if(p[2]==='sites'&&p[3]&&req.method==='GET'&&p.length===4)return sendJson(res,200,{stage:'01170',site:await getBuilderSite01170(scope,p[3])});
  if(p[2]==='sites'&&req.method==='POST'&&p.length===3){assertWriteRole(scope);return sendJson(res,201,{stage:'01170',site:await createBuilderSite01170(scope,session.userId,await readJson(req,{limit:32*1024*1024}))});}
  if(p[2]==='sites'&&p[3]&&p[4]==='metadata'&&req.method==='PATCH'&&p.length===5){assertWriteRole(scope);return sendJson(res,200,{stage:'01231',site:await saveBuilderSiteMetadata01231(scope,p[3],await readJson(req,{limit:1024*1024}))});}
  if(p[2]==='sites'&&p[3]&&req.method==='PUT'&&p.length===4){assertWriteRole(scope);return sendJson(res,200,{stage:'01170',site:await saveBuilderSite01170(scope,session.userId,p[3],await readJson(req,{limit:32*1024*1024}))});}
  if(p[2]==='sites'&&p[3]&&req.method==='DELETE'&&p.length===4){assertAdminRole(scope);return sendJson(res,200,{stage:'01170',...(await deleteBuilderSite01170(scope,session.userId,p[3]))});}
  if(p[2]==='admin'){
    assertAdminView01087(scope);
    if(req.method==='GET'&&p[3]==='overview')return sendJson(res,200,{...(await getAdminOverview01087(scope,session.userId)),actor:{userId:session.userId,email:session.email,name:session.name,role:scope.role,capabilities:getEffectiveCapabilities01087(scope)},scope});
    if(req.method==='GET'&&p[3]==='traffic'&&p[4]==='summary'){assertCapability01087(scope,'admin.traffic.view','Traffic Control view permission required');return sendJson(res,200,await getTrafficSummary01194(scope));}
    if(req.method==='GET'&&p[3]==='traffic'&&p[4]==='events'){assertCapability01087(scope,'admin.traffic.view','Traffic Control view permission required');const u=new URL(req.url,'http://localhost');return sendJson(res,200,await listTrafficEvents01194(scope,{limit:u.searchParams.get('limit')}));} 
    if(req.method==='GET'&&p[3]==='traffic'&&p[4]==='integrations'){assertCapability01087(scope,'admin.traffic.view','Traffic Control view permission required');const u=new URL(req.url,'http://localhost');return sendJson(res,200,await listTrafficIntegrationEvents01201(scope,{limit:u.searchParams.get('limit')}));}
    if(req.method==='GET'&&p[3]==='traffic'&&p[4]==='sites'){assertCapability01087(scope,'admin.traffic.view','Traffic Control view permission required');const u=new URL(req.url,'http://localhost');return sendJson(res,200,await listTrafficSites01203(scope,{limit:u.searchParams.get('limit')}));}
    if(req.method==='GET'&&p[3]==='traffic'&&p[4]==='cleanup-audit'){assertCapability01087(scope,'admin.traffic.view','Traffic Control view permission required');const u=new URL(req.url,'http://localhost');return sendJson(res,200,await listTrafficCleanupAudit01221(scope,{limit:u.searchParams.get('limit')}));}
    if(req.method==='GET'&&p[3]==='traffic'&&p[4]==='storage'){assertCapability01087(scope,'admin.traffic.view','Traffic Control view permission required');const u=new URL(req.url,'http://localhost');return sendJson(res,200,await listTrafficStorage01206(scope,{limit:u.searchParams.get('limit')}));}
    if(req.method==='GET'&&p[3]==='traffic'&&p[4]==='r2-inventory'){assertCapability01087(scope,'admin.traffic.view','Traffic Control view permission required');const u=new URL(req.url,'http://localhost');return sendJson(res,200,await listTrafficR2Inventory01210(scope,Object.fromEntries(u.searchParams.entries())));}
    if(req.method==='POST'&&p[3]==='traffic'&&p[4]==='r2-inventory'&&p[5]==='refresh'){assertCapability01087(scope,'admin.traffic.view','Traffic Control view permission required');const u=new URL(req.url,'http://localhost');return sendJson(res,200,await refreshTrafficR2Inventory01210(scope,Object.fromEntries(u.searchParams.entries())));}
    if(req.method==='GET'&&p[3]==='traffic'&&p[4]==='site-resource-inventory'&&!p[5]){assertCapability01087(scope,'admin.traffic.view','Traffic Control view permission required');const u=new URL(req.url,'http://localhost');return sendJson(res,200,await listTrafficSiteResourceInventory01213(scope,session.userId,Object.fromEntries(u.searchParams.entries())));}
    if(req.method==='GET'&&p[3]==='traffic'&&p[4]==='site-growth'&&p[5]){assertCapability01087(scope,'admin.traffic.view','Traffic Control view permission required');const u=new URL(req.url,'http://localhost');return sendJson(res,200,await getSiteGrowthAnalytics01228(scope,session.userId,p[5],Object.fromEntries(u.searchParams.entries())));}
    if(req.method==='POST'&&p[3]==='traffic'&&p[4]==='site-resource-inventory'&&p[5]&&p[6]==='cleanup'){assertCapability01087(scope,'admin.database.rows','Database row permission required');return sendJson(res,200,await cleanupTrafficSiteBrokenReference01219(scope,session.userId,p[5],await readJson(req)));}
    if(req.method==='GET'&&p[3]==='traffic'&&p[4]==='site-resource-inventory'&&p[5]){assertCapability01087(scope,'admin.traffic.view','Traffic Control view permission required');const u=new URL(req.url,'http://localhost');return sendJson(res,200,await getTrafficSiteResourceInventory01213(scope,session.userId,p[5],Object.fromEntries(u.searchParams.entries())));}
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
    const candidateSiteId=String(req.headers['x-st-site-id']||'').trim();
    const verifiedSiteId=candidateSiteId?await resolveAuthorizedMediaTrafficSite01206(scope,candidateSiteId):'';
    const mediaSiteId=verifiedSiteId||publishedSiteId;
    const mediaScope={...scope,actorUserId:session.userId,siteId:mediaSiteId};
    if(mediaSiteId){setTrafficScope01194(res,mediaScope);updateTrafficContext01201({siteId:mediaSiteId});}
    if(req.method==='GET'&&p[3]==='storage'&&p[4]==='status')return sendJson(res,200,getCloudMediaStorageInfo01081());
    if(req.method==='POST'&&p[3]==='remote-image'&&p[4]==='fetch'){assertWriteRole(scope);const body=await readJson(req,{limit:64*1024}),remote=await fetchRemoteImage01396(body?.url);const bytes=remote.bytes;res.__stTrafficOutboundBytes01194=bytes.length;res.writeHead(200,{'content-type':remote.mimeType,'content-length':bytes.length,'content-disposition':`attachment; filename="${remote.fileName.replace(/["\\]/g,'_')}"`,'x-st-remote-final-url':remote.finalUrl,'x-st-remote-source-bytes':String(remote.sizeBytes),'cache-control':'no-store'});return res.end(bytes);}
    if(req.method==='GET'&&p[3]==='assets'&&!p[4])return sendJson(res,200,await listAuthorizedCloudMediaAssets01081(scope));
    if(req.method==='POST'&&p[3]==='uploads'&&!p[4]){assertWriteRole(scope);return sendJson(res,201,await beginAuthorizedCloudMediaUpload01081(mediaScope,await readJson(req)));}
    if(req.method==='POST'&&p[3]==='uploads'&&p[4]==='proxy'){assertWriteRole(scope);const u=new URL(req.url,'http://localhost'),bytes=await readBuffer(req,{limit:config.mediaMaxUploadBytes});return sendJson(res,201,await uploadAuthorizedCloudMediaBytes01108(mediaScope,{fileName:u.searchParams.get('fileName')||'image',mimeType:String(req.headers['content-type']||''),width:u.searchParams.get('width'),height:u.searchParams.get('height'),lastModified:u.searchParams.get('lastModified'),folder:u.searchParams.get('folder')||'tables'},bytes));}
    if(req.method==='POST'&&p[3]==='uploads'&&p[4]&&p[5]==='complete'){assertWriteRole(scope);return sendJson(res,200,await completeAuthorizedCloudMediaUpload01081(mediaScope,p[4],await readJson(req)));}
    if(req.method==='DELETE'&&p[3]==='assets'&&p[4]){assertWriteRole(scope);return sendJson(res,200,await deleteAuthorizedCloudMediaAsset01081(scope,p[4]));}
    return sendJson(res,404,{error:'Media cloud route not found',requestId:rid});
  }
  if(req.method==='POST'&&p[2]==='deployment'&&p[3]==='import-local-operational'){assertAdminRole(scope);return sendJson(res,200,await importLocalOperationalBundle01080(scope,await readJson(req)));}
  if(req.method==='GET'&&p[2]==='platform'&&p[3]==='context')return sendJson(res,200,await getAuthorizedPlatformSnapshot(session.userId,scope));
  if(req.method==='POST'&&p[2]==='platform'&&p[3]==='workspaces')return sendJson(res,201,await createAuthorizedWorkspace(session.userId,scope.accountId,await readJson(req)));
  if(req.method==='POST'&&p[2]==='platform'&&p[3]==='stores'){const body=await readJson(req);return sendJson(res,201,await createAuthorizedStore(session.userId,String(body.workspaceId||scope.workspaceId),body));}
  if(p[2]==='tables'){
    const tableId=p[3]||'',resource=p[4]||'',resourceId=p[5]||'';
    if(req.method==='GET'&&!tableId)return sendJson(res,200,{stage:'01108',tablesRichTextVersion:TABLE_RICH_TEXT_VERSION_01108,tables:await listAuthorizedTables01092(scope,session.userId)});
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
    return sendJson(res,404,{error:'Tables route not found',stage:'01108',tablesRichTextVersion:TABLE_RICH_TEXT_VERSION_01108,requestId:rid});
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
    if(req.method==='PUT'&&p.length===4){const sourceKind=sanitizeImportSource01080(req.headers['x-st-import-source']),rollbackJobId=String(req.headers['x-st-rollback-job-id']||'').trim().replace(/[^a-z0-9._:-]/gi,'-').slice(0,140);if(sourceKind==='studio-local-migration-01080')assertAdminRole(scope);else assertWriteRole(scope);return sendJson(res,200,await replaceSnapshot(scope,await readJson(req),{sourceKind,rollbackJobId}));}
    if(req.method==='DELETE'&&p.length===4){assertWriteRole(scope);await resetSnapshot(scope);return sendNoContent(res,204);}
  }
  if(p[3]==='supplier-sync-schedules'){
    const sourceId=p[4]||'';
    if(req.method==='GET'&&!sourceId)return sendJson(res,200,await listSupplierSyncSchedules01399(scope));
    if(req.method==='PUT'&&sourceId){assertWriteRole(scope);return sendJson(res,200,await saveSupplierSyncSchedule01399(scope,sourceId,await readJson(req)));}
    if(req.method==='DELETE'&&sourceId){assertWriteRole(scope);return sendJson(res,200,await deleteSupplierSyncSchedule01399(scope,sourceId));}
    if(req.method==='POST'&&sourceId&&p[5]==='run'){assertWriteRole(scope);await readJson(req);return sendJson(res,200,await runSupplierSyncNow01399(scope,sourceId));}
    return sendJson(res,404,{error:'Supplier sync scheduler route not found',stage:'01399',requestId:rid});
  }
  if(p[3]==='supplier-sync-alerts'){
    const alertId=p[4]||'';
    if(req.method==='GET'&&!alertId){const u=new URL(req.url,'http://localhost');return sendJson(res,200,await listSupplierSyncAlerts01401(scope,{status:u.searchParams.get('status')||'',kind:u.searchParams.get('kind')||'',severity:u.searchParams.get('severity')||'',sourceId:u.searchParams.get('sourceId')||''}));}
    if(req.method==='POST'&&alertId&&p[5]==='read'){assertWriteRole(scope);await readJson(req,{limit:4096});return sendJson(res,200,await setSupplierSyncAlertStatus01401(scope,alertId,'read'));}
    if(req.method==='POST'&&alertId&&p[5]==='dismiss'){assertWriteRole(scope);await readJson(req,{limit:4096});return sendJson(res,200,await setSupplierSyncAlertStatus01401(scope,alertId,'dismissed'));}
    return sendJson(res,404,{error:'Supplier sync alert route not found',stage:'01401',requestId:rid});
  }
  if(p[3]==='supplier-sync-alert-rules'){
    if(req.method==='GET'&&p.length===4)return sendJson(res,200,await getSupplierSyncAlertRules01402(scope));
    if(req.method==='PUT'&&p.length===4){assertWriteRole(scope);return sendJson(res,200,await saveSupplierSyncAlertRules01402(scope,await readJson(req,{limit:32768})));}
    if(req.method==='DELETE'&&p.length===4){assertWriteRole(scope);await readJson(req,{limit:4096});return sendJson(res,200,await resetSupplierSyncAlertRules01402(scope));}
    return sendJson(res,404,{error:'Supplier sync alert rules route not found',stage:'01402',requestId:rid});
  }
  if(p[3]==='supplier-sync-approvals'){
    const approvalId=p[4]||'';
    if(req.method==='GET'&&!approvalId)return sendJson(res,200,await listSupplierSyncApprovals01400(scope));
    if(req.method==='GET'&&approvalId&&p.length===5)return sendJson(res,200,await getSupplierSyncApprovalDetail01400(scope,approvalId));
    if(req.method==='POST'&&approvalId&&p[5]==='approve'){assertWriteRole(scope);await readJson(req);return sendJson(res,200,await approveSupplierSyncApproval01400(scope,approvalId));}
    if(req.method==='POST'&&approvalId&&p[5]==='reject'){assertWriteRole(scope);await readJson(req);return sendJson(res,200,await rejectAndUpdateSupplierSyncApproval01400(scope,approvalId));}
    return sendJson(res,404,{error:'Supplier sync approval route not found',stage:'01400',requestId:rid});
  }
  if(p[3]==='import-rollbacks'){
    if(req.method==='GET'&&p.length===4)return sendJson(res,200,await listMarketplaceImportRollbacks01397(scope));
    if(req.method==='GET'&&p[4]&&p[5]==='preview')return sendJson(res,200,await previewMarketplaceImportRollback01397(scope,p[4]));
    if(req.method==='POST'&&p[4]&&p[5]==='restore'){assertWriteRole(scope);await readJson(req);return sendJson(res,200,await restoreMarketplaceImportRollback01397(scope,p[4]));}
    return sendJson(res,404,{error:'Import rollback route not found',stage:'01397',requestId:rid});
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
const server=http.createServer((req,res)=>{const rid=requestId(req);res.setHeader('x-st-request-id',rid);attachHttpTrafficMeter01194(req,res);runTrafficContext01201({requestId:rid,method:req.method,pathname:new URL(req.url||'/','http://localhost').pathname},()=>route(req,res,rid)).catch(err=>{console.error(`[${config.stage}]`,err);if(!res.headersSent){applyCors(req,res,config.corsOrigin);sendJson(res,err.statusCode||500,{error:err.message||'Internal Server Error',stage:config.stage,requestId:res.getHeader('x-st-request-id')||rid});}else res.end();});});
server.listen(config.port,config.host,()=>{console.log(`[${config.stage}] ShiftTime Backend http://${config.host}:${config.port}`);startSupplierSyncScheduler01399();});
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{stopSupplierSyncScheduler01399();server.close(async()=>{try{await closeTrafficRecorder01194();}finally{await pool.end();process.exit(0);}});});
