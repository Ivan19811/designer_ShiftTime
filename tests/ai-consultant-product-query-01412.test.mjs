import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAiProductQuery01412,searchAiProductDocuments01412} from '../src/ai-consultant-product-query-core-01412.mjs';

test('01412 parses cheap 8 liter product intent',()=>{
  const plan=parseAiProductQuery01412('Я хочу недорогий казан на 8 літрів');
  assert.equal(plan.textQuery,'казан');
  assert.equal(plan.attributes.volumeLiters,8);
  assert.equal(plan.availability,'in-stock');
  assert.equal(plan.sort,'price-asc');
});

test('01412 parses price boundaries and preorder',()=>{
  const price=parseAiProductQuery01412('Покажи казани 8 л від 1500 до 2500 грн');
  assert.equal(price.minPrice,1500);
  assert.equal(price.maxPrice,2500);
  const preorder=parseAiProductQuery01412('Покажи казан під замовлення 10 літрів');
  assert.equal(preorder.availability,'preorder');
  assert.equal(preorder.attributes.volumeLiters,10);
});

test('01412 keeps exact volume and availability filters',()=>{
  const plan=parseAiProductQuery01412('Я хочу недорогий казан на 8 літрів');
  const result=searchAiProductDocuments01412([
    {id:'l1',title:'Казан чавунний 8 л',categories:[{name:'Казани'}],attributes:{'Об’єм':'8 л'},sku:'K8',price:2200,currency:'UAH',stock:3,availability:'in-stock'},
    {id:'l2',title:'Казан 10 л',categories:[{name:'Казани'}],attributes:{'Об’єм':'10 л'},sku:'K10',price:1800,currency:'UAH',stock:3,availability:'in-stock'},
    {id:'l3',title:'Казан 8 л',categories:[{name:'Казани'}],attributes:{volume:'8 L'},sku:'K8Z',price:1700,currency:'UAH',stock:0,availability:'out-of-stock'}
  ],plan);
  assert.equal(result.total,1);
  assert.equal(result.items[0].id,'l1');
  assert.deepEqual(result.items[0].matchedVolumes,[8]);
});

test('01412 understands plural product form and price ceiling',()=>{
  const plan=parseAiProductQuery01412('Покажи казани 8 л до 2000 грн');
  const result=searchAiProductDocuments01412([
    {id:'cheap',title:'Казан 8 літрів',attributes:{capacity:'8 л'},price:1900,stock:2,availability:'in-stock'},
    {id:'high',title:'Казан 8 літрів',attributes:{capacity:'8 л'},price:2600,stock:2,availability:'in-stock'}
  ],plan);
  assert.equal(result.total,1);
  assert.equal(result.items[0].id,'cheap');
});
