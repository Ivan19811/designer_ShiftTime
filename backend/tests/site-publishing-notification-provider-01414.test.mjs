import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildSiteNotificationEvent01414,classifySitePublishingFailure01414,siteNotificationEventKey01414} from '../src/site-notification-core-01414.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('01414 classifies real publishing failures into publish domain and ssl events',()=>{
  assert.equal(classifySitePublishingFailure01414('Netlify deploy failed'),'site.publish_failed');
  assert.equal(classifySitePublishingFailure01414('DNS hostname is not configured'),'site.domain_failed');
  assert.equal(classifySitePublishingFailure01414('TLS certificate provisioning failed'),'site.ssl_failed');
  assert.equal(classifySitePublishingFailure01414({code:'CERT_ERROR',message:'certificate invalid'}),'site.ssl_failed');
});

test('01414 site event exposes canonical site/deploy context and stable event key',()=>{
  const input={eventType:'site.published',builderSiteId:'site_1',siteName:'Demo',url:'https://demo.netlify.app',deployId:'dep_1',state:'ready',revision:'rev_7',publishedRevision:'rev_7',occurredAt:'2026-10-06T09:00:00Z'};
  const event=buildSiteNotificationEvent01414(input);
  assert.equal(event.provider,'sites');assert.equal(event.type,'site.published');assert.equal(event.eventKey,'site_1:dep_1:site.published');assert.equal(siteNotificationEventKey01414(input,'site.published'),event.eventKey);assert.equal(event.data.site.revision,'rev_7');assert.equal(event.data.site.url,'https://demo.netlify.app');
});

test('01414 provider uses a notification event journal while published sites and deployments stay canonical',()=>{
  const provider=read('src/site-notification-provider-01414.mjs'),publishing=read('src/site-publishing-service-01143.mjs'),server=read('src/server.mjs'),inbox=read('src/notification-inbox-01404.mjs');
  assert.match(provider,/shifttime_site_notification_events/);assert.match(provider,/listNotificationRules01408/);assert.match(provider,/evaluateNotificationRules01408/);assert.match(provider,/dispatchNotificationEvent01409/);assert.doesNotMatch(provider,/UPDATE shifttime_published_sites|UPDATE shifttime_site_deployments/);
  assert.match(publishing,/recordSiteNotificationEvent01414/);assert.match(publishing,/classifySitePublishingFailure01414/);assert.match(server,/listSiteNotifications01414/);assert.match(server,/p\[3\]==='sites'/);assert.match(inbox,/provider==='sites'/);
});

test('01414 publishing wrapper records terminal ready/error state without changing core publishing service contract',()=>{
  const publishing=read('src/site-publishing-service-01143.mjs'),core=read('src/site-publishing-core-01143.mjs');
  assert.match(publishing,/state==='ready'/);assert.match(publishing,/\['error','failed'\]\.includes\(state\)/);assert.match(publishing,/defaultService\.publish/);assert.match(publishing,/defaultService\.status/);assert.match(core,/return \{publish,status\}/);
});

test('01414 migration creates only the notification journal, seeds four site rules and backfills history as read',()=>{
  const migration=read('sql/036_site_publishing_notification_provider.sql');
  assert.match(migration,/CREATE TABLE IF NOT EXISTS shifttime_site_notification_events/);for(const type of ['site.published','site.publish_failed','site.domain_failed','site.ssl_failed'])assert.match(migration,new RegExp(type.replace('.','\\.')));
  assert.match(migration,/shifttime_published_sites/);assert.match(migration,/shifttime_site_deployments/);assert.match(migration,/shifttime_notification_rules/);assert.match(migration,/shifttime_notification_receipts/);assert.doesNotMatch(migration,/CREATE TABLE IF NOT EXISTS shifttime_published_sites|CREATE TABLE IF NOT EXISTS shifttime_site_deployments/);
});
