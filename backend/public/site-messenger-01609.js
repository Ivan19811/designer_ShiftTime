// 01609. Runs only on published sites containing a Messenger block.
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
  const randomKey=()=>{
    const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
    return 'stmv_'+btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/g,'');
  };
  let visitorKey='',chatId='',turns=[],busy=false,stopped=false,errorMessage='';
  try{visitorKey=localStorage.getItem(keyName)||'';chatId=localStorage.getItem(threadName)||'';}catch{}
  if(!/^stmv_[A-Za-z0-9_-]{40,120}$/.test(visitorKey)){visitorKey=randomKey();chatId='';try{localStorage.setItem(keyName,visitorKey);localStorage.removeItem(threadName);}catch{}}
  const errorText=blocks[0].dataset.stMessengerError||'';
  const closedText=blocks[0].dataset.stMessengerClosed||'';
  const sendingText=blocks[0].dataset.stMessengerSending||'';
  const refs=blocks.map(block=>({
    block,form:block.querySelector('[data-st-messenger-form]'),turns:block.querySelector('[data-st-messenger-turns]'),
    empty:block.querySelector('[data-st-messenger-empty]'),feedback:block.querySelector('[data-st-messenger-feedback]'),
    send:block.querySelector('[data-st-messenger-send]'),newChat:block.querySelector('[data-st-messenger-new]'),name:block.querySelector('[name="name"]'),
    nameLabel:block.querySelector('[data-st-messenger-name-label]'),body:block.querySelector('[name="body"]')
  })).filter(x=>x.form&&x.turns&&x.send&&x.body);
  const headers=()=>{
    const h={accept:'application/json','content-type':'application/json','x-st-messenger-visitor':visitorKey};
    try{const token=sessionStorage.getItem(customerSessionName)||'';if(token)h['x-st-customer-session']=token;}catch{}
    return h;
  };
  async function call(path,method='GET',data=null){
    const request=async h=>{
      const response=await fetch('/api/v1/public/site/messenger'+path,{method,headers:h,body:data===null?undefined:JSON.stringify(data),cache:'no-store'});
      const result=await response.json().catch(()=>({}));
      return {response,result};
    };
    let {response,result}=await request(headers());
    // Expired account sessions must not prevent an existing guest from chatting.
    if(response.status===401&&result.error==='SITE_ACCOUNT_LOGIN_REQUIRED_01595'){
      const h=headers();delete h['x-st-customer-session'];({response,result}=await request(h));
    }
    if(!response.ok)throw Object.assign(new Error(result.error||'MESSENGER_REQUEST_FAILED_01609'),{status:response.status,code:result.error||''});
    return result;
  }
  function draw(){
    for(const ref of refs){
      ref.send.disabled=busy||stopped;
      if(ref.newChat)ref.newChat.hidden=!stopped;
      if(ref.nameLabel)ref.nameLabel.hidden=Boolean(chatId);
      if(ref.feedback)ref.feedback.textContent=stopped?closedText:(busy?sendingText:errorMessage);
      ref.turns.replaceChildren();
      if(!turns.length){const p=document.createElement('p');p.textContent=ref.empty?.textContent||'';p.style.cssText='margin:auto;text-align:center;color:#63758c;max-width:370px;';ref.turns.appendChild(p);continue;}
      for(const turn of turns){
        const bubble=document.createElement('div');bubble.textContent=String(turn.body||'');
        bubble.style.cssText='padding:11px 15px;max-width:83%;border-radius:16px;white-space:pre-wrap;overflow-wrap:anywhere;box-sizing:border-box;';
        bubble.style.alignSelf=turn.role==='customer'?'flex-end':'flex-start';
        bubble.style.background=turn.role==='customer'?'#245ac2':'#e6edf8';
        bubble.style.color=turn.role==='customer'?'#fff':'#172b4b';
        ref.turns.appendChild(bubble);
      }
      ref.turns.scrollTop=ref.turns.scrollHeight;
    }
  }
  async function refresh(){
    if(!chatId||busy||!document.querySelector('[data-st-messenger-01609="1"]'))return;
    try{
      const r=await call('/'+encodeURIComponent(chatId));
      turns=Array.isArray(r.turns)?r.turns:[];
      stopped=['closed','spam'].includes(r.status);draw();
    }catch(e){
      if(e.status===404){chatId='';turns=[];stopped=false;try{localStorage.removeItem(threadName);}catch{}draw();}
    }
  }
  async function submit(ref){
    const body=String(ref.body?.value||'').trim();if(busy||stopped||body.length<2)return;
    busy=true;errorMessage='';draw();
    try{
      if(!chatId){
        const name=String(ref.name?.value||'').trim().slice(0,120);
        const result=await call('','POST',{body,subject:ref.block.dataset.stMessengerSubject||'',customer:{name},context:{pagePath:location.pathname+location.search,referrer:document.referrer||''}});
        chatId=result.id;
        try{localStorage.setItem(threadName,chatId);}catch{}
        turns=[{id:chatId,role:'customer',body}];
      }else{
        const result=await call('/'+encodeURIComponent(chatId)+'/turns','POST',{body});
        turns=Array.isArray(result.turns)?result.turns:[...turns,{id:String(Date.now()),role:'customer',body}];
      }
      ref.body.value='';errorMessage='';
    }catch(e){
      stopped=e.code==='MESSENGER_THREAD_CLOSED_01609';
      errorMessage=stopped?closedText:errorText;
    }finally{busy=false;draw();}
  }
  refs.forEach(ref=>{
    ref.form.addEventListener('submit',e=>{e.preventDefault();submit(ref);});
    ref.newChat?.addEventListener('click',()=>{chatId='';turns=[];stopped=false;errorMessage='';try{localStorage.removeItem(threadName);}catch{}draw();});
  });
  draw();refresh();
  setInterval(()=>{if(!document.hidden&&!busy)refresh();},16000);
})();
