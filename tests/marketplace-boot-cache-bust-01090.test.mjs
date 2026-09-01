import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('01090 fresh boot reaches the updated Account/Admin modules',()=>{
  const src=read('js/builder-init.js');
  assert.match(src,/account-studio-01085\.js\?v=01090/);
  assert.match(src,/admin-studio-01087\.js\?v=01090/);
});

test('01090 Marketplace wrapper chain from 01070 through 01089 is cache-busted to this build',()=>{
  for(let n=70;n<=89;n++){
    if(n===88)continue; // no marketplace-studio-01088 wrapper; 01088 was Account context stage
    const file=`js/marketplace/marketplace-studio-01${String(n).padStart(3,'0')}.js`;
    if(!fs.existsSync(path.join(root,file)))continue;
    const src=read(file);
    const imports=[...src.matchAll(/from ['"]([^'"]+)['"]/g)].map(m=>m[1]).filter(x=>x.startsWith('./marketplace-studio-')||x.includes('marketplace-backend-')||x.includes('marketplace-multi-tenant-'));
    for(const spec of imports)assert.match(spec,/\?v=01090$/,`${file} -> ${spec}`);
  }
});
