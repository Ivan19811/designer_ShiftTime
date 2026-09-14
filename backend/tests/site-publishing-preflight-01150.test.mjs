import test from 'node:test';
import assert from 'node:assert/strict';
import {createSitePublishingService01143} from '../src/site-publishing-core-01143.mjs';

const scope={accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1'};
const pkg={version:'01143',exporterVersion:'01151',revision:'rev_50',site:{id:'builder_50',name:'Новий сайт 3',slug:'new-website-3'},pages:[{id:'page_home',path:'/',title:'Головна',html:{header:'',main:'<main>Home</main>',footer:''}}],assets:[],files:[{path:'index.html',encoding:'utf8',content:'<main>Home</main>'}],preflight:{ok:true,exporterVersion:'01151',files:['index.html'],pages:[{pageId:'page_home',route:'/',outputPath:'index.html',ok:true}]}};
function repo(){
  let record=null;
  return {
    async get(){return record;},
    async saveIdentity(_scope,data){record={...data,builderSiteId:data.builderSiteId,lastDeployState:'not-published'};return record;},
    async recordDeploy(_scope,data){record={...record,lastDeployId:data.netlifyDeployId,lastDeployState:data.state,requestedRevision:data.revision};return record;},
    async updateDeploy(){return record;},
  };
}

test('01150 validates a production build before creating a new Netlify site',async()=>{
  const order=[];
  const service=createSitePublishingService01143({
    repo:repo(),
    netlify:{
      async createSiteWithSafeName(){order.push('create-site');return {id:'netlify_50',name:'new-website-3',ssl_url:'https://new-website-3.netlify.app'};},
      async deployFiles(){order.push('deploy');return {id:'dep_50',state:'uploading'};},
    },
    buildFiles(_pkg,{canonicalBaseUrl}={}){order.push(canonicalBaseUrl?'build-final':'build-preflight');return new Map([['index.html',Buffer.from('ok')]]);},
    createZip:()=>Buffer.alloc(0),
  });
  await service.publish(scope,'user_1','builder_50',pkg);
  assert.deepEqual(order,['build-preflight','create-site','build-final','deploy']);
});

test('01150 missing root index fails before Netlify project creation',async()=>{
  let created=0;
  const service=createSitePublishingService01143({
    repo:repo(),
    netlify:{
      async createSiteWithSafeName(){created+=1;return {id:'must-not-exist'};},
      async deployFiles(){throw new Error('must not deploy');},
    },
    buildFiles(){return new Map([['about-us/index.html',Buffer.from('about')]]);},
    createZip:()=>Buffer.alloc(0),
  });
  await assert.rejects(()=>service.publish(scope,'user_1','builder_50',pkg),error=>error?.code==='ST_PUBLISH_ROOT_MISSING');
  assert.equal(created,0);
});
