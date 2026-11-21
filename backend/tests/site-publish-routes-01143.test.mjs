import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');

test('01143 server exposes authenticated site publish and publish-status routes',()=>{
  assert.match(server,/site-publishing-service-01143\.mjs/);
  assert.match(server,/p\[2\]==='sites'.*p\[4\]==='publish-status'/s);
  assert.match(server,/getSitePublishStatus01143\(scope,p\[3\]\)/);
  assert.match(server,/p\[2\]==='sites'.*p\[4\]==='publish'/s);
  assert.match(server,/assertWriteRole\(scope\).*publishSite01143\(scope,session\.userId,p\[3\]/s);
  assert.match(server,/readJson\(req,\{limit:32\*1024\*1024\}\)/);
});
