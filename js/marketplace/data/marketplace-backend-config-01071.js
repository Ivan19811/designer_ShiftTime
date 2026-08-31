// 01071 · Development connection preferences only. Production auth tokens must come from session/auth runtime, not localStorage.
export const MARKETPLACE_BACKEND_CONFIG_KEY_01071='st_marketplace_backend_config_v1_01071';
const DEFAULT=Object.freeze({mode:'local',apiBaseUrl:'http://127.0.0.1:8787/api/v1',devToken:'',requestTimeoutMs:12000});
function clean(input={}){const x=input&&typeof input==='object'?input:{};return {...DEFAULT,mode:x.mode==='api'?'api':'local',apiBaseUrl:String(x.apiBaseUrl||DEFAULT.apiBaseUrl).replace(/\/$/,''),devToken:String(x.devToken||''),requestTimeoutMs:Math.min(60000,Math.max(1000,Number(x.requestTimeoutMs)||DEFAULT.requestTimeoutMs))};}
export function getMarketplaceBackendConfig01071(){try{return clean(JSON.parse(localStorage.getItem(MARKETPLACE_BACKEND_CONFIG_KEY_01071)||'{}'));}catch{return clean({});}}
export function setMarketplaceBackendConfig01071(patch={}){const next=clean({...getMarketplaceBackendConfig01071(),...(patch||{})});try{localStorage.setItem(MARKETPLACE_BACKEND_CONFIG_KEY_01071,JSON.stringify(next));}catch{}try{window.dispatchEvent(new CustomEvent('st:marketplace-backend-config-changed',{detail:{config:{...next,devToken:next.devToken?'••••••••':''}}}));}catch{}return next;}
export function clearMarketplaceBackendToken01071(){return setMarketplaceBackendConfig01071({devToken:''});}
