import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCheckoutDraftInput01554,createCheckoutDraft01554} from '../src/shipping-checkout-draft-01554.mjs';

const read = filename => readFileSync(new URL('../sql/'+filename,import.meta.url),'utf8');
const migration = read('057_checkout_draft_packing_revision_01569.sql');
const legacy = read('047_shipping_checkout_drafts_01554.sql');
const key = '550e8400-e29b-41d4-a716-446655440000';
const ref = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const scope = {userId:'user_test',storeId:'store_test',workspaceId:'ws_test',accountId:'acc_test'};
const cartId = 'cart_'+ 'a'.repeat(32);
const input = () => ({idempotencyKey:key,siteId:'site_test',cartId,cityRecipient:ref,warehouseRef:ref,
  expectedPackingRevision:0,expectedPlaces:2,expectedPrice:281,expectedWeightKg:10.5,expectedDeclaredValue:2200});

test('01569 keeps applied 047 checksum unchanged and fixes only packing revision CHECK', () => {
  assert.match(legacy,/CHECK\s*\(packing_revision\s*>=\s*1\)/i);
  assert.match(migration,/^BEGIN\s*;/m);
  assert.match(migration,/ALTER\s+TABLE\s+shifttime_checkout_drafts_01554\s+DROP\s+CONSTRAINT\s+IF\s+EXISTS\s+shifttime_checkout_drafts_01554_packing_revision_check\s*;/i);
  assert.match(migration,/ADD\s+CONSTRAINT\s+shifttime_checkout_drafts_01554_packing_revision_check\s+CHECK\s*\(packing_revision\s*>=\s*0\)/i);
  assert.match(migration,/COMMIT\s*;/i);
  assert.doesNotMatch(migration,/\b(delete\s+from|truncate|drop\s+table|update\s+|insert\s+into)\b/i);
  assert.doesNotMatch(migration,/\b(order|payment|waybill|ttn|crm|contact)_\w*\s*(set|drop)/i);
});

test('01569 preflight and checkout-draft validation both accept revision 0 but reject negative', () => {
  assert.equal(validateCheckoutDraftInput01554(input()).expectedPackingRevision,0);
  assert.throws(() => validateCheckoutDraftInput01554({...input(),expectedPackingRevision:-1}), /NP_PREFLIGHT_REVISION_INVALID_01553/);
});

test('01569 creating an automatic packing draft inserts revision 0 unchanged and no order', async () => {
  const seen = [];
  const fakeDraft = {id:'orderdraft_'+ 'f'.repeat(32),created_at:new Date('2026-10-24T10:00:00Z'),
    subtotal_cents:220000,provisional_delivery_cents:28100,provisional_total_cents:248100,
    total_weight_grams:10500,number_of_packages:2};
  const result = await createCheckoutDraft01554(scope,input(),{
    lookup:async()=>null,
    preflight:async()=>({preflightPassed:true,canPlaceOrder:false,subtotal:2200,shippingCost:281,
      estimatedTotal:2481,weightKg:10.5,numberOfPackages:2,_draftContext:{
        cartFingerprint:'a'.repeat(64),packingFingerprint:'b'.repeat(64),cart:{items:[{id:'one'}]},
        plan:{savedRevision:0,saved:false,layoutStale:false,packages:[
          {id:'package1',main:{itemId:'one'},accessories:[],dimensions:[50,50,15],weightKg:6},
          {id:'package2',main:{itemId:'two'},accessories:[],dimensions:[40,40,10],weightKg:4.5}
        ]}
      }}),
    transaction:async callback=>callback({query:async(sql,args)=>{seen.push({sql,args});return {rowCount:1,rows:[fakeDraft]};}}),
    snapshot:async()=>[{itemId:'one',quantity:1,unitPriceCents:220000}],
    newId:()=>fakeDraft.id
  });
  assert.equal(seen.length,1);
  assert.match(seen[0].sql,/INSERT INTO shifttime_checkout_drafts_01554/);
  assert.equal(seen[0].args[11],0);
  assert.equal(result.draftId,fakeDraft.id);
  assert.equal(result.canPlaceOrder,false);
  assert.equal(result.canPay,false);
  assert.equal(result.waybillCreated,false);
  assert.equal(result.crmSynced,false);
});
