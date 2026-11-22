import crypto from 'node:crypto';
import {pool} from '../src/db.mjs';
import {config} from '../src/config.mjs';
import {hashToken} from '../src/auth.mjs';

const MARKETPLACE_ID='marketplace_shifttime';
const FIXTURE_ID='demo-fixture-01077-inventory-v1';
const SHIPPING_FIXTURE_ID='demo-fixture-01079-totals-v1';
const userId='user_dev_owner';
const accountId='acct_default';
const workspaceId='ws_default';
const storeId='store_default';
const partnerStoreId='store_demo01077_partner';
const membershipId='member_default_owner';
const sessionId=id('sess',config.devUserEmail);
const nowIso=()=>new Date().toISOString();

function id(prefix,seed){return `${prefix}_${crypto.createHash('sha1').update(seed).digest('hex').slice(0,16)}`;}
function clone(v){return JSON.parse(JSON.stringify(v));}
function slug(v){return String(v??'').trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9а-яіїєґ]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,96)||'item';}
function emptySnapshot(){const t=nowIso();return {schemaId:'shifttime-marketplace-schema-v1',schemaVersion:1,revision:0,createdAt:t,updatedAt:t,products:[],categories:[],attributes:[],attributeValues:[],variants:[],media:[],collections:[],filters:[],recommendations:[],feeds:[],seo:{defaults:{locale:'uk-UA',currency:'UAH',canonicalMode:'auto',filterIndexMode:'safe',titleTemplate:'',descriptionTemplate:''},sitemap:{enabled:true},structuredData:{product:true,productGroup:true,offer:true,breadcrumb:true},indexing:{categories:true,products:true,filters:'safe'},openGraph:{enabled:true,defaultImageMediaId:''},diagnostics:{altRequired:true,missingMetaWarning:true}},settings:{locale:'uk-UA',currency:'UAH',skuPolicy:'unique-required',draftExportPolicy:'exclude'}};}

const categories=[
  {id:'demo01073_cat_pans',name:'Сковорідки',slug:'skovoridky',shortDescription:'Сковорідки для вогнища та відпочинку',icon:'◉'},
  {id:'demo01073_cat_cauldrons',name:'Казани',slug:'kazany',shortDescription:'Чавунні казани для живого вогню',icon:'◒'}
];
const products=[
  {id:'demo01073_prod_pan40',sku:'DEMO-PAN-40',name:'Сковорідка з диска 40 см',slug:'skovoridka-z-dyska-40-sm',categoryId:'demo01073_cat_pans',price:1890,oldPrice:2090,stock:3,mediaId:'demo01073_media_pan40',shortDescription:'Компактна сталева сковорідка для вогнища та пікніка.',attributes:{diameter:'40 см',material:'Сталь',gtin:'4820107300401'}},
  {id:'demo01073_prod_pan50',sku:'DEMO-PAN-50',name:'Сковорідка з диска 50 см',slug:'skovoridka-z-dyska-50-sm',categoryId:'demo01073_cat_pans',price:2490,oldPrice:2790,stock:4,mediaId:'demo01073_media_pan50',shortDescription:'Універсальна сковорідка 50 см для компанії та живого вогню.',attributes:{diameter:'50 см',material:'Сталь',gtin:'4820107300500'}},
  {id:'demo01073_prod_pan60',sku:'DEMO-PAN-60',name:'Сковорідка з диска 60 см',slug:'skovoridka-z-dyska-60-sm',categoryId:'demo01073_cat_pans',price:3190,oldPrice:3490,stock:1,mediaId:'demo01073_media_pan60',shortDescription:'Велика сковорідка для відпочинку великою компанією.',attributes:{diameter:'60 см',material:'Сталь',gtin:'4820107300609'}},
  {id:'demo01073_prod_cauldron8',sku:'DEMO-KAZAN-8',name:'Казан чавунний 8 л',slug:'kazan-chavunnyj-8-l',categoryId:'demo01073_cat_cauldrons',price:2290,oldPrice:0,stock:5,mediaId:'demo01073_media_cauldron8',shortDescription:'Чавунний казан 8 л із кришкою для плову, бограчу та печені.',attributes:{volume:'8 л',material:'Чавун',gtin:'4820107301088'}},
  {id:'demo01073_prod_cauldron12',sku:'DEMO-KAZAN-12',name:'Казан чавунний 12 л',slug:'kazan-chavunnyj-12-l',categoryId:'demo01073_cat_cauldrons',price:2990,oldPrice:3290,stock:2,mediaId:'demo01073_media_cauldron12',shortDescription:'Місткий чавунний казан 12 л для великої компанії.',attributes:{volume:'12 л',material:'Чавун',gtin:'4820107301125'}}
];
const media=products.map(p=>({id:p.mediaId,kind:'image',url:`assets/demo/01073/${p.id.includes('cauldron')?p.id.includes('12')?'cauldron-12':'cauldron-8':p.id.includes('40')?'pan-40':p.id.includes('50')?'pan-50':'pan-60'}.svg`,alt:p.name,width:1200,height:900,mime:'image/svg+xml',fileName:`${p.mediaId}.svg`,metadata:{demoFixture:FIXTURE_ID}}));
const partnerProducts=[
  {...products.find(x=>x.id==='demo01073_prod_pan50'),id:'partner_demo01073_prod_pan50',sku:'PARTNER-PAN-50',price:2390,oldPrice:2690,stock:1},
  {...products.find(x=>x.id==='demo01073_prod_cauldron12'),id:'partner_demo01073_prod_cauldron12',sku:'PARTNER-KAZAN-12',price:3090,oldPrice:3390,stock:2}
];

