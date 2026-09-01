// 01089 · Pure Real Auth -> Marketplace propagation helpers.
function clean(v){return String(v??'').trim();}
function isRealAuth(authState={}){return authState?.status==='authenticated'&&clean(authState?.token)&&clean(authState?.scope?.storeId);}
export function resolveMarketplaceRepositoryMode01089({configuredMode='local',authState={}}={}){
  return isRealAuth(authState)?'api':(configuredMode==='api'?'api':'local');
}
export function resolveEffectiveMarketplaceContext01089({authState={},localContext={}}={}){
  if(isRealAuth(authState)){
    const s=authState.scope||{};
    return Object.freeze({
      userId:clean(authState?.user?.id||s.userId),tenantId:clean(s.accountId||s.tenantId),accountId:clean(s.accountId||s.tenantId),accountName:clean(s.accountName),
      workspaceId:clean(s.workspaceId),workspaceName:clean(s.workspaceName),storeId:clean(s.storeId),storeName:clean(s.storeName),
      role:clean(s.role),permissions:Array.isArray(s.permissions)?[...s.permissions]:[],source:'real-auth'
    });
  }
  return Object.freeze({
    userId:clean(localContext?.userId),tenantId:clean(localContext?.tenantId||localContext?.accountId),accountId:clean(localContext?.accountId||localContext?.tenantId),accountName:clean(localContext?.accountName),
    workspaceId:clean(localContext?.workspaceId),workspaceName:clean(localContext?.workspaceName),storeId:clean(localContext?.storeId),storeName:clean(localContext?.storeName),
    role:clean(localContext?.role),permissions:Array.isArray(localContext?.permissions)?[...localContext.permissions]:[],source:'local-context'
  });
}
export function resolveMarketplaceRequestAuth01089({authState={},backendConfig={},localContext={}}={}){
  const ctx=resolveEffectiveMarketplaceContext01089({authState,localContext});
  const real=isRealAuth(authState);
  return Object.freeze({
    token:real?clean(authState.token):clean(backendConfig?.devToken),
    userId:ctx.userId,accountId:ctx.accountId,workspaceId:ctx.workspaceId,storeId:ctx.storeId,role:ctx.role,permissions:[...ctx.permissions],source:real?'real-auth':'dev/local'
  });
}
export function hasRealMarketplaceAuth01089(authState={}){return isRealAuth(authState);}

export function shouldAllowMarketplaceLocalFallback01090(authState={}){return !isRealAuth(authState);}
