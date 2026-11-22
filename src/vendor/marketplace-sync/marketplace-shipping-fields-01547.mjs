// 01547 · Canonical delivery fields for products and their individual variations.
const props=Object.freeze(['lengthCm','widthCm','heightCm','weightKg']);
export const DELIVERY_FIELDS_01547=props;
export function parseDeliveryBoolean01547(value){
  if(typeof value==='boolean')return value;
  return ['1','true','yes','так','так / так'].includes(String(value??'').trim().toLowerCase());
}
export function normalizeDelivery01547(input){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const result={};
  for(const key of props){
    const raw=input[key];
    if(raw===null||raw===undefined||String(raw).trim()===''){result[key]=null;continue;}
    const n=Number(String(raw).replace(',','.'));
    const maximum=key==='weightKg'?1000:300;
    const places=key==='weightKg'?3:1;
    result[key]=Number.isFinite(n)&&n>0&&n<=maximum&&Math.abs(n*10**places-Math.round(n*10**places))<0.00001?n:null;
  }
  result.separatePackage=parseDeliveryBoolean01547(input.separatePackage);
  result.calculateDelivery=parseDeliveryBoolean01547(input.calculateDelivery);
  return result;
}
export function updateDeliveryField01547(current,key,value){
  if(![...props,'separatePackage','calculateDelivery'].includes(key))throw new Error('SHIPPING_FIELD_UNKNOWN_01547');
  const draft={...(normalizeDelivery01547(current)||{})};draft[key]=value;
  if(props.includes(key)&&value!==null&&String(value).trim()!==''){
    const n=Number(String(value).replace(',','.')),maximum=key==='weightKg'?1000:300,places=key==='weightKg'?3:1;
    if(!Number.isFinite(n)||n<=0||n>maximum||Math.abs(n*10**places-Math.round(n*10**places))>0.00001)throw new Error('SHIPPING_FIELD_INVALID_01547');
  }
  return normalizeDelivery01547(draft);
}
