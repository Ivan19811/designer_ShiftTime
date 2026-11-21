// 01606D · Secondary authorization gate for catalog resource writes and atomic batches.
import {assertProductAction01606B} from './access-product-actions-core-01606b.mjs';
const map=Object.freeze({categories:'categories',attributes:'attributes',attributeValues:'attribute_values',variants:'variants'});
const verbs=Object.freeze({POST:'create',PATCH:'edit',DELETE:'delete'});
const err=(permission)=>Object.assign(new Error('ST_ACCESS_CATALOG_ACTION_DENIED_01606D'),{code:'ST_ACCESS_CATALOG_ACTION_DENIED_01606D',statusCode:403,permission});
export function catalogAction01606D(collection,action){
 if(!map[collection]||!['create','edit','delete'].includes(action))return null;
 return Object.freeze({collection,action,permission:collection==='variants'?`shop.products.actions.variants_${action}`:`shop.products.catalog.${map[collection]}_${action}`});
}
export function classifyCatalogAction01606D(method,parts){
 const m=String(method||'').toUpperCase(),p=parts;
 if(!Array.isArray(p)||p.length<4||p[0]!=='api'||p[1]!=='v1'||p[2]!=='marketplace')return null;
 const col=Object.entries({categories:'categories',attributes:'attributes','attribute-values':'attributeValues',variants:'variants'}).find(([slug])=>slug===p[3])?.[1];
 if(!col)return null;
 const action=verbs[m];
 if(!action)return null;
 if(action==='create'&&p.length===4)return catalogAction01606D(col,'create');
 if(action!=='create'&&p.length===5&&p[4])return catalogAction01606D(col,action);
 return null;
}
export function assertCatalogAction01606D(decision,action){
 if(!action||decision?.mode!=='custom')return true;
 const grants=new Set(Array.isArray(decision.permissions)?decision.permissions:[]);
 const enabled=grants.has('api.mode.catalog_actions')||grants.has('api.mode.product_actions')||grants.has('ui.mode.controls');
 if(!enabled)return true;
 if(!grants.has(action.permission))throw err(action.permission);
 // The legacy product action checker continues to protect variant writes when enabled.
 if(action.collection==='variants')assertProductAction01606B(decision,{permission:action.permission});
 return true;
}
export function isCatalogPreciseMode01606D(decision){return decision?.mode==='custom'&&['api.mode.catalog_actions','api.mode.product_actions','ui.mode.controls'].some(x=>decision.permissions?.includes(x));}
