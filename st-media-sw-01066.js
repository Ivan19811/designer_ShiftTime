/* 01066 · Development media asset service worker.
   Serves browser CacheStorage-backed media URLs. Binary data never enters MarketplaceStore. */
const CACHE_NAME='st-media-assets-v1-01066';
const MEDIA_MARK='/__st_media/01066/';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  try{
    const url=new URL(event.request.url);
    if(!url.pathname.includes(MEDIA_MARK))return;
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const hit=await cache.match(event.request,{ignoreSearch:true,ignoreVary:true});
      if(hit)return hit;
      return new Response('ShiftTime local media asset not found',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
    })());
  }catch{}
});
