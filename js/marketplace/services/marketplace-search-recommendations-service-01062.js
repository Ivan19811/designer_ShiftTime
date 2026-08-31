// 01062 · Search + Recommendations domain service.
// Storage-agnostic: consumes Marketplace snapshot and returns derived results only.
// Persistence of search configuration is done by the controller through MarketplaceStore.replaceSnapshot().

const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const str=v=>String(v??'').trim();
const num=(v,f=0)=>{const n=Number(v);return Number.isFinite(n)?n:f};
const uniq=a=>[...new Set(arr(a).map(str).filter(Boolean))];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

export const MARKETPLACE_SEARCH_DEFAULTS_01062=Object.freeze({
  enabled:true,
  activeOnly:true,
  autocompleteLimit:8,
  resultLimit:40,
  minScore:0.08,
  weights:Object.freeze({name:8,sku:7,brand:4,category:4,attributes:3,shortDescription:2,description:1,variants:2}),
  synonyms:[],
  boosts:[],
  stopWords:['і','й','та','the','a','an']
});

export const MARKETPLACE_RECOMMENDATION_TYPES_01062=Object.freeze({
  related:{id:'related',label:'Схожі товари',hint:'Категорія, бренд, ціна та спільні характеристики.'},
  complementary:{id:'complementary',label:'Доповнення',hint:'Ручні або rule-based товари, які доповнюють source product.'},
  'recently-viewed':{id:'recently-viewed',label:'Недавно переглянуті',hint:'Порядок формується з runtime/history IDs, які передає storefront.'},
  'best-sellers':{id:'best-sellers',label:'Хіти продажів',hint:'Сортування за числовим sales signal у product.attributes.'},
  sale:{id:'sale',label:'Акції',hint:'Товари, де oldPrice > price.'},
  new:{id:'new',label:'Новинки',hint:'Найновіші активні товари за createdAt.'},
  manual:{id:'manual',label:'Ручна добірка',hint:'Тільки targetProductIds у заданому порядку.'},
  mixed:{id:'mixed',label:'Змішана',hint:'Ручні targets + automatic related candidates.'}
});

function normalizeText(v){
  return str(v).toLocaleLowerCase('uk-UA').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’'`]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
function tokens(v){return normalizeText(v).split(/\s+/).filter(Boolean)}
function safeDate(v){const t=Date.parse(v);return Number.isFinite(t)?t:0}
function overlap(a,b){const A=new Set(arr(a)),B=new Set(arr(b));let n=0;A.forEach(x=>{if(B.has(x))n++});return n}
function productById(state,id){return arr(state.products).find(p=>p.id===id)||null}
function categoryNameMap(state){return new Map(arr(state.categories).map(c=>[c.id,c.name||c.slug||c.id]))}
function variantMap(state){const map=new Map();arr(state.variants).forEach(v=>{if(!map.has(v.productId))map.set(v.productId,[]);map.get(v.productId).push(v)});return map}

export function getMarketplaceSearchConfig01062(state={}){
  const raw=obj(obj(state.settings).discovery01062);
  const base=MARKETPLACE_SEARCH_DEFAULTS_01062;
  const weights={...base.weights,...obj(raw.weights)};
  const synonyms=arr(raw.synonyms).filter(x=>x&&typeof x==='object').map((x,i)=>({
    id:str(x.id)||`syn_${i+1}`,
    terms:uniq(x.terms).slice(0,24),
    enabled:x.enabled!==false
  })).filter(x=>x.terms.length>=2);
  const boosts=arr(raw.boosts).filter(x=>x&&typeof x==='object').map((x,i)=>({
    id:str(x.id)||`boost_${i+1}`,
    query:str(x.query),
    productIds:uniq(x.productIds),
    categoryIds:uniq(x.categoryIds),
    weight:clamp(num(x.weight,25),-100,500),
    enabled:x.enabled!==false
  })).filter(x=>x.query||x.productIds.length||x.categoryIds.length);
  return {
    enabled:raw.enabled!==false,
    activeOnly:raw.activeOnly!==false,
    autocompleteLimit:clamp(num(raw.autocompleteLimit,base.autocompleteLimit),1,25),
    resultLimit:clamp(num(raw.resultLimit,base.resultLimit),1,200),
    minScore:clamp(num(raw.minScore,base.minScore),0,1),
    weights,
    synonyms,
    boosts,
    stopWords:uniq(raw.stopWords?.length?raw.stopWords:base.stopWords)
  };
}

export function setMarketplaceSearchConfigOnSnapshot01062(snapshot={},patch={}){
  const next=structuredCloneSafe(snapshot);
  next.settings={...obj(next.settings)};
  const current=getMarketplaceSearchConfig01062(next);
  const merged={...current,...obj(patch),weights:{...current.weights,...obj(patch.weights)}};
  next.settings.discovery01062=merged;
  return next;
}

function structuredCloneSafe(v){try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v))}}

