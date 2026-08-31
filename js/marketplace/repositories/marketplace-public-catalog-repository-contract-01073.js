// 01073 · Public, read-only repository contract for the central ShiftTime Marketplace catalog.
export const MARKETPLACE_PUBLIC_CATALOG_REPOSITORY_CONTRACT_VERSION_01073=1;
export function assertMarketplacePublicCatalogRepository01073(repo){if(!repo||typeof repo.search!=='function')throw new Error('MarketplacePublicCatalogRepository.search() is required');return repo;}
