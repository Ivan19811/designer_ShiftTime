// 01072 · Client state authority for central Marketplace Network management view.
import {assertMarketplaceNetworkRepository01072} from '../repositories/marketplace-network-repository-contract-01072.js?v=01072';
function clone(v){try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}}
export class MarketplaceNetworkStore01072{
  constructor({repository,contextProvider}={}){this.repository=assertMarketplaceNetworkRepository01072(repository);this.contextProvider=contextProvider||(()=>({}));this.view=null;this.ready=false;this.listeners=new Set();this._write=Promise.resolve();}
  context(){return this.contextProvider?.()||{};}
  getView(){return clone(this.view||{});}
  getRepositoryInfo(){return {type:this.repository.type||'custom',name:this.repository.name||this.repository.constructor?.name||'MarketplaceNetworkRepository',baseUrl:this.repository.baseUrl||'',storageKey:this.repository.storageKey||''};}
  subscribe(fn){if(typeof fn!=='function')return()=>{};this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  _emit(reason){const detail={reason,view:this.getView(),repository:this.getRepositoryInfo(),context:this.context()};for(const fn of this.listeners)try{fn(detail);}catch{};try{window.dispatchEvent(new CustomEvent('st:marketplace-network-changed',{detail}));}catch{}}
  async init(){this.view=await this.repository.loadView(this.context());this.ready=true;this._emit('init');return this;}
  async refresh(reason='refresh'){await this._write;this.view=await this.repository.loadView(this.context());this.ready=true;this._emit(reason);return this.getView();}
  async setRepository(repo){await this._write;this.repository=assertMarketplaceNetworkRepository01072(repo);this.view=await this.repository.loadView(this.context());this.ready=true;this._emit('repository-changed');return this.getRepositoryInfo();}
  _mutate(method,args,reason){const run=this._write.then(async()=>{this.view=await this.repository[method](this.context(),...args);this.ready=true;this._emit(reason);return this.getView();});this._write=run.then(()=>undefined,()=>undefined);return run;}
  ensureSeller(input){return this._mutate('ensureSeller',[input||{}],'seller-joined');}
  updateSeller(patch){return this._mutate('updateSeller',[patch||{}],'seller-updated');}
  updatePolicy(patch){return this._mutate('updatePolicy',[patch||{}],'policy-updated');}
  publishProduct(projection){return this._mutate('publishProduct',[projection],'product-published');}
  syncProduct(projection){return this._mutate('syncProduct',[projection],'product-synced');}
  unpublishListing(id){return this._mutate('unpublishListing',[id],'listing-unpublished');}
}
