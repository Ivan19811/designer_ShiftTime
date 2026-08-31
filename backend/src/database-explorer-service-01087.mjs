import {withClient,getDatabaseDiagnostics} from './db.mjs';
import {assertCapability01087} from './admin-access-01087.mjs';
import {
  normalizeDatabaseTableName01087,
  quoteDatabaseIdentifier01087,
  redactDatabaseColumns01087,
  resolveRowScopeStrategy01087,
  isSensitiveDatabaseTable01087,
} from './database-explorer-helpers-01087.mjs';

const fail=(message,statusCode=400,code='ST_DB_EXPLORER')=>Object.assign(new Error(message),{statusCode,code});
const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):fallback;};

async function tableExists(client,table){const q=await client.query(`SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1 LIMIT 1`,[table]);return q.rowCount>0;}
async function tableColumns(client,table){const q=await client.query(`SELECT column_name,data_type,udt_name,is_nullable,column_default,ordinal_position FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,[table]);return q.rows;}

export async function getDatabaseOverview01087(scope){
  assertCapability01087(scope,'admin.database.schema','Database schema permission required');
  return withClient(async client=>{
    const [diag,sizeQ,tablesQ,migrationsQ]=await Promise.all([
      getDatabaseDiagnostics(client),
      client.query(`SELECT pg_database_size(current_database())::bigint bytes`),
      client.query(`SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`),
      client.query(`SELECT count(*)::int n,max(applied_at) last_applied_at FROM shifttime_schema_migrations`),
    ]);
    return {stage:'01087',database:{name:diag.database_name,serverVersion:diag.server_version,timezone:diag.timezone,ssl:diag.ssl,sslVersion:diag.sslVersion||'',sizeBytes:Number(sizeQ.rows[0]?.bytes||0),tableCount:tablesQ.rows[0]?.n||0,migrationCount:migrationsQ.rows[0]?.n||0,lastMigrationAt:migrationsQ.rows[0]?.last_applied_at||null,readOnly:String(diag.transaction_read_only||'off')==='on'},scope:{accountId:scope.accountId,workspaceId:scope.workspaceId,storeId:scope.storeId}};
  });
}

export async function listDatabaseTables01087(scope){
  assertCapability01087(scope,'admin.database.schema','Database schema permission required');
  return withClient(async client=>{
    const q=await client.query(`SELECT t.table_name,COALESCE(c.column_count,0)::int column_count,COALESCE(pc.reltuples,0)::bigint estimated_rows
      FROM information_schema.tables t
      LEFT JOIN (SELECT table_name,count(*) column_count FROM information_schema.columns WHERE table_schema='public' GROUP BY table_name) c ON c.table_name=t.table_name
      LEFT JOIN pg_class pc ON pc.relname=t.table_name AND pc.relkind='r'
      WHERE t.table_schema='public' AND t.table_type='BASE TABLE' ORDER BY t.table_name`);
    const out=[];for(const r of q.rows){const cols=(await tableColumns(client,r.table_name)).map(x=>x.column_name);const strategy=resolveRowScopeStrategy01087(r.table_name,cols);out.push({name:r.table_name,columnCount:r.column_count,estimatedRows:Number(r.estimated_rows||0),rowMode:strategy.mode,sensitive:isSensitiveDatabaseTable01087(r.table_name)});}return out;
  });
}

export async function getDatabaseTableSchema01087(scope,tableName){
  assertCapability01087(scope,'admin.database.schema','Database schema permission required');const table=normalizeDatabaseTableName01087(tableName);
  return withClient(async client=>{
    if(!(await tableExists(client,table)))throw fail('Database table not found',404,'ST_DB_TABLE_NOT_FOUND');
    const [columnsQ,pkQ,fkQ,indexQ]=await Promise.all([
      client.query(`SELECT column_name "name",data_type "dataType",udt_name "udtName",is_nullable='YES' "nullable",column_default "defaultValue",ordinal_position "position" FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,[table]),
      client.query(`SELECT kcu.column_name "column" FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON kcu.constraint_name=tc.constraint_name AND kcu.table_schema=tc.table_schema WHERE tc.table_schema='public' AND tc.table_name=$1 AND tc.constraint_type='PRIMARY KEY' ORDER BY kcu.ordinal_position`,[table]),
      client.query(`SELECT kcu.column_name "column",ccu.table_name "referencesTable",ccu.column_name "referencesColumn",tc.constraint_name "constraint" FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON kcu.constraint_name=tc.constraint_name AND kcu.table_schema=tc.table_schema JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.table_schema=tc.table_schema WHERE tc.table_schema='public' AND tc.table_name=$1 AND tc.constraint_type='FOREIGN KEY' ORDER BY kcu.ordinal_position`,[table]),
      client.query(`SELECT indexname "name",indexdef "definition" FROM pg_indexes WHERE schemaname='public' AND tablename=$1 ORDER BY indexname`,[table]),
    ]);
    const rawColumns=columnsQ.rows.map(r=>r.name),strategy=resolveRowScopeStrategy01087(table,rawColumns);
    return {stage:'01087',table,columns:columnsQ.rows.map(c=>({...c,redacted:!redactDatabaseColumns01087(table,[c.name]).includes(c.name)})),primaryKey:pkQ.rows.map(r=>r.column),foreignKeys:fkQ.rows,indexes:indexQ.rows,rowMode:strategy.mode,sensitive:isSensitiveDatabaseTable01087(table)};
  });
}

