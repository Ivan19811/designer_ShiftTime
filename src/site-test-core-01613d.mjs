import crypto from 'node:crypto';
const clean=v=>String(v??'').trim();
export const siteTestError01613D=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
export function stableJson01613D(value){
 if(Array.isArray(value))return `[${value.map(v=>stableJson01613D(v??null)).join(',')}]`;
 if(value&&typeof value==='object')return `{${Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>`${JSON.stringify(k)}:${stableJson01613D(value[k])}`).join(',')}}`;
 return JSON.stringify(value??null);
}
export const projectSha01613D=value=>crypto.createHash('sha256').update(stableJson01613D(value)).digest('hex');
export const newTestId01613D=()=>`sttest_${crypto.randomUUID().replaceAll('-','')}`;
export const newRevisionId01613D=()=>`rev_${crypto.randomUUID().replaceAll('-','')}`;
export function assertTestActor01613D(scope,userId,row,{write=false,promote=false}={}){
 if(!row||!clean(userId))throw siteTestError01613D('ST_TEST_NOT_FOUND_01613D',404);
 if(scope?.role==='owner'){
  if(write&&clean(row.author_user_id)!==clean(userId))throw siteTestError01613D('ST_TEST_AUTHOR_REQUIRED_01613D',403);
  return true;
 }
 if(promote)throw siteTestError01613D('ST_TEST_OWNER_REQUIRED_01613D',403);
 if(clean(row.author_user_id)!==clean(userId))throw siteTestError01613D('ST_TEST_AUTHOR_REQUIRED_01613D',403);
 if(write&&row.state==='published')throw siteTestError01613D('ST_TEST_ALREADY_PUBLISHED_01613D',409);
 return true;
}
export function assertProductionUnchanged01613D(base,current){
 if(Number(base)!==Number(current))throw siteTestError01613D('ST_TEST_ORIGINAL_CHANGED_01613D',409);
 return true;
}
export function previewModeFiles01613D(files){
 if(!(files instanceof Map)||!files.has('index.html'))throw siteTestError01613D('ST_TEST_ROOT_REQUIRED_01613D',400);
 const out=new Map(files);
 // Preview is VISUAL ONLY. CSP prevents web API calls and form submissions.
 // All production candidate files remain unchanged and are never exposed by the UI.
 for(const [path,value] of out){
  if(!/\.html$/i.test(path))continue;
  const html=Buffer.isBuffer(value)?value.toString('utf8'):String(value);
  const guard=`<meta http-equiv="Content-Security-Policy" content="connect-src 'none'; form-action 'none'; frame-src 'none'; object-src 'none'">`;
  const withGuard=/<head[^>]*>/i.test(html)?html.replace(/<head([^>]*)>/i,`<head$1>${guard}`):guard+html;
  out.set(path,withGuard);
 }
 const priorHeaders=out.get('_headers');
 out.set('_headers',`${priorHeaders?String(priorHeaders).trimEnd()+'\n\n':''}/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n`);
 out.set('robots.txt','User-agent: *\nDisallow: /\n');
 return out;
}
export function assertDraftDeploy01613D(row){
 if(!clean(row?.id)||row.draft!==true)throw siteTestError01613D('ST_TEST_NETLIFY_NOT_DRAFT_01613D',502);
 return row;
}
export function previewPermalink01613D(deploy){
 const address=clean(deploy?.deploy_ssl_url||deploy?.deploy_url);
 if(!/^https:\/\//i.test(address))throw siteTestError01613D('ST_TEST_PREVIEW_LINK_MISSING_01613D',502);
 return address;
}
