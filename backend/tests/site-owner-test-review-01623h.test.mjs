import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const file=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
test('01623H owner test branch opens approval workflow, not direct LIVE publication',()=>{
 const pub=file('../js/site-publish/site-publish-ui-01143.js');
 assert.match(pub,/foreign01623H\|\|window\.ST_SITE_TEST_01613D\?\.isTestEditing/);
 assert.match(pub,/ST_SITE_TEST_01613D\?\.open\?\./);
 assert.match(pub,/«Доручені сайти»/);
});
test('01623H owner does not PUT into another author\'s draft',()=>{
 const runtime=file('../js/sites/site-revision-runtime-01231.js');
 const backend=file('../backend/src/site-revisions-01231.mjs');
 assert.match(runtime,/ST_TEST_READONLY_OWNER_REVIEW_01623H/);
 assert.match(runtime,/active01623H\.createdByUserId/);
 assert.match(backend,/createdByUserId:clean\(row\.created_by_user_id\)/);
 assert.match(backend,/ST_TEST_AUTHOR_REQUIRED_01613D/);
});