export async function getDatabaseTableRows01087(scope,tableName,{limit=50,offset=0}={}){
  assertCapability01087(scope,'admin.database.rows','Database row permission required');const table=normalizeDatabaseTableName01087(tableName),safeLimit=clamp(limit,1,100,50),safeOffset=clamp(offset,0,1000000,0);
  return withClient(async client=>{
    if(!(await tableExists(client,table)))throw fail('Database table not found',404,'ST_DB_TABLE_NOT_FOUND');
    const columns=await tableColumns(client,table),names=columns.map(c=>c.column_name),visible=redactDatabaseColumns01087(table,names),strategy=resolveRowScopeStrategy01087(table,names);
    if(strategy.mode==='metadata-only'||!visible.length)return {stage:'01087',table,columns:visible,rows:[],limit:safeLimit,offset:safeOffset,rowMode:strategy.mode,browsable:false};
    const select=visible.map(quoteDatabaseIdentifier01087).join(',');const quoted=quoteDatabaseIdentifier01087(table);let sql='',params=[];
    if(strategy.mode==='global-safe'){sql=`SELECT ${select} FROM ${quoted} ORDER BY 1 LIMIT $1 OFFSET $2`;params=[safeLimit,safeOffset];}
    else if(strategy.mode==='member-users'){
      if(table==='platform_users'){sql=`SELECT ${visible.map(c=>`u.${quoteDatabaseIdentifier01087(c)}`).join(',')} FROM platform_users u WHERE EXISTS (SELECT 1 FROM platform_memberships m WHERE m.user_id=u.id AND m.account_id=$1) ORDER BY u.created_at DESC LIMIT $2 OFFSET $3`;params=[scope.accountId,safeLimit,safeOffset];}
      else{sql=`SELECT ${visible.map(c=>`s.${quoteDatabaseIdentifier01087(c)}`).join(',')} FROM api_sessions s JOIN platform_users u ON u.id=s.user_id WHERE EXISTS (SELECT 1 FROM platform_memberships m WHERE m.user_id=u.id AND m.account_id=$1) ORDER BY s.created_at DESC LIMIT $2 OFFSET $3`;params=[scope.accountId,safeLimit,safeOffset];}
    }
    else if(strategy.mode==='account-id'){sql=`SELECT ${select} FROM ${quoted} WHERE id=$1 LIMIT $2 OFFSET $3`;params=[scope.accountId,safeLimit,safeOffset];}
    else if(strategy.mode==='store-join'){sql=`SELECT ${visible.map(c=>`s.${quoteDatabaseIdentifier01087(c)}`).join(',')} FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id WHERE w.account_id=$1 ORDER BY s.created_at DESC LIMIT $2 OFFSET $3`;params=[scope.accountId,safeLimit,safeOffset];}
    else{const value=strategy.mode==='account'?scope.accountId:strategy.mode==='workspace'?scope.workspaceId:scope.storeId;sql=`SELECT ${select} FROM ${quoted} WHERE ${quoteDatabaseIdentifier01087(strategy.column)}=$1 ORDER BY 1 LIMIT $2 OFFSET $3`;params=[value,safeLimit,safeOffset];}
    const q=await client.query(sql,params);return {stage:'01087',table,columns:visible,rows:q.rows,limit:safeLimit,offset:safeOffset,rowMode:strategy.mode,browsable:true};
  });
}

export async function listDatabaseMigrations01087(scope){
  assertCapability01087(scope,'admin.database.schema','Database schema permission required');return withClient(async client=>{const q=await client.query(`SELECT filename,checksum_sha256 "checksum",applied_stage "appliedStage",execution_ms "executionMs",applied_at "appliedAt" FROM shifttime_schema_migrations ORDER BY filename`);return q.rows;});
}
