// 01595 · Hosted ShiftTime ID page. Credentials must never be captured by merchant-controlled JS.
(async()=>{
  const tx=new URLSearchParams(location.search).get('tx')||'';
  const root=document.getElementById('root'),heading=document.getElementById('heading'),alert=document.getElementById('alert');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let tr;try{tr=await(await fetch('/identity/site/locale.json',{cache:'force-cache'})).json();}catch{return;}
  const showError=code=>{alert.textContent=tr.errors?.[code]||tr.errors?.unknown||'';};
  document.getElementById('intro').textContent=tr.hostedIntro;
  document.getElementById('help').textContent=tr.hostedSafety;
  const call=async(action,payload=null)=>{
    const post=payload!==null;
    const result=await fetch('/api/v1/public/identity/site/'+action+(post?'':'?tx='+encodeURIComponent(tx)),{method:post?'POST':'GET',headers:{accept:'application/json',...(post?{'content-type':'application/json'}:{})},body:post?JSON.stringify({...payload,tx}):undefined,cache:'no-store'});
    const data=await result.json().catch(()=>({}));if(!result.ok)throw Object.assign(new Error('AUTH_REQUEST_01595'),{code:data.error||'unknown'});return data;
  };
  let info;try{info=await call('flow');}catch(e){showError(e?.code);return;}
  let mode=info.registrationEnabled&&info.requestedMode==='register'?'register':'login',busy=false;
  if(info.requestedMode==='register'&&!info.registrationEnabled)showError('SITE_ACCOUNT_REGISTRATION_DISABLED_01595');
  function paint(){
    heading.textContent=tr.hostedTitle;
    root.innerHTML=`<p>${esc(info.siteName||'')}</p><button type="button" class="secondary" data-mode="login">${esc(tr.login)}</button>${info.registrationEnabled?`<button class="secondary" type="button" data-mode="register">${esc(tr.register)}</button>`:''}<form id="identity-form" autocomplete="on">${mode==='register'?`<label>${esc(tr.name)}<input name="name" required minlength="2" maxlength="120" autocomplete="name"></label>`:''}<label>${esc(tr.email)}<input name="email" type="email" required autocomplete="username"></label><label>${esc(tr.password)}<input name="password" type="password" required minlength="${mode==='register'?'10':'1'}" autocomplete="${mode==='register'?'new-password':'current-password'}"></label>${mode==='register'?`<label>${esc(tr.passwordConfirm)}<input name="confirm" type="password" required minlength="10"></label><label class="terms"><input type="checkbox" name="acceptTerms" required>${esc(tr.terms)}</label><input name="website" type="text" autocomplete="off" tabindex="-1" style="position:absolute;left:-99999px" value="">`:''}<p><button type="submit" ${busy?'disabled':''}>${esc(busy?tr.busy:mode==='register'?tr.submitRegister:tr.submitLogin)}</button></p></form>`;
    root.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{if(busy)return;mode=btn.dataset.mode;alert.textContent='';paint();}));
    root.querySelector('#identity-form').addEventListener('submit',async event=>{
      event.preventDefault();if(busy)return;
      const d=new FormData(event.currentTarget),pw=String(d.get('password')||'');
      if(mode==='register'&&pw!==String(d.get('confirm')||'')){showError('passwordMismatch');return;}
      const input={email:String(d.get('email')||'').trim(),password:pw};
      if(mode==='register'){input.name=String(d.get('name')||'').trim();input.acceptTerms=d.get('acceptTerms')==='on';input.website=String(d.get('website')||'');}
      busy=true;alert.textContent='';paint();
      try{const result=await call(mode,input);location.replace(result.redirectUrl);}
      catch(e){busy=false;showError(e?.code);paint();}
    });
  }
  paint();
})();
