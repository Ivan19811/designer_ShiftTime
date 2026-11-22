import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');

test('01194 server attaches central HTTP traffic meter and authorized scope',()=>{
  assert.match(src,/attachHttpTrafficMeter01194\(req,res\)/);
  assert.match(src,/setTrafficScope01194\(res,/);
});

test('01194 server exposes account-scoped admin traffic summary and events routes',()=>{
  assert.match(src,/p\[3\]==='traffic'.*p\[4\]==='summary'/s);
  assert.match(src,/p\[3\]==='traffic'.*p\[4\]==='events'/s);
  assert.match(src,/admin\.traffic\.view/);
});
