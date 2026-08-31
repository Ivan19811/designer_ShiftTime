// 01059 · Media Library domain service.
// Metadata CRUD goes through MarketplaceStore; physical asset handling goes through MediaAssetRepository.
import { assertMediaAssetRepository01059 } from '../repositories/media-asset-repository-contract-01059.js?v=01059';
import { getMarketplaceMediaUsage01059 } from '../data/marketplace-media-selectors-01059.js?v=01059';

function str(v){return String(v??'').trim();}
function num(v){const n=Number(v);return Number.isFinite(n)&&n>=0?n:0;}
function tags(v){return Array.isArray(v)?v.map(str).filter(Boolean):str(v).split(',').map(str).filter(Boolean);}
function normalizeUrl(v){return str(v).replace(/\\/g,'/').replace(/([^:]\/)\/{2,}/g,'$1');}

export class MarketplaceMediaService01059{
  constructor({store,assetRepository}={}){
    if(!store)throw new Error('MarketplaceMediaService01059 requires MarketplaceStore');
    this.store=store;this.assetRepository=assertMediaAssetRepository01059(assetRepository);
  }
  getAssetRepositoryInfo(){return this.assetRepository.getInfo();}
  findByUrl(url,excludeId=''){
    const key=normalizeUrl(url);if(!key)return null;
    return this.store.getMedia().find(m=>m.id!==excludeId&&normalizeUrl(m.url)===key)||null;
  }
  async createMedia(input={}){
    const ref=await this.assetRepository.prepareReference(input);
    const duplicate=this.findByUrl(ref.url);
    if(duplicate)throw new Error(`Це медіа вже є в бібліотеці: ${duplicate.fileName||duplicate.url}`);
    return this.store.createMedia({
      kind:input.kind||'image',url:ref.url,alt:str(input.alt),width:num(input.width),height:num(input.height),
      mime:ref.mime,fileName:ref.fileName,sortOrder:Number(input.sortOrder)||0,
      metadata:{...(ref.metadata||{}),...(input.metadata||{}),folder:str(input.folder),tags:tags(input.tags)}
    });
  }
  async updateMedia(id,patch={}){
    const current=this.store.getMediaItem(id);if(!current)throw new Error('Media record не знайдено.');
    let ref={url:current.url,fileName:current.fileName,mime:current.mime,metadata:{...(current.metadata||{})}};
    if(str(patch.url)&&str(patch.url)!==current.url)ref=await this.assetRepository.prepareReference({...current,...patch});
    const duplicate=this.findByUrl(ref.url,id);if(duplicate)throw new Error(`Такий URL/path уже використовується: ${duplicate.fileName||duplicate.url}`);
    return this.store.updateMedia(id,{
      kind:patch.kind??current.kind,url:ref.url,alt:patch.alt??current.alt,width:patch.width==null?current.width:num(patch.width),height:patch.height==null?current.height:num(patch.height),
      mime:str(patch.mime)||ref.mime||current.mime,fileName:str(patch.fileName)||ref.fileName||current.fileName,
      sortOrder:patch.sortOrder==null?current.sortOrder:(Number(patch.sortOrder)||0),
      metadata:{...(current.metadata||{}),...(ref.metadata||{}),...(patch.metadata||{}),folder:patch.folder==null?current.metadata?.folder:str(patch.folder),tags:patch.tags==null?current.metadata?.tags:tags(patch.tags)}
    });
  }
  async deleteMediaSafe(id){
    const media=this.store.getMediaItem(id);if(!media)return false;
    const usage=getMarketplaceMediaUsage01059(id,this.store.getState());
    if(usage.length)throw new Error(`Медіа використовується у ${usage.length} місцях. Спочатку відв'яжи його від товарів/категорій/варіацій.`);
    await this.store.deleteMedia(id);
    try{await this.assetRepository.deleteAsset(media);}catch{}
    return true;
  }
  async fillObviousMissingAlt(){
    const state=this.store.getState(),items=(state.media||[]).filter(m=>m.kind==='image'&&!str(m.alt));let updated=0;
    for(const m of items){
      const usage=getMarketplaceMediaUsage01059(m.id,this.store.getState());
      const label=str(usage.find(u=>u.type==='product')?.label)||str(usage.find(u=>u.type==='category')?.label)||str(usage[0]?.label)||str(m.fileName).replace(/\.[^.]+$/,'');
      if(label){await this.store.updateMedia(m.id,{alt:label});updated++;}
    }
    return updated;
  }
}

export function createMarketplaceMediaService01059(store,assetRepository){return new MarketplaceMediaService01059({store,assetRepository});}
