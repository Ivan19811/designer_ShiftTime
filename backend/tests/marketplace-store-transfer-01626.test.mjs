import test from 'node:test';
import assert from 'node:assert/strict';
import {applySelectiveProducts01626,analyzeSelectiveImport01626,recognizeImportFields01626,selectiveExportModel01626} from '../src/marketplace-selective-transfer-core-01626.mjs';
const sample=(n=10)=>({revision:11,products:Array.from({length:n},(_,i)=>({id:`p${i}`,sku:`SKU-${i}`,name:`Товар ${i}`,price:i*10,status:'active',createdAt:'old'}))});

test('ID is mandatory and export maintains identity when a row is deleted',()=>{
 const s=sample(),m=selectiveExportModel01626(s,['price']);assert.equal(m.columns[0][0],'id');assert.equal(m.columns[1][0],'price');
 const rows=m.rows.filter(x=>x.id!=='p7').map(x=>x.id==='p8'?{...x,price:999}:x),plan=analyzeSelectiveImport01626(s,rows,['price']);assert.equal(plan.ok,true);assert.equal(plan.updated,1);assert.equal(plan.added,0);
 const out=applySelectiveProducts01626(s,{expectedRevision:11,rows:plan.rows}).snapshot.products;assert.equal(out.find(x=>x.id==='p7').price,70);assert.equal(out.find(x=>x.id==='p8').price,999);assert.equal(out.length,s.products.length);
});
test('selective imported fields and missing product decisions are independent',()=>{
 const s=sample(10000),rows=Array.from({length:50},(_,i)=>({id:`missing${i}`,name:`Новий ${i}`,price:`${100+i}`}));rows.push({id:'p9',name:'НЕ змінювати',price:'123'});
 const decisions=Object.fromEntries(rows.slice(0,30).map(r=>[r.id,'add']));const plan=analyzeSelectiveImport01626(s,rows,['price'],decisions);
 assert.equal(plan.ok,true);assert.equal(plan.added,30);assert.equal(plan.skipped,20);assert.equal(plan.updated,1);assert.equal(plan.missing.length,50);
 const result=applySelectiveProducts01626(s,{expectedRevision:11,rows:plan.rows});assert.equal(result.added,30);assert.equal(result.updated,1);assert.equal(result.snapshot.products.length,10030);assert.equal(result.snapshot.products.find(x=>x.id==='p9').name,'Товар 9');assert.equal(result.snapshot.products.find(x=>x.id==='missing3').status,'draft');
});
test('unrecognized ID, duplicate ID and invalid missing product are blocked',()=>{
 const s=sample();let p=analyzeSelectiveImport01626(s,[{name:'no id',price:10}],['price']);assert.equal(p.ok,false);
 p=analyzeSelectiveImport01626(s,[{id:'p1',price:'8'},{id:'p1',price:'8'}],['price']);assert.equal(p.ok,false);
 p=analyzeSelectiveImport01626(s,[{id:'missing',price:8}],['price'],{missing:'add'});assert.equal(p.ok,false);
 assert.equal(recognizeImportFields01626(['Product ID','Назва товару','Ціна','unknown']).hasId,true);
});
test('server denies stale revision, field injection, ID collisions and forced activation',()=>{
 const s=sample();for(const input of [
  {expectedRevision:9,rows:[{id:'p1',action:'update',patch:{price:100}}]},
  {expectedRevision:11,rows:[{id:'p1',action:'add',patch:{name:'bad',status:'draft'}}]},
  {expectedRevision:11,rows:[{id:'missing',action:'add',patch:{name:'bad',status:'active'}}]},
  {expectedRevision:11,rows:[{id:'missing',action:'add',patch:{name:'bad',status:'draft',__proto__:null,secret:'token'}}]},
  {expectedRevision:11,rows:[{id:'p1',action:'update',patch:{id:'another'}}]},
 ])assert.throws(()=>applySelectiveProducts01626(s,input));
});
test('new IDs must be explicit and never delete categories, media or variants',()=>{
 const s={...sample(),categories:[{id:'cat1'}],media:[{id:'img'}],variants:[{id:'v1',productId:'p1'}]},plan=analyzeSelectiveImport01626(s,[{id:'new1',name:'Чохол',price:'15'}],['price'],{new1:'add'});
 const result=applySelectiveProducts01626(s,{expectedRevision:11,rows:plan.rows}).snapshot;assert.deepEqual(result.categories,s.categories);assert.deepEqual(result.variants,s.variants);assert.deepEqual(result.media,s.media);assert.equal(result.products.find(x=>x.id==='new1').price,15);
});
