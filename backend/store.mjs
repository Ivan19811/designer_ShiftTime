import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {getTemplate,getCategory,CONNECTIVITY} from '../src/device-catalog.mjs';
import {defaultLayout} from './schema.mjs';
export {defaultLayout};
import {mkdirSync} from 'node:fs';import {dirname} from 'node:path';
const now=()=>new Date().toISOString();
const validIds=new Set(['charge','voltage','current','power','temperature','cells','history','details']);
export function validateLayout(o){
 if(!o||!Array.isArray(o.widgets)||!o.settings||typeof o.settings!=='object')throw new Error('INVALID_LAYOUT');
 if(o.widgets.length!==8||new Set(o.widgets.map(w=>w.id)).size!==8||o.widgets.some(w=>!validIds.has(w.id)))throw new Error('INVALID_WIDGETS');
 const widgets=o.widgets.map(w=>({id:w.id,visible:w.visible!==false,titleKey:defaultLayout().widgets.find(d=>d.id===w.id).titleKey,
  label:typeof w.label==='string'?w.label.slice(0,64):'',accent:['mint','cyan','blue','violet','amber'].includes(w.accent)?w.accent:'cyan',
  precision:Math.max(0,Math.min(3,Math.round(Number(w.precision)||0))),alertBelow:Math.max(0,Math.min(100,Number(w.alertBelow)||20))}));
 const settings={pollSeconds:Math.max(2,Math.min(30,Number(o.settings.pollSeconds)||3)),record:o.settings.record!==false,
  alarmBelow:Math.max(0,Math.min(100,Number(o.settings.alarmBelow)||20)),theme:['obsidian','steel'].includes(o.settings.theme)?o.settings.theme:'obsidian'};
 return {widgets,settings};
}
const finite=(value)=>typeof value==='number'&&Number.isFinite(value);
export function validateReading(p){
 if(!p||!['live'].includes(p.source))throw new Error('INVALID_READING_SOURCE');
 const data={};for(const key of ['voltage','current','power','soc','remainingAh','capacityAh','cycles','temperature']){
  if(p[key]!==undefined&&p[key]!==null){if(!finite(p[key])||Math.abs(p[key])>1e7)throw new Error('INVALID_READING');data[key]=p[key];}
 }
 if(!('soc' in data)||!('voltage' in data)||data.soc<0||data.soc>100||data.voltage<0||data.voltage>100)throw new Error('INVALID_READING');
 const cells=Array.isArray(p.cells)?p.cells:[];
 if(cells.length>32||cells.some(x=>!finite(x)||x<0||x>7))throw new Error('INVALID_CELLS');
 data.cells=cells;data.deviceName=typeof p.deviceName==='string'?p.deviceName.slice(0,80):'';return data;
}
export class IotDb{
 constructor(file){if(file!==':memory:')mkdirSync(dirname(file),{recursive:true});this.db=new DatabaseSync(file);
  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, json TEXT NOT NULL, updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS readings (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, device_name TEXT, voltage REAL, current REAL, power REAL, soc REAL, temperature REAL, remaining_ah REAL, capacity_ah REAL, cycles INTEGER, cells_json TEXT NOT NULL);`);
  this.db.exec('CREATE INDEX IF NOT EXISTS idx_iot_readings_created ON readings(created_at)');
  this.db.exec(`CREATE TABLE IF NOT EXISTS devices (
   id TEXT PRIMARY KEY, template_id TEXT, category_id TEXT NOT NULL, name TEXT NOT NULL,
   protocol TEXT NOT NULL, driver_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
   CREATE INDEX IF NOT EXISTS idx_iot_devices_category ON devices(category_id,created_at);`);
  const exists=this.db.prepare('SELECT id FROM settings WHERE id=?').get('studio');if(!exists)this.saveLayout(defaultLayout());
 }
 getLayout(){return JSON.parse(this.db.prepare('SELECT json FROM settings WHERE id=?').get('studio').json);}
 saveLayout(value){const layout=validateLayout(value);this.db.prepare(`INSERT INTO settings (id,json,updated_at) VALUES(?,?,?)
 ON CONFLICT(id) DO UPDATE SET json=excluded.json,updated_at=excluded.updated_at`).run('studio',JSON.stringify(layout),now());return layout;}
 appendReading(input){const p=validateReading(input),ts=now();this.db.prepare(`INSERT INTO readings(created_at,device_name,voltage,current,power,soc,temperature,remaining_ah,capacity_ah,cycles,cells_json)
 VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(ts,p.deviceName||'',p.voltage,p.current??null,p.power??null,p.soc,p.temperature??null,p.remainingAh??null,p.capacityAh??null,p.cycles??null,JSON.stringify(p.cells));return {saved:true,createdAt:ts};}
 getHistory(limit=100){const rows=this.db.prepare(`SELECT created_at AS time,voltage,current,power,soc,temperature,remaining_ah AS remainingAh,capacity_ah AS capacityAh,cycles,cells_json AS cells FROM readings ORDER BY id DESC LIMIT ?`).all(Math.max(1,Math.min(360,limit)));
  return rows.reverse().map(({cells,...x})=>({...x,cells:JSON.parse(cells)}));}
 getDevices(){return this.db.prepare(`SELECT id,template_id AS templateId,category_id AS categoryId,name,protocol,driver_id AS driverId,created_at AS createdAt,updated_at AS updatedAt FROM devices ORDER BY created_at DESC`).all();}
 addDevice(input){
  if(!input||typeof input!=='object')throw new Error('INVALID_DEVICE');
  if(this.db.prepare('SELECT COUNT(*) AS total FROM devices').get().total>=1000)throw new Error('DEVICE_LIMIT');
  const template=input.templateId?getTemplate(input.templateId):null;
  if(input.templateId && !template)throw new Error('INVALID_TEMPLATE');
  const categoryId=template?.category||input.categoryId;
  if(!getCategory(categoryId)||categoryId==='all')throw new Error('INVALID_CATEGORY');
  const protocol=template?.protocol||input.protocol;
  if(!CONNECTIVITY.includes(protocol))throw new Error('INVALID_PROTOCOL');
  const name=String(input.name||'').trim().slice(0,80);
  if(!name||/[\x00-\x1f]/.test(name))throw new Error('INVALID_DEVICE_NAME');
  const id=randomUUID(),ts=now();
  this.db.prepare(`INSERT INTO devices (id,template_id,category_id,name,protocol,driver_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`)
   .run(id,template?.id||null,categoryId,name,protocol,template?.ready?template.driver:null,ts,ts);
  return this.db.prepare(`SELECT id,template_id AS templateId,category_id AS categoryId,name,protocol,driver_id AS driverId,created_at AS createdAt,updated_at AS updatedAt FROM devices WHERE id=?`).get(id);
 }
 renameDevice(id,name){
  const label=typeof name==='string'?name.trim():'';
  if(!label||label.length>80||/[\x00-\x1f]/.test(label))throw new Error('INVALID_DEVICE_NAME');
  const result=this.db.prepare('UPDATE devices SET name=?,updated_at=? WHERE id=?').run(label,now(),id);
  if(!result.changes)throw new Error('DEVICE_NOT_FOUND');
  return this.db.prepare(`SELECT id,template_id AS templateId,category_id AS categoryId,name,protocol,driver_id AS driverId,created_at AS createdAt,updated_at AS updatedAt FROM devices WHERE id=?`).get(id);
 }
 removeDevice(id){const result=this.db.prepare('DELETE FROM devices WHERE id=?').run(id);if(!result.changes)throw new Error('DEVICE_NOT_FOUND');return {removed:true,id};}
 close(){this.db.close();}
}
