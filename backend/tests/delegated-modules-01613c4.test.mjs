import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeModuleTiers01613C4,modulePermissions01613C4,moduleRoutePermission01613C4,moduleRouteAllowed01613C4,currentDelegatedModules01613C4,setModuleDelegation01613C4} from '../src/delegated-modules-01613c4.mjs';
import {assertSiteOnlyBoundary01613C} from '../src/site-collaboration-01613c.mjs';
const owner={role:'owner',accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1'};
const viewer={...owner,role:'viewer'};
const id='scinv_'+'a'.repeat(20);
const res=r=>({rowCount:r.length,rows:r});
const fake=fn=>cb=>cb({query:async(s,p)=>fn(String(s),p||[])});
test('01613C4 tiers are explicitly limited and never include administrative or publishing grants',()=>{
 for(const cat of ['none','view','edit'])for(const msg of ['none','view','reply']){
  const tiers=normalizeModuleTiers01613C4({marketplace:cat,messenger:msg});
  const permissions=modulePermissions01613C4(tiers);
  assert.ok(permissions.every(p=>!/^(admin|team|site\.|shop\.products\.(delete|import|prices)|crm\.messages\.manage)/.test(p)),permissions);
 }
 assert.throws(()=>normalizeModuleTiers01613C4({marketplace:'owner',messenger:'reply'}));
 assert.throws(()=>normalizeModuleTiers01613C4({marketplace:'edit',messenger:'reply',admin:true}));
});
test('01613C4 whitelist denies publishing, deletion, import, inbox administration and phone reveal',()=>{
 const permitted={marketplace:'edit',messenger:'reply',productPermissions:['products_create','texts']};
 const allow=[['GET',['api','v1','marketplace','products']],['POST',['api','v1','marketplace','products']],['PATCH',['api','v1','marketplace','products','p_1']],['GET',['api','v1','notifications','messages']],['GET',['api','v1','notifications','messages','inbox']],['POST',['api','v1','notifications','messages','inbox','thread_1','thread']]];
 for(const [m,p] of allow)assert.equal(moduleRouteAllowed01613C4(m,p,permitted),true,m+' '+p.join('/'));
 const reject=[['DELETE',['api','v1','marketplace','products','x']],['PUT',['api','v1','marketplace','snapshot']],['POST',['api','v1','marketplace','products','bulk-status']],['PATCH',['api','v1','notifications','messages','inbox','thread_1']],['POST',['api','v1','notifications','messages','inbox','thread_1','reveal-phone']],['GET',['api','v1','admin','role-center','roles']],['POST',['api','v1','sites','test','publish']]];
 for(const [m,p] of reject)assert.equal(moduleRouteAllowed01613C4(m,p,permitted),false,m+' '+p.join('/'));
 assert.equal(moduleRoutePermission01613C4('GET',['api','v1','marketplace','products']),'shop.products.view');
 assert.equal(moduleRouteAllowed01613C4('POST',['api','v1','marketplace','products'],{marketplace:'view'}),false);
 assert.equal(moduleRouteAllowed01613C4('POST',['api','v1','notifications','messages','inbox','x','thread'],{messenger:'view'}),false);
});
test('01613C4 current grants default deny without active accepted site invitation',async()=>{
 const none=await currentDelegatedModules01613C4(viewer,'usr_123',{run:fake(()=>res([]))});
 assert.equal(none.marketplace,'none');
 const granted=await currentDelegatedModules01613C4(viewer,'usr_123',{run:fake(s=>s.includes('platform_delegated_module_grants')?res([{marketplace:'view',messenger:'reply'}]):res([]))});
 assert.equal(granted.messenger,'reply');
});
test('01613C4 site-only fence allows only modules with effective delegated permission',async()=>{
 const run=fake(s=>s.includes('platform_delegated_module_grants')?res([{marketplace:'view',messenger:'reply'}]):res([{allowed:1}]));
 await assertSiteOnlyBoundary01613C(viewer,'usr_123',['api','v1','marketplace','products'],{run,method:'GET'});
 await assertSiteOnlyBoundary01613C(viewer,'usr_123',['api','v1','access','my-navigation'],{run,method:'GET'});
 await assertSiteOnlyBoundary01613C(viewer,'usr_123',['api','v1','notifications','messages','inbox','id','thread'],{run,method:'POST'});
 await assert.rejects(()=>assertSiteOnlyBoundary01613C(viewer,'usr_123',['api','v1','marketplace','products','id'],{run,method:'DELETE'}),{statusCode:403});
 await assert.rejects(()=>assertSiteOnlyBoundary01613C(viewer,'usr_123',['api','v1','admin','role-center','roles'],{run,method:'GET'}),{statusCode:403});
});
test('01613C4 only owner can update and invite must be accepted',async()=>{
 await assert.rejects(()=>setModuleDelegation01613C4(viewer,'usr_owner',id,{marketplace:'edit',messenger:'reply'}),{statusCode:403});
 await assert.rejects(()=>setModuleDelegation01613C4(owner,'usr_owner',id,{marketplace:'edit',messenger:'reply'},
  {run:fake(s=>s.includes('platform_site_collaboration_invites')?res([{status:'pending'}]):res([]))}),{statusCode:409});
});
test('01613C4 owner writes only fixed-tier access to accepted recipient with audit',async()=>{
 const calls=[];
 const run=fake((s,p)=>{calls.push([s,p]);if(s.includes('SELECT i.accepted_by_user_id'))return res([{userId:'usr_guest',status:'accepted'}]);if(s.includes('SELECT 1 FROM platform_memberships'))return res([{}]);return res([]);});
 const out=await setModuleDelegation01613C4(owner,'usr_owner',id,{marketplace:'edit',messenger:'reply',productPermissions:['texts','photos']},{run});
 assert.equal(out.ok,true);assert.equal(out.userId,'usr_guest');
 const update=calls.find(([s])=>s.includes('INSERT INTO platform_delegated_module_grants_01613c4'));
 assert.ok(update);assert.deepEqual(update[1].slice(0,5),['acct_1','store_1','usr_guest','edit','reply']);
 assert.deepEqual(JSON.parse(update[1][5]),['photos','texts']);
 assert.deepEqual(out.productPermissions,['photos','texts']);
 assert.ok(calls.some(([s])=>s.includes('platform_admin_audit_log')));
});
