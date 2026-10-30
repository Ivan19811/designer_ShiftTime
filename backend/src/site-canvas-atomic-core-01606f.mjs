// 01606F: atomic, page-scoped Main tree mutations. No arbitrary JSON paths or
// full-project writes. The client supplies operations, never a replacement snapshot.
const clean=v=>typeof v==='string'?v.trim():'';
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>structuredClone(v);
const error=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
const idValid=v=>typeof v==='string'&&v.length>0&&v.length<=160&&/^[\w.:-]+$/.test(v)&&!['__proto__','prototype','constructor'].includes(v);
const fail=()=>{throw error('ST_CANVAS_ATOMIC_INVALID_01606F');};
const MUTABLE=new Set(['componentType','layout','box','constraints','style','responsive','content','meta']);
const KINDS=new Set(['section','level','container','block']);
const CONTAINERS=new Set(['section','level','container']);
function checkTree(tree){
  if(!obj(tree)||!Array.isArray(tree.rootIds)||!obj(tree.nodes)||Object.keys(tree.nodes).length>2500)fail();
  const seen=new Set(),active=new Set();
  const visit=(id,parent)=>{
    if(!idValid(id)||seen.has(id)||active.has(id))fail();
    const n=tree.nodes[id];if(!obj(n)||n.id!==id||n.area!=='main'||!KINDS.has(n.kind)||!Array.isArray(n.children))fail();
    if(parent!==null&&n.parentId!==parent)fail();
    if(parent===null&&idValid(n.parentId)&&Object.hasOwn(tree.nodes,n.parentId))fail();
    if(n.kind==='block'&&n.children.length)fail();
    seen.add(id);active.add(id);
    if(n.children.length>2500||new Set(n.children).size!==n.children.length)fail();
    for(const child of n.children)visit(child,id);
    active.delete(id);
  };
  if(new Set(tree.rootIds).size!==tree.rootIds.length)fail();
  for(const id of tree.rootIds)visit(id,null);
  if(seen.size!==Object.keys(tree.nodes).length)fail();
}
function insert(nodes,tree,id,parentId,index){
  const siblings=parentId===null?tree.rootIds:nodes[parentId]?.children;
  if(!Array.isArray(siblings)||(parentId!==null&&!CONTAINERS.has(nodes[parentId].kind))||!Number.isSafeInteger(index)||index<0||index>siblings.length)fail();
  siblings.splice(index,0,id);
}
function siblingsFor(nodes,tree,id){
  const node=nodes[id];if(!node)fail();
  const parentId=obj(nodes[node.parentId])?node.parentId:null;
  const siblings=parentId===null?tree.rootIds:nodes[parentId].children;
  if(!siblings.includes(id))fail();return {siblings,parentId};
}
function typedOps(operations){
  if(!Array.isArray(operations)||operations.length<1||operations.length>30)fail();
  return operations.map(op=>{
    if(!obj(op)||!['create','update','move','delete'].includes(op.type)||!idValid(op.id))fail();
    if(op.type==='create'){
      if(!obj(op.node)||op.node.id!==op.id||op.node.area!=='main'||!KINDS.has(op.node.kind)||!Array.isArray(op.node.children)||op.node.children.length)fail();
      if(Object.keys(op.node).some(k=>!['id','kind','area','parentId','children',...MUTABLE].includes(k)))fail();
      if(op.parentId!==null&&!idValid(op.parentId))fail();
      if(!Number.isSafeInteger(op.index)||op.index<0)fail();
    }
    if(op.type==='update'){
      if(!obj(op.patch)||!Object.keys(op.patch).length||Object.keys(op.patch).some(k=>!MUTABLE.has(k)))fail();
      for(const v of Object.values(op.patch))if(v!==null&&typeof v!=='string'&&typeof v!=='number'&&typeof v!=='boolean'&&!obj(v)&&!Array.isArray(v))fail();
    }
    if(op.type==='move'&&(op.parentId!==null&&!idValid(op.parentId)||!Number.isSafeInteger(op.index)||op.index<0))fail();
    return clone(op);
  });
}
export function normalizeCanvasAtomicInput01606F(input){
  if(!obj(input)||!idValid(input.pageId)||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<1)fail();
  if(Object.keys(input).some(k=>!['pageId','expectedRevision','operations'].includes(k)))fail();
  const operations=typedOps(input.operations);
  if(Buffer.byteLength(JSON.stringify(operations),'utf8')>512*1024)throw error('ST_CANVAS_ATOMIC_TOO_LARGE_01606F',413);
  return {pageId:input.pageId,expectedRevision:input.expectedRevision,operations};
}
export function applyCanvasAtomic01606F(project,siteId,request){
  if(!obj(project)||!obj(project.site)||!Array.isArray(project.site.pages)||!obj(project.storage)||!obj(project.storage.pageSnapshots))fail();
  if(project.site.id!==siteId||!project.site.pages.some(p=>p?.id===request.pageId))throw error('ST_CANVAS_PAGE_NOT_FOUND_01606F',404);
  const key=`${siteId}:${request.pageId}`,current=project.storage.pageSnapshots[key];
  if(!obj(current)||!obj(current.siteFrameMain01040))throw error('ST_CANVAS_SNAPSHOT_REQUIRED_01606F',409);
  const next=clone(project),tree=next.storage.pageSnapshots[key].siteFrameMain01040;
  checkTree(tree);
  const nodes=tree.nodes;
  for(const op of request.operations){
    if(op.type==='create'){
      if(nodes[op.id])throw error('ST_CANVAS_NODE_CONFLICT_01606F',409);
      if(op.parentId===op.id)fail();
      const rootParent=nodes[tree.rootIds[0]]?.parentId||'main';
      const parentId=op.parentId;
      if(parentId===null&&op.node.kind!=='section')fail();
      const n=clone(op.node);n.parentId=parentId??rootParent;
      delete n.tree;
      nodes[op.id]=n;insert(nodes,tree,op.id,parentId,op.index);
    }else if(op.type==='update'){
      if(!nodes[op.id])throw error('ST_CANVAS_NODE_NOT_FOUND_01606F',404);
      for(const [k,v] of Object.entries(op.patch))nodes[op.id][k]=clone(v);
    }else if(op.type==='move'){
      if(!nodes[op.id])throw error('ST_CANVAS_NODE_NOT_FOUND_01606F',404);
      if(op.parentId===op.id)fail();
      if(op.parentId!==null&&!nodes[op.parentId])throw error('ST_CANVAS_NODE_NOT_FOUND_01606F',404);
      if(op.parentId===null&&nodes[op.id].kind!=='section')fail();
      let ancestor=op.parentId;
      while(ancestor!==null&&nodes[ancestor]){if(ancestor===op.id)fail();ancestor=nodes[ancestor].parentId;}
      const old=siblingsFor(nodes,tree,op.id);old.siblings.splice(old.siblings.indexOf(op.id),1);
      insert(nodes,tree,op.id,op.parentId,op.index);
      nodes[op.id].parentId=op.parentId??(nodes[tree.rootIds.find(id=>id!==op.id)]?.parentId||'main');
    }else if(op.type==='delete'){
      if(!nodes[op.id])throw error('ST_CANVAS_NODE_NOT_FOUND_01606F',404);
      const old=siblingsFor(nodes,tree,op.id);old.siblings.splice(old.siblings.indexOf(op.id),1);
      const remove=id=>{const n=nodes[id];for(const child of n.children)remove(child);delete nodes[id];};remove(op.id);
    }
  }
  checkTree(tree);
  return {project:next,snapshot:clone(tree),pageId:request.pageId,operationsApplied:request.operations.length};
}
