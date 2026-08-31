// 01052 · MarketplaceStore: single client state authority for Marketplace Studio.
// Persistence is delegated exclusively to the MarketplaceRepository contract.
import {
  createEmptyMarketplaceSnapshot01052,
  normalizeMarketplaceSnapshot01052,
  getMarketplaceSummary01052
} from './marketplace-schema-01052.js?v=01052';
import {
  assertMarketplaceRepository01052,
  MARKETPLACE_REPOSITORY_RESOURCES_01052,
  MARKETPLACE_REPOSITORY_CONTRACT_VERSION_01052
} from '../repositories/marketplace-repository-contract-01052.js?v=01052';

function clone(v){ try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));} }
const resourceByKey=new Map(MARKETPLACE_REPOSITORY_RESOURCES_01052.map(x=>[x.key,x]));
function resourceFor(key){ const r=resourceByKey.get(key); if(!r) throw new Error(`Unknown marketplace entity collection: ${key}`); return r; }

export class MarketplaceStore01052 {
  constructor({repository}={}){
    this.repository=assertMarketplaceRepository01052(repository);
    this.state=createEmptyMarketplaceSnapshot01052();
    this.ready=false;
    this.listeners=new Set();
    this._write=Promise.resolve();
  }
  async init(){
    await this._write;
    this.state=normalizeMarketplaceSnapshot01052(await this.repository.loadSnapshot());
    this.ready=true;
    this._emit('init');
    return this;
  }
  getState(){ return clone(this.state); }
  getSummary(){ return getMarketplaceSummary01052(this.state); }
  getRepositoryInfo(){
    return {
      type:this.repository.type||'custom',
      name:this.repository.name||this.repository.constructor?.name||'MarketplaceRepository',
      storageKey:this.repository.storageKey||'',
      baseUrl:this.repository.baseUrl||'',
      contractVersion:this.repository.contractVersion||MARKETPLACE_REPOSITORY_CONTRACT_VERSION_01052
    };
  }
  subscribe(fn){ if(typeof fn!=='function') return ()=>{}; this.listeners.add(fn); return ()=>this.listeners.delete(fn); }
  _emit(reason){
    const detail={reason,state:this.getState(),summary:this.getSummary(),repository:this.getRepositoryInfo()};
    this.listeners.forEach(fn=>{try{fn(detail);}catch(e){console.warn('[MarketplaceStore01052] subscriber failed',e);}});
    try{window.dispatchEvent(new CustomEvent('st:marketplace-store-changed',{detail}));}catch{}
  }
  _enqueueMutation(method,args,reason){
    const run=this._write.then(async()=>{
      const value=await this.repository[method](...args);
      this.state=normalizeMarketplaceSnapshot01052(await this.repository.loadSnapshot());
      this.ready=true;
      this._emit(reason);
      return clone(value);
    });
    this._write=run.then(()=>undefined,()=>undefined);
    return run;
  }
  async refresh(reason='refresh'){
    await this._write;
    this.state=normalizeMarketplaceSnapshot01052(await this.repository.loadSnapshot());
    this.ready=true;
    this._emit(reason);
    return this.getState();
  }

  // Generic domain access for internal tools. Product/Category editors should prefer named methods below.
  list(collection){ return clone(this.state[resourceFor(collection).key]||[]); }
  get(collection,id){ return clone((this.state[resourceFor(collection).key]||[]).find(x=>x.id===id)||null); }
  create(collection,input){ const r=resourceFor(collection); return this._enqueueMutation(`create${r.singular}`,[input||{}],`create:${collection}`); }
  update(collection,id,patch){ const r=resourceFor(collection); return this._enqueueMutation(`update${r.singular}`,[id,patch||{}],`update:${collection}`); }
  remove(collection,id){ const r=resourceFor(collection); return this._enqueueMutation(`delete${r.singular}`,[id],`delete:${collection}`); }

