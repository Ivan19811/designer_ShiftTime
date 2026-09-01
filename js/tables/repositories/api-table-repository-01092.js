// 01092 · Authenticated HTTPS adapter. Backend is the only PostgreSQL authority.
import {bindMarketplaceFetch01082} from '../../marketplace/repositories/fetch-binding-01082.js?v=01094';

const clean=v=>String(v??'').trim();
const rid=()=>{try{return `tbl_${crypto.randomUUID()}`;}catch{return `tbl_${Date.now()}_${Math.random().toString(36).slice(2)}`;}};

export class ApiTableRepository01092{
  constructor({baseUrl='',tokenProvider=()=>'',contextProvider=()=>({}),fetchImpl=globalThis.fetch,requestTimeoutMs=12000}={}){this.type='api-tables';this.name='ApiTableRepository01092';this.baseUrl=clean(baseUrl).replace(/\/+$/,'');this.tokenProvider=tokenProvider;this.contextProvider=contextProvider;this.fetchImpl=bindMarketplaceFetch01082(fetchImpl);if(typeof this.fetchImpl!=='function')throw new Error('Tables fetch implementation is required');this.requestTimeoutMs=requestTimeoutMs;this.lastResponseScope=null;}
  _url(path){return `${this.baseUrl}${path.startsWith('/')?'':'/'}${path}`;}
  async _request(path,{method='GET',body,headers={}}={}){if(!this.baseUrl)throw new Error('Tables API URL is not configured');const token=clean(this.tokenProvider?.());if(!token)throw new Error('Увійдіть у Мій акаунт для серверних Tables');const context=this.contextProvider?.()||{};const requestHeaders={'content-type':'application/json','x-st-request-id':rid(),...headers,authorization:`Bearer ${token}`};if(context.storeId)requestHeaders['x-st-store-id']=String(context.storeId);const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),this.requestTimeoutMs);let response;try{response=await this.fetchImpl(this._url(path),{method,headers:requestHeaders,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});}catch(error){if(error?.name==='AbortError')throw new Error(`Tables API timeout after ${this.requestTimeoutMs} ms`);throw error;}finally{clearTimeout(timer);}const text=response.status===204?'':await response.text();let payload=null;if(text){try{payload=JSON.parse(text);}catch{payload={error:text};}}this.lastResponseScope={accountId:response.headers?.get?.('x-st-account-id')||'',workspaceId:response.headers?.get?.('x-st-workspace-id')||'',storeId:response.headers?.get?.('x-st-store-id')||'',requestId:response.headers?.get?.('x-st-request-id')||''};if(!response.ok){const error=new Error(payload?.error||`Tables API ${response.status}`);error.statusCode=response.status;error.payload=payload;throw error;}return payload;}
  async listTables(){const out=await this._request('/tables');return out?.tables||[];}
  async getTable(id){return this._request(`/tables/${encodeURIComponent(id)}`);}
  async createTable(input){return this._request('/tables',{method:'POST',body:input});}
  async updateTable(id,patch){return this._request(`/tables/${encodeURIComponent(id)}`,{method:'PATCH',body:patch});}
  async deleteTable(id){await this._request(`/tables/${encodeURIComponent(id)}`,{method:'DELETE'});return true;}
  async createField(tableId,input){return this._request(`/tables/${encodeURIComponent(tableId)}/fields`,{method:'POST',body:input});}
  async updateField(tableId,fieldId,patch){return this._request(`/tables/${encodeURIComponent(tableId)}/fields/${encodeURIComponent(fieldId)}`,{method:'PATCH',body:patch});}
  async deleteField(tableId,fieldId){await this._request(`/tables/${encodeURIComponent(tableId)}/fields/${encodeURIComponent(fieldId)}`,{method:'DELETE'});return true;}
  async createRecord(tableId,input){return this._request(`/tables/${encodeURIComponent(tableId)}/records`,{method:'POST',body:input});}
  async updateRecord(tableId,recordId,patch){return this._request(`/tables/${encodeURIComponent(tableId)}/records/${encodeURIComponent(recordId)}`,{method:'PATCH',body:patch});}
  async deleteRecord(tableId,recordId){await this._request(`/tables/${encodeURIComponent(tableId)}/records/${encodeURIComponent(recordId)}`,{method:'DELETE'});return true;}
  async updateView(tableId,viewId,patch){return this._request(`/tables/${encodeURIComponent(tableId)}/views/${encodeURIComponent(viewId)}`,{method:'PATCH',body:patch});}
}
