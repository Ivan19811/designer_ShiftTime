// 01058 · Domain service above MarketplaceStore.
// It enforces catalogue invariants without knowing or importing any physical repository implementation.
import {
  getMarketplaceAttributeFilterType01058,
  getMarketplaceAttributeUsage01058,
  getMarketplaceAttributeValueUsage01058,
  getMarketplaceAttributeValues01058,
  getMarketplaceProductVariants01058
} from '../data/marketplace-attribute-selectors-01058.js?v=01058';

const AUTO_FILTER_SOURCE='attribute-auto-01058';
function str(v){return String(v??'').trim();}
function arr(v){return Array.isArray(v)?v:[];}
function slugify(value){
  const map={а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ж:'zh',з:'z',и:'y',і:'i',ї:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'iu',я:'ia',ы:'y',э:'e',ъ:'',ё:'io'};
  return str(value).toLowerCase().split('').map(ch=>map[ch]??ch).join('').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-').slice(0,90);
}
function canonicalKey(v){return slugify(v).replace(/-/g,'_');}
function clone(v){try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}}
function comboKey(options){return Object.keys(options||{}).sort().map(k=>`${k}=${str(options[k])}`).join('|');}
function cartesian(rows){
  let out=[{}];
  for(const row of rows){const next=[];for(const base of out)for(const value of row.values)next.push({...base,[row.key]:value});out=next;}
  return out;
}
function skuToken(v){return slugify(v).replace(/-/g,'').toUpperCase().slice(0,14)||'OPT';}

export class MarketplaceAttributeVariantFilterService01058 {
  constructor(store){if(!store)throw new Error('MarketplaceStore required');this.store=store;}
  state(){return this.store.getState();}

  assertUniqueAttributeKey(key,exceptId=''){
    const target=canonicalKey(key);if(!target)throw new Error('Вкажи унікальний key характеристики.');
    const exists=arr(this.state().attributes).find(a=>a.id!==exceptId&&str(a.key).toLowerCase()===target.toLowerCase());
    if(exists)throw new Error(`Key «${target}» уже використовується характеристикою «${exists.name}».`);
    return target;
  }
  assertUniqueVariantSku(sku,exceptId=''){
    const target=str(sku);if(!target)throw new Error('SKU варіації обов’язковий.');
    const state=this.state();
    const variant=arr(state.variants).find(v=>v.id!==exceptId&&str(v.sku).toLowerCase()===target.toLowerCase());
    if(variant)throw new Error(`SKU варіації «${target}» уже існує.`);
    const product=arr(state.products).find(p=>str(p.sku).toLowerCase()===target.toLowerCase());
    if(product)throw new Error(`SKU «${target}» уже використовується базовим товаром «${product.name}».`);
    return target;
  }

  async withRollback(task){
    const before=this.store.getState();
    try{return await task();}catch(err){try{await this.store.replaceSnapshot(before,'01058-rollback');}catch(rollbackErr){console.error('[01058] rollback failed',rollbackErr);}throw err;}
  }

  async saveAttribute(input,{id='',values=[]}={}){
    const key=this.assertUniqueAttributeKey(input.key||input.name,id);
    const current=id?this.store.getAttribute(id):null;
    if(current&&str(current.key)!==key){
      const usage=getMarketplaceAttributeUsage01058(this.state(),current);
      if(usage.products.length||usage.variants.length)throw new Error(`Key «${current.key}» уже використовується у товарах/варіаціях. Щоб не розірвати data binding, спочатку приберіть цю характеристику з даних або залиште key без змін.`);
    }
    const payload={...input,key,name:str(input.name),unit:str(input.unit),type:str(input.type)||'text',filterable:input.filterable!==false,variantOption:input.variantOption===true,required:input.required===true,sortOrder:Number(input.sortOrder)||0};
    if(!payload.name)throw new Error('Вкажи назву характеристики.');
    return this.withRollback(async()=>{
      const attribute=id?await this.store.updateAttribute(id,payload):await this.store.createAttribute(payload);
      const synced=await this.syncAttributeValues(attribute,values);
      const finalAttr=synced.attribute;
      await this.syncAutoFilters();
      return finalAttr;
    });
  }

