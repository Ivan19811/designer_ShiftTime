// 01567 · Standalone public Render buyer confirmation; language in separately versioned locale JSON.
const $=id=>document.getElementById(id),currency=n=>new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH'}).format(Number(n)||0);
const date=n=>{const d=new Date(n);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('uk-UA',{dateStyle:'medium',timeStyle:'short'}).format(d):'—';};
const linkToken=new URLSearchParams(location.hash.slice(1)).get('token')||'';
try{history.replaceState(null,'',location.pathname);}catch{}
const locale=await fetch('/api/v1/public/orders-offers/page-locale',{cache:'no-store'}).then(r=>r.json()).catch(()=>({}));
const t=key=>locale[key]||key;
for(const key of ['heading','intro','approveConsent','approved','success','successNote'])$(key).textContent=t(key);
$('placeConsent').textContent=t('placementConsent');$('approveButton').textContent=t('approve');$('placeButton').textContent=t('place');document.title=t('pageTitle');
const feedback=text=>$('feedback').textContent=text;
async function request(path,body){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),25000);try{const resp=await fetch('/api/v1/public/orders-offers/'+path,{method:'POST',headers:{accept:'application/json','content-type':'application/json'},body:JSON.stringify({token:linkToken,...body}),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:ctrl.signal});const data=await resp.json().catch(()=>null);if(!resp.ok||!data)throw Error(String(data?.error||'NETWORK'));return data;}finally{clearTimeout(timer);}}
function row(name,value,isTotal){const block=document.createElement('div');block.className='line';const key=document.createElement('span'),val=document.createElement('strong');key.textContent=name;val.textContent=value;if(isTotal)val.className='total';block.append(key,val);return block;}
function success(order){if(!order?.orderNumber)return;$('details').hidden=true;$('approval').hidden=true;$('placement').hidden=true;$('finished').hidden=false;$('orderNumber').textContent=t('successNumber')+': '+order.orderNumber;$('amount').textContent=t('price')+': '+currency(order.total);feedback('');}
async function receipt(){try{const s=await request('checkout/status');if(s.stage==='01567'&&s.found){success(s.order);return true;}}catch{}return false;}
function showOffer(data){$('details').hidden=false;$('items').replaceChildren();$('items').append(document.createElement('h2'));$('items').firstChild.textContent=t('items');
for(const x of data.items||[])$('items').append(row(String(x.title||'')+' · '+t('quantity')+': '+Number(x.quantity||0),currency(x.lineTotal)));
$('total').replaceChildren(row(t('amount'),currency(data.subtotal)),row(t('shipping'),currency(data.delivery)),row(t('total'),currency(data.total),true),row(t('seats'),String(data.numberOfPackages)),row(t('expires'),date(data.expiresAt)));
$('warning').textContent=t('disclaimer');$('approval').hidden=data.status==='acknowledged';$('placement').hidden=data.status!=='acknowledged';if(data.status==='acknowledged')feedback(t('approved'));else feedback('');}
$('approveCheck').addEventListener('change',()=>{$('approveButton').disabled=!$('approveCheck').checked;});
$('placeCheck').addEventListener('change',()=>{$('placeButton').disabled=!$('placeCheck').checked;});
$('approveButton').addEventListener('click',async()=>{if(!$('approveCheck').checked)return;$('approveButton').disabled=true;try{const d=await request('acknowledge',{acknowledge:true});if(d.stage!=='01564')throw Error('FORMAT');showOffer(d);await receipt();}catch{feedback(t('error'));$('approveButton').disabled=false;}});
$('placeButton').addEventListener('click',async()=>{if(!$('placeCheck').checked)return;const requestId=globalThis.crypto?.randomUUID?.();if(!requestId){feedback(t('secure'));return;}$('placeButton').disabled=true;feedback(t('placing'));try{const d=await request('checkout/place',{requestId,confirmPlacement:true,acceptEstimatedShipping:true});if(d.stage!=='01567'||d.orderCreated!==true)throw Error('FORMAT');success(d);}catch(e){if(!await receipt())feedback(e.message==='BUYER_CHECKOUT_ALREADY_PLACED_01567'?t('already'):e.message==='BUYER_CHECKOUT_OFFER_EXPIRED_01567'?t('expired'):t('error'));$('placeButton').disabled=false;}});
(async()=>{if(!/^[A-Za-z0-9_-]{43}$/.test(linkToken)){feedback(t('expired'));return;}feedback(t('load'));if(await receipt())return;try{const d=await request('preview');if(d.stage!=='01564')throw Error('FORMAT');showOffer(d);}catch{feedback(t('expired'));}})();
