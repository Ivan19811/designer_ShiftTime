// 01087 · Admin API client. Real Auth 01084 remains the only token authority.
import {getMarketplaceBackendConfig01071} from '../marketplace/data/marketplace-backend-config-01071.js?v=01071';
import {getMarketplaceAuthToken01084,getMarketplaceAuthScope01084} from '../marketplace/data/marketplace-auth-runtime-01084.js?v=01090';

function baseUrl(){return String(getMarketplaceBackendConfig01071().apiBaseUrl||'').replace(/\/$/,'');}
function authHeaders(body){const token=getMarketplaceAuthToken01084(),scope=getMarketplaceAuthScope01084();const h={accept:'application/json'};if(body!==undefined)h['content-type']='application/json';if(token)h.authorization=`Bearer ${token}`;if(scope?.storeId)h['x-st-store-id']=scope.storeId;return h;}
async function req(path,{method='GET',body}={}){const c=getMarketplaceBackendConfig01071(),controller=new AbortController(),t=setTimeout(()=>controller.abort(),c.requestTimeoutMs||12000);try{const res=await fetch(`${baseUrl()}${path}`,{method,headers:authHeaders(body),body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});const text=await res.text();let data={};try{data=text?JSON.parse(text):{};}catch{data={error:text||`HTTP ${res.status}`};}if(!res.ok)throw Object.assign(new Error(data.error||`HTTP ${res.status}`),{statusCode:res.status,data});return data;}finally{clearTimeout(t);}}

export const adminApi01087=Object.freeze({
  overview:()=>req('/admin/overview'),roles:()=>req('/admin/roles'),members:()=>req('/admin/members'),
  updateMember:(id,patch)=>req(`/admin/members/${encodeURIComponent(id)}`,{method:'PATCH',body:patch}),
  invitations:()=>req('/admin/invitations'),createInvitation:(input)=>req('/admin/invitations',{method:'POST',body:input}),revokeInvitation:(id)=>req(`/admin/invitations/${encodeURIComponent(id)}/revoke`,{method:'POST'}),
  databaseOverview:()=>req('/admin/database/overview'),databaseTables:()=>req('/admin/database/tables'),databaseSchema:(table)=>req(`/admin/database/tables/${encodeURIComponent(table)}/schema`),databaseRows:(table,{limit=50,offset=0}={})=>req(`/admin/database/tables/${encodeURIComponent(table)}/rows?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`),databaseMigrations:()=>req('/admin/database/migrations'),
});
