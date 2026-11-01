import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {gzipSync} from 'node:zlib';
import {readSitePublishingJson01609C,SITE_PUBLISH_MAX_JSON_BYTES_01609C} from '../src/site-publish-upload-01609c.mjs';
const request=(buf,encoding='identity')=>Object.assign(Readable.from([buf]),{headers:{'content-encoding':encoding,'content-length':String(buf.length)}});
test('01609C accepts backwards compatible uncompressed publication',async()=>{
  const data={site:{id:'test'},files:[{path:'index.html',content:'ok',encoding:'utf8'}]};
  assert.deepEqual(await readSitePublishingJson01609C(request(Buffer.from(JSON.stringify(data)))),data);
});
test('01609C accepts compressed publication larger than former 32 MiB limit',async()=>{
  const data={site:{id:'test'},files:[{path:'index.html',content:'a'.repeat(34*1024*1024),encoding:'utf8'}]};
  const compressed=gzipSync(Buffer.from(JSON.stringify(data)));
  assert.ok(compressed.length<32*1024*1024);
  const parsed=await readSitePublishingJson01609C(request(compressed,'gzip'));
  assert.equal(parsed.files[0].content.length,34*1024*1024);
});
test('01609C rejects broken compressed publication',async()=>{
  await assert.rejects(readSitePublishingJson01609C(request(Buffer.from('invalid'), 'gzip')),{statusCode:400,code:'ST_PUBLISH_GZIP_INVALID_01609C'});
});
test('01609C rejects unsupported content encoding and advertised oversized payload',async()=>{
  await assert.rejects(readSitePublishingJson01609C(request(Buffer.from('{}'),'br')),{statusCode:415});
  const req=request(Buffer.from('{}'),'gzip');req.headers['content-length']=String(33*1024*1024);
  await assert.rejects(readSitePublishingJson01609C(req),{statusCode:413});
});
test('01609C rejects oversized decompressed body',async()=>{
  const zipped=gzipSync(Buffer.from('a'.repeat(SITE_PUBLISH_MAX_JSON_BYTES_01609C+1)));
  await assert.rejects(readSitePublishingJson01609C(request(zipped,'gzip')),{statusCode:413});
});
