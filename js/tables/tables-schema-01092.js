// 01092 · ShiftTime Tables field engine + built-in template contracts.
// The browser uses these contracts for optimistic UX. The backend validates again.

export const SHIFTTIME_TABLES_STAGE_01092='01092';

export const TABLE_FIELD_TYPES_01092=Object.freeze([
  'text','long-text','number','currency','percent','checkbox','select','multi-select','status',
  'date','date-time','email','phone','url','image-file','user','created-time','created-by','updated-time'
]);

export const TABLE_FIELD_TYPE_META_01092=Object.freeze({
  text:{label:'Текст',icon:'T',editable:true},
  'long-text':{label:'Довгий текст',icon:'¶',editable:true},
  number:{label:'Число',icon:'#',editable:true},
  currency:{label:'Валюта',icon:'₴',editable:true},
  percent:{label:'Відсоток',icon:'%',editable:true},
  checkbox:{label:'Чекбокс',icon:'✓',editable:true},
  select:{label:'Вибір',icon:'◆',editable:true},
  'multi-select':{label:'Мультивибір',icon:'◇',editable:true},
  status:{label:'Статус',icon:'●',editable:true},
  date:{label:'Дата',icon:'◫',editable:true},
  'date-time':{label:'Дата й час',icon:'◷',editable:true},
  email:{label:'Email',icon:'@',editable:true},
  phone:{label:'Телефон',icon:'☎',editable:true},
  url:{label:'URL',icon:'↗',editable:true},
  'image-file':{label:'Зображення / файл',icon:'▧',editable:true},
  user:{label:'Користувач',icon:'◎',editable:true},
  'created-time':{label:'Створено',icon:'◴',editable:false},
  'created-by':{label:'Автор',icon:'◉',editable:false},
  'updated-time':{label:'Оновлено',icon:'↻',editable:false},
});

const clean=(v)=>String(v??'').trim();
const clone=(v)=>{try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}};
const uid=(prefix)=>{try{return `${prefix}_${crypto.randomUUID().replaceAll('-','').slice(0,18)}`;}catch{return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;}};
const slug=(v)=>clean(v).toLowerCase().normalize('NFKD').replace(/[^a-z0-9а-яіїєґ]+/giu,'_').replace(/^_+|_+$/g,'').slice(0,54)||'field';
const iso=()=>new Date().toISOString();

export function normalizeTableStoredValue01094(value){
  if(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===0)return null;
  return value??null;
}

export function isTableFieldType01092(type){return TABLE_FIELD_TYPES_01092.includes(clean(type));}
export function tableFieldTypeMeta01092(type){return TABLE_FIELD_TYPE_META_01092[clean(type)]||TABLE_FIELD_TYPE_META_01092.text;}
export function isEditableTableFieldType01092(type){return tableFieldTypeMeta01092(type).editable!==false;}

export function normalizeTableField01092(input={},position=0){
  const type=isTableFieldType01092(input.type)?clean(input.type):'text';
  const systemField=['created-time','created-by','updated-time'].includes(type);
  const name=clean(input.name)||'Нове поле';
  return {
    id:clean(input.id)||uid('field'),
    key:slug(input.key||name),
    name,
    type,
    position:Number.isFinite(Number(input.position))?Number(input.position):position,
    required:systemField?false:Boolean(input.required),
    unique:systemField?false:Boolean(input.unique),
    defaultValue:systemField?null:normalizeTableStoredValue01094(input.defaultValue),
    config:input.config&&typeof input.config==='object'?clone(input.config):{},
  };
}

export function normalizeTableRecord01092(input={},position=0){
  return {
    id:clean(input.id)||uid('record'),
    values:input.values&&typeof input.values==='object'&&!Array.isArray(input.values)?clone(input.values):{},
    position:Number.isFinite(Number(input.position))?Number(input.position):position,
    createdAt:clean(input.createdAt)||iso(),
    updatedAt:clean(input.updatedAt)||iso(),
  };
}

