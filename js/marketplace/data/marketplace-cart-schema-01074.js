// 01074 · Buyer cart schema for the central ShiftTime Marketplace.
// Cart identity references public SellerOffer/MarketplaceListing only; seller private Product data is never stored here.
export const MARKETPLACE_CART_SCHEMA_ID_01074='st-marketplace-cart';
export const MARKETPLACE_CART_SCHEMA_VERSION_01074=1;
function str(v){return String(v??'').trim();}
function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f;}
function now(){return new Date().toISOString();}
function uid(prefix='cart'){try{return `${prefix}_${crypto.randomUUID().replace(/-/g,'').slice(0,24)}`;}catch{return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,12)}`;}}
export function createMarketplaceCart01074(input={}){const t=now();return {schemaId:MARKETPLACE_CART_SCHEMA_ID_01074,schemaVersion:MARKETPLACE_CART_SCHEMA_VERSION_01074,id:str(input.id)||uid('cart'),status:['active','converted','abandoned'].includes(str(input.status))?str(input.status):'active',currency:str(input.currency)||'UAH',items:Array.isArray(input.items)?input.items.map(createMarketplaceCartIdentity01074):[],createdAt:str(input.createdAt)||t,updatedAt:str(input.updatedAt)||t};}
export function createMarketplaceCartIdentity01074(input={}){const t=now();return {id:str(input.id)||uid('cartitem'),listingId:str(input.listingId),catalogProductId:str(input.catalogProductId),sellerOfferId:str(input.sellerOfferId),sellerProfileId:str(input.sellerProfileId),storeId:str(input.storeId),quantity:Math.max(1,Math.floor(num(input.quantity,1))),addedAt:str(input.addedAt)||t,updatedAt:str(input.updatedAt)||t};}
export function normalizeMarketplaceCart01074(input={}){return createMarketplaceCart01074(input);}
export function summarizeMarketplaceCart01074(view={}){const groups=Array.isArray(view.groups)?view.groups:[],items=groups.flatMap(g=>Array.isArray(g.items)?g.items:[]);return {sellerGroups:groups.length,lineItems:items.length,quantity:items.reduce((s,x)=>s+(Number(x.quantity)||0),0),subtotal:items.reduce((s,x)=>s+(Number(x.lineTotal)||0),0),currency:view.currency||'UAH'};}
