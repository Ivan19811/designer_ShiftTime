import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ssoCookieValue01581} from '../src/sso-core-01581.mjs';
import {ssoUserFromCookie01611F} from '../src/sso-service-01581.mjs';
import {linkExistingSiteCustomer01611F} from '../src/site-customer-account-service-01595.mjs';
import {finishHostedIdentityFromSso01611F} from '../src/site-customer-flow-01595.mjs';
const secret='x'.repeat(64);
const userId='usr_0123456789abcdef0123';
const sessionId='sess_0123456789abcdef0123';
const site={siteId:'site_abc_123',publishedSiteId:'pub_xyz_123',storeId:'store_001',accountId:'acct_001'};
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');

test('01611F SSO needs a valid HMAC cookie AND a live database session',async()=>{
  let calls=0;
  const query=async fn=>fn({query:async(sql,args)=>{calls++;assert.match(sql,/s\.status='active'/);assert.equal(args[0],sessionId);return {rows:[{user_id:userId,id:sessionId}],rowCount:1};}});
  const cookie={headers:{cookie:'st_sso='+encodeURIComponent(ssoCookieValue01581(sessionId,secret))}};
  assert.equal(await ssoUserFromCookie01611F(cookie,{query,secret}),userId);
  assert.equal(calls,1);
  assert.equal(await ssoUserFromCookie01611F({headers:{cookie:'st_sso=tampered'}},{query,secret}),'');
  assert.equal(calls,1);
  assert.equal(await ssoUserFromCookie01611F(cookie,{query:async fn=>fn({query:async()=>({rows:[],rowCount:0})}),secret}),'');
});

test('01611F site SSO creates ONLY a customer membership in the exact site',async()=>{
  const calls=[];
  const query=async fn=>fn({query:async(sql,args=[])=>{
    calls.push({sql,args});
    if(sql.includes('FROM platform_users WHERE id=$1'))return {rows:[{id:userId,name:'Tester',email:'a@example.com'}],rowCount:1};
    if(sql.includes('SELECT status FROM platform_user_'))return {rows:[{status:'active'}],rowCount:1};
    return {rows:[],rowCount:1};
  }});
  const result=await linkExistingSiteCustomer01611F(site,userId,{query});
  assert.equal(result.id,userId);
  assert.ok(calls.some(c=>c.sql.includes('platform_user_site_memberships_01592')&&c.args.includes(site.siteId)));
  assert.ok(calls.some(c=>c.sql.includes('platform_user_shop_customers_01592')&&c.args.includes(site.storeId)));
  assert.ok(!calls.some(c=>/INSERT INTO (api_sessions|platform_memberships|platform_accounts|platform_workspaces|platform_stores)\b/.test(c.sql)));
  assert.ok(calls.some(c=>c.sql==='COMMIT'));
  await assert.rejects(()=>linkExistingSiteCustomer01611F(site,'acct_untrusted',{query}),e=>e.statusCode===401);
});

test('01611F hosted site transaction remains one-time, PKCE and verified redirect',async()=>{
  const flowId='sitx_'+ 'a'.repeat(32);
  const calls=[];
  const query=async fn=>fn({query:async(sql,args=[])=>{
    calls.push({sql,args});
    if(sql.includes('FROM platform_site_customer_flows_01595 f'))return {rowCount:1,rows:[{id:flowId,site_id:site.siteId,published_site_id:site.publishedSiteId,account_id:site.accountId,store_id:site.storeId,redirect_origin:'https://shop.example.com',redirect_path:'/shop',client_state:'a'.repeat(43),code_challenge:'b'.repeat(43),user_id:null,code_hash:null}]};
    if(sql.includes('FROM platform_users WHERE id=$1'))return {rowCount:1,rows:[{id:userId,name:'Tester',email:'a@example.com'}]};
    if(sql.includes('SELECT status FROM platform_user_'))return {rows:[{status:'active'}],rowCount:1};
    return {rows:[],rowCount:1};
  }});
  const result=await finishHostedIdentityFromSso01611F(flowId,userId,{query});
  const dest=new URL(result.redirectUrl);
  assert.equal(dest.origin,'https://shop.example.com');
  assert.equal(dest.pathname,'/shop');
  assert.equal(dest.search,'');
  assert.ok(dest.hash.includes('st_site_code=sic_'));
  assert.ok(!dest.href.includes(sessionId));
  assert.ok(calls.some(c=>c.sql.includes('UPDATE platform_site_customer_flows_01595 SET user_id=')));
});

test('01611F no password or shared session token is sent to published client',()=>{
  const server=read('../src/server.mjs');
  const page=read('../public/site-customer-identity-01595.js');
  assert.match(server,/ssoUserFromCookie01611F\(req\)/);
  assert.match(server,/finishHostedIdentityFromSso01611F\(tx,userId\)/);
  assert.match(server,/const \{_ssoUserId,\.\.\.publicOutput\}=output/);
  assert.match(server,/ssoLoginCookie01581\(req,sso\.sessionId\)/);
  assert.match(page,/site-continue\?tx=/);
  assert.match(page,/new URLSearchParams\(location\.search\)\.has\('sso'\)/);
  assert.match(page,/autocomplete="username"/);
  assert.match(page,/autocomplete="\$\{mode==='register'\?'new-password':'current-password'\}"/);
  assert.doesNotMatch(page,/<input[^>]*name="ssoToken"/);
  assert.doesNotMatch(page,/localStorage\.setItem\([^,]*password/);
});
