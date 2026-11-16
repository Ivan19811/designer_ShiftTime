// 01623K: pure invariant for a ONE-revision delete operation.
// The application only COMMITs when it affects the one selected revision and
// leaves the parent site + project untouched. Input counts come from PostgreSQL.
export function checkRevisionDeleteScope01623K(before,after,{archived=false}={}){
  if(!before||!after)return false;
  const n=(obj,key)=>Number(obj[key]);
  return n(before,'site_count')===1 && n(after,'site_count')===1 &&
    n(before,'project_count')===n(after,'project_count') &&
    n(after,'total')===n(before,'total')-(archived?0:1) &&
    n(after,'drafts')===n(before,'drafts')-1 &&
    n(after,'archived')===n(before,'archived')+(archived?1:0) &&
    n(before,'target')===1 && n(after,'target')===(archived?1:0);
}
