import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeAiProductQueryContext01413} from '../src/ai-consultant-conversation-core-01413.mjs';
import {searchAiProductDocuments01412} from '../src/ai-consultant-product-query-core-01412.mjs';

test('01413 keeps product and volume when customer asks for cheaper options',()=>{
  const first=mergeAiProductQueryContext01413(null,'Я хочу казан на 8 літрів');
  const next=mergeAiProductQueryContext01413(first,'Покажи дешевші');
  assert.equal(next.contextMode,'followup');
  assert.equal(next.textQuery,'казан');
  assert.equal(next.attributes.volumeLiters,8);
  assert.equal(next.sort,'price-asc');
  assert.equal(next.minPrice,null);
  assert.equal(next.maxPrice,null);
});

test('01413 keeps earlier context while adding a price ceiling',()=>{
  const first=mergeAiProductQueryContext01413(null,'Покажи казан 8 л');
  const next=mergeAiProductQueryContext01413(first,'до 2000 грн');
  assert.equal(next.textQuery,'казан');
  assert.equal(next.attributes.volumeLiters,8);
  assert.equal(next.maxPrice,2000);
  const result=searchAiProductDocuments01412([
    {id:'ok',title:'Казан 8 л',attributes:{capacity:'8 л'},price:1900,stock:2,availability:'in-stock'},
    {id:'high',title:'Казан 8 л',attributes:{capacity:'8 л'},price:2500,stock:2,availability:'in-stock'},
    {id:'wrong-volume',title:'Казан 10 л',attributes:{capacity:'10 л'},price:1700,stock:2,availability:'in-stock'}
  ],next);
  assert.equal(result.total,1);
  assert.equal(result.items[0].id,'ok');
});

test('01413 explicit product switch does not inherit previous volume or price',()=>{
  const first=mergeAiProductQueryContext01413(null,'Казан 8 л до 2000 грн');
  const next=mergeAiProductQueryContext01413(first,'А тепер сковороду');
  assert.equal(next.contextMode,'switch');
  assert.equal(next.textQuery,'сковороду');
  assert.equal(next.attributes.volumeLiters,null);
  assert.equal(next.maxPrice,null);
});
