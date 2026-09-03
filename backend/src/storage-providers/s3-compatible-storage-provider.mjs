// 01081 · R2/S3 adapter. Credentials remain backend-only.
import {S3Client,HeadObjectCommand,DeleteObjectCommand,GetObjectCommand,PutObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {STORAGE_PROVIDER_CONTRACT_VERSION_01081} from '../storage-provider-contract.mjs';
function str(v){return String(v??'').trim();}
function cleanBase(v){return str(v).replace(/\/+$/,'');}
function encodedPath(key){return str(key).split('/').map(x=>encodeURIComponent(x)).join('/');}
export class S3CompatibleStorageProvider01081{
  constructor(options={}){this.name='S3CompatibleStorageProvider01081';this.type=options.providerType||'s3-compatible';this.contractVersion=STORAGE_PROVIDER_CONTRACT_VERSION_01081;this.bucket=str(options.bucket);this.region=str(options.region)||'auto';this.endpoint=cleanBase(options.endpoint);this.accessKeyId=str(options.accessKeyId);this.secretAccessKey=str(options.secretAccessKey);this.publicBaseUrl=cleanBase(options.publicBaseUrl);this.uploadExpiresIn=Math.max(60,Math.min(3600,Number(options.uploadExpiresIn)||900));this.downloadExpiresIn=Math.max(60,Math.min(604800,Number(options.downloadExpiresIn)||3600));this.forcePathStyle=!!options.forcePathStyle;this._client=null;}
  isConfigured(){return !!(this.bucket&&this.accessKeyId&&this.secretAccessKey&&(this.type==='s3'||this.endpoint));}
  client(){if(!this.isConfigured())throw Object.assign(new Error('Cloud media storage is not configured on backend.'),{statusCode:503});if(!this._client){const options={region:this.region,forcePathStyle:this.forcePathStyle,credentials:{accessKeyId:this.accessKeyId,secretAccessKey:this.secretAccessKey}};if(this.endpoint)options.endpoint=this.endpoint;this._client=new S3Client(options);}return this._client;}
  getInfo(){return {type:this.type,name:this.name,contractVersion:this.contractVersion,configured:this.isConfigured(),bucket:this.bucket||'',region:this.region,endpointHost:this.endpoint?new URL(this.endpoint).host:'',publicDelivery:!!this.publicBaseUrl,uploadExpiresIn:this.uploadExpiresIn,downloadExpiresIn:this.downloadExpiresIn};}
  publicUrl(key){return this.publicBaseUrl?`${this.publicBaseUrl}/${encodedPath(key)}`:'';}
  async createUploadUrl({key,mimeType='application/octet-stream'}={}){const url=await getSignedUrl(this.client(),new PutObjectCommand({Bucket:this.bucket,Key:key,ContentType:mimeType}),{expiresIn:this.uploadExpiresIn});return {url,method:'PUT',headers:{'Content-Type':mimeType},expiresIn:this.uploadExpiresIn};}
  async putObject({key,body,mimeType='application/octet-stream'}={}){const out=await this.client().send(new PutObjectCommand({Bucket:this.bucket,Key:key,ContentType:mimeType,Body:body}));return {etag:str(out?.ETag).replace(/^"|"$/g,'')};}
  async headObject({key}={}){const out=await this.client().send(new HeadObjectCommand({Bucket:this.bucket,Key:key}));return {sizeBytes:Number(out.ContentLength)||0,mimeType:str(out.ContentType)||'application/octet-stream',etag:str(out.ETag).replace(/^"|"$/g,''),lastModified:out.LastModified?.toISOString?.()||'',metadata:out.Metadata||{}};}
  async createReadUrl({key}={}){const publicUrl=this.publicUrl(key);if(publicUrl)return {url:publicUrl,public:true,expiresIn:0};const url=await getSignedUrl(this.client(),new GetObjectCommand({Bucket:this.bucket,Key:key}),{expiresIn:this.downloadExpiresIn});return {url,public:false,expiresIn:this.downloadExpiresIn};}
  async deleteObject({key}={}){await this.client().send(new DeleteObjectCommand({Bucket:this.bucket,Key:key}));return {deleted:true};}
}
export function createS3CompatibleStorageProvider01081(options){return new S3CompatibleStorageProvider01081(options);}
