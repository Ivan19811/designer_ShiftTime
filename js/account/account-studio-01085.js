// 01085 · Dedicated Account workspace + Inspector UI.
// Presentation only: authentication authority stays in marketplace-auth-runtime-01084.
import {
  initMarketplaceAuthRuntime01084,
  getMarketplaceAuthState01084,
  loginMarketplaceUser01084,
  registerMarketplaceUser01084,
  logoutMarketplaceUser01084,
  listMarketplaceAuthContexts01088,
  switchMarketplaceAuthContext01088,
  subscribeMarketplaceAuth01084,
} from '../marketplace/data/marketplace-auth-runtime-01084.js?v=01088';
import {
  createAccountViewModel01085,
  validateAccountLogin01085,
  validateAccountRegistration01085,
} from './account-view-model-01085.js?v=01085';
import {getInviteTokenFromUrl01087,inspectAccountInvitation01087,clearInviteTokenFromUrl01087} from './account-invitation-01087.js?v=01087';
import {buildAccountContexts01088} from './account-context-view-01088.js?v=01088';
import {SHIFTTIME_BUILD_STAGE,buildStageLabel} from '../core/build-stage.js?v=01088';

let initialized=false;
let unsubscribe=null;
let mode='login';
let localError='';
let fieldErrors={};
const draft={loginEmail:'',registerName:'',registerEmail:''};
let inviteToken='';let inviteInfo=null;let inviteLoading=false;
let contexts=[];let contextsLoading=false;let contextError='';

