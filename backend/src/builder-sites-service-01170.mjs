import {withClient} from './db.mjs';
import {config} from './config.mjs';
import {createNetlifyClient01143} from './netlify-client-01143.mjs';
import {createBuilderSitesService01170,normalizeBuilderSiteInput01170} from './builder-sites-core-01170.mjs';

const clean=v=>String(v??'').trim();
function httpError(message,statusCode=400,code='ST_BUILDER_SITE_INVALID'){const e=new Error(message);e.statusCode=statusCode;e.code=code;return e;}
function mapRow(r){if(!r)return null;return {
  id:r.id,name:r.name||'',slug:r.slug||'',description:r.description||'',status:r.status||'active',ownerUserId:r.owner_user_id||'',
  createdAt:r.created_at?new Date(r.created_at).toISOString():null,updatedAt:r.updated_at?new Date(r.updated_at).toISOString():null,
  schemaVersion:r.schema_version||'01170',revision:Number(r.revision||0),project:r.project_json&&typeof r.project_json==='object'?r.project_json:{},
  netlifySiteId:r.netlify_site_id||'',netlifyUrl:r.netlify_ssl_url||r.netlify_url||'',netlifySiteName:r.netlify_site_name||'',lastDeployState:r.last_deploy_state||'not-published',
};}

