import test from 'node:test';
import assert from 'node:assert/strict';
import {createZip01143,listZipEntries01143} from '../src/zip-01143.mjs';

test('01143 ZIP writer creates deterministic valid directory entries',()=>{
  const files=new Map([
    ['index.html',Buffer.from('<h1>Hello</h1>')],
    ['about/index.html',Buffer.from('About')],
  ]);
  const zip1=createZip01143(files);
  const zip2=createZip01143(files);
  assert.ok(Buffer.isBuffer(zip1));
  assert.equal(zip1.subarray(0,4).toString('hex'),'504b0304');
  assert.deepEqual(zip1,zip2);
  assert.deepEqual(listZipEntries01143(zip1),['about/index.html','index.html']);
  assert.match(zip1.toString('latin1'),/index\.html/);
  assert.match(zip1.toString('latin1'),/about\/index\.html/);
});
