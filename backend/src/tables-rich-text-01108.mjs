// 01108 · Shared ShiftTime Tables rich-text value contract.
// Data-only model: no HTML is accepted or emitted here.

export const TABLE_RICH_TEXT_KIND_01108='st-rich-text';
export const TABLE_RICH_TEXT_VERSION_01108=1;
export const TABLE_RICH_TEXT_MAX_LEVELS_01108=10;

const clean=value=>String(value??'').trim();
const clamp=(value,min,max,fallback)=>{const n=Number(value);return Math.min(max,Math.max(min,Number.isFinite(n)?n:fallback));};
const uid=prefix=>{try{return `${prefix}_${crypto.randomUUID().replaceAll('-','').slice(0,18)}`;}catch{return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;}};
const uniq=list=>[...new Set(list)];

const SAFE_COLOR_FUNCTION=/^(?:rgba?|hsla?)\(\s*[-+0-9.% ,/]+\s*\)$/i;
const SAFE_COLOR_NAMES=new Set(['transparent','currentcolor','black','white']);
const SAFE_SLOT=/^[a-z0-9][a-z0-9_-]{0,47}$/i;
const SAFE_THEME_ID=/^[a-z0-9][a-z0-9_-]{0,63}$/i;
const STYLE_SOURCES=new Set(['template','theme','manual']);
const BORDER_STYLES=new Set(['none','solid','dashed','dotted','double']);

export const DEFAULT_BLOCK_STYLE_01108=Object.freeze({
  backgroundColor:'transparent',
  backgroundOpacity:1,
  textColor:'#0f172a',
  fontSize:14,
  fontWeight:500,
  italic:false,
  borderColor:'transparent',
  borderWidth:0,
  borderStyle:'solid',
  borderRadius:6,
  paddingX:6,
  paddingY:2,
  shadowColor:'transparent',
  shadowOpacity:0,
  shadowBlur:0,
  shadowX:0,
  shadowY:0,
  letterSpacing:0,
});

