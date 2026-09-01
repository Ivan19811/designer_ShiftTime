// 01076 · Payment repository composition root.
import {MarketplacePaymentStore01076} from './marketplace-payment-store-01076.js?v=01076';
import {LocalMarketplacePaymentRepository01076} from '../repositories/local-marketplace-payment-repository-01076.js?v=01079';
import {ApiMarketplacePaymentRepository01076} from '../repositories/api-marketplace-payment-repository-01076.js?v=01082';
import {getMarketplaceBackendConfig01071} from './marketplace-backend-config-01071.js?v=01071';
import {getMarketplaceBackendStatus01071} from './marketplace-backend-runtime-01071.js?v=01082';
import {syncMarketplaceOperationalRepository01089} from './marketplace-runtime-sync-01089.js?v=01089';
let store=null,installed=false;
function desired(){const c=getMarketplaceBackendConfig01071(),s=getMarketplaceBackendStatus01071();return s.state==='api'?new ApiMarketplacePaymentRepository01076({baseUrl:c.apiBaseUrl,requestTimeoutMs:c.requestTimeoutMs}):new LocalMarketplacePaymentRepository01076();}
export function getMarketplacePaymentStore01076(){if(!store)store=new MarketplacePaymentStore01076({repository:desired()});return store;}
export async function initMarketplacePaymentRuntime01076(){const s=getMarketplacePaymentStore01076();await s.init();if(!installed){installed=true;window.addEventListener('st:marketplace-backend-status-changed',()=>{const n=desired();syncMarketplaceOperationalRepository01089(s,n,{reason:'auth/backend-context-changed',refresh:()=>s.refresh()}).catch(()=>{});});window.addEventListener('st:marketplace-tenant-context-changed',()=>s.refresh().catch(()=>{}));window.addEventListener('st:marketplace-orders-changed',()=>s.refresh().catch(()=>{}));}try{window.__ST_ALL_LOG__?.push?.('marketplace-payments:runtime-ready-01079',{repository:s.getRepositoryInfo(),commissionFoundation:true,payoutLedger:true,realProvider:false,pricingStage:'01079'});}catch{}return s;}
