import test from 'node:test';
import assert from 'node:assert/strict';
import {createSitePublishingService01143} from '../src/site-publishing-core-01143.mjs';

const scope={accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1'};
function pkg(revision='rev_1'){return {version:'01143',exporterVersion:'01151',revision,site:{id:'builder_site_1',name:'My Store',slug:'my-store'},pages:[{id:'page_home',path:'/',title:'Home',html:{header:'',main:'<h1>Home</h1>',footer:''}}],assets:[],files:[{path:'index.html',encoding:'utf8',content:'<h1>Home</h1>'}],preflight:{ok:true,exporterVersion:'01151',files:['index.html'],pages:[{pageId:'page_home',route:'/',outputPath:'index.html',ok:true}]}};}

function fakeRepo(){
  let record=null;const deployments=[];
  return {
    deployments,
    async get(){return record?structuredClone(record):null;},
    async saveIdentity(_scope,data){record={...(record||{}),...data};return structuredClone(record);},
    async recordDeploy(_scope,data){deployments.push({...data});record={...(record||{}),lastDeployId:data.netlifyDeployId,lastDeployState:data.state,requestedRevision:data.revision,lastPublishError:''};return structuredClone(record);},
    async updateDeploy(_scope,data){record={...(record||{}),lastDeployId:data.netlifyDeployId||record?.lastDeployId,lastDeployState:data.state,lastPublishError:data.error||'',publishedRevision:data.publishedRevision??record?.publishedRevision??'',lastPublishedAt:data.publishedAt??record?.lastPublishedAt??null};return structuredClone(record);},
  };
}

test('01147 first publish creates one Netlify site and deploys generated production files',async()=>{
  const repo=fakeRepo(),calls=[];
  const files=new Map([['index.html',Buffer.from('HTML')]]);
  const netlify={
    async createSiteWithSafeName({preferredName}){calls.push(['create',preferredName]);return {id:'netlify_1',name:'my-store',url:'http://my-store.netlify.app',ssl_url:'https://my-store.netlify.app',admin_url:'https://app.netlify.com/sites/my-store'};},
    async deployFiles({siteId,files:received}){calls.push(['deploy',siteId,received]);return {id:'dep_1',state:'uploading'};},
    async getDeploy(){return {id:'dep_1',state:'ready'};},
    async getSiteFile(){return {path:'/index.html'};},
  };
  const service=createSitePublishingService01143({repo,netlify,buildFiles:()=>files,createZip:()=>Buffer.from('UNUSED')});
  const result=await service.publish(scope,'user_1','builder_site_1',pkg());
  assert.equal(calls.length,2);
  assert.deepEqual(calls[0],['create','my-store']);
  assert.equal(calls[1][0],'deploy');
  assert.equal(calls[1][1],'netlify_1');
  assert.equal(calls[1][2],files);
  assert.equal(result.netlifySiteId,'netlify_1');
  assert.equal(result.deployId,'dep_1');
  assert.equal(result.deployState,'uploading');
  assert.equal(result.url,'https://my-store.netlify.app');
  assert.equal(repo.deployments.length,1);
});

test('01147 republish reuses the existing Netlify site identity',async()=>{
  const repo=fakeRepo(),calls=[];
  await repo.saveIdentity(scope,{builderSiteId:'builder_site_1',netlifySiteId:'netlify_1',netlifySiteName:'my-store',netlifyUrl:'http://my-store.netlify.app',netlifySslUrl:'https://my-store.netlify.app'});
  const netlify={
    async createSiteWithSafeName(){calls.push(['create']);throw new Error('must not create');},
    async deployFiles({siteId}){calls.push(['deploy',siteId]);return {id:'dep_2',state:'uploading'};},
    async getDeploy(){return {id:'dep_2',state:'ready'};},
    async getSiteFile(){return {path:'/index.html'};},
  };
  const service=createSitePublishingService01143({repo,netlify,buildFiles:()=>new Map([['index.html',Buffer.from('HTML2')]]),createZip:()=>Buffer.from('UNUSED')});
  const result=await service.publish(scope,'user_1','builder_site_1',pkg('rev_2'));
  assert.deepEqual(calls,[['deploy','netlify_1']]);
  assert.equal(result.netlifySiteId,'netlify_1');
  assert.equal(result.deployId,'dep_2');
});

test('01147 publish status promotes requested revision only when Netlify is ready and root exists',async()=>{
  const repo=fakeRepo();
  await repo.saveIdentity(scope,{builderSiteId:'builder_site_1',netlifySiteId:'netlify_1',netlifySiteName:'my-store',netlifySslUrl:'https://my-store.netlify.app'});
  await repo.recordDeploy(scope,{netlifyDeployId:'dep_3',revision:'rev_3',state:'uploading'});
  const service=createSitePublishingService01143({repo,netlify:{async getDeploy(){return {id:'dep_3',state:'ready'};},async getSiteFile(){return {path:'/index.html'};}},buildFiles:()=>new Map(),createZip:()=>Buffer.alloc(0),now:()=>new Date('2026-09-07T10:00:00.000Z')});
  const status=await service.status(scope,'builder_site_1');
  assert.equal(status.deployState,'ready');
  assert.equal(status.publishedRevision,'rev_3');
  assert.equal(status.lastPublishedAt,'2026-09-07T10:00:00.000Z');
});

test('01143 rejects a package for a different Builder site',async()=>{
  const service=createSitePublishingService01143({repo:fakeRepo(),netlify:{},buildFiles:()=>new Map(),createZip:()=>Buffer.alloc(0)});
  await assert.rejects(()=>service.publish(scope,'user_1','other_site',pkg()),err=>err.statusCode===400&&/site id/i.test(err.message));
});
