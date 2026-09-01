import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('01092 mounts Tables as an exclusive Builder workspace with a dedicated Inspector',()=>{
  const index=read('index.html'),builder=read('js/builder.js'),boot=read('js/builder-init.js');
  assert.match(index,/id="navTables"[^>]*data-open-panel="tables"|data-open-panel="tables"[^>]*id="navTables"/s);
  assert.match(index,/id="tablesStudioView"/);
  assert.match(index,/id="tables-panel-root"/);
  assert.match(builder,/tables:\s*document\.getElementById\('tablesStudioView'\)/);
  assert.match(builder,/builder--mainview-tables/);
  assert.match(boot,/initTablesStudio01092/);
});

test('01092 frontend keeps the required Repository boundary and PostgreSQL route contract',()=>{
  const store=read('js/tables/data/table-store-01092.js'),api=read('js/tables/repositories/api-table-repository-01092.js'),server=read('backend/src/server.mjs'),migration=read('backend/sql/014_shifttime_tables_foundation.sql');
  assert.doesNotMatch(store,/localStorage|fetch\s*\(/);
  assert.match(api,/\/tables/);
  assert.match(server,/p\[2\]==='tables'/);
  for(const table of ['shifttime_tables','shifttime_table_fields','shifttime_table_records','shifttime_table_views','shifttime_table_permissions','shifttime_table_templates'])assert.match(migration,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
});

