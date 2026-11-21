import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {sanitizeAiAssistantPlan01422,validateAiAssistantToolArgs01422,normalizeAiAssistantCapabilities01422,AI_ASSISTANT_TOOL_META_01422} from '../src/ai-assistant-core-01422.mjs';

const root=path.resolve(import.meta.dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('01422 planner keeps dependencies, sequence and schema status',()=>{
  const caps=normalizeAiAssistantCapabilities01422([{id:'composite-page',status:'partial',actions:['composite.inspect','composite.insertModuleSlot']},{id:'tables',status:'ready',actions:['tables.create','tables.insertCurrentPage']}]);
  const plan=sanitizeAiAssistantPlan01422({actions:[
    {stepId:'slot',module:'composite-page',tool:'composite.insertModuleSlot',args:{moduleId:'music-studio'}},
    {stepId:'table',module:'tables',tool:'tables.create',args:{name:'Demo',insertCurrentPage:true},dependsOn:['slot']}
  ]},caps,{maxPlanSteps:12});
  assert.equal(plan.actions.length,2);
  assert.equal(plan.actions[0].sequence,1);
  assert.equal(plan.actions[0].schemaValid,true);
  assert.deepEqual(plan.actions[1].dependsOn,['slot']);
  assert.equal(plan.actions[1].sequence,2);
});

test('01422 tool schemas reject unsupported composite modules and missing ids',()=>{
  assert.equal(validateAiAssistantToolArgs01422('composite.insertModuleSlot',{moduleId:'music-studio'}).ok,true);
  assert.equal(validateAiAssistantToolArgs01422('composite.insertModuleSlot',{moduleId:'unknown-branch'}).ok,false);
  assert.equal(validateAiAssistantToolArgs01422('composite.removeModuleSlot',{}).ok,false);
  assert.equal(AI_ASSISTANT_TOOL_META_01422['composite.removeModuleSlot'].risk,'high');
});

test('01422 migration extends durable action queue state',()=>{
  const sql=read('sql/041_ai_assistant_orchestrator.sql');
  for(const token of ['plan_id','step_id','sequence_no','depends_on','execution_meta','undone','idx_ai_assistant_actions_plan_01422'])assert.match(sql,new RegExp(token));
});
