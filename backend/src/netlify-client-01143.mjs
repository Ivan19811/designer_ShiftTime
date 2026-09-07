import crypto from 'node:crypto';

const clean=v=>String(v??'').trim();
const trimBase=v=>(clean(v)||'https://api.netlify.com/api/v1').replace(/\/+$/,'');

function configError(){const e=new Error('NETLIFY_AUTH_TOKEN is not configured on the server');e.statusCode=503;e.code='ST_NETLIFY_NOT_CONFIGURED';return e;}
function slugify(value){return clean(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-').slice(0,50)||'shifttime-site';}
function defaultSuffix(){return crypto.randomBytes(3).toString('hex');}

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
  async function getDeploy({deployId}={}){if(!clean(deployId))throw Object.assign(new Error('Netlify deploy id is required'),{statusCode:400});return request(`/deploys/${encodeURIComponent(clean(deployId))}`,{method:'GET'});}
  return {createSite,createSiteWithSafeName,deployZip,getDeploy};
}
