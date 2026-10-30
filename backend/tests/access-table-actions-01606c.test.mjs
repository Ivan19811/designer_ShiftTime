import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACCESS_PERMISSIONS_01597,normalizeAccessRoleInput01597} from '../src/access-policy-core-01597.mjs';
import {classifyExtendedAction01601} from '../src/access-enforcement-core-01601.mjs';
import {classifyTableAction01606C,assertTableAction01606C} from '../src/access-table-actions-core-01606c.mjs';
const p=path=>['api','v1',...path.split('/')];
const classify=(method,path)=>classifyTableAction01606C(method,p(path));
const grant=(permissions=[],mode='custom')=>({mode,permissions});
const statusCode=fn=>assert.throws(fn,e=>e?.statusCode===403&&e?.code==='ST_ACCESS_TABLE_ACTION_DENIED_01606C');
test('01606C exact table actions match all actual CRUD routes (12 categories)',()=>{
 const rows=[
 ['POST','tables','create'],['PATCH','tables/t_1','settings_edit'],['DELETE','tables/t_1','archive'],
 ['POST','tables/t_1/fields','fields_create'],['PATCH','tables/t_1/fields/f_1','fields_edit'],['DELETE','tables/t_1/fields/f_1','fields_delete'],
 ['POST','tables/t_1/records','records_create'],['PATCH','tables/t_1/records/r_1','records_edit'],['DELETE','tables/t_1/records/r_1','records_delete'],
 ['POST','tables/t_1/views','views_create'],['PATCH','tables/t_1/views/v_1','views_edit'],['DELETE','tables/t_1/views/v_1','views_delete']
 ];
 assert.equal(rows.length,12);
 for(const [m,path,name] of rows){
  assert.equal(classify(m,path)?.permission,`builder.tables.actions.${name}`,`${m} ${path}`);
  assert.ok(classifyExtendedAction01601(m,p(path))?.permission.startsWith('builder.tables.'),`missing base guard: ${m} ${path}`);
 }
 const known=new Set(ACCESS_PERMISSIONS_01597.map(x=>x.code));
 for(const [, ,name] of rows)assert.ok(known.has(`builder.tables.actions.${name}`));
});
test('01606C fails closed for unknown/extra segments and foreign routes',()=>{
 for(const [m,path] of [['PUT','tables/t_1'],['POST','tables/t_1/records/r_1'],['PATCH','tables/t_1/records'],['POST','tables/t_1/unknown'],['DELETE','tables/t_1/records'],['PATCH','marketplace/t_1'],['POST','tables/t_1/fields/f_1/unexpected'],['POST','tables//records']])assert.equal(classify(m,path),null,path);
});
test('01606C owner/legacy keep existing behavior; opted-in worker needs independent grant',()=>{
 const row=classify('POST','tables/t_1/records');
 assert.equal(assertTableAction01606C(grant([], 'owner'),row),true);
 assert.equal(assertTableAction01606C(grant([], 'legacy'),row),true);
 assert.equal(assertTableAction01606C(grant(['builder.tables.edit']),row),true);
 statusCode(()=>assertTableAction01606C(grant(['api.mode.table_actions','builder.tables.edit']),row));
 assert.equal(assertTableAction01606C(grant(['api.mode.table_actions','builder.tables.actions.records_create']),row),true);
 statusCode(()=>assertTableAction01606C(grant(['api.mode.table_actions','builder.tables.actions.records_edit']),row));
});
test('01606C ui controls are an additional gate, not a substitute for real table grants',()=>{
 const row=classify('POST','tables/t_1/records');
 statusCode(()=>assertTableAction01606C(grant(['ui.mode.controls','ui.control.tableaddrow']),row));
 statusCode(()=>assertTableAction01606C(grant(['ui.mode.controls','builder.tables.actions.records_create']),row));
 assert.equal(assertTableAction01606C(grant(['ui.mode.controls','builder.tables.actions.records_create','ui.control.tableaddrow']),row),true);
 const inline=classify('PATCH','tables/t_1/records/r_1');
 assert.equal(inline.uiControl,'');
 assert.equal(assertTableAction01606C(grant(['ui.mode.controls','builder.tables.actions.records_edit']),inline),true);
});
test('01606C role serialization preserves new permissions and server uses audited middleware',()=>{
 const codes=['builder.tables.edit','builder.tables.actions.records_create','ui.control.tableaddrow','api.mode.table_actions'];
 assert.deepEqual(normalizeAccessRoleInput01597({name:'Create records',permissions:codes}).permissions,[...codes].sort());
 const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 assert.ok(server.indexOf('const protectedDecision01600=')<server.indexOf('const tableAction01606C='));
 assert.ok(server.indexOf('const tableAction01606C=')<server.indexOf("if(p[2]==='tables')"));
 assert.match(server,/assertTableAction01606C\(protectedDecision01600,tableAction01606C\)/);
 assert.match(server,/recordDeniedAccess01605C\(scope,session.userId,\{permission:tableAction01606C.permission,siteId:''\}/);
});
