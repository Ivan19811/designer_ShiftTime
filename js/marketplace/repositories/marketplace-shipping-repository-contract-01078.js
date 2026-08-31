// 01078 · Seller-order shipping repository boundary.
export const MARKETPLACE_SHIPPING_REPOSITORY_METHODS_01078=Object.freeze(['listDeliveries','listProviders','updateDelivery','simulateDelivery']);
export function assertMarketplaceShippingRepository01078(repo){if(!repo||typeof repo!=='object')throw new Error('MarketplaceShippingRepository01078 is required');for(const k of MARKETPLACE_SHIPPING_REPOSITORY_METHODS_01078)if(typeof repo[k]!=='function')throw new Error(`MarketplaceShippingRepository01078 missing ${k}()`);return repo;}
