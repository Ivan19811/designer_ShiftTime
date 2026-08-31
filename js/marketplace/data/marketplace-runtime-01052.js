// 01052 · Marketplace data composition root.
// This is the only place that selects the current physical repository adapter.
// Marketplace Studio imports the Store from here and never imports LocalRepository/localStorage.
import { createMarketplaceStore01052 } from './marketplace-store-01052.js?v=01052';
import { LocalMarketplaceRepository01052 } from '../repositories/local-marketplace-repository-01052.js?v=01052';

let repository=null;
let store=null;

export function getMarketplaceRepository01052(){
  if(!repository) repository=new LocalMarketplaceRepository01052();
  return repository;
}

export function getMarketplaceStore01052(){
  if(!store) store=createMarketplaceStore01052(getMarketplaceRepository01052());
  return store;
}

export async function switchMarketplaceRepository01052(nextRepository,{migrateCurrent=false}={}){
  const currentStore=getMarketplaceStore01052();
  await currentStore.setRepository(nextRepository,{migrateCurrent});
  repository=nextRepository;
  return currentStore;
}
