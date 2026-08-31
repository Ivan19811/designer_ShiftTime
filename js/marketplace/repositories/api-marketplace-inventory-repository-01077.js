// 01077 · Authenticated inventory HTTP adapter.
import {getMarketplaceBackendConfig01071} from '../data/marketplace-backend-config-01071.js?v=01071';
import {getMarketplaceRepositoryContext01070} from '../data/marketplace-tenant-runtime-01070.js?v=01070';
import {bindMarketplaceFetch01082} from './fetch-binding-01082.js?v=01082';
export class ApiMarketplaceInventoryRepository01077{
  constructor({baseUrl='',fetchImpl=globalThis.fetch,requestTimeoutMs=12000}={}){this.type='api-marketplace-inventory';this.name='ApiMarketplaceInventoryRepository01077';this.contractVersion=1;this.baseUrl=String(baseUrl||'').replace(/\/+$/,'');this.fetchImpl=bindMarketplaceFetch01082(fetchImpl);this.requestTimeoutMs=requestTimeoutMs;}
  async _request(path,{method='GET',body}={}){const c=getMarketplaceBackendConfig01071(),ctx=getMarketplaceRepositoryContext01070(),headers={accept:'application/json'};if(c.devToken)headers.authorization=`Bearer ${c.devToken}`;if(ctx.storeId)headers['x-st-store-id']=ctx.storeId;if(ctx.workspaceId)headers['x-st-workspace-id']=ctx.workspaceId;if(body!==undefined)headers['content-type']='application/json';const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),this.requestTimeoutMs);try{const res=await this.fetchImpl(`${this.baseUrl}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:ctrl.signal});const txt=await res.text();let data={};if(txt)try{data=JSON.parse(txt);}catch{data={error:txt};}if(!res.ok)throw new Error(data.error||`Marketplace Inventory API ${res.status}`);return data;}finally{clearTimeout(t);}}
  async listSellerInventory(){const x=await this._request('/network/inventory');return Array.isArray(x?.items)?x.items:[];}
  async listReservations(){const x=await this._request('/network/inventory/reservations');return Array.isArray(x?.items)?x.items:[];}
  async expireReservations(){return this._request('/network/inventory/expire',{method:'POST',body:{}});}
  async commitReservation(id){return this._request(`/network/inventory/reservations/${encodeURIComponent(id)}`,{method:'PATCH',body:{status:'committed'}});}
  async releaseReservation(id){return this._request(`/network/inventory/reservations/${encodeURIComponent(id)}`,{method:'PATCH',body:{status:'released'}});}
}
