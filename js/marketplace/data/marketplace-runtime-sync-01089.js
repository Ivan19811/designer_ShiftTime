// 01089 · Keep store-scoped operational repositories fresh when Auth Store changes.
export async function syncMarketplaceOperationalRepository01089(store,next,{reason='backend-status-changed',refresh=null}={}){
  if(!store||!next)return null;
  const currentType=String(store.getRepositoryInfo?.().type||''),nextType=String(next.type||'');
  if(currentType!==nextType){await store.setRepository(next);return 'repository-switched';}
  if(typeof refresh==='function'){await refresh(reason);return 'refreshed';}
  if(typeof store.refresh==='function'){await store.refresh(reason);return 'refreshed';}
  return 'unchanged';
}
