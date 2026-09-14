import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const backendRoot=path.resolve(here,'..');
const repoRoot=path.resolve(backendRoot,'..');

function text(file){return fs.readFileSync(file,'utf8');}

test('01194 backend release metadata and Render entrypoint are synchronized',async()=>{
  const pkg=JSON.parse(text(path.join(backendRoot,'package.json')));
  const lock=JSON.parse(text(path.join(backendRoot,'package-lock.json')));
  const server=text(path.join(backendRoot,'src','server.mjs'));
  const render=text(path.join(repoRoot,'render.yaml'));
  const {config}=await import(`../src/config.mjs?release01194=${Date.now()}`);

  assert.equal(pkg.name,'shifttime-commerce-backend-01194');
  assert.equal(pkg.version,'0.11.94');
  assert.equal(lock.name,pkg.name);
  assert.equal(lock.version,pkg.version);
  assert.equal(lock.packages[''].name,pkg.name);
  assert.equal(lock.packages[''].version,pkg.version);
  assert.equal(config.stage,'01194');
  assert.match(server,/stage:config\.stage/);
  assert.match(render,/startCommand:\s*npm run db:migrate && npm start/);
});

test('01194 production CORS accepts canonical Builder Live Server origin',async()=>{
  const {resolveCorsOrigin01089}=await import('../src/http-utils.mjs');
  const configured='https://designer-shifttime.netlify.app,http://localhost:*,http://127.0.0.1:*';
  assert.equal(
    resolveCorsOrigin01089({requestOrigin:'http://127.0.0.1:5544',corsOrigin:configured,nodeEnv:'production'}),
    'http://127.0.0.1:5544'
  );
  assert.equal(
    resolveCorsOrigin01089({requestOrigin:'https://evil.example',corsOrigin:configured,nodeEnv:'production'}),
    ''
  );
  const render=text(path.join(repoRoot,'render.yaml'));
  assert.match(render,/CORS_ALLOWLIST/);
  assert.match(render,/http:\/\/127\.0\.0\.1:\*/);
});