function normalizeColor01108(value,fallback='transparent'){
  const token=clean(value);
  if(!token)return fallback;
  if(/^#[0-9a-f]{3,8}$/i.test(token)&&[4,5,7,9].includes(token.length))return token;
  if(SAFE_COLOR_FUNCTION.test(token))return token;
  if(SAFE_COLOR_NAMES.has(token.toLowerCase()))return token.toLowerCase()==='currentcolor'?'currentColor':token.toLowerCase();
  return fallback;
}

function normalizeSlot01108(value,fallback='neutral'){
  const slot=clean(value);
  return SAFE_SLOT.test(slot)?slot:fallback;
}

function normalizeStyleSource01108(value,fallback='template'){
  const source=clean(value).toLowerCase();
  return STYLE_SOURCES.has(source)?source:fallback;
}

export function normalizeBlockStyle01108(input={}){
  const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  const borderStyle=clean(source.borderStyle).toLowerCase();
  return {
    backgroundColor:normalizeColor01108(source.backgroundColor,DEFAULT_BLOCK_STYLE_01108.backgroundColor),
    backgroundOpacity:clamp(source.backgroundOpacity,0,1,DEFAULT_BLOCK_STYLE_01108.backgroundOpacity),
    textColor:normalizeColor01108(source.textColor,DEFAULT_BLOCK_STYLE_01108.textColor),
    fontSize:clamp(source.fontSize,8,96,DEFAULT_BLOCK_STYLE_01108.fontSize),
    fontWeight:clamp(source.fontWeight,100,900,DEFAULT_BLOCK_STYLE_01108.fontWeight),
    italic:Boolean(source.italic),
    borderColor:normalizeColor01108(source.borderColor,DEFAULT_BLOCK_STYLE_01108.borderColor),
    borderWidth:clamp(source.borderWidth,0,12,DEFAULT_BLOCK_STYLE_01108.borderWidth),
    borderStyle:BORDER_STYLES.has(borderStyle)?borderStyle:DEFAULT_BLOCK_STYLE_01108.borderStyle,
    borderRadius:clamp(source.borderRadius,0,64,DEFAULT_BLOCK_STYLE_01108.borderRadius),
    paddingX:clamp(source.paddingX,0,48,DEFAULT_BLOCK_STYLE_01108.paddingX),
    paddingY:clamp(source.paddingY,0,48,DEFAULT_BLOCK_STYLE_01108.paddingY),
    shadowColor:normalizeColor01108(source.shadowColor,DEFAULT_BLOCK_STYLE_01108.shadowColor),
    shadowOpacity:clamp(source.shadowOpacity,0,1,DEFAULT_BLOCK_STYLE_01108.shadowOpacity),
    shadowBlur:clamp(source.shadowBlur,0,80,DEFAULT_BLOCK_STYLE_01108.shadowBlur),
    shadowX:clamp(source.shadowX,-80,80,DEFAULT_BLOCK_STYLE_01108.shadowX),
    shadowY:clamp(source.shadowY,-80,80,DEFAULT_BLOCK_STYLE_01108.shadowY),
    letterSpacing:clamp(source.letterSpacing,-12,12,DEFAULT_BLOCK_STYLE_01108.letterSpacing),
  };
}

function normalizeOptions01108(input=[]){
  if(!Array.isArray(input))return [];
  return uniq(input.map(clean).filter(Boolean)).slice(0,100);
}

function normalizeLevel01108(input={},index=0,{regenerateId=false}={}){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  let options=normalizeOptions01108(input.options);
  let value=clean(input.value);
  if(!options.length&&value)options=[value];
  if(options.length&&!options.includes(value))value=options[0];
  if(!value&&options.length)value=options[0];
  if(!value)return null;
  return {
    id:regenerateId?uid('rt_level'):(clean(input.id)||uid('rt_level')),
    key:clean(input.key)||`level_${index+1}`,
    label:clean(input.label)||`Рівень ${index+1}`,
    value,
    options,
    themeSlot:normalizeSlot01108(input.themeSlot,`accent-${(index%8)+1}`),
    ...(input.style&&typeof input.style==='object'&&!Array.isArray(input.style)?{style:normalizeBlockStyle01108(input.style)}:{}),
  };
}

function normalizeNode01108(input={},index=0,{regenerateIds=false}={}){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const kind=clean(input.kind).toLowerCase();
  const id=regenerateIds?uid('rt_node'):(clean(input.id)||uid('rt_node'));
  if(kind==='text')return {id,kind:'text',text:String(input.text??'')};
  if(kind==='block'){
    const text=clean(input.text);
    if(!text)return null;
    return {
      id,
      kind:'block',
      text,
      templateId:clean(input.templateId),
      themeSlot:normalizeSlot01108(input.themeSlot,'neutral'),
      styleSource:normalizeStyleSource01108(input.styleSource),
      style:normalizeBlockStyle01108(input.style),
    };
  }
  if(kind==='composite'){
    const levels=(Array.isArray(input.levels)?input.levels:[]).slice(0,TABLE_RICH_TEXT_MAX_LEVELS_01108).map((level,levelIndex)=>normalizeLevel01108(level,levelIndex,{regenerateId:regenerateIds})).filter(Boolean);
    if(!levels.length)return null;
    return {
      id,
      kind:'composite',
      templateId:clean(input.templateId),
      themeSlot:normalizeSlot01108(input.themeSlot,'neutral'),
      levels,
      styleSource:normalizeStyleSource01108(input.styleSource),
      style:normalizeBlockStyle01108(input.style),
    };
  }
  return null;
}


export function normalizeRichTextAppearance01108(input={}){
  const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  const mode=clean(source.blockThemeMode).toLowerCase()==='custom'?'custom':'sync';
  const themeId=SAFE_THEME_ID.test(clean(source.blockThemeId))?clean(source.blockThemeId):'';
  const sourceKind=clean(source.baseStyleSource).toLowerCase()==='manual'?'manual':'theme';
  return {
    blockThemeMode:mode,
    blockThemeId:mode==='custom'?themeId:'',
    baseStyleSource:sourceKind,
    baseStyle:sourceKind==='manual'?normalizeBlockStyle01108(source.baseStyle||{}):null,
  };
}

function asRichValue01108(value){
  if(isRichTextValue01108(value))return normalizeRichTextValue01108(value);
  return {kind:TABLE_RICH_TEXT_KIND_01108,version:TABLE_RICH_TEXT_VERSION_01108,appearance:normalizeRichTextAppearance01108({}),nodes:String(value??'')?[{id:uid('rt_node'),kind:'text',text:String(value??'')}]:[]};
}

export function withRichTextAppearance01108(value,appearance={}){
  const rich=asRichValue01108(value);
  return {...rich,appearance:normalizeRichTextAppearance01108({...rich.appearance,...appearance})};
}

export function applyRichTextThemeSelection01108(value,{blockThemeMode='sync',blockThemeId='',palette=null}={}){
  let rich=withRichTextAppearance01108(value,{blockThemeMode,blockThemeId,baseStyleSource:'theme',baseStyle:null});
  if(palette&&typeof palette==='object')rich=applyBlockPalette01108(rich,palette);
  return withRichTextAppearance01108(rich,{blockThemeMode,blockThemeId,baseStyleSource:'theme',baseStyle:null});
}

export function resolveRichTextThemeId01108(value,tableThemeId=''){
  const appearance=isRichTextValue01108(value)?normalizeRichTextAppearance01108(value.appearance||{}):normalizeRichTextAppearance01108({});
  if(appearance.blockThemeMode==='custom'&&appearance.blockThemeId)return appearance.blockThemeId;
  return SAFE_THEME_ID.test(clean(tableThemeId))?clean(tableThemeId):'';
}

export function replaceRichTextPlainText01108(value,text=''){
  if(!isRichTextValue01108(value))return String(text??'');
  const rich=normalizeRichTextValue01108(value);
  const nonText=(rich.nodes||[]).filter(node=>node.kind!=='text');
  if(nonText.length)return rich;
  return {...rich,nodes:String(text??'')?[{id:rich.nodes?.[0]?.id||uid('rt_node'),kind:'text',text:String(text??'')}]:[]};
}

export function isRichTextValue01108(value){
  return Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&value.kind===TABLE_RICH_TEXT_KIND_01108&&Number(value.version)===TABLE_RICH_TEXT_VERSION_01108&&Array.isArray(value.nodes));
}

