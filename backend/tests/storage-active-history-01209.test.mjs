import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('01209 provider measures physical account-prefix object count and bytes with ListObjects pagination',()=>{
  const source=read('src/storage-providers/s3-compatible-storage-provider.mjs');
  assert.match(source,/ListObjectsV2Command/);
  assert.match(source,/measurePrefixUsage01209/);
  assert.match(source,/MaxKeys:1000/);
  assert.match(source,/ContinuationToken/);
  assert.match(source,/NextContinuationToken/);
  assert.match(source,/fileCount\+\+/);
  assert.match(source,/bytes\+=Math\.max\(0,Number\(item\?\.Size\)\|\|0\)/);
});

test('01209 traffic summary separates upload history from physical active object storage',()=>{
  const active=read('src/storage-active-usage-01209.mjs');
  const traffic=read('src/traffic-service-01194.mjs');
  assert.match(active,/measureAuthorizedCloudStorageUsage01209/);
  assert.match(active,/accounts\/\$\{safeSegment\(scope\.accountId\)\}\//);
  assert.match(traffic,/uploaded_file_count/);
  assert.match(traffic,/activeFileCount/);
  assert.match(traffic,/activeBytes/);
  assert.match(traffic,/measureActiveStorage01209/);
  assert.match(traffic,/stage:'01209'/);
  assert.match(traffic,/http\+service-payload-v6-storage-active-history/);
});
