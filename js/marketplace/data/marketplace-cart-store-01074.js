// 01074 · Client authority for buyer cart state.
import {assertMarketplaceCartRepository01074} from '../repositories/marketplace-cart-repository-contract-01074.js?v=01074';
function clone(v){try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}}
export class MarketplaceCartStore01074{
  constructor({repository}={}){this.repository=assertMarketplaceCartRepository01074(repository);this.cart={groups:[],items:[],lineItems:0,quantity:0,sellerGroups:0,subtotal:0,currency:'UAH'};this.loading=false;this.error='';this.listeners=new Set();this._write=Promise.resolve();}
  getState(){return clone({cart:this.cart,loading:this.loading,error:this.error,repository:this.getRepositoryInfo()});}
  getRepositoryInfo(){return {type:this.repository.type||'custom',name:this.repository.name||'MarketplaceCartRepository',baseUrl:this.repository.baseUrl||''};}
  subscribe(fn){if(typeof fn!=='function')return()=>{};this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  _emit(reason){const detail={reason,...this.getState()};for(const fn of this.listeners)try{fn(detail);}catch{};try{window.dispatchEvent(new CustomEvent('st:marketplace-cart-changed',{detail}));}catch{}}
  async _run(fn,reason){this.loading=true;this.error='';this._emit(`${reason}:start`);try{this.cart=await fn();this.loading=false;this._emit(`${reason}:done`);return this.getState();}catch(e){this.loading=false;this.error=e.message||String(e);this._emit(`${reason}:error`);throw e;}}
  init(){return this._run(()=>this.repository.loadCart(),'init');}
  refresh(reason='refresh'){return this._run(()=>this.repository.refreshCart(),reason);}
  setRepository(repo){return this._run(async()=>{this.repository=assertMarketplaceCartRepository01074(repo);return this.repository.loadCart();},'repository-changed');}
  _mutate(fn,reason){const run=this._write.then(()=>this._run(fn,reason));this._write=run.then(()=>undefined,()=>undefined);return run;}
  addOffer(offerId,quantity=1){return this._mutate(()=>this.repository.addOffer(offerId,quantity),'offer-added');}
  setQuantity(itemId,quantity){return this._mutate(()=>this.repository.setQuantity(itemId,quantity),'quantity-changed');}
  removeItem(itemId){return this._mutate(()=>this.repository.removeItem(itemId),'item-removed');}
  clear(){return this._mutate(()=>this.repository.clearCart(),'cart-cleared');}
}
