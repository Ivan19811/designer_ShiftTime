// 01084 · Real Auth runtime. Session token is runtime/sessionStorage state, never Marketplace backend preferences/localStorage.
import {getMarketplaceBackendConfig01071} from './marketplace-backend-config-01071.js?v=01071';

const TOKEN_KEY='st_auth_session_token_01084';
const SELECTED_STORE_KEY='st_auth_selected_store_01088';
const listeners=new Set();
let state={status:'anonymous',token:'',user:null,scope:null,expiresAt:null,lastError:''};
let initPromise=null;

function clone(v){try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}}
function tokenFromSession(){try{return String(sessionStorage.getItem(TOKEN_KEY)||'');}catch{return '';}}
function persistToken(token){try{if(token)sessionStorage.setItem(TOKEN_KEY,token);else sessionStorage.removeItem(TOKEN_KEY);}catch{}}
function selectedStoreFromSession(){try{return String(sessionStorage.getItem(SELECTED_STORE_KEY)||'');}catch{return '';} }
function persistSelectedStore(storeId){try{const id=String(storeId||'').trim();if(id)sessionStorage.setItem(SELECTED_STORE_KEY,id);else sessionStorage.removeItem(SELECTED_STORE_KEY);}catch{}}
function baseUrl(){return String(getMarketplaceBackendConfig01071().apiBaseUrl||'').replace(/\/$/,'');}
function emit(reason){const detail={reason,state:getMarketplaceAuthState01084()};listeners.forEach(fn=>{try{fn(detail);}catch{}});try{window.dispatchEvent(new CustomEvent('st:marketplace-auth-changed',{detail}));}catch{}try{window.__ST_ALL_LOG__?.push?.('marketplace-auth:state-01084',{reason,status:state.status,userId:state.user?.id||'',storeId:state.scope?.storeId||''});}catch{}}
function setState(patch,reason){state={...state,...patch};emit(reason);return getMarketplaceAuthState01084();}
async function request(path,{method='GET',body,token=state.token,storeId='',headers:extraHeaders={}}={}){const controller=new AbortController(),timeout=getMarketplaceBackendConfig01071().requestTimeoutMs||12000,t=setTimeout(()=>controller.abort(),timeout);try{const headers={'accept':'application/json',...(extraHeaders||{})};if(body!==undefined)headers['content-type']='application/json';if(token)headers.authorization=`Bearer ${token}`;const requestedStore=String(storeId||'').trim();if(requestedStore)headers['x-st-store-id']=requestedStore;const res=await fetch(`${baseUrl()}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});const text=await res.text();let data={};try{data=text?JSON.parse(text):{};}catch{data={error:text||`HTTP ${res.status}`};}if(!res.ok)throw Object.assign(new Error(data.error||`HTTP ${res.status}`),{statusCode:res.status,data});return data;}finally{clearTimeout(t);}}
function acceptSession(payload,reason){const token=String(payload?.token||state.token||''),user=payload?.user||null,scope=payload?.scope||null,expiresAt=payload?.expiresAt||state.expiresAt||null;if(token)persistToken(token);if(scope?.storeId)persistSelectedStore(scope.storeId);return setState({status:user?'authenticated':'anonymous',token,user,scope,expiresAt,lastError:''},reason);}
function clearSession(reason,lastError=''){persistToken('');persistSelectedStore('');return setState({status:'anonymous',token:'',user:null,scope:null,expiresAt:null,lastError},reason);}

export function getMarketplaceAuthState01084(){return clone(state);}
export function getMarketplaceAuthToken01084(){return String(state.token||'');}
export function getMarketplaceAuthScope01084(){return clone(state.scope);}
export function getMarketplaceAuthRepositoryContext01084(){const s=state.scope;if(!s?.storeId)return null;return Object.freeze({userId:state.user?.id||s.userId||'',tenantId:s.accountId||s.tenantId||'',accountId:s.accountId||s.tenantId||'',workspaceId:s.workspaceId||'',storeId:s.storeId||''});}
export function subscribeMarketplaceAuth01084(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn);}

export async function restoreMarketplaceAuthSession01084(){const token=state.token||tokenFromSession();if(!token)return clearSession('restore:none');setState({status:'restoring',token,lastError:''},'restore:start');const selectedStore=selectedStoreFromSession();try{const payload=await request('/auth/session',{token,storeId:selectedStore});return acceptSession({...payload,token},'restore:success');}catch(e){if(selectedStore&&Number(e?.statusCode)===403){persistSelectedStore('');try{const payload=await request('/auth/session',{token});return acceptSession({...payload,token},'restore:fallback');}catch(fallbackError){return clearSession('restore:failed',fallbackError.message||String(fallbackError));}}return clearSession('restore:failed',e.message||String(e));}}
export async function registerMarketplaceUser01084(input={}){setState({status:'authenticating',lastError:''},'register:start');try{const payload=await request('/auth/register',{method:'POST',body:input,token:''});return acceptSession(payload,'register:success');}catch(e){clearSession('register:failed',e.message||String(e));throw e;}}
export async function loginMarketplaceUser01084(input={}){setState({status:'authenticating',lastError:''},'login:start');try{const payload=await request('/auth/login',{method:'POST',body:input,token:''});return acceptSession(payload,'login:success');}catch(e){clearSession('login:failed',e.message||String(e));throw e;}}
export async function logoutMarketplaceUser01084(){const token=state.token;try{if(token)await request('/auth/logout',{method:'POST',token});}catch{}return clearSession('logout');}

export async function listMarketplaceAuthContexts01088(){
  if(!state.token)return [];
  const payload=await request('/auth/contexts',{token:state.token});
  return Array.isArray(payload?.contexts)?clone(payload.contexts):[];
}
export async function switchMarketplaceAuthContext01088(storeId){
  const id=String(storeId||'').trim();if(!id)throw new Error('Store context is required');if(!state.token)throw new Error('Authentication required');
  try{const payload=await request('/auth/session',{token:state.token,storeId:id});return acceptSession({...payload,token:state.token},'context-switch:success');}
  catch(e){state={...state,lastError:e.message||String(e)};throw e;}
}
export async function initMarketplaceAuthRuntime01084(){if(initPromise)return initPromise;initPromise=(async()=>{state={...state,token:tokenFromSession()};await restoreMarketplaceAuthSession01084();try{window.ST_MARKETPLACE_AUTH_01084=Object.freeze({getState:getMarketplaceAuthState01084,getToken:getMarketplaceAuthToken01084,getScope:getMarketplaceAuthScope01084,register:registerMarketplaceUser01084,login:loginMarketplaceUser01084,logout:logoutMarketplaceUser01084,restore:restoreMarketplaceAuthSession01084,listContexts:listMarketplaceAuthContexts01088,switchContext:switchMarketplaceAuthContext01088,subscribe:subscribeMarketplaceAuth01084});}catch{}return window.ST_MARKETPLACE_AUTH_01084||true;})();return initPromise;}
