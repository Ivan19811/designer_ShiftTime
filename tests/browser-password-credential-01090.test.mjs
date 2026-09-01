import test from 'node:test';
import assert from 'node:assert/strict';

const mod=await import('../js/account/browser-password-manager-01090.js').catch(()=>({}));

test('01090 hands successful credentials to the browser password manager without app persistence',async()=>{
  assert.equal(typeof mod.offerBrowserPasswordSave01090,'function');
  const stored=[];
  class FakePasswordCredential{constructor(data){Object.assign(this,data);}}
  const env={PasswordCredential:FakePasswordCredential,navigator:{credentials:{store:async credential=>{stored.push(credential);return credential;}}}};
  const ok=await mod.offerBrowserPasswordSave01090({email:'User@Example.com',password:'secret-123',name:'User'},env);
  assert.equal(ok,true);
  assert.equal(stored.length,1);
  assert.equal(stored[0].id,'user@example.com');
  assert.equal(stored[0].password,'secret-123');
  assert.equal(stored[0].name,'User');
});

test('01090 browser password save is best-effort when Credential Management API is unavailable',async()=>{
  assert.equal(typeof mod.offerBrowserPasswordSave01090,'function');
  assert.equal(await mod.offerBrowserPasswordSave01090({email:'a@b.com',password:'x'},{}),false);
});
