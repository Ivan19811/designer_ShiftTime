import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {config} from './config.mjs';
const MARKETPLACE_ID='marketplace_shifttime';
const n=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clean=v=>String(v??'').trim();
function id(prefix){return `${prefix}_${crypto.randomUUID().replace(/-/g,'')}`;}
function httpError(message,statusCode=409){return Object.assign(new Error(message),{statusCode});}
function uniq(values){return [...new Set((values||[]).map(clean).filter(Boolean))];}

export async function expireStaleInventoryReservations01077(client,{offerIds=[],storeId=''}={}){
  const ids=uniq(offerIds);
  const params=[],where=["r.status='active'","r.expires_at<=now()"];
  if(ids.length){params.push(ids);where.push(`EXISTS(SELECT 1 FROM marketplace_inventory_reservation_items i WHERE i.reservation_id=r.id AND i.seller_offer_id=ANY($${params.length}::text[]))`);}
  if(clean(storeId)){params.push(clean(storeId));where.push(`EXISTS(SELECT 1 FROM marketplace_inventory_reservation_items i WHERE i.reservation_id=r.id AND i.store_id=$${params.length})`);}
  const q=await client.query(`SELECT r.id FROM marketplace_inventory_reservations r WHERE ${where.join(' AND ')} ORDER BY r.expires_at,r.id FOR UPDATE`,params);
  let expired=0;
  for(const row of q.rows){
    const items=(await client.query(`SELECT id,seller_offer_id "sellerOfferId",store_id "storeId",seller_order_id "sellerOrderId",quantity FROM marketplace_inventory_reservation_items WHERE reservation_id=$1 AND status='active' FOR UPDATE`,[row.id])).rows;
    if(!items.length){await client.query(`UPDATE marketplace_inventory_reservations SET status='expired',released_at=COALESCE(released_at,now()),release_reason='expired',updated_at=now() WHERE id=$1 AND status='active'`,[row.id]);continue;}
    for(const item of items){
      await client.query(`UPDATE marketplace_inventory_reservation_items SET status='expired',updated_at=now() WHERE id=$1 AND status='active'`,[item.id]);
      await client.query(`INSERT INTO marketplace_inventory_ledger(id,marketplace_id,seller_offer_id,store_id,reservation_id,seller_order_id,entry_type,quantity,metadata) VALUES($1,$2,$3,$4,$5,$6,'expire',$7,$8::jsonb)`,[id('invlog'),MARKETPLACE_ID,item.sellerOfferId,item.storeId,row.id,item.sellerOrderId,n(item.quantity),JSON.stringify({reason:'ttl-expired'})]);
    }
    await client.query(`UPDATE marketplace_inventory_reservations SET status='expired',released_at=now(),release_reason='expired',updated_at=now() WHERE id=$1 AND status='active'`,[row.id]);
    expired++;
  }
  return expired;
}

async function reservedByOffer(client,offerIds){
  const ids=uniq(offerIds);if(!ids.length)return new Map();
  const q=await client.query(`SELECT i.seller_offer_id "offerId",COALESCE(SUM(i.quantity),0)::float8 reserved
    FROM marketplace_inventory_reservation_items i
    JOIN marketplace_inventory_reservations r ON r.id=i.reservation_id
    WHERE i.seller_offer_id=ANY($1::text[]) AND i.status='active' AND r.status='active' AND r.expires_at>now()
    GROUP BY i.seller_offer_id`,[ids]);
  return new Map(q.rows.map(x=>[x.offerId,n(x.reserved)]));
}

