import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  SITE_ACTION_CODES_01606E,classifySiteAction01606E,assertSiteAction01606E,isPreciseSiteMode01606E
} from '../src/access-site-actions-core-01606e.mjs';
import {ACCESS_PERMISSIONS_01597,normalizeAccessPermissions01597} from '../src/access-policy-core-01597.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
const p=path=>['api','v1',...path.split('/')];
const role=(permissions=[],mode='custom')=>({mode,permissions});
const rejected=(d,a,permission)=>assert.throws(()=>assertSiteAction01606E(d,a),e=>
  e.statusCode===403&&e.code==='ST_ACCESS_SITE_ACTION_DENIED_01606E'&&e.permission===permission);
const cases=[
 ['POST','sites','site_create','site.pages.create'],
 ['PATCH','sites/site_1/metadata','metadata_edit','site.pages.edit'],
 ['PUT','sites/site_1','project_replace','site.pages.edit'],
 ['DELETE','sites/site_1','site_delete','site.publish.delete'],
 ['POST','sites/site_1/revisions','draft_create','site.pages.edit'],
 ['PUT','sites/site_1/revisions/draft_1','draft_replace','site.pages.edit'],
 ['PATCH','sites/site_1/revisions/draft_1/details','draft_details','site.pages.edit'],
 ['DELETE','sites/site_1/revisions/draft_1','draft_delete','site.pages.delete'],
 ['POST','sites/site_1/publish','publish','site.publish.execute'],
 ['POST','sites/site_1/revisions/draft_1/publish','publish','site.publish.execute'],
];
test('01606E role vocabulary contains nine exact site permissions plus opt-in mode',()=>{
 const codes=ACCESS_PERMISSIONS_01597.map(x=>x.code);
 assert.equal(codes.length,new Set(codes).size);
 assert.deepEqual(codes.filter(x=>x.startsWith('site.design.actions.')).sort(),[...SITE_ACTION_CODES_01606E].sort());
 assert.ok(codes.includes('api.mode.site_actions'));
 assert.equal(normalizeAccessPermissions01597(codes).length,codes.length);
});
test('01606E all ten live mutation routes keep their original base permission and add secondary site gate',()=>{
 for(const [method,path,action,base] of cases){
   const classified=classifySiteAction01606E(method,p(path));
   assert.equal(classified?.permission,'site.design.actions.'+action,method+' '+path);
   assert.equal(classifyProtectedAction01600(method,p(path))?.permission,base,method+' '+path);
 }
 for(const [method,path] of [
   ['GET','sites'],['GET','sites/site_1'],['GET','sites/site_1/publish-status'],
   ['GET','sites/site_1/revisions'],['GET','sites/site_1/revisions/draft_1'],
   ['POST','sites/site_1/metadata'],['PATCH','sites/site_1/revisions/draft_1/publish'],
   ['POST','sites/site_1/revisions/draft_1/other'],['PUT','sites/site_1/unknown']
 ])assert.equal(classifySiteAction01606E(method,p(path)),null,method+' '+path);
});
test('01606E action grants cannot be substituted with UI buttons or base permissions',()=>{
 for(const [m,path] of cases){
   const action=classifySiteAction01606E(m,p(path));
   rejected(role(['api.mode.site_actions','site.pages.edit','site.publish.execute']),action,action.permission);
   assert.equal(assertSiteAction01606E(role(['api.mode.site_actions',action.permission,...action.also,action.uiControl].filter(Boolean)),action),true);
 }
 assert.equal(assertSiteAction01606E(role([]),classifySiteAction01606E('PUT',p('sites/s'))),true);
 assert.equal(assertSiteAction01606E(role([],'legacy'),classifySiteAction01606E('PUT',p('sites/s'))),true);
 assert.equal(assertSiteAction01606E(role([],'owner'),classifySiteAction01606E('PUT',p('sites/s'))),true);
 assert.equal(isPreciseSiteMode01606E(role(['api.mode.site_actions'])),true);
 assert.equal(isPreciseSiteMode01606E(role(['ui.mode.controls'])),true);
 assert.equal(isPreciseSiteMode01606E(role([])),false);
});
test('01606E UI precision mode also denies unseen site writes and must grant matching UI buttons',()=>{
 const project=classifySiteAction01606E('PUT',p('sites/site_1'));
 rejected(role(['ui.mode.controls',project.permission]),project,'ui.control.pagesave');
 assert.equal(assertSiteAction01606E(role(['ui.mode.controls',project.permission,'ui.control.pagesave']),project),true);
 const publish=classifySiteAction01606E('POST',p('sites/site_1/publish'));
 rejected(role(['ui.mode.controls',publish.permission,'ui.control.sitepublish']),publish,'site.design.actions.project_replace');
 rejected(role(['ui.mode.controls',publish.permission,'site.design.actions.project_replace']),publish,'ui.control.sitepublish');
 assert.equal(assertSiteAction01606E(role(['ui.mode.controls',publish.permission,'site.design.actions.project_replace','ui.control.sitepublish']),publish),true);
});
test('01606E full design changes in new/updated drafts require project_replace, while a prepared revision can publish independently',()=>{
 for(const [verb,path] of [['POST','sites/site_1/revisions'],['PUT','sites/site_1/revisions/draft_1']]){
   const a=classifySiteAction01606E(verb,p(path));
   rejected(role(['api.mode.site_actions',a.permission]),a,'site.design.actions.project_replace');
 }
 const published=classifySiteAction01606E('POST',p('sites/site_1/revisions/draft_1/publish'));
 assert.deepEqual(published.also,[]);
 assert.equal(assertSiteAction01606E(role(['api.mode.site_actions',published.permission]),published),true);
});
test('01606E denies at API routing stage before any body parsing or site project write',()=>{
 const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 const base=server.indexOf('const protectedDecision01600=');
 const classifier=server.indexOf('const siteAction01606E=classifySiteAction01606E');
 const gate=server.indexOf('assertSiteAction01606E(protectedDecision01600,siteAction01606E)');
 const writes=server.indexOf('await createBuilderSite01170(scope,session.userId');
 assert.ok(base>0&&classifier>base&&gate>classifier&&writes>gate);
 assert.match(server,/createOnly:isPreciseSiteMode01606E\(protectedDecision01600\)/);
 const repo=fs.readFileSync(new URL('../src/builder-sites-service-01170.mjs',import.meta.url),'utf8');
 assert.match(repo,/if\(createOnly\)throw httpError\('Builder site already exists',409/);
});
test('01606E create-only flag is generated server-side and forwarded through the site service',async()=>{
 const {createBuilderSitesService01170}=await import('../src/builder-sites-core-01170.mjs');
 let seen=null;
 const service=createBuilderSitesService01170({repo:{async create(_scope,_actor,data,options){seen={data,options};return data;}},netlify:{}});
 const created=await service.create({accountId:'a',workspaceId:'w',storeId:'s'},'u',{id:'site_1',project:{pages:[]}}, {createOnly:true});
 assert.equal(created.id,'site_1');
 assert.deepEqual(seen.options,{createOnly:true});
 assert.deepEqual(seen.data.project,{pages:[]});
});
