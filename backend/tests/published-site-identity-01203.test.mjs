import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const load=async()=>import('../src/published-site-identity-01203.mjs').catch(()=>({}));

test('01203 published-site traffic token is opaque and not derived from site id',async()=>{
  const mod=await load();
  assert.equal(typeof mod.createPublishedSiteTrafficToken01203,'function');
  const token=mod.createPublishedSiteTrafficToken01203({randomBytes:()=>Buffer.alloc(32,7)});
  assert.match(token,/^pst_[A-Za-z0-9_-]{40,}$/);
  assert.equal(token.includes('site_123'),false);
});

test('01203 identity resolver accepts only an opaque token and returns stored tenant/site scope',async()=>{
  const mod=await load();
  assert.equal(typeof mod.createPublishedSiteIdentityResolver01203,'function');
  const seen=[];
  const resolve=mod.createPublishedSiteIdentityResolver01203({findByToken:async token=>{seen.push(token);return token==='pst_valid_abcdefghijklmnopqrstuvwxyz'?{account_id:'acct_1',workspace_id:'ws_1',store_id:'store_1',builder_site_id:'site_1',id:'pub_1',site_name:'Shop',site_slug:'shop'}:null;}});
  assert.equal(await resolve('site_1'),null);
  assert.deepEqual(await resolve('pst_valid_abcdefghijklmnopqrstuvwxyz'),{accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1',siteId:'site_1',publishedSiteId:'pub_1',siteName:'Shop',siteSlug:'shop'});
  assert.deepEqual(seen,['pst_valid_abcdefghijklmnopqrstuvwxyz']);
});

test('01203 migration adds unique published-site traffic identity without exposing it as authorization',()=>{
  const url=new URL('../sql/019_published_site_traffic_identity.sql',import.meta.url);
  assert.equal(fs.existsSync(url),true);
  const sql=fs.readFileSync(url,'utf8');
  assert.match(sql,/ADD COLUMN IF NOT EXISTS traffic_identity_token text/i);
  assert.match(sql,/UNIQUE INDEX[\s\S]*traffic_identity_token/i);
});
