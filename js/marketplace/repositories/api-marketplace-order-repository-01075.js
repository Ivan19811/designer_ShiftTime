// 01075 · Buyer checkout + authenticated seller-order HTTP adapter.
import {getMarketplaceApiAuth01089} from '../data/marketplace-api-auth-01089.js?v=01089';
import {bindMarketplaceFetch01082} from './fetch-binding-01082.js?v=01082';
export class ApiMarketplaceOrderRepository01075{
  constructor({baseUrl='',fetchImpl=globalThis.fetch,requestTimeoutMs=12000,cartTokenStorage=globalThis.localStorage,cartTokenKey='st_marketplace_api_cart_id_01074'}={}){this.type='api-marketplace-order';this.name='ApiMarketplaceOrderRepository01075';this.contractVersion=1;this.baseUrl=String(baseUrl||'').replace(/\/+$/,'');this.fetchImpl=bindMarketplaceFetch01082(fetchImpl);this.requestTimeoutMs=requestTimeoutMs;this.cartTokenStorage=cartTokenStorage;this.cartTokenKey=cartTokenKey;this.lastBuyerOrder=null;}
  _cartToken(){try{return String(this.cartTokenStorage?.getItem(this.cartTokenKey)||'');}catch{return '';}}
  _setCartToken(v){if(!v)return;try{this.cartTokenStorage?.setItem(this.cartTokenKey,String(v));}catch{}}
  async _request(path,{method='GET',body,auth=false}={}){const requestAuth=getMarketplaceApiAuth01089(),headers={accept:'application/json'};if(body!==undefined)headers['content-type']='application/json';if(auth){if(requestAuth.token)headers.authorization=`Bearer ${requestAuth.token}`;if(requestAuth.storeId)headers['x-st-store-id']=requestAuth.storeId;if(requestAuth.workspaceId)headers['x-st-workspace-id']=requestAuth.workspaceId;}else{const token=this._cartToken();if(token)headers['x-st-cart-id']=token;}const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),this.requestTimeoutMs);try{const res=await this.fetchImpl(`${this.baseUrl}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:ctrl.signal});const txt=await res.text();let data={};if(txt)try{data=JSON.parse(txt);}catch{data={error:txt};}if(!res.ok)throw new Error(data.error||`Marketplace Order API ${res.status}`);this._setCartToken(res.headers?.get?.('x-st-cart-id')||data.nextCartId);return data;}finally{clearTimeout(t);}}
  async createOrder(input){const x=await this._request('/public/marketplace/orders',{method:'POST',body:input});this.lastBuyerOrder=x.order||x;return this.lastBuyerOrder;}
  async listBuyerOrders(){return this.lastBuyerOrder?[this.lastBuyerOrder]:[];}
  async listSellerOrders(){const x=await this._request('/network/orders',{auth:true});return Array.isArray(x?.items)?x.items:[];}
  async updateSellerOrderStatus(id,status){return this._request(`/network/orders/${encodeURIComponent(id)}`,{method:'PATCH',body:{status},auth:true});}
}
