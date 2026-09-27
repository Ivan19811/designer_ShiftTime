// 01364 · Music Studio note-event persistence for the first playable Piano instrument.
// Independent service boundary: no Tables/Marketplace/Presentation/SmartBlocks internals.
import crypto from 'node:crypto';
import {withClient,withTransaction} from './db.mjs';

const str=v=>String(v??'').trim();
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clamp=(v,min,max,f)=>Math.max(min,Math.min(max,num(v,f)));
const uid=prefix=>`${prefix}_${crypto.randomUUID().replace(/-/g,'').slice(0,22)}`;

function httpError(message,statusCode=400){return Object.assign(new Error(message),{statusCode});}
function assertScope(scope={}){if(!str(scope.accountId)||!str(scope.workspaceId)||!str(scope.storeId))throw httpError('Music Studio scope is incomplete',400);}

const NOTE_SELECT=`SELECT n.id,n.project_id "projectId",n.track_id "trackId",n.clip_id "clipId",n.pitch,n.start_beat "startBeat",n.duration_beats "durationBeats",n.velocity,n.channel,n.instrument_data "instrumentData",n.created_at "createdAt",n.updated_at "updatedAt" FROM music_note_events n`;
const mapNote=r=>({id:r.id,projectId:r.projectId,trackId:r.trackId,clipId:r.clipId||'',pitch:Number(r.pitch),startBeat:num(r.startBeat,0),durationBeats:num(r.durationBeats,0.25),velocity:Number(r.velocity)||100,channel:Number(r.channel)||1,instrumentData:r.instrumentData||{},createdAt:r.createdAt,updatedAt:r.updatedAt});

async function assertProject(client,scope,projectId,{lock=false}={}){
  const q=await client.query(`SELECT id,duration_beats "durationBeats",time_signature_numerator "numerator",revision FROM music_projects WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4${lock?' FOR UPDATE':''}`,[str(projectId),scope.accountId,scope.workspaceId,scope.storeId]);
  if(!q.rowCount)throw httpError('Music project not found',404);
  return q.rows[0];
}
async function assertTrack(client,projectId,trackId){
  const q=await client.query(`SELECT id,project_id "projectId",instrument,type FROM music_tracks WHERE id=$1 AND project_id=$2`,[str(trackId),str(projectId)]);
  if(!q.rowCount)throw httpError('Music track not found',404);
  return q.rows[0];
}
async function ensureLivePianoClip(client,project,trackId){
  const found=await client.query(`SELECT id FROM music_clips WHERE project_id=$1 AND track_id=$2 AND clip_type='notes' AND payload->>'systemRole'='live-piano-01364' ORDER BY created_at LIMIT 1`,[project.id,trackId]);
  if(found.rowCount)return found.rows[0].id;
  const id=uid('musicclip');
  await client.query(`INSERT INTO music_clips(id,project_id,track_id,start_beat,duration_beats,clip_type,payload) VALUES($1,$2,$3,0,$4,'notes',$5::jsonb)`,[id,project.id,trackId,Math.max(1,num(project.durationBeats,64)),JSON.stringify({systemRole:'live-piano-01364',createdByStage:'01364'})]);
  return id;
}
async function bumpRevision(client,scope,projectId,noteEnd=0){
  const q=await client.query(`UPDATE music_projects SET duration_beats=GREATEST(duration_beats,$5),revision=revision+1,updated_at=now() WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 RETURNING revision,duration_beats "durationBeats"`,[projectId,scope.accountId,scope.workspaceId,scope.storeId,Math.max(0,num(noteEnd,0))]);
  const revision=Number(q.rows[0]?.revision)||1;
  await client.query(`UPDATE music_assets SET metadata=metadata||$2::jsonb,updated_at=now() WHERE project_id=$1 AND asset_type='music.project'`,[projectId,JSON.stringify({projectRevision:revision,lastNoteStage:'01364'})]);
  return {revision,durationBeats:num(q.rows[0]?.durationBeats,0)};
}

export async function listAuthorizedMusicNotes01364(scope,projectId,{trackId=''}={}){
  assertScope(scope);
  return withClient(async client=>{
    await assertProject(client,scope,projectId);
    const values=[str(projectId)];
    let where='n.project_id=$1';
    if(str(trackId)){await assertTrack(client,projectId,trackId);values.push(str(trackId));where+=' AND n.track_id=$2';}
    const q=await client.query(`${NOTE_SELECT} WHERE ${where} ORDER BY n.start_beat,n.pitch,n.created_at LIMIT 5000`,values);
    return {stage:'01364',notes:q.rows.map(mapNote)};
  });
}

export async function createAuthorizedMusicNote01364(scope,userId,projectId,input={}){
  assertScope(scope);
  return withTransaction(async client=>{
    const project=await assertProject(client,scope,projectId,{lock:true});
    const track=await assertTrack(client,projectId,input.trackId);
    const pitch=Math.trunc(clamp(input.pitch,0,127,60));
    const startBeat=Math.max(0,num(input.startBeat,0));
    const durationBeats=Math.max(0.03125,Math.min(1024,num(input.durationBeats,0.25)));
    const velocity=Math.trunc(clamp(input.velocity,1,127,100));
    const channel=Math.trunc(clamp(input.channel,1,16,1));
    const clipId=str(input.clipId)||await ensureLivePianoClip(client,project,track.id);
    const clipCheck=await client.query(`SELECT id FROM music_clips WHERE id=$1 AND project_id=$2 AND track_id=$3`,[clipId,projectId,track.id]);
    if(!clipCheck.rowCount)throw httpError('Music clip not found',404);
    const id=uid('musicnote');
    const instrumentData={...(input.instrumentData&&typeof input.instrumentData==='object'?input.instrumentData:{}),instrument:track.instrument||'piano',recordedByStage:'01364',recordedByUserId:str(userId)};
    const inserted=await client.query(`INSERT INTO music_note_events(id,project_id,track_id,clip_id,pitch,start_beat,duration_beats,velocity,channel,instrument_data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) RETURNING id,project_id "projectId",track_id "trackId",clip_id "clipId",pitch,start_beat "startBeat",duration_beats "durationBeats",velocity,channel,instrument_data "instrumentData",created_at "createdAt",updated_at "updatedAt"`,[id,projectId,track.id,clipId,pitch,startBeat,durationBeats,velocity,channel,JSON.stringify(instrumentData)]);
    await client.query(`UPDATE music_clips SET duration_beats=GREATEST(duration_beats,$2),updated_at=now() WHERE id=$1`,[clipId,startBeat+durationBeats]);
    const projectState=await bumpRevision(client,scope,projectId,startBeat+durationBeats);
    return {stage:'01364',note:mapNote(inserted.rows[0]),projectRevision:projectState.revision,durationBeats:projectState.durationBeats};
  });
}

export async function deleteAuthorizedMusicNote01364(scope,projectId,noteId){
  assertScope(scope);
  return withTransaction(async client=>{
    await assertProject(client,scope,projectId,{lock:true});
    const q=await client.query(`DELETE FROM music_note_events n USING music_tracks t WHERE n.id=$1 AND n.project_id=$2 AND n.track_id=t.id AND t.project_id=$2 RETURNING n.id`,[str(noteId),str(projectId)]);
    if(!q.rowCount)throw httpError('Music note not found',404);
    const projectState=await bumpRevision(client,scope,projectId,0);
    return {stage:'01364',deleted:true,noteId:str(noteId),projectRevision:projectState.revision};
  });
}
