import test from 'node:test';
import assert from 'node:assert/strict';
import {createNetlifyClient01143} from '../src/netlify-client-01143.mjs';

function response(status,body={}){
  return {ok:status>=200&&status<300,status,async text(){return JSON.stringify(body);}};
}

test('01143 Netlify client refuses privileged calls without server token',async()=>{
  const client=createNetlifyClient01143({token:'',fetchImpl:async()=>{throw new Error('must not fetch');}});
  await assert.rejects(()=>client.createSite({name:'demo-site'}),err=>{
    assert.equal(err.statusCode,503);
    assert.match(err.message,/NETLIFY_AUTH_TOKEN/);
    assert.doesNotMatch(err.message,/Bearer/i);
    return true;
  });
});

test('01143 Netlify client creates a site, deploys ZIP and reads deploy state',async()=>{
  const calls=[];
  const fetchImpl=async(url,options={})=>{
    calls.push({url,options});
    if(url.endsWith('/sites'))return response(201,{id:'site_1',name:'demo-site',url:'http://demo.netlify.app',ssl_url:'https://demo.netlify.app',admin_url:'https://app.netlify.com/sites/demo-site'});
    if(url.endsWith('/sites/site_1/deploys'))return response(201,{id:'dep_1',state:'uploading'});
    if(url.endsWith('/deploys/dep_1'))return response(200,{id:'dep_1',state:'ready'});
    return response(404,{message:'not found'});
  };
  const client=createNetlifyClient01143({token:'secret-token',fetchImpl,baseUrl:'https://api.netlify.com/api/v1'});
  const site=await client.createSite({name:'demo-site'});
  assert.equal(site.id,'site_1');
  const zip=Buffer.from('PK-test');
  const deploy=await client.deployZip({siteId:'site_1',zip});
  assert.equal(deploy.id,'dep_1');
  const state=await client.getDeploy({deployId:'dep_1'});
  assert.equal(state.state,'ready');
  assert.equal(calls.length,3);
  assert.equal(calls[0].options.method,'POST');
  assert.equal(calls[0].options.headers.authorization,'Bearer secret-token');
  assert.deepEqual(JSON.parse(calls[0].options.body),{name:'demo-site'});
  assert.equal(calls[1].options.headers['content-type'],'application/zip');
  assert.equal(calls[1].options.body,zip);
  assert.equal(calls[2].options.method,'GET');
});

test('01146 safe site creation tries a readable shifttime fallback before a random suffix',async()=>{
  const names=[];
  const fetchImpl=async(url,options={})=>{
    if(!url.endsWith('/sites'))return response(404,{});
    const name=JSON.parse(options.body).name;names.push(name);
    if(names.length<=2)return response(422,{message:'Site name already exists'});
    return response(201,{id:'site_2',name,url:`http://${name}.netlify.app`,ssl_url:`https://${name}.netlify.app`});
  };
  const client=createNetlifyClient01143({token:'super-secret',fetchImpl,randomSuffix:()=> 'a1b2c3'});
  const site=await client.createSiteWithSafeName({preferredName:'my-store'});
  assert.equal(names[0],'my-store');
  assert.equal(names[1],'my-store-shifttime');
  assert.equal(names[2],'my-store-a1b2c3');
  assert.equal(site.id,'site_2');
});

test('01170 Netlify client deletes a site by id',async()=>{
  const calls=[];
  const fetchImpl=async(url,options={})=>{calls.push({url,options});return response(204,{});};
  const client=createNetlifyClient01143({token:'secret-token',fetchImpl});
  const out=await client.deleteSite({siteId:'site_delete_1'});
  assert.deepEqual(out,{deleted:true,alreadyMissing:false});
  assert.match(calls[0].url,/\/sites\/site_delete_1$/);
  assert.equal(calls[0].options.method,'DELETE');
});

test('01170 Netlify delete treats 404 as already missing',async()=>{
  const client=createNetlifyClient01143({token:'secret-token',fetchImpl:async()=>response(404,{message:'Not found'})});
  const out=await client.deleteSite({siteId:'missing_site'});
  assert.deepEqual(out,{deleted:true,alreadyMissing:true});
});