  async syncAttributeValues(attribute,valueInputs){
    const state=this.state();
    const existing=getMarketplaceAttributeValues01058(state,attribute.id),existingById=new Map(existing.map(v=>[v.id,v]));
    const wanted=[];const seen=new Set();
    for(let i=0;i<arr(valueInputs).length;i++){
      const row=valueInputs[i]||{},label=str(row.label||row.value),value=str(row.value)||slugify(label);
      if(!label&&!value)continue;
      if(!value)throw new Error('Значення словника не може бути порожнім.');
      const lc=value.toLowerCase();if(seen.has(lc))throw new Error(`Значення «${value}» дублюється.`);seen.add(lc);
      const payload={attributeId:attribute.id,value,label:label||value,slug:str(row.slug)||slugify(label||value),color:str(row.color),sortOrder:i};
      let entity;
      if(row.id&&existingById.has(row.id))entity=await this.store.updateAttributeValue(row.id,payload);else entity=await this.store.createAttributeValue(payload);
      wanted.push(entity);
    }
    const wantedIds=new Set(wanted.map(v=>v.id));
    for(const old of existing){
      if(wantedIds.has(old.id))continue;
      const usage=getMarketplaceAttributeValueUsage01058(this.state(),attribute,old);
      if(usage.products.length||usage.variants.length)throw new Error(`Не можна видалити значення «${old.label||old.value}»: воно використовується у ${usage.products.length} товарах і ${usage.variants.length} варіаціях.`);
      await this.store.deleteAttributeValue(old.id);
    }
    const updated=await this.store.updateAttribute(attribute.id,{valueIds:wanted.map(v=>v.id)});
    return {attribute:updated,values:wanted};
  }

  async deleteAttribute(attributeId){
    const state=this.state(),attribute=arr(state.attributes).find(a=>a.id===attributeId);if(!attribute)return false;
    const usage=getMarketplaceAttributeUsage01058(state,attribute);
    if(usage.products.length||usage.variants.length)throw new Error(`Характеристика використовується: ${usage.products.length} товарів, ${usage.variants.length} варіацій. Спочатку приберіть значення з товарів/варіацій.`);
    return this.withRollback(async()=>{
      for(const f of usage.filters)await this.store.deleteFilter(f.id);
      for(const v of getMarketplaceAttributeValues01058(this.state(),attribute.id))await this.store.deleteAttributeValue(v.id);
      return this.store.deleteAttribute(attribute.id);
    });
  }

  async setProductAttributes(productId,values){
    const product=this.store.getProduct(productId);if(!product)throw new Error('Товар не знайдено.');
    const state=this.state(),attrs=new Map(arr(state.attributes).map(a=>[a.key,a])),clean={...(product.attributes||{})};
    for(const key of attrs.keys())delete clean[key];
    for(const [key,raw] of Object.entries(values||{})){
      const attribute=attrs.get(key);if(!attribute)continue;
      if(raw===null||raw===undefined||str(raw)==='')continue;
      if(attribute.type==='number'||attribute.type==='number-unit'){
        const n=Number(raw);if(!Number.isFinite(n))throw new Error(`«${attribute.name}» має бути числом.`);clean[key]=n;
      }else if(attribute.type==='boolean') clean[key]=raw===true||raw==='true'||raw==='1';
      else clean[key]=str(raw);
    }
    return this.store.updateProduct(productId,{attributes:clean});
  }

