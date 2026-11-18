import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const bridgePath = '../../js/account/builder-sso-bridge-01581.js';

async function runBridge(initialHref='http://127.0.0.1:5544/index.html', state={token:'test-session',user:{id:'u1'}}){
  const source=(await read(bridgePath)).replace(/^import .*;\s*$/gm,'');
  const actions=[];
  const listeners={};
  const button={type:'',id:'',addEventListener:(type,fn)=>{button[`on_${type}`]=fn;},setAttribute:()=>{}};
  const ref={parentNode:true,insertAdjacentElement:(_,node)=>{actions.push(['insert',node.id]);}};
  const document={readyState:'complete',getElementById:(id)=>id==='builderAccountButton'?ref:null,createElement:()=>button};
  const window={addEventListener:(type,callback)=>{(listeners[type]??=[]).push(callback);},alert:(msg)=>actions.push(['alert',msg])};
  const location=new URL(initialHref);
  const history={state:null,replaceState:()=>{actions.push(['replaceState'])}};
  const sessionStorage={getItem:()=>'',setItem:()=>{actions.push(['writeSession'])}};
  const context={
    window,document,location,history,sessionStorage,globalThis:{__ST_SHIFTIME_I18N_01130__:{t:key=>key}},
    URL,Date,console,
    getMarketplaceAuthState01084:()=>state,
    initMarketplaceAuthRuntime01084:async()=>true,
    acceptMarketplaceSsoSession01581:(payload)=>actions.push(['accept',payload?.token]),
    ssoAuthorize01581:async(client)=>actions.push(['authorize',client]),
    ssoFinish01581:async(client)=>{actions.push(['finish',client]);return {session:{token:'from-crm'}};},
    ssoEstablish01581:async(token,client,uri)=>actions.push(['establish',client,uri]),
  };
  await vm.runInNewContext(`(async()=>{${source}\n})()`,context,{timeout:2000});
  return {actions,button,listeners,state};
}

test('01588: login/register no longer starts a top-level SSO POST or navigation',async()=>{
  const {actions,listeners}=await runBridge();
  for(const reason of ['login:success','register:success']){
    for(const cb of listeners['st:marketplace-auth-changed']||[])cb({detail:{reason,state:{token:'test-session',user:{id:'u1'}}}});
  }
  assert.deepEqual(actions.map(a=>a[0]),['insert']);
  const bridge=await read(bridgePath);
  assert.doesNotMatch(bridge,/handoff\(\s*['"]builder['"]/);
  assert.doesNotMatch(bridge,/COOKIE_BOOTSTRAP_MARK/);
});

test('01588: clicking CRM still initiates secure handoff to the Test CRM',async()=>{
  const {actions,button}=await runBridge();
  assert.equal(typeof button.on_click,'function');
  button.on_click({preventDefault(){}});
  await new Promise(resolve=>setImmediate(resolve));
  const handoffs=actions.filter(a=>a[0]==='establish');
  assert.equal(handoffs.length,1);
  assert.equal(handoffs[0][1],'crm');
  assert.equal(handoffs[0][2],'https://shifttime-crm-test.netlify.app/');
});

test('01588: inbound CRM-to-Builder callback is still handled',async()=>{
  const {actions}=await runBridge('http://127.0.0.1:5544/index.html?code=REDACTED&state=abc');
  assert.deepEqual(actions.filter(a=>a[0]==='finish').map(a=>a[1]),['builder']);
  assert.deepEqual(actions.filter(a=>a[0]==='accept').map(a=>a[1]),['from-crm']);
});

test('01588: deliberate st_sso=1 launch can still authorize the Builder',async()=>{
  const {actions}=await runBridge('http://127.0.0.1:5544/index.html?st_sso=1');
  assert.deepEqual(actions.filter(a=>a[0]==='authorize').map(a=>a[1]),['builder']);
});

test('01588: imported ESM auth singleton and cache-bust stay consistent',async()=>{
  const [bridge,html]=await Promise.all([read(bridgePath),read('../../index.html')]);
  assert.match(bridge,/marketplace-auth-runtime-01084\.js\?v=01090/);
  assert.match(html,/builder-sso-bridge-01581\.js\?v=01590/);
  assert.doesNotMatch(html,/builder-sso-bridge-01581\.js\?v=01586/);
});
