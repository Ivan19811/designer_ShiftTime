// ShiftTime ID 01581 · browser-side PKCE and first-party cookie handoff, no bearer in URL.
const STORAGE='st_sso_pkce_transaction_01581';
export const ssoApiBase01581=()=>String(globalThis.ST_SSO_API_BASE_01581||'https://designer-shifttime.onrender.com/api/v1').replace(/\/$/,'');
export const ssoRedirectUri01581=()=>location.origin+location.pathname;
function randomString(bytes){const a=new Uint8Array(bytes);crypto.getRandomValues(a);return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function challenge(verifier){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export async function ssoAuthorize01581(clientId){
 const verifier=randomString(32),state=randomString(24),redirectUri=ssoRedirectUri01581();
 sessionStorage.setItem(STORAGE,JSON.stringify({verifier,state,clientId,redirectUri,createdAt:Date.now()}));
 const url=new URL(ssoApiBase01581()+'/auth/sso/authorize');
 for(const [k,v] of Object.entries({client_id:clientId,redirect_uri:redirectUri,state,code_challenge:await challenge(verifier),code_challenge_method:'S256'}))url.searchParams.set(k,v);
 location.assign(url.href);
}
export async function ssoFinish01581(clientId){
 const url=new URL(location.href),code=url.searchParams.get('code'),error=url.searchParams.get('error'),state=url.searchParams.get('state');
 if(!code&&!error)return {handled:false};
 url.searchParams.delete('code');url.searchParams.delete('error');url.searchParams.delete('state');
 history.replaceState(history.state,'',url.pathname+(url.search||'')+url.hash);
 const raw=sessionStorage.getItem(STORAGE);sessionStorage.removeItem(STORAGE);
 let transaction;try{transaction=JSON.parse(raw||'null');}catch{transaction=null;}
 if(!transaction||transaction.clientId!==clientId||transaction.redirectUri!==ssoRedirectUri01581()||transaction.state!==state||Date.now()-transaction.createdAt>120000)return {handled:true,error:'SSO_STATE_MISMATCH_01581'};
 if(error)return {handled:true,error};
 const result=await fetch(ssoApiBase01581()+'/auth/sso/exchange',{method:'POST',cache:'no-store',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify({code,codeVerifier:transaction.verifier,clientId,redirectUri:transaction.redirectUri})});
 const data=await result.json();if(!result.ok||!data.token)return {handled:true,error:data.error||'SSO_EXCHANGE_FAILED_01581'};
 return {handled:true,session:data};
}
export async function ssoEstablish01581(token,clientId,redirectUri=ssoRedirectUri01581()){
 const res=await fetch(ssoApiBase01581()+'/auth/sso/handoff',{method:'POST',cache:'no-store',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({clientId,redirectUri})});
 const payload=await res.json();if(!res.ok||!payload.ticket)throw new Error(payload.error||'SSO_HANDOFF_FAILED_01581');
 // Top-level form POST ensures first-party SameSite cookie; ticket stays out of URL and history.
 const form=document.createElement('form');form.action=ssoApiBase01581()+'/auth/sso/establish';form.method='POST';form.hidden=true;
 for(const [key,value] of Object.entries({ticket:payload.ticket,client_id:clientId,redirect_uri:redirectUri})){const input=document.createElement('input');input.type='hidden';input.name=key;input.value=value;form.appendChild(input);}
 document.body.appendChild(form);form.submit();
}
