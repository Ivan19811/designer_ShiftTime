import {pool} from '../src/db.mjs';
import {applyMigrations01080,getMigrationStatus01080} from '../src/migration-service.mjs';
const args=new Set(process.argv.slice(2));
try{
  if(args.has('--status')){
    const rows=await getMigrationStatus01080();for(const r of rows)console.log(`${r.applied?(r.checksumMatch?'APPLIED':'DRIFT'):'PENDING'}  ${r.filename}  ${r.checksum.slice(0,12)}`);
    if(rows.some(r=>r.applied&&!r.checksumMatch))process.exitCode=2;
  }else{
    const dryRun=args.has('--dry-run');const rows=await applyMigrations01080({dryRun});
    if(dryRun)for(const r of rows)console.log(`${r.action.toUpperCase().padEnd(5)} ${r.filename} ${r.checksum.slice(0,12)}`);
    else{const applied=rows.filter(r=>r.applied&&r.checksumMatch).length;console.log(`[01080] migrations complete · ${applied}/${rows.length} applied`);}
  }
}finally{await pool.end();}
