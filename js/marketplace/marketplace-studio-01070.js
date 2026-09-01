// 01070 · Multi-Tenant Commerce Foundation.
import {initMarketplaceStudio01069} from './marketplace-studio-01069.js?v=01090';
import {initMarketplaceMultiTenant01070} from './marketplace-multi-tenant-01070.js?v=01090';

let api=null;
export async function initMarketplaceStudio01070(){
  await initMarketplaceStudio01069();
  const multiTenant=await initMarketplaceMultiTenant01070();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(studio){
    studio.dataset.mpStage='01070';
    const metrics=studio.querySelector('[data-mp-system-status-block]')?.querySelectorAll('.mp-context__metric')||[];
    if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01070</b>';
    if(metrics[1])metrics[1].innerHTML='<span>Commerce scope</span><b>STORE CONTEXT</b>';
    if(metrics[2])metrics[2].innerHTML='<span>Tenant model</span><b>Account → Workspace</b>';
    if(metrics[3])metrics[3].innerHTML='<span>Domain entities</span><b>Store-agnostic</b>';
    const warn=studio.querySelector('.mp-context__notice.is-warn');
    if(warn)warn.innerHTML='<b>Multi-tenant 01070:</b> активний Store вибирає repository scope над MarketplaceStore. Product/Category не отримують tenantId/storeId. У production backend сам перевірятиме session → Membership → Store; браузерний context не є доказом авторизації.';
  }
  api=Object.freeze({stage:'01070',multiTenant,contextStore:multiTenant.contextStore,store:multiTenant.commerceStore,getContext:multiTenant.getContext});
  try{window.ST_MARKETPLACE_STUDIO_01070=api;}catch{}
  try{window.__ST_ALL_LOG__?.push?.('marketplace-tenant:studio-ready-01070',{stage:'01070',repositoryScopedByStore:true,domainEntitiesCarryTenantFields:false,nextBackendStage:'01071'});}catch{}
  return api;
}
