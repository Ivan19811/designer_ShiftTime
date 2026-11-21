// 01618C: Regression for SQL 42703: missing b.source_revision_id.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../src/site-test-change-workflow-01618.mjs',import.meta.url),'utf8');
const branchesMigration=readFileSync(new URL('../sql/072_site_test_workflow_01613d.sql',import.meta.url),'utf8');
const revisionsMigration=readFileSync(new URL('../sql/022_site_revision_workspaces.sql',import.meta.url),'utf8');
const selectedChangesMigration=readFileSync(new URL('../sql/077_site_test_selected_changes_01618.sql',import.meta.url),'utf8');

function sqlForSubmitted(){
 const match=workflow.match(/async function submitted\([\s\S]*?const q=await c\.query\(`([\s\S]*?)`,params\)/);
 assert.ok(match,'Expected submitted() to query the immutable revision/baseline');
 return match[1];
}

test('01618C: selected-changes source JOIN uses revision lineage r.source_revision_id, never branch b.source_revision_id',()=>{
 const query=sqlForSubmitted();
 assert.match(query,/JOIN shifttime_builder_site_revisions r ON r\.id=b\.revision_id AND r\.site_id=b\.site_id/);
 assert.match(query,/JOIN shifttime_builder_site_revisions s ON s\.id=r\.source_revision_id AND s\.site_id=b\.site_id/);
 assert.doesNotMatch(query,/\bb\.source_revision_id\b/);
 assert.match(query,/b\.review_snapshot_sha/);
 assert.match(query,/AND b\.state IN \('in_review','approved'\)/);
});

test('01618C: SQL schemas confirm source_revision_id belongs to revisions, not branches',()=>{
 assert.match(revisionsMigration,/\bsource_revision_id\s+text\b/);
 assert.doesNotMatch(branchesMigration,/\bsource_revision_id\s+text\b/);
 assert.match(branchesMigration,/\brevision_id\s+text\s+NOT NULL UNIQUE/);
 assert.match(selectedChangesMigration,/CREATE TABLE IF NOT EXISTS shifttime_site_test_change_batches_01618/);
});

test('01618C: baseline is sourced from immutable revision, not mutable original project',()=>{
 const query=sqlForSubmitted();
 assert.match(query,/r\.project_json\s*,s\.project_json AS baseline/);
 assert.doesNotMatch(query,/shifttime_builder_site_projects\s+(?:AS\s+)?s\b/i);
 assert.match(workflow,/projectSha01613D\(b\.project_json\)!==b\.review_snapshot_sha/);
});
