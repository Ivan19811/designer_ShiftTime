// 01087 · Admin Users/Roles/Access + Database Explorer stage wrapper.
import {initMarketplaceStudio01086} from './marketplace-studio-01086.js?v=01090';

let api=null;
export async function initMarketplaceStudio01087(){
  const base=await initMarketplaceStudio01086();
  const studio=document.querySelector('[data-mp-studio="01051"]');
  if(studio){
    studio.dataset.mpStage='01087';
    const hero=document.querySelector('#marketplace-panel-root .mp-inspector__hero');
    const eyebrow=hero?.querySelector('.mp-inspector__eyebrow');
    if(eyebrow)eyebrow.textContent='MARKETPLACE STUDIO · 01087';
    const metrics=studio.querySelectorAll('.mp-context__metric');
    if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01087</b>';
  }
  api=Object.freeze({stage:'01087',base,adminUsersRoles:true,databaseExplorer:true,dataGridFoundation:true,next:'01088-dynamic-table-data-model-foundation'});
  try{window.ST_MARKETPLACE_STUDIO_01087=api;window.__ST_ALL_LOG__?.push?.('admin-database:studio-ready-01087',{stage:'01087',next:'01088-dynamic-table-data-model-foundation'});}catch{}
  return api;
}
