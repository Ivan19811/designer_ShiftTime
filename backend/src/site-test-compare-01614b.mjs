// 01614B · compare only server-stored visual project data, never live product / CRM records.
import {stableJson01613D} from './site-test-core-01613d.mjs';
const clean=v=>String(v??'').trim();
const same=(a,b)=>stableJson01613D(a??null)===stableJson01613D(b??null);
function pageMap(project){const out=new Map();for(const p of project?.site?.pages||[])if(clean(p?.id))out.set(clean(p.id),p);return out;}
export function compareSiteTestProjects01614B(original,draft){
 const before=pageMap(original),after=pageMap(draft),oldSnapshots=original?.storage?.pageSnapshots||{},newSnapshots=draft?.storage?.pageSnapshots||{},ids=new Set([...before.keys(),...after.keys()]);
 for(const k of [...Object.keys(oldSnapshots),...Object.keys(newSnapshots)]){const p=k.slice(k.indexOf(':')+1);if(p)ids.add(p);}
 const siteId=clean(draft?.site?.id||original?.site?.id),changes=[];
 for(const id of ids){const a=before.get(id),b=after.get(id),key=siteId+':'+id;
  const content=!same(oldSnapshots[key]?.siteFrameMain01040,newSnapshots[key]?.siteFrameMain01040);
  const meta=!same(a,b);
  if(content||meta)changes.push({pageId:id,title:clean(b?.title||b?.name||a?.title||a?.name||id).slice(0,160),mainChanged:content,settingsChanged:meta,added:!a&&!!b,removed:!!a&&!b});
 }
 const s1=original?.storage||{},s2=draft?.storage||{};
 const header=['headerState','headerPageModes','headerGlobalMode','headerHidden','headerTemplateIds'].some(k=>!same(s1[k],s2[k]));
 const footer=['footerState','footerPageModes','footerGlobalMode','footerHidden','footerTemplateIds'].some(k=>!same(s1[k],s2[k]));
 const style=!same(s1.globalStyleStore,s2.globalStyleStore);
 return {stage:'01614B',pageChanges:changes,changedPages:changes.length,headerChanged:header,footerChanged:footer,styleChanged:style,hasChanges:!!(changes.length||header||footer||style)};
}
