import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAiAssistantInstructions01424,AI_ASSISTANT_STAGE_01424} from '../src/ai-assistant-core-01424.mjs';

const service=fs.readFileSync(new URL('../src/ai-assistant-service-01424.mjs',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('../src/config.mjs',import.meta.url),'utf8');
const env=fs.readFileSync(new URL('../.env.example',import.meta.url),'utf8');

test('01432 Assistant has a response budget independent from the public AI Consultant',()=>{
  assert.match(config,/aiAssistantLlmMaxOutputTokens:int\(process\.env\.AI_ASSISTANT_LLM_MAX_OUTPUT_TOKENS,1200,256,2400\)/);
  assert.match(env,/AI_ASSISTANT_LLM_MAX_OUTPUT_TOKENS=1200/);
  assert.match(service,/config\.aiAssistantLlmMaxOutputTokens\|\|1200/);
  assert.doesNotMatch(service,/max_output_tokens:Math\.min\(1800,config\.aiConsultantLlmMaxOutputTokens/);
});

test('01432 provider diagnostics records incomplete/truncated Responses without storing raw response text',()=>{
  assert.match(service,/data\?\.incomplete_details\?\.reason/);
  assert.match(service,/providerDiagnostics01432=\{responseStatus,incompleteReason,rawOutputChars,parsed:/);
  assert.match(service,/AI_ASSISTANT_INCOMPLETE_/);
  assert.match(service,/rawOutputChars/);
});

test('01432 analyze contract remains read-only and requires human-readable message first',()=>{
  const instructions=buildAiAssistantInstructions01424({mode:'execute',taskMode:'analyze'});
  assert.match(instructions,/message is REQUIRED/);
  assert.match(instructions,/human-readable conclusion in message BEFORE/);
  assert.match(instructions,/Keep actions as \[\]/);
  assert.match(service,/sanitized=isImportAnalyze\?\{\.\.\.rawSanitized,actions:\[\]\}:rawSanitized/);
});

test('01432 analysis findings include validation blockers and rejected auto mappings',()=>{
  assert.match(service,/rejectedAutoMappings/);
  assert.match(service,/validationBlockers/);
  assert.match(service,/importValidation01432/);
  assert.match(service,/stage:'01432'/);
});

test('01432 backend stage is current and new Assistant service logic has no Cyrillic UI literals',()=>{
  assert.equal(AI_ASSISTANT_STAGE_01424,'01432');
  assert.doesNotMatch(service,/[А-Яа-яІіЇїЄєҐґ]/u);
});
