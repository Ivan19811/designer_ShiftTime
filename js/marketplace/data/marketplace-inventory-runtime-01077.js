// 01077 · Inventory repository composition root.
import {MarketplaceInventoryStore01077} from './marketplace-inventory-store-01077.js?v=01077';
import {LocalMarketplaceInventoryRepository01077} from '../repositories/local-marketplace-inventory-repository-01077.js?v=01077';
import {ApiMarketplaceInventoryRepository01077} from '../repositories/api-marketplace-inventory-repository-01077.js?v=01082';
import {getMarketplaceBackendConfig01071} from './marketplace-backend-config-01071.js?v=01071';
import {getMarketplaceBackendStatus01071} from './marketplace-backend-runtime-01071.js?v=01082';
let store=null,installed=false;
function desired(){const c=getMarketplaceBackendConfig01071(),s=getMarketplaceBackendStatus01071();return c.mode==='api'&&s.state==='api'?new ApiMarketplaceInventoryRepository01077({baseUrl:c.apiBaseUrl,requestTimeoutMs:c.requestTimeoutMs}):new LocalMarketplaceInventoryRepository01077();}
export function getMarketplaceInventoryStore01077(){if(!store)store=new MarketplaceInventoryStore01077({repository:desired()});return store;}
export async function initMarketplaceInventoryRuntime01077(){const s=getMarketplaceInventoryStore01077();await s.init();if(!installed){installed=true;window.addEventListener('st:marketplace-backend-status-changed',()=>{const n=desired();if(n.type!==s.getRepositoryInfo().type)s.setRepository(n).catch(()=>{});});window.addEventListener('st:marketplace-tenant-context-changed',()=>s.refresh().catch(()=>{}));window.addEventListener('st:marketplace-orders-changed',()=>s.refresh().catch(()=>{}));window.addEventListener('st:marketplace-payments-changed',()=>s.refresh().catch(()=>{}));window.addEventListener('st:marketplace-network-changed',()=>s.refresh().catch(()=>{}));}try{window.__ST_ALL_LOG__?.push?.('marketplace-inventory:runtime-ready-01077',{repository:s.getRepositoryInfo(),reservation:true,stockCommit:true,backendAuthoritative:true});}catch{}return s;}
