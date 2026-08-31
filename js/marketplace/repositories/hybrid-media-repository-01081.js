// 01081 · Composition adapter: API mode requires configured cloud storage; LOCAL mode keeps 01066 browser-cache DEV fallback.
import {MEDIA_ASSET_REPOSITORY_CONTRACT_VERSION_01059} from './media-asset-repository-contract-01059.js?v=01059';
import {createBrowserCacheMediaRepository01066} from './browser-cache-media-repository-01066.js?v=01066';
import {createApiCloudMediaRepository01081} from './api-cloud-media-repository-01081.js?v=01082';
import {getMarketplaceBackendConfig01071} from '../data/marketplace-backend-config-01071.js?v=01071';
function str(v){return String(v??'').trim();}
export class HybridMediaRepository01081{
  constructor(){this.type='hybrid-cloud-media';this.name='HybridMediaRepository01081';this.contractVersion=MEDIA_ASSET_REPOSITORY_CONTRACT_VERSION_01059;this.cloud=createApiCloudMediaRepository01081();this.local=createBrowserCacheMediaRepository01066();this.lastStatus=null;}
  async ready(){if(getMarketplaceBackendConfig01071().mode==='api'){try{this.lastStatus=await this.cloud.ready();}catch(e){this.lastStatus={configured:false,error:e.message||String(e)};}}else{try{await this.local.ready();}catch{}this.lastStatus={configured:false,localMode:true};}return this.getInfo();}
  useCloud(){return getMarketplaceBackendConfig01071().mode==='api'&&!!this.cloud.getInfo().configured;}
  getInfo(){const cfg=getMarketplaceBackendConfig01071();return this.useCloud()?{...this.cloud.getInfo(),fallback:'browser-cache-local-only'}:{...this.local.getInfo(),type:this.type,name:this.name,mode:cfg.mode==='api'?'api-cloud-not-configured':'browser-cache-development',upload:cfg.mode==='api'?false:this.local.canUpload(),configured:false,cloudStatus:this.lastStatus||null,description:cfg.mode==='api'?'API mode: configure R2/S3 on backend before computer upload.':'LOCAL DEV: browser CacheStorage fallback. Production uses R2/S3.'};}
  canUpload(){return this.useCloud()?this.cloud.canUpload():(getMarketplaceBackendConfig01071().mode==='api'?false:this.local.canUpload());}
  async prepareReference(input={}){return this.useCloud()?this.cloud.prepareReference(input):this.local.prepareReference(input);}
  async upload(file,input={}){if(getMarketplaceBackendConfig01071().mode==='api'){if(!this.useCloud())await this.ready();if(!this.useCloud())throw new Error('API mode активний, але R2/S3 не налаштований на backend. Browser-cache fallback у production навмисно заблокований.');return this.cloud.upload(file,input);}return this.local.upload(file,input);}
  async deleteAsset(media={}){const mode=str(media?.metadata?.assetMode);if(mode==='cloud-object-01081')return this.cloud.deleteAsset(media);if(mode==='browser-cache')return this.local.deleteAsset(media);return {deleted:false,reason:'external-reference'};}
  async listCloudAssets(){if(!this.cloud.getInfo().configured)await this.cloud.ready();return this.cloud.listAssets();}
}
export function createHybridMediaRepository01081(){return new HybridMediaRepository01081();}
