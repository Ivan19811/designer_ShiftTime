// ShiftTime 01606C · Independent authorization for actual /api/v1/tables mutations.
// The original 01601 base permission and tenant-scoped DB checks MUST succeed first.
// This catalogue is intentionally precise: an unknown route is not a grant.
export const TABLE_ACTION_MODE_01606C='api.mode.table_actions';
const action=(name,uiControl='')=>Object.freeze({permission:`builder.tables.actions.${name}`,uiControl});
const ROOT=Object.freeze({POST:action('create','ui.control.tablecreatesubmit')});
const TABLE=Object.freeze({PATCH:action('settings_edit'),DELETE:action('archive','ui.control.tablearchive')});
const SUB=Object.freeze({
 fields:Object.freeze({POST:action('fields_create','ui.control.tablecreatecolumn'),PATCH:action('fields_edit'),DELETE:action('fields_delete','ui.control.tabledeletecolumn')}),
 records:Object.freeze({POST:action('records_create','ui.control.tableaddrow'),PATCH:action('records_edit'),DELETE:action('records_delete','ui.control.tabledeleterow')}),
 views:Object.freeze({POST:action('views_create','ui.control.tableaddview'),PATCH:action('views_edit','ui.control.tableviewapply'),DELETE:action('views_delete')})
});
export function classifyTableAction01606C(method,parts){
 const m=String(method||'').toUpperCase(),p=parts;
 if(!Array.isArray(p)||p[0]!=='api'||p[1]!=='v1'||p[2]!=='tables')return null;
 if(p.length===3)return ROOT[m]||null;
 if(!p[3])return null;
 if(p.length===4)return TABLE[m]||null;
 if(p.length!==5&&p.length!==6)return null;
 const family=SUB[p[4]];
 if(!family)return null;
 if(p.length===5&&m==='POST')return family.POST;
 if(p.length===6&&p[5]&&['PATCH','DELETE'].includes(m))return family[m];
 return null;
}
const denied=(permission)=>Object.assign(new Error('ST_ACCESS_TABLE_ACTION_DENIED_01606C'),{code:'ST_ACCESS_TABLE_ACTION_DENIED_01606C',statusCode:403,permission});
export function assertTableAction01606C(decision,requested){
 if(!requested||decision?.mode!=='custom')return true;
 const grants=new Set(Array.isArray(decision.permissions)?decision.permissions:[]);
 const uiRestricted=grants.has('ui.mode.controls');
 if(!grants.has(TABLE_ACTION_MODE_01606C)&&!uiRestricted)return true;
 if(!grants.has(requested.permission))throw denied(requested.permission);
 if(uiRestricted&&requested.uiControl&&!grants.has(requested.uiControl))throw denied(requested.uiControl);
 return true;
}
