import test from 'node:test';
import assert from 'node:assert/strict';
import {createSitePublishingService01143} from '../src/site-publishing-core-01143.mjs';
import {buildProductionFiles01143} from '../src/site-production-build-01143.mjs';

const scope={accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1'};
function pkg(){return {version:'01143',exporterVersion:'01151',revision:'rev_1',site:{id:'site_1',name:'Shop',slug:'shop'},files:[{path:'index.html',encoding:'utf8',content:'<!doctype html><html><head><title>Shop</title></head><body>OK</body></html>'}],preflight:{ok:true,exporterVersion:'01151',files:['index.html'],pages:[{pageId:'page_home',route:'/',outputPath:'index.html',ok:true}]}};}

function repoWithIdentity(initial=null){let record=initial;let minted=0;return {get minted(){return minted;},async get(){return record&&structuredClone(record);},async saveIdentity(_scope,data){record={...(record||{}),...data};return structuredClone(record);},async ensureTrafficIdentity(_scope,_siteId,token){minted++;record={...(record||{}),trafficIdentityToken:record?.trafficIdentityToken||token};return structuredClone(record);},async recordDeploy(_scope,data){record={...(record||{}),lastDeployId:data.netlifyDeployId,lastDeployState:data.state,requestedRevision:data.revision};return structuredClone(record);},async updateDeploy(){return structuredClone(record);}};}
const netlify={async createSiteWithSafeName(){return {id:'net_1',name:'shop',url:'http://shop.netlify.app',ssl_url:'https://shop.netlify.app',admin_url:'https://app.netlify.com/sites/shop'};},async deployFiles(){return {id:'dep_1',state:'uploading'};}};

test('01203 first publish mints one persistent traffic identity and passes it into production build',async()=>{
  const repo=repoWithIdentity(),buildCalls=[];
  const service=createSitePublishingService01143({repo,netlify,createZip:()=>Buffer.alloc(0),createTrafficToken:()=> 'pst_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG',buildFiles:(input,options)=>{buildCalls.push(options);return new Map([['index.html',Buffer.from('ok')]]);}});
  await service.publish(scope,'user_1','site_1',pkg());
  assert.equal(repo.minted,1);
  assert.equal(buildCalls.at(-1).publishedSiteIdentity.token,'pst_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG');
  assert.equal(buildCalls.at(-1).publishedSiteIdentity.siteId,'site_1');
});

test('01203 republish reuses existing traffic identity instead of rotating it',async()=>{
  const repo=repoWithIdentity({builderSiteId:'site_1',netlifySiteId:'net_1',netlifySiteName:'shop',netlifySslUrl:'https://shop.netlify.app',trafficIdentityToken:'pst_existing_abcdefghijklmnopqrstuvwxyz0123'}),buildCalls=[];
  const service=createSitePublishingService01143({repo,netlify,createZip:()=>Buffer.alloc(0),createTrafficToken:()=> 'pst_new_should_not_be_used_abcdefghijklmnopqrstuvwxyz',buildFiles:(input,options)=>{buildCalls.push(options);return new Map([['index.html',Buffer.from('ok')]]);}});
  await service.publish(scope,'user_1','site_1',pkg());
  assert.equal(repo.minted,0);
  assert.equal(buildCalls.at(-1).publishedSiteIdentity.token,'pst_existing_abcdefghijklmnopqrstuvwxyz0123');
});

test('01203 exporter 01151 injects site traffic bridge into every HTML file only',()=>{
  const input=pkg();input.files.push({path:'about/index.html',encoding:'utf8',content:'<!doctype html><html><head></head><body>About</body></html>'},{path:'assets/app.js',encoding:'utf8',content:'console.log(1)'});input.preflight.files.push('about/index.html','assets/app.js');
  const files=buildProductionFiles01143(input,{apiProxyTarget:'https://designer-shifttime.onrender.com',publishedSiteIdentity:{siteId:'site_1',token:'pst_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG'}});
  const home=files.get('index.html').toString('utf8'),about=files.get('about/index.html').toString('utf8'),js=files.get('assets/app.js').toString('utf8');
  for(const html of [home,about]){assert.match(html,/data-st-published-traffic="01203"/);assert.match(html,/x-st-site-token/);assert.match(html,/pst_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG/);assert.match(html,/site_1/);}
  assert.doesNotMatch(js,/x-st-site-token/);
});