export function createBuilderSitesRepository01170(){
  const select=`SELECT s.*,p.schema_version,p.revision,p.project_json,p.updated_at project_updated_at,
    pub.netlify_site_id,pub.netlify_site_name,pub.netlify_url,pub.netlify_ssl_url,pub.last_deploy_state
    FROM shifttime_builder_sites s
    LEFT JOIN shifttime_builder_site_projects p ON p.site_id=s.id
    LEFT JOIN shifttime_published_sites pub ON pub.account_id=s.account_id AND pub.workspace_id=s.workspace_id AND pub.store_id=s.store_id AND pub.builder_site_id=s.id`;
  return {
    async list(scope){return withClient(async c=>{const q=await c.query(`${select} WHERE s.account_id=$1 AND s.workspace_id=$2 AND s.store_id=$3 AND s.status<>'archived' ORDER BY s.updated_at DESC,s.created_at DESC`,[scope.accountId,scope.workspaceId,scope.storeId]);return q.rows.map(mapRow);});},
    async get(scope,id){return withClient(async c=>{const q=await c.query(`${select} WHERE s.account_id=$1 AND s.workspace_id=$2 AND s.store_id=$3 AND s.id=$4 LIMIT 1`,[scope.accountId,scope.workspaceId,scope.storeId,id]);return mapRow(q.rows[0]);});},
    async create(scope,userId,input){const data=normalizeBuilderSiteInput01170(input);return withClient(async c=>{await c.query('BEGIN');try{
      const existing=await c.query('SELECT account_id,workspace_id,store_id FROM shifttime_builder_sites WHERE id=$1 LIMIT 1',[data.id]);
      if(existing.rowCount){const r=existing.rows[0];if(r.account_id!==scope.accountId||r.workspace_id!==scope.workspaceId||r.store_id!==scope.storeId)throw httpError('Builder site id already belongs to another scope',409,'ST_BUILDER_SITE_ID_CONFLICT');
        await c.query(`UPDATE shifttime_builder_sites SET name=$1,slug=$2,description=$3,status='active',updated_at=now() WHERE id=$4`,[data.name,data.slug,data.description,data.id]);
        await c.query(`INSERT INTO shifttime_builder_site_projects(site_id,schema_version,revision,project_json,updated_by_user_id) VALUES($1,$2,1,$3::jsonb,$4)
          ON CONFLICT(site_id) DO UPDATE SET schema_version=EXCLUDED.schema_version,project_json=EXCLUDED.project_json,updated_by_user_id=EXCLUDED.updated_by_user_id,updated_at=now()`,[data.id,data.schemaVersion,JSON.stringify(data.project),userId]);
      }else{
        await c.query(`INSERT INTO shifttime_builder_sites(id,account_id,workspace_id,store_id,owner_user_id,name,slug,description,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'active')`,[data.id,scope.accountId,scope.workspaceId,scope.storeId,userId,data.name,data.slug,data.description]);
        await c.query(`INSERT INTO shifttime_builder_site_projects(site_id,schema_version,revision,project_json,updated_by_user_id) VALUES($1,$2,1,$3::jsonb,$4)`,[data.id,data.schemaVersion,JSON.stringify(data.project),userId]);
      }
      const q=await c.query(`${select} WHERE s.account_id=$1 AND s.workspace_id=$2 AND s.store_id=$3 AND s.id=$4 LIMIT 1`,[scope.accountId,scope.workspaceId,scope.storeId,data.id]);await c.query('COMMIT');return mapRow(q.rows[0]);
    }catch(e){await c.query('ROLLBACK');throw e;}});},
    async save(scope,userId,id,input){const data=normalizeBuilderSiteInput01170(input,id);return withClient(async c=>{await c.query('BEGIN');try{
      const s=await c.query(`UPDATE shifttime_builder_sites SET name=$1,slug=$2,description=$3,updated_at=now() WHERE account_id=$4 AND workspace_id=$5 AND store_id=$6 AND id=$7 RETURNING id`,[data.name,data.slug,data.description,scope.accountId,scope.workspaceId,scope.storeId,data.id]);
      if(!s.rowCount){await c.query('ROLLBACK');return null;}
      await c.query(`INSERT INTO shifttime_builder_site_projects(site_id,schema_version,revision,project_json,updated_by_user_id) VALUES($1,$2,1,$3::jsonb,$4)
        ON CONFLICT(site_id) DO UPDATE SET schema_version=EXCLUDED.schema_version,revision=shifttime_builder_site_projects.revision+1,project_json=EXCLUDED.project_json,updated_by_user_id=EXCLUDED.updated_by_user_id,updated_at=now()`,[data.id,data.schemaVersion,JSON.stringify(data.project),userId]);
      const q=await c.query(`${select} WHERE s.account_id=$1 AND s.workspace_id=$2 AND s.store_id=$3 AND s.id=$4 LIMIT 1`,[scope.accountId,scope.workspaceId,scope.storeId,data.id]);await c.query('COMMIT');return mapRow(q.rows[0]);
    }catch(e){try{await c.query('ROLLBACK');}catch{}throw e;}});},
    async getDeleteTarget(scope,id){return withClient(async c=>{const q=await c.query(`SELECT s.id,pub.netlify_site_id FROM shifttime_builder_sites s LEFT JOIN shifttime_published_sites pub ON pub.account_id=s.account_id AND pub.workspace_id=s.workspace_id AND pub.store_id=s.store_id AND pub.builder_site_id=s.id WHERE s.account_id=$1 AND s.workspace_id=$2 AND s.store_id=$3 AND s.id=$4 LIMIT 1`,[scope.accountId,scope.workspaceId,scope.storeId,id]);if(!q.rowCount)return null;return {id:q.rows[0].id,netlifySiteId:q.rows[0].netlify_site_id||''};});},
    async remove(scope,id){return withClient(async c=>{await c.query('BEGIN');try{await c.query(`DELETE FROM shifttime_published_sites WHERE account_id=$1 AND workspace_id=$2 AND store_id=$3 AND builder_site_id=$4`,[scope.accountId,scope.workspaceId,scope.storeId,id]);const q=await c.query(`DELETE FROM shifttime_builder_sites WHERE account_id=$1 AND workspace_id=$2 AND store_id=$3 AND id=$4`,[scope.accountId,scope.workspaceId,scope.storeId,id]);await c.query('COMMIT');return q.rowCount>0;}catch(e){await c.query('ROLLBACK');throw e;}});},
  };
}


const defaultService=createBuilderSitesService01170({repo:createBuilderSitesRepository01170(),netlify:createNetlifyClient01143({token:config.netlifyAuthToken,baseUrl:config.netlifyApiBaseUrl})});
export const listBuilderSites01170=scope=>defaultService.list(scope);
export const getBuilderSite01170=(scope,id)=>defaultService.get(scope,id);
export const createBuilderSite01170=(scope,userId,input)=>defaultService.create(scope,userId,input);
export const saveBuilderSite01170=(scope,userId,id,input)=>defaultService.save(scope,userId,id,input);
export const deleteBuilderSite01170=(scope,userId,id)=>defaultService.delete(scope,userId,id);
