import {assertMarketplaceShippingProvider01078} from './marketplace-shipping-provider-contract-01078.js?v=01078';
import {normalizeShippingMethod01078,defaultCarrierForMethod01078} from '../data/marketplace-shipping-schema-01078.js?v=01078';
const prices={'nova-poshta':85,'ukrposhta':70,courier:150,pickup:0,custom:100};
const labels={'nova-poshta':'Нова пошта','ukrposhta':'Укрпошта',courier:'Кур’єр',pickup:'Самовивіз',custom:'Інша доставка'};
function uid(prefix){try{return `${prefix}_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;}catch{return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;}}
function track(m){if(m==='pickup')return '';const code={'nova-poshta':'NP','ukrposhta':'UP',courier:'CR',custom:'CU'}[m]||'DV';return `DEV${code}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,7).toUpperCase()}`;}
export class LocalManualDevShippingProvider01078{
  constructor(){this.id='manual-dev';this.name='Manual DEV Shipping';}
  getCapabilities(){return {id:this.id,name:this.name,environment:'development',methods:Object.keys(prices).map(id=>({id,label:labels[id],carrier:defaultCarrierForMethod01078(id),quote:true,tracking:id!=='pickup'})),supports:{quote:true,createShipment:true,status:true,cancel:true,webhook:false}};}
  async quote(input={}){const shippingMethod=normalizeShippingMethod01078(input.shippingMethod||input.method),quantity=Math.max(1,Number(input.quantity)||1),base=prices[shippingMethod]||0;return {provider:this.id,shippingMethod,carrier:defaultCarrierForMethod01078(shippingMethod),shippingPrice:Math.round((base+(shippingMethod==='courier'?Math.max(0,quantity-1)*10:0))*100)/100,currency:String(input.currency||'UAH'),estimatedDays:shippingMethod==='pickup'?0:shippingMethod==='nova-poshta'?2:shippingMethod==='ukrposhta'?4:3};}
  async createShipment(input={}){const q=await this.quote(input);return {...q,providerReference:uid('devship'),trackingNumber:track(q.shippingMethod),deliveryStatus:q.shippingMethod==='pickup'?'ready':'label-created',estimatedDelivery:new Date(Date.now()+q.estimatedDays*86400000).toISOString()};}
  async getShipmentStatus(input={}){return {provider:this.id,providerReference:String(input.providerReference||''),trackingNumber:String(input.trackingNumber||''),deliveryStatus:String(input.deliveryStatus||'pending')};}
  async cancelShipment(input={}){return {provider:this.id,providerReference:String(input.providerReference||''),trackingNumber:String(input.trackingNumber||''),deliveryStatus:'cancelled'};}
}
export const localManualDevShippingProvider01078=assertMarketplaceShippingProvider01078(new LocalManualDevShippingProvider01078());