function synonymIndex(config){
  const m=new Map();
  config.synonyms.filter(x=>x.enabled!==false).forEach(g=>{
    const normalized=uniq(g.terms.map(normalizeText));
    normalized.forEach(term=>m.set(term,new Set(normalized)));
  });
  return m;
}

export function expandMarketplaceSearchQuery01062(state,query){
  const config=getMarketplaceSearchConfig01062(state),idx=synonymIndex(config),raw=normalizeText(query);
  const baseTokens=tokens(raw).filter(t=>!config.stopWords.map(normalizeText).includes(t));
  const expanded=new Set(baseTokens);
  if(idx.has(raw))idx.get(raw).forEach(t=>tokens(t).forEach(x=>expanded.add(x)));
  baseTokens.forEach(t=>{if(idx.has(t))idx.get(t).forEach(s=>tokens(s).forEach(x=>expanded.add(x)))});
  return {normalized:raw,tokens:baseTokens,expandedTokens:[...expanded]};
}

function searchableProduct(state,p,catMap,varMap){
  const catNames=arr(p.categoryIds).map(id=>catMap.get(id)||'').join(' ');
  const attrs=Object.entries(obj(p.attributes)).flatMap(([k,v])=>[k,Array.isArray(v)?v.join(' '):String(v??'')]).join(' ');
  const vars=arr(varMap.get(p.id)).flatMap(v=>[v.sku,Object.entries(obj(v.options)).flatMap(([k,x])=>[k,String(x??'')]).join(' ')]).join(' ');
  return {
    name:normalizeText(p.name),sku:normalizeText(p.sku),brand:normalizeText(p.brand),category:normalizeText(catNames),attributes:normalizeText(attrs),
    shortDescription:normalizeText(p.shortDescription),description:normalizeText(p.description),variants:normalizeText(vars)
  };
}

function fieldMatchScore(text,query,qs){
  if(!text||(!query&&!qs.length))return 0;
  if(query&&text===query)return 1;
  if(query&&text.startsWith(query))return .88;
  if(query&&text.includes(query))return .72;
  if(!qs.length)return 0;
  const words=new Set(tokens(text));
  if(tokens(query).length===1&&qs.length>1){if(qs.some(x=>words.has(x)))return .74;if(qs.some(x=>[...words].some(w=>w.startsWith(x))))return .61;}
  let hits=0,prefix=0;
  for(const q of qs){if(words.has(q))hits++;else if([...words].some(w=>w.startsWith(q)))prefix+=.65;else if(text.includes(q))prefix+=.35}
  return clamp((hits+prefix)/Math.max(qs.length,1),0,1)*.68;
}

function boostScore(state,p,query,config){
  let score=0;const nq=normalizeText(query);
  for(const b of config.boosts){if(b.enabled===false)continue;const bq=normalizeText(b.query);if(bq&&!(nq===bq||nq.includes(bq)||bq.includes(nq)))continue;
    if(b.productIds.includes(p.id))score+=b.weight;
    if(arr(p.categoryIds).some(id=>b.categoryIds.includes(id)))score+=b.weight*.7;
  }
  return score;
}

