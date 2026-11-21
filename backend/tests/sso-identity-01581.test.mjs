import test from 'node:test';
import assert from 'node:assert/strict';
import {ssoRedirectAllowed01581,validVerifier01581,validChallenge01581,validState01581,ssoChallenge01581,ssoCookieValue01581,readSsoCookie01581,ssoCookieHeader01581,clearSsoCookie01581,newSsoCode01581,hashSsoCode01581,appendSsoCallback01581} from '../src/sso-core-01581.mjs';
const allowed='crm=https://designer-shifttime.onrender.com/crm/,builder=http://127.0.0.1:5544/index.html,builder=http://127.0.0.1:5566/index.html';
const secret='a'.repeat(64);
test('only exact operator-specified per-client SSO callbacks',()=>{
 assert.equal(ssoRedirectAllowed01581('crm','https://designer-shifttime.onrender.com/crm/',allowed),true);
 assert.equal(ssoRedirectAllowed01581('builder','http://127.0.0.1:5544/index.html',allowed),true);
 for(const [client,url] of [['crm','http://127.0.0.1:5544/index.html'],['builder','https://designer-shifttime.onrender.com/crm/'],['crm','https://evil.example.com'],['crm','https://designer-shifttime.onrender.com/crm/?code=evil'],['crm','https://designer-shifttime.onrender.com/crm/#redirect'],['crm','javascript:alert(1)'],['crm','https://designer-shifttime.onrender.com.evil.test/crm/']])assert.equal(ssoRedirectAllowed01581(client,url,allowed),false,url);
 assert.equal(ssoRedirectAllowed01581('crm','https://designer-shifttime.onrender.com/crm/',''),false);
});
test('PKCE requires 43-128 safe verifier characters, SHA256 challenge',()=>{
 const verifier='a'.repeat(64),challenge=ssoChallenge01581(verifier);
 assert.equal(validVerifier01581(verifier),true);assert.equal(challenge.length,43);assert.equal(validChallenge01581(challenge),true);
 assert.equal(ssoChallenge01581('b'.repeat(64))===challenge,false);
 assert.equal(validVerifier01581('short'),false);assert.equal(validChallenge01581('short'),false);
 assert.equal(validState01581('a'.repeat(30)),true);assert.equal(validState01581('short'),false);
});
test('SSO cookie is HMAC-signed and HttpOnly SameSite Lax',()=>{
 const raw=ssoCookieValue01581('sess_1234567890123456789',secret);
 assert.equal(readSsoCookie01581(raw,secret),'sess_1234567890123456789');
 assert.equal(readSsoCookie01581(raw+'x',secret),'');assert.equal(readSsoCookie01581(raw,'b'.repeat(64)),'');
 const header=ssoCookieHeader01581('sess_1234567890123456789',secret);assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Lax/);assert.match(header,/Secure/);
 assert.match(clearSsoCookie01581(),/Max-Age=0/);
});
test('one-time codes are nontrivial random; callback only appends auth code not session Bearer',()=>{
 const a=newSsoCode01581(),b=newSsoCode01581();assert.notEqual(a,b);assert.equal(a.length,43);assert.notEqual(hashSsoCode01581(a),a);
 const url=appendSsoCallback01581('https://designer-shifttime.onrender.com/crm/',{code:a,state:'a'.repeat(30)});
 assert.equal(new URL(url).searchParams.get('code'),a);
});
