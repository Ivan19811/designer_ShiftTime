// 01050 · Shared Commerce Card Contract (backward compatible with 01038 exports)
// Product Card + Category Card use one semantic Inspector engine.
// Visual classes are NEVER selectors. Stable API = data-commerce-component / data-commerce-role / data-commerce-bind.

export const PRODUCT_CARD_CONTRACT_VERSION_01038 = 'st-commerce-product-card-v1-01038';
export const CATEGORY_CARD_CONTRACT_VERSION_01050 = 'st-commerce-category-card-v1-01050';
export const COMMERCE_CARD_CONTRACT_VERSION_01050 = 'st-commerce-card-v1-01050';

const COMMON = [
  { id:'root', label:'Карточка', required:true, selector:'[data-commerce-component]' },
  { id:'surface', label:'Поверхня карточки', required:false, selector:'[data-commerce-role="surface"]' },
  { id:'media', label:'Медіа / фото', required:true, selector:'[data-commerce-role="media"]' },
  { id:'image', label:'Основне фото', required:false, selector:'[data-commerce-role="image"]' },
  { id:'image-secondary', label:'Друге фото', required:false, selector:'[data-commerce-role="image-secondary"]' },
  { id:'badge', label:'Мітка / Badge', required:false, selector:'[data-commerce-role="badge"]' },
  { id:'body', label:'Контент карточки', required:true, selector:'[data-commerce-role="body"]' },
  { id:'title', label:'Назва', required:true, selector:'[data-commerce-role="title"]' },
  { id:'description', label:'Короткий опис', required:false, selector:'[data-commerce-role="description"]' },
  { id:'actions', label:'Блок кнопок', required:true, selector:'[data-commerce-role="actions"]' }
];

const PRODUCT_ONLY = [
  { id:'brand', label:'Бренд', required:false, selector:'[data-commerce-role="brand"]' },
  { id:'rating', label:'Рейтинг', required:false, selector:'[data-commerce-role="rating"]' },
  { id:'reviews-count', label:'Кількість відгуків', required:false, selector:'[data-commerce-role="reviews-count"]' },
  { id:'price-group', label:'Блок ціни', required:true, selector:'[data-commerce-role="price-group"]' },
  { id:'price-current', label:'Поточна ціна', required:true, selector:'[data-commerce-role="price-current"]' },
  { id:'price-old', label:'Стара ціна', required:false, selector:'[data-commerce-role="price-old"]' },
  { id:'discount', label:'Економія / знижка', required:false, selector:'[data-commerce-role="discount"]' },
  { id:'stock', label:'Наявність', required:false, selector:'[data-commerce-role="stock"]' },
  { id:'add-to-cart', label:'Додати в кошик', required:true, selector:'[data-commerce-role="add-to-cart"]' },
  { id:'buy-now', label:'Купити зараз', required:false, selector:'[data-commerce-role="buy-now"]' },
  { id:'wishlist', label:'У вибране', required:false, selector:'[data-commerce-role="wishlist"]' },
  { id:'compare', label:'Порівняти', required:false, selector:'[data-commerce-role="compare"]' },
  { id:'quick-view', label:'Швидкий перегляд', required:false, selector:'[data-commerce-role="quick-view"]' }
];

const CATEGORY_ONLY = [
  { id:'category-products-count', label:'Кількість товарів', required:false, selector:'[data-commerce-role="category-products-count"]' },
  { id:'category-price', label:'Ціна категорії', required:false, selector:'[data-commerce-role="category-price"]' },
  { id:'category-feature', label:'Основна характеристика', required:false, selector:'[data-commerce-role="category-feature"]' },
  { id:'category-extra', label:'Додаткові блоки', required:false, selector:'[data-commerce-role="category-extra"]' },
  { id:'category-subcategories', label:'Підкатегорії', required:false, selector:'[data-commerce-role="category-subcategories"]' },
  { id:'category-icon', label:'Іконка категорії', required:false, selector:'[data-commerce-role="category-icon"]' },
  { id:'category-open', label:'Відкрити категорію', required:true, selector:'[data-commerce-role="category-open"]' }
];

function freezeDefs(list){ return Object.freeze(list.map(x=>Object.freeze({...x}))); }
export const PRODUCT_CARD_ROLE_DEFS_01038 = freezeDefs([...COMMON, ...PRODUCT_ONLY]);
export const CATEGORY_CARD_ROLE_DEFS_01050 = freezeDefs([...COMMON, ...CATEGORY_ONLY]);
export const COMMERCE_CARD_ROLE_DEFS_01050 = freezeDefs([...COMMON, ...PRODUCT_ONLY, ...CATEGORY_ONLY]);

