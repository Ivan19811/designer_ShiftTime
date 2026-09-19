const clean=value=>String(value??'').trim();
const bytes=value=>{const n=Number(value);return Number.isFinite(n)&&n>0?Math.floor(n):0;};
const partsOf=pathname=>clean(pathname).split('?')[0].split('/').filter(Boolean).map(decodeURIComponent);
const upper=value=>clean(value||'GET').toUpperCase();

export function shouldRecordTrafficRequest01194(method,pathname){
  const p=partsOf(pathname);
  return !(p[0]==='api'&&p[1]==='v1'&&p[2]==='admin'&&p[3]==='traffic');
}

export function classifyTrafficRoute01194(method,pathname){
  const verb=upper(method),p=partsOf(pathname),api=p[0]==='api'&&p[1]==='v1';
  let module=api?(p[2]||'api'):(p[0]||'http'),operation=`${verb.toLowerCase()}.${module}`,routePath=clean(pathname).split('?')[0]||'/',siteId='';
  if(api&&p[2]==='sites'){
    module='sites';
    if(!p[3]){operation=verb==='GET'?'sites.list':verb==='POST'?'site.create':'sites.request';routePath='/api/v1/sites';}
    else if(p[4]==='publish'){siteId=p[3];operation='site.publish';routePath='/api/v1/sites/:siteId/publish';}
    else if(p[4]==='publish-status'){siteId=p[3];operation='site.publish-status';routePath='/api/v1/sites/:siteId/publish-status';}
    else{siteId=p[3];operation=verb==='GET'?'site.get':verb==='PUT'?'site.save':verb==='DELETE'?'site.delete':'site.request';routePath='/api/v1/sites/:siteId';}
  }else if(api&&p[2]==='auth'){
    module='auth';operation=`auth.${p[3]||'request'}`;routePath=`/api/v1/auth/${p[3]||':action'}`;
  }else if(api&&p[2]==='admin'){
    module='admin';operation=`admin.${p.slice(3,5).filter(Boolean).join('.')||'request'}`;routePath=`/api/v1/admin/${p.slice(3).map((x,i)=>i>0&&/^[a-z0-9_-]{10,}$/i.test(x)?':id':x).join('/')}`;
  }else if(api&&p[2]==='media'){
    module='media';operation=p[3]==='uploads'&&p[4]==='proxy'?'media.proxy-upload':`media.${p[3]||'request'}`;routePath=`/api/v1/media/${p.slice(3).map((x,i)=>i>0&&/^[a-z0-9_-]{10,}$/i.test(x)?':id':x).join('/')}`;
  }else if(api&&p[2]==='tables'){
    module='tables';operation=`tables.${p[4]||(!p[3]?'list':'table')}.${verb.toLowerCase()}`;routePath=p[3]?`/api/v1/tables/:tableId${p[4]?`/${p[4]}${p[5]?`/:resourceId`:''}`:''}`:'/api/v1/tables';
  }else if(api&&p[2]==='network'){
    module='network';operation=`network.${p[3]||'request'}.${verb.toLowerCase()}`;routePath=`/api/v1/network/${p[3]||':resource'}${p[4]?`/:id`:''}${p[5]?`/${p[5]}`:''}`;
  }else if(api&&p[2]==='marketplace'){
    module='marketplace';operation=`marketplace.${p[3]||'request'}.${verb.toLowerCase()}`;routePath=`/api/v1/marketplace/${p[3]||':resource'}${p[4]?`/:id`:''}`;
  }else if(api&&p[2]==='public'&&p[3]==='traffic'&&p[4]==='ping'){
    module='published-site';operation='published-site.page-open';routePath='/api/v1/public/traffic/ping';
  }else if(api&&p[2]==='public'){
    module='public';operation=`public.${p[3]||'request'}.${verb.toLowerCase()}`;routePath=`/api/v1/public/${p.slice(3,5).join('/')}`;
  }
  return Object.freeze({module,operation,routeKey:`${verb} ${routePath}`,siteId});
}

export function buildHttpTrafficEvent01194(input={}){
  const startedAtMs=Math.max(0,Number(input.startedAtMs)||0),finishedAtMs=Math.max(startedAtMs,Number(input.finishedAtMs)||startedAtMs),statusCode=Math.max(0,Number(input.statusCode)||0),requestId=clean(input.requestId)||`req_${startedAtMs}`;
  const route=classifyTrafficRoute01194(input.method,input.pathname),scope=input.scope||{};
  return Object.freeze({
    occurredAt:new Date(startedAtMs||Date.now()).toISOString(),
    requestId,dedupeKey:`${requestId}:http:${startedAtMs}`,
    accountId:clean(scope.accountId)||null,workspaceId:clean(scope.workspaceId)||null,storeId:clean(scope.storeId)||null,actorUserId:clean(scope.actorUserId||scope.userId)||null,siteId:route.siteId||clean(scope.siteId)||null,
    module:route.module,operation:route.operation,routeKey:route.routeKey,eventType:'http',integration:'browser',
    inboundBytes:bytes(input.inboundBytes),outboundBytes:bytes(input.outboundBytes),renderBillableOutboundBytes:bytes(input.outboundBytes),
    metadata:input.metadata&&typeof input.metadata==='object'?input.metadata:{},
    statusCode,result:statusCode>=400?'failed':'success',durationMs:Math.max(0,Math.round(finishedAtMs-startedAtMs)),
  });
}
