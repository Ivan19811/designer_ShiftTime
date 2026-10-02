import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const sql=read('../sql/025_music_school_repository.sql');
const service=read('../src/music-school-service-01409.mjs');
const server=read('../src/server.mjs');
const data=JSON.parse(read('../data/music-school-guitar-01409.json'));

test('01409 school migration creates hierarchical curriculum tables',()=>{
  assert.match(sql,/CREATE TABLE IF NOT EXISTS music_school_folders/);
  assert.match(sql,/parent_id text REFERENCES music_school_folders/);
  assert.match(sql,/CREATE TABLE IF NOT EXISTS music_school_lessons/);
  assert.match(sql,/CREATE TABLE IF NOT EXISTS music_school_lesson_versions/);
});

test('01409 seed contains 10 levels, 120 lessons and 12 authored Base lessons',()=>{
  assert.equal(data.levels.length,10);
  assert.equal(data.levels.reduce((sum,l)=>sum+l.lessons.length,0),120);
  assert.equal(data.levels[0].lessons.filter(x=>x.status==='published').length,12);
  assert.ok(data.levels[0].lessons.every(x=>x.localeUk.theoryA&&x.localeUk.guideText&&x.localeUk.quizQuestion));
});

test('01409 service seeds stable folders without overwriting existing authored records',()=>{
  assert.match(service,/ON CONFLICT\(id\) DO NOTHING/);
  assert.match(service,/ON CONFLICT\(lesson_id,version\) DO NOTHING/);
  assert.match(service,/music\/school\/guitar\/\$\{level\.id\}\/lesson-/);
});

test('01409 server exposes authenticated school tree, lesson and ZIP export',()=>{
  assert.match(server,/listMusicSchoolTree01409/);
  assert.match(server,/getMusicSchoolLesson01409/);
  assert.match(server,/exportMusicSchool01409/);
  assert.match(server,/application\/zip/);
});
