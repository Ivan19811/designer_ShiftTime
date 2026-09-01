import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'js/account/account-studio-01085.js'),'utf8');

test('01090 login form exposes Chrome password-manager semantics',()=>{
  assert.match(source,/data-account-form="login"[^>]*autocomplete="on"[^>]*method="post"/);
  assert.match(source,/name="email"[^>]*type="email"[^>]*autocomplete="username"/);
  assert.match(source,/name="password"[^>]*type="password"[^>]*autocomplete="current-password"/);
});

test('01090 registration form exposes username plus new-password semantics',()=>{
  assert.match(source,/data-account-form="register"[^>]*autocomplete="on"[^>]*method="post"/);
  assert.match(source,/name="email"[^>]*type="email"[^>]*autocomplete="username"/);
  assert.match(source,/name="password"[^>]*type="password"[^>]*autocomplete="new-password"/);
});
