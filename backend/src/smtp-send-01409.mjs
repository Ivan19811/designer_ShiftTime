import net from 'node:net';
import tls from 'node:tls';

export const SMTP_SEND_STAGE_01409='01409';
const str=value=>String(value??'').trim();
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function encodedHeader(value=''){const s=String(value??'');return /[^\x20-\x7E]/.test(s)?`=?UTF-8?B?${Buffer.from(s,'utf8').toString('base64')}?=`:s.replace(/[\r\n]+/g,' ');}
function address(value=''){const s=str(value).replace(/[\r\n]/g,'');const m=s.match(/<([^>]+)>/);return str(m?m[1]:s);}
function dotStuff(text=''){return String(text).replace(/^\./gm,'..').replace(/\r?\n/g,'\r\n');}

class SmtpSession01409{
  constructor(socket,{timeoutMs=10000}={}){this.socket=socket;this.timeoutMs=timeoutMs;this.buffer='';this.lines=[];this.waiters=[];this.closed=false;socket.setEncoding('utf8');socket.setTimeout(timeoutMs,()=>socket.destroy(Object.assign(new Error('SMTP_TIMEOUT_01409'),{code:'SMTP_TIMEOUT_01409'})));socket.on('data',chunk=>this.onData(chunk));socket.on('error',error=>this.fail(error));socket.on('close',()=>this.fail(Object.assign(new Error('SMTP_CLOSED_01409'),{code:'SMTP_CLOSED_01409'})));}
  onData(chunk){this.buffer+=chunk;while(true){const idx=this.buffer.indexOf('\n');if(idx<0)break;const line=this.buffer.slice(0,idx+1).replace(/\r?\n$/,'');this.buffer=this.buffer.slice(idx+1);this.lines.push(line);this.flush();}}
  fail(error){if(this.closed)return;this.closed=true;for(const w of this.waiters.splice(0))w.reject(error);}
  flush(){while(this.waiters.length){const waiter=this.waiters[0],packet=this.nextPacket();if(!packet)return;this.waiters.shift();waiter.resolve(packet);}}
  nextPacket(){if(!this.lines.length)return null;const first=this.lines[0],m=first.match(/^(\d{3})([ -])/);if(!m){this.lines.shift();return {code:0,lines:[first]};}const code=Number(m[1]);if(m[2]===' '){this.lines.shift();return {code,lines:[first]};}for(let i=1;i<this.lines.length;i++){if(this.lines[i].startsWith(`${m[1]} `)){return {code,lines:this.lines.splice(0,i+1)};}}return null;}
  response(){const existing=this.nextPacket();if(existing)return Promise.resolve(existing);return new Promise((resolve,reject)=>this.waiters.push({resolve,reject}));}
  write(line){this.socket.write(`${line}\r\n`);}
  async command(line,expected=[250]){this.write(line);const response=await this.response();if(!expected.includes(response.code)){const error=new Error(`SMTP_${response.code||'INVALID'}_01409`);error.code=`SMTP_${response.code||'INVALID'}_01409`;error.smtpCode=response.code;error.detail=response.lines.join(' ').slice(0,500);throw error;}return response;}
  detach(){this.socket.removeAllListeners('data');this.socket.removeAllListeners('error');this.socket.removeAllListeners('close');this.socket.removeAllListeners('timeout');return this.socket;}
}

function connectSocket({host,port,secure,timeoutMs}){return new Promise((resolve,reject)=>{const options={host,port,servername:host,timeout:timeoutMs,rejectUnauthorized:true};const socket=secure?tls.connect(options):net.createConnection({host,port,timeout:timeoutMs});const event=secure?'secureConnect':'connect';const fail=error=>{socket.destroy();reject(error);};socket.once('error',fail);socket.once(event,()=>{socket.off('error',fail);resolve(socket);});});}
async function upgradeStartTls(session,{host,timeoutMs}){const raw=session.detach();return new Promise((resolve,reject)=>{const socket=tls.connect({socket:raw,servername:host,rejectUnauthorized:true},()=>resolve(new SmtpSession01409(socket,{timeoutMs})));socket.once('error',reject);});}

export async function sendSmtpMail01409(options={},message={}){
  const host=str(options.host),port=Math.max(1,Number(options.port)||587),secure=options.secure===true,startTls=options.startTls!==false&&!secure,timeoutMs=Math.max(1000,Number(options.timeoutMs)||10000),from=address(message.from),to=address(message.to);
  if(!host||!from||!to)throw Object.assign(new Error('SMTP_CONFIGURATION_REQUIRED_01409'),{code:'SMTP_CONFIGURATION_REQUIRED_01409'});
  let session=new SmtpSession01409(await connectSocket({host,port,secure,timeoutMs}),{timeoutMs});
  try{
    let r=await session.response();if(r.code!==220)throw Object.assign(new Error(`SMTP_${r.code}_01409`),{code:`SMTP_${r.code}_01409`});
    const hello=str(options.helloName)||'shifttime.local';
    r=await session.command(`EHLO ${hello}`,[250]);
    const capabilities=r.lines.join('\n').toUpperCase();
    if(startTls){if(!capabilities.includes('STARTTLS'))throw Object.assign(new Error('SMTP_STARTTLS_UNAVAILABLE_01409'),{code:'SMTP_STARTTLS_UNAVAILABLE_01409'});await session.command('STARTTLS',[220]);session=await upgradeStartTls(session,{host,timeoutMs});r=await session.command(`EHLO ${hello}`,[250]);}
    const user=str(options.user),pass=String(options.pass??'');
    if(user){await session.command('AUTH LOGIN',[334]);await session.command(Buffer.from(user).toString('base64'),[334]);await session.command(Buffer.from(pass).toString('base64'),[235]);}
    await session.command(`MAIL FROM:<${from}>`,[250]);await session.command(`RCPT TO:<${to}>`,[250,251]);await session.command('DATA',[354]);
    const headers=[`From: ${encodedHeader(message.from||from)}`,`To: ${encodedHeader(message.to||to)}`,`Subject: ${encodedHeader(message.subject||'ShiftTime notification')}`,'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: 8bit',`Date: ${new Date().toUTCString()}`,'X-ShiftTime-Transport: 01409'];
    session.socket.write(`${headers.join('\r\n')}\r\n\r\n${dotStuff(message.text||'')}\r\n.\r\n`);
    r=await session.response();if(r.code!==250)throw Object.assign(new Error(`SMTP_${r.code}_01409`),{code:`SMTP_${r.code}_01409`,smtpCode:r.code});
    try{await session.command('QUIT',[221]);}catch{}
    return {ok:true,stage:SMTP_SEND_STAGE_01409,responseCode:r.code};
  }finally{try{session.socket.end();await Promise.race([new Promise(resolve=>session.socket.once('close',resolve)),sleep(100)]);}catch{}}
}
