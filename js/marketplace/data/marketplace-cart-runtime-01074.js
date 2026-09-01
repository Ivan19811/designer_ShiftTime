// 01074 · Cart composition root. Local is safe default; API cart follows active backend mode.
import {MarketplaceCartStore01074} from './marketplace-cart-store-01074.js?v=01074';
import {LocalMarketplaceCartRepository01074} from '../repositories/local-marketplace-cart-repository-01074.js?v=01077';
import {ApiMarketplaceCartRepository01074} from '../repositories/api-marketplace-cart-repository-01074.js?v=01082';
import {getMarketplaceBackendConfig01071} from './marketplace-backend-config-01071.js?v=01071';
import {getMarketplaceBackendStatus01071} from './marketplace-backend-runtime-01071.js?v=01090';
let store=null,installed=false;
function desired(){const c=getMarketplaceBackendConfig01071(),s=getMarketplaceBackendStatus01071();return s.state==='api'?new ApiMarketplaceCartRepository01074({baseUrl:c.apiBaseUrl,requestTimeoutMs:c.requestTimeoutMs}):new LocalMarketplaceCartRepository01074();}
export function getMarketplaceCartStore01074(){if(!store)store=new MarketplaceCartStore01074({repository:desired()});return store;}
export async function initMarketplaceCartRuntime01074(){const s=getMarketplaceCartStore01074();await s.init();if(!installed){installed=true;window.addEventListener('st:marketplace-network-changed',()=>{if(s.getRepositoryInfo().type==='local-marketplace-cart')s.refresh('network-changed').catch(()=>{});});window.addEventListener('st:marketplace-backend-status-changed',()=>{const next=desired();if(next.type!==s.getRepositoryInfo().type)s.setRepository(next).catch(()=>{});});}try{window.__ST_ALL_LOG__?.push?.('marketplace-cart:runtime-ready-01074',{repository:s.getRepositoryInfo(),multiSeller:true,identityOnly:true,liveOfferResolution:true});}catch{}return s;}
