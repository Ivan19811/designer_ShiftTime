// 01052 · Storage-independent MarketplaceRepository contract.
// UI, editors, importers and bindings must never call a physical storage implementation directly.

export const MARKETPLACE_REPOSITORY_CONTRACT_VERSION_01052 = 1;

export const MARKETPLACE_REPOSITORY_RESOURCES_01052 = Object.freeze([
  Object.freeze({key:'products',singular:'Product',getAll:'getProducts',getOne:'getProduct'}),
  Object.freeze({key:'categories',singular:'Category',getAll:'getCategories',getOne:'getCategory'}),
  Object.freeze({key:'attributes',singular:'Attribute',getAll:'getAttributes',getOne:'getAttribute'}),
  Object.freeze({key:'attributeValues',singular:'AttributeValue',getAll:'getAttributeValues',getOne:'getAttributeValue'}),
  Object.freeze({key:'variants',singular:'Variant',getAll:'getVariants',getOne:'getVariant'}),
  Object.freeze({key:'media',singular:'Media',getAll:'getMedia',getOne:'getMediaItem'}),
  Object.freeze({key:'collections',singular:'Collection',getAll:'getCollections',getOne:'getCollection'}),
  Object.freeze({key:'filters',singular:'Filter',getAll:'getFilters',getOne:'getFilter'}),
  Object.freeze({key:'recommendations',singular:'Recommendation',getAll:'getRecommendations',getOne:'getRecommendation'}),
  Object.freeze({key:'feeds',singular:'Feed',getAll:'getFeeds',getOne:'getFeed'})
]);

const entityMethods=[];
for(const resource of MARKETPLACE_REPOSITORY_RESOURCES_01052){
  entityMethods.push(resource.getAll,resource.getOne,`create${resource.singular}`,`update${resource.singular}`,`delete${resource.singular}`);
}

export const MARKETPLACE_REPOSITORY_CONTRACT_01052 = Object.freeze({
  version:MARKETPLACE_REPOSITORY_CONTRACT_VERSION_01052,
  requiredMethods:Object.freeze([
    'loadSnapshot','replaceSnapshot','reset','exportSnapshot',
    ...entityMethods,
    'getSeo','updateSeo'
  ])
});

export function assertMarketplaceRepository01052(repo){
  if(!repo || typeof repo!=='object') throw new TypeError('MarketplaceRepository is required');
  for(const name of MARKETPLACE_REPOSITORY_CONTRACT_01052.requiredMethods){
    if(typeof repo[name]!=='function') throw new TypeError(`MarketplaceRepository missing method: ${name}`);
  }
  return repo;
}
