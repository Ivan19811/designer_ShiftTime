import {pool,getDatabaseDiagnostics,assertDatabaseWritable} from '../src/db.mjs';
import {config} from '../src/config.mjs';
import {applyMigrations01080} from '../src/migration-service.mjs';
const errors=[],warnings=[];
function issue(arr,msg){arr.push(msg);}
try{
  if(!config.databaseUrl)issue(errors,'DATABASE_URL is required.');
  const db=await getDatabaseDiagnostics();
  await assertDatabaseWritable();
  const major=Number(String(db.server_version||'').split('.')[0]||0);if(major&&major<14)issue(warnings,`PostgreSQL ${db.server_version}: 14+ is recommended for this production baseline.`);
  if(config.isProduction){
    if(config.corsOrigin==='*')issue(errors,'Production CORS_ORIGIN must be explicit; wildcard is not allowed by 01081 preflight.');
    if(config.devSessionToken==='change-me-dev-token')issue(errors,'Default DEV_SESSION_TOKEN must not be used in production.');
    const sims=[['DEV_PAYMENT_SIMULATION',config.devPaymentSimulation],['DEV_INVENTORY_SIMULATION',config.devInventorySimulation],['DEV_SHIPPING_SIMULATION',config.devShippingSimulation]].filter(x=>x[1]).map(x=>x[0]);
    const mediaProvider=config.mediaStorageProvider;if(mediaProvider==='disabled')issue(config.productionGuardStrict?errors:warnings,'MEDIA_STORAGE_PROVIDER is disabled; production computer uploads will be blocked.');else{const required=[['MEDIA_S3_BUCKET',config.mediaS3Bucket],['MEDIA_S3_ACCESS_KEY_ID',config.mediaS3AccessKeyId],['MEDIA_S3_SECRET_ACCESS_KEY',config.mediaS3SecretAccessKey]];if(mediaProvider!=='s3')required.unshift(['MEDIA_S3_ENDPOINT',config.mediaS3Endpoint]);const missing=required.filter(x=>!x[1]).map(x=>x[0]);if(mediaProvider==='s3'&&config.mediaS3Region==='auto')missing.push('MEDIA_S3_REGION(non-auto for AWS S3)');if(missing.length)issue(errors,`Cloud media storage is incomplete: ${missing.join(', ')}.`);if(config.mediaPublicBaseUrl&&!/^https:\/\//i.test(config.mediaPublicBaseUrl))issue(errors,'MEDIA_PUBLIC_BASE_URL must use https:// in production.');}
    if(sims.length)issue(config.productionGuardStrict?errors:warnings,`Production simulation flags enabled: ${sims.join(', ')}.`);
  }
  if(!db.ssl&&config.databaseSslMode==='require')issue(errors,'DATABASE_SSL=require but active PostgreSQL session is not using SSL.');
  const plan=await applyMigrations01080({dryRun:true,logger:{log(){}}});const pending=plan.filter(x=>x.action==='apply').map(x=>x.filename);
  console.log(JSON.stringify({ok:errors.length===0,stage:'01081',environment:config.nodeEnv,database:db,migrations:{total:plan.length,pending},warnings,errors},null,2));
  if(errors.length)process.exitCode=1;
}catch(e){console.error(JSON.stringify({ok:false,stage:'01081',error:e.message,code:e.code||''},null,2));process.exitCode=1;}finally{await pool.end();}
