export const MARKETPLACE_IMPORT_VALUE_MAPPING_STAGE_01427='01427';

const str=value=>String(value??'').trim();
const arr=value=>Array.isArray(value)?value:[];
const obj=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const norm=value=>str(value).toLocaleLowerCase('uk-UA').normalize('NFKD').replace(/[’'`]/g,'').replace(/[_./\\-]+/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
const tokens=value=>new Set(norm(value).split(' ').filter(Boolean));
function overlap(a,b){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let hits=0;for(const token of A)if(B.has(token))hits++;return hits/Math.max(A.size,B.size);}
function scoreText(source,candidate){const s=norm(source),c=norm(candidate);if(!s||!c)return 0;if(s===c)return 1;if(s.includes(c)||c.includes(s))return .86;return Number((overlap(s,c)*.72).toFixed(4));}
function distinctValues(rows,sourceHeader,limit=160){const out=[],seen=new Set();for(const row of arr(rows)){const raw=str(row?.[sourceHeader]);if(!raw)continue;if(seen.has(raw))continue;seen.add(raw);out.push(raw);if(out.length>=limit)break;}return out;}
function semanticKind01431(value){const raw=str(value).replace(/,/g,'.');if(/^[-+]?\d+(?:\.\d+)?$/.test(raw))return'numeric';if(/^\d+(?:[.,]\d+)?\s*[x\u0445×]\s*\d+(?:[.,]\d+)?(?:\s*[x\u0445×]\s*\d+(?:[.,]\d+)?)?$/iu.test(raw))return'dimension';return'text';}
function dominantKind01431(values){const counts={numeric:0,dimension:0,text:0};for(const value of arr(values))counts[semanticKind01431(value)]++;const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);return sorted[0]?.[1]?sorted[0][0]:'text';}
function valueCompatibility01431(values,candidates){const sourceExamples=arr(values).slice(0,5),candidateExamples=arr(candidates).map(x=>str(x.label)||str(x.targetValue)).filter(Boolean).slice(0,5),sourceKind=dominantKind01431(values),candidateKind=dominantKind01431(candidateExamples),sourceStructured=['numeric','dimension'].includes(sourceKind),candidateStructured=['numeric','dimension'].includes(candidateKind),mismatch=Boolean(sourceExamples.length&&candidateExamples.length&&sourceStructured&&!candidateStructured);return {stage:'01431',sourceKind,candidateKind,mismatch,sourceExamples,candidateExamples};}
function categoryPaths(state){const categories=arr(state?.categories),byId=new Map(categories.map(row=>[row.id,row]));const pathOf=row=>{const parts=[],seen=new Set();let current=row;while(current&&!seen.has(current.id)){seen.add(current.id);parts.unshift(str(current.name)||str(current.slug)||str(current.id));current=current.parentId?byId.get(current.parentId):null;}return parts.filter(Boolean).join(' > ');};return categories.map(row=>({id:row.id,targetValue:pathOf(row),label:pathOf(row),aliases:[row.name,row.slug,row.id]})).filter(row=>row.targetValue);}
function attributeCandidates(state,target){const prefix=target.startsWith('variantAttribute:')?'variantAttribute:':'attribute:';if(!target.startsWith(prefix))return[];const key=target.slice(prefix.length),attribute=arr(state?.attributes).find(row=>str(row?.key)===key);if(!attribute)return[];return arr(state?.attributeValues).filter(row=>row?.attributeId===attribute.id).map(row=>({id:str(row.id),targetValue:str(row.value)||str(row.label)||str(row.slug),label:str(row.label)||str(row.value)||str(row.slug),aliases:[row.value,row.label,row.slug,row.id].filter(Boolean)})).filter(row=>row.targetValue);}
function staticCandidates(target){if(target==='status'||target==='variant:status')return ['active','draft','archived'].map(value=>({id:value,targetValue:value,label:value,aliases:[value]}));if(target==='availability'||target==='variant:availability')return ['in-stock','out-of-stock','preorder'].map(value=>({id:value,targetValue:value,label:value,aliases:[value]}));return[];}
export function valueMappingCandidates01427(state,target){if(target==='categories')return categoryPaths(state);if(target.startsWith('attribute:')||target.startsWith('variantAttribute:'))return attributeCandidates(state,target);return staticCandidates(target);}
export function isValueMappingTarget01427(target){return target==='categories'||target==='status'||target==='availability'||target==='variant:status'||target==='variant:availability'||String(target).startsWith('attribute:')||String(target).startsWith('variantAttribute:');}
function candidateScore(source,candidate){let best=0;for(const alias of [candidate.targetValue,candidate.label,...arr(candidate.aliases)])best=Math.max(best,scoreText(source,alias));return Number(best.toFixed(4));}
function manualDecision(valueMappings,sourceHeader,sourceValue){const sourceMap=obj(valueMappings?.[sourceHeader]);return obj(sourceMap[sourceValue]||sourceMap[norm(sourceValue)]);}
export function buildImportValueMappingModel01427({headers=[],rows=[],mapping={},state={},valueMappings={}}={}){
  const groups=[];let totalValues=0,resolved=0,unresolved=0,manual=0,exact=0,suggested=0,skipped=0,blocked=0;
  for(const sourceHeader of arr(headers)){
    const target=str(mapping?.[sourceHeader]);if(!target||!isValueMappingTarget01427(target))continue;
    const candidates=valueMappingCandidates01427(state,target),values=distinctValues(rows,sourceHeader);
    if(target.startsWith('attribute:')&&!candidates.length)continue;
    if(!values.length)continue;
    const compatibility=valueCompatibility01431(values,candidates);
    const items=values.map(sourceValue=>{
      const ranked=candidates.map(candidate=>({...candidate,score:candidateScore(sourceValue,candidate)})).sort((a,b)=>b.score-a.score).slice(0,8),top=ranked[0]||null,decision=manualDecision(valueMappings,sourceHeader,sourceValue);let status='unresolved',targetValue='',targetLabel='',confidence=top?.score||0,origin='none';
      if(decision.action==='skip'){status='skipped';origin='manual';manual++;skipped++;}
      else if(decision.action==='error'){status='blocked';origin='manual';manual++;blocked++;}
      else if(decision.action==='map'&&str(decision.targetValue)){targetValue=str(decision.targetValue);const match=candidates.find(row=>row.targetValue===targetValue);targetLabel=match?.label||targetValue;status='mapped';origin='manual';confidence=1;manual++;resolved++;}
      else if(top?.score>=.995){targetValue=top.targetValue;targetLabel=top.label;status='mapped';origin='exact';confidence=top.score;exact++;resolved++;}
      else if(top?.score>=.72){status='suggested';origin='suggestion';suggested++;unresolved++;}
      else unresolved++;
      totalValues++;
      return {sourceValue,target,targetValue,targetLabel,status,origin,confidence:Number(confidence.toFixed(4)),candidates:ranked};
    });
    groups.push({sourceHeader,target,candidates,compatibility,items,counts:{values:items.length,resolved:items.filter(x=>x.status==='mapped').length,unresolved:items.filter(x=>['unresolved','suggested'].includes(x.status)).length,skipped:items.filter(x=>x.status==='skipped').length,blocked:items.filter(x=>x.status==='blocked').length}});
  }
  return {stage:MARKETPLACE_IMPORT_VALUE_MAPPING_STAGE_01427,groups,summary:{groups:groups.length,totalValues,resolved,unresolved,manual,exact,suggested,skipped,blocked}};
}
export function suggestImportValueMappings01427(model,minConfidence=.86){const out={};for(const group of arr(model?.groups)){if(group?.compatibility?.mismatch===true)continue;for(const item of arr(group.items)){if(item.status==='mapped'||item.status==='skipped'||item.status==='blocked')continue;const best=arr(item.candidates)[0];if(!best||Number(best.score)<Number(minConfidence))continue;out[group.sourceHeader]??={};out[group.sourceHeader][item.sourceValue]={action:'map',targetValue:best.targetValue,targetLabel:best.label,confidence:Number(best.score),origin:'auto-01427'};}}return out;}
export function mergeImportValueMappings01427(base={},patch={}){const out={};for(const [source,values] of Object.entries(obj(base)))out[source]={...obj(values)};for(const [source,values] of Object.entries(obj(patch)))out[source]={...obj(out[source]),...obj(values)};return out;}
export function applyImportValueMappings01427(rows,mapping,valueMappings={}){return arr(rows).map(row=>{const next={...obj(row)};for(const [sourceHeader,target] of Object.entries(obj(mapping))){if(!target||!isValueMappingTarget01427(target))continue;const raw=str(next[sourceHeader]);if(!raw)continue;const decision=manualDecision(valueMappings,sourceHeader,raw);if(decision.action==='map'&&str(decision.targetValue))next[sourceHeader]=str(decision.targetValue);else if(decision.action==='skip')next[sourceHeader]='';}return next;});}
export function buildImportMappingDiagnostics01427({headers=[],rows=[],mapping={},confidence={},state={},valueMappings={},options={}}={}){
  const model=buildImportValueMappingModel01427({headers,rows,mapping,state,valueMappings});
  const columns=arr(headers).map(sourceHeader=>({sourceHeader,target:str(mapping?.[sourceHeader]),confidence:Number(confidence?.[sourceHeader])||0,samples:distinctValues(rows,sourceHeader,5),valueGroup:model.groups.find(group=>group.sourceHeader===sourceHeader)||null}));
  return {stage:MARKETPLACE_IMPORT_VALUE_MAPPING_STAGE_01427,source:{rows:arr(rows).length,headers:arr(headers).length},columns,valueMapping:model,options:{rowMode:str(options?.rowMode),updateKey:str(options?.updateKey),existingPolicy:str(options?.existingPolicy),createMissingCategories:options?.createMissingCategories!==false}};
}


export function refineSuggestedImportMapping01432({headers=[],rows=[],mapping={},confidence={},state={}}={}){
  const nextMapping={...obj(mapping)},nextConfidence={...obj(confidence)},rejected=[];
  const model=buildImportValueMappingModel01427({headers,rows,mapping:nextMapping,state,valueMappings:{}});
  for(const group of arr(model.groups)){
    if(group?.compatibility?.mismatch!==true)continue;
    const target=str(group.target);
    if(!target.startsWith('attribute:')&&!target.startsWith('variantAttribute:'))continue;
    const sourceHeader=str(group.sourceHeader);if(!sourceHeader)continue;
    rejected.push({sourceHeader,target,reason:'dictionary-kind-mismatch',compatibility:{...group.compatibility}});
    nextMapping[sourceHeader]='';nextConfidence[sourceHeader]=0;
  }
  return {stage:'01432',mapping:nextMapping,confidence:nextConfidence,rejected};
}