function product01052(p,t=nowIso()){
  return {id:p.id,sku:p.sku,status:'active',name:p.name,slug:p.slug,shortDescription:p.shortDescription,description:'',categoryIds:[p.categoryId],collectionIds:[],brand:'ShiftTime',price:p.price,oldPrice:p.oldPrice,currency:'UAH',stock:p.stock,availability:p.stock>0?'in-stock':'out-of-stock',mediaIds:[p.mediaId],primaryMediaId:p.mediaId,attributes:clone(p.attributes),variantIds:[],seo:{title:p.name,description:p.shortDescription},feed:{},createdAt:t,updatedAt:t};
}
function category01052(c,demoProducts,t=nowIso()){
  return {id:c.id,parentId:null,status:'active',name:c.name,slug:c.slug,shortDescription:c.shortDescription,description:'',imageMediaId:'',imageSecondaryMediaId:'',icon:c.icon,productIds:demoProducts.filter(p=>p.categoryId===c.id).map(p=>p.id),attributes:{demoFixture:FIXTURE_ID},featureKey:'',url:'',seo:{},createdAt:t,updatedAt:t};
}
function media01052(m,t=nowIso()){
  return {...clone(m),sortOrder:0,createdAt:t,updatedAt:t};
}
function mergeDemoSnapshot(raw,demoProducts){
  const s=raw&&typeof raw==='object'&&!Array.isArray(raw)?clone(raw):emptySnapshot();
  for(const key of ['products','categories','attributes','attributeValues','variants','media','collections','filters','recommendations','feeds'])if(!Array.isArray(s[key]))s[key]=[];
  const t=nowIso();
  for(const c of categories){const next=category01052(c,demoProducts,t),at=s.categories.findIndex(x=>x?.id===c.id);if(at<0)s.categories.push(next);else s.categories[at]={...s.categories[at],...next,createdAt:s.categories[at].createdAt||next.createdAt};}
  for(const m of media){const next=media01052(m,t),at=s.media.findIndex(x=>x?.id===m.id);if(at<0)s.media.push(next);else s.media[at]={...s.media[at],...next,createdAt:s.media[at].createdAt||next.createdAt};}
  for(const p of demoProducts){const next=product01052(p,t),at=s.products.findIndex(x=>x?.id===p.id);if(at<0)s.products.push(next);else s.products[at]={...s.products[at],...next,createdAt:s.products[at].createdAt||next.createdAt};}
  s.schemaId=s.schemaId||'shifttime-marketplace-schema-v1';s.schemaVersion=1;s.revision=(Number(s.revision)||0)+1;s.updatedAt=t;s.createdAt=s.createdAt||t;
  s.settings={...(s.settings||{}),locale:s.settings?.locale||'uk-UA',currency:s.settings?.currency||'UAH',demoFixture01077:{id:FIXTURE_ID,seededAt:t,productIds:demoProducts.map(x=>x.id),categoryIds:categories.map(x=>x.id),lowStock:true}};
  return s;
}
function projection(p){const c=categories.find(x=>x.id===p.categoryId);const m=media.find(x=>x.id===p.mediaId);return {sourceProductId:p.id,sku:p.sku,name:p.name,slug:p.slug,shortDescription:p.shortDescription,brand:'ShiftTime',price:p.price,oldPrice:p.oldPrice,currency:'UAH',stock:p.stock,availability:p.stock>0?'in-stock':'out-of-stock',attributes:clone(p.attributes),categories:c?[{id:c.id,name:c.name,slug:c.slug}]:[],media:m?[{id:m.id,kind:m.kind,url:m.url,alt:m.alt,width:m.width,height:m.height,mime:m.mime}]:[],primaryMediaId:p.mediaId,variants:[],seo:{title:p.name,description:p.shortDescription},sourceUpdatedAt:nowIso()};}

