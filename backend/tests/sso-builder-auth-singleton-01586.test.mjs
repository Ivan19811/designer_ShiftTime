import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = p=>readFile(new URL(p,import.meta.url),'utf8');
const AUTH_PATH='marketplace-auth-runtime-01084.js';

test('01586: builder CRM bridge uses the exact same ES module URL as the logged-in account', async()=>{
  const [bridge,account,profile,html] = await Promise.all([
    read('../../js/account/builder-sso-bridge-01581.js'),
    read('../../js/account/account-studio-01085.js'),
    read('../../js/account/site-account-profile-01579.js'),
    read('../../index.html'),
  ]);
  const version = file=>{
    const occurrences=[...file.matchAll(/marketplace-auth-runtime-01084\.js\?v=(\d+)/g)].map(m=>m[1]);
    assert.ok(occurrences.length>0,'Expected an auth runtime import');
    return occurrences;
  };
  const a=version(account),p=version(profile),b=version(bridge);
  assert.deepEqual([...new Set([...a,...p,...b])], ['01090'], 'Separate ESM URLs split the token and auth state');
  assert.match(bridge, /getMarketplaceAuthState01084\(\)/);
  assert.match(bridge, /loginRequired/);
  assert.match(bridge, /ssoEstablish01581/);
  assert.match(bridge, /clientId,uri/);
  assert.match(html, /builder-sso-bridge-01581\.js\?v=01590/,'Bridge cache must be refreshed' );
});

test('01586: the auth runtime URL matches all other app-wide auth imports', async()=>{
  const {readdir}=await import('node:fs/promises');
  const {join}=await import('node:path');
  const base=new URL('../../js/',import.meta.url);
  let mismatches=[];
  async function walk(path){
    for(const e of await readdir(path,{withFileTypes:true})){
      const name=join(path,e.name);
      if(e.isDirectory()){await walk(name);continue;}
      if(!e.isFile()||!e.name.endsWith('.js'))continue;
      const src=await readFile(name,'utf8');
      for(const m of src.matchAll(/marketplace-auth-runtime-01084\.js\?v=(\d+)/g))if(m[1]!=='01090')mismatches.push([name,m[1]]);
    }
  }
  await walk(base.pathname);
  assert.deepEqual(mismatches,[],'Found duplicate JS auth runtime versions: '+JSON.stringify(mismatches));
});
