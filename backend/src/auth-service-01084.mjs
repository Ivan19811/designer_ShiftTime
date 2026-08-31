import crypto from 'node:crypto';
import {promisify} from 'node:util';
import {withClient} from './db.mjs';
import {hashToken} from './auth.mjs';
import {loadInvitationForRegistration01087,acceptInvitationForUser01087} from './admin-service-01087.mjs';

const scryptAsync=promisify(crypto.scrypt);
const SCRYPT_KEYLEN=64;
const SCRYPT_OPTIONS=Object.freeze({N:16384,r:8,p:1,maxmem:64*1024*1024});

function clean(v){return String(v??'').trim();}
function emailOf(v){return clean(v).toLowerCase();}
function uid(prefix){return `${prefix}_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;}
function slugify(v){return clean(v).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9а-яіїєґ]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,56)||'workspace';}
function authError(message,statusCode=400){return Object.assign(new Error(message),{statusCode});}
function registrationEnabled(){return String(process.env.AUTH_REGISTRATION_ENABLED??'true').trim().toLowerCase()!=='false';}
function sessionTtlHours(){const n=Number(process.env.AUTH_SESSION_TTL_HOURS||720);return Math.min(24*90,Math.max(1,Number.isFinite(n)?n:720));}

function validateEmail(email){if(!email||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw authError('Вкажіть коректний email');}
function validateName(name){if(name.length<2||name.length>120)throw authError('Ім’я повинно містити від 2 до 120 символів');}
function validatePassword(password){const p=String(password??'');if(p.length<10)throw authError('Пароль повинен містити щонайменше 10 символів');if(p.length>256)throw authError('Пароль занадто довгий');return p;}

export async function hashPassword01084(password){
  const p=validatePassword(password),salt=crypto.randomBytes(16).toString('base64url');
  const derived=await scryptAsync(p,salt,SCRYPT_KEYLEN,SCRYPT_OPTIONS);
  return `scrypt-v1$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt}$${Buffer.from(derived).toString('base64url')}`;
}

export async function verifyPassword01084(password,encoded){
  try{
    const parts=String(encoded||'').split('$');
    if(parts.length!==6||parts[0]!=='scrypt-v1')return false;
    const [,nRaw,rRaw,pRaw,salt,expectedRaw]=parts;
    const opts={N:Number(nRaw),r:Number(rRaw),p:Number(pRaw),maxmem:64*1024*1024};
    if(!Number.isFinite(opts.N)||!Number.isFinite(opts.r)||!Number.isFinite(opts.p)||!salt||!expectedRaw)return false;
    const expected=Buffer.from(expectedRaw,'base64url');
    const actual=Buffer.from(await scryptAsync(String(password??''),salt,expected.length,opts));
    return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual);
  }catch{return false;}
}

async function createSessionWithClient(client,userId){
  const token=crypto.randomBytes(32).toString('base64url');
  const sessionId=uid('sess'),tokenHash=hashToken(token),ttl=sessionTtlHours();
  const q=await client.query(`INSERT INTO api_sessions(id,user_id,token_hash,status,expires_at,created_at,last_seen_at)
    VALUES($1,$2,$3,'active',now()+($4::text||' hours')::interval,now(),now()) RETURNING expires_at`,[sessionId,userId,tokenHash,String(ttl)]);
  return {token,sessionId,expiresAt:q.rows[0]?.expires_at||null};
}

export async function registerUser01084(input={}){
  if(!registrationEnabled())throw authError('Реєстрацію тимчасово вимкнено',403);
  const email=emailOf(input.email),name=clean(input.name),password=validatePassword(input.password),inviteToken=clean(input.inviteToken);
  validateEmail(email);validateName(name);
  const passwordHash=await hashPassword01084(password);
  const userId=uid('usr'),accountId=uid('acct'),workspaceId=uid('ws'),storeId=uid('store'),membershipId=uid('member'),credentialId=uid('cred');
  const accountName=clean(input.accountName)||`${name} · ShiftTime`;
  const workspaceName=clean(input.workspaceName)||'Основний Workspace';
  const storeName=clean(input.storeName)||'Основний магазин';
  const workspaceSlug=slugify(workspaceName),storeSlug=slugify(storeName);
  return withClient(async client=>{
    await client.query('BEGIN');
    try{
      const invitation=inviteToken?await loadInvitationForRegistration01087(client,{inviteToken,email}):null;
      if(invitation){
        const existing=await client.query(`SELECT u.id,u.email,u.name,u.status,c.secret_hash
          FROM platform_users u LEFT JOIN platform_user_credentials c ON c.user_id=u.id AND c.kind='password'
          WHERE lower(u.email)=lower($1) LIMIT 1`,[email]);
        let joinedUserId=userId,joinedName=name;
        if(existing.rowCount){
          const row=existing.rows[0];
          if(row.status!=='active'||!row.secret_hash||!(await verifyPassword01084(password,row.secret_hash)))throw authError('Для існуючого акаунта введи правильний пароль',401);
          joinedUserId=row.id;joinedName=row.name||name;
        }else{
          await client.query(`INSERT INTO platform_users(id,email,name,status) VALUES($1,$2,$3,'active')`,[joinedUserId,email,name]);
          await client.query(`INSERT INTO platform_user_credentials(id,user_id,kind,algorithm,secret_hash) VALUES($1,$2,'password','scrypt-v1',$3)`,[credentialId,joinedUserId,passwordHash]);
        }
        const accepted=await acceptInvitationForUser01087(client,{invitation,userId:joinedUserId});
        const session=await createSessionWithClient(client,joinedUserId);
        await client.query('COMMIT');
        return {user:{id:joinedUserId,email,name:joinedName},scope:accepted.scope,...session,invitationAccepted:true};
      }
      const exists=await client.query('SELECT 1 FROM platform_users WHERE lower(email)=lower($1) LIMIT 1',[email]);
      if(exists.rowCount)throw authError('Користувач із таким email уже існує',409);
      await client.query(`INSERT INTO platform_users(id,email,name,status) VALUES($1,$2,$3,'active')`,[userId,email,name]);
      await client.query(`INSERT INTO platform_user_credentials(id,user_id,kind,algorithm,secret_hash) VALUES($1,$2,'password','scrypt-v1',$3)`,[credentialId,userId,passwordHash]);
      await client.query(`INSERT INTO platform_accounts(id,name,slug,status,owner_user_id) VALUES($1,$2,$3,'active',$4)`,[accountId,accountName,slugify(accountName),userId]);
      await client.query(`INSERT INTO platform_workspaces(id,account_id,name,slug,status) VALUES($1,$2,$3,$4,'active')`,[workspaceId,accountId,workspaceName,workspaceSlug]);
      await client.query(`INSERT INTO platform_stores(id,workspace_id,name,slug,status,locale,currency) VALUES($1,$2,$3,$4,'active','uk-UA','UAH')`,[storeId,workspaceId,storeName,storeSlug]);
      await client.query(`INSERT INTO platform_memberships(id,user_id,account_id,workspace_id,store_id,role,status,permissions)
        VALUES($1,$2,$3,NULL,NULL,'owner','active','[]'::jsonb)`,[membershipId,userId,accountId]);
      const session=await createSessionWithClient(client,userId);
      await client.query('COMMIT');
      return {user:{id:userId,email,name},scope:{userId,tenantId:accountId,accountId,accountName,workspaceId,workspaceName,storeId,storeName,role:'owner',permissions:[]},...session};
    }catch(e){
      try{await client.query('ROLLBACK');}catch{}
      if(e?.code==='23505'&&String(e?.constraint||'').includes('platform_users_email'))throw authError('Користувач із таким email уже існує',409);
      throw e;
    }
  });
}

export async function loginUser01084(input={}){
  const email=emailOf(input.email),password=String(input.password??'');validateEmail(email);if(!password)throw authError('Email або пароль неправильні',401);
  return withClient(async client=>{
    const q=await client.query(`SELECT u.id,u.email,u.name,u.status,c.secret_hash
      FROM platform_users u JOIN platform_user_credentials c ON c.user_id=u.id AND c.kind='password'
      WHERE lower(u.email)=lower($1) LIMIT 1`,[email]);
    const row=q.rows[0];
    if(!row||row.status!=='active'||!(await verifyPassword01084(password,row.secret_hash)))throw authError('Email або пароль неправильні',401);
    const session=await createSessionWithClient(client,row.id);
    return {user:{id:row.id,email:row.email,name:row.name},...session};
  });
}


export async function activatePasswordForUser01084(userId,input={}){
  const id=clean(userId),password=validatePassword(input.password);if(!id)throw authError('User is required',400);
  const passwordHash=await hashPassword01084(password);
  return withClient(async client=>{
    const user=await client.query(`SELECT id FROM platform_users WHERE id=$1 AND status='active' LIMIT 1`,[id]);
    if(!user.rowCount)throw authError('Користувача не знайдено',404);
    const existing=await client.query(`SELECT id FROM platform_user_credentials WHERE user_id=$1 AND kind='password' LIMIT 1`,[id]);
    if(existing.rowCount){await client.query(`UPDATE platform_user_credentials SET algorithm='scrypt-v1',secret_hash=$2,updated_at=now() WHERE id=$1`,[existing.rows[0].id,passwordHash]);}
    else{await client.query(`INSERT INTO platform_user_credentials(id,user_id,kind,algorithm,secret_hash) VALUES($1,$2,'password','scrypt-v1',$3)`,[uid('cred'),id,passwordHash]);}
    return {ok:true,userId:id};
  });
}

export async function revokeSession01084(sessionId){
  const id=clean(sessionId);if(!id)return false;
  return withClient(async client=>{const q=await client.query(`UPDATE api_sessions SET status='revoked',last_seen_at=now() WHERE id=$1 AND status='active'`,[id]);return q.rowCount>0;});
}

export async function revokeAllUserSessions01084(userId,{exceptSessionId=''}={}){
  const uidValue=clean(userId),except=clean(exceptSessionId);if(!uidValue)return 0;
  return withClient(async client=>{const q=await client.query(`UPDATE api_sessions SET status='revoked',last_seen_at=now() WHERE user_id=$1 AND status='active' AND ($2='' OR id<>$2)`,[uidValue,except]);return q.rowCount;});
}
