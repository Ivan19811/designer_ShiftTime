import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {pool,assertDatabaseWritable} from './db.mjs';
import {config} from './config.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
export const MIGRATIONS_DIR_01080=path.resolve(here,'../sql');
const LOCK_A=1080,LOCK_B=10080;
const JOURNAL_SQL=`CREATE TABLE IF NOT EXISTS shifttime_schema_migrations(
  filename text PRIMARY KEY,
  checksum_sha256 text NOT NULL,
  applied_stage text NOT NULL DEFAULT '01094',
  execution_ms integer NOT NULL DEFAULT 0,
  applied_at timestamptz NOT NULL DEFAULT now()
)`;
function sha(v){return crypto.createHash('sha256').update(v).digest('hex');}
export async function loadMigrationFiles01080(){const names=(await fs.readdir(MIGRATIONS_DIR_01080)).filter(x=>/^\d{3}_.+\.sql$/.test(x)).sort();const out=[];for(const filename of names){const sql=await fs.readFile(path.join(MIGRATIONS_DIR_01080,filename),'utf8');out.push({filename,sql,checksum:sha(sql)});}return out;}
export async function ensureMigrationJournal01080(client=pool){await client.query(JOURNAL_SQL);}
export async function getMigrationStatus01080(client=pool){await ensureMigrationJournal01080(client);const files=await loadMigrationFiles01080();const q=await client.query('SELECT filename,checksum_sha256,applied_stage,execution_ms,applied_at FROM shifttime_schema_migrations ORDER BY filename');const applied=new Map(q.rows.map(r=>[r.filename,r]));return files.map(f=>{const r=applied.get(f.filename);return {filename:f.filename,checksum:f.checksum,applied:Boolean(r),checksumMatch:r?String(r.checksum_sha256)===f.checksum:null,appliedAt:r?.applied_at||null,executionMs:Number(r?.execution_ms||0),recordedChecksum:r?.checksum_sha256||''};});}
async function acquire(client){const started=Date.now();while(Date.now()-started<config.migrationLockTimeoutMs){const q=await client.query('SELECT pg_try_advisory_lock($1,$2) ok',[LOCK_A,LOCK_B]);if(q.rows[0]?.ok)return;await new Promise(r=>setTimeout(r,300));}const e=new Error(`Migration advisory lock timeout after ${config.migrationLockTimeoutMs} ms`);e.code='ST_MIGRATION_LOCK_TIMEOUT';throw e;}
async function release(client){try{await client.query('SELECT pg_advisory_unlock($1,$2)',[LOCK_A,LOCK_B]);}catch{}}
export async function applyMigrations01080({dryRun=false,logger=console}={}){
  const client=await pool.connect();try{
    await acquire(client);await assertDatabaseWritable(client);await ensureMigrationJournal01080(client);
    const files=await loadMigrationFiles01080();const rows=await client.query('SELECT filename,checksum_sha256 FROM shifttime_schema_migrations');const applied=new Map(rows.rows.map(r=>[r.filename,r.checksum_sha256]));const plan=[];
    for(const f of files){const old=applied.get(f.filename);if(old&&old!==f.checksum){const e=new Error(`Migration checksum drift: ${f.filename}`);e.code='ST_MIGRATION_CHECKSUM_DRIFT';e.expected=old;e.actual=f.checksum;throw e;}plan.push({...f,action:old?'skip':'apply'});}
    if(dryRun)return plan.map(x=>({filename:x.filename,action:x.action,checksum:x.checksum}));
    for(const m of plan){if(m.action==='skip'){logger.log?.(`[01094] skip ${m.filename}`);continue;}const started=Date.now();logger.log?.(`[01094] migrate ${m.filename}`);await client.query(m.sql);const ms=Date.now()-started;await client.query('INSERT INTO shifttime_schema_migrations(filename,checksum_sha256,applied_stage,execution_ms) VALUES($1,$2,$3,$4)',[m.filename,m.checksum,'01094',ms]);}
    try{await client.query(`UPDATE platform_deployment_state SET schema_stage='01094',last_migration_at=now(),updated_at=now() WHERE id='primary'`);}catch{}
    return getMigrationStatus01080(client);
  }finally{await release(client);client.release();}
}
