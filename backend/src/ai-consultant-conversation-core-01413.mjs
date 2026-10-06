import {parseAiProductQuery01412} from './ai-consultant-product-query-core-01412.mjs';
import {AI_CONSULTANT_UK_01413 as UK} from './ai-consultant-language-uk-01413.mjs';

export const AI_CONSULTANT_CONVERSATION_STAGE_01413='01413';
const str=value=>String(value??'').trim();
const norm=value=>str(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’`]/g,"'");
const uniq=items=>[...new Set((items||[]).filter(Boolean))];
const hasAny=(text,items)=>items.some(item=>norm(text).includes(norm(item)));
const startsRoot=(text,roots)=>{const n=norm(text).trim();return roots.some(root=>n===norm(root)||n.startsWith(`${norm(root)} `));};
const priceMention=text=>/(?:^|\s)(?:до|від)\s*\d|\d[\d\s]*(?:[.,]\d+)?\s*[-–—]\s*\d/i.test(norm(text));
const volumeMention=text=>/\d+(?:[.,]\d+)?\s*(?:л|літр)/i.test(norm(text));
const nullableNumber=value=>value===null||value===undefined||value===''?null:(Number.isFinite(Number(value))?Number(value):null);
const copyPlan=plan=>({message:str(plan?.message),textQuery:str(plan?.textQuery),tokens:uniq(Array.isArray(plan?.tokens)?plan.tokens:[]),availability:plan?.availability==='preorder'?'preorder':'in-stock',minPrice:nullableNumber(plan?.minPrice),maxPrice:nullableNumber(plan?.maxPrice),sort:plan?.sort==='price-asc'?'price-asc':'relevance',attributes:{volumeLiters:nullableNumber(plan?.attributes?.volumeLiters)},limit:Math.min(24,Math.max(1,Number(plan?.limit)||12))});

export function mergeAiProductQueryContext01413(previousPlan,message){
  const current=parseAiProductQuery01412(message),previous=previousPlan&&typeof previousPlan==='object'?copyPlan(previousPlan):null;
  if(!previous)return {...current,contextMode:'new'};
  const raw=str(message),switchIntent=hasAny(raw,UK.switchPhrases),priceReset=hasAny(raw,UK.priceResetPhrases),explicitPrice=priceMention(raw),explicitVolume=volumeMention(raw),explicitAvailability=hasAny(raw,UK.availabilityRoots),explicitCheap=hasAny(raw,UK.cheapRoots);
  const followup=!switchIntent&&(startsRoot(raw,UK.followupRoots)||!current.textQuery||explicitPrice||explicitVolume||explicitCheap);
  if(switchIntent)return {...current,contextMode:'switch'};
  if(!followup)return {...current,contextMode:'new'};
  const next=copyPlan(current);
  if(!current.textQuery){next.textQuery=previous.textQuery;next.tokens=previous.tokens;}else{next.tokens=uniq([...previous.tokens,...current.tokens]);next.textQuery=next.tokens.join(' ');}
  if(!explicitVolume)next.attributes.volumeLiters=previous.attributes.volumeLiters;
  if(priceReset){next.minPrice=null;next.maxPrice=null;}else if(!explicitPrice){next.minPrice=previous.minPrice;next.maxPrice=previous.maxPrice;}
  if(!explicitAvailability)next.availability=previous.availability;
  if(!explicitCheap)next.sort=previous.sort;
  next.message=current.message;next.contextMode='followup';return next;
}

export function buildAiConsultantResponseCode01413(result){
  const count=Math.max(0,Number(result?.total)||0);
  return count>0?'products_found':'products_not_found';
}