export function normalizeRichTextValue01108(value){
  if(value===null||value===undefined)return value??null;
  if(typeof value==='string')return value;
  if(!isRichTextValue01108(value))return null;
  return {
    kind:TABLE_RICH_TEXT_KIND_01108,
    version:TABLE_RICH_TEXT_VERSION_01108,
    appearance:normalizeRichTextAppearance01108(value.appearance||{}),
    nodes:value.nodes.map((node,index)=>normalizeNode01108(node,index)).filter(Boolean),
  };
}

function nodeProjection01108(node){
  if(!node)return '';
  if(node.kind==='text')return String(node.text??'');
  if(node.kind==='block')return clean(node.text);
  if(node.kind==='composite')return (node.levels||[]).map(level=>clean(level?.value)).filter(Boolean).join(' ');
  return '';
}

export function tableTextProjection01108(value){
  if(value===null||value===undefined)return '';
  if(typeof value==='string')return value;
  if(Array.isArray(value))return value.map(item=>tableTextProjection01108(item)).filter(Boolean).join(', ');
  if(!isRichTextValue01108(value))return typeof value==='object'?'':String(value);
  const normalized=normalizeRichTextValue01108(value);
  let output='';
  let previousKind='';
  for(const node of normalized?.nodes||[]){
    const text=nodeProjection01108(node);
    if(!text)continue;
    const blockLike=node.kind!=='text';
    const previousBlockLike=previousKind&&previousKind!=='text';
    if(output&&blockLike&&previousBlockLike&&!/\s$/.test(output)&&!/^\s/.test(text))output+=' ';
    output+=text;
    previousKind=node.kind;
  }
  return output;
}

export function cloneRichNode01108(node,{regenerateIds=false}={}){
  return normalizeNode01108(node,0,{regenerateIds});
}

function paletteStyle01108(palette,slot){
  const source=palette&&typeof palette==='object'&&!Array.isArray(palette)?palette:{};
  const defaults=source.defaults&&typeof source.defaults==='object'&&!Array.isArray(source.defaults)?source.defaults:{};
  const selected=source[slot]&&typeof source[slot]==='object'&&!Array.isArray(source[slot])?source[slot]:(source.neutral&&typeof source.neutral==='object'?source.neutral:{});
  return normalizeBlockStyle01108({...defaults,...selected});
}

export function applyBlockPalette01108(value,palette={}){
  if(!isRichTextValue01108(value))return normalizeRichTextValue01108(value);
  const normalized=normalizeRichTextValue01108(value);
  return {
    ...normalized,
    nodes:normalized.nodes.map(node=>{
      if(node.kind==='text')return {...node};
      if(node.kind==='block')return {...node,styleSource:'theme',style:paletteStyle01108(palette,node.themeSlot||'neutral')};
      return {
        ...node,
        styleSource:'theme',
        style:paletteStyle01108(palette,node.themeSlot||'neutral'),
        levels:node.levels.map(level=>({...level,style:paletteStyle01108(palette,level.themeSlot||'neutral')})),
      };
    }),
  };
}
