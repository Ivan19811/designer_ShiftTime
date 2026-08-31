// 01075 · Marketplace order repository contract.
export const MARKETPLACE_ORDER_REPOSITORY_METHODS_01075=['createOrder','listBuyerOrders','listSellerOrders','updateSellerOrderStatus'];
export function assertMarketplaceOrderRepository01075(repo){if(!repo||typeof repo!=='object')throw new Error('MarketplaceOrderRepository01075 is required');for(const k of MARKETPLACE_ORDER_REPOSITORY_METHODS_01075)if(typeof repo[k]!=='function')throw new Error(`MarketplaceOrderRepository01075 missing ${k}()`);return repo;}
