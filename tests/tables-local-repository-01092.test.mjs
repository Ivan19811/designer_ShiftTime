import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalTableRepository01092} from '../js/tables/repositories/local-table-repository-01092.js';
import {createTableFromTemplate01092} from '../js/tables/tables-schema-01092.js';

function memoryStorage(){const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key),values};}

test('01092 LocalTableRepository persists Table/Field/Record CRUD without leaking storage into TableStore',async()=>{
  const storage=memoryStorage(),repo=new LocalTableRepository01092({storage});
  const created=await repo.createTable(createTableFromTemplate01092('inventory',{name:'Склад'}));
  const id=created.table.id;
  const rating=await repo.createField(id,{name:'Рейтинг',type:'number'});
  const bundle=await repo.getTable(id);
  const values=Object.fromEntries(bundle.fields.map(field=>[field.id,field.required?(field.type==='text'?'Новий запис':field.defaultValue):null]));
  const record=await repo.createRecord(id,{values});
  await repo.updateRecord(id,record.id,{values:{[rating.id]:5}});
  const after=await repo.getTable(id);
  assert.equal((await repo.listTables()).length,1);
  assert.equal(after.fields.length,8);
  assert.equal(after.records.length,3);
  assert.equal(after.records.find(item=>item.id===record.id).values[rating.id],5);
  assert.ok(storage.values.size>0);
});