async function ensureSnapshot(client,targetStoreId,demoProducts){
  const q=await client.query('SELECT snapshot,revision FROM commerce_store_snapshots WHERE store_id=$1 FOR UPDATE',[targetStoreId]);
  const snapshot=mergeDemoSnapshot(q.rows[0]?.snapshot,demoProducts);
  snapshot.revision=q.rowCount?(Number(q.rows[0].revision)||0)+1:Math.max(1,Number(snapshot.revision)||1);
  await client.query(`INSERT INTO commerce_store_snapshots(store_id,schema_version,revision,snapshot) VALUES($1,1,$2,$3::jsonb)
    ON CONFLICT(store_id) DO UPDATE SET schema_version=1,revision=EXCLUDED.revision,snapshot=EXCLUDED.snapshot,updated_at=now()`,[targetStoreId,snapshot.revision,JSON.stringify(snapshot)]);
}
async function ensureSeller(client,{targetStoreId,displayName,sellerSlug}){
  const existing=await client.query('SELECT id FROM marketplace_seller_profiles WHERE marketplace_id=$1 AND store_id=$2',[MARKETPLACE_ID,targetStoreId]);
  const sellerId=existing.rows[0]?.id||id('seller',`${FIXTURE_ID}:${targetStoreId}`);
  if(!existing.rowCount)await client.query(`INSERT INTO marketplace_seller_profiles(id,marketplace_id,account_id,workspace_id,store_id,display_name,slug,status,description) VALUES($1,$2,$3,$4,$5,$6,$7,'active',$8)`,[sellerId,MARKETPLACE_ID,accountId,workspaceId,targetStoreId,displayName,sellerSlug,'DEV inventory fixture seller']);
  await client.query(`INSERT INTO marketplace_seller_memberships(id,marketplace_id,seller_profile_id,store_id,status,terms_version,terms_accepted_at) VALUES($1,$2,$3,$4,'active','01077-dev',now()) ON CONFLICT(marketplace_id,store_id) DO UPDATE SET seller_profile_id=EXCLUDED.seller_profile_id,status='active',updated_at=now()`,[id('mpmember',`${FIXTURE_ID}:${targetStoreId}`),MARKETPLACE_ID,sellerId,targetStoreId]);
  await client.query(`INSERT INTO marketplace_publication_policies(id,marketplace_id,seller_profile_id,store_id,name,status) VALUES($1,$2,$3,$4,'Основна політика','active') ON CONFLICT(marketplace_id,store_id) DO UPDATE SET seller_profile_id=EXCLUDED.seller_profile_id,status='active',updated_at=now()`,[id('pubpol',`${FIXTURE_ID}:${targetStoreId}`),MARKETPLACE_ID,sellerId,targetStoreId]);
  return sellerId;
}
async function ensureCatalogProduct(client,p){
  const canonicalKey=`gtin:${p.attributes.gtin}`;
  let q=await client.query('SELECT id FROM marketplace_catalog_products WHERE marketplace_id=$1 AND canonical_key=$2',[MARKETPLACE_ID,canonicalKey]);
  if(q.rowCount)return q.rows[0].id;
  const catalogId=id('catalog',canonicalKey),m=media.find(x=>x.id===p.mediaId),categoryId=p.categoryId==='demo01073_cat_pans'?'mpcat_demo01077_pans':'mpcat_demo01077_cauldrons';
  await client.query(`INSERT INTO marketplace_catalog_products(id,marketplace_id,canonical_key,status,title,brand,marketplace_category_id,attributes,media,source_fingerprint) VALUES($1,$2,$3,'active',$4,'ShiftTime',$5,$6::jsonb,$7::jsonb,$8) ON CONFLICT(marketplace_id,canonical_key) DO NOTHING`,[catalogId,MARKETPLACE_ID,canonicalKey,p.name,categoryId,JSON.stringify(p.attributes),JSON.stringify(m?[m]:[]),id('fingerprint',JSON.stringify(projection(p)))]);
  q=await client.query('SELECT id FROM marketplace_catalog_products WHERE marketplace_id=$1 AND canonical_key=$2',[MARKETPLACE_ID,canonicalKey]);
  return q.rows[0].id;
}
async function ensureOfferListing(client,{sellerId,targetStoreId,p}){
  const catalogId=await ensureCatalogProduct(client,p),proj=projection(p),offerSeed=`${FIXTURE_ID}:${targetStoreId}:${p.id}`;
  let q=await client.query('SELECT id FROM marketplace_seller_offers WHERE marketplace_id=$1 AND store_id=$2 AND source_product_id=$3',[MARKETPLACE_ID,targetStoreId,p.id]);
  const offerId=q.rows[0]?.id||id('offer',offerSeed);
  if(!q.rowCount)await client.query(`INSERT INTO marketplace_seller_offers(id,marketplace_id,seller_profile_id,store_id,source_product_id,catalog_product_id,status,sku,price,old_price,currency,stock,availability,source_updated_at,projection) VALUES($1,$2,$3,$4,$5,$6,'active',$7,$8,$9,'UAH',$10,$11,now(),$12::jsonb)`,[offerId,MARKETPLACE_ID,sellerId,targetStoreId,p.id,catalogId,p.sku,p.price,p.oldPrice,p.stock,p.stock>0?'in-stock':'out-of-stock',JSON.stringify(proj)]);
  else await client.query(`UPDATE marketplace_seller_offers SET seller_profile_id=$2,catalog_product_id=$3,status='active',sku=$4,price=$5,old_price=$6,currency='UAH',stock=$7,availability=$8,projection=$9::jsonb,source_updated_at=now(),updated_at=now() WHERE id=$1`,[offerId,sellerId,catalogId,p.sku,p.price,p.oldPrice,p.stock,p.stock>0?'in-stock':'out-of-stock',JSON.stringify(proj)]);
  q=await client.query('SELECT id FROM marketplace_listings WHERE marketplace_id=$1 AND store_id=$2 AND source_product_id=$3',[MARKETPLACE_ID,targetStoreId,p.id]);
  const listingId=q.rows[0]?.id||id('listing',offerSeed),mpCategory=p.categoryId==='demo01073_cat_pans'?'mpcat_demo01077_pans':'mpcat_demo01077_cauldrons';
  if(!q.rowCount)await client.query(`INSERT INTO marketplace_listings(id,marketplace_id,seller_profile_id,store_id,source_product_id,catalog_product_id,seller_offer_id,marketplace_category_id,publication_status,moderation_status,title,slug,public_projection,published_at,last_synced_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'published','approved',$9,$10,$11::jsonb,now(),now())`,[listingId,MARKETPLACE_ID,sellerId,targetStoreId,p.id,catalogId,offerId,mpCategory,p.name,p.slug,JSON.stringify(proj)]);
  else await client.query(`UPDATE marketplace_listings SET seller_profile_id=$2,catalog_product_id=$3,seller_offer_id=$4,marketplace_category_id=$5,publication_status='published',moderation_status='approved',title=$6,slug=$7,public_projection=$8::jsonb,published_at=COALESCE(published_at,now()),last_synced_at=now(),updated_at=now() WHERE id=$1`,[listingId,sellerId,catalogId,offerId,mpCategory,p.name,p.slug,JSON.stringify(proj)]);
}

