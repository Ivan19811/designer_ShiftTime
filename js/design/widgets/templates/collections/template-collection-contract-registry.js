// 00957-TEMPLATE-COLLECTION-CONTRACT-REGISTRY
// Pure metadata registry. It does not expose unfinished collections to the template gallery.

import { SCHOOL_01_COLLECTION_CONTRACT_00956 } from './school-01-collection-contract.js?v=00965';
import { SHIFTTIME_MARKETPLACE_01_COLLECTION_CONTRACT_00981 } from './shifttime-marketplace-01-collection-contract.js?v=00981';
import { SHIFTTIME_MARKETPLACE_02_COLLECTION_CONTRACT_00984 } from './shifttime-marketplace-02-collection-contract-00984.js?v=00984';

const CONTRACTS_00956 = Object.freeze([SHIFTTIME_MARKETPLACE_02_COLLECTION_CONTRACT_00984, SHIFTTIME_MARKETPLACE_01_COLLECTION_CONTRACT_00981, SCHOOL_01_COLLECTION_CONTRACT_00956]);

function assertUniqueCollectionIds00956_(contracts) {
  const ids = contracts.map((contract) => contract.collectionId);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate template collection contract id');
  return contracts;
}

assertUniqueCollectionIds00956_(CONTRACTS_00956);

export function getTemplateCollectionContracts00956() {
  return CONTRACTS_00956.slice();
}

export function getTemplateCollectionContractById00956(collectionId) {
  const id = String(collectionId || '').trim();
  return CONTRACTS_00956.find((contract) => contract.collectionId === id) || null;
}

export function getGalleryReadyTemplateCollectionContracts00956() {
  return CONTRACTS_00956.filter((contract) => (
    contract.lifecycle.visibleInGallery === true
    && contract.lifecycle.templatesReady === true
    && contract.lifecycle.assetsReady === true
  ));
}
