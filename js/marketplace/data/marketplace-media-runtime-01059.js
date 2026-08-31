// 01059 · Media asset composition root. Only this module chooses the current physical-media adapter.
import { assertMediaAssetRepository01059 } from '../repositories/media-asset-repository-contract-01059.js?v=01059';
import { createLocalReferenceMediaRepository01059 } from '../repositories/local-reference-media-repository-01059.js?v=01059';

let repo=null;
export function getMarketplaceMediaAssetRepository01059(){
  if(!repo)repo=createLocalReferenceMediaRepository01059();
  return repo;
}
export function setMarketplaceMediaAssetRepository01059(next){repo=assertMediaAssetRepository01059(next);return repo;}
