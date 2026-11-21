import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../../',import.meta.url);
const source=fs.readFileSync(new URL('js/account/auth-reload-trace-01590.js',root),'utf8');
const html=fs.readFileSync(new URL('index.html',root),'utf8');
const auth=fs.readFileSync(new URL('js/marketplace/data/marketplace-auth-runtime-01084.js',root),'utf8');
const bridge=fs.readFileSync(new URL('js/account/builder-sso-bridge-01581.js',root),'utf8');
const browser=fs.readFileSync(new URL('js/account/sso-browser-01581.js',root),'utf8');
const reporter=fs.readFileSync(new URL('js/ai-design-debug-log.js',root),'utf8');
const mem=new Map();
function createEnv(){
 const listeners={};const dlisteners={};
 const storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
 const w={sessionStorage:storage,performance:{getEntriesByType:()=>[{type:'reload'}]},addEventListener:(name,fn)=>{(listeners[name]??=[]).push(fn)}};
 const d={addEventListener:(name,fn)=>{(dlisteners[name]??=[]).push(fn)}};
 vm.runInNewContext(source,{window:w,document:d,Date,JSON,String,Object,Array});
 return {w,d,listeners,dlisteners};
}
test('01590 records navigation lifecycle across same-tab reload',()=>{
 mem.clear();const a=createEnv();
 a.listeners.beforeunload[0]();
 const b=createEnv();
 const events=b.w.ST_AUTH_RELOAD_TRACE_01590.get().map(x=>x.event);
 assert.deepEqual(Array.from(events).slice(-3),['document.boot','document.beforeunload','document.boot']);
});
test('01590 capture prevents native account form navigation even if mount is absent',()=>{
 const env=createEnv();let prevented=false;
 const form={getAttribute:(name)=>name==='data-account-form'?'login':'post'};
 env.dlisteners.submit[0]({target:{closest:()=>form},preventDefault(){prevented=true}});
 assert.equal(prevented,true);
 assert.equal(env.w.ST_AUTH_RELOAD_TRACE_01590.get().at(-1).event,'auth.form.submit');
});
test('01590 does not store credentials or redirect URLs',()=>{
 const env=createEnv();env.w.ST_AUTH_RELOAD_TRACE_01590.mark('login',{password:'topsecret',token:'secret2',url:'https://with-code?code=TOPSECRET',status:'authenticated'});
 const rows=JSON.stringify(env.w.ST_AUTH_RELOAD_TRACE_01590.get());
 for(const sensitive of ['topsecret','secret2','TOPSECRET'])assert.equal(rows.includes(sensitive),false);
});
test('01590 report includes persistent recorder and early installation',()=>{
 assert.ok(html.indexOf('auth-reload-trace-01590.js')<html.indexOf('builder-init.js'));
 assert.match(reporter,/AUTH \/ RELOAD FLIGHT RECORDER 01590/);
 assert.match(auth,/auth.runtime.emit/);
 assert.match(browser,/sso.establish.navigate/);
 assert.match(browser,/sso.authorize.navigate/);
 assert.doesNotMatch(bridge,/handoff\(\s*['"]builder['"]/);
 assert.match(html,/builder-sso-bridge-01581\.js\?v=01590/);
});