async function ensureShippingDemoOrder01079(client,{mainSellerId,partnerSellerId}){
  const orderId='mporder_demo01079_totals',buyer={name:'Іван Shipping DEMO',phone:'+380671234567',email:'shipping-demo@example.test'},payment={method:'card',status:'pending'},intent={method:'nova-poshta',city:'Львів',address:'Buyer delivery intent',comment:'DEMO 01079'},createdAt=new Date();
  await client.query(`INSERT INTO marketplace_orders(id,marketplace_id,order_number,status,currency,subtotal,shipping_total,discount_total,total,buyer,delivery,payment,created_at,updated_at) VALUES($1,$2,'MP-DEMO-01079','processing','UAH',5580,155,0,5735,$3,$4,$5,$6,$6) ON CONFLICT(id) DO NOTHING`,[orderId,MARKETPLACE_ID,buyer,intent,payment,createdAt]);
  const defs=[
    {id:'sellerorder_demo01079_1',no:'SO-DEMO-01079-1',sellerId:mainSellerId,storeId,shop:'Основний магазин',subtotal:2490,title:'Сковорідка з диска 50 см',sku:'DEMO-PAN-50',sourceProductId:'demo01073_prod_pan50',method:'nova-poshta',carrier:'Nova Poshta',shipping:85,warehouse:'Відділення Нової пошти №1'},
    {id:'sellerorder_demo01079_2',no:'SO-DEMO-01079-2',sellerId:partnerSellerId,storeId:partnerStoreId,shop:'Outdoor Partner',subtotal:3090,title:'Казан чавунний 12 л',sku:'PARTNER-KAZAN-12',sourceProductId:'partner_demo01073_prod_cauldron12',method:'ukrposhta',carrier:'Ukrposhta',shipping:70,warehouse:'Відділення Укрпошти №12'}
  ];
  for(const [i,d] of defs.entries()){
    const deliveryId=`delivery_demo01079_${i+1}`,delivery={id:deliveryId,marketplaceOrderId:orderId,marketplaceOrderNumber:'MP-DEMO-01079',sellerOrderId:d.id,sellerOrderNumber:d.no,sellerProfileId:d.sellerId,storeId:d.storeId,sellerName:d.shop,provider:'manual-dev',providerReference:'',shippingMethod:d.method,method:d.method,carrier:d.carrier,deliveryStatus:'pending',shippingPrice:d.shipping,currency:'UAH',recipient:buyer,city:'Львів',warehouse:d.warehouse,address:'',trackingNumber:'',estimatedDelivery:'',comment:'DEMO checkout totals 01079',metadata:{demoFixture:SHIPPING_FIXTURE_ID},shippedAt:'',deliveredAt:'',createdAt:createdAt.toISOString(),updatedAt:createdAt.toISOString()};
    await client.query(`INSERT INTO marketplace_seller_orders(id,marketplace_order_id,marketplace_id,seller_profile_id,store_id,order_number,seller_name,status,currency,subtotal,shipping_total,discount_total,total,buyer,delivery,payment,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,'processing','UAH',$8,$9,0,$10,$11,$12,$13,$14,$14) ON CONFLICT(id) DO NOTHING`,[d.id,orderId,MARKETPLACE_ID,d.sellerId,d.storeId,d.no,d.shop,d.subtotal,d.shipping,d.subtotal+d.shipping,buyer,delivery,payment,createdAt]);
    await client.query(`INSERT INTO marketplace_order_items(id,marketplace_order_id,seller_order_id,source_product_id,title,brand,sku,quantity,unit_price,old_price,line_total,currency,snapshot,created_at) VALUES($1,$2,$3,$4,$5,'ShiftTime',$6,1,$7,0,$7,'UAH',$8,$9) ON CONFLICT(id) DO NOTHING`,[`orderitem_demo01079_${i+1}`,orderId,d.id,d.sourceProductId,d.title,d.sku,d.subtotal,{media:[],snapshotAt:createdAt.toISOString(),demoFixture:SHIPPING_FIXTURE_ID},createdAt]);
    await client.query(`INSERT INTO marketplace_seller_order_deliveries(id,marketplace_id,marketplace_order_id,seller_order_id,seller_profile_id,store_id,provider,shipping_method,carrier,delivery_status,shipping_price,currency,recipient,city,warehouse,address,tracking_number,comment,metadata,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,'manual-dev',$7,$8,'pending',$9,'UAH',$10,'Львів',$11,'','',$12,$13,$14,$14) ON CONFLICT(seller_order_id) DO NOTHING`,[deliveryId,MARKETPLACE_ID,orderId,d.id,d.sellerId,d.storeId,d.method,d.carrier,d.shipping,buyer,d.warehouse,'DEMO checkout totals 01079',{demoFixture:SHIPPING_FIXTURE_ID,pricingStage:'01079'},createdAt]);
  }
  return {orderId,sellerOrders:defs.length};
}

