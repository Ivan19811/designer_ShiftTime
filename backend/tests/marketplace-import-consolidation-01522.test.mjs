import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyMarketplaceSnapshot01052} from '../src/vendor/marketplace-sync/marketplace-schema-01052.mjs';
import {buildProductImportPlan01060, executeProductImport01060} from '../src/vendor/marketplace-sync/marketplace-import-export-service-01060.mjs';

// 01522 consolidates the 01519 accessory preflight, 01520 additional-service
// preflight and 01521 existing-category protection into one transaction check.
const mapping={Name:'name',Group:'productGroup',Category:'categories',SKU:'variant:sku',Diameter:'variantAttribute:diameter',Price:'variant:price',Role:'catalogRole01472',Accessories:'accessoryProducts01485',Services:'additionalServices01487'};
const options={rowMode:'variants',existingPolicy:'update',createMissingCategories:false};
function catalog(){
 const s=createEmptyMarketplaceSnapshot01052();
 s.categories=[
   {id:'pans',name:'Сковорідки',parentId:null},
   {id:'accessories',name:'Аксесуари Сковороди',parentId:'pans'},
   {id:'lids',name:'Кришки',parentId:'accessories'},
   {id:'engraving',name:'Гравіювання',parentId:null}
 ];
 s.products=[{id:'lid-p',name:'Кришка',sku:'KRS-000002',productGroup01512:'ACC-0001',categoryIds:['lids']}];
 s.variants=[{id:'lid-v30',productId:'lid-p',sku:'KRS-000002-D30',price:0,options:{diameter:'30'}}];
 s.attributes=[{id:'diam',name:'Діаметр',key:'diameter',type:'number-unit',unit:'см',variantOption:true,valueIds:['d30']}];
 s.attributeValues=[{id:'d30',attributeId:'diam',value:'30',label:'30',slug:'30'}];
 return s;
}
const r=(name,group,category,sku,price,role='ТОВАР',accessories='',services='')=>({
 Name:name, Group:group, Category:category, SKU:sku, Diameter:'30', Price:String(price), Role:role, Accessories:accessories, Services:services
});
function rows(){return [
  r('Кришка','ACC-0001','Сковорідки','KRS-000002-D30',260,'АКСЕСУАРИ','Сковорода 4 мм (30)','Гравіювання (30)'),
  r('Сковорода 4 мм','PAN-0001','Сковорідки','PAN-0001-D30',840),
  r('Гравіювання','SRV-0001','Гравіювання','SRV-0001-D30',100,'ДОДАТКОВО')
]}
test('01522 preflight combines ancestor category protection and forward accessory/service links',async()=>{
 const s=catalog(),source=rows(),plan=buildProductImportPlan01060(source,mapping,s,options);
 assert.equal(plan.counts.error,0,JSON.stringify(plan.errors));
 assert.equal(plan.categoryReviews01521?.find(x=>x.productId==='lid-p')?.kind,'preservedAncestor');
 assert.equal(plan.additionalServicePreflight01520?.errors?.length,0);
 let current=structuredClone(s),writes=0;
 const store={getRepositoryInfo:()=>({type:'api'}),getState:()=>structuredClone(current),replaceSnapshot:async n=>{current=structuredClone(n);writes++},refresh:async()=>structuredClone(current)};
 await executeProductImport01060(store,source,mapping,options,{sourceName:'price-01522.xlsx'});
 assert.equal(writes,1);
 assert.deepEqual(current.products.find(x=>x.id==='lid-p')?.categoryIds,['lids']);
 assert.equal(current.variants.find(x=>x.sku==='KRS-000002-D30')?.price,260);
 const lid=current.variants.find(x=>x.sku==='KRS-000002-D30');
 const pan=current.variants.find(x=>x.sku==='PAN-0001-D30');
 const service=current.variants.find(x=>x.sku==='SRV-0001-D30');
 assert.ok(pan&&service&&lid);
 assert.ok(lid.accessoryTargets01485?.refs?.some(ref=>ref.variantId===pan.id));
 assert.ok(service.accessoryTargets01485?.refs?.some(ref=>ref.variantId===lid.id));
});
