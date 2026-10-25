// 01595 · Build-only injection into published customer account pages.
// Does not change stored Builder page HTML or leak Builder credentials.
import {readFileSync} from 'node:fs';
const scriptPath='assets/site-customer-account-01595.js';
const localePath='assets/site-customer-account-01595.uk.json';
export function installPublishedCustomerAccount01595(files){
  if(!(files instanceof Map))throw new TypeError('PUBLISH_FILES_REQUIRED_01595');
  let enabled=false;
  for(const [path,raw] of files){
    if(!path.endsWith('.html'))continue;
    const html=Buffer.isBuffer(raw)?raw.toString('utf8'):String(raw||'');
    if(!/data-st-published-traffic\s*=\s*["']01203["']/.test(html))continue;
    if(!/data-shop-page-role-01532\s*=\s*["']account["']/.test(html))continue;
    if(/data-st-site-customer-account\s*=\s*["']01595["']/.test(html))continue;
    const tag='<script type="module" data-st-site-customer-account="01595" src="/'+scriptPath+'"></script>';
    files.set(path,Buffer.from(/<\/body\s*>/i.test(html)?html.replace(/<\/body\s*>/i,tag+'</body>'):html+tag));
    enabled=true;
  }
  if(enabled){
    if(files.has(scriptPath)||files.has(localePath))throw Object.assign(new Error('CUSTOMER_ACCOUNT_ASSET_COLLISION_01595'),{statusCode:400});
    files.set(scriptPath,readFileSync(new URL('../public/site-customer-account-01595.js',import.meta.url)));
    files.set(localePath,readFileSync(new URL('../public/site-customer-account-01595.uk.json',import.meta.url)));
  }
  return files;
}
