import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const backend=path.resolve(here,'..');
const root=path.resolve(backend,'..');
const read=p=>fs.readFileSync(p,'utf8');

test('01360 migration contains independent Music Studio persistence tables',()=>{
  const sql=read(path.join(backend,'sql/024_music_studio_foundation.sql'));
  for(const table of ['music_projects','music_tracks','music_clips','music_note_events','music_assets'])assert.match(sql,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  assert.match(sql,/gallery_folder_id text NOT NULL DEFAULT 'sys_music'/);
  assert.match(sql,/media_asset_id text REFERENCES media_cloud_assets/);
});

test('01360 server exposes authenticated Music Studio routes',()=>{
  const server=read(path.join(backend,'src/server.mjs'));
  assert.match(server,/from '\.\/music-studio-service-01360\.mjs'/);
  assert.match(server,/p\[2\]==='music'/);
  assert.match(server,/p\[3\]==='projects'/);
  assert.match(server,/p\[3\]==='gallery-assets'/);
});

test('01360 builder uses independent Music Studio core and no local project persistence',()=>{
  const source=read(path.join(root,'js/music-studio/music-studio-01360.js'));
  assert.match(source,/MusicStudioApiRepository01360/);
  assert.match(source,/MusicStudioClock01360/);
  assert.match(source,/MusicStudioAudioEngine01360/);
  assert.doesNotMatch(source,/localStorage\.setItem\([^)]*project/i);
  assert.match(source,/st:gallery-system-provider-request/);
});

test('01360 Gallery exposes localized system Music folder through provider bridge',()=>{
  const gallery=read(path.join(root,'js/design/widgets/gallery-widget/gallery-widget.js'));
  const locale=read(path.join(root,'js/i18n/locales/uk-01130.js'));
  assert.match(gallery,/GALLERY_SYSTEM_MUSIC_01360/);
  assert.match(gallery,/music01360/);
  assert.match(locale,/music:'Музика'/);
});

test('Music Studio branch uses its isolated Live Server origin after 01361',()=>{
  const settings=JSON.parse(read(path.join(root,'.vscode/settings.json')));
  assert.equal(settings['liveServer.settings.host'],'127.0.0.1');
  assert.equal(settings['liveServer.settings.port'],5555);
});
