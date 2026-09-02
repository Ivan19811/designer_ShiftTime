import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateTableRecordValues01092} from '../src/tables-field-types-01092.mjs';

const field={id:'f_note',name:'Нотатка',type:'text'};
const rich={kind:'st-rich-text',version:1,appearance:{blockThemeMode:'custom',blockThemeId:'matrix',baseStyleSource:'theme',baseStyle:null},nodes:[{id:'n1',kind:'text',text:'Очікую '},{id:'n2',kind:'composite',templateId:'setup',themeSlot:'neutral',styleSource:'theme',style:{backgroundColor:'#000000'},levels:[{id:'l1',key:'tf',label:'Таймфрейм',value:'M5',options:['M5','H1'],themeSlot:'accent-1'},{id:'l2',key:'setup',label:'Сетап',value:'FVG',options:['FVG','GAP'],themeSlot:'accent-2'}]}]};

test('01108 backend preserves rich text objects for text fields instead of stringifying them',()=>{
  const out=validateTableRecordValues01092([field],{f_note:rich});
  assert.equal(out.ok,true);
  assert.equal(out.values.f_note.kind,'st-rich-text');
  assert.equal(out.values.f_note.appearance.blockThemeId,'matrix');
  assert.equal(out.values.f_note.nodes[1].levels[0].value,'M5');
  assert.notEqual(out.values.f_note,'[object Object]');
});

test('01108 backend rejects arbitrary object values for text fields',()=>{
  const out=validateTableRecordValues01092([field],{f_note:{html:'<script>alert(1)</script>'}});
  assert.equal(out.ok,false);
});

test('01108 backend still accepts legacy text strings unchanged',()=>{
  const out=validateTableRecordValues01092([field],{f_note:'Звичайний текст'});
  assert.equal(out.ok,true);
  assert.equal(out.values.f_note,'Звичайний текст');
});


test('01108 table bundle advertises rich text persistence capability',async()=>{
  const fs=await import('node:fs');
  const service=fs.readFileSync(new URL('../src/tables-service-01092.mjs',import.meta.url),'utf8');
  assert.match(service,/tablesRichTextVersion\s*:\s*TABLE_RICH_TEXT_VERSION_01108/);
});

test('server advertises 01108 rich text capability on the tables collection route',()=>{
  const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  assert.match(server,/TABLE_RICH_TEXT_VERSION_01108/);
  assert.match(server,/tablesRichTextVersion\s*:\s*TABLE_RICH_TEXT_VERSION_01108/);
  assert.match(server,/stage\s*:\s*'01108'/);
});
