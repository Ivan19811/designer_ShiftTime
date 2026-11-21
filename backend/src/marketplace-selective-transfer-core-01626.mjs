// 01626 · One ID-scoped transfer engine for importing selected fields, missing-ID decisions and exports.
// Never match by row position; missing file rows never delete products.
export const SELECTIVE_FIELDS_01626=Object.freeze([
 {key:'id',label:'ID товару',required:true,aliases:['id','productid','product id','ід товару','id товару','product_id']},
 {key:'name',label:'Назва товару',aliases:['name','title','productname','product name','назва','назва товару']},
 {key:'price',label:'Ціна',aliases:['price','productprice','product price','ціна','ціна товару']},
 {key:'oldPrice',label:'Стара ціна',aliases:['oldprice','old price','productoldprice','стара ціна']},
 {key:'sku',label:'Артикул',aliases:['sku','productsku','product sku','артикул']},
 {key:'stock',label:'Залишок',aliases:['stock','productstock','залишок','кількість']},
 {key:'status',label:'Статус',aliases:['status','productstatus','статус']},
 {key:'brand',label:'Бренд',aliases:['brand','бренд']},
 {key:'currency',label:'Валюта',aliases:['currency','валюта']},
 {key:'shortDescription',label:'Короткий опис',aliases:['shortdescription','short description','короткий опис']},
 {key:'description',label:'Опис',aliases:['description','опис','повний опис']},
 {key:'availability',label:'Наявність',aliases:['availability','наявність']}
]);
const clean=v=>String(v??'').trim();
const norm=v=>clean(v).toLocaleLowerCase('uk').replace(/[\s_\-.]+/g,'');
const byAlias=new Map(SELECTIVE_FIELDS_01626.flatMap(f=>[f.key,f.label,...(f.aliases||[])].map(a=>[norm(a),f.key])));
export function recognizeImportFields01626(headers){const keys=[],unknown=[];for(const h of headers||[]){const k=byAlias.get(norm(h));if(k){if(!keys.includes(k))keys.push(k);}else unknown.push(clean(h));}return {hasId:keys.includes('id'),keys,unknown};}
export function normalizeSelectedFields01626(fields){const allowed=new Set(SELECTIVE_FIELDS_01626.map(f=>f.key));return ['id',...[...new Set((Array.isArray(fields)?fields:[]).filter(f=>allowed.has(f)&&f!=='id'))]];}
export function selectiveExportModel01626(snapshot,fields){const keys=normalizeSelectedFields01626(fields),defs=new Map(SELECTIVE_FIELDS_01626.map(f=>[f.key,f]));const products=Array.isArray(snapshot?.products)?snapshot.products:[];return {columns:keys.map(k=>[k,defs.get(k).label]),headers:keys.map(k=>defs.get(k).label),rows:products.map(p=>Object.fromEntries(keys.map(k=>[k,p?.[k]??'']))),summary:{products:products.length,rows:products.length,fields:keys.length}};}
function parseField(field,raw,line,errors){let v=raw;if(['price','oldPrice','stock'].includes(field)){const s=clean(v).replace(/\s/g,'').replace(',','.');v=Number(s);if(!s||!Number.isFinite(v)||v<0||(field==='stock'&&!Number.isInteger(v))){errors.push(`Рядок ${line}: неправильне значення «${field}».`);return null;}}else {v=clean(v);if(v.length>30000){errors.push(`Рядок ${line}: значення «${field}» надто довге.`);return null;}if(field==='currency'){v=v.toUpperCase();if(v&&!/^[A-Z]{3}$/.test(v)){errors.push(`Рядок ${line}: неправильна валюта.`);return null;}}if(field==='status'&&!['active','draft','archived'].includes(v)){errors.push(`Рядок ${line}: неправильний статус.`);return null;}if(field==='sku'&&!v){errors.push(`Рядок ${line}: порожній артикул.`);return null;}}return v;}
export function analyzeSelectiveImport01626(snapshot,rawRows,selectedFields,decisions={}){
 const fields=normalizeSelectedFields01626(selectedFields).filter(f=>f!=='id'),products=Array.isArray(snapshot?.products)?snapshot.products:[],byId=new Map(products.map(p=>[clean(p?.id),p])),rows=[],errors=[],missing=[],seen=new Set(),max=20000;let skipped=0,added=0,updated=0;
 if(!Array.isArray(rawRows)||rawRows.length>max)return {ok:false,rows:[],errors:[`Дозволено не більше ${max} рядків.`],errorCount:1,changed:0,revision:snapshot?.revision??null,sourceRows:Array.isArray(rawRows)?rawRows.length:0,missing:[]};
 if(!fields.length)errors.push('Виберіть хоча б одне поле, крім ID.');
 for(let i=0;i<rawRows.length;i++){
  const input=rawRows[i],line=i+2;if(!input||typeof input!=='object'||Array.isArray(input)){errors.push(`Рядок ${line}: неправильний формат.`);continue;}
  const mapped={};for(const [col,value] of Object.entries(input)){const key=byAlias.get(norm(col));if(key&&Object.hasOwn(mapped,key)){errors.push(`Рядок ${line}: дублюється поле ${key}.`);continue;}if(key)mapped[key]=value;}
  const id=clean(mapped.id);if(!id){errors.push(`Рядок ${line}: відсутній ID товару.`);continue;}if(id.length>200||seen.has(id)){errors.push(`Рядок ${line}: дубль або неправильний ID «${id.slice(0,80)}».`);continue;}seen.add(id);
  const target=byId.get(id),isNew=!target;if(isNew){missing.push({id,name:clean(mapped.name).slice(0,140),line});if(decisions[id]!=='add'){skipped++;continue;}}
  const patch={};for(const field of fields){if(!Object.hasOwn(mapped,field))continue;const v=parseField(field,mapped[field],line,errors);if(v===null)continue;if(isNew||JSON.stringify(target[field])!==JSON.stringify(v))patch[field]=v;}
  if(isNew){
   // A new product needs a real name even when only a price column is selected.
   const name=clean(mapped.name);if(!name||name.length>500){errors.push(`Рядок ${line}: для додавання ID «${id}» потрібна назва товару у файлі.`);continue;}
   patch.name=name;patch.status='draft'; // new product is never published by partial import
   rows.push({id,action:'add',patch});added++;
  }else if(Object.keys(patch).length){rows.push({id,action:'update',patch});updated++;}
 }
 return {ok:errors.length===0,rows,errors:errors.slice(0,60),errorCount:errors.length,changed:rows.length,added,updated,skipped,missing,revision:Number(snapshot?.revision)||0,sourceRows:rawRows.length,selectedFields:['id',...fields]};
}

