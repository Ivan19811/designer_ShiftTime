// 01078 fixture writer upgraded by 01079: deterministic two-seller order with authoritative shipping totals.
import {LOCAL_MARKETPLACE_ORDERS_KEY_01075} from './local-marketplace-order-repository-01075.js?v=01079';
import {LOCAL_MARKETPLACE_NETWORK_KEY_01072} from './local-marketplace-network-repository-01072.js?v=01072';
import {normalizeMarketplaceNetworkSnapshot01072,createDefaultMarketplaceNetworkSnapshot01072} from '../data/marketplace-network-schema-01072.js?v=01072';
import {createMarketplaceOrder01075,createSellerOrder01075} from '../data/marketplace-order-schema-01075.js?v=01079';
import {createSellerOrderDelivery01078} from '../data/marketplace-shipping-schema-01078.js?v=01078';
import {localManualDevShippingProvider01078} from './local-manual-dev-shipping-provider-01078.js?v=01078';
import {normalizeMarketplaceOrderTotals01079} from '../data/marketplace-order-totals-01079.js?v=01079';
import {getMarketplaceRepositoryContext01070} from '../data/marketplace-tenant-runtime-01070.js?v=01070';
const ORDER_ID='mporder_demo01079_totals';
function load(storage,key,f){try{const raw=storage?.getItem(key);return raw?JSON.parse(raw):f;}catch{return f;}}
function now(){return new Date().toISOString();}
export class LocalMarketplaceShippingFixtureRepository01078{
  constructor({storage=globalThis.localStorage,ordersKey=LOCAL_MARKETPLACE_ORDERS_KEY_01075,networkKey=LOCAL_MARKETPLACE_NETWORK_KEY_01072,contextProvider=()=>getMarketplaceRepositoryContext01070()}={}){this.type='local-shipping-fixture-01079';this.storage=storage;this.ordersKey=ordersKey;this.networkKey=networkKey;this.contextProvider=contextProvider;}
  async ensureDemoOrder(){
    const db=load(this.storage,this.ordersKey,{orders:[]});if(!Array.isArray(db.orders))db.orders=[];
    const existing=db.orders.find(x=>x?.id===ORDER_ID);if(existing)return {created:false,orderId:ORDER_ID,sellerOrders:existing.sellerOrders?.length||0};
    const net=normalizeMarketplaceNetworkSnapshot01072(load(this.storage,this.networkKey,createDefaultMarketplaceNetworkSnapshot01072())),ctx=this.contextProvider?.()||{},primary=net.sellerProfiles.find(x=>x.storeId===ctx.storeId)||net.sellerProfiles[0],partner=net.sellerProfiles.find(x=>x.id!==primary?.id)||primary;
    if(!primary)throw new Error('Спочатку потрібен DEMO Marketplace seller');
    const sellers=[primary,partner].filter(Boolean),buyer={name:'Іван Totals DEMO',phone:'+380671234567',email:'totals-demo@example.test'},t=now(),sellerOrders=[];
    for(let i=0;i<sellers.length;i++){
      const seller=sellers[i],item={id:`orderitem_demo01079_${i+1}`,sellerOfferId:'',listingId:'',catalogProductId:'',sourceProductId:i?'partner_demo01073_prod_cauldron12':'demo01073_prod_pan50',title:i?'Казан чавунний 12 л':'Сковорідка з диска 50 см',brand:'ShiftTime',sku:i?'PARTNER-KAZAN-12':'DEMO-PAN-50',quantity:1,unitPrice:i?3090:2490,oldPrice:0,lineTotal:i?3090:2490,currency:'UAH',media:[],snapshotAt:t},method=i?'ukrposhta':'nova-poshta',quote=await localManualDevShippingProvider01078.quote({shippingMethod:method,currency:'UAH',quantity:1}),sellerOrderId=`sellerorder_demo01079_${i+1}`,sellerOrderNumber=`SO-DEMO-01079-${i+1}`,warehouse=i?'Відділення Укрпошти №12':'Відділення Нової пошти №1';
      const delivery=createSellerOrderDelivery01078({id:`delivery_demo01079_${i+1}`,marketplaceOrderId:ORDER_ID,marketplaceOrderNumber:'MP-DEMO-01079',sellerOrderId,sellerOrderNumber,sellerProfileId:seller.id,storeId:seller.storeId,sellerName:seller.displayName,provider:quote.provider,shippingMethod:method,carrier:quote.carrier,currency:'UAH',recipient:buyer,city:'Львів',warehouse,deliveryStatus:'pending',shippingPrice:quote.shippingPrice,comment:'DEMO checkout totals 01079',metadata:{demoFixture:'01079',checkoutQuote:{...quote,quotedAt:t}}});
      sellerOrders.push(createSellerOrder01075({id:sellerOrderId,orderNumber:sellerOrderNumber,marketplaceOrderId:ORDER_ID,sellerProfileId:seller.id,storeId:seller.storeId,sellerName:seller.displayName,status:'processing',currency:'UAH',items:[item],buyer,delivery,payment:{method:'card',status:'pending'},shippingTotal:quote.shippingPrice,discountTotal:0}));
    }
    const order=normalizeMarketplaceOrderTotals01079(createMarketplaceOrder01075({id:ORDER_ID,orderNumber:'MP-DEMO-01079',status:'processing',currency:'UAH',buyer,delivery:{method:'nova-poshta',city:'Львів',address:'Buyer delivery intent',comment:'DEMO 01079'},payment:{method:'card',status:'pending'},sellerOrders,discountTotal:0}));
    db.orders.unshift(order);this.storage?.setItem(this.ordersKey,JSON.stringify(db));return {created:true,orderId:ORDER_ID,sellerOrders:sellerOrders.length,stores:sellerOrders.map(x=>x.storeId),itemsTotal:order.itemsTotal,shippingTotal:order.shippingTotal,grandTotal:order.grandTotal};
  }
}
