import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const migration=read('sql/023_site_revision_comments.sql');
const service=read('src/site-revisions-01231.mjs');
const server=read('src/server.mjs');

test('01232 migration adds persistent revision comments',()=>{
  assert.match(migration,/ALTER TABLE shifttime_builder_site_revisions/);
  assert.match(migration,/ADD COLUMN IF NOT EXISTS comment text NOT NULL DEFAULT ''/);
});

test('01232 revision details endpoint updates comment separately from project content',()=>{
  assert.match(service,/updateSiteDraftDetails01232/);
  assert.match(service,/comment=\$2/);
  assert.match(server,/action==='details'/);
});
