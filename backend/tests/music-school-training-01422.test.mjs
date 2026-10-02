import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
test('01422 migration creates shared training catalog',()=>{const sql=read('sql/026_music_school_training_exercises.sql');assert.match(sql,/music_school_training_exercises/);assert.match(sql,/definition jsonb/);});
test('01422 service seeds finger 1-2-3-4 exercise with safety limits',()=>{const src=read('src/music-school-training-service-01422.mjs');assert.match(src,/guitar-finger-1234/);assert.match(src,/countInBeats:3/);assert.match(src,/inactivityStopSeconds:180/);assert.match(src,/maxSessionMinutes:30/);});
test('01422 server exposes training catalog routes',()=>{const src=read('src/server.mjs');assert.match(src,/training-exercises/);assert.match(src,/listMusicTrainingExercises01422/);});
