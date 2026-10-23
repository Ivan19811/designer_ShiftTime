// 01554 · Protected Store-scoped CHECKOUT DRAFT. No final orders, payments, TTN, CRM delivery or customer PII.
import {randomUUID,createHash} from 'node:crypto';
const withClient=async (...args)=>(await import('./db.mjs')).withClient(...args);
const withTransaction=async (...args)=>(await import('./db.mjs')).withTransaction(...args);
import {checkoutPreflight01553,validateCheckoutPreflightInput01553,checkoutCartFingerprint01553} from './shipping-checkout-preflight-01553.mjs';
import {authoredView01535} from './marketplace-shop-cart-core-01535.mjs';
import {buildPackingPlan01548,packingFingerprint01548} from './shipping-packing-preview-01548.mjs';
import {validateMultiPlacePlan01551} from './shipping-multiplace-quote-01551.mjs';
const str=x=>String(x??'').trim();
const fail=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const idempotencyPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const toCents=v=>Math.round(Number(v)*100);
export function validateCheckoutDraftInput01554(input){
  const validated=validateCheckoutPreflightInput01553(input);
  const idempotencyKey=str(input?.idempotencyKey);
  if(!idempotencyPattern.test(idempotencyKey))throw fail('NP_DRAFT_IDEMPOTENCY_REQUIRED_01554',400);
  // Refuse PII, fake product lists, fake pricing and other unrecognized fields, not silently store them.
  const allowed=new Set(['siteId','cartId','cityRecipient','warehouseRef','expectedPackingRevision','expectedPlaces','expectedPrice','expectedWeightKg','expectedDeclaredValue','idempotencyKey']);
  if(Object.keys(input||{}).some(x=>!allowed.has(x)))throw fail('NP_DRAFT_UNEXPECTED_FIELDS_01554',400);
  return {...validated,idempotencyKey};
}
export function checkoutDraftPublic01554(row,{replayed=false}={}){
  return {stage:'01554',draftId:row.id,state:'draft',replayed,previewOnly:true,final:false,orderReady:false,canPlaceOrder:false,canPay:false,waybillCreated:false,fitUnverified:true,crmSynced:false,crmSyncState:'not_sent',paymentState:'not_started',shippingState:'not_booked',currency:'UAH',subtotal:Number(row.subtotal_cents)/100,provisionalDelivery:Number(row.provisional_delivery_cents)/100,provisionalTotal:Number(row.provisional_total_cents)/100,numberOfPackages:Number(row.number_of_packages),weightKg:Number(row.total_weight_grams)/1000,createdAt:row.created_at};
}
export async function lockedSnapshot01554(db,scope,p,ctx){
  // Use one PG transaction; concurrent quantity changes also acquire the marketplace_carts row lock.
  const cartQ=await db.query(`SELECT id,currency,status FROM marketplace_carts WHERE id=$1 AND marketplace_id='marketplace_shifttime' FOR SHARE`,[p.cartId]);
  const cart=cartQ.rows[0];
  if(!cart||cart.status!=='active'||cart.currency!=='UAH')throw fail('NP_DRAFT_CART_CHANGED_01554');
  const catalogQ=await db.query(`SELECT snapshot FROM commerce_store_snapshots WHERE store_id=$1 FOR SHARE`,[scope.storeId]);
  if(!catalogQ.rowCount)throw fail('NP_DRAFT_CART_CHANGED_01554');
  const itemQ=await db.query(`SELECT id,source_kind "sourceKind",store_id "storeId",site_id "siteId",product_id "productId",variant_id "variantId",variant_sku "variantSku",bundle_id "bundleId",component_kind "componentKind",parent_item_id "parentItemId",quantity,added_at "addedAt",updated_at "updatedAt" FROM marketplace_cart_items WHERE cart_id=$1 AND store_id=$2 AND site_id=$3 ORDER BY added_at,id FOR SHARE`,[p.cartId,scope.storeId,p.siteId]);
  if(!itemQ.rowCount||itemQ.rows.some(x=>x.sourceKind!=='store-product-01534'))throw fail('NP_DRAFT_CART_CHANGED_01554');
  const projected=authoredView01535(catalogQ.rows[0].snapshot||{},itemQ.rows,scope.storeId,p.siteId);
  const actual={id:p.cartId,siteId:p.siteId,currency:cart.currency,items:projected.items};
  if(projected.issues.length||checkoutCartFingerprint01553(actual)!==ctx.cartFingerprint)throw fail('NP_DRAFT_CART_CHANGED_01554');
  const packingQ=await db.query(`SELECT cart_fingerprint "cartFingerprint",revision,moves FROM shifttime_shipping_cart_packing_01549 WHERE store_id=$1 AND site_id=$2 AND cart_id=$3 FOR SHARE`,[scope.storeId,p.siteId,p.cartId]);
  if(!packingQ.rowCount||packingQ.rows[0].revision!==p.expectedPackingRevision||str(packingQ.rows[0].cartFingerprint)!==ctx.packingFingerprint)throw fail('NP_DRAFT_PACKING_CHANGED_01554');
  // Recompute live unit dimensions AND grouping with catalog + parcel rows locked in this transaction.
  const parcelQ=await db.query(`SELECT product_id "productId",variant_id "variantId",shipping_required "shippingRequired",weight_kg "weightKg",length_cm "lengthCm",width_cm "widthCm",height_cm "heightCm" FROM shifttime_shipping_product_parcels WHERE store_id=$1 FOR SHARE`,[scope.storeId]);
  const s=catalogQ.rows[0].snapshot||{};
  const shippingCatalog={products:(s.products||[]).map(x=>({id:x.id,catalogRole01472:x.catalogRole01472,shipping01547:x.shipping01547||null})),variants:(s.variants||[]).map(x=>({id:x.id,productId:x.productId,shipping01547:x.shipping01547||null})),specs:parcelQ.rows.map(x=>({...x,weightKg:x.weightKg===null?null:Number(x.weightKg),lengthCm:x.lengthCm===null?null:Number(x.lengthCm),widthCm:x.widthCm===null?null:Number(x.widthCm),heightCm:x.heightCm===null?null:Number(x.heightCm)}))};
  const livePlan=buildPackingPlan01548(projected.items,shippingCatalog,packingQ.rows[0].moves);
  const liveFingerprint=packingFingerprint01548(projected.items,livePlan);
  if(liveFingerprint!==ctx.packingFingerprint||JSON.stringify(livePlan.packages.map(x=>[x.id,x.main.itemId,x.dimensions,x.weightKg,x.accessories.map(a=>a.unitKey)]))!==JSON.stringify(ctx.plan.packages.map(x=>[x.id,x.main.itemId,x.dimensions,x.weightKg,x.accessories.map(a=>a.unitKey)])))throw fail('NP_DRAFT_PACKING_CHANGED_01554');
  const liveTrusted=validateMultiPlacePlan01551({...livePlan,siteId:p.siteId,cartId:p.cartId,previewOnly:true,layoutStale:false,moves:packingQ.rows[0].moves},actual);
  if(liveTrusted.seats!==p.expectedPlaces||Math.abs(liveTrusted.weightKg-p.expectedWeightKg)>.001||toCents(liveTrusted.declaredValue)!==p.expectedDeclaredCents)throw fail('NP_DRAFT_PACKING_CHANGED_01554');
  return projected.items.map(i=>({itemId:i.id,productId:i.productId,variantId:i.variantId||'',sku:i.sku||'',componentKind:i.componentKind,quantity:i.quantity,unitPriceCents:toCents(i.unitPrice),lineTotalCents:toCents(i.lineTotal),parentItemId:i.parentItemId||null,bundleId:i.bundleId||null,title:str(i.title).slice(0,180)}));
}
export async function createCheckoutDraft01554(scope,input,{preflight=checkoutPreflight01553,lookup=withClient,transaction=withTransaction,snapshot=lockedSnapshot01554,newId=()=>`orderdraft_${randomUUID().replaceAll('-','')}`}={}){
  if(!scope?.storeId||!scope?.userId||!scope?.workspaceId||!scope?.accountId)throw fail('NP_DRAFT_SCOPE_REQUIRED_01554',403);
  const p=validateCheckoutDraftInput01554(input);
  const requestHash=hash([p.siteId,p.cartId,p.cityRecipient,p.warehouseRef,p.expectedPackingRevision,p.expectedPlaces,p.expectedPriceCents,p.expectedDeclaredCents,p.expectedWeightKg]);
  const existing=await lookup(async db=>(await db.query(`SELECT * FROM shifttime_checkout_drafts_01554 WHERE store_id=$1 AND created_by_user_id=$2 AND idempotency_key=$3`,[scope.storeId,scope.userId,p.idempotencyKey])).rows[0]);
  if(existing){if(str(existing.request_hash)!==requestHash||existing.site_id!==p.siteId||existing.cart_id!==p.cartId)throw fail('NP_DRAFT_IDEMPOTENCY_CONFLICT_01554');return checkoutDraftPublic01554(existing,{replayed:true});}
  // Carrier cost is re-fetched on the server; no browser price, quantity or geometry is authoritative.
  const verified=await preflight(scope,input,{includeDraftContext:true});
  const ctx=verified._draftContext;
  if(!verified.preflightPassed||!ctx||!Array.isArray(ctx.plan?.packages)||!Array.isArray(ctx.cart?.items)||!ctx.cartFingerprint||!ctx.packingFingerprint||verified.canPlaceOrder!==false)throw fail('NP_DRAFT_PREFLIGHT_REQUIRED_01554');
  const subtotalCents=toCents(verified.subtotal),shippingCents=toCents(verified.shippingCost),totalCents=toCents(verified.estimatedTotal),weightGrams=Math.round(verified.weightKg*1000);
  if(totalCents!==subtotalCents+shippingCents||!Number.isSafeInteger(weightGrams)||weightGrams<1)throw fail('NP_DRAFT_PREFLIGHT_REQUIRED_01554');
  const draftPackages=ctx.plan.packages.map((pkg,i)=>({number:i+1,packageId:pkg.id,mainItemId:pkg.main.itemId,accessoryItemIds:(pkg.accessories||[]).map(a=>a.itemId),dimensionsCm:pkg.dimensions,weightGrams:Math.round(pkg.weightKg*1000)}));
  return transaction(async db=>{
    const rows=await snapshot(db,scope,p,ctx);
    const id=newId();
    const q=await db.query(`INSERT INTO shifttime_checkout_drafts_01554
      (id,account_id,workspace_id,store_id,site_id,cart_id,created_by_user_id,idempotency_key,request_hash,cart_fingerprint,packing_fingerprint,packing_revision,recipient_city_ref,recipient_warehouse_ref,subtotal_cents,provisional_delivery_cents,provisional_total_cents,total_weight_grams,number_of_packages,items,packages)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb,$21::jsonb)
      ON CONFLICT(store_id,created_by_user_id,idempotency_key) DO NOTHING RETURNING *`,[id,scope.accountId,scope.workspaceId,scope.storeId,p.siteId,p.cartId,scope.userId,p.idempotencyKey,requestHash,ctx.cartFingerprint,ctx.packingFingerprint,p.expectedPackingRevision,p.cityRecipient,p.warehouseRef,subtotalCents,shippingCents,totalCents,weightGrams,verified.numberOfPackages,JSON.stringify(rows),JSON.stringify(draftPackages)]);
    if(q.rowCount)return checkoutDraftPublic01554(q.rows[0]);
    const conflict=await db.query(`SELECT * FROM shifttime_checkout_drafts_01554 WHERE store_id=$1 AND created_by_user_id=$2 AND idempotency_key=$3`,[scope.storeId,scope.userId,p.idempotencyKey]);
    if(!conflict.rowCount||str(conflict.rows[0].request_hash)!==requestHash)throw fail('NP_DRAFT_IDEMPOTENCY_CONFLICT_01554');
    return checkoutDraftPublic01554(conflict.rows[0],{replayed:true});
  });
}
