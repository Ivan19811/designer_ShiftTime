import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createNetlifyClient01143} from '../src/netlify-client-01143.mjs';

function response(status,body={}){
  return {ok:status>=200&&status<300,status,async text(){return body===null?'':JSON.stringify(body);}};
}
function sha1(value){return crypto.createHash('sha1').update(value).digest('hex');}

test('01147 Netlify digest deploy posts SHA1 manifest and uploads only required files',async()=>{
  const home=Buffer.from('<h1>HOME</h1>');
  const about=Buffer.from('<h1>ABOUT</h1>');
  const homeSha=sha1(home),aboutSha=sha1(about);
  const calls=[];
  const fetchImpl=async(url,options={})=>{
    calls.push({url,options});
    if(url.endsWith('/sites/site_1/deploys')){
      assert.equal(options.method,'POST');
      assert.equal(options.headers['content-type'],'application/json');
      assert.deepEqual(JSON.parse(options.body),{files:{'/about-us/index.html':aboutSha,'/index.html':homeSha}});
      return response(201,{id:'dep_47',state:'uploading',required:[homeSha,aboutSha]});
    }
    if(url.endsWith('/deploys/dep_47/files/index.html')){
      assert.equal(options.method,'PUT');
      assert.equal(options.headers['content-type'],'application/octet-stream');
      assert.equal(options.body,home);
      return response(200,{path:'/index.html',sha:homeSha});
    }
    if(url.endsWith('/deploys/dep_47/files/about-us%2Findex.html')){
      assert.equal(options.method,'PUT');
      assert.equal(options.headers['content-type'],'application/octet-stream');
      assert.equal(options.body,about);
      return response(200,{path:'/about-us/index.html',sha:aboutSha});
    }
    return response(404,{message:'not found'});
  };
  const client=createNetlifyClient01143({token:'secret',fetchImpl});
  const deploy=await client.deployFiles({siteId:'site_1',files:new Map([
    ['index.html',home],
    ['about-us/index.html',about],
  ])});
  assert.equal(deploy.id,'dep_47');
  assert.equal(calls.length,3);
});

test('01147 Netlify client can verify current published root index file',async()=>{
  const calls=[];
  const client=createNetlifyClient01143({token:'secret',fetchImpl:async(url,options={})=>{
    calls.push({url,options});
    if(url.endsWith('/sites/site_1/files/index.html'))return response(200,{path:'/index.html',sha:'abc',mime_type:'text/html',size:123});
    return response(404,{message:'not found'});
  }});
  const file=await client.getSiteFile({siteId:'site_1',path:'index.html'});
  assert.equal(file.path,'/index.html');
  assert.equal(calls[0].options.method,'GET');
});
