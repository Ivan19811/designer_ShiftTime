import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(p));else if(e.isFile()&&e.name.endsWith('.js'))out.push(p);}return out;}
function versionsFor(target){const refs=[];const escaped=target.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const re=new RegExp(`${escaped}(?:\\?v=([^'"\\s]+))?`,'g');for(const file of walk(path.join(root,'js'))){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(re))refs.push({file:path.relative(root,file),version:m[1]||''});}return refs;}

for(const target of ['marketplace-backend-runtime-01071.js','marketplace-tenant-runtime-01070.js']){
  test(`01090 ${target} has one ESM singleton URL across all consumers`,()=>{
    const refs=versionsFor(target);assert.ok(refs.length>=2,`expected multiple consumers of ${target}`);
    assert.deepEqual([...new Set(refs.map(x=>x.version))],['01090'],JSON.stringify(refs));
  });
}