  async replaceSnapshot(snapshot,reason='replace-snapshot'){
    const run=this._write.then(async()=>{
      await this.repository.replaceSnapshot(normalizeMarketplaceSnapshot01052(snapshot));
      this.state=normalizeMarketplaceSnapshot01052(await this.repository.loadSnapshot());
      this.ready=true;
      this._emit(reason);
      return this.getState();
    });
    this._write=run.then(()=>undefined,()=>undefined);
    return run;
  }
  async reset(){
    const run=this._write.then(async()=>{
      await this.repository.reset();
      this.state=normalizeMarketplaceSnapshot01052(await this.repository.loadSnapshot());
      this.ready=true;
      this._emit('reset');
      return this.getState();
    });
    this._write=run.then(()=>undefined,()=>undefined);
    return run;
  }
  async exportSnapshot(){ await this._write; return clone(await this.repository.exportSnapshot()); }
  async setRepository(repository,{migrateCurrent=false}={}){
    const next=assertMarketplaceRepository01052(repository);
    await this._write;
    if(migrateCurrent) await next.replaceSnapshot(this.state);
    this.repository=next;
    this.state=normalizeMarketplaceSnapshot01052(await next.loadSnapshot());
    this.ready=true;
    this._emit('repository-changed');
    return this.getRepositoryInfo();
  }

  getProducts(){return this.list('products');} getProduct(id){return this.get('products',id);} createProduct(x){return this.create('products',x);} updateProduct(id,x){return this.update('products',id,x);} deleteProduct(id){return this.remove('products',id);}
  getCategories(){return this.list('categories');} getCategory(id){return this.get('categories',id);} createCategory(x){return this.create('categories',x);} updateCategory(id,x){return this.update('categories',id,x);} deleteCategory(id){return this.remove('categories',id);}
  getAttributes(){return this.list('attributes');} getAttribute(id){return this.get('attributes',id);} createAttribute(x){return this.create('attributes',x);} updateAttribute(id,x){return this.update('attributes',id,x);} deleteAttribute(id){return this.remove('attributes',id);}
  getAttributeValues(){return this.list('attributeValues');} getAttributeValue(id){return this.get('attributeValues',id);} createAttributeValue(x){return this.create('attributeValues',x);} updateAttributeValue(id,x){return this.update('attributeValues',id,x);} deleteAttributeValue(id){return this.remove('attributeValues',id);}
  getVariants(){return this.list('variants');} getVariant(id){return this.get('variants',id);} createVariant(x){return this.create('variants',x);} updateVariant(id,x){return this.update('variants',id,x);} deleteVariant(id){return this.remove('variants',id);}
  getMedia(){return this.list('media');} getMediaItem(id){return this.get('media',id);} createMedia(x){return this.create('media',x);} updateMedia(id,x){return this.update('media',id,x);} deleteMedia(id){return this.remove('media',id);}
  getCollections(){return this.list('collections');} getCollection(id){return this.get('collections',id);} createCollection(x){return this.create('collections',x);} updateCollection(id,x){return this.update('collections',id,x);} deleteCollection(id){return this.remove('collections',id);}
  getFilters(){return this.list('filters');} getFilter(id){return this.get('filters',id);} createFilter(x){return this.create('filters',x);} updateFilter(id,x){return this.update('filters',id,x);} deleteFilter(id){return this.remove('filters',id);}
  getRecommendations(){return this.list('recommendations');} getRecommendation(id){return this.get('recommendations',id);} createRecommendation(x){return this.create('recommendations',x);} updateRecommendation(id,x){return this.update('recommendations',id,x);} deleteRecommendation(id){return this.remove('recommendations',id);}
  getFeeds(){return this.list('feeds');} getFeed(id){return this.get('feeds',id);} createFeed(x){return this.create('feeds',x);} updateFeed(id,x){return this.update('feeds',id,x);} deleteFeed(id){return this.remove('feeds',id);}
  getSeo(){return clone(this.state.seo);} updateSeo(patch){return this._enqueueMutation('updateSeo',[patch||{}],'update:seo');}

  // Compatibility aliases for the first 01052 shell. New code should use getProducts/getCategories/etc.
  listProducts(){return this.getProducts();}
  listCategories(){return this.getCategories();}
  listAttributes(){return this.getAttributes();}
  listVariants(){return this.getVariants();}
  listMedia(){return this.getMedia();}
}

export function createMarketplaceStore01052(repository){ return new MarketplaceStore01052({repository}); }
