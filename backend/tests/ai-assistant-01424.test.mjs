import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {AI_ASSISTANT_SERVER_MODULES_01424,AI_ASSISTANT_TOOL_META_01424,normalizeAiAssistantCapabilities01424,sanitizeAiAssistantPlan01424,validateAiAssistantToolArgs01424} from '../src/ai-assistant-core-01424.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('01424 server accepts dynamic module adapter status and keeps Composite Page host operations',()=>{
  const composite=AI_ASSISTANT_SERVER_MODULES_01424.find(x=>x.id==='composite-page');
  assert.equal(composite?.status,'ready');
  for(const tool of ['composite.inspectModule','composite.moveModule','composite.resizeModule','composite.duplicateModule','composite.removeModule'])assert.ok(composite.actions.includes(tool));
  assert.equal(AI_ASSISTANT_TOOL_META_01424['composite.removeModule'].risk,'high');

  for(const id of ['smartblocks','presentation','music-studio'])assert.equal(AI_ASSISTANT_SERVER_MODULES_01424.find(x=>x.id===id)?.status,'partial');
  const dynamic=normalizeAiAssistantCapabilities01424([{id:'music-studio',status:'ready',actions:[]}]);
  assert.equal(dynamic[0]?.status,'ready');
});

test('01424 validates move resize and remove tool arguments',()=>{
  assert.equal(validateAiAssistantToolArgs01424('composite.moveModule',{sectionId:'s1',index:2}).ok,true);
  assert.equal(validateAiAssistantToolArgs01424('composite.moveModule',{sectionId:'s1',index:-1}).ok,false);
  assert.equal(validateAiAssistantToolArgs01424('composite.resizeModule',{sectionId:'s1',height:320}).args.height,320);
  assert.equal(validateAiAssistantToolArgs01424('composite.removeModule',{}).ok,false);
});

test('01424 planner preserves shared module-host actions and dependencies',()=>{
  const caps=normalizeAiAssistantCapabilities01424([{id:'composite-page',status:'ready',actions:['composite.inspectModule','composite.moveModule','composite.resizeModule']}]);
  const plan=sanitizeAiAssistantPlan01424({actions:[
    {stepId:'inspect',module:'composite-page',tool:'composite.inspectModule',args:{sectionId:'s1'}},
    {stepId:'move',module:'composite-page',tool:'composite.moveModule',args:{sectionId:'s1',index:1},dependsOn:['inspect']},
    {stepId:'resize',module:'composite-page',tool:'composite.resizeModule',args:{sectionId:'s1',height:280},dependsOn:['move']}
  ]},caps,{maxPlanSteps:12});
  assert.equal(plan.actions.length,3);
  assert.deepEqual(plan.actions[1].dependsOn,['inspect']);
  assert.equal(plan.actions[1].schemaValid,true);
  assert.equal(plan.actions[2].schemaValid,true);
});

test('01424 backend routes service stage through current server',()=>{
  const server=read('src/server.mjs');
  assert.match(server,/ai-assistant-service-01424\.mjs/);
  assert.match(server,/AI_ASSISTANT_ROUTE_NOT_FOUND_01424/);
});
