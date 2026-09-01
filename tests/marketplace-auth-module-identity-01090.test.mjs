import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

function walk(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...walk(p));
    else if(entry.isFile()&&entry.name.endsWith('.js'))out.push(p);
  }
  return out;
}

test('01090 all browser consumers share one Marketplace Auth runtime module identity',()=>{
  const refs=[];
  for(const file of walk(path.join(root,'js'))){
    const text=fs.readFileSync(file,'utf8');
    for(const match of text.matchAll(/marketplace-auth-runtime-01084\.js(?:\?v=([^'"\s]+))?/g)){
      refs.push({file:path.relative(root,file),version:match[1]||''});
    }
  }
  assert.ok(refs.length>=4,'expected multiple Auth runtime consumers');
  const versions=[...new Set(refs.map(x=>x.version))];
  assert.deepEqual(versions,['01090'],`Auth runtime must be one ESM singleton URL; found ${JSON.stringify(refs)}`);
});