const esc=(v)=>String(v??'').replace(/[&<>"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=(v)=>String(v??'').trim();
function authState(){return getMarketplaceAuthState01084();}
function vm(){return createAccountViewModel01085(authState());}
function roleLabel(role){const r=clean(role).toLowerCase();return ({owner:'Власник',admin:'Адміністратор',editor:'Редактор',manager:'Менеджер',viewer:'Перегляд'}[r]||role||'Учасник');}
function dateLabel(value){if(!value)return 'Не вказано';try{return new Intl.DateTimeFormat('uk-UA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return String(value);}}
function errorText(key){return fieldErrors?.[key]?`<span class="st-account-field__error">${esc(fieldErrors[key])}</span>`:'';}
function statusBadge(view){if(view.restoring)return '<span class="st-account-status is-warn">Відновлення сесії…</span>';if(view.authenticated)return '<span class="st-account-status is-ok">Авторизовано</span>';return '<span class="st-account-status">Гість</span>';}

function loginForm(view){
  const busy=view.pending;
  return `<form class="st-account-form" data-account-form="login" novalidate>
    <div class="st-account-form__head"><span class="st-account-kicker">SHIFTTIME ID</span><h2>З поверненням</h2><p>Увійди до Builder, Marketplace і свого Store через одну захищену сесію.</p></div>
    ${localError||view.lastError?`<div class="st-account-message is-error" role="alert">${esc(localError||view.lastError)}</div>`:''}
    <label class="st-account-field"><span>Email</span><input name="email" type="email" autocomplete="email" value="${esc(draft.loginEmail)}" placeholder="name@example.com" ${busy?'disabled':''}>${errorText('email')}</label>
    <label class="st-account-field"><span>Пароль</span><input name="password" type="password" autocomplete="current-password" placeholder="Ваш пароль" ${busy?'disabled':''}>${errorText('password')}</label>
    <button class="st-account-submit" type="submit" ${busy?'disabled':''}><span>${busy?'Перевіряємо…':'Увійти'}</span><b aria-hidden="true">→</b></button>
    <div class="st-account-form__switch">Ще немає акаунта? <button type="button" data-account-action="show-register">Створити акаунт</button></div>
  </form>`;
}

function registerForm(view){
  const busy=view.pending;
  return `<form class="st-account-form" data-account-form="register" novalidate>
    <div class="st-account-form__head"><span class="st-account-kicker">${inviteInfo?'ЗАПРОШЕННЯ · 01087':'НОВИЙ АКАУНТ'}</span><h2>${inviteInfo?`Приєднатися до ${esc(inviteInfo.accountName||'команди')}`:'Створи свій простір'}</h2><p>${inviteInfo?`Роль: ${esc(roleLabel(inviteInfo.role))}. Якщо цей email уже має ShiftTime ID — введи свій існуючий пароль.`:'Після реєстрації ShiftTime автоматично створить особисті Account → Workspace → Store.'}</p></div>${inviteInfo?`<div class="st-account-invite-banner"><b>Запрошення активне</b><span>${esc(inviteInfo.email)} · діє до ${esc(dateLabel(inviteInfo.expiresAt))}</span></div>`:''}
    ${localError||view.lastError?`<div class="st-account-message is-error" role="alert">${esc(localError||view.lastError)}</div>`:''}
    <label class="st-account-field"><span>Ім’я</span><input name="name" autocomplete="name" value="${esc(draft.registerName)}" placeholder="Ваше ім’я" ${busy?'disabled':''}>${errorText('name')}</label>
    <label class="st-account-field"><span>Email</span><input name="email" type="email" autocomplete="email" value="${esc(draft.registerEmail)}" placeholder="name@example.com" ${inviteInfo?'readonly':''} ${busy?'disabled':''}>${errorText('email')}</label>
    <div class="st-account-field-grid">
      <label class="st-account-field"><span>Пароль</span><input name="password" type="password" autocomplete="new-password" placeholder="Мінімум 10 символів" ${busy?'disabled':''}>${errorText('password')}</label>
      <label class="st-account-field"><span>Повторіть пароль</span><input name="passwordConfirm" type="password" autocomplete="new-password" placeholder="Ще раз" ${busy?'disabled':''}>${errorText('passwordConfirm')}</label>
    </div>
    <button class="st-account-submit" type="submit" ${busy?'disabled':''}><span>${busy?'Створюємо…':'Створити акаунт'}</span><b aria-hidden="true">→</b></button>
    <div class="st-account-form__switch">Уже є акаунт? <button type="button" data-account-action="show-login">Увійти</button></div>
  </form>`;
}

function anonymousWorkspace(view){
  return `<div class="st-account-workspace is-anonymous" data-account-screen="${esc(mode)}">
    <section class="st-account-brand-card">
      <div class="st-account-brand-card__orb">S</div>
      <span class="st-account-kicker">${esc(buildStageLabel('SHIFTTIME BUILDER'))}</span>
      <h1>Один акаунт.<br><em>Увесь твій бізнес.</em></h1>
      <p>Авторизація тепер є частиною архітектури Builder: користувач, сесія, Workspace і Store працюють як один захищений контекст.</p>
      <div class="st-account-benefits">
        <article><b>01</b><div><strong>Окремий Store</strong><span>Дані ізольовані серверним scope.</span></div></article>
        <article><b>02</b><div><strong>Жива сесія</strong><span>Bearer token з Auth Runtime 01084.</span></div></article>
        <article><b>03</b><div><strong>Готово до ролей</strong><span>Admin/Users/Roles доступні в окремому модулі 01087.</span></div></article>
      </div>
      <div class="st-account-brand-card__foot">${statusBadge(view)}<span>Без DEV-role перемикача</span></div>
    </section>
    <section class="st-account-auth-card">${mode==='register'?registerForm(view):loginForm(view)}</section>
  </div>`;
}

function metric(label,value,sub=''){
  return `<article class="st-account-metric"><span>${esc(label)}</span><strong>${esc(value||'—')}</strong>${sub?`<small>${esc(sub)}</small>`:''}</article>`;
}

function accountOverview(view){
  return `<div class="st-account-workspace is-authenticated">
    <section class="st-account-profile-hero">
      <div class="st-account-profile-hero__avatar">${esc(view.initials)}</div>
      <div class="st-account-profile-hero__copy"><span class="st-account-kicker">МІЙ АКАУНТ</span><h1>${esc(view.displayName)}</h1><p>${esc(view.email)}</p><div class="st-account-profile-tags">${statusBadge(view)}<span class="st-account-role">${esc(roleLabel(view.role))}</span></div></div>
      <button class="st-account-ghost-btn" type="button" data-account-action="logout">Вийти</button>
    </section>
    <section class="st-account-dashboard-grid">
      ${metric('Account',view.accountId,'Tenant authority')}
      ${metric('Workspace',view.workspaceId,'Робочий простір')}
      ${metric('Store',view.storeName||view.storeId,'Активний магазин')}
      ${metric('Роль',roleLabel(view.role),'Membership')}
    </section>
    <section class="st-account-info-grid">
      <article class="st-account-panel-card"><div class="st-account-panel-card__head"><div><span class="st-account-kicker">ПРОФІЛЬ</span><h3>Особисті дані</h3></div><span class="st-account-panel-icon">ID</span></div><dl><div><dt>Ім’я</dt><dd>${esc(view.displayName)}</dd></div><div><dt>Email</dt><dd>${esc(view.email)}</dd></div><div><dt>User ID</dt><dd class="is-code">${esc(view.userId)}</dd></div></dl><p class="st-account-card-note">Редагування профілю додамо після окремого profile API, щоб UI не створював фальшиве локальне джерело правди.</p></article>
      <article class="st-account-panel-card"><div class="st-account-panel-card__head"><div><span class="st-account-kicker">СЕСІЯ</span><h3>Безпека входу</h3></div><span class="st-account-panel-icon">✓</span></div><dl><div><dt>Статус</dt><dd>Активна</dd></div><div><dt>Діє до</dt><dd>${esc(dateLabel(view.expiresAt))}</dd></div><div><dt>Store scope</dt><dd class="is-code">${esc(view.storeId)}</dd></div></dl><button class="st-account-link-btn" type="button" data-account-action="show-security">Переглянути сесію →</button></article>
    </section>
  </div>`;
}

function securityWorkspace(view){
  return `<div class="st-account-workspace is-authenticated">
    <section class="st-account-profile-hero is-compact"><div class="st-account-profile-hero__avatar">${esc(view.initials)}</div><div class="st-account-profile-hero__copy"><span class="st-account-kicker">БЕЗПЕКА</span><h1>Сесія та доступ</h1><p>Поточна server-authorized сесія для ${esc(view.email)}.</p></div><button class="st-account-ghost-btn" type="button" data-account-action="show-overview">← До профілю</button></section>
    <section class="st-account-security-card"><div class="st-account-security-card__status"><span class="st-account-security-pulse"></span><div><strong>Сесія активна</strong><small>Токен зберігається тільки в sessionStorage поточної вкладки.</small></div></div><dl><div><dt>User</dt><dd>${esc(view.userId)}</dd></div><div><dt>Account</dt><dd>${esc(view.accountId)}</dd></div><div><dt>Workspace</dt><dd>${esc(view.workspaceId)}</dd></div><div><dt>Store</dt><dd>${esc(view.storeId)}</dd></div><div><dt>Роль</dt><dd>${esc(roleLabel(view.role))}</dd></div><div><dt>Expiration</dt><dd>${esc(dateLabel(view.expiresAt))}</dd></div></dl><div class="st-account-security-actions"><button type="button" class="st-account-danger-btn" data-account-action="logout">Завершити цю сесію</button><p>Після виходу Bearer session буде відкликана на backend і видалена з цієї вкладки.</p></div></section>
  </div>`;
}


function contextsWorkspace(view){
  const items=buildAccountContexts01088(contexts,view.storeId);
  return `<div class="st-account-workspace is-authenticated">
    <section class="st-account-profile-hero is-compact"><div class="st-account-profile-hero__avatar">${esc(view.initials)}</div><div class="st-account-profile-hero__copy"><span class="st-account-kicker">КОНТЕКСТИ · ${esc(SHIFTTIME_BUILD_STAGE)}</span><h1>Account / Workspace / Store</h1><p>Один ShiftTime ID може мати різні ролі в кількох магазинах. Активний контекст завжди повторно авторизує backend.</p></div><button class="st-account-ghost-btn" type="button" data-account-action="show-overview">← До профілю</button></section>
    ${contextError?`<div class="st-account-message is-error">${esc(contextError)}</div>`:''}
    <section class="st-account-context-card"><div class="st-account-panel-card__head"><div><span class="st-account-kicker">ДОСТУПНІ КОНТЕКСТИ</span><h3>${contextsLoading?'Оновлення…':`${items.length} доступних Store`}</h3></div><span class="st-account-panel-icon">${items.length}</span></div>
      <div class="st-account-context-grid">${items.map(item=>`<article class="st-account-context-item ${item.active?'is-active':''}"><div><span>${esc(item.accountName||'Account')}</span><h3>${esc(item.storeName||item.storeId)}</h3><p>${esc(item.meta)}</p><code>${esc(item.storeId)}</code></div><button type="button" data-account-action="switch-context" data-store-id="${esc(item.storeId)}" ${item.active||contextsLoading?'disabled':''}>${item.active?'Активний':'Перейти →'}</button></article>`).join('')||'<div class="st-account-context-empty">Доступні контексти не знайдено.</div>'}</div>
    </section>
  </div>`;
}

function inspector(view){
  const buildLabel=esc(buildStageLabel('ACCOUNT'));
  if(!view.authenticated){
    return `<div class="st-account-inspector"><div class="st-account-inspector__hero"><span class="st-account-kicker">${buildLabel}</span><h2>Мій акаунт</h2><p>Окремий контекст входу й реєстрації, без налаштувань Canvas або Marketplace.</p></div><div class="st-account-inspector__nav"><button class="${mode==='login'?'is-active':''}" type="button" data-account-action="show-login"><span>↳</span><div><b>Вхід</b><small>Існуючий акаунт</small></div></button><button class="${mode==='register'?'is-active':''}" type="button" data-account-action="show-register"><span>＋</span><div><b>Реєстрація</b><small>Новий Account + Store</small></div></button></div><div class="st-account-inspector__status"><span>Auth Runtime</span><b>${view.pending?'Підключення…':'Готовий'}</b><small>01084 session authority</small></div></div>`;
  }
  return `<div class="st-account-inspector"><div class="st-account-inspector__user"><span class="st-account-inspector__avatar">${esc(view.initials)}</span><div><span class="st-account-kicker">${buildLabel}</span><h2>${esc(view.displayName)}</h2><p>${esc(view.email)}</p></div></div><div class="st-account-inspector__nav"><button class="${mode==='overview'?'is-active':''}" type="button" data-account-action="show-overview"><span>⌂</span><div><b>Огляд</b><small>Профіль і scope</small></div></button><button class="${mode==='contexts'?'is-active':''}" type="button" data-account-action="show-contexts"><span>⇄</span><div><b>Контексти</b><small>${contextsLoading?'Оновлення…':`${contexts.length||1} Store / ролі`}</small></div></button><button class="${mode==='security'?'is-active':''}" type="button" data-account-action="show-security"><span>◈</span><div><b>Безпека</b><small>Поточна сесія</small></div></button></div><div class="st-account-inspector__scope"><span>Поточний Store</span><strong>${esc(view.storeName||view.storeId||'—')}</strong><code>${esc(view.storeId||'')}</code></div><button class="st-account-inspector__logout" type="button" data-account-action="logout">Вийти з акаунта</button></div>`;
}

function updateHeader(view){
  const btn=document.getElementById('builderAccountButton');
  const avatar=document.getElementById('builderAccountAvatar');
  const label=document.getElementById('builderAccountLabel');
  const meta=document.getElementById('builderAccountMeta');
  if(!btn)return;
  btn.classList.toggle('is-authenticated',view.authenticated);
  btn.classList.toggle('is-pending',view.pending);
  btn.setAttribute('aria-label',view.authenticated?`Мій акаунт: ${view.displayName}`:'Увійти або створити акаунт');
  if(avatar)avatar.textContent=view.authenticated?view.initials:'U';
  if(label)label.textContent=view.headerLabel;
  if(meta)meta.textContent=view.authenticated?(view.storeName||roleLabel(view.role)):'Мій акаунт';
}

function render(){
  const view=vm();
  if(view.authenticated&&!['overview','security','contexts'].includes(mode))mode='overview';
  if(!view.authenticated&&!['login','register'].includes(mode))mode='login';
  const workspace=document.getElementById('accountStudioView');
  const panel=document.getElementById('account-panel-root');
  if(workspace)workspace.innerHTML=view.authenticated?(mode==='security'?securityWorkspace(view):mode==='contexts'?contextsWorkspace(view):accountOverview(view)):anonymousWorkspace(view);
  if(panel)panel.innerHTML=inspector(view);
  updateHeader(view);
}

async function loadContexts({silent=false}={}){
  if(!authState()?.token){contexts=[];contextError='';contextsLoading=false;return [];}
  if(!silent){contextsLoading=true;contextError='';render();}
  try{contexts=await listMarketplaceAuthContexts01088();contextError='';return contexts;}
  catch(e){contextError=e?.message||'Не вдалося завантажити доступні контексти.';return [];}
  finally{contextsLoading=false;render();}
}

async function switchContext(storeId){
  const id=clean(storeId);if(!id)return;
  contextsLoading=true;contextError='';render();
  try{await switchMarketplaceAuthContext01088(id);mode='overview';await loadContexts({silent:true});}
  catch(e){contextError=e?.message||'Не вдалося перемкнути Store.';}
  finally{contextsLoading=false;render();}
}

function setMode(next){
  mode=next;
  localError='';
  fieldErrors={};
  render();
}

async function submitLogin(form){
  const data=Object.fromEntries(new FormData(form).entries());
  draft.loginEmail=clean(data.email);
  const result=validateAccountLogin01085(data);
  fieldErrors=result.errors;
  localError='';
  if(!result.valid){render();return;}
  render();
  try{await loginMarketplaceUser01084({email:draft.loginEmail,password:String(data.password||'')});mode='overview';localError='';fieldErrors={};await loadContexts({silent:true});}
  catch(e){localError=e?.message||'Не вдалося увійти.';}
  render();
}

async function submitRegister(form){
  const data=Object.fromEntries(new FormData(form).entries());
  draft.registerName=clean(data.name);draft.registerEmail=clean(data.email);
  const result=validateAccountRegistration01085(data);
  fieldErrors=result.errors;
  localError='';
  if(!result.valid){render();return;}
  render();
  try{await registerMarketplaceUser01084({name:draft.registerName,email:draft.registerEmail,password:String(data.password||''),...(inviteToken?{inviteToken}: {})});if(inviteToken)clearInviteTokenFromUrl01087();inviteToken='';inviteInfo=null;mode='overview';localError='';fieldErrors={};await loadContexts({silent:true});}
  catch(e){localError=e?.message||'Не вдалося створити акаунт.';}
  render();
}

async function runAction(action,source){
  if(action==='show-login')return setMode('login');
  if(action==='show-register')return setMode('register');
  if(action==='show-overview')return setMode('overview');
  if(action==='show-security')return setMode('security');
  if(action==='show-contexts'){mode='contexts';render();return loadContexts();}
  if(action==='switch-context')return switchContext(source?.dataset?.storeId||'');
  if(action==='logout'){
    localError='';fieldErrors={};contexts=[];contextError='';
    await logoutMarketplaceUser01084();
    mode='login';
    render();
  }
}

function onClick(ev){
  const btn=ev.target?.closest?.('[data-account-action]');
  if(!btn)return;
  ev.preventDefault();
  runAction(btn.getAttribute('data-account-action'),btn).catch((e)=>{localError=e?.message||String(e);render();});
}

function onSubmit(ev){
  const form=ev.target?.closest?.('[data-account-form]');
  if(!form)return;
  ev.preventDefault();
  const kind=form.getAttribute('data-account-form');
  (kind==='register'?submitRegister(form):submitLogin(form)).catch((e)=>{localError=e?.message||String(e);render();});
}

export async function initAccountStudio01085(){
  if(initialized)return window.ST_ACCOUNT_STUDIO_01085||true;
  initialized=true;
  await initMarketplaceAuthRuntime01084();
  const workspace=document.getElementById('accountStudioView');
  const panel=document.getElementById('account-panel-root');
  if(!workspace||!panel){initialized=false;throw new Error('01085 Account mount points are missing');}
  workspace.addEventListener('click',onClick);
  workspace.addEventListener('submit',onSubmit);
  panel.addEventListener('click',onClick);
  unsubscribe=subscribeMarketplaceAuth01084(()=>render());
  inviteToken=getInviteTokenFromUrl01087();
  if(inviteToken&&!authState()?.user){inviteLoading=true;mode='register';try{inviteInfo=await inspectAccountInvitation01087(inviteToken);draft.registerEmail=String(inviteInfo?.email||'');}catch(e){localError=e?.message||'Запрошення недійсне.';}finally{inviteLoading=false;}}
  if(authState()?.user)await loadContexts({silent:true});
  render();
  const api=Object.freeze({stage:'01088',render,setMode,getViewModel:()=>vm(),destroy(){try{unsubscribe?.();}catch{}unsubscribe=null;initialized=false;}});
  try{window.ST_ACCOUNT_STUDIO_01085=api;window.__ST_ALL_LOG__?.push?.('account-studio:ready-01088',{stage:'01088',authStatus:vm().status,invite:Boolean(inviteToken),next:'01089-dynamic-table-data-model-foundation'});}catch{}
  return api;
}
