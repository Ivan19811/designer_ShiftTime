// 01637 · Selection rules extend the existing 01480/01485 accessory relations.
// Pure functions shared with Render. IDs/category hierarchy are authoritative;
// no name-based "lid / medal / stand" special cases or second relationship store.
const text=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
export function normalizeAccessorySelection01637(value,fallback='one'){
  const valueKey=text(value).normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/\s+/g,'');
  if(['one','single','один','одна','1'].includes(valueKey))return 'one';
  if(['multiple','multi','кілька','декілька','багато'].includes(valueKey))return 'multiple';
  if(['required','обовязково','обов’язково','обязательно'].includes(valueKey))return 'required';
  return fallback;
}
export function accessorySelectionLabel01637(mode){return ({one:'Один',multiple:'Кілька',required:'Обов’язково'})[normalizeAccessorySelection01637(mode)]||'Один';}
export function accessorySelectionMode01637(product){return normalizeAccessorySelection01637(product?.configuration?.accessorySelection01637??product?.accessorySelection01637,'one');}
function bestGroupCategory01637(product,categories){
  const byId=new Map(arr(categories).map(c=>[text(c.id),c]));
  let best='',depth=0;
  for(const id of arr(product?.categoryIds)){
    const cat=byId.get(text(id));if(!cat)continue;
    let cursor=cat,d=0;const seen=new Set();
    while(cursor&&!seen.has(cursor.id)&&d++<40){seen.add(cursor.id);cursor=byId.get(text(cursor.parentId));}
    // A root "Accessories" bucket is too broad for exclusivity. Its direct
    // subcategories (Lids, Stands, Medals) are useful selection groups.
    if(d>=2&&d>depth){best=text(cat.id);depth=d;}
  }
  return best;
}
export function accessorySelectionGroup01637(product,categories=[]){
  const config=product?.configuration||{};
  const explicit=text(config.accessoryGroup01637).normalize('NFKC').toLocaleLowerCase('uk-UA');
  if(explicit)return 'group:'+explicit;
  const category=bestGroupCategory01637(product,categories);
  return category?'category:'+category:'product:'+text(product?.id);
}
export function effectiveOfferGroupMode01637(offers,group){
  const modes=arr(offers).filter(x=>text(x.group01637)===text(group)).map(x=>normalizeAccessorySelection01637(x.selectionMode01637));
  return modes.includes('required')?'required':modes.includes('one')?'one':'multiple';
}
export function normalizeAccessorySelections01637(offers={},selection={}){
  const rows=arr(offers.accessories),byId=new Map(rows.map(r=>[text(r.id),r]));
  const raw=[...new Set(arr(selection.accessories).map(text).filter(Boolean))].filter(id=>byId.has(id));
  const chosen=new Map();
  for(const id of raw){
    const row=byId.get(id),group=text(row.group01637)||'product:'+id;
    const mode=effectiveOfferGroupMode01637(rows,group);
    if(mode==='multiple')continue;
    chosen.set(group,id); // Last selected item wins inside one-choice group.
  }
  const accessories=raw.filter(id=>{
    const row=byId.get(id),group=text(row.group01637)||'product:'+id;
    return effectiveOfferGroupMode01637(rows,group)==='multiple'||chosen.get(group)===id;
  });
  const missingRequired=[...new Set(rows.map(r=>text(r.group01637)||'product:'+text(r.id)))].filter(group=>
    effectiveOfferGroupMode01637(rows,group)==='required'&&!accessories.some(id=>(text(byId.get(id)?.group01637)||'product:'+id)===group));
  const services=[...new Set(arr(selection.services).map(text).filter(Boolean))].filter(id=>arr(offers.services).some(r=>text(r.id)===id&&(!r.requiresAccessory||arr(r.accessoryIds).some(owner=>accessories.includes(text(owner))))));
  const result={accessories,services};
  Object.defineProperty(result,'missingRequired',{value:missingRequired,enumerable:false});
  return result;
}
// When a mutually-exclusive accessory is exchanged, retain the customer's
// service intent only for an unambiguous compatible service in the same
// authored service group/category. Services are never guessed by name.
export function remapAccessoryServices01637(offers={},oldSelection={},newAccessoryIds=[]){
  const oldAcc=new Set(arr(oldSelection.accessories).map(text)),newAcc=new Set(arr(newAccessoryIds).map(text));
  const services=arr(offers.services),out=[];
  for(const serviceId of arr(oldSelection.services).map(text)){
    const previous=services.find(s=>text(s.id)===serviceId);
    if(!previous)continue;
    if(!previous.requiresAccessory||arr(previous.accessoryIds).some(id=>newAcc.has(text(id)))){out.push(serviceId);continue;}
    if(!arr(previous.accessoryIds).some(id=>oldAcc.has(text(id))))continue;
    const group=text(previous.serviceGroup01637);if(!group)continue;
    const replacements=services.filter(s=>text(s.serviceGroup01637)===group&&s.requiresAccessory&&arr(s.accessoryIds).some(id=>newAcc.has(text(id))));
    if(replacements.length===1)out.push(text(replacements[0].id));
  }
  return [...new Set(out)];
}
