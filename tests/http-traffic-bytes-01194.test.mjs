import test from 'node:test';
import assert from 'node:assert/strict';
import {readJson,readBuffer,sendJson,sendNoContent} from '../src/http-utils.mjs';

function requestFrom(buffer){return {async *[Symbol.asyncIterator](){yield buffer;}};}
function fakeResponse(){return {statusCode:0,headers:{},endedBody:null,writeHead(status,headers){this.statusCode=status;this.headers={...headers};},end(body){this.endedBody=body??null;}};}

test('01194 readJson records exact UTF-8 request payload bytes',async()=>{
  const raw=Buffer.from(JSON.stringify({text:'Привіт'}),'utf8');
  const req=requestFrom(raw);
  assert.deepEqual(await readJson(req),{text:'Привіт'});
  assert.equal(req.__stTrafficInboundBytes01194,raw.length);
});

test('01194 readBuffer records binary request payload bytes',async()=>{
  const raw=Buffer.from([0,1,2,3,4,255]);
  const req=requestFrom(raw);
  assert.deepEqual(await readBuffer(req),raw);
  assert.equal(req.__stTrafficInboundBytes01194,raw.length);
});

test('01194 sendJson records exact response body bytes without changing payload',()=>{
  const res=fakeResponse();
  const payload={ok:true,text:'Україна'};
  sendJson(res,200,payload);
  const expected=Buffer.byteLength(JSON.stringify(payload));
  assert.equal(res.__stTrafficOutboundBytes01194,expected);
  assert.equal(Number(res.headers['content-length']),expected);
  assert.equal(res.endedBody,JSON.stringify(payload));
});

test('01194 no-content response records zero outbound payload bytes',()=>{
  const res=fakeResponse();
  sendNoContent(res,204);
  assert.equal(res.__stTrafficOutboundBytes01194,0);
});
