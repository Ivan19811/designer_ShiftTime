import crypto from 'node:crypto';
import {pool,withTransaction} from '../src/db.mjs';
import {config} from '../src/config.mjs';
import {hashToken} from '../src/auth.mjs';
import {getMigrationStatus01080} from '../src/migration-service.mjs';
function id(prefix,seed){return `${prefix}_${crypto.createHash('sha1').update(seed).digest('hex').slice(0,16)}`;}
function slug(v){return String(v??'').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9а-яіїєґ]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,96)||'item';}
function emptySnapshot(){const t=new Date().toISOString();return {schemaId:'shifttime-marketplace-schema-v1',schemaVersion:1,revision:0,createdAt:t,updatedAt:t,products:[],categories:[],attributes:[],attributeValues:[],variants:[],media:[],collections:[],filters:[],recommendations:[],feeds:[],seo:{defaults:{locale:'uk-UA',currency:'UAH',canonicalMode:'auto',filterIndexMode:'safe',titleTemplate:'',descriptionTemplate:''},sitemap:{enabled:true},structuredData:{product:true,productGroup:true,offer:true,breadcrumb:true},indexing:{categories:true,products:true,filters:'safe'},openGraph:{enabled:true,defaultImageMediaId:''},diagnostics:{altRequired:true,missingMetaWarning:true}},settings:{locale:'uk-UA',currency:'UAH',skuPolicy:'unique-required',draftExportPolicy:'exclude'}};}
try{
  if(!config.bootstrapOwnerEnabled)throw new Error('BOOTSTRAP_OWNER_ENABLED=true is required for one-time production bootstrap.');
  if(!config.bootstrapOwnerEmail||!config.bootstrapOwnerEmail.includes('@'))throw new Error('BOOTSTRAP_OWNER_EMAIL is required.');
  if(config.bootstrapSessionToken.length<32)throw new Error('BOOTSTRAP_SESSION_TOKEN must be at least 32 characters.');
  const migrations=await getMigrationStatus01080();if(migrations.some(x=>!x.applied||!x.checksumMatch))throw new Error('Run npm run db:migrate successfully before bootstrap.');
  const userId=id('user',config.bootstrapOwnerEmail.toLowerCase());const membershipId=id('member',`${userId}:${config.bootstrapAccountId}:owner`);const sessionId=id('sess',hashToken(config.bootstrapSessionToken));
  const expiresAt=new Date(Date.now()+config.bootstrapSessionTtlHours*3600_000);
  await withTransaction(async client=>{
    await client.query(`INSERT INTO platform_users(id,email,name,status) VALUES($1,$2,$3,'active') ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,status='active',updated_at=now()`,[userId,config.bootstrapOwnerEmail,config.bootstrapOwnerName]);
    const uq=await client.query('SELECT id FROM platform_users WHERE email=$1',[config.bootstrapOwnerEmail]);const actualUserId=uq.rows[0].id;
    await client.query(`INSERT INTO platform_accounts(id,name,slug,status,owner_user_id) VALUES($1,$2,$3,'active',$4) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,owner_user_id=EXCLUDED.owner_user_id,status='active',updated_at=now()`,[config.bootstrapAccountId,config.bootstrapAccountName,slug(config.bootstrapAccountName),actualUserId]);
    await client.query(`INSERT INTO platform_workspaces(id,account_id,name,slug,status) VALUES($1,$2,$3,$4,'active') ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,status='active',updated_at=now()`,[config.bootstrapWorkspaceId,config.bootstrapAccountId,config.bootstrapWorkspaceName,slug(config.bootstrapWorkspaceName)]);
    await client.query(`INSERT INTO platform_stores(id,workspace_id,name,slug,status,locale,currency) VALUES($1,$2,$3,$4,'active','uk-UA','UAH') ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,status='active',updated_at=now()`,[config.bootstrapStoreId,config.bootstrapWorkspaceId,config.bootstrapStoreName,slug(config.bootstrapStoreName)]);
    await client.query(`INSERT INTO platform_memberships(id,user_id,account_id,workspace_id,store_id,role,status,permissions) VALUES($1,$2,$3,NULL,NULL,'owner','active','[]'::jsonb) ON CONFLICT(id) DO UPDATE SET user_id=EXCLUDED.user_id,role='owner',status='active',updated_at=now()`,[membershipId,actualUserId,config.bootstrapAccountId]);
    await client.query(`INSERT INTO api_sessions(id,user_id,token_hash,status,expires_at) VALUES($1,$2,$3,'active',$4) ON CONFLICT(token_hash) DO UPDATE SET user_id=EXCLUDED.user_id,status='active',expires_at=EXCLUDED.expires_at,last_seen_at=NULL`,[sessionId,actualUserId,hashToken(config.bootstrapSessionToken),expiresAt]);
    const snapshot=emptySnapshot();await client.query(`INSERT INTO commerce_store_snapshots(store_id,schema_version,revision,snapshot) VALUES($1,1,0,$2::jsonb) ON CONFLICT(store_id) DO NOTHING`,[config.bootstrapStoreId,JSON.stringify(snapshot)]);
    await client.query(`INSERT INTO marketplace_networks(id,name,slug,status,default_locale,default_currency) VALUES('marketplace_shifttime','ShiftTime Marketplace','shifttime','active','uk-UA','UAH') ON CONFLICT(id) DO NOTHING`);
    await client.query(`INSERT INTO marketplace_categories(id,marketplace_id,name,slug,status) VALUES('mpcat_uncategorized','marketplace_shifttime','Без категорії','uncategorized','active') ON CONFLICT(id) DO NOTHING`);
    await client.query(`UPDATE platform_deployment_state SET metadata=COALESCE(metadata,'{}'::jsonb)||$1::jsonb,updated_at=now() WHERE id='primary'`,[JSON.stringify({bootstrapStoreId:config.bootstrapStoreId,bootstrapOwnerUserId:actualUserId,bootstrapSessionExpiresAt:expiresAt.toISOString()})]);
  });
  console.log('[01080] production owner bootstrap ready');
  console.log(`  account:   ${config.bootstrapAccountId}`);console.log(`  workspace: ${config.bootstrapWorkspaceId}`);console.log(`  store:     ${config.bootstrapStoreId}`);console.log(`  owner:     ${config.bootstrapOwnerEmail}`);console.log(`  session:   created, expires ${expiresAt.toISOString()} (token value intentionally not logged)`);
  console.log('  IMPORTANT: set BOOTSTRAP_OWNER_ENABLED=false after this one-time command.');
}finally{await pool.end();}
