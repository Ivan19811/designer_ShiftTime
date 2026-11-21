// 01624I — pure tree selection, deletion impact and bulk move planning.
// A parent category contains its descendants; an item is counted only once.
const str=x=>String(x??'').trim();
const fail=(code)=>{const error=new Error(code);error.code=code;throw error;};
export function calculateMassSelection01624I(snapshot={},selectedCategories=[],selectedProducts=[]){
 const categories=snapshot.categories||[],products=snapshot.products||[];
 const byId=new Map(categories.map(c=>[str(c.id),c]));
 const selected=new Set([...selectedCategories].map(str).filter(id=>byId.has(id)));
 const explicitProducts=new Set([...selectedProducts].map(str));
 const children=new Map();
 for(const c of categories){const parent=str(c.parentId);if(!children.has(parent))children.set(parent,[]);children.get(parent).push(str(c.id));}
 const roots=[...selected].filter(id=>{let parent=str(byId.get(id)?.parentId),hops=0;const seen=new Set([id]);while(parent&&byId.has(parent)&&!seen.has(parent)&&++hops<=categories.length){if(selected.has(parent))return false;seen.add(parent);parent=str(byId.get(parent)?.parentId);}return true;});
 const included=new Set(),byRoot=new Map();
 for(const id of roots){const group=new Set(),stack=[id];while(stack.length){const child=stack.pop();if(group.has(child))continue;group.add(child);included.add(child);for(const next of children.get(child)||[])stack.push(next);}byRoot.set(id,group);}
 const productIds=new Set();for(const product of products){const ids=(product.categoryIds?.length?product.categoryIds:[product.categoryId]).map(str);if(explicitProducts.has(str(product.id))||ids.some(id=>included.has(id)))productIds.add(str(product.id));}
 const categoryRoot=new Map();for(const [root,ids] of byRoot)for(const id of ids)categoryRoot.set(id,root);
 const rootProductCounts=new Map(roots.map(id=>[id,0]));
 for(const product of products){const owners=new Set((product.categoryIds?.length?product.categoryIds:[product.categoryId]).map(str).map(id=>categoryRoot.get(id)).filter(Boolean));for(const root of owners)rootProductCounts.set(root,(rootProductCounts.get(root)||0)+1);}
 const affectedByRoot=roots.map(id=>({id,name:byId.get(id)?.name||id,categoryCount:byRoot.get(id).size,productCount:rootProductCounts.get(id)||0}));
 const productById=new Map(products.map(p=>[str(p.id),p]));
 const independentlySelected=[...productIds].filter(id=>{const p=productById.get(id);return !p||!(p.categoryIds?.length?p.categoryIds:[p.categoryId]).map(str).some(cid=>included.has(cid));});
 return {roots,selectedCategoryIds:selected,includedCategoryIds:included,productIds,independentlySelected,affectedByRoot,categoryCount:included.size,productCount:productIds.size};
}
export function massDeleteOperations01624I(snapshot,categoryIds,productIds){
 const effect=calculateMassSelection01624I(snapshot,categoryIds,productIds);
 if(!effect.categoryCount&&!effect.productCount)fail('ST_MASS_EMPTY_SELECTION_01624I');
 const operations=[...effect.roots.map(id=>({collection:'categories',id,patch:{deleted:true}})),...effect.independentlySelected.map(id=>({collection:'products',id,patch:{deleted:true}}))];
 return {effect,operations};
}
export function massMoveOperations01624I(snapshot,categoryIds,productIds,targetId,{allowMixed=true}={}){
 targetId=str(targetId);const byId=new Map((snapshot.categories||[]).map(c=>[str(c.id),c]));
 if(!byId.has(targetId))fail('ST_MASS_TARGET_MISSING_01624I');
 const effect=calculateMassSelection01624I(snapshot,categoryIds,productIds);
 if(!effect.roots.length&&!effect.independentlySelected.length)fail('ST_MASS_EMPTY_SELECTION_01624I');
 if(effect.includedCategoryIds.has(targetId))fail('ST_MASS_SELF_OR_DESCENDANT_01624I');
 if(!allowMixed&&effect.roots.length&&(snapshot.products||[]).some(p=>(p.categoryIds||[]).includes(targetId)))fail('ST_MASS_CATEGORY_WITH_PRODUCTS_01624I');
 // Ten supported levels (depth 0…9), checked locally before any pending write.
 const chainDepth=id=>{let depth=0,cur=str(id),seen=new Set();while(cur&&byId.has(cur)&&!seen.has(cur)){seen.add(cur);cur=str(byId.get(cur).parentId);if(cur)depth++;}return depth;};
 const deepestDescendant=root=>{let max=0,stack=[[root,0]],seen=new Set();while(stack.length){const [id,depth]=stack.pop();if(seen.has(id))continue;seen.add(id);max=Math.max(max,depth);for(const c of snapshot.categories||[])if(str(c.parentId)===id)stack.push([str(c.id),depth+1]);}return max;};
 if(effect.roots.some(id=>chainDepth(targetId)+1+deepestDescendant(id)>9))fail('ST_MASS_CATEGORY_DEPTH_EXCEEDED_01624I');
 const current=new Set((snapshot.categories||[]).filter(c=>str(c.parentId)===targetId&&!effect.roots.includes(str(c.id))).map(c=>str(c.name).normalize('NFKC').toLocaleLowerCase('uk-UA').replace(/\s+/g,' ')));
 for(const id of effect.roots){const key=str(byId.get(id)?.name).normalize('NFKC').toLocaleLowerCase('uk-UA').replace(/\s+/g,' ');if(current.has(key))fail('MARKETPLACE_CATEGORY_DUPLICATE_01490');current.add(key);}
 const operations=effect.roots.filter(id=>str(byId.get(id)?.parentId)!==targetId).map(id=>({collection:'categories',id,patch:{parentId:targetId}}));
 for(const id of effect.independentlySelected){const p=(snapshot.products||[]).find(x=>str(x.id)===id);if(p&&((p.categoryIds||[]).length!==1||str(p.categoryIds[0])!==targetId))operations.push({collection:'products',id,patch:{categoryIds:[targetId]}});}
 return {effect,operations,targetId};
}
