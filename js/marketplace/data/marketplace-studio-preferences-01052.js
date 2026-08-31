// 01052 · Marketplace Studio UI preferences adapter.
// This stores navigation cosmetics only (open accordions / last page), never commerce entities.
const OPEN_KEY='st_marketplace_open_accordions_01051';
const PAGE_KEY='st_marketplace_last_page_01051';

class LocalStudioPreferences01052 {
  constructor(storage=globalThis.localStorage){this.storage=storage;}
  getOpenAccordions(){
    try{const v=JSON.parse(this.storage?.getItem(OPEN_KEY)||'[]');return Array.isArray(v)?v:['overview'];}catch{return ['overview'];}
  }
  setOpenAccordions(ids){try{this.storage?.setItem(OPEN_KEY,JSON.stringify(Array.from(ids||[])));}catch{}}
  getLastPage(){try{return this.storage?.getItem(PAGE_KEY)||'overview';}catch{return 'overview';}}
  setLastPage(id){try{this.storage?.setItem(PAGE_KEY,String(id||'overview'));}catch{}}
}

let preferences=null;
export function getMarketplaceStudioPreferences01052(){
  if(!preferences) preferences=new LocalStudioPreferences01052();
  return preferences;
}