export const PRODUCT_CARD_ROLES_01038 = Object.freeze(PRODUCT_CARD_ROLE_DEFS_01038.reduce((acc,item)=>{ acc[item.id]=item.selector; return acc; },Object.create(null)));
export const CATEGORY_CARD_ROLES_01050 = Object.freeze(CATEGORY_CARD_ROLE_DEFS_01050.reduce((acc,item)=>{ acc[item.id]=item.selector; return acc; },Object.create(null)));

const LEGACY_FIELD_SELECTOR_BY_ROLE = Object.freeze({
  media:'[data-shop-field="product_image"]',
  badge:'[data-shop-field="product_badge"]',
  title:'[data-shop-field="product_name"]',
  description:'[data-shop-field="product_short_description"]',
  'price-current':'[data-shop-field="product_price"]',
  'price-old':'[data-shop-field="product_old_price"]',
  'add-to-cart':'[data-shop-field="product_url"]'
});

export function getCommerceCardType01050(input){
  const root = input instanceof Element
    ? (input.matches?.('[data-commerce-component]') ? input : input.closest?.('[data-commerce-component]'))
    : null;
  const type = String(root?.dataset?.commerceComponent || '').trim().toLowerCase();
  return type === 'category-card' ? 'category-card' : (type === 'product-card' ? 'product-card' : '');
}

export function resolveCommerceCardRoot01050(input){
  const el = input instanceof Element ? input : null;
  if (!el) return null;
  if (el.matches?.('[data-commerce-component="product-card"],[data-commerce-component="category-card"]')) return el;
  const closest = el.closest?.('[data-commerce-component="product-card"],[data-commerce-component="category-card"],[data-shop-card-inner="product"],[data-shop-card-inner="category"],.st-shop-product-card,.st-shop-category-card') || null;
  if (closest) {
    if (closest.matches?.('[data-commerce-component]')) return closest;
    return closest.closest?.('[data-commerce-component]') || closest;
  }
  return el.querySelector?.('[data-commerce-component="product-card"],[data-commerce-component="category-card"],[data-shop-card-inner="product"],[data-shop-card-inner="category"],.st-shop-product-card,.st-shop-category-card') || null;
}

export function getCommerceCardRoleDefs01050(typeOrCard){
  const type = typeof typeOrCard === 'string' ? String(typeOrCard).trim().toLowerCase() : getCommerceCardType01050(resolveCommerceCardRoot01050(typeOrCard));
  return type === 'category-card' ? CATEGORY_CARD_ROLE_DEFS_01050 : PRODUCT_CARD_ROLE_DEFS_01038;
}

export function resolveCommerceCardRole01050(card, roleId){
  const root = resolveCommerceCardRoot01050(card) || (card instanceof Element ? card : null);
  if (!root) return null;
  if (roleId === 'root') return root;
  const def = COMMERCE_CARD_ROLE_DEFS_01050.find(item=>item.id===roleId);
  if (!def) return null;
  const canonical = root.querySelector?.(def.selector) || null;
  if (canonical) return canonical;
  const legacySelector = LEGACY_FIELD_SELECTOR_BY_ROLE[roleId];
  return legacySelector ? (root.querySelector?.(legacySelector) || null) : null;
}

export function validateCommerceCardContract01050(card){
  const root = resolveCommerceCardRoot01050(card);
  const type = getCommerceCardType01050(root);
  const version = type === 'category-card' ? CATEGORY_CARD_CONTRACT_VERSION_01050 : PRODUCT_CARD_CONTRACT_VERSION_01038;
  if (!root || !type) return Object.freeze({ok:false,type:'',version,root:null,missingRequired:['root'],present:[]});
  const defs = getCommerceCardRoleDefs01050(type);
  const present=[]; const missingRequired=[];
  defs.forEach(def=>{
    const node=resolveCommerceCardRole01050(root,def.id);
    if(node) present.push(def.id); else if(def.required) missingRequired.push(def.id);
  });
  return Object.freeze({ok:missingRequired.length===0,type,version,root,missingRequired:Object.freeze(missingRequired),present:Object.freeze(present)});
}

// Backward compatible 01038 exports: existing Product Card widgets become common
// Commerce Card widgets without duplicating their selector/persistence logic.
export function resolveProductCardRoot01038(input){ return resolveCommerceCardRoot01050(input); }
export function resolveProductCardRole01038(card,roleId){ return resolveCommerceCardRole01050(card,roleId); }
export function getProductCardParts01038(card){
  const root=resolveCommerceCardRoot01050(card); if(!root) return null;
  const parts=Object.create(null); getCommerceCardRoleDefs01050(root).forEach(def=>{parts[def.id]=resolveCommerceCardRole01050(root,def.id);}); return parts;
}
export function validateProductCardContract01038(card){ return validateCommerceCardContract01050(card); }
export function getProductCardRoleDefinition01038(roleId){ return COMMERCE_CARD_ROLE_DEFS_01050.find(item=>item.id===roleId)||null; }
