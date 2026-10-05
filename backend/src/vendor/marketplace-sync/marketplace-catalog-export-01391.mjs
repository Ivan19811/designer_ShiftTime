// 01391 · Canonical Marketplace catalog export model.
// Marketplace snapshot -> flat transport rows -> CSV / XLSX / JSON / XML.
// One row per Variant when variants exist; products without variants keep one product row.

const arr=v=>Array.isArray(v)?v:[];
const str=v=>String(v??'').trim();
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const uniq=list=>[...new Set(arr(list).map(str).filter(Boolean))];

export const MARKETPLACE_CATALOG_EXPORT_STAGE_01391='01391';

function categoryPath01391(id,categories){
  const map=new Map(arr(categories).map(item=>[item.id,item]));
  const parts=[];let current=map.get(id),guard=0;
  while(current&&guard++<40){parts.unshift(str(current.name)||str(current.slug)||str(current.id));current=current.parentId?map.get(current.parentId):null;}
  return parts.join(' > ');
}
function mediaUrls01391(ids,mediaMap){
  return uniq(ids.map(id=>str(mediaMap.get(id)?.url)).filter(Boolean));
}
function orderedMediaUrls01391(entity,mediaMap){
  const ids=uniq([entity?.primaryMediaId,...arr(entity?.mediaIds)]);
  return mediaUrls01391(ids,mediaMap);
}
function variantSort01391(a,b){
  return (num(a?.sortOrder01260)-num(b?.sortOrder01260))||str(a?.sku).localeCompare(str(b?.sku),'uk')||str(a?.id).localeCompare(str(b?.id),'uk');
}
function resolveLabel01391(labels,key,fallback,vars={}){
  const raw=str(labels?.[key])||fallback;
  return raw.replace(/\{(\w+)\}/g,(_,name)=>String(vars[name]??''));
}
function attrLabel01391(attribute,labels,variant=false){
  const name=str(attribute?.name)||str(attribute?.key),unit=str(attribute?.unit);
  return resolveLabel01391(labels,variant?'variantOption':'attribute',variant?'Variant Option · {name}{unit}':'Attribute · {name}{unit}',{name,unit:unit?` · ${unit}`:''});
}
function baseColumns01391(labels){
  const l=(key,fallback)=>resolveLabel01391(labels,key,fallback);
  return [
    ['productId',l('productId','Product ID')],
    ['productSku',l('productSku','Product SKU')],
    ['productName',l('productName','Product Name')],
    ['productStatus',l('productStatus','Product Status')],
    ['brand',l('brand','Brand')],
    ['productPrice',l('productPrice','Product Price')],
    ['productOldPrice',l('productOldPrice','Product Old Price')],
    ['currency',l('currency','Currency')],
    ['productStock',l('productStock','Product Stock')],
    ['productAvailability',l('productAvailability','Product Availability')],
    ['slug',l('slug','Slug')],
    ['shortDescription',l('shortDescription','Short Description')],
    ['description',l('description','Description')],
    ['categories',l('categories','Categories')],
    ['productImages',l('productImages','Product Images')],
    ['primaryProductImage',l('primaryProductImage','Primary Product Image')]
  ];
}
function variantColumns01391(labels){
  const l=(key,fallback)=>resolveLabel01391(labels,key,fallback);
  return [
    ['variantId',l('variantId','Variant ID')],
    ['variantSku',l('variantSku','Variant SKU')],
    ['variantStatus',l('variantStatus','Variant Status')],
    ['variantPrice',l('variantPrice','Variant Price')],
    ['variantOldPrice',l('variantOldPrice','Variant Old Price')],
    ['variantStock',l('variantStock','Variant Stock')],
    ['variantAvailability',l('variantAvailability','Variant Availability')],
    ['variantImages',l('variantImages','Variant Images')],
    ['primaryVariantImage',l('primaryVariantImage','Primary Variant Image')],
    ['primaryVariant',l('primaryVariant','Primary Variant')],
    ['variantSortOrder',l('variantSortOrder','Variant Sort Order')],
    ['variantInheritProductMedia',l('variantInheritProductMedia','Variant Inherit Product Media')],
    ['variantMediaSourceMode',l('variantMediaSourceMode','Variant Media Source Mode')]
  ];
}

