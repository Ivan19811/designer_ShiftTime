import test from 'node:test';
import assert from 'node:assert/strict';
import {BUILTIN_TABLE_TEMPLATES_01092,createTableFromTemplate01092,getCellDropCompatibility01092,validateTableRecordValues01092,TABLE_FIELD_TYPES_01092} from '../js/tables/tables-schema-01092.js';

test('01092 field engine exposes the complete first-cycle typed column catalog',()=>{
  assert.equal(TABLE_FIELD_TYPES_01092.length,19);
  for(const type of ['text','number','currency','checkbox','select','multi-select','status','date','date-time','email','phone','url','image-file','user'])assert.ok(TABLE_FIELD_TYPES_01092.includes(type),type);
});

test('01092 strict typed cell drag blocks Date into Number/Text and accepts exact Date',()=>{
  assert.equal(getCellDropCompatibility01092('date','number').allowed,false);
  assert.equal(getCellDropCompatibility01092('date','text').allowed,false);
  assert.deepEqual(getCellDropCompatibility01092('date','date'),{allowed:true,mode:'exact',reason:'Типи збігаються'});
});

test('01092 template definitions produce valid records keyed by their typed fields',()=>{
  assert.equal(BUILTIN_TABLE_TEMPLATES_01092.length,6);
  const table=createTableFromTemplate01092('suppliers',{name:'Постачальники',scopeType:'account'});
  assert.equal(table.name,'Постачальники');
  assert.equal(table.scopeType,'account');
  assert.equal(table.fields.length,7);
  assert.equal(table.records.length,2);
  for(const record of table.records)assert.equal(validateTableRecordValues01092(table.fields,record.values).ok,true);
});

