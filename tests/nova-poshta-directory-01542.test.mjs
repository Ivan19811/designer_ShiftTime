import test from 'node:test';
import assert from 'node:assert/strict';
import {novaPoshtaDirectory01542,validateNovaPoshtaQuery01542,assertNovaPoshtaRateLimit01542} from '../src/nova-poshta-directory-01542.mjs';
const key='test-key-do-not-use';
test('01542 validates city lookup and warehouse ref before calling provider',()=>{
  assert.throws(()=>validateNovaPoshtaQuery01542('cities','Ки'),/NP_CITY_QUERY_INVALID/);
  assert.throws(()=>validateNovaPoshtaQuery01542('warehouses','random'),/NP_CITY_REF_INVALID/);
  assert.equal(validateNovaPoshtaQuery01542('cities','  Львів '),'Львів');
});
test('01542 proxies CRM-compatible NP directory without leaking carrier key',async()=>{
  const calls=[];
  const fetchImpl=async(url,params)=>{
    assert.equal(url,'https://api.novaposhta.ua/v2.0/json/');
    const body=JSON.parse(params.body);calls.push(body);
    assert.equal(body.apiKey,key);
    if(body.calledMethod==='getCities')return {ok:true,json:async()=>({success:true,data:[{Ref:'1',Description:'Львів',AreaDescription:'Львівська'}]})};
    return {ok:true,json:async()=>({success:true,data:[{Ref:'2',Description:'Поштомат №3',ShortAddress:'Центральна, 12',Number:'3'}]})};
  };
  const cities=await novaPoshtaDirectory01542('cities','Львів',{fetchImpl,key,now:101});
  assert.deepEqual(cities.items[0],{ref:'1',name:'Львів',region:'Львівська',district:''});
  const city2=await novaPoshtaDirectory01542('cities','Львів',{fetchImpl,key,now:102});
  assert.equal(city2.source,'cache');
  const warehouse=await novaPoshtaDirectory01542('warehouses','00000000-0000-0000-0000-000000000001',{fetchImpl,key,now:103});
  assert.equal(warehouse.items[0].isPostomat,true);
  assert.equal(calls[1].modelName,'AddressGeneral');
  assert.equal(calls[1].calledMethod,'getWarehouses');
  assert.equal(JSON.stringify([cities,warehouse]).includes(key),false);
});
test('01542 prevents requests when API key missing or provider unavailable',async()=>{
  await assert.rejects(novaPoshtaDirectory01542('cities','Рогатин',{key:''}),/NP_API_NOT_CONFIGURED/);
  await assert.rejects(novaPoshtaDirectory01542('cities','Ужгород',{key,fetchImpl:async()=>({ok:false})}),/NP_DIRECTORY_UPSTREAM_UNAVAILABLE/);
});
test('01542 per-client rate limits without exposing secrets',()=>{
  for(let i=0;i<60;i++)assert.doesNotThrow(()=>assertNovaPoshtaRateLimit01542('test-client-01542',9876543210));
  assert.throws(()=>assertNovaPoshtaRateLimit01542('test-client-01542',9876543210),/NP_DIRECTORY_RATE_LIMIT/);
});
