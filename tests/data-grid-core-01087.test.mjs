import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDataGridModel01087,renderDataGridHtml01087} from '../js/data-grid/data-grid-core-01087.js';

test('normalizes columns and rows',()=>{
  const model=normalizeDataGridModel01087({columns:[{key:'name',label:'Name'},{key:'role'}],rows:[{name:'Ivan',role:'owner'}]});
  assert.equal(model.columns[0].label,'Name');
  assert.equal(model.columns[1].label,'role');
  assert.equal(model.rows.length,1);
});

test('escapes row values',()=>{
  const html=renderDataGridHtml01087(normalizeDataGridModel01087({columns:[{key:'name'}],rows:[{name:'<script>alert(1)</script>'}]}));
  assert.equal(html.includes('<script>'),false);
  assert.equal(html.includes('&lt;script&gt;'),true);
});

test('renders empty state',()=>{
  const html=renderDataGridHtml01087(normalizeDataGridModel01087({columns:[{key:'id'}],rows:[],emptyText:'Немає даних'}));
  assert.match(html,/Немає даних/);
});

test('supports custom cell renderer without escaping its returned trusted html',()=>{
  const model=normalizeDataGridModel01087({columns:[{key:'status',render:()=>'<b>OK</b>'}],rows:[{status:'active'}]});
  const html=renderDataGridHtml01087(model);
  assert.match(html,/<b>OK<\/b>/);
});
