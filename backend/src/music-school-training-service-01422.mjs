// 01422 · DB-backed Music School training exercise catalog.
import {withClient} from './db.mjs';
const str=v=>String(v??'').trim();
const j=v=>JSON.stringify(v??{});
const DEFAULT_EXERCISE=Object.freeze({
  id:'guitar-finger-1234',instrument:'guitar',category:'coordination',order:1,status:'published',
  titleKey:'musicStudio.workspace.training.exerciseFinger1234Title',
  descriptionKey:'musicStudio.workspace.training.exerciseFinger1234Description',
  definition:{kind:'fret-sequence',fretSpan:4,stringOrder:[1,2,3,4,5,6],directions:['up','down','updown'],countInBeats:3,preRollSeconds:2,notesPerBeat:1,inactivityStopSeconds:180,maxSessionMinutes:30,requiresExactStringFret:true},
  ui:{accent:'cyan',icon:'1234'}
});
let seedPromise=null;
export async function ensureMusicTrainingCatalog01422(){if(seedPromise)return seedPromise;seedPromise=withClient(async client=>{await client.query(`INSERT INTO music_school_training_exercises(id,instrument,category,order_index,status,title_key,description_key,definition,ui_config,source_stage)
VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,'01422') ON CONFLICT(id) DO NOTHING`,[DEFAULT_EXERCISE.id,DEFAULT_EXERCISE.instrument,DEFAULT_EXERCISE.category,DEFAULT_EXERCISE.order,DEFAULT_EXERCISE.status,DEFAULT_EXERCISE.titleKey,DEFAULT_EXERCISE.descriptionKey,j(DEFAULT_EXERCISE.definition),j(DEFAULT_EXERCISE.ui)]);return {stage:'01422',seeded:true};}).catch(error=>{seedPromise=null;throw error;});return seedPromise;}
function map(row){return {id:row.id,instrument:row.instrument,category:row.category,order:Number(row.orderIndex)||0,status:row.status,titleKey:row.titleKey,descriptionKey:row.descriptionKey,definition:row.definition||{},ui:row.uiConfig||{},sourceStage:row.sourceStage,updatedAt:row.updatedAt};}
export async function listMusicTrainingExercises01422({instrument='guitar'}={}){await ensureMusicTrainingCatalog01422();return withClient(async client=>{const q=await client.query(`SELECT id,instrument,category,order_index "orderIndex",status,title_key "titleKey",description_key "descriptionKey",definition,ui_config "uiConfig",source_stage "sourceStage",updated_at "updatedAt" FROM music_school_training_exercises WHERE instrument=$1 ORDER BY category,order_index,id`,[str(instrument)||'guitar']);return {stage:'01422',repository:'postgresql',exercises:q.rows.map(map),count:q.rowCount};});}
export async function getMusicTrainingExercise01422(id){await ensureMusicTrainingCatalog01422();return withClient(async client=>{const q=await client.query(`SELECT id,instrument,category,order_index "orderIndex",status,title_key "titleKey",description_key "descriptionKey",definition,ui_config "uiConfig",source_stage "sourceStage",updated_at "updatedAt" FROM music_school_training_exercises WHERE id=$1`,[str(id)]);if(!q.rowCount)throw Object.assign(new Error('Music training exercise not found'),{statusCode:404});return {stage:'01422',exercise:map(q.rows[0])};});}
