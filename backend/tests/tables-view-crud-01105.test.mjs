import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('01105 backend exposes authorized create/delete View service functions',()=>{
  const source=read('src/tables-service-01092.mjs');
  assert.match(source,/export async function createAuthorizedTableView01092/);
  assert.match(source,/getAuthorizedTableRow\(client,scope,userId,tableId,'write'\)/);
  assert.match(source,/INSERT INTO shifttime_table_views/);
  assert.match(source,/export async function deleteAuthorizedTableView01092/);
  assert.match(source,/COUNT\(\*\).*shifttime_table_views/s);
  assert.match(source,/DELETE FROM shifttime_table_views/);
});

test('01105 server routes POST and DELETE /tables/:tableId/views through authorized services',()=>{
  const source=read('src/server.mjs');
  assert.match(source,/resource==='views'&&req\.method==='POST'&&!resourceId/);
  assert.match(source,/createAuthorizedTableView01092/);
  assert.match(source,/resource==='views'&&req\.method==='DELETE'&&resourceId/);
  assert.match(source,/deleteAuthorizedTableView01092/);
});
