// 01075 · Order repository composition root.
import {MarketplaceOrderStore01075} from './marketplace-order-store-01075.js?v=01075';
import {LocalMarketplaceOrderRepository01075} from '../repositories/local-marketplace-order-repository-01075.js?v=01079';
import {ApiMarketplaceOrderRepository01075} from '../repositories/api-marketplace-order-repository-01075.js?v=01082';
import {getMarketplaceBackendConfig01071} from './marketplace-backend-config-01071.js?v=01071';
import {getMarketplaceBackendStatus01071} from './marketplace-backend-runtime-01071.js?v=01082';
import {syncMarketplaceOperationalRepository01089} from './marketplace-runtime-sync-01089.js?v=01089';
let store=null,installed=false;
function desired(){const c=getMarketplaceBackendConfig01071(),s=getMarketplaceBackendStatus01071();return s.state==='api'?new ApiMarketplaceOrderRepository01075({baseUrl:c.apiBaseUrl,requestTimeoutMs:c.requestTimeoutMs}):new LocalMarketplaceOrderRepository01075();}
export function getMarketplaceOrderStore01075(){if(!store)store=new MarketplaceOrderStore01075({repository:desired()});return store;}
export async function initMarketplaceOrderRuntime01075(){const s=getMarketplaceOrderStore01075();await s.init();if(!installed){installed=true;window.addEventListener('st:marketplace-backend-status-changed',()=>{const n=desired();syncMarketplaceOperationalRepository01089(s,n,{reason:'auth/backend-context-changed',refresh:()=>s.refreshSellerOrders()}).catch(()=>{});});window.addEventListener('st:marketplace-tenant-context-changed',()=>s.refreshSellerOrders().catch(()=>{}));}try{window.__ST_ALL_LOG__?.push?.('marketplace-orders:runtime-ready-01079',{repository:s.getRepositoryInfo(),marketplaceOrderSplit:true,priceSnapshotAtCheckout:true,shippingTotals:true,pricingStage:'01079'});}catch{}return s;}
