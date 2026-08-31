// 01060 · Storage-agnostic Import/Export + Mapping service.
// Source -> parser/mapping -> staged canonical snapshot -> MarketplaceStore.replaceSnapshot().
// No direct LocalRepository/localStorage/Supabase/PostgreSQL access.
import { createMarketplaceProduct01052, createMarketplaceCategory01052, createMarketplaceMedia01052 } from '../data/marketplace-schema-01052.js?v=01052';

const BASE_FIELDS=Object.freeze([
  {id:'id',path:'product.id',label:'ID товару',aliases:['id','product id','productid','ід','ід товару','id товара']},
  {id:'name',path:'product.name',label:'Назва товару',required:true,aliases:['товар','товари','назва','назва товару','найменування','продукт','продукти','product','products','product name','name','title','название','наименование']},
  {id:'sku',path:'product.sku',label:'SKU / Артикул',required:true,aliases:['sku','артикул','артикул товару','код','код товару','код продукта','product code','vendor code','vendorcode','article']},
  {id:'status',path:'product.status',label:'Статус',aliases:['status','статус','стан','состояние']},
  {id:'slug',path:'product.slug',label:'Slug',aliases:['slug','url key','seo url','чпу','alias']},
  {id:'brand',path:'product.brand',label:'Бренд',aliases:['brand','бренд','виробник','производитель','manufacturer','vendor']},
  {id:'price',path:'product.price',label:'Ціна',aliases:['price','ціна','цена','ціна грн','цена грн','price uah','вартість','стоимость']},
  {id:'oldPrice',path:'product.oldPrice',label:'Стара ціна',aliases:['old price','oldprice','стара ціна','старая цена','ціна до знижки','compare at price','regular price']},
  {id:'currency',path:'product.currency',label:'Валюта',aliases:['currency','валюта','currency code']},
  {id:'stock',path:'product.stock',label:'Залишок',aliases:['stock','qty','quantity','залишок','кількість','остаток','количество','склад','inventory']},
  {id:'availability',path:'product.availability',label:'Наявність',aliases:['availability','наявність','доступність','наличие','stock status']},
  {id:'shortDescription',path:'product.shortDescription',label:'Короткий опис',aliases:['short description','shortdescription','короткий опис','короткое описание','анонс','summary']},
  {id:'description',path:'product.description',label:'Повний опис',aliases:['description','опис','опис товару','описание','full description','детальний опис']},
  {id:'categories',path:'product.categoryIds',label:'Категорії / шлях категорії',aliases:['category','categories','категорія','категорії','категория','категории','category name','category path','група','розділ','раздел']},
  {id:'images',path:'product.mediaIds',label:'Фото / Media URL',aliases:['image','images','image url','photo','photos','picture','pictures','фото','зображення','картинка','картинки','фотографії','picture url']}
]);
function str(v){return String(v??'').trim();}function arr(v){return Array.isArray(v)?v:[];}
function norm(v){return str(v).toLocaleLowerCase('uk-UA').normalize('NFKD').replace(/[’'`]/g,'').replace(/[_./\\-]+/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();}
function tokens(v){return new Set(norm(v).split(' ').filter(Boolean));}
function overlap(a,b){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let n=0;A.forEach(x=>B.has(x)&&n++);return n/Math.max(A.size,B.size);}
function num(v){const s=str(v).replace(/\s/g,'').replace(/[^0-9,.-]/g,'').replace(/,(?=\d{1,2}$)/,'.').replace(/,/g,'');const n=Number(s);return Number.isFinite(n)?n:0;}
function status(v){const n=norm(v);if(['active','активний','активна','активен','опубліковано','published'].includes(n))return'active';if(['archived','archive','архів','архив','архівний'].includes(n))return'archived';return'draft';}
function availability(v,stock){const n=norm(v);if(/pre.?order|передзам|предзаказ/.test(n))return'preorder';if(/out.?of.?stock|немає|нет в наличии|відсут/.test(n))return'out-of-stock';if(/in.?stock|в наявності|есть в наличии|доступ/.test(n))return'in-stock';return Number(stock)>0?'in-stock':'out-of-stock';}
function splitList(v){const s=str(v);if(!s)return[];if(s.startsWith('[')){try{return arr(JSON.parse(s)).map(str).filter(Boolean);}catch{}}return s.split(/\r?\n|\s*[|;]\s*/).map(str).filter(Boolean);}
function slugify(v){return norm(v).replace(/\s+/g,'-').replace(/[^\p{L}\p{N}-]/gu,'').replace(/-+/g,'-');}
function clone(v){try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}}

export function getCanonicalImportFields01060(state){
  const attributes=arr(state?.attributes).map(a=>({id:`attribute:${a.key}`,path:`product.attributes.${a.key}`,label:`Характеристика · ${a.name}${a.unit?` (${a.unit})`:''}`,aliases:[a.name,a.key,`${a.name} ${a.unit||''}`].filter(Boolean),attribute:a}));
  return [...BASE_FIELDS.map(x=>({...x})),...attributes];
}
export function suggestImportMapping01060(headers,state){
  const fields=getCanonicalImportFields01060(state),used=new Set(),mapping={};const confidence={};
  for(const header of arr(headers)){
    const hn=norm(header);let best=null,bestScore=0;
    for(const field of fields){if(used.has(field.id))continue;for(const alias of field.aliases||[]){const an=norm(alias);let score=0;if(hn===an)score=1;else if(hn&&an&&(hn.includes(an)||an.includes(hn)))score=.86;else score=overlap(hn,an)*.72;if(score>bestScore){bestScore=score;best=field;}}}
    if(best&&bestScore>=.46){mapping[header]=best.id;confidence[header]=bestScore;used.add(best.id);}else{mapping[header]='';confidence[header]=0;}
  }
  return {mapping,confidence};
}
export function applyImportProfile01060(headers,profile){
  const saved=profile?.mapping||{},byNorm=new Map(Object.entries(saved).map(([source,target])=>[norm(source),target])),out={};for(const h of headers)out[h]=byNorm.get(norm(h))||'';return out;
}
export function getImportProfiles01060(state){return arr(state?.settings?.importProfiles).filter(x=>x&&typeof x==='object');}
export function getImportHistory01060(state){return arr(state?.settings?.importHistory).filter(x=>x&&typeof x==='object');}

function rowToCanonical(row,mapping){
  const out={attributes:{},_mapped:new Set()};
  for(const [source,target] of Object.entries(mapping||{})){if(!target)continue;const value=row?.[source]??'';out._mapped.add(target);if(target.startsWith('attribute:'))out.attributes[target.slice(10)]=str(value);else out[target]=value;}
  out.name=str(out.name);out.sku=str(out.sku);out.id=str(out.id);out.slug=str(out.slug);out.brand=str(out.brand);out.shortDescription=str(out.shortDescription);out.description=str(out.description);out.currency=str(out.currency)||'UAH';
  if(out._mapped.has('price'))out.price=num(out.price);if(out._mapped.has('oldPrice'))out.oldPrice=num(out.oldPrice);if(out._mapped.has('stock'))out.stock=num(out.stock);
  if(out._mapped.has('status'))out.status=status(out.status);if(out._mapped.has('availability'))out.availability=availability(out.availability,out.stock);else if(out._mapped.has('stock'))out.availability=availability('',out.stock);
  if(out._mapped.has('categories'))out.categories=splitList(out.categories);if(out._mapped.has('images'))out.images=splitList(out.images);
  return out;
}
function validateRows(rows,mapping,{updateKey='sku',existingPolicy='update'}={}){
  const canon=rows.map(r=>rowToCanonical(r,mapping)),errors=[],warnings=[],seenSku=new Map();
  canon.forEach((r,i)=>{
    const line=i+2;if(!r.name)errors.push({row:i,line,field:'name',message:'Немає назви товару.'});if(!r.sku)errors.push({row:i,line,field:'sku',message:'Немає SKU.'});
    if(r.sku){const k=norm(r.sku);if(seenSku.has(k))errors.push({row:i,line,field:'sku',message:`SKU дублюється у файлі з рядком ${seenSku.get(k)+2}.`});else seenSku.set(k,i);}
    if(r._mapped.has('price')&&!(Number(r.price)>=0))errors.push({row:i,line,field:'price',message:'Некоректна ціна.'});
    if(!r._mapped.has('price'))warnings.push({row:i,line,field:'price',message:'Ціна не mapped — існуюча ціна при update залишиться без змін.'});
    if(updateKey==='id'&&!r.id)warnings.push({row:i,line,field:'id',message:'Update by ID увімкнено, але ID порожній — рядок буде створюватись як новий.'});
  });
  return {canonicalRows:canon,errors,warnings,existingPolicy};
}
function ensureCategoryPath(snapshot,path,{createMissing=true}={}){
  const parts=str(path).split(/\s*>\s*|\s*\/\s*/).map(str).filter(Boolean);if(!parts.length)return null;let parentId=null;
  for(const part of parts){let found=snapshot.categories.find(c=>c.parentId===parentId&&(norm(c.name)===norm(part)||norm(c.slug)===norm(part)));if(!found&&createMissing){found=createMarketplaceCategory01052({name:part,slug:slugify(part),parentId,status:'active'});snapshot.categories.push(found);}if(!found)return null;parentId=found.id;}
  return parentId;
}
function resolveCategories(snapshot,values,opts){const ids=[];for(const value of arr(values)){const id=ensureCategoryPath(snapshot,value,opts);if(id&&!ids.includes(id))ids.push(id);}return ids;}
function resolveMedia(snapshot,urls,name){const ids=[];for(const url of arr(urls)){let m=snapshot.media.find(x=>str(x.url)===str(url));if(!m){m=createMarketplaceMedia01052({kind:'image',url,alt:name,fileName:str(url).split('/').pop().split('?')[0]});snapshot.media.push(m);}if(!ids.includes(m.id))ids.push(m.id);}return ids;}
function applyMappedPatch(existing,r,snapshot,opts){
  const patch={};const mapped=r._mapped;
  for(const key of ['name','sku','status','slug','brand','price','oldPrice','currency','stock','availability','shortDescription','description'])if(mapped.has(key))patch[key]=r[key];
  if(mapped.has('categories'))patch.categoryIds=resolveCategories(snapshot,r.categories,{createMissing:opts.createMissingCategories!==false});
  if(mapped.has('images')){patch.mediaIds=resolveMedia(snapshot,r.images,r.name||existing?.name||'');patch.primaryMediaId=patch.mediaIds[0]||'';}
  const attrKeys=[...mapped].filter(x=>x.startsWith('attribute:')).map(x=>x.slice(10));if(attrKeys.length){patch.attributes={...(existing?.attributes||{})};for(const k of attrKeys)patch.attributes[k]=r.attributes[k]??'';}
  if(mapped.has('slug')&&patch.slug==='')patch.slug=slugify(r.name||existing?.name||'');
  return patch;
}
export function buildProductImportPlan01060(rows,mapping,state,options={}){
  const opts={updateKey:'sku',existingPolicy:'update',createMissingCategories:true,...options},validation=validateRows(rows,mapping,opts),products=arr(state?.products),bySku=new Map(products.map(p=>[norm(p.sku),p])),byId=new Map(products.map(p=>[p.id,p]));
  const plan=validation.canonicalRows.map((r,i)=>{const existing=opts.updateKey==='id'&&r.id?byId.get(r.id):bySku.get(norm(r.sku));let action='create';if(existing)action=opts.existingPolicy==='update'?'update':'skip';if(validation.errors.some(e=>e.row===i))action='error';return {index:i,line:i+2,row:r,existingId:existing?.id||'',existingName:existing?.name||'',action};});
  const counts={create:0,update:0,skip:0,error:0};plan.forEach(x=>counts[x.action]++);return {...validation,plan,counts,options:opts};
}
export async function executeProductImport01060(store,rows,mapping,options={},meta={}){
  if(!store)throw new Error('MarketplaceStore required.');const current=store.getState(),built=buildProductImportPlan01060(rows,mapping,current,options);if(built.counts.error)throw new Error(`Імпорт зупинено: ${built.counts.error} рядків мають помилки.`);
  const next=clone(current);next.products=arr(next.products);next.categories=arr(next.categories);next.media=arr(next.media);
  const productById=new Map(next.products.map((p,i)=>[p.id,{p,i}]));
  for(const item of built.plan){if(item.action==='skip')continue;const r=item.row;if(item.action==='update'){
      const ref=productById.get(item.existingId);if(!ref)continue;const patch=applyMappedPatch(ref.p,r,next,built.options);const merged=createMarketplaceProduct01052({...ref.p,...patch,id:ref.p.id,createdAt:ref.p.createdAt,updatedAt:new Date().toISOString()});next.products[ref.i]=merged;ref.p=merged;
    }else{
      const patch=applyMappedPatch(null,r,next,built.options);const created=createMarketplaceProduct01052({...patch,name:r.name,sku:r.sku,status:patch.status||'draft',slug:patch.slug||slugify(r.name)});next.products.push(created);productById.set(created.id,{p:created,i:next.products.length-1});
    }}
  const history={id:`import_${Date.now().toString(36)}`,at:new Date().toISOString(),sourceName:str(meta.sourceName)||'Import',format:str(meta.format)||'',profileName:str(meta.profileName),rows:rows.length,created:built.counts.create,updated:built.counts.update,skipped:built.counts.skip,errors:0};
  next.settings={...(next.settings||{}),importHistory:[history,...getImportHistory01060(next)].slice(0,30)};
  await store.replaceSnapshot(next,'import:products:01060');return {...built,history};
}
export async function saveImportProfile01060(store,{name,format,mapping,sourceHeaders,options}={}){
  const state=store.getState(),profiles=getImportProfiles01060(state),profile={id:`map_${Date.now().toString(36)}`,name:str(name)||`Mapping ${profiles.length+1}`,entity:'products',format:str(format),mapping:{...(mapping||{})},sourceHeaders:arr(sourceHeaders),options:{...(options||{})},updatedAt:new Date().toISOString()};
  const idx=profiles.findIndex(x=>norm(x.name)===norm(profile.name));if(idx>=0){profile.id=profiles[idx].id;profiles[idx]=profile;}else profiles.unshift(profile);
  state.settings={...(state.settings||{}),importProfiles:profiles.slice(0,50)};await store.replaceSnapshot(state,'import-profile:save:01060');return profile;
}
export async function deleteImportProfile01060(store,id){const state=store.getState();state.settings={...(state.settings||{}),importProfiles:getImportProfiles01060(state).filter(x=>x.id!==id)};await store.replaceSnapshot(state,'import-profile:delete:01060');}

function csvCell(v){const s=String(v??'');return /[";\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}
export function exportProducts01060(state,format='csv'){
  const cats=new Map(arr(state?.categories).map(c=>[c.id,c])),media=new Map(arr(state?.media).map(m=>[m.id,m]));
  const rows=arr(state?.products).map(p=>({id:p.id,name:p.name,sku:p.sku,status:p.status,brand:p.brand,price:p.price,oldPrice:p.oldPrice,currency:p.currency,stock:p.stock,availability:p.availability,slug:p.slug,shortDescription:p.shortDescription,description:p.description,categories:arr(p.categoryIds).map(id=>cats.get(id)?.name||'').filter(Boolean).join(' | '),images:arr(p.mediaIds).map(id=>media.get(id)?.url||'').filter(Boolean).join(' | ')}));
  if(format==='json')return {mime:'application/json',ext:'json',text:JSON.stringify(rows,null,2)};
  if(format==='xml'){const e=v=>String(v??'').replace(/[<>&"']/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[m]));return {mime:'application/xml',ext:'xml',text:`<?xml version="1.0" encoding="UTF-8"?>\n<products>\n${rows.map(r=>`  <product>${Object.entries(r).map(([k,v])=>`<${k}>${e(v)}</${k}>`).join('')}</product>`).join('\n')}\n</products>`};}
  const headers=Object.keys(rows[0]||{id:'',name:'',sku:'',status:'',brand:'',price:'',oldPrice:'',currency:'',stock:'',availability:'',slug:'',shortDescription:'',description:'',categories:'',images:''});return {mime:'text/csv;charset=utf-8',ext:'csv',text:'\uFEFF'+[headers.join(';'),...rows.map(r=>headers.map(h=>csvCell(r[h])).join(';'))].join('\r\n')};
}
