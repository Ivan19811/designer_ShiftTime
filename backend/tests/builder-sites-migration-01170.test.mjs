import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationUrl=new URL('../sql/017_builder_cloud_sites.sql',import.meta.url);

test('01170 migration creates scoped builder sites and versioned project JSON tables',()=>{
  const sql=fs.readFileSync(migrationUrl,'utf8');
  assert.match(sql,/CREATE TABLE IF NOT EXISTS shifttime_builder_sites/i);
  assert.match(sql,/id\s+text\s+PRIMARY KEY/i);
  assert.match(sql,/account_id\s+text\s+NOT NULL\s+REFERENCES platform_accounts\(id\) ON DELETE CASCADE/i);
  assert.match(sql,/workspace_id\s+text\s+NOT NULL\s+REFERENCES platform_workspaces\(id\) ON DELETE CASCADE/i);
  assert.match(sql,/store_id\s+text\s+NOT NULL\s+REFERENCES platform_stores\(id\) ON DELETE CASCADE/i);
  assert.match(sql,/CREATE TABLE IF NOT EXISTS shifttime_builder_site_projects/i);
  assert.match(sql,/site_id\s+text\s+PRIMARY KEY\s+REFERENCES shifttime_builder_sites\(id\) ON DELETE CASCADE/i);
  assert.match(sql,/schema_version\s+text\s+NOT NULL\s+DEFAULT '01170'/i);
  assert.match(sql,/revision\s+bigint\s+NOT NULL\s+DEFAULT 1/i);
  assert.match(sql,/project_json\s+jsonb\s+NOT NULL\s+DEFAULT '\{\}'::jsonb/i);
  assert.match(sql,/idx_shifttime_builder_sites_scope_01170/i);
});

test('01170 migration allows multiple blank draft slugs but keeps non-empty store slugs unique',()=>{
  const sql=fs.readFileSync(migrationUrl,'utf8');
  assert.doesNotMatch(sql,/UNIQUE\s*\(\s*store_id\s*,\s*slug\s*\)/i);
  assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS uq_shifttime_builder_sites_store_slug_01170[\s\S]*ON shifttime_builder_sites\s*\(\s*store_id\s*,\s*slug\s*\)[\s\S]*WHERE\s+slug\s*<>\s*''/i);
});
