import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {config} from './config.mjs';
import {reserveInventoryForOrder01077,commitInventoryReservation01077,getOrderInventoryState01077,cancelSellerOrderInventory01077} from './marketplace-inventory-service.mjs';
import {createSellerOrderDelivery01078,loadOrderDeliveries01078,loadSellerOrderDeliveries01078} from './marketplace-shipping-service.mjs';
import {quoteCheckoutShipping01079,recalculateOrderTotals01079,moneyRound01079} from './marketplace-pricing-service.mjs';
const MARKETPLACE_ID='marketplace_shifttime';
const clean=v=>String(v??'').trim();
const n=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
function id(prefix){return `${prefix}_${crypto.randomUUID().replace(/-/g,'')}`;}
function orderNo(prefix){const d=new Date(),date=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;return `${prefix}-${date}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;}
function validCartToken(v){return /^cart_[a-z0-9]{24,48}$/i.test(clean(v));}
function validate(input={}){const buyer={name:clean(input?.buyer?.name),phone:clean(input?.buyer?.phone),email:clean(input?.buyer?.email)},delivery={method:['nova-poshta','ukrposhta','courier','pickup','custom'].includes(clean(input?.delivery?.method))?clean(input.delivery.method):'nova-poshta',city:clean(input?.delivery?.city),address:clean(input?.delivery?.address),comment:clean(input?.delivery?.comment)},payment={method:['cod','card','bank-transfer'].includes(clean(input?.payment?.method))?clean(input.payment.method):'cod',status:'pending'},errors=[];if(buyer.name.length<2)errors.push('Buyer name is required');if(buyer.phone.length<7)errors.push('Buyer phone is required');if(delivery.method!=='pickup'&&!delivery.city)errors.push('Delivery city is required');if(delivery.method!=='pickup'&&!delivery.address)errors.push('Delivery address/branch is required');if(errors.length)throw Object.assign(new Error(errors.join(' · ')),{statusCode:400});return {buyer,delivery,payment};}

async function orderView(client,orderId){
  const oq=await client.query(`SELECT id,order_number "orderNumber",marketplace_id "marketplaceId",cart_id "cartId",status,currency,subtotal::float8,subtotal::float8 "itemsTotal",shipping_total::float8 "shippingTotal",discount_total::float8 "discountTotal",total::float8,total::float8 "grandTotal",buyer,delivery,payment,created_at "createdAt",updated_at "updatedAt" FROM marketplace_orders WHERE id=$1`,[orderId]);
  if(!oq.rowCount)return null;
  const sq=await client.query(`SELECT id,order_number "orderNumber",marketplace_order_id "marketplaceOrderId",marketplace_id "marketplaceId",seller_profile_id "sellerProfileId",store_id "storeId",seller_name "sellerName",status,currency,subtotal::float8,subtotal::float8 "itemsSubtotal",shipping_total::float8 "shippingTotal",discount_total::float8 "discountTotal",total::float8,total::float8 "grossTotal",buyer,delivery,payment,created_at "createdAt",updated_at "updatedAt" FROM marketplace_seller_orders WHERE marketplace_order_id=$1 ORDER BY created_at,id`,[orderId]);
  const iq=await client.query(`SELECT id,seller_order_id "sellerOrderId",seller_offer_id "sellerOfferId",listing_id "listingId",catalog_product_id "catalogProductId",source_product_id "sourceProductId",title,brand,sku,quantity,unit_price::float8 "unitPrice",old_price::float8 "oldPrice",line_total::float8 "lineTotal",currency,snapshot,created_at "snapshotAt" FROM marketplace_order_items WHERE marketplace_order_id=$1 ORDER BY created_at,id`,[orderId]);
  const by=new Map();for(const x of iq.rows){if(!by.has(x.sellerOrderId))by.set(x.sellerOrderId,[]);by.get(x.sellerOrderId).push({...x,media:Array.isArray(x.snapshot?.media)?x.snapshot.media:[]});}
  const deliveries=await loadOrderDeliveries01078(client,orderId);
  return {...oq.rows[0],sellerOrders:sq.rows.map(s=>({...s,delivery:deliveries.get(s.id)||s.delivery,items:by.get(s.id)||[]})),inventory:await getOrderInventoryState01077(client,orderId)};
}

export async function checkoutPublicCart(cartToken='',input={}){
  const checkout=validate(input);
  return withClient(async client=>{
    await client.query('BEGIN');
    try{
      const token=validCartToken(cartToken)?clean(cartToken):'';
      if(!token)throw Object.assign(new Error('Cart token is required for checkout'),{statusCode:400});
      const cq=await client.query(`SELECT id,status,currency FROM marketplace_carts WHERE id=$1 AND marketplace_id=$2 FOR UPDATE`,[token,MARKETPLACE_ID]);
      if(!cq.rowCount)throw Object.assign(new Error('Cart not found'),{statusCode:404});
      if(cq.rows[0].status!=='active')throw Object.assign(new Error('Cart was already converted'),{statusCode:409});
      const rows=(await client.query(`SELECT ci.id "cartItemId",ci.quantity,o.id "offerId",o.seller_profile_id "sellerProfileId",o.store_id "storeId",o.catalog_product_id "catalogProductId",o.source_product_id "sourceProductId",o.sku,o.price::float8 price,o.old_price::float8 "oldPrice",o.currency,o.stock::float8 stock,o.availability,l.id "listingId",l.title "listingTitle",l.public_projection "publicProjection",s.display_name "sellerName",c.title "catalogTitle",c.brand "catalogBrand",c.media "catalogMedia"
        FROM marketplace_cart_items ci
        JOIN marketplace_seller_offers o ON o.id=ci.seller_offer_id AND o.status='active'
        JOIN marketplace_listings l ON l.seller_offer_id=o.id AND l.marketplace_id=o.marketplace_id AND l.publication_status='published' AND l.moderation_status='approved'
        JOIN marketplace_seller_profiles s ON s.id=o.seller_profile_id AND s.status='active'
        JOIN marketplace_catalog_products c ON c.id=o.catalog_product_id AND c.status='active'
        WHERE ci.cart_id=$1 ORDER BY o.id FOR UPDATE OF ci,o`,[token])).rows;
      if(!rows.length)throw Object.assign(new Error('Cart is empty or its offers are no longer public'),{statusCode:409});
      const groups=new Map();
      for(const r of rows){
        const qty=Math.max(1,Math.floor(n(r.quantity,1))),p=r.publicProjection||{},media=Array.isArray(r.catalogMedia)&&r.catalogMedia.length?r.catalogMedia:(Array.isArray(p.media)?p.media:[]),lineTotal=n(r.price)*qty;
        const item={id:id('orderitem'),sellerOfferId:r.offerId,listingId:r.listingId,catalogProductId:r.catalogProductId,sourceProductId:r.sourceProductId,title:r.catalogTitle||r.listingTitle||p.name||'',brand:r.catalogBrand||p.brand||'',sku:r.sku||'',quantity:qty,unitPrice:n(r.price),oldPrice:n(r.oldPrice),lineTotal,currency:r.currency||'UAH',media,snapshotAt:new Date().toISOString(),availability:r.availability};
        if(!groups.has(r.sellerProfileId))groups.set(r.sellerProfileId,{sellerProfileId:r.sellerProfileId,storeId:r.storeId,sellerName:r.sellerName||'Продавець',items:[]});
        groups.get(r.sellerProfileId).items.push(item);
      }
      const mpOrderId=id('mporder'),mpNo=orderNo('MP'),sellerGroups=[...groups.values()],currency=cq.rows[0].currency||'UAH';
      const pricedGroups=[];
      for(const g of sellerGroups){
        const itemsSubtotal=moneyRound01079(g.items.reduce((s,x)=>s+x.lineTotal,0)),quantity=g.items.reduce((s,x)=>s+x.quantity,0);
        const quote=await quoteCheckoutShipping01079({shippingMethod:checkout.delivery.method,currency,quantity,city:checkout.delivery.city,address:checkout.delivery.address,storeId:g.storeId,sellerProfileId:g.sellerProfileId});
        pricedGroups.push({...g,itemsSubtotal,shippingTotal:quote.shippingPrice,discountTotal:0,grossTotal:moneyRound01079(itemsSubtotal+quote.shippingPrice),shippingQuote:quote});
      }
      const itemsTotal=moneyRound01079(pricedGroups.reduce((s,g)=>s+g.itemsSubtotal,0)),shippingTotal=moneyRound01079(pricedGroups.reduce((s,g)=>s+g.shippingTotal,0)),discountTotal=0,grandTotal=moneyRound01079(itemsTotal+shippingTotal-discountTotal);
      await client.query(`INSERT INTO marketplace_orders(id,marketplace_id,order_number,cart_id,status,currency,subtotal,shipping_total,discount_total,total,buyer,delivery,payment) VALUES($1,$2,$3,$4,'new',$5,$6,$7,$8,$9,$10,$11,$12)`,[mpOrderId,MARKETPLACE_ID,mpNo,token,currency,itemsTotal,shippingTotal,discountTotal,grandTotal,checkout.buyer,checkout.delivery,checkout.payment]);
      let idx=0;const inventoryItems=[];
      for(const g of pricedGroups){
        idx++;const sellerOrderId=id('sellerorder'),soNo=`${mpNo}-S${String(idx).padStart(2,'0')}`;
        await client.query(`INSERT INTO marketplace_seller_orders(id,marketplace_order_id,marketplace_id,seller_profile_id,store_id,order_number,seller_name,status,currency,subtotal,shipping_total,discount_total,total,buyer,delivery,payment) VALUES($1,$2,$3,$4,$5,$6,$7,'new',$8,$9,$10,$11,$12,$13,$14,$15)`,[sellerOrderId,mpOrderId,MARKETPLACE_ID,g.sellerProfileId,g.storeId,soNo,g.sellerName,currency,g.itemsSubtotal,g.shippingTotal,g.discountTotal,g.grossTotal,checkout.buyer,checkout.delivery,checkout.payment]);
        await createSellerOrderDelivery01078(client,{marketplaceOrderId:mpOrderId,sellerOrderId,sellerProfileId:g.sellerProfileId,storeId:g.storeId,provider:g.shippingQuote.provider,shippingMethod:checkout.delivery.method,carrier:g.shippingQuote.carrier,currency,recipient:checkout.buyer,city:checkout.delivery.city,warehouse:['nova-poshta','ukrposhta'].includes(checkout.delivery.method)?checkout.delivery.address:'',address:['nova-poshta','ukrposhta'].includes(checkout.delivery.method)?'':checkout.delivery.address,comment:checkout.delivery.comment,shippingPrice:g.shippingTotal,metadata:{createdBy:'checkout-01079',checkoutQuote:{...g.shippingQuote,quotedAt:new Date().toISOString()}}});
        for(const x of g.items){
          await client.query(`INSERT INTO marketplace_order_items(id,marketplace_order_id,seller_order_id,seller_offer_id,listing_id,catalog_product_id,source_product_id,title,brand,sku,quantity,unit_price,old_price,line_total,currency,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,[x.id,mpOrderId,sellerOrderId,x.sellerOfferId,x.listingId,x.catalogProductId,x.sourceProductId,x.title,x.brand,x.sku,x.quantity,x.unitPrice,x.oldPrice,x.lineTotal,x.currency,{media:x.media,snapshotAt:x.snapshotAt}]);
          inventoryItems.push({orderItemId:x.id,sellerOrderId,sellerOfferId:x.sellerOfferId,sellerProfileId:g.sellerProfileId,storeId:g.storeId,sourceProductId:x.sourceProductId,quantity:x.quantity,availability:x.availability,title:x.title,sku:x.sku});
        }
      }
      await recalculateOrderTotals01079(client,mpOrderId,{lockOrder:true});
      const reservationId=await reserveInventoryForOrder01077(client,{cartId:token,marketplaceOrderId:mpOrderId,paymentMethod:checkout.payment.method,items:inventoryItems,ttlMinutes:config.inventoryReservationMinutes});
      if(checkout.payment.method==='cod'&&reservationId)await commitInventoryReservation01077(client,{reservationId,reason:'cod-order-created'});
      await client.query(`UPDATE marketplace_carts SET status='converted',updated_at=now() WHERE id=$1`,[token]);
      const nextCartId=id('cart');await client.query(`INSERT INTO marketplace_carts(id,marketplace_id,anonymous_token,status,currency) VALUES($1,$2,$1,'active',$3)`,[nextCartId,MARKETPLACE_ID,cq.rows[0].currency||'UAH']);
      await client.query('COMMIT');
      return {order:await orderView(client,mpOrderId),nextCartId};
    }catch(e){await client.query('ROLLBACK');throw e;}
  });
}

