// 01078 · Provider-neutral shipping boundary. Commerce core depends on this contract, never on Nova Poshta/Ukrposhta SDKs.
export const SHIPPING_PROVIDER_METHODS_01078=Object.freeze(['getCapabilities','quote','createShipment','getShipmentStatus','cancelShipment']);
export function assertShippingProvider01078(provider){
  if(!provider||typeof provider!=='object')throw new Error('ShippingProvider01078 is required');
  for(const method of SHIPPING_PROVIDER_METHODS_01078)if(typeof provider[method]!=='function')throw new Error(`ShippingProvider01078 missing ${method}()`);
  return provider;
}
