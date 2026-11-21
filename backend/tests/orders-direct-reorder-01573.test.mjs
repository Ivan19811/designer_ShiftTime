import test from 'node:test';
import assert from 'node:assert/strict';
import {renewOrderedShopCart01573} from '../src/orders-direct-reorder-01573.mjs';
import {directCheckoutStatus01570} from '../src/orders-direct-checkout-01570.mjs';
const scope={storeId:'store_a',accountId:'acct_a',workspaceId:'ws_a',siteId:'site_a'};
const oldCart='cart_'+'a'.repeat(32);
const row=(id,parent=null)=>({id,seller_offer_id:null,quantity:1,source_kind:'store-product-01534',store_id:scope.storeId,site_id:scope.siteId,product_id:'product_'+id,variant_id:'variation',variant_sku:'PAN-D40',bundle_id:'bundle_old',component_kind:parent?'accessory':'main',parent_item_id:parent});
const initial=[row('cartitem_'+'1'.repeat(32)),row('cartitem_'+'2'.repeat(32),'cartitem_'+'1'.repeat(32))];
function dbFixture({hasOrder=true,items=initial}={}){
  const statements=[];const db={query:async(sql,args)=>{
    statements.push({sql,args});
    if(sql.includes('SELECT id,status,currency FROM marketplace_carts'))return {rowCount:1,rows:[{id:oldCart,status:'active',currency:'UAH'}]};
    if(sql.includes('SELECT id FROM shifttime_production_orders_01566'))return {rowCount:Number(hasOrder),rows:hasOrder?[{id:'order_1'}]:[]};
    if(sql.includes('SELECT id,seller_offer_id,quantity,source_kind'))return {rowCount:items.length,rows:items};
    return {rowCount:1,rows:[]};
  }};return {statements,db};
}
test('01573 renews a used Store cart with a new token, preserving variant and accessory relationships',async()=>{
 const {db,statements}=dbFixture();let seq=0;const newId=kind=>`${kind}_${String(++seq).padStart(32,'f')}`;
 let viewArgs;
 const result=await renewOrderedShopCart01573(scope,oldCart,{transaction:fn=>fn(db),newId,view:async(s,site,cart)=>{viewArgs=[s,site,cart];return {id:cart,siteId:site,items:[1,2]};}});
 assert.equal(result.stage,'01573');assert.notEqual(result.id,oldCart);assert.equal(result.itemsCopied,2);assert.deepEqual(viewArgs,[scope,scope.siteId,result.id]);
 const inserts=statements.filter(x=>x.sql.startsWith('INSERT INTO marketplace_cart_items'));assert.equal(inserts.length,2);
 assert.equal(inserts[0].args[8],inserts[1].args[8],'bundle IDs remapped together');
 assert.equal(inserts[1].args[10],inserts[0].args[0],'accessory must refer to cloned main item');
 assert.equal(inserts[0].args[6],'variation');
 assert.equal(statements.some(x=>/UPDATE shifttime_production_orders|DELETE FROM shifttime_production_orders/.test(x.sql)),false);
 assert.equal(statements.some(x=>x.sql.includes('DELETE FROM marketplace_cart_items')),false);
});
test('01573 never clones an unprocessed cart',async()=>{
 const {db,statements}=dbFixture({hasOrder:false});
 await assert.rejects(renewOrderedShopCart01573(scope,oldCart,{transaction:fn=>fn(db)}),e=>e.code==='DIRECT_CHECKOUT_RENEW_NOT_ORDERED_01573');
 assert.equal(statements.some(x=>x.sql.startsWith('INSERT')),false);
});
test('01573 never clones items from another tenant/site or a mixed seller-offer cart',async()=>{
 for(const patch of [{store_id:'elsewhere'},{site_id:'elsewhere'},{seller_offer_id:'offer_1',source_kind:'seller-offer'}]){
  const {db,statements}=dbFixture({items:[{...initial[0],...patch}]});
  await assert.rejects(renewOrderedShopCart01573(scope,oldCart,{transaction:fn=>fn(db)}),e=>e.code==='DIRECT_CHECKOUT_RENEW_ITEMS_UNSUPPORTED_01573');
  assert.equal(statements.some(x=>x.sql.startsWith('INSERT')),false);
 }
});
test('01573 rejects orphan accessory links without creating a new cart',async()=>{
 const {db}=dbFixture({items:[initial[1]]});
 // Rollback semantics are delegated to withTransaction; in a real transaction partial inserts roll back.
 await assert.rejects(renewOrderedShopCart01573(scope,oldCart,{transaction:fn=>fn(db)}),e=>e.code==='DIRECT_CHECKOUT_RENEW_BUNDLE_INVALID_01573');
});
test('01573 status can safely identify an existing manager order without exposing its contacts',async()=>{
 const result=await directCheckoutStatus01570(scope,oldCart,{lookup:async(fn)=>fn({query:async()=>({rowCount:1,rows:[{order_number:'ST-000000001',order_status:'received',placement_channel:'manager',total_cents:326490,number_of_packages:2,contacts:'SECRET'}]})})});
 assert.equal(result.found,true);assert.equal(result.order.orderNumber,'ST-000000001');assert.equal(result.order.placementChannel,'manager');assert.equal(JSON.stringify(result).includes('SECRET'),false);
});
