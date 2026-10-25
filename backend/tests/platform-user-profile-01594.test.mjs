import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assertPlatformSuperadmin01592} from '../src/platform-user-registry-core-01592.mjs';
const service=fs.readFileSync(new URL('../src/platform-user-registry-service-01592.mjs',import.meta.url),'utf8');
const routes=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
test('01594 user profile stays guarded by exact platform superadmin user ID',async()=>{
  assert.throws(()=>assertPlatformSuperadmin01592('usr_not_platform_admin','usr_another_user'),/PLATFORM_SUPERADMIN_REQUIRED/);
  assert.match(service,/export async function getPlatformUser01592\(actorId,targetId\)\{\s*assertPlatformSuperadmin01592\(actorId\)/);
});
test('01594 session query returns timestamps and status only; no session ID or hashes',()=>{
  assert.match(service,/SELECT CASE WHEN status='active'.*END status,created_at "createdAt",last_seen_at "lastSeenAt",expires_at "expiresAt"\s+FROM api_sessions WHERE user_id=\$1/);
  assert.match(service,/WHERE user_id=\$1 ORDER BY COALESCE\(last_seen_at,created_at\) DESC LIMIT 25/);
});
test('01594 audit records omit potentially sensitive payload and target user membership is scoped',()=>{
  assert.match(service,/JOIN platform_memberships m ON l.target_type='membership' AND l.target_id=m.id/);
  assert.match(service,/WHERE m.user_id=\$1 ORDER BY l.id DESC LIMIT 40/);
  assert.match(service,/FROM platform_admin_audit_log WHERE actor_user_id=\$1 ORDER BY id DESC LIMIT 40/);
  assert.doesNotMatch(service,/SELECT l\.\*|SELECT \* FROM platform_admin_audit_log/);
});
test('01594 profile remains strictly read-only and cache-disabled',()=>{
  assert.match(routes,/await getPlatformUser01592\(session\.userId,p\[5\]\).*'cache-control':'private, no-store'/);
  assert.match(routes,/REGISTRY_READ_ONLY_01592/);
  assert.doesNotMatch(service,/DELETE FROM platform_memberships|UPDATE platform_memberships|UPDATE api_sessions/);
});
