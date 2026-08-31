import { MARKETPLACE_REPOSITORY_RESOURCES_01052 } from './marketplace-repository-contract-01052.js?v=01052';
import { bindMarketplaceFetch01082 } from './fetch-binding-01082.js?v=01082';
// 01052 · HTTP MarketplaceRepository adapter.
// Inactive until a commerce backend URL is configured. Same contract as LocalRepository.
const resourcePath=Object.freeze({products:'products',categories:'categories',attributes:'attributes',attributeValues:'attribute-values',variants:'variants',media:'media',collections:'collections',filters:'filters',recommendations:'recommendations',feeds:'feeds'});

export class ApiMarketplaceRepository01052 {
  constructor({baseUrl='',fetchImpl=globalThis.fetch,headers={}}={}){
    this.type='api';
    this.name='ApiRepository';
    this.contractVersion=1;
    this.baseUrl=String(baseUrl||'').replace(/\/$/,'');
    this.fetchImpl=bindMarketplaceFetch01082(fetchImpl);
    this.headers={ 'content-type':'application/json', ...headers };
  }
  _url(path=''){ if(!this.baseUrl) throw new Error('Marketplace API baseUrl is not configured'); return `${this.baseUrl}${path}`; }
  async _request(path,options={}){
    if(typeof this.fetchImpl!=='function') throw new Error('fetch is unavailable');
    const res=await this.fetchImpl(this._url(path),{...options,headers:{...this.headers,...(options.headers||{})}});
    if(!res.ok) throw new Error(`Marketplace API ${res.status}`);
    return res.status===204?null:res.json();
  }
  async loadSnapshot(){ return this._request('/marketplace/snapshot'); }
  async replaceSnapshot(snapshot){ return this._request('/marketplace/snapshot',{method:'PUT',body:JSON.stringify(snapshot)}); }
  async saveSnapshot(snapshot){ return this.replaceSnapshot(snapshot); }
  async reset(){ return this._request('/marketplace/snapshot',{method:'DELETE'}); }
  async exportSnapshot(){ return this._request('/marketplace/snapshot/export'); }
  async getSeo(){ return this._request('/marketplace/seo'); }
  async updateSeo(patch){ return this._request('/marketplace/seo',{method:'PATCH',body:JSON.stringify(patch||{})}); }
}

for(const resource of MARKETPLACE_REPOSITORY_RESOURCES_01052){
  const {key,singular,getAll,getOne}=resource; const path=resourcePath[key];
  ApiMarketplaceRepository01052.prototype[getAll]=function(){return this._request(`/marketplace/${path}`);};
  ApiMarketplaceRepository01052.prototype[getOne]=function(id){return this._request(`/marketplace/${path}/${encodeURIComponent(id)}`);};
  ApiMarketplaceRepository01052.prototype[`create${singular}`]=function(input){return this._request(`/marketplace/${path}`,{method:'POST',body:JSON.stringify(input||{})});};
  ApiMarketplaceRepository01052.prototype[`update${singular}`]=function(id,patch){return this._request(`/marketplace/${path}/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(patch||{})});};
  ApiMarketplaceRepository01052.prototype[`delete${singular}`]=function(id){return this._request(`/marketplace/${path}/${encodeURIComponent(id)}`,{method:'DELETE'});};
}
