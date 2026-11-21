import test from 'node:test';
import assert from 'node:assert/strict';

const mod=await import('../src/http-utils.mjs');

test('01175 production CORS accepts explicitly configured loopback wildcard ports only',()=>{
  const configured='https://designer-shifttime.netlify.app,http://127.0.0.1:*,http://localhost:*';
  assert.equal(mod.resolveCorsOrigin01089({requestOrigin:'http://127.0.0.1:5544',corsOrigin:configured,nodeEnv:'production'}),'http://127.0.0.1:5544');
  assert.equal(mod.resolveCorsOrigin01089({requestOrigin:'http://127.0.0.1:5547',corsOrigin:configured,nodeEnv:'production'}),'http://127.0.0.1:5547');
  assert.equal(mod.resolveCorsOrigin01089({requestOrigin:'http://localhost:60123',corsOrigin:configured,nodeEnv:'production'}),'http://localhost:60123');
  assert.equal(mod.resolveCorsOrigin01089({requestOrigin:'https://evil.example',corsOrigin:configured,nodeEnv:'production'}),'');
  assert.equal(mod.resolveCorsOrigin01089({requestOrigin:'http://192.168.1.50:5544',corsOrigin:configured,nodeEnv:'production'}),'');
});
