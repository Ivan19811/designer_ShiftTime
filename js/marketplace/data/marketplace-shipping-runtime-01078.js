import {MarketplaceShippingStore01078} from './marketplace-shipping-store-01078.js?v=01078';
import {LocalMarketplaceShippingRepository01078} from '../repositories/local-marketplace-shipping-repository-01078.js?v=01079';
import {ApiMarketplaceShippingRepository01078} from '../repositories/api-marketplace-shipping-repository-01078.js?v=01082';
import {getMarketplaceBackendConfig01071} from './marketplace-backend-config-01071.js?v=01071';
import {getMarketplaceBackendStatus01071} from './marketplace-backend-runtime-01071.js?v=01082';
import {syncMarketplaceOperationalRepository01089} from './marketplace-runtime-sync-01089.js?v=01089';
let store=null,installed=false;
function desired(){const c=getMarketplaceBackendConfig01071(),s=getMarketplaceBackendStatus01071();return s.state==='api'?new ApiMarketplaceShippingRepository01078({baseUrl:c.apiBaseUrl,requestTimeoutMs:c.requestTimeoutMs}):new LocalMarketplaceShippingRepository01078();}
export function getMarketplaceShippingStore01078(){if(!store)store=new MarketplaceShippingStore01078({repository:desired()});return store;}
export async function initMarketplaceShippingRuntime01078(){const s=getMarketplaceShippingStore01078();await s.init();if(!installed){installed=true;window.addEventListener('st:marketplace-backend-status-changed',()=>{const n=desired();syncMarketplaceOperationalRepository01089(s,n,{reason:'auth/backend-context-changed',refresh:()=>s.refresh()}).catch(()=>{});});window.addEventListener('st:marketplace-tenant-context-changed',()=>s.refresh().catch(()=>{}));window.addEventListener('st:marketplace-orders-changed',()=>s.refresh().catch(()=>{}));}try{window.__ST_ALL_LOG__?.push?.('marketplace-shipping:runtime-ready-01079',{repository:s.getRepositoryInfo(),sellerOrderDelivery:true,providerNeutral:true,pricingStage:'01079'});}catch{}return s;}
