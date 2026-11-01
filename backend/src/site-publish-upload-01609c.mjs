// 01609C: Bounded, backwards-compatible site publication upload parsing.
// gzip is enabled exclusively for the authenticated site publishing route.
import {gunzipSync} from 'node:zlib';
import {readBuffer,readJson} from './http-utils.mjs';

export const SITE_PUBLISH_MAX_JSON_BYTES_01609C=96*1024*1024;
export const SITE_PUBLISH_MAX_GZIP_BYTES_01609C=32*1024*1024;
function error01609C(message,statusCode,code){return Object.assign(new Error(message),{statusCode,code});}

export async function readSitePublishingJson01609C(req){
  const encoding=String(req?.headers?.['content-encoding']||'identity').trim().toLowerCase();
  if(encoding==='identity')return readJson(req,{limit:SITE_PUBLISH_MAX_JSON_BYTES_01609C});
  if(encoding!=='gzip')throw error01609C('Unsupported publish content encoding',415,'ST_PUBLISH_ENCODING_UNSUPPORTED_01609C');
  const sizeHint=Number(req?.headers?.['content-length']||0);
  if(sizeHint>SITE_PUBLISH_MAX_GZIP_BYTES_01609C)throw error01609C('Compressed publish payload too large',413,'ST_PUBLISH_COMPRESSED_TOO_LARGE_01609C');
  const compressed=await readBuffer(req,{limit:SITE_PUBLISH_MAX_GZIP_BYTES_01609C});
  let decoded;
  try {decoded=gunzipSync(compressed,{maxOutputLength:SITE_PUBLISH_MAX_JSON_BYTES_01609C});}
  catch(e){
    if(e?.code==='ERR_BUFFER_TOO_LARGE')throw error01609C('Uncompressed publish payload too large',413,'ST_PUBLISH_UNCOMPRESSED_TOO_LARGE_01609C');
    throw error01609C('Invalid compressed publish payload',400,'ST_PUBLISH_GZIP_INVALID_01609C');
  }
  try{return JSON.parse(decoded.toString('utf8'));}
  catch{throw error01609C('Invalid publish JSON body',400,'ST_PUBLISH_JSON_INVALID_01609C');}
}
