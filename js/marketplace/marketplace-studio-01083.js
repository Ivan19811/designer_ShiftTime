// 01083 · Marketplace Studio DOM guard + component-width responsive layout.
import {initMarketplaceStudio01082} from './marketplace-studio-01082.js?v=01090';
let api=null;
export async function initMarketplaceStudio01083(){
  const base=await initMarketplaceStudio01082();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(studio){
    studio.dataset.mpStage='01083';
    const hero=studio.closest('#marketplaceStudioView')?.ownerDocument?.querySelector('#marketplace-panel-root .mp-inspector__hero'),eyebrow=hero?.querySelector('.mp-inspector__eyebrow');
    if(eyebrow)eyebrow.textContent='MARKETPLACE STUDIO · 01083';
    const metrics=studio.querySelector('[data-mp-system-status-block]')?.querySelectorAll('.mp-context__metric')||[];
    if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01083</b>';
    const warning=studio.querySelector('.mp-context__notice.is-warn');
    if(warning)warning.innerHTML='<b>Responsive DOM Guard 01083:</b> Overview оновлює тільки власні canonical statistics і безпечно пропускає відсутні DOM-вузли. Dashboard перебудовується за реальною шириною Marketplace, зокрема при відкритих DevTools або вузькому Builder workspace.';
  }
  api=Object.freeze({stage:'01083',base,domGuard:true,containerResponsive:true});
  try{window.ST_MARKETPLACE_STUDIO_01083=api;window.__ST_ALL_LOG__?.push?.('marketplace-responsive-dom-guard:studio-ready-01083',{stage:'01083',overviewSelectorScoped:true,nullSafeText:true,containerResponsive:true,next:'01084-real-auth-user-registration'});}catch{}
  return api;
}