async function updateSourceProductStock(client,{storeId,sourceProductId,stock,availability}){
  if(!storeId||!sourceProductId)return;
  const q=await client.query(`SELECT snapshot,revision FROM commerce_store_snapshots WHERE store_id=$1 FOR UPDATE`,[storeId]);
  if(!q.rowCount)return;
  const snapshot=q.rows[0].snapshot&&typeof q.rows[0].snapshot==='object'?q.rows[0].snapshot:{};
  const products=Array.isArray(snapshot.products)?snapshot.products:[];
  const idx=products.findIndex(x=>String(x?.id||'')===String(sourceProductId));
  if(idx<0)return;
  const copy=products.slice(),current={...(copy[idx]||{})},now=new Date().toISOString();
  copy[idx]={...current,stock:Math.max(0,n(stock)),availability:availability||current.availability||'in-stock',updatedAt:now};
  const next={...snapshot,products:copy,revision:Math.max(0,n(snapshot.revision,q.rows[0].revision))+1,updatedAt:now};
  await client.query(`UPDATE commerce_store_snapshots SET revision=$2,snapshot=$3::jsonb,updated_at=now() WHERE store_id=$1`,[storeId,next.revision,JSON.stringify(next)]);
  const scope=await client.query(`SELECT w.account_id "accountId",s.workspace_id "workspaceId" FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id WHERE s.id=$1`,[storeId]);
  if(scope.rowCount)await client.query(`INSERT INTO commerce_outbox(account_id,workspace_id,store_id,event_type,aggregate_type,aggregate_id,payload) VALUES($1,$2,$3,'commerce.inventory.stock-committed','product',$4,$5::jsonb)`,[scope.rows[0].accountId,scope.rows[0].workspaceId,storeId,sourceProductId,JSON.stringify({sourceProductId,stock:Math.max(0,n(stock)),availability})]);
}

export async function reserveInventoryForOrder01077(client,{cartId='',marketplaceOrderId='',paymentMethod='cod',items=[],ttlMinutes=config.inventoryReservationMinutes}={}){
  const managed=(items||[]).filter(x=>x&&x.availability!=='preorder'&&clean(x.sellerOfferId)&&n(x.quantity)>0);
  if(!managed.length)return null;
  const offerIds=uniq(managed.map(x=>x.sellerOfferId));
  await expireStaleInventoryReservations01077(client,{offerIds});
  const offers=(await client.query(`SELECT id,stock::float8 stock,availability FROM marketplace_seller_offers WHERE id=ANY($1::text[]) ORDER BY id FOR UPDATE`,[offerIds])).rows;
  const byId=new Map(offers.map(x=>[x.id,x])),reserved=await reservedByOffer(client,offerIds);
  for(const item of managed){
    const offer=byId.get(item.sellerOfferId);if(!offer)throw httpError('SellerOffer disappeared during inventory reservation',409);
    const available=Math.max(0,n(offer.stock)-n(reserved.get(item.sellerOfferId)));
    if(available<n(item.quantity))throw httpError(`Insufficient available stock for ${item.title||item.sku||item.sellerOfferId}: requested ${n(item.quantity)}, available ${available}`,409);
  }
  const reservationId=id('invres'),minutes=Math.max(1,Math.min(180,Math.floor(n(ttlMinutes,15))));
  await client.query(`INSERT INTO marketplace_inventory_reservations(id,marketplace_id,cart_id,marketplace_order_id,payment_method,status,expires_at) VALUES($1,$2,$3,$4,$5,'active',now()+($6::text||' minutes')::interval)`,[reservationId,MARKETPLACE_ID,cartId||null,marketplaceOrderId,paymentMethod||'cod',String(minutes)]);
  for(const item of managed){
    const itemId=id('invitem');
    await client.query(`INSERT INTO marketplace_inventory_reservation_items(id,reservation_id,marketplace_order_id,seller_order_id,order_item_id,seller_offer_id,seller_profile_id,store_id,source_product_id,quantity,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active')`,[itemId,reservationId,marketplaceOrderId,item.sellerOrderId,item.orderItemId,item.sellerOfferId,item.sellerProfileId,item.storeId,item.sourceProductId||null,Math.floor(n(item.quantity))]);
    await client.query(`INSERT INTO marketplace_inventory_ledger(id,marketplace_id,seller_offer_id,store_id,reservation_id,marketplace_order_id,seller_order_id,entry_type,quantity,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,'reserve',$8,$9::jsonb)`,[id('invlog'),MARKETPLACE_ID,item.sellerOfferId,item.storeId,reservationId,marketplaceOrderId,item.sellerOrderId,n(item.quantity),JSON.stringify({paymentMethod,expiresInMinutes:minutes})]);
  }
  return reservationId;
}

async function reservationRow(client,{reservationId='',orderId=''}={}){
  if(reservationId)return (await client.query(`SELECT * FROM marketplace_inventory_reservations WHERE id=$1 FOR UPDATE`,[reservationId])).rows[0]||null;
  if(orderId)return (await client.query(`SELECT * FROM marketplace_inventory_reservations WHERE marketplace_order_id=$1 FOR UPDATE`,[orderId])).rows[0]||null;
  return null;
}

