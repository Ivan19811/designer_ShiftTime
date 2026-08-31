// 01076 · Payment repository boundary.
export const MARKETPLACE_PAYMENT_REPOSITORY_METHODS_01076=['ensurePaymentForOrder','listBuyerPayments','listSellerAllocations','transitionPayment','markSellerPayout'];
export function assertMarketplacePaymentRepository01076(repo){if(!repo||typeof repo!=='object')throw new Error('MarketplacePaymentRepository01076 is required');for(const k of MARKETPLACE_PAYMENT_REPOSITORY_METHODS_01076)if(typeof repo[k]!=='function')throw new Error(`MarketplacePaymentRepository01076 missing ${k}()`);return repo;}
