import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('01170 server exposes authenticated scoped Builder site CRUD routes',()=>{
  assert.match(server,/builder-sites-service-01170\.mjs/);
  assert.match(server,/p\[2\]==='sites'.*req\.method==='GET'.*p\.length===3.*listBuilderSites01170\(scope\)/s);
  assert.match(server,/p\[2\]==='sites'.*p\[3\].*req\.method==='GET'.*p\.length===4.*getBuilderSite01170\(scope,p\[3\]\)/s);
  assert.match(server,/p\[2\]==='sites'.*req\.method==='POST'.*p\.length===3.*assertWriteRole\(scope\).*createBuilderSite01170\(scope,session\.userId/s);
  assert.match(server,/p\[2\]==='sites'.*p\[3\].*req\.method==='PUT'.*p\.length===4.*assertWriteRole\(scope\).*saveBuilderSite01170\(scope,session\.userId,p\[3\]/s);
  assert.match(server,/p\[2\]==='sites'.*p\[3\].*req\.method==='DELETE'.*p\.length===4.*assertAdminRole\(scope\).*deleteBuilderSite01170\(scope,session\.userId,p\[3\]\)/s);
  assert.match(server,/readJson\(req,\{limit:32\*1024\*1024\}\)/);
});

test('01170 backend check includes cloud site modules',()=>{
  assert.match(pkg.scripts.check,/builder-sites-core-01170\.mjs/);
  assert.match(pkg.scripts.check,/builder-sites-service-01170\.mjs/);
});
