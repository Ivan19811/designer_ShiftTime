import test from 'node:test';
import assert from 'node:assert/strict';
import {getCellDropCompatibility01092,normalizeTableField01092,normalizeTableStoredValue01094,validateTableRecordValues01092} from '../src/tables-field-types-01092.mjs';

test('01092 backend repeats strict typed drag compatibility instead of trusting the browser',()=>{
  assert.equal(getCellDropCompatibility01092('date','text').allowed,false);
  assert.equal(getCellDropCompatibility01092('date','number').allowed,false);
  assert.equal(getCellDropCompatibility01092('date','date').allowed,true);
});

test('01092 backend field validation normalizes numeric, email and date values',()=>{
  const fields=[normalizeTableField01092({id:'f_name',name:'Назва',type:'text',required:true}),normalizeTableField01092({id:'f_total',name:'Сума',type:'currency'}),normalizeTableField01092({id:'f_email',name:'Email',type:'email'}),normalizeTableField01092({id:'f_date',name:'Дата',type:'date'})];
  const valid=validateTableRecordValues01092(fields,{f_name:'Замовлення',f_total:'1250.50',f_email:'USER@EXAMPLE.COM',f_date:'2026-09-01'});
  assert.equal(valid.ok,true);
  assert.equal(valid.values.f_total,1250.5);
  assert.equal(valid.values.f_email,'user@example.com');
  assert.equal(validateTableRecordValues01092(fields,{f_name:'X',f_date:'not-a-date'}).ok,false);
  assert.equal(validateTableRecordValues01092(fields,{f_name:'X',unknown:'value'}).ok,false);
});

test('01094 repairs legacy empty-object defaults without changing real values',()=>{
  assert.equal(normalizeTableStoredValue01094({}),null);
  assert.equal(normalizeTableField01092({id:'f_email',name:'Email',type:'email',defaultValue:{}}).defaultValue,null);
  assert.deepEqual(normalizeTableStoredValue01094([]),[]);
  assert.equal(normalizeTableStoredValue01094('value'),'value');
});
