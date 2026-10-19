// 01535 vendored read-only canonical selectors; source: js/marketplace/data/marketplace-accessory-price-01485.js
// 01485 · Canonical, transport-safe accessory/target price-list relations.
// This is the only parser/serializer for the "Аксесуари товару" column.
const s=x=>String(x??'').trim();
const a=x=>Array.isArray(x)?x:[];
const o=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const normalized=x=>s(x).normalize('NFKC').toLocaleLowerCase('uk-UA').replace(/[«»“”„"'’`]/g,'').replace(/[\p{P}\p{S}]+/gu,' ').replace(/\s+/g,' ').trim();
const valueKey=x=>s(x).normalize('NFKC').toLocaleLowerCase('uk-UA').replace(/,/g,'.').replace(/\s*(см|мм|cm|mm)\s*$/iu,'').replace(/\s+/g,'');
export function normalizeAccessoryRefs01485(value){const seen=new Set();return a(value).map(x=>({productId:s(x?.productId),variantId:s(x?.variantId),value:s(x?.value)})).filter(x=>{const key=x.productId+':'+x.variantId;if(!x.productId||seen.has(key))return false;seen.add(key);return true;});}
function segments01485(text){const result=[];let buffer='',quoted=false,quote='',depth=0;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){buffer+=c;if(c===quote||(quote==='“'&&c==='”')||(quote==='«'&&c==='»'))quoted=false;continue;}if('"“«'.includes(c)){quoted=true;quote=c;buffer+=c;continue;}if(c==='('){depth++;buffer+=c;continue;}if(c===')'){depth--;buffer+=c;continue;}if(c==='/'&&depth===0){result.push(buffer.trim());buffer='';continue;}buffer+=c;}result.push(buffer.trim());return result;}
// Accept product (30) / product (40), product ((30) (40) (50)),
// product (30) (40), product (30, 40, 50), optional 'Товар' prefix/quotes.
export function parseAccessoryProducts01485(value){
  const raw=s(value),entries=[],errors=[];
  if(!raw)return{entries,errors};
  for(const segment of segments01485(raw)){
    if(!segment){errors.push({code:'empty-entry',text:segment});continue;}
    let first=-1,quote='';
    for(let i=0;i<segment.length;i++){
      const c=segment[i];
      if(quote){if(c===quote||(quote==='«'&&c==='»')||(quote==='“'&&c==='”'))quote='';continue;}
      if('"«“'.includes(c)){quote=c;continue;}
      if(c==='('){first=i;break;}
    }
    if(first<0){errors.push({code:'missing-value',text:segment});continue;}
    const name=s(segment.slice(0,first)).replace(/^товар\s+/iu,'').trim().replace(/^["«“]+|["»”]+$/g,'').trim();
    const valuesPart=segment.slice(first).trim();
    if(!name||!/^[(),;\s\d\p{L}.+-]+$/u.test(valuesPart)){
      errors.push({code:'missing-name-or-value',text:segment});continue;
    }
    let depth=0,valid=true;
    for(const c of valuesPart){if(c==='(')depth++;if(c===')')depth--;if(depth<0){valid=false;break;}}
    if(depth!==0||!valid){errors.push({code:'unbalanced-parentheses',text:segment});continue;}
    // Collect leaves; nested outer grouping parentheses do not create values.
    const leaves=[...valuesPart.matchAll(/\(([^()]*)\)/gu)].flatMap(match=>match[1].split(/[,;]+/u).map(v=>s(v))).filter(Boolean);
    const isComplete=valuesPart.replace(/\([^()]*\)/gu,'').replace(/[()\s,;]+/gu,'')==='';
    if(!isComplete||!leaves.length){errors.push({code:'missing-name-or-value',text:segment});continue;}
    for(const val of leaves)entries.push({name,value:val});
  }
  return{entries,errors};
}
function variantOptions01485(state,variant){const rows=[];for(const [key,raw] of Object.entries(o(variant?.options))){const attr=a(state?.attributes).find(x=>s(x.key)===key);let value=s(raw);const dictionary=a(state?.attributeValues).find(x=>s(x.attributeId)===s(attr?.id)&&[x.id,x.value,x.label].some(v=>normalized(v)===normalized(value)));if(dictionary)value=s(dictionary.value||dictionary.label);rows.push({key,value});}return rows;}
function matchVariant01485(state,variant,wanted){return variantOptions01485(state,variant).some(v=>valueKey(v.value)===valueKey(wanted));}
export function resolveAccessoryPriceRefs01485(state,parsed){const refs=[],errors=[...a(parsed?.errors)];for(const item of a(parsed?.entries)){const matches=a(state?.products).filter(p=>normalized(p.name)===normalized(item.name));if(matches.length!==1){errors.push({code:matches.length?'ambiguous-product':'missing-product',name:item.name,value:item.value});continue;}const product=matches[0],variants=a(state?.variants).filter(v=>s(v.productId)===s(product.id)&&s(v.status)!=='archived');if(variants.length){const hits=variants.filter(v=>matchVariant01485(state,v,item.value));if(!hits.length){errors.push({code:'missing-variant',name:item.name,value:item.value});continue;}for(const v of hits)refs.push({productId:s(product.id),variantId:s(v.id),value:item.value});}else{const values=Object.values(o(product.attributes)).flat();if(values.length&&!values.some(v=>valueKey(v)===valueKey(item.value))){errors.push({code:'missing-product-value',name:item.name,value:item.value});continue;}refs.push({productId:s(product.id),variantId:'',value:item.value});}}
return{refs:normalizeAccessoryRefs01485(refs),errors};}
export function priceAccessoryValue01485(state,product,variant,attributeId=''){const attr=a(state?.attributes).find(x=>s(x.id)===s(attributeId));const options=o(variant?.options);let value=s(attr?.key?options[attr.key]:'');if(!value)value=s(Object.values(options)[0]);if(!value)value=s(attr?.key?o(product?.attributes)[attr.key]:'');if(!value)value=s(Object.values(o(product?.attributes))[0]);if(value){const found=a(state?.attributeValues).find(x=>s(x.attributeId)===s(attr?.id)&&s(x.id)===value);if(found)value=s(found.value||found.label);}return value.replace(/\s*(см|мм|cm|mm)\s*$/iu,'').trim();}
export function serializeAccessoryPriceRefs01485(state,refs,{attributeId=''}={}){const products=new Map(a(state?.products).map(p=>[s(p.id),p])),variants=new Map(a(state?.variants).map(v=>[s(v.id),v])),seen=new Set(),parts=[];for(const ref of normalizeAccessoryRefs01485(refs)){const product=products.get(ref.productId);if(!product)continue;const variant=ref.variantId?variants.get(ref.variantId):null;if(ref.variantId&&(!variant||s(variant.productId)!==s(product.id)))continue;const value=s(ref.value)||priceAccessoryValue01485(state,product,variant,attributeId);if(!value)continue;const key=ref.productId+':'+ref.variantId;if(seen.has(key))continue;seen.add(key);parts.push(`Товар "${s(product.name).replace(/"/g,'”')}" (${value})`);}return parts.join(' / ');}
export function explicitAccessoryPriceRefs01485(product,variant){
  if(variant)return variant?.accessoryTargets01485?.mode==='explicit'?normalizeAccessoryRefs01485(variant.accessoryTargets01485.refs):null;
  return product?.configuration?.accessoryTargets01485?.mode==='explicit'?normalizeAccessoryRefs01485(product.configuration.accessoryTargets01485.refs):null;
}
