// 01085 · Account/Login/Register UI stage wrapper. Real Auth authority remains 01084.
import {initMarketplaceStudio01084} from './marketplace-studio-01084.js?v=01090';

let api=null;
export async function initMarketplaceStudio01085(){
  const base=await initMarketplaceStudio01084();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(studio){
    studio.dataset.mpStage='01085';
    const hero=studio.closest('#marketplaceStudioView')?.ownerDocument?.querySelector('#marketplace-panel-root .mp-inspector__hero');
    const eyebrow=hero?.querySelector('.mp-inspector__eyebrow');
    if(eyebrow)eyebrow.textContent='MARKETPLACE STUDIO · 01085';
    const metrics=studio.querySelector('[data-mp-system-status-block]')?.querySelectorAll('.mp-context__metric')||[];
    if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01085</b>';
    const warning=studio.querySelector('.mp-context__notice.is-warn');
    if(warning)warning.innerHTML='<b>Account UI 01085:</b> реальна Auth-сесія 01084 тепер має окремий «Мій акаунт» workspace, Login/Register, session/security view та identity control у шапці Builder. Керування користувачами, запрошеннями, ролями й permissions лишається окремим Admin-модулем 01087.';
  }
  api=Object.freeze({stage:'01085',base,realAuth:true,accountUi:true,loginRegisterUi:true,next:'01087-admin-users-roles-access'});
  try{window.ST_MARKETPLACE_STUDIO_01085=api;window.__ST_ALL_LOG__?.push?.('marketplace-account-ui:studio-ready-01085',{stage:'01085',next:'01087-admin-users-roles-access'});}catch{}
  return api;
}
