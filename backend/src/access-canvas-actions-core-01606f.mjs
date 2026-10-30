// Dedicated secondary 01606F grants; previous site-scoped 01600 gate remains mandatory.
export const CANVAS_ACTION_CODES_01606F=Object.freeze(['create','update','move','delete'].map(x=>`site.design.canvas.${x}`));
export function classifyCanvasRoute01606F(method,parts){
  return method==='POST'&&Array.isArray(parts)&&parts.length===5&&parts[0]==='api'&&parts[1]==='v1'&&parts[2]==='sites'&&!!parts[3]&&parts[4]==='canvas';
}
export function assertCanvasActions01606F(decision,operations){
  if(decision?.mode!=='custom')return true;
  const grants=new Set(Array.isArray(decision.permissions)?decision.permissions:[]);
  if(!grants.has('api.mode.site_actions')&&!grants.has('ui.mode.controls'))return true;
  for(const type of new Set(operations.map(op=>op.type))){
    const permission=`site.design.canvas.${type}`;
    if(!grants.has(permission))throw Object.assign(new Error('ST_CANVAS_ACTION_DENIED_01606F'),{code:'ST_CANVAS_ACTION_DENIED_01606F',statusCode:403,permission});
  }
  return true;
}