export function searchMarketplaceProducts01062(state={},query='',options={}){
  const config={...getMarketplaceSearchConfig01062(state),...obj(options.config)};
  const exp=expandMarketplaceSearchQuery01062({...state,settings:{...obj(state.settings),discovery01062:config}},query);
  const q=exp.normalized,qs=exp.expandedTokens;
  const catMap=categoryNameMap(state),varMap=variantMap(state),weights=config.weights;
  const candidates=arr(state.products).filter(p=>!config.activeOnly||p.status==='active');
  if(!q)return {query:q,expandedTokens:qs,total:0,results:[],config};
  const rows=[];
  for(const p of candidates){
    const f=searchableProduct(state,p,catMap,varMap);let weighted=0,max=0;const reasons=[];
    for(const [key,wRaw] of Object.entries(weights)){const w=Math.max(0,num(wRaw,0));if(!w||!f[key])continue;max+=w;const s=fieldMatchScore(f[key]||'',q,qs);weighted+=s*w;if(s>=.55)reasons.push(`${key}:${Math.round(s*100)}`)}
    const base=max?weighted/max:0;const b=boostScore(state,p,q,config);const score=base+(b/100);
    if(score>=config.minScore)rows.push({product:p,score,baseScore:base,boost:b,reasons});
  }
  rows.sort((a,b)=>b.score-a.score||str(a.product.name).localeCompare(str(b.product.name),'uk'));
  const limit=clamp(num(options.limit,config.resultLimit),1,200);
  return {query:q,expandedTokens:qs,total:rows.length,results:rows.slice(0,limit),config};
}

export function getMarketplaceAutocomplete01062(state={},query='',options={}){
  const config=getMarketplaceSearchConfig01062(state),q=normalizeText(query);if(!q)return [];
  const pool=[];const push=(label,type,id='')=>{const n=normalizeText(label);if(n.includes(q))pool.push({label:str(label),type,id,score:n.startsWith(q)?2:1})};
  arr(state.products).filter(p=>!config.activeOnly||p.status==='active').forEach(p=>{push(p.name,'product',p.id);if(p.brand)push(p.brand,'brand')});
  arr(state.categories).forEach(c=>push(c.name,'category',c.id));
  config.synonyms.filter(x=>x.enabled!==false).forEach(g=>g.terms.forEach(t=>push(t,'synonym',g.id)));
  const seen=new Set();return pool.sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label,'uk')).filter(x=>{const k=`${x.type}:${normalizeText(x.label)}`;if(seen.has(k))return false;seen.add(k);return true}).slice(0,clamp(num(options.limit,config.autocompleteLimit),1,25));
}

export function getMarketplaceSearchDiagnostics01062(state={}){
  const config=getMarketplaceSearchConfig01062(state),products=arr(state.products),active=products.filter(p=>p.status==='active');
  const emptySearchable=active.filter(p=>![p.name,p.sku,p.brand,p.shortDescription,p.description].some(str)).map(p=>p.id);
  const badSynonyms=config.synonyms.filter(s=>new Set(s.terms.map(normalizeText)).size<2).map(s=>s.id);
  const danglingBoostProducts=[];const ids=new Set(products.map(p=>p.id));config.boosts.forEach(b=>b.productIds.forEach(id=>{if(!ids.has(id))danglingBoostProducts.push(id)}));
  return {enabled:config.enabled,products:products.length,activeProducts:active.length,synonymGroups:config.synonyms.length,boostRules:config.boosts.length,emptySearchable,badSynonyms,danglingBoostProducts,ready:config.enabled&&active.length>0&&emptySearchable.length===0};
}

