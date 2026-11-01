// 01611C: fail-closed manager access policy, independent of database and UI.
const ASSIGNED_ROLES=new Set(['manager','editor','order-manager']);
export function canRevealMessengerPhone01611C(scope,userId,assignedUserId){
  if(!userId||!scope?.storeId)return false;
  if(scope.role==='owner'||scope.role==='admin')return true;
  return ASSIGNED_ROLES.has(scope.role)&&Boolean(assignedUserId)&&String(assignedUserId)===String(userId);
}
