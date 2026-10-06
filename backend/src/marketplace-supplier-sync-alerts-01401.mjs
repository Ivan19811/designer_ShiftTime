import {createSupplierSyncAlert01401,listSupplierSyncAlerts01401,setSupplierSyncAlertStatus01401,resolveApprovalAlerts01401} from './marketplace-supplier-sync-alert-store-01401.mjs';
import {MARKETPLACE_SUPPLIER_SYNC_ALERT_STAGE_01401} from './marketplace-supplier-sync-alert-core-01401.mjs';
import {evaluateSupplierSyncAlertRules01402} from './marketplace-supplier-sync-alert-rules-01402.mjs';
import {listNotificationRules01408,evaluateNotificationRules01408} from './notification-rule-engine-01408.mjs';
import {notificationLegacySeverity01408} from './notification-rule-engine-core-01408.mjs';
export {listSupplierSyncAlerts01401,setSupplierSyncAlertStatus01401,resolveApprovalAlerts01401,MARKETPLACE_SUPPLIER_SYNC_ALERT_STAGE_01401};
export const LEGACY_SUPPLIER_RULE_EVALUATOR_01408=evaluateSupplierSyncAlertRules01402;
const str=v=>String(v??'').trim();
function sourceSeverityForRisk(risk={}){return risk.level==='critical'?'critical':risk.level==='high'?'high':risk.level==='medium'?'medium':'low';}
function decisionFor(rules,type,severity,data){return evaluateNotificationRules01408(rules,{type,provider:'suppliers',severity,data});}
async function createIfAllowed(scope,rules,{type,kind,severity='low',code,dedupeKey,common,data={}}){const decision=decisionFor(rules,type,severity,data);if(!decision.allowed||!decision.channels.includes('inApp'))return null;return createSupplierSyncAlert01401(scope,{...common,kind,severity:notificationLegacySeverity01408(decision.effectiveSeverity),code,dedupeKey,payload:{...(common.payload||{}),notificationRuleStage:'01408',matchedRuleIds:decision.matched.map(x=>x.id)}});}
export async function createSupplierSyncApprovalAlerts01401(scope,approval={}){
  await resolveApprovalAlerts01401(scope,approval.id,'read');
  const risk=approval.risk||{},sourceSeverity=sourceSeverityForRisk(risk),rules=(await listNotificationRules01408(scope)).items;
  const common={supplierSourceId:approval.supplierSourceId,approvalId:approval.id,payload:{risk,summary:approval.summary||{},changeTypes:approval.changeTypes||risk.types||[],createdAt:approval.createdAt||'',ruleStage:'01408'}};
  const data={risk,approval:{id:approval.id,summary:approval.summary||{},changeTypes:approval.changeTypes||risk.types||[]},supplier:{sourceId:approval.supplierSourceId||''}};
  const candidates=[
    {type:'supplier.approval.created',kind:'approval-ready',severity:'medium',code:'SUPPLIER_SYNC_APPROVAL_READY_01401',dedupeKey:`approval-ready:${approval.id}:${approval.planFingerprint}`},
    {type:'supplier.risk.detected',kind:'risk-detected',severity:sourceSeverity,code:'SUPPLIER_SYNC_RISK_DETECTED_01401',dedupeKey:`risk:${approval.id}:${approval.planFingerprint}`},
    {type:'supplier.price.changed',kind:'price-change',severity:Number(risk.maxPriceChangePct||0)>=50?'critical':Number(risk.maxPriceChangePct||0)>=25?'high':'medium',code:'SUPPLIER_SYNC_PRICE_CHANGE_01402',dedupeKey:`price-change:${approval.id}:${approval.planFingerprint}`},
    {type:'supplier.stock.zero',kind:'stock-zero',severity:Number(risk.stockToZero||0)>=100?'critical':Number(risk.stockToZero||0)>=20?'high':'medium',code:'SUPPLIER_SYNC_STOCK_ZERO_01402',dedupeKey:`stock-zero:${approval.id}:${approval.planFingerprint}`}
  ];
  const out=[];for(const candidate of candidates){const created=await createIfAllowed(scope,rules,{...candidate,common,data});if(created)out.push(created);}return out;
}
export async function createSupplierSyncSchedulerErrorAlert01401(scope,schedule={},error={}){
  const rules=(await listNotificationRules01408(scope)).items,code=str(error?.code||error?.message||'SUPPLIER_SYNC_SCHEDULER_ERROR_01401'),sourceId=schedule.supplier_source_id||schedule.supplierSourceId||'';
  return createIfAllowed(scope,rules,{type:'supplier.scheduler.failed',kind:'scheduler-error',severity:'high',code,dedupeKey:`scheduler-error:${sourceId}:${code}`,common:{supplierSourceId:sourceId,payload:{code,detail:str(error?.detail||'').slice(0,500),scheduleId:schedule.id||'',at:new Date().toISOString(),ruleStage:'01408'}},data:{supplier:{sourceId},scheduler:{scheduleId:schedule.id||'',code}}});
}
