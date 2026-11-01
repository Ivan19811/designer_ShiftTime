import test from 'node:test';
import assert from 'node:assert/strict';
import {emailTransportConfigured01612B,emailTransportOptions01612B,sendPlatformEmail01612B} from '../src/email-transport-01612b.mjs';
import {requestPasswordReset01612A} from '../src/password-reset-01612a.mjs';
import {sendEmailNotification01409} from '../src/notification-transports-01409.mjs';
import {notificationTransportStatus01409} from '../src/notification-delivery-core-01409.mjs';

const settings={brevoApiKey:'xkeysib-MOCK_SECRET_NEVER_LOG',notificationEmailFrom:'ShiftTime <verified@example.org>',notificationDeliveryTimeoutMs:3000,notificationEmailTo:'operator@example.org'};
const opts=emailTransportOptions01612B(settings);
test('01612B chooses restricted-key HTTPS Brevo even when SMTP also configured',()=>{
 assert.equal(emailTransportConfigured01612B(settings),true);
 assert.equal(emailTransportOptions01612B({...settings,notificationSmtpHost:'old.example.org'}).provider,'brevo');
 assert.equal(emailTransportOptions01612B({...settings,brevoApiKey:'',notificationSmtpHost:'smtp.example.org',notificationSmtpStartTls:true}).provider,'smtp');
 assert.equal(emailTransportConfigured01612B({notificationEmailFrom:settings.notificationEmailFrom}),false);
});
test('01612B uses Brevo v3 HTTPS endpoint with verified sender and no key in body',async()=>{
 let wire;
 const res=await sendPlatformEmail01612B(opts,{from:settings.notificationEmailFrom,to:'user@example.org',subject:'Reset',text:'Reset link'},
 {fetchImpl:async(url,init)=>{wire={url,init};return {ok:true,status:201,json:async()=>({messageId:'<brevo-123>'})};}});
 assert.equal(res.ok,true);assert.equal(res.provider,'brevo');assert.equal(res.responseCode,201);assert.equal(res.externalId,'<brevo-123>');
 assert.equal(wire.url,'https://api.brevo.com/v3/smtp/email');assert.equal(wire.init.headers['api-key'],settings.brevoApiKey);
 const data=JSON.parse(wire.init.body);assert.deepEqual(data.sender,{name:'ShiftTime',email:'verified@example.org'});
 assert.deepEqual(data.to,[{email:'user@example.org'}]);assert.equal(data.textContent,'Reset link');
 assert.ok(!wire.init.body.includes(settings.brevoApiKey));
});
test('01612B fails closed for rejected Brevo request, with sanitized non-secret error and no SMTP fallback',async()=>{
 let fallback=0;
 await assert.rejects(()=>sendPlatformEmail01612B(opts,{from:settings.notificationEmailFrom,to:'user@example.org',subject:'Reset',text:'Secret code abc123'},
  {fetchImpl:async()=>({ok:false,status:403,json:async()=>({message:'secret user@example.org'})}),smtpSendImpl:async()=>{fallback++;}}),err=>err.code==='EMAIL_TRANSPORT_BREVO_FAILED_01612B'&&!JSON.stringify(err).includes(settings.brevoApiKey)&&!err.message.includes('secret'));
 assert.equal(fallback,0);
});
test('01612B retains compatible SMTP fallback for non-Render instances',async()=>{
 let call;
 const out=await sendPlatformEmail01612B({provider:'smtp',host:'smtp.example.org'}, {from:'x@example.org',to:'y@example.org',subject:'A',text:'hello'}, {smtpSendImpl:async(options,message)=>{call={options,message};return {ok:true,responseCode:250};}});
 assert.equal(call.options.host,'smtp.example.org');assert.equal(out.responseCode,250);
});
test('01612B recognizes Brevo-only notification status',()=>{
 const status=notificationTransportStatus01409(settings);assert.equal(status.channels.email.configured,true);
 assert.equal(status.channels.email.destination,'op***@example.org');
});
test('01612B notifications use Brevo with only transactional scope and without SMTP',async()=>{
 let wire;
 const out=await sendEmailNotification01409({storeId:'s1'},{eventKey:'e1',type:'order.created',notification:{title:'Order',body:'Order created'}},{settings,recipient:{email:'manager@example.org'},fetchImpl:async(url,init)=>{wire={url,init};return {ok:true,status:201,json:async()=>({messageId:'msg-456'})};},smtpSendImpl:async()=>{throw Error('SMTP must not be used');}});
 assert.equal(out.channel,'email');assert.equal(out.responseCode,201);assert.equal(out.externalId,'msg-456');
 assert.deepEqual(JSON.parse(wire.init.body).to,[{email:'manager@example.org'}]);
});
test('01612B password-reset request works with Brevo-only configuration using its existing sender dependency',async()=>{
 let received;
 const fakeQuery=async fn=>fn({query:async(sql)=>{if(String(sql).startsWith('SELECT id,email FROM platform_users'))return {rowCount:1,rows:[{id:'u1',email:'user@example.org'}]};if(String(sql).startsWith('SELECT COUNT(*)'))return {rows:[{count:0,last:null}]};if(String(sql).startsWith('INSERT INTO platform_password_resets'))return {rows:[{id:'r1'}]};return {rowCount:1,rows:[]};}});
 const res=await requestPasswordReset01612A('user@example.org',{query:fakeQuery,settings,env:{PASSWORD_RESET_PUBLIC_ORIGIN_01612A:'https://designer-shifttime.onrender.com'},send:async(options,message)=>{received={options,message};}});
 assert.deepEqual(res,{ok:true,stage:'01612A'});assert.equal(received.options.provider,'brevo');assert.ok(received.message.text.includes('/identity/reset/#token='));
});
test('01612B never permits unverified/unset sender configuration',()=>{
 assert.throws(()=>emailTransportOptions01612B({brevoApiKey:'fake'}),/EMAIL_TRANSPORT_NOT_CONFIGURED/);
});