function recommendationConfig(rec){const rules=arr(rec?.rules);const primary=obj(rules[0]);return {
  limit:clamp(num(primary.limit,8),1,50),priceDeltaPct:clamp(num(primary.priceDeltaPct,30),0,1000),days:clamp(num(primary.days,30),1,3650),metricKey:str(primary.metricKey)||'sales30d',
  categoryIds:uniq(primary.categoryIds),collectionIds:uniq(primary.collectionIds),attributeKeys:uniq(primary.attributeKeys),sameBrand:primary.sameBrand===true,slot:str(primary.slot)||'default',
  includeOutOfStock:primary.includeOutOfStock===true
}}
function eligibleProducts(state,cfg){return arr(state.products).filter(p=>p.status==='active'&&(cfg.includeOutOfStock||p.availability!=='out-of-stock'))}
function commonAttributeScore(a,b,keys=[]){const A=obj(a.attributes),B=obj(b.attributes),all=keys.length?keys:[...new Set([...Object.keys(A),...Object.keys(B)])];if(!all.length)return 0;let comparable=0,match=0;for(const k of all){if(A[k]==null||B[k]==null)continue;comparable++;const av=arr(A[k]).length?arr(A[k]).map(str):[str(A[k])],bv=arr(B[k]).length?arr(B[k]).map(str):[str(B[k])];if(overlap(av,bv)>0)match++}return comparable?match/comparable:0}
function priceSimilarity(a,b,deltaPct){const x=num(a.price),y=num(b.price);if(x<=0||y<=0)return 0;const d=Math.abs(x-y)/Math.max(x,y)*100;return d>deltaPct?Math.max(0,1-(d-deltaPct)/100):1-d/Math.max(deltaPct,1)*.35}
function manualTargets(state,rec,excludeId=''){const map=new Map(arr(state.products).map(p=>[p.id,p]));return uniq(rec.targetProductIds).map(id=>map.get(id)).filter(p=>p&&p.id!==excludeId&&p.status==='active')}
function applyRuleScope(products,cfg){return products.filter(p=>(!cfg.categoryIds.length||arr(p.categoryIds).some(x=>cfg.categoryIds.includes(x)))&&(!cfg.collectionIds.length||arr(p.collectionIds).some(x=>cfg.collectionIds.includes(x))))}

