import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiTableRepository01092} from '../js/tables/repositories/api-table-repository-01092.js';

test('01093 binds browser fetch to globalThis before Tables API requests',async()=>{
  const originalFetch=globalThis.fetch;
  let observedThis=null;
  globalThis.fetch=async function(url,options){
    observedThis=this;
    assert.equal(url,'https://api.example.test/api/v1/tables');
    assert.equal(options.method,'GET');
    assert.equal(options.headers.authorization,'Bearer session-token');
    return {
      ok:true,
      status:200,
      headers:{get:()=>''},
      text:async()=>JSON.stringify({tables:[{id:'table_1',name:'Orders'}]}),
    };
  };
  try{
    const repository=new ApiTableRepository01092({
      baseUrl:'https://api.example.test/api/v1',
      tokenProvider:()=> 'session-token',
      contextProvider:()=>({storeId:'store_1'}),
    });
    const tables=await repository.listTables();
    assert.equal(observedThis,globalThis);
    assert.deepEqual(tables,[{id:'table_1',name:'Orders'}]);
  }finally{
    globalThis.fetch=originalFetch;
  }
});
