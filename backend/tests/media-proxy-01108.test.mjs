import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('STEP 6-03 http utils expose bounded raw buffer reader',async()=>{
  const mod=await import('../src/http-utils.mjs');
  assert.equal(typeof mod.readBuffer,'function');
  const req={async *[Symbol.asyncIterator](){yield Buffer.from('abc');yield Buffer.from('def');}};
  const out=await mod.readBuffer(req,{limit:6});
  assert.equal(out.toString(),'abcdef');
  await assert.rejects(()=>mod.readBuffer({async *[Symbol.asyncIterator](){yield Buffer.alloc(7);}}, {limit:6}),/too large/i);
});

test('STEP 6-03 backend storage provider implements direct PutObject for proxy transport',()=>{
  const contract=fs.readFileSync(path.join(root,'src/storage-provider-contract.mjs'),'utf8');
  const provider=fs.readFileSync(path.join(root,'src/storage-providers/s3-compatible-storage-provider.mjs'),'utf8');
  assert.match(contract,/createUploadUrl','putObject','headObject/);
  assert.match(provider,/async putObject\(\{key,body,mimeType='application\/octet-stream'\}/);
  assert.match(provider,/new PutObjectCommand\(\{Bucket:this\.bucket,Key:key,ContentType:mimeType,Body:body\}\)/);
});

test('STEP 6-03 media proxy service is image-only, hashes server bytes and server route consumes raw body',()=>{
  const service=fs.readFileSync(path.join(root,'src/media-cloud-service.mjs'),'utf8');
  const server=fs.readFileSync(path.join(root,'src/server.mjs'),'utf8');
  assert.match(service,/export function validateProxyMediaUpload01108/);
  assert.match(service,/mimeType\.startsWith\('image\/'\)/);
  assert.match(service,/crypto\.createHash\('sha256'\)\.update\(bytes\)\.digest\('hex'\)/);
  assert.match(service,/export async function uploadAuthorizedCloudMediaBytes01108/);
  assert.match(service,/source:'backend-proxy-upload-01108-603'/);
  assert.match(server,/p\[3\]==='uploads'&&p\[4\]==='proxy'/);
  assert.match(server,/readBuffer\(req,\{limit:config\.mediaMaxUploadBytes\}\)/);
  assert.match(server,/uploadAuthorizedCloudMediaBytes01108/);
});
