export const AI_ASSISTANT_STAGE_01420='01420';
const str=value=>String(value??'').trim();
export const AI_ASSISTANT_MODES_01420=Object.freeze(['explain','prepare','execute']);
export const AI_ASSISTANT_SERVER_MODULES_01420=Object.freeze([
  {id:'site',status:'ready',actions:['site.open','site.inspect']},
  {id:'pages',status:'ready',actions:['pages.open','pages.inspect','pages.createFromTemplate']},
  {id:'tables',status:'ready',actions:['tables.open','tables.create','tables.insertCurrentPage']},
  {id:'marketplace',status:'ready',actions:['marketplace.open','marketplace.inspect']},
  {id:'import-export',status:'ready',actions:['importExport.open','importExport.inspect','importExport.autoMap']},
  {id:'notifications',status:'ready',actions:['notifications.open']},
  {id:'ai-consultant',status:'ready',actions:['aiConsultant.open']},
  {id:'design',status:'ready',actions:['design.open']},
  {id:'ai-design',status:'ready',actions:['aiDesign.open']},
  {id:'global-design',status:'ready',actions:['globalDesign.open']},
  {id:'publish',status:'ready',actions:['publish.open']},
  {id:'admin',status:'ready',actions:['admin.open']},
  {id:'smartblocks',status:'stub',actions:[]},
  {id:'presentation',status:'stub',actions:[]},
  {id:'music-studio',status:'stub',actions:[]},
  {id:'composite-page',status:'stub',actions:[]}
]);
export function normalizeAiAssistantMode01420(value,fallback='prepare'){const mode=str(value);return AI_ASSISTANT_MODES_01420.includes(mode)?mode:fallback;}
export function normalizeAiAssistantCapabilities01420(input=[]){const allowed=new Map(AI_ASSISTANT_SERVER_MODULES_01420.map(x=>[x.id,x]));return (Array.isArray(input)?input:[]).map(item=>{const id=str(item?.id);const server=allowed.get(id);if(!server)return null;const frontendActions=Array.isArray(item?.actions)?item.actions.map(str).filter(Boolean):[];return {id,status:server.status==='stub'?'stub':str(item?.status||server.status)||server.status,actions:server.actions.filter(action=>frontendActions.includes(action)),detail:str(item?.detail).slice(0,240)};}).filter(Boolean);}
export function parseAiAssistantJson01420(text=''){const raw=str(text);if(!raw)return null;const candidates=[raw,raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'')];for(const candidate of candidates){try{const parsed=JSON.parse(candidate);if(parsed&&typeof parsed==='object')return parsed;}catch{}}const match=raw.match(/\{[\s\S]*\}/);if(match)try{return JSON.parse(match[0]);}catch{}return null;}
export function sanitizeAiAssistantPlan01420(input={},capabilities=[]){const map=new Map(capabilities.map(x=>[x.id,new Set(x.actions||[])]));const actions=(Array.isArray(input?.actions)?input.actions:[]).slice(0,12).map((action,index)=>{const module=str(action?.module),tool=str(action?.tool),available=map.get(module)?.has(tool)||false,risk=['low','medium','high'].includes(str(action?.risk))?str(action.risk):'medium';return {id:str(action?.id)||`step_${index+1}`,module,tool,args:action?.args&&typeof action.args==='object'&&!Array.isArray(action.args)?action.args:{},risk,requiresConfirmation:risk==='high'||Boolean(action?.requiresConfirmation),available};}).filter(x=>x.module&&x.tool);return {summary:str(input?.summary).slice(0,2000),actions,questions:(Array.isArray(input?.questions)?input.questions:[]).map(str).filter(Boolean).slice(0,6)};}
export function buildAiAssistantInstructions01420({mode='prepare'}={}){return `You are ShiftTime AI Assistant, an orchestrator for a modular website builder. Reply in the user's language. Never invent module capabilities. Use only modules/actions present in CAPABILITIES. Missing SmartBlocks, Presentation, or Music Studio must be described as unavailable stubs. Mode=${normalizeAiAssistantMode01420(mode)}. Return STRICT JSON only with keys: message (string), summary (string), actions (array), questions (array). Each action: {id,module,tool,args,risk,requiresConfirmation}. High-risk actions such as publishing, deleting, payments, permissions, destructive changes require confirmation. In explain mode, actions should usually be empty. In prepare mode, create a plan but do not imply it was executed. In execute mode, only low/medium available tools may be proposed for automatic execution; high risk must require confirmation.`;}
export function buildAiAssistantInput01420({message='',mode='prepare',capabilities=[],context={},history=[]}={}){return JSON.stringify({message:str(message).slice(0,12000),mode:normalizeAiAssistantMode01420(mode),CAPABILITIES:capabilities,CONTEXT:context&&typeof context==='object'?context:{},HISTORY:(Array.isArray(history)?history:[]).slice(-12).map(x=>({role:str(x?.role),message:str(x?.message).slice(0,3000)}))});}
