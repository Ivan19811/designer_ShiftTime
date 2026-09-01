// 01089 · Runtime authority used by every authenticated Marketplace API adapter.
import {getMarketplaceBackendConfig01071} from './marketplace-backend-config-01071.js?v=01089';
import {getMarketplaceRepositoryContext01070} from './marketplace-tenant-runtime-01070.js?v=01089';
import {getMarketplaceAuthState01084} from './marketplace-auth-runtime-01084.js?v=01089';
import {resolveEffectiveMarketplaceContext01089,resolveMarketplaceRequestAuth01089} from './marketplace-auth-propagation-01089.js?v=01089';
export function getEffectiveMarketplaceContext01089(){return resolveEffectiveMarketplaceContext01089({authState:getMarketplaceAuthState01084(),localContext:getMarketplaceRepositoryContext01070()});}
export function getMarketplaceApiAuth01089(){return resolveMarketplaceRequestAuth01089({authState:getMarketplaceAuthState01084(),backendConfig:getMarketplaceBackendConfig01071(),localContext:getMarketplaceRepositoryContext01070()});}
