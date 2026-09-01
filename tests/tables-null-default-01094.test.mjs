import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTableField01092,normalizeTableStoredValue01094,validateTableRecordValues01092} from '../js/tables/tables-schema-01092.js';

test('01094 treats the legacy empty-object default as an empty table value',()=>{
  assert.equal(normalizeTableStoredValue01094({}),null);
  assert.equal(normalizeTableStoredValue01094(null),null);
  assert.deepEqual(normalizeTableStoredValue01094([]),[]);
  assert.equal(normalizeTableField01092({id:'f_email',name:'Email',type:'email',defaultValue:{}}).defaultValue,null);
});

test('01094 permits a new row with an optional email after default repair',()=>{
  const fields=[
    normalizeTableField01092({id:'f_name',name:'Клієнт',type:'text',required:true}),
    normalizeTableField01092({id:'f_email',name:'Email',type:'email',defaultValue:{}}),
  ];
  const result=validateTableRecordValues01092(fields,{f_name:'Новий запис',f_email:null});
  assert.equal(result.ok,true);
  assert.deepEqual(result.values,{f_name:'Новий запис',f_email:null});
});
