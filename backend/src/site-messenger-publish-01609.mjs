// 01609: Only sites with the Messenger block get the published runtime.
import {readFileSync} from 'node:fs';
const path='assets/site-messenger-01609.js';
export function installPublishedMessenger01609(files){
  if(!(files instanceof Map))throw new TypeError('PUBLISH_FILES_REQUIRED_01609');
  let needed=false;
  for(const [file,raw] of files){
    if(!file.endsWith('.html'))continue;
    const html=Buffer.isBuffer(raw)?raw.toString('utf8'):String(raw||'');
    if(!/data-st-published-traffic\s*=\s*["']01203["']/.test(html))continue;
    if(!/data-st-messenger-01609\s*=\s*["']1["']/.test(html))continue;
    if(/data-st-published-messenger\s*=\s*["']01609["']/.test(html))continue;
    const script='<script defer data-st-published-messenger="01609" src="/'+path+'"></script>';
    files.set(file,Buffer.from(/<\/body\s*>/i.test(html)?html.replace(/<\/body\s*>/i,script+'</body>'):html+script));
    needed=true;
  }
  if(needed){
    if(files.has(path))throw Object.assign(new Error('MESSENGER_ASSET_COLLISION_01609'),{statusCode:400});
    files.set(path,readFileSync(new URL('../public/site-messenger-01609.js',import.meta.url)));
  }
  return files;
}
