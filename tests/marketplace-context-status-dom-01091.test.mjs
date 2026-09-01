import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const mod=await import('../js/marketplace/data/marketplace-context-status-01091.js').catch(()=>({}));

test('01091 system status model reports actual API repository under Real Auth',()=>{
  assert.equal(typeof mod.resolveMarketplaceSystemStatus01091,'function');
  const out=mod.resolveMarketplaceSystemStatus01091({
    stage:'01091',
    repository:{type:'api-scoped',name:'ApiMarketplaceRepository01071'},
    summary:{schemaVersion:1,revision:27},
    productEditorLive:true,
    categoryEditorLive:true
  });
  assert.deepEqual(out,{
    stage:'01091',
    repository:'api-scoped',
    productEditor:'CRUD LIVE',
    categoryEditor:'CRUD LIVE',
    revision:'27'
  });
});

test('01091 active Store badge uses current build stage for server context',()=>{
  assert.equal(typeof mod.activeStoreStageLabel01091,'function');
  assert.equal(mod.activeStoreStageLabel01091({source:'real-auth',buildStage:'01091'}),'01091 · SERVER');
  assert.equal(mod.activeStoreStageLabel01091({source:'local',buildStage:'01091'}),'01070 · LOCAL');
});

test('01091 persistent Marketplace renderers no longer address global context metrics by numeric index',()=>{
  for(const rel of [
    'js/marketplace/marketplace-studio-01052.js',
    'js/marketplace/marketplace-product-editor-01053.js',
    'js/marketplace/marketplace-category-editor-01057.js'
  ]){
    const text=read(rel);
    assert.doesNotMatch(text,/studio\.querySelectorAll\(['"]\.mp-context__metric['"]\)/,rel);
    assert.doesNotMatch(text,/metrics\?*\[[0-3]\]/,rel);
  }
});

test('01091 Marketplace base context exposes stable semantic metric keys',()=>{
  const text=read('js/marketplace/marketplace-studio-01051.js');
  for(const key of ['stage','repository','product-editor','category-editor','revision']){
    assert.match(text,new RegExp(`data-mp-system-metric=["']${key}["']`),key);
  }
});

test('01091 post-multi-tenant stage wrappers never write global context metrics by position',()=>{
  const files=fs.readdirSync(path.join(root,'js/marketplace'))
    .filter(name=>/^marketplace-studio-010(?:7\d|8\d|90)\.js$/.test(name));
  assert.ok(files.length>=15);
  for(const name of files){
    const rel=`js/marketplace/${name}`;
    const text=read(rel);
    assert.doesNotMatch(text,/studio\.querySelectorAll\(['"]\.mp-context__metric['"]\)/,rel);
  }
});
