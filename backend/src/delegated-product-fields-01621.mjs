// 01621 · Store-scoped, explicit product-field policy for delegated site collaborators.
// The browser never authorizes a write. For updates compare against the locked
// canonical entity in commerce-snapshot-service, not against client-supplied before values.
export const DELEGATED_PRODUCT_PERMISSIONS_01621=Object.freeze([
 'photos','texts','prices','attributes','products_create','categories_create','categories_edit','products_delete'
]);
const valid=new Set(DELEGATED_PRODUCT_PERMISSIONS_01621);
const clean=x=>String(x??'').trim();
const denied=(code='ST_DELEGATED_PRODUCT_FIELD_DENIED_01621')=>Object.assign(new Error(code),{code,statusCode:403});
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
export function normalizeProductPermissions01621(input){
 if(!Array.isArray(input)||input.length>DELEGATED_PRODUCT_PERMISSIONS_01621.length||input.some(x=>typeof x!=='string'||!valid.has(x)))throw Object.assign(new Error('ST_DELEGATED_PRODUCT_PERMISSION_INVALID_01621'),{code:'ST_DELEGATED_PRODUCT_PERMISSION_INVALID_01621',statusCode:400});
 return [...new Set(input)].sort();
}
export function hasProductPermission01621(tiers,permission){return tiers?.marketplace==='edit'&&Array.isArray(tiers.productPermissions)&&tiers.productPermissions.includes(permission);}
const FIELDS=Object.freeze({
 texts:new Set(['name','shortDescription','description','brand','badges']),
 photos:new Set(['mediaIds','primaryMediaId','images','primaryImage','image']),
 prices:new Set(['price','oldPrice']),
 attributes:new Set(['attributes','categoryIds'])
});
const NECESSARY_ON_CREATE=new Set(['id','sku','slug','name','brand','categoryIds','status']);
const IMMUTABLE=new Set(['accountId','storeId','workspaceId','ownerId','revision','createdBy','updatedBy','permissions','role']);
const meta=new Set(['id','createdAt','updatedAt']);
const neutral=(value)=>value===null||value===undefined||value===''||value===0||value===false||(Array.isArray(value)&&value.length===0)||(obj(value)&&Object.keys(value).length===0);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function groupForField(k){for(const [group,fields] of Object.entries(FIELDS))if(fields.has(k))return group;return null;}
export function assertProductMutation01621(tiers,patch,{before=null,creating=false}={}){
 if(!obj(patch))throw denied();
 if(creating&&!hasProductPermission01621(tiers,'products_create'))throw denied();
 if(!creating&&!before)throw denied();
 for(const [key,value] of Object.entries(patch)){
  if(IMMUTABLE.has(key))throw denied();
  if(meta.has(key)){
   if(!creating&&key==='id'&&!equal(value,before?.id))throw denied();
   // The server replaces client timestamps for new delegated products.
   continue;
  }
  if(creating&&NECESSARY_ON_CREATE.has(key)){
   if(key==='status'&&!['draft',undefined,''].includes(value))throw denied();
   continue;
  }
  if(!creating&&equal(before[key],value))continue;
  if(creating&&(neutral(value)||(key==='availability'&&value==='in-stock')||(key==='currency'&&value==='UAH')))continue;
  const group=groupForField(key);
  if(!group||!hasProductPermission01621(tiers,group))throw denied();
 }
 return true;
}
export function assertDelegatedCatalogOperation01621(tiers,collection,action,value={}){
 if(tiers?.marketplace!=='edit')throw denied();
 const key=collection==='categories'?(action==='create'?'categories_create':action==='update'?'categories_edit':null)
   :['attributes','attributeValues'].includes(collection)&&['create','update'].includes(action)?'attributes'
   :collection==='media'&&['create','update'].includes(action)?'photos':null;
 if(!key||!hasProductPermission01621(tiers,key))throw denied();
 if(obj(value))for(const prop of ['accountId','storeId','workspaceId','permissions','role'])if(Object.hasOwn(value,prop))throw denied();
 return true;
}
export function delegatedRoutePermission01621(method,parts,tiers){
 const m=clean(method).toUpperCase(),p=parts||[],resource=p[3];
 if(p[2]!=='marketplace')return '';
 if(m==='GET'&&((['products','categories','attributes','attribute-values','variants','media','collections','filters','recommendations','feeds'].includes(resource)&&[4,5].includes(p.length))||(resource==='snapshot'&&p.length===4)))return 'shop.products.view';
 if(resource==='atomic-catalog'&&m==='POST'&&p.length===4)return 'shop.products.view';
 if(resource==='products'){
  if(p.length===4&&m==='POST'&&hasProductPermission01621(tiers,'products_create'))return 'shop.products.create';
  if(p.length===5&&m==='PATCH'&&['photos','texts','prices','attributes'].some(x=>hasProductPermission01621(tiers,x)))return 'shop.products.edit';
  if(p.length===5&&m==='DELETE'&&hasProductPermission01621(tiers,'products_delete'))return 'shop.products.delete';
 }
 if(resource==='categories'){
  if(p.length===4&&m==='POST'&&hasProductPermission01621(tiers,'categories_create'))return 'shop.products.edit';
  if(p.length===5&&m==='PATCH'&&hasProductPermission01621(tiers,'categories_edit'))return 'shop.products.edit';
 }
 if(['attributes','attribute-values'].includes(resource)&&hasProductPermission01621(tiers,'attributes')){
  if(p.length===4&&m==='POST')return 'shop.products.edit';
  if(p.length===5&&m==='PATCH')return 'shop.products.edit';
 }
 if(resource==='media'&&hasProductPermission01621(tiers,'photos')){
  if(p.length===4&&m==='POST')return 'shop.products.edit';
  if(p.length===5&&m==='PATCH')return 'shop.products.edit';
 }
 return '';
}
export function allowedDelegatedCloudMedia01621(method,parts,tiers){
 if(!hasProductPermission01621(tiers,'photos')||parts?.[2]!=='media')return false;
 const m=clean(method).toUpperCase();
 return (m==='GET'&&parts[3]==='assets'&&parts.length===4)
  ||(m==='GET'&&parts[3]==='storage'&&parts[4]==='status'&&parts.length===5)
  ||(m==='POST'&&parts[3]==='uploads'&&parts.length===4)
  ||(m==='POST'&&parts[3]==='uploads'&&parts[4]&&parts[5]==='complete'&&parts.length===6);
}
export function assertDelegatedImageInput01621(input){
 if(!obj(input)||!(clean(input.mimeType||input.mime).toLowerCase().startsWith('image/'))||clean(input.kind||'image')!=='image')throw denied('ST_DELEGATED_IMAGES_ONLY_01621');
 return true;
}
