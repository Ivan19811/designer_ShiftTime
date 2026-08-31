// 01080 · Verified LocalRepository -> API/PostgreSQL migration. Local remains intact as fallback.
import {getMarketplaceStore01052} from './marketplace-runtime-01052.js?v=01052';
import {awaitMarketplaceTenantScope01070,getMarketplaceRepositoryContext01070} from './marketplace-tenant-runtime-01070.js?v=01070';
import {ScopedLocalMarketplaceRepository01070} from '../repositories/scoped-local-marketplace-repository-01070.js?v=01070';
import {ApiMarketplaceRepository01080} from '../repositories/api-marketplace-repository-01080.js?v=01082';
import {getMarketplaceBackendConfig01071,setMarketplaceBackendConfig01071} from './marketplace-backend-config-01071.js?v=01071';
import {createLocalOperationalMigrationBundle01080,summarizeLocalOperationalMigrationBundle01080} from './marketplace-local-deployment-bundle-01080.js?v=01080';

const listeners=new Set();let status={state:'idle',message:'Готово до перевірки',lastReport:null,lastError:''};
function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function emit(reason){const detail={reason,status:getPostgresqlMigrationStatus01080()};listeners.forEach(fn=>{try{fn(detail);}catch{}});try{window.dispatchEvent(new CustomEvent('st:marketplace-postgresql-migration-01080',{detail}));}catch{}}
function stable(v){if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object'){const out={};for(const k of Object.keys(v).sort())out[k]=stable(v[k]);return out;}return v;}
function contentSnapshot(s){const c=clone(s||{});delete c.revision;delete c.updatedAt;return stable(c);}
async function sha256(text){if(globalThis.crypto?.subtle){const bytes=new TextEncoder().encode(text);const b=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return `fnv32-${(h>>>0).toString(16).padStart(8,'0')}`;}
async function snapshotHash(s){return sha256(JSON.stringify(contentSnapshot(s)));}
function counts(s={}){const out={};for(const k of ['products','categories','attributes','attributeValues','variants','media','collections','filters','recommendations','feeds'])out[k]=Array.isArray(s[k])?s[k].length:0;return out;}
function isEmpty(s={}){return Object.values(counts(s)).every(n=>n===0);}
function makeApi(){const c=getMarketplaceBackendConfig01071();return new ApiMarketplaceRepository01080({baseUrl:c.apiBaseUrl,requestTimeoutMs:c.requestTimeoutMs,tokenProvider:()=>getMarketplaceBackendConfig01071().devToken,contextProvider:()=>getMarketplaceRepositoryContext01070()});}
export function getPostgresqlMigrationStatus01080(){return clone(status);}
export function subscribePostgresqlMigration01080(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn);}
export async function getPostgresqlDeploymentStatus01080(){const api=makeApi();const session=await api.getSession();const deployment=await api.getDeploymentStatus();return {session,deployment};}
export async function migrateActiveLocalStoreToPostgresql01080({allowOverwrite=false}={}){
  status={...status,state:'running',message:'Перевіряємо Local → PostgreSQL',lastError:''};emit('start');
  try{
    await awaitMarketplaceTenantScope01070();const ctx=getMarketplaceRepositoryContext01070();const local=new ScopedLocalMarketplaceRepository01070({tenantId:ctx.tenantId||ctx.accountId,workspaceId:ctx.workspaceId,storeId:ctx.storeId});const source=await local.loadSnapshot();const api=makeApi();const session=await api.getSession();
    if(String(session?.scope?.storeId||'')!==String(ctx.storeId))throw new Error(`Server authorized Store ${session?.scope?.storeId||'—'}, expected ${ctx.storeId}.`);if(!['owner','admin'].includes(String(session?.scope?.role||'')))throw new Error('Local → PostgreSQL migration requires owner/admin role.');
    const deployment=await api.getDeploymentStatus();if(deployment?.migrations?.pending?.length)throw new Error(`PostgreSQL has pending migrations: ${deployment.migrations.pending.join(', ')}`);if(deployment?.migrations?.checksumDrift?.length)throw new Error(`Migration checksum drift: ${deployment.migrations.checksumDrift.join(', ')}`);
    const targetBefore=await api.loadSnapshot();const sourceHash=await snapshotHash(source),targetBeforeHash=await snapshotHash(targetBefore);
    if(!allowOverwrite&&!isEmpty(targetBefore)&&sourceHash!==targetBeforeHash)throw new Error('Target PostgreSQL Store already contains different commerce data. Automatic overwrite is blocked. Export/backup the target and use explicit CLI import if replacement is intentional.');
    await api.replaceSnapshot(source,{sourceKind:'studio-local-migration-01080'});const operationalBundle=createLocalOperationalMigrationBundle01080(),operationalExpected=summarizeLocalOperationalMigrationBundle01080(operationalBundle,ctx.storeId);const operationalImport=await api.importLocalOperational(operationalBundle);const targetAfter=await api.loadSnapshot();const targetAfterHash=await snapshotHash(targetAfter);if(sourceHash!==targetAfterHash)throw new Error(`PostgreSQL verification failed: source ${sourceHash.slice(0,12)} != target ${targetAfterHash.slice(0,12)}.`);
    const deploymentAfter=await api.getDeploymentStatus();const actual=deploymentAfter?.store?.operational||{};for(const [key,expected] of Object.entries({listings:operationalExpected.listings,offers:operationalExpected.offers,seller_orders:operationalExpected.sellerOrders,payment_allocations:operationalExpected.paymentAllocations,inventory_reservation_items:operationalExpected.inventoryReservationItems,inventory_ledger:operationalExpected.inventoryLedger})){if(Number(actual[key]||0)<Number(expected||0))throw new Error(`Operational PostgreSQL verification failed for ${key}: expected at least ${expected}, got ${actual[key]||0}.`);}
    setMarketplaceBackendConfig01071({mode:'api'});const store=getMarketplaceStore01052();await store.setRepository(api);await store.refresh('01080-verified-local-to-postgresql');const report={ok:true,storeId:ctx.storeId,sourceHash,targetHash:targetAfterHash,counts:counts(targetAfter),sourceRevision:Number(source?.revision)||0,targetRevision:Number(targetAfter?.revision)||0,operationalExpected,operationalImport,operationalActual:actual,database:deploymentAfter?.database||deployment?.database||null,migrations:deploymentAfter?.migrations||deployment?.migrations||null,localRepositoryPreserved:true};status={state:'api',message:'API + PostgreSQL verified',lastReport:report,lastError:''};emit('migrated');return report;
  }catch(e){status={...status,state:'error',message:'Міграцію не завершено',lastError:e.message||String(e)};emit('error');throw e;}
}