export function normalizeTableView01092(input={},fields=[]){
  const order=Array.isArray(input.settings?.columnOrder)?input.settings.columnOrder.map(clean).filter(Boolean):fields.map(x=>x.id);
  return {
    id:clean(input.id)||uid('view'),
    name:clean(input.name)||'Усі записи',
    type:['table','board','gallery','list','calendar','timeline'].includes(clean(input.type))?clean(input.type):'table',
    position:Number.isFinite(Number(input.position))?Number(input.position):0,
    settings:{
      filters:Array.isArray(input.settings?.filters)?clone(input.settings.filters):[],
      sorts:Array.isArray(input.settings?.sorts)?clone(input.settings.sorts):[],
      groups:Array.isArray(input.settings?.groups)?clone(input.settings.groups):[],
      columnOrder:order,
      columnWidths:input.settings?.columnWidths&&typeof input.settings.columnWidths==='object'?clone(input.settings.columnWidths):{},
      hiddenFields:Array.isArray(input.settings?.hiddenFields)?input.settings.hiddenFields.map(clean).filter(Boolean):[],
      rowDensity:clean(input.settings?.rowDensity)||'comfortable',
      theme:clean(input.settings?.theme)||'clean',
    },
  };
}

export function normalizeTableDefinition01092(input={}){
  const fields=(Array.isArray(input.fields)?input.fields:[]).map(normalizeTableField01092);
  const records=(Array.isArray(input.records)?input.records:[]).map(normalizeTableRecord01092);
  const views=(Array.isArray(input.views)&&input.views.length?input.views:[{}]).map(x=>normalizeTableView01092(x,fields));
  return {
    id:clean(input.id)||uid('table'),
    name:clean(input.name)||'Нова таблиця',
    icon:clean(input.icon)||'▦',
    description:clean(input.description),
    scopeType:['personal','account','workspace','store'].includes(clean(input.scopeType))?clean(input.scopeType):'store',
    sourceType:clean(input.sourceType)||'dynamic',
    templateId:clean(input.templateId),
    settings:input.settings&&typeof input.settings==='object'?clone(input.settings):{},
    fields,records,views,
  };
}

const exactOnly=new Set(['checkbox','select','multi-select','status','date','date-time','email','phone','url','image-file','user']);
export function getCellDropCompatibility01092(sourceType,targetType,{allowSafeConversion=false}={}){
  const source=clean(sourceType),target=clean(targetType);
  if(!isTableFieldType01092(source)||!isTableFieldType01092(target))return {allowed:false,mode:'blocked',reason:'Невідомий тип поля'};
  if(!isEditableTableFieldType01092(target))return {allowed:false,mode:'blocked',reason:'Системне поле доступне лише для читання'};
  if(source===target)return {allowed:true,mode:'exact',reason:'Типи збігаються'};
  if(!allowSafeConversion||exactOnly.has(source)||exactOnly.has(target))return {allowed:false,mode:'blocked',reason:`${tableFieldTypeMeta01092(source).label} не можна перенести у ${tableFieldTypeMeta01092(target).label}`};
  const textFamily=new Set(['text','long-text']);
  const numberFamily=new Set(['number','currency','percent']);
  if(textFamily.has(source)&&textFamily.has(target))return {allowed:true,mode:'convert-confirm',reason:'Потрібне підтвердження текстового перетворення'};
  if(numberFamily.has(source)&&numberFamily.has(target))return {allowed:true,mode:'convert-confirm',reason:'Потрібне підтвердження числового перетворення'};
  return {allowed:false,mode:'blocked',reason:`${tableFieldTypeMeta01092(source).label} не сумісний з ${tableFieldTypeMeta01092(target).label}`};
}

