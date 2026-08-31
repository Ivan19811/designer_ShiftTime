// 01085 · Pure Account UI view-model + client validation helpers.

const clean=(v)=>String(v??'').trim();
const emailOk=(v)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(v));

export function accountInitials01085(user={}){
  const name=clean(user?.name);
  if(name){
    const parts=name.split(/\s+/).filter(Boolean).slice(0,2);
    return parts.map(x=>Array.from(x)[0]||'').join('').toUpperCase()||'U';
  }
  const email=clean(user?.email);
  return (email ? email[0] : 'U').toUpperCase();
}

export function validateAccountLogin01085(input={}){
  const errors={};
  const email=clean(input.email);
  const password=String(input.password??'');
  if(!email)errors.email='Вкажіть email.';
  else if(!emailOk(email))errors.email='Перевірте формат email.';
  if(!password)errors.password='Вкажіть пароль.';
  return {valid:Object.keys(errors).length===0,errors};
}

export function validateAccountRegistration01085(input={}){
  const errors={};
  const name=clean(input.name);
  const email=clean(input.email);
  const password=String(input.password??'');
  const passwordConfirm=String(input.passwordConfirm??'');
  if(!name)errors.name='Вкажіть ім’я.';
  if(!email)errors.email='Вкажіть email.';
  else if(!emailOk(email))errors.email='Перевірте формат email.';
  if(!password)errors.password='Вкажіть пароль.';
  else if(password.length<10)errors.password='Пароль має містити щонайменше 10 символів.';
  if(!passwordConfirm)errors.passwordConfirm='Повторіть пароль.';
  else if(password!==passwordConfirm)errors.passwordConfirm='Паролі не збігаються.';
  return {valid:Object.keys(errors).length===0,errors};
}

export function createAccountViewModel01085(authState={}){
  const status=clean(authState?.status)||'anonymous';
  const user=authState?.user&&typeof authState.user==='object'?authState.user:null;
  const scope=authState?.scope&&typeof authState.scope==='object'?authState.scope:null;
  const authenticated=status==='authenticated'&&!!user;
  const displayName=authenticated?(clean(user.name)||clean(user.email)||'Користувач'):'Гість';
  const firstName=displayName.split(/\s+/).filter(Boolean)[0]||displayName;
  return Object.freeze({
    status,
    authenticated,
    restoring:status==='restoring',
    pending:status==='authenticating'||status==='restoring',
    displayName,
    headerLabel:authenticated?firstName:'Увійти',
    initials:authenticated?accountInitials01085(user):'U',
    email:authenticated?clean(user.email):'',
    userId:authenticated?clean(user.id):'',
    role:clean(scope?.role)||clean(scope?.membershipRole)||'',
    accountId:clean(scope?.accountId)||clean(scope?.tenantId)||'',
    workspaceId:clean(scope?.workspaceId)||'',
    storeId:clean(scope?.storeId)||'',
    storeName:clean(scope?.storeName)||'',
    expiresAt:authState?.expiresAt||null,
    lastError:clean(authState?.lastError),
  });
}
