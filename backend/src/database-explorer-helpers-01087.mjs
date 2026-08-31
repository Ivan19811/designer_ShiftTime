const REDACTED_COLUMNS_01087=new Set(['secret_hash','token_hash','snapshot','payload','raw_payload','password','password_hash','access_token','refresh_token']);
const METADATA_ONLY_TABLES_01087=new Set(['platform_user_credentials']);
const GLOBAL_SAFE_TABLES_01087=new Set(['shifttime_schema_migrations']);

export function normalizeDatabaseTableName01087(value){
  const name=String(value??'').trim();
  if(!/^[a-z_][a-z0-9_]*$/.test(name))throw Object.assign(new Error('Invalid database table name'),{statusCode:400,code:'ST_DB_TABLE_NAME'});
  return name;
}
export function quoteDatabaseIdentifier01087(value){const name=normalizeDatabaseTableName01087(value);return `"${name}"`;}
export function redactDatabaseColumns01087(table,columns=[]){
  const name=normalizeDatabaseTableName01087(table);
  if(METADATA_ONLY_TABLES_01087.has(name))return [];
  return (Array.isArray(columns)?columns:[]).map(String).filter(c=>/^[a-z_][a-z0-9_]*$/.test(c)&&!REDACTED_COLUMNS_01087.has(c));
}
export function resolveRowScopeStrategy01087(table,columns=[]){
  const name=normalizeDatabaseTableName01087(table),cols=new Set((Array.isArray(columns)?columns:[]).map(String));
  if(METADATA_ONLY_TABLES_01087.has(name))return {mode:'metadata-only',column:''};
  if(GLOBAL_SAFE_TABLES_01087.has(name))return {mode:'global-safe',column:''};
  if(name==='platform_users'||name==='api_sessions')return {mode:'member-users',column:''};
  if(name==='platform_accounts')return {mode:'account-id',column:'id'};
  if(name==='platform_stores')return {mode:'store-join',column:'workspace_id'};
  if(cols.has('account_id'))return {mode:'account',column:'account_id'};
  if(cols.has('store_id'))return {mode:'store',column:'store_id'};
  if(cols.has('workspace_id'))return {mode:'workspace',column:'workspace_id'};
  return {mode:'metadata-only',column:''};
}
export function isSensitiveDatabaseTable01087(table){return METADATA_ONLY_TABLES_01087.has(normalizeDatabaseTableName01087(table));}
