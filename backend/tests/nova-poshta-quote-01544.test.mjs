import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeQuoteProfile01544,normalizeQuoteRequest01544,requestNovaPoshtaQuote01544} from '../src/nova-poshta-quote-01544.mjs';
import {getQuoteProfile01544,assertQuoteLimit01544} from '../src/shipping-quote-service-01544.mjs';
const sender='12345678-1234-1234-1234-123456789abc',recipient='22345678-1234-1234-1234-123456789abc',warehouse='32345678-1234-1234-1234-123456789abc';
const profile={senderCityRef:sender,senderCityName:'Місто тест',sampleParcelWeightKg:2.5,sampleSeats:1};
const request={cityRecipient:recipient,warehouseRef:warehouse,declaredValue:3260};
test('01544 validates seller profile and non-authoritative quote request',()=>{
  assert.equal(normalizeQuoteProfile01544(profile).sampleParcelWeightKg,2.5);
  assert.throws(()=>normalizeQuoteProfile01544({...profile,senderCityRef:'untrusted'}),/SENDER_INVALID/);
  assert.throws(()=>normalizeQuoteProfile01544({...profile,sampleParcelWeightKg:0}),/WEIGHT_INVALID/);
  assert.throws(()=>normalizeQuoteProfile01544({...profile,sampleSeats:2.4}),/SEATS_INVALID/);
  assert.deepEqual(normalizeQuoteRequest01544(request),request);
  assert.throws(()=>normalizeQuoteRequest01544({...request,warehouseRef:'bogus'}),/RECIPIENT_INVALID/);
  assert.throws(()=>normalizeQuoteRequest01544({...request,declaredValue:3260.777}),/COST_INVALID/);
});
test('01544 upstream model and results are server-only; quotes cannot place orders',async()=>{
  const mock=async(url,options)=>{
    assert.equal(url,'https://api.novaposhta.ua/v2.0/json/');
    const body=JSON.parse(options.body);
    assert.equal(body.modelName,'InternetDocument');
    assert.equal(body.calledMethod,'getDocumentPrice');
    assert.equal(body.methodProperties.CitySender,sender);
    assert.equal(body.methodProperties.CityRecipient,recipient);
    assert.equal(body.methodProperties.Weight,2.5);
    assert.equal(body.methodProperties.Cost,3260);
    assert.equal(body.methodProperties.ServiceType,'WarehouseWarehouse');
    assert.equal(body.methodProperties.SeatsAmount,1);
    return {ok:true,json:async()=>({success:true,data:[{Cost:123.45}]})};
  };
  const out=await requestNovaPoshtaQuote01544(profile,request,{key:'local-test-only-not-secret',fetchImpl:mock});
  assert.equal(out.price,123.45);assert.equal(out.estimated,true);assert.equal(out.final,false);assert.equal(out.canPlaceOrder,false);
  assert.ok(!JSON.stringify(out).includes('local-test-only-not-secret'));
  await assert.rejects(()=>requestNovaPoshtaQuote01544(profile,request,{key:'',fetchImpl:mock}),/NP_API_NOT_CONFIGURED/);
  await assert.rejects(()=>requestNovaPoshtaQuote01544(profile,request,{key:'test',fetchImpl:async()=>({ok:true,json:async()=>({success:false,data:[]})})}),/NP_QUOTE_PROVIDER_ERROR/);
});
test('01544 per-store profile read uses parameterized exact store ID',async()=>{
  const calls=[];
  const db={query:async(sql,args)=>{calls.push({sql,args});return {rows:[{sender_city_ref:sender,sender_city_name:'Місто тест',sample_parcel_weight_kg:'2.5',sample_seats:1,enabled:true}]};}};
  const one=await getQuoteProfile01544('store-01',{client:db});
  assert.equal(one.configured,true);assert.equal(one.sampleParcelWeightKg,2.5);
  assert.deepEqual(calls[0].args,['store-01']);assert.match(calls[0].sql,/WHERE store_id=\$1/);
  assert.doesNotThrow(()=>assertQuoteLimit01544('store-01','tester',60000));
});
test('01544 public and authenticated endpoints remain separate, no TTN writes',()=>{
  const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  const backend=readFileSync(new URL('../src/shipping-quote-service-01544.mjs',import.meta.url),'utf8');
  assert.match(server,/previewStoreQuote01544\(publishedTrafficIdentity\.storeId/);
  assert.match(server,/previewStoreQuote01544\(scope\.storeId/);
  assert.match(server,/assertAdminRole\(scope\)/);
  assert.match(backend,/NP_QUOTE_WAREHOUSE_NOT_IN_CITY_01544/);
  assert.doesNotMatch(backend,/createOrder\(|saveInternetDocument|InternetDocument\/save/);
});
