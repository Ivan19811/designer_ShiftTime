import test from 'node:test';
import assert from 'node:assert/strict';

function storage(seed={}){const m=new Map(Object.entries(seed));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),dump:()=>Object.fromEntries(m)};}

test('01088 Auth runtime lists and switches server-authorized Store context and persists selection',async()=>{
  globalThis.localStorage=storage({'st_marketplace_backend_config_v1_01071':JSON.stringify({apiBaseUrl:'https://api.test/api/v1',requestTimeoutMs:5000})});
  globalThis.sessionStorage=storage({'st_auth_session_token_01084':'token_1'});
  globalThis.window={dispatchEvent(){},__ST_ALL_LOG__:{push(){}}};
  globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail;}};
  const calls=[];
  globalThis.fetch=async(url,options={})=>{
    calls.push({url,options});
    const path=new URL(url).pathname;
    if(path.endsWith('/auth/contexts'))return new Response(JSON.stringify({contexts:[{storeId:'store_1',role:'owner'},{storeId:'store_2',role:'manager'}]}),{status:200,headers:{'content-type':'application/json'}});
    if(path.endsWith('/auth/session')){
      const store=options.headers?.['x-st-store-id']||'store_1';
      return new Response(JSON.stringify({user:{id:'usr_1',email:'u@test.dev',name:'U'},scope:{accountId:store==='store_2'?'acct_2':'acct_1',workspaceId:store==='store_2'?'ws_2':'ws_1',storeId:store,storeName:store,role:store==='store_2'?'manager':'owner'}}),{status:200,headers:{'content-type':'application/json'}});
    }
    return new Response('{}',{status:404,headers:{'content-type':'application/json'}});
  };
  const mod=await import(`../js/marketplace/data/marketplace-auth-runtime-01084.js?ctx=${Date.now()}`);
  assert.equal(typeof mod.listMarketplaceAuthContexts01088,'function');
  assert.equal(typeof mod.switchMarketplaceAuthContext01088,'function');
  await mod.initMarketplaceAuthRuntime01084();
  const contexts=await mod.listMarketplaceAuthContexts01088();
  assert.equal(contexts.length,2);
  await mod.switchMarketplaceAuthContext01088('store_2');
  assert.equal(mod.getMarketplaceAuthScope01084().storeId,'store_2');
  assert.equal(sessionStorage.getItem('st_auth_selected_store_01088'),'store_2');
  assert.equal(calls.some(c=>c.options.headers?.['x-st-store-id']==='store_2'),true);
});
