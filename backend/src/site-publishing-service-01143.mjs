import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {config} from './config.mjs';
import {createNetlifyClient01143} from './netlify-client-01143.mjs';
import {buildProductionFiles01143} from './site-production-build-01143.mjs';
import {createZip01143} from './zip-01143.mjs';
import {createSitePublishingService01143} from './site-publishing-core-01143.mjs';

const id=(prefix)=>`${prefix}_${crypto.randomUUID().replace(/-/g,'')}`;
function mapRow(r){if(!r)return null;return {
  id:r.id,builderSiteId:r.builder_site_id,siteName:r.site_name||'',siteSlug:r.site_slug||'',provider:r.provider||'netlify',
  netlifySiteId:r.netlify_site_id||'',netlifySiteName:r.netlify_site_name||'',netlifyUrl:r.netlify_url||'',netlifySslUrl:r.netlify_ssl_url||'',netlifyAdminUrl:r.netlify_admin_url||'',
  lastDeployId:r.last_deploy_id||'',lastDeployState:r.last_deploy_state||'not-published',requestedRevision:r.requested_revision||'',publishedRevision:r.published_revision||'',lastPublishError:r.last_publish_error||'',
  lastPublishedAt:r.last_published_at?new Date(r.last_published_at).toISOString():null,
};}

export function createPostgresPublishingRepository01143(){
  return {
    async get(scope,builderSiteId){return withClient(async c=>{const q=await c.query(`SELECT * FROM shifttime_published_sites WHERE account_id=$1 AND workspace_id=$2 AND store_id=$3 AND builder_site_id=$4 LIMIT 1`,[scope.accountId,scope.workspaceId,scope.storeId,builderSiteId]);return mapRow(q.rows[0]);});},
    async saveIdentity(scope,data){return withClient(async c=>{const q=await c.query(`INSERT INTO shifttime_published_sites(id,account_id,workspace_id,store_id,builder_site_id,site_name,site_slug,provider,netlify_site_id,netlify_site_name,netlify_url,netlify_ssl_url,netlify_admin_url,created_by_user_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,'netlify',$8,$9,$10,$11,$12,$13)
      ON CONFLICT(store_id,builder_site_id) DO UPDATE SET site_name=EXCLUDED.site_name,site_slug=EXCLUDED.site_slug,netlify_site_id=COALESCE(shifttime_published_sites.netlify_site_id,EXCLUDED.netlify_site_id),netlify_site_name=CASE WHEN shifttime_published_sites.netlify_site_id IS NULL THEN EXCLUDED.netlify_site_name ELSE shifttime_published_sites.netlify_site_name END,netlify_url=CASE WHEN shifttime_published_sites.netlify_site_id IS NULL THEN EXCLUDED.netlify_url ELSE shifttime_published_sites.netlify_url END,netlify_ssl_url=CASE WHEN shifttime_published_sites.netlify_site_id IS NULL THEN EXCLUDED.netlify_ssl_url ELSE shifttime_published_sites.netlify_ssl_url END,netlify_admin_url=CASE WHEN shifttime_published_sites.netlify_site_id IS NULL THEN EXCLUDED.netlify_admin_url ELSE shifttime_published_sites.netlify_admin_url END,updated_at=now()
      RETURNING *`,[id('pubsite'),scope.accountId,scope.workspaceId,scope.storeId,data.builderSiteId,data.siteName||'',data.siteSlug||'',data.netlifySiteId||null,data.netlifySiteName||'',data.netlifyUrl||'',data.netlifySslUrl||'',data.netlifyAdminUrl||'',data.createdByUserId||null]);return mapRow(q.rows[0]);});},
    async recordDeploy(scope,data){return withClient(async c=>{await c.query('BEGIN');try{const s=await c.query(`UPDATE shifttime_published_sites SET last_deploy_id=$1,last_deploy_state=$2,requested_revision=$3,last_publish_error='',updated_at=now() WHERE account_id=$4 AND workspace_id=$5 AND store_id=$6 AND builder_site_id=$7 RETURNING *`,[data.netlifyDeployId,data.state||'new',data.revision||'',scope.accountId,scope.workspaceId,scope.storeId,data.builderSiteId]);if(!s.rowCount)throw Object.assign(new Error('Published site identity not found'),{statusCode:404});await c.query(`INSERT INTO shifttime_site_deployments(id,published_site_id,netlify_deploy_id,revision,state,created_by_user_id) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(netlify_deploy_id) DO UPDATE SET state=EXCLUDED.state,updated_at=now()`,[id('deploy'),s.rows[0].id,data.netlifyDeployId,data.revision||'',data.state||'new',data.createdByUserId||null]);await c.query('COMMIT');return mapRow(s.rows[0]);}catch(e){await c.query('ROLLBACK');throw e;}});},
    async updateDeploy(scope,data){return withClient(async c=>{await c.query('BEGIN');try{const publishedAt=data.publishedAt||null;const q=await c.query(`UPDATE shifttime_published_sites SET last_deploy_state=$1,last_publish_error=$2,published_revision=CASE WHEN $3::text<>'' THEN $3 ELSE published_revision END,last_published_at=COALESCE($4::timestamptz,last_published_at),updated_at=now() WHERE account_id=$5 AND workspace_id=$6 AND store_id=$7 AND builder_site_id=$8 RETURNING *`,[data.state||'error',data.error||'',data.publishedRevision||'',publishedAt,scope.accountId,scope.workspaceId,scope.storeId,data.builderSiteId]);if(data.netlifyDeployId)await c.query(`UPDATE shifttime_site_deployments SET state=$1,error=$2,published_at=COALESCE($3::timestamptz,published_at),updated_at=now() WHERE netlify_deploy_id=$4`,[data.state||'error',data.error||'',publishedAt,data.netlifyDeployId]);await c.query('COMMIT');return mapRow(q.rows[0]);}catch(e){await c.query('ROLLBACK');throw e;}});},
  };
}


const defaultRepo=createPostgresPublishingRepository01143();
const defaultNetlify=createNetlifyClient01143({token:config.netlifyAuthToken,baseUrl:config.netlifyApiBaseUrl});
const defaultService=createSitePublishingService01143({repo:defaultRepo,netlify:defaultNetlify,buildFiles:buildProductionFiles01143,createZip:createZip01143,apiProxyTarget:config.publicApiBaseUrl,configured:Boolean(config.netlifyAuthToken)});
export const publishSite01143=(scope,userId,builderSiteId,pkg)=>defaultService.publish(scope,userId,builderSiteId,pkg);
export const getSitePublishStatus01143=(scope,builderSiteId)=>defaultService.status(scope,builderSiteId);
