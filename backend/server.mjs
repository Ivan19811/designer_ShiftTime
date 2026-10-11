// Isolated localhost-only IoT backend. Never imports/routes through the parent backend.
import {createServer} from 'node:http';import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';import {resolve,dirname,sep,extname} from 'node:path';
import {IotDb} from './store.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const mimetypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const j=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
function readJson(req){return new Promise((done,fail)=>{let raw='',bytes=0;req.on('data',b=>{bytes+=b.length;if(bytes>128000){req.destroy();fail(new Error('PAYLOAD_TOO_LARGE'));return;}raw+=b;});req.on('end',()=>{try{done(JSON.parse(raw));}catch{fail(new Error('INVALID_JSON'));}});req.on('error',fail);});}
export function createIotServer({dbFile=resolve(root,'backend/data/iot-studio.sqlite')}={}){
 const store=new IotDb(dbFile);
 const server=createServer(async(req,res)=>{
  const host=req.headers.host||'';const origin=req.headers.origin;
  // Host validation mitigates DNS rebinding. Do not expose remote BLE read endpoints.
  if(!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host))return j(res,403,{error:'LOCAL_HOST_ONLY'});
  if(origin&&origin!==`http://${host}`)return j(res,403,{error:'ORIGIN_DENIED'});
  const url=new URL(req.url,`http://${host}`);
  try{
   if(url.pathname.startsWith('/api/')){
    if(req.method==='GET'&&url.pathname==='/api/health')return j(res,200,{ok:true,module:'iot-studio',db:'sqlite',isolated:true});
    if(req.method==='GET'&&url.pathname==='/api/layout')return j(res,200,{layout:store.getLayout()});
    if(req.method==='GET'&&url.pathname==='/api/history')return j(res,200,{history:store.getHistory(Number(url.searchParams.get('limit'))||160)});
    if(req.method!=='PUT'&&req.method!=='POST')return j(res,405,{error:'METHOD_NOT_ALLOWED'});
    if(req.headers['x-iot-studio']!=='01443'||!String(req.headers['content-type']||'').startsWith('application/json'))return j(res,403,{error:'WRITE_GUARD'});
    const body=await readJson(req);
    if(req.method==='PUT'&&url.pathname==='/api/layout')return j(res,200,{layout:store.saveLayout(body)});
    if(req.method==='POST'&&url.pathname==='/api/reading')return j(res,201,store.appendReading(body));
    return j(res,404,{error:'NOT_FOUND'});
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return j(res,405,{error:'METHOD_NOT_ALLOWED'});
   const decoded=decodeURIComponent(url.pathname);
   const target=resolve(root,`.`+((decoded==='/')?'/index.html':decoded));
   if(!target.startsWith(root+sep))return j(res,403,{error:'INVALID_PATH'});
   const s=await stat(target);if(!s.isFile())return j(res,404,{error:'NOT_FOUND'});
   const ext=extname(target);if(!(ext in mimetypes))return j(res,415,{error:'UNSUPPORTED_FILE'});
   res.writeHead(200,{'Content-Type':mimetypes[ext],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});
   if(req.method==='HEAD')return res.end();res.end(await readFile(target));
  }catch(e){const errors={INVALID_LAYOUT:400,INVALID_WIDGETS:400,INVALID_READING:400,INVALID_READING_SOURCE:400,INVALID_CELLS:400,INVALID_JSON:400,INVALID_PATH:400};
   if(e.code==='ENOENT')return j(res,404,{error:'NOT_FOUND'});
   j(res,errors[e.message]||500,{error:errors[e.message]?e.message:'SERVER_ERROR'});}
 });
 return {server,store,listen:(port=5566)=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.off('error',reject);resolve(server.address());});}),close:()=>new Promise(r=>server.close(()=>{store.close();r();}))};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.IOT_PORT||5566);
 const app=createIotServer({dbFile:process.env.IOT_DB_FILE||resolve(root,'backend/data/iot-studio.sqlite')});
 app.listen(port).then(()=>process.stdout.write(`ShiftTime IoT Studio: http://localhost:${port}/\n`)).catch(e=>{console.error(e);process.exitCode=1;});
}
