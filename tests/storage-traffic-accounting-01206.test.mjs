import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as trafficIntegration from '../src/traffic-integration-01201.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('01206 builds non-Render-billable direct storage events from verified object bytes',()=>{
  assert.equal(typeof trafficIntegration.buildStorageTrafficEvent01206,'function');
  const event=trafficIntegration.buildStorageTrafficEvent01206({
    context:{requestId:'req_complete_1',accountId:'acc_1',workspaceId:'ws_1',storeId:'store_1',actorUserId:'u_1',siteId:'site_1'},
    integration:'r2',operation:'media.direct-upload',trafficClass:'direct-storage',assetId:'asset_1',storageBytes:543210,contentType:'image/webp',objectKey:'accounts/acc_1/workspaces/ws_1/stores/store_1/media/uploads/asset_1/a.webp',statusCode:200,result:'success'
  });
  assert.equal(event.eventType,'storage');
  assert.equal(event.integration,'r2');
  assert.equal(event.operation,'media.direct-upload');
  assert.equal(event.siteId,'site_1');
  assert.equal(event.storageBytes,543210);
  assert.equal(event.renderBillableOutboundBytes,0);
  assert.equal(event.inboundBytes,0);
  assert.equal(event.outboundBytes,0);
  assert.equal(event.trafficClass,'direct-storage');
  assert.equal(event.metadata.contentType,'image/webp');
  assert.equal(event.metadata.objectKey,'accounts/acc_1/workspaces/ws_1/stores/store_1/media/uploads/asset_1/a.webp');
  assert.match(event.dedupeKey,/asset_1/);
});

test('01206 media completion records verified HEAD bytes and separates direct from proxy storage',()=>{
  const source=read('src/media-cloud-service.mjs');
  assert.match(source,/recordStorageTraffic01206/);
  assert.match(source,/resolveAuthorizedMediaTrafficSite01206/);
  assert.match(source,/media\.direct-upload/);
  assert.match(source,/media\.proxy-upload/);
  assert.match(source,/storageBytes\s*:\s*head\.sizeBytes/);
  assert.match(source,/trafficClass\s*:\s*['"]direct-storage['"]/);
  assert.match(source,/trafficClass\s*:\s*['"]proxy-storage['"]/);
});

test('01206 traffic storage schema persists class, verified storage bytes, and safe metadata',()=>{
  const migrationPath=path.join(root,'sql','020_traffic_storage_accounting.sql');
  assert.equal(fs.existsSync(migrationPath),true);
  const sql=read('sql/020_traffic_storage_accounting.sql');
  assert.match(sql,/storage_bytes/i);
  assert.match(sql,/traffic_class/i);
  assert.match(sql,/metadata\s+jsonb/i);
  const recorder=read('src/traffic-recorder-01194.mjs');
  assert.match(recorder,/storage_bytes/);
  assert.match(recorder,/traffic_class/);
  assert.match(recorder,/metadata/);
});
