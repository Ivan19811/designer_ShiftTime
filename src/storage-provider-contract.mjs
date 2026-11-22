// 01081 · Provider-neutral binary object storage contract.
export const STORAGE_PROVIDER_CONTRACT_VERSION_01081=1;
export const STORAGE_PROVIDER_REQUIRED_METHODS_01081=Object.freeze(['getInfo','isConfigured','createUploadUrl','putObject','headObject','createReadUrl','deleteObject']);
export function assertStorageProvider01081(provider){if(!provider||typeof provider!=='object')throw new TypeError('StorageProvider is required');for(const name of STORAGE_PROVIDER_REQUIRED_METHODS_01081)if(typeof provider[name]!=='function')throw new TypeError(`StorageProvider missing method: ${name}`);return provider;}
