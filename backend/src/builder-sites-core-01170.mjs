const clean=v=>String(v??'').trim();
const clone=v=>v==null?v:structuredClone(v);
function httpError(message,statusCode=400,code='ST_BUILDER_SITE_INVALID'){const e=new Error(message);e.statusCode=statusCode;e.code=code;return e;}
function normalizeProject(value){return value&&typeof value==='object'&&!Array.isArray(value)?clone(value):{};}
export function normalizeBuilderSiteInput01170(input={},idOverride=''){
  const id=clean(idOverride||input.id);if(!id)throw httpError('Builder site id is required');
  return {id,name:clean(input.name),slug:clean(input.slug),description:clean(input.description),project:normalizeProject(input.project),schemaVersion:clean(input.schemaVersion||input.project?.version)||'01170'};
}
export function createBuilderSitesService01170({repo,netlify}={}){
  if(!repo)throw new TypeError('Builder sites repository is required');
  return {
    async list(scope){return repo.list(scope);},
    async get(scope,id){const row=await repo.get(scope,clean(id));if(!row)throw httpError('Builder site not found',404,'ST_BUILDER_SITE_NOT_FOUND');return row;},
    async create(scope,userId,input,options={}){return repo.create(scope,userId,normalizeBuilderSiteInput01170(input),options);},
    async save(scope,userId,id,input){const row=await repo.save(scope,userId,clean(id),{...normalizeBuilderSiteInput01170(input,id),expectedRevision:input?.expectedRevision});if(!row)throw httpError('Builder site not found',404,'ST_BUILDER_SITE_NOT_FOUND');return row;},
    async delete(scope,userId,id){
      const siteId=clean(id);if(!siteId)throw httpError('Builder site id is required');
      const target=await repo.getDeleteTarget(scope,siteId);if(!target)throw httpError('Builder site not found',404,'ST_BUILDER_SITE_NOT_FOUND');
      // 01623M: repository verifies ZERO revisions inside a single SQL transaction
      // BEFORE any remote side effects; this also protects against concurrent draft creation.
      const removed=await repo.remove(scope,siteId);
      if(!removed)throw httpError('Builder site not found',404,'ST_BUILDER_SITE_NOT_FOUND');
      let demoRemote={deleted:false,alreadyMissing:false,skipped:true};
      if(clean(target.netlifyDemoSiteId)){
        try{demoRemote=await netlify.deleteSite({siteId:target.netlifyDemoSiteId});}
        catch(e){if(Number(e?.netlifyStatus||e?.statusCode)===404)demoRemote={deleted:true,alreadyMissing:true,skipped:false};
          else{console.error('[ST_DELETE_AUDIT_01623M]',JSON.stringify({event:'netlify-demo-cleanup-failed',siteId,code:clean(e?.code)||'NETLIFY_ERROR'}));demoRemote={deleted:false,skipped:false,error:true};}}
      }
      let remote={deleted:false,alreadyMissing:false,skipped:true};
      if(clean(target.netlifySiteId)){
        try{remote=await netlify.deleteSite({siteId:target.netlifySiteId});}
        catch(e){if(Number(e?.netlifyStatus||e?.statusCode)===404)remote={deleted:true,alreadyMissing:true,skipped:false};
          else{console.error('[ST_DELETE_AUDIT_01623M]',JSON.stringify({event:'netlify-cleanup-failed',siteId,code:clean(e?.code)||'NETLIFY_ERROR'}));remote={deleted:false,skipped:false,error:true};}}
      }
      return {deleted:true,siteId,deletedByUserId:userId,netlify:remote,netlifyDemo:demoRemote};
    },
  };
}
