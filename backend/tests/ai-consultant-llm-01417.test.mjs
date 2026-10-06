import test from 'node:test';
import assert from 'node:assert/strict';
import {aiConsultantFreeConsultationSettings01417,buildAiConsultantGrounding01417,buildAiConsultantInstructions01417,buildAiConsultantInput01417,extractAiConsultantResponseText01417,usageFromAiConsultantResponse01417,selectAiConsultantGroundingItems01417} from '../src/ai-consultant-llm-core-01417.mjs';

test('01417 free consultation settings are opt-in and bounded',()=>{
  assert.deepEqual(aiConsultantFreeConsultationSettings01417({}),{enabled:false,maxCatalogItems:10,maxHistoryTurns:10});
  assert.deepEqual(aiConsultantFreeConsultationSettings01417({freeConsultationEnabled:true,freeConsultationMaxCatalogItems:999,freeConsultationMaxHistoryTurns:1}),{enabled:true,maxCatalogItems:20,maxHistoryTurns:2});
});

test('01417 grounding exposes verified commerce facts but strips internal product ids',()=>{
  const grounding=buildAiConsultantGrounding01417({site:{name:'Store'},items:[{id:'listing_secret',listingId:'listing_secret',sellerOfferId:'offer_secret',title:'Kazan 8L',price:2850,currency:'UAH',stock:3,availability:'in-stock',attributes:{volumeLiters:8},offer:{ruleId:'rule_secret',discountAmount:100,basePrice:2850,finalPrice:2750,currency:'UAH'}}],summary:{matched:1,returned:1}});
  const json=JSON.stringify(grounding);
  assert.match(json,/Kazan 8L/);
  assert.match(json,/"discountAmount":100/);
  assert.doesNotMatch(json,/listing_secret|offer_secret|rule_secret/);
});

test('01417 instructions enforce verified product facts and server offers',()=>{
  const instructions=buildAiConsultantInstructions01417();
  assert.match(instructions,/only VERIFIED_STORE_DATA/i);
  assert.match(instructions,/Never invent/i);
  assert.match(instructions,/offer/i);
  assert.match(instructions,/same language/i);
});

test('01417 model input keeps bounded history and appends verified store payload',()=>{
  const turns=Array.from({length:20},(_,i)=>({role:i%2?'assistant':'user',message:`turn-${i}`}));
  const input=buildAiConsultantInput01417({message:'need a pot',turns,grounding:{products:[{title:'Pot'}]},maxHistoryTurns:4});
  assert.equal(input.length,5);
  assert.equal(input[0].content,'turn-16');
  assert.match(input.at(-1).content,/CUSTOMER_MESSAGE:/);
  assert.match(input.at(-1).content,/VERIFIED_STORE_DATA:/);
});

test('01417 raw Responses API output text and token usage are parsed without SDK dependency',()=>{
  const payload={id:'resp_1',output:[{type:'message',content:[{type:'output_text',text:'Grounded answer'}]}],usage:{input_tokens:12,output_tokens:7,total_tokens:19}};
  assert.equal(extractAiConsultantResponseText01417(payload),'Grounded answer');
  assert.deepEqual(usageFromAiConsultantResponse01417(payload),{inputTokens:12,outputTokens:7,totalTokens:19});
});


test('01417 relaxed grounding recovers the real product term without breaking exact volume constraints',()=>{
  const docs=[
    {id:'l8',listingId:'l8',title:'Казан туристичний',attributes:{volume:'8 л'},price:1800,currency:'UAH',stock:3,availability:'in-stock'},
    {id:'l10',listingId:'l10',title:'Казан туристичний',attributes:{volume:'10 л'},price:1900,currency:'UAH',stock:4,availability:'in-stock'}
  ];
  const plan={tokens:['казан','краще','плову','людей'],textQuery:'казан краще плову людей',availability:'in-stock',minPrice:null,maxPrice:null,sort:'relevance',attributes:{volumeLiters:8},limit:12};
  const selected=selectAiConsultantGroundingItems01417({documents:docs,plan,strictResult:{total:0,items:[]},maxItems:10});
  assert.equal(selected.relaxed,true);
  assert.equal(selected.total,1);
  assert.equal(selected.items[0].listingId,'l8');
  assert.deepEqual(selected.matchedTokens,['казан']);
});
