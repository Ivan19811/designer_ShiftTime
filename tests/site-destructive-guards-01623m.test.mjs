import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Inject the in-memory runner in tests; do not depend on installed pg or contact a database.
const serviceSource=readFileSync(new URL('../src/site-destructive-guards-01623m.mjs',import.meta.url),'utf8')
  .replace("import {withClient} from './db.mjs';",'const withClient = () => { throw new Error("No DB connection during unit tests"); };');
const {getSiteDeleteCheck01623M,deleteAllDraftRevisions01623M,assertSiteDeleteEmpty01623M}=await import('data:text/javascript;base64,'+Buffer.from(serviceSource).toString('base64'));
const scope={role:'owner',accountId:'a',workspaceId:'w',storeId:'s'};
function fakeDb({drafts=5,published=0,archived=0,protectedCount=0,forceMismatched=false}={}){
  const state={drafts,published,archived,committed:false,rolledBack:false,events:[],deleted:false};
  const c={async query(sql,args=[]){
    state.events.push(sql);
    if(sql==='BEGIN'||sql==='COMMIT'||sql==='ROLLBACK'){
      if(sql==='COMMIT')state.committed=true;
      if(sql==='ROLLBACK')state.rolledBack=true;
      return {rows:[],rowCount:0};
    }
    if(/pg_advisory_xact_lock/.test(sql))return {rows:[{}],rowCount:1};
    if(/SELECT id,name,slug FROM shifttime_builder_sites/.test(sql))return {rows:[{id:'site_1',name:'Test',slug:'test'}],rowCount:1};
    if(/COUNT\(\*\)::int total/.test(sql))return {rows:[{total:state.drafts+state.published+state.archived,drafts:state.drafts,published:state.published,archived:state.archived}],rowCount:1};
    if(/SELECT r.id FROM shifttime_builder_site_revisions/.test(sql))return {rows:protectedCount?[{id:'protected'}]:[],rowCount:protectedCount};
    if(/DELETE FROM shifttime_builder_site_revisions/.test(sql)){
      const n=state.drafts;state.deleted=true;state.drafts=forceMismatched?1:0;
      return {rows:Array.from({length:n},(_,i)=>({id:'r'+i})),rowCount:n};
    }
    throw new Error('Unexpected query: '+sql);
  }};
  return {state,run:async callback=>callback(c)};
}
test('01623M site with any kind of revisions may never pass site-delete preflight',async()=>{
  assert.throws(()=>assertSiteDeleteEmpty01623M({total:1}),{code:'ST_SITE_HAS_REVISIONS_01623M'});
  assert.doesNotThrow(()=>assertSiteDeleteEmpty01623M({total:0}));
  const f=fakeDb({drafts:5,published:1,archived:2});
  const result=await getSiteDeleteCheck01623M(scope,'site_1',f.run);
  assert.equal(result.canDelete,false);assert.equal(result.revisions.total,8);
});
test('01623M bulk 5 => 0 drafts with published version unchanged is atomic',async()=>{
  const f=fakeDb({drafts:5,published:1,archived:1});
  const result=await deleteAllDraftRevisions01623M(scope,'site_1',{confirmation:'ВИДАЛИТИ ВСІ РЕДАКЦІЇ',expectedCount:5},f.run);
  assert.equal(result.deletedCount,5);assert.equal(result.remaining.total,2);
  assert.equal(result.remaining.published,1);assert.equal(result.remaining.archived,1);
  assert.equal(f.state.committed,true);assert.equal(f.state.rolledBack,false);
});
test('01623M bulk denies stale counts and rolls back without deleting anything',async()=>{
  const f=fakeDb({drafts:5});
  await assert.rejects(()=>deleteAllDraftRevisions01623M(scope,'site_1',{confirmation:'ВИДАЛИТИ ВСІ РЕДАКЦІЇ',expectedCount:4},f.run),{code:'ST_REVISION_BULK_STALE_01623M'});
  assert.equal(f.state.deleted,false);assert.equal(f.state.rolledBack,true);
});
test('01623M protected reviewed drafts block entire bulk before any delete',async()=>{
  const f=fakeDb({drafts:5,protectedCount:1});
  await assert.rejects(()=>deleteAllDraftRevisions01623M(scope,'site_1',{confirmation:'ВИДАЛИТИ ВСІ РЕДАКЦІЇ',expectedCount:5},f.run),{code:'ST_REVISION_BULK_PROTECTED_01623M'});
  assert.equal(f.state.deleted,false);assert.equal(f.state.rolledBack,true);
});
test('01623M guards bulk against managers and wrong confirmation',async()=>{
  const f=fakeDb({drafts:3});
  await assert.rejects(()=>deleteAllDraftRevisions01623M({...scope,role:'manager'},'site_1',{confirmation:'ВИДАЛИТИ ВСІ РЕДАКЦІЇ',expectedCount:3},f.run),{code:'ST_SITE_DELETE_OWNER_ONLY_01623M'});
  await assert.rejects(()=>deleteAllDraftRevisions01623M(scope,'site_1',{confirmation:'yes',expectedCount:3},f.run),{code:'ST_REVISION_BULK_CONFIRM_REQUIRED_01623M'});
  assert.equal(f.state.events.length,0);
});
test('01623M mismatch after bulk triggers rollback',async()=>{
  const f=fakeDb({drafts:3,forceMismatched:true});
  await assert.rejects(()=>deleteAllDraftRevisions01623M(scope,'site_1',{confirmation:'ВИДАЛИТИ ВСІ РЕДАКЦІЇ',expectedCount:3},f.run),{code:'ST_REVISION_BULK_SCOPE_MISMATCH_01623M'});
  assert.equal(f.state.rolledBack,true);
});
test('01623M server requires exact site confirmation; repo protects FK cascades',()=>{
  const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  const repo=readFileSync(new URL('../src/builder-sites-service-01170.mjs',import.meta.url),'utf8');
  assert.match(server,/input.confirmSiteId!==siteId\|\|input.confirmSiteName!==check.siteName/);
  assert.match(server,/if\(!check.canDelete\)/);
  assert.match(repo,/SELECT COUNT\(\*\)::int AS total FROM shifttime_builder_site_revisions/);
  assert.match(repo,/FOR UPDATE/);
  assert.match(repo,/ST_SITE_HAS_REVISIONS_01623M/);
});