export function resolveMarketplaceRecommendation01062(state={},recommendation={},context={}){
  const rec=recommendation||{},type=str(rec.type)||'related',cfg=recommendationConfig(rec),source=productById(state,context.sourceProductId||arr(rec.sourceProductIds)[0]),limit=clamp(num(context.limit,cfg.limit),1,50);
  const candidates=applyRuleScope(eligibleProducts(state,cfg),cfg).filter(p=>p.id!==source?.id);
  const manual=manualTargets(state,rec,source?.id);let results=[];let signal='';
  const addUnique=(list,reason,scoreBase=100)=>{const seen=new Set(results.map(x=>x.product.id));list.forEach((p,i)=>{if(!p||seen.has(p.id))return;seen.add(p.id);results.push({product:p,score:scoreBase-i,reason})})};
  if(type==='manual'){addUnique(manual,'manual');}
  else if(type==='recently-viewed'){
    const ids=uniq(context.viewedProductIds).reverse(),map=new Map(candidates.map(p=>[p.id,p]));addUnique(ids.map(id=>map.get(id)).filter(Boolean),'recently-viewed');signal=ids.length?'runtime-history':'missing-view-history';
  } else if(type==='sale'){
    results=candidates.filter(p=>num(p.oldPrice)>num(p.price)&&num(p.price)>0).map(p=>({product:p,score:(num(p.oldPrice)-num(p.price))/Math.max(num(p.oldPrice),1)*100,reason:'discount'})).sort((a,b)=>b.score-a.score);
  } else if(type==='new'){
    const cut=Date.now()-cfg.days*864e5;results=candidates.filter(p=>safeDate(p.createdAt)>=cut).map(p=>({product:p,score:safeDate(p.createdAt),reason:'createdAt'})).sort((a,b)=>b.score-a.score);
  } else if(type==='best-sellers'){
    results=candidates.map(p=>({product:p,score:num(obj(p.attributes)[cfg.metricKey],0),reason:`attribute:${cfg.metricKey}`})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);signal=results.length?`attribute:${cfg.metricKey}`:`missing:${cfg.metricKey}`;if(!results.length)addUnique(manual,'manual-fallback');
  } else if(type==='complementary'){
    addUnique(manual,'manual',200);const automatic=candidates.filter(p=>!source||!arr(p.categoryIds).some(x=>arr(source.categoryIds).includes(x))).map(p=>({product:p,score:(cfg.categoryIds.length&&arr(p.categoryIds).some(x=>cfg.categoryIds.includes(x))?80:10)+(cfg.collectionIds.length&&arr(p.collectionIds).some(x=>cfg.collectionIds.includes(x))?40:0),reason:'complementary-rule'})).sort((a,b)=>b.score-a.score);automatic.forEach(x=>{if(!results.some(r=>r.product.id===x.product.id))results.push(x)});
  } else {
    if(type==='mixed')addUnique(manual,'manual',200);
    const automatic=candidates.map(p=>{let s=0;const reasons=[];if(source){const cat=overlap(source.categoryIds,p.categoryIds);if(cat){s+=45;reasons.push('category')}if(source.brand&&normalizeText(source.brand)===normalizeText(p.brand)){s+=cfg.sameBrand?25:14;reasons.push('brand')}const ps=priceSimilarity(source,p,cfg.priceDeltaPct);s+=ps*25;if(ps>.6)reasons.push('price');const as=commonAttributeScore(source,p,cfg.attributeKeys);s+=as*20;if(as>.25)reasons.push('attributes')}else{s+=safeDate(p.updatedAt)/1e13}return{product:p,score:s,reason:reasons.join('+')||'automatic'}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    automatic.forEach(x=>{if(!results.some(r=>r.product.id===x.product.id))results.push(x)});
  }
  return {recommendation:rec,type,sourceProduct:source||null,config:cfg,signal,total:results.length,results:results.slice(0,limit)};
}

export function getMarketplaceRecommendationEngine01062(state={},context={}){
  const enabled=arr(state.recommendations).filter(r=>r.enabled!==false).sort((a,b)=>num(b.priority)-num(a.priority)||safeDate(b.updatedAt)-safeDate(a.updatedAt));
  const slots={};for(const rec of enabled){const resolved=resolveMarketplaceRecommendation01062(state,rec,context);const slot=resolved.config.slot||'default';if(!slots[slot])slots[slot]=[];slots[slot].push(resolved)}
  return {rules:enabled.length,slots};
}

export function getMarketplaceRecommendationDiagnostics01062(state={}){
  const ids=new Set(arr(state.products).map(p=>p.id)),recs=arr(state.recommendations),issues=[];let missingSignals=0;
  for(const r of recs){const cfg=recommendationConfig(r);arr(r.sourceProductIds).forEach(id=>{if(!ids.has(id))issues.push(`${r.id}: missing source ${id}`)});arr(r.targetProductIds).forEach(id=>{if(!ids.has(id))issues.push(`${r.id}: missing target ${id}`)});if(r.type==='best-sellers'){const has=arr(state.products).some(p=>num(obj(p.attributes)[cfg.metricKey])>0);if(!has)missingSignals++}}
  return {rules:recs.length,enabled:recs.filter(r=>r.enabled!==false).length,issues,missingSignals,ready:issues.length===0};
}

export function createMarketplaceRecommendationDraft01062(type='related',overrides={}){
  const t=MARKETPLACE_RECOMMENDATION_TYPES_01062[type]?type:'related';
  const label=MARKETPLACE_RECOMMENDATION_TYPES_01062[t].label;
  return {name:label,type:t,enabled:true,sourceProductIds:[],targetProductIds:[],collectionIds:[],priority:0,rules:[{slot:'default',limit:8,priceDeltaPct:30,days:30,metricKey:'sales30d',categoryIds:[],collectionIds:[],attributeKeys:[],sameBrand:false,includeOutOfStock:false}],...obj(overrides)};
}
