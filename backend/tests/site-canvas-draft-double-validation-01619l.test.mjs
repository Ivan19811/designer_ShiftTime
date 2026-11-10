import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeDraftCanvasInput01606G,createDraftCanvasService01606G,draftFingerprint01606G} from '../src/site-canvas-draft-service-01606g.mjs';
import {assertCanvasActions01606F} from '../src/access-canvas-actions-core-01606f.mjs';

const validRequest=()=>({
  expectedFingerprint:'a'.repeat(64),
  pageId:'page_home',
  operations:[{type:'update',id:'sf_main_tpl_mua04w25_5',patch:{content:{text:'СКОВОРІДКИ-М1'}}}]
});
const path=new URL('../src/server.mjs',import.meta.url);
const source=fs.readFileSync(path,'utf8');
const route=source.slice(source.indexOf("if(req.method==='POST'&&p[2]==='sites'&&p[3]&&p[4]==='revisions'&&p[5]&&p[6]==='canvas'"));

test('01619L: server validates raw input for ACL, then gives raw input to draft service (not normalized input)',()=>{
  assert.match(route,/const rawInput01619L=await readJson\(req,\{limit:512\*1024\}\)/);
  assert.match(route,/const input=normalizeDraftCanvasInput01606G\(rawInput01619L\)/);
  assert.match(route,/assertCanvasActions01606F\(protectedDecision01600,input\.operations\)/);
  assert.match(route,/applyDraftCanvas01606G\(scope,session\.userId,p\[3\],p\[5\],rawInput01619L\)/);
  assert.doesNotMatch(route,/applyDraftCanvas01606G\(scope,session\.userId,p\[3\],p\[5\],input\)/);
});
test('01619L: exact original 01619K double-normalization HTTP 400 is reproduced and avoided',()=>{
  const raw=validRequest();
  const first=normalizeDraftCanvasInput01606G(raw);
  assert.equal(first.expectedRevision,1);
  assert.throws(()=>normalizeDraftCanvasInput01606G(first),e=>e.code==='ST_CANVAS_DRAFT_INVALID_01606G'&&e.statusCode===400);
  const serviceInput=normalizeDraftCanvasInput01606G(raw);
  assert.deepEqual(serviceInput,first);
});
test('01619L: expectedRevision cannot be supplied by clients; no full-project or JSON-path escape',()=>{
  for(const field of [{expectedRevision:1},{project:{site:{}}},{path:'site.pages.0'},{snapshot:{}}]){
    assert.throws(()=>normalizeDraftCanvasInput01606G({...validRequest(),...field}),e=>e.statusCode===400);
  }
});
test('01619L: authorization is still checked on normalized operations before any write',()=>{
  const normalized=normalizeDraftCanvasInput01606G(validRequest());
  assert.throws(()=>assertCanvasActions01606F({mode:'custom',permissions:['api.mode.site_actions','site.pages.edit']},normalized.operations),e=>e.statusCode===403);
});

test('01619L integration: authorized manager edit reaches a real scoped transaction without changing the original',async()=>{
  const project={site:{id:'site1',pages:[{id:'page_home'}]},storage:{pageSnapshots:{'site1:page_home':{siteFrameMain01040:{version:'01040',rootIds:['section'],nodes:{section:{id:'section',kind:'section',area:'main',parentId:'main',children:['title']},title:{id:'title',kind:'block',area:'main',parentId:'section',children:[],content:{text:'СКОВОРІДКИ-3'}}}}}},headerState:{global:{html:'original header'}}}};
  const original=structuredClone(project),scope={accountId:'a',workspaceId:'w',storeId:'s'};
  let stored=structuredClone(project),writes=0,commits=0;
  const client={async query(sql,params=[]){
    if(sql==='BEGIN'||sql==='ROLLBACK')return {rowCount:0,rows:[]};
    if(sql==='COMMIT'){commits++;return {rowCount:0,rows:[]};}
    if(sql.includes('SELECT r.project_json'))return {rowCount:1,rows:[{project_json:structuredClone(stored)}]};
    if(sql.includes('FROM shifttime_site_test_branches_01613d'))return {rowCount:1,rows:[{state:'editing',author_user_id:'manager'}]};
    if(sql.includes('UPDATE shifttime_builder_site_revisions')){stored=JSON.parse(params[0]);writes++;return {rowCount:1,rows:[{id:'draft1'}]};}
    if(sql.includes('UPDATE shifttime_site_test_branches_01613d'))return {rowCount:1,rows:[]};
    throw Error('Unexpected SQL '+sql);
  }};
  const service=createDraftCanvasService01606G({run:async fn=>fn(client)});
  const raw={pageId:'page_home',expectedFingerprint:draftFingerprint01606G(project),operations:[{type:'update',id:'title',patch:{content:{text:'СКОВОРІДКИ-М1'}}}]};
  const aclInput=normalizeDraftCanvasInput01606G(raw);
  const grants={mode:'custom',permissions:['api.mode.site_actions','site.design.canvas.update']};
  assert.equal(assertCanvasActions01606F(grants,aclInput.operations),true);
  const result=await service(scope,'manager','site1','draft1',raw);
  assert.equal(result.operationsApplied,1);assert.equal(commits,1);assert.equal(writes,1);
  assert.equal(stored.storage.pageSnapshots['site1:page_home'].siteFrameMain01040.nodes.title.content.text,'СКОВОРІДКИ-М1');
  assert.deepEqual(stored.storage.headerState,original.storage.headerState);
  assert.equal(original.storage.pageSnapshots['site1:page_home'].siteFrameMain01040.nodes.title.content.text,'СКОВОРІДКИ-3');
  // Ownership is independently enforced by the DB branch guard.
  await assert.rejects(()=>service(scope,'intruder','site1','draft1',{...raw,expectedFingerprint:result.fingerprint}),e=>e.statusCode===403&&e.code==='ST_TEST_AUTHOR_REQUIRED_01613D');
  assert.equal(writes,1);
});
