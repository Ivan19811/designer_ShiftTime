// 01544 · Preliminary NP quote. Pure validation + server-only upstream request.
// No buyer details, keys or bearer credentials are returned/logged.
const ENDPOINT='https://api.novaposhta.ua/v2.0/json/';
const refPattern=/^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/;
const fail=(code,statusCode=400)=>Object.assign(new Error(code),{statusCode});
export const isNovaPoshtaRef01544=value=>refPattern.test(String(value??'').trim());
export function normalizeQuoteProfile01544(value={}){
  const senderCityRef=String(value.senderCityRef??'').trim(),senderCityName=String(value.senderCityName??'').trim();
  const weight=Number(value.sampleParcelWeightKg),seats=Number(value.sampleSeats);
  if(!isNovaPoshtaRef01544(senderCityRef)||senderCityName.length<2||senderCityName.length>120||/[<>\u0000-\u001f]/u.test(senderCityName))throw fail('NP_QUOTE_SENDER_INVALID_01544');
  if(!Number.isFinite(weight)||weight<=0||weight>1000||Math.abs(Math.round(weight*1000)-weight*1000)>0.00001)throw fail('NP_QUOTE_WEIGHT_INVALID_01544');
  if(!Number.isInteger(seats)||seats<1||seats>100)throw fail('NP_QUOTE_SEATS_INVALID_01544');
  return {senderCityRef,senderCityName,sampleParcelWeightKg:weight,sampleSeats:seats,enabled:value.enabled!==false};
}
export function normalizeQuoteRequest01544(value={}){
  const cityRecipient=String(value.cityRecipient??'').trim(),warehouseRef=String(value.warehouseRef??'').trim(),declaredValue=Number(value.declaredValue);
  if(!isNovaPoshtaRef01544(cityRecipient)||!isNovaPoshtaRef01544(warehouseRef))throw fail('NP_QUOTE_RECIPIENT_INVALID_01544');
  if(!Number.isFinite(declaredValue)||declaredValue<1||declaredValue>10000000||Math.abs(Math.round(declaredValue*100)-declaredValue*100)>0.00001)throw fail('NP_QUOTE_COST_INVALID_01544');
  return {cityRecipient,warehouseRef,declaredValue:Math.round(declaredValue*100)/100};
}
export async function requestNovaPoshtaQuote01544(profile,request,{fetchImpl=globalThis.fetch,key=process.env.NP_API_KEY,timeoutMs=11000}={}){
  const sender=normalizeQuoteProfile01544(profile),recipient=normalizeQuoteRequest01544(request);
  if(!String(key||'').trim())throw fail('NP_API_NOT_CONFIGURED_01542',503);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetchImpl(ENDPOINT,{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({apiKey:key,modelName:'InternetDocument',calledMethod:'getDocumentPrice',methodProperties:{CitySender:sender.senderCityRef,CityRecipient:recipient.cityRecipient,Weight:sender.sampleParcelWeightKg,ServiceType:'WarehouseWarehouse',Cost:recipient.declaredValue,CargoType:'Cargo',SeatsAmount:sender.sampleSeats}}),signal:controller.signal});
    if(!response?.ok)throw fail('NP_QUOTE_UPSTREAM_UNAVAILABLE_01544',502);
    const data=await response.json();
    const cost=Number(data?.data?.[0]?.Cost);
    if(data?.success!==true||!Array.isArray(data?.data)||!Number.isFinite(cost)||cost<=0||cost>1000000)throw fail('NP_QUOTE_PROVIDER_ERROR_01544',502);
    return {provider:'nova-poshta',currency:'UAH',price:Math.round(cost*100)/100,estimated:true,final:false,canPlaceOrder:false,stage:'01544'};
  }catch(error){if(error?.statusCode)throw error;throw fail('NP_QUOTE_UPSTREAM_UNAVAILABLE_01544',502);}finally{clearTimeout(timer);}
}
