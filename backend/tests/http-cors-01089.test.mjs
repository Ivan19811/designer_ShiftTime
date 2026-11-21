import test from 'node:test';
import assert from 'node:assert/strict';

const mod=await import('../src/http-utils.mjs');

test('01089 development CORS accepts localhost and 127.0.0.1 on changing Live Server ports',()=>{
  assert.equal(typeof mod.resolveCorsOrigin01089,'function');
  const configured='http://127.0.0.1:5532';
  assert.equal(mod.resolveCorsOrigin01089({requestOrigin:'http://127.0.0.1:5531',corsOrigin:configured,nodeEnv:'development'}),'http://127.0.0.1:5531');
  assert.equal(mod.resolveCorsOrigin01089({requestOrigin:'http://localhost:7777',corsOrigin:configured,nodeEnv:'development'}),'http://localhost:7777');
});

test('01089 production CORS remains strict',()=>{
  assert.equal(typeof mod.resolveCorsOrigin01089,'function');
  const configured='https://studio.example.com,http://127.0.0.1:5532';
  assert.equal(mod.resolveCorsOrigin01089({requestOrigin:'https://studio.example.com',corsOrigin:configured,nodeEnv:'production'}),'https://studio.example.com');
  assert.equal(mod.resolveCorsOrigin01089({requestOrigin:'http://127.0.0.1:5531',corsOrigin:configured,nodeEnv:'production'}),'');
  assert.equal(mod.resolveCorsOrigin01089({requestOrigin:'https://evil.example',corsOrigin:configured,nodeEnv:'production'}),'');
});
