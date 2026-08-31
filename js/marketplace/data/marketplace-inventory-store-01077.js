// 01077 · Inventory state authority.
import {assertMarketplaceInventoryRepository01077} from '../repositories/marketplace-inventory-repository-contract-01077.js?v=01077';
const clone=v=>{try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}};
export class MarketplaceInventoryStore01077{
  constructor({repository}={}){this.repository=assertMarketplaceInventoryRepository01077(repository);this.inventory=[];this.reservations=[];this.error='';this.loading=false;this.listeners=new Set();this._write=Promise.resolve();}
  getRepositoryInfo(){return {type:this.repository.type||'custom',name:this.repository.name||'MarketplaceInventoryRepository'};}
  getState(){return clone({inventory:this.inventory,reservations:this.reservations,error:this.error,loading:this.loading,repository:this.getRepositoryInfo()});}
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  _emit(reason){const d={reason,...this.getState()};for(const fn of this.listeners)try{fn(d);}catch{};try{window.dispatchEvent(new CustomEvent('st:marketplace-inventory-changed',{detail:d}));}catch{}}
  async _run(fn,reason){this.loading=true;this.error='';this._emit(`${reason}:start`);try{const x=await fn();this.loading=false;this._emit(`${reason}:done`);return x;}catch(e){this.loading=false;this.error=e.message||String(e);this._emit(`${reason}:error`);throw e;}}
  async init(){return this._run(async()=>{this.inventory=await this.repository.listSellerInventory();this.reservations=await this.repository.listReservations();return this.getState();},'init');}
  async setRepository(repo){this.repository=assertMarketplaceInventoryRepository01077(repo);return this.init();}
  _serial(fn,reason){const run=this._write.then(()=>this._run(fn,reason));this._write=run.then(()=>undefined,()=>undefined);return run;}
  refresh(){return this.init();}
  expire(){return this._serial(async()=>{const x=await this.repository.expireReservations();this.inventory=await this.repository.listSellerInventory();this.reservations=await this.repository.listReservations();return clone(x);},'inventory-expire');}
  commit(id){return this._serial(async()=>{const x=await this.repository.commitReservation(id);this.inventory=await this.repository.listSellerInventory();this.reservations=await this.repository.listReservations();return clone(x);},'inventory-commit');}
  release(id){return this._serial(async()=>{const x=await this.repository.releaseReservation(id);this.inventory=await this.repository.listSellerInventory();this.reservations=await this.repository.listReservations();return clone(x);},'inventory-release');}
}
