import test from 'node:test';
import assert from 'node:assert/strict';
import {assertAiConsultantPublicRateLimit01414} from '../src/ai-consultant-public-core-01414.mjs';
import {buildAiConsultantPublicWidget01414,buildAiConsultantResultsPage01414} from '../src/ai-consultant-public-page-01414.mjs';
import {buildProductionFiles01143} from '../src/site-production-build-01143.mjs';

const i18n={title:'Consultant',open:'Open',close:'Close',greeting:'Hello',placeholder:'Ask',send:'Send',sending:'Sending',assistant:'Assistant',customer:'Customer',productsFound:'Found {count}',productsNotFound:'None',genericResponse:'Done',error:'Error',resultsTitle:'Results',found:'Found: {count}',noResults:'No results',noImage:'No image',stock:'Stock: {count}',details:'Details',pageTitle:'AI results'};

test('01414 public rate limiter caps anonymous visitor requests per minute',()=>{
  const identity={siteId:'site_rate_01414'},meta={remoteAddress:'127.0.0.1'},visitor='aicv_abcdefghijklmnopqrstuvwxyz012345';
  for(let i=0;i<12;i++)assert.doesNotThrow(()=>assertAiConsultantPublicRateLimit01414(identity,meta,visitor,1000));
  assert.throws(()=>assertAiConsultantPublicRateLimit01414(identity,meta,visitor,1000),error=>error?.statusCode===429&&error?.code==='AI_CONSULTANT_PUBLIC_RATE_LIMITED_01414');
});


test('01414 network limiter cannot be bypassed by rotating visitor keys',()=>{
  const identity={siteId:'site_network_01414'},meta={remoteAddress:'198.51.100.20'};
  for(let i=0;i<120;i++)assert.doesNotThrow(()=>assertAiConsultantPublicRateLimit01414(identity,meta,`aicv_${String(i).padStart(24,'0')}abcdefghijkl`,2000));
  assert.throws(()=>assertAiConsultantPublicRateLimit01414(identity,meta,'aicv_999999999999999999999999abcdefghijkl',2000),error=>error?.statusCode===429);
});

test('01414 public widget requires enabled config and complete publish i18n',()=>{
  assert.equal(buildAiConsultantPublicWidget01414({config:{enabled:false},i18n}), '');
  const html=buildAiConsultantPublicWidget01414({config:{enabled:true,consultantName:'Shop assistant'},i18n});
  assert.match(html,/data-st-ai-consultant-public="01414"/);
  assert.match(html,/data-text-products-found="Found \{count\}"/);
  assert.match(html,/Shop assistant/);
});

test('01414 production build injects chat and materializes dedicated AI results route',()=>{
  const pkg={version:'01143',exporterVersion:'01151',site:{id:'site_1',name:'Store'},publicI18n:{aiConsultant01414:i18n},files:[{path:'index.html',content:'<!doctype html><html><head></head><body><main>home</main></body></html>',encoding:'utf8'},{path:'js/ai-consultant/ai-consultant-public-runtime-01414.js',content:'export{}',encoding:'utf8'},{path:'css/ai-consultant-public-01414.css',content:'x{}',encoding:'utf8'},{path:'css/site-public-01154.css',content:'x{}',encoding:'utf8'}]};
  const files=buildProductionFiles01143(pkg,{canonicalBaseUrl:'https://shop.test',publishedSiteIdentity:{siteId:'site_1',token:'pst_abcdefghijklmnopqrstuvwxyz0123456789'},aiConsultantPublicConfig:{enabled:true,consultantName:'Helper'}});
  const home=files.get('index.html').toString();
  assert.match(home,/data-st-ai-consultant-public="01414"/);
  assert.match(home,/ai-consultant-public-runtime-01414\.js/);
  assert.ok(files.has('ai-results/index.html'));
  assert.match(files.get('ai-results/index.html').toString(),/data-st-ai-results-page="01414"/);
});

test('01414 results route collision fails instead of overwriting authored page',()=>{
  const pkg={version:'01143',exporterVersion:'01151',site:{id:'site_1',name:'Store'},publicI18n:{aiConsultant01414:i18n},files:[{path:'index.html',content:'<html><body></body></html>',encoding:'utf8'},{path:'ai-results/index.html',content:'owned',encoding:'utf8'}]};
  assert.throws(()=>buildProductionFiles01143(pkg,{aiConsultantPublicConfig:{enabled:true},publishedSiteIdentity:{}}),error=>error?.code==='AI_CONSULTANT_RESULTS_ROUTE_COLLISION_01414');
});