export async function commitInventoryReservation01077(client,{reservationId='',orderId='',reason='order-commit'}={}){
  await expireStaleInventoryReservations01077(client);
  const r=await reservationRow(client,{reservationId,orderId});if(!r)return null;
  if(r.status==='committed')return r.id;
  if(r.status!=='active')throw httpError(`Inventory reservation is ${r.status}; stock commit is not allowed`,409);
  const items=(await client.query(`SELECT id,seller_offer_id "sellerOfferId",store_id "storeId",source_product_id "sourceProductId",seller_order_id "sellerOrderId",quantity FROM marketplace_inventory_reservation_items WHERE reservation_id=$1 AND status='active' ORDER BY seller_offer_id FOR UPDATE`,[r.id])).rows;
  const offerIds=uniq(items.map(x=>x.sellerOfferId));
  const offers=(await client.query(`SELECT id,stock::float8 stock,availability,projection FROM marketplace_seller_offers WHERE id=ANY($1::text[]) ORDER BY id FOR UPDATE`,[offerIds])).rows;
  const byId=new Map(offers.map(x=>[x.id,x]));
  for(const item of items){
    const offer=byId.get(item.sellerOfferId);if(!offer)throw httpError('SellerOffer not found during stock commit',409);
    const qty=n(item.quantity),before=n(offer.stock);if(before<qty)throw httpError(`Physical stock dropped below reserved quantity for ${item.sellerOfferId}`,409);
    const after=Math.max(0,before-qty),availability=after<=0?'out-of-stock':(offer.availability==='out-of-stock'?'in-stock':offer.availability);
    const projection={...(offer.projection||{}),stock:after,availability};
    await client.query(`UPDATE marketplace_seller_offers SET stock=$2,availability=$3,projection=$4::jsonb,updated_at=now() WHERE id=$1`,[item.sellerOfferId,after,availability,JSON.stringify(projection)]);
    await client.query(`UPDATE marketplace_listings SET public_projection=jsonb_set(jsonb_set(COALESCE(public_projection,'{}'::jsonb),'{stock}',to_jsonb($2::numeric),true),'{availability}',to_jsonb($3::text),true),last_synced_at=now(),updated_at=now() WHERE seller_offer_id=$1`,[item.sellerOfferId,after,availability]);
    await updateSourceProductStock(client,{storeId:item.storeId,sourceProductId:item.sourceProductId,stock:after,availability});
    await client.query(`UPDATE marketplace_inventory_reservation_items SET status='committed',updated_at=now() WHERE id=$1`,[item.id]);
    await client.query(`INSERT INTO marketplace_inventory_ledger(id,marketplace_id,seller_offer_id,store_id,reservation_id,marketplace_order_id,seller_order_id,entry_type,quantity,stock_after,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,'commit',$8,$9,$10::jsonb)`,[id('invlog'),MARKETPLACE_ID,item.sellerOfferId,item.storeId,r.id,r.marketplace_order_id,item.sellerOrderId,qty,after,JSON.stringify({reason})]);
  }
  await client.query(`UPDATE marketplace_inventory_reservations SET status='committed',committed_at=now(),updated_at=now() WHERE id=$1`,[r.id]);
  return r.id;
}

export async function releaseInventoryReservation01077(client,{reservationId='',orderId='',reason='checkout-not-completed'}={}){
  const r=await reservationRow(client,{reservationId,orderId});if(!r)return null;
  if(['released','expired'].includes(r.status))return r.id;
  if(r.status==='committed')return r.id;
  const items=(await client.query(`SELECT id,seller_offer_id "sellerOfferId",store_id "storeId",seller_order_id "sellerOrderId",quantity FROM marketplace_inventory_reservation_items WHERE reservation_id=$1 AND status='active' FOR UPDATE`,[r.id])).rows;
  for(const item of items){
    await client.query(`UPDATE marketplace_inventory_reservation_items SET status='released',updated_at=now() WHERE id=$1`,[item.id]);
    await client.query(`INSERT INTO marketplace_inventory_ledger(id,marketplace_id,seller_offer_id,store_id,reservation_id,marketplace_order_id,seller_order_id,entry_type,quantity,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,'release',$8,$9::jsonb)`,[id('invlog'),MARKETPLACE_ID,item.sellerOfferId,item.storeId,r.id,r.marketplace_order_id,item.sellerOrderId,n(item.quantity),JSON.stringify({reason})]);
  }
  await client.query(`UPDATE marketplace_inventory_reservations SET status='released',released_at=now(),release_reason=$2,updated_at=now() WHERE id=$1`,[r.id,clean(reason)]);
  return r.id;
}

