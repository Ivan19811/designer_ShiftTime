// 01060 · Storage-agnostic Import/Export + Mapping service.
// 01397 · variant-aware import + canonical Media + validation/diff + catalog export + DB mapping presets/history + DB rollback point.
// Source -> parser/mapping -> staged canonical snapshot -> MarketplaceStore.replaceSnapshot().
// No direct LocalRepository/localStorage/Supabase/PostgreSQL access.
import { createMarketplaceProduct01052, createMarketplaceCategory01052, createMarketplaceVariant01052 } from './marketplace-schema-01052.mjs';
import { resolveCanonicalImportMedia01389, summarizeImportMediaReferences01389, validateMarketplaceMediaReference01389 } from './marketplace-import-media-service-01389.mjs';
import { assertMarketplaceImportDatabase01386, marketplaceImportSourceKind01386 } from './marketplace-import-persistence-01386.mjs';
import { buildMarketplaceImportDiff01390 } from './marketplace-import-diff-01390.mjs';
import { generateMarketplaceCatalogExport01391 } from './marketplace-catalog-export-01391.mjs';
import { normalizeImportProfile01392, getTransferHistory01392, prependTransferHistory01392, createTransferHistoryEntry01392, markImportProfileUsed01392 } from './marketplace-import-presets-history-01392.mjs';
import { rollbackCopiedImportAssets01396, summarizeMediaCopyPlan01396 } from './marketplace-remote-image-copy-01396.mjs';

