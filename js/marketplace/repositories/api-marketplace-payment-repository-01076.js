// 01076 · Payment HTTP adapter. Real provider integration remains behind backend.
import {getMarketplaceApiAuth01089} from '../data/marketplace-api-auth-01089.js?v=01089';
import {bindMarketplaceFetch01082} from './fetch-binding-01082.js?v=01082';
export class ApiMarketplacePaymentRepository01076{
  constructor({baseUrl='',fetchImpl=globalThis.fetch,requestTimeoutMs=12000}={}){this.type='api-marketplace-payment';this.name='ApiMarketplacePaymentRepository01076';this.contractVersion=1;this.baseUrl=String(baseUrl||'').replace(/\/+$/,'');this.fetchImpl=bindMarketplaceFetch01082(fetchImpl);this.requestTimeoutMs=requestTimeoutMs;this.lastBuyerPayment=null;}
  async _request(path,{method='GET',body,auth=true}={}){const requestAuth=getMarketplaceApiAuth01089(),headers={accept:'application/json'};if(body!==undefined)headers['content-type']='application/json';if(auth&&requestAuth.token)headers.authorization=`Bearer ${requestAuth.token}`;if(auth&&requestAuth.storeId)headers['x-st-store-id']=requestAuth.storeId;if(auth&&requestAuth.workspaceId)headers['x-st-workspace-id']=requestAuth.workspaceId;const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),this.requestTimeoutMs);try{const r=await this.fetchImpl(`${this.baseUrl}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:ctrl.signal});const txt=await r.text();let x={};if(txt)try{x=JSON.parse(txt);}catch{x={error:txt};}if(!r.ok)throw new Error(x.error||`Payment API ${r.status}`);return x;}finally{clearTimeout(t);}}
  async ensurePaymentForOrder(orderId){const x=await this._request(`/network/payments/order/${encodeURIComponent(orderId)}`,{method:'POST'});this.lastBuyerPayment=x.payment||x;return this.lastBuyerPayment;}
  async listBuyerPayments(){const x=await this._request('/network/payments');return Array.isArray(x?.items)?x.items:[];}
  async listSellerAllocations(){const x=await this._request('/network/payouts');return Array.isArray(x?.items)?x.items:[];}
  async transitionPayment(id,status,{refundAmount=0}={}){return this._request(`/network/payments/${encodeURIComponent(id)}`,{method:'PATCH',body:{status,refundAmount}});}
  async markSellerPayout(id,{reference=''}={}){return this._request(`/network/payouts/${encodeURIComponent(id)}`,{method:'PATCH',body:{status:'paid',reference}});}
}
