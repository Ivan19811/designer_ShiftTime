import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeGoogleSheetValues01398} from '../src/google-sheets-oauth-core-01398.mjs';

const read=rel=>readFile(new URL(rel,import.meta.url),'utf8');

test('01398 migration stores encrypted refresh credentials and one-use OAuth state per Store/User',async()=>{
  const migration=await read('../sql/025_google_sheets_oauth.sql');
  assert.match(migration,/CREATE TABLE IF NOT EXISTS integration_google_oauth_credentials/);assert.match(migration,/refresh_token_encrypted text NOT NULL/);assert.match(migration,/UNIQUE\(store_id,user_id,provider\)/);assert.match(migration,/CREATE TABLE IF NOT EXISTS integration_google_oauth_states/);assert.match(migration,/state_hash text PRIMARY KEY/);assert.match(migration,/consumed_at timestamptz/);
  assert.doesNotMatch(migration,/\brefresh_token\s+text/i);assert.doesNotMatch(migration,/\baccess_token\s+text/i);
});

test('01398 backend OAuth service uses readonly scope, offline code flow, hashed state and AES-256-GCM encrypted refresh tokens',async()=>{
  const source=await read('../src/google-sheets-oauth-01398.mjs');
  assert.match(source,/spreadsheets\.readonly/);assert.match(source,/access_type','offline/);assert.match(source,/prompt','consent/);assert.match(source,/sha256\(state\)/);assert.match(source,/createCipheriv\('aes-256-gcm'/);assert.match(source,/refresh_token_encrypted/);assert.match(source,/grant_type:'refresh_token'/);assert.match(source,/sheets\.googleapis\.com\/v4\/spreadsheets/);
});

test('01398 callback is handled before Bearer authentication while status/start/read/disconnect remain authenticated Store routes',async()=>{
  const server=await read('../src/server.mjs');const callback=server.indexOf("p[5]==='callback'");const auth=server.indexOf('const session=await authenticateRequest(req)');
  assert.ok(callback>=0&&auth>=0&&callback<auth);assert.match(server,/p\[5\]==='status'/);assert.match(server,/startGoogleSheetsOAuth01398/);assert.match(server,/readPrivateGoogleSheet01398/);assert.match(server,/disconnectGoogleSheetsOAuth01398/);assert.match(server,/assertWriteRole\(scope\)/);assert.match(server,/st:google-sheets-oauth:01398/);
});

test('01398 pure Sheets values normalizer deduplicates headers, names blanks and drops empty data rows',()=>{
  const out=normalizeGoogleSheetValues01398([['SKU','SKU',''],['A','A2','Pan'],['','',''],['B','','Lid']]);
  assert.deepEqual(out.headers,['SKU','SKU 2','Column 3']);assert.equal(out.rows.length,2);assert.deepEqual(out.rows[0],{SKU:'A','SKU 2':'A2','Column 3':'Pan'});assert.deepEqual(out.rows[1],{SKU:'B','SKU 2':'','Column 3':'Lid'});
});

test('01398 Render env template contains Google OAuth server secrets and exact callback variable',async()=>{
  const env=await read('../.env.example');assert.match(env,/GOOGLE_OAUTH_CLIENT_ID=/);assert.match(env,/GOOGLE_OAUTH_CLIENT_SECRET=/);assert.match(env,/GOOGLE_OAUTH_REDIRECT_URI=https:\/\/designer-shifttime\.onrender\.com\/api\/v1\/integrations\/google-sheets\/oauth\/callback/);assert.match(env,/GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY=/);
});

test('01398 backend package check includes OAuth core and service syntax checks',async()=>{
  const pkg=await read('../package.json');assert.match(pkg,/google-sheets-oauth-core-01398\.mjs/);assert.match(pkg,/google-sheets-oauth-01398\.mjs/);
});
