import test from 'node:test';
import assert from 'node:assert/strict';
import {createSitePublishingService01143, customDomainFromNetlify01623H} from '../src/site-publishing-core-01143.mjs';

const meta={id:'site_N',custom_domain:'vidpochynok.shifttime.com.ua'};
const base={netlifySiteId:'site_N',netlifySslUrl:'https://testovyy-website-1.netlify.app',siteName:'Site',builderSiteId:'builder_1',lastDeployState:'ready'};
const make=(netlify,environment='production')=>createSitePublishingService01143({environment,repo:{async get(){return base;}},netlify,buildFiles:()=>new Map(),createZip:()=>Buffer.alloc(0)});

test('01623H chooses only Netlify-linked custom domain for the existing production Site ID',async()=>{
  const status=await make({async getSite({siteId}){assert.equal(siteId,'site_N');return meta;}}).status({},'builder_1');
  assert.equal(status.url,'https://vidpochynok.shifttime.com.ua/');
  assert.equal(status.technicalUrl,'https://testovyy-website-1.netlify.app');
  assert.equal(status.domainSource,'netlify-custom');
  assert.equal(status.netlifySiteId,'site_N');
});
test('01623H does not trust a custom domain for a different site ID',async()=>{
  assert.equal(customDomainFromNetlify01623H({...meta,id:'other'},'site_N'),'');
  const status=await make({async getSite(){return {...meta,id:'other'};}}).status({},'builder_1');
  assert.equal(status.url,'https://testovyy-website-1.netlify.app');
});
test('01623H demo always has its own Netlify URL even when custom domain metadata exists',async()=>{
  let called=0;
  const status=await make({async getSite(){called++;return meta;}},'demo').status({},'builder_1');
  assert.equal(called,0);
  assert.equal(status.url,'https://testovyy-website-1.netlify.app');
});
test('01623H rejects unsafe or misleading alias metadata',()=>{
  for(const bad of ['example.netlify.app','other.com/path','localhost','127.0.0.1','evil.com:443','bad..test.com','']){
    assert.equal(customDomainFromNetlify01623H({id:'site_N',custom_domain:bad},'site_N'),'');
  }
});
