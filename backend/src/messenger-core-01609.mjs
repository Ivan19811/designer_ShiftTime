// 01609: Shared Messenger protocol. No client-provided identity/order linkage is trusted.
import crypto from 'node:crypto';
export const MESSENGER_STAGE_01609='01609';
export const MESSENGER_VISITOR_PATTERN_01609=/^stmv_[A-Za-z0-9_-]{40,120}$/;
export function messengerError01609(code,statusCode=400){const error=new Error(code);error.code=code;error.statusCode=statusCode;return error;}
export function hashMessengerVisitor01609(token){
  if(!MESSENGER_VISITOR_PATTERN_01609.test(String(token||'')))throw messengerError01609('MESSENGER_VISITOR_REQUIRED_01609',401);
  return crypto.createHash('sha256').update(token,'utf8').digest('hex');
}
export function cleanMessengerBody01609(body){
  const value=String(body??'').trim().replace(/\u0000/g,'').slice(0,4000);
  if(value.length<2)throw messengerError01609('MESSENGER_BODY_REQUIRED_01609');
  return value;
}
export function publicMessengerThread01609(rows=[]){
  return rows.filter(x=>x.visibility==='customer'&&['customer','reply'].includes(x.kind))
    .map(x=>({id:x.id,role:x.kind==='customer'?'customer':'manager',body:x.body,createdAt:x.createdAt}));
}
