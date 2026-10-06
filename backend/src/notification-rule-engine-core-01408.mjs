export const NOTIFICATION_RULE_ENGINE_STAGE_01408='01408';

export const NOTIFICATION_EVENT_TYPES_01408=Object.freeze([
  'supplier.approval.created','supplier.scheduler.failed','supplier.risk.detected','supplier.price.changed','supplier.stock.zero',
  'order.created','order.confirmed','order.processing','order.paid','order.payment_failed','order.cancelled','order.shipped','order.delivered','order.refund',
  'customer.message.created','customer.message.unread','customer.message.overdue',
  'payment.succeeded','payment.failed','payment.refunded',
  'site.published','site.publish_failed','site.domain_failed','site.ssl_failed',
  'traffic.warning','traffic.limit','storage.warning',
  'system.warning','system.error'
]);
export const NOTIFICATION_RULE_PROVIDERS_01408=Object.freeze(['suppliers','orders','messages','payments','sites','traffic','system']);
export const NOTIFICATION_RULE_SEVERITIES_01408=Object.freeze(['low','medium','high','critical']);
export const NOTIFICATION_RULE_CHANNELS_01408=Object.freeze(['inApp','email','telegram','webhook','slack']);
export const NOTIFICATION_RULE_OPERATORS_01408=Object.freeze(['eq','neq','gt','gte','lt','lte','in','contains','exists','severityAtLeast']);

const str=value=>String(value??'').trim();
const bool=(value,fallback=false)=>typeof value==='boolean'?value:fallback;
const arr=value=>Array.isArray(value)?value:[];
const clip=(value,length)=>str(value).slice(0,length);
const severityAlias=value=>({info:'low',warning:'medium'}[str(value)]||str(value));
export const notificationSeverityRank01408=value=>({low:1,medium:2,high:3,critical:4}[severityAlias(value)]||0);
export function normalizeNotificationSeverity01408(value,fallback='medium'){const next=severityAlias(value);return NOTIFICATION_RULE_SEVERITIES_01408.includes(next)?next:fallback;}
export function notificationLegacySeverity01408(value){const next=normalizeNotificationSeverity01408(value,'low');return next==='low'?'info':next==='medium'?'warning':next;}
export function providerForNotificationEvent01408(eventType=''){const head=str(eventType).split('.')[0];if(head==='supplier')return 'suppliers';if(head==='order')return 'orders';if(head==='customer')return 'messages';if(head==='payment')return 'payments';if(head==='site')return 'sites';if(head==='traffic'||head==='storage')return 'traffic';return 'system';}

function normalizeCondition01408(input={}){
  const field=clip(input.field,120),operator=NOTIFICATION_RULE_OPERATORS_01408.includes(str(input.operator))?str(input.operator):'eq';
  if(!field)return null;
  return Object.freeze({field,operator,value:input.value??''});
}
export function normalizeNotificationConditions01408(input={}){
  const source=Array.isArray(input)?{mode:'all',items:input}:input&&typeof input==='object'?input:{};
  const mode=str(source.mode)==='any'?'any':'all';
  const items=arr(source.items).map(normalizeCondition01408).filter(Boolean).slice(0,12);
  return Object.freeze({mode,items:Object.freeze(items)});
}
export function normalizeNotificationActions01408(input={}){
  const source=input&&typeof input==='object'?input:{};
  const channels=arr(source.channels).map(str).filter(x=>NOTIFICATION_RULE_CHANNELS_01408.includes(x));
  return Object.freeze({notify:bool(source.notify,true),channels:Object.freeze([...new Set(channels.length?channels:['inApp'])]),delivery:str(source.delivery)==='digest'?'digest':'immediate'});
}
export function normalizeNotificationRule01408(input={},scope={}){
  const eventType=NOTIFICATION_EVENT_TYPES_01408.includes(str(input.eventType))?str(input.eventType):'system.warning';
  const provider=NOTIFICATION_RULE_PROVIDERS_01408.includes(str(input.provider))?str(input.provider):providerForNotificationEvent01408(eventType);
  const scopeType=['tenant','workspace','store'].includes(str(input?.scope?.type))?str(input.scope.type):'store';
  const scopeId=clip(input?.scope?.id||(scopeType==='tenant'?scope.accountId:scopeType==='workspace'?scope.workspaceId:scope.storeId),180);
  return Object.freeze({
    id:clip(input.id,180),name:clip(input.name,180),enabled:bool(input.enabled,true),eventType,provider,
    severity:normalizeNotificationSeverity01408(input.severity,'medium'),conditions:normalizeNotificationConditions01408(input.conditions),
    actions:normalizeNotificationActions01408(input.actions),scope:Object.freeze({type:scopeType,id:scopeId}),
    createdAt:str(input.createdAt),updatedAt:str(input.updatedAt),stage:NOTIFICATION_RULE_ENGINE_STAGE_01408
  });
}

