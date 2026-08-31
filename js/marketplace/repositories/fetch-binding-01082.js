// 01082 · Preserve the native Fetch receiver while keeping injected test doubles untouched.
export function bindMarketplaceFetch01082(fetchImpl=globalThis.fetch){
  if(typeof fetchImpl!=='function')return fetchImpl;
  return fetchImpl===globalThis.fetch?fetchImpl.bind(globalThis):fetchImpl;
}
