import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProductPermissions01621,assertProductMutation01621,assertDelegatedCatalogOperation01621,delegatedRoutePermission01621,allowedDelegatedCloudMedia01621} from '../src/delegated-product-fields-01621.mjs';
import {normalizeModuleTiers01613C4,modulePermissions01613C4,moduleRouteAllowed01613C4} from '../src/delegated-modules-01613c4.mjs';
import {verifyDelegatedUploadOwner01621} from '../src/delegated-media-owner-01621.mjs';
const tiers=productPermissions=>({marketplace:'edit',messenger:'none',productPermissions});
const path=(...segments)=>['api','v1',...segments];
test('01621 grants are explicit and normalized; old edit tier alone grants only view',()=>{
 assert.deepEqual(normalizeProductPermissions01621(['texts','photos','texts']),['photos','texts']);
 for(const bad of [['admin'],[11],['texts', 'admin'],null])assert.throws(()=>normalizeProductPermissions01621(bad),{statusCode:400});
 const old=normalizeModuleTiers01613C4({marketplace:'edit',messenger:'view'});
 assert.deepEqual(old.productPermissions,[]);
 assert.deepEqual(normalizeModuleTiers01613C4({marketplace:'edit',messenger:'none',productPermissions:['texts','photos']}),{marketplace:'edit',messenger:'none',productPermissions:['photos','texts']});
 assert.throws(()=>normalizeModuleTiers01613C4({marketplace:'edit',messenger:'none',productPermissions:['superadmin']}),{statusCode:400});
 assert.throws(()=>normalizeModuleTiers01613C4({marketplace:'edit',messenger:'none',permissions:['owner']}),{statusCode:400});
 assert.equal(modulePermissions01613C4(old).includes('shop.products.edit'),false);
 assert.equal(moduleRouteAllowed01613C4('PATCH',path('marketplace','products','prod1'),old),false);
 assert.equal(moduleRouteAllowed01613C4('GET',path('marketplace','categories'),old),true);
});
test('01621 text-only editor cannot change prices, photographs, product status or arbitrary metadata',()=>{
 const old={id:'p1',name:'Сковорода',price:300,mediaIds:['media1'],attributes:{diameter:40},status:'draft'};
 const rights=tiers(['texts']);
 assert.equal(assertProductMutation01621(rights,{id:'p1',name:'Казан',price:300,mediaIds:['media1'],status:'draft'},{before:old}),true);
 for(const patch of [{price:999},{mediaIds:['media2']},{attributes:{diameter:50}},{status:'active'},{shipping01547:{free:true}},{price:999,name:'Казан'}]){
  assert.throws(()=>assertProductMutation01621(rights,patch,{before:old}),{statusCode:403});
 }
 assert.throws(()=>assertProductMutation01621(rights,{name:'x',role:'owner'},{before:old}),{statusCode:403});
});
test('01621 dedicated photo, price, and attribute rights are independent',()=>{
 const old={id:'p1',name:'Сковорода',price:200,mediaIds:[],attributes:{diameter:30}};
 assert.equal(assertProductMutation01621(tiers(['photos']),{mediaIds:['m2']},{before:old}),true);
 assert.equal(assertProductMutation01621(tiers(['prices']),{price:300},{before:old}),true);
 assert.equal(assertProductMutation01621(tiers(['attributes']),{attributes:{diameter:35}},{before:old}),true);
 assert.throws(()=>assertProductMutation01621(tiers(['prices']),{name:'wrong'},{before:old}),{statusCode:403});
});
test('01621 create allows safe identifiers but blocks prices and active status unless explicitly authorized',()=>{
 assert.equal(assertProductMutation01621(tiers(['products_create']),{id:'p1',name:'New',sku:'S-1',status:'draft',price:0,mediaIds:[],createdAt:'2020-01-01T00:00:00.000Z',availability:'in-stock',currency:'UAH'},{creating:true}),true);
 assert.throws(()=>assertProductMutation01621(tiers(['products_create']),{name:'New',price:100},{creating:true}),{statusCode:403});
 assert.throws(()=>assertProductMutation01621(tiers(['products_create']),{name:'New',status:'active'},{creating:true}),{statusCode:403});
 assert.throws(()=>assertProductMutation01621(tiers(['texts']),{name:'New'},{creating:true}),{statusCode:403});
});
test('01621 categories and attributes explicitly scoped; delete categories never delegated',()=>{
 assert.equal(assertDelegatedCatalogOperation01621(tiers(['categories_create']),'categories','create',{name:'New'}),true);
 assert.throws(()=>assertDelegatedCatalogOperation01621(tiers(['categories_create']),'categories','update',{name:'Wrong'}),{statusCode:403});
 assert.throws(()=>assertDelegatedCatalogOperation01621(tiers(['categories_edit']),'categories','delete'),{statusCode:403});
 assert.equal(assertDelegatedCatalogOperation01621(tiers(['attributes']),'attributeValues','update',{name:'Matte'}),true);
 assert.throws(()=>assertDelegatedCatalogOperation01621(tiers(['texts']),'attributes','create',{name:'Value'}),{statusCode:403});
});
test('01621 site-only route allowlist blocks import, snapshot export, other modules and category deletion',()=>{
 const photo=tiers(['photos']);
 assert.equal(moduleRouteAllowed01613C4('PATCH',path('marketplace','products','p1'),photo),true);
 assert.equal(moduleRouteAllowed01613C4('PATCH',path('marketplace','categories','c1'),photo),false);
 assert.equal(moduleRouteAllowed01613C4('GET',path('marketplace','snapshot','export'),photo),false);
 assert.equal(moduleRouteAllowed01613C4('PUT',path('marketplace','snapshot'),photo),false);
 assert.equal(moduleRouteAllowed01613C4('DELETE',path('marketplace','categories','c1'),tiers(['categories_edit'])),false);
 assert.equal(moduleRouteAllowed01613C4('DELETE',path('marketplace','products','p1'),tiers(['products_delete'])),true);
 assert.equal(moduleRouteAllowed01613C4('POST',path('marketplace','products','bulk-status'),tiers(['texts','prices'])),false);
 assert.equal(delegatedRoutePermission01621('GET',path('marketplace','snapshot','export'),photo),'');
 assert.equal(allowedDelegatedCloudMedia01621('POST',path('media','uploads'),photo),true);
 assert.equal(allowedDelegatedCloudMedia01621('DELETE',path('media','assets','someasset'),photo),false);
 assert.equal(allowedDelegatedCloudMedia01621('POST',path('media','uploads'),tiers(['texts'])),false);
});
test('01621 complete upload only for initiating user and same store',async()=>{
 const scope={accountId:'a',workspaceId:'w',storeId:'s'};
 const mock=(rows)=>async cb=>cb({query:async(sql,params)=>({rowCount:rows.length,rows})});
 assert.equal(await verifyDelegatedUploadOwner01621(scope,'usr1','asset1',{run:mock([{kind:'image',metadata:{uploadedByUserId01621:'usr1'}}])}),true);
 await assert.rejects(()=>verifyDelegatedUploadOwner01621(scope,'usr2','asset1',{run:mock([{kind:'image',metadata:{uploadedByUserId01621:'usr1'}}])}),{statusCode:403});
 await assert.rejects(()=>verifyDelegatedUploadOwner01621(scope,'usr1','asset1',{run:mock([{kind:'video',metadata:{uploadedByUserId01621:'usr1'}}])}),{statusCode:403});
});
