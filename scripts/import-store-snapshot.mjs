import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {pool,withClient} from '../src/db.mjs';
import {config} from '../src/config.mjs';
import {replaceSnapshot,loadSnapshot} from '../src/commerce-snapshot-service.mjs';
function arg(name){const p=process.argv.slice(2).find(x=>x.startsWith(`--${name}=`));return p?p.slice(name.length+3):'';}
function hash(s){const c=JSON.parse(JSON.stringify(s||{}));delete c.revision;delete c.updatedAt;return crypto.createHash('sha256').update(JSON.stringify(c)).digest('hex');}
function counts(s={}){const out={};for(const k of ['products','categories','attributes','attributeValues','variants','media','collections','filters','recommendations','feeds'])out[k]=Array.isArray(s[k])?s[k].length:0;return out;}
const file=process.argv.slice(2).find(x=>!x.startsWith('--'));const storeId=arg('store')||config.bootstrapStoreId;const confirm=arg('confirm')||process.env.IMPORT_CONFIRM_STORE_ID||'';const userId=arg('user')||'';
try{
  if(!file)throw new Error('Usage: npm run db:import-store -- /path/store.json --store=store_default --confirm=store_default');
  if(config.isProduction&&confirm!==storeId)throw new Error(`Production import requires --confirm=${storeId}.`);
  const raw=JSON.parse(await fs.readFile(file,'utf8'));if(raw?.schemaId!=='shifttime-marketplace-schema-v1')throw new Error('Input is not a ShiftTime Marketplace 01052 snapshot.');
  const scope=await withClient(async client=>{const q=await client.query(`SELECT st.id store_id,st.workspace_id,ws.account_id FROM platform_stores st JOIN platform_workspaces ws ON ws.id=st.workspace_id WHERE st.id=$1`,[storeId]);if(!q.rowCount)throw new Error(`Store not found: ${storeId}`);return {storeId:q.rows[0].store_id,workspaceId:q.rows[0].workspace_id,accountId:q.rows[0].account_id,userId:userId||null};});
  const beforeHash=hash(raw);const saved=await replaceSnapshot(scope,raw,{sourceKind:'cli-json-import-01080'});const loaded=await loadSnapshot(scope);const afterHash=hash(loaded);if(beforeHash!==afterHash)throw new Error(`Post-import snapshot verification failed: ${beforeHash} != ${afterHash}`);
  console.log(JSON.stringify({ok:true,stage:'01080',storeId,sourceFile:file,sourceRevision:Number(raw.revision)||0,postgresRevision:Number(saved.revision)||0,snapshotHash:afterHash,counts:counts(loaded)},null,2));
}finally{await pool.end();}
