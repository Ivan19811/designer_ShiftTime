// 01052 · Marketplace canonical data schema.
// Storage-agnostic domain models. No model knows where or how it is persisted.

export const MARKETPLACE_SCHEMA_VERSION_01052 = 1;
export const MARKETPLACE_SCHEMA_ID_01052 = 'shifttime-marketplace-schema-v1';

export const MARKETPLACE_ENTITY_KEYS_01052 = Object.freeze([
  'products', 'categories', 'attributes', 'attributeValues', 'variants', 'media',
  'collections', 'filters', 'recommendations', 'feeds'
]);

function nowIso(){ return new Date().toISOString(); }
function uid(prefix='id'){
  try { if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`; } catch {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;
}
function cleanString(v){ return String(v ?? '').trim(); }
function cleanNumber(v, fallback=0){ const n=Number(v); return Number.isFinite(n) ? n : fallback; }
function cleanBoolean(v, fallback=false){ return typeof v === 'boolean' ? v : fallback; }
function cleanArray(v){ return Array.isArray(v) ? v.slice() : []; }
function cleanObject(v){ return v && typeof v === 'object' && !Array.isArray(v) ? { ...v } : {}; }
function cleanIdArray(v){ return cleanArray(v).map(cleanString).filter(Boolean); }
function cleanStatus(v, allowed, fallback){ const s=cleanString(v); return allowed.includes(s) ? s : fallback; }

export function createMarketplaceSeo01052(input={}){
  const defaults=cleanObject(input.defaults);
  const sitemap=cleanObject(input.sitemap);
  const structuredData=cleanObject(input.structuredData);
  const indexing=cleanObject(input.indexing);
  const openGraph=cleanObject(input.openGraph);
  const diagnostics=cleanObject(input.diagnostics);
  return {
    defaults: {
      locale: cleanString(defaults.locale) || 'uk-UA',
      currency: cleanString(defaults.currency) || 'UAH',
      canonicalMode: cleanString(defaults.canonicalMode) || 'auto',
      filterIndexMode: cleanString(defaults.filterIndexMode) || 'safe',
      titleTemplate: cleanString(defaults.titleTemplate),
      descriptionTemplate: cleanString(defaults.descriptionTemplate)
    },
    sitemap: { enabled: sitemap.enabled !== false },
    structuredData: {
      product: structuredData.product !== false,
      productGroup: structuredData.productGroup !== false,
      offer: structuredData.offer !== false,
      breadcrumb: structuredData.breadcrumb !== false
    },
    indexing: {
      categories: indexing.categories !== false,
      products: indexing.products !== false,
      filters: cleanString(indexing.filters) || 'safe'
    },
    openGraph: {
      enabled: openGraph.enabled !== false,
      defaultImageMediaId: cleanString(openGraph.defaultImageMediaId)
    },
    diagnostics: {
      altRequired: diagnostics.altRequired !== false,
      missingMetaWarning: diagnostics.missingMetaWarning !== false
    }
  };
}

export function createEmptyMarketplaceSnapshot01052(){
  const t=nowIso();
  return {
    schemaId: MARKETPLACE_SCHEMA_ID_01052,
    schemaVersion: MARKETPLACE_SCHEMA_VERSION_01052,
    revision: 0,
    createdAt: t,
    updatedAt: t,
    products: [],
    categories: [],
    attributes: [],
    attributeValues: [],
    variants: [],
    media: [],
    collections: [],
    filters: [],
    recommendations: [],
    feeds: [],
    seo: createMarketplaceSeo01052(),
    settings: {
      locale: 'uk-UA',
      currency: 'UAH',
      skuPolicy: 'unique-required',
      draftExportPolicy: 'exclude'
    }
  };
}

export function createMarketplaceProduct01052(input={}){
  const t=nowIso();
  return {
    id: cleanString(input.id) || uid('prod'),
    sku: cleanString(input.sku),
    status: cleanStatus(input.status,['draft','active','archived'],'draft'),
    name: cleanString(input.name),
    slug: cleanString(input.slug),
    shortDescription: cleanString(input.shortDescription),
    description: cleanString(input.description),
    categoryIds: cleanIdArray(input.categoryIds),
    collectionIds: cleanIdArray(input.collectionIds),
    brand: cleanString(input.brand),
    price: cleanNumber(input.price, 0),
    oldPrice: cleanNumber(input.oldPrice, 0),
    currency: cleanString(input.currency) || 'UAH',
    stock: cleanNumber(input.stock, 0),
    availability: cleanStatus(input.availability,['in-stock','out-of-stock','preorder'],'in-stock'),
    mediaIds: cleanIdArray(input.mediaIds),
    primaryMediaId: cleanString(input.primaryMediaId),
    attributes: cleanObject(input.attributes),
    variantIds: cleanIdArray(input.variantIds),
    seo: cleanObject(input.seo),
    feed: cleanObject(input.feed),
    createdAt: cleanString(input.createdAt) || t,
    updatedAt: cleanString(input.updatedAt) || t
  };
}

export function createMarketplaceCategory01052(input={}){
  const t=nowIso();
  return {
    id: cleanString(input.id) || uid('cat'),
    parentId: cleanString(input.parentId) || null,
    status: cleanStatus(input.status,['draft','active','archived'],'active'),
    name: cleanString(input.name),
    slug: cleanString(input.slug),
    shortDescription: cleanString(input.shortDescription),
    description: cleanString(input.description),
    imageMediaId: cleanString(input.imageMediaId),
    imageSecondaryMediaId: cleanString(input.imageSecondaryMediaId),
    icon: cleanString(input.icon),
    productIds: cleanIdArray(input.productIds),
    attributes: cleanObject(input.attributes),
    featureKey: cleanString(input.featureKey),
    url: cleanString(input.url),
    seo: cleanObject(input.seo),
    createdAt: cleanString(input.createdAt) || t,
    updatedAt: cleanString(input.updatedAt) || t
  };
}

export function createMarketplaceAttribute01052(input={}){
  const t=nowIso();
  return {
    id: cleanString(input.id) || uid('attr'),
    key: cleanString(input.key),
    name: cleanString(input.name),
    type: cleanString(input.type) || 'text',
    unit: cleanString(input.unit),
    filterable: input.filterable !== false,
    variantOption: input.variantOption === true,
    required: input.required === true,
    valueIds: cleanIdArray(input.valueIds),
    sortOrder: cleanNumber(input.sortOrder,0),
    createdAt: cleanString(input.createdAt) || t,
    updatedAt: cleanString(input.updatedAt) || t
  };
}

export function createMarketplaceAttributeValue01052(input={}){
  const t=nowIso();
  return {
    id: cleanString(input.id) || uid('aval'),
    attributeId: cleanString(input.attributeId),
    value: cleanString(input.value),
    label: cleanString(input.label) || cleanString(input.value),
    slug: cleanString(input.slug),
    color: cleanString(input.color),
    mediaId: cleanString(input.mediaId),
    sortOrder: cleanNumber(input.sortOrder,0),
    createdAt: cleanString(input.createdAt) || t,
    updatedAt: cleanString(input.updatedAt) || t
  };
}

export function createMarketplaceVariant01052(input={}){
  const t=nowIso();
  return {
    id: cleanString(input.id) || uid('var'),
    productId: cleanString(input.productId),
    sku: cleanString(input.sku),
    status: cleanStatus(input.status,['draft','active','archived'],'active'),
    options: cleanObject(input.options),
    price: cleanNumber(input.price, 0),
    oldPrice: cleanNumber(input.oldPrice, 0),
    stock: cleanNumber(input.stock, 0),
    availability: cleanStatus(input.availability,['in-stock','out-of-stock','preorder'],'in-stock'),
    mediaIds: cleanIdArray(input.mediaIds),
    primaryMediaId: cleanString(input.primaryMediaId),
    createdAt: cleanString(input.createdAt) || t,
    updatedAt: cleanString(input.updatedAt) || t
  };
}

export function createMarketplaceMedia01052(input={}){
  const t=nowIso();
  return {
    id: cleanString(input.id) || uid('media'),
    kind: cleanStatus(input.kind,['image','video','document'],'image'),
    url: cleanString(input.url),
    alt: cleanString(input.alt),
    width: cleanNumber(input.width, 0),
    height: cleanNumber(input.height, 0),
    mime: cleanString(input.mime),
    fileName: cleanString(input.fileName),
    sortOrder: cleanNumber(input.sortOrder, 0),
    metadata: cleanObject(input.metadata),
    createdAt: cleanString(input.createdAt) || t,
    updatedAt: cleanString(input.updatedAt) || t
  };
}

export function createMarketplaceCollection01052(input={}){
  const t=nowIso();
  return {
    id: cleanString(input.id) || uid('col'),
    status: cleanStatus(input.status,['draft','active','archived'],'active'),
    name: cleanString(input.name),
    slug: cleanString(input.slug),
    description: cleanString(input.description),
    imageMediaId: cleanString(input.imageMediaId),
    mode: cleanStatus(input.mode,['manual','automatic'],'manual'),
    productIds: cleanIdArray(input.productIds),
    rules: cleanArray(input.rules).filter(x=>x && typeof x==='object').map(x=>({...x})),
    sortOrder: cleanNumber(input.sortOrder,0),
    seo: cleanObject(input.seo),
    createdAt: cleanString(input.createdAt) || t,
    updatedAt: cleanString(input.updatedAt) || t
  };
}

export function createMarketplaceFilter01052(input={}){
  const t=nowIso();
  return {
    id: cleanString(input.id) || uid('filter'),
    key: cleanString(input.key),
    name: cleanString(input.name),
    type: cleanString(input.type) || 'options',
    attributeId: cleanString(input.attributeId),
    categoryIds: cleanIdArray(input.categoryIds),
    enabled: input.enabled !== false,
    sortOrder: cleanNumber(input.sortOrder,0),
    config: cleanObject(input.config),
    createdAt: cleanString(input.createdAt) || t,
    updatedAt: cleanString(input.updatedAt) || t
  };
}

export function createMarketplaceRecommendation01052(input={}){
  const t=nowIso();
  return {
    id: cleanString(input.id) || uid('rec'),
    name: cleanString(input.name),
    type: cleanString(input.type) || 'related',
    enabled: input.enabled !== false,
    sourceProductIds: cleanIdArray(input.sourceProductIds),
    targetProductIds: cleanIdArray(input.targetProductIds),
    collectionIds: cleanIdArray(input.collectionIds),
    rules: cleanArray(input.rules).filter(x=>x && typeof x==='object').map(x=>({...x})),
    priority: cleanNumber(input.priority,0),
    createdAt: cleanString(input.createdAt) || t,
    updatedAt: cleanString(input.updatedAt) || t
  };
}

export function createMarketplaceFeed01052(input={}){
  const t=nowIso();
  return {
    id: cleanString(input.id) || uid('feed'),
    name: cleanString(input.name),
    channel: cleanString(input.channel),
    format: cleanStatus(input.format,['xml','csv','json'],'xml'),
    status: cleanStatus(input.status,['draft','active','paused','error'],'draft'),
    mapping: cleanObject(input.mapping),
    rules: cleanArray(input.rules).filter(x=>x && typeof x==='object').map(x=>({...x})),
    settings: cleanObject(input.settings),
    lastGeneratedAt: cleanString(input.lastGeneratedAt),
    createdAt: cleanString(input.createdAt) || t,
    updatedAt: cleanString(input.updatedAt) || t
  };
}

export const MARKETPLACE_ENTITY_FACTORIES_01052 = Object.freeze({
  products:createMarketplaceProduct01052,
  categories:createMarketplaceCategory01052,
  attributes:createMarketplaceAttribute01052,
  attributeValues:createMarketplaceAttributeValue01052,
  variants:createMarketplaceVariant01052,
  media:createMarketplaceMedia01052,
  collections:createMarketplaceCollection01052,
  filters:createMarketplaceFilter01052,
  recommendations:createMarketplaceRecommendation01052,
  feeds:createMarketplaceFeed01052
});

function normalizeEntityArray(key, arr){
  if(!Array.isArray(arr)) return [];
  const factory=MARKETPLACE_ENTITY_FACTORIES_01052[key];
  if(factory) return arr.map(factory);
  return arr.filter(x=>x && typeof x==='object').map(x=>({ ...x }));
}

export function normalizeMarketplaceSnapshot01052(raw){
  const base=createEmptyMarketplaceSnapshot01052();
  if(!raw || typeof raw!=='object') return base;
  const out={
    ...base,
    ...raw,
    schemaId: MARKETPLACE_SCHEMA_ID_01052,
    schemaVersion: MARKETPLACE_SCHEMA_VERSION_01052,
    revision: Math.max(0, cleanNumber(raw.revision, 0)),
    createdAt: cleanString(raw.createdAt) || base.createdAt,
    updatedAt: cleanString(raw.updatedAt) || base.updatedAt,
    seo: createMarketplaceSeo01052(raw.seo),
    settings: { ...base.settings, ...cleanObject(raw.settings) }
  };
  MARKETPLACE_ENTITY_KEYS_01052.forEach(k=>{ out[k]=normalizeEntityArray(k,raw[k]); });
  return out;
}

export function touchMarketplaceSnapshot01052(snapshot){
  return { ...snapshot, revision: Math.max(0,Number(snapshot?.revision)||0)+1, updatedAt: nowIso() };
}

export function getMarketplaceSummary01052(snapshot){
  const s=normalizeMarketplaceSnapshot01052(snapshot);
  const products=s.products;
  const categories=s.categories;
  const activeProducts=products.filter(x=>x.status==='active').length;
  const draftProducts=products.filter(x=>x.status==='draft').length;
  const archivedProducts=products.filter(x=>x.status==='archived').length;
  const rootCategories=categories.filter(x=>!x.parentId).length;
  const childCategories=Math.max(0,categories.length-rootCategories);
  const outOfStock=products.filter(x=>x.availability==='out-of-stock'||Number(x.stock)<=0).length;
  const missingSku=products.filter(x=>!x.sku).length;
  const missingName=products.filter(x=>!x.name).length;
  const missingPrice=products.filter(x=>!(Number(x.price)>0)).length;
  const attention=missingSku+missingName+missingPrice+outOfStock;
  return {
    schemaVersion:s.schemaVersion, revision:s.revision,
    products:products.length, activeProducts,draftProducts,archivedProducts,
    categories:categories.length,rootCategories,childCategories,
    attributes:s.attributes.length,attributeValues:s.attributeValues.length,variants:s.variants.length,media:s.media.length,
    collections:s.collections.length,filters:s.filters.length,recommendations:s.recommendations.length,feeds:s.feeds.length,
    outOfStock,missingSku,missingName,missingPrice,attention
  };
}

export function createMarketplaceDemoSeed01052(){
  const base=createEmptyMarketplaceSnapshot01052();
  const media=[
    createMarketplaceMedia01052({id:'media_demo_pan',url:'assets/collections/shifttime-marketplace-02/real-products/06-pan-stainless-lid-gift.webp',alt:'Сковорода з диска борони 50 см'}),
    createMarketplaceMedia01052({id:'media_demo_kazan',url:'assets/collections/shifttime-marketplace-02/real-products/01-kazany-lineup.webp',alt:'Казани чавунні'}),
    createMarketplaceMedia01052({id:'media_demo_mangal',url:'assets/collections/shifttime-marketplace-02/real-products/10-mangal-custom.webp',alt:'Мангал розбірний'})
  ];
  const categories=[
    createMarketplaceCategory01052({id:'cat_pans',name:'Сковорідки',slug:'skovoridky',featureKey:'diameter',attributes:{diameter:{min:30,max:80,unit:'см'},thickness:{min:4,max:7,unit:'мм'}}}),
    createMarketplaceCategory01052({id:'cat_sets',parentId:'cat_pans',name:'Комплекти',slug:'komplekty',featureKey:'diameter'}),
    createMarketplaceCategory01052({id:'cat_kazans',name:'Казани',slug:'kazany',featureKey:'volume',attributes:{volume:{min:6,max:12,unit:'л'}}}),
    createMarketplaceCategory01052({id:'cat_mangals',name:'Мангали',slug:'mangaly',featureKey:'length',attributes:{length:{min:60,max:100,unit:'см'}}})
  ];
  const products=[
    createMarketplaceProduct01052({id:'prod_pan_50',sku:'SK-50',status:'active',name:'Сковорода з диска борони 50 см',slug:'skovoroda-50',categoryIds:['cat_pans'],brand:'SHIFTIME',price:1450,oldPrice:1650,stock:24,availability:'in-stock',primaryMediaId:'media_demo_pan',mediaIds:['media_demo_pan'],attributes:{diameter:50,thickness:6}}),
    createMarketplaceProduct01052({id:'prod_kazan_8',sku:'KZ-08',status:'active',name:'Казан чавунний 8 л',slug:'kazan-8l',categoryIds:['cat_kazans'],brand:'SHIFTIME',price:2690,oldPrice:2980,stock:12,availability:'in-stock',primaryMediaId:'media_demo_kazan',mediaIds:['media_demo_kazan'],attributes:{volume:8,material:'Чавун'}}),
    createMarketplaceProduct01052({id:'prod_mangal_80',sku:'MG-80',status:'draft',name:'Мангал розбірний 80 см',slug:'mangal-80',categoryIds:['cat_mangals'],brand:'SHIFTIME',price:3590,oldPrice:4190,stock:7,availability:'in-stock',primaryMediaId:'media_demo_mangal',mediaIds:['media_demo_mangal'],attributes:{length:80}})
  ];
  const attributes=[
    createMarketplaceAttribute01052({id:'attr_diameter',key:'diameter',name:'Діаметр',type:'number-unit',unit:'см',filterable:true}),
    createMarketplaceAttribute01052({id:'attr_thickness',key:'thickness',name:'Товщина',type:'number-unit',unit:'мм',filterable:true}),
    createMarketplaceAttribute01052({id:'attr_volume',key:'volume',name:'Об’єм',type:'number-unit',unit:'л',filterable:true}),
    createMarketplaceAttribute01052({id:'attr_color',key:'color',name:'Колір',type:'color',filterable:true,variantOption:true}),
    createMarketplaceAttribute01052({id:'attr_size',key:'size',name:'Розмір',type:'list',filterable:true,variantOption:true})
  ];
  return normalizeMarketplaceSnapshot01052({ ...base, products,categories,attributes,media, revision:1, updatedAt:nowIso() });
}
