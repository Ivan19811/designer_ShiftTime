export const AI_ASSISTANT_STAGE_01421='01421';
const str=value=>String(value??'').trim();
export const AI_ASSISTANT_MODES_01421=Object.freeze(['explain','prepare','execute']);
export const AI_ASSISTANT_TASK_MODES_01421=Object.freeze(['ask','teach','analyze','create','fix']);
export const AI_ASSISTANT_SCOPE_MODES_01421=Object.freeze(['current-page','current-site','marketplace','all']);
export const AI_ASSISTANT_TOOL_META_01421=Object.freeze({
  'site.open':{kind:'read',risk:'low'},'site.inspect':{kind:'read',risk:'low'},
  'pages.open':{kind:'read',risk:'low'},'pages.inspect':{kind:'read',risk:'low'},'pages.createFromTemplate':{kind:'write',risk:'medium'},
  'tables.open':{kind:'read',risk:'low'},'tables.create':{kind:'write',risk:'medium'},'tables.insertCurrentPage':{kind:'write',risk:'medium'},
  'marketplace.open':{kind:'read',risk:'low'},'marketplace.inspect':{kind:'read',risk:'low'},
  'importExport.open':{kind:'read',risk:'low'},'importExport.inspect':{kind:'read',risk:'low'},'importExport.analyze':{kind:'read',risk:'low'},'importExport.autoMap':{kind:'write',risk:'medium'},
  'notifications.open':{kind:'read',risk:'low'},'aiConsultant.open':{kind:'read',risk:'low'},
  'design.open':{kind:'read',risk:'low'},'aiDesign.open':{kind:'read',risk:'low'},'globalDesign.open':{kind:'read',risk:'low'},
  'publish.open':{kind:'read',risk:'low'},'admin.open':{kind:'read',risk:'low'}
});
export const AI_ASSISTANT_SERVER_MODULES_01421=Object.freeze([
  {id:'site',status:'ready',actions:['site.open','site.inspect']},
  {id:'pages',status:'partial',actions:['pages.open','pages.inspect','pages.createFromTemplate']},
  {id:'tables',status:'ready',actions:['tables.open','tables.create','tables.insertCurrentPage']},
  {id:'marketplace',status:'ready',actions:['marketplace.open','marketplace.inspect']},
  {id:'import-export',status:'ready',actions:['importExport.open','importExport.inspect','importExport.analyze','importExport.autoMap']},
  {id:'notifications',status:'ready',actions:['notifications.open']},
  {id:'ai-consultant',status:'ready',actions:['aiConsultant.open']},
  {id:'design',status:'ready',actions:['design.open']},
  {id:'ai-design',status:'ready',actions:['aiDesign.open']},
  {id:'global-design',status:'ready',actions:['globalDesign.open']},
  {id:'publish',status:'partial',actions:['publish.open']},
  {id:'admin',status:'ready',actions:['admin.open']},
  {id:'smartblocks',status:'stub',actions:[]},
  {id:'presentation',status:'stub',actions:[]},
  {id:'music-studio',status:'stub',actions:[]},
  {id:'composite-page',status:'stub',actions:[]}
]);
const KNOWLEDGE_01421=Object.freeze({
  architecture:'ShiftTime is modular. AI must use Tool Registry contracts and must not rewrite sibling module internals.',
  persistence:'Business settings and durable AI context use PostgreSQL. Browser storage is UI-only unless an existing module contract explicitly owns it.',
  localization:'All user-facing UI copy must come from canonical locale keys. Do not propose hardcoded visible text in JS/HTML/backend logic.',
  isolation:'Tables, Marketplace, Notifications, AI Consultant, Presentation, SmartBlocks and Music Studio are independent subsystems.',
  unavailable:'SmartBlocks, Presentation, Music Studio and Composite Page are reserved stubs in this branch until their real adapters are merged.',
  excel:'Excel/CSV/XML transformations must be analyzed first. Do not mutate or import data without an explicit existing tool and required confirmation.'
});
export function normalizeAiAssistantMode01421(value,fallback='prepare'){const mode=str(value);return AI_ASSISTANT_MODES_01421.includes(mode)?mode:fallback;}
export function normalizeAiAssistantTaskMode01421(value,fallback='ask'){const mode=str(value);return AI_ASSISTANT_TASK_MODES_01421.includes(mode)?mode:fallback;}
export function normalizeAiAssistantScopeMode01421(value,fallback='current-page'){const mode=str(value);return AI_ASSISTANT_SCOPE_MODES_01421.includes(mode)?mode:fallback;}
export function normalizeAiAssistantCapabilities01421(input=[]){const allowed=new Map(AI_ASSISTANT_SERVER_MODULES_01421.map(x=>[x.id,x]));return (Array.isArray(input)?input:[]).map(item=>{const id=str(item?.id),server=allowed.get(id);if(!server)return null;const frontendActions=Array.isArray(item?.actions)?item.actions.map(str).filter(Boolean):[];return {id,status:server.status==='stub'?'stub':str(item?.status||server.status)||server.status,actions:server.actions.filter(action=>frontendActions.includes(action)),detail:str(item?.detail).slice(0,240)};}).filter(Boolean);}
export function parseAiAssistantJson01421(text=''){const raw=str(text);if(!raw)return null;for(const candidate of [raw,raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'')]){try{const parsed=JSON.parse(candidate);if(parsed&&typeof parsed==='object')return parsed;}catch{}}const match=raw.match(/\{[\s\S]*\}/);if(match)try{return JSON.parse(match[0]);}catch{}return null;}
export function sanitizeAiAssistantPlan01421(input={},capabilities=[]){const map=new Map(capabilities.map(x=>[x.id,new Set(x.actions||[])]));const actions=(Array.isArray(input?.actions)?input.actions:[]).slice(0,12).map((action,index)=>{const module=str(action?.module),tool=str(action?.tool),meta=AI_ASSISTANT_TOOL_META_01421[tool]||{kind:'read',risk:'medium'},available=map.get(module)?.has(tool)||false,risk=meta.risk;return {id:str(action?.id)||`step_${index+1}`,module,tool,args:action?.args&&typeof action.args==='object'&&!Array.isArray(action.args)?action.args:{},kind:meta.kind,risk,requiresConfirmation:risk==='high'||Boolean(action?.requiresConfirmation),available};}).filter(x=>x.module&&x.tool);return {summary:str(input?.summary).slice(0,2000),actions,questions:(Array.isArray(input?.questions)?input.questions:[]).map(str).filter(Boolean).slice(0,6)};}
export function buildAiAssistantInstructions01421({mode='prepare',taskMode='ask'}={}){return `You are ShiftTime AI Assistant, the central orchestrator for a modular website builder. Reply in the user's language. Never invent module capabilities, records, files, pages, products or execution results. Use only actions present in CAPABILITIES. Missing SmartBlocks, Presentation, Music Studio or Composite Page are unavailable stubs. Respect PROJECT_KNOWLEDGE. ExecutionMode=${normalizeAiAssistantMode01421(mode)}. TaskMode=${normalizeAiAssistantTaskMode01421(taskMode)}. Return STRICT JSON only with keys: message (string), summary (string), actions (array), questions (array). Each action: {id,module,tool,args,risk,requiresConfirmation}. In explain mode actions should normally be empty. In prepare mode create a dry-run plan and never imply execution. In execute mode propose only available actions; destructive, permissions, payments, publishing and other high-risk changes require confirmation. For Excel or supplier prices, inspect/analyze first and do not mutate the source unless a write tool is explicitly available and approved.`;}
export function buildAiAssistantInput01421({message='',mode='prepare',taskMode='ask',scopeMode='current-page',capabilities=[],context={},history=[]}={}){return JSON.stringify({message:str(message).slice(0,12000),mode:normalizeAiAssistantMode01421(mode),taskMode:normalizeAiAssistantTaskMode01421(taskMode),scopeMode:normalizeAiAssistantScopeMode01421(scopeMode),CAPABILITIES:capabilities,PROJECT_KNOWLEDGE:KNOWLEDGE_01421,CONTEXT:context&&typeof context==='object'?context:{},HISTORY:(Array.isArray(history)?history:[]).slice(-12).map(x=>({role:str(x?.role),message:str(x?.message).slice(0,3000)}))});}
export function estimateAiAssistantCost01421({inputTokens=0,outputTokens=0}={}){const input=Math.max(0,Number(inputTokens)||0),output=Math.max(0,Number(outputTokens)||0);return Number(((input/1_000_000)*0.10+(output/1_000_000)*0.50).toFixed(8));}
