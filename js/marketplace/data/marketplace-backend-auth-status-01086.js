// 01086 · Presentation authority for Marketplace Backend auth status.
// Real Auth 01084 is authoritative; DEV token is diagnostic fallback only.
export function resolveBackendAuthDisplay01086({authState={},devToken='',serverScope=null,localContext={}}={}){
  const realToken=String(authState?.token||'').trim();
  const dev=String(devToken||'').trim();
  const realAuthenticated=authState?.status==='authenticated'&&!!realToken;
  const sessionState=realAuthenticated?'active':dev?'dev-fallback':'missing';
  const sessionSource=realAuthenticated?'Real Auth 01084':dev?'DEV token':'—';
  const authScope=authState?.scope||null;
  const authorizedStoreId=String(serverScope?.storeId||authScope?.storeId||'');
  const authorizedWorkspaceId=String(serverScope?.workspaceId||authScope?.workspaceId||'');
  const authorizedAccountId=String(serverScope?.accountId||authScope?.accountId||'');
  const role=String(serverScope?.role||authScope?.role||'');
  return Object.freeze({
    sessionState,
    sessionSource,
    isRealAuth:realAuthenticated,
    hasCredential:realAuthenticated||!!dev,
    authorizedStoreId,
    authorizedWorkspaceId,
    authorizedAccountId,
    role,
    requestedStoreId:String(localContext?.storeId||'')
  });
}
