// 01072 · Authenticated HTTP adapter for Marketplace Network management.
import {bindMarketplaceFetch01082} from './fetch-binding-01082.js?v=01082';
function rid(){try{return `web_${crypto.randomUUID()}`;}catch{return `web_${Date.now()}_${Math.random().toString(36).slice(2)}`;}}
export class ApiMarketplaceNetworkRepository01072{
  constructor({baseUrl='',fetchImpl=globalThis.fetch,tokenProvider=()=>'',contextProvider=()=>({}),requestTimeoutMs=12000}={}){this.type='api-network';this.name='ApiMarketplaceNetworkRepository01072';this.contractVersion=1;this.baseUrl=String(baseUrl||'').replace(/\/+$/,'');this.fetchImpl=bindMarketplaceFetch01082(fetchImpl);this.tokenProvider=tokenProvider;this.contextProvider=contextProvider;this.requestTimeoutMs=requestTimeoutMs;}
  _url(path){return `${this.baseUrl}/${String(path||'').replace(/^\/+/, '')}`;}
  async _request(path,{method='GET',body}={}){if(typeof this.fetchImpl!=='function')throw new Error('fetch is unavailable');const ctx=this.contextProvider?.()||{},token=String(this.tokenProvider?.()||'').trim();const headers={'content-type':'application/json','x-st-request-id':rid()};if(ctx.storeId)headers['x-st-store-id']=String(ctx.storeId);if(ctx.workspaceId)headers['x-st-workspace-id']=String(ctx.workspaceId);if(token)headers.authorization=`Bearer ${token}`;const controller=new AbortController(),t=setTimeout(()=>controller.abort(),this.requestTimeoutMs);try{const res=await this.fetchImpl(this._url(path),{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});let data=null;if(res.status!==204){const text=await res.text();if(text){try{data=JSON.parse(text);}catch{data={error:text};}}}if(!res.ok)throw Object.assign(new Error(data?.error||`Marketplace Network API ${res.status}`),{status:res.status,payload:data});return data;}catch(e){if(e?.name==='AbortError')throw new Error(`Marketplace Network API timeout after ${this.requestTimeoutMs} ms`);throw e;}finally{clearTimeout(t);}}
  loadView(){return this._request('/network/context');}
  ensureSeller(ctx,input){return this._request('/network/join',{method:'POST',body:input||{}});}
  updateSeller(ctx,patch){return this._request('/network/seller',{method:'PATCH',body:patch||{}});}
  updatePolicy(ctx,patch){return this._request('/network/policy',{method:'PATCH',body:patch||{}});}
  publishProduct(ctx,projection){return this._request(`/network/products/${encodeURIComponent(projection?.publicProduct?.sourceProductId||'')}/publish`,{method:'POST',body:{projection}});}
  syncProduct(ctx,projection){return this._request(`/network/products/${encodeURIComponent(projection?.publicProduct?.sourceProductId||'')}/sync`,{method:'POST',body:{projection}});}
  unpublishListing(ctx,listingId){return this._request(`/network/listings/${encodeURIComponent(listingId)}/unpublish`,{method:'POST',body:{}});}
}
