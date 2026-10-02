// 01409 · DB-backed Music School curriculum repository and export.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {withClient,withTransaction} from './db.mjs';
import {createZip01143} from './zip-01143.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH=path.resolve(here,'../data/music-school-guitar-01409.json');
let catalogPromise=null;
let seedPromise=null;

const str=v=>String(v??'').trim();
const int=(v,f=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):f;
const j=v=>JSON.stringify(v??{});

async function loadSeedCatalog01409(){
  if(!catalogPromise)catalogPromise=fs.readFile(CATALOG_PATH,'utf8').then(JSON.parse);
  return catalogPromise;
}

async function insertFolder(client,{id,parentId=null,nodeType,slug,orderIndex=0,nameKey='',nameI18n={},metadata={}}){
  await client.query(`INSERT INTO music_school_folders(id,parent_id,node_type,slug,order_index,name_key,name_i18n,metadata)
    VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)
    ON CONFLICT(id) DO NOTHING`,[id,parentId,nodeType,slug,orderIndex,nameKey,j(nameI18n),j(metadata)]);
}

export async function ensureMusicSchoolCatalog01409(){
  if(seedPromise)return seedPromise;
  seedPromise=(async()=>{
    const catalog=await loadSeedCatalog01409();
    return withTransaction(async client=>{
      await insertFolder(client,{id:catalog.root.id,nodeType:'root',slug:catalog.root.slug,nameI18n:{uk:catalog.root.nameUk},metadata:{system:true}});
      await insertFolder(client,{id:catalog.school.id,parentId:catalog.root.id,nodeType:'school',slug:catalog.school.slug,nameI18n:{uk:catalog.school.nameUk},metadata:{system:true}});
      await insertFolder(client,{id:catalog.instrument.id,parentId:catalog.school.id,nodeType:'instrument',slug:catalog.instrument.slug,nameI18n:{uk:catalog.instrument.nameUk},metadata:{instrument:catalog.instrument.instrument,system:true}});
      for(const level of catalog.levels||[]){
        const levelFolderId=`music-school-guitar-${level.id}`;
        await insertFolder(client,{id:levelFolderId,parentId:catalog.instrument.id,nodeType:'level',slug:level.slug,orderIndex:level.order,nameKey:level.titleKey,nameI18n:{uk:level.nameUk},metadata:{levelId:level.id,factor:level.factor,fretMax:level.fretMax}});
        for(const lesson of level.lessons||[]){
          const lessonFolderId=`${levelFolderId}-${lesson.slug}`;
          await insertFolder(client,{id:lessonFolderId,parentId:levelFolderId,nodeType:'lesson',slug:lesson.slug,orderIndex:lesson.order,nameKey:lesson.titleKey,nameI18n:{uk:lesson.localeUk?.folderName||lesson.localeUk?.title||''},metadata:{lessonId:lesson.id,status:lesson.status}});
          const schoolContent={school:lesson.school||{},localeUk:lesson.localeUk||{},schemaVersion:catalog.schemaVersion||1};
          await client.query(`INSERT INTO music_school_lessons(id,folder_id,instrument,level_id,level_order,lesson_order,status,title_key,title_i18n,description_key,description_i18n,definition,school_content,latest_version)
            VALUES($1,$2,'guitar',$3,$4,$5,$6,$7,$8::jsonb,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13)
            ON CONFLICT(id) DO NOTHING`,[
              lesson.id,lessonFolderId,level.id,level.order,lesson.order,lesson.status,lesson.titleKey,j({uk:lesson.localeUk?.title||''}),lesson.descriptionKey,j({uk:lesson.localeUk?.description||''}),j(lesson.definition||{}),j(schoolContent),int(lesson.version,1)
            ]);
          const snapshot={stage:'01409',schemaVersion:catalog.schemaVersion||1,instrument:'guitar',level:{id:level.id,order:level.order,titleKey:level.titleKey,nameUk:level.nameUk},lesson};
          await client.query(`INSERT INTO music_school_lesson_versions(lesson_id,version,source_stage,snapshot) VALUES($1,$2,'01409',$3::jsonb) ON CONFLICT(lesson_id,version) DO NOTHING`,[lesson.id,int(lesson.version,1),j(snapshot)]);
        }
      }
      return {stage:'01409',seeded:true};
    });
  })().catch(error=>{seedPromise=null;throw error;});
  return seedPromise;
}

