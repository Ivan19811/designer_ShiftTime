// 01490 · Pure domain helpers, shared by server category CRUD and atomic merge service.
export const text=v=>String(v??'').trim();
export const categoryKey01490=v=>text(v).normalize('NFKC').toLocaleLowerCase('uk-UA').replace(/\s+/g,' ');
export const rootId=v=>text(v)||null;
export const clone=x=>JSON.parse(JSON.stringify(x));
export const fail=(code,statusCode=409)=>{const e=new Error(code);e.code=code;e.statusCode=statusCode;throw e;};
export function duplicates(categories,parentId,name){return categories.filter(c=>rootId(c.parentId)===rootId(parentId)&&categoryKey01490(c.name)===categoryKey01490(name));}
export function assertUniqueCategoryIdentity01490(categories,input,{exceptId=''}={}){
  if(!text(input?.name))fail('MARKETPLACE_CATEGORY_NAME_REQUIRED_01490',400);
  const matches=duplicates(categories,input.parentId,input.name).filter(c=>text(c.id)!==text(exceptId));
  if(matches.length)fail('MARKETPLACE_CATEGORY_DUPLICATE_01490',409);
}
export function pretty(source){const v=text(source),lower=v.toLocaleLowerCase('uk-UA');return v===v.toLocaleUpperCase('uk-UA')&&v!==lower?lower.charAt(0).toLocaleUpperCase('uk-UA')+lower.slice(1):v;}
export function slug(value){return text(value).normalize('NFKD').toLocaleLowerCase('uk-UA').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');}

const trivial=v=>v===undefined||v===null||v===''||(Array.isArray(v)&&!v.length)||(typeof v==='object'&&!Array.isArray(v)&&!Object.keys(v).length);
function replaceRefs(value,idMap,counts,path='$'){
 if(typeof value==='string'){
  if(idMap.has(value)){counts.paths.push(path);return idMap.get(value);}
  for(const oldId of idMap.keys())if(value.includes(oldId)){counts.unsupported.push(path);break;}
  return value;
 }
 if(Array.isArray(value)){const changed=value.map((x,i)=>replaceRefs(x,idMap,counts,`${path}[${i}]`));if(value.some(x=>typeof x==='string'&&idMap.has(x)))return [...new Set(changed)];return changed;}
 if(value&&typeof value==='object'){
  const result={};for(const [k,v] of Object.entries(value)){
   const changedKey=idMap.get(k)||k;
   if(Object.hasOwn(result,changedKey)){counts.unsupported.push(`${path}.${k}`);continue;}
   result[changedKey]=replaceRefs(v,idMap,counts,`${path}.${k}`);
  }return result;
 }
 return value;
}
export function buildCategoryMergePreview01490(snapshot={},keepId='',removeIds=[]){
 const state=clone(snapshot),categories=Array.isArray(state.categories)?state.categories:[],keep=categories.find(x=>x.id===keepId),ids=[...new Set(removeIds.filter(id=>id&&id!==keepId))];
 const errors=[];if(!keep||!ids.length)errors.push('MARKETPLACE_CATEGORY_MERGE_SELECTION_01490');
 const removable=ids.map(id=>categories.find(c=>c.id===id));if(removable.some(c=>!c))errors.push('MARKETPLACE_CATEGORY_MERGE_MISSING_01490');
 for(const other of removable.filter(Boolean))if(categoryKey01490(other.name)!==categoryKey01490(keep?.name)||rootId(other.parentId)!==rootId(keep?.parentId))errors.push('MARKETPLACE_CATEGORY_MERGE_DIFFERENT_PATH_01490');
 const removedSet=new Set(ids),idMap=new Map(ids.map(id=>[id,keepId]));
 // Do not erase authoring information on the duplicate; preserve non-conflicting fields.
 const merged=keep?clone(keep):{};
 for(const other of removable.filter(Boolean))for(const [key,value] of Object.entries(other)){
  if(['id','name','parentId','createdAt','updatedAt'].includes(key)||trivial(value))continue;
  if(key==='slug'&&trivial(merged[key])){merged[key]=clone(value);continue;}if(trivial(merged[key]))merged[key]=clone(value);
  else if(JSON.stringify(merged[key])!==JSON.stringify(value))errors.push(`MARKETPLACE_CATEGORY_MERGE_FIELD_CONFLICT_01490:${key}`);
 }
 const remaining=categories.filter(c=>!removedSet.has(c.id)).map(c=>c.id===keepId?merged:c);
 const names=new Map();for(const c of remaining){const parent=rootId(idMap.get(c.parentId)||c.parentId),key=`${parent||''}|${categoryKey01490(c.name)}`;if(names.has(key)&&names.get(key)!==c.id)errors.push('MARKETPLACE_CATEGORY_MERGE_CHILD_CONFLICT_01490');names.set(key,c.id);}
 const counts={paths:[],unsupported:[]};state.categories=remaining;
 const candidate=replaceRefs(state,idMap,counts);
 if(counts.unsupported.length)errors.push('MARKETPLACE_CATEGORY_MERGE_UNKNOWN_REFERENCE_01490');
 return {stage:'01490',ok:errors.length===0,errors:[...new Set(errors)],keepId,removeIds:ids,refsChanged:counts.paths.length,referencePaths:counts.paths.slice(0,40),unsupportedPaths:counts.unsupported.slice(0,20),categoryCountBefore:categories.length,categoryCountAfter:remaining.length,candidate};
}
