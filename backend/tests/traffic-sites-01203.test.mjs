import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const load=async()=>import('../src/traffic-service-01194.mjs').catch(()=>({}));

test('01203 normalizes account-scoped per-site traffic aggregates',async()=>{
  const mod=await load();
  assert.equal(typeof mod.normalizeTrafficSiteRow01203,'function');
  assert.deepEqual(mod.normalizeTrafficSiteRow01203({site_id:'site_1',site_name:'Shop',site_slug:'shop',workspace_id:'ws_1',store_id:'store_1',today_inbound:'100',today_outbound:'200',today_billable:'180',month_inbound:'1000',month_outbound:'2000',month_billable:'1800',events:'9',failed:'2'}),{siteId:'site_1',siteName:'Shop',siteSlug:'shop',workspaceId:'ws_1',storeId:'store_1',todayInboundBytes:100,todayOutboundBytes:200,todayBillableOutboundBytes:180,monthInboundBytes:1000,monthOutboundBytes:2000,monthBillableOutboundBytes:1800,events:9,failed:2});
});

test('01203 per-site Traffic SQL is account-scoped and groups only attributed Site traffic',async()=>{
  const src=fs.readFileSync(new URL('../src/traffic-service-01194.mjs',import.meta.url),'utf8');
  assert.match(src,/listTrafficSites01203/);
  assert.match(src,/WHERE e\.account_id=\$1[\s\S]*e\.site_id IS NOT NULL/i);
  assert.match(src,/GROUP BY e\.site_id/i);
});

test('01203 server exposes admin traffic sites route behind traffic capability',()=>{
  const src=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  assert.match(src,/p\[3\]==='traffic'.*p\[4\]==='sites'/s);
  assert.match(src,/listTrafficSites01203/);
});