export function validateTableCellValue01092(field,value,{partial=false}={}){
  const f=normalizeTableField01092(field),type=f.type;
  if(value===undefined&&partial)return {ok:true,value:undefined};
  if(value===undefined||value===null||value==='')return f.required?{ok:false,error:`Поле «${f.name}» обов'язкове`}:{ok:true,value:null};
  if(!isEditableTableFieldType01092(type))return {ok:false,error:`Поле «${f.name}» доступне лише для читання`};
  if(type==='text'||type==='long-text'||type==='phone')return {ok:true,value:String(value)};
  if(['number','currency','percent'].includes(type)){const n=Number(value);return Number.isFinite(n)?{ok:true,value:n}:{ok:false,error:`«${f.name}» має бути числом`};}
  if(type==='checkbox')return typeof value==='boolean'?{ok:true,value}:{ok:false,error:`«${f.name}» має бути чекбоксом`};
  if(type==='multi-select')return Array.isArray(value)?{ok:true,value:value.map(clean).filter(Boolean)}:{ok:false,error:`«${f.name}» має містити список значень`};
  if(type==='select'||type==='status'){
    const v=clean(value),options=(Array.isArray(f.config?.options)?f.config.options:[]).map(x=>clean(x?.value??x?.name??x)).filter(Boolean);
    return options.length&&!options.includes(v)?{ok:false,error:`Значення «${v}» відсутнє у варіантах поля «${f.name}»`}:{ok:true,value:v};
  }
  if(type==='date'){const v=clean(value);return /^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(`${v}T00:00:00Z`))?{ok:true,value:v}:{ok:false,error:`«${f.name}» має бути датою`};}
  if(type==='date-time'){const d=new Date(value);return Number.isNaN(d.getTime())?{ok:false,error:`«${f.name}» має містити дату й час`}:{ok:true,value:d.toISOString()};}
  if(type==='email'){const v=clean(value).toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)?{ok:true,value:v}:{ok:false,error:`Некоректний email у полі «${f.name}»`};}
  if(type==='url'){try{const u=new URL(clean(value));return ['http:','https:'].includes(u.protocol)?{ok:true,value:u.toString()}:{ok:false,error:`«${f.name}» підтримує лише HTTP(S)`};}catch{return {ok:false,error:`Некоректний URL у полі «${f.name}»`};}}
  if(type==='image-file')return Array.isArray(value)?{ok:true,value:clone(value)}:{ok:false,error:`«${f.name}» має містити список файлів`};
  if(type==='user')return {ok:true,value:clean(value)};
  return {ok:false,error:`Тип «${type}» поки не редагується`};
}

export function validateTableRecordValues01092(fields,values,{partial=false}={}){
  const list=Array.isArray(fields)?fields.map(normalizeTableField01092):[],source=values&&typeof values==='object'?values:{};
  const known=new Set(list.map(x=>x.id));
  const extra=Object.keys(source).filter(k=>!known.has(k));
  if(extra.length)return {ok:false,error:`Невідомі поля: ${extra.join(', ')}`,values:{}};
  const out={};
  for(const field of list){
    if(!Object.prototype.hasOwnProperty.call(source,field.id)&&partial)continue;
    const raw=Object.prototype.hasOwnProperty.call(source,field.id)?source[field.id]:field.defaultValue;
    const checked=validateTableCellValue01092(field,raw,{partial});
    if(!checked.ok)return {ok:false,error:checked.error,fieldId:field.id,values:{}};
    if(checked.value!==undefined)out[field.id]=checked.value;
  }
  return {ok:true,values:out};
}

