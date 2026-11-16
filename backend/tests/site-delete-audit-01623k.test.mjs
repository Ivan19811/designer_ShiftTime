import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkRevisionDeleteScope01623K as valid} from '../src/site-delete-audit-01623k.mjs';

const before={site_count:1,project_count:1,total:5,drafts:5,archived:0,target:1};
test('01623K one selected revision delete with 5 => 4 is permitted',()=>{
  assert.equal(valid(before,{...before,total:4,drafts:4,target:0}),true);
});
test('01623K deleting whole site cannot be committed',()=>{
  assert.equal(valid(before,{site_count:0,project_count:0,total:0,drafts:0,archived:0,target:0}),false);
});
test('01623K deleting 2 revisions cannot be committed',()=>{
  assert.equal(valid(before,{...before,total:3,drafts:3,target:0}),false);
});
test('01623K single revision archival is permitted',()=>{
  assert.equal(valid(before,{...before,drafts:4,archived:1},{archived:true}),true);
});
test('01623K changing other site/project data cannot be committed',()=>{
  assert.equal(valid(before,{...before,site_count:0,total:4,drafts:4,target:0}),false);
  assert.equal(valid(before,{...before,project_count:0,total:4,drafts:4,target:0}),false);
});
test('01623K production site DELETE route has an explicit kill switch and never calls destructive service',()=>{
  const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  const start=server.indexOf("if(p[2]==='sites'&&p[3]&&req.method==='DELETE'&&p.length===4)");
  const end=server.indexOf('  // 01605B',start);
  assert.ok(start>0&&end>start);
  const route=server.slice(start,end);
  assert.match(route,/ST_WHOLE_SITE_DELETE_TEMP_BLOCKED_01623K/);
  assert.doesNotMatch(route,/await deleteBuilderSite01170/);
});
