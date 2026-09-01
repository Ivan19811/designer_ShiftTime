// 01091 · Marketplace context/status DOM parity helpers.
// Pure status resolution stays separate from DOM writers so the visible control plane can be tested.

export function resolveMarketplaceSystemStatus01091({stage='01091',repository={},summary={},productEditorLive=true,categoryEditorLive=true}={}){
  return Object.freeze({
    stage:String(stage||'01091'),
    repository:String(repository?.type||'unknown'),
    productEditor:productEditorLive?'CRUD LIVE':'NOT READY',
    categoryEditor:categoryEditorLive?'CRUD LIVE':'NOT READY',
    revision:String(Number.isFinite(Number(summary?.revision))?Number(summary.revision):0)
  });
}

export function activeStoreStageLabel01091({source='',buildStage='01091'}={}){
  return source==='real-auth'?`${String(buildStage||'01091')} · SERVER`:'01070 · LOCAL';
}

export function applyMarketplaceSystemStatus01091(studio,status={}){
  if(!studio)return status;
  const set=(key,label,value)=>{
    const el=studio.querySelector(`[data-mp-system-metric="${key}"]`);
    if(el)el.innerHTML=`<span>${label}</span><b>${String(value??'—')}</b>`;
  };
  set('stage','Studio stage',status.stage);
  set('repository','Repository',status.repository);
  set('product-editor','Product Editor',status.productEditor);
  set('category-editor','Category Editor',status.categoryEditor);
  set('revision','Revision',status.revision);
  return status;
}
