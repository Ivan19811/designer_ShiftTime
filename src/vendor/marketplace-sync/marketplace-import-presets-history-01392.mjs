// 01392 · Mapping Presets + unified Import/Export History helpers.
// Pure helpers only. Persistence remains MarketplaceStore -> Repository/API -> DB.
export const MARKETPLACE_IMPORT_PRESET_HISTORY_STAGE_01392='01392';
export const MARKETPLACE_IMPORT_PROFILE_SCHEMA_01392='marketplace-import-profile-v2-01392';
export const MARKETPLACE_TRANSFER_HISTORY_SCHEMA_01392='marketplace-transfer-history-v1-01392';

function str(v){return String(v??'').trim();}
function arr(v){return Array.isArray(v)?v:[];}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}
function norm(v){return str(v).toLocaleLowerCase('uk-UA').normalize('NFKD').replace(/[’'`]/g,'').replace(/[_./\\-]+/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();}
function now(){return new Date().toISOString();}
function uid(prefix){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;}
export function sanitizeImportSourceConfig01398(value={}){const cfg=obj(value),kind=str(cfg.kind);if(kind!=='google-sheets')return {...cfg};const accessMode=['auto','public','oauth'].includes(str(cfg.accessMode).toLowerCase())?str(cfg.accessMode).toLowerCase():'auto';return {kind:'google-sheets',spreadsheetId:str(cfg.spreadsheetId),publishedId:str(cfg.publishedId),published:!!cfg.published,gid:str(cfg.gid),sheetName:str(cfg.sheetName),range:str(cfg.range),canonicalUrl:str(cfg.canonicalUrl),accessMode,credentialId:str(cfg.credentialId)};}

export function buildImportHeaderSignature01392(headers=[]){
  return arr(headers).map(norm).filter(Boolean).sort().join('|');
}

export function normalizeImportProfile01392(profile={}){
  const headers=arr(profile.sourceHeaders).map(str).filter(Boolean);
  const mapping={...obj(profile.mapping)};
  const options={...obj(profile.options)};
  return {
    ...profile,
    id:str(profile.id)||uid('map'),
    schema:profile.schema||MARKETPLACE_IMPORT_PROFILE_SCHEMA_01392,
    name:str(profile.name),
    supplierName:str(profile.supplierName),
    entity:str(profile.entity)||'products',
    format:str(profile.format).toLowerCase(),
    rowMode:options.rowMode==='variants'?'variants':'products',
    mapping,
    sourceHeaders:headers,
    headerSignature:str(profile.headerSignature)||buildImportHeaderSignature01392(headers),
    mappedCount:Number.isFinite(Number(profile.mappedCount))?Number(profile.mappedCount):Object.values(mapping).filter(Boolean).length,
    usageCount:Number.isFinite(Number(profile.usageCount))?Number(profile.usageCount):0,
    lastUsedAt:str(profile.lastUsedAt),
    createdAt:str(profile.createdAt)||str(profile.updatedAt)||now(),
    updatedAt:str(profile.updatedAt)||now(),
    sourceConfig:sanitizeImportSourceConfig01398(profile.sourceConfig),
    options
  };
}

export function profileCompatibility01392(profile,{headers=[],format='',rowMode='products'}={}){
  const p=normalizeImportProfile01392(profile),incoming=arr(headers).map(norm).filter(Boolean),incomingSet=new Set(incoming),saved=arr(p.sourceHeaders).map(norm).filter(Boolean);
  if(!saved.length||!incoming.length)return {score:0,exact:false,matched:0,total:Math.max(saved.length,incoming.length),formatMatch:false,rowModeMatch:false};
  let matched=0;for(const h of saved)if(incomingSet.has(h))matched++;
  const union=new Set([...saved,...incoming]).size||1,headerScore=matched/union,formatMatch=!p.format||!format||p.format===str(format).toLowerCase(),rowModeMatch=!p.rowMode||p.rowMode===rowMode;
  const exact=p.headerSignature===buildImportHeaderSignature01392(headers)&&formatMatch&&rowModeMatch;
  const score=Math.min(1,headerScore*.78+(formatMatch?0.12:0)+(rowModeMatch?0.10:0));
  return {score,exact,matched,total:union,formatMatch,rowModeMatch};
}

export function rankImportProfiles01392(profiles=[],context={}){
  return arr(profiles).map(profile=>({profile:normalizeImportProfile01392(profile),compatibility:profileCompatibility01392(profile,context)})).sort((a,b)=>Number(b.compatibility.exact)-Number(a.compatibility.exact)||b.compatibility.score-a.compatibility.score||Date.parse(b.profile.lastUsedAt||b.profile.updatedAt||0)-Date.parse(a.profile.lastUsedAt||a.profile.updatedAt||0));
}

export function bestImportProfile01392(profiles=[],context={},minimum=.55){
  const ranked=rankImportProfiles01392(profiles,context),best=ranked[0];return best&&best.compatibility.score>=minimum?best:null;
}

export function markImportProfileUsed01392(profiles=[],profileId,at=now()){
  return arr(profiles).map(raw=>{const p=normalizeImportProfile01392(raw);return p.id===profileId?{...p,usageCount:p.usageCount+1,lastUsedAt:at,updatedAt:at}:p;});
}

function legacyImportEntry01392(h={}){
  return {
    ...h,
    id:str(h.id)||uid('import'),schema:MARKETPLACE_TRANSFER_HISTORY_SCHEMA_01392,kind:'import',status:str(h.status)||'success',
    at:str(h.at)||now(),completedAt:str(h.completedAt)||str(h.at)||now(),sourceName:str(h.sourceName)||'Import',format:str(h.format).toLowerCase(),
    profileId:str(h.profileId),profileName:str(h.profileName),rowMode:h.variantRows?'variants':str(h.rowMode)||'products',rows:Number(h.rows)||0,
    productsCreated:Number(h.productsCreated??h.created)||0,productsUpdated:Number(h.productsUpdated??h.updated)||0,
    variantsCreated:Number(h.variantsCreated)||0,variantsUpdated:Number(h.variantsUpdated)||0,skipped:Number(h.skipped)||0,errors:Number(h.errors)||0,
    mediaCreated:Number(h.mediaCreated)||0,mediaReused:Number(h.mediaReused)||0,fieldChanges:Number(h.fieldChanges??h.diffFieldChanges)||0,
    changedUpdates:Number(h.changedUpdates??h.diffChangedUpdates)||0,unchangedUpdates:Number(h.unchangedUpdates??h.diffUnchangedUpdates)||0,
    durationMs:Number(h.durationMs)||0,sourceKind:str(h.sourceKind),sourceRef:str(h.sourceRef),sheetGid:str(h.sheetGid),sheetName:str(h.sheetName),sheetRange:str(h.sheetRange),sheetAccessMode:str(h.sheetAccessMode),googleCredentialId:str(h.googleCredentialId),xmlItemPath:str(h.xmlItemPath),supplierSourceId:str(h.supplierSourceId),syncMode:str(h.syncMode),mediaCopied:Number(h.mediaCopied)||0,mediaCopyReused:Number(h.mediaCopyReused)||0,mediaExternal:Number(h.mediaExternal)||0,mediaCopySourceBytes:Number(h.mediaCopySourceBytes)||0,mediaCopyStoredBytes:Number(h.mediaCopyStoredBytes)||0,mediaCopySavedBytes:Number(h.mediaCopySavedBytes)||0,errorCode:str(h.errorCode),errorMessage:str(h.errorMessage)
  };
}

export function createTransferHistoryEntry01392(input={}){
  const kind=input.kind==='export'?'export':input.kind==='restore'?'restore':'import',at=str(input.at)||now(),completedAt=str(input.completedAt)||now();
  return {
    id:str(input.id)||uid(kind),schema:MARKETPLACE_TRANSFER_HISTORY_SCHEMA_01392,kind,status:str(input.status)||'success',at,completedAt,
    durationMs:Math.max(0,Number(input.durationMs)||0),sourceName:str(input.sourceName),format:str(input.format).toLowerCase(),
    profileId:str(input.profileId),profileName:str(input.profileName),rowMode:input.rowMode==='variants'?'variants':'products',rows:Number(input.rows)||0,
    productsCreated:Number(input.productsCreated)||0,productsUpdated:Number(input.productsUpdated)||0,variantsCreated:Number(input.variantsCreated)||0,variantsUpdated:Number(input.variantsUpdated)||0,
    skipped:Number(input.skipped)||0,errors:Number(input.errors)||0,mediaCreated:Number(input.mediaCreated)||0,mediaReused:Number(input.mediaReused)||0,
    fieldChanges:Number(input.fieldChanges)||0,changedUpdates:Number(input.changedUpdates)||0,unchangedUpdates:Number(input.unchangedUpdates)||0,
    exportRows:Number(input.exportRows)||0,exportProducts:Number(input.exportProducts)||0,exportVariants:Number(input.exportVariants)||0,fileName:str(input.fileName),
    sourceKind:str(input.sourceKind),sourceRef:str(input.sourceRef),sheetGid:str(input.sheetGid),sheetName:str(input.sheetName),sheetRange:str(input.sheetRange),sheetAccessMode:str(input.sheetAccessMode),googleCredentialId:str(input.googleCredentialId),xmlItemPath:str(input.xmlItemPath),supplierSourceId:str(input.supplierSourceId),syncMode:str(input.syncMode),
    mediaCopied:Number(input.mediaCopied)||0,mediaCopyReused:Number(input.mediaCopyReused)||0,mediaExternal:Number(input.mediaExternal)||0,mediaCopySourceBytes:Number(input.mediaCopySourceBytes)||0,mediaCopyStoredBytes:Number(input.mediaCopyStoredBytes)||0,mediaCopySavedBytes:Number(input.mediaCopySavedBytes)||0,
    rollbackAvailable01397:!!input.rollbackAvailable01397,rollbackStatus01397:str(input.rollbackStatus01397),rolledBackAt01397:str(input.rolledBackAt01397),rollbackJobId01397:str(input.rollbackJobId01397),rollbackOf01397:str(input.rollbackOf01397),rollbackSummary01397:{...obj(input.rollbackSummary01397)},rollbackAssetsDeleted01397:Number(input.rollbackAssetsDeleted01397)||0,rollbackAssetsFailed01397:Number(input.rollbackAssetsFailed01397)||0,
    errorCode:str(input.errorCode),errorMessage:str(input.errorMessage)
  };
}

export function getTransferHistory01392(state){
  const modern=arr(state?.settings?.importExportHistory).filter(x=>x&&typeof x==='object').map(createTransferHistoryEntry01392);
  const legacy=arr(state?.settings?.importHistory).filter(x=>x&&typeof x==='object').map(legacyImportEntry01392);
  const byId=new Map();for(const entry of [...modern,...legacy])if(entry.id&&!byId.has(entry.id))byId.set(entry.id,entry);
  return [...byId.values()].sort((a,b)=>Date.parse(b.at||0)-Date.parse(a.at||0));
}

export function prependTransferHistory01392(state,entry,limit=100){
  const normalized=createTransferHistoryEntry01392(entry),history=getTransferHistory01392(state).filter(x=>x.id!==normalized.id),settings={...obj(state.settings),importExportHistory:[normalized,...history].slice(0,Math.max(1,limit))};
  if(normalized.kind==='import'){
    const legacy={id:normalized.id,at:normalized.at,sourceName:normalized.sourceName,format:normalized.format,profileId:normalized.profileId,profileName:normalized.profileName,rows:normalized.rows,created:normalized.productsCreated,updated:normalized.productsUpdated,skipped:normalized.skipped,errors:normalized.errors,variantRows:normalized.rowMode==='variants',variantsCreated:normalized.variantsCreated,variantsUpdated:normalized.variantsUpdated,mediaCreated:normalized.mediaCreated,mediaReused:normalized.mediaReused,diffFieldChanges:normalized.fieldChanges,diffChangedUpdates:normalized.changedUpdates,diffUnchangedUpdates:normalized.unchangedUpdates,status:normalized.status,durationMs:normalized.durationMs,sourceKind:normalized.sourceKind,sourceRef:normalized.sourceRef,sheetGid:normalized.sheetGid,sheetName:normalized.sheetName,sheetRange:normalized.sheetRange,sheetAccessMode:normalized.sheetAccessMode,googleCredentialId:normalized.googleCredentialId,xmlItemPath:normalized.xmlItemPath,supplierSourceId:normalized.supplierSourceId,syncMode:normalized.syncMode,mediaCopied:normalized.mediaCopied,mediaCopyReused:normalized.mediaCopyReused,mediaExternal:normalized.mediaExternal,mediaCopySourceBytes:normalized.mediaCopySourceBytes,mediaCopyStoredBytes:normalized.mediaCopyStoredBytes,mediaCopySavedBytes:normalized.mediaCopySavedBytes,errorCode:normalized.errorCode,errorMessage:normalized.errorMessage};
    settings.importHistory=[legacy,...arr(settings.importHistory).filter(x=>x?.id!==legacy.id)].slice(0,30);
  }
  state.settings=settings;return normalized;
}

export function filterTransferHistory01392(history=[],filter='all'){
  const key=str(filter)||'all';if(key==='all')return arr(history);if(key==='import'||key==='export'||key==='restore')return arr(history).filter(x=>x.kind===key);if(key==='success')return arr(history).filter(x=>x.status==='success');if(key==='issues')return arr(history).filter(x=>x.status!=='success');return arr(history);
}
