// 01622 · New Cloud Media objects follow the authenticated store + category
// folder. Existing R2 object keys are never renamed or rewritten.
const str=v=>String(v??'').trim();
const segment=v=>str(v).normalize('NFC').replace(/[^\p{L}\p{N}._-]+/gu,'-').replace(/^-+|-+$/g,'').replace(/^\.{1,2}$/,'x').slice(0,100)||'x';
const folderPath=v=>str(v).replace(/\\/g,'/').split('/').filter(Boolean).slice(0,14).map(segment).join('/');
const safeName=v=>str(v).replace(/[\\/:*?"<>|\u0000-\u001f]+/g,'-').replace(/\s+/g,' ').trim().slice(0,180)||'file';
export function mediaObjectKey01622(scope,{assetId,fileName,folder='',productId=''}={}){
 const base=`accounts/${segment(scope.accountId)}/workspaces/${segment(scope.workspaceId)}/stores/${segment(scope.storeId)}`;
 const category=folderPath(folder),product=str(productId);
 const branch=product?category?`${category.startsWith('products/')?category:`products/${category}`}/${segment(product)}`:`products/${segment(product)}`:`media/${category||'uploads'}`;
 return `${base}/${branch}/${segment(assetId)}/${safeName(fileName)}`;
}
