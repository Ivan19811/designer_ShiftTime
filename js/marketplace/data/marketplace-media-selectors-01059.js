// 01059 · Storage-agnostic media selectors.
// Reads Marketplace snapshot only; never talks to a persistence/storage adapter.

function arr(v){return Array.isArray(v)?v:[];}
function str(v){return String(v??'').trim();}
function addUsage(map,id,usage){
  const key=str(id); if(!key)return;
  if(!map.has(key))map.set(key,[]);
  map.get(key).push(usage);
}

export function getMarketplaceMediaUsageMap01059(state={}){
  const usage=new Map();
  for(const p of arr(state.products)){
    const ids=new Set(arr(p.mediaIds).map(str).filter(Boolean));
    if(str(p.primaryMediaId))ids.add(str(p.primaryMediaId));
    for(const id of ids)addUsage(usage,id,{type:'product',entityId:p.id,label:p.name||p.sku||p.id,role:id===p.primaryMediaId?'primary':'gallery'});
  }
  for(const v of arr(state.variants)){
    const ids=new Set(arr(v.mediaIds).map(str).filter(Boolean));
    if(str(v.primaryMediaId))ids.add(str(v.primaryMediaId));
    for(const id of ids)addUsage(usage,id,{type:'variant',entityId:v.id,label:v.sku||v.id,productId:v.productId||'',role:id===v.primaryMediaId?'primary':'gallery'});
  }
  for(const c of arr(state.categories)){
    addUsage(usage,c.imageMediaId,{type:'category',entityId:c.id,label:c.name||c.id,role:'primary'});
    addUsage(usage,c.imageSecondaryMediaId,{type:'category',entityId:c.id,label:c.name||c.id,role:'secondary'});
  }
  for(const a of arr(state.attributeValues))addUsage(usage,a.mediaId,{type:'attributeValue',entityId:a.id,label:a.label||a.value||a.id,attributeId:a.attributeId||'',role:'value'});
  for(const c of arr(state.collections))addUsage(usage,c.imageMediaId,{type:'collection',entityId:c.id,label:c.name||c.id,role:'image'});
  addUsage(usage,state.seo?.openGraph?.defaultImageMediaId,{type:'seo',entityId:'seo',label:'OpenGraph default',role:'openGraph'});
  return usage;
}

export function getMarketplaceMediaUsage01059(mediaId,state={}){
  return (getMarketplaceMediaUsageMap01059(state).get(str(mediaId))||[]).map(x=>({...x}));
}

export function getMarketplaceMediaStats01059(state={}){
  const media=arr(state.media),usage=getMarketplaceMediaUsageMap01059(state);
  const urlCounts=new Map();
  for(const m of media){const u=str(m.url);if(u)urlCounts.set(u,(urlCounts.get(u)||0)+1);}
  return {
    total:media.length,
    images:media.filter(m=>m.kind==='image').length,
    videos:media.filter(m=>m.kind==='video').length,
    documents:media.filter(m=>m.kind==='document').length,
    missingAlt:media.filter(m=>m.kind==='image'&&!str(m.alt)).length,
    used:media.filter(m=>(usage.get(m.id)||[]).length>0).length,
    unused:media.filter(m=>(usage.get(m.id)||[]).length===0).length,
    duplicateRecords:media.filter(m=>{const u=str(m.url);return u&&(urlCounts.get(u)||0)>1;}).length,
    duplicateUrls:[...urlCounts.entries()].filter(([,n])=>n>1).map(([url,count])=>({url,count}))
  };
}

export function getMarketplaceMediaBindingData01059(media,state={}){
  if(!media)return null;
  const usage=getMarketplaceMediaUsage01059(media.id,state);
  return {
    id:media.id,
    kind:media.kind,
    url:media.url,
    alt:media.alt,
    width:Number(media.width)||0,
    height:Number(media.height)||0,
    mime:media.mime||'',
    fileName:media.fileName||'',
    sortOrder:Number(media.sortOrder)||0,
    metadata:{...(media.metadata||{})},
    usage,
    usageCount:usage.length,
    isUsed:usage.length>0,
    hasAlt:media.kind!=='image'||!!str(media.alt),
    aspectRatio:(Number(media.width)>0&&Number(media.height)>0)?Number(media.width)/Number(media.height):null
  };
}

export function getMarketplaceMediaLibraryBindingData01059(state={}){
  const media=arr(state.media).map(m=>getMarketplaceMediaBindingData01059(m,state));
  return {stage:'01059',stats:getMarketplaceMediaStats01059(state),items:media};
}
