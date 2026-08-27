import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {config} from './config.mjs';
import {commitInventoryReservation01077,releaseInventoryReservation01077,expireStaleInventoryReservations01077} from './marketplace-inventory-service.mjs';
import {recalculateOrderTotals01079} from './marketplace-pricing-service.mjs';
const MARKETPLACE_ID='marketplace_shifttime';
const clean=v=>String(v??'').trim();
const n=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const round=v=>Math.round((n(v)+Number.EPSILON)*100)/100;
const id=prefix=>`${prefix}_${crypto.randomUUID().replace(/-/g,'')}`;
const STATUSES=new Set(['pending','authorized','paid','failed','partially-refunded','refunded','cancelled']);
const TRANSITIONS={pending:new Set(['pending','authorized','paid','failed','cancelled']),authorized:new Set(['authorized','paid','failed','cancelled']),paid:new Set(['paid','partially-refunded','refunded']),'partially-refunded':new Set(['partially-refunded','refunded']),failed:new Set(['failed']),refunded:new Set(['refunded']),cancelled:new Set(['cancelled'])};
async function event(client,paymentId,type,payload={}){await client.query(`INSERT INTO marketplace_payment_events(id,payment_id,event_type,payload) VALUES($1,$2,$3,$4)`,[id('paye'),paymentId,type,payload]);}
async function scopedPaymentView(client,paymentId,storeId=''){
  const pq=await client.query(`SELECT p.id,p.marketplace_order_id "marketplaceOrderId",o.order_number "marketplaceOrderNumber",p.provider,p.provider_payment_id "providerPaymentId",p.method,p.status,p.currency,p.amount::float8,p.refunded_amount::float8 "refundedAmount",p.created_at "createdAt",p.updated_at "updatedAt" FROM marketplace_payments p JOIN marketplace_orders o ON o.id=p.marketplace_order_id WHERE p.id=$1`,[paymentId]);
  if(!pq.rowCount)return null;const params=[paymentId];let where='';if(storeId){params.push(storeId);where=' AND a.store_id=$2';}
  const aq=await client.query(`SELECT a.id,a.marketplace_order_id "marketplaceOrderId",a.seller_order_id "sellerOrderId",a.seller_profile_id "sellerProfileId",a.store_id "storeId",a.seller_name "sellerName",a.currency,a.gross::float8,a.commission_rate::float8 "commissionRate",a.commission::float8,a.seller_net::float8 "sellerNet",a.refunded_gross::float8 "refundedGross",a.payout_status "payoutStatus",a.payout_reference "payoutReference",a.paid_out_at "paidOutAt",a.created_at "createdAt",a.updated_at "updatedAt" FROM marketplace_payment_allocations a WHERE a.payment_id=$1${where} ORDER BY a.created_at,a.id`,params);
  const allocations=aq.rows,commissionTotal=round(allocations.reduce((s,x)=>s+n(x.commission),0)),sellerNetTotal=round(allocations.reduce((s,x)=>s+n(x.sellerNet),0));
  return {...pq.rows[0],allocations,commissionTotal,sellerNetTotal};
}
export async function ensureAuthorizedPaymentForOrder(scope,orderId){
  return withClient(async client=>{await client.query('BEGIN');try{
    await expireStaleInventoryReservations01077(client);
    const authorized=await client.query(`SELECT o.id FROM marketplace_orders o WHERE o.id=$1 AND EXISTS(SELECT 1 FROM marketplace_seller_orders so WHERE so.marketplace_order_id=o.id AND so.store_id=$2) FOR UPDATE`,[orderId,scope.storeId]);
    if(!authorized.rowCount)throw Object.assign(new Error('MarketplaceOrder not found for active Store'),{statusCode:404});
    await recalculateOrderTotals01079(client,orderId,{lockOrder:false});
    const oq=await client.query(`SELECT o.id,o.order_number "orderNumber",o.currency,o.total::float8,o.payment FROM marketplace_orders o WHERE o.id=$1`,[orderId]);
    const existing=await client.query(`SELECT id FROM marketplace_payments WHERE marketplace_order_id=$1`,[orderId]);let paymentId=existing.rows[0]?.id;
    if(!paymentId){
      paymentId=id('payment');const order=oq.rows[0];
      await client.query(`INSERT INTO marketplace_payments(id,marketplace_id,marketplace_order_id,provider,method,status,currency,amount) VALUES($1,$2,$3,'manual-dev',$4,'pending',$5,$6)`,[paymentId,MARKETPLACE_ID,orderId,['cod','card','bank-transfer'].includes(order.payment?.method)?order.payment.method:'card',order.currency||'UAH',n(order.total)]);
      const sq=await client.query(`SELECT id,seller_profile_id "sellerProfileId",store_id "storeId",seller_name "sellerName",currency,total::float8 FROM marketplace_seller_orders WHERE marketplace_order_id=$1 ORDER BY created_at,id`,[orderId]);
      const rate=Math.max(0,Math.min(35,n(config.marketplaceCommissionRate,8)));
      for(const so of sq.rows){const gross=round(so.total),commission=round(gross*rate/100),net=round(gross-commission);await client.query(`INSERT INTO marketplace_payment_allocations(id,payment_id,marketplace_order_id,seller_order_id,seller_profile_id,store_id,seller_name,currency,gross,commission_rate,commission,seller_net) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,[id('payalloc'),paymentId,orderId,so.id,so.sellerProfileId,so.storeId,so.sellerName,so.currency||'UAH',gross,rate,commission,net]);}
      await event(client,paymentId,'payment-created',{commissionRate:rate,provider:'manual-dev',totalsStage:'01079',amount:n(order.total)});
    }
    await client.query('COMMIT');return {payment:await scopedPaymentView(client,paymentId,scope.storeId)};
  }catch(e){await client.query('ROLLBACK');throw e;}});
}
export async function listAuthorizedPayments(scope){return withClient(async client=>{const q=await client.query(`SELECT DISTINCT p.id FROM marketplace_payments p JOIN marketplace_payment_allocations a ON a.payment_id=p.id WHERE a.store_id=$1 ORDER BY p.id`,[scope.storeId]),items=[];for(const x of q.rows){const v=await scopedPaymentView(client,x.id,scope.storeId);if(v)items.push(v);}items.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));return {stage:'01079',items};});}
export async function listAuthorizedPayouts(scope){return withClient(async client=>{const q=await client.query(`SELECT a.id,a.payment_id "paymentId",p.status "paymentStatus",o.order_number "marketplaceOrderNumber",a.marketplace_order_id "marketplaceOrderId",a.seller_order_id "sellerOrderId",a.seller_profile_id "sellerProfileId",a.store_id "storeId",a.seller_name "sellerName",a.currency,a.gross::float8,a.commission_rate::float8 "commissionRate",a.commission::float8,a.seller_net::float8 "sellerNet",a.refunded_gross::float8 "refundedGross",a.payout_status "payoutStatus",a.payout_reference "payoutReference",a.paid_out_at "paidOutAt",a.created_at "createdAt",a.updated_at "updatedAt" FROM marketplace_payment_allocations a JOIN marketplace_payments p ON p.id=a.payment_id JOIN marketplace_orders o ON o.id=a.marketplace_order_id WHERE a.store_id=$1 ORDER BY a.created_at DESC`,[scope.storeId]);return {stage:'01079',items:q.rows};});}
export async function transitionAuthorizedPayment(scope,paymentId,input={}){
  if(!config.devPaymentSimulation)throw Object.assign(new Error('Direct payment transitions are disabled; production status must come from payment provider/webhook'),{statusCode:403});
  const to=clean(input.status);if(!STATUSES.has(to))throw Object.assign(new Error('Unsupported payment status'),{statusCode:400});
  return withClient(async client=>{await client.query('BEGIN');try{
    const pq=await client.query(`SELECT p.id,p.status,p.amount::float8,p.refunded_amount::float8 "refundedAmount",p.marketplace_order_id "marketplaceOrderId" FROM marketplace_payments p WHERE p.id=$1 AND EXISTS(SELECT 1 FROM marketplace_payment_allocations a WHERE a.payment_id=p.id AND a.store_id=$2) FOR UPDATE`,[paymentId,scope.storeId]);
    if(!pq.rowCount)throw Object.assign(new Error('Payment not found for active Store'),{statusCode:404});
    const p=pq.rows[0];if(!TRANSITIONS[p.status]?.has(to))throw Object.assign(new Error(`Payment transition ${p.status} → ${to} is not allowed`),{statusCode:409});
    let status=to,refunded=n(p.refundedAmount),ratio=0;
    if(to==='partially-refunded'||to==='refunded'){const add=Math.max(0,n(input.refundAmount));refunded=round(to==='refunded'?n(p.amount):Math.min(n(p.amount),refunded+add));status=refunded>=n(p.amount)?'refunded':'partially-refunded';ratio=n(p.amount)>0?refunded/n(p.amount):0;}
    if(status==='paid'){
      const cancelled=await client.query(`SELECT 1 FROM marketplace_seller_orders WHERE marketplace_order_id=$1 AND status='cancelled' LIMIT 1`,[p.marketplaceOrderId]);
      if(cancelled.rowCount)throw Object.assign(new Error('Cannot commit payment/inventory for an order that already contains a cancelled SellerOrder'),{statusCode:409});
      await commitInventoryReservation01077(client,{orderId:p.marketplaceOrderId,reason:'payment-paid'});
    }else if(status==='failed'||status==='cancelled'){
      await releaseInventoryReservation01077(client,{orderId:p.marketplaceOrderId,reason:`payment-${status}`});
    }
    await client.query(`UPDATE marketplace_payments SET status=$2,refunded_amount=$3,updated_at=now() WHERE id=$1`,[paymentId,status,refunded]);
    if(status==='paid'){
      const eligible=await client.query(`UPDATE marketplace_payment_allocations SET payout_status=CASE WHEN payout_status='paid' THEN 'paid' ELSE 'eligible' END,updated_at=now() WHERE payment_id=$1 RETURNING id,store_id,seller_net,currency,payout_status`,[paymentId]);
      for(const a of eligible.rows)if(a.payout_status==='eligible')await client.query(`INSERT INTO marketplace_payout_ledger(id,payment_allocation_id,store_id,entry_type,amount,currency,metadata) VALUES($1,$2,$3,'eligible',$4,$5,$6)`,[id('payout'),a.id,a.store_id,n(a.seller_net),a.currency,{paymentId}]);
    }
    if(status==='partially-refunded'||status==='refunded')await client.query(`UPDATE marketplace_payment_allocations SET refunded_gross=round(gross*$2::numeric,2),payout_status=CASE WHEN payout_status='paid' THEN 'reversed' WHEN payout_status='eligible' THEN 'held' ELSE payout_status END,updated_at=now() WHERE payment_id=$1`,[paymentId,ratio]);
    await client.query(`UPDATE marketplace_orders SET payment=jsonb_set(COALESCE(payment,'{}'::jsonb),'{status}',to_jsonb($1::text),true),updated_at=now() WHERE id=$2`,[status,p.marketplaceOrderId]);
    await client.query(`UPDATE marketplace_seller_orders SET payment=jsonb_set(COALESCE(payment,'{}'::jsonb),'{status}',to_jsonb($1::text),true),updated_at=now() WHERE marketplace_order_id=$2`,[status,p.marketplaceOrderId]);
    await event(client,paymentId,`payment-${status}`,{refundAmount:n(input.refundAmount),refundedAmount:refunded,inventoryAction:status==='paid'?'commit':(['failed','cancelled'].includes(status)?'release':'none')});
    await client.query('COMMIT');return await scopedPaymentView(client,paymentId,scope.storeId);
  }catch(e){await client.query('ROLLBACK');throw e;}});
}
export async function markAuthorizedPayout(scope,allocationId,input={}){
  if(!config.devPaymentSimulation)throw Object.assign(new Error('Direct payout simulation is disabled'),{statusCode:403});
  return withClient(async client=>{await client.query('BEGIN');try{
    const q=await client.query(`SELECT a.id,a.payment_id "paymentId",a.store_id "storeId",a.currency,a.seller_net::float8 "sellerNet",a.payout_status "payoutStatus",p.status "paymentStatus" FROM marketplace_payment_allocations a JOIN marketplace_payments p ON p.id=a.payment_id WHERE a.id=$1 AND a.store_id=$2 FOR UPDATE`,[allocationId,scope.storeId]);
    if(!q.rowCount)throw Object.assign(new Error('Payout allocation not found for active Store'),{statusCode:404});const a=q.rows[0];
    if(a.paymentStatus!=='paid'||a.payoutStatus!=='eligible')throw Object.assign(new Error('Payout is not eligible'),{statusCode:409});
    const ref=clean(input.reference)||`DEV-${Date.now()}`;await client.query(`UPDATE marketplace_payment_allocations SET payout_status='paid',payout_reference=$2,paid_out_at=now(),updated_at=now() WHERE id=$1`,[allocationId,ref]);
    await client.query(`INSERT INTO marketplace_payout_ledger(id,payment_allocation_id,store_id,entry_type,amount,currency,reference,metadata) VALUES($1,$2,$3,'paid',$4,$5,$6,$7)`,[id('payout'),allocationId,scope.storeId,n(a.sellerNet),a.currency,ref,{paymentId:a.paymentId,devSimulation:true}]);
    await event(client,a.paymentId,'seller-payout-paid',{allocationId,storeId:scope.storeId,reference:ref});await client.query('COMMIT');
    return (await listAuthorizedPayouts(scope)).items.find(x=>x.id===allocationId)||null;
  }catch(e){await client.query('ROLLBACK');throw e;}});
}
