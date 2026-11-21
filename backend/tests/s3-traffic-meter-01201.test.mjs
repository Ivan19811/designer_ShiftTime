import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('01201 S3/R2 provider routes backend PutObject bytes through integration meter',()=>{
  const source=fs.readFileSync(path.join(root,'src/storage-providers/s3-compatible-storage-provider.mjs'),'utf8');
  assert.match(source,/recordIntegrationTraffic01201/);
  assert.match(source,/integration:this\.type==='r2'\?'r2':'s3'/);
  assert.match(source,/routeKey:`PUT \$\{this\.type==='r2'\?'r2':'s3'\}:\/\/:bucket\/:object`/);
  assert.match(source,/outboundBytes:bodyBytes01201\(body\)/);
});
