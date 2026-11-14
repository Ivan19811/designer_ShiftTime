import test from 'node:test';
import assert from 'node:assert/strict';
import {modulePermissions01613C4,allowedDelegatedCloudMedia01621} from '../src/delegated-modules-01613c4.mjs';
import {inspectProtectedAccess01600} from '../src/access-enforcement-service-01600.mjs';
import {mediaObjectKey01622} from '../src/media-object-key-01622.mjs';
const scope={accountId:'acct_test',workspaceId:'ws_123',storeId:'store_test',role:'viewer'};
const tiers=p=>({marketplace:'edit',messenger:'none',productPermissions:p});
const mediaPath=(...parts)=>['api','v1','media',...parts];
function mockRun(permissions=[],enrolled=false){
 return async fn=>fn({query:async sql=>{
  if(sql.includes('platform_access_enrollments_01600'))return {rowCount:enrolled?1:0,rows:enrolled?[{mode:'custom'}]:[]};
  if(sql.includes('FROM platform_delegated_module_grants_01613c4'))return {rowCount:1,rows:[tiers(permissions)]};
  if(sql.includes('FROM platform_role_assignments_01597'))return {rowCount:0,rows:[]};
  throw new Error('Unexpected query: '+sql.slice(0,90));
 }});
}
test('01622 photo grant reveals upload UI but never exposes deletion, import or unrelated modules',()=>{
 const perms=modulePermissions01613C4(tiers(['photos']));
 for(const k of ['builder.media.view','builder.media.upload','ui.control.productmediaupload','ui.control.pickermediaupload'])assert.ok(perms.includes(k),k);
 for(const k of ['builder.media.delete','shop.products.import','shop.products.delete','site.publish.execute'])assert.ok(!perms.includes(k),k);
 assert.ok(!modulePermissions01613C4(tiers(['texts'])).includes('builder.media.upload'));
 assert.ok(allowedDelegatedCloudMedia01621('POST',mediaPath('uploads'),tiers(['photos'])));
 assert.ok(allowedDelegatedCloudMedia01621('POST',mediaPath('uploads','asset1','complete'),tiers(['photos'])));
 assert.ok(!allowedDelegatedCloudMedia01621('POST',mediaPath('uploads','proxy'),tiers(['photos'])));
 assert.ok(!allowedDelegatedCloudMedia01621('DELETE',mediaPath('assets','asset1'),tiers(['photos'])));
});
test('01622 Cloud Media routes require a verified accepted-photo grant, even for legacy viewer',async()=>{
 for(const enrolled of [false,true]){
  const granted=await inspectProtectedAccess01600(scope,'usr_manager',{permission:'builder.media.upload',siteId:'',legacy:'write',delegatedMediaRoute:true},{run:mockRun(['photos'],enrolled)});
  assert.equal(granted.allowed,true);
  await assert.rejects(()=>inspectProtectedAccess01600(scope,'usr_manager',{permission:'builder.media.upload',siteId:'',legacy:'write',delegatedMediaRoute:true},{run:mockRun(['texts'],enrolled)}),{statusCode:403});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,'usr_manager',{permission:'builder.media.delete',siteId:'',legacy:'write',delegatedMediaRoute:false},{run:mockRun(['photos'],enrolled)}),{statusCode:403});
  await assert.rejects(()=>inspectProtectedAccess01600(scope,'usr_manager',{permission:'builder.media.upload',siteId:'',legacy:'write',delegatedMediaRoute:false},{run:mockRun(['photos'],enrolled)}),{statusCode:403});
 }
});
test('01622 Cloud object key preserves Ukrainian category paths in the verified store scope',()=>{
 const key=mediaObjectKey01622(scope,{assetId:'mediaasset_234',productId:'prod_455',folder:'products/аксесуари/решітки',fileName:'Новий знімок.webp'});
 assert.equal(key,'accounts/acct_test/workspaces/ws_123/stores/store_test/products/аксесуари/решітки/prod_455/mediaasset_234/Новий знімок.webp');
 assert.match(mediaObjectKey01622(scope,{assetId:'a',fileName:'x.jpg',folder:'../foo'}),/\/media\/x\/foo\/a\/x\.jpg$/);
 assert.equal(mediaObjectKey01622(scope,{assetId:'a',productId:'prod1',fileName:'x.jpg'}),'accounts/acct_test/workspaces/ws_123/stores/store_test/products/prod1/a/x.jpg');
});