const client=await pool.connect();
try{
  await client.query('BEGIN');
  await client.query(`INSERT INTO platform_users(id,email,name,status) VALUES($1,$2,$3,'active') ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email,name=EXCLUDED.name,status='active',updated_at=now()`,[userId,config.devUserEmail,config.devUserName]);
  await client.query(`INSERT INTO platform_accounts(id,name,slug,status,owner_user_id) VALUES($1,'Моя організація','my-organization','active',$2) ON CONFLICT(id) DO UPDATE SET owner_user_id=EXCLUDED.owner_user_id,status='active',updated_at=now()`,[accountId,userId]);
  await client.query(`INSERT INTO platform_workspaces(id,account_id,name,slug,status) VALUES($1,$2,'Основний Workspace','main','active') ON CONFLICT(id) DO UPDATE SET status='active',updated_at=now()`,[workspaceId,accountId]);
  await client.query(`INSERT INTO platform_stores(id,workspace_id,name,slug,status,locale,currency) VALUES($1,$2,'Основний магазин','main-store','active','uk-UA','UAH') ON CONFLICT(id) DO UPDATE SET status='active',updated_at=now()`,[storeId,workspaceId]);
  await client.query(`INSERT INTO platform_stores(id,workspace_id,name,slug,status,locale,currency,settings) VALUES($1,$2,'Outdoor Partner','inventory-demo-partner','active','uk-UA','UAH',$3::jsonb) ON CONFLICT(id) DO UPDATE SET status='active',updated_at=now()`,[partnerStoreId,workspaceId,JSON.stringify({demoFixture:FIXTURE_ID})]);
  await client.query(`INSERT INTO platform_memberships(id,user_id,account_id,workspace_id,store_id,role,status,permissions) VALUES($1,$2,$3,NULL,NULL,'owner','active','[]'::jsonb) ON CONFLICT(id) DO UPDATE SET role='owner',status='active',updated_at=now()`,[membershipId,userId,accountId]);
  await client.query(`INSERT INTO api_sessions(id,user_id,token_hash,status) VALUES($1,$2,$3,'active') ON CONFLICT(token_hash) DO UPDATE SET user_id=EXCLUDED.user_id,status='active'`,[sessionId,userId,hashToken(config.devSessionToken)]);
  await client.query(`INSERT INTO marketplace_networks(id,name,slug,status,default_locale,default_currency) VALUES($1,'ShiftTime Marketplace','shifttime','active','uk-UA','UAH') ON CONFLICT(id) DO NOTHING`,[MARKETPLACE_ID]);
  await client.query(`INSERT INTO marketplace_categories(id,marketplace_id,name,slug,status) VALUES('mpcat_uncategorized',$1,'Без категорії','uncategorized','active') ON CONFLICT(id) DO NOTHING`,[MARKETPLACE_ID]);
  await client.query(`INSERT INTO marketplace_categories(id,marketplace_id,name,slug,status) VALUES('mpcat_demo01077_pans',$1,'Сковорідки','demo-skovoridky','active') ON CONFLICT(id) DO NOTHING`,[MARKETPLACE_ID]);
  await client.query(`INSERT INTO marketplace_categories(id,marketplace_id,name,slug,status) VALUES('mpcat_demo01077_cauldrons',$1,'Казани','demo-kazany','active') ON CONFLICT(id) DO NOTHING`,[MARKETPLACE_ID]);

  await ensureSnapshot(client,storeId,products);
  await ensureSnapshot(client,partnerStoreId,partnerProducts);
  const mainSellerId=await ensureSeller(client,{targetStoreId:storeId,displayName:'Основний магазин',sellerSlug:'main-store-demo01077'});
  const partnerSellerId=await ensureSeller(client,{targetStoreId:partnerStoreId,displayName:'Outdoor Partner',sellerSlug:'outdoor-partner-demo01077'});
  for(const p of products)await ensureOfferListing(client,{sellerId:mainSellerId,targetStoreId:storeId,p});
  for(const p of partnerProducts)await ensureOfferListing(client,{sellerId:partnerSellerId,targetStoreId:partnerStoreId,p});
  const shippingDemo=await ensureShippingDemoOrder01079(client,{mainSellerId,partnerSellerId});

  await client.query('COMMIT');
  console.log('[01080] dev seed ready · existing 01077/01079 fixtures preserved');
  console.log(`  user:    ${config.devUserEmail}`);
  console.log(`  store:   ${storeId}`);
  console.log(`  partner: ${partnerStoreId}`);
  console.log('  demo:    5 products / 2 categories / 2 sellers; low stock + MP-DEMO-01079 with 2 priced SellerOrder deliveries');
  console.log(`  shipping:${shippingDemo.orderId} / ${shippingDemo.sellerOrders} SellerOrders`);
  console.log('  token:   value from DEV_SESSION_TOKEN');
}catch(e){
  try{await client.query('ROLLBACK');}catch{}
  throw e;
}finally{
  client.release();
  await pool.end();
}
