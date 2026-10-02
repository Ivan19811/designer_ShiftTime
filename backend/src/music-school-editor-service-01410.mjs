// 01410 · Music School lesson editor service. Every save creates an immutable version snapshot.
import {withClient,withTransaction} from './db.mjs';
import {ensureMusicSchoolCatalog01409,getMusicSchoolLesson01409} from './music-school-service-01409.mjs';

const str=v=>String(v??'').trim();
const int=(v,f=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):f;
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const arr=v=>Array.isArray(v)?v:[];
const json=v=>JSON.stringify(v??{});
const allowedStatus=new Set(['draft','published','structure-ready','archived']);
const cleanText=(v,max=50000)=>str(v).slice(0,max);

function normalizeLessonPatch(input,current){
  const body=obj(input),school=obj(body.school),localeUk=obj(body.localeUk),definition=obj(body.definition);
  const nextStatus=allowedStatus.has(str(body.status))?str(body.status):current.status;
  const currentSchool=obj(current.school),currentLocale=obj(current.localeUk),currentDef=obj(current.definition);
  const safeSchool={...currentSchool,...school};
  for(const key of ['staffCandidates','demoPositions','strands'])if(key in school)safeSchool[key]=arr(school[key]);
  for(const key of ['markPitch','quizCorrect','earPitch'])if(key in school)safeSchool[key]=int(school[key],int(currentSchool[key]));
  const safeLocale={...currentLocale};
  for(const key of ['folderName','title','description','theoryTitle','theoryA','theoryB','history','markPrompt','quizQuestion','quizOption1','quizOption2','quizOption3','guideTitle','guideText','notebookPrompt'])if(key in localeUk)safeLocale[key]=cleanText(localeUk[key]);
  const norm=obj(definition.norm),currentNorm=obj(currentDef.norm);
  const safeDefinition={...currentDef,...definition,norm:{...currentNorm,...norm}};
  if('maxSeconds' in norm)safeDefinition.norm.maxSeconds=Math.max(20,Math.min(7200,int(norm.maxSeconds,180)));
  if('minCorrectNpm' in norm)safeDefinition.norm.minCorrectNpm=Math.max(0,Math.min(1000,Number(norm.minCorrectNpm)||0));
  for(const key of ['strings','frets','pitchClasses'])if(key in definition)safeDefinition[key]=arr(definition[key]).map(Number).filter(Number.isFinite);
  if('kind' in definition)safeDefinition.kind=['exact','note'].includes(str(definition.kind))?str(definition.kind):currentDef.kind;
  return {status:nextStatus,school:safeSchool,localeUk:safeLocale,definition:safeDefinition};
}

async function selectLessonForUpdate(client,lessonId){
  const q=await client.query(`SELECT id,folder_id "folderId",instrument,level_id "levelId",level_order "levelOrder",lesson_order "lessonOrder",status,title_key "titleKey",title_i18n "titleI18n",description_key "descriptionKey",description_i18n "descriptionI18n",definition,school_content "schoolContent",latest_version "latestVersion",updated_at "updatedAt" FROM music_school_lessons WHERE id=$1 FOR UPDATE`,[str(lessonId)]);
  if(!q.rowCount)throw Object.assign(new Error('Music school lesson not found'),{statusCode:404});
  const row=q.rows[0],content=obj(row.schoolContent);
  return {id:row.id,folderId:row.folderId,instrument:row.instrument,levelId:row.levelId,levelOrder:Number(row.levelOrder)||1,order:Number(row.lessonOrder)||1,status:row.status,titleKey:row.titleKey,titleI18n:obj(row.titleI18n),descriptionKey:row.descriptionKey,descriptionI18n:obj(row.descriptionI18n),definition:obj(row.definition),school:obj(content.school),localeUk:obj(content.localeUk),schemaVersion:int(content.schemaVersion,1),version:int(row.latestVersion,1),updatedAt:row.updatedAt};
}

