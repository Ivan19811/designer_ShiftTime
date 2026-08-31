import {assertMarketplaceShippingRepository01078} from '../repositories/marketplace-shipping-repository-contract-01078.js?v=01078';
function clone(v){try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}}
export class MarketplaceShippingStore01078{
  constructor({repository}={}){this.repository=assertMarketplaceShippingRepository01078(repository);this.deliveries=[];this.providers=[];this.loading=false;this.error='';this.listeners=new Set();this._write=Promise.resolve();}
  getRepositoryInfo(){return {type:this.repository.type||'custom',name:this.repository.name||'MarketplaceShippingRepository01078'};}
  getState(){return clone({deliveries:this.deliveries,providers:this.providers,loading:this.loading,error:this.error,repository:this.getRepositoryInfo()});}
  subscribe(fn){if(typeof fn!=='function')return()=>{};this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  _emit(reason){const detail={reason,...this.getState()};for(const fn of this.listeners)try{fn(detail);}catch{};try{window.dispatchEvent(new CustomEvent('st:marketplace-shipping-changed',{detail}));}catch{}}
  async _run(fn,reason){this.loading=true;this.error='';this._emit(`${reason}:start`);try{const x=await fn();this.loading=false;this._emit(`${reason}:done`);return x;}catch(e){this.loading=false;this.error=e.message||String(e);this._emit(`${reason}:error`);throw e;}}
  async init(){return this._run(async()=>{await Promise.all([this.refresh(false),this.refreshProviders(false)]);return this.getState();},'init');}
  setRepository(repo){return this._run(async()=>{this.repository=assertMarketplaceShippingRepository01078(repo);await Promise.all([this.refresh(false),this.refreshProviders(false)]);return this.getState();},'repository-changed');}
  async refresh(emit=true){const x=await this.repository.listDeliveries();this.deliveries=Array.isArray(x)?x:[];if(emit)this._emit('shipping-refreshed');return clone(this.deliveries);}
  async refreshProviders(emit=true){const x=await this.repository.listProviders();this.providers=Array.isArray(x?.providers)?x.providers:[];if(emit)this._emit('shipping-providers-refreshed');return clone(this.providers);}
  update(id,input){const run=this._write.then(()=>this._run(async()=>{await this.repository.updateDelivery(id,input);await this.refresh(false);return clone(this.deliveries);},'shipping-updated'));this._write=run.then(()=>undefined,()=>undefined);return run;}
  simulate(id,action){const run=this._write.then(()=>this._run(async()=>{await this.repository.simulateDelivery(id,action);await this.refresh(false);return clone(this.deliveries);},`shipping-simulate-${action}`));this._write=run.then(()=>undefined,()=>undefined);return run;}
}
