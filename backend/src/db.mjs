import pg from 'pg';
import {config} from './config.mjs';
const {Pool}=pg;

function resolveSsl(){
  if(config.databaseSslMode==='true'||config.databaseSslMode==='require')return {rejectUnauthorized:false};
  if(config.databaseSslMode==='false'||config.databaseSslMode==='disable')return false;
  return undefined;
}
if(!config.databaseUrl){
  const message='[01092] DATABASE_URL is not configured';
  if(config.isProduction)throw new Error(`${message}; production backend refuses to start without PostgreSQL`);
  console.warn(message);
}
const poolOptions={
  connectionString:config.databaseUrl||undefined,
  max:config.databasePoolMax,
  idleTimeoutMillis:config.databaseIdleTimeoutMs,
  connectionTimeoutMillis:config.databaseConnectTimeoutMs,
  statement_timeout:config.databaseStatementTimeoutMs,
  application_name:config.databaseApplicationName
};
const ssl=resolveSsl();if(ssl!==undefined)poolOptions.ssl=ssl;
export const pool=new Pool(poolOptions);

pool.on('error',err=>console.error('[01092] PostgreSQL pool idle client error',err));

export async function withClient(fn){const client=await pool.connect();try{return await fn(client);}finally{client.release();}}
export async function withTransaction(fn){return withClient(async client=>{await client.query('BEGIN');try{const value=await fn(client);await client.query('COMMIT');return value;}catch(e){try{await client.query('ROLLBACK');}catch{}throw e;}});}
export async function getDatabaseDiagnostics(client=pool){
  const q=await client.query(`SELECT current_database() database_name,current_user database_user,current_setting('server_version') server_version,current_setting('TimeZone') timezone,current_setting('transaction_read_only') transaction_read_only,pg_is_in_recovery() in_recovery,inet_server_addr()::text server_address,inet_server_port() server_port`);
  let ssl={ssl:false,version:'',cipher:''};
  try{const s=await client.query(`SELECT ssl,COALESCE(version,'') version,COALESCE(cipher,'') cipher FROM pg_stat_ssl WHERE pid=pg_backend_pid()`);if(s.rowCount)ssl=s.rows[0];}catch{}
  return {...q.rows[0],ssl:Boolean(ssl.ssl),sslVersion:ssl.version||'',sslCipher:ssl.cipher||'',poolMax:config.databasePoolMax,applicationName:config.databaseApplicationName};
}
export async function assertDatabaseWritable(client=pool){const q=await client.query(`SELECT current_setting('transaction_read_only') v,pg_is_in_recovery() recovery`);if(q.rows[0]?.v==='on'||q.rows[0]?.recovery){const e=new Error('PostgreSQL connection is read-only / recovery replica; writes are not allowed');e.code='ST_DB_READ_ONLY';throw e;}return true;}
