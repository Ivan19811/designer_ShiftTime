import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const core=read('src/ai-assistant-core-01424.mjs');
const service=read('src/ai-assistant-service-01424.mjs');

test('01429 analyze contract requires narrative output from the model',()=>{
  assert.match(core,/ANALYZE CONTRACT/);
  assert.match(core,/message is REQUIRED/);
  assert.match(core,/summary should be a short non-empty recap/);
  assert.match(core,/do not replace the analysis with marketplace\.open/);
});

test('01429 persists deterministic import mapping findings inside the plan',()=>{
  assert.match(service,/buildAnalysisFindings01429/);
  for(const key of ['ambiguousColumns','unmappedColumns','candidateConflicts','unresolvedValueGroups','suggestedValues']) assert.match(service,new RegExp(key));
  assert.match(service,/analysisFindings=taskMode==='analyze'/);
  assert.match(service,/plan=\{planId,\.\.\.sanitized,\.\.\.\(analysisFindings\?\{analysisFindings\}:\{\}\)\}/);
});

test('01429 never loses a valid summary when message is empty',()=>{
  assert.match(service,/assistantMessage=str\(parsed\?\.message\)\|\|str\(parsed\?\.summary\)\|\|fallback\.message/);
});
