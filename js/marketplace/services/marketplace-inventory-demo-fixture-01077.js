// 01077 · Keeps 5 products / 2 categories / 2 sellers and lowers selected DEMO stock for reservation tests.
import {seedMarketplaceCartDemoFixture01074} from './marketplace-cart-demo-fixture-01074.js?v=01082';
import {LocalMarketplaceInventoryFixtureRepository01077} from '../repositories/local-marketplace-inventory-fixture-repository-01077.js?v=01077';
import {getMarketplaceBackendConfig01071} from '../data/marketplace-backend-config-01071.js?v=01071';
import {getMarketplaceBackendStatus01071} from '../data/marketplace-backend-runtime-01071.js?v=01082';
import {getMarketplaceStore01052} from '../data/marketplace-runtime-01052.js?v=01052';

const SOURCE_LOW_STOCK=new Map([
  ['demo01073_prod_pan60',1],
  ['demo01073_prod_cauldron12',2]
]);
async function alignLocalSourceDemoStock01077(){
  const store=getMarketplaceStore01052(),changed=[];
  for(const [productId,stock] of SOURCE_LOW_STOCK){
    const product=store.getProduct(productId);if(!product||Number(product.stock)===stock)continue;
    await store.updateProduct(productId,{stock,availability:'in-stock'});changed.push({productId,stock});
  }
  return changed;
}
export async function seedMarketplaceInventoryDemoFixture01077({force=false}={}){
  const base=await seedMarketplaceCartDemoFixture01074({force}),cfg=getMarketplaceBackendConfig01071(),st=getMarketplaceBackendStatus01071();
  if(st.state==='api')return {stage:'01077',base,lowStock:false,reason:'api-seed-via-backend-db-seed'};
  const sourceChanged=await alignLocalSourceDemoStock01077();
  const low=await new LocalMarketplaceInventoryFixtureRepository01077().ensureLowStockDemo();
  try{window.dispatchEvent(new CustomEvent('st:marketplace-network-changed',{detail:{reason:'demo-low-stock-01077'}}));}catch{}
  const out={stage:'01077',base,lowStock:true,sourceChanged,changed:low.changed};
  try{window.__ST_ALL_LOG__?.push?.('marketplace-inventory:demo-fixture-ready-01077',out);}catch{}
  return out;
}
