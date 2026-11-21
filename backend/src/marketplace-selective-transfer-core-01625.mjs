// 01625 · Lossless partial product exchange. Never align products by row number.
export const SELECTIVE_FIELDS_01625=Object.freeze([
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
const byAlias=new Map(SELECTIVE_FIELDS_01625.flatMap(f=>[f.key,f.label,...(f.aliases||[])].map(a=>[norm(a),f.key])));
export function normalizeSelectedFields01625(fields){const allowed=new Set(SELECTIVE_FIELDS_01625.map(f=>f.key));return ['id',...[...new Set((Array.isArray(fields)?fields:[]).filter(f=>allowed.has(f)&&f!=='id'))]];}
export function selectiveExportModel01625(snapshot,fields){const keys=normalizeSelectedFields01625(fields),defs=new Map(SELECTIVE_FIELDS_01625.map(f=>[f.key,f]));const products=Array.isArray(snapshot?.products)?snapshot.products:[];return {columns:keys.map(k=>[k,defs.get(k).label]),headers:keys.map(k=>defs.get(k).label),rows:products.map(p=>Object.fromEntries(keys.map(k=>[k,p?.[k]??'']))),summary:{products:products.length,rows:products.length,fields:keys.length}};}
export function analyzeSelectiveImport01625(snapshot,rawRows,selectedFields){
 const fields=normalizeSelectedFields01625(selectedFields).filter(f=>f!=='id'),products=Array.isArray(snapshot?.products)?snapshot.products:[],byId=new Map(products.map(p=>[clean(p?.id),p])),rows=[],errors=[],seen=new Set(),max=20000;
 if(!Array.isArray(rawRows)||rawRows.length>max)return {ok:false,rows:[],errors:[`Дозволено не більше ${max} рядків.`],changed:0,revision:snapshot?.revision??null};
 if(!fields.length)errors.push('Виберіть хоча б одне поле, крім ID.');
 for(let i=0;i<rawRows.length;i++){
  const input=rawRows[i];if(!input||typeof input!=='object'||Array.isArray(input)){errors.push(`Рядок ${i+2}: неправильний формат.`);continue;}
  const mapped={};for(const [col,value] of Object.entries(input)){const key=byAlias.get(norm(col));if(key&&Object.hasOwn(mapped,key)){errors.push(`Рядок ${i+2}: дублюється поле ${key}.`);continue;}if(key)mapped[key]=value;}
  const id=clean(mapped.id);if(!id){errors.push(`Рядок ${i+2}: відсутній ID товару.`);continue;}
  if(seen.has(id)){errors.push(`Рядок ${i+2}: повторний ID ${id}.`);continue;}seen.add(id);
  const target=byId.get(id);if(!target){errors.push(`Рядок ${i+2}: товар ID ${id} відсутній у цьому магазині. Новий товар автоматично не створюється.`);continue;}
  const patch={};for(const field of fields){if(!Object.hasOwn(mapped,field))continue;let v=mapped[field];if(['price','oldPrice','stock'].includes(field)){
    const s=clean(v).replace(/\s/g,'').replace(',','.');v=Number(s);if(!s||!Number.isFinite(v)||v<0|| (field==='stock'&&!Number.isInteger(v))){errors.push(`Рядок ${i+2}: неправильне значення ${field}.`);continue;}
   }else{v=clean(v);if(field==='currency'&&v&&!/^[A-Z]{3}$/.test(v.toUpperCase())){errors.push(`Рядок ${i+2}: неправильна валюта.`);continue;}if(field==='currency')v=v.toUpperCase();if(field==='status'&&!['active','draft','archived'].includes(v)){errors.push(`Рядок ${i+2}: неправильний статус.`);continue;}if(field==='sku'&&!v){errors.push(`Рядок ${i+2}: порожній артикул.`);continue;}}
   if(JSON.stringify(target[field])!==JSON.stringify(v))patch[field]=v;
  }
  if(Object.keys(patch).length)rows.push({id,patch});
 }
 return {ok:errors.length===0,rows,errors:errors.slice(0,60),errorCount:errors.length,changed:rows.length,revision:Number(snapshot?.revision)||0,sourceRows:rawRows.length,selectedFields:['id',...fields]};
}
export function applySelectiveProducts01625(snapshot,input){
 const {expectedRevision,rows}=input||{};
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0||Number(snapshot?.revision||0)!==expectedRevision)throw Object.assign(new Error('ST_SELECTIVE_REVISION_CONFLICT_01625'),{statusCode:409});
 if(!Array.isArray(rows)||!rows.length||rows.length>20000)throw Object.assign(new Error('ST_SELECTIVE_ROWS_INVALID_01625'),{statusCode:400});
 const index=new Map((snapshot.products||[]).map((p,i)=>[clean(p.id),i])),seen=new Set(),products=[...snapshot.products],allowed=new Set(SELECTIVE_FIELDS_01625.map(f=>f.key).filter(k=>k!=='id'));
 for(const row of rows){const id=clean(row?.id);if(!id||seen.has(id)||!index.has(id)||!row.patch||typeof row.patch!=='object'||Array.isArray(row.patch))throw Object.assign(new Error('ST_SELECTIVE_ID_INVALID_01625'),{statusCode:409});seen.add(id);const patch={};for(const [k,v] of Object.entries(row.patch)){if(!allowed.has(k))throw Object.assign(new Error('ST_SELECTIVE_FIELD_DENIED_01625'),{statusCode:400});if(['price','oldPrice','stock'].includes(k)){if(typeof v!=='number'||!Number.isFinite(v)||v<0||(k==='stock'&&!Number.isInteger(v)))throw Object.assign(new Error('ST_SELECTIVE_NUMBER_INVALID_01625'),{statusCode:400});}else if(typeof v!=='string'||v.length>30000)throw Object.assign(new Error('ST_SELECTIVE_TEXT_INVALID_01625'),{statusCode:400});if(k==='status'&&!['active','draft','archived'].includes(v))throw Object.assign(new Error('ST_SELECTIVE_STATUS_INVALID_01625'),{statusCode:400});if(k==='sku'&&!v.trim())throw Object.assign(new Error('ST_SELECTIVE_SKU_INVALID_01625'),{statusCode:400});patch[k]=v;}
  if(!Object.keys(patch).length)throw Object.assign(new Error('ST_SELECTIVE_EMPTY_PATCH_01625'),{statusCode:400});const i=index.get(id);products[i]={...products[i],...patch,id,createdAt:products[i].createdAt,updatedAt:new Date().toISOString()};
 }
 const sku=new Set();for(const p of products){const k=clean(p.sku);if(k&&sku.has(k))throw Object.assign(new Error('ST_SELECTIVE_SKU_DUPLICATE_01625'),{statusCode:409});if(k)sku.add(k);}
 return {...snapshot,products};
}
