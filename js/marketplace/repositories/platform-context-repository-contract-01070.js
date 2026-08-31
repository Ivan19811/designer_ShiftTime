// 01070 · Repository contract for Account/Workspace/Store/Membership context.
export const PLATFORM_CONTEXT_REPOSITORY_CONTRACT_VERSION_01070=1;
export const PLATFORM_CONTEXT_REQUIRED_METHODS_01070=Object.freeze(['loadSnapshot','replaceSnapshot']);
export function assertPlatformContextRepository01070(repo){
  if(!repo||typeof repo!=='object')throw new Error('PlatformContextRepository is required');
  PLATFORM_CONTEXT_REQUIRED_METHODS_01070.forEach(m=>{if(typeof repo[m]!=='function')throw new Error(`PlatformContextRepository missing ${m}()`);});
  return repo;
}
