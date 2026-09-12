import crypto from 'node:crypto';

const clean=v=>String(v??'').trim();
const trimBase=v=>(clean(v)||'https://api.netlify.com/api/v1').replace(/\/+$/,'');

function configError(){const e=new Error('NETLIFY_AUTH_TOKEN is not configured on the server');e.statusCode=503;e.code='ST_NETLIFY_NOT_CONFIGURED';return e;}
function slugify(value){return clean(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-').slice(0,50)||'shifttime-site';}
function defaultSuffix(){return crypto.randomBytes(3).toString('hex');}
function sha1(buffer){return crypto.createHash('sha1').update(buffer).digest('hex');}

async function runWithConcurrency01156(items,limit,worker){
  const rows=Array.from(items||[]);if(!rows.length)return;
  let cursor=0;const width=Math.max(1,Math.min(Number(limit)||1,rows.length));
  await Promise.all(Array.from({length:width},async()=>{while(true){const index=cursor++;if(index>=rows.length)return;await worker(rows[index],index);}}));
}

function normalizeDeployFiles(files){
  const entries=files instanceof Map?[...files.entries()]:Object.entries(files||{});
  const out=[];
  for(const [rawPath,rawValue] of entries){
    const path=clean(rawPath).replace(/\\/g,'/').replace(/^\/+/, '').replace(/\/{2,}/g,'/');
    if(!path)continue;
    if(path.includes('?')||path.includes('#')||path.split('/').includes('..'))throw Object.assign(new Error(`Invalid Netlify deploy path: ${path}`),{statusCode:400});
    const body=Buffer.isBuffer(rawValue)?rawValue:Buffer.from(String(rawValue??''));
    out.push({path,body,sha:sha1(body)});
  }
  if(!out.length)throw Object.assign(new Error('At least one Netlify deploy file is required'),{statusCode:400});
  out.sort((a,b)=>a.path.localeCompare(b.path));
  return out;
}

export function createNetlifyClient01143({token='',baseUrl='https://api.netlify.com/api/v1',fetchImpl=globalThis.fetch,randomSuffix=defaultSuffix}={}){
  const auth=clean(token),base=trimBase(baseUrl);
  if(typeof fetchImpl!=='function')throw new TypeError('fetch implementation is required');
  async function request(path,{method='GET',headers={},body}={}){
    if(!auth)throw configError();
    const res=await fetchImpl(`${base}${path}`,{method,headers:{authorization:`Bearer ${auth}`,...headers},body});
    const raw=await res.text();let data={};try{data=raw?JSON.parse(raw):{};}catch{data={message:raw};}
    if(!res.ok){const e=new Error(clean(data?.message||data?.error)||`Netlify API request failed (${res.status})`);e.statusCode=res.status===401||res.status===403?502:res.status;e.netlifyStatus=res.status;e.code='ST_NETLIFY_API_ERROR';throw e;}
    return data;
  }
  async function createSite({name}={}){const safe=slugify(name);return request('/sites',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:safe})});}
  async function createSiteWithSafeName({preferredName}={}){
    const baseName=slugify(preferredName);
    const readable=`${baseName.slice(0,Math.max(1,62-'shifttime'.length))}-shifttime`;
    const suffix=slugify(randomSuffix()).slice(0,12)||defaultSuffix();
    const randomName=`${baseName.slice(0,Math.max(1,62-suffix.length))}-${suffix}`;
    const candidates=[baseName,readable,randomName].filter((value,index,array)=>array.indexOf(value)===index);
    let lastError=null;
    for(const name of candidates){
      try{return await createSite({name});}catch(err){lastError=err;if(Number(err?.netlifyStatus)!==422)throw err;}
    }
    throw lastError;
  }
  async function deployZip({siteId,zip}={}){if(!clean(siteId))throw Object.assign(new Error('Netlify site id is required'),{statusCode:400});if(!Buffer.isBuffer(zip))throw Object.assign(new Error('ZIP buffer is required'),{statusCode:400});return request(`/sites/${encodeURIComponent(clean(siteId))}/deploys`,{method:'POST',headers:{'content-type':'application/zip'},body:zip});}
  async function deployFiles({siteId,files}={}){
    const sid=clean(siteId);if(!sid)throw Object.assign(new Error('Netlify site id is required'),{statusCode:400});
    const entries=normalizeDeployFiles(files),manifest={};
    for(const entry of entries)manifest[`/${entry.path}`]=entry.sha;
    const deploy=await request(`/sites/${encodeURIComponent(sid)}/deploys`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({files:manifest})});
    const deployId=clean(deploy?.id);if(!deployId)throw Object.assign(new Error('Netlify deploy id is missing'),{statusCode:502,code:'ST_NETLIFY_DEPLOY_INVALID'});
    const required=new Set(Array.isArray(deploy?.required)?deploy.required.map(clean).filter(Boolean):[]);
    if(required.size){
      const firstBySha=new Map();for(const entry of entries)if(!firstBySha.has(entry.sha))firstBySha.set(entry.sha,entry);
      const requiredEntries=[...required].map(digest=>{const entry=firstBySha.get(digest);if(!entry)throw Object.assign(new Error(`Netlify requested unknown file digest: ${digest}`),{statusCode:502,code:'ST_NETLIFY_DEPLOY_INVALID'});return entry;});
      await runWithConcurrency01156(requiredEntries,4,entry=>request(`/deploys/${encodeURIComponent(deployId)}/files/${encodeURIComponent(entry.path)}`,{method:'PUT',headers:{'content-type':'application/octet-stream'},body:entry.body}));
    }
    return deploy;
  }
  async function getDeploy({deployId}={}){if(!clean(deployId))throw Object.assign(new Error('Netlify deploy id is required'),{statusCode:400});return request(`/deploys/${encodeURIComponent(clean(deployId))}`,{method:'GET'});}
  async function deleteSite({siteId}={}){
    const sid=clean(siteId);if(!sid)throw Object.assign(new Error('Netlify site id is required'),{statusCode:400});
    try{await request(`/sites/${encodeURIComponent(sid)}`,{method:'DELETE'});return {deleted:true,alreadyMissing:false};}
    catch(e){if(Number(e?.netlifyStatus)===404)return {deleted:true,alreadyMissing:true};throw e;}
  }
  async function getSiteFile({siteId,path}={}){
    const sid=clean(siteId),filePath=clean(path).replace(/\\/g,'/').replace(/^\/+/, '');
    if(!sid)throw Object.assign(new Error('Netlify site id is required'),{statusCode:400});
    if(!filePath||filePath.includes('?')||filePath.includes('#'))throw Object.assign(new Error('Netlify file path is required'),{statusCode:400});
    return request(`/sites/${encodeURIComponent(sid)}/files/${encodeURIComponent(filePath)}`,{method:'GET'});
  }
  return {createSite,createSiteWithSafeName,deployZip,deployFiles,getDeploy,getSiteFile,deleteSite};
}
