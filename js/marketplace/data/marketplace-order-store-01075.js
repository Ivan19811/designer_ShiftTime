// 01075 · Marketplace order state authority.
import {assertMarketplaceOrderRepository01075} from '../repositories/marketplace-order-repository-contract-01075.js?v=01075';
function clone(v){try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}}
export class MarketplaceOrderStore01075{
  constructor({repository}={}){this.repository=assertMarketplaceOrderRepository01075(repository);this.buyerOrders=[];this.sellerOrders=[];this.lastOrder=null;this.loading=false;this.error='';this.listeners=new Set();this._write=Promise.resolve();}
  getRepositoryInfo(){return {type:this.repository.type||'custom',name:this.repository.name||'MarketplaceOrderRepository'};}
  getState(){return clone({buyerOrders:this.buyerOrders,sellerOrders:this.sellerOrders,lastOrder:this.lastOrder,loading:this.loading,error:this.error,repository:this.getRepositoryInfo()});}
  subscribe(fn){if(typeof fn!=='function')return()=>{};this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  _emit(reason){const detail={reason,...this.getState()};for(const fn of this.listeners)try{fn(detail);}catch{};try{window.dispatchEvent(new CustomEvent('st:marketplace-orders-changed',{detail}));}catch{}}
  async _run(fn,reason){this.loading=true;this.error='';this._emit(`${reason}:start`);try{const x=await fn();this.loading=false;this._emit(`${reason}:done`);return x;}catch(e){this.loading=false;this.error=e.message||String(e);this._emit(`${reason}:error`);throw e;}}
  async init(){return this._run(async()=>{this.buyerOrders=await this.repository.listBuyerOrders();try{this.sellerOrders=await this.repository.listSellerOrders();}catch{this.sellerOrders=[];}return this.getState();},'init');}
  setRepository(repo){return this._run(async()=>{this.repository=assertMarketplaceOrderRepository01075(repo);return this.init();},'repository-changed');}
  createOrder(input){const run=this._write.then(()=>this._run(async()=>{this.lastOrder=await this.repository.createOrder(input);this.buyerOrders=await this.repository.listBuyerOrders();try{this.sellerOrders=await this.repository.listSellerOrders();}catch{}return clone(this.lastOrder);},'order-created'));this._write=run.then(()=>undefined,()=>undefined);return run;}
  refreshSellerOrders(){return this._run(async()=>{this.sellerOrders=await this.repository.listSellerOrders();return clone(this.sellerOrders);},'seller-orders-refreshed');}
  updateSellerOrderStatus(id,status){const run=this._write.then(()=>this._run(async()=>{await this.repository.updateSellerOrderStatus(id,status);this.sellerOrders=await this.repository.listSellerOrders();return clone(this.sellerOrders);},'seller-order-status'));this._write=run.then(()=>undefined,()=>undefined);return run;}
}
