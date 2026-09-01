// 01073 · Small deterministic demo catalog for manual testing of Store catalog + global Marketplace.
// Demo data is injected only through MarketplaceStore/MarketplaceRepository. No direct storage access.
import {getMarketplaceStore01052} from '../data/marketplace-runtime-01052.js?v=01052';
import {getMarketplaceNetworkStore01072,publishCommerceProduct01072} from '../data/marketplace-network-runtime-01072.js?v=01082';
import {getMarketplaceTenantContextStore01070} from '../data/marketplace-tenant-runtime-01070.js?v=01090';

export const MARKETPLACE_DEMO_FIXTURE_ID_01073='demo-fixture-01073-v1';
const CAT_PANS='demo01073_cat_pans',CAT_CAULDRONS='demo01073_cat_cauldrons';
const products=[
  {id:'demo01073_prod_pan40',sku:'DEMO-PAN-40',name:'Сковорідка з диска 40 см',slug:'skovoridka-z-dyska-40-sm',categoryIds:[CAT_PANS],brand:'ShiftTime',price:1890,oldPrice:2090,stock:14,availability:'in-stock',mediaIds:['demo01073_media_pan40'],primaryMediaId:'demo01073_media_pan40',shortDescription:'Компактна сталева сковорідка для вогнища та пікніка.',attributes:{diameter:'40 см',material:'Сталь',sales30d:18,gtin:'4820107300401'}},
  {id:'demo01073_prod_pan50',sku:'DEMO-PAN-50',name:'Сковорідка з диска 50 см',slug:'skovoridka-z-dyska-50-sm',categoryIds:[CAT_PANS],brand:'ShiftTime',price:2490,oldPrice:2790,stock:9,availability:'in-stock',mediaIds:['demo01073_media_pan50'],primaryMediaId:'demo01073_media_pan50',shortDescription:'Універсальна сковорідка 50 см для компанії та живого вогню.',attributes:{diameter:'50 см',material:'Сталь',sales30d:31,gtin:'4820107300500'}},
  {id:'demo01073_prod_pan60',sku:'DEMO-PAN-60',name:'Сковорідка з диска 60 см',slug:'skovoridka-z-dyska-60-sm',categoryIds:[CAT_PANS],brand:'ShiftTime',price:3190,oldPrice:3490,stock:5,availability:'in-stock',mediaIds:['demo01073_media_pan60'],primaryMediaId:'demo01073_media_pan60',shortDescription:'Велика сковорідка для відпочинку великою компанією.',attributes:{diameter:'60 см',material:'Сталь',sales30d:12,gtin:'4820107300609'}},
  {id:'demo01073_prod_cauldron8',sku:'DEMO-KAZAN-8',name:'Казан чавунний 8 л',slug:'kazan-chavunnyj-8-l',categoryIds:[CAT_CAULDRONS],brand:'ShiftTime',price:2290,oldPrice:0,stock:11,availability:'in-stock',mediaIds:['demo01073_media_cauldron8'],primaryMediaId:'demo01073_media_cauldron8',shortDescription:'Чавунний казан 8 л із кришкою для плову, бограчу та печені.',attributes:{volume:'8 л',material:'Чавун',sales30d:24,gtin:'4820107301088'}},
  {id:'demo01073_prod_cauldron12',sku:'DEMO-KAZAN-12',name:'Казан чавунний 12 л',slug:'kazan-chavunnyj-12-l',categoryIds:[CAT_CAULDRONS],brand:'ShiftTime',price:2990,oldPrice:3290,stock:4,availability:'in-stock',mediaIds:['demo01073_media_cauldron12'],primaryMediaId:'demo01073_media_cauldron12',shortDescription:'Місткий чавунний казан 12 л для великої компанії.',attributes:{volume:'12 л',material:'Чавун',sales30d:9,gtin:'4820107301125'}}
];
const media=[
  {id:'demo01073_media_pan40',kind:'image',url:'assets/demo/01073/pan-40.svg',alt:'Сковорідка з диска 40 см',width:1200,height:900,mime:'image/svg+xml',fileName:'pan-40.svg',metadata:{demoFixture:MARKETPLACE_DEMO_FIXTURE_ID_01073}},
  {id:'demo01073_media_pan50',kind:'image',url:'assets/demo/01073/pan-50.svg',alt:'Сковорідка з диска 50 см',width:1200,height:900,mime:'image/svg+xml',fileName:'pan-50.svg',metadata:{demoFixture:MARKETPLACE_DEMO_FIXTURE_ID_01073}},
  {id:'demo01073_media_pan60',kind:'image',url:'assets/demo/01073/pan-60.svg',alt:'Сковорідка з диска 60 см',width:1200,height:900,mime:'image/svg+xml',fileName:'pan-60.svg',metadata:{demoFixture:MARKETPLACE_DEMO_FIXTURE_ID_01073}},
  {id:'demo01073_media_cauldron8',kind:'image',url:'assets/demo/01073/cauldron-8.svg',alt:'Казан чавунний 8 л',width:1200,height:900,mime:'image/svg+xml',fileName:'cauldron-8.svg',metadata:{demoFixture:MARKETPLACE_DEMO_FIXTURE_ID_01073}},
  {id:'demo01073_media_cauldron12',kind:'image',url:'assets/demo/01073/cauldron-12.svg',alt:'Казан чавунний 12 л',width:1200,height:900,mime:'image/svg+xml',fileName:'cauldron-12.svg',metadata:{demoFixture:MARKETPLACE_DEMO_FIXTURE_ID_01073}}
];
const categories=[
  {id:CAT_PANS,name:'Сковорідки',slug:'skovoridky',status:'active',shortDescription:'Сковорідки для вогнища та відпочинку',icon:'◉',attributes:{demoFixture:MARKETPLACE_DEMO_FIXTURE_ID_01073}},
  {id:CAT_CAULDRONS,name:'Казани',slug:'kazany',status:'active',shortDescription:'Чавунні казани для живого вогню',icon:'◒',attributes:{demoFixture:MARKETPLACE_DEMO_FIXTURE_ID_01073}}
];
function clone(v){try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}}
export function getMarketplaceDemoFixture01073(){return clone({id:MARKETPLACE_DEMO_FIXTURE_ID_01073,categories,media,products});}
export async function seedMarketplaceDemoFixture01073({force=false,publish=true}={}){
  const store=getMarketplaceStore01052();
  const repo=store.getRepositoryInfo();
  if(!force&&repo.type!=='local-scoped')return {seeded:false,published:false,reason:'local-only',productCount:store.getProducts().length};
  const state=store.getState();
  if(!force&&state.products.length>0)return {seeded:false,published:false,reason:'catalog-not-empty',productCount:state.products.length};
  const existingSkus=new Set(state.products.map(x=>String(x.sku||'').toLowerCase()));
  const next=clone(state);
  for(const c of categories)if(!next.categories.some(x=>x.id===c.id))next.categories.push(clone(c));
  for(const m of media)if(!next.media.some(x=>x.id===m.id))next.media.push(clone(m));
  const added=[];
  for(const p of products){if(next.products.some(x=>x.id===p.id)||existingSkus.has(p.sku.toLowerCase()))continue;next.products.push({...clone(p),status:'active',currency:'UAH',collectionIds:[],variantIds:[],seo:{title:p.name,description:p.shortDescription},feed:{},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});added.push(p.id);}
  next.settings={...(next.settings||{}),demoFixture01073:{id:MARKETPLACE_DEMO_FIXTURE_ID_01073,seededAt:new Date().toISOString(),productIds:products.map(x=>x.id),categoryIds:categories.map(x=>x.id)}};
  if(added.length||!state.settings?.demoFixture01073)await store.replaceSnapshot(next,'demo-fixture-01073');
  let published=false;
  if(publish&&repo.type==='local-scoped'){
    const network=getMarketplaceNetworkStore01072(),ctx=getMarketplaceTenantContextStore01070().getActiveContext();
    await network.ensureSeller({displayName:ctx.store?.name||'DEMO магазин'});
    for(const p of products){if(!store.getProduct(p.id))continue;try{await publishCommerceProduct01072(p.id);}catch(e){console.warn('[01073] demo publish skipped',p.id,e);}}
    published=true;
  }
  const result={seeded:added.length>0,published,addedProducts:added.length,productIds:products.map(x=>x.id),categoryIds:categories.map(x=>x.id),productCount:store.getProducts().length};
  try{window.__ST_ALL_LOG__?.push?.('marketplace-demo:fixture-ready-01073',{...result,storeId:getMarketplaceTenantContextStore01070().getActiveContext().storeId,repository:repo.type});}catch{}
  return result;
}