const BASE_FIELDS=Object.freeze([
  {id:'id',path:'product.id',label:'ID товару',aliases:['id','product id','productid','ід','ід товару','id товара']},
  {id:'productGroup',path:'import.productGroup',labelKey:'fields.productGroup',aliases:['product group','group id','group key','parent id','parent sku','parent product','external id','external product id','група товару','група','батьківський sku','id групи']},
  {id:'name',path:'product.name',label:'Назва товару',required:true,aliases:['товар','товари','назва','назва товару','найменування','продукт','продукти','product','products','product name','name','title','название','наименование']},
  {id:'sku',path:'product.sku',label:'SKU / Артикул',required:true,aliases:['product sku','parent product sku','sku товару','батьківський артикул','sku','артикул товару','код товару','product code','vendor code','vendorcode','article']},
  {id:'status',path:'product.status',label:'Статус',aliases:['product status','статус товару','status','статус','стан','состояние']},
  {id:'slug',path:'product.slug',label:'Slug',aliases:['slug','url key','seo url','чпу','alias']},
  {id:'brand',path:'product.brand',label:'Бренд',aliases:['brand','бренд','виробник','производитель','manufacturer','vendor']},
  {id:'price',path:'product.price',label:'Ціна',aliases:['product price','base price','ціна товару','price','ціна','цена','ціна грн','цена грн','price uah','вартість','стоимость']},
  {id:'oldPrice',path:'product.oldPrice',label:'Стара ціна',aliases:['product old price','base old price','old price','oldprice','стара ціна','старая цена','ціна до знижки','compare at price','regular price']},
  {id:'currency',path:'product.currency',label:'Валюта',aliases:['currency','валюта','currency code']},
  {id:'stock',path:'product.stock',label:'Залишок',aliases:['product stock','base stock','залишок товару','stock','qty','quantity','залишок','кількість','остаток','количество','склад','inventory']},
  {id:'availability',path:'product.availability',label:'Наявність',aliases:['product availability','наявність товару','availability','наявність','доступність','наличие','stock status','available','@available']},
  {id:'shortDescription',path:'product.shortDescription',label:'Короткий опис',aliases:['short description','shortdescription','короткий опис','короткое описание','анонс','summary']},
  {id:'description',path:'product.description',label:'Повний опис',aliases:['description','опис','опис товару','описание','full description','детальний опис']},
  {id:'categories',path:'product.categoryIds',label:'Категорії / шлях категорії',aliases:['category','categories','категорія','категорії','категория','категории','category name','category path','група категорій','розділ','раздел']},
  {id:'images',path:'product.mediaIds',labelKey:'fields.productImages',aliases:['image','images','image url','photo','photos','picture','pictures','фото','зображення','картинка','картинки','фотографії','picture url']}
]);
const VARIANT_FIELDS=Object.freeze([
  {id:'variant:sku',path:'variant.sku',labelKey:'fields.variantSku',required:true,aliases:['variant sku','variation sku','sku варіації','sku вариации','variant code','variation code','sku','артикул','vendor code','vendorcode','article']},
  {id:'variant:status',path:'variant.status',labelKey:'fields.variantStatus',aliases:['variant status','variation status','статус варіації','status','статус']},
  {id:'variant:price',path:'variant.price',labelKey:'fields.variantPrice',aliases:['variant price','variation price','ціна варіації','price','ціна','цена','вартість','стоимость']},
  {id:'variant:oldPrice',path:'variant.oldPrice',labelKey:'fields.variantOldPrice',aliases:['variant old price','variation old price','стара ціна варіації','old price','oldprice','стара ціна','compare at price']},
  {id:'variant:stock',path:'variant.stock',labelKey:'fields.variantStock',aliases:['variant stock','variation stock','залишок варіації','stock','qty','quantity','залишок','кількість','остаток']},
  {id:'variant:availability',path:'variant.availability',labelKey:'fields.variantAvailability',aliases:['variant availability','variation availability','наявність варіації','availability','наявність','stock status','available','@available']},
  {id:'variant:images',path:'variant.mediaIds',labelKey:'fields.variantImages',aliases:['variant image','variant images','variant image url','variant photo','variant photos','variation image','variation images','variation photo','variation photos','фото варіації','фото вариации','зображення варіації']}
]);
function str(v){return String(v??'').trim();}function arr(v){return Array.isArray(v)?v:[];}function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}
function norm(v){return str(v).toLocaleLowerCase('uk-UA').normalize('NFKD').replace(/[’'`]/g,'').replace(/[_./\\-]+/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();}
function tokens(v){return new Set(norm(v).split(' ').filter(Boolean));}
function overlap(a,b){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let n=0;A.forEach(x=>B.has(x)&&n++);return n/Math.max(A.size,B.size);}
function num(v){const s=str(v).replace(/\s/g,'').replace(/[^0-9,.-]/g,'').replace(/,(?=\d{1,2}$)/,'.').replace(/,/g,'');const n=Number(s);return Number.isFinite(n)?n:0;}
function status(v){const n=norm(v);if(['active','активний','активна','активен','опубліковано','published'].includes(n))return'active';if(['archived','archive','архів','архив','архівний'].includes(n))return'archived';return'draft';}
function availability(v,stock){const n=norm(v);if(['true','1','yes','так'].includes(n))return'in-stock';if(['false','0','no','ні','нет'].includes(n))return'out-of-stock';if(/pre.?order|передзам|предзаказ/.test(n))return'preorder';if(/out.?of.?stock|немає|нет в наличии|відсут/.test(n))return'out-of-stock';if(/in.?stock|в наявності|есть в наличии|доступ/.test(n))return'in-stock';return Number(stock)>0?'in-stock':'out-of-stock';}
function splitList(v){const s=str(v);if(!s)return[];if(s.startsWith('[')){try{return arr(JSON.parse(s)).map(str).filter(Boolean);}catch{}}return s.split(/\r?\n|\s*[|;]\s*/).map(str).filter(Boolean);}
function slugify(v){return norm(v).replace(/\s+/g,'-').replace(/[^\p{L}\p{N}-]/gu,'').replace(/-+/g,'-');}
function clone(v){try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}}
function comboKey(options){return Object.keys(obj(options)).sort().map(key=>`${key}=${norm(options[key])}`).join('|');}
function importMode(options){return options?.rowMode==='variants'?'variants':'products';}
function repeatableMappingTarget01389(target){return target==='images'||target==='variant:images';}
function hasMediaMapping01389(mapping){return Object.values(mapping||{}).some(repeatableMappingTarget01389);}
function sourceValuesForTarget01390(row,mapping,target){return Object.entries(mapping||{}).filter(([,mapped])=>mapped===target).map(([source])=>row?.[source]);}
function finiteNumber01390(value){const raw=str(value);if(!raw)return false;const cleaned=raw.replace(/\s/g,'').replace(/[^0-9,.-]/g,'').replace(/,(?=\d{1,2}$)/,'.').replace(/,/g,'');return cleaned!==''&&Number.isFinite(Number(cleaned));}
function knownStatus01390(value){const n=norm(value);return !n||['active','активний','активна','активен','опубліковано','published','archived','archive','архів','архив','архівний','draft','чернетка','черновик'].includes(n);}
function knownAvailability01390(value){const n=norm(value);return !n||['true','false','1','0','yes','no','так','ні','нет'].includes(n)||/^(pre.?order|передзам|предзаказ|out.?of.?stock|немає|нет в наличии|відсут|in.?stock|в наявності|есть в наличии|доступ)/.test(n);}
function categoryPathExists01390(state,path){const parts=str(path).split(/\s*>\s*|\s*\/\s*/).map(str).filter(Boolean);if(!parts.length)return true;let parentId=null;for(const part of parts){const found=arr(state?.categories).find(c=>(c.parentId??null)===(parentId??null)&&(norm(c.name)===norm(part)||norm(c.slug)===norm(part)));if(!found)return false;parentId=found.id;}return true;}

export function getCanonicalImportFields01060(state,options={}){
  const attributes=arr(state?.attributes).map(a=>({id:`attribute:${a.key}`,path:`product.attributes.${a.key}`,label:`Характеристика · ${a.name}${a.unit?` (${a.unit})`:''}`,aliases:[a.name,a.key,`${a.name} ${a.unit||''}`].filter(Boolean),attribute:a}));
  const variantAttributes=arr(state?.attributes).filter(a=>a?.variantOption).map(a=>({id:`variantAttribute:${a.key}`,path:`variant.options.${a.key}`,labelKey:'fields.variantAttribute',labelVars:{name:a.name||a.key,unit:a.unit?` · ${a.unit}`:''},aliases:[a.name,a.key,`variant ${a.name}`,`variation ${a.name}`,`варіація ${a.name}`].filter(Boolean),attribute:a}));
  const mode=importMode(options),base=BASE_FIELDS.map(x=>({...x,aliases:[...(x.aliases||[])]})),variant=VARIANT_FIELDS.map(x=>({...x,aliases:[...(x.aliases||[])]}));
  const productImages=base.find(x=>x.id==='images'),variantImages=variant.find(x=>x.id==='variant:images');
  if(mode==='variants'){
    if(productImages)productImages.aliases=['product image','product images','product photo','product photos','фото товару','зображення товару','картинка товару'];
    if(variantImages)variantImages.aliases=[...(variantImages.aliases||[]),'image','images','image url','photo','photos','picture','pictures','фото','зображення','картинка','картинки','picture url'];
  }
  return mode==='variants'?[base[0],base[1],base[2],...variant,...variantAttributes,...base.slice(3),...attributes]:[...base,...attributes,...variant,...variantAttributes];
}
export function suggestImportMapping01060(headers,state,options={}){
  const fields=getCanonicalImportFields01060(state,options),used=new Set(),mapping={};const confidence={};
  for(const header of arr(headers)){
    const hn=norm(header);if(str(header).trim().toLowerCase()==='@id'||/^(category|категорія|категория) id$/.test(hn)||hn==='categoryid'){mapping[header]='';confidence[header]=0;continue;}let best=null,bestScore=0;
    for(const field of fields){if(used.has(field.id))continue;for(const alias of field.aliases||[]){const an=norm(alias);let score=0;if(hn===an)score=1;else if(hn&&an&&(hn.includes(an)||an.includes(hn)))score=.86;else score=overlap(hn,an)*.72;if(score>bestScore){bestScore=score;best=field;}}}
    if(best&&bestScore>=.46){mapping[header]=best.id;confidence[header]=bestScore;if(!repeatableMappingTarget01389(best.id))used.add(best.id);}else{mapping[header]='';confidence[header]=0;}
  }
  return {mapping,confidence};
}
export function applyImportProfile01060(headers,profile){
  const saved=profile?.mapping||{},byNorm=new Map(Object.entries(saved).map(([source,target])=>[norm(source),target])),out={};for(const h of headers)out[h]=byNorm.get(norm(h))||'';return out;
}
export function getImportProfiles01060(state){return arr(state?.settings?.importProfiles).filter(x=>x&&typeof x==='object').map(normalizeImportProfile01392);}
export function getImportHistory01060(state){return getTransferHistory01392(state);}

function rowToCanonical(row,mapping){
  const out={attributes:{},variant:{options:{},_mapped:new Set()},_mapped:new Set()};
  for(const [source,target] of Object.entries(mapping||{})){
    if(!target)continue;const value=row?.[source]??'';
    if(target.startsWith('variantAttribute:')){const key=target.slice(17);out.variant.options[key]=str(value);out.variant._mapped.add(target);continue;}
    if(target==='variant:images'){out.variant.images=[...arr(out.variant.images),...splitList(value)];out.variant._mapped.add(target);continue;}
    if(target.startsWith('variant:')){const key=target.slice(8);out.variant[key]=value;out.variant._mapped.add(target);continue;}
    if(target==='images'){out.images=[...arr(out.images),...splitList(value)];out._mapped.add(target);continue;}
    out._mapped.add(target);if(target.startsWith('attribute:'))out.attributes[target.slice(10)]=str(value);else out[target]=value;
  }
  out.name=str(out.name);out.sku=str(out.sku);out.id=str(out.id);out.productGroup=str(out.productGroup);out.slug=str(out.slug);out.brand=str(out.brand);out.shortDescription=str(out.shortDescription);out.description=str(out.description);out.currency=(str(out.currency)||'UAH').toUpperCase();
  if(out._mapped.has('price'))out.price=num(out.price);if(out._mapped.has('oldPrice'))out.oldPrice=num(out.oldPrice);if(out._mapped.has('stock'))out.stock=num(out.stock);
  if(out._mapped.has('status'))out.status=status(out.status);if(out._mapped.has('availability'))out.availability=availability(out.availability,out.stock);else if(out._mapped.has('stock'))out.availability=availability('',out.stock);
  if(out._mapped.has('categories'))out.categories=splitList(out.categories);if(out._mapped.has('images'))out.images=[...new Set(arr(out.images).map(str).filter(Boolean))];
  out.variant.sku=str(out.variant.sku);if(out.variant._mapped.has('variant:price'))out.variant.price=num(out.variant.price);if(out.variant._mapped.has('variant:oldPrice'))out.variant.oldPrice=num(out.variant.oldPrice);if(out.variant._mapped.has('variant:stock'))out.variant.stock=num(out.variant.stock);
  if(out.variant._mapped.has('variant:status'))out.variant.status=status(out.variant.status);if(out.variant._mapped.has('variant:availability'))out.variant.availability=availability(out.variant.availability,out.variant.stock);else if(out.variant._mapped.has('variant:stock'))out.variant.availability=availability('',out.variant.stock);if(out.variant._mapped.has('variant:images'))out.variant.images=[...new Set(arr(out.variant.images).map(str).filter(Boolean))];
  return out;
}
function resolveDictionaryValue(state,key,raw){
  const attribute=arr(state?.attributes).find(a=>a?.key===key);if(!attribute)return {ok:false,reason:'attribute-missing',value:str(raw),attribute:null};
  const values=arr(state?.attributeValues).filter(v=>v?.attributeId===attribute.id);const n=norm(raw),match=values.find(v=>norm(v.value)===n||norm(v.label)===n||norm(v.slug)===n);
  if(match)return {ok:true,value:str(match.value),label:str(match.label)||str(match.value),attribute,match};
  return {ok:false,reason:'value-missing',value:str(raw),attribute,values};
}
function validateRows(rows,mapping,state,{updateKey='sku',existingPolicy='update',rowMode='products',createMissingCategories=true}={}){
  const mode=rowMode==='variants'?'variants':'products',canon=rows.map(r=>rowToCanonical(r,mapping)),errors=[],warnings=[],seenSku=new Map(),variantOptionTargets=Object.values(mapping||{}).filter(x=>String(x).startsWith('variantAttribute:'));
  const numberTargets=mode==='variants'?['variant:price','variant:oldPrice','variant:stock','price','oldPrice','stock']:['price','oldPrice','stock'];
  canon.forEach((r,i)=>{
    const line=i+2,rawRow=rows[i]||{};if(!r.name)errors.push({row:i,line,field:'name',code:'nameRequired'});
    for(const target of numberTargets){for(const raw of sourceValuesForTarget01390(rawRow,mapping,target)){if(str(raw)&&!finiteNumber01390(raw))errors.push({row:i,line,field:target,code:target.startsWith('variant:')?'invalidVariantNumber':'invalidProductNumber',vars:{field:target,value:str(raw)}});}}
    const productStockRaw=sourceValuesForTarget01390(rawRow,mapping,'stock').find(v=>str(v));if(str(productStockRaw)&&finiteNumber01390(productStockRaw)&&num(productStockRaw)<0)errors.push({row:i,line,field:'stock',code:'negativeStock'});
    const variantStockRaw=sourceValuesForTarget01390(rawRow,mapping,'variant:stock').find(v=>str(v));if(str(variantStockRaw)&&finiteNumber01390(variantStockRaw)&&num(variantStockRaw)<0)errors.push({row:i,line,field:'variant:stock',code:'negativeVariantStock'});
    const currencyRaw=sourceValuesForTarget01390(rawRow,mapping,'currency').find(v=>str(v));if(str(currencyRaw)&&!/^[A-Za-z]{3}$/.test(str(currencyRaw)))errors.push({row:i,line,field:'currency',code:'invalidCurrency',vars:{value:str(currencyRaw)}});
    const statusRaw=sourceValuesForTarget01390(rawRow,mapping,'status').find(v=>str(v));if(str(statusRaw)&&!knownStatus01390(statusRaw))errors.push({row:i,line,field:'status',code:'invalidStatus',vars:{value:str(statusRaw)}});
    const variantStatusRaw=sourceValuesForTarget01390(rawRow,mapping,'variant:status').find(v=>str(v));if(str(variantStatusRaw)&&!knownStatus01390(variantStatusRaw))errors.push({row:i,line,field:'variant:status',code:'invalidVariantStatus',vars:{value:str(variantStatusRaw)}});
    const availabilityRaw=sourceValuesForTarget01390(rawRow,mapping,'availability').find(v=>str(v));if(str(availabilityRaw)&&!knownAvailability01390(availabilityRaw))errors.push({row:i,line,field:'availability',code:'invalidAvailability',vars:{value:str(availabilityRaw)}});
    const variantAvailabilityRaw=sourceValuesForTarget01390(rawRow,mapping,'variant:availability').find(v=>str(v));if(str(variantAvailabilityRaw)&&!knownAvailability01390(variantAvailabilityRaw))errors.push({row:i,line,field:'variant:availability',code:'invalidVariantAvailability',vars:{value:str(variantAvailabilityRaw)}});
    if(r._mapped.has('categories')&&!createMissingCategories)for(const path of arr(r.categories))if(!categoryPathExists01390(state,path))errors.push({row:i,line,field:'categories',code:'categoryMissing',vars:{value:str(path)}});
    if(r._mapped.has('images'))for(const value of arr(r.images)){const check=validateMarketplaceMediaReference01389(value);if(!check.ok)errors.push({row:i,line,field:'images',code:'invalidProductMediaReference',vars:{value:str(value)}});}
    if(r.variant._mapped.has('variant:images'))for(const value of arr(r.variant.images)){const check=validateMarketplaceMediaReference01389(value);if(!check.ok)errors.push({row:i,line,field:'variant:images',code:'invalidVariantMediaReference',vars:{value:str(value)}});}
    if(mode==='products'){
      if(!r.sku)errors.push({row:i,line,field:'sku',code:'skuRequired'});
      if(r.sku){const k=norm(r.sku);if(seenSku.has(k))errors.push({row:i,line,field:'sku',code:'duplicateSku',vars:{line:seenSku.get(k)+2}});else seenSku.set(k,i);}
      if(r._mapped.has('price')&&!(Number(r.price)>=0))errors.push({row:i,line,field:'price',code:'invalidPrice'});
      if(r._mapped.has('oldPrice')&&!(Number(r.oldPrice)>=0))errors.push({row:i,line,field:'oldPrice',code:'invalidOldPrice'});
      if(!r._mapped.has('price'))warnings.push({row:i,line,field:'price',code:'priceNotMapped'});
      if(updateKey==='id'&&!r.id)warnings.push({row:i,line,field:'id',code:'updateIdMissing'});
      return;
    }
    if(!r.variant.sku)errors.push({row:i,line,field:'variant:sku',code:'variantSkuRequired'});
    if(r.variant.sku){const k=norm(r.variant.sku);if(seenSku.has(k))errors.push({row:i,line,field:'variant:sku',code:'duplicateVariantSku',vars:{line:seenSku.get(k)+2}});else seenSku.set(k,i);}
    if(!r.id&&!r.productGroup&&!r.sku)warnings.push({row:i,line,field:'productGroup',code:'groupByNameFallback'});
    if(r.variant._mapped.has('variant:price')&&!(Number(r.variant.price)>=0))errors.push({row:i,line,field:'variant:price',code:'invalidVariantPrice'});
    if(r.variant._mapped.has('variant:oldPrice')&&!(Number(r.variant.oldPrice)>=0))errors.push({row:i,line,field:'variant:oldPrice',code:'invalidVariantOldPrice'});
    for(const target of variantOptionTargets){const key=target.slice(17),raw=r.variant.options[key];if(!str(raw))continue;const resolved=resolveDictionaryValue(state,key,raw);if(!resolved.ok){errors.push({row:i,line,field:target,code:resolved.reason==='attribute-missing'?'variantAttributeMissing':'variantValueMissing',vars:{value:str(raw),attribute:resolved.attribute?.name||key}});}else r.variant.options[key]=resolved.value;}
  });
  if(mode==='variants'&&!variantOptionTargets.length&&canon.length)errors.push({row:0,line:2,field:'variant',code:'variantOptionRequired'});
  return {canonicalRows:canon,errors,warnings,existingPolicy,rowMode:mode};
}
function ensureCategoryPath(snapshot,path,{createMissing=true}={}){
  const parts=str(path).split(/\s*>\s*|\s*\/\s*/).map(str).filter(Boolean);if(!parts.length)return null;let parentId=null;
  for(const part of parts){let found=snapshot.categories.find(c=>c.parentId===parentId&&(norm(c.name)===norm(part)||norm(c.slug)===norm(part)));if(!found&&createMissing){found=createMarketplaceCategory01052({name:part,slug:slugify(part),parentId,status:'active'});snapshot.categories.push(found);}if(!found)return null;parentId=found.id;}
  return parentId;
}
function resolveCategories(snapshot,values,opts){const ids=[];for(const value of arr(values)){const id=ensureCategoryPath(snapshot,value,opts);if(id&&!ids.includes(id))ids.push(id);}return ids;}
async function applyMappedPatch(existing,r,snapshot,opts,mediaContext={}){
  const patch={};const mapped=r._mapped;
  for(const key of ['name','sku','status','slug','brand','price','oldPrice','currency','stock','availability','shortDescription','description'])if(mapped.has(key))patch[key]=r[key];
  if(mapped.has('categories'))patch.categoryIds=resolveCategories(snapshot,r.categories,{createMissing:opts.createMissingCategories!==false});
  const mediaProduct={...(existing||{}),...patch,name:patch.name||r.name||existing?.name||'',categoryIds:patch.categoryIds??existing?.categoryIds??[]};
  if(mapped.has('images')){patch.mediaIds=await resolveCanonicalImportMedia01389(mediaContext.store,snapshot,r.images,{product:mediaProduct,alt:mediaProduct.name,role:'product',sourceName:mediaContext.sourceName,stats:mediaContext.stats,copyExternal:!!mediaContext.copyExternal,uploadedAssets:mediaContext.uploadedAssets});patch.primaryMediaId=patch.mediaIds[0]||'';}
  const attrKeys=[...mapped].filter(x=>x.startsWith('attribute:')).map(x=>x.slice(10));if(attrKeys.length){patch.attributes={...(existing?.attributes||{})};for(const k of attrKeys)patch.attributes[k]=r.attributes[k]??'';}
  if(mapped.has('slug')&&patch.slug==='')patch.slug=slugify(r.name||existing?.name||'');
  return patch;
}
async function variantPatch(existing,r,product,snapshot,mediaContext={}){
  const mapped=r.variant._mapped,patch={options:{...(existing?.options||{}),...(r.variant.options||{})}};
  for(const key of ['sku','status','price','oldPrice','stock','availability'])if(mapped.has(`variant:${key}`))patch[key]=r.variant[key];
  if(mapped.has('variant:images')){patch.mediaIds=await resolveCanonicalImportMedia01389(mediaContext.store,snapshot,r.variant.images,{product,alt:product?.name||'',role:'variant',sourceName:mediaContext.sourceName,stats:mediaContext.stats,copyExternal:!!mediaContext.copyExternal,uploadedAssets:mediaContext.uploadedAssets});patch.primaryMediaId=patch.mediaIds[0]||'';patch.inheritProductMedia01260=false;patch.mediaSourceMode01285='own';}
  if(!existing){patch.sku=patch.sku||r.variant.sku;patch.status=patch.status||'active';patch.price=Number.isFinite(Number(patch.price))?Number(patch.price):Number(product?.price)||0;patch.oldPrice=Number.isFinite(Number(patch.oldPrice))?Number(patch.oldPrice):Number(product?.oldPrice)||0;patch.stock=Number.isFinite(Number(patch.stock))?Number(patch.stock):0;patch.availability=patch.availability||availability('',patch.stock);}
  patch.displayName01260=Object.values(patch.options).filter(Boolean).join(' · ');
  return patch;
}
function groupKeyForRow(r){if(r.id)return`id:${r.id}`;if(r.productGroup)return`group:${norm(r.productGroup)}`;if(r.sku)return`sku:${norm(r.sku)}`;return`name:${norm(r.name)}`;}
function indexExistingProducts(state){
  const products=arr(state?.products),byId=new Map(products.map(p=>[p.id,p])),bySku=new Map(products.filter(p=>str(p.sku)).map(p=>[norm(p.sku),p])),byGroup=new Map(),byName=new Map();
  for(const p of products){const g=str(p?.configuration?.import01387?.externalGroupKey);if(g)byGroup.set(norm(g),p);const n=norm(p.name);if(n){const list=byName.get(n)||[];list.push(p);byName.set(n,list);}}
  return {products,byId,bySku,byGroup,byName};
}
function existingProductForRow(index,r){
  if(r.id&&index.byId.has(r.id))return index.byId.get(r.id);if(r.sku&&index.bySku.has(norm(r.sku)))return index.bySku.get(norm(r.sku));if(r.productGroup){const k=norm(r.productGroup);if(index.bySku.has(k))return index.bySku.get(k);if(index.byGroup.has(k))return index.byGroup.get(k);}const names=index.byName.get(norm(r.name))||[];return names.length===1?names[0]:null;
}
function buildProductOnlyPlan(rows,mapping,state,options){
  const opts={updateKey:'sku',existingPolicy:'update',createMissingCategories:true,rowMode:'products',...options},validation=validateRows(rows,mapping,state,opts),products=arr(state?.products),bySku=new Map(products.map(p=>[norm(p.sku),p])),byId=new Map(products.map(p=>[p.id,p]));
  const plan=validation.canonicalRows.map((r,i)=>{const existing=opts.updateKey==='id'&&r.id?byId.get(r.id):bySku.get(norm(r.sku));let action='create';if(existing)action=opts.existingPolicy==='update'?'update':'skip';if(validation.errors.some(e=>e.row===i))action='error';return {index:i,line:i+2,row:r,existingId:existing?.id||'',existingName:existing?.name||'',action,entity:'product'};});
  const counts={create:0,update:0,skip:0,error:0,productCreate:0,productUpdate:0,variantCreate:0,variantUpdate:0,variantSkip:0};plan.forEach(x=>counts[x.action]++);counts.productCreate=counts.create;counts.productUpdate=counts.update;return {...validation,plan,counts,options:opts,groups:[]};
}
function buildVariantRowsPlan(rows,mapping,state,options){
  const opts={updateKey:'sku',existingPolicy:'update',createMissingCategories:true,rowMode:'variants',...options},validation=validateRows(rows,mapping,state,opts),index=indexExistingProducts(state),variants=arr(state?.variants),variantBySku=new Map(variants.filter(v=>str(v.sku)).map(v=>[norm(v.sku),v])),variantsByProduct=new Map();
  for(const v of variants){const list=variantsByProduct.get(v.productId)||[];list.push(v);variantsByProduct.set(v.productId,list);}
  const groupsMap=new Map();validation.canonicalRows.forEach((r,i)=>{const key=groupKeyForRow(r),g=groupsMap.get(key)||{key,rows:[],existing:null};g.rows.push({row:r,index:i,line:i+2});const existing=existingProductForRow(index,r);if(existing){if(g.existing&&g.existing.id!==existing.id)validation.errors.push({row:i,line:i+2,field:'productGroup',code:'groupResolvesMultipleProducts'});else g.existing=existing;}groupsMap.set(key,g);});
  const groups=[...groupsMap.values()];const plan=[];let productCreate=0,productUpdate=0,variantCreate=0,variantUpdate=0,variantSkip=0;
  for(const group of groups){
    group.action=group.existing?'update':'create';if(group.action==='create')productCreate++;else productUpdate++;
    const first=group.rows[0]?.row,baseName=norm(first?.name),baseSku=norm(first?.sku),baseGroup=norm(first?.productGroup);
    for(const item of group.rows){if(norm(item.row.name)!==baseName||norm(item.row.sku)!==baseSku||norm(item.row.productGroup)!==baseGroup)validation.errors.push({row:item.index,line:item.line,field:'productGroup',code:'groupProductFieldsConflict'});}
    const productId=group.existing?.id||'';const productVariants=productId?(variantsByProduct.get(productId)||[]):[];const byCombo=new Map(productVariants.map(v=>[comboKey(v.options),v]));
    for(const item of group.rows){const r=item.row;let existingVariant=variantBySku.get(norm(r.variant.sku))||null;const combo=comboKey(r.variant.options);if(existingVariant&&productId&&existingVariant.productId!==productId){validation.errors.push({row:item.index,line:item.line,field:'variant:sku',code:'variantSkuOwnedByOtherProduct'});existingVariant=null;}if(!existingVariant&&combo&&productId)existingVariant=byCombo.get(combo)||null;
      let action=existingVariant?(opts.existingPolicy==='update'?'update':'skip'):'create';if(validation.errors.some(e=>e.row===item.index))action='error';if(action==='create')variantCreate++;else if(action==='update')variantUpdate++;else if(action==='skip')variantSkip++;
      plan.push({index:item.index,line:item.line,row:r,groupKey:group.key,productExistingId:productId,existingId:existingVariant?.id||'',existingName:group.existing?.name||'',action,entity:'variant'});
    }
  }
  const counts={create:variantCreate,update:variantUpdate,skip:variantSkip,error:0,productCreate,productUpdate,variantCreate,variantUpdate,variantSkip};counts.error=plan.filter(x=>x.action==='error').length;return {...validation,plan,counts,options:opts,groups};
}
export function buildProductImportPlan01060(rows,mapping,state,options={}){const built=importMode(options)==='variants'?buildVariantRowsPlan(rows,mapping,state,options):buildProductOnlyPlan(rows,mapping,state,options);const mediaEnabled=hasMediaMapping01389(mapping),result={...built,mediaEnabled,mediaSummary:summarizeImportMediaReferences01389(built.canonicalRows,state),mediaCopySummary01396:summarizeMediaCopyPlan01396(built.canonicalRows,mediaEnabled&&!!options.copySupplierMedia)};result.diff01390=buildMarketplaceImportDiff01390(result,state);return result;}
function uniqueParentSku(next,r){
  const occupied=new Set([...arr(next.products).map(p=>norm(p.sku)),...arr(next.variants).map(v=>norm(v.sku))].filter(Boolean));let base=str(r.sku)||str(r.productGroup)||`IMP-${slugify(r.name).toUpperCase()||'PRODUCT'}`;let candidate=base,n=2;while(occupied.has(norm(candidate)))candidate=`${base}-${n++}`;return candidate;
}
function syncVariantProduct(next,product){
  product.variantIds=arr(next.variants).filter(v=>v.productId===product.id).map(v=>v.id);const active=product.variantIds.map(id=>next.variants.find(v=>v.id===id)).filter(Boolean);if(!active.some(v=>v.id===product.primaryVariantId&&v.status==='active'))product.primaryVariantId=active.find(v=>v.status==='active')?.id||active[0]?.id||'';product.updatedAt=new Date().toISOString();
}
async function executeVariantRowsImport01387(store,current,built,meta){
  const next=clone(current);next.products=arr(next.products);next.categories=arr(next.categories);next.media=arr(next.media);next.variants=arr(next.variants);const productMap=new Map(),mediaStats={created:0,reused:0,copied:0,copyReused:0,external:0,copySourceBytes:0,copyStoredBytes:0,copySavedBytes:0},uploadedAssets=[],mediaContext={store,sourceName:str(meta.sourceName),stats:mediaStats,copyExternal:!!built.options.copySupplierMedia,uploadedAssets};let commitStarted=false;try{
  for(const group of built.groups){
    const first=group.rows[0]?.row;if(!first)continue;let product=group.existing?next.products.find(p=>p.id===group.existing.id):null;
    if(product){const patch=await applyMappedPatch(product,first,next,built.options,mediaContext),cfg=obj(product.configuration),variantCfg=obj(cfg.variantEngine01260),keys=[...new Set(Object.keys(first.variant.options||{}))];product=createMarketplaceProduct01052({...product,...patch,configuration:{...cfg,variantEngine01260:{...variantCfg,attributeOrder:[...new Set([...arr(variantCfg.attributeOrder),...keys])]},import01387:{...obj(cfg.import01387),externalGroupKey:first.productGroup||obj(cfg.import01387).externalGroupKey||''}},id:product.id,createdAt:product.createdAt,updatedAt:new Date().toISOString()});next.products[next.products.findIndex(p=>p.id===product.id)]=product;
    }else{const patch=await applyMappedPatch(null,first,next,built.options,mediaContext),keys=Object.keys(first.variant.options||{}),parentSku=uniqueParentSku(next,first);product=createMarketplaceProduct01052({...patch,name:first.name,sku:parentSku,status:patch.status||'draft',slug:patch.slug||slugify(first.name),price:patch.price??first.variant.price??0,oldPrice:patch.oldPrice??first.variant.oldPrice??0,stock:patch.stock??0,configuration:{...obj(patch.configuration),variantEngine01260:{...obj(patch.configuration?.variantEngine01260),attributeOrder:keys},import01387:{externalGroupKey:first.productGroup||''}}});next.products.push(product);}
    productMap.set(group.key,product);
  }
  for(const item of built.plan){if(item.action==='skip'||item.action==='error')continue;const product=productMap.get(item.groupKey);if(!product)continue;const r=item.row;if(item.action==='update'){
      const idx=next.variants.findIndex(v=>v.id===item.existingId);if(idx<0)continue;const existing=next.variants[idx],patch=await variantPatch(existing,r,product,next,mediaContext);next.variants[idx]=createMarketplaceVariant01052({...existing,...patch,id:existing.id,productId:product.id,createdAt:existing.createdAt,updatedAt:new Date().toISOString()});
    }else{const patch=await variantPatch(null,r,product,next,mediaContext),created=createMarketplaceVariant01052({...patch,productId:product.id});next.variants.push(created);}
  }
  for(const product of productMap.values())syncVariantProduct(next,product);
  const completedAt=new Date().toISOString(),history=createTransferHistoryEntry01392({kind:'import',status:'success',at:str(meta.startedAtIso)||completedAt,completedAt,durationMs:Math.max(0,Date.now()-(Number(meta.startedAt)||Date.now())),sourceName:str(meta.sourceName),format:str(meta.format)||'',profileId:str(meta.profileId),profileName:str(meta.profileName),rowMode:'variants',rows:built.canonicalRows.length,productsCreated:built.counts.productCreate,productsUpdated:built.counts.productUpdate,variantsCreated:built.counts.variantCreate,variantsUpdated:built.counts.variantUpdate,skipped:built.counts.variantSkip,errors:0,mediaCreated:mediaStats.created,mediaReused:mediaStats.reused,mediaCopied:mediaStats.copied,mediaCopyReused:mediaStats.copyReused,mediaExternal:mediaStats.external,mediaCopySourceBytes:mediaStats.copySourceBytes,mediaCopyStoredBytes:mediaStats.copyStoredBytes,mediaCopySavedBytes:mediaStats.copySavedBytes,supplierSourceId:str(meta.supplierSourceId),syncMode:str(meta.syncMode),fieldChanges:built.diff01390?.summary?.fieldChanges||0,changedUpdates:built.diff01390?.summary?.changedUpdates||0,unchangedUpdates:built.diff01390?.summary?.unchangedUpdates||0,sourceKind:str(meta.sourceKind),sourceRef:str(meta.sourceRef),sheetGid:str(meta.sheetGid),sheetName:str(meta.sheetName),sheetRange:str(meta.sheetRange),sheetAccessMode:str(meta.sheetAccessMode),googleCredentialId:str(meta.googleCredentialId),xmlItemPath:str(meta.xmlItemPath),rollbackAvailable01397:(built.counts.productCreate+built.counts.productUpdate+built.counts.variantCreate+built.counts.variantUpdate)>0});
  prependTransferHistory01392(next,history);if(meta.profileId)next.settings={...(next.settings||{}),importProfiles:markImportProfileUsed01392(getImportProfiles01060(next),meta.profileId,completedAt)};
  const expectedProductCount=arr(current.products).length+built.counts.productCreate,expectedVariantCount=arr(current.variants).length+built.counts.variantCreate,expectedMediaCount=arr(current.media).length+mediaStats.created;
  const reason=built.mediaEnabled?'import:products-variants-media:01389':'import:products-variants:01387',source=built.mediaEnabled?'products-variants-media-01389':'products-variants-01387';
  commitStarted=true;await store.replaceSnapshot(next,reason,{sourceKind:marketplaceImportSourceKind01386(source),rollbackJobId:history.rollbackAvailable01397?history.id:''});const verified=await store.refresh(`${reason}:verify`);const verifiedHistory=getImportHistory01060(verified).some(item=>item?.id===history.id);
  if(arr(verified?.products).length!==expectedProductCount||arr(verified?.variants).length!==expectedVariantCount||arr(verified?.media).length!==expectedMediaCount||!verifiedHistory){const error=new Error('MARKETPLACE_IMPORT_VERIFY_FAILED_01386');error.code='MARKETPLACE_IMPORT_VERIFY_FAILED_01386';throw error;}
  return {...built,history,mediaStats,verified:true};
  }catch(error){if(!commitStarted&&uploadedAssets.length)await rollbackCopiedImportAssets01396(uploadedAssets);throw error;}
}
export async function executeProductImport01060(store,rows,mapping,options={},meta={}){
  if(!store)throw new Error('MarketplaceStore required.');assertMarketplaceImportDatabase01386(store);const current=store.getState(),built=buildProductImportPlan01060(rows,mapping,current,options);if(built.counts.error){const error=new Error('MARKETPLACE_IMPORT_VALIDATION_BLOCKED_01387');error.code='MARKETPLACE_IMPORT_VALIDATION_BLOCKED_01387';error.count=built.counts.error;throw error;}
  if(built.rowMode==='variants')return executeVariantRowsImport01387(store,current,built,meta);
  const next=clone(current);next.products=arr(next.products);next.categories=arr(next.categories);next.media=arr(next.media);const productById=new Map(next.products.map((p,i)=>[p.id,{p,i}])),mediaStats={created:0,reused:0,copied:0,copyReused:0,external:0,copySourceBytes:0,copyStoredBytes:0,copySavedBytes:0},uploadedAssets=[],mediaContext={store,sourceName:str(meta.sourceName),stats:mediaStats,copyExternal:!!built.options.copySupplierMedia,uploadedAssets};let commitStarted=false;try{
  for(const item of built.plan){if(item.action==='skip')continue;const r=item.row;if(item.action==='update'){const ref=productById.get(item.existingId);if(!ref)continue;const patch=await applyMappedPatch(ref.p,r,next,built.options,mediaContext);const merged=createMarketplaceProduct01052({...ref.p,...patch,id:ref.p.id,createdAt:ref.p.createdAt,updatedAt:new Date().toISOString()});next.products[ref.i]=merged;ref.p=merged;}else{const patch=await applyMappedPatch(null,r,next,built.options,mediaContext);const created=createMarketplaceProduct01052({...patch,name:r.name,sku:r.sku,status:patch.status||'draft',slug:patch.slug||slugify(r.name)});next.products.push(created);productById.set(created.id,{p:created,i:next.products.length-1});}}
  const completedAt=new Date().toISOString(),history=createTransferHistoryEntry01392({kind:'import',status:'success',at:str(meta.startedAtIso)||completedAt,completedAt,durationMs:Math.max(0,Date.now()-(Number(meta.startedAt)||Date.now())),sourceName:str(meta.sourceName),format:str(meta.format)||'',profileId:str(meta.profileId),profileName:str(meta.profileName),rowMode:'products',rows:rows.length,productsCreated:built.counts.create,productsUpdated:built.counts.update,skipped:built.counts.skip,errors:0,mediaCreated:mediaStats.created,mediaReused:mediaStats.reused,mediaCopied:mediaStats.copied,mediaCopyReused:mediaStats.copyReused,mediaExternal:mediaStats.external,mediaCopySourceBytes:mediaStats.copySourceBytes,mediaCopyStoredBytes:mediaStats.copyStoredBytes,mediaCopySavedBytes:mediaStats.copySavedBytes,supplierSourceId:str(meta.supplierSourceId),syncMode:str(meta.syncMode),fieldChanges:built.diff01390?.summary?.fieldChanges||0,changedUpdates:built.diff01390?.summary?.changedUpdates||0,unchangedUpdates:built.diff01390?.summary?.unchangedUpdates||0,sourceKind:str(meta.sourceKind),sourceRef:str(meta.sourceRef),sheetGid:str(meta.sheetGid),sheetName:str(meta.sheetName),sheetRange:str(meta.sheetRange),sheetAccessMode:str(meta.sheetAccessMode),googleCredentialId:str(meta.googleCredentialId),xmlItemPath:str(meta.xmlItemPath),rollbackAvailable01397:(built.counts.create+built.counts.update)>0});prependTransferHistory01392(next,history);if(meta.profileId)next.settings={...(next.settings||{}),importProfiles:markImportProfileUsed01392(getImportProfiles01060(next),meta.profileId,completedAt)};const expectedProductCount=arr(current.products).length+built.counts.create,expectedMediaCount=arr(current.media).length+mediaStats.created;
  const reason=built.mediaEnabled?'import:products-media:01389':'import:products:01386',source=built.mediaEnabled?'products-media-01389':'products';commitStarted=true;await store.replaceSnapshot(next,reason,{sourceKind:marketplaceImportSourceKind01386(source),rollbackJobId:history.rollbackAvailable01397?history.id:''});const verified=await store.refresh(`${reason}:verify`);const verifiedHistory=getImportHistory01060(verified).some(item=>item?.id===history.id);if(arr(verified?.products).length!==expectedProductCount||arr(verified?.media).length!==expectedMediaCount||!verifiedHistory){const error=new Error('MARKETPLACE_IMPORT_VERIFY_FAILED_01386');error.code='MARKETPLACE_IMPORT_VERIFY_FAILED_01386';throw error;}return {...built,history,mediaStats,verified:true};
  }catch(error){if(!commitStarted&&uploadedAssets.length)await rollbackCopiedImportAssets01396(uploadedAssets);throw error;}
}
export async function saveImportProfile01060(store,{name,supplierName,format,mapping,sourceHeaders,options,sourceConfig}={}){assertMarketplaceImportDatabase01386(store);const state=store.getState(),profiles=getImportProfiles01060(state),stamp=new Date().toISOString(),draft=normalizeImportProfile01392({id:`map_${Date.now().toString(36)}`,name:str(name)||`profile-${profiles.length+1}`,supplierName:str(supplierName),entity:'products',format:str(format),mapping:{...(mapping||{})},sourceHeaders:arr(sourceHeaders),sourceConfig:{...(sourceConfig||{})},options:{...(options||{})},createdAt:stamp,updatedAt:stamp});const idx=profiles.findIndex(x=>norm(x.name)===norm(draft.name));let profile=draft;if(idx>=0){const previous=profiles[idx];profile=normalizeImportProfile01392({...draft,id:previous.id,createdAt:previous.createdAt||stamp,usageCount:previous.usageCount||0,lastUsedAt:previous.lastUsedAt||''});profiles[idx]=profile;}else profiles.unshift(profile);state.settings={...(state.settings||{}),importProfiles:profiles.slice(0,100)};await store.replaceSnapshot(state,'import-profile:save:01392',{sourceKind:marketplaceImportSourceKind01386('mapping-profile-01392')});const verified=await store.refresh('import-profile:save:01392:verify');if(!getImportProfiles01060(verified).some(x=>x.id===profile.id)){const error=new Error('MARKETPLACE_IMPORT_PROFILE_VERIFY_FAILED_01392');error.code='MARKETPLACE_IMPORT_PROFILE_VERIFY_FAILED_01392';throw error;}return profile;}
export async function deleteImportProfile01060(store,id){assertMarketplaceImportDatabase01386(store);const state=store.getState();state.settings={...(state.settings||{}),importProfiles:getImportProfiles01060(state).filter(x=>x.id!==id)};await store.replaceSnapshot(state,'import-profile:delete:01392',{sourceKind:marketplaceImportSourceKind01386('mapping-profile-01392')});const verified=await store.refresh('import-profile:delete:01392:verify');if(getImportProfiles01060(verified).some(x=>x.id===id)){const error=new Error('MARKETPLACE_IMPORT_PROFILE_DELETE_VERIFY_FAILED_01392');error.code='MARKETPLACE_IMPORT_PROFILE_DELETE_VERIFY_FAILED_01392';throw error;}}
export async function recordMarketplaceTransferHistory01392(store,entry){assertMarketplaceImportDatabase01386(store);const state=store.getState(),record=prependTransferHistory01392(state,entry);await store.replaceSnapshot(state,`import-export-history:${record.kind}:01392`,{sourceKind:marketplaceImportSourceKind01386('transfer-history-01392')});const verified=await store.refresh(`import-export-history:${record.kind}:01392:verify`);if(!getImportHistory01060(verified).some(x=>x.id===record.id)){const error=new Error('MARKETPLACE_IMPORT_EXPORT_HISTORY_VERIFY_FAILED_01392');error.code='MARKETPLACE_IMPORT_EXPORT_HISTORY_VERIFY_FAILED_01392';throw error;}return record;}

export function exportProducts01060(state,format='csv',options={}){
  return generateMarketplaceCatalogExport01391(state,format,options);
}
