import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const render=fs.readFileSync(new URL('../../render.yaml',import.meta.url),'utf8');
const env=fs.readFileSync(new URL('../.env.example',import.meta.url),'utf8');
const verify=fs.readFileSync(new URL('../scripts/db-verify.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('01143 Render applies migration and starts the real ESM backend entrypoint',()=>{
  assert.match(render,/startCommand:\s*npm run db:migrate && npm start/);
  assert.doesNotMatch(render,/src\/server\.js/);
  assert.match(render,/NETLIFY_AUTH_TOKEN/);
  assert.match(render,/NETLIFY_API_BASE_URL/);
  assert.match(render,/PUBLIC_API_BASE_URL/);
});

test('01143 backend documents and verifies publishing persistence',()=>{
  assert.match(env,/NETLIFY_AUTH_TOKEN=/);
  assert.match(env,/NETLIFY_API_BASE_URL=https:\/\/api\.netlify\.com\/api\/v1/);
  assert.match(env,/PUBLIC_API_BASE_URL=https:\/\/designer-shifttime\.onrender\.com/);
  assert.match(verify,/shifttime_published_sites/);
  assert.match(verify,/shifttime_site_deployments/);
  assert.match(pkg.scripts.check,/site-publishing-service-01143\.mjs/);
  assert.match(pkg.scripts.check,/netlify-client-01143\.mjs/);
});
