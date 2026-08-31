// 01063 · Marketplace SEO service.
// Pure/storage-agnostic selectors and generators over canonical Marketplace snapshot.

const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const str=v=>String(v??'').trim();
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const uniq=a=>[...new Set(arr(a).map(str).filter(Boolean))];
const escXml=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const normalizeUrlBase=v=>str(v).replace(/\/+$/,'');
const absoluteUrl=(base,path='')=>{const p=str(path);if(/^https?:\/\//i.test(p))return p;const b=normalizeUrlBase(base);if(!b)return p;return `${b}/${p.replace(/^\/+/, '')}`};
const cleanSlug=v=>str(v).replace(/^\/+|\/+$/g,'');
const money=(value,currency='UAH')=>`${num(value).toFixed(2)} ${str(currency)||'UAH'}`;

export const SEO_ENTITY_TYPES_01063=Object.freeze({product:'Товар',category:'Категорія'});
export const SEO_FILTER_MODES_01063=Object.freeze({safe:'Безпечно',none:'Noindex усі',all:'Index усі'});

export function getSeoCenterSettings01063(state={}){
  const extra=obj(obj(state.settings).seoCenter01063),seo=obj(state.seo),defaults=obj(seo.defaults),structuredData=obj(seo.structuredData),indexing=obj(seo.indexing),openGraph=obj(seo.openGraph),diagnostics=obj(seo.diagnostics);
  return {
    publicBaseUrl:str(extra.publicBaseUrl),siteName:str(extra.siteName)||'Marketplace',organizationName:str(extra.organizationName)||str(extra.siteName)||'Marketplace',organizationUrl:str(extra.organizationUrl),logoMediaId:str(extra.logoMediaId),
    defaultRobots:str(extra.defaultRobots)||'index,follow',locale:str(defaults.locale)||str(obj(state.settings).locale)||'uk-UA',currency:str(defaults.currency)||str(obj(state.settings).currency)||'UAH',canonicalMode:str(defaults.canonicalMode)||'auto',filterIndexMode:str(defaults.filterIndexMode)||str(indexing.filters)||'safe',
    titleTemplate:str(defaults.titleTemplate)||'{name} | {site}',descriptionTemplate:str(defaults.descriptionTemplate)||'{name}. {shortDescription}',sitemapEnabled:obj(seo.sitemap).enabled!==false,
    structuredData:{product:structuredData.product!==false,productGroup:structuredData.productGroup!==false,offer:structuredData.offer!==false,breadcrumb:structuredData.breadcrumb!==false},
    indexing:{products:indexing.products!==false,categories:indexing.categories!==false,filters:str(indexing.filters)||'safe'},
    openGraph:{enabled:openGraph.enabled!==false,defaultImageMediaId:str(openGraph.defaultImageMediaId)},diagnostics:{altRequired:diagnostics.altRequired!==false,missingMetaWarning:diagnostics.missingMetaWarning!==false}
  };
}

function mediaById(state,id){return arr(state.media).find(m=>m.id===id)||null}
function categoryById(state,id){return arr(state.categories).find(c=>c.id===id)||null}
function variantRows(state,pid){return arr(state.variants).filter(v=>v.productId===pid&&v.status!=='archived')}
function primaryImage(state,entity,type,settings){const id=type==='product'?(entity.primaryMediaId||arr(entity.mediaIds)[0]):entity.imageMediaId;return mediaById(state,id)||mediaById(state,settings.openGraph.defaultImageMediaId)||null}
function parentCategoryChain(state,category){const map=new Map(arr(state.categories).map(c=>[c.id,c])),out=[];let cur=category,guard=0;while(cur&&guard++<30){out.unshift(cur);cur=cur.parentId?map.get(cur.parentId):null}return out}
function productCategory(state,product){return categoryById(state,arr(product.categoryIds)[0])}

export function renderSeoTemplate01063(template,ctx={}){
  return str(template).replace(/\{([a-zA-Z0-9_]+)\}/g,(_,k)=>str(ctx[k]));
}

export function getEntitySeoData01063(state={},entityType='product',entityOrId=''){
  const settings=getSeoCenterSettings01063(state),list=entityType==='category'?arr(state.categories):arr(state.products),entity=typeof entityOrId==='string'?list.find(x=>x.id===entityOrId):entityOrId;if(!entity)return null;
  const seo=obj(entity.seo),category=entityType==='product'?productCategory(state,entity):entity;
  const ctx={name:entity.name,brand:entity.brand,price:entityType==='product'?money(entity.price,entity.currency||settings.currency):'',category:category?.name||'',site:settings.siteName,shortDescription:entity.shortDescription||entity.description||''};
  const generatedTitle=renderSeoTemplate01063(settings.titleTemplate,ctx)||entity.name;
  const generatedDescription=renderSeoTemplate01063(settings.descriptionTemplate,ctx)||str(entity.shortDescription||entity.description);
  const defaultPath=entityType==='product'?`product/${cleanSlug(entity.slug||entity.id)}`:`category/${cleanSlug(entity.slug||entity.id)}`;
  const sourcePath=entity.url||defaultPath;
  const autoCanonical=absoluteUrl(settings.publicBaseUrl,sourcePath);
  const canonicalUrl=str(seo.canonicalUrl)||autoCanonical;
  const robots=str(seo.robots)||settings.defaultRobots;
  const image=primaryImage(state,entity,entityType,settings);
  return {entityType,entity,generatedTitle,generatedDescription,metaTitle:str(seo.metaTitle)||generatedTitle,metaDescription:str(seo.metaDescription)||generatedDescription,canonicalUrl,autoCanonical,robots,index:!/^noindex/i.test(robots),openGraphTitle:str(seo.openGraphTitle)||str(seo.metaTitle)||generatedTitle,openGraphDescription:str(seo.openGraphDescription)||str(seo.metaDescription)||generatedDescription,openGraphImageMediaId:str(seo.openGraphImageMediaId)||image?.id||'',openGraphImageUrl:image?.url||'',slug:str(entity.slug),url:str(entity.url)||sourcePath};
}

export function getFilterIndexDecision01063(state={},filter={}){
  const settings=getSeoCenterSettings01063(state),mode=str(settings.indexing.filters)||'safe',override=str(obj(filter.config).seoIndex)||'inherit';if(override==='index')return{index:true,reason:'filter override'};if(override==='noindex')return{index:false,reason:'filter override'};if(mode==='all')return{index:filter.enabled!==false,reason:'global all'};if(mode==='none')return{index:false,reason:'global none'};return{index:false,reason:'safe mode: explicit index required'};
}

export function getSitemapEntries01063(state={}){
  const s=getSeoCenterSettings01063(state),entries=[];if(!s.sitemapEnabled||!s.publicBaseUrl)return entries;
  if(s.indexing.products)for(const p of arr(state.products)){if(p.status!=='active')continue;const x=getEntitySeoData01063(state,'product',p);if(x?.index&&x.canonicalUrl)entries.push({type:'product',id:p.id,loc:x.canonicalUrl,lastmod:p.updatedAt||p.createdAt||''});}
  if(s.indexing.categories)for(const c of arr(state.categories)){if(c.status!=='active')continue;const x=getEntitySeoData01063(state,'category',c);if(x?.index&&x.canonicalUrl)entries.push({type:'category',id:c.id,loc:x.canonicalUrl,lastmod:c.updatedAt||c.createdAt||''});}
  return entries;
}
export function generateSitemapXml01063(state={}){const rows=getSitemapEntries01063(state);const body=rows.map(r=>`  <url><loc>${escXml(r.loc)}</loc>${r.lastmod?`<lastmod>${escXml(String(r.lastmod).slice(0,10))}</lastmod>`:''}</url>`).join('\n');return{rows,fileName:'sitemap.xml',mime:'application/xml;charset=utf-8',text:`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`};}

function productOffers(state,product,settings){const variants=variantRows(state,product.id);if(variants.length){return variants.map(v=>({'@type':'Offer',sku:v.sku||undefined,price:num(v.price||product.price),priceCurrency:product.currency||settings.currency,availability:(v.availability==='out-of-stock'?'https://schema.org/OutOfStock':v.availability==='preorder'?'https://schema.org/PreOrder':'https://schema.org/InStock'),url:getEntitySeoData01063(state,'product',product)?.canonicalUrl||undefined}));}return[{'@type':'Offer',sku:product.sku||undefined,price:num(product.price),priceCurrency:product.currency||settings.currency,availability:(product.availability==='out-of-stock'?'https://schema.org/OutOfStock':product.availability==='preorder'?'https://schema.org/PreOrder':'https://schema.org/InStock'),url:getEntitySeoData01063(state,'product',product)?.canonicalUrl||undefined}];}

export function generateStructuredData01063(state={},entityType='product',entityOrId=''){
  const s=getSeoCenterSettings01063(state),x=getEntitySeoData01063(state,entityType,entityOrId);if(!x)return null;const e=x.entity,image=primaryImage(state,e,entityType,s);const graph=[];
  if(entityType==='product'&&s.structuredData.product){const variants=variantRows(state,e.id);const node={'@type':variants.length&&s.structuredData.productGroup?'ProductGroup':'Product','@id':x.canonicalUrl?`${x.canonicalUrl}#product`:undefined,name:e.name,description:x.metaDescription||undefined,url:x.canonicalUrl||undefined,image:image?.url?[absoluteUrl(s.publicBaseUrl,image.url)]:undefined,brand:e.brand?{'@type':'Brand',name:e.brand}:undefined,sku:e.sku||undefined};if(s.structuredData.offer){const offers=productOffers(state,e,s);node.offers=offers.length===1?offers[0]:offers;}if(variants.length&&s.structuredData.productGroup){node.productGroupID=e.id;node.hasVariant=variants.map(v=>({'@type':'Product',sku:v.sku||undefined,name:`${e.name} ${Object.values(obj(v.options)).join(' ')}`.trim(),offers:s.structuredData.offer?{'@type':'Offer',sku:v.sku||undefined,price:num(v.price||e.price),priceCurrency:e.currency||s.currency,availability:(v.availability==='out-of-stock'?'https://schema.org/OutOfStock':v.availability==='preorder'?'https://schema.org/PreOrder':'https://schema.org/InStock'),url:x.canonicalUrl||undefined}:undefined}));}graph.push(node);}
  if(s.structuredData.breadcrumb){const chain=entityType==='category'?parentCategoryChain(state,e):parentCategoryChain(state,productCategory(state,e));const items=chain.filter(Boolean).map((c,i)=>({'@type':'ListItem',position:i+1,name:c.name,item:getEntitySeoData01063(state,'category',c)?.canonicalUrl||undefined}));if(entityType==='product')items.push({'@type':'ListItem',position:items.length+1,name:e.name,item:x.canonicalUrl||undefined});if(items.length)graph.push({'@type':'BreadcrumbList',itemListElement:items});}
  if(s.organizationName)graph.push({'@type':'Organization',name:s.organizationName,url:s.organizationUrl||s.publicBaseUrl||undefined,logo:mediaById(state,s.logoMediaId)?.url?absoluteUrl(s.publicBaseUrl,mediaById(state,s.logoMediaId).url):undefined});
  return {'@context':'https://schema.org','@graph':graph};
}

export function getSeoDiagnostics01063(state={}){
  const s=getSeoCenterSettings01063(state),issues=[],warnings=[];const seenProd=new Map(),seenCat=new Map(),seenCanonical=new Map();let missingMeta=0,missingAlt=0,indexableProducts=0,indexableCategories=0;
  if(!s.publicBaseUrl)issues.push({code:'base-url',severity:'critical',label:'Не задано публічний URL магазину'});else if(!/^https:\/\//i.test(s.publicBaseUrl))warnings.push({code:'https',severity:'warning',label:'Публічний URL бажано використовувати через HTTPS'});
  for(const [type,list] of [['product',arr(state.products)],['category',arr(state.categories)]])for(const e of list){if(!e.slug)warnings.push({code:`${type}-slug`,severity:'warning',id:e.id,label:`${type==='product'?'Товар':'Категорія'} «${e.name||e.id}» без slug`});const map=type==='product'?seenProd:seenCat,key=str(e.slug).toLowerCase();if(key){if(map.has(key))issues.push({code:`${type}-duplicate-slug`,severity:'critical',id:e.id,label:`Дубль slug «${e.slug}»`});else map.set(key,e.id)}const x=getEntitySeoData01063(state,type,e);if(type==='product'&&e.status==='active'&&x?.index)indexableProducts++;if(type==='category'&&e.status==='active'&&x?.index)indexableCategories++;if(s.diagnostics.missingMetaWarning&&(!str(obj(e.seo).metaTitle)||!str(obj(e.seo).metaDescription))){missingMeta++;warnings.push({code:`${type}-meta`,severity:'warning',id:e.id,label:`«${e.name||e.id}»: meta використовує шаблон, немає ручного override`});}if(x?.metaTitle?.length>60)warnings.push({code:`${type}-title-length`,severity:'warning',id:e.id,label:`«${e.name||e.id}»: meta title ${x.metaTitle.length} символів (>60)`});if(x?.metaDescription?.length>160)warnings.push({code:`${type}-description-length`,severity:'warning',id:e.id,label:`«${e.name||e.id}»: meta description ${x.metaDescription.length} символів (>160)`});if(str(x?.canonicalUrl)&&s.publicBaseUrl&&!/^https?:\/\//i.test(x.canonicalUrl))issues.push({code:`${type}-canonical`,severity:'critical',id:e.id,label:`«${e.name||e.id}»: canonical не абсолютний URL`});const can=str(x?.canonicalUrl).toLowerCase();if(can){if(seenCanonical.has(can)&&seenCanonical.get(can)!==`${type}:${e.id}`)issues.push({code:'duplicate-canonical',severity:'critical',id:e.id,label:`Canonical дублюється: ${x.canonicalUrl}`});else seenCanonical.set(can,`${type}:${e.id}`)}if(s.openGraph.enabled&&!x?.openGraphImageMediaId)warnings.push({code:`${type}-og-image`,severity:'warning',id:e.id,label:`«${e.name||e.id}»: немає OpenGraph/primary image`});}
  if(s.diagnostics.altRequired)for(const m of arr(state.media).filter(x=>x.kind==='image'))if(!str(m.alt)){missingAlt++;warnings.push({code:'media-alt',severity:'warning',id:m.id,label:`Зображення «${m.fileName||m.id}» без ALT`});}
  const filterRows=arr(state.filters).map(f=>({...f,seoDecision:getFilterIndexDecision01063(state,f)}));const indexableFilters=filterRows.filter(f=>f.seoDecision.index).length;
  const penalty=Math.min(100,issues.length*15+Math.min(40,warnings.length*2)),health=Math.max(0,100-penalty);
  return {health,critical:issues.length,warnings:warnings.length,issues,warningsList:warnings,missingMeta,missingAlt,indexableProducts,indexableCategories,indexableFilters,sitemapEntries:getSitemapEntries01063(state).length,filterRows,ready:issues.length===0};
}

export function getSeoBindingData01063(state={},entityType='product',id=''){
  const entity=getEntitySeoData01063(state,entityType,id);if(!entity)return null;return{...entity,structuredData:generateStructuredData01063(state,entityType,id)};
}
