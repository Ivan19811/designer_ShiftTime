import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Deterministic, injected fake DB: no access to a real PostgreSQL cluster.
const src=readFileSync(new URL('../src/site-destructive-guards-01623m.mjs',import.meta.url),'utf8')
  .replace("import {withClient} from './db.mjs';",'const withClient=()=>{throw new Error("No database in tests")};');
const {getSiteDeleteCheck01623M,deleteAllDraftRevisions01623M,assertSiteDeleteEmpty01623M}=
  await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const scope={role:'owner',accountId:'a',workspaceId:'w',storeId:'s'};
const ids=(prefix,count)=>Array.from({length:count},(_,i)=>`rev_${prefix}${i+1}`);
const confirmed='ВИДАЛИТИ ВСІ РЕДАКЦІЇ';
function fakeDb({ownerIds=ids('own',5),foreignIds=ids('manager',6),published=1,archived=1,protectedCount=0,forceMismatched=false}={}){
  const state={own:[...ownerIds],foreign:[...foreignIds],published,archived,events:[],committed:false,rolledBack:false,deleted:false};
  const c={async query(sql,args=[]){
    state.events.push({sql,args});
    if(['BEGIN','COMMIT','ROLLBACK'].includes(sql)){
      if(sql==='COMMIT')state.committed=true;
      if(sql==='ROLLBACK')state.rolledBack=true;
      return {rows:[],rowCount:0};
    }
    if(/pg_advisory_xact_lock/.test(sql))return {rows:[{}],rowCount:1};
    if(/SELECT id,name,slug FROM shifttime_builder_sites/.test(sql))return {rows:[{id:'site_1',name:'Test',slug:'test'}],rowCount:1};
    if(/COUNT\(\*\)::int total/.test(sql))return {rows:[{
      total:state.own.length+state.foreign.length+state.published+state.archived,
      drafts:state.own.length+state.foreign.length,published:state.published,archived:state.archived}],rowCount:1};
    if(/SELECT id FROM shifttime_builder_site_revisions\s+WHERE site_id=\$1 AND kind='draft' AND created_by_user_id=\$2/.test(sql))
      return {rows:state.own.map(id=>({id})),rowCount:state.own.length};
    if(/SELECT r.id FROM shifttime_builder_site_revisions r/.test(sql))return {rows:protectedCount?[{id:'rev_protected'}]:[],rowCount:protectedCount};
    if(/DELETE FROM shifttime_builder_site_revisions/.test(sql)){
      assert.equal(args[2],'owner_user');
      assert.deepEqual([...args[1]].sort(),[...state.own].sort());
      const n=state.own.length;state.deleted=true;state.own=forceMismatched?['rev_left']:[];
      return {rows:ids('own',n).map(id=>({id})),rowCount:n};
    }
    throw new Error('Unexpected query: '+sql);
  }};
  return {state,run:async cb=>cb(c)};
}
async function remove(f,selected=f.state.own,{owner=scope,userId='owner_user',confirm=confirmed}={}){
  return deleteAllDraftRevisions01623M(owner,'site_1',
    {confirmation:confirm,expectedCount:selected.length,revisionIds:selected},f.run,userId);
}
test('01647 single-site preflight never deletes a site with any revision',async()=>{
  assert.throws(()=>assertSiteDeleteEmpty01623M({total:1}),{code:'ST_SITE_HAS_REVISIONS_01623M'});
  assert.doesNotThrow(()=>assertSiteDeleteEmpty01623M({total:0}));
  const f=fakeDb();const response=await getSiteDeleteCheck01623M(scope,'site_1',f.run);
  assert.equal(response.canDelete,false);assert.equal(response.revisions.total,13);
});
test('01647 selected 5 owner drafts delete atomically while all 6 manager drafts survive',async()=>{
  const f=fakeDb();const result=await remove(f);
  assert.equal(result.deletedCount,5);assert.equal(result.remaining.drafts,6);
  assert.equal(result.remaining.published,1);assert.equal(result.remaining.archived,1);
  assert.equal(f.state.foreign.length,6);assert.equal(f.state.committed,true);assert.equal(f.state.rolledBack,false);
});
test('01647 stale, omitted or forged list never deletes any draft',async()=>{
  for(const selected of [ids('own',4),[...ids('own',4),'rev_manager1'],ids('own',6)]){
    const f=fakeDb();await assert.rejects(()=>remove(f,selected),{code:'ST_REVISION_BULK_STALE_01647'});
    assert.equal(f.state.deleted,false);assert.equal(f.state.rolledBack,true);
  }
});
test('01647 any protected reviewed owner draft aborts entire transaction',async()=>{
  const f=fakeDb({protectedCount:1});
  await assert.rejects(()=>remove(f),{code:'ST_REVISION_BULK_PROTECTED_01623M'});
  assert.equal(f.state.deleted,false);assert.equal(f.state.rolledBack,true);
});
test('01647 manager, missing actor, duplicates and weak confirmation are rejected before DB',async()=>{
  for(const options of [{owner:{...scope,role:'manager'}},{userId:''},{confirm:'yes'}]){
    const f=fakeDb();await assert.rejects(()=>remove(f,f.state.own,options));assert.equal(f.state.events.length,0);
  }
  const f=fakeDb();await assert.rejects(()=>remove(f,['rev_own1','rev_own1']),{code:'ST_REVISION_BULK_CONFIRM_REQUIRED_01647'});
  assert.equal(f.state.events.length,0);
});
test('01647 unexpected after-count causes rollback before a commit',async()=>{
  const f=fakeDb({forceMismatched:true});
  await assert.rejects(()=>remove(f),{code:'ST_REVISION_BULK_SCOPE_MISMATCH_01623M'});
  assert.equal(f.state.rolledBack,true);assert.equal(f.state.committed,false);
});
test('01647 server passes authenticated author to scoped delete; direct site delete remains blocked',()=>{
  const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  const repo=readFileSync(new URL('../src/builder-sites-service-01170.mjs',import.meta.url),'utf8');
  assert.match(server,/deleteAllDraftRevisions01623M\(scope,siteId,payload,undefined,session.userId\)/);
  assert.match(server,/input.confirmSiteId!==siteId\|\|input.confirmSiteName!==check.siteName/);
  assert.match(server,/if\(!check.canDelete\)/);
  assert.match(repo,/ST_SITE_HAS_REVISIONS_01623M/);
});
