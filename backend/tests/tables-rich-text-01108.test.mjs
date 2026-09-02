import test from 'node:test';
import assert from 'node:assert/strict';
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