// Server-side authoritative transaction input validation; UI decisions are never trusted.
const deny=(code,statusCode=400)=>Object.assign(new Error(code),{statusCode});
export function applySelectiveProducts01626(snapshot,input){
 const {expectedRevision,rows}=input||{};
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0||Number(snapshot?.revision||0)!==expectedRevision)throw deny('ST_SELECTIVE_REVISION_CONFLICT_01626',409);
 if(!Array.isArray(rows)||!rows.length||rows.length>20000)throw deny('ST_SELECTIVE_ROWS_INVALID_01626');
 const index=new Map((snapshot.products||[]).map((p,i)=>[clean(p.id),i])),seen=new Set(),products=[...(snapshot.products||[])],allowed=new Set(SELECTIVE_FIELDS_01626.map(f=>f.key).filter(k=>k!=='id'));
 let added=0,updated=0;
 for(const row of rows){
  const id=clean(row?.id),action=row?.action;if(!id||id.length>200||seen.has(id)||!['add','update'].includes(action)||!row.patch||typeof row.patch!=='object'||Array.isArray(row.patch))throw deny('ST_SELECTIVE_ID_INVALID_01626',409);seen.add(id);
  const exists=index.has(id);if(action==='add'&&exists||action==='update'&&!exists)throw deny('ST_SELECTIVE_ID_STATE_CHANGED_01626',409);
  const patch={};for(const [k,v] of Object.entries(row.patch)){
   if(!allowed.has(k))throw deny('ST_SELECTIVE_FIELD_DENIED_01626');
   if(['price','oldPrice','stock'].includes(k)){if(typeof v!=='number'||!Number.isFinite(v)||v<0||(k==='stock'&&!Number.isInteger(v)))throw deny('ST_SELECTIVE_NUMBER_INVALID_01626');}
   else if(typeof v!=='string'||v.length>30000)throw deny('ST_SELECTIVE_TEXT_INVALID_01626');
   if(k==='status'&&!['active','draft','archived'].includes(v))throw deny('ST_SELECTIVE_STATUS_INVALID_01626');
   if(k==='sku'&&!v.trim())throw deny('ST_SELECTIVE_SKU_INVALID_01626');
   if(k==='currency'&&v&&!/^[A-Z]{3}$/.test(v))throw deny('ST_SELECTIVE_CURRENCY_INVALID_01626');
   patch[k]=v;
  }
  if(!Object.keys(patch).length)throw deny('ST_SELECTIVE_EMPTY_PATCH_01626');
  const now=new Date().toISOString();
  if(action==='add'){
   if(!clean(patch.name)||patch.name.length>500||patch.status!=='draft')throw deny('ST_SELECTIVE_CREATE_REQUIREMENTS_01626');
   products.push({id,name:patch.name,sku:'',price:0,oldPrice:0,stock:0,currency:'UAH',availability:'',status:'draft',categoryIds:[],...patch,status:'draft',id,createdAt:now,updatedAt:now});index.set(id,products.length-1);added++;
  }else {const i=index.get(id),old=products[i];products[i]={...old,...patch,id,createdAt:old.createdAt,updatedAt:now};updated++;}
 }
 const sku=new Set();for(const p of products){const k=clean(p.sku);if(k&&sku.has(k))throw deny('ST_SELECTIVE_SKU_DUPLICATE_01626',409);if(k)sku.add(k);}
 return {snapshot:{...snapshot,products},added,updated};
}
