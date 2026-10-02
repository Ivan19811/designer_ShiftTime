import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const service=read('../src/music-school-editor-service-01410.mjs');
const server=read('../src/server.mjs');

test('01410 editor creates immutable lesson versions on every save',()=>{
  assert.match(service,/latestVersion\+1|current\.version\+1/);
  assert.match(service,/INSERT INTO music_school_lesson_versions/);
  assert.match(service,/UPDATE music_school_lessons/);
});

test('01410 editor supports safe draft or published status and norm editing',()=>{
  assert.match(service,/draft','published','structure-ready','archived/);
  assert.match(service,/maxSeconds/);
  assert.match(service,/minCorrectNpm/);
});

test('01410 rollback creates a new version instead of deleting history',()=>{
  assert.match(service,/rollbackMusicSchoolLesson01410/);
  assert.match(service,/fromVersion/);
  assert.match(service,/toVersion/);
});

test('01410 server exposes save, version history and rollback routes',()=>{
  assert.match(server,/saveMusicSchoolLesson01410/);
  assert.match(server,/getMusicSchoolLessonVersions01410/);
  assert.match(server,/rollbackMusicSchoolLesson01410/);
});
