// 01078 · ShippingProvider boundary used by LOCAL DEV. Production adapters implement the same contract server-side.
export const SHIPPING_PROVIDER_METHODS_01078=Object.freeze(['getCapabilities','quote','createShipment','getShipmentStatus','cancelShipment']);
export function assertMarketplaceShippingProvider01078(provider){if(!provider||typeof provider!=='object')throw new Error('ShippingProvider01078 is required');for(const k of SHIPPING_PROVIDER_METHODS_01078)if(typeof provider[k]!=='function')throw new Error(`ShippingProvider01078 missing ${k}()`);return provider;}
