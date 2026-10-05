// 01386 · Marketplace Import/Export persistence guard.
// Preview/mapping may run against the current client snapshot, but canonical
// import/export commits are allowed only while MarketplaceStore is backed by
// the authenticated API repository (PostgreSQL on the commerce backend).

export const MARKETPLACE_IMPORT_PERSISTENCE_STAGE_01386='01386';
export const MARKETPLACE_IMPORT_DB_REQUIRED_CODE_01386='MARKETPLACE_IMPORT_DB_REQUIRED_01386';

function str(value){return String(value??'').trim();}

export function getMarketplaceImportPersistenceStatus01386(store){
  const repository=store?.getRepositoryInfo?.()||{};
  const type=str(repository.type).toLowerCase();
  const ready=type==='api'||type.startsWith('api-');
  return Object.freeze({
    stage:MARKETPLACE_IMPORT_PERSISTENCE_STAGE_01386,
    ready,
    repositoryType:str(repository.type),
    repositoryName:str(repository.name),
    baseUrl:str(repository.baseUrl),
    contractVersion:repository.contractVersion??null
  });
}

export function assertMarketplaceImportDatabase01386(store){
  const status=getMarketplaceImportPersistenceStatus01386(store);
  if(status.ready)return status;
  const error=new Error(MARKETPLACE_IMPORT_DB_REQUIRED_CODE_01386);
  error.code=MARKETPLACE_IMPORT_DB_REQUIRED_CODE_01386;
  error.persistence=status;
  throw error;
}

export function marketplaceImportSourceKind01386(kind='products'){
  const safe=str(kind).toLowerCase().replace(/[^a-z0-9._:-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'products';
  return `marketplace-import-${safe}-01386`;
}
