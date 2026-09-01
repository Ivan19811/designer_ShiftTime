import crypto from 'node:crypto';
import {withClient,getDatabaseDiagnostics} from './db.mjs';
import {getMigrationStatus01080} from './migration-service.mjs';
function clean(v){return String(v??'').trim();}
function snapshotCounts(s={}){const keys=['products','categories','attributes','attributeValues','variants','media','collections','filters','recommendations','feeds'];const out={};for(const k of keys)out[k]=Array.isArray(s?.[k])?s[k].length:0;return out;}
function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object'){const o={};for(const k of Object.keys(v).sort())o[k]=stable(v[k]);return o;}return v;}
function hashSnapshot(s={}){const copy=JSON.parse(JSON.stringify(s||{}));delete copy.updatedAt;delete copy.revision;return crypto.createHash('sha256').update(JSON.stringify(stable(copy))).digest('hex');}
export async function getDeploymentStatus01080(scope){return withClient(async client=>{
  const database=await getDatabaseDiagnostics(client);const migrations=await getMigrationStatus01080(client);const snap=await client.query('SELECT schema_version,revision,snapshot,updated_at FROM commerce_store_snapshots WHERE store_id=$1',[scope.storeId]);const d=await client.query(`SELECT schema_stage,database_provider,last_migration_at,last_import_at,metadata,updated_at FROM platform_deployment_state WHERE id='primary'`).catch(()=>({rows:[]}));const row=snap.rows[0]||null;
  const ops=await client.query(`SELECT
    (SELECT COUNT(*)::int FROM marketplace_listings WHERE store_id=$1) listings,
    (SELECT COUNT(*)::int FROM marketplace_seller_offers WHERE store_id=$1) offers,
    (SELECT COUNT(*)::int FROM marketplace_seller_orders WHERE store_id=$1) seller_orders,
    (SELECT COUNT(*)::int FROM marketplace_payment_allocations WHERE store_id=$1) payment_allocations,
    (SELECT COUNT(*)::int FROM marketplace_inventory_reservation_items WHERE store_id=$1) inventory_reservation_items,
    (SELECT COUNT(*)::int FROM marketplace_inventory_ledger WHERE store_id=$1) inventory_ledger,
    (SELECT COUNT(*)::int FROM marketplace_seller_order_deliveries WHERE store_id=$1) deliveries`,[scope.storeId]);
  const imp=await client.query(`SELECT source_kind "sourceKind",snapshot_sha256 "hash",entity_counts "entityCounts",created_at "createdAt" FROM commerce_store_imports WHERE store_id=$1 ORDER BY created_at DESC LIMIT 5`,[scope.storeId]).catch(()=>({rows:[]}));
  return {stage:'01092',database,migrations:{total:migrations.length,applied:migrations.filter(x=>x.applied&&x.checksumMatch).length,pending:migrations.filter(x=>!x.applied).map(x=>x.filename),checksumDrift:migrations.filter(x=>x.applied&&!x.checksumMatch).map(x=>x.filename)},deployment:d.rows[0]||null,store:{storeId:scope.storeId,schemaVersion:Number(row?.schema_version||0),revision:Number(row?.revision||0),updatedAt:row?.updated_at||null,counts:row?snapshotCounts(row.snapshot):snapshotCounts({}),snapshotHash:row?hashSnapshot(row.snapshot):'',operational:ops.rows[0]||{},recentImports:imp.rows}};
});}
export function sanitizeImportSource01080(v){const x=clean(v).replace(/[^a-z0-9._:-]/gi,'-').slice(0,80);return x||'api-snapshot-replace';}