export async function saveMusicSchoolLesson01410(lessonId,input,{actorUserId=''}={}){
  await ensureMusicSchoolCatalog01409();
  return withTransaction(async client=>{
    const current=await selectLessonForUpdate(client,lessonId),patch=normalizeLessonPatch(input,current),nextVersion=current.version+1;
    const schoolContent={school:patch.school,localeUk:patch.localeUk,schemaVersion:current.schemaVersion||1};
    await client.query(`UPDATE music_school_lessons SET status=$2,title_i18n=$3::jsonb,description_i18n=$4::jsonb,definition=$5::jsonb,school_content=$6::jsonb,latest_version=$7,updated_at=now() WHERE id=$1`,[
      current.id,patch.status,json({uk:patch.localeUk.title||current.titleI18n?.uk||''}),json({uk:patch.localeUk.description||current.descriptionI18n?.uk||''}),json(patch.definition),json(schoolContent),nextVersion
    ]);
    const snapshot={stage:'01410',schemaVersion:current.schemaVersion||1,instrument:current.instrument,level:{id:current.levelId,order:current.levelOrder},lesson:{...current,status:patch.status,definition:patch.definition,school:patch.school,localeUk:patch.localeUk,version:nextVersion},editor:{actorUserId:str(actorUserId),mode:str(input?.mode)||'save'}};
    await client.query(`INSERT INTO music_school_lesson_versions(lesson_id,version,source_stage,snapshot) VALUES($1,$2,'01410',$3::jsonb)`,[current.id,nextVersion,json(snapshot)]);
    return getMusicSchoolLesson01410FromClient(client,current.id);
  });
}

async function getMusicSchoolLesson01410FromClient(client,lessonId){
  const current=await selectLessonForUpdate(client,lessonId);
  const versions=await client.query(`SELECT version,source_stage "sourceStage",created_at "createdAt" FROM music_school_lesson_versions WHERE lesson_id=$1 ORDER BY version DESC`,[current.id]);
  return {stage:'01410',lesson:current,versions:versions.rows};
}

export async function rollbackMusicSchoolLesson01410(lessonId,version,{actorUserId=''}={}){
  await ensureMusicSchoolCatalog01409();
  return withTransaction(async client=>{
    const current=await selectLessonForUpdate(client,lessonId),targetVersion=Math.max(1,int(version));
    const q=await client.query(`SELECT snapshot FROM music_school_lesson_versions WHERE lesson_id=$1 AND version=$2`,[current.id,targetVersion]);
    if(!q.rowCount)throw Object.assign(new Error('Music school lesson version not found'),{statusCode:404});
    const snap=obj(q.rows[0].snapshot),lesson=obj(snap.lesson),nextVersion=current.version+1;
    const school=obj(lesson.school),localeUk=obj(lesson.localeUk),definition=obj(lesson.definition),status=allowedStatus.has(str(lesson.status))?str(lesson.status):'draft';
    const schoolContent={school,localeUk,schemaVersion:int(snap.schemaVersion,current.schemaVersion||1)};
    await client.query(`UPDATE music_school_lessons SET status=$2,title_i18n=$3::jsonb,description_i18n=$4::jsonb,definition=$5::jsonb,school_content=$6::jsonb,latest_version=$7,updated_at=now() WHERE id=$1`,[current.id,status,json({uk:localeUk.title||''}),json({uk:localeUk.description||''}),json(definition),json(schoolContent),nextVersion]);
    const nextSnapshot={...snap,stage:'01410',lesson:{...lesson,version:nextVersion},rollback:{fromVersion:current.version,toVersion:targetVersion,actorUserId:str(actorUserId)}};
    await client.query(`INSERT INTO music_school_lesson_versions(lesson_id,version,source_stage,snapshot) VALUES($1,$2,'01410',$3::jsonb)`,[current.id,nextVersion,json(nextSnapshot)]);
    return getMusicSchoolLesson01410FromClient(client,current.id);
  });
}

export async function getMusicSchoolLessonVersions01410(lessonId){
  await ensureMusicSchoolCatalog01409();
  return withClient(async client=>{
    const current=await selectLessonForUpdate(client,lessonId);
    const q=await client.query(`SELECT version,source_stage "sourceStage",created_at "createdAt",snapshot FROM music_school_lesson_versions WHERE lesson_id=$1 ORDER BY version DESC LIMIT 50`,[current.id]);
    return {stage:'01410',lessonId:current.id,currentVersion:current.version,versions:q.rows};
  });
}
