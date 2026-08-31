// 01073 · Pure global Marketplace search/index read-model builder.
// Input is public MarketplaceListing/SellerOffer/CatalogProduct/SellerProfile data only.
function str(v){return String(v??'').trim();}
function norm(v){return str(v).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');}
function num(v,f=0){const n=Number(v);return Number.isFinite(n)?n:f;}
function arr(v){return Array.isArray(v)?v:[];}
function uniq(v){return [...new Set(v.filter(Boolean))];}
function tokens(v){return norm(v).split(/[^a-z0-9а-яіїєґ]+/i).filter(Boolean);}
function mediaOf(catalog,listing){const a=arr(catalog?.media);if(a.length)return a;return arr(listing?.publicProjection?.media);}
function categoryUnion(listings){const map=new Map();for(const l of listings)for(const c of arr(l?.publicProjection?.categories)){const slug=str(c?.slug)||norm(c?.name).replace(/\s+/g,'-');if(!slug)continue;if(!map.has(slug))map.set(slug,{id:str(c?.id),name:str(c?.name)||slug,slug});}return [...map.values()];}
function attributeText(listings,catalog){const vals=[];for(const [k,v] of Object.entries(catalog?.attributes||{})){vals.push(k);if(Array.isArray(v))vals.push(...v);else if(v&&typeof v==='object')vals.push(...Object.values(v));else vals.push(v);}for(const l of listings)for(const [k,v] of Object.entries(l?.publicProjection?.attributes||{})){vals.push(k);if(Array.isArray(v))vals.push(...v);else if(v&&typeof v==='object')vals.push(...Object.values(v));else vals.push(v);}return vals.map(str).join(' ');}
export function buildGlobalCatalogDocuments01073({listings=[],offers=[],catalogProducts=[],sellers=[]}={}){
  const publicListings=arr(listings).filter(l=>l?.publicationStatus==='published'&&l?.moderationStatus==='approved');
  const offerById=new Map(arr(offers).map(o=>[o.id,o]));
  const catalogById=new Map(arr(catalogProducts).map(c=>[c.id,c]));
  const sellerById=new Map(arr(sellers).map(s=>[s.id,s]));
  const groups=new Map();
  for(const l of publicListings){if(!l?.catalogProductId)continue;if(!groups.has(l.catalogProductId))groups.set(l.catalogProductId,[]);groups.get(l.catalogProductId).push(l);}
  const docs=[];
  for(const [catalogProductId,ls] of groups){const catalog=catalogById.get(catalogProductId)||{};const offerRows=ls.map(l=>({listing:l,offer:offerById.get(l.sellerOfferId)})).filter(x=>x.offer&&x.offer.status==='active');if(!offerRows.length)continue;const offersPublic=offerRows.map(({listing,offer})=>{const seller=sellerById.get(listing.sellerProfileId)||{};return {listingId:listing.id,offerId:offer.id,sellerProfileId:listing.sellerProfileId,sellerName:str(seller.displayName)||`Seller ${str(listing.storeId)}`,sellerSlug:str(seller.slug),storeId:str(listing.storeId),sourceProductId:str(listing.sourceProductId),sku:str(offer.sku),price:num(offer.price),oldPrice:num(offer.oldPrice),currency:str(offer.currency)||'UAH',stock:num(offer.stock),availability:str(offer.availability)||'in-stock',updatedAt:str(offer.updatedAt||listing.updatedAt),url:str(listing.publicProjection?.url||'')};}).sort((a,b)=>a.price-b.price);
    const first=ls[0],projection=first?.publicProjection||{},categories=categoryUnion(ls),prices=offersPublic.map(x=>x.price),sellerIds=uniq(offersPublic.map(x=>x.sellerProfileId));const title=str(catalog.title)||str(first.title)||str(projection.name);const brand=str(catalog.brand)||str(projection.brand);const shortDescription=str(projection.shortDescription);const searchable=[title,brand,shortDescription,categories.map(x=>x.name).join(' '),offersPublic.map(x=>x.sku).join(' '),attributeText(ls,catalog)].join(' ');
    docs.push({id:`global_${catalogProductId}`,catalogProductId,marketplaceId:str(first.marketplaceId)||'marketplace_shifttime',title,brand,shortDescription,categories,media:mediaOf(catalog,first),attributes:{...(catalog.attributes||{})},offerCount:offersPublic.length,sellerCount:sellerIds.length,minPrice:Math.min(...prices),maxPrice:Math.max(...prices),currency:offersPublic[0]?.currency||'UAH',inStock:offersPublic.some(x=>x.availability==='in-stock'&&x.stock>0),preorder:offersPublic.some(x=>x.availability==='preorder'),totalStock:offersPublic.reduce((s,x)=>s+Math.max(0,x.stock),0),bestOffer:offersPublic[0]||null,offers:offersPublic,updatedAt:offerRows.map(x=>str(x.listing.updatedAt||x.offer.updatedAt)).sort().at(-1)||'',searchableText:norm(searchable)});
  }
  return docs;
}
function scoreDoc(doc,query){const ts=tokens(query);if(!ts.length)return 1;const title=norm(doc.title),brand=norm(doc.brand),cats=norm(doc.categories.map(x=>x.name).join(' ')),sku=norm(doc.offers.map(x=>x.sku).join(' ')),all=doc.searchableText||'';let score=0;for(const t of ts){if(title===t)score+=20;else if(title.includes(t))score+=8;if(brand.includes(t))score+=4;if(cats.includes(t))score+=3;if(sku.includes(t))score+=2;if(all.includes(t))score+=1;else return 0;}return score;}
export function searchGlobalCatalog01073(documents=[],query={}){
  const q=str(query.q),category=str(query.category),availability=str(query.availability),sellerId=str(query.sellerId),minPrice=query.minPrice===''||query.minPrice==null?null:num(query.minPrice),maxPrice=query.maxPrice===''||query.maxPrice==null?null:num(query.maxPrice),sort=str(query.sort)||'relevance',page=Math.max(1,Math.floor(num(query.page,1))),pageSize=Math.min(60,Math.max(1,Math.floor(num(query.pageSize,12))));
  let base=arr(documents).map(d=>({...d,_score:scoreDoc(d,q)})).filter(d=>d._score>0);
  if(availability==='in-stock')base=base.filter(d=>d.inStock);else if(availability==='preorder')base=base.filter(d=>d.preorder);
  if(minPrice!=null)base=base.filter(d=>d.minPrice>=minPrice);if(maxPrice!=null)base=base.filter(d=>d.minPrice<=maxPrice);
  const categoryFacetRows=sellerId?base.filter(d=>d.offers.some(o=>o.sellerProfileId===sellerId)):base;
  const sellerFacetRows=category?base.filter(d=>d.categories.some(c=>c.slug===category||c.id===category)):base;
  const categoryMap=new Map(),sellerMap=new Map();for(const d of categoryFacetRows)for(const c of d.categories){const x=categoryMap.get(c.slug)||{...c,count:0};x.count++;categoryMap.set(c.slug,x);}for(const d of sellerFacetRows)for(const o of d.offers){const x=sellerMap.get(o.sellerProfileId)||{id:o.sellerProfileId,name:o.sellerName,count:0};x.count++;sellerMap.set(o.sellerProfileId,x);}
  let rows=base;if(category)rows=rows.filter(d=>d.categories.some(c=>c.slug===category||c.id===category));if(sellerId)rows=rows.filter(d=>d.offers.some(o=>o.sellerProfileId===sellerId));
  const priceRange=rows.length?{min:Math.min(...rows.map(x=>x.minPrice)),max:Math.max(...rows.map(x=>x.maxPrice))}:{min:0,max:0};
  const cmp=sort==='price-asc'?((a,b)=>a.minPrice-b.minPrice):sort==='price-desc'?((a,b)=>b.minPrice-a.minPrice):sort==='newest'?((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))):sort==='name'?((a,b)=>a.title.localeCompare(b.title,'uk')):((a,b)=>b._score-a._score||a.minPrice-b.minPrice);rows.sort(cmp);
  const total=rows.length,pages=Math.max(1,Math.ceil(total/pageSize)),safePage=Math.min(page,pages),start=(safePage-1)*pageSize;const items=rows.slice(start,start+pageSize).map(({_score,...x})=>x);
  return {stage:'01073',query:{q,category,availability,sellerId,minPrice,maxPrice,sort,page:safePage,pageSize},items,total,page:safePage,pageSize,pages,facets:{categories:[...categoryMap.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'uk')),sellers:[...sellerMap.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'uk')),priceRange},summary:{documents:arr(documents).length,matched:total,offers:rows.reduce((s,x)=>s+x.offerCount,0),sellers:new Set(rows.flatMap(x=>x.offers.map(o=>o.sellerProfileId))).size}};
}
