// 01542 · Server-only Nova Poshta directory adapter. NEVER ship NP_API_KEY to a browser.
// An adapted, security-hardened version of the CRM city/warehouse picker contract.
const API_URL='https://api.novaposhta.ua/v2.0/json/';
const cache=new Map();
const TTL_MS=5*60*1000;
const clean=v=>String(v??'').trim();
const fail=(code,statusCode=400)=>Object.assign(new Error(code),{statusCode});
export function novaPoshtaDirectoryConfigured01542(){return !!clean(process.env.NP_API_KEY);}
export function validateNovaPoshtaQuery01542(kind,value){
  const x=clean(value);
  if(kind==='cities'){
    if(x.length<3||x.length>100||/[<>\u0000-\u001f]/u.test(x))throw fail('NP_CITY_QUERY_INVALID_01542');
  }else if(kind==='warehouses'){
    if(!/^[0-9a-fA-F-]{36}$/u.test(x))throw fail('NP_CITY_REF_INVALID_01542');
  }else throw fail('NP_DIRECTORY_METHOD_INVALID_01542');
  return x;
}
function normalizeCity(x){return {ref:clean(x?.Ref),name:clean(x?.Description),region:clean(x?.AreaDescription),district:clean(x?.SettlementTypeDescription)};}
function normalizeWarehouse(x){return {ref:clean(x?.Ref),name:clean(x?.Description),number:clean(x?.Number),address:clean(x?.ShortAddress),typeRef:clean(x?.TypeOfWarehouse),isPostomat:/поштомат|parcel locker|postomat/iu.test(clean(x?.Description))};}
async function request(modelName,calledMethod,methodProperties,{fetchImpl=globalThis.fetch,key=process.env.NP_API_KEY}={}){
  if(!clean(key))throw fail('NP_API_NOT_CONFIGURED_01542',503);
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),11000);
  try{
    const response=await fetchImpl(API_URL,{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify({apiKey:clean(key),modelName,calledMethod,methodProperties}),signal:controller.signal});
    if(!response.ok)throw fail('NP_DIRECTORY_UPSTREAM_UNAVAILABLE_01542',502);
    const result=await response.json();
    if(result?.success!==true||!Array.isArray(result?.data))throw fail('NP_DIRECTORY_PROVIDER_ERROR_01542',502);
    return result.data;
  }catch(error){
    if(error?.statusCode)throw error;
    throw fail('NP_DIRECTORY_UPSTREAM_UNAVAILABLE_01542',502);
  }finally{clearTimeout(timer);}
}
export async function novaPoshtaDirectory01542(kind,query,{fetchImpl=globalThis.fetch,key=process.env.NP_API_KEY,now=Date.now()}={}){
  const value=validateNovaPoshtaQuery01542(kind,query);
  if(!clean(key))throw fail('NP_API_NOT_CONFIGURED_01542',503);
  const ck=kind+':'+value.toLowerCase();
  const existing=cache.get(ck);
  if(existing&&existing.expires>now)return {items:existing.items,source:'cache'};
  let items;
  if(kind==='cities'){
    const data=await request('Address','getCities',{FindByString:value,Page:'1',Limit:'100'},{fetchImpl,key});
    items=data.map(normalizeCity).filter(x=>x.ref&&x.name).slice(0,100);
  }else{
    const data=await request('AddressGeneral','getWarehouses',{CityRef:value,Page:'1',Limit:'5000'},{fetchImpl,key});
    items=data.map(normalizeWarehouse).filter(x=>x.ref&&x.name).slice(0,5000);
  }
  if(cache.size>200)cache.clear();
  cache.set(ck,{items,expires:now+TTL_MS});
  return {items,source:'nova-poshta'};
}
// A minimal, process-local public request throttle. Reverse proxy can add stricter edge limits.
const hits=new Map();
export function assertNovaPoshtaRateLimit01542(clientId,now=Date.now()){
  const id=clean(clientId).slice(0,150)||'unknown';const minute=Math.floor(now/60000);const key=id+':'+minute;
  const next=(hits.get(key)||0)+1;
  if(hits.size>10000){for(const k of hits.keys())if(!k.endsWith(':'+minute))hits.delete(k);}
  hits.set(key,next);if(next>60)throw fail('NP_DIRECTORY_RATE_LIMIT_01542',429);
}
