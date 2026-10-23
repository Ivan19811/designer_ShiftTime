// 01548 · Server-authoritative, read-only packing plan for one authenticated Store/site cart.
// The browser may suggest accessory destinations; it may NEVER edit catalog relations,
// quantities, prices, main anchors, courier tariffs, orders or waybills.
const str=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
const fail=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const cm=v=>v===null||v===undefined||v===''?null:Number(v);
const sane=(v,max)=>Number.isFinite(v)&&v>0&&v<=max;
const ukey=(id,index)=>`${id}:${index}`;
const limiter=new Map();
function assertPreviewRate01548(scope){
  const bucket=Math.floor(Date.now()/60000),key=str(scope.storeId)+':'+bucket;
  for(const k of limiter.keys())if(!k.endsWith(':'+bucket))limiter.delete(k);
  const n=(limiter.get(key)||0)+1;limiter.set(key,n);
  if(n>120)throw fail('NP_PACKING_RATE_LIMIT_01548',429);
}

function resolveSpec(item,products,variants,specs){
  const product=products.get(str(item.productId));
  const variant=str(item.variantId)?variants.get(str(item.variantId)):null;
  if(!product||(variant&&str(variant.productId)!==str(item.productId)))throw fail('NP_PACKING_CATALOG_CHANGED_01548');
  const v=variant?.shipping01547||product.shipping01547||null;
  const fallback=specs.get(`${item.productId}\0${str(item.variantId)}`)||specs.get(`${item.productId}\0`)||null;
  const data=v||fallback||{};
  const weight=cm(data.weightKg),dims=['lengthCm','widthCm','heightCm'].map(k=>cm(data[k]));
  const configured=sane(weight,1000)&&dims.every(n=>sane(n,300));
  return {weightKg:configured?Math.round(weight*1000)/1000:null,dimensions:configured?dims:null,
    configured,locked:Boolean(data.separatePackage),calculateDelivery:data.calculateDelivery===true || (!v&&fallback?.shippingRequired!==false),
    service:str(item.componentKind)==='service'||str(product.catalogRole01472)==='service'||fallback?.shippingRequired===false};
}
const fits=(small,large)=>!small||!large||[...small].sort((a,b)=>a-b).every((n,i)=>n<=[...large].sort((a,b)=>a-b)[i]);
export function buildPackingPlan01548(items,catalog,moves=[]){
  if(!arr(items).length||items.length>150||!arr(moves).every(m=>m&&typeof m==='object')||arr(moves).length>250)throw fail('NP_PACKING_CART_INVALID_01548',400);
  const products=new Map(arr(catalog.products).map(x=>[str(x.id),x]));
  const variants=new Map(arr(catalog.variants).map(x=>[str(x.id),x]));
  const specs=new Map(arr(catalog.specs).map(x=>[`${x.productId}\0${str(x.variantId)}`,x]));
  const packages=[],accessories=[],byLine=new Map(),warnings=new Set();let serviceLines=0,units=0;
  for(const item of items){
    const kind=str(item.componentKind)||'main',q=Number(item.quantity);
    if(str(item.sourceKind)!=='store-product-01534'||str(item.status)!=='active'||!['main','accessory','service'].includes(kind)||!Number.isSafeInteger(q)||q<1||q>99||str(item.currency)!=='UAH'||!str(item.id))throw fail('NP_PACKING_CART_INVALID_01548');
    units+=q;if(units>250)throw fail('NP_PACKING_TOO_MANY_UNITS_01548');
    const spec=resolveSpec(item,products,variants,specs);
    byLine.set(str(item.id),{item,spec});
    if(kind==='service'||spec.service){serviceLines++;continue;}
    if(!spec.configured)warnings.add('NP_PACKING_MEASUREMENTS_MISSING_01548');
    if(!spec.calculateDelivery)warnings.add('NP_PARCEL_CARRIER_PRICE_01547');
    for(let i=1;i<=q;i++){
      const unit={unitKey:ukey(str(item.id),i),itemId:str(item.id),title:str(item.title).slice(0,160),variantName:str(item.variantName).slice(0,100),weightKg:spec.weightKg,dimensions:spec.dimensions,locked:spec.locked,calculateDelivery:spec.calculateDelivery,bundleId:str(item.bundleId)};
      if(kind==='main'||spec.locked){packages.push({id:unit.unitKey,main:unit,accessories:[],weightKg:spec.weightKg,dimensions:spec.dimensions,locked:spec.locked,standaloneAccessory:kind==='accessory'});}
      else accessories.push({...unit,parentItemId:str(item.parentItemId)});
    }
  }
  const packageById=new Map(packages.map(p=>[p.id,p]));
  const moveMap=new Map();for(const move of moves){
    const k=str(move.unitKey),target=str(move.packageId);
    if(!k||!target||moveMap.has(k)||k.length>160||target.length>160)throw fail('NP_PACKING_MOVE_INVALID_01548',400);
    moveMap.set(k,target);
  }
  const accessoryByKey=new Map(accessories.map(a=>[a.unitKey,a]));
  for(const [key,target] of moveMap){if(!accessoryByKey.has(key)||!packageById.has(target))throw fail('NP_PACKING_MOVE_INVALID_01548',409);}
  const unassigned=[];
  for(const item of accessories){
    const ownBundle=packages.filter(p=>p.main.bundleId===item.bundleId&&!p.locked&&!p.standaloneAccessory);
    // Canonical parent chain determines default group; explicit moves change only placement.
    let parent=str(item.parentItemId),root='';const seen=new Set();
    while(parent&&!seen.has(parent)){seen.add(parent);const record=byLine.get(parent);if(!record)break;if(str(record.item.componentKind)==='main'){root=parent;break;}parent=str(record.item.parentItemId);}
    const allowed=ownBundle.filter(p=>(!root||p.main.itemId===root)&&fits(item.dimensions,p.dimensions));
    const sameIndex=Number(item.unitKey.split(':').at(-1))||1;
    const fallback=allowed[(sameIndex-1)%Math.max(allowed.length,1)]||null;
    const target=moveMap.has(item.unitKey)?packageById.get(moveMap.get(item.unitKey)):fallback;
    if(!target){unassigned.push(item);warnings.add('NP_PACKING_UNASSIGNED_01548');continue;}
    if(target.locked||target.standaloneAccessory||!fits(item.dimensions,target.dimensions)||item.bundleId!==target.main.bundleId&&moveMap.has(item.unitKey)===false)throw fail('NP_PACKING_MOVE_NOT_ALLOWED_01548');
    if(target.weightKg!==null&&item.weightKg!==null&&target.weightKg+item.weightKg>1000)throw fail('NP_PACKING_OVERWEIGHT_01548');
    target.accessories.push(item);
    target.weightKg=target.weightKg===null||item.weightKg===null?null:Math.round((target.weightKg+item.weightKg)*1000)/1000;
  }
  if(!packages.length)warnings.add('NP_PACKING_NO_PHYSICAL_GOODS_01548');
  if(unassigned.length)warnings.add('NP_PACKING_UNASSIGNED_01548');
  // Geometric bounding-box comparison is only a preliminary test, not an actual packing certification.
  warnings.add('NP_PACKING_FIT_UNVERIFIED_01548');
  return {stage:'01548',packages,unassigned,serviceLines,warnings:[...warnings],
    numberOfPackages:packages.length,readyForOrder:false,hasCarrierQuote:false,quoteStatus:'carrier-price',
    relationsChanged:false,orderCreated:false,waybillCreated:false};
}
export async function previewCartPacking01548(scope,input,{cartView,parcelView}={}){
  if(!scope?.storeId)throw fail('NP_PACKING_SCOPE_REQUIRED_01548',403);
  assertPreviewRate01548(scope);
  const siteId=str(input?.siteId),cartId=str(input?.cartId);
  if(!/^[-\w:]{1,160}$/.test(siteId)||!/^cart_[a-z0-9]{24,48}$/i.test(cartId))throw fail('NP_PACKING_CART_INVALID_01548',400);
  const resolveCart=cartView||((await import('./marketplace-shop-cart-service-01535.mjs')).shopCartView01535);
  const resolveCatalog=parcelView||((await import('./shipping-product-parcels-01545.mjs')).listStoreProductParcels01545);
  const cart=await resolveCart(scope,siteId,cartId);
  if(str(cart.id)!==cartId||str(cart.siteId)!==siteId||arr(cart.issues).length)throw fail('NP_PACKING_CART_INVALID_01548');
  const catalog=await resolveCatalog(scope);
  const output=buildPackingPlan01548(cart.items,catalog,input?.moves||[]);
  return {...output,siteId,cartId,previewOnly:true};
}