function readPath01408(source,path){return str(path).split('.').filter(Boolean).reduce((node,key)=>node==null?undefined:node[key],source);}
function compare01408(actual,operator,expected){
  if(operator==='exists')return expected===false||expected==='false'?actual==null:actual!=null;
  if(operator==='severityAtLeast')return notificationSeverityRank01408(actual)>=notificationSeverityRank01408(expected);
  if(operator==='in'){const values=Array.isArray(expected)?expected:String(expected??'').split(',').map(x=>x.trim()).filter(Boolean);return values.map(String).includes(String(actual??''));}
  if(operator==='contains'){if(Array.isArray(actual))return actual.map(String).includes(String(expected??''));return String(actual??'').toLowerCase().includes(String(expected??'').toLowerCase());}
  if(['gt','gte','lt','lte'].includes(operator)){const a=Number(actual),b=Number(expected);if(!Number.isFinite(a)||!Number.isFinite(b))return false;if(operator==='gt')return a>b;if(operator==='gte')return a>=b;if(operator==='lt')return a<b;return a<=b;}
  if(operator==='neq')return String(actual??'')!==String(expected??'');
  return String(actual??'')===String(expected??'');
}
export function notificationRuleMatches01408(ruleInput={},event={}){
  const rule=normalizeNotificationRule01408(ruleInput),eventType=str(event.type||event.eventType),provider=str(event.provider)||providerForNotificationEvent01408(eventType);
  if(!rule.enabled||rule.eventType!==eventType||rule.provider!==provider||!rule.actions.notify)return false;
  const context={...(event.data&&typeof event.data==='object'?event.data:{}),event:{type:eventType,provider,severity:normalizeNotificationSeverity01408(event.severity,'low')}};
  const tests=rule.conditions.items.map(condition=>compare01408(readPath01408(context,condition.field),condition.operator,condition.value));
  return !tests.length?true:rule.conditions.mode==='any'?tests.some(Boolean):tests.every(Boolean);
}
export function evaluateNotificationRules01408(rules=[],event={}){
  const matched=arr(rules).map(rule=>normalizeNotificationRule01408(rule)).filter(rule=>notificationRuleMatches01408(rule,event));
  const channels=[...new Set(matched.flatMap(rule=>rule.actions.channels))];
  const eventSeverity=normalizeNotificationSeverity01408(event.severity,'low');
  let effectiveSeverity=eventSeverity;
  for(const rule of matched)if(notificationSeverityRank01408(rule.severity)>notificationSeverityRank01408(effectiveSeverity))effectiveSeverity=rule.severity;
  return Object.freeze({allowed:matched.length>0,matched:Object.freeze(matched),channels:Object.freeze(channels),effectiveSeverity,stage:NOTIFICATION_RULE_ENGINE_STAGE_01408});
}

export function notificationRuleDefaultsFromLegacySupplier01408(legacy={},scope={}){
  const enabled=legacy.enabled!==false,inApp=legacy?.channels?.inApp!==false,channels=inApp?['inApp']:[];
  const mk=(eventType,severity,isEnabled,conditions=[])=>normalizeNotificationRule01408({id:'',name:'',enabled:enabled&&isEnabled,eventType,provider:'suppliers',severity,conditions:{mode:'all',items:conditions},actions:{notify:true,channels:channels.length?channels:['inApp']},scope:{type:'store',id:scope.storeId}},scope);
  return [
    mk('supplier.approval.created','medium',legacy.approvalReady!==false),
    mk('supplier.scheduler.failed','high',legacy.schedulerFailure!==false),
    mk('supplier.risk.detected','high',legacy.riskEnabled!==false,[{field:'risk.level',operator:'severityAtLeast',value:normalizeNotificationSeverity01408(legacy.minRisk,'high')}]),
    mk('supplier.price.changed','high',!!legacy.priceChangeEnabled,[{field:'risk.maxPriceChangePct',operator:'gte',value:Math.max(0,Number(legacy.priceChangePct)||20)}]),
    mk('supplier.stock.zero','critical',!!legacy.stockZeroEnabled,[{field:'risk.stockToZero',operator:'gte',value:Math.max(1,Math.round(Number(legacy.stockZeroCount)||1))}])
  ];
}
export function supplierLegacyViewFromUniversalRules01408(rules=[]){
  const byType=new Map();for(const item of arr(rules).filter(x=>x.provider==='suppliers')){const rule=normalizeNotificationRule01408(item);if(!byType.has(rule.eventType))byType.set(rule.eventType,rule);}
  const approval=byType.get('supplier.approval.created'),scheduler=byType.get('supplier.scheduler.failed'),risk=byType.get('supplier.risk.detected'),price=byType.get('supplier.price.changed'),stock=byType.get('supplier.stock.zero');
  const cond=(rule,field,fallback)=>rule?.conditions?.items?.find(x=>x.field===field)?.value??fallback;
  return {stage:'01402',enabled:[approval,scheduler,risk,price,stock].some(x=>x?.enabled!==false),channels:{inApp:[approval,scheduler,risk,price,stock].some(x=>x?.actions?.channels?.includes('inApp')),email:false,telegram:false,slack:false,webhook:false},approvalReady:approval?.enabled!==false,schedulerFailure:scheduler?.enabled!==false,riskEnabled:risk?.enabled!==false,minRisk:normalizeNotificationSeverity01408(cond(risk,'risk.level','high'),'high'),priceChangeEnabled:!!price?.enabled,priceChangePct:Math.max(0,Number(cond(price,'risk.maxPriceChangePct',20))||20),stockZeroEnabled:!!stock?.enabled,stockZeroCount:Math.max(1,Math.round(Number(cond(stock,'risk.stockToZero',1))||1)),updatedAt:[...byType.values()].map(x=>x.updatedAt).filter(Boolean).sort().pop()||''};
}
