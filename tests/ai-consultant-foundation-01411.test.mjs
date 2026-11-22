import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('01411 service enforces tenant-scoped site lookup and upsert',()=>{
  const service=read('src/ai-consultant-foundation-01411.mjs');
  assert.match(service,/account_id=\$2 AND workspace_id=\$3 AND store_id=\$4/);
  assert.match(service,/ON CONFLICT\(store_id,site_id\) DO UPDATE/);
  assert.match(service,/AI_CONSULTANT_SITE_NOT_FOUND_01411/);
  const verify=read('scripts/db-verify.mjs');
  assert.match(verify,/shifttime_ai_consultants/);
  assert.match(verify,/ai-consultant-scope-integrity-01411/);
});

test('01411 server exposes only authenticated settings routes',()=>{
  const server=read('src/server.mjs');
  assert.match(server,/p\[2\]==='ai-consultant'/);
  assert.match(server,/getAiConsultantSettings01411/);
  assert.match(server,/assertWriteRole\(scope\).*saveAiConsultantSettings01411/s);
});
