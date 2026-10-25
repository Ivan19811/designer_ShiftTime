// 01595 · Published-site entry. No ShiftTime ID password input appears on this untrusted origin.
(async()=>{
  const identity=globalThis.__ST_PUBLISHED_SITE_IDENTITY__;
  const section=document.querySelector('[data-shop-page-role-01532="account"]');
  if(!identity?.siteId||!section||globalThis.__ST_SITE_CUSTOMER_ACCOUNT_01595__)return;
  globalThis.__ST_SITE_CUSTOMER_ACCOUNT_01595__=true;
  let tr;try{const response=await fetch('/assets/site-customer-account-01595.uk.json');if(!response.ok)return;tr=await response.json();}catch{return;}
  const storageKey='st_site_customer_01595_'+identity.siteId,flowKey='st_site_flow_01595_'+identity.siteId;
  const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const errorMessage=code=>tr.errors?.[code]||tr.errors?.unknown||'';
  let bearer='',user=null,loading=false,error='';try{bearer=sessionStorage.getItem(storageKey)||'';}catch{}
  const host=document.createElement('section');host.className='st-site-account-01595';
  const style=document.createElement('style');style.textContent=`
    .st-site-account-01595{width:min(770px,100%);margin:28px auto;padding:24px;border:1px solid #d9e4ef;border-radius:24px;background:white;box-shadow:0 20px 52px #132b4820;color:#182d45;font:500 15px/1.55 system-ui,sans-serif;box-sizing:border-box}
    .st-site-account-01595 *{box-sizing:border-box}.st-site-account-01595 h2{margin:0 0 12px;color:#182d45;font-size:clamp(23px,3vw,35px)}
    .st-site-account-01595 p{color:#65748b}.st-site-account-01595 button{font:700 15px system-ui,sans-serif;padding:13px 21px;border-radius:12px;border:1px solid #254daf;background:#254daf;color:white;cursor:pointer;margin:8px 10px 8px 0}
    .st-site-account-01595 button.secondary{background:#f0f5fc;color:#254daf}.st-site-account-01595 button:disabled{opacity:.65;cursor:wait}
    .st-site-account-01595 .error{padding:12px 16px;background:#fff4f3;color:#a52222;border-radius:10px}.st-site-account-01595 .detail{border-radius:13px;background:#f3f6fb;padding:18px;overflow-wrap:anywhere}
  `;
  // Replaces only static account preview on the published page, not the Builder's private account page.
  (section.querySelector('.st-row')||section).replaceChildren(style,host);
  const saveToken=data=>{bearer=data?.token||'';try{bearer?sessionStorage.setItem(storageKey,bearer):sessionStorage.removeItem(storageKey);}catch{}};
  async function api(action,payload=null){
    const headers={accept:'application/json'};if(payload!==null)headers['content-type']='application/json';
    if(bearer)headers['x-st-customer-session']=bearer;
    const response=await fetch('/api/v1/public/site/account/'+action,{method:payload===null?'GET':'POST',headers,body:payload===null?undefined:JSON.stringify(payload),cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Object.assign(new Error('SITE_ACCOUNT_API_01595'),{code:data.error||'unknown'});
    return data;
  }
  const randomBase64=bytes=>{const buf=new Uint8Array(bytes);crypto.getRandomValues(buf);return btoa(String.fromCharCode(...buf)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');};
  async function redirectToIdentity(mode){
    if(loading)return;loading=true;error='';render();
    try{
      const verifier=randomBase64(32),state=randomBase64(24);
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
      const challenge=btoa(String.fromCharCode(...new Uint8Array(digest))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
      const next=await api('start',{codeChallenge:challenge,state,returnOrigin:location.origin,returnPath:location.pathname,mode});
      sessionStorage.setItem(flowKey,JSON.stringify({verifier,state}));
      location.assign(next.loginUrl);
    }catch(e){error=errorMessage(e?.code);loading=false;render();}
  }
  function render(){
    if(user){
      host.innerHTML=`<h2>${html(tr.welcome)}</h2><div class="detail"><strong data-site-customer-name></strong><div data-site-customer-email></div><div>${html(tr.userId)}: <span data-site-customer-id></span></div><div data-site-customer-verified></div></div><p>${html(tr.notice)}</p><button type="button" class="secondary" data-site-customer-logout>${html(tr.logout)}</button>`;
      host.querySelector('[data-site-customer-name]').textContent=user.name||'';
      host.querySelector('[data-site-customer-email]').textContent=user.email||'';
      host.querySelector('[data-site-customer-id]').textContent=user.id||'';
      host.querySelector('[data-site-customer-verified]').textContent=user.emailVerified?tr.emailVerified:tr.emailUnverified;
      host.querySelector('[data-site-customer-logout]').addEventListener('click',async()=>{if(loading)return;loading=true;const existing=bearer;saveToken(null);user=null;render();try{bearer=existing;await api('logout',{});}catch{}finally{bearer='';loading=false;render();}});
      return;
    }
    host.innerHTML=`<h2>${html(tr.title)}</h2><p>${html(tr.intro)}</p>${error?`<p class="error" role="alert">${html(error)}</p>`:''}<button data-site-customer-login type="button" ${loading?'disabled':''}>${html(loading?tr.busy:tr.login)}</button><button data-site-customer-register type="button" class="secondary" ${loading?'disabled':''}>${html(tr.register)}</button><p>${html(tr.notice)}</p>`;
    host.querySelector('[data-site-customer-login]').addEventListener('click',()=>redirectToIdentity('login'));
    host.querySelector('[data-site-customer-register]').addEventListener('click',()=>redirectToIdentity('register'));
  }
  render();
  // OAuth-style callback is in a fragment: no code or verifier leaks into access logs or referrers.
  const callback=new URLSearchParams(location.hash.slice(1)),code=callback.get('st_site_code'),state=callback.get('st_site_state');
  if(code||state){
    history.replaceState(history.state,'',location.pathname+location.search);
    let saved=null;try{saved=JSON.parse(sessionStorage.getItem(flowKey)||'null');sessionStorage.removeItem(flowKey);}catch{}
    if(code&&state&&saved?.state===state&&saved?.verifier){
      loading=true;render();
      try{const result=await api('exchange',{code,verifier:saved.verifier});saveToken(result);user=result.user||null;}
      catch(e){error=errorMessage(e?.code);saveToken(null);}
      finally{loading=false;render();}
    }else{error=errorMessage('SITE_ACCOUNT_EXCHANGE_INVALID_01595');render();}
  }else if(bearer){try{const result=await api('me');user=result.user||null;}catch{saveToken(null);}render();}
})();
