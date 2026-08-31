// 01070 · Development adapter for platform tenancy context.
import {createDefaultPlatformSnapshot01070,normalizePlatformSnapshot01070,touchPlatformSnapshot01070} from '../data/marketplace-platform-schema-01070.js?v=01070';
export const LOCAL_PLATFORM_CONTEXT_KEY_01070='st_marketplace_platform_context_v1_01070';
function clone(v){try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}}
export class LocalPlatformContextRepository01070{
  constructor({storage=globalThis.localStorage,storageKey=LOCAL_PLATFORM_CONTEXT_KEY_01070}={}){this.type='local-platform';this.name='LocalPlatformContextRepository';this.contractVersion=1;this.storage=storage;this.storageKey=storageKey;this._write=Promise.resolve();}
  async loadSnapshot(){try{const raw=this.storage?.getItem(this.storageKey);return raw?normalizePlatformSnapshot01070(JSON.parse(raw)):createDefaultPlatformSnapshot01070();}catch(e){console.warn('[LocalPlatformContextRepository01070] load failed',e);return createDefaultPlatformSnapshot01070();}}
  async replaceSnapshot(snapshot){const run=this._write.then(async()=>{const clean=touchPlatformSnapshot01070(snapshot);this.storage?.setItem(this.storageKey,JSON.stringify(clean));return clean;});this._write=run.then(()=>undefined,()=>undefined);return clone(await run);}
  async reset(){try{this.storage?.removeItem(this.storageKey);}catch{}return createDefaultPlatformSnapshot01070();}
}
