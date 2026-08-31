// 01066 · Computer upload + drag/drop Media Library stage.
// Installs a development physical-media adapter BEFORE 01059 initializes, then augments the existing media UI.
import { setMarketplaceMediaAssetRepository01059,getMarketplaceMediaAssetRepository01059 } from './data/marketplace-media-runtime-01059.js?v=01059';
import { createBrowserCacheMediaRepository01066 } from './repositories/browser-cache-media-repository-01066.js?v=01066';
import { initMarketplaceStudio01064 } from './marketplace-studio-01064.js?v=01083';
import { getMarketplaceStore01052 } from './data/marketplace-runtime-01052.js?v=01052';
import { createMarketplaceMediaUploadService01066 } from './services/marketplace-media-upload-service-01066.js?v=01066';
import { initMarketplaceMediaUpload01066 } from './marketplace-media-upload-01066.js?v=01066';

let controller=null;
export async function initMarketplaceStudio01066(){
  let repo=null;
  try{repo=createBrowserCacheMediaRepository01066();if(repo.canUpload()){setMarketplaceMediaAssetRepository01059(repo);repo.ready().catch(err=>console.warn('[01066] Media service worker registration failed',err));}else repo=getMarketplaceMediaAssetRepository01059();}catch(err){console.warn('[01066] Browser media upload adapter unavailable; URL/assets mode remains active.',err);repo=getMarketplaceMediaAssetRepository01059();}
  await initMarketplaceStudio01064();
  const store=getMarketplaceStore01052(),studio=document.querySelector('[data-mp-studio="01051"]');if(!studio)return null;
  studio.dataset.mpStage='01066';
  const media=window.ST_MARKETPLACE_MEDIA_01059;const mediaController=media?.controller,mediaService=media?.service,assetRepository=media?.assetRepository||repo;
  if(mediaController&&mediaService&&assetRepository){const uploadService=createMarketplaceMediaUploadService01066({store,mediaService,assetRepository});controller=initMarketplaceMediaUpload01066({store,studio,mediaController,uploadService});try{window.ST_MARKETPLACE_MEDIA_01066=Object.freeze({stage:'01066',controller,uploadService,assetRepository,canUpload:()=>uploadService.canUpload()});}catch{}}
  const metrics=studio.querySelectorAll('.mp-context__metric');if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01066</b>';if(metrics[2])metrics[2].innerHTML='<span>Media upload</span><b>COMPUTER + DROP</b>';
  const warn=studio.querySelector('.mp-context__notice.is-warn');if(warn)warn.innerHTML='<b>Наступний основний етап 01067:</b> Multi-Tenant Commerce Foundation. Поточний browser CacheStorage adapter — лише development physical-media adapter; Media Library/Product Editor залишаються незалежними від R2/S3.';
  return controller;
}