function mapFolder(row){return {id:row.id,parentId:row.parentId||'',type:row.nodeType,slug:row.slug,order:Number(row.orderIndex)||0,nameKey:row.nameKey||'',nameI18n:row.nameI18n||{},metadata:row.metadata||{}};}
function mapLesson(row){
  const content=row.schoolContent||{};
  return {id:row.id,folderId:row.folderId,instrument:row.instrument,levelId:row.levelId,levelOrder:Number(row.levelOrder)||1,order:Number(row.lessonOrder)||1,status:row.status,titleKey:row.titleKey,titleI18n:row.titleI18n||{},descriptionKey:row.descriptionKey,descriptionI18n:row.descriptionI18n||{},definition:row.definition||{},school:content.school||{},localeUk:content.localeUk||{},version:Number(row.latestVersion)||1,updatedAt:row.updatedAt};
}

const FOLDER_SELECT=`SELECT id,parent_id "parentId",node_type "nodeType",slug,order_index "orderIndex",name_key "nameKey",name_i18n "nameI18n",metadata FROM music_school_folders`;
const LESSON_SELECT=`SELECT id,folder_id "folderId",instrument,level_id "levelId",level_order "levelOrder",lesson_order "lessonOrder",status,title_key "titleKey",title_i18n "titleI18n",description_key "descriptionKey",description_i18n "descriptionI18n",definition,school_content "schoolContent",latest_version "latestVersion",updated_at "updatedAt" FROM music_school_lessons`;

export async function listMusicSchoolTree01409(){
  await ensureMusicSchoolCatalog01409();
  return withClient(async client=>{
    const [foldersQ,lessonsQ]=await Promise.all([
      client.query(`${FOLDER_SELECT} ORDER BY parent_id NULLS FIRST,order_index,id`),
      client.query(`${LESSON_SELECT} WHERE instrument='guitar' ORDER BY level_order,lesson_order`)
    ]);
    const folders=foldersQ.rows.map(mapFolder),lessons=lessonsQ.rows.map(mapLesson);
    const levels=folders.filter(x=>x.type==='level').sort((a,b)=>a.order-b.order).map(folder=>({
      id:folder.metadata?.levelId||folder.slug,folderId:folder.id,order:folder.order,titleKey:folder.nameKey,nameI18n:folder.nameI18n,metadata:folder.metadata,
      lessons:lessons.filter(lesson=>lesson.levelId===(folder.metadata?.levelId||folder.slug))
    }));
    return {stage:'01409',schemaVersion:1,repository:'postgresql',path:['music','school','guitar'],folders,levels,stats:{folders:folders.length,levels:levels.length,lessons:lessons.length,publishedLessons:lessons.filter(x=>x.status==='published').length}};
  });
}

export async function getMusicSchoolLesson01409(lessonId){
  await ensureMusicSchoolCatalog01409();
  return withClient(async client=>{
    const q=await client.query(`${LESSON_SELECT} WHERE id=$1`,[str(lessonId)]);
    if(!q.rowCount)throw Object.assign(new Error('Music school lesson not found'),{statusCode:404});
    const lesson=mapLesson(q.rows[0]);
    const versions=await client.query(`SELECT version,source_stage "sourceStage",created_at "createdAt" FROM music_school_lesson_versions WHERE lesson_id=$1 ORDER BY version DESC`,[lesson.id]);
    return {stage:'01409',lesson,versions:versions.rows};
  });
}

export async function exportMusicSchool01409({levelId=''}={}){
  const tree=await listMusicSchoolTree01409(),filter=str(levelId);
  const levels=filter?tree.levels.filter(level=>level.id===filter):tree.levels;
  if(filter&&!levels.length)throw Object.assign(new Error('Music school level not found'),{statusCode:404});
  const files=new Map();
  const manifest={stage:'01409',schemaVersion:1,type:'shifttime-music-school-export',instrument:'guitar',levelId:filter||null,exportedAt:new Date().toISOString(),path:'music/school/guitar',levels:levels.map(level=>({id:level.id,order:level.order,lessons:level.lessons.length}))};
  files.set('manifest.json',JSON.stringify(manifest,null,2));
  files.set('music/school/guitar/tree.json',JSON.stringify({path:tree.path,stats:tree.stats,levels:levels.map(({lessons,...level})=>({...level,lessonIds:lessons.map(x=>x.id)}))},null,2));
  for(const level of levels){
    for(const lesson of level.lessons){
      const n=String(lesson.order).padStart(2,'0');
      files.set(`music/school/guitar/${level.id}/lesson-${n}/lesson.json`,JSON.stringify(lesson,null,2));
    }
  }
  const suffix=filter?`-${filter}`:'';
  return {stage:'01409',filename:`ShiftTime-Music-School-Guitar${suffix}-01409.zip`,buffer:createZip01143(files),entryCount:files.size};
}
