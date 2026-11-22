import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const config=fs.readFileSync(new URL('../src/config.mjs',import.meta.url),'utf8');

test('01200 npm start applies pending migrations before starting Render backend',()=>{
  assert.equal(pkg.scripts.start,'npm run db:migrate && node src/server.mjs');
});

test('01200 backend advertises deployment stage 01200',()=>{
  assert.match(config,/stage:'01200'/);
});
