// 01544 · Per-store preliminary tariff: never authorizes placing an order.
// Resolve DB dependency on execution, permitting isolated pure-contract tests.
const withStoreClient01544=async callback=>{const {withClient}=await import('./db.mjs');return withClient(callback);};
import {novaPoshtaDirectory01542} from './nova-poshta-directory-01542.mjs';
import {normalizeQuoteProfile01544,normalizeQuoteRequest01544,requestNovaPoshtaQuote01544} from './nova-poshta-quote-01544.mjs';
const fail=(code,statusCode=400)=>Object.assign(new Error(code),{statusCode});
const hits=new Map();
export function assertQuoteLimit01544(storeId,visitor,now=Date.now()){
  const minute=Math.floor(now/60000),key=storeId+':'+String(visitor||'anonymous').slice(0,128)+':'+minute,globalKey='global:'+minute;
  for(const k of hits.keys())if(!k.endsWith(':'+minute))hits.delete(k);
  const globalCount=(hits.get(globalKey)||0)+1;
  if(globalCount>180)throw fail('NP_QUOTE_RATE_LIMIT_01544',429);
  hits.set(globalKey,globalCount);
  const count=(hits.get(key)||0)+1;
  if(count>12)throw fail('NP_QUOTE_RATE_LIMIT_01544',429);
  hits.set(key,count);
}

const profileView=row=>row?{configured:true,senderCityRef:row.sender_city_ref,senderCityName:row.sender_city_name,sampleParcelWeightKg:Number(row.sample_parcel_weight_kg),sampleSeats:Number(row.sample_seats),enabled:Boolean(row.enabled),stage:'01544'}:{configured:false,enabled:false,stage:'01544'};
export async function getQuoteProfile01544(storeId,{client=undefined}={}){
  const work=async db=>profileView((await db.query('SELECT sender_city_ref,sender_city_name,sample_parcel_weight_kg,sample_seats,enabled FROM shifttime_shipping_quote_profiles WHERE store_id=$1',[storeId])).rows[0]);
  return client?work(client):withStoreClient01544(work);
}
export async function saveQuoteProfile01544(scope,data,{client=undefined}={}){
  const p=normalizeQuoteProfile01544(data);
  const work=async db=>{
    // Verify the seller's selected sender city really belongs to carrier directory.
    const candidates=(await novaPoshtaDirectory01542('cities',p.senderCityName)).items;
    if(!candidates.some(c=>c.ref.toLowerCase()===p.senderCityRef.toLowerCase()))throw fail('NP_QUOTE_SENDER_NOT_FOUND_01544');
    await db.query(`INSERT INTO shifttime_shipping_quote_profiles(store_id,sender_city_ref,sender_city_name,sample_parcel_weight_kg,sample_seats,enabled,updated_by_user_id,updated_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,now()) ON CONFLICT(store_id) DO UPDATE SET sender_city_ref=EXCLUDED.sender_city_ref,sender_city_name=EXCLUDED.sender_city_name,sample_parcel_weight_kg=EXCLUDED.sample_parcel_weight_kg,sample_seats=EXCLUDED.sample_seats,enabled=EXCLUDED.enabled,updated_by_user_id=EXCLUDED.updated_by_user_id,updated_at=now()`,[scope.storeId,p.senderCityRef,p.senderCityName,p.sampleParcelWeightKg,p.sampleSeats,p.enabled,scope.userId]);
    return profileView({sender_city_ref:p.senderCityRef,sender_city_name:p.senderCityName,sample_parcel_weight_kg:p.sampleParcelWeightKg,sample_seats:p.sampleSeats,enabled:p.enabled});
  };
  return client?work(client):withStoreClient01544(work);
}
export async function previewStoreQuote01544(storeId,input,{clientId='',fetchImpl=globalThis.fetch,trustedParcelWeightKg=null}={}){
  // Inputs are intentionally untrusted. Price is an estimate only, not used in any order API.
  const q=normalizeQuoteRequest01544(input);
  assertQuoteLimit01544(storeId,clientId);
  const profile=await getQuoteProfile01544(storeId);
  if(!profile.configured||!profile.enabled)throw fail('NP_QUOTE_STORE_NOT_CONFIGURED_01544',409);
  const warehouses=(await novaPoshtaDirectory01542('warehouses',q.cityRecipient)).items;
  if(!warehouses.some(w=>w.ref.toLowerCase()===q.warehouseRef.toLowerCase()))throw fail('NP_QUOTE_WAREHOUSE_NOT_IN_CITY_01544',400);
  const usingCart=trustedParcelWeightKg!==null;
  const weight=usingCart?Number(trustedParcelWeightKg):profile.sampleParcelWeightKg;
  if(!Number.isFinite(weight)||weight<=0||weight>1000)throw fail('NP_PARCEL_WEIGHT_INVALID_01545',409);
  const result=await requestNovaPoshtaQuote01544({...profile,sampleParcelWeightKg:weight},q,{fetchImpl});
  return {...result,parcelWeightKg:weight,seats:profile.sampleSeats,quoteBasis:usingCart?'server-cart-product-parcels':'seller-sample-parcel',orderReady:false};
}
