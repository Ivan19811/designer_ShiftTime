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
  // 01611F · A top-level navigation sends the HttpOnly SameSite cookie to
  // Render without exposing it to JS. If no session exists, the server returns
  // here once with ?sso=login_required and we show the regular login form.
  if(!new URLSearchParams(location.search).has('sso') && info.requestedMode!=='register'){
    location.replace('/api/v1/auth/sso/site-continue?tx='+encodeURIComponent(tx));return;
  }
  // SVG icons are purely decorative, and never contain or retain the password.
  const eyeIcon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const eyeOffIcon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 5.1A11.4 11.4 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-3 3.6"/><path d="M6 6.5C3.3 8.2 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4.1-.9"/><path d="M10 10a3 3 0 0 0 4 4"/><path d="M3 3l18 18"/></svg>';
  let mode=info.registrationEnabled&&info.requestedMode==='register'?'register':'login',busy=false;
  if(info.requestedMode==='register'&&!info.registrationEnabled)showError('SITE_ACCOUNT_REGISTRATION_DISABLED_01595');
  function paint(){
    heading.textContent=tr.hostedTitle;
    root.innerHTML=`<p>${esc(info.siteName||'')}</p><button type="button" class="secondary" data-mode="login">${esc(tr.login)}</button>${info.registrationEnabled?`<button class="secondary" type="button" data-mode="register">${esc(tr.register)}</button>`:''}<form id="identity-form" autocomplete="on">${mode==='register'?`<label>${esc(tr.name)}<input name="name" required minlength="2" maxlength="120" autocomplete="name"></label>`:''}<label>${esc(tr.email)}<input name="email" type="email" required autocomplete="username"></label><label for="st-identity-password">${esc(tr.password)}</label><div class="st-passwrap-01611g"><input id="st-identity-password" name="password" type="password" required minlength="${mode==='register'?'10':'1'}" autocomplete="${mode==='register'?'new-password':'current-password'}"><button type="button" class="st-passeye-01611g" data-st-identity-show="st-identity-password" aria-pressed="false" aria-label="${esc(tr.showPassword)}" title="${esc(tr.showPassword)}">${eyeIcon}</button></div>${mode==='register'?`<label for="st-identity-confirm">${esc(tr.passwordConfirm)}</label><div class="st-passwrap-01611g"><input id="st-identity-confirm" name="confirm" type="password" required minlength="10" autocomplete="new-password"><button type="button" class="st-passeye-01611g" data-st-identity-show="st-identity-confirm" aria-pressed="false" aria-label="${esc(tr.showPassword)}" title="${esc(tr.showPassword)}">${eyeIcon}</button></div><label class="terms"><input type="checkbox" name="acceptTerms" required>${esc(tr.terms)}</label><input name="website" type="text" autocomplete="off" tabindex="-1" style="position:absolute;left:-99999px" value="">`:''}<p><button type="submit" ${busy?'disabled':''}>${esc(busy?tr.busy:mode==='register'?tr.submitRegister:tr.submitLogin)}</button></p></form>`;
    root.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{if(busy)return;mode=btn.dataset.mode;alert.textContent='';paint();}));
    root.querySelectorAll('[data-st-identity-show]').forEach(button=>button.addEventListener('click',()=>{
      const input=root.querySelector('#'+button.getAttribute('data-st-identity-show'));
      if(!input||busy)return;
      const visible=input.type==='password';input.type=visible?'text':'password';
      button.setAttribute('aria-pressed',String(visible));
      const label=visible?tr.hidePassword:tr.showPassword;
      button.setAttribute('aria-label',label);button.setAttribute('title',label);
      button.innerHTML=visible?eyeOffIcon:eyeIcon;
    }));
    root.querySelector('#identity-form').addEventListener('submit',async event=>{
      event.preventDefault();if(busy)return;
      const d=new FormData(event.currentTarget),pw=String(d.get('password')||'');
      if(mode==='register'&&pw!==String(d.get('confirm')||'')){showError('passwordMismatch');return;}
      const input={email:String(d.get('email')||'').trim(),password:pw};
      if(mode==='register'){input.name=String(d.get('name')||'').trim();input.acceptTerms=d.get('acceptTerms')==='on';input.website=String(d.get('website')||'');}
      // Keep the real form inputs mounted so password managers can recognize
      // a successful credential submission for this one HTTPS origin.
      busy=true;alert.textContent='';
      const submit=event.currentTarget.querySelector('button[type=submit]');
      if(submit){submit.disabled=true;submit.textContent=tr.busy;}
      try{const result=await call(mode,input);location.replace(result.redirectUrl);}
      catch(e){busy=false;showError(e?.code);if(submit){submit.disabled=false;submit.textContent=mode==='register'?tr.submitRegister:tr.submitLogin;}}
    });
  }
  paint();
})();