export function buildMarketplaceCatalogExport01391(state,options={}){
  const labels=options.labels||{},categories=arr(state?.categories),mediaMap=new Map(arr(state?.media).map(item=>[item.id,item]));
  const attributes=arr(state?.attributes).slice().sort((a,b)=>(num(a.sortOrder)-num(b.sortOrder))||str(a.name).localeCompare(str(b.name),'uk'));
  const knownKeys=new Set(attributes.map(a=>str(a.key)).filter(Boolean));
  const unknownProductKeys=uniq(arr(state?.products).flatMap(p=>Object.keys(p?.attributes||{})).filter(key=>!knownKeys.has(key))).map((key,index)=>({id:`export_attr_${key}`,key,name:key,type:'text',unit:'',variantOption:false,sortOrder:100000+index}));
  const unknownVariantKeys=uniq(arr(state?.variants).flatMap(v=>Object.keys(v?.options||{})).filter(key=>!knownKeys.has(key))).map((key,index)=>({id:`export_var_attr_${key}`,key,name:key,type:'text',unit:'',variantOption:true,sortOrder:100000+index}));
  const productAttributes=[...attributes.filter(a=>a?.variantOption!==true),...unknownProductKeys],variantAttributes=[...attributes.filter(a=>a?.variantOption===true),...unknownVariantKeys];
  const variantsByProduct=new Map();
  for(const variant of arr(state?.variants)){if(!variantsByProduct.has(variant.productId))variantsByProduct.set(variant.productId,[]);variantsByProduct.get(variant.productId).push(variant);}
  variantsByProduct.forEach(list=>list.sort(variantSort01391));

  const columns=[...baseColumns01391(labels)];
  for(const attribute of productAttributes)columns.push([`attribute:${attribute.key}`,attrLabel01391(attribute,labels,false)]);
  columns.push(...variantColumns01391(labels));
  for(const attribute of variantAttributes)columns.push([`variantOption:${attribute.key}`,attrLabel01391(attribute,labels,true)]);

  const rows=[];let variantRows=0,productsWithVariants=0;
  for(const product of arr(state?.products)){
    const productMedia=orderedMediaUrls01391(product,mediaMap),categoryPaths=uniq(arr(product.categoryIds).map(id=>categoryPath01391(id,categories)).filter(Boolean));
    const base={
      productId:str(product.id),productSku:str(product.sku),productName:str(product.name),productStatus:str(product.status),brand:str(product.brand),
      productPrice:num(product.price),productOldPrice:num(product.oldPrice),currency:str(product.currency)||str(state?.settings?.currency)||'UAH',productStock:num(product.stock),productAvailability:str(product.availability),
      slug:str(product.slug),shortDescription:str(product.shortDescription),description:str(product.description),categories:categoryPaths.join(' | '),productImages:productMedia.join(' | '),primaryProductImage:productMedia[0]||''
    };
    for(const attribute of productAttributes)base[`attribute:${attribute.key}`]=product?.attributes?.[attribute.key]??'';
    const variants=arr(variantsByProduct.get(product.id));if(variants.length)productsWithVariants++;
    const emit=variants.length?variants:[null];
    for(const variant of emit){
      const row={...base};
      if(variant){
        variantRows++;
        const variantMedia=orderedMediaUrls01391(variant,mediaMap);
        Object.assign(row,{variantId:str(variant.id),variantSku:str(variant.sku),variantStatus:str(variant.status),variantPrice:num(variant.price),variantOldPrice:num(variant.oldPrice),variantStock:num(variant.stock),variantAvailability:str(variant.availability),variantImages:variantMedia.join(' | '),primaryVariantImage:variantMedia[0]||'',primaryVariant:variant.id===product.primaryVariantId,variantSortOrder:num(variant.sortOrder01260),variantInheritProductMedia:variant.inheritProductMedia01260!==false,variantMediaSourceMode:str(variant.mediaSourceMode01285)||'own'});
        for(const attribute of variantAttributes)row[`variantOption:${attribute.key}`]=variant?.options?.[attribute.key]??'';
      }else{
        Object.assign(row,{variantId:'',variantSku:'',variantStatus:'',variantPrice:'',variantOldPrice:'',variantStock:'',variantAvailability:'',variantImages:'',primaryVariantImage:'',primaryVariant:'',variantSortOrder:'',variantInheritProductMedia:'',variantMediaSourceMode:''});
        for(const attribute of variantAttributes)row[`variantOption:${attribute.key}`]='';
      }
      rows.push(row);
    }
  }
  return {stage:MARKETPLACE_CATALOG_EXPORT_STAGE_01391,columns,headers:columns.map(([,label])=>label),rows,summary:{products:arr(state?.products).length,variants:arr(state?.variants).length,productsWithVariants,rows:rows.length,variantRows,attributes:productAttributes.length,variantOptions:variantAttributes.length,media:arr(state?.media).length}};
}

function csvCell01391(value,delimiter=';'){
  const s=value===true?'TRUE':value===false?'FALSE':String(value??'');
  return (s.includes('"')||s.includes('\n')||s.includes('\r')||s.includes(delimiter))?`"${s.replace(/"/g,'""')}"`:s;
}
export function buildMarketplaceCsv01391(model,options={}){
  const delimiter=str(options.delimiter)||';',headers=model.headers||[],keys=model.columns.map(([key])=>key);
  const lines=[headers.map(v=>csvCell01391(v,delimiter)).join(delimiter),...model.rows.map(row=>keys.map(key=>csvCell01391(row[key],delimiter)).join(delimiter))];
  return new TextEncoder().encode('\uFEFF'+lines.join('\r\n'));
}

