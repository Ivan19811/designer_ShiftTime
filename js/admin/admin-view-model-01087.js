const clean=(v)=>String(v??'').trim();
export const ROLE_LABELS_01087=Object.freeze({owner:'Власник',admin:'Адміністратор',manager:'Менеджер',editor:'Редактор',viewer:'Перегляд','catalog-manager':'Менеджер каталогу','order-manager':'Менеджер замовлень'});
export const PERMISSION_LABELS_01087=Object.freeze({
  'admin.view':'Адміністрування',
  'admin.users.manage':'Керування користувачами',
  'admin.roles.manage':'Керування ролями',
  'admin.invites.manage':'Запрошення користувачів',
  'admin.database.schema':'Перегляд структури бази',
  'admin.database.rows':'Перегляд даних бази',
  'catalog.write':'Редагування каталогу',
  'orders.write':'Керування замовленнями',
});
export function roleLabel01087(role){return ROLE_LABELS_01087[clean(role).toLowerCase()]||clean(role)||'Учасник';}
export function permissionLabel01087(permission){return PERMISSION_LABELS_01087[clean(permission)]||clean(permission);}
export function canShowAdmin01087(overview){return Array.isArray(overview?.actor?.capabilities)&&overview.actor.capabilities.includes('admin.view');}
export function buildAdminSummary01087(input={}){const c=input?.counts||{};return {members:Number(c.members)||0,workspaces:Number(c.workspaces)||0,stores:Number(c.stores)||0,pendingInvitations:Number(c.pendingInvitations)||0};}
export function scopeLabel01087(member={}){if(member.storeId)return `Store · ${member.storeName||member.storeId}`;if(member.workspaceId)return `Workspace · ${member.workspaceName||member.workspaceId}`;return 'Весь Account';}
export function invitationStatusLabel01087(status){return ({pending:'Очікує',accepted:'Прийнято',revoked:'Відкликано',expired:'Прострочено'})[clean(status)]||clean(status);}
export function assignableRoles01087(actor={}){
  const capabilities=Array.isArray(actor?.capabilities)?actor.capabilities:[];
  if(!capabilities.includes('admin.roles.manage'))return [];
  const roles=['owner','admin','manager','editor','viewer','catalog-manager','order-manager'];
  return clean(actor?.role).toLowerCase()==='owner'?roles:roles.filter(role=>role!=='owner');
}
