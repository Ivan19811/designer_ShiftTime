// 01073 · Client authority for global public catalog query state/results.
import {assertMarketplacePublicCatalogRepository01073} from '../repositories/marketplace-public-catalog-repository-contract-01073.js?v=01073';
function clone(v){try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}}
export class MarketplaceGlobalCatalogStore01073{
  constructor({repository}={}){this.repository=assertMarketplacePublicCatalogRepository01073(repository);this.query={q:'',category:'',availability:'',sellerId:'',minPrice:'',maxPrice:'',sort:'relevance',page:1,pageSize:12};this.result={items:[],total:0,page:1,pages:1,facets:{categories:[],sellers:[],priceRange:{min:0,max:0}},summary:{documents:0,matched:0,offers:0,sellers:0}};this.loading=false;this.error='';this.listeners=new Set();this._seq=0;}
  getRepositoryInfo(){return {type:this.repository.type||'custom',name:this.repository.name||'MarketplacePublicCatalogRepository',baseUrl:this.repository.baseUrl||''};}
  getState(){return clone({query:this.query,result:this.result,loading:this.loading,error:this.error,repository:this.getRepositoryInfo()});}
  subscribe(fn){if(typeof fn!=='function')return()=>{};this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  _emit(reason){const detail={reason,...this.getState()};for(const fn of this.listeners)try{fn(detail);}catch{};try{window.dispatchEvent(new CustomEvent('st:marketplace-global-catalog-changed',{detail}));}catch{}}
  async setRepository(repo){this.repository=assertMarketplacePublicCatalogRepository01073(repo);return this.search({...this.query,page:1},'repository-changed');}
  async search(patch={},reason='search'){this.query={...this.query,...patch};const seq=++this._seq;this.loading=true;this.error='';this._emit(`${reason}:start`);try{const result=await this.repository.search(this.query);if(seq!==this._seq)return this.getState();this.result=result||this.result;this.loading=false;this._emit(`${reason}:done`);return this.getState();}catch(e){if(seq!==this._seq)return this.getState();this.loading=false;this.error=e.message||String(e);this._emit(`${reason}:error`);throw e;}}
}
