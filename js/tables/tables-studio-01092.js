// 01092 · ShiftTime Tables workspace, Inspector and repository runtime.
import {TableStore01092} from './data/table-store-01092.js?v=01092';
import {LocalTableRepository01092} from './repositories/local-table-repository-01092.js?v=01092';
import {ApiTableRepository01092} from './repositories/api-table-repository-01092.js?v=01094';
import {BUILTIN_TABLE_TEMPLATES_01092,createTableFromTemplate01092,TABLE_FIELD_TYPES_01092,tableFieldTypeMeta01092,isEditableTableFieldType01092,normalizeTableStoredValue01094} from './tables-schema-01092.js?v=01094';
import {initMarketplaceAuthRuntime01084,getMarketplaceAuthState01084,subscribeMarketplaceAuth01084} from '../marketplace/data/marketplace-auth-runtime-01084.js?v=01090';
import {getMarketplaceBackendConfig01071} from '../marketplace/data/marketplace-backend-config-01071.js?v=01071';
import {getMarketplaceApiAuth01089} from '../marketplace/data/marketplace-api-auth-01089.js?v=01089';
import {SHIFTTIME_BUILD_STAGE} from '../core/build-stage.js?v=01094';

let initialized=false,store=null,unsubscribeStore=null,unsubscribeAuth=null;
const ui={createOpen:false,templateId:'suppliers',inspectorTab:'table',fieldForm:false,notice:'',listSearch:'',templateSearch:'',templateCategory:'Усі'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').trim();
const auth=()=>getMarketplaceAuthState01084();
const repoInfo=()=>store?.getRepositoryInfo?.()||{type:'—',name:'—'};

function makeRepository(){
  if(auth()?.status==='authenticated'&&clean(auth()?.token)){
    const config=getMarketplaceBackendConfig01071();
    return new ApiTableRepository01092({baseUrl:config.apiBaseUrl,requestTimeoutMs:config.requestTimeoutMs,tokenProvider:()=>getMarketplaceApiAuth01089().token,contextProvider:()=>getMarketplaceApiAuth01089()});
  }
  return new LocalTableRepository01092();
}

function scopeLabel(value){return ({personal:'Personal',account:'Account',workspace:'Workspace',store:'Store'}[value]||value||'Store');}
function typeOptions(selected='text'){return TABLE_FIELD_TYPES_01092.map(type=>`<option value="${type}" ${type===selected?'selected':''}>${esc(tableFieldTypeMeta01092(type).label)}</option>`).join('');}
function selectOptions(field,value){const options=Array.isArray(field.config?.options)?field.config.options:[];return `<option value="">—</option>${options.map(x=>{const v=clean(x?.value??x?.name??x);return `<option value="${esc(v)}" ${v===clean(value)?'selected':''}>${esc(v)}</option>`;}).join('')}`;}

function cellEditor(field,record){
  const value=normalizeTableStoredValue01094(record.values?.[field.id])??'';
  const attrs=`data-table-cell data-field-id="${esc(field.id)}" data-record-id="${esc(record.id)}" data-field-type="${esc(field.type)}"`;
  if(!isEditableTableFieldType01092(field.type)){const systemValue=field.type==='created-time'?record.createdAt:field.type==='updated-time'?record.updatedAt:(record.createdByUserId||'Local DEV');const label=field.type==='created-by'?systemValue:(systemValue?new Intl.DateTimeFormat('uk-UA',{dateStyle:'short',timeStyle:'short'}).format(new Date(systemValue)):'—');return `<div class="stt-cell is-readonly" ${attrs}>${esc(label)}</div>`;}
  if(field.type==='checkbox')return `<label class="stt-cell stt-cell--check" ${attrs}><input type="checkbox" data-table-cell-input ${value===true?'checked':''}><span></span></label>`;
  if(field.type==='select'||field.type==='status')return `<div class="stt-cell ${field.type==='status'?'stt-cell--status':''}" ${attrs}><select data-table-cell-input>${selectOptions(field,value)}</select></div>`;
  if(field.type==='multi-select'){const shown=Array.isArray(value)?value.join(', '):value;return `<div class="stt-cell" ${attrs}><input data-table-cell-input type="text" value="${esc(shown)}" placeholder="через кому"></div>`;}
  if(field.type==='number'||field.type==='currency'||field.type==='percent')return `<div class="stt-cell is-number" ${attrs}><input data-table-cell-input type="number" step="any" value="${esc(value)}"></div>`;
  if(field.type==='date')return `<div class="stt-cell" ${attrs}><input data-table-cell-input type="date" value="${esc(value)}"></div>`;
  if(field.type==='date-time')return `<div class="stt-cell" ${attrs}><input data-table-cell-input type="datetime-local" value="${esc(value?String(value).slice(0,16):'')}"></div>`;
  if(field.type==='email')return `<div class="stt-cell" ${attrs}><input data-table-cell-input type="email" value="${esc(value)}"></div>`;
  if(field.type==='url')return `<div class="stt-cell" ${attrs}><input data-table-cell-input type="url" value="${esc(value)}"></div>`;
  if(field.type==='image-file')return `<div class="stt-cell is-readonly" ${attrs}><span class="stt-file-chip">${Array.isArray(value)&&value.length?`${value.length} файл(и)`:'Додати файл у 01094'}</span></div>`;
  return `<div class="stt-cell" ${attrs}><input data-table-cell-input type="text" value="${esc(value)}" placeholder="${esc(field.name)}"></div>`;
}

function gridHtml(bundle){
  const fields=bundle.fields||[],records=bundle.records||[],view=bundle.views?.[0]||null;
  const order=view?.settings?.columnOrder||fields.map(x=>x.id),byId=new Map(fields.map(x=>[x.id,x]));
  const visible=order.map(id=>byId.get(id)).filter(Boolean).concat(fields.filter(x=>!order.includes(x.id))).filter(x=>!(view?.settings?.hiddenFields||[]).includes(x.id));
  const widths=visible.map(f=>`${Math.max(140,Number(view?.settings?.columnWidths?.[f.id])||(f.type==='long-text'?260:180))}px`).join(' ');
  return `<section class="stt-grid-shell" data-table-grid>
    <div class="stt-grid-scroll">
      <div class="stt-grid" style="--stt-cols:56px ${widths||'220px'} 54px">
        <div class="stt-grid-head stt-row-index"><input type="checkbox" aria-label="Вибрати всі записи"></div>
        ${visible.map(field=>`<button type="button" class="stt-grid-head" data-table-field-menu="${esc(field.id)}" title="Меню поля"><span class="stt-type-icon">${esc(tableFieldTypeMeta01092(field.type).icon)}</span><b>${esc(field.name)}</b><small>${esc(tableFieldTypeMeta01092(field.type).label)}</small><i>⋮</i></button>`).join('')}
        <button type="button" class="stt-grid-head stt-add-column" data-table-add-field title="Додати колонку">＋</button>
        ${records.length?records.map((record,index)=>`<div class="stt-grid-row" data-record-row="${esc(record.id)}" style="display:contents"><div class="stt-row-index"><span class="stt-row-drag" data-row-drag-foundation title="Перетягування рядків — engine 01095">⠿</span><b>${index+1}</b></div>${visible.map(field=>cellEditor(field,record)).join('')}<button class="stt-row-more" data-table-delete-record="${esc(record.id)}" title="Видалити запис">×</button></div>`).join(''):`<div class="stt-empty-grid" style="grid-column:1/-1"><span>✦</span><h3>Таблиця готова до даних</h3><p>Додайте перший запис або створіть таблицю з готової заготовки.</p><button data-table-add-row>+ Додати запис</button></div>`}
        <button type="button" class="stt-add-row-line" data-table-add-row style="grid-column:1/-1">＋ Додати запис</button>
      </div>
    </div>
    <footer class="stt-grid-footer"><span>${records.length} записів</span><span>${fields.length} полів</span><span>Typed DnD contract · exact types · ${SHIFTTIME_BUILD_STAGE}</span></footer>
  </section>`;
}

function toolbarHtml(bundle){const table=bundle.table,view=bundle.views?.[0];return `<header class="stt-toolbar"><div class="stt-toolbar__title"><span>${esc(table.icon||'▦')}</span><div><small>SHIFTTIME TABLES · ${SHIFTTIME_BUILD_STAGE}</small><h1>${esc(table.name)}</h1></div><button title="Обране">☆</button></div><div class="stt-view-tabs"><button class="is-active"><span>▦</span>${esc(view?.name||'Усі записи')}</button><button data-table-future="views">＋ View</button></div><div class="stt-toolbar__actions"><button data-table-future="filter">⌁ Filter</button><button data-table-future="sort">⇅ Sort</button><button data-table-future="group">▤ Group</button><button data-table-future="columns">▥ Columns</button><button data-table-future="search">⌕ Search</button><button data-table-future="automations">⚡ Automations</button><button data-table-future="share">↗ Share</button><button class="is-primary" data-table-add-row>＋ Row</button></div></header>`;}

function templateGallery(){
  const categories=['Усі',...new Set(BUILTIN_TABLE_TEMPLATES_01092.map(x=>x.category))];
  const templates=BUILTIN_TABLE_TEMPLATES_01092.filter(x=>(ui.templateCategory==='Усі'||x.category===ui.templateCategory)&&(!ui.templateSearch||`${x.name} ${x.description}`.toLowerCase().includes(ui.templateSearch.toLowerCase())));
  return `<div class="stt-create-overlay" data-table-create-overlay><div class="stt-create-dialog"><header><div><span>СТВОРИТИ ТАБЛИЦЮ</span><h2>З чого почнемо?</h2><p>Виберіть професійну ShiftTime-заготовку або чисту таблицю.</p></div><button data-table-close-create>×</button></header><div class="stt-create-tools"><label><span>⌕</span><input data-template-search value="${esc(ui.templateSearch)}" placeholder="Пошук заготовок"></label><nav>${categories.map(x=>`<button class="${x===ui.templateCategory?'is-active':''}" data-template-category="${esc(x)}">${esc(x)}</button>`).join('')}</nav></div><div class="stt-template-grid">${templates.map(t=>`<button type="button" class="stt-template-card ${ui.templateId===t.id?'is-selected':''}" data-template-id="${esc(t.id)}" data-template-search-text="${esc(`${t.name} ${t.description}`.toLowerCase())}" style="--accent:${esc(t.accent)}"><div class="stt-template-preview"><span>${esc(t.icon)}</span><div>${t.fields.slice(0,5).map(f=>`<i style="width:${45+Math.min(45,f.name.length*4)}%"></i>`).join('')}</div></div><small>${esc(t.category)}</small><h3>${esc(t.name)}</h3><p>${esc(t.description)}</p><footer><span>${t.fields.length} полів</span><b>${ui.templateId===t.id?'Обрано':'Переглянути →'}</b></footer></button>`).join('')}</div><form class="stt-create-form" data-table-create-form><label><span>Назва таблиці</span><input name="name" required value="${esc(BUILTIN_TABLE_TEMPLATES_01092.find(x=>x.id===ui.templateId)?.name||'Нова таблиця')}"></label><label><span>Scope</span><select name="scopeType"><option value="store">Store — поточний магазин</option><option value="workspace">Workspace — робочий простір</option><option value="account">Account — увесь бізнес</option><option value="personal">Personal — тільки я</option></select></label><label class="is-check"><input type="checkbox" name="includeSamples" checked><span>Додати демонстраційні записи</span></label><button type="submit">Створити таблицю →</button></form></div></div>`;
}

function innerSidebar(state){
  const tables=state.tables.filter(x=>!ui.listSearch||x.name.toLowerCase().includes(ui.listSearch.toLowerCase()));
  return `<aside class="stt-library"><div class="stt-brand"><span>▦</span><div><b>ShiftTime</b><strong>Tables</strong></div><em>BETA</em></div><button class="stt-new" data-table-open-create>＋ Нова таблиця</button><label class="stt-search"><span>⌕</span><input data-table-list-search value="${esc(ui.listSearch)}" placeholder="Пошук таблиць"></label><nav class="stt-library-nav"><button class="is-active"><span>▦</span>Мої таблиці <b>${state.tables.length}</b></button><button><span>◴</span>Останні</button><button><span>☆</span>Обрані</button><button><span>◎</span>Shared with me</button><button data-table-open-create><span>✦</span>Templates</button><button><span>⌫</span>Archive</button></nav><div class="stt-list-title"><span>ТАБЛИЦІ</span><button data-table-open-create>＋</button></div><div class="stt-table-list">${tables.length?tables.map(table=>`<button class="${table.id===state.activeTableId?'is-active':''}" data-table-open="${esc(table.id)}" data-table-search-text="${esc(table.name.toLowerCase())}"><span>${esc(table.icon||'▦')}</span><div><b>${esc(table.name)}</b><small>${scopeLabel(table.scopeType)} · ${Number(table.recordCount)||0} rows</small></div><i>›</i></button>`).join(''):'<p>Таблиць ще немає</p>'}</div><footer><div class="stt-avatar">${esc((auth()?.user?.name||'DEV').slice(0,2).toUpperCase())}</div><div><b>${esc(auth()?.user?.name||'Local DEV')}</b><small>${auth()?.status==='authenticated'?'PostgreSQL authority':'Local demo repository'}</small></div></footer></aside>`;
}

function emptyWorkspace(){return `<main class="stt-welcome"><div class="stt-orbit"><span>▦</span><i></i><i></i><i></i></div><span class="stt-kicker">SHIFTTIME TABLES · ${SHIFTTIME_BUILD_STAGE}</span><h1>Дані, які працюють<br>разом із вашим бізнесом</h1><p>Створюйте власні бази, typed-поля, записи та професійні заготовки у правильному Account / Workspace / Store scope.</p><div><button data-table-open-create>＋ Створити першу таблицю</button><button data-table-open-create>✦ Відкрити Templates</button></div><ul><li><b>19</b><span>типів полів</span></li><li><b>4</b><span>рівні scope</span></li><li><b>6</b><span>готових шаблонів</span></li></ul></main>`;}

function workspaceHtml(state){
  const error=state.error?`<div class="stt-alert is-error"><b>Не вдалося синхронізувати Tables</b><span>${esc(state.error)}</span><button data-table-refresh>Повторити</button></div>`:'';
  const notice=ui.notice?`<div class="stt-alert is-ok"><span>${esc(ui.notice)}</span></div>`:'';
  return `<div class="stt-studio ${state.loading?'is-loading':''}">${innerSidebar(state)}<div class="stt-workarea">${state.bundle?`${toolbarHtml(state.bundle)}${gridHtml(state.bundle)}`:emptyWorkspace()}${error}${notice}</div>${ui.createOpen?templateGallery():''}<div class="stt-loader"><span></span><b>Синхронізація…</b></div></div>`;
}

const inspectorTabs=[['table','Таблиця'],['view','View'],['columns','Колонки'],['rows','Рядки'],['style','Стиль'],['data','Дані'],['permissions','Права'],['automations','Автоматизації']];
function inspectorHtml(state){
  const bundle=state.bundle,table=bundle?.table,fields=bundle?.fields||[],view=bundle?.views?.[0],repo=repoInfo();
  const tabs=`<div class="stt-inspector-tabs">${inspectorTabs.map(([id,label])=>`<button class="${ui.inspectorTab===id?'is-active':''}" data-table-inspector-tab="${id}">${label}</button>`).join('')}</div>`;
  let body='';
  if(!table)body=`<div class="stt-inspector-empty"><span>▦</span><h3>ShiftTime Tables</h3><p>Створіть або відкрийте таблицю — тут з’являться її професійні налаштування.</p><button data-table-open-create>＋ Нова таблиця</button></div>`;
  else if(ui.inspectorTab==='table')body=`<form class="stt-inspector-form" data-table-settings-form><label><span>Назва</span><input name="name" value="${esc(table.name)}"></label><label><span>Іконка</span><input name="icon" value="${esc(table.icon||'▦')}" maxlength="4"></label><label><span>Опис</span><textarea name="description">${esc(table.description||'')}</textarea></label><label><span>Scope</span><input value="${esc(scopeLabel(table.scopeType))}" disabled><small>Scope незмінний після створення, щоб не переносити дані між контурами випадково.</small></label><button type="submit">Зберегти таблицю</button><button type="button" class="is-danger" data-table-delete>Архівувати таблицю</button></form>`;
  else if(ui.inspectorTab==='view')body=`<div class="stt-inspector-card"><span>ACTIVE VIEW</span><h3>${esc(view?.name||'Усі записи')}</h3><p>Table View · ${esc(view?.settings?.rowDensity||'comfortable')}</p></div><div class="stt-setting-list"><button data-table-future="filters"><span>⌁</span><div><b>Filters</b><small>${view?.settings?.filters?.length||0} правил</small></div><i>›</i></button><button data-table-future="sorts"><span>⇅</span><div><b>Multi-sort</b><small>${view?.settings?.sorts?.length||0} правил</small></div><i>›</i></button><button data-table-future="groups"><span>▤</span><div><b>Group</b><small>Foundation ready</small></div><i>›</i></button></div>`;
  else if(ui.inspectorTab==='columns')body=`<button class="stt-inspector-primary" data-table-add-field>＋ Додати колонку</button>${ui.fieldForm?`<form class="stt-field-form" data-table-field-form><label><span>Назва поля</span><input name="name" required value="Нове поле"></label><label><span>Тип</span><select name="type">${typeOptions()}</select></label><label class="is-check"><input name="required" type="checkbox"><span>Обов’язкове</span></label><button type="submit">Створити поле</button></form>`:''}<div class="stt-field-list">${fields.map(field=>`<div><span>${esc(tableFieldTypeMeta01092(field.type).icon)}</span><div><b>${esc(field.name)}</b><small>${esc(tableFieldTypeMeta01092(field.type).label)} · ${esc(field.key)}</small></div><button data-table-delete-field="${esc(field.id)}" title="Видалити">×</button></div>`).join('')}</div>`;
  else if(ui.inspectorTab==='rows')body=`<div class="stt-inspector-card"><span>RECORD ENGINE</span><h3>${bundle.records?.length||0} записів</h3><p>Inline edit, серверний CRUD і typed validation активні.</p></div><div class="stt-setting-list"><button><span>↕</span><div><b>Row density</b><small>Comfortable</small></div><i>›</i></button><button><span>↩</span><div><b>Wrap text</b><small>Auto</small></div><i>›</i></button><button data-table-future="record-detail"><span>▤</span><div><b>Record Detail</b><small>Stage 01095</small></div><i>›</i></button></div>`;
  else if(ui.inspectorTab==='style')body=`<div class="stt-theme-grid">${['Clean','Dark Pro','CRM','Finance','Marketplace','Glass'].map((x,i)=>`<button class="${i===0?'is-active':''}" data-table-future="theme"><i class="is-theme-${i}"></i><b>${x}</b></button>`).join('')}</div><div class="stt-inspector-card"><span>STYLE ENGINE</span><h3>Професійні теми</h3><p>Контракти View settings готові. Повний редактор тем — етап 01096.</p></div>`;
  else if(ui.inspectorTab==='data')body=`<div class="stt-data-status"><span class="${repo.type.startsWith('api')?'is-api':'is-local'}"></span><div><b>${esc(repo.type.startsWith('api')?'API + PostgreSQL':'Local DEV')}</b><small>${esc(repo.name)}</small></div></div><dl><div><dt>Table ID</dt><dd>${esc(table.id)}</dd></div><div><dt>Scope</dt><dd>${esc(scopeLabel(table.scopeType))}</dd></div><div><dt>Records</dt><dd>${bundle.records?.length||0}</dd></div><div><dt>Fields</dt><dd>${fields.length}</dd></div><div><dt>Updated</dt><dd>${esc(table.updatedAt||'—')}</dd></div></dl>`;
  else if(ui.inspectorTab==='permissions')body=`<div class="stt-inspector-card"><span>SERVER AUTHORITY</span><h3>${esc(scopeLabel(table.scopeType))} permissions</h3><p>Frontend не є доказом доступу. Backend повторно перевіряє Session, Membership, scope і tableId.</p></div><div class="stt-role-list">${[['Owner','Повний контроль'],['Admin','Керування'],['Editor','Редагування'],['Viewer','Перегляд']].map(x=>`<div><span>${x[0].slice(0,1)}</span><div><b>${x[0]}</b><small>${x[1]}</small></div><i>${x[0]==='Viewer'?'Read':'Write'}</i></div>`).join('')}</div>`;
  else body=`<div class="stt-inspector-card is-automation"><span>⚡ AUTOMATIONS</span><h3>Foundation reserved</h3><p>Коли Status = Paid → виконати дію. Automation engine буде окремим безпечним етапом.</p></div>`;
  return `<div class="stt-inspector"><header><span>TABLES · ${SHIFTTIME_BUILD_STAGE}</span><h2>${table?esc(table.name):'ShiftTime Tables'}</h2><p>${table?`${scopeLabel(table.scopeType)} · ${bundle.records?.length||0} records`:'Database workspace'}</p></header>${tabs}<div class="stt-inspector-body">${body}</div></div>`;
}

function render(){const workspace=document.getElementById('tablesStudioView'),panel=document.getElementById('tables-panel-root');if(!workspace||!panel||!store)return;const state=store.getState();workspace.innerHTML=workspaceHtml(state);panel.innerHTML=inspectorHtml(state);}
function announce(message){ui.notice=message;render();setTimeout(()=>{if(ui.notice===message){ui.notice='';render();}},2600);}
function emptyValues(fields){const out={};for(const field of fields||[]){if(!isEditableTableFieldType01092(field.type))continue;const defaultValue=normalizeTableStoredValue01094(field.defaultValue);if(defaultValue!==null)out[field.id]=defaultValue;else if(field.required&&['text','long-text'].includes(field.type))out[field.id]='Новий запис';else if(field.required&&['number','currency','percent'].includes(field.type))out[field.id]=0;else if(field.required&&field.type==='checkbox')out[field.id]=false;else out[field.id]=null;}return out;}
async function switchRepository(){const next=makeRepository();await store.setRepository(next,{refresh:false});try{await store.refresh();}catch{}render();}

async function handleClick(event){
  const target=event.target.closest?.('button,[data-table-cell]');if(!target)return;
  if(target.closest('[data-table-open-create]')){ui.createOpen=true;render();return;}
  if(target.closest('[data-table-close-create]')){ui.createOpen=false;render();return;}
  const template=target.closest('[data-template-id]');if(template){ui.templateId=template.dataset.templateId;render();return;}
  const category=target.closest('[data-template-category]');if(category){ui.templateCategory=category.dataset.templateCategory;render();return;}
  const open=target.closest('[data-table-open]');if(open){try{await store.openTable(open.dataset.tableOpen);}catch{}return;}
  if(target.closest('[data-table-refresh]')){try{await store.refresh();}catch{}return;}
  if(target.closest('[data-table-add-row]')){try{await store.createRecord(emptyValues(store.getState().bundle?.fields));announce('Запис додано.');}catch{}return;}
  if(target.closest('[data-table-add-field]')){ui.inspectorTab='columns';ui.fieldForm=!ui.fieldForm;render();return;}
  const tab=target.closest('[data-table-inspector-tab]');if(tab){ui.inspectorTab=tab.dataset.tableInspectorTab;render();return;}
  const delRecord=target.closest('[data-table-delete-record]');if(delRecord){if(confirm('Видалити цей запис?'))try{await store.deleteRecord(delRecord.dataset.tableDeleteRecord);announce('Запис видалено.');}catch{}return;}
  const delField=target.closest('[data-table-delete-field]');if(delField){if(confirm('Видалити колонку разом зі значеннями?'))try{await store.deleteField(delField.dataset.tableDeleteField);announce('Колонку видалено.');}catch{}return;}
  if(target.closest('[data-table-delete]')){if(confirm('Архівувати таблицю?'))try{await store.deleteTable();announce('Таблицю переміщено в архів.');}catch{}return;}
  const future=target.closest('[data-table-future]');if(future){announce(`«${future.textContent.trim()}» підготовлено архітектурно та буде розширено у наступному етапі.`);return;}
  const fieldMenu=target.closest('[data-table-field-menu]');if(fieldMenu){ui.inspectorTab='columns';render();return;}
}

async function handleSubmit(event){
  const form=event.target.closest?.('form');if(!form)return;
  if(form.matches('[data-table-create-form]')){event.preventDefault();const data=Object.fromEntries(new FormData(form).entries()),definition=createTableFromTemplate01092(ui.templateId,{name:data.name,scopeType:data.scopeType,includeSamples:data.includeSamples==='on'});try{await store.createTable(definition);ui.createOpen=false;ui.inspectorTab='table';announce('Таблицю створено та збережено.');}catch{}return;}
  if(form.matches('[data-table-field-form]')){event.preventDefault();const data=Object.fromEntries(new FormData(form).entries());try{await store.createField({name:data.name,type:data.type,required:data.required==='on'});ui.fieldForm=false;announce('Колонку створено.');}catch{}return;}
  if(form.matches('[data-table-settings-form]')){event.preventDefault();const data=Object.fromEntries(new FormData(form).entries());try{await store.updateTable({name:data.name,icon:data.icon,description:data.description});announce('Налаштування таблиці збережено.');}catch{}return;}
}

async function handleChange(event){
  const input=event.target.closest?.('[data-table-cell-input]');if(!input)return;const cell=input.closest('[data-table-cell]');if(!cell)return;let value=input.type==='checkbox'?input.checked:input.value;if(cell.dataset.fieldType==='multi-select')value=clean(value).split(',').map(clean).filter(Boolean);try{await store.updateRecord(cell.dataset.recordId,{values:{[cell.dataset.fieldId]:value}});}catch(error){announce(error.message||String(error));}
}

function handleInput(event){const list=event.target.closest?.('[data-table-list-search]');if(list){ui.listSearch=list.value;const query=clean(list.value).toLowerCase();document.querySelectorAll('#tablesStudioView [data-table-search-text]').forEach(node=>{node.hidden=Boolean(query&&!clean(node.dataset.tableSearchText).includes(query));});return;}const template=event.target.closest?.('[data-template-search]');if(template){ui.templateSearch=template.value;const query=clean(template.value).toLowerCase();document.querySelectorAll('#tablesStudioView [data-template-search-text]').forEach(node=>{node.hidden=Boolean(query&&!clean(node.dataset.templateSearchText).includes(query));});}}

export async function initTablesStudio01092(){
  if(initialized)return window.ST_TABLES_STUDIO_01092||true;
  const workspace=document.getElementById('tablesStudioView'),panel=document.getElementById('tables-panel-root');if(!workspace||!panel)throw new Error('01092 Tables mount points are missing');
  initialized=true;await initMarketplaceAuthRuntime01084();store=new TableStore01092(makeRepository());
  unsubscribeStore=store.subscribe(()=>render());unsubscribeAuth=subscribeMarketplaceAuth01084(()=>{switchRepository().catch(()=>{});});
  for(const root of [workspace,panel]){root.addEventListener('click',event=>{handleClick(event).catch(()=>{});});root.addEventListener('submit',event=>{handleSubmit(event).catch(()=>{});});root.addEventListener('change',event=>{handleChange(event).catch(()=>{});});root.addEventListener('input',handleInput);}
  render();try{await store.refresh();}catch{}render();
  const api=Object.freeze({stage:'01092',store,refresh:()=>store.refresh(),open:(id)=>store.openTable(id),create:(input)=>store.createTable(input),getState:()=>store.getState(),destroy:()=>{unsubscribeStore?.();unsubscribeAuth?.();}});try{window.ST_TABLES_STUDIO_01092=api;window.__ST_ALL_LOG__?.push?.('tables-studio:ready-01092',{stage:'01092',repository:repoInfo(),typedDnD:'contract-ready',templates:BUILTIN_TABLE_TEMPLATES_01092.length});}catch{}return api;
}
