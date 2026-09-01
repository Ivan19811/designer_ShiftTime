// 01084 · Real Auth / User Registration foundation. Visual Account/Admin surfaces follow in 01085/01086.
import {initMarketplaceAuthRuntime01084,getMarketplaceAuthState01084} from './data/marketplace-auth-runtime-01084.js?v=01088';
import {initMarketplaceStudio01083} from './marketplace-studio-01083.js?v=01084';

let api=null;
export async function initMarketplaceStudio01084(){
  await initMarketplaceAuthRuntime01084();
  const base=await initMarketplaceStudio01083();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(studio){
    studio.dataset.mpStage='01084';
    const hero=studio.closest('#marketplaceStudioView')?.ownerDocument?.querySelector('#marketplace-panel-root .mp-inspector__hero'),eyebrow=hero?.querySelector('.mp-inspector__eyebrow');
    if(eyebrow)eyebrow.textContent='MARKETPLACE STUDIO · 01084';
    const metrics=studio.querySelectorAll('.mp-context__metric');
    if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01084</b>';
    const warning=studio.querySelector('.mp-context__notice.is-warn');
    if(warning)warning.innerHTML='<b>Real Auth 01084:</b> backend отримує реєстрацію, password login/logout, opaque sessions і server-authorized Account → Workspace → Store scope. DEV token лишається тільки fallback для локальної діагностики. Візуальний «Мій акаунт» буде окремим модулем 01085, «Адміністрування» — 01086.';
  }
  const auth=getMarketplaceAuthState01084();
  api=Object.freeze({stage:'01084',base,realAuth:true,userRegistration:true,sessionRuntime:true,auth});
  try{window.ST_MARKETPLACE_STUDIO_01084=api;window.__ST_ALL_LOG__?.push?.('marketplace-real-auth:studio-ready-01084',{stage:'01084',authStatus:auth.status,next:'01085-account-login-register-ui'});}catch{}
  return api;
}
