export const SITE_NOTIFICATION_PROVIDER_STAGE_01414='01414';
export const SITE_NOTIFICATION_EVENT_TYPES_01414=Object.freeze(['site.published','site.publish_failed','site.domain_failed','site.ssl_failed']);
const str=value=>String(value??'').trim();
const severityByType=Object.freeze({'site.published':'low','site.publish_failed':'critical','site.domain_failed':'critical','site.ssl_failed':'critical'});
const kindByType=Object.freeze({'site.published':'site-published','site.publish_failed':'site-publish-failed','site.domain_failed':'site-domain-failed','site.ssl_failed':'site-ssl-failed'});
const titleByType=Object.freeze({'site.published':'Site published','site.publish_failed':'Site publish failed','site.domain_failed':'Site domain failed','site.ssl_failed':'Site SSL failed'});

export function classifySitePublishingFailure01414(error=''){
  const source=typeof error==='object'&&error?`${str(error.code)} ${str(error.message)} ${str(error.error)} ${str(error.detail)}`:str(error),value=source.toLowerCase();
  if(/\b(ssl|tls|certificate|cert|https)\b/.test(value))return 'site.ssl_failed';
  if(/\b(domain|dns|hostname|host name|custom domain|cname|nameserver|name server)\b/.test(value))return 'site.domain_failed';
  return 'site.publish_failed';
}
export function siteNotificationSeverity01414(type=''){return severityByType[str(type)]||'low';}
export function siteNotificationKind01414(type=''){return kindByType[str(type)]||'site-publish-failed';}
export function normalizeSiteNotificationContext01414(input={}){
  return Object.freeze({
    id:str(input.id||input.builderSiteId||input.siteId),publishedSiteId:str(input.publishedSiteId),name:str(input.siteName||input.name),slug:str(input.siteSlug||input.slug),provider:str(input.provider)||'netlify',
    url:str(input.url||input.netlifySslUrl||input.netlifyUrl),adminUrl:str(input.adminUrl||input.netlifyAdminUrl),netlifySiteId:str(input.netlifySiteId),deployId:str(input.deployId||input.netlifyDeployId),
    state:str(input.state||input.deployState),revision:str(input.revision||input.publishedRevision||input.requestedRevision),requestedRevision:str(input.requestedRevision),publishedRevision:str(input.publishedRevision),error:str(input.error||input.lastError).slice(0,1000)
  });
}
export function siteNotificationEventKey01414(site={},eventType=''){
  const type=str(eventType),ctx=normalizeSiteNotificationContext01414(site);if(!SITE_NOTIFICATION_EVENT_TYPES_01414.includes(type)||!ctx.id)return '';
  const source=ctx.deployId||ctx.revision||'publish';return `${ctx.id}:${source}:${type}`;
}
export function buildSiteNotificationEvent01414(input={}){
  const type=SITE_NOTIFICATION_EVENT_TYPES_01414.includes(str(input.eventType))?str(input.eventType):classifySitePublishingFailure01414(input.error||input.lastError),site=normalizeSiteNotificationContext01414(input),eventKey=str(input.eventKey)||siteNotificationEventKey01414(site,type);
  if(!site.id)throw Object.assign(new Error('SITE_NOTIFICATION_SITE_ID_REQUIRED_01414'),{code:'SITE_NOTIFICATION_SITE_ID_REQUIRED_01414'});
  if(!eventKey)throw Object.assign(new Error('SITE_NOTIFICATION_EVENT_KEY_REQUIRED_01414'),{code:'SITE_NOTIFICATION_EVENT_KEY_REQUIRED_01414'});
  const severity=siteNotificationSeverity01414(type),kind=siteNotificationKind01414(type),title=`${titleByType[type]} · ${site.name||site.id}`;
  const body=type==='site.published'?[site.url,site.revision?`Revision ${site.revision}`:''].filter(Boolean).join(' · '):[site.error||'Publishing error',site.revision?`Revision ${site.revision}`:''].filter(Boolean).join(' · ');
  return Object.freeze({stage:SITE_NOTIFICATION_PROVIDER_STAGE_01414,eventKey,type,provider:'sites',severity,kind,occurredAt:str(input.occurredAt)||new Date().toISOString(),notification:Object.freeze({title,body}),data:Object.freeze({site})});
}
