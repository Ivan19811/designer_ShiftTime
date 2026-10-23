// 01545 · Seller-entered parcel characteristics. Catalog and writes are scoped by Store.
// No API secrets, address data or final order creation.
const loadSnapshot=async scope=>(await import('./commerce-snapshot-service.mjs')).loadSnapshot(scope);
const withClient=async callback=>(await import('./db.mjs')).withClient(callback);
const shopCartView01535=async (...args)=>(await import('./marketplace-shop-cart-service-01535.mjs')).shopCartView01535(...args);
import {previewStoreQuote01544} from './shipping-quote-service-01544.mjs';
const str=v=>String(v??'').trim();
const list=v=>Array.isArray(v)?v:[];
const bad=(code,statusCode=400)=>Object.assign(new Error(code),{statusCode,code});
const numeric=(value,min,max,precision,key)=>{
  const n=Number(value);
  if(value===null||value===''||!Number.isFinite(n)||n<min||n>max||Math.abs(Math.round(n*10**precision)-n*10**precision)>0.000001)throw bad(key);
  return Math.round(n*10**precision)/10**precision;
};
const validateId=(value,key)=>{const id=str(value);if(!id||id.length>180||!/^[-\w:.]+$/u.test(id))throw bad(key);return id;};
export function normalizeProductParcel01545(input={}){
  const productId=validateId(input.productId,'NP_PARCEL_PRODUCT_INVALID_01545');
  const variantId=str(input.variantId);
  if(variantId&&(variantId.length>180||!/^[-\w:.]+$/u.test(variantId)))throw bad('NP_PARCEL_VARIANT_INVALID_01545');
  const shippingRequired=input.shippingRequired!==false;
  const weightKg=shippingRequired?numeric(input.weightKg,0.001,1000,3,'NP_PARCEL_WEIGHT_INVALID_01545'):null;
  const dims=[input.lengthCm,input.widthCm,input.heightCm];
  const allEmpty=dims.every(v=>v==null||v==='');
  const [lengthCm,widthCm,heightCm]=allEmpty?[null,null,null]:dims.map(v=>numeric(v,0.1,300,1,'NP_PARCEL_DIMENSIONS_INVALID_01545'));
  return {productId,variantId,shippingRequired,weightKg,lengthCm,widthCm,heightCm};
}
export function makeCartParcelPlan01545(items,records){
  if(!Array.isArray(items)||!items.length||items.length>150)throw bad('NP_PARCEL_CART_INVALID_01545',409);
  const exact=new Map(list(records).map(r=>[str(r.productId)+'\u0000'+str(r.variantId),r]));
  const missing=[];let grams=0,subtotalCents=0,physicalLines=0,excluded=0;
  for(const item of items){
    if(str(item.sourceKind)!=='store-product-01534'||str(item.status)!=='active'||str(item.currency)!=='UAH')throw bad('NP_PARCEL_CART_INVALID_01545',409);
    const q=Number(item.quantity),amount=Number(item.lineTotal);
    if(!Number.isSafeInteger(q)||q<1||q>99||!Number.isFinite(amount)||amount<0||Math.abs(Math.round(amount*100)-amount*100)>0.00001)throw bad('NP_PARCEL_CART_INVALID_01545',409);
    subtotalCents+=Math.round(amount*100);
    const id=str(item.productId),variant=str(item.variantId);
    // Explicit variant wins; product-level profile serves as seller-configured fallback.
    const r=exact.get(id+'\u0000'+variant)||exact.get(id+'\u0000');
    if(!r){missing.push({productId:id,variantId:variant});continue;}
    if(!r.shippingRequired){excluded++;continue;}
    const weight=Number(r.weightKg);
    if(!Number.isFinite(weight)||weight<=0||weight>1000)throw bad('NP_PARCEL_WEIGHT_INVALID_01545',409);
    grams+=Math.round(weight*1000)*q;physicalLines++;
  }
  if(missing.length)throw Object.assign(bad('NP_PARCEL_PRODUCTS_NOT_CONFIGURED_01545',409),{missingCount:missing.length});
  if(!physicalLines||grams<1||grams>1000000||subtotalCents<100||subtotalCents>1000000000)throw bad('NP_PARCEL_CART_INVALID_01545',409);
  return {weightKg:grams/1000,declaredValue:subtotalCents/100,physicalLines,excludedLines:excluded,items:items.length};
}
export async function listStoreProductParcels01545(scope,{snapshotImpl=loadSnapshot,dbClient=undefined}={}){
  const catalog=await snapshotImpl(scope);const products=list(catalog.products),variants=list(catalog.variants);
  const query=async db=>(await db.query(`SELECT product_id "productId",variant_id "variantId",shipping_required "shippingRequired",weight_kg "weightKg",length_cm "lengthCm",width_cm "widthCm",height_cm "heightCm" FROM shifttime_shipping_product_parcels WHERE store_id=$1`,[scope.storeId])).rows;
  const specs=dbClient?await query(dbClient):await withClient(query);
  return {products:products.map(p=>({id:str(p.id),name:str(p.name),sku:str(p.sku),status:str(p.status)})).filter(p=>p.id),variants:variants.map(v=>({id:str(v.id),productId:str(v.productId),name:str(v.displayName01260||v.name||v.sku),sku:str(v.sku)})).filter(v=>v.id&&v.productId),specs:specs.map(r=>({...r,weightKg:r.weightKg==null?null:Number(r.weightKg),lengthCm:r.lengthCm==null?null:Number(r.lengthCm),widthCm:r.widthCm==null?null:Number(r.widthCm),heightCm:r.heightCm==null?null:Number(r.heightCm)})),stage:'01545'};
}
export async function saveStoreProductParcel01545(scope,input,{snapshotImpl=loadSnapshot,dbClient=undefined}={}){
  const data=normalizeProductParcel01545(input),s=await snapshotImpl(scope);
  if(!list(s.products).some(p=>str(p.id)===data.productId))throw bad('NP_PARCEL_PRODUCT_NOT_FOUND_01545',404);
  if(data.variantId&&!list(s.variants).some(v=>str(v.id)===data.variantId&&str(v.productId)===data.productId))throw bad('NP_PARCEL_VARIANT_NOT_FOUND_01545',404);
  const query=async db=>{await db.query(`INSERT INTO shifttime_shipping_product_parcels(store_id,product_id,variant_id,shipping_required,weight_kg,length_cm,width_cm,height_cm,updated_by_user_id,updated_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,now()) ON CONFLICT(store_id,product_id,variant_id) DO UPDATE SET shipping_required=EXCLUDED.shipping_required,weight_kg=EXCLUDED.weight_kg,length_cm=EXCLUDED.length_cm,width_cm=EXCLUDED.width_cm,height_cm=EXCLUDED.height_cm,updated_by_user_id=EXCLUDED.updated_by_user_id,updated_at=now()`,
    [scope.storeId,data.productId,data.variantId,data.shippingRequired,data.weightKg,data.lengthCm,data.widthCm,data.heightCm,scope.userId||null]);return {saved:true,...data,stage:'01545'};};
  return dbClient?query(dbClient):withClient(query);
}
export async function previewServerCartQuote01545(scope,input,{cartView=shopCartView01535,parcelView=listStoreProductParcels01545,quote=previewStoreQuote01544,clientId=''}={}){
  const siteId=validateId(input.siteId,'NP_PARCEL_SITE_INVALID_01545'),cartId=str(input.cartId);
  if(!/^cart_[a-z0-9]{24,48}$/i.test(cartId))throw bad('NP_PARCEL_CART_INVALID_01545',400);
  const cart=await cartView(scope,siteId,cartId);
  if(str(cart.siteId)!==siteId||str(cart.id)!==cartId||list(cart.issues).length)throw bad('NP_PARCEL_CART_INVALID_01545',409);
  const catalog=await parcelView(scope);
  const plan=makeCartParcelPlan01545(cart.items,catalog.specs);
  // Site/store/product and prices are rehydrated by the server, not sent by the browser.
  const result=await quote(scope.storeId,{cityRecipient:input.cityRecipient,warehouseRef:input.warehouseRef,declaredValue:plan.declaredValue},{clientId,trustedParcelWeightKg:plan.weightKg});
  return {...result,weightKg:plan.weightKg,declaredValue:plan.declaredValue,quoteBasis:'server-cart-product-parcels',parcelStage:'01545',orderReady:false};
}
