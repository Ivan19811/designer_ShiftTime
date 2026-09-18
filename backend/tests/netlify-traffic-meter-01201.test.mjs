import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createNetlifyClient01143} from '../src/netlify-client-01143.mjs';

const sha1=value=>crypto.createHash('sha1').update(value).digest('hex');
function response(status,body={}){const raw=body===null?'':JSON.stringify(body);return {ok:status>=200&&status<300,status,async text(){return raw;}};}

test('01201 Netlify digest publish meters manifest and only required file PUT payloads',async()=>{
  const home=Buffer.from('HOME-01201');
  const about=Buffer.from('ABOUT-UNCHANGED');
  const homeSha=sha1(home);
  const measured=[];
  const client=createNetlifyClient01143({token:'secret',recordTraffic:event=>measured.push(event),fetchImpl:async(url,options={})=>{
    if(url.endsWith('/sites/site_1/deploys'))return response(201,{id:'dep_1',required:[homeSha]});
    if(url.endsWith('/deploys/dep_1/files/index.html'))return response(200,{ok:true});
    return response(404,{message:'not found'});
  }});
  await client.deployFiles({siteId:'site_1',files:new Map([['index.html',home],['about.html',about]])});
  assert.equal(measured.length,2);
  assert.equal(measured[0].integration,'netlify');
  assert.equal(measured[0].routeKey,'POST /sites/:siteId/deploys');
  assert.equal(measured[0].outboundBytes,Buffer.byteLength(JSON.stringify({files:{'/about.html':sha1(about),'/index.html':homeSha}})));
  assert.equal(measured[1].routeKey,'PUT /deploys/:deployId/files/:path');
  assert.equal(measured[1].outboundBytes,home.length);
  assert.ok(measured[0].inboundBytes>0);
  assert.ok(measured[1].inboundBytes>0);
});
