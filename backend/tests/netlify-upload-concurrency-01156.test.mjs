import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createNetlifyClient01143} from '../src/netlify-client-01143.mjs';

function response(status,body={}){return {ok:status>=200&&status<300,status,async text(){return JSON.stringify(body);}};}
function sha1(value){return crypto.createHash('sha1').update(value).digest('hex');}

test('01156 Netlify required blobs upload with bounded concurrency of four',async()=>{
  const files=new Map(Array.from({length:9},(_,i)=>[`assets/f${i}.bin`,Buffer.from(`file-${i}`)]));
  const required=[...files.values()].map(sha1);
  let active=0,maxActive=0,puts=0;
  const client=createNetlifyClient01143({token:'secret',fetchImpl:async(url,options={})=>{
    if(url.endsWith('/sites/site_1/deploys'))return response(201,{id:'dep_56',state:'uploading',required});
    if(url.includes('/deploys/dep_56/files/')){
      puts++;active++;maxActive=Math.max(maxActive,active);
      await new Promise(resolve=>setTimeout(resolve,12));
      active--;return response(200,{ok:true});
    }
    return response(404,{message:'not found'});
  }});
  await client.deployFiles({siteId:'site_1',files});
  assert.equal(puts,9);
  assert.ok(maxActive>1,'uploads should be parallel');
  assert.ok(maxActive<=4,`max concurrency must be <= 4, got ${maxActive}`);
});