export async function listAuthorizedSellerOrders(scope){
  return withClient(async client=>{
    const q=await client.query(`SELECT id,marketplace_order_id "marketplaceOrderId",order_number "orderNumber",seller_profile_id "sellerProfileId",store_id "storeId",seller_name "sellerName",status,currency,subtotal::float8,subtotal::float8 "itemsSubtotal",shipping_total::float8 "shippingTotal",discount_total::float8 "discountTotal",total::float8,total::float8 "grossTotal",buyer,delivery,payment,created_at "createdAt",updated_at "updatedAt" FROM marketplace_seller_orders WHERE marketplace_id=$1 AND store_id=$2 ORDER BY created_at DESC LIMIT 200`,[MARKETPLACE_ID,scope.storeId]);
    if(!q.rowCount)return {stage:'01079',items:[]};
    const ids=q.rows.map(x=>x.id),iq=await client.query(`SELECT id,seller_order_id "sellerOrderId",seller_offer_id "sellerOfferId",listing_id "listingId",catalog_product_id "catalogProductId",source_product_id "sourceProductId",title,brand,sku,quantity,unit_price::float8 "unitPrice",old_price::float8 "oldPrice",line_total::float8 "lineTotal",currency,snapshot,created_at "snapshotAt" FROM marketplace_order_items WHERE seller_order_id=ANY($1::text[]) ORDER BY created_at,id`,[ids]),by=new Map();
    for(const x of iq.rows){if(!by.has(x.sellerOrderId))by.set(x.sellerOrderId,[]);by.get(x.sellerOrderId).push({...x,media:Array.isArray(x.snapshot?.media)?x.snapshot.media:[]});}
    const deliveries=await loadSellerOrderDeliveries01078(client,ids);
    return {stage:'01079',items:q.rows.map(s=>({...s,delivery:deliveries.get(s.id)||s.delivery,items:by.get(s.id)||[]}))};
  });
}
const TRANSITIONS={new:new Set(['new','confirmed','cancelled']),confirmed:new Set(['confirmed','processing','cancelled']),processing:new Set(['processing','shipped','cancelled']),shipped:new Set(['shipped','completed']),completed:new Set(['completed']),cancelled:new Set(['cancelled'])};
async function refreshParentStatus(client,parentId){const q=await client.query(`SELECT status FROM marketplace_seller_orders WHERE marketplace_order_id=$1`,[parentId]),st=q.rows.map(x=>x.status);let status='new';if(st.length&&st.every(x=>x==='completed'))status='completed';else if(st.length&&st.every(x=>x==='cancelled'))status='cancelled';else if(st.some(x=>x==='completed'||x==='cancelled'))status='partially-completed';else if(st.some(x=>x==='processing'||x==='shipped'))status='processing';else if(st.some(x=>x==='confirmed'))status='confirmed';await client.query(`UPDATE marketplace_orders SET status=$2,updated_at=now() WHERE id=$1`,[parentId,status]);}
export async function updateAuthorizedSellerOrder(scope,sellerOrderId,input={}){
  const status=clean(input.status);
  return withClient(async client=>{
    await client.query('BEGIN');
    try{
      const q=await client.query(`SELECT id,marketplace_order_id "marketplaceOrderId",status FROM marketplace_seller_orders WHERE id=$1 AND marketplace_id=$2 AND store_id=$3 FOR UPDATE`,[sellerOrderId,MARKETPLACE_ID,scope.storeId]);
      if(!q.rowCount)throw Object.assign(new Error('SellerOrder not found for active Store'),{statusCode:404});
      const row=q.rows[0];if(!TRANSITIONS[row.status]?.has(status))throw Object.assign(new Error(`SellerOrder transition ${row.status} → ${status} is not allowed`),{statusCode:409});
      if(status==='cancelled'&&row.status!=='cancelled')await cancelSellerOrderInventory01077(client,sellerOrderId,{reason:'seller-order-cancelled'});
      await client.query(`UPDATE marketplace_seller_orders SET status=$2,updated_at=now() WHERE id=$1`,[sellerOrderId,status]);
      await refreshParentStatus(client,row.marketplaceOrderId);await client.query('COMMIT');
      const list=await listAuthorizedSellerOrders(scope);return list.items.find(x=>x.id===sellerOrderId)||null;
    }catch(e){await client.query('ROLLBACK');throw e;}
  });
}
