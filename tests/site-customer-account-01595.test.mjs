import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildProductionFiles01143} from '../src/site-production-build-01143.mjs';
import {customerInput01595,customerSiteScope01595,customerSessionHash01595,newCustomerToken01595,limitCustomerAuth01595} from '../src/site-customer-account-core-01595.mjs';
import {registerSiteCustomer01595,loginSiteCustomer01595,customerSession01595,logoutSiteCustomer01595} from '../src/site-customer-account-service-01595.mjs';
const site={siteId:'site_1766843295295',publishedSiteId:'published_01595',accountId:'acct_1',storeId:'store_abc'};
const pkg={version:'01143',site:{id:site.siteId,name:'Shop'},pages:[{id:'home',path:'/',title:'Main',html:{main:'<h1>Main</h1>'}},{id:'account',path:'/account',title:'Account',html:{main:'<section data-shop-page-role-01532="account"><div class="st-row">Old preview</div></section>'}}],assets:[]};
const pub={canonicalBaseUrl:'https://shop.example.com',apiProxyTarget:'https://designer-shifttime.onrender.com',publishedSiteIdentity:{siteId:site.siteId,token:'pst_abcdefghijklmnopqrstuv0123456789ABCDEFGHIJ'}};

test('01595 published account runtime is bundled only with verified published-site identity',()=>{
  const files=buildProductionFiles01143(pkg,pub);
  assert.match(files.get('account/index.html').toString(),/data-st-site-customer-account="01595"/);
  assert.doesNotMatch(files.get('index.html').toString(),/data-st-site-customer-account="01595"/);
  assert.ok(files.get('assets/site-customer-account-01595.js'));
  assert.ok(files.get('assets/site-customer-account-01595.uk.json'));
  assert.match(files.get('account/index.html').toString(),/data-st-published-traffic="01203"/);
  assert.doesNotMatch(files.get('assets/site-customer-account-01595.js').toString(),/marketplace-auth-runtime|api_sessions|authorization:\s*['"]Bearer/);
  assert.ok(!buildProductionFiles01143(pkg).has('assets/site-customer-account-01595.js'));
});
test('01595 customer runtime does not touch Builder test-mode profile or stored snapshots',()=>{
  const source=fs.readFileSync(new URL('../public/site-customer-account-01595.js',import.meta.url),'utf8');
  assert.match(source,/__ST_PUBLISHED_SITE_IDENTITY__/);
  assert.match(source,/sessionStorage/);
  assert.match(source,/x-st-customer-session/);
  assert.doesNotMatch(source,/<input[^>]*password|name=\"password\"/); // never ask for shared credentials on merchant's page
  assert.doesNotMatch(source,/st_auth_session_token|st_sso|set-cookie/);
  assert.match(source,/replaceChildren/);
  assert.match(source,/\.textContent=/);
});
test('01595 published account injected into offline export only with an identity',()=>{
  const files=buildProductionFiles01143({exporterVersion:'01151',files:[{path:'account/index.html',content:'<html><head></head><body data-st-published="01143"><section data-shop-page-role-01532="account"></section></body></html>'}]},pub);
  assert.ok(files.has('assets/site-customer-account-01595.js'));
  assert.match(files.get('account/index.html').toString(),/data-st-site-customer-account/);
});
test('01595 customer form validation and explicit terms consent',()=>{
  assert.equal(customerInput01595({email:' Test@EXAMPLE.com ',password:'0123456789',name:'Client',acceptTerms:true},true).email,'test@example.com');
  for(const obj of [{email:'bad',password:'0123456789',name:'Client',acceptTerms:true},{email:'foo@example.com',password:'123',name:'Client',acceptTerms:true},{email:'foo@example.com',password:'0123456789',name:'A',acceptTerms:true},{email:'foo@example.com',password:'0123456789',name:'Client',acceptTerms:false}])assert.throws(()=>customerInput01595(obj,true));
});
test('01595 customer token opaque, its hash distinct from raw token',()=>{
  const token=newCustomerToken01595();assert.match(token,/^stc_[A-Za-z0-9_-]{40,120}$/);assert.notEqual(token,customerSessionHash01595(token));
});
test('01595 scope rejects unknown public website',()=>{
  assert.throws(()=>customerSiteScope01595({siteId:'random',accountId:'acct',publishedSiteId:'pub'}));
  assert.equal(customerSiteScope01595(site).siteId,site.siteId);
});
test('01595 rate limiter blocks repeated authentication attempts',()=>{
  for(let i=0;i<12;i++)limitCustomerAuth01595(site.siteId,'test-ip-01595',()=>123456);
  assert.throws(()=>limitCustomerAuth01595(site.siteId,'test-ip-01595',()=>123456),e=>e.statusCode===429);
  assert.doesNotThrow(()=>limitCustomerAuth01595(site.siteId,'test-ip-01595',()=>123456+900001));
});

test('01595 registration requires an operator opt-in (safe default)',async()=>{
  const prior=process.env.SITE_CUSTOMER_REGISTRATION_ENABLED;
  delete process.env.SITE_CUSTOMER_REGISTRATION_ENABLED;
  try{await assert.rejects(()=>registerSiteCustomer01595(site,{name:'Client',email:'foo@example.com',password:'0123456789',acceptTerms:true},{query:()=>{throw Error('DB should not be called');}}),e=>e.statusCode===403);}
  finally{if(prior===undefined)delete process.env.SITE_CUSTOMER_REGISTRATION_ENABLED;else process.env.SITE_CUSTOMER_REGISTRATION_ENABLED=prior;}
});

test('01595 registration creates a shared user but never an Account, Workspace or owner role',async()=>{
  const prior=process.env.SITE_CUSTOMER_REGISTRATION_ENABLED;process.env.SITE_CUSTOMER_REGISTRATION_ENABLED='true';
  const calls=[];
  const query=async fn=>fn({query:async(sql,params=[])=>{
    calls.push({sql,params});
    if(sql.includes('SELECT id FROM platform_users'))return {rowCount:0,rows:[]};
    if(sql.includes('SELECT status FROM platform_user_'))return {rowCount:1,rows:[{status:'active'}]};
    if(sql.includes('RETURNING expires_at'))return {rows:[{expiresAt:'2026-11-01T18:00:00Z'}],rowCount:1};
    return {rows:[],rowCount:1};
  }});
  try{
    const result=await registerSiteCustomer01595(site,{name:'Customer A',email:'customer@example.com',password:'0123456789',acceptTerms:true},{query});
    assert.match(result.user.id,/^usr_/);assert.equal(result.token,undefined); // only one-time exchange can mint a buyer token
    assert.ok(calls.some(c=>c.sql.includes('INSERT INTO platform_users(')));
    assert.ok(calls.some(c=>c.sql.includes('platform_user_site_memberships_01592')));
    assert.ok(calls.some(c=>c.sql.includes('platform_user_shop_customers_01592')));
    assert.ok(calls.some(c=>c.sql.includes('platform_user_services_01592')));
    assert.ok(!calls.some(c=>/INSERT INTO platform_(accounts|workspaces|stores|memberships)\b/.test(c.sql)));
    assert.ok(!calls.some(c=>/INSERT INTO api_sessions\b/.test(c.sql)));
    assert.ok(calls.some(c=>c.sql==='COMMIT'));
  }finally{if(prior===undefined)delete process.env.SITE_CUSTOMER_REGISTRATION_ENABLED;else process.env.SITE_CUSTOMER_REGISTRATION_ENABLED=prior;}
});

test('01595 existing email cannot register twice or be silently merged',async()=>{
  const prior=process.env.SITE_CUSTOMER_REGISTRATION_ENABLED;process.env.SITE_CUSTOMER_REGISTRATION_ENABLED='true';
  const calls=[];
  const query=async fn=>fn({query:async(sql,params=[])=>{calls.push(sql);if(sql.includes('SELECT id FROM platform_users'))return{rowCount:1,rows:[{id:'usr_existing'}]};return {rowCount:1,rows:[]};}});
  try{await assert.rejects(()=>registerSiteCustomer01595(site,{name:'Customer',email:'foo@example.com',password:'0123456789',acceptTerms:true},{query}),e=>e.statusCode===409);
    assert.ok(calls.includes('ROLLBACK'));assert.ok(!calls.some(s=>s.includes('INSERT INTO platform_user_site_memberships')));
  }finally{if(prior===undefined)delete process.env.SITE_CUSTOMER_REGISTRATION_ENABLED;else process.env.SITE_CUSTOMER_REGISTRATION_ENABLED=prior;}
});

test('01595 site-scoped profile rejects invalid and cross-site tokens',async()=>{
  await assert.rejects(()=>customerSession01595(site,'invalid',{query:()=>{throw Error('unexpected');}}),e=>e.statusCode===401);
  let args;
  const query=async fn=>fn({query:async(sql,params=[])=>{if(sql.includes('FROM platform_site_customer_sessions_01595')){args=params;return{rowCount:0,rows:[]};}return{rowCount:0,rows:[]};}});
  await assert.rejects(()=>customerSession01595(site,newCustomerToken01595(),{query}),e=>e.statusCode===401);
  assert.equal(args[1],site.siteId);
  assert.notEqual(args[0],null);
});
test('01595 logout only revokes same-site customer session',async()=>{
  let params;const query=async fn=>fn({query:async(sql,args)=>{assert.match(sql,/WHERE token_hash=\$1 AND site_id=\$2/);params=args;return{rows:[],rowCount:1};}});
  const token=newCustomerToken01595();const out=await logoutSiteCustomer01595(site,token,{query});
  assert.equal(out.ok,true);assert.equal(params[1],site.siteId);assert.notEqual(params[0],token);
});

test('01595 API declares customer-only routes before manager authentication and CORS custom header',()=>{
  const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  const authIndex=server.indexOf("p[4]==='account'&&p.length===6");
  assert.ok(authIndex>0);
  assert.ok(authIndex<server.indexOf("p[2]==='auth'&&p[3]==='register'"));
  assert.match(server,/customerSession01595\(site,String\(req.headers\['x-st-customer-session'\]/);
  assert.match(fs.readFileSync(new URL('../src/http-utils.mjs',import.meta.url),'utf8'),/x-st-customer-session/);
});

// Hosted flow policy: callback domain must match Netlify's verified deployment.
import {assertPublishedReturnOrigin01595,authOrigin01595,startSiteCustomerFlow01595,exchangeSiteCustomerCode01595} from '../src/site-customer-flow-01595.mjs';
test('01595 trusted hosted identity uses explicit HTTPS configured origin',()=>{
  assert.equal(authOrigin01595('https://designer-shifttime.onrender.com'),'https://designer-shifttime.onrender.com');
  assert.throws(()=>authOrigin01595('http://bad.example.com'));
});
test('01595 callback origin is constrained to current Netlify publication',()=>{
  const publication={netlify_ssl_url:'https://trusted-shop.netlify.app',netlify_url:'http://trusted-shop.netlify.app',store_domain:'evil.example.com'};
  assert.equal(assertPublishedReturnOrigin01595('https://trusted-shop.netlify.app',publication),'https://trusted-shop.netlify.app');
  assert.throws(()=>assertPublishedReturnOrigin01595('https://untrusted.example.com',publication),e=>e.statusCode===403);
  assert.throws(()=>assertPublishedReturnOrigin01595('https://evil.example.com',publication),e=>e.statusCode===403);
  assert.throws(()=>assertPublishedReturnOrigin01595('https://trusted-shop.netlify.app.evil.example.com',publication));
});
test('01595 hosted password collection is on Render, never published-site asset',()=>{
  const trusted=fs.readFileSync(new URL('../public/site-customer-identity-01595.js',import.meta.url),'utf8');
  const untrusted=fs.readFileSync(new URL('../public/site-customer-account-01595.js',import.meta.url),'utf8');
  assert.match(trusted,/new FormData/);assert.match(trusted,/name=\"password\"/);
  assert.doesNotMatch(untrusted,/name=\"password\"/);
  assert.match(untrusted,/crypto.subtle.digest/);assert.match(untrusted,/st_site_code/);
  assert.match(fs.readFileSync(new URL('../src/site-customer-flow-01595.mjs',import.meta.url),'utf8'),/consumed_at=now\(\)/);
});
test('01595 hosted flow rejects mismatched PKCE challenge and unknown callback domains',async()=>{
  let calls=0;
  const query=async fn=>fn({query:async(sql,params)=>{calls++;if(sql.includes('FROM shifttime_published_sites'))return{rowCount:1,rows:[{id:site.publishedSiteId,site_name:'Shop',netlify_ssl_url:'https://trusted-shop.netlify.app',netlify_url:'',account_id:site.accountId,store_id:site.storeId}]};return{rowCount:1,rows:[]};}});
  await assert.rejects(()=>startSiteCustomerFlow01595(site,{codeChallenge:'invalid',state:'123',returnPath:'/account',returnOrigin:'https://trusted-shop.netlify.app'},{query,base:'https://designer-shifttime.onrender.com'}));
  assert.equal(calls,0);
  const inputs={codeChallenge:'z'.repeat(43),state:'X'.repeat(32),returnPath:'/account',returnOrigin:'https://trusted-shop.netlify.app'};
  const result=await startSiteCustomerFlow01595(site,inputs,{query,base:'https://designer-shifttime.onrender.com'});
  assert.match(result.loginUrl,/https:\/\/designer-shifttime.onrender.com\/identity\/site\/\?tx=sitx_/);
  await assert.rejects(()=>startSiteCustomerFlow01595(site,{...inputs,returnOrigin:'https://attacker.example.com'},{query,base:'https://designer-shifttime.onrender.com'}),e=>e.statusCode===403);
});
test('01595 exchange validates proof and never accepts invalid one-time code',async()=>{
  await assert.rejects(()=>exchangeSiteCustomerCode01595(site,'insecure','bad',{query:()=>{throw Error('Must not reach DB');}}),e=>e.statusCode===400);
});
test('01595 hosted API removes password-bearing routes from merchant origin',()=>{
  const src=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  assert.match(src,/p\[3\]==='identity'&&p\[4\]==='site'/);
  assert.match(src,/SITE_ACCOUNT_METHOD_01595/);
  assert.match(src,/site-customer-identity-01595.html/);
  assert.match(src,/x-frame-options':'DENY'/);
  assert.doesNotMatch(src,/registerSiteCustomer01595\(site,body\)/);
});

test('01595 one-time PKCE code exchanges to buyer-only session and consumes the flow',async()=>{
  const crypto=await import('node:crypto');
  const verifier=crypto.randomBytes(32).toString('base64url'),challenge=crypto.createHash('sha256').update(verifier).digest('base64url');
  const code='sic_'+crypto.randomBytes(32).toString('base64url');
  const calls=[];
  const query=async fn=>fn({query:async(sql,params=[])=>{
    calls.push(sql);
    if(sql.includes('SELECT id,user_id,code_challenge'))return {rowCount:1,rows:[{id:'sitx_1234',user_id:'usr_testuser',code_challenge:challenge}]};
    if(sql.includes('SELECT id,name,email,email_verified_at FROM platform_users'))return {rowCount:1,rows:[{id:'usr_testuser',name:'Tester',email:'tester@example.com',email_verified_at:null}]};
    if(sql.includes('RETURNING expires_at'))return {rowCount:1,rows:[{expiresAt:'2026-11-01T19:00:00Z'}]};
    return {rowCount:1,rows:[]};
  }});
  const out=await exchangeSiteCustomerCode01595(site,code,verifier,{query});
  assert.match(out.token,/^stc_/);assert.equal(out.user.email,'tester@example.com');assert.equal(out.user.emailVerified,false);
  assert.ok(calls.some(s=>s.includes('consumed_at=now()')));
  assert.ok(!calls.some(s=>s.includes('INSERT INTO api_sessions')));
  assert.ok(calls.includes('COMMIT'));
});
test('01595 wrong PKCE verifier rolls back with no session',async()=>{
  const crypto=await import('node:crypto'),verifier=crypto.randomBytes(32).toString('base64url'),code='sic_'+crypto.randomBytes(32).toString('base64url');
  const calls=[];
  const query=async fn=>fn({query:async(sql)=>{calls.push(sql);if(sql.includes('SELECT id,user_id,code_challenge'))return {rowCount:1,rows:[{id:'sitx_id',user_id:'usr_some',code_challenge:'x'.repeat(43)}]};return{rowCount:1,rows:[]};}});
  await assert.rejects(()=>exchangeSiteCustomerCode01595(site,code,verifier,{query}),e=>e.statusCode===401);
  assert.ok(calls.includes('ROLLBACK'));assert.ok(!calls.some(s=>s.includes('INSERT INTO platform_site_customer_sessions')));
});
test('01595 trusted hosted completion creates one-time redirect fragment, never password or bearer',async()=>{
  const {finishHostedIdentity01595}=await import('../src/site-customer-flow-01595.mjs');
  const tx='sitx_'+ 'A'.repeat(32),calls=[];
  const query=async fn=>fn({query:async(sql,params=[])=>{
    calls.push({sql,params});
    if(sql.includes('FROM platform_site_customer_flows_01595 f JOIN'))return{rowCount:1,rows:[{id:tx,site_id:site.siteId,published_site_id:site.publishedSiteId,account_id:site.accountId,store_id:site.storeId,redirect_origin:'https://trusted-shop.netlify.app',redirect_path:'/account/',client_state:'state_enough_12345678901234567890123456',site_name:'Shop',user_id:null,code_hash:null}]};
    return {rowCount:1,rows:[]};
  }});
  const result=await finishHostedIdentity01595(tx,'login',{email:'person@example.com',password:'secret-not-stored'},{query,authenticate:async()=>({user:{id:'usr_member'}})});
  assert.match(result.redirectUrl,/https:\/\/trusted-shop\.netlify\.app\/account\/#st_site_code=sic_/);
  assert.match(result.redirectUrl,/st_site_state=/);
  assert.doesNotMatch(result.redirectUrl,/secret-not-stored|usr_member/);
  assert.equal(calls.filter(c=>c.sql.includes('UPDATE platform_site_customer_flows_01595 SET user_id')).length,1);
});

test('01595 global registry site count includes real customer site memberships',()=>{
  const src=fs.readFileSync(new URL('../src/platform-user-registry-service-01592.mjs',import.meta.url),'utf8');
  assert.match(src,/const siteCountSql=.*platform_user_site_memberships_01592/);
  assert.match(src,/b.owner_user_id=u.id OR sm.user_id IS NOT NULL/);
});
