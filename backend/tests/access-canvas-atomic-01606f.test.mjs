import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeCanvasAtomicInput01606F,applyCanvasAtomic01606F} from '../src/site-canvas-atomic-core-01606f.mjs';
import {classifyCanvasRoute01606F,assertCanvasActions01606F,CANVAS_ACTION_CODES_01606F} from '../src/access-canvas-actions-core-01606f.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {ACCESS_PERMISSIONS_01597,normalizeAccessPermissions01597} from '../src/access-policy-core-01597.mjs';
import {createCanvasAtomicService01606F} from '../src/site-canvas-atomic-service-01606f.mjs';
const scope={accountId:'a',workspaceId:'w',storeId:'s'};
const tree=()=>({version:'01040',rootIds:['sec'],nodes:{sec:{id:'sec',kind:'section',area:'main',parentId:'area-main',children:['block'],content:null,style:{}},block:{id:'block',kind:'block',area:'main',parentId:'sec',children:[],content:{text:'Hi'},style:{}}},areaMeta:{kind:'main'}});
const project=()=>({version:'01170',site:{id:'site1',pages:[{id:'p1'},{id:'p2'}]},storage:{pageSnapshots:{'site1:p1':{siteFrameMain01040:tree(),other:'unchanged'},'site1:p2':{siteFrameMain01040:{version:'01040',rootIds:[],nodes:{},areaMeta:{}}}},headerState:{global:{html:'do-not-change'}}}});
const req=operations=>normalizeCanvasAtomicInput01606F({pageId:'p1',expectedRevision:7,operations});
const op=(type,id,rest={})=>({type,id,...rest});
const node=id=>({id,kind:'block',area:'main',parentId:'sec',children:[],content:{text:'New'},style:{}});
const denied=(fn,code,status)=>assert.throws(fn,e=>e.code===code&&e.statusCode===status);
test('01606F all four grants are registered and cannot be confused with whole-site write permission',()=>{
 const codes=ACCESS_PERMISSIONS_01597.map(p=>p.code);
 assert.deepEqual(codes.filter(x=>x.startsWith('site.design.canvas.')).sort(),[...CANVAS_ACTION_CODES_01606F].sort());
 assert.equal(normalizeAccessPermissions01597(codes).length,codes.length);
 for(const type of ['create','update','move','delete']){
  const action=[{type}];
  denied(()=>assertCanvasActions01606F({mode:'custom',permissions:['api.mode.site_actions','site.design.actions.project_replace']},action),'ST_CANVAS_ACTION_DENIED_01606F',403);
  assert.equal(assertCanvasActions01606F({mode:'custom',permissions:['ui.mode.controls',`site.design.canvas.${type}`]},action),true);
  assert.equal(assertCanvasActions01606F({mode:'owner'},action),true);
  assert.equal(assertCanvasActions01606F({mode:'legacy'},action),true);
 }
});
test('01606F route is protected by original site-scoped edit gate',()=>{
 const parts=['api','v1','sites','site1','canvas'];
 assert.equal(classifyCanvasRoute01606F('POST',parts),true);
 assert.equal(classifyProtectedAction01600('POST',parts)?.permission,'site.pages.edit');
 assert.equal(classifyProtectedAction01600('POST',parts)?.siteId,'site1');
 for(const method of ['GET','PUT','PATCH','DELETE'])assert.equal(classifyCanvasRoute01606F(method,parts),false);
 assert.equal(classifyCanvasRoute01606F('POST',[...parts,'x']),false);
 const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 assert.ok(server.indexOf('const protectedDecision01600=')<server.indexOf('if(classifyCanvasRoute01606F(req.method,p))'));
 assert.match(server,/assertCanvasActions01606F\(protectedDecision01600,input\.operations\)/);
});
test('01606F update only one node and preserves the rest of the project',()=>{
 const source=project(),updated=applyCanvasAtomic01606F(source,'site1',req([op('update','block',{patch:{content:{text:'Updated'}}})]));
 assert.equal(source.storage.pageSnapshots['site1:p1'].siteFrameMain01040.nodes.block.content.text,'Hi');
 assert.equal(updated.snapshot.nodes.block.content.text,'Updated');
 assert.deepEqual(updated.project.storage.pageSnapshots['site1:p2'],source.storage.pageSnapshots['site1:p2']);
 assert.deepEqual(updated.project.storage.headerState,source.storage.headerState);
 assert.equal(updated.snapshot.nodes.sec.content,null);
});
test('01606F create/move/delete operates on a valid tree and does not permit cycles',()=>{
 const added=applyCanvasAtomic01606F(project(),'site1',req([op('create','n1',{parentId:'sec',index:1,node:node('n1')})]));
 assert.deepEqual(added.snapshot.nodes.sec.children,['block','n1']);
 const moved=applyCanvasAtomic01606F(added.project,'site1',req([op('move','n1',{parentId:'sec',index:0})]));
 assert.deepEqual(moved.snapshot.nodes.sec.children,['n1','block']);
 const deleted=applyCanvasAtomic01606F(moved.project,'site1',req([op('delete','sec')]));
 assert.deepEqual(deleted.snapshot.rootIds,[]);
 assert.deepEqual(deleted.snapshot.nodes,{});
 denied(()=>applyCanvasAtomic01606F(added.project,'site1',req([op('move','sec',{parentId:'n1',index:0})])),'ST_CANVAS_ATOMIC_INVALID_01606F',400);
});
test('01606F rejects full snapshot writes, prototype keys, structural patches, cross-page input and invalid parents',()=>{
 denied(()=>normalizeCanvasAtomicInput01606F({pageId:'p1',expectedRevision:7,operations:[op('delete','sec')],project:project()}),'ST_CANVAS_ATOMIC_INVALID_01606F',400);
 for(const patch of [{children:['bad']},{id:'pwn'},{kind:'area'},{area:'header'},{tree:{depth:100}}])denied(()=>req([op('update','block',{patch})]),'ST_CANVAS_ATOMIC_INVALID_01606F',400);
 denied(()=>applyCanvasAtomic01606F(project(),'site1',normalizeCanvasAtomicInput01606F({pageId:'p2',expectedRevision:7,operations:[op('delete','block')]})),'ST_CANVAS_NODE_NOT_FOUND_01606F',404);
 denied(()=>applyCanvasAtomic01606F(project(),'site1',req([op('create','n1',{parentId:'missing',index:0,node:node('n1')})])),'ST_CANVAS_ATOMIC_INVALID_01606F',400);
 denied(()=>applyCanvasAtomic01606F(project(),'site2',req([op('delete','sec')])),'ST_CANVAS_PAGE_NOT_FOUND_01606F',404);
});
test('01606F service uses tenant-scoped SELECT FOR UPDATE and CAS with rollback on conflicts',async()=>{
 let state=project(),revision=7,commits=0,rollbacks=0,sql=[];
 const run=async fn=>fn({async query(query,params=[]){sql.push([query,params]);if(query==='BEGIN')return {rowCount:0};if(query==='COMMIT'){commits++;return {rowCount:0};}if(query==='ROLLBACK'){rollbacks++;return {rowCount:0};}if(query.includes('SELECT p.project_json'))return {rowCount:1,rows:[{project_json:state,revision}]};if(query.includes('UPDATE shifttime_builder_site_projects')){state=JSON.parse(params[0]);revision++;return {rowCount:1,rows:[{revision}]};}return {rowCount:1,rows:[]};}});
 const apply=createCanvasAtomicService01606F({run});
 const changed=await apply(scope,'actor','site1',req([op('update','block',{patch:{content:{text:'ok'}}})]));
 assert.equal(changed.revision,8);assert.equal(commits,1);assert.equal(state.storage.pageSnapshots['site1:p1'].siteFrameMain01040.nodes.block.content.text,'ok');
 assert.match(sql.find(([q])=>q.includes('SELECT p.project_json'))[0],/FOR UPDATE OF p/);
 assert.deepEqual(sql.find(([q])=>q.includes('SELECT p.project_json'))[1],['site1','a','w','s']);
 await assert.rejects(()=>apply(scope,'actor','site1',req([op('delete','sec')])),e=>e.code==='ST_CANVAS_REVISION_CONFLICT_01606F'&&e.statusCode===409);
 assert.equal(rollbacks,1);assert.equal(commits,1);
});
