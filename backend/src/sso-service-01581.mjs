// 01581 · Same Render/PostgreSQL identity for Builder and CRM, authorization-code + PKCE.
import {withClient} from './db.mjs';
import {createSessionForUser01581} from './auth-service-01084.mjs';
import {resolveAuthorizedStore} from './auth.mjs';
import {hashSsoCode01581,newSsoCode01581,ssoChallenge01581,validChallenge01581,validVerifier01581,ssoRedirectAllowed01581,readSsoCookie01581,ssoCookieFromRequest01581} from './sso-core-01581.mjs';
const clean=x=>String(x??'').trim();
const failure=(code,statusCode=400)=>Object.assign(new Error(code),{statusCode});
const configured=()=>{
  if(String(process.env.SSO_COOKIE_SECRET||'').length<32||!String(process.env.SSO_ALLOWED_CALLBACKS||'').trim())throw failure('SSO_NOT_CONFIGURED_01581',503);
};
const allowed=(clientId,redirectUri)=>{configured();if(!ssoRedirectAllowed01581(clientId,redirectUri))throw failure('SSO_REDIRECT_DENIED_01581',400);};
async function validSession(client,sessionId){
 const q=await client.query(`SELECT s.id,s.user_id FROM api_sessions s JOIN platform_users u ON u.id=s.user_id WHERE s.id=$1 AND s.status='active' AND u.status='active' AND (s.expires_at IS NULL OR s.expires_at>now()) LIMIT 1`,[sessionId]);
 return q.rows[0]||null;
}
async function createCode(client,{kind,sessionId,userId,clientId,redirectUri,challenge=''}){
 const code=newSsoCode01581();
 await client.query(`INSERT INTO platform_sso_codes_01581(code_hash,kind,session_id,user_id,client_id,redirect_uri,code_challenge,expires_at)
 VALUES($1,$2,$3,$4,$5,$6,$7,now()+interval '75 seconds')`,[hashSsoCode01581(code),kind,sessionId,userId,clientId,redirectUri,challenge]);
 return code;
}
// Bearer-authenticated, backend-only one-time form ticket. No bearer token in URL.
export async function createSsoHandoff01581(session,{clientId,redirectUri}={}){
  const client=clean(clientId),uri=clean(redirectUri);allowed(client,uri);
  return withClient(async db=>({ticket:await createCode(db,{kind:'handoff',sessionId:session.sessionId,userId:session.userId,clientId:client,redirectUri:uri}),expiresIn:75}));
}
async function consumeCode(code,kind,{clientId,redirectUri}={}){
 if(!/^[A-Za-z0-9_-]{43}$/.test(clean(code)))throw failure('SSO_CODE_INVALID_01581',401);
 return withClient(async db=>{
  const q=await db.query(`UPDATE platform_sso_codes_01581 SET consumed_at=now() WHERE code_hash=$1 AND kind=$2 AND consumed_at IS NULL AND expires_at>now()
   AND client_id=$3 AND redirect_uri=$4 RETURNING *`,[hashSsoCode01581(code),kind,clientId,redirectUri]);
  const row=q.rows[0];if(!row)throw failure('SSO_CODE_EXPIRED_01581',401);
  const session=await validSession(db,row.session_id);if(!session||session.user_id!==row.user_id)throw failure('SSO_SESSION_INVALID_01581',401);
  return {row,session};
 });
}
export async function establishSso01581(ticket,{clientId,redirectUri}={}){
 allowed(clientId,redirectUri);
 const result=await consumeCode(ticket,'handoff',{clientId,redirectUri});
 return {sessionId:result.session.id,redirectUri};
}
export async function authorizeSso01581(req,{clientId,redirectUri,codeChallenge}={}){
 allowed(clientId,redirectUri);
 if(!validChallenge01581(codeChallenge))throw failure('SSO_CHALLENGE_INVALID_01581');
 const signed=readSsoCookie01581(ssoCookieFromRequest01581(req),process.env.SSO_COOKIE_SECRET);
 if(!signed)return {error:'login_required'};
 return withClient(async db=>{
   const sess=await validSession(db,signed);if(!sess)return {error:'login_required'};
   const code=await createCode(db,{kind:'authorization',sessionId:sess.id,userId:sess.user_id,clientId,redirectUri,challenge:codeChallenge});
   return {code};
 });
}
export async function exchangeSso01581({code,codeVerifier,clientId,redirectUri}={}){
 allowed(clientId,redirectUri);
 if(!validVerifier01581(codeVerifier))throw failure('SSO_VERIFIER_INVALID_01581',400);
 const {row,session}=await consumeCode(code,'authorization',{clientId,redirectUri});
 if(ssoChallenge01581(codeVerifier)!==row.code_challenge)throw failure('SSO_PKCE_MISMATCH_01581',401);
 const fresh=await createSessionForUser01581(session.user_id);
 const scope=await resolveAuthorizedStore(session.user_id,'');
 return {token:fresh.token,user:{id:fresh.userId,email:fresh.email,name:fresh.name},scope,expiresAt:fresh.expiresAt};
}