export async function cancelSellerOrderInventory01077(client,sellerOrderId,{reason='seller-order-cancelled'}={}){
  const r=(await client.query(`SELECT r.id,r.status FROM marketplace_inventory_reservations r JOIN marketplace_inventory_reservation_items i ON i.reservation_id=r.id WHERE i.seller_order_id=$1 LIMIT 1 FOR UPDATE OF r`,[sellerOrderId])).rows[0]||null;
  if(!r)return {action:'none',count:0};
  if(r.status==='active'){
    await releaseInventoryReservation01077(client,{reservationId:r.id,reason:`${reason}:active-order-cancelled`});
    return {action:'released-order-reservation',count:1,reservationId:r.id};
  }
  if(r.status==='committed'){
    const count=await restoreCommittedSellerOrderInventory01077(client,sellerOrderId,{reason});
    return {action:count?'restocked-seller-order':'none',count,reservationId:r.id};
  }
  return {action:'none',count:0,reservationId:r.id,status:r.status};
}

export async function restoreCommittedSellerOrderInventory01077(client,sellerOrderId,{reason='seller-order-cancelled'}={}){
  const items=(await client.query(`SELECT i.id,i.reservation_id "reservationId",i.marketplace_order_id "marketplaceOrderId",i.seller_offer_id "sellerOfferId",i.store_id "storeId",i.source_product_id "sourceProductId",i.quantity,o.projection,o.availability,o.stock::float8 stock
    FROM marketplace_inventory_reservation_items i JOIN marketplace_seller_offers o ON o.id=i.seller_offer_id
    WHERE i.seller_order_id=$1 AND i.status='committed' ORDER BY i.seller_offer_id FOR UPDATE OF i,o`,[sellerOrderId])).rows;
  for(const item of items){
    const after=n(item.stock)+n(item.quantity),availability=after>0&&item.availability==='out-of-stock'?'in-stock':item.availability,projection={...(item.projection||{}),stock:after,availability};
    await client.query(`UPDATE marketplace_seller_offers SET stock=$2,availability=$3,projection=$4::jsonb,updated_at=now() WHERE id=$1`,[item.sellerOfferId,after,availability,JSON.stringify(projection)]);
    await client.query(`UPDATE marketplace_listings SET public_projection=jsonb_set(jsonb_set(COALESCE(public_projection,'{}'::jsonb),'{stock}',to_jsonb($2::numeric),true),'{availability}',to_jsonb($3::text),true),last_synced_at=now(),updated_at=now() WHERE seller_offer_id=$1`,[item.sellerOfferId,after,availability]);
    await updateSourceProductStock(client,{storeId:item.storeId,sourceProductId:item.sourceProductId,stock:after,availability});
    await client.query(`UPDATE marketplace_inventory_reservation_items SET status='restocked',updated_at=now() WHERE id=$1`,[item.id]);
    await client.query(`INSERT INTO marketplace_inventory_ledger(id,marketplace_id,seller_offer_id,store_id,reservation_id,marketplace_order_id,seller_order_id,entry_type,quantity,stock_after,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,'restock',$8,$9,$10::jsonb)`,[id('invlog'),MARKETPLACE_ID,item.sellerOfferId,item.storeId,item.reservationId,item.marketplaceOrderId,sellerOrderId,n(item.quantity),after,JSON.stringify({reason})]);
  }
  return items.length;
}

export async function getOrderInventoryState01077(client,orderId){
  const r=(await client.query(`SELECT id,status,payment_method "paymentMethod",expires_at "expiresAt",committed_at "committedAt",released_at "releasedAt",release_reason "releaseReason" FROM marketplace_inventory_reservations WHERE marketplace_order_id=$1`,[orderId])).rows[0];
  if(!r)return {reservationId:'',status:'not-required',reservedStock:0,committedStock:0};
  const q=await client.query(`SELECT status,COALESCE(SUM(quantity),0)::float8 quantity FROM marketplace_inventory_reservation_items WHERE reservation_id=$1 GROUP BY status`,[r.id]);
  const totals=Object.fromEntries(q.rows.map(x=>[x.status,n(x.quantity)]));
  return {...r,reservationId:r.id,reservedStock:n(totals.active),committedStock:n(totals.committed),restockedStock:n(totals.restocked)};
}

