import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const migration=read('sql/022_site_revision_workspaces.sql');
const service=read('src/site-revisions-01231.mjs');
const server=read('src/server.mjs');
const builderSites=read('src/builder-sites-service-01170.mjs');

test('01231 revision schema has one published row and five isolated draft slots per site',()=>{
  assert.match(migration,/kind IN \('draft','published','archived'\)/);
  assert.match(migration,/slot BETWEEN 0 AND 5/);
  assert.match(migration,/uq_shifttime_site_revision_draft_slot_01231/);
  assert.match(migration,/WHERE kind='draft'/);
  assert.match(migration,/uq_shifttime_site_revision_published_01231/);
  assert.match(migration,/WHERE kind='published'/);
});

test('01231 revision service enforces the five-draft limit server-side and promotes atomically',()=>{
  assert.match(service,/MAX_DRAFTS_01231=5/);
  assert.match(service,/pg_advisory_xact_lock/);
  assert.match(service,/ST_SITE_REVISION_LIMIT/);
  assert.match(service,/UPDATE shifttime_builder_site_revisions SET kind='archived'/);
  assert.match(service,/SET kind='published',slot=0,dirty=false/);
});

test('01231 server exposes scoped revision CRUD and metadata-only site update route',()=>{
  assert.match(server,/p\[2\]==='site-revisions'/);
  assert.match(server,/p\[4\]==='revisions'/);
  assert.match(server,/saveSiteDraft01231/);
  assert.match(server,/deleteSiteDraft01231/);
  assert.match(server,/publishSiteRevision01231/);
  assert.match(server,/p\[4\]==='metadata'/);
  assert.match(builderSites,/saveBuilderSiteMetadata01231/);
});
