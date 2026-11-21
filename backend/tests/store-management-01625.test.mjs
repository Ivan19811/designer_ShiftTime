// Compatibility tests migrated to the canonical 01626 ID-based engine.
// The historical filename stays so existing CI test discovery does not break.
import test from 'node:test';import assert from 'node:assert/strict';
import {selectiveExportModel01626,analyzeSelectiveImport01626,applySelectiveProducts01626} from '../src/marketplace-selective-transfer-core-01626.mjs';
const snapshot={revision:5,products:Array.from({length:10000},(_,i)=>({id:'product_'+(i+1),name:'Товар '+(i+1),price:i+1,sku:'sku'+(i+1),stock:2}))};
test('selective export always starts with immutable product ID',()=>{const m=selectiveExportModel01626(snapshot,['price','name']);assert.deepEqual(m.columns.map(x=>x[0]),['id','price','name']);assert.equal(m.rows.length,10000);});
test('deleting row 7 from the transfer file never shifts product alignment',()=>{
 const rows=[{id:'product_1',name:'Нове 1',price:'15'},{id:'product_8',name:'Нове 8',price:'85'},{id:'product_10',name:'Нове 10',price:'105'}];
 const p=analyzeSelectiveImport01626(snapshot,rows,['name','price']);assert.equal(p.ok,true);assert.equal(p.changed,3);const after=applySelectiveProducts01626(snapshot,{expectedRevision:p.revision,rows:p.rows}).snapshot;
 assert.equal(after.products[7].name,'Нове 8');assert.equal(after.products[6].name,'Товар 7');assert.equal(after.products[9].price,105);assert.equal(after.products.length,10000);
});
test('missing product ID in the file is rejected, while unknown IDs are skipped by default',()=>{const p=analyzeSelectiveImport01626(snapshot,[{name:'No ID'},{id:'unknown',price:'9'}],['price']);assert.equal(p.ok,false);assert.equal(p.errorCount,1);assert.equal(p.skipped,1);});
test('duplicate ID and invalid numbers are rejected',()=>{const p=analyzeSelectiveImport01626(snapshot,[{id:'product_1',price:'a'},{id:'product_1',price:'30'}],['price']);assert.equal(p.ok,false);assert.equal(p.errorCount,2);});
test('stale expected revision and edits to product ID are denied',()=>{
 assert.throws(()=>applySelectiveProducts01626(snapshot,{expectedRevision:4,rows:[{id:'product_1',action:'update',patch:{price:5}}]}),/CONFLICT/);
 assert.throws(()=>applySelectiveProducts01626(snapshot,{expectedRevision:5,rows:[{id:'product_1',action:'update',patch:{id:'bad'}}]}),/FIELD_DENIED/);
});
