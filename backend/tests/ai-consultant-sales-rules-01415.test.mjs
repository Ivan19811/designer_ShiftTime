import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAiConsultantSalesRule01415,attachAiConsultantSalesOffers01415,salesOfferSummary01415} from '../src/ai-consultant-sales-rules-core-01415.mjs';

const item=(price,{currency='UAH',id='listing_1',categories=['Казани']}={})=>({id,listingId:id,title:'Казан',price,currency,categories});
const baseRule={id:'rule_1',name:'100 over 2500',enabled:true,priority:100,minProductPrice:2500,minPriceExclusive:true,excludeDiscountedProducts:true,discountType:'fixed',discountValue:100,maxDiscount:100,currency:'UAH',productIds:[],categories:[]};

test('01415 strict threshold means 2500 does not qualify but 2500.01 does',()=>{
  assert.equal(evaluateAiConsultantSalesRule01415(baseRule,item(2500)),null);
  const offer=evaluateAiConsultantSalesRule01415(baseRule,item(2500.01));
  assert.equal(offer.discountAmount,100);
  assert.equal(offer.finalPrice,2400.01);
});

test('01415 maxDiscount is a hard server-side cap for percentage rules',()=>{
  const rule={...baseRule,discountType:'percent',discountValue:20,maxDiscount:300};
  const offer=evaluateAiConsultantSalesRule01415(rule,item(5000));
  assert.equal(offer.discountAmount,300);
  assert.equal(offer.finalPrice,4700);
});

test('01415 rules never stack and higher priority wins',()=>{
  const low={...baseRule,id:'low',priority:10,discountValue:300,maxDiscount:300};
  const high={...baseRule,id:'high',priority:200,discountValue:100,maxDiscount:100};
  const [product]=attachAiConsultantSalesOffers01415([item(3000)],[low,high],{discountsEnabled:true});
  assert.equal(product.offer.ruleId,'high');
  assert.equal(product.offer.discountAmount,100);
  assert.deepEqual(salesOfferSummary01415([product]),{offeredProducts:1,bestDiscount:100});
});

test('01415 discounts permission fully disables offers',()=>{
  const [product]=attachAiConsultantSalesOffers01415([item(3000)],[baseRule],{discountsEnabled:false});
  assert.equal(product.offer,null);
});

test('01415 existing promotional price is excluded by default',()=>{
  assert.equal(evaluateAiConsultantSalesRule01415(baseRule,{...item(3000),oldPrice:3500}),null);
  assert.ok(evaluateAiConsultantSalesRule01415({...baseRule,excludeDiscountedProducts:false},{...item(3000),oldPrice:3500}));
});

test('01415 currency and optional product/category scopes are enforced',()=>{
  assert.equal(evaluateAiConsultantSalesRule01415({...baseRule,currency:'USD'},item(3000)),null);
  assert.equal(evaluateAiConsultantSalesRule01415({...baseRule,productIds:['other']},item(3000)),null);
  assert.equal(evaluateAiConsultantSalesRule01415({...baseRule,categories:['Сковороди']},item(3000)),null);
  assert.ok(evaluateAiConsultantSalesRule01415({...baseRule,categories:['Казан']},item(3000)));
});
