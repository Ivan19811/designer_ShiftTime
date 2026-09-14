import test from 'node:test';
import assert from 'node:assert/strict';
import {createSitePublishingService01143} from '../src/site-publishing-core-01143.mjs';

const scope={accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1'};
function pkg(revision='rev_47'){return {version:'01143',exporterVersion:'01151',revision,site:{id:'builder_site_1',name:'My Store',slug:'my-store'},pages:[{id:'page_home',path:'/',title:'Home',html:{header:'',main:'<h1>Home</h1>',footer:''}}],assets:[],files:[{path:'index.html',encoding:'utf8',content:'<h1>Home</h1>'}],preflight:{ok:true,exporterVersion:'01151',files:['index.html'],pages:[{pageId:'page_home',route:'/',outputPath:'index.html',ok:true}]}};}
function fakeRepo(){
  let record=null;
  return {
    async get(){return record?structuredClone(record):null;},
    async saveIdentity(_scope,data){record={...(record||{}),...data};return structuredClone(record);},
    async recordDeploy(_scope,data){record={...(record||{}),lastDeployId:data.netlifyDeployId,lastDeployState:data.state,requestedRevision:data.revision,lastPublishError:''};return structuredClone(record);},
    async updateDeploy(_scope,data){record={...(record||{}),lastDeployId:data.netlifyDeployId||record?.lastDeployId,lastDeployState:data.state,lastPublishError:data.error||'',publishedRevision:data.publishedRevision??record?.publishedRevision??'',lastPublishedAt:data.publishedAt??record?.lastPublishedAt??null};return structuredClone(record);},
  };
}

test('01147 publishing service sends production files through digest deploy instead of ZIP',async()=>{
  const repo=fakeRepo(),calls=[];
  const files=new Map([['index.html',Buffer.from('HTML')]]);
  const netlify={
    async createSiteWithSafeName(){return {id:'netlify_1',name:'my-store',ssl_url:'https://my-store.netlify.app'};},
    async deployFiles(args){calls.push(args);return {id:'dep_47',state:'uploading'};},
    async deployZip(){throw new Error('ZIP deploy must not be used in 01147');},
  };
  const service=createSitePublishingService01143({repo,netlify,buildFiles:()=>files,createZip:()=>{throw new Error('ZIP builder must not be used in 01147');}});
  const result=await service.publish(scope,'user_1','builder_site_1',pkg());
  assert.equal(calls.length,1);
  assert.equal(calls[0].siteId,'netlify_1');
  assert.equal(calls[0].files,files);
  assert.equal(result.deployId,'dep_47');
});

test('01147 ready deploy is published only after Netlify confirms /index.html exists',async()=>{
  const repo=fakeRepo();
  await repo.saveIdentity(scope,{builderSiteId:'builder_site_1',netlifySiteId:'netlify_1',netlifySslUrl:'https://my-store.netlify.app'});
  await repo.recordDeploy(scope,{netlifyDeployId:'dep_47',revision:'rev_47',state:'uploading'});
  const calls=[];
  const service=createSitePublishingService01143({repo,netlify:{
    async getDeploy(){return {id:'dep_47',state:'ready'};},
    async getSiteFile(args){calls.push(args);return {path:'/index.html',size:123};},
  },buildFiles:()=>new Map(),createZip:()=>Buffer.alloc(0),now:()=>new Date('2026-09-07T18:00:00.000Z')});
  const status=await service.status(scope,'builder_site_1');
  assert.deepEqual(calls,[{siteId:'netlify_1',path:'index.html'}]);
  assert.equal(status.deployState,'ready');
  assert.equal(status.publishedRevision,'rev_47');
});

test('01147 ready deploy becomes error when published /index.html is missing',async()=>{
  const repo=fakeRepo();
  await repo.saveIdentity(scope,{builderSiteId:'builder_site_1',netlifySiteId:'netlify_1',netlifySslUrl:'https://my-store.netlify.app'});
  await repo.recordDeploy(scope,{netlifyDeployId:'dep_47',revision:'rev_47',state:'uploading'});
  const missing=Object.assign(new Error('not found'),{netlifyStatus:404});
  const service=createSitePublishingService01143({repo,netlify:{
    async getDeploy(){return {id:'dep_47',state:'ready'};},
    async getSiteFile(){throw missing;},
  },buildFiles:()=>new Map(),createZip:()=>Buffer.alloc(0)});
  const status=await service.status(scope,'builder_site_1');
  assert.equal(status.deployState,'error');
  assert.equal(status.publishedRevision,'');
  assert.match(status.lastError,/index\.html/i);
});

test('01147 immediate-ready digest deploy is still root-verified before revision promotion',async()=>{
  const repo=fakeRepo();
  await repo.saveIdentity(scope,{builderSiteId:'builder_site_1',netlifySiteId:'netlify_1',netlifySslUrl:'https://my-store.netlify.app'});
  await repo.recordDeploy(scope,{netlifyDeployId:'dep_ready',revision:'rev_ready',state:'ready'});
  let verified=0;
  const service=createSitePublishingService01143({repo,netlify:{
    async getDeploy(){return {id:'dep_ready',state:'ready'};},
    async getSiteFile(){verified+=1;return {path:'/index.html',size:321};},
  },buildFiles:()=>new Map(),createZip:()=>Buffer.alloc(0),now:()=>new Date('2026-09-07T18:30:00.000Z')});
  const status=await service.status(scope,'builder_site_1');
  assert.equal(verified,1);
  assert.equal(status.publishedRevision,'rev_ready');
});
