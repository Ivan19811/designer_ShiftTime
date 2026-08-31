// 01087 · Source-agnostic ShiftTime Data Grid foundation.
// Future 01088 dynamic Workspace tables plug into this model; no PostgreSQL knowledge lives here.
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[c]));
const clean=(v)=>String(v??'').trim();

export function normalizeDataGridModel01087(input={}){
  const columns=(Array.isArray(input.columns)?input.columns:[]).map((column,index)=>{
    const c=typeof column==='string'?{key:column}:column||{};
    const key=clean(c.key||`col_${index}`);
    return Object.freeze({key,label:clean(c.label)||key,width:clean(c.width),align:['left','center','right'].includes(c.align)?c.align:'left',className:clean(c.className),render:typeof c.render==='function'?c.render:null});
  }).filter(c=>c.key);
  const rows=Array.isArray(input.rows)?input.rows.filter(r=>r&&typeof r==='object'):[];
  return Object.freeze({columns:Object.freeze(columns),rows:Object.freeze(rows),emptyText:clean(input.emptyText)||'Немає даних',rowKey:clean(input.rowKey)||'id',compact:Boolean(input.compact)});
}

function cellHtml(column,row,rowIndex){
  if(column.render){try{return String(column.render(row?.[column.key],row,rowIndex,column)??'');}catch{return '<span class="st-data-grid__error">—</span>';}}
  const value=row?.[column.key];
  if(value===null||value===undefined||value==='')return '<span class="st-data-grid__muted">—</span>';
  if(typeof value==='object')return `<code class="st-data-grid__json">${esc(JSON.stringify(value))}</code>`;
  return esc(value);
}

export function renderDataGridHtml01087(modelInput={},options={}){
  const model=modelInput?.columns&&modelInput?.rows?modelInput:normalizeDataGridModel01087(modelInput);
  const extra=clean(options.className),classes=['st-data-grid',model.compact?'is-compact':'',extra].filter(Boolean).join(' ');
  const widths=model.columns.map(c=>c.width||'minmax(120px,1fr)').join(' ');
  const head=model.columns.map(c=>`<div class="st-data-grid__th ${esc(c.className)}" style="text-align:${c.align}">${esc(c.label)}</div>`).join('');
  const body=model.rows.length?model.rows.map((row,i)=>{
    const key=clean(row?.[model.rowKey]??i);
    const cells=model.columns.map(c=>`<div class="st-data-grid__td ${esc(c.className)}" data-col="${esc(c.key)}" style="text-align:${c.align}">${cellHtml(c,row,i)}</div>`).join('');
    return `<div class="st-data-grid__tr" data-row-key="${esc(key)}" style="grid-template-columns:${esc(widths)}">${cells}</div>`;
  }).join(''):`<div class="st-data-grid__empty">${esc(model.emptyText)}</div>`;
  return `<div class="${esc(classes)}"><div class="st-data-grid__thead"><div class="st-data-grid__tr" style="grid-template-columns:${esc(widths)}">${head}</div></div><div class="st-data-grid__tbody">${body}</div></div>`;
}

export const escapeDataGridHtml01087=esc;
