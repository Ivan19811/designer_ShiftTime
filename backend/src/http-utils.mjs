export function sendJson(res,status,payload,extraHeaders={}){const body=payload==null?'':JSON.stringify(payload);res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),...extraHeaders});res.end(body);}
export function sendNoContent(res,status=204,extraHeaders={}){res.writeHead(status,extraHeaders);res.end();}
export async function readJson(req,{limit=8*1024*1024}={}){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>limit){const e=new Error('Request body too large');e.statusCode=413;throw e;}chunks.push(chunk);}if(!chunks.length)return {};const raw=Buffer.concat(chunks).toString('utf8');try{return JSON.parse(raw);}catch{const e=new Error('Invalid JSON body');e.statusCode=400;throw e;}}
export function applyCors(req,res,corsOrigin='*'){
  const origin=req.headers.origin||'';let allow='*';if(corsOrigin!=='*'){const allowed=String(corsOrigin).split(',').map(x=>x.trim()).filter(Boolean);allow=allowed.includes(origin)?origin:allowed[0]||'';}
  if(allow)res.setHeader('access-control-allow-origin',allow);
  res.setHeader('vary','Origin');res.setHeader('access-control-allow-methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');res.setHeader('access-control-allow-headers','authorization,content-type,x-st-store-id,x-st-workspace-id,x-st-request-id,x-st-cart-id,x-st-import-source');res.setHeader('access-control-expose-headers','x-st-store-id,x-st-workspace-id,x-st-account-id,x-st-request-id,x-st-cart-id');
}
export function requestId(req){return String(req.headers['x-st-request-id']||`req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`);}
