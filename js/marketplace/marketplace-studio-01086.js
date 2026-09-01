// 01086 · Real Auth session ↔ Marketplace Backend status parity fix.
import {initMarketplaceStudio01085} from './marketplace-studio-01085.js?v=01090';

let api=null;
export async function initMarketplaceStudio01086(){
  const base=await initMarketplaceStudio01085();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(studio){
    studio.dataset.mpStage='01086';
    const hero=studio.closest('#marketplaceStudioView')?.ownerDocument?.querySelector('#marketplace-panel-root .mp-inspector__hero');
    const eyebrow=hero?.querySelector('.mp-inspector__eyebrow');
    if(eyebrow)eyebrow.textContent='MARKETPLACE STUDIO · 01086';
    const metrics=studio.querySelectorAll('.mp-context__metric');
    if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01086</b>';
    const warning=studio.querySelector('.mp-context__notice.is-warn');
    if(warning)warning.innerHTML='<b>Auth/API parity 01086:</b> Backend API status тепер читає Real Auth 01084 session як authority, DEV token лишається тільки fallback, а Security scope показує server-authorized Store замість локального requested Store.';
  }
  api=Object.freeze({stage:'01086',base,realAuth:true,backendAuthStatusParity:true,next:'01087-admin-users-roles-access'});
  try{window.ST_MARKETPLACE_STUDIO_01086=api;window.__ST_ALL_LOG__?.push?.('marketplace-auth-api-parity:studio-ready-01086',{stage:'01086',next:'01087-admin-users-roles-access'});}catch{}
  return api;
}
