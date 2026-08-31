// 01059 · Current development media adapter.
// It registers existing asset paths / remote URLs. It does NOT persist binary blobs and does NOT use localStorage.
// Later this adapter can be replaced by R2/S3 while Media Library UI and MarketplaceStore remain unchanged.

import { MEDIA_ASSET_REPOSITORY_CONTRACT_VERSION_01059 } from './media-asset-repository-contract-01059.js?v=01059';

function str(v){return String(v??'').trim();}
function cleanUrl(v){
  const url=str(v);
  if(!url)throw new Error('Вкажи URL або шлях до asset.');
  if(/^data:|^blob:/i.test(url))throw new Error('data:/blob: не є постійним медіа-посиланням. Використай assets/... або URL.');
  return url;
}
function guessFileName(url){
  try{return decodeURIComponent(url.split(/[?#]/)[0].split('/').pop()||'');}catch{return url.split(/[?#]/)[0].split('/').pop()||'';}
}
function guessMime(fileName,kind){
  const ext=str(fileName).toLowerCase().split('.').pop();
  const map={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',avif:'image/avif',mp4:'video/mp4',webm:'video/webm',pdf:'application/pdf'};
  return map[ext]||(kind==='image'?'image/*':kind==='video'?'video/*':'application/octet-stream');
}

export class LocalReferenceMediaRepository01059{
  constructor(){this.type='reference';this.name='LocalReferenceMediaRepository';this.contractVersion=MEDIA_ASSET_REPOSITORY_CONTRACT_VERSION_01059;}
  getInfo(){return {type:this.type,name:this.name,contractVersion:this.contractVersion,mode:'reference-only',upload:false,description:'Existing assets/URLs; no binary persistence'};}
  async prepareReference(input={}){
    const kind=['image','video','document'].includes(str(input.kind))?str(input.kind):'image';
    const url=cleanUrl(input.url),fileName=str(input.fileName)||guessFileName(url),mime=str(input.mime)||guessMime(fileName,kind);
    return {url,fileName,mime,metadata:{...(input.metadata||{}),assetAdapter:this.name,assetMode:'reference'}};
  }
  canUpload(){return false;}
  async upload(){throw new Error('Поточний MediaAssetRepository працює з URL/assets. Upload буде доступний після підключення R2/S3 adapter.');}
  async deleteAsset(){return {deleted:false,reason:'reference-only'};}
}

export function createLocalReferenceMediaRepository01059(){return new LocalReferenceMediaRepository01059();}