export async function listAuthorizedInventory01077(scope){
  return withClient(async client=>{
    await client.query('BEGIN');
    try{
      await expireStaleInventoryReservations01077(client,{storeId:scope.storeId});
      const q=await client.query(`SELECT o.id "offerId",o.source_product_id "sourceProductId",o.sku,o.stock::float8 "physicalStock",o.availability,o.currency,o.price::float8 price,c.title,s.display_name "sellerName",
        COALESCE((SELECT SUM(i.quantity) FROM marketplace_inventory_reservation_items i JOIN marketplace_inventory_reservations r ON r.id=i.reservation_id WHERE i.seller_offer_id=o.id AND i.status='active' AND r.status='active' AND r.expires_at>now()),0)::float8 "reservedStock",
        COALESCE((SELECT SUM(CASE WHEN l.entry_type='commit' THEN l.quantity WHEN l.entry_type='restock' THEN -l.quantity ELSE 0 END) FROM marketplace_inventory_ledger l WHERE l.seller_offer_id=o.id),0)::float8 "committedStock"
        FROM marketplace_seller_offers o JOIN marketplace_catalog_products c ON c.id=o.catalog_product_id JOIN marketplace_seller_profiles s ON s.id=o.seller_profile_id
        WHERE o.marketplace_id=$1 AND o.store_id=$2 AND o.status<>'archived' ORDER BY c.title,o.id`,[MARKETPLACE_ID,scope.storeId]);
      await client.query('COMMIT');
      return {stage:'01077',items:q.rows.map(x=>({...x,availableStock:x.availability==='preorder'?99:Math.max(0,n(x.physicalStock)-n(x.reservedStock))}))};
    }catch(e){await client.query('ROLLBACK');throw e;}
  });
}

export async function listAuthorizedInventoryReservations01077(scope){
  return withClient(async client=>{
    await client.query('BEGIN');
    try{
      await expireStaleInventoryReservations01077(client,{storeId:scope.storeId});
      const q=await client.query(`SELECT r.id,r.marketplace_order_id "marketplaceOrderId",r.payment_method "paymentMethod",r.status,r.expires_at "expiresAt",r.committed_at "committedAt",r.released_at "releasedAt",r.release_reason "releaseReason",r.created_at "createdAt",
        json_agg(json_build_object('id',i.id,'sellerOrderId',i.seller_order_id,'sellerOfferId',i.seller_offer_id,'sourceProductId',i.source_product_id,'quantity',i.quantity,'status',i.status) ORDER BY i.created_at) items
        FROM marketplace_inventory_reservations r JOIN marketplace_inventory_reservation_items i ON i.reservation_id=r.id
        WHERE i.store_id=$1 GROUP BY r.id ORDER BY r.created_at DESC LIMIT 200`,[scope.storeId]);
      await client.query('COMMIT');
      return {stage:'01077',items:q.rows};
    }catch(e){await client.query('ROLLBACK');throw e;}
  });
}

export async function devTransitionInventoryReservation01077(scope,reservationId,input={}){
  if(!config.devInventorySimulation)throw httpError('Direct inventory transition is disabled',403);
  const to=clean(input.status);
  await withClient(async client=>{
    await client.query('BEGIN');
    try{
      const owns=await client.query(`SELECT 1 FROM marketplace_inventory_reservation_items WHERE reservation_id=$1 AND store_id=$2 LIMIT 1`,[reservationId,scope.storeId]);
      if(!owns.rowCount)throw httpError('Inventory reservation not found for active Store',404);
      if(to==='committed')await commitInventoryReservation01077(client,{reservationId,reason:'dev-manual-commit'});
      else if(to==='released')await releaseInventoryReservation01077(client,{reservationId,reason:'dev-manual-release'});
      else throw httpError('Unsupported inventory transition',400);
      await client.query('COMMIT');
    }catch(e){await client.query('ROLLBACK');throw e;}
  });
  return (await listAuthorizedInventoryReservations01077(scope)).items.find(x=>x.id===reservationId)||null;
}

export async function expireAuthorizedInventoryReservations01077(scope){
  return withClient(async client=>{await client.query('BEGIN');try{const expired=await expireStaleInventoryReservations01077(client,{storeId:scope.storeId});await client.query('COMMIT');return {stage:'01077',expired,storeId:scope.storeId};}catch(e){await client.query('ROLLBACK');throw e;}});
}
