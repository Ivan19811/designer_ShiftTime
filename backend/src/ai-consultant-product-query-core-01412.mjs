import {AI_CONSULTANT_UK_01412 as UK} from './ai-consultant-language-uk-01412.mjs';

export const AI_CONSULTANT_PRODUCT_QUERY_STAGE_01412='01412';
const MARKETPLACE_ID='marketplace_shifttime';
const str=value=>String(value??'').trim();
const num=(value,fallback=null)=>Number.isFinite(Number(value))?Number(value):fallback;
const norm=value=>str(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’`]/g,"'");
const tokens=value=>norm(value).split(/[^a-z0-9а-яіїєґ']+/i).map(x=>x.replace(/^'+|'+$/g,'')).filter(Boolean);
const uniq=items=>[...new Set(items.filter(Boolean))];
function fail(code,statusCode=400){const error=new Error(code);error.code=code;error.statusCode=statusCode;return error;}
function decimal(value){const n=Number(String(value??'').replace(/\s+/g,'').replace(',','.'));return Number.isFinite(n)?n:null;}
function compact(value){return norm(value).replace(/['\s_-]+/g,'');}
function phraseIncludes(text,phrases){const n=norm(text);return phrases.some(x=>n.includes(norm(x)));}
function hasRoot(text,roots){const n=norm(text);return roots.some(root=>n.includes(norm(root)));}
function moneyNumber(raw){return decimal(String(raw??'').replace(/\s+/g,''));}
function rootToken(value){let word=norm(value).replace(/[^a-z0-9а-яіїєґ]/gi,'');if(word.length<5)return word;for(const suffix of ['ями','ами','ого','ому','ими','ими','ої','ій','ів','ев','ов','ах','ях','ою','ею','ий','ій','а','я','у','ю','и','і']){if(word.endsWith(suffix)&&word.length-suffix.length>=4){word=word.slice(0,-suffix.length);break;}}return word;}
function relatedToken(a,b){const aa=rootToken(a),bb=rootToken(b);if(!aa||!bb)return false;if(aa===bb)return true;const min=Math.min(aa.length,bb.length);return min>=4&&(aa.startsWith(bb)||bb.startsWith(aa));}
function flatten(value,out=[]){if(value==null)return out;if(Array.isArray(value)){for(const item of value)flatten(item,out);return out;}if(typeof value==='object'){for(const [key,item] of Object.entries(value)){out.push(key);flatten(item,out);}return out;}out.push(String(value));return out;}
function volumeNumbers(attributes={},text=''){
  const out=[];
  const literAlt=UK.literUnits.map(x=>norm(x).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  const rx=new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:${literAlt})(?:\\b|$)`,'gi');
  for(const source of [text,...flatten(attributes)]){let match;while((match=rx.exec(norm(source)))){const value=decimal(match[1]);if(value!=null)out.push(value);}rx.lastIndex=0;}
  for(const [key,value] of Object.entries(attributes||{})){
    const ck=compact(key);if(!UK.volumeKeys.some(x=>ck.includes(compact(x))))continue;
    const candidates=Array.isArray(value)?value:[value];for(const item of candidates){if(typeof item==='number'){out.push(item);continue;}const match=String(item??'').match(/\d+(?:[.,]\d+)?/);const v=match?decimal(match[0]):null;if(v!=null)out.push(v);}
  }
  return uniq(out.map(x=>Number(x.toFixed(4))));
}
function stripConstraints(message){
  let out=norm(message);
  out=out.replace(/(?<![a-zа-яіїєґ0-9])\d+(?:[.,]\d+)?\s*(?:л|літр(?:а|и|ів)?)(?=\s|$|[.,;:!?])/gi,' ');
  out=out.replace(/(?<![a-zа-яіїєґ])(?:до|від)\s*\d[\d\s]*(?:[.,]\d+)?\s*(?:грн|грив(?:ня|ні|ень)|uah|₴)?(?=\s|$|[.,;:!?])/gi,' ');
  out=out.replace(/(?<![a-zа-яіїєґ0-9])\d[\d\s]*(?:[.,]\d+)?\s*[-–—]\s*\d[\d\s]*(?:[.,]\d+)?\s*(?:грн|грив(?:ня|ні|ень)|uah|₴)?(?=\s|$|[.,;:!?])/gi,' ');
  for(const phrase of [...UK.preorderPhrases,...UK.inStockPhrases])out=out.split(norm(phrase)).join(' ');
  return out;
}

