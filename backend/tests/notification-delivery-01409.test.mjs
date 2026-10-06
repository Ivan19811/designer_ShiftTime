import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import {readFileSync} from 'node:fs';
import {notificationTransportStatus01409,notificationWebhookSignature01409,buildNotificationTransportMessage01409} from '../src/notification-delivery-core-01409.mjs';
import {sendWebhookNotification01409,sendTelegramNotification01409,sendEmailNotification01409} from '../src/notification-transports-01409.mjs';
import {sendSmtpMail01409} from '../src/smtp-send-01409.mjs';
const read=rel=>readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');
const scope={accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1'};
const event={eventKey:'order_1',type:'order.created',provider:'orders',severity:'high',notification:{title:'Order MP-1',body:'2 items · 12000 UAH'},data:{order:{id:'order_1',total:12000}}};

test('01409 transport status exposes only safe configured state and masked destinations',()=>{
  const secretSettings={notificationSmtpHost:'smtp.example.com',notificationEmailFrom:'alerts@example.com',notificationEmailTo:'owner@example.com',notificationSmtpPass:'super-secret',notificationTelegramBotToken:'bot-secret',notificationTelegramChatId:'123456789',notificationWebhookUrl:'https://hooks.example.com/x',notificationWebhookSecret:'webhook-secret'};
  const status=notificationTransportStatus01409(secretSettings),json=JSON.stringify(status);
  assert.equal(status.channels.email.state,'live');assert.equal(status.channels.telegram.state,'live');assert.equal(status.channels.webhook.state,'live');assert.equal(status.channels.slack.state,'prepared');
  assert.doesNotMatch(json,/super-secret|bot-secret|webhook-secret|hooks\.example\.com\/x/);assert.match(status.channels.email.destination,/@example\.com/);
});

test('01409 webhook adapter sends signed JSON event through backend transport',async()=>{
  let seen=null;const settings={notificationWebhookUrl:'https://hooks.example.com/notify',notificationWebhookSecret:'secret-01409',notificationDeliveryTimeoutMs:3000};
  const out=await sendWebhookNotification01409(scope,event,{settings,fetchImpl:async(url,init)=>{seen={url,init};return {ok:true,status:204,headers:{get:()=>''}};}});
  assert.equal(out.channel,'webhook');assert.equal(seen.url,settings.notificationWebhookUrl);const expected=notificationWebhookSignature01409(settings.notificationWebhookSecret,seen.init.body);assert.equal(seen.init.headers['x-shifttime-signature'],expected);assert.match(seen.init.body,/order\.created/);
});

test('01409 Telegram adapter calls Bot API but status contract never exposes token',async()=>{
  let seen=null;const settings={notificationTelegramBotToken:'123:abcXYZ',notificationTelegramChatId:'998877',notificationDeliveryTimeoutMs:3000};
  const out=await sendTelegramNotification01409(scope,event,{settings,fetchImpl:async(url,init)=>{seen={url,init};return {ok:true,status:200,json:async()=>({ok:true,result:{message_id:77}})};}});
  assert.equal(out.externalId,'77');assert.match(seen.url,/api\.telegram\.org\/bot/);assert.match(seen.url,/123%3AabcXYZ/);assert.equal(JSON.parse(seen.init.body).chat_id,'998877');
});

test('01409 email adapter passes backend-only SMTP config into SMTP sender',async()=>{
  let args=null;const settings={notificationSmtpHost:'smtp.example.com',notificationSmtpPort:587,notificationSmtpSecure:false,notificationSmtpStartTls:true,notificationSmtpUser:'user',notificationSmtpPass:'pass',notificationEmailFrom:'ShiftTime <alerts@example.com>',notificationEmailTo:'owner@example.com',notificationDeliveryTimeoutMs:3000};
  const out=await sendEmailNotification01409(scope,event,{settings,smtpSendImpl:async(options,message)=>{args={options,message};return {responseCode:250};}});
  assert.equal(out.channel,'email');assert.equal(args.options.host,'smtp.example.com');assert.equal(args.options.pass,'pass');assert.match(args.message.subject,/Order MP-1/);assert.match(args.message.text,/12000 UAH/);
});

test('01409 built-in SMTP sender performs a real SMTP DATA exchange without external dependency',async()=>{
  let data='';const server=net.createServer(socket=>{socket.setEncoding('utf8');socket.write('220 local.test ESMTP\r\n');let buffer='',inData=false;socket.on('data',chunk=>{buffer+=chunk;while(buffer.includes('\n')){const idx=buffer.indexOf('\n'),line=buffer.slice(0,idx+1).replace(/\r?\n$/,''),rest=buffer.slice(idx+1);buffer=rest;if(inData){if(line==='.'){inData=false;socket.write('250 2.0.0 queued\r\n');}else data+=`${line}\n`;continue;}if(/^EHLO /i.test(line))socket.write('250-local.test\r\n250 8BITMIME\r\n');else if(/^MAIL FROM:/i.test(line))socket.write('250 ok\r\n');else if(/^RCPT TO:/i.test(line))socket.write('250 ok\r\n');else if(line==='DATA'){inData=true;socket.write('354 end with dot\r\n');}else if(line==='QUIT'){socket.write('221 bye\r\n');socket.end();}}});});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
  try{const out=await sendSmtpMail01409({host:'127.0.0.1',port,secure:false,startTls:false,timeoutMs:3000},{from:'alerts@example.com',to:'owner@example.com',subject:'SMTP 01409 test',text:'hello from ShiftTime'});assert.equal(out.ok,true);assert.match(data,/Subject: SMTP 01409 test/);assert.match(data,/hello from ShiftTime/);}finally{await new Promise(resolve=>server.close(resolve));}
});

test('01409 delivery migration routes and event providers are wired without frontend secrets',()=>{
  const migration=read('sql/032_notification_delivery_transport.sql'),server=read('src/server.mjs'),delivery=read('src/notification-delivery-01409.mjs'),orders=read('src/marketplace-order-service.mjs'),messages=read('src/notification-inbox-01404.mjs'),suppliers=read('src/marketplace-supplier-sync-alerts-01401.mjs'),env=read('.env.example');
  assert.match(migration,/UNIQUE\(store_id,event_key,channel\)/);assert.match(migration,/shifttime_notification_deliveries/);assert.match(server,/transports.*status/);assert.match(server,/retryNotificationDelivery01409/);assert.match(delivery,/dispatchNotificationEvent01409/);assert.match(delivery,/status==='sent'/);assert.match(orders,/order\.created/);assert.match(messages,/customer\.message\.created/);assert.match(suppliers,/dispatchNotificationEvent01409/);assert.match(env,/NOTIFICATION_TELEGRAM_BOT_TOKEN/);assert.match(env,/NOTIFICATION_SMTP_PASS/);
  const frontend=read('../js/notifications/notification-delivery-01409.js');assert.doesNotMatch(frontend,/NOTIFICATION_TELEGRAM_BOT_TOKEN|NOTIFICATION_SMTP_PASS|NOTIFICATION_WEBHOOK_SECRET/);
});

test('01409 transport message keeps event business data immutable',()=>{const before=JSON.stringify(event),msg=buildNotificationTransportMessage01409(event,scope);assert.match(msg.text,/Order MP-1/);assert.equal(JSON.stringify(event),before);});
