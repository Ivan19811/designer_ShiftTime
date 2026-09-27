import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const backend=path.resolve(here,'..');
const root=path.resolve(backend,'..');
const read=p=>fs.readFileSync(p,'utf8');

test('01366 adds an isolated sequencer engine with Web Audio look-ahead scheduling',()=>{
  const seq=read(path.join(root,'js/music-studio/music-studio-sequencer-01366.js'));
  const audio=read(path.join(root,'js/music-studio/music-studio-audio-engine-01366.js'));
  assert.match(seq,/lookAheadSeconds=\.14/);
  assert.match(seq,/setInterval\(\(\)=>this\.process\(\),this\.pollMs\)/);
  assert.match(seq,/audio\?\.scheduleNote/);
  assert.match(seq,/includeOverlaps/);
  assert.match(seq,/sequencer-resync/);
  assert.match(audio,/scheduleNote\(/);
  assert.match(audio,/osc\.start\(t\)/);
  assert.match(audio,/osc\.stop\(stopAt\)/);
});

test('01366 transport binds Play Pause Stop Seek Loop and tempo changes to the sequencer',()=>{
  const src=read(path.join(root,'js/music-studio/music-studio-01366.js'));
  assert.match(src,/MusicStudioSequencer01366/);
  assert.match(src,/await sequencer\?\.start\?\.\(clock\.beat\)/);
  assert.match(src,/sequencer\?\.pause\?\.\(\)/);
  assert.match(src,/sequencer\?\.stop\?\./);
  assert.match(src,/sequencer\?\.resync\?\.\('tempo-change'\)/);
  assert.match(src,/sequencer\?\.resync\?\.\('seek'\)/);
  assert.match(src,/project\.loop\?\.enabled/);
  assert.match(src,/setPlaybackHighlight01366/);
  assert.doesNotMatch(src,/[А-Яа-яІіЇїЄєҐґ]/);
});

test('01366 boots new module locale css Music Log and keeps isolated port 5555',()=>{
  const init=read(path.join(root,'js/builder-init.js'));
  const html=read(path.join(root,'index.html'));
  const locale=read(path.join(root,'js/music-studio/i18n/uk-01366.js'));
  const log=read(path.join(root,'js/music-studio/music-studio-log-01366.js'));
  const settings=JSON.parse(read(path.join(root,'.vscode/settings.json')));
  assert.match(init,/initMusicStudio01366/);
  assert.match(html,/music-studio-01366\.css\?v=01366/);
  assert.match(html,/musicStudio=01366/);
  assert.match(locale,/SEQUENCER 01366/);
  assert.match(log,/MUSIC_LOG_KEY_01366/);
  assert.equal(settings['liveServer.settings.port'],5555);
  assert.equal(settings['liveServer.settings.host'],'127.0.0.1');
});

test('01366 sequencer schedules notes from current beat and can stop cleanly',async()=>{
  const {MusicStudioSequencer01366}=await import(pathToFileURL(path.join(root,'js/music-studio/music-studio-sequencer-01366.js')).href);
  const scheduled=[];let panicCount=0;
  const audio={ensure:async()=>true,now:()=>10,scheduleNote:async n=>{scheduled.push(n);return `v${scheduled.length}`;},noteOff:()=>{},panic:()=>{panicCount++;}};
  const clock={playing:true,beat:2,secondsPerBeat:()=>.5};
  const notes=[{id:'n1',pitch:60,startBeat:2,durationBeats:1,velocity:100,instrumentData:{studioVelocity:150}},{id:'n2',pitch:64,startBeat:2.2,durationBeats:.5,velocity:90,instrumentData:{}}];
  const seq=new MusicStudioSequencer01366({clock,audio,getNotes:()=>notes,onHighlight:()=>{},trace:()=>{}});
  await seq.start(2);await new Promise(r=>setTimeout(r,20));
  assert.ok(scheduled.length>=2);
  assert.equal(scheduled[0].pitch,60);
  assert.equal(Math.round(scheduled[0].velocity),150);
  seq.stop({panic:true,reason:'test'});
  assert.equal(seq.snapshot().active,false);
  assert.ok(panicCount>=1);
});
