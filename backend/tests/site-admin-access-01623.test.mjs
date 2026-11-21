import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveBuilderEntry01623,publishedSiteAdminDecision01623} from '../src/site-admin-access-core-01623.mjs';
const grants=(role,permissions,siteId='site_demo')=>[{
  role,status:'active',assignmentStatus:'active',accessRoleStatus:'active',
  scopeKind:'site',grantSiteId:siteId,permissions
}];

test('01623 buyer account can never acquire Builder access merely by logging in',()=>{
  assert.deepEqual(publishedSiteAdminDecision01623([],{enrolled:true,siteId:'site_demo'}),{role:'customer',canAdmin:false});
  assert.deepEqual(publishedSiteAdminDecision01623([{role:'customer',status:'active'}],{enrolled:true,siteId:'site_demo'}),{role:'customer',canAdmin:false});
  assert.equal(publishedSiteAdminDecision01623(grants('viewer',['site.design.view']),{enrolled:true,siteId:'site_demo'}).canAdmin,false);
});
test('01623 editor with a revoked, inactive, wrong-site, or not-enrolled grant is denied',()=>{
  assert.equal(publishedSiteAdminDecision01623(grants('viewer',['site.design.edit']),{enrolled:false,siteId:'site_demo'}).canAdmin,false);
  assert.equal(publishedSiteAdminDecision01623(grants('viewer',['site.design.edit'],'site_other'),{enrolled:true,siteId:'site_demo'}).canAdmin,false);
  assert.equal(publishedSiteAdminDecision01623(grants('viewer',['site.design.edit']).map(x=>({...x,assignmentStatus:'revoked'})),{enrolled:true,siteId:'site_demo'}).canAdmin,false);
  assert.equal(publishedSiteAdminDecision01623(grants('viewer',['site.design.edit']),{enrolled:true,siteId:'site_demo',siteActive:false}).canAdmin,false);
});
test('01623 delegated editor and owner receive appropriate rights, not a global admin role',()=>{
  assert.deepEqual(publishedSiteAdminDecision01623(grants('viewer',['site.design.edit']),{enrolled:true,siteId:'site_demo'}),{role:'manager',canAdmin:true});
  assert.deepEqual(publishedSiteAdminDecision01623(grants('admin',['site.design.edit']),{enrolled:true,siteId:'site_demo'}),{role:'site_admin',canAdmin:true});
  assert.deepEqual(publishedSiteAdminDecision01623([{role:'owner',status:'active'}],{enrolled:false,siteId:'site_demo'}),{role:'owner',canAdmin:true});
});
test('01623 admin link only uses a registered Builder SSO callback, never a request origin',()=>{
  const callbacks='crm=https://crm.example.com/,builder=http://127.0.0.1:5544/index.html,builder=https://builder.example.com/index.html';
  assert.equal(resolveBuilderEntry01623(callbacks),'https://builder.example.com/index.html');
  assert.equal(resolveBuilderEntry01623(callbacks,'http://127.0.0.1:5544/index.html'),'http://127.0.0.1:5544/index.html');
  assert.equal(resolveBuilderEntry01623(callbacks,'https://malicious.example.com/'),'');
  assert.equal(resolveBuilderEntry01623('builder=https://evil.com/index.html?token=x'),'');
  assert.equal(resolveBuilderEntry01623('builder=http://evil.com/index.html'),'');
});
test('01623 public route requires valid site customer bearer, not published site traffic token alone',()=>{
  const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  const service=readFileSync(new URL('../src/site-admin-access-01623.mjs',import.meta.url),'utf8');
  const frontend=readFileSync(new URL('../public/site-customer-account-01595.js',import.meta.url),'utf8');
  const sso=readFileSync(new URL('../src/sso-service-01581.mjs',import.meta.url),'utf8');
  assert.match(server,/action==='admin-access'&&req\.method==='GET'/);
  assert.match(server,/await customerSession01595\(site,String\(req\.headers\['x-st-customer-session'\]/);
  assert.match(service,/m\.status='active'/);
  assert.match(service,/a\.status='active'/);
  assert.match(frontend,/siteAccess\?\.canAdmin/);
  assert.ok(sso.indexOf('const scope=await resolveAuthorizedStore')<sso.indexOf('const fresh=await createSessionForUser01581(session.user_id)'));
});
