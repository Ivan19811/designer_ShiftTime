// 01061 · Feed Manager domain/service layer.
// Pure catalog -> channel mapping -> validation -> document generation.
// No LocalRepository/localStorage/Supabase/PostgreSQL access.

const arr=v=>Array.isArray(v)?v:[];
const str=v=>String(v??'').trim();
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const escXml=v=>String(v??'').replace(/[<>&"']/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[m]));
const norm=v=>str(v).toLocaleLowerCase('uk-UA');
const slug=v=>str(v).toLocaleLowerCase('uk-UA').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'');
const uniq=a=>[...new Set(arr(a).filter(Boolean))];

export const MARKETPLACE_FEED_CHANNELS_01061=Object.freeze({
  google:Object.freeze({
    id:'google',label:'Google Merchant',format:'xml',badge:'GOOGLE',
    description:'Merchant Center starter feed: основні product fields, price, availability, images та item group.',
    defaultMapping:Object.freeze({
      'g:id':'externalId','g:title':'name','g:description':'description','g:link':'url','g:image_link':'image',
      'g:availability':'availabilityGoogle','g:price':'priceFormatted','g:condition':'condition','g:brand':'brand','g:item_group_id':'groupId'
    }),
    required:Object.freeze(['g:id','g:title','g:description','g:link','g:image_link','g:availability','g:price','g:condition'])
  }),
  meta:Object.freeze({
    id:'meta',label:'Meta Catalog',format:'csv',badge:'META',
    description:'Catalog starter feed для Facebook / Instagram Commerce.',
    defaultMapping:Object.freeze({
      id:'externalId',title:'name',description:'description',availability:'availabilityMeta',condition:'condition',price:'priceFormatted',link:'url',image_link:'image',brand:'brand',item_group_id:'groupId'
    }),
    required:Object.freeze(['id','title','description','availability','condition','price','link','image_link'])
  }),
  prom:Object.freeze({
    id:'prom',label:'Prom',format:'xml',badge:'PROM',
    description:'XML starter mapping для каталогу Prom: товар, SKU, ціна, категорія, stock та image.',
    defaultMapping:Object.freeze({
      id:'externalId',name:'name',vendorCode:'sku',price:'price',currencyId:'currency',categoryId:'categoryId',category:'categoryPath',available:'availableBoolean',stock_quantity:'stock',picture:'image',description:'description',vendor:'brand'
    }),
    required:Object.freeze(['id','name','price','currencyId','categoryId','picture'])
  }),
  rozetka:Object.freeze({
    id:'rozetka',label:'Rozetka',format:'xml',badge:'ROZETKA',
    description:'XML starter mapping для marketplace catalog: offer id, name, vendor, price, stock, category та picture.',
    defaultMapping:Object.freeze({
      id:'externalId',name:'name',vendorCode:'sku',price:'price',currencyId:'currency',categoryId:'categoryId',category:'categoryPath',stock_quantity:'stock',available:'availableBoolean',picture:'image',description:'description',vendor:'brand'
    }),
    required:Object.freeze(['id','name','price','currencyId','categoryId','picture'])
  }),
  custom:Object.freeze({
    id:'custom',label:'Власний feed',format:'xml',badge:'CUSTOM',
    description:'Повністю керована XML / CSV / JSON схема для партнера, сайту або API.',
    defaultMapping:Object.freeze({id:'externalId',name:'name',sku:'sku',price:'price',currency:'currency',stock:'stock',availability:'availability',category:'categoryPath',image:'image',url:'url',description:'description'}),
    required:Object.freeze(['id','name'])
  })
});

export function getFeedChannelPreset01061(channel='custom'){
  return MARKETPLACE_FEED_CHANNELS_01061[channel]||MARKETPLACE_FEED_CHANNELS_01061.custom;
}

export function getFeedSourceFields01061(state){
  const base=[
    ['externalId','Marketplace / Variant ID'],['groupId','Product group ID'],['sku','SKU'],['name','Назва'],
    ['shortDescription','Короткий опис'],['description','Опис'],['brand','Бренд'],['price','Ціна'],['priceFormatted','Ціна + валюта'],
    ['oldPrice','Стара ціна'],['currency','Валюта'],['stock','Залишок'],['availability','Availability'],
    ['availabilityGoogle','Google availability'],['availabilityMeta','Meta availability'],['availableBoolean','Available true/false'],
    ['condition','Condition = new'],['categoryId','Category ID'],['categoryName','Категорія'],['categoryPath','Шлях категорії'],
    ['image','Основне фото'],['additionalImages','Додаткові фото'],['url','URL товару'],['slug','Slug'],['variantOptions','Опції варіації']
  ].map(([id,label])=>({id,label,group:'Product'}));
  const attrs=arr(state?.attributes).map(a=>({id:`attribute:${a.key}`,label:`Характеристика · ${a.name}${a.unit?` (${a.unit})`:''}`,group:'Attributes'}));
  return [...base,...attrs];
}

export function createFeedDraft01061(channel='custom',overrides={}){
  const p=getFeedChannelPreset01061(channel);
  return {
    name:overrides.name||p.label,
    channel:p.id,
    format:overrides.format||p.format,
    status:overrides.status||'draft',
    mapping:{...p.defaultMapping,...(overrides.mapping||{})},
    rules:arr(overrides.rules),
    settings:{
      baseUrl:'',productPath:'/product/{slug}',onlyActive:true,onlyInStock:false,includeVariants:false,
      categoryIds:[],minPrice:'',maxPrice:'',schedule:'manual',scheduleTime:'08:00',
      rootTag:'products',itemTag:'product',delimiter:';',fileName:`${p.id}-products`,
      ...overrides.settings
    }
  };
}

function categoryPath(id,cats){
  const map=new Map(cats.map(c=>[c.id,c]));let cur=map.get(id),parts=[],guard=0;
  while(cur&&guard++<30){parts.unshift(cur.name||cur.slug||cur.id);cur=cur.parentId?map.get(cur.parentId):null;}
  return parts.join(' > ');
}
function productUrl(product,settings){
  const base=str(settings?.baseUrl).replace(/\/+$/,'');
  const pattern=str(settings?.productPath)||'/product/{slug}';
  const path=pattern.replaceAll('{slug}',encodeURIComponent(product.slug||product.id)).replaceAll('{id}',encodeURIComponent(product.id));
  if(/^https?:\/\//i.test(path))return path;
  return base?`${base}${path.startsWith('/')?'':'/'}${path}`:path;
}
function availabilityGoogle(v){return v==='preorder'?'preorder':v==='out-of-stock'?'out_of_stock':'in_stock';}
function availabilityMeta(v){return v==='preorder'?'available for order':v==='out-of-stock'?'out of stock':'in stock';}
function mediaUrls(ids,media){const map=new Map(media.map(m=>[m.id,m]));return uniq(ids.map(id=>str(map.get(id)?.url)).filter(Boolean));}
function variantLabel(options){return Object.entries(options||{}).map(([k,v])=>`${k}: ${v}`).join(' · ');}

export function buildFeedCatalogRecords01061(state,feed){
  const settings=feed?.settings||{},cats=arr(state?.categories),media=arr(state?.media),variants=arr(state?.variants),catSet=new Set(arr(settings.categoryIds));
  const variantsByProduct=new Map();variants.forEach(v=>{if(!variantsByProduct.has(v.productId))variantsByProduct.set(v.productId,[]);variantsByProduct.get(v.productId).push(v);});
  const records=[];
  for(const p of arr(state?.products)){
    if(settings.onlyActive!==false&&p.status!=='active')continue;
    if(p.status==='archived')continue;
    if(settings.onlyInStock&&!(p.availability!=='out-of-stock'&&num(p.stock)>0))continue;
    if(catSet.size&&!arr(p.categoryIds).some(id=>catSet.has(id)))continue;
    if(settings.minPrice!==''&&num(p.price)<num(settings.minPrice))continue;
    if(settings.maxPrice!==''&&num(p.price)>num(settings.maxPrice))continue;
    const excluded=arr(p.feed?.excludedChannels);if(p.feed?.excluded===true||excluded.includes(feed.channel)||p.feed?.channels?.[feed.channel]===false)continue;
    const vs=settings.includeVariants?arr(variantsByProduct.get(p.id)).filter(v=>v.status!=='archived'):[];
    const rows=vs.length?vs:[null];
    for(const v of rows){
      const merged={
        product:p,variant:v,externalId:v?.id||p.id,groupId:v?p.id:'',sku:v?.sku||p.sku,name:p.name,
        shortDescription:p.shortDescription,description:p.description||p.shortDescription,brand:p.brand,
        price:v?num(v.price,p.price):num(p.price),oldPrice:v?num(v.oldPrice,p.oldPrice):num(p.oldPrice),currency:p.currency||'UAH',
        stock:v?num(v.stock):num(p.stock),availability:v?.availability||p.availability||'in-stock',slug:p.slug,
        categoryId:arr(p.categoryIds)[0]||'',categoryName:'',categoryPath:'',image:'',additionalImages:'',url:'',
        attributes:{...(p.attributes||{})},variantOptions:v?.options||{}
      };
      const c=cats.find(x=>x.id===merged.categoryId);merged.categoryName=c?.name||'';merged.categoryPath=merged.categoryId?categoryPath(merged.categoryId,cats):'';
      const mids=uniq([v?.primaryMediaId,...arr(v?.mediaIds),p.primaryMediaId,...arr(p.mediaIds)]);const urls=mediaUrls(mids,media);merged.image=urls[0]||'';merged.additionalImages=urls.slice(1).join(' | ');
      merged.url=productUrl(p,settings);merged.condition='new';merged.priceFormatted=`${merged.price.toFixed(2)} ${merged.currency}`;
      merged.availabilityGoogle=availabilityGoogle(merged.availability);merged.availabilityMeta=availabilityMeta(merged.availability);merged.availableBoolean=merged.availability!=='out-of-stock'&&merged.stock>0?'true':'false';merged.variantOptions=variantLabel(merged.variantOptions);
      records.push(merged);
    }
  }
  return records;
}

export function readFeedSourceValue01061(record,source){
  if(!record)return'';if(source?.startsWith?.('attribute:'))return record.attributes?.[source.slice(10)]??'';return record[source]??'';
}

export function mapFeedRecord01061(record,mapping){
  const out={};for(const [target,source] of Object.entries(mapping||{})){if(!target||!source)continue;out[target]=readFeedSourceValue01061(record,source);}return out;
}

export function validateFeed01061(state,feed){
  const preset=getFeedChannelPreset01061(feed?.channel),mapping=feed?.mapping||{},configErrors=[],warnings=[];
  if(!str(feed?.name))configErrors.push('Вкажи назву feed.');
  if(!['xml','csv','json'].includes(feed?.format))configErrors.push('Невідомий формат feed.');
  for(const key of preset.required)if(!str(mapping[key]))configErrors.push(`Обов’язкове поле «${key}» не mapped.`);
  if(['google','meta'].includes(feed?.channel)&&!/^https?:\/\//i.test(str(feed?.settings?.baseUrl)))warnings.push('Google/Meta: бажано вказати публічний https Base URL, щоб link був абсолютним.');
  const records=buildFeedCatalogRecords01061(state,feed),rowIssues=[],seenIds=new Set();
  records.forEach((r,index)=>{const mapped=mapFeedRecord01061(r,mapping);for(const key of preset.required){if(mapped[key]===null||mapped[key]===undefined||str(mapped[key])==='')rowIssues.push({index,id:r.externalId,sku:r.sku,field:key,message:`Порожнє обов’язкове поле ${key}`});}
    const rid=str(r.externalId);if(rid&&seenIds.has(rid))rowIssues.push({index,id:r.externalId,sku:r.sku,field:'id',message:'Duplicate external item ID у feed.'});else if(rid)seenIds.add(rid);
    if(['google','meta'].includes(feed?.channel)){if(!(num(r.price)>0))rowIssues.push({index,id:r.externalId,sku:r.sku,field:'price',message:'Ціна для Google/Meta повинна бути більшою за 0.'});if(!/^https:\/\//i.test(str(r.url)))rowIssues.push({index,id:r.externalId,sku:r.sku,field:'link',message:'Google/Meta потребує абсолютний https URL товару.'});if(!/^https:\/\//i.test(str(r.image)))rowIssues.push({index,id:r.externalId,sku:r.sku,field:'image',message:'Google/Meta потребує абсолютний https URL основного фото.'});}
  });
  if(!records.length)warnings.push('За поточними правилами у feed не потрапляє жодного товару.');
  const validIds=new Set(rowIssues.map(x=>x.index));
  return {preset,configErrors,warnings,rowIssues,records,total:records.length,validRows:Math.max(0,records.length-validIds.size),invalidRows:validIds.size,ready:configErrors.length===0&&rowIssues.length===0&&records.length>0};
}

function csvCell(v,delimiter=','){const s=String(v??'');return (s.includes('"')||s.includes('\n')||s.includes('\r')||s.includes(delimiter))?`"${s.replace(/"/g,'""')}"`:s;}
function safeXmlTag(tag){const t=str(tag);return /^[A-Za-z_][\w.:-]*$/.test(t)?t:`field_${slug(t)||'value'}`;}
function genericXml(rows,feed){const root=safeXmlTag(feed?.settings?.rootTag||'products'),item=safeXmlTag(feed?.settings?.itemTag||'product');return `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>\n${rows.map(row=>`  <${item}>${Object.entries(row).map(([k,v])=>`<${safeXmlTag(k)}>${escXml(v)}</${safeXmlTag(k)}>`).join('')}</${item}>`).join('\n')}\n</${root}>`;}
function googleXml(rows,feed){const title=escXml(feed?.name||'Marketplace Feed');return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel><title>${title}</title><link>${escXml(feed?.settings?.baseUrl||'')}</link><description>${title}</description>\n${rows.map(row=>`<item>${Object.entries(row).map(([k,v])=>`<${safeXmlTag(k)}>${escXml(v)}</${safeXmlTag(k)}>`).join('')}</item>`).join('\n')}\n</channel></rss>`;}

export function generateFeedDocument01061(state,feed){
  const validation=validateFeed01061(state,feed);if(validation.configErrors.length)throw new Error(validation.configErrors[0]);
  const rows=validation.records.map(r=>mapFeedRecord01061(r,feed.mapping));const format=feed.format||getFeedChannelPreset01061(feed.channel).format;
  let text='',mime='',ext=format;
  if(format==='json'){text=JSON.stringify(rows,null,2);mime='application/json';}
  else if(format==='csv'){
    const headers=uniq(rows.flatMap(r=>Object.keys(r)));const delimiter=feed.channel==='meta'?',':str(feed.settings?.delimiter)||';';
    text='\uFEFF'+[headers.map(h=>csvCell(h,delimiter)).join(delimiter),...rows.map(r=>headers.map(h=>csvCell(r[h],delimiter)).join(delimiter))].join('\r\n');mime='text/csv;charset=utf-8';
  }else{text=feed.channel==='google'?googleXml(rows,feed):genericXml(rows,feed);mime='application/xml';ext='xml';}
  const fileBase=(str(feed.settings?.fileName)||slug(feed.name)||`feed-${feed.channel}`).replace(/\.(xml|csv|json)$/i,'');
  return {text,mime,ext,fileName:`${fileBase}.${ext}`,rows,validation,generatedAt:new Date().toISOString()};
}

export function getFeedManagerSummary01061(state){
  const feeds=arr(state?.feeds);const by={};Object.keys(MARKETPLACE_FEED_CHANNELS_01061).forEach(k=>by[k]=0);feeds.forEach(f=>by[f.channel]=(by[f.channel]||0)+1);
  return {total:feeds.length,active:feeds.filter(f=>f.status==='active').length,paused:feeds.filter(f=>f.status==='paused').length,error:feeds.filter(f=>f.status==='error').length,byChannel:by};
}
