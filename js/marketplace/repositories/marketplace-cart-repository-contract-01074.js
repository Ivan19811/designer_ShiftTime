// 01074 · Repository contract for buyer cart. Implementations resolve live public offers themselves.
export const MARKETPLACE_CART_REPOSITORY_CONTRACT_VERSION_01074=1;
export const MARKETPLACE_CART_REQUIRED_METHODS_01074=Object.freeze(['loadCart','addOffer','setQuantity','removeItem','clearCart','refreshCart']);
export function assertMarketplaceCartRepository01074(repo){if(!repo||typeof repo!=='object')throw new Error('MarketplaceCartRepository is required');for(const m of MARKETPLACE_CART_REQUIRED_METHODS_01074)if(typeof repo[m]!=='function')throw new Error(`MarketplaceCartRepository missing ${m}()`);return repo;}