export function parseAiProductQuery01412(message){
  const raw=str(message).slice(0,1200);if(!raw)throw fail('AI_CONSULTANT_QUERY_REQUIRED_01412');
  const normalized=norm(raw);let minPrice=null,maxPrice=null;
  const range=normalized.match(/(\d[\d\s]*(?:[.,]\d+)?)\s*[-–—]\s*(\d[\d\s]*(?:[.,]\d+)?)\s*(?:грн|грив(?:ня|ні|ень)|uah|₴)(?=\s|$|[.,;:!?])/i);
  if(range){minPrice=moneyNumber(range[1]);maxPrice=moneyNumber(range[2]);if(minPrice!=null&&maxPrice!=null&&minPrice>maxPrice)[minPrice,maxPrice]=[maxPrice,minPrice];}
  const max=normalized.match(/(?:^|\s)до\s*(\d[\d\s]*(?:[.,]\d+)?)\s*(?:грн|грив(?:ня|ні|ень)|uah|₴)?(?=\s|$|[.,;:!?])/i);if(max)maxPrice=moneyNumber(max[1]);
  const min=normalized.match(/(?:^|\s)від\s*(\d[\d\s]*(?:[.,]\d+)?)\s*(?:грн|грив(?:ня|ні|ень)|uah|₴)?(?=\s|$|[.,;:!?])/i);if(min)minPrice=moneyNumber(min[1]);
  const volumeMatch=normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:л|літр(?:а|и|ів)?)(?=\s|$|[.,;:!?])/i),volumeLiters=volumeMatch?decimal(volumeMatch[1]):null;
  const availability=phraseIncludes(normalized,UK.preorderPhrases)?'preorder':'in-stock';
  const cheap=hasRoot(normalized,[...UK.cheapRoots,...UK.cheapestRoots]);
  const stop=new Set(UK.stopWords.map(norm));
  const queryTokens=tokens(stripConstraints(raw)).filter(token=>!/^[\d.,]+$/.test(token)&&!stop.has(token)&&!UK.currencyUnits.includes(token)&&!UK.literUnits.includes(token));
  return {message:raw,textQuery:uniq(queryTokens).join(' '),tokens:uniq(queryTokens),availability,minPrice,maxPrice,sort:cheap?'price-asc':'relevance',attributes:{volumeLiters},limit:12};
}

function documentFromRow(row={}){
  const projection=row.publicProjection&&typeof row.publicProjection==='object'?row.publicProjection:{};
  const catalogAttributes=row.catalogAttributes&&typeof row.catalogAttributes==='object'?row.catalogAttributes:{};
  const directAttributes=row.attributes&&typeof row.attributes==='object'?row.attributes:{};
  const attributes={...catalogAttributes,...(projection.attributes&&typeof projection.attributes==='object'?projection.attributes:{}),...directAttributes};
  const categories=Array.isArray(row.categories)?row.categories:(Array.isArray(projection.categories)?projection.categories:[]);
  const media=Array.isArray(row.media)?row.media:(Array.isArray(row.catalogMedia)&&row.catalogMedia.length?row.catalogMedia:(Array.isArray(projection.media)?projection.media:[]));
  const directStock=num(row.stock,null),physicalStock=Math.max(0,num(row.physicalStock,0)||0),reserved=Math.max(0,num(row.reservedStock,0)||0),stock=directStock==null?Math.max(0,physicalStock-reserved):Math.max(0,directStock);
  const availability=row.availability==='preorder'?'preorder':(row.availability==='out-of-stock'?'out-of-stock':(stock>0?'in-stock':'out-of-stock'));
  const title=str(row.title||row.catalogTitle||row.listingTitle||projection.name),brand=str(row.brand||row.catalogBrand||projection.brand),shortDescription=str(row.shortDescription||projection.shortDescription||projection.description);
  const searchable=[title,brand,shortDescription,str(row.sku),categories.map(x=>str(x?.name||x?.slug||x)).join(' '),flatten(attributes).join(' ')].join(' ');
  return {id:str(row.id||row.listingId),listingId:str(row.listingId||row.id),catalogProductId:str(row.catalogProductId),sourceProductId:str(row.sourceProductId),slug:str(row.slug),title,brand,shortDescription,categories,attributes,media,sku:str(row.sku),price:num(row.price,0)||0,oldPrice:num(row.oldPrice,0)||0,currency:str(row.currency)||'UAH',stock,availability,updatedAt:row.updatedAt||null,searchable,searchTokens:tokens(searchable),volumes:volumeNumbers(attributes,[title,shortDescription].join(' '))};
}
function textScore(doc,plan){if(!plan.tokens.length)return 1;let score=0;for(const queryToken of plan.tokens){let best=0;for(const token of doc.searchTokens){if(token===queryToken){best=Math.max(best,8);continue;}if(relatedToken(token,queryToken))best=Math.max(best,4);}if(!best)return 0;score+=best;}const titleTokens=tokens(doc.title);for(const queryToken of plan.tokens)if(titleTokens.some(x=>relatedToken(x,queryToken)))score+=6;return score;}
function volumeMatches(doc,target){if(target==null)return true;return doc.volumes.some(value=>Math.abs(value-target)<0.001);}
export function searchAiProductDocuments01412(documents,plan){
  const docs=(Array.isArray(documents)?documents:[]).map(x=>x?.searchTokens?x:documentFromRow(x));
  let rows=docs.map(doc=>({doc,score:textScore(doc,plan)})).filter(x=>x.score>0);
  if(plan.availability==='in-stock')rows=rows.filter(x=>x.doc.availability==='in-stock'&&x.doc.stock>0);else if(plan.availability==='preorder')rows=rows.filter(x=>x.doc.availability==='preorder');
  if(plan.minPrice!=null)rows=rows.filter(x=>x.doc.price>=plan.minPrice);if(plan.maxPrice!=null)rows=rows.filter(x=>x.doc.price<=plan.maxPrice);
  if(plan.attributes?.volumeLiters!=null)rows=rows.filter(x=>volumeMatches(x.doc,plan.attributes.volumeLiters));
  if(plan.sort==='price-asc')rows.sort((a,b)=>a.doc.price-b.doc.price||b.score-a.score);else rows.sort((a,b)=>b.score-a.score||a.doc.price-b.doc.price);
  const total=rows.length,limit=Math.min(24,Math.max(1,Number(plan.limit)||12));
  return {total,items:rows.slice(0,limit).map(({doc})=>{const {searchable,searchTokens,volumes,...publicDoc}=doc;return {...publicDoc,matchedVolumes:volumes};})};
}
