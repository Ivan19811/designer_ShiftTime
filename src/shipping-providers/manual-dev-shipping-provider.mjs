import crypto from 'node:crypto';
import {assertShippingProvider01078} from '../shipping-provider-contract.mjs';
const clean=v=>String(v??'').trim();
const round=v=>Math.round((Number(v)||0)*100)/100;
const METHODS=Object.freeze({
  'nova-poshta':{carrier:'Nova Poshta',label:'Нова пошта',basePrice:85},
  'ukrposhta':{carrier:'Ukrposhta',label:'Укрпошта',basePrice:70},
  courier:{carrier:'Seller Courier',label:'Кур’єр',basePrice:150},
  pickup:{carrier:'Seller Pickup',label:'Самовивіз',basePrice:0},
  custom:{carrier:'Custom Delivery',label:'Інша доставка',basePrice:100}
});
function method(v){return METHODS[clean(v)]?clean(v):'nova-poshta';}
function trackingFor(m){const code={'nova-poshta':'NP','ukrposhta':'UP',courier:'CR',pickup:'PU',custom:'CU'}[m]||'DV';return `DEV${code}${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;}
export class ManualDevShippingProvider01078{
  constructor(){this.id='manual-dev';this.name='Manual DEV Shipping';this.environment='development';}
  getCapabilities(){return {id:this.id,name:this.name,environment:this.environment,methods:Object.entries(METHODS).map(([id,x])=>({id,label:x.label,carrier:x.carrier,quote:true,tracking:id!=='pickup'})),supports:{quote:true,createShipment:true,status:true,cancel:true,webhook:false}};}
  async quote(input={}){const m=method(input.shippingMethod||input.method),qty=Math.max(1,Number(input.quantity)||1),base=METHODS[m].basePrice;return {provider:this.id,shippingMethod:m,carrier:METHODS[m].carrier,currency:clean(input.currency)||'UAH',shippingPrice:round(base+(m==='courier'?Math.max(0,qty-1)*10:0)),estimatedDays:m==='pickup'?0:m==='nova-poshta'?2:m==='ukrposhta'?4:3};}
  async createShipment(input={}){const q=await this.quote(input),pickup=q.shippingMethod==='pickup';return {...q,providerReference:`devship_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`,trackingNumber:pickup?'':trackingFor(q.shippingMethod),deliveryStatus:pickup?'ready':'label-created',estimatedDelivery:new Date(Date.now()+q.estimatedDays*86400000).toISOString()};}
  async getShipmentStatus(input={}){return {provider:this.id,providerReference:clean(input.providerReference),trackingNumber:clean(input.trackingNumber),deliveryStatus:clean(input.deliveryStatus)||'pending'};}
  async cancelShipment(input={}){return {provider:this.id,providerReference:clean(input.providerReference),trackingNumber:clean(input.trackingNumber),deliveryStatus:'cancelled'};}
}
export const manualDevShippingProvider01078=assertShippingProvider01078(new ManualDevShippingProvider01078());
