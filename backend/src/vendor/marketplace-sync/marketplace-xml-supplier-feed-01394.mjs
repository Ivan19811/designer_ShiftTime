// 01394 · XML Supplier Feed adapter.
// Pure transport/parser helper: XML -> flat staging rows. No MarketplaceStore/DB writes.
export const MARKETPLACE_XML_SUPPLIER_STAGE_01394='01394';
export const XML_SUPPLIER_SYNTAX_ERROR_01394='XML_SUPPLIER_SYNTAX_ERROR_01394';
export const XML_SUPPLIER_ITEM_PATH_INVALID_01394='XML_SUPPLIER_ITEM_PATH_INVALID_01394';
export const XML_SUPPLIER_EMPTY_01394='XML_SUPPLIER_EMPTY_01394';

const str=v=>String(v??'').trim();
const localName=name=>str(name).split(':').pop();
const norm=v=>localName(v).toLocaleLowerCase();
const entityMap={lt:'<',gt:'>',quot:'"',apos:"'",amp:'&'};
function decode(v){return String(v??'').replace(/&(#x[0-9a-f]+|#\d+|lt|gt|quot|apos|amp);/gi,(m,key)=>{if(key[0]==='#'){const hex=key[1]?.toLowerCase()==='x',n=parseInt(key.slice(hex?2:1),hex?16:10);return Number.isFinite(n)?String.fromCodePoint(n):m;}return entityMap[key.toLowerCase()]??m;});}
function cleanText(v){return decode(String(v??'').replace(/\s+/g,' ')).trim();}
function parseAttrs(raw=''){const out={};const re=/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;let m;while((m=re.exec(raw)))out[localName(m[1])]=decode(m[2]??m[3]??'');return out;}
function node(name='',attrs={}){return {name,localName:localName(name),attrs,children:[],texts:[],parent:null};}
function xmlError(code,message){const e=new Error(code);e.code=code;e.detail=message;return e;}

export function parseXmlTree01394(text){
  const src=String(text??'').replace(/^\uFEFF/,'');if(!src.trim())throw xmlError(XML_SUPPLIER_EMPTY_01394,'empty');
  const root=node('__root__'),stack=[root];const tokens=src.match(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[\s\S]*?>|<\/?[^>]+>|[^<]+/g)||[];
  for(const token of tokens){
    if(token.startsWith('<!--')||token.startsWith('<?')||/^<!DOCTYPE/i.test(token))continue;
    if(token.startsWith('<![CDATA[')){stack.at(-1).texts.push(token.slice(9,-3));continue;}
    if(token.startsWith('</')){const close=localName(token.slice(2,-1).trim());if(stack.length<=1||norm(stack.at(-1).localName)!==norm(close))throw xmlError(XML_SUPPLIER_SYNTAX_ERROR_01394,`close:${close}`);stack.pop();continue;}
    if(token.startsWith('<')){const self=/\/\s*>$/.test(token);const inside=token.slice(1,self?token.lastIndexOf('/'):-1).trim();if(!inside||inside.startsWith('!'))continue;const m=inside.match(/^([^\s/>]+)([\s\S]*)$/);if(!m)continue;const n=node(m[1],parseAttrs(m[2]));n.parent=stack.at(-1);stack.at(-1).children.push(n);if(!self)stack.push(n);continue;}
    if(cleanText(token))stack.at(-1).texts.push(token);
  }
  if(stack.length!==1)throw xmlError(XML_SUPPLIER_SYNTAX_ERROR_01394,'unclosed');
  if(!root.children.length)throw xmlError(XML_SUPPLIER_EMPTY_01394,'no-root');return root;
}
function nodeText(n){return cleanText(n.texts.join(' '));}
function pathOf(n){const parts=[];let cur=n;while(cur&&cur.parent&&cur.parent.localName!=='__root__'){parts.unshift(cur.localName);cur=cur.parent;}if(cur&&cur.localName!=='__root__')parts.unshift(cur.localName);return parts.join('.');}
function descendants(n,out=[]){for(const c of n.children){out.push(c);descendants(c,out);}return out;}
function pathSegments(path){return str(path).split(/[./]/).map(localName).map(s=>s.toLocaleLowerCase()).filter(Boolean);}
function nodesAtPath(root,path){const segs=pathSegments(path);if(!segs.length)return[];let current=[root];for(const seg of segs){const next=[];for(const n of current)for(const c of n.children)if(norm(c.localName)===seg)next.push(c);current=next;if(!current.length)break;}return current;}
function preferredScore(name){const order=['offer','product','item','record','row','position','товар'];const i=order.indexOf(norm(name));return i<0?0:(order.length-i)*10000;}
export function detectXmlItemPath01394(root){
  const all=descendants(root,[]),groups=new Map();for(const n of all){const p=n.parent;if(!p)continue;const key=`${pathOf(p)}>${norm(n.localName)}`;const g=groups.get(key)||{nodes:[],name:n.localName,path:pathOf(n)};g.nodes.push(n);groups.set(key,g);}
  const candidates=[...groups.values()].filter(g=>g.nodes.length>=2).sort((a,b)=>(preferredScore(b.name)+b.nodes.length*100+b.path.split('.').length)-(preferredScore(a.name)+a.nodes.length*100+a.path.split('.').length));
  if(candidates[0])return {itemPath:candidates[0].path,count:candidates[0].nodes.length,detected:true};
  for(const name of ['offer','product','item','record','row','position','товар']){const hit=all.find(n=>norm(n.localName)===name);if(hit)return {itemPath:pathOf(hit),count:1,detected:true};}
  const first=root.children[0];return first?{itemPath:pathOf(first),count:1,detected:true}:{itemPath:'',count:0,detected:false};
}
function add(out,key,value){const v=str(value);if(!key||!v)return;if(out[key]){const parts=out[key].split(/\s*\|\s*/);if(!parts.includes(v))out[key]+=` | ${v}`;}else out[key]=v;}
function namedLeafKey(n,prefix){const base=[prefix,n.localName].filter(Boolean).join('.');const named=n.attrs.name??n.attrs.key??n.attrs.code??n.attrs.title;return named?`${base}.${str(named)}`:base;}
function flattenNode(n,out,prefix=''){
  const current=[prefix,n.localName].filter(Boolean).join('.');
  if(!n.children.length){const key=namedLeafKey(n,prefix),named=n.attrs.name??n.attrs.key??n.attrs.code??n.attrs.title;add(out,key,nodeText(n));for(const [k,v] of Object.entries(n.attrs||{})){if(named&&['name','key','code','title'].includes(k))continue;add(out,`${named?key:current}.@${localName(k)}`,v);}return;}
  for(const [k,v] of Object.entries(n.attrs||{}))add(out,`${current}.@${localName(k)}`,v);
  for(const c of n.children)flattenNode(c,out,current);
}
export function flattenXmlSupplierItem01394(item){
  const out={};for(const [k,v] of Object.entries(item.attrs||{}))add(out,`@${localName(k)}`,v);
  for(const c of item.children)flattenNode(c,out,'');return out;
}
function collectCategories(root){
  const cats=new Map();for(const n of descendants(root,[])){if(norm(n.localName)!=='category')continue;const id=str(n.attrs.id??n.attrs.categoryId??n.attrs.code);if(!id)continue;cats.set(id,{id,name:nodeText(n),parentId:str(n.attrs.parentId??n.attrs.parent??n.attrs.parent_id)});}
  const memo=new Map();function resolve(id,trail=new Set()){if(memo.has(id))return memo.get(id);const c=cats.get(id);if(!c||trail.has(id))return c?.name||'';trail.add(id);const parent=c.parentId?resolve(c.parentId,trail):'';const path=[parent,c.name].filter(Boolean).join(' > ');memo.set(id,path);return path;}
  return {count:cats.size,resolve};
}
function categoryIdsFromRow(row){const values=[];for(const [k,v] of Object.entries(row)){const n=k.toLocaleLowerCase().replace(/[^a-zа-яіїєґ0-9]+/giu,'');if(n.endsWith('categoryid')||n==='categoryid')for(const id of str(v).split(/\s*[|;,]\s*/))if(id)values.push(id);}return [...new Set(values)];}
export function parseMarketplaceXmlSupplierFeed01394(text,{itemPath=''}={}){
  const root=parseXmlTree01394(text),detected=detectXmlItemPath01394(root),selectedPath=str(itemPath)||detected.itemPath,items=nodesAtPath(root,selectedPath);
  if(!selectedPath||!items.length)throw xmlError(XML_SUPPLIER_ITEM_PATH_INVALID_01394,selectedPath);
  const categoryIndex=collectCategories(root),rows=items.map(flattenXmlSupplierItem01394);
  for(const row of rows){const paths=categoryIdsFromRow(row).map(id=>categoryIndex.resolve(id)).filter(Boolean);if(paths.length)row.categoryPath=paths.join(' | ');}
  const headers=[...new Set(rows.flatMap(r=>Object.keys(r)))];
  return {format:'xml',sourceKind:'xml',headers,rows,sourceRows:rows.length,itemTag:items[0]?.localName||'',itemPath:selectedPath,itemPathDetected:!str(itemPath),detectedItemPath:detected.itemPath,categoryCount:categoryIndex.count,sourceConfig:{kind:'xml',itemPath:selectedPath,categoryCount:categoryIndex.count}};
}
