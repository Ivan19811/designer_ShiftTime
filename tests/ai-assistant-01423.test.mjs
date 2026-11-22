import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {AI_ASSISTANT_SERVER_MODULES_01423,AI_ASSISTANT_TOOL_META_01423,normalizeAiAssistantCapabilities01423,sanitizeAiAssistantPlan01423,validateAiAssistantToolArgs01423} from '../src/ai-assistant-core-01423.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('01423 server advertises Composite Page host operations',()=>{
  const composite=AI_ASSISTANT_SERVER_MODULES_01423.find(x=>x.id==='composite-page');
  assert.equal(composite?.status,'ready');
  for(const tool of ['composite.inspectModule','composite.moveModule','composite.resizeModule','composite.duplicateModule','composite.removeModule'])assert.ok(composite.actions.includes(tool));
  assert.equal(AI_ASSISTANT_TOOL_META_01423['composite.removeModule'].risk,'high');
});

test('01423 validates move resize and remove tool arguments',()=>{
  assert.equal(validateAiAssistantToolArgs01423('composite.moveModule',{sectionId:'s1',index:2}).ok,true);
  assert.equal(validateAiAssistantToolArgs01423('composite.moveModule',{sectionId:'s1',index:-1}).ok,false);
  assert.equal(validateAiAssistantToolArgs01423('composite.resizeModule',{sectionId:'s1',height:320}).args.height,320);
  assert.equal(validateAiAssistantToolArgs01423('composite.removeModule',{}).ok,false);
});

test('01423 planner preserves shared module-host actions and dependencies',()=>{
  const caps=normalizeAiAssistantCapabilities01423([{id:'composite-page',status:'ready',actions:['composite.inspectModule','composite.moveModule','composite.resizeModule']}]);
  const plan=sanitizeAiAssistantPlan01423({actions:[
    {stepId:'inspect',module:'composite-page',tool:'composite.inspectModule',args:{sectionId:'s1'}},
    {stepId:'move',module:'composite-page',tool:'composite.moveModule',args:{sectionId:'s1',index:1},dependsOn:['inspect']},
    {stepId:'resize',module:'composite-page',tool:'composite.resizeModule',args:{sectionId:'s1',height:280},dependsOn:['move']}
  ]},caps,{maxPlanSteps:12});
  assert.equal(plan.actions.length,3);
  assert.deepEqual(plan.actions[1].dependsOn,['inspect']);
  assert.equal(plan.actions[1].schemaValid,true);
  assert.equal(plan.actions[2].schemaValid,true);
});

test('01423 backend routes service stage through current server',()=>{
  const server=read('src/server.mjs');
  assert.match(server,/ai-assistant-service-01423\.mjs/);
  assert.match(server,/AI_ASSISTANT_ROUTE_NOT_FOUND_01423/);
});