  async generateVariants(productId,selections,{limit=160}={}){
    const state=this.state(),product=arr(state.products).find(p=>p.id===productId);if(!product)throw new Error('Спочатку вибери товар.');
    const attrs=new Map(arr(state.attributes).filter(a=>a.variantOption).map(a=>[a.key,a]));
    const rows=[];
    for(const [key,valuesRaw] of Object.entries(selections||{})){
      const attribute=attrs.get(key);if(!attribute)continue;
      const allowed=new Set(getMarketplaceAttributeValues01058(state,attribute.id).map(v=>str(v.value)));
      const values=[...new Set(arr(valuesRaw).map(str).filter(v=>v&&allowed.has(v)))];
      if(values.length)rows.push({key,attribute,values});
    }
    if(!rows.length)throw new Error('Вибери хоча б одну option-характеристику та її значення.');
    const combos=cartesian(rows);if(combos.length>limit)throw new Error(`Забагато комбінацій (${combos.length}). Максимум на один запуск — ${limit}.`);
    const existing=getMarketplaceProductVariants01058(state,productId),byCombo=new Map(existing.map(v=>[comboKey(v.options),v]));
    const globalSkus=new Set([...arr(state.products).map(p=>str(p.sku).toLowerCase()),...arr(state.variants).map(v=>str(v.sku).toLowerCase())].filter(Boolean));
    const created=[];
    await this.withRollback(async()=>{
      for(const options of combos){
        if(byCombo.has(comboKey(options)))continue;
        const tokens=rows.map(r=>skuToken(options[r.key]));
        const base=str(product.sku)||`P-${product.id.slice(-6)}`;let sku=[base,...tokens].join('-'),n=2;
        while(globalSkus.has(sku.toLowerCase()))sku=[base,...tokens,n++].join('-');
        this.assertUniqueVariantSku(sku);globalSkus.add(sku.toLowerCase());
        const variant=await this.store.createVariant({productId,sku,status:'active',options,price:Number(product.price)||0,oldPrice:Number(product.oldPrice)||0,stock:0,availability:'out-of-stock'});
        created.push(variant);byCombo.set(comboKey(options),variant);
      }
      const all=getMarketplaceProductVariants01058(this.state(),productId);
      await this.store.updateProduct(productId,{variantIds:all.map(v=>v.id)});
    });
    return {created,combinations:combos.length,total:getMarketplaceProductVariants01058(this.state(),productId).length};
  }

  async updateVariant(variantId,patch){
    const variant=this.store.getVariant(variantId);if(!variant)throw new Error('Варіацію не знайдено.');
    const sku=this.assertUniqueVariantSku(patch.sku??variant.sku,variantId);
    const price=Number(patch.price??variant.price),oldPrice=Number(patch.oldPrice??variant.oldPrice),stock=Math.max(0,Math.round(Number(patch.stock??variant.stock)||0));
    return this.store.updateVariant(variantId,{...patch,sku,price:Number.isFinite(price)?Math.max(0,price):0,oldPrice:Number.isFinite(oldPrice)?Math.max(0,oldPrice):0,stock,availability:patch.availability||(stock>0?'in-stock':'out-of-stock')});
  }

  async deleteVariant(variantId){
    const variant=this.store.getVariant(variantId);if(!variant)return false;
    return this.withRollback(async()=>{
      await this.store.deleteVariant(variantId);
      const product=this.store.getProduct(variant.productId);
      if(product)await this.store.updateProduct(product.id,{variantIds:getMarketplaceProductVariants01058(this.state(),product.id).map(v=>v.id)});
      return true;
    });
  }

  async syncAutoFilters(){
    const state=this.state(),attrs=arr(state.attributes),filters=arr(state.filters);
    const autoByAttr=new Map(filters.filter(f=>f.config?.source===AUTO_FILTER_SOURCE&&f.attributeId).map(f=>[f.attributeId,f]));
    const anyByAttr=new Map(filters.filter(f=>f.attributeId).map(f=>[f.attributeId,f]));
    const changed=[];
    for(const a of attrs){
      const current=autoByAttr.get(a.id),anyCurrent=anyByAttr.get(a.id);
      if(a.filterable){
        if(!current&&!anyCurrent){
          const created=await this.store.createFilter({key:a.key,name:a.name,type:getMarketplaceAttributeFilterType01058(a),attributeId:a.id,enabled:true,sortOrder:Number(a.sortOrder)||0,config:{source:AUTO_FILTER_SOURCE,autoName:true}});
          changed.push(created);autoByAttr.set(a.id,created);anyByAttr.set(a.id,created);
        }else if(current){
          const autoName=current.config?.autoName!==false;
          changed.push(await this.store.updateFilter(current.id,{key:a.key,name:autoName?a.name:current.name,type:getMarketplaceAttributeFilterType01058(a),enabled:current.enabled!==false,sortOrder:Number.isFinite(Number(current.sortOrder))?Number(current.sortOrder):Number(a.sortOrder)||0,config:{...(current.config||{}),source:AUTO_FILTER_SOURCE,autoName}}));
        }
      }else if(current&&current.enabled!==false){
        changed.push(await this.store.updateFilter(current.id,{enabled:false,config:{...(current.config||{}),source:AUTO_FILTER_SOURCE,disabledReason:'attribute-not-filterable'}}));
      }
    }
    return changed;
  }

