// 01059 · Physical media asset repository contract.
// Marketplace Media records stay in MarketplaceStore; this contract abstracts where files/URLs physically live.

export const MEDIA_ASSET_REPOSITORY_CONTRACT_VERSION_01059=1;
export const MEDIA_ASSET_REPOSITORY_REQUIRED_METHODS_01059=Object.freeze([
  'getInfo','prepareReference','canUpload','upload','deleteAsset'
]);

export function assertMediaAssetRepository01059(repo){
  if(!repo||typeof repo!=='object')throw new TypeError('MediaAssetRepository is required');
  for(const name of MEDIA_ASSET_REPOSITORY_REQUIRED_METHODS_01059){
    if(typeof repo[name]!=='function')throw new TypeError(`MediaAssetRepository missing method: ${name}`);
  }
  return repo;
}
