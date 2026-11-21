// 01549 · Authenticated PostgreSQL placement persistence only; no order, tariff or TTN.
import {previewCartPacking01548} from './shipping-packing-preview-01548.mjs';
const withClient=async fn=>(await import('./db.mjs')).withClient(fn);
const str=v=>String(v??'').trim();
const fail=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const sqlTable='shifttime_shipping_cart_packing_01549';
export async function cartPackingLayout01549(scope,input,{preview=previewCartPacking01548,dbClient=null}={}){
  if(!str(scope?.storeId))throw fail('NP_PACKING_SCOPE_REQUIRED_01548',403);
  const action=str(input?.action||'load');
  if(!['load','save','reset'].includes(action))throw fail('NP_PACKING_ACTION_INVALID_01549',400);
  if(action==='save'&&(!Array.isArray(input?.moves)||input.moves.length>250))throw fail('NP_PACKING_MOVE_INVALID_01548',400);
  const exp=Number(input?.expectedRevision);
  if(action!=='load'&&(!Number.isSafeInteger(exp)||exp<0||exp>1000000000))throw fail('NP_PACKING_REVISION_INVALID_01549',400);
  // Before touching storage, authenticate cart ownership/scope and recompute the
  // authoritative current catalog/quantity/price fingerprint from PostgreSQL.
  const base=await preview(scope,{siteId:input?.siteId,cartId:input?.cartId,moves:[]});
  const {siteId,cartId,cartFingerprint}=base;
  if(!/^[-\w:]{1,160}$/.test(str(siteId))||!/^cart_[a-z0-9]{24,48}$/i.test(str(cartId))||!(/^[a-f0-9]{64}$/.test(str(cartFingerprint))))throw fail('NP_PACKING_CART_INVALID_01548',400);
  const exec=async db=>{
    const params=[str(scope.storeId),siteId,cartId];
    const query=()=>db.query(`SELECT cart_fingerprint "cartFingerprint",moves,revision FROM ${sqlTable} WHERE store_id=$1 AND site_id=$2 AND cart_id=$3`,params);
    const existing=(await query()).rows[0];
    if(action==='load'){
      const stale=Boolean(existing&&existing.cartFingerprint!==cartFingerprint);
      if(stale||!existing)return {...base,moves:[],savedRevision:existing?.revision||0,saved:false,layoutStale:stale,layoutStage:'01549'};
      try{
        const valid=await preview(scope,{siteId,cartId,moves:existing.moves});
        if(valid.cartFingerprint!==cartFingerprint)throw fail('NP_PACKING_CATALOG_CHANGED_01548');
        return {...valid,moves:existing.moves,savedRevision:existing.revision,saved:true,layoutStale:false,layoutStage:'01549'};
      }catch{
        return {...base,moves:[],savedRevision:existing.revision,saved:false,layoutStale:true,layoutStage:'01549'};
      }
    }
    if((existing?.revision||0)!==exp)throw fail('NP_PACKING_REVISION_CONFLICT_01549');
    if(action==='reset'){
      const deleted=await db.query(`DELETE FROM ${sqlTable} WHERE store_id=$1 AND site_id=$2 AND cart_id=$3 AND revision=$4`,[...params,exp]);
      if(existing&&!deleted.rowCount)throw fail('NP_PACKING_REVISION_CONFLICT_01549');
      return {...base,moves:[],savedRevision:0,saved:false,layoutStale:false,layoutStage:'01549'};
    }
    // Strictly validate the whole proposed plan, never trust client-supplied dimensions.
    const accepted=await preview(scope,{siteId,cartId,moves:input.moves});
    if(accepted.cartFingerprint!==cartFingerprint)throw fail('NP_PACKING_CATALOG_CHANGED_01548');
    const updated=await db.query(`INSERT INTO ${sqlTable}
       (store_id,site_id,cart_id,cart_fingerprint,moves,revision,updated_by_user_id,updated_at)
       VALUES($1,$2,$3,$4,$5::jsonb,1,$6,now())
       ON CONFLICT(store_id,site_id,cart_id) DO UPDATE
       SET cart_fingerprint=EXCLUDED.cart_fingerprint,moves=EXCLUDED.moves,
           revision=${sqlTable}.revision+1,updated_by_user_id=EXCLUDED.updated_by_user_id,updated_at=now()
       WHERE ${sqlTable}.revision=$7
       RETURNING revision`,[...params,cartFingerprint,JSON.stringify(input.moves),scope.userId||null,exp]);
    if(!updated.rowCount)throw fail('NP_PACKING_REVISION_CONFLICT_01549');
    return {...accepted,moves:input.moves,savedRevision:updated.rows[0].revision,saved:true,layoutStale:false,layoutStage:'01549'};
  };
  return dbClient?exec(dbClient):withClient(exec);
}
