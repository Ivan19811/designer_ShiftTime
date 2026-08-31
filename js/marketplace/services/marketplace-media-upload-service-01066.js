// 01066 · Computer-file → Media Library upload orchestration.
// UI never touches CacheStorage. It talks only to this service + MediaAssetRepository contract.
function str(v){return String(v??'').trim();}
function arr(v){return Array.from(v||[]).filter(Boolean);}
function kindFromFile(file){const t=str(file?.type).toLowerCase();if(t.startsWith('image/'))return'image';if(t.startsWith('video/'))return'video';return'document';}
function altFromName(name){return str(name).replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();}
async function sha256(file){try{if(!crypto?.subtle)return'';const buf=await file.arrayBuffer();const out=await crypto.subtle.digest('SHA-256',buf);return [...new Uint8Array(out)].map(b=>b.toString(16).padStart(2,'0')).join('');}catch{return'';}}
async function imageDimensions(file){if(!str(file?.type).startsWith('image/'))return {width:0,height:0};try{if('createImageBitmap'in window){const bmp=await createImageBitmap(file);const d={width:bmp.width||0,height:bmp.height||0};bmp.close?.();return d;}}catch{}return {width:0,height:0};}
function validateFile(file,{imagesOnly=false,maxBytes=60*1024*1024}={}){if(!(file instanceof File))return'Некоректний файл.';if(imagesOnly&&!str(file.type).startsWith('image/'))return`«${file.name}» не є зображенням.`;if(file.size>maxBytes)return`«${file.name}» завеликий (${Math.ceil(file.size/1024/1024)} MB). Ліміт ${Math.round(maxBytes/1024/1024)} MB.`;return'';}

export class MarketplaceMediaUploadService01066{
  constructor({store,mediaService,assetRepository}={}){if(!store||!mediaService||!assetRepository)throw new Error('MarketplaceMediaUploadService01066 requires store/mediaService/assetRepository');this.store=store;this.mediaService=mediaService;this.assetRepository=assetRepository;}
  getInfo(){return this.assetRepository.getInfo?.()||{};}
  canUpload(){return !!this.assetRepository.canUpload?.();}
  async uploadFiles(files,options={}){
    const list=arr(files).slice(0,100),results=[],errors=[];if(!list.length)return {media:[],results,errors,reused:0,created:0};
    if(!this.canUpload())throw new Error('Поточний MediaAssetRepository не підтримує upload з комп’ютера.');
    const onProgress=typeof options.onProgress==='function'?options.onProgress:()=>{};
    let index=0;
    for(const file of list){
      index++;onProgress({index,total:list.length,file,state:'reading'});
      try{
        const invalid=validateFile(file,options);if(invalid)throw new Error(invalid);
        const assetHash=await sha256(file);
        const existing=assetHash?this.store.getMedia().find(m=>m?.metadata?.assetHash===assetHash&&Number(m?.metadata?.size||0)===Number(file.size||0)):null;
        if(existing){results.push({file,media:existing,reused:true});onProgress({index,total:list.length,file,state:'reused',media:existing});continue;}
        const kind=kindFromFile(file),dims=await imageDimensions(file);
        onProgress({index,total:list.length,file,state:'uploading'});
        const ref=await this.assetRepository.upload(file,{kind,width:dims.width,height:dims.height,productId:str(options.productId),metadata:{folder:str(options.folder),source:'computer-upload-01066',assetHash,size:Number(file.size)||0}});
        let media=null;
        try{
          const baseAlt=str(options.altBase)||altFromName(file.name);const ordinal=Number(options.altOrdinalStart||0)+results.filter(r=>!r.error).length;
          media=await this.mediaService.createMedia({kind,url:ref.url,fileName:ref.fileName,mime:ref.mime,alt:baseAlt?(ordinal>0&&options.numberAlt?`${baseAlt} · фото ${ordinal+1}`:baseAlt):altFromName(file.name),width:dims.width,height:dims.height,folder:str(options.folder),tags:options.tags||[],metadata:{...(ref.metadata||{}),assetHash,size:Number(file.size)||0,source:'computer-upload-01066'}});
        }catch(err){try{await this.assetRepository.deleteAsset({url:ref.url,metadata:ref.metadata});}catch{}throw err;}
        results.push({file,media,reused:false});onProgress({index,total:list.length,file,state:'done',media});
      }catch(err){const row={file,error:err?.message||String(err)};errors.push(row);results.push(row);onProgress({index,total:list.length,file,state:'error',error:row.error});}
    }
    const media=results.map(r=>r.media).filter(Boolean);return {media,results,errors,reused:results.filter(r=>r.reused).length,created:results.filter(r=>r.media&&!r.reused).length};
  }
}
export function createMarketplaceMediaUploadService01066(options){return new MarketplaceMediaUploadService01066(options);}
