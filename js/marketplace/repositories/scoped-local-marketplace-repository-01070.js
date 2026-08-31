// 01070 · Store-scoped LocalRepository adapter.
// Product/Category models stay storage-agnostic and do NOT gain tenantId/storeId fields.
import {LocalMarketplaceRepository01052,LOCAL_MARKETPLACE_STORAGE_KEY_01052} from './local-marketplace-repository-01052.js?v=01052';
function clean(v){return String(v??'').trim();}
export function getScopedMarketplaceStorageKey01070(storeId){const id=clean(storeId);if(!id)throw new Error('storeId is required');return `${LOCAL_MARKETPLACE_STORAGE_KEY_01052}::store::${encodeURIComponent(id)}`;}
export class ScopedLocalMarketplaceRepository01070 extends LocalMarketplaceRepository01052{
  constructor({tenantId='',workspaceId='',storeId='',storage=globalThis.localStorage}={}){
    const sid=clean(storeId);super({storageKey:getScopedMarketplaceStorageKey01070(sid),storage});
    this.type='local-scoped';this.name='ScopedLocalRepository';this.scope=Object.freeze({tenantId:clean(tenantId),workspaceId:clean(workspaceId),storeId:sid});
  }
}
