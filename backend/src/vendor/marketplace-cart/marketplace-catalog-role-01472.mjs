// 01535 vendored read-only canonical selectors; source: js/marketplace/data/marketplace-catalog-role-01472.js
// 01472 · One canonical item role for category defaults and price-list row markers.
// No repository writes. Category defaults never mutate other categories or products.
export const CATALOG_ROLES_01472=Object.freeze(['product','accessory','service']);
const normalize=value=>String(value??'').trim().toLocaleUpperCase('uk-UA').replace(/\s+/g,' ');
export function normalizeCatalogRole01472(value,{allowInherited=false}={}){
  const raw=normalize(value);
  if(!raw&&allowInherited)return '';
  if(!raw||raw==='PRODUCT'||raw==='ТОВАР')return 'product';
  if(raw==='АКСЕСУАРИ'||raw==='АКСЕСУАР'||raw==='ACCESSORY')return 'accessory';
  if(raw==='ДОДАТКОВО'||raw==='ПОСЛУГА'||raw==='SERVICE')return 'service';
  return null;
}
export function priceListMarker01472(value){
  const role=normalizeCatalogRole01472(value);
  if(role==='accessory')return 'АКСЕСУАРИ';
  if(role==='service')return 'ДОДАТКОВО';
  return '';
}
export function effectiveProductRole01472(product,categories=[]){
  const owned=normalizeCatalogRole01472(product?.catalogRole01472,{allowInherited:true});
  if(owned)return owned;
  const byId=new Map(categories.map(c=>[c.id,c]));
  for(const id of product?.categoryIds||[]){
    let c=byId.get(id),count=0;
    while(c&&count++<40){
      const role=normalizeCatalogRole01472(c.catalogRole01472,{allowInherited:true});
      if(role)return role;
      c=c.parentId?byId.get(c.parentId):null;
    }
  }
  return 'product';
}
