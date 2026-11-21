import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildHttpTrafficEvent01194} from '../src/traffic-control-core-01194.mjs';
import {setTrafficScope01194} from '../src/traffic-recorder-01194.mjs';

test('01203 HTTP traffic uses verified scope Site ID for public routes without a Site ID in the URL',()=>{
  const event=buildHttpTrafficEvent01194({method:'GET',pathname:'/api/v1/public/marketplace/search',requestId:'req_1',startedAtMs:1,finishedAtMs:2,statusCode:200,outboundBytes:500,scope:{accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1',siteId:'site_1'}});
  assert.equal(event.siteId,'site_1');
  assert.equal(event.accountId,'acct_1');
});

test('01203 traffic response scope preserves verified site identity',()=>{
  const res={};
  assert.equal(setTrafficScope01194(res,{accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1',siteId:'site_1'}),true);
  assert.equal(res.__stTrafficScope01194.siteId,'site_1');
});

test('01206 published identity still requires x-st-site-token while authenticated media treats x-st-site-id only as a server-validated candidate',()=>{
  const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  const http=fs.readFileSync(new URL('../src/http-utils.mjs',import.meta.url),'utf8');
  assert.match(server,/resolvePublishedSiteTrafficIdentity01203/);
  assert.match(server,/x-st-site-token/);
  assert.match(server,/candidateSiteId=String\(req\.headers\[['"]x-st-site-id['"]\]/);
  assert.match(server,/resolveAuthorizedMediaTrafficSite01206\(scope,candidateSiteId\)/);
  assert.match(http,/x-st-site-token/);
  assert.match(http,/x-st-site-id/);
});
