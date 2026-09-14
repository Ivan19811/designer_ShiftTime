import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProductionFiles01143} from '../src/site-production-build-01143.mjs';
import {createSitePublishingService01143} from '../src/site-publishing-core-01143.mjs';

const scope={accountId:'a',workspaceId:'w',storeId:'s'};

function validPkg(){
  return {
    version:'01143',
    exporterVersion:'01151',
    revision:'rev_test',
    site:{id:'site_1',name:'Test',slug:'test'},
    pages:[{id:'page_home',path:'/',html:{header:'',main:'<section>HOME</section>',footer:''}}],
    assets:[],
    files:[{path:'index.html',encoding:'utf8',content:'<html><body>HOME</body></html>'}],
    preflight:{
      ok:true,
      exporterVersion:'01151',
      files:['index.html'],
      pages:[{pageId:'page_home',route:'/',outputPath:'index.html',ok:true}],
    },
  };
}

test('01151 backend materializes prebuilt files without re-rendering H/M/F and replaces only canonical base token',()=>{
  const pkg=validPkg();
  pkg.files=[
    {path:'index.html',encoding:'utf8',content:'<html><head><link rel="canonical" href="__ST_CANONICAL_BASE_01151__/"></head><body>HOME MAIN</body></html>'},
    {path:'about-us/index.html',encoding:'utf8',content:'<html><body>ABOUT MAIN</body></html>'},
    {path:'image.webp',encoding:'base64',content:Buffer.from('image-bytes').toString('base64')},
  ];
  pkg.preflight.files=pkg.files.map(file=>file.path);
  const files=buildProductionFiles01143(pkg,{canonicalBaseUrl:'https://site.netlify.app',apiProxyTarget:'https://designer-shifttime.onrender.com'});
  assert.match(files.get('index.html').toString('utf8'),/https:\/\/site\.netlify\.app\//);
  assert.match(files.get('index.html').toString('utf8'),/HOME MAIN/);
  assert.match(files.get('about-us/index.html').toString('utf8'),/ABOUT MAIN/);
  assert.deepEqual(files.get('image.webp'),Buffer.from('image-bytes'));
  assert.match(files.get('_redirects').toString('utf8'),/designer-shifttime\.onrender\.com/);
});

test('01151 backend rejects missing/failed frontend preflight before Netlify site creation',async()=>{
  let createCalls=0;
  const repo={get:async()=>null};
  const netlify={createSiteWithSafeName:async()=>{createCalls++;return {id:'n1'};}};
  const service=createSitePublishingService01143({repo,netlify,buildFiles:()=>new Map([['index.html',Buffer.from('ok')]]),createZip:()=>Buffer.alloc(0)});
  const pkg=validPkg();
  pkg.preflight={ok:false,exporterVersion:'01151',files:[],pages:[]};
  await assert.rejects(()=>service.publish(scope,'u','site_1',pkg),e=>e?.code==='ST_PUBLISH_OFFLINE_PREFLIGHT_REQUIRED');
  assert.equal(createCalls,0);
});

test('01151 republish keeps saved Netlify identity and still uses digest deploy',async()=>{
  let createCalls=0,deploySiteId='';
  const record={builderSiteId:'site_1',netlifySiteId:'netlify_existing',netlifySslUrl:'https://example.netlify.app',lastDeployState:'ready'};
  const repo={
    get:async()=>record,
    recordDeploy:async(_scope,input)=>({...record,lastDeployId:'deploy_2',lastDeployState:input.state,requestedRevision:input.revision}),
    updateDeploy:async()=>record,
  };
  const netlify={
    createSiteWithSafeName:async()=>{createCalls++;throw new Error('must not create');},
    deployFiles:async({siteId})=>{deploySiteId=siteId;return {id:'deploy_2',state:'new'};},
  };
  const service=createSitePublishingService01143({repo,netlify,buildFiles:()=>new Map([['index.html',Buffer.from('ok')]]),createZip:()=>Buffer.alloc(0)});
  await service.publish(scope,'u','site_1',validPkg());
  assert.equal(createCalls,0);
  assert.equal(deploySiteId,'netlify_existing');
});
