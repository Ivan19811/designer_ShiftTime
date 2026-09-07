const clean=v=>String(v??'').trim();
const terminal=new Set(['ready','error']);
function publicUrl(r){return clean(r?.netlifySslUrl||r?.netlifyUrl);}
function toStatus(r,{configured=true}={}){if(!r)return {stage:'01143',provider:'netlify',configured,state:'not-published',netlifySiteId:'',deployId:'',deployState:'not-published',url:'',publishedRevision:'',requestedRevision:'',lastPublishedAt:null,lastError:''};return {
  stage:'01143',provider:'netlify',configured,state:r.lastDeployState||'not-published',builderSiteId:r.builderSiteId||'',netlifySiteId:r.netlifySiteId||'',siteName:r.netlifySiteName||r.siteName||'',url:publicUrl(r),adminUrl:r.netlifyAdminUrl||'',deployId:r.lastDeployId||'',deployState:r.lastDeployState||'not-published',requestedRevision:r.requestedRevision||'',publishedRevision:r.publishedRevision||'',lastPublishedAt:r.lastPublishedAt||null,lastError:r.lastPublishError||''
};}

export function createSitePublishingService01143({repo,netlify,buildFiles=buildProductionFiles01143,createZip=createZip01143,now=()=>new Date(),apiProxyTarget='',configured=true}={}){
  if(!repo)throw new TypeError('Publishing repository is required');if(!netlify)throw new TypeError('Netlify client is required');
  async function publish(scope,userId,builderSiteId,pkg){
    const sid=clean(builderSiteId);if(!sid||clean(pkg?.site?.id)!==sid)throw Object.assign(new Error('Publish package site id does not match requested site id'),{statusCode:400});if(clean(pkg?.version)!=='01143')throw Object.assign(new Error('Unsupported publish package version'),{statusCode:400});if(!clean(pkg?.revision))throw Object.assign(new Error('Publish revision is required'),{statusCode:400});
    let record=await repo.get(scope,sid);
    if(!clean(record?.netlifySiteId)){
      const preferred=clean(pkg?.site?.slug||pkg?.site?.name||sid);
      const site=await netlify.createSiteWithSafeName({preferredName:preferred});
      record=await repo.saveIdentity(scope,{builderSiteId:sid,siteName:clean(pkg?.site?.name),siteSlug:clean(pkg?.site?.slug),netlifySiteId:clean(site.id),netlifySiteName:clean(site.name),netlifyUrl:clean(site.url),netlifySslUrl:clean(site.ssl_url),netlifyAdminUrl:clean(site.admin_url),createdByUserId:userId});
    }
    const canonicalBaseUrl=publicUrl(record);const files=buildFiles(pkg,{canonicalBaseUrl,apiProxyTarget});const zip=createZip(files);
    let deploy;try{deploy=await netlify.deployZip({siteId:record.netlifySiteId,zip});}catch(err){await repo.updateDeploy(scope,{builderSiteId:sid,state:'error',error:clean(err.message)}).catch(()=>{});throw err;}
    record=await repo.recordDeploy(scope,{builderSiteId:sid,netlifyDeployId:clean(deploy.id),revision:clean(pkg.revision),state:clean(deploy.state)||'new',createdByUserId:userId});return toStatus(record);
  }
  async function status(scope,builderSiteId){
    const sid=clean(builderSiteId);let record=await repo.get(scope,sid);if(!record)return toStatus(null,{configured});
    if(record.lastDeployId&&!terminal.has(record.lastDeployState)){
      try{const dep=await netlify.getDeploy({deployId:record.lastDeployId});const state=clean(dep.state)||record.lastDeployState;const ready=state==='ready';const failed=['error','failed'].includes(state);record=await repo.updateDeploy(scope,{builderSiteId:sid,netlifyDeployId:record.lastDeployId,state:failed?'error':state,error:failed?clean(dep.error_message||dep.message||'Netlify deploy failed'):'',publishedRevision:ready?record.requestedRevision:'',publishedAt:ready?now().toISOString():null});}catch(err){if(Number(err?.netlifyStatus)===404)record=await repo.updateDeploy(scope,{builderSiteId:sid,netlifyDeployId:record.lastDeployId,state:'error',error:'Netlify deploy was not found'});}
    }
    return toStatus(record,{configured});
  }
  return {publish,status};
}

