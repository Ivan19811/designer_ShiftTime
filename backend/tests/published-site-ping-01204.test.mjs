import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildProductionFiles01143} from '../src/site-production-build-01143.mjs';
import {classifyTrafficRoute01194} from '../src/traffic-control-core-01194.mjs';

const pkg={version:'01143',exporterVersion:'01151',revision:'rev_1',site:{id:'site_1',name:'Shop',slug:'shop'},files:[{path:'index.html',encoding:'utf8',content:'<!doctype html><html><head></head><body>OK</body></html>'}],preflight:{ok:true,exporterVersion:'01151',files:['index.html'],pages:[{pageId:'page_home',route:'/',outputPath:'index.html',ok:true}]}};

test('01204 published site bridge sends exactly one page-open ping with verified site token',()=>{
  const files=buildProductionFiles01143(pkg,{apiProxyTarget:'https://designer-shifttime.onrender.com',publishedSiteIdentity:{siteId:'site_1',token:'pst_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG'}});
  const html=files.get('index.html').toString('utf8');
  assert.match(html,/data-st-published-traffic="01203"/);
  assert.match(html,/\/api\/v1\/public\/traffic\/ping/);
  assert.match(html,/x-st-site-token/);
  assert.match(html,/__ST_PUBLISHED_SITE_PING_01204__/);
  assert.match(html,/published-site ping success/);
  assert.match(html,/published-site ping failed/);
});

test('01204 ping route is classified as a published-site page-open operation',()=>{
  assert.deepEqual(classifyTrafficRoute01194('POST','/api/v1/public/traffic/ping'),{module:'published-site',operation:'published-site.page-open',routeKey:'POST /api/v1/public/traffic/ping',siteId:''});
});

test('01204 server exposes public traffic ping only after verified published identity resolution',()=>{
  const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  assert.match(server,/p\[2\]==='public'.*p\[3\]==='traffic'.*p\[4\]==='ping'/s);
  assert.match(server,/publishedTrafficIdentity/);
  assert.match(server,/Published site identity required/);
});

test('01204 CORS allows verified published-site token for direct API requests',()=>{
  const httpUtils=fs.readFileSync(new URL('../src/http-utils.mjs',import.meta.url),'utf8');
  assert.match(httpUtils,/x-st-site-token/);
});
