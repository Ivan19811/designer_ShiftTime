import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDraftCanvasService01606G,draftFingerprint01606G,normalizeDraftCanvasInput01606G} from '../src/site-canvas-draft-service-01606g.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
import {classifySiteAction01606E,assertSiteAction01606E} from '../src/access-site-actions-core-01606e.mjs';
import {assertCanvasActions01606F} from '../src/access-canvas-actions-core-01606f.mjs';
const scope={accountId:'account',workspaceId:'workspace',storeId:'store'};
const project=()=>({version:'01170',site:{id:'site1',pages:[{id:'p1'}]},storage:{pageSnapshots:{'site1:p1':{siteFrameMain01040:{version:'01040',rootIds:['sec'],nodes:{sec:{id:'sec',kind:'section',area:'main',parentId:'main',children:['b']},b:{id:'b',kind:'block',area:'main',parentId:'sec',children:[],content:{text:'original'}}}}}},headerState:{global:{html:'keep'}}}});
const input=(p,ops)=>({pageId:'p1',expectedFingerprint:draftFingerprint01606G(p),operations:ops});
test('01606G route cannot skip tenant gate or individual Canvas permissions',()=>{
 const path=['api','v1','sites','site1','revisions','rev1','canvas'];
 assert.equal(classifyProtectedAction01600('POST',path)?.permission,'site.pages.edit');
 assert.throws(()=>assertCanvasActions01606F({mode:'custom',permissions:['api.mode.site_actions','site.design.canvas.create']},[{type:'delete'}]),e=>e.statusCode===403);
 assert.equal(classifySiteAction01606E('POST',['api','v1','sites','site1','revisions','from-source']).permission,'site.design.actions.draft_create');
 assert.equal(assertSiteAction01606E({mode:'custom',permissions:['api.mode.site_actions','site.design.actions.draft_create']},classifySiteAction01606E('POST',['api','v1','sites','site1','revisions','from-source'])),true);
 assert.throws(()=>assertSiteAction01606E({mode:'custom',permissions:['api.mode.site_actions','site.design.actions.draft_create']},classifySiteAction01606E('PUT',['api','v1','sites','site1','revisions','rev1'])),e=>e.statusCode===403);
});
test('01606G rejects full projects and arbitrary paths',()=>{
 const p=project();
 for(const extra of [{project:p},{snapshot:p.storage},{path:'storage.headerState'}, {expectedRevision:2}])assert.throws(()=>normalizeDraftCanvasInput01606G({...input(p,[{type:'delete',id:'b'}]),...extra}),e=>e.statusCode===400);
});
test('01606G transaction locks draft row and checks CAS fingerprint; no other project field changes',async()=>{
 let state=project(),commits=0,rollbacks=0,queries=[];
 const run=async fn=>fn({async query(sql,params=[]){queries.push([sql,params]);if(sql==='BEGIN')return {rowCount:1};if(sql==='COMMIT'){commits++;return {rowCount:1};}if(sql==='ROLLBACK'){rollbacks++;return {rowCount:1};}if(sql.includes('SELECT r.project_json'))return {rowCount:1,rows:[{project_json:structuredClone(state)}]};if(sql.includes('UPDATE shifttime_builder_site_revisions')){state=JSON.parse(params[0]);return {rowCount:1,rows:[{id:'rev1'}]};}throw Error('unrecognized mock SQL');}});
 const apply=createDraftCanvasService01606G({run});const first=input(state,[{type:'update',id:'b',patch:{content:{text:'updated'}}}]);
 const out=await apply(scope,'actor','site1','rev1',first);
 assert.equal(out.operationsApplied,1);assert.equal(commits,1);
 assert.equal(state.storage.headerState.global.html,'keep');
 assert.equal(state.storage.pageSnapshots['site1:p1'].siteFrameMain01040.nodes.b.content.text,'updated');
 const sql=queries.find(([q])=>q.includes('SELECT r.project_json'));
 assert.match(sql[0],/FOR UPDATE OF r/);assert.deepEqual(sql[1],['site1','rev1','account','workspace','store']);
 await assert.rejects(()=>apply(scope,'actor','site1','rev1',first),e=>e.statusCode===409&&e.code==='ST_CANVAS_DRAFT_CONFLICT_01606G');
 assert.equal(commits,1);assert.equal(rollbacks,1);
});
test('01606G route uses base and precise gates before DB work',()=>{
 const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 assert.match(server,/normalizeDraftCanvasInput01606G\(await readJson/);
 assert.match(server,/assertCanvasActions01606F\(protectedDecision01600,input.operations\)/);
 assert.match(server,/applyDraftCanvas01606G\(scope,session.userId/);
});
