import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAiAssistantInstructions01424} from '../src/ai-assistant-core-01424.mjs';

const service=fs.readFileSync(new URL('../src/ai-assistant-service-01424.mjs',import.meta.url),'utf8');
const core=fs.readFileSync(new URL('../src/ai-assistant-core-01424.mjs',import.meta.url),'utf8');

test('01431 analyze task explicitly overrides prepare/execute planning',()=>{
  const instructions=buildAiAssistantInstructions01424({mode:'prepare',taskMode:'analyze'});
  assert.match(instructions,/TaskMode rules take precedence/);
  assert.match(instructions,/ANALYZE MODE OVERRIDES EXECUTION MODE/);
  assert.match(instructions,/actions MUST be an empty array/);
  assert.match(instructions,/NEVER replace the analysis with marketplace\.open/);
});

test('01431 backend forcibly strips actions from import analysis',()=>{
  assert.match(service,/isImportAnalyze=taskMode==='analyze'/);
  assert.match(service,/sanitized=isImportAnalyze\?\{\.\.\.rawSanitized,actions:\[\]\}:rawSanitized/);
  assert.match(service,/dictionaryMismatches/);
  assert.match(service,/stage:'01431'/);
});

test('01431 backend stage is current and has no Cyrillic UI literals',()=>{
  assert.match(core,/AI_ASSISTANT_STAGE_01424='01431'/);
  assert.doesNotMatch(service,/[А-Яа-яІіЇїЄєҐґ]/u);
});
