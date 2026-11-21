import test from 'node:test';
import assert from 'node:assert/strict';
import {acceptedOfferSnapshot01416,validateAcceptedOfferSnapshot01416,effectiveAiCartPrice01416} from '../src/ai-consultant-offer-core-01416.mjs';

const item={id:'listing_1',listingId:'listing_1',sellerOfferId:'offer_1',price:2850,currency:'UAH'};
const offer={ruleId:'rule_1',basePrice:2850,discountAmount:100,finalPrice:2750,currency:'UAH'};

test('01416 accepted offer snapshot is one-product server snapshot with expiry',()=>{
  const snap=acceptedOfferSnapshot01416(item,offer,1_000,30*60*1000);
  assert.equal(snap.listingId,'listing_1');
  assert.equal(snap.sellerOfferId,'offer_1');
  assert.equal(snap.discountAmount,100);
  assert.equal(snap.finalPrice,2750);
  assert.equal(new Date(snap.expiresAt).getTime(),1_801_000);
});

test('01416 redeem validation rejects changed rule, price and expired token',()=>{
  const snap=acceptedOfferSnapshot01416(item,offer,1_000,30*60*1000);
  assert.deepEqual(validateAcceptedOfferSnapshot01416(snap,item,offer,2_000),{ok:true});
  assert.equal(validateAcceptedOfferSnapshot01416(snap,item,{...offer,discountAmount:200,finalPrice:2650},2_000).code,'AI_CONSULTANT_OFFER_CHANGED_01416');
  assert.equal(validateAcceptedOfferSnapshot01416(snap,{...item,sellerOfferId:'offer_2'},offer,2_000).code,'AI_CONSULTANT_OFFER_CHANGED_01416');
  assert.equal(validateAcceptedOfferSnapshot01416(snap,item,offer,2_000_000).code,'AI_CONSULTANT_OFFER_EXPIRED_01416');
});

test('01416 personal discount applies to exactly one cart unit',()=>{
  assert.deepEqual(effectiveAiCartPrice01416(2850,1,{discountAmount:100}),{baseUnitPrice:2850,unitPrice:2750,discountAmount:100,lineTotal:2750});
  assert.deepEqual(effectiveAiCartPrice01416(2850,2,{discountAmount:100}),{baseUnitPrice:2850,unitPrice:2850,discountAmount:0,lineTotal:5700});
});