  async saveFilter(filterId,patch){
    const current=filterId?this.store.getFilter(filterId):null;
    const attribute=this.store.getAttribute(patch.attributeId||current?.attributeId);if(!attribute)throw new Error('Вибери характеристику для фільтра.');
    const state=this.state();
    const duplicate=arr(state.filters).find(f=>f.id!==filterId&&f.attributeId===attribute.id&&f.enabled!==false);
    if(duplicate)throw new Error(`Для «${attribute.name}» уже є активний фільтр.`);
    const payload={key:attribute.key,name:str(patch.name)||attribute.name,type:patch.type||getMarketplaceAttributeFilterType01058(attribute),attributeId:attribute.id,categoryIds:arr(patch.categoryIds).map(str).filter(Boolean),enabled:patch.enabled!==false,sortOrder:Number(patch.sortOrder)||0,config:{...(current?.config||{}),...(patch.config||{}),autoName:false}};
    return current?this.store.updateFilter(current.id,payload):this.store.createFilter(payload);
  }

  async installCommonAttributes(){
    const presets=[
      {key:'diameter',name:'Діаметр',type:'number-unit',unit:'см',filterable:true,variantOption:false},
      {key:'thickness',name:'Товщина',type:'number-unit',unit:'мм',filterable:true,variantOption:false},
      {key:'color',name:'Колір',type:'color',filterable:true,variantOption:true,values:[['black','Чорний','#111111'],['white','Білий','#ffffff'],['silver','Сріблястий','#c0c0c0']]},
      {key:'size',name:'Розмір',type:'list',filterable:true,variantOption:true,values:[['xl','XL',''],['xxl','XXL',''],['xxxl','XXXL','']]},
      {key:'material',name:'Матеріал',type:'list',filterable:true,variantOption:false,values:[['steel','Сталь',''],['cast-iron','Чавун',''],['stainless-steel','Нержавіюча сталь','']]},
      {key:'volume',name:'Об’єм',type:'number-unit',unit:'л',filterable:true,variantOption:false}
    ];
    const results=[];
    for(const p of presets){
      const existing=arr(this.state().attributes).find(a=>str(a.key).toLowerCase()===p.key);
      const presetValues=arr(p.values).map(([value,label,color])=>({value,label,color}));
      if(existing){
        if(presetValues.length){
          const current=getMarketplaceAttributeValues01058(this.state(),existing.id);
          const seen=new Set(current.map(v=>str(v.value).toLowerCase()));
          const merged=[...current,...presetValues.filter(v=>!seen.has(str(v.value).toLowerCase()))];
          const synced=await this.syncAttributeValues(existing,merged);results.push(synced.attribute);
        }else results.push(existing);
        continue;
      }
      results.push(await this.saveAttribute(p,{values:presetValues}));
    }
    await this.syncAutoFilters();return results;
  }
}

export function createMarketplaceAttributeVariantFilterService01058(store){return new MarketplaceAttributeVariantFilterService01058(store);}
export { AUTO_FILTER_SOURCE as MARKETPLACE_AUTO_FILTER_SOURCE_01058, canonicalKey as canonicalMarketplaceAttributeKey01058 };