const opts=(...values)=>({options:values.map((value,index)=>({value,color:['blue','amber','green','violet','rose'][index%5]}))});
const templates=[
  {id:'blank',name:'Порожня таблиця',category:'Основне',icon:'＋',accent:'#2563eb',description:'Чисте полотно з основним текстовим полем.',fields:[{name:'Назва',type:'text',required:true}],records:[]},
  {id:'suppliers',name:'Постачальники Pro',category:'Бізнес',icon:'◈',accent:'#0f766e',description:'Контакти, статус співпраці, борг і наступна поставка.',fields:[{name:'Назва',type:'text',required:true},{name:'Телефон',type:'phone'},{name:'Email',type:'email'},{name:'Статус',type:'status',config:opts('Новий','Активний','Пауза')},{name:'Борг',type:'currency'},{name:'Наступна поставка',type:'date'},{name:'Активний',type:'checkbox'}],sample:[['Сталь-Пром','+380 67 555 12 20','sales@steel.test','Активний',18500,'2026-09-08',true],['Пак-Сервіс','+380 93 144 70 80','office@pack.test','Новий',0,'2026-09-12',true]]},
  {id:'crm',name:'CRM клієнтів',category:'Продажі',icon:'◎',accent:'#7c3aed',description:'Ліди, контакти, етап угоди та наступний крок.',fields:[{name:'Клієнт',type:'text',required:true},{name:'Телефон',type:'phone'},{name:'Email',type:'email'},{name:'Етап',type:'status',config:opts('Новий лід','Контакт','Пропозиція','Угода')},{name:'Сума',type:'currency'},{name:'Наступний контакт',type:'date'}],sample:[['Роман К.','+380 67 222 11 00','roman@example.test','Пропозиція',7200,'2026-09-03'],['Марія Л.','+380 93 900 44 21','maria@example.test','Новий лід',3400,'2026-09-02']]},
  {id:'orders',name:'Контроль замовлень',category:'Продажі',icon:'▣',accent:'#ea580c',description:'Операційна таблиця замовлень із сумою, оплатою та доставкою.',fields:[{name:'Замовлення',type:'text',required:true},{name:'Клієнт',type:'text'},{name:'Статус',type:'status',config:opts('Нове','В роботі','Відправлено','Завершено')},{name:'Сума',type:'currency'},{name:'Оплачено',type:'checkbox'},{name:'Дата',type:'date'},{name:'ТТН',type:'text'}],sample:[['ST-1042','Олег В.','В роботі',3890,true,'2026-09-01','20451000123456'],['ST-1043','Анна П.','Нове',2440,false,'2026-09-01','']]},
  {id:'inventory',name:'Склад і залишки',category:'Операції',icon:'▦',accent:'#0891b2',description:'SKU, категорія, фізичний залишок, мінімум і закупівельна ціна.',fields:[{name:'Товар',type:'text',required:true},{name:'SKU',type:'text',unique:true},{name:'Категорія',type:'select',config:opts('Сковорідки','Казани','Мангали','Аксесуари')},{name:'Залишок',type:'number'},{name:'Мінімум',type:'number'},{name:'Закупівельна ціна',type:'currency'},{name:'Активний',type:'checkbox'}],sample:[['Сковорідка 50 см','PAN-50','Сковорідки',12,4,1460,true],['Казан 10 л','KAZ-10','Казани',7,3,820,true]]},
  {id:'content-plan',name:'Контент-план',category:'Маркетинг',icon:'✦',accent:'#db2777',description:'Канали, формат, відповідальний, дедлайн і статус публікації.',fields:[{name:'Тема',type:'text',required:true},{name:'Канал',type:'multi-select',config:opts('Instagram','Facebook','TikTok','Сайт')},{name:'Формат',type:'select',config:opts('Фото','Reels','Stories','Стаття')},{name:'Статус',type:'status',config:opts('Ідея','Підготовка','Готово','Опубліковано')},{name:'Дата',type:'date'},{name:'Відповідальний',type:'user'}],sample:[['Як вибрати сковорідку',['Instagram','Сайт'],'Стаття','Підготовка','2026-09-05','Іван'],['Мангал у роботі',['TikTok','Instagram'],'Reels','Ідея','2026-09-07','Іван']]},
];

export const BUILTIN_TABLE_TEMPLATES_01092=Object.freeze(templates.map((template)=>{
  const fields=template.fields.map(normalizeTableField01092);
  const records=(template.sample||[]).map((row,index)=>normalizeTableRecord01092({values:Object.fromEntries(fields.map((field,i)=>[field.id,row[i]??null]))},index));
  return Object.freeze({...template,fields,records,views:[normalizeTableView01092({name:'Усі записи'},fields)]});
}));

export function getBuiltInTableTemplate01092(id){return clone(BUILTIN_TABLE_TEMPLATES_01092.find(x=>x.id===clean(id))||BUILTIN_TABLE_TEMPLATES_01092[0]);}
export function createTableFromTemplate01092(templateId,overrides={}){const template=getBuiltInTableTemplate01092(templateId);return normalizeTableDefinition01092({...template,...overrides,templateId:template.id,fields:template.fields,records:overrides.includeSamples===false?[]:template.records,views:template.views});}
