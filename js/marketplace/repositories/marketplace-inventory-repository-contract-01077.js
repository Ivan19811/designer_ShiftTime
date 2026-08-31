// 01077 · Inventory repository boundary.
export const MARKETPLACE_INVENTORY_REPOSITORY_METHODS_01077=Object.freeze(['listSellerInventory','listReservations','expireReservations','commitReservation','releaseReservation']);
export function assertMarketplaceInventoryRepository01077(repo){if(!repo||typeof repo!=='object')throw new Error('MarketplaceInventoryRepository01077 is required');for(const k of MARKETPLACE_INVENTORY_REPOSITORY_METHODS_01077)if(typeof repo[k]!=='function')throw new Error(`MarketplaceInventoryRepository01077 missing ${k}()`);return repo;}
