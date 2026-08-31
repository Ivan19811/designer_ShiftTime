// 01072 · Repository contract for the platform Marketplace Network publication layer.
export const MARKETPLACE_NETWORK_REPOSITORY_CONTRACT_VERSION_01072=1;
export const MARKETPLACE_NETWORK_REQUIRED_METHODS_01072=Object.freeze(['loadView','ensureSeller','updateSeller','updatePolicy','publishProduct','syncProduct','unpublishListing']);
export function assertMarketplaceNetworkRepository01072(repo){if(!repo||typeof repo!=='object')throw new Error('MarketplaceNetworkRepository is required');for(const m of MARKETPLACE_NETWORK_REQUIRED_METHODS_01072)if(typeof repo[m]!=='function')throw new Error(`MarketplaceNetworkRepository missing ${m}()`);return repo;}
