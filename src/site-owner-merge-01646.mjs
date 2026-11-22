// 01646 · A single three-way reconciliation contract for owner publication.
// The manager's accepted edits live in canonical; unrelated changes in an
// owner's draft are applied without replacing the complete canonical site.
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const copy=v=>v===undefined?undefined:structuredClone(v);
const key=v=>String(v?.id??'').trim();
const conflict=(path)=>{const e=new Error('Обидві редакції змінювали ту саму частину сайту. Перевір цю зміну перед публікацією.');e.code='ST_OWNER_EDIT_CONFLICT_01646';e.statusCode=409;e.path=path;throw e;};
function mergePages(base=[],edited=[],current=[],path){
 const b=new Map(base.map(x=>[key(x),x])),e=new Map(edited.map(x=>[key(x),x])),c=new Map(current.map(x=>[key(x),x]));
 if([...b.keys(),...e.keys(),...c.keys()].some(k=>!k)||b.size!==base.length||e.size!==edited.length||c.size!==current.length)conflict(path);
 const out=[];
 for(const p of current){const id=key(p),bp=b.get(id),ep=e.get(id),cp=c.get(id);
   if(!e.has(id)&&b.has(id)){if(!eq(bp,cp))conflict(`${path}.${id}`);continue;}
   if(!e.has(id)){out.push(copy(cp));continue;}
   out.push(merge(bp,ep,cp,`${path}.${id}`));
 }
 for(const p of edited){const id=key(p);if(c.has(id))continue;
   if(b.has(id)){
     if(!eq(b.get(id),e.get(id)))conflict(`${path}.${id}`);
     // A separately removed page stays removed; do not resurrect it silently.
     continue;
   }
   out.push(copy(p));
 }
 return out;
}
function merge(base,edited,current,path){
 // Last viewed page is editor navigation, not published page content.
 if(path==='project.site.currentPageId')return copy(current);
 if(eq(base,edited))return copy(current);
 if(eq(base,current)||eq(edited,current))return copy(edited);
 if(path==='project.site.pages'&&Array.isArray(base)&&Array.isArray(edited)&&Array.isArray(current))
   return mergePages(base,edited,current,path);
 if(obj(base)&&obj(edited)&&obj(current)){
   const out=copy(current);
   for(const k of new Set([...Object.keys(base),...Object.keys(edited)])){
     if(!has(edited,k)&&has(base,k)){
       if(!eq(current?.[k],base[k]))conflict(`${path}.${k}`);
       delete out[k];continue;
     }
     if(!has(edited,k))continue;
     const next=merge(base[k],edited[k],current?.[k],`${path}.${k}`);
     if(next===undefined)delete out[k];else out[k]=next;
   }
   return out;
 }
 return conflict(path);
}
export function mergeOwnerProject01646({base,edited,current,siteId}={}){
 const sid=String(siteId||'').trim();
 if(!sid||[base,edited,current].some(p=>p?.site?.id!==sid||!obj(p?.storage)||!obj(p?.storage?.pageSnapshots)))
   conflict('project.site.id');
 const out=merge(base,edited,current,'project');
 // Validate all pages have their own stored snapshot. Only omit if explicitly
 // absent in both base and edited (a pre-existing legacy placeholder).
 const pages=out?.site?.pages||[],ids=new Set(pages.map(key));
 if(ids.size!==pages.length||!ids.has('page_home'))conflict('project.site.pages');
 for(const page of pages){
   const k=`${sid}:${key(page)}`;
   if(!has(out.storage.pageSnapshots,k)&&has(edited.storage.pageSnapshots,k))conflict(`project.storage.pageSnapshots.${key(page)}`);
 }
 return out;
}
export function nextOwnerHistorySlot01646(existing=[]){
 const slots=new Set(existing.map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=50));
 for(let n=1;n<=49;n++)if(!slots.has(n))return n;
 return 50; // exactly the user's requested overwrite of the last slot
}
