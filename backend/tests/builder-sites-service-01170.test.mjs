import test from 'node:test';
import assert from 'node:assert/strict';
import {createBuilderSitesService01170} from '../src/builder-sites-core-01170.mjs';

const scope={accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1'};

function fakeRepo(){
  const rows=new Map(); const calls=[];
  return {
    calls,
    seed(site){rows.set(site.id,structuredClone(site));},
    async list(){calls.push(['list']);return [...rows.values()].map(x=>structuredClone(x));},
    async get(_scope,id){calls.push(['get',id]);const row=rows.get(id);return row?structuredClone(row):null;},
    async create(_scope,userId,input){calls.push(['create',userId,input.id]);const row={id:input.id,name:input.name,slug:input.slug,description:input.description||'',status:'active',project:input.project||{},revision:1,ownerUserId:userId};rows.set(row.id,row);return structuredClone(row);},
    async save(_scope,userId,id,input){calls.push(['save',userId,id]);const prev=rows.get(id);if(!prev)return null;const row={...prev,...input,id,revision:Number(prev.revision||1)+1};rows.set(id,row);return structuredClone(row);},
    async getDeleteTarget(_scope,id){calls.push(['target',id]);const prev=rows.get(id);if(!prev)return null;return {id,netlifySiteId:prev.netlifySiteId||''};},
    async remove(_scope,id){calls.push(['remove',id]);return rows.delete(id);},
  };
}

test('01170 service lists/gets scoped cloud sites and preserves imported builder id',async()=>{
  const repo=fakeRepo();
  const service=createBuilderSitesService01170({repo,netlify:{}});
  const created=await service.create(scope,'user_1',{id:'site_legacy_1',name:'Legacy',slug:'legacy',project:{version:'01170'}});
  assert.equal(created.id,'site_legacy_1');
  assert.equal(created.revision,1);
  assert.equal((await service.list(scope)).length,1);
  assert.equal((await service.get(scope,'site_legacy_1')).name,'Legacy');
  const saved=await service.save(scope,'user_1','site_legacy_1',{name:'Legacy 2',slug:'legacy-2',project:{version:'01170',x:1}});
  assert.equal(saved.revision,2);
  assert.equal(saved.name,'Legacy 2');
});

test('01170 delete removes Netlify first, then cloud site',async()=>{
  const repo=fakeRepo();repo.seed({id:'site_1',name:'One',slug:'one',revision:1,netlifySiteId:'netlify_1'});
  const calls=[];
  const service=createBuilderSitesService01170({repo,netlify:{async deleteSite({siteId}){calls.push(['netlify',siteId]);return {deleted:true,alreadyMissing:false};}}});
  const out=await service.delete(scope,'user_1','site_1');
  assert.deepEqual(calls,[['netlify','netlify_1']]);
  assert.equal(repo.calls.at(-1)[0],'remove');
  assert.equal(out.deleted,true);
  assert.equal(out.netlify.deleted,true);
});

test('01170 delete treats Netlify 404 as already absent and still removes cloud site',async()=>{
  const repo=fakeRepo();repo.seed({id:'site_1',name:'One',slug:'one',revision:1,netlifySiteId:'netlify_missing'});
  const service=createBuilderSitesService01170({repo,netlify:{async deleteSite(){const e=new Error('Not found');e.netlifyStatus=404;e.statusCode=404;throw e;}}});
  const out=await service.delete(scope,'user_1','site_1');
  assert.equal(out.deleted,true);
  assert.equal(out.netlify.alreadyMissing,true);
  assert.equal(repo.calls.at(-1)[0],'remove');
});

test('01170 delete preserves cloud record when Netlify deletion fails',async()=>{
  const repo=fakeRepo();repo.seed({id:'site_1',name:'One',slug:'one',revision:1,netlifySiteId:'netlify_1'});
  const service=createBuilderSitesService01170({repo,netlify:{async deleteSite(){const e=new Error('Netlify unavailable');e.statusCode=502;throw e;}}});
  await assert.rejects(()=>service.delete(scope,'user_1','site_1'),/Netlify unavailable/);
  assert.equal(repo.calls.some(x=>x[0]==='remove'),false);
  assert.ok(await repo.get(scope,'site_1'));
});
