// 01077 · DEV-only fixture adapter. Adjusts only deterministic DEMO offers to low stock.
import {LOCAL_MARKETPLACE_NETWORK_KEY_01072} from './local-marketplace-network-repository-01072.js?v=01072';
import {createDefaultMarketplaceNetworkSnapshot01072,normalizeMarketplaceNetworkSnapshot01072} from '../data/marketplace-network-schema-01072.js?v=01072';
const now=()=>new Date().toISOString();
export class LocalMarketplaceInventoryFixtureRepository01077{
  constructor({storage=globalThis.localStorage,networkKey=LOCAL_MARKETPLACE_NETWORK_KEY_01072}={}){this.type='local-inventory-fixture';this.storage=storage;this.networkKey=networkKey;}
  _load(){try{const raw=this.storage?.getItem(this.networkKey);return raw?normalizeMarketplaceNetworkSnapshot01072(JSON.parse(raw)):createDefaultMarketplaceNetworkSnapshot01072();}catch{return createDefaultMarketplaceNetworkSnapshot01072();}}
  _save(s){const next={...s,revision:(Number(s.revision)||0)+1,updatedAt:now()};this.storage?.setItem(this.networkKey,JSON.stringify(next));return next;}
  async ensureLowStockDemo(){const s=this._load(),targets=new Map([['demo01073_prod_pan60',1],['demo01073_prod_cauldron12',2],['partner_demo01073_prod_pan50',1],['partner_demo01073_prod_cauldron12',2]]),changed=[];for(const o of s.sellerOffers||[]){if(!targets.has(o.sourceProductId))continue;const stock=targets.get(o.sourceProductId);o.stock=stock;o.availability='in-stock';o.projection={...(o.projection||{}),stock,availability:'in-stock'};o.updatedAt=now();for(const l of s.listings||[])if(l.sellerOfferId===o.id){l.publicProjection={...(l.publicProjection||{}),stock,availability:'in-stock'};l.updatedAt=now();l.lastSyncedAt=now();}changed.push({offerId:o.id,sourceProductId:o.sourceProductId,stock});}if(changed.length)this._save(s);return {stage:'01077',changed};}
}
