import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {config} from '../src/config.mjs';
function run(cmd,args,opts={}){return new Promise((resolve,reject)=>{const p=spawn(cmd,args,{stdio:'inherit',...opts});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(new Error(`${cmd} exited with code ${code}`)));});}
if(!config.databaseUrl)throw new Error('DATABASE_URL is required for backup.');
const root=process.env.BACKUP_DIR?path.resolve(process.env.BACKUP_DIR):path.join(os.tmpdir(),'shifttime-postgres-backups');await fs.mkdir(root,{recursive:true});const stamp=new Date().toISOString().replace(/[:.]/g,'-');const file=path.join(root,`shifttime-01080-${stamp}.dump`);
try{await run('pg_dump',['--format=custom','--no-owner','--no-privileges',`--file=${file}`,config.databaseUrl],{env:process.env});await run('pg_restore',['--list',file],{env:process.env});console.log(`[01080] backup verified: ${file}`);}catch(e){if(e.code==='ENOENT')throw new Error('PostgreSQL client tools pg_dump/pg_restore are not installed on this machine.');throw e;}
