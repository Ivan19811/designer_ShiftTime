// 01398 · Pure helpers for private Google Sheets OAuth integration.
const str=value=>String(value??'').trim();
export function normalizeGoogleSheetValues01398(values=[]){
  const rows=Array.isArray(values)?values:[];
  if(!rows.length)return {headers:[],rows:[]};
  const width=Math.max(...rows.map(row=>Array.isArray(row)?row.length:0),0),used=new Map();
  const headers=Array.from({length:width},(_,index)=>{
    const base=str(rows[0]?.[index])||`Column ${index+1}`,key=base.toLowerCase(),n=(used.get(key)||0)+1;
    used.set(key,n);
    return n===1?base:`${base} ${n}`;
  });
  const out=rows.slice(1)
    .filter(row=>Array.isArray(row)&&row.some(value=>str(value)!==''))
    .map(row=>Object.fromEntries(headers.map((header,index)=>[header,row?.[index]??''])));
  return {headers,rows:out};
}
