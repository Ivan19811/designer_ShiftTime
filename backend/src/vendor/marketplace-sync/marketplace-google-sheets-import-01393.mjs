// 01393 · Google Sheets public/link-shared source adapter for Marketplace Import.
// Transport only: Google Sheets -> CSV staging source. No Marketplace mutation here.
import {parseDelimitedText01060} from './marketplace-import-parsers-01060.mjs';

export const MARKETPLACE_GOOGLE_SHEETS_STAGE_01393='01393';
export const GOOGLE_SHEETS_URL_INVALID_01393='GOOGLE_SHEETS_URL_INVALID_01393';
export const GOOGLE_SHEETS_ACCESS_DENIED_01393='GOOGLE_SHEETS_ACCESS_DENIED_01393';
export const GOOGLE_SHEETS_FETCH_FAILED_01393='GOOGLE_SHEETS_FETCH_FAILED_01393';
export const GOOGLE_SHEETS_HTML_RESPONSE_01393='GOOGLE_SHEETS_HTML_RESPONSE_01393';
export const GOOGLE_SHEETS_EMPTY_01393='GOOGLE_SHEETS_EMPTY_01393';

function str(v){return String(v??'').trim();}
function fail(code,detail=''){const error=new Error(code);error.code=code;error.detail=str(detail);throw error;}
function cleanText(v,max=180){return str(v).replace(/[\r\n\t]+/g,' ').slice(0,max);}
function asUrl(raw){try{return new URL(str(raw));}catch{return null;}}
function safeGid(value){const v=str(value);return /^\d+$/.test(v)?v:'';}
function safeRange(value){const v=str(value).replace(/\s+/g,'');return /^[A-Za-z]+\d*(?::[A-Za-z]+\d*)?$/.test(v)?v:'';}
function safeSheetName(value){return str(value).slice(0,120);}

export function parseGoogleSheetsReference01393(rawUrl,{gid='',sheetName='',range=''}={}){
  const url=asUrl(rawUrl);if(!url||!/(^|\.)docs\.google\.com$/i.test(url.hostname))fail(GOOGLE_SHEETS_URL_INVALID_01393);
  const parts=url.pathname.split('/').filter(Boolean);const sheetIndex=parts.indexOf('spreadsheets');if(sheetIndex<0||parts[sheetIndex+1]!=='d')fail(GOOGLE_SHEETS_URL_INVALID_01393);
  const marker=parts[sheetIndex+2],next=parts[sheetIndex+3];let spreadsheetId='',publishedId='',published=false;
  if(marker==='e'&&next){published=true;publishedId=next;}else if(marker){spreadsheetId=marker;}else fail(GOOGLE_SHEETS_URL_INVALID_01393);
  const hashParams=new URLSearchParams(String(url.hash||'').replace(/^#/,''));
  const queryGid=url.searchParams.get('gid')||hashParams.get('gid')||'';
  const querySheet=url.searchParams.get('sheet')||'';
  const queryRange=url.searchParams.get('range')||'';
  const resolvedGid=safeGid(gid)||safeGid(queryGid);
  const resolvedSheetName=safeSheetName(sheetName)||safeSheetName(querySheet);
  const resolvedRange=safeRange(range)||safeRange(queryRange);
  const canonicalUrl=published
    ?`https://docs.google.com/spreadsheets/d/e/${publishedId}/pubhtml${resolvedGid?`?gid=${encodeURIComponent(resolvedGid)}`:''}`
    :`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit${resolvedGid?`#gid=${encodeURIComponent(resolvedGid)}`:''}`;
  return {kind:'google-sheets',spreadsheetId,publishedId,published,gid:resolvedGid,sheetName:resolvedSheetName,range:resolvedRange,canonicalUrl};
}

export function buildGoogleSheetsCsvUrl01393(reference){
  const ref=typeof reference==='string'?parseGoogleSheetsReference01393(reference):reference||{};
  if(ref.published){
    if(!str(ref.publishedId))fail(GOOGLE_SHEETS_URL_INVALID_01393);
    const out=new URL(`https://docs.google.com/spreadsheets/d/e/${encodeURIComponent(ref.publishedId)}/pub`);out.searchParams.set('output','csv');
    if(ref.gid)out.searchParams.set('gid',safeGid(ref.gid));if(ref.range)out.searchParams.set('range',safeRange(ref.range));return out.toString();
  }
  if(!str(ref.spreadsheetId))fail(GOOGLE_SHEETS_URL_INVALID_01393);
  const out=new URL(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(ref.spreadsheetId)}/gviz/tq`);out.searchParams.set('tqx','out:csv');
  if(ref.gid)out.searchParams.set('gid',safeGid(ref.gid));else if(ref.sheetName)out.searchParams.set('sheet',safeSheetName(ref.sheetName));if(ref.range)out.searchParams.set('range',safeRange(ref.range));return out.toString();
}

export function googleSheetsSourceConfig01393(reference){
  const ref=reference||{};return {kind:'google-sheets',spreadsheetId:str(ref.spreadsheetId),publishedId:str(ref.publishedId),published:Boolean(ref.published),gid:safeGid(ref.gid),sheetName:safeSheetName(ref.sheetName),range:safeRange(ref.range),canonicalUrl:str(ref.canonicalUrl)};
}

export function googleSheetsSourceLabel01393(reference){
  const ref=reference||{},id=str(ref.spreadsheetId||ref.publishedId),tail=id.length>12?id.slice(-12):id;return `Google Sheets${tail?` · ${tail}`:''}${ref.sheetName?` · ${safeSheetName(ref.sheetName)}`:''}${ref.gid?` · gid ${safeGid(ref.gid)}`:''}`;
}

export async function fetchGoogleSheet01393(rawUrl,options={}){
  const fetchFn=options.fetchFn||globalThis.fetch;if(typeof fetchFn!=='function')fail(GOOGLE_SHEETS_FETCH_FAILED_01393,'fetch unavailable');
  const reference=parseGoogleSheetsReference01393(rawUrl,options),csvUrl=buildGoogleSheetsCsvUrl01393(reference);let response;
  try{response=await fetchFn(csvUrl,{method:'GET',credentials:'omit',redirect:'follow',headers:{Accept:'text/csv,text/plain;q=0.9,*/*;q=0.1'}});}catch(error){fail(GOOGLE_SHEETS_FETCH_FAILED_01393,error?.message||'network');}
  if(!response?.ok){const status=Number(response?.status)||0;if(status===401||status===403)fail(GOOGLE_SHEETS_ACCESS_DENIED_01393,String(status));fail(GOOGLE_SHEETS_FETCH_FAILED_01393,String(status||'HTTP'));}
  const contentType=str(response.headers?.get?.('content-type')).toLowerCase();const text=await response.text();const start=text.trimStart().slice(0,220).toLowerCase();
  if(contentType.includes('text/html')||start.startsWith('<!doctype html')||start.startsWith('<html')||start.includes('<title>sign in'))fail(GOOGLE_SHEETS_HTML_RESPONSE_01393,cleanText(start));
  const parsed=parseDelimitedText01060(text);if(!parsed.headers?.length||!parsed.rows?.length)fail(GOOGLE_SHEETS_EMPTY_01393);
  return {...parsed,format:'google-sheets',sourceKind:'google-sheets',sourceName:googleSheetsSourceLabel01393(reference),sourceConfig:googleSheetsSourceConfig01393(reference),googleSheets:{...googleSheetsSourceConfig01393(reference),csvUrl},sourceRows:parsed.rows.length};
}