function xmlEscape01391(value){return String(value??'').replace(/[<>&"']/g,m=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[m]));}
function excelColumn01391(index){let n=index+1,out='';while(n>0){const r=(n-1)%26;out=String.fromCharCode(65+r)+out;n=Math.floor((n-1)/26);}return out;}
function sheetXml01391(model){
  const keys=model.columns.map(([key])=>key),matrix=[model.headers,...model.rows.map(row=>keys.map(key=>row[key]))],maxCol=excelColumn01391(Math.max(0,keys.length-1)),maxRow=Math.max(1,matrix.length);
  const rows=matrix.map((cells,rowIndex)=>`<row r="${rowIndex+1}">${cells.map((value,colIndex)=>{
    const ref=`${excelColumn01391(colIndex)}${rowIndex+1}`;
    if(typeof value==='number'&&Number.isFinite(value))return `<c r="${ref}"><v>${value}</v></c>`;
    if(typeof value==='boolean')return `<c r="${ref}" t="b"><v>${value?1:0}</v></c>`;
    const text=xmlEscape01391(value);return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
  }).join('')}</row>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${maxCol}${maxRow}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><sheetData>${rows}</sheetData></worksheet>`;
}
function crcTable01391(){const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}return table;}
const CRC_TABLE_01391=crcTable01391();
function crc3201391(bytes){let c=0xffffffff;for(const byte of bytes)c=CRC_TABLE_01391[(c^byte)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}
function u16le01391(v){return [v&255,(v>>>8)&255];}function u32le01391(v){return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];}
function concatBytes01391(parts){const size=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(size);let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length;}return out;}
function dosTime01391(){return {time:0,date:33};} // 1980-01-01 00:00 for deterministic workbook bytes.
function zipStore01391(entries){
  const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;const stamp=dosTime01391();
  for(const entry of entries){
    const name=enc.encode(entry.name),data=typeof entry.data==='string'?enc.encode(entry.data):entry.data,crc=crc3201391(data);
    const local=new Uint8Array([...u32le01391(0x04034b50),...u16le01391(20),...u16le01391(0),...u16le01391(0),...u16le01391(stamp.time),...u16le01391(stamp.date),...u32le01391(crc),...u32le01391(data.length),...u32le01391(data.length),...u16le01391(name.length),...u16le01391(0),...name]);
    locals.push(local,data);
    const central=new Uint8Array([...u32le01391(0x02014b50),...u16le01391(20),...u16le01391(20),...u16le01391(0),...u16le01391(0),...u16le01391(stamp.time),...u16le01391(stamp.date),...u32le01391(crc),...u32le01391(data.length),...u32le01391(data.length),...u16le01391(name.length),...u16le01391(0),...u16le01391(0),...u16le01391(0),...u16le01391(0),...u32le01391(0),...u32le01391(offset),...name]);
    centrals.push(central);offset+=local.length+data.length;
  }
  const centralSize=centrals.reduce((n,p)=>n+p.length,0),end=new Uint8Array([...u32le01391(0x06054b50),...u16le01391(0),...u16le01391(0),...u16le01391(entries.length),...u16le01391(entries.length),...u32le01391(centralSize),...u32le01391(offset),...u16le01391(0)]);
  return concatBytes01391([...locals,...centrals,end]);
}
export function buildMarketplaceXlsx01391(model,options={}){
  const sheetName=(str(options.sheetName)||'Marketplace').slice(0,31).replace(/[\\/?*\[\]:]/g,' ')||'Marketplace';
  const contentTypes=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;
  const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEscape01391(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const workbookRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
  return zipStore01391([{name:'[Content_Types].xml',data:contentTypes},{name:'_rels/.rels',data:rels},{name:'xl/workbook.xml',data:workbook},{name:'xl/_rels/workbook.xml.rels',data:workbookRels},{name:'xl/worksheets/sheet1.xml',data:sheetXml01391(model)}]);
}

export function generateMarketplaceCatalogExport01391(state,format='csv',options={}){
  const model=buildMarketplaceCatalogExport01391(state,options),f=str(format).toLowerCase();
  if(f==='xlsx')return {mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',ext:'xlsx',data:buildMarketplaceXlsx01391(model,{sheetName:options.sheetName}),model};
  if(f==='csv'){const data=buildMarketplaceCsv01391(model,{delimiter:options.delimiter});return {mime:'text/csv;charset=utf-8',ext:'csv',data,text:new TextDecoder().decode(data),model};}
  if(f==='json'){const text=JSON.stringify(model.rows,null,2);return {mime:'application/json',ext:'json',data:new TextEncoder().encode(text),text,model};}
  const keys=model.columns.map(([key])=>key),xml=`<?xml version="1.0" encoding="UTF-8"?>\n<products>\n${model.rows.map(row=>`  <row>${keys.map(key=>`<${key.replace(/[^A-Za-z0-9_.:-]/g,'_')}>${xmlEscape01391(row[key])}</${key.replace(/[^A-Za-z0-9_.:-]/g,'_')}>`).join('')}</row>`).join('\n')}\n</products>`;
  return {mime:'application/xml',ext:'xml',data:new TextEncoder().encode(xml),text:xml,model};
}
