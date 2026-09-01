const clean=(v)=>String(v??'').trim();
const ROLE_LABELS=Object.freeze({owner:'Власник',admin:'Адміністратор',manager:'Менеджер',editor:'Редактор',viewer:'Перегляд','catalog-manager':'Менеджер каталогу','order-manager':'Менеджер замовлень'});
const SCOPE_LABELS=Object.freeze({account:'Весь Account',workspace:'Workspace',store:'Store'});
export function roleLabel01088(role){return ROLE_LABELS[clean(role)]||clean(role)||'—';}
export function buildAccountContexts01088(contexts=[],activeStoreId=''){
  const active=clean(activeStoreId);
  return (Array.isArray(contexts)?contexts:[]).filter(x=>clean(x?.storeId)).map(x=>({
    ...x,
    active:clean(x.storeId)===active,
    title:`${clean(x.accountName)||'Account'} · ${clean(x.storeName)||clean(x.storeId)}`,
    meta:`${roleLabel01088(x.role)} · ${SCOPE_LABELS[clean(x.scopeMode)]||'Доступ'} · ${clean(x.workspaceName)||'Workspace'}`,
  }));
}
