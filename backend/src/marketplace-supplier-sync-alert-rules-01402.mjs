import {withClient} from './db.mjs';
import {MARKETPLACE_SUPPLIER_SYNC_ALERT_RULE_STAGE_01402,defaultSupplierSyncAlertRules01402,normalizeSupplierSyncAlertRules01402,evaluateSupplierSyncAlertRules01402} from './marketplace-supplier-sync-alert-rules-core-01402.mjs';
import {listNotificationRules01408,replaceSupplierRulesFromLegacy01408,supplierLegacyViewFromUniversalRules01408} from './notification-rule-engine-01408.mjs';
export {MARKETPLACE_SUPPLIER_SYNC_ALERT_RULE_STAGE_01402,defaultSupplierSyncAlertRules01402,normalizeSupplierSyncAlertRules01402,evaluateSupplierSyncAlertRules01402};

async function saveLegacyCompatibility(scope,rules){return withClient(async client=>{await client.query(`INSERT INTO commerce_supplier_sync_alert_rules(store_id,account_id,workspace_id,rules,updated_at) VALUES($1,$2,$3,$4::jsonb,now()) ON CONFLICT(store_id) DO UPDATE SET account_id=excluded.account_id,workspace_id=excluded.workspace_id,rules=excluded.rules,updated_at=now()`,[scope.storeId,scope.accountId,scope.workspaceId,JSON.stringify(rules)]);});}
export async function getSupplierSyncAlertRules01402(scope){const out=await listNotificationRules01408(scope);return supplierLegacyViewFromUniversalRules01408(out.items);}
export async function saveSupplierSyncAlertRules01402(scope,input={}){const rules=normalizeSupplierSyncAlertRules01402(input);await saveLegacyCompatibility(scope,rules);return replaceSupplierRulesFromLegacy01408(scope,rules);}
export async function resetSupplierSyncAlertRules01402(scope){const rules=defaultSupplierSyncAlertRules01402();await withClient(async client=>client.query('DELETE FROM commerce_supplier_sync_alert_rules WHERE store_id=$1',[scope.storeId]));return replaceSupplierRulesFromLegacy01408(scope,rules);}
