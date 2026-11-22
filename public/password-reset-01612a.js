// 01612A · Hosted first-party password recovery, never embedded on merchant sites.
(async()=>{
 const title=document.querySelector('#title'),intro=document.querySelector('#intro'),app=document.querySelector('#app'),notice=document.querySelector('#notice'),error=document.querySelector('#error'),help=document.querySelector('#help');
 let t;try{t=(await(await fetch('/identity/site/locale.json',{cache:'no-store'})).json()).passwordReset01612A;}catch{return;}
 const escaped=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // Reset token never appears in requests/Referer and is removed from browser URL immediately.
 const fragment=new URLSearchParams(location.hash.slice(1));let token=fragment.get('token')||'';
 if(location.hash)history.replaceState(null,'',location.pathname+location.search);
 const reset=/^[A-Za-z0-9_-]{43}$/.test(token);
 let busy=false;
 title.textContent=t.title;intro.textContent=reset?t.resetIntro:t.requestIntro;help.textContent=reset?t.passwordPolicy:'';
 async function call(action,body){const response=await fetch('/api/v1/auth/password-reset/'+action,{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify(body),cache:'no-store',credentials:'omit'});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'unknown');return data;}
 function feedback(message='',isError=false){(isError?error:notice).textContent=message;(isError?notice:error).textContent='';}
 function render(){
  if(reset){app.innerHTML=`<form id="form"><label>${escaped(t.password)}<div class="pw"><input type="password" name="password" minlength="10" maxlength="256" autocomplete="new-password" required><button type="button" data-eye="password" aria-label="${escaped(t.showPassword)}">◉</button></div></label><label>${escaped(t.confirm)}<div class="pw"><input type="password" name="confirm" minlength="10" maxlength="256" autocomplete="new-password" required><button type="button" data-eye="confirm" aria-label="${escaped(t.showPassword)}">◉</button></div></label><button type="submit">${escaped(t.submit)}</button></form>`;}
  else {app.innerHTML=`<form id="form"><label>${escaped(t.email)}<input name="email" type="email" autocomplete="username" required maxlength="254"></label><button type="submit">${escaped(t.send)}</button></form>`;}
  app.querySelectorAll('[data-eye]').forEach(btn=>btn.addEventListener('click',()=>{const field=app.querySelector(`[name="${btn.dataset.eye}"]`);const show=field.type==='password';field.type=show?'text':'password';btn.setAttribute('aria-label',show?t.hidePassword:t.showPassword);}));
  app.querySelector('#form').addEventListener('submit',async ev=>{ev.preventDefault();if(busy)return;const form=ev.currentTarget,values=new FormData(form),button=form.querySelector('[type=submit]');
   if(reset&&String(values.get('password'))!==String(values.get('confirm'))){feedback(t.mismatch,true);return;}
   const body=reset?{token,password:String(values.get('password')||'')}:{email:String(values.get('email')||'').trim()};
   busy=true;button.disabled=true;button.textContent=t.busy;feedback();
   try{await call(reset?'complete':'request',body);feedback(reset?t.success:t.sent);app.replaceChildren();token='';}
   catch(e){feedback(t.errors?.[e.message]||t.error,true);button.disabled=false;button.textContent=reset?t.submit:t.send;}
   finally{busy=false;}
  });
 }
 render();
})();
