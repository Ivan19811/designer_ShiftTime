#!/usr/bin/env node
/**
 * 01607 LIVE READ-ONLY access probe. Explicit --run is required.
 * No mutation endpoints, no credentials in files, no token/body logging.
 * Requires independently owned test Accounts/Stores/Sites; never run on customer data.
 */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const env=process.env;
const tokenFields={ownerA:'ST01607_OWNER_A_TOKEN',ownerB:'ST01607_OWNER_B_TOKEN',workerA:'ST01607_WORKER_A_TOKEN',workerB:'ST01607_WORKER_B_TOKEN'};
const expectedEnv=['ST01607_API_BASE','ST01607_STORE_A','ST01607_STORE_B','ST01607_SITE_A','ST01607_SITE_B',...Object.values(tokenFields)];
const help=`ShiftTime 01607 / read-only live access probe\n\nUsage:\n  node backend/scripts/verify-access-live-01607.mjs --plan\n  node backend/scripts/verify-access-live-01607.mjs --run --phase=before\n  node backend/scripts/verify-access-live-01607.mjs --run --phase=after\n\nRequired environment variable names (never put values in chat or git):\n  ${expectedEnv.join('\n  ')}\n\nbefore: worker A has site.pages.view on Site A; worker B can view Site B.\nafter: revoke worker A's SITE-A grant in the Center of Access, retain its session\n       and run with the same token. Worker B must remain unaffected.\n\nNo POST/PUT/PATCH/DELETE is sent. Failing checks cause exit code 1.\n`;
const cli=process.argv.slice(2);
const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
const idPattern=/^[\w:-]{1,160}$/;
export function validateConfig01607(conf){
 const missing=expectedEnv.filter(k=>!String(conf[k]||'').trim());
 if(missing.length)throw new Error('Missing environment variables: '+missing.join(', '));
 const base=new URL(conf.ST01607_API_BASE);
 const local=['localhost','127.0.0.1','::1','[::1]'].includes(base.hostname);
 if(!(base.protocol==='https:'||(local&&base.protocol==='http:'))||base.username||base.password||base.search||base.hash||!['','/','/api/v1','/api/v1/'].includes(base.pathname))
   throw new Error('ST01607_API_BASE must be an HTTPS origin (or localhost HTTP), optionally ending in /api/v1');
 for(const k of ['ST01607_STORE_A','ST01607_STORE_B','ST01607_SITE_A','ST01607_SITE_B'])if(!idPattern.test(conf[k]))throw new Error('Invalid identifier: '+k);
 if(conf.ST01607_STORE_A===conf.ST01607_STORE_B||conf.ST01607_SITE_A===conf.ST01607_SITE_B)throw new Error('Use distinct test Store IDs and Site IDs');
 const tokens=Object.values(tokenFields).map(k=>conf[k]);
 if(tokens.some((x,i)=>tokens.indexOf(x)!==i))throw new Error('Each role requires its own real authenticated session');
 return {apiRoot:base.origin+'/api/v1',tokens:{ownerA:conf.ST01607_OWNER_A_TOKEN,ownerB:conf.ST01607_OWNER_B_TOKEN,workerA:conf.ST01607_WORKER_A_TOKEN,workerB:conf.ST01607_WORKER_B_TOKEN},storeA:conf.ST01607_STORE_A,storeB:conf.ST01607_STORE_B,siteA:conf.ST01607_SITE_A,siteB:conf.ST01607_SITE_B};
}
export function makeReadOnlyMatrix01607(config,phase='before'){
 if(!['before','after'].includes(phase))throw new Error('phase must be before or after');
 const c=config,revoked=phase==='after';
 return [
  {name:'owner A reads own site A',actor:'ownerA',store:c.storeA,site:c.siteA,expected:200},
  {name:'owner B reads own site B',actor:'ownerB',store:c.storeB,site:c.siteB,expected:200},
  {name:'owner A cannot read site B in store A',actor:'ownerA',store:c.storeA,site:c.siteB,expected:403},
  {name:'owner B cannot read site A in store B',actor:'ownerB',store:c.storeB,site:c.siteA,expected:403},
  {name:'worker A own site A'+(revoked?' after revoke':''),actor:'workerA',store:c.storeA,site:c.siteA,expected:revoked?403:200},
  {name:'worker B own site B remains accessible',actor:'workerB',store:c.storeB,site:c.siteB,expected:200},
  {name:'worker A cannot read site B',actor:'workerA',store:c.storeA,site:c.siteB,expected:403},
  {name:'worker B cannot read site A',actor:'workerB',store:c.storeB,site:c.siteA,expected:403},
  {name:'worker A cannot select store B',actor:'workerA',store:c.storeB,site:c.siteB,expected:403},
  {name:'worker B cannot select store A',actor:'workerB',store:c.storeA,site:c.siteA,expected:403},
 ];
}
export async function runReadOnlyMatrix01607(config,{phase='before',fetchImpl=fetch}={}){
 const cases=makeReadOnlyMatrix01607(config,phase),results=[];
 for(const item of cases){
  const url=config.apiRoot+'/sites/'+encodeURIComponent(item.site);
  let status=0,errorKind='';
  try{
   const response=await fetchImpl(url,{method:'GET',headers:{authorization:'Bearer '+config.tokens[item.actor],'x-st-store-id':item.store,accept:'application/json','cache-control':'no-store'},redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(12000)});
   status=response.status;
   if(response.body)await response.body.cancel(); // no PII in logs or processing
  }catch(error){errorKind=error?.name==='TimeoutError'?'timeout':'network_error';}
  results.push({name:item.name,expected:item.expected,actual:status||errorKind,pass:status===item.expected});
 }
 return {stage:'01607',mode:'LIVE_READ_ONLY',phase,passed:results.filter(r=>r.pass).length,total:results.length,results};
}
async function main(){
 if(cli.length===0||cli.includes('--help')||cli.includes('-h')){process.stdout.write(help);return;}
 if(cli.includes('--plan')){process.stdout.write(help+'\nDRY PLAN ONLY: no HTTP requests were sent.\n');return;}
 const phaseArg=cli.find(x=>x.startsWith('--phase='));
 if(!cli.includes('--run')||!phaseArg||cli.some(x=>!['--run',phaseArg].includes(x)))throw new Error('Use --run --phase=before or --run --phase=after');
 const phase=phaseArg.split('=')[1];
 const cfg=validateConfig01607(env);
 const report=await runReadOnlyMatrix01607(cfg,{phase});
 // Print ONLY case labels and HTTP statuses; never tokens, URLs, IDs, cookies or response payloads.
 for(const row of report.results)process.stdout.write(`${row.pass?'PASS':'FAIL'}  ${row.name}: HTTP ${row.actual} (expected ${row.expected})\n`);
 process.stdout.write(`01607 live read-only checks: ${report.passed}/${report.total}. Live writes and PostgreSQL transactions NOT verified.\n`);
 if(report.passed!==report.total)process.exitCode=1;
}
if(isMain)main().catch(error=>{process.stderr.write('01607: '+String(error?.message||'validation failed')+'\n');process.exitCode=1;});
