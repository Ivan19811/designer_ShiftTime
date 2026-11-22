import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('01194 migration stores account-scoped traffic bytes with dedupe and time indexes',()=>{
  const sql=fs.readFileSync(new URL('../sql/018_traffic_control_foundation.sql',import.meta.url),'utf8');
  assert.match(sql,/CREATE TABLE IF NOT EXISTS shifttime_traffic_events/i);
  assert.match(sql,/dedupe_key text NOT NULL UNIQUE/i);
  assert.match(sql,/render_billable_outbound_bytes bigint/i);
  assert.match(sql,/account_id,occurred_at DESC/i);
});
