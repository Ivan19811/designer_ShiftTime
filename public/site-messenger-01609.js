// 01611: published Messenger runtime, with server-backed contact verification before composing.
(()=>{
  'use strict';
  const identity=globalThis.__ST_PUBLISHED_SITE_IDENTITY__;
  if(!identity?.siteId||globalThis.__ST_SITE_MESSENGER_01609__)return;
  const blocks=[...document.querySelectorAll('[data-st-messenger-01609="1"]')];
  if(!blocks.length)return;
  globalThis.__ST_SITE_MESSENGER_01609__=true;
  const siteId=identity.siteId;
  const keyName='st.messenger.visitor.01609.'+siteId;
  const threadName='st.messenger.thread.01609.'+siteId;
  const customerSessionName='st_site_customer_01595_'+siteId;
  const messengerFlowName='st_messenger_flow_01611e_'+siteId;
  const randomKey=()=>{const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return 'stmv_'+btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/g,'');};
  let visitorKey='',chatId='',turns=[],busy=false,stopped=false,errorMessage='',verified=false,loadingProof=true,challengeId='',providers={},contactLinked=false,accountAuthenticated=false,accountThreads=[],accountThreadId='',accountLoading=false,accountError='';
  try{visitorKey=localStorage.getItem(keyName)||'';chatId=localStorage.getItem(threadName)||'';}catch{}
  if(!/^stmv_[A-Za-z0-9_-]{40,120}$/.test(visitorKey)){visitorKey=randomKey();chatId='';try{localStorage.setItem(keyName,visitorKey);localStorage.removeItem(threadName);}catch{}}
  const text=name=>blocks[0].dataset['stMessenger'+name]||'';
  const errorText=text('Error'),closedText=text('Closed'),sendingText=text('Sending');
  const refs=blocks.map(block=>({
    block,form:block.querySelector('[data-st-messenger-form]'),turns:block.querySelector('[data-st-messenger-turns]'),
    empty:block.querySelector('[data-st-messenger-empty]'),feedback:block.querySelector('[data-st-messenger-feedback]'),
    send:block.querySelector('[data-st-messenger-send]'),newChat:block.querySelector('[data-st-messenger-new]'),name:block.querySelector('[name="name"]'),
    nameLabel:block.querySelector('[data-st-messenger-name-label]'),body:block.querySelector('[name="body"]'),
    box:block.querySelector('[data-st-messenger-verify-box]'),channel:block.querySelector('[data-st-messenger-verify-channel]'),
    phone:block.querySelector('[data-st-messenger-verify-phone]'),consent:block.querySelector('[data-st-messenger-verify-consent]'),
    notice:block.querySelector('[data-st-messenger-verify-notice]'),codeBox:block.querySelector('[data-st-messenger-verify-code-box]'),
    code:block.querySelector('[data-st-messenger-verify-code]'),start:block.querySelector('[data-st-messenger-verify-start]'),
    check:block.querySelector('[data-st-messenger-verify-check]'),reset:block.querySelector('[data-st-messenger-verify-reset]'),status:block.querySelector('[data-st-messenger-verify-status]'),
    profileBox:block.querySelector('[data-st-messenger-profile-box]'),profileLabel:block.querySelector('[data-st-messenger-profile-label]'),profileLink:block.querySelector('[data-st-messenger-profile-link]'),
    accountBox:block.querySelector('[data-st-messenger-account-box]'),accountStatus:block.querySelector('[data-st-messenger-account-status]'),
    accountList:block.querySelector('[data-st-messenger-account-list]'),accountLogin:block.querySelector('[data-st-messenger-account-login]'),
    accountRegister:block.querySelector('[data-st-messenger-account-register]'),accountRefresh:block.querySelector('[data-st-messenger-account-refresh]')
  })).filter(x=>x.form&&x.turns&&x.send&&x.body);
  const headers=()=>{
    const h={accept:'application/json','content-type':'application/json','x-st-messenger-visitor':visitorKey};
    try{const token=sessionStorage.getItem(customerSessionName)||'';if(token)h['x-st-customer-session']=token;}catch{}
    return h;
  };
  async function call(path,method='GET',data=null){
    const request=async h=>{
      const response=await fetch('/api/v1/public/site/messenger'+path,{method,headers:h,body:data===null?undefined:JSON.stringify(data),cache:'no-store'});
      const result=await response.json().catch(()=>({}));return {response,result};
    };
    let {response,result}=await request(headers());
    if(!path.startsWith('/account/')&&response.status===401&&result.error==='SITE_ACCOUNT_LOGIN_REQUIRED_01595'){
      const h=headers();delete h['x-st-customer-session'];({response,result}=await request(h));
    }
    if(!response.ok)throw Object.assign(new Error(result.error||'MESSENGER_REQUEST_FAILED_01609'),{status:response.status,code:result.error||''});
    return result;
  }
  const accountToken=()=>{try{return sessionStorage.getItem(customerSessionName)||'';}catch{return '';} };
  const randomBase64=count=>{const b=new Uint8Array(count);crypto.getRandomValues(b);return btoa(String.fromCharCode(...b)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');};
  function accountLabel(item){
    const date=item.lastActivityAt?new Date(item.lastActivityAt).toLocaleDateString(document.documentElement.lang||'uk-UA'):'';
    return [String(item.subject||'').trim(),date].filter(Boolean).join(' · ')||String(item.id||'');
  }
  function paintAccount(){
    for(const ref of refs){
      if(!ref.accountBox)continue;
      if(ref.accountLogin)ref.accountLogin.hidden=accountAuthenticated||accountLoading;
      if(ref.accountRegister)ref.accountRegister.hidden=accountAuthenticated||accountLoading;
      if(ref.accountRefresh)ref.accountRefresh.hidden=!accountAuthenticated||accountLoading;
      if(ref.accountStatus)ref.accountStatus.textContent=accountLoading?text('AccountLoading'):
        accountError?text('AccountError'):accountAuthenticated?
        text('AccountList').replace('{count}',String(accountThreads.length)):text('AccountSigninInfo');
      if(!ref.accountList)continue;
      ref.accountList.replaceChildren();
      if(!accountAuthenticated)continue;
      if(!accountThreads.length){
        const p=document.createElement('p');p.textContent=text('AccountEmpty');
        p.style.cssText='margin:0;color:#60728c;font-size:12px;';ref.accountList.append(p);continue;
      }
      for(const item of accountThreads){
        const b=document.createElement('button');b.type='button';b.textContent=accountLabel(item);
        b.title=text('AccountSelect');b.dataset.threadId=item.id;
        b.style.cssText='text-align:left;border:1px solid #c9d8ed;border-radius:10px;padding:9px 12px;background:#fff;color:#203d64;cursor:pointer;font:600 13px system-ui,sans-serif;';
        if(accountThreadId===item.id){b.style.borderColor='#2468c8';b.style.background='#e5f0ff';}
        b.addEventListener('click',()=>openAccountThread(item.id));ref.accountList.append(b);
      }
    }
  }
  async function loadAccount(){
    if(!accountToken()){
      if(accountThreadId){turns=[];stopped=false;}
      accountAuthenticated=false;accountThreads=[];accountThreadId='';accountError='';paintAccount();draw();return;
    }
    accountLoading=true;accountError='';paintAccount();
    try{
      const out=await call('/account/threads');
      accountAuthenticated=true;accountThreads=Array.isArray(out.threads)?out.threads:[];
      if(accountThreadId&&!accountThreads.some(x=>x.id===accountThreadId))accountThreadId='';
    }catch(e){
      accountError=String(e.code||'');accountThreads=[];accountAuthenticated=false;
      if(accountThreadId){turns=[];stopped=false;}accountThreadId='';
      if(e.status===401){try{sessionStorage.removeItem(customerSessionName);}catch{}}
    }finally{accountLoading=false;paintAccount();draw();}
  }
  async function openAccountThread(id){
    if(!accountAuthenticated||busy||!accountThreads.some(x=>x.id===id))return;
    try{
      const out=await call('/account/threads/'+encodeURIComponent(id));
      accountThreadId=id;turns=Array.isArray(out.turns)?out.turns:[];
      stopped=['closed','spam'].includes(out.status);errorMessage='';paintAccount();draw();
    }catch{accountError='account';paintAccount();}
  }
  async function beginAccountLogin(mode){
    if(busy||accountLoading)return;
    accountLoading=true;paintAccount();
    try{
      const verifier=randomBase64(32),state=randomBase64(24);
      const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
      const challenge=btoa(String.fromCharCode(...new Uint8Array(hash))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
      const response=await fetch('/api/v1/public/site/account/start',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},
        body:JSON.stringify({codeChallenge:challenge,state,returnOrigin:location.origin,returnPath:location.pathname,mode}),cache:'no-store'});
      const result=await response.json().catch(()=>({}));if(!response.ok||!result.loginUrl)throw new Error('login');
      sessionStorage.setItem(messengerFlowName,JSON.stringify({verifier,state}));location.assign(result.loginUrl);
    }catch{accountLoading=false;accountError='login';paintAccount();}
  }
  async function completeAccountLogin(){
    // The existing site account page owns its own callback; never consume it twice.
    if(document.querySelector('[data-shop-page-role-01532="account"]'))return;
    const fragment=new URLSearchParams(location.hash.slice(1));
    const code=fragment.get('st_site_code'),state=fragment.get('st_site_state');if(!code&&!state)return;
    let saved=null;try{saved=JSON.parse(sessionStorage.getItem(messengerFlowName)||'null');}catch{}
    if(!saved?.state||saved.state!==state||!saved.verifier)return;
    history.replaceState(history.state,'',location.pathname+location.search);
    try{sessionStorage.removeItem(messengerFlowName);}catch{}
    try{
      const response=await fetch('/api/v1/public/site/account/exchange',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},
        body:JSON.stringify({code,verifier:saved.verifier}),cache:'no-store'});
      const result=await response.json().catch(()=>({}));if(!response.ok||!result.token)throw new Error('exchange');
      sessionStorage.setItem(customerSessionName,result.token);
    }catch{accountError='exchange';paintAccount();}
  }
  function message(ref,msg){if(ref.status)ref.status.textContent=msg;}
  function draw(){
    for(const ref of refs){
      const canCompose=verified||(accountAuthenticated&&Boolean(accountThreadId));
      ref.form.hidden=!canCompose;ref.form.style.display=canCompose?'grid':'none';
      let hasSession=false;try{hasSession=Boolean(sessionStorage.getItem(customerSessionName));}catch{}
      if(ref.profileBox){ref.profileBox.hidden=!verified||!hasSession;ref.profileBox.style.display=verified&&hasSession?'grid':'none';}
      if(ref.profileLink)ref.profileLink.hidden=contactLinked;
      if(ref.profileLabel)ref.profileLabel.textContent=contactLinked?text('ProfileLinked'):text('ProfilePrompt');
      if(ref.box){ref.box.hidden=canCompose;ref.box.style.display=canCompose?'none':'grid';}
      ref.send.disabled=busy||stopped||!canCompose;
      if(ref.newChat)ref.newChat.hidden=!stopped&&!accountThreadId;
      if(ref.nameLabel)ref.nameLabel.hidden=Boolean(chatId||accountThreadId);
      if(ref.feedback)ref.feedback.textContent=stopped?closedText:(busy?sendingText:errorMessage);
      ref.turns.replaceChildren();
      if(!turns.length){const p=document.createElement('p');p.textContent=ref.empty?.textContent||'';p.style.cssText='margin:auto;text-align:center;color:#63758c;max-width:370px;';ref.turns.appendChild(p);continue;}
      for(const turn of turns){
        const bubble=document.createElement('div');bubble.textContent=String(turn.body||'');
        bubble.style.cssText='padding:11px 15px;max-width:83%;border-radius:16px;white-space:pre-wrap;overflow-wrap:anywhere;box-sizing:border-box;';
        bubble.style.alignSelf=turn.role==='customer'?'flex-end':'flex-start';bubble.style.background=turn.role==='customer'?'#245ac2':'#e6edf8';bubble.style.color=turn.role==='customer'?'#fff':'#172b4b';
        ref.turns.appendChild(bubble);
      }
      ref.turns.scrollTop=ref.turns.scrollHeight;
    }
  }
  function updateChannel(ref){
    const channel=ref.channel?.value||'sms';
    if(ref.notice)ref.notice.textContent=channel==='sms'?text('VerifyPhoneNotice'):text('VerifyChannelNotice');
    if(ref.start)ref.start.disabled=busy||loadingProof||!providers[channel];
    if(ref.check)ref.check.disabled=busy;
    if(ref.channel)for(const option of ref.channel.options)option.disabled=!providers[option.value];
  }
  async function bootstrapProof(){
    loadingProof=true;draw();
    try{
      const status=await call('/channels');
      providers=status.providers||{};verified=Array.isArray(status.verified)&&status.verified.length>0;
      if(verified){try{const result=await call('/contact');contactLinked=Boolean(result?.contact?.linked);}catch{contactLinked=false;}}
      for(const ref of refs){
        if(ref.channel&&!providers[ref.channel.value])ref.channel.value=['sms','telegram','viber','whatsapp'].find(c=>providers[c])||'sms';
        updateChannel(ref);
        if(!verified&&ref.box)message(ref,Object.values(providers).some(Boolean)?text('VerifyGate'):text('VerifyNoProvider'));
      }
    }catch{
      verified=false;for(const ref of refs)message(ref,text('VerifyError'));
    }finally{loadingProof=false;for(const ref of refs)updateChannel(ref);draw();}
  }
  async function startVerification(ref){
    if(busy||loadingProof||!providers[ref.channel?.value])return;
    busy=true;challengeId='';
    message(ref,text('VerifySending'));updateChannel(ref);
    try{
      const result=await call('/verification/start','POST',{channel:ref.channel.value,phone:ref.phone?.value||'',consentFallback:ref.consent?.checked===true});
      challengeId=result.challengeId;
      if(ref.codeBox){ref.codeBox.hidden=false;ref.codeBox.style.display='grid';}
      if(ref.check)ref.check.hidden=false;
      if(ref.start)ref.start.hidden=true;
      if(ref.reset)ref.reset.hidden=false;
      if(ref.phone)ref.phone.disabled=true;
      if(ref.channel)ref.channel.disabled=true;
      message(ref,text('VerifySent'));
    }catch(e){message(ref,e.code==='MESSENGER_VERIFY_RATE_LIMIT_01611'?text('VerifyRate'):e.code==='MESSENGER_CHANNEL_NOT_CONFIGURED_01611'?text('VerifyUnavailable'):text('VerifyError'));}
    finally{busy=false;updateChannel(ref);}
  }
  async function checkVerification(ref){
    if(busy||!challengeId)return;
    busy=true;message(ref,text('VerifyChecking'));updateChannel(ref);
    try{
      const result=await call('/verification/verify','POST',{challengeId,code:String(ref.code?.value||'').trim()});
      if(!result.verified)throw new Error('unverified');
      verified=true;contactLinked=false;message(ref,text('VerifyVerified'));draw();
    }catch(e){message(ref,['MESSENGER_CODE_INCORRECT_01611','MESSENGER_CHALLENGE_EXPIRED_01611'].includes(e.code)?text('VerifyInvalid'):text('VerifyError'));}
    finally{busy=false;updateChannel(ref);draw();}
  }
  async function refresh(){
    if((!chatId&&!accountThreadId)||busy||!document.querySelector('[data-st-messenger-01609="1"]'))return;
    try{const path=accountThreadId?'/account/threads/'+encodeURIComponent(accountThreadId):'/'+encodeURIComponent(chatId);
      const r=await call(path);turns=Array.isArray(r.turns)?r.turns:[];stopped=['closed','spam'].includes(r.status);draw();}
    catch(e){if(e.status===404){if(accountThreadId){accountThreadId='';loadAccount();}else{chatId='';try{localStorage.removeItem(threadName);}catch{}}turns=[];stopped=false;draw();}}
  }
  async function submit(ref){
    const body=String(ref.body?.value||'').trim();if(busy||stopped||(!verified&&!accountThreadId)||body.length<2)return;
    busy=true;errorMessage='';draw();
    try{
      if(accountThreadId){
        const result=await call('/account/threads/'+encodeURIComponent(accountThreadId)+'/turns','POST',{body});
        turns=Array.isArray(result.turns)?result.turns:[];
      }else if(!chatId){
        const name=String(ref.name?.value||'').trim().slice(0,120);
        const result=await call('','POST',{body,subject:ref.block.dataset.stMessengerSubject||'',customer:{name},context:{pagePath:location.pathname+location.search,referrer:document.referrer||''}});
        chatId=result.id;try{localStorage.setItem(threadName,chatId);}catch{}
        turns=[{id:chatId,role:'customer',body}];
      }else{
        const result=await call('/'+encodeURIComponent(chatId)+'/turns','POST',{body});
        turns=Array.isArray(result.turns)?result.turns:[...turns,{id:String(Date.now()),role:'customer',body}];
      }
      ref.body.value='';errorMessage='';
    }catch(e){
      stopped=e.code==='MESSENGER_THREAD_CLOSED_01609';
      if(e.code==='MESSENGER_VERIFICATION_REQUIRED_01611'){verified=false;bootstrapProof();}
      errorMessage=stopped?closedText:errorText;
    }finally{busy=false;draw();}
  }
  refs.forEach(ref=>{
    ref.form.addEventListener('submit',e=>{e.preventDefault();submit(ref);});
    ref.newChat?.addEventListener('click',()=>{accountThreadId='';chatId='';turns=[];stopped=false;errorMessage='';try{localStorage.removeItem(threadName);}catch{}draw();});
    ref.channel?.addEventListener('change',()=>updateChannel(ref));
    ref.start?.addEventListener('click',()=>startVerification(ref));
    ref.check?.addEventListener('click',()=>checkVerification(ref));
    ref.profileLink?.addEventListener('click',async()=>{
      if(busy||contactLinked||!verified)return;busy=true;ref.profileLink.disabled=true;
      try{const result=await call('/contact/link','POST',{});contactLinked=Boolean(result.linked);if(!contactLinked)throw new Error('not-linked');}
      catch{if(ref.profileLabel)ref.profileLabel.textContent=text('ProfileFailed');}
      finally{busy=false;ref.profileLink.disabled=false;if(contactLinked){await loadAccount();draw();}}
    });
    ref.accountLogin?.addEventListener('click',()=>beginAccountLogin('login'));
    ref.accountRegister?.addEventListener('click',()=>beginAccountLogin('register'));
    ref.accountRefresh?.addEventListener('click',()=>loadAccount());
    ref.reset?.addEventListener('click',()=>{if(busy)return;challengeId='';if(ref.channel)ref.channel.disabled=false;if(ref.phone)ref.phone.disabled=false;if(ref.code)ref.code.value='';if(ref.codeBox){ref.codeBox.hidden=true;ref.codeBox.style.display='none';}if(ref.start)ref.start.hidden=false;if(ref.check)ref.check.hidden=true;if(ref.reset)ref.reset.hidden=true;updateChannel(ref);message(ref,'');});
    if(ref.box)ref.box.hidden=false;
    if(ref.codeBox){ref.codeBox.hidden=true;ref.codeBox.style.display='none';}
    ref.form.hidden=true;
  });
  draw();completeAccountLogin().then(loadAccount).then(bootstrapProof).then(refresh);
  setInterval(()=>{if(!document.hidden&&!busy)refresh();},16000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&accountToken())loadAccount();});
})();
