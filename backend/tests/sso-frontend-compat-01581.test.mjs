import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=async p=>(await readFile(new URL(p,import.meta.url),'utf8'));
test('CRM mounted as Render static assets with independent SSO browser client',async()=>{
 const html=await read('../public/crm/index.html'),auth=await read('../public/crm/widgets/admin/auth.js');
 assert.match(html,/ST_SSO_API_BASE_01581/);
 assert.match(auth,/\/auth\/login/);assert.match(auth,/\/auth\/session/);assert.match(auth,/ssoFinish01581/);
 assert.doesNotMatch(html,/super-secret-123/);assert.doesNotMatch(auth,/\bAPI_AUTH_URL\b/);
 assert.doesNotMatch(auth,/roles: \['owner'\]/);assert.doesNotMatch(auth,/Math\.random/);
});
test('Builder preserves its existing auth runtime and only accepts verified SSO exchange',async()=>{
 const auth=await read('../../js/marketplace/data/marketplace-auth-runtime-01084.js');
 const bridge=await read('../../js/account/builder-sso-bridge-01581.js');
 assert.match(auth,/acceptMarketplaceSsoSession01581/);assert.match(bridge,/ssoFinish01581/);
 assert.match(bridge,/login:success/);assert.match(bridge,/ssoEstablish01581/);
});
test('server guards SSO via session and explicit origin callback allowlist',async()=>{
 const core=await read('../src/sso-core-01581.mjs'),service=await read('../src/sso-service-01581.mjs'),server=await read('../src/server.mjs');
 assert.match(core,/SSO_ALLOWED_CALLBACKS/);assert.match(service,/ssoRedirectAllowed01581/);
 assert.match(service,/UPDATE platform_sso_codes_01581 SET consumed_at=now\(\)/);
 assert.match(server,/\/crm\//);assert.match(server,/ssoCookieHeader01581/);
});
