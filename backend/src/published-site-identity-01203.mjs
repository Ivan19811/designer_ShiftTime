import crypto from 'node:crypto';
const clean=value=>String(value??'').trim();
const validToken=value=>/^pst_[A-Za-z0-9_-]{20,}$/.test(clean(value));

export function createPublishedSiteTrafficToken01203({randomBytes=crypto.randomBytes}={}){
  return `pst_${Buffer.from(randomBytes(32)).toString('base64url')}`;
}

export function normalizePublishedSiteTrafficIdentity01203(row={}){
  if(!row)return null;
  const siteId=clean(row.builder_site_id);if(!siteId)return null;
  return Object.freeze({
    accountId:clean(row.account_id),workspaceId:clean(row.workspace_id),storeId:clean(row.store_id),siteId,
    publishedSiteId:clean(row.id),siteName:clean(row.site_name),siteSlug:clean(row.site_slug),
  });
}

export function createPublishedSiteIdentityResolver01203({findByToken}={}){
  if(typeof findByToken!=='function')throw new TypeError('01203 published-site identity resolver requires findByToken');
  return async token=>{
    const key=clean(token);if(!validToken(key))return null;
    return normalizePublishedSiteTrafficIdentity01203(await findByToken(key));
  };
}

const defaultResolver=createPublishedSiteIdentityResolver01203({
  findByToken:async token=>{
    const {withClient}=await import('./db.mjs');
    return withClient(async client=>{
      const q=await client.query(`SELECT id,account_id,workspace_id,store_id,builder_site_id,site_name,site_slug FROM shifttime_published_sites WHERE traffic_identity_token=$1 LIMIT 1`,[token]);
      return q.rows[0]||null;
    });
  },
});

export const resolvePublishedSiteTrafficIdentity01203=token=>defaultResolver(token);
