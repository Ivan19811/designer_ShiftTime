// 01073 · Composition root for the public central Marketplace catalog.
import {MarketplaceGlobalCatalogStore01073} from './marketplace-global-catalog-store-01073.js?v=01073';
import {LocalMarketplacePublicCatalogRepository01073} from '../repositories/local-marketplace-public-catalog-repository-01073.js?v=01077';
import {ApiMarketplacePublicCatalogRepository01073} from '../repositories/api-marketplace-public-catalog-repository-01073.js?v=01082';
import {getMarketplaceBackendConfig01071} from './marketplace-backend-config-01071.js?v=01071';
import {getMarketplaceBackendStatus01071} from './marketplace-backend-runtime-01071.js?v=01082';
let store=null,unsubNetwork=false;
function desired(){const c=getMarketplaceBackendConfig01071(),s=getMarketplaceBackendStatus01071();return s.state==='api'?new ApiMarketplacePublicCatalogRepository01073({baseUrl:c.apiBaseUrl,requestTimeoutMs:c.requestTimeoutMs}):new LocalMarketplacePublicCatalogRepository01073();}
export function getMarketplaceGlobalCatalogStore01073(){if(!store)store=new MarketplaceGlobalCatalogStore01073({repository:desired()});return store;}
export async function initMarketplaceGlobalCatalogRuntime01073(){const s=getMarketplaceGlobalCatalogStore01073();await s.search({},'init');if(!unsubNetwork){unsubNetwork=true;window.addEventListener('st:marketplace-network-changed',()=>{if(s.getRepositoryInfo().type==='local-public-catalog')s.search({...s.query,page:1},'network-changed').catch(()=>{});});window.addEventListener('st:marketplace-backend-status-changed',()=>{const next=desired();if(next.type!==s.getRepositoryInfo().type)s.setRepository(next).catch(()=>{});});}try{window.__ST_ALL_LOG__?.push?.('marketplace-global-catalog:runtime-ready-01073',{repository:s.getRepositoryInfo(),publicReadOnly:true,storePrivateDataRead:false});}catch{}return s;}
