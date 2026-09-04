export function sendJson(res,status,payload,extraHeaders={}){const body=payload==null?'':JSON.stringify(payload);res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),...extraHeaders});res.end(body);}
export function sendNoContent(res,status=204,extraHeaders={}){res.writeHead(status,extraHeaders);res.end();}
export async function readBuffer(req,{limit=64*1024*1024}={}){let size=0;const chunks=[];for await(const chunk of req){const buf=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);size+=buf.length;if(size>limit){const e=new Error('Request body too large');e.statusCode=413;throw e;}chunks.push(buf);}return Buffer.concat(chunks,size);}
export async function readJson(req,{limit=8*1024*1024}={}){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>limit){const e=new Error('Request body too large');e.statusCode=413;throw e;}chunks.push(chunk);}if(!chunks.length)return {};const raw=Buffer.concat(chunks).toString('utf8');try{return JSON.parse(raw);}catch{const e=new Error('Invalid JSON body');e.statusCode=400;throw e;}}
function localDevOrigin(origin){try{const u=new URL(String(origin||''));return (u.protocol==='http:'||u.protocol==='https:')&&(u.hostname==='127.0.0.1'||u.hostname==='localhost');}catch{return false;}}
export function resolveCorsOrigin01089({requestOrigin='',corsOrigin='*',nodeEnv=process.env.NODE_ENV||'development',allowLocalDev=String(nodeEnv).toLowerCase()!=='production'}={}){
  const origin=String(requestOrigin||'').trim(),configured=String(corsOrigin||'*').trim();if(configured==='*')return '*';
  const allowed=configured.split(',').map(x=>x.trim()).filter(Boolean);if(allowed.includes(origin))return origin;
  if(Boolean(allowLocalDev)&&localDevOrigin(origin))return origin;
  return '';
}
export function applyCors(req,res,corsOrigin='*',{nodeEnv=process.env.NODE_ENV||'development',allowLocalDev=String(nodeEnv).toLowerCase()!=='production'}={}){
  const allow=resolveCorsOrigin01089({requestOrigin:req.headers.origin||'',corsOrigin,nodeEnv,allowLocalDev});
  if(allow)res.setHeader('access-control-allow-origin',allow);
  res.setHeader('vary','Origin');res.setHeader('access-control-allow-methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');res.setHeader('access-control-allow-headers','authorization,content-type,x-st-store-id,x-st-workspace-id,x-st-request-id,x-st-cart-id,x-st-import-source');res.setHeader('access-control-expose-headers','x-st-store-id,x-st-workspace-id,x-st-account-id,x-st-request-id,x-st-cart-id');
}
export function requestId(req){return String(req.headers['x-st-request-id']||`req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`);}
