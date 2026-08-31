// 01050 · Commerce Card data binding adapter.
// Category cards store stable binding keys now; a table/XML loader can feed this
// single adapter later without changing any template or Inspector widget.

let DATA_01050 = Object.create(null);

function readPath(obj,key){
  const raw=String(key||'').trim();
  if(!raw) return undefined;
  if(obj && Object.prototype.hasOwnProperty.call(obj,raw)) return obj[raw];
  const parts=raw.split('.').filter(Boolean);
  let cur=obj;
  for(const part of parts){
    if(cur==null || (typeof cur!=='object' && !Array.isArray(cur)) || !(part in cur)) return undefined;
    cur=cur[part];
  }
  return cur;
}

export function setCommerceBindingData01050(data){
  DATA_01050 = data && typeof data==='object' ? data : Object.create(null);
  try { window.dispatchEvent(new CustomEvent('st:commerce-binding-data-changed-01050')); } catch {}
  return DATA_01050;
}

export function getCommerceBindingData01050(){ return DATA_01050; }

export function resolveCommerceBindingValue01050(key,{card=null,fallback=''}={}){
  const k=String(key||'').trim();
  if(!k) return fallback;
  try {
    const ext=window.ST_COMMERCE_DATA_BINDING_RESOLVER_01050;
    if(typeof ext==='function'){
      const result=ext(k,{card,componentType:String(card?.dataset?.commerceComponent||'')});
      if(result!==undefined && result!==null) return result;
    }
  } catch {}
  try {
    const external=window.ST_COMMERCE_DATA_BINDINGS_01050;
    const value=readPath(external,k);
    if(value!==undefined && value!==null) return value;
  } catch {}
  const own=readPath(DATA_01050,k);
  return own===undefined || own===null ? fallback : own;
}

export function installCommerceBindingApi01050(){
  if(typeof window==='undefined') return;
  window.ST_COMMERCE_CARD_DATA_01050 = Object.freeze({
    setData:setCommerceBindingData01050,
    getData:getCommerceBindingData01050,
    resolve:(key,options={})=>resolveCommerceBindingValue01050(key,options)
  });
}

try { installCommerceBindingApi01050(); } catch {}
