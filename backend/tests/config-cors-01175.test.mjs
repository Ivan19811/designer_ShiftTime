import test from 'node:test';
import assert from 'node:assert/strict';

test('01175 backend combines CORS_ORIGIN and expands configured loopback dev origins to changing Live Server ports',async()=>{
  const prevOrigin=process.env.CORS_ORIGIN;
  const prevList=process.env.CORS_ALLOWLIST;
  try{
    process.env.CORS_ORIGIN='https://designer-shifttime.netlify.app';
    process.env.CORS_ALLOWLIST='https://designer-shifttime.netlify.app,http://localhost:8888,http://localhost:3000';
    const {config}=await import(`../src/config.mjs?cors01175=${Date.now()}`);
    assert.match(config.corsOrigin,/https:\/\/designer-shifttime\.netlify\.app/);
    assert.match(config.corsOrigin,/http:\/\/127\.0\.0\.1:\*/);
    assert.match(config.corsOrigin,/http:\/\/localhost:\*/);
  }finally{
    if(prevOrigin===undefined)delete process.env.CORS_ORIGIN; else process.env.CORS_ORIGIN=prevOrigin;
    if(prevList===undefined)delete process.env.CORS_ALLOWLIST; else process.env.CORS_ALLOWLIST=prevList;
  }
});

test('01175 legacy CORS_ORIGIN loopback entries also expand to changing Live Server ports',async()=>{
  const prevOrigin=process.env.CORS_ORIGIN;
  const prevList=process.env.CORS_ALLOWLIST;
  try{
    process.env.CORS_ORIGIN='https://designer-shifttime.netlify.app,http://localhost:8888,http://localhost:3000';
    delete process.env.CORS_ALLOWLIST;
    const {config}=await import(`../src/config.mjs?cors01175legacy=${Date.now()}`);
    assert.match(config.corsOrigin,/http:\/\/127\.0\.0\.1:\*/);
    assert.match(config.corsOrigin,/http:\/\/localhost:\*/);
  }finally{
    if(prevOrigin===undefined)delete process.env.CORS_ORIGIN; else process.env.CORS_ORIGIN=prevOrigin;
    if(prevList===undefined)delete process.env.CORS_ALLOWLIST; else process.env.CORS_ALLOWLIST=prevList;
  }
});
