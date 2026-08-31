// 01052 · LocalRepository adapter for development/testing only.
// localStorage is isolated here and is never part of MarketplaceStore or Marketplace Studio contracts.
import { MARKETPLACE_REPOSITORY_RESOURCES_01052 } from './marketplace-repository-contract-01052.js?v=01052';
import {
  MARKETPLACE_ENTITY_FACTORIES_01052,
  createEmptyMarketplaceSnapshot01052,
  createMarketplaceSeo01052,
  normalizeMarketplaceSnapshot01052,
  touchMarketplaceSnapshot01052
} from '../data/marketplace-schema-01052.js?v=01052';

export const LOCAL_MARKETPLACE_STORAGE_KEY_01052='st_marketplace_repository_v1';

function clone(v){ try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));} }
function cleanId(v){return String(v??'').trim();}

export class LocalMarketplaceRepository01052 {
  constructor({storageKey=LOCAL_MARKETPLACE_STORAGE_KEY_01052, storage=globalThis.localStorage}={}){
    this.type='local';
    this.name='LocalRepository';
    this.contractVersion=1;
    this.storageKey=storageKey;
    this.storage=storage;
    this._write=Promise.resolve();
  }
  async loadSnapshot(){
    try{
      const raw=this.storage?.getItem(this.storageKey);
      if(!raw) return createEmptyMarketplaceSnapshot01052();
      return normalizeMarketplaceSnapshot01052(JSON.parse(raw));
    }catch(err){
      console.warn('[LocalMarketplaceRepository01052] load failed',err);
      return createEmptyMarketplaceSnapshot01052();
    }
  }
  async _persist(snapshot){
    const clean=normalizeMarketplaceSnapshot01052(snapshot);
    try{
      this.storage?.setItem(this.storageKey,JSON.stringify(clean));
      return clean;
    }catch(err){
      console.error('[LocalMarketplaceRepository01052] save failed',err);
      throw err;
    }
  }
  _enqueue(mutator){
    const run=this._write.then(async()=>{
      const current=await this.loadSnapshot();
      const result=await mutator(current);
      const next=touchMarketplaceSnapshot01052(normalizeMarketplaceSnapshot01052(result?.snapshot ?? current));
      const saved=await this._persist(next);
      return {saved,value:clone(result?.value)};
    });
    this._write=run.then(()=>undefined,()=>undefined);
    return run;
  }
  async replaceSnapshot(snapshot){
    const run=this._write.then(async()=>this._persist(touchMarketplaceSnapshot01052(normalizeMarketplaceSnapshot01052(snapshot))));
    this._write=run.then(()=>undefined,()=>undefined);
    return clone(await run);
  }
  // Compatibility only. New code should use replaceSnapshot or domain CRUD.
  async saveSnapshot(snapshot){ return this.replaceSnapshot(snapshot); }
  async reset(){
    const run=this._write.then(async()=>{
      const empty=createEmptyMarketplaceSnapshot01052();
      try{this.storage?.removeItem(this.storageKey);}catch{}
      return empty;
    });
    this._write=run.then(()=>undefined,()=>undefined);
    return clone(await run);
  }
  async exportSnapshot(){ return clone(await this.loadSnapshot()); }

  async _getAll(key){ const s=await this.loadSnapshot(); return clone(s[key]||[]); }
  async _getOne(key,id){ const s=await this.loadSnapshot(); return clone((s[key]||[]).find(x=>x.id===id)||null); }
  async _create(key,input){
    const factory=MARKETPLACE_ENTITY_FACTORIES_01052[key];
    if(!factory) throw new Error(`Unknown Marketplace resource: ${key}`);
    const entity=factory(input||{});
    const {value}=await this._enqueue(snapshot=>{
      const arr=snapshot[key]||[];
      if(arr.some(x=>x.id===entity.id)) throw new Error(`${key} id already exists: ${entity.id}`);
      if(key==='products' && entity.sku && arr.some(x=>x.sku===entity.sku)) throw new Error(`SKU already exists: ${entity.sku}`);
      return {snapshot:{...snapshot,[key]:[...arr,entity]},value:entity};
    });
    return value;
  }
  async _update(key,id,patch){
    const factory=MARKETPLACE_ENTITY_FACTORIES_01052[key];
    const targetId=cleanId(id);
    const {value}=await this._enqueue(snapshot=>{
      const arr=snapshot[key]||[], index=arr.findIndex(x=>x.id===targetId);
      if(index<0) throw new Error(`${key} entity not found: ${targetId}`);
      const current=arr[index];
      const entity=factory({...current,...(patch||{}),id:current.id,createdAt:current.createdAt,updatedAt:new Date().toISOString()});
      if(key==='products' && entity.sku && arr.some(x=>x.id!==targetId&&x.sku===entity.sku)) throw new Error(`SKU already exists: ${entity.sku}`);
      const copy=arr.slice(); copy[index]=entity;
      return {snapshot:{...snapshot,[key]:copy},value:entity};
    });
    return value;
  }
  async _delete(key,id){
    const targetId=cleanId(id);
    const {value}=await this._enqueue(snapshot=>{
      const arr=snapshot[key]||[], next=arr.filter(x=>x.id!==targetId), removed=next.length!==arr.length;
      return {snapshot:removed?{...snapshot,[key]:next}:snapshot,value:removed};
    });
    return value;
  }

  async getSeo(){ return clone((await this.loadSnapshot()).seo); }
  async updateSeo(patch={}){
    const {value}=await this._enqueue(snapshot=>{
      const seo=createMarketplaceSeo01052({...snapshot.seo,...patch,
        defaults:{...(snapshot.seo?.defaults||{}),...(patch.defaults||{})},
        sitemap:{...(snapshot.seo?.sitemap||{}),...(patch.sitemap||{})},
        structuredData:{...(snapshot.seo?.structuredData||{}),...(patch.structuredData||{})},
        indexing:{...(snapshot.seo?.indexing||{}),...(patch.indexing||{})},
        openGraph:{...(snapshot.seo?.openGraph||{}),...(patch.openGraph||{})},
        diagnostics:{...(snapshot.seo?.diagnostics||{}),...(patch.diagnostics||{})}
      });
      return {snapshot:{...snapshot,seo},value:seo};
    });
    return value;
  }
}

for(const resource of MARKETPLACE_REPOSITORY_RESOURCES_01052){
  const {key,singular,getAll,getOne}=resource;
  LocalMarketplaceRepository01052.prototype[getAll]=function(){return this._getAll(key);};
  LocalMarketplaceRepository01052.prototype[getOne]=function(id){return this._getOne(key,id);};
  LocalMarketplaceRepository01052.prototype[`create${singular}`]=function(input){return this._create(key,input);};
  LocalMarketplaceRepository01052.prototype[`update${singular}`]=function(id,patch){return this._update(key,id,patch);};
  LocalMarketplaceRepository01052.prototype[`delete${singular}`]=function(id){return this._delete(key,id);};
}
