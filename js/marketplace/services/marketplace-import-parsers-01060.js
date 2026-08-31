// 01060 · Source parsers for Marketplace Import Wizard.
// Pure source parsing only. No Store/Repository/storage access here.

function str(v){ return String(v ?? '').replace(/^\uFEFF/,'').trim(); }
function uniqueHeaders(headers){
  const seen=new Map();
  return headers.map((raw,i)=>{
    let h=str(raw)||`Column ${i+1}`;
    const k=h.toLocaleLowerCase();
    const n=(seen.get(k)||0)+1;seen.set(k,n);
    return n===1?h:`${h} (${n})`;
  });
}
function rowsToObjects(matrix){
  const rows=(Array.isArray(matrix)?matrix:[]).filter(r=>Array.isArray(r)&&r.some(v=>str(v)!==''));
  if(!rows.length)return {headers:[],rows:[]};
  const headers=uniqueHeaders(rows[0]);
  return {headers,rows:rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])))};
}

export function detectDelimitedSeparator01060(text){
  const first=String(text??'').replace(/^\uFEFF/,'').split(/\r?\n/).find(x=>x.trim())||'';
  const candidates=[',',';','\t','|'];
  let best=',',score=-1;
  for(const sep of candidates){
    let count=0,quoted=false;
    for(let i=0;i<first.length;i++){
      const ch=first[i];
      if(ch==='"')quoted=!quoted;
      else if(!quoted&&ch===sep)count++;
    }
    if(count>score){score=count;best=sep;}
  }
  return best;
}

export function parseDelimitedText01060(text,{separator}={}){
  const src=String(text??'').replace(/^\uFEFF/,'');
  const sep=separator||detectDelimitedSeparator01060(src);
  const matrix=[];let row=[],cell='',quoted=false;
  for(let i=0;i<src.length;i++){
    const ch=src[i];
    if(ch==='"'){
      if(quoted&&src[i+1]==='"'){cell+='"';i++;}
      else quoted=!quoted;
      continue;
    }
    if(!quoted&&ch===sep){row.push(cell);cell='';continue;}
    if(!quoted&&(ch==='\n'||ch==='\r')){
      if(ch==='\r'&&src[i+1]==='\n')i++;
      row.push(cell);cell='';
      if(row.some(v=>str(v)!==''))matrix.push(row);
      row=[];continue;
    }
    cell+=ch;
  }
  row.push(cell);if(row.some(v=>str(v)!==''))matrix.push(row);
  const out=rowsToObjects(matrix);
  return {...out,format:'csv',separator:sep,sourceRows:matrix.length};
}

function xmlLeafValue(node){
  const direct=[...node.children];
  if(!direct.length)return str(node.textContent);
  return '';
}
function flattenXmlItem(node){
  const out={};
  for(const a of [...node.attributes||[]])out[`@${a.name}`]=a.value;
  const buckets=new Map();
  for(const child of [...node.children]){
    const direct=xmlLeafValue(child);
    if(direct!==''){
      if(!buckets.has(child.tagName))buckets.set(child.tagName,[]);
      buckets.get(child.tagName).push(direct);
      continue;
    }
    for(const leaf of [...child.querySelectorAll('*')].filter(x=>x.children.length===0)){
      const key=`${child.tagName}.${leaf.tagName}`;
      if(!buckets.has(key))buckets.set(key,[]);
      buckets.get(key).push(str(leaf.textContent));
    }
  }
  for(const [k,vals] of buckets)out[k]=vals.filter(Boolean).join(' | ');
  return out;
}
function findXmlItems(doc){
  const preferred=['offer','product','item','record','row','position','товар'];
  for(const tag of preferred){const list=[...doc.getElementsByTagName(tag)];if(list.length>=1)return list;}
  const all=[...doc.querySelectorAll('*')];
  let best=[];
  for(const parent of all){
    const children=[...parent.children];if(children.length<2)continue;
    const by=new Map();for(const c of children){const k=c.tagName;by.set(k,(by.get(k)||[]).concat(c));}
    for(const group of by.values())if(group.length>best.length)best=group;
  }
  if(best.length)return best;
  return doc.documentElement?[doc.documentElement]:[];
}
export function parseXmlText01060(text){
  if(typeof DOMParser==='undefined')throw new Error('XML parser недоступний у цьому середовищі.');
  const doc=new DOMParser().parseFromString(String(text??''),'application/xml');
  const err=doc.querySelector('parsererror');if(err)throw new Error('XML має синтаксичну помилку.');
  const items=findXmlItems(doc);const rows=items.map(flattenXmlItem);
  const headers=[...new Set(rows.flatMap(x=>Object.keys(x)))];
  return {format:'xml',headers,rows,sourceRows:rows.length,itemTag:items[0]?.tagName||''};
}

