// 01076 · Payment state authority.
import {assertMarketplacePaymentRepository01076} from '../repositories/marketplace-payment-repository-contract-01076.js?v=01076';
const clone=v=>{try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}};
export class MarketplacePaymentStore01076{
  constructor({repository}={}){this.repository=assertMarketplacePaymentRepository01076(repository);this.payments=[];this.sellerAllocations=[];this.lastPayment=null;this.error='';this.loading=false;this.listeners=new Set();this._write=Promise.resolve();}
  getRepositoryInfo(){return {type:this.repository.type||'custom',name:this.repository.name||'MarketplacePaymentRepository'};}
  getState(){return clone({payments:this.payments,sellerAllocations:this.sellerAllocations,lastPayment:this.lastPayment,error:this.error,loading:this.loading,repository:this.getRepositoryInfo()});}
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  _emit(reason){const d={reason,...this.getState()};for(const fn of this.listeners)try{fn(d);}catch{};try{window.dispatchEvent(new CustomEvent('st:marketplace-payments-changed',{detail:d}));}catch{}}
  async _run(fn,reason){this.loading=true;this.error='';this._emit(`${reason}:start`);try{const x=await fn();this.loading=false;this._emit(`${reason}:done`);return x;}catch(e){this.loading=false;this.error=e.message||String(e);this._emit(`${reason}:error`);throw e;}}
  async init(){return this._run(async()=>{this.payments=await this.repository.listBuyerPayments();try{this.sellerAllocations=await this.repository.listSellerAllocations();}catch{this.sellerAllocations=[];}return this.getState();},'init');}
  async setRepository(repo){this.repository=assertMarketplacePaymentRepository01076(repo);return this.init();}
  _serial(fn,reason){const run=this._write.then(()=>this._run(fn,reason));this._write=run.then(()=>undefined,()=>undefined);return run;}
  ensureForOrder(id){return this._serial(async()=>{this.lastPayment=await this.repository.ensurePaymentForOrder(id);this.payments=await this.repository.listBuyerPayments();this.sellerAllocations=await this.repository.listSellerAllocations();return clone(this.lastPayment);},'payment-ensured');}
  transition(id,status,options){return this._serial(async()=>{this.lastPayment=await this.repository.transitionPayment(id,status,options);this.payments=await this.repository.listBuyerPayments();this.sellerAllocations=await this.repository.listSellerAllocations();return clone(this.lastPayment);},'payment-transition');}
  payout(id,options){return this._serial(async()=>{const x=await this.repository.markSellerPayout(id,options);this.payments=await this.repository.listBuyerPayments();this.sellerAllocations=await this.repository.listSellerAllocations();return clone(x);},'seller-payout');}
  async refresh(){return this.init();}
}
