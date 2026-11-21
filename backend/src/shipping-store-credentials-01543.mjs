// 01543 · Isolated, encrypted credentials per Store. Not currently used for creating TTNs.
import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {encryptStoreCarrierKey01543,isShippingEncryptionConfigured01543} from './shipping-hub-01543.mjs';
const clean=x=>String(x??'').trim();
const err=(code,statusCode)=>Object.assign(new Error(code),{statusCode});
const storeView=r=>({provider:'nova-poshta',connected:!!r,enabled:r?Boolean(r.enabled):false,fingerprint:r?.key_fingerprint||'',updatedAt:r?.updated_at||null,stage:'01543'});
export async function getStoreShippingConnection01543(scope,{client=undefined}={}){
  const run=async db=>{const q=await db.query("SELECT enabled,key_fingerprint,updated_at FROM shifttime_shipping_connections WHERE store_id=$1 AND provider='nova-poshta'",[scope.storeId]);return {...storeView(q.rows[0]),encryptionConfigured:isShippingEncryptionConfigured01543()};};
  return client?run(client):withClient(run);
}
export async function saveStoreShippingConnection01543(scope,data,{client=undefined}={}){
  const apiKey=clean(data?.apiKey),enabled=data?.enabled!==false;
  if(apiKey.length<12||apiKey.length>256)throw err('SHIPPING_API_KEY_INVALID_01543',400);
  const encrypted=encryptStoreCarrierKey01543(apiKey,scope.storeId);
  const fingerprint=crypto.createHash('sha256').update(apiKey).digest('hex').slice(0,12);
  const run=async db=>{
    await db.query(`INSERT INTO shifttime_shipping_connections(store_id,provider,encrypted_api_key,key_fingerprint,enabled,updated_by_user_id,updated_at)
      VALUES($1,'nova-poshta',$2,$3,$4,$5,now())
      ON CONFLICT(store_id,provider) DO UPDATE SET encrypted_api_key=EXCLUDED.encrypted_api_key,key_fingerprint=EXCLUDED.key_fingerprint,enabled=EXCLUDED.enabled,updated_by_user_id=EXCLUDED.updated_by_user_id,updated_at=now()`,[scope.storeId,encrypted,fingerprint,enabled,scope.userId]);
    return getStoreShippingConnection01543(scope,{client:db});
  };
  return client?run(client):withClient(run);
}
export async function deleteStoreShippingConnection01543(scope,{client=undefined}={}){
  const run=async db=>{await db.query("DELETE FROM shifttime_shipping_connections WHERE store_id=$1 AND provider='nova-poshta'",[scope.storeId]);return {provider:'nova-poshta',connected:false,enabled:false,stage:'01543'};};
  return client?run(client):withClient(run);
}
