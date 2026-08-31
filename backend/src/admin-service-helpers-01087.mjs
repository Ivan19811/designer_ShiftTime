import crypto from 'node:crypto';
import {normalizeRole01087} from './admin-access-01087.mjs';

const clean=(v)=>String(v??'').trim();
const fail=(message,statusCode=400,code='ST_ADMIN_ERROR')=>Object.assign(new Error(message),{statusCode,code});

export function hashInvitationToken01087(token){return crypto.createHash('sha256').update(String(token||'')).digest('hex');}
export function validateInvitationEmail01087(value){const email=clean(value).toLowerCase();if(!email||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw fail('Вкажіть коректний email',400,'ST_INVITE_EMAIL');return email;}
export function normalizeInvitationScope01087(scope={},mode='store'){
  const m=['account','workspace','store'].includes(clean(mode).toLowerCase())?clean(mode).toLowerCase():'store';
  if(m==='account')return {workspaceId:null,storeId:null,scopeMode:'account'};
  if(m==='workspace')return {workspaceId:clean(scope.workspaceId)||null,storeId:null,scopeMode:'workspace'};
  return {workspaceId:clean(scope.workspaceId)||null,storeId:clean(scope.storeId)||null,scopeMode:'store'};
}
export function assertMembershipMutationInvariant01087({actorRole,targetRole,nextRole,nextStatus,activeOwnerCount=0}={}){
  const actor=normalizeRole01087(actorRole),target=normalizeRole01087(targetRole),next=normalizeRole01087(nextRole,{fallback:target}),status=clean(nextStatus||'active').toLowerCase();
  if(target==='owner'&&actor!=='owner')throw fail('Owner permission required to modify an owner membership',403,'ST_OWNER_REQUIRED');
  if(next==='owner'&&actor!=='owner')throw fail('Owner permission required to assign owner role',403,'ST_OWNER_REQUIRED');
  if(target==='owner'&&(next!=='owner'||status!=='active')&&Number(activeOwnerCount)<=1)throw fail('The last active owner cannot be demoted or disabled',409,'ST_LAST_OWNER');
  return true;
}
export function membershipInviteAction01087(existingMembership){
  if(!existingMembership)return 'create';
  return clean(existingMembership.status).toLowerCase()==='disabled'?'reactivate':'conflict';
}
export function requiresRolesManage01087(input={}){
  return Object.prototype.hasOwnProperty.call(input||{},'role')||Object.prototype.hasOwnProperty.call(input||{},'permissions');
}