function u16(view,o){return view.getUint16(o,true);}function u32(view,o){return view.getUint32(o,true);}
function findEocd(view){
  const min=Math.max(0,view.byteLength-0xFFFF-22);
  for(let p=view.byteLength-22;p>=min;p--)if(u32(view,p)===0x06054b50)return p;
  throw new Error('XLSX ZIP: end-of-central-directory не знайдено.');
}
async function inflateRaw(bytes){
  if(typeof DecompressionStream==='undefined')throw new Error('Цей браузер не підтримує DecompressionStream, потрібний для XLSX. Онови Chrome/Edge або збережи файл як CSV.');
  let ds;try{ds=new DecompressionStream('deflate-raw');}catch{throw new Error('Браузер не підтримує deflate-raw для XLSX. Онови Chrome/Edge або збережи файл як CSV.');}
  const stream=new Blob([bytes]).stream().pipeThrough(ds);return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function unzipEntries(buffer){
  const bytes=new Uint8Array(buffer),view=new DataView(buffer),decoder=new TextDecoder('utf-8');
  const eocd=findEocd(view),count=u16(view,eocd+10),centralOffset=u32(view,eocd+16);let p=centralOffset;const entries=new Map();
  for(let i=0;i<count;i++){
    if(u32(view,p)!==0x02014b50)throw new Error('XLSX ZIP: пошкоджений central directory.');
    const method=u16(view,p+10),compressedSize=u32(view,p+20),nameLen=u16(view,p+28),extraLen=u16(view,p+30),commentLen=u16(view,p+32),localOffset=u32(view,p+42);
    const name=decoder.decode(bytes.slice(p+46,p+46+nameLen));
    if(u32(view,localOffset)!==0x04034b50)throw new Error(`XLSX ZIP: local header не знайдено для ${name}.`);
    const localNameLen=u16(view,localOffset+26),localExtraLen=u16(view,localOffset+28),dataStart=localOffset+30+localNameLen+localExtraLen;
    const compressed=bytes.slice(dataStart,dataStart+compressedSize);
    let data;if(method===0)data=compressed;else if(method===8)data=await inflateRaw(compressed);else throw new Error(`XLSX ZIP: compression method ${method} не підтримується.`);
    entries.set(name,data);p+=46+nameLen+extraLen+commentLen;
  }
  return entries;
}
function decodeXml(entries,path){const b=entries.get(path);return b?new TextDecoder('utf-8').decode(b):'';}
function colIndex(ref){let n=0;for(const ch of String(ref).match(/[A-Z]+/i)?.[0]||''){n=n*26+(ch.toUpperCase().charCodeAt(0)-64);}return Math.max(0,n-1);}
function decodeEntities(v){return String(v??'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));}
function xmlAttr(raw,name){const m=String(raw??'').match(new RegExp(`(?:^|\\s)${name.replace(':','\\:')}=(?:"([^"]*)"|'([^']*)')`));return decodeEntities(m?.[1]??m?.[2]??'');}
function xmlTexts(raw,tag='t'){const re=new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`,'gi');return [...String(raw??'').matchAll(re)].map(m=>decodeEntities(m[1].replace(/<[^>]+>/g,'')));}
function parseSharedStrings(xml){return [...String(xml||'').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/gi)].map(m=>xmlTexts(m[1],'t').join(''));}
function resolveTarget(base,target){
  if(target.startsWith('/'))return target.slice(1);
  const stack=base.split('/');stack.pop();
  for(const part of target.split('/')){if(part==='..')stack.pop();else if(part!=='.')stack.push(part);}
  return stack.join('/');
}
function workbookSheets(entries){
  const wb=decodeXml(entries,'xl/workbook.xml');if(!wb)throw new Error('XLSX: xl/workbook.xml не знайдено.');
  const rel=decodeXml(entries,'xl/_rels/workbook.xml.rels'),rels=new Map();
  for(const m of rel.matchAll(/<Relationship\b([^>]*)\/?\s*>/gi)){const id=xmlAttr(m[1],'Id'),target=xmlAttr(m[1],'Target');if(id&&target)rels.set(id,target);}
  const sheets=[];let i=0;for(const m of wb.matchAll(/<sheet\b([^>]*)\/?\s*>/gi)){const attrs=m[1],rid=xmlAttr(attrs,'r:id'),target=rels.get(rid)||`worksheets/sheet${i+1}.xml`;sheets.push({name:xmlAttr(attrs,'name')||`Sheet ${i+1}`,path:resolveTarget('xl/workbook.xml',target)});i++;}return sheets;
}
function sheetMatrix(xml,shared){
  const matrix=[];
  for(const rm of String(xml||'').matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gi)){
    const row=[];
    for(const cm of rm[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/gi)){
      const attrs=cm[1],body=cm[2],idx=colIndex(xmlAttr(attrs,'r')),type=xmlAttr(attrs,'t');let value='';
      if(type==='inlineStr')value=xmlTexts(body,'t').join('');
      else{const vm=body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i),v=decodeEntities(vm?.[1]??'');if(type==='s')value=shared[Number(v)]??'';else if(type==='b')value=v==='1'?'TRUE':'FALSE';else if(type==='str')value=v;else value=v;}
      row[idx]=value;
    }
    matrix.push(row);
  }
  return matrix;
}
export async function parseXlsxArrayBuffer01060(buffer){
  const entries=await unzipEntries(buffer),shared=parseSharedStrings(decodeXml(entries,'xl/sharedStrings.xml')),sheets=workbookSheets(entries),result=[];
  for(const meta of sheets){
    const xml=decodeXml(entries,meta.path);if(!xml)continue;
    const parsed=rowsToObjects(sheetMatrix(xml,shared));result.push({...meta,...parsed});
  }
  if(!result.length)throw new Error('XLSX не містить доступних робочих аркушів.');
  return {format:'xlsx',sheets:result};
}

export async function parseImportFile01060(file,{sheetIndex=0}={}){
  if(!file)throw new Error('Файл не вибрано.');
  const name=str(file.name).toLowerCase(),ext=name.split('.').pop();
  if(ext==='xlsx'){
    const workbook=await parseXlsxArrayBuffer01060(await file.arrayBuffer());const sheet=workbook.sheets[Math.max(0,Math.min(sheetIndex,workbook.sheets.length-1))];
    return {...sheet,format:'xlsx',sheets:workbook.sheets.map((s,i)=>({index:i,name:s.name,rowCount:s.rows.length}))};
  }
  if(ext==='xls')throw new Error('Старий binary .xls не підтримується без окремого важкого parser. Збережи його як .xlsx або .csv — mapping залишиться тим самим.');
  const text=await file.text();
  if(ext==='xml')return parseXmlText01060(text);
  if(ext==='json'){
    const raw=JSON.parse(text),list=Array.isArray(raw)?raw:Array.isArray(raw?.products)?raw.products:Array.isArray(raw?.items)?raw.items:[];
    const rows=list.filter(x=>x&&typeof x==='object').map(x=>({...x}));return {format:'json',headers:[...new Set(rows.flatMap(x=>Object.keys(x)))],rows,sourceRows:rows.length};
  }
  return parseDelimitedText01060(text);
}

export async function parseImportUrl01060(url){
  const res=await fetch(str(url));if(!res.ok)throw new Error(`URL повернув HTTP ${res.status}.`);
  const contentType=(res.headers.get('content-type')||'').toLowerCase(),lower=str(url).toLowerCase();
  if(lower.includes('.xlsx')||contentType.includes('spreadsheetml')){
    const workbook=await parseXlsxArrayBuffer01060(await res.arrayBuffer()),sheet=workbook.sheets[0];return {...sheet,format:'xlsx',sheets:workbook.sheets.map((s,i)=>({index:i,name:s.name,rowCount:s.rows.length}))};
  }
  const text=await res.text();if(lower.includes('.xml')||contentType.includes('xml'))return parseXmlText01060(text);if(lower.includes('.json')||contentType.includes('json')){const raw=JSON.parse(text),list=Array.isArray(raw)?raw:Array.isArray(raw?.products)?raw.products:Array.isArray(raw?.items)?raw.items:[];const rows=list.filter(x=>x&&typeof x==='object').map(x=>({...x}));return {format:'json',headers:[...new Set(rows.flatMap(x=>Object.keys(x)))],rows,sourceRows:rows.length};}return parseDelimitedText01060(text);
}
