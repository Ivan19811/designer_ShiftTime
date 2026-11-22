// 01581 · ShiftTime ID for CRM. Only Render auth/session is authoritative.
// Legacy GAS /api/auth, mock Google owner and localStorage st_user identity have been removed.
import {ssoApiBase01581,ssoRedirectUri01581,ssoAuthorize01581,ssoFinish01581,ssoEstablish01581} from '../../js/sso-browser-01581.js';
import {t01581 as t} from '../../js/i18n/uk-01581.js';
const TOKEN_KEY='st_crm_render_session_01581';
let user=null,scope=null,token='',initializing=false,initialized=false;
let currentOnAuth=null,currentTargets=null;
const getToken=()=>token||sessionStorage.getItem(TOKEN_KEY)||'';
function updateSession(payload){
 token=String(payload?.token||'');scope=payload?.scope||null;
 user=token&&payload?.user?Object.freeze({...payload.user,uid:payload.user.id,roles:[scope?.role||'user'],scope}):null;
 if(token)sessionStorage.setItem(TOKEN_KEY,token);else sessionStorage.removeItem(TOKEN_KEY);
 window.dispatchEvent(new CustomEvent('st:crm-auth-changed-01581',{detail:{authenticated:!!user,userId:user?.id||'',storeId:scope?.storeId||''}}));
 refreshUi();
 return user;
}
export function getCurrentUser(){return user;}
export function getCrmAuthToken01581(){return getToken();}
export function getCrmAuthScope01581(){return scope;}
// Compatibility: cannot set a privileged identity without server-verified session.
export function setCurrentUser(_u){return getCurrentUser();}
async function api(path,{method='GET',body,auth=false}={}){
 const headers={'accept':'application/json'};if(body!==undefined)headers['content-type']='application/json';if(auth)headers.authorization='Bearer '+getToken();
 const res=await fetch(ssoApiBase01581()+path,{method,headers,cache:'no-store',body:body===undefined?undefined:JSON.stringify(body)});
 const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.error||'HTTP '+res.status);return data;
}
export async function signOut(){return revokeAndSignOut();}
// Correct sign-out: call revoke-all with the former token, after clearing browser state.
async function revokeAndSignOut(){
 const prior=getToken();updateSession(null);
 if(prior){try{await fetch(ssoApiBase01581()+'/auth/sso/logout-all',{method:'POST',cache:'no-store',headers:{authorization:'Bearer '+prior}});}catch(_){} }
}
function roleName(role){return t('role.'+role)===('role.'+role)?t('role.user'):t('role.'+role);}
function show(id,visible){const el=document.getElementById(id);if(el)el.classList.toggle('hidden',!visible);}
function refreshUi(){
 const builderButton=document.getElementById('global-open-builder-01581');if(builderButton)builderButton.textContent=t('auth.openBuilder');
 const logged=!!user;
 show(currentTargets?.loginBtn||'global-login-btn',!logged);
 show(currentTargets?.badgeEl||'global-user-badge',logged);
 const badge=document.getElementById(currentTargets?.badgeEl||'global-user-badge');
 if(badge&&logged)badge.textContent=roleName(scope?.role||'user')+' — '+(user.name||user.email||t('auth.unknown'));
 show('admin-btn-login',!logged);show('admin-user-badge',logged);
 const name=document.getElementById('admin-user-name'),email=document.getElementById('admin-user-email');
 if(name)name.textContent=user?.name||'';if(email)email.textContent=user?.email||'';
 if(typeof currentOnAuth==='function')currentOnAuth(user);
}
async function openLoginModal(){
 if(!document.getElementById('admin-login-modal')){
   location.hash='#admin';
   for(let i=0;i<40&&!document.getElementById('admin-login-modal');i++)await new Promise(r=>setTimeout(r,100));
 }
 show('admin-login-modal',true);
}
function switchPane(register=false){show('pane-login',!register);show('pane-register',register);}
function errorTo(elKey,message){const el=document.getElementById(elKey);if(el){el.textContent=message;el.classList.remove('hidden');}}
async function login(){
 const email=String(document.getElementById('login-identifier')?.value||'').trim(),password=String(document.getElementById('login-password')?.value||'');
 if(!email||!password){errorTo('login-error',t('auth.required'));return;}
 try{
  const result=await api('/auth/login',{method:'POST',body:{email,password}});updateSession(result);show('admin-login-modal',false);
  // Off-Render dev origins require one top-level trip to establish first-party SSO cookie.
  if(location.origin!==new URL(ssoApiBase01581()).origin)await ssoEstablish01581(result.token,'crm');
 }catch(e){errorTo('login-error',e.message||t('auth.invalid'));}
}
async function register(){
 const name=[document.getElementById('reg-name')?.value,document.getElementById('reg-surname')?.value].map(x=>String(x||'').trim()).filter(Boolean).join(' ');
 const email=String(document.getElementById('reg-email')?.value||'').trim(),password=String(document.getElementById('reg-password')?.value||'');
 if(!name||!email||password.length<10){errorTo('reg-error',t('auth.registerFields'));return;}
 try{const result=await api('/auth/register',{method:'POST',body:{name,email,password}});updateSession(result);show('admin-login-modal',false);
  if(location.origin!==new URL(ssoApiBase01581()).origin)await ssoEstablish01581(result.token,'crm');
 }catch(e){errorTo('reg-error',e.message||t('auth.invalid'));}
}
async function start(){
 if(initializing)return;initializing=true;
 try{
  const returned=await ssoFinish01581('crm');
  if(returned.session)updateSession(returned.session);
  else if(getToken()){
   try{const restored=await api('/auth/session',{auth:true});updateSession({...restored,token:getToken()});}
   catch{updateSession(null);}
  }else if(!returned.handled){await ssoAuthorize01581('crm');return;}
 }catch(e){console.warn('[crm-sso-01581]',e?.message||e);}
 finally{initializing=false;refreshUi();}
}
export function initAuth({onAuth,headerTargets}={}){
 if(onAuth)currentOnAuth=onAuth;if(headerTargets)currentTargets=headerTargets;
 if(initialized){refreshUi();return;}initialized=true;
 // Legacy localStorage identities never authorize. Delete just the obsolete identity key.
 try{localStorage.removeItem('st_user');}catch(_){ }
 document.addEventListener('click',async e=>{
  const node=e.target instanceof Element?e.target:null;if(!node)return;
  if(node.closest('#global-login-btn, #admin-btn-login')){e.preventDefault();await openLoginModal();return;}
  if(node.closest('#admin-modal-close')){show('admin-login-modal',false);return;}
  if(node.closest('#tab-login')){switchPane(false);return;}
  if(node.closest('#tab-register')){switchPane(true);return;}
  if(node.closest('#btnDoLogin')){e.preventDefault();await login();return;}
  if(node.closest('#btnDoRegister')){e.preventDefault();await register();return;}
  if(node.closest('#btnLoginWithGoogle')){e.preventDefault();errorTo('login-error',t('auth.disabledMock'));return;}
  if(node.closest('#global-user-badge')){e.preventDefault();const dd=document.getElementById('global-user-dropdown');dd?.classList.toggle('hidden');return;}
  if(node.closest('#global-logout-btn, #admin-btn-logout')){e.preventDefault();await revokeAndSignOut();show('global-user-dropdown',false);return;}
  if(node.closest('#global-open-builder-01581')){
    e.preventDefault();const href=String(window.ST_SSO_BUILDER_URL_01581||'').trim();if(!href)return;
    const url=new URL(href);url.searchParams.set('st_sso','1');location.assign(url.href);return;
  }
  if(!node.closest('#user-menu'))show('global-user-dropdown',false);
 });
 let lastFocusCheck01581=0;
 window.addEventListener('focus',()=>{
   const now=Date.now();if(!getToken()||now-lastFocusCheck01581<4000)return;
   lastFocusCheck01581=now;
   void api('/auth/session',{auth:true}).then(restored=>updateSession({...restored,token:getToken()})).catch(()=>updateSession(null));
 });
 window.addEventListener('components:loaded',refreshUi);
 window.addEventListener('hashchange',()=>{refreshUi();});
 refreshUi();void start();
}
