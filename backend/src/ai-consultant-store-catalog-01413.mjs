const MARKETPLACE_ID='marketplace_shifttime';
const str=value=>String(value??'').trim();
const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
function fail(code,statusCode=400){const error=new Error(code);error.code=code;error.statusCode=statusCode;return error;}
function documentFromRow(row={}){
  const projection=row.publicProjection&&typeof row.publicProjection==='object'?row.publicProjection:{};
  const catalogAttributes=row.catalogAttributes&&typeof row.catalogAttributes==='object'?row.catalogAttributes:{};
  const attributes={...catalogAttributes,...(projection.attributes&&typeof projection.attributes==='object'?projection.attributes:{})};
  const categories=Array.isArray(projection.categories)?projection.categories:[];
  const media=Array.isArray(row.catalogMedia)&&row.catalogMedia.length?row.catalogMedia:(Array.isArray(projection.media)?projection.media:[]);
  const physicalStock=Math.max(0,num(row.physicalStock,0)),reserved=Math.max(0,num(row.reservedStock,0)),stock=Math.max(0,physicalStock-reserved);
  const availability=row.availability==='preorder'?'preorder':(stock>0?'in-stock':'out-of-stock');
  const title=str(row.catalogTitle||row.listingTitle||projection.name),brand=str(row.catalogBrand||projection.brand),shortDescription=str(projection.shortDescription||projection.description);
  return {id:str(row.listingId),listingId:str(row.listingId),sellerOfferId:str(row.sellerOfferId),catalogProductId:str(row.catalogProductId),sourceProductId:str(row.sourceProductId),slug:str(row.slug),title,brand,shortDescription,categories,attributes,media,sku:str(row.sku),price:num(row.price,0),oldPrice:num(row.oldPrice,0),currency:str(row.currency)||'UAH',stock,availability,updatedAt:row.updatedAt||null};
}
export async function assertAiConsultantSiteConfig01413(client,scope,siteId,{productSearch=true,conversation=false}={}){
  const id=str(siteId);if(!id)throw fail('AI_CONSULTANT_SITE_REQUIRED_01413');
  const q=await client.query(`SELECT s.id,s.name,c.id "consultantId",c.name "consultantName",c.enabled,c.product_search_enabled "productSearchEnabled",c.conversation_enabled "conversationEnabled",c.discounts_enabled "discountsEnabled",c.settings FROM shifttime_builder_sites s LEFT JOIN shifttime_ai_consultants c ON c.site_id=s.id AND c.account_id=s.account_id AND c.workspace_id=s.workspace_id AND c.store_id=s.store_id WHERE s.id=$1 AND s.account_id=$2 AND s.workspace_id=$3 AND s.store_id=$4 AND s.status<>'archived' LIMIT 1`,[id,scope.accountId,scope.workspaceId,scope.storeId]);
  if(!q.rowCount)throw fail('AI_CONSULTANT_SITE_NOT_FOUND_01413',404);const row=q.rows[0];if(!row.consultantId)throw fail('AI_CONSULTANT_NOT_CONFIGURED_01413',409);if(productSearch&&!row.productSearchEnabled)throw fail('AI_CONSULTANT_PRODUCT_SEARCH_DISABLED_01413',409);if(conversation&&!row.conversationEnabled)throw fail('AI_CONSULTANT_CONVERSATION_DISABLED_01413',409);return row;
}
export async function loadAiConsultantStoreProducts01413(client,scope){
  const q=await client.query(`SELECT l.id "listingId",o.id "sellerOfferId",l.catalog_product_id "catalogProductId",l.source_product_id "sourceProductId",l.title "listingTitle",l.slug,l.public_projection "publicProjection",l.updated_at "updatedAt",o.sku,o.price::float8 price,o.old_price::float8 "oldPrice",o.currency,o.stock::float8 "physicalStock",o.availability,COALESCE((SELECT SUM(i.quantity) FROM marketplace_inventory_reservation_items i JOIN marketplace_inventory_reservations r ON r.id=i.reservation_id WHERE i.seller_offer_id=o.id AND i.status='active' AND r.status='active' AND r.expires_at>now()),0)::float8 "reservedStock",c.title "catalogTitle",c.brand "catalogBrand",c.attributes "catalogAttributes",c.media "catalogMedia" FROM marketplace_listings l JOIN marketplace_seller_offers o ON o.id=l.seller_offer_id AND o.status='active' JOIN marketplace_catalog_products c ON c.id=l.catalog_product_id AND c.status='active' WHERE l.marketplace_id=$1 AND l.store_id=$2 AND l.publication_status='published' AND l.moderation_status='approved' ORDER BY l.updated_at DESC LIMIT 5000`,[MARKETPLACE_ID,scope.storeId]);
  return q.rows.map(documentFromRow);
}
