// 01613D3 · Draft slots are stable identifiers, not a fixed quota.
// PostgreSQL uses signed int4; refuse only when the physical key space is exhausted.
export function nextFreeDraftSlot01613D3(rows=[]) {
 const used=new Set((Array.isArray(rows)?rows:[]).map(row=>Number(row?.slot)).filter(n=>Number.isSafeInteger(n)&&n>0));
 let next=1;
 while(used.has(next))next++;
 if(next>2147483647){const e=new Error('ST_DRAFT_SLOT_EXHAUSTED_01613D3');e.code='ST_DRAFT_SLOT_EXHAUSTED_01613D3';e.statusCode=409;throw e;}
 return next;
}
