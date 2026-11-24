import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Freebase,configuration,records} from '../src/client.mjs';
const env={FREEBASE_URL:'https://example.test',FREEBASE_API_KEY:`fbk_${'0'.repeat(64)}`,FREEBASE_INSTANCE_ID:'fixture-instance',FREEBASE_ENGINE:'postgresql'};
test('configuration rejects remote cleartext, URL credentials, wrong engine, and missing instance',()=>{
  assert.throws(()=>configuration({...env,FREEBASE_URL:'http://example.test'}));
  assert.throws(()=>configuration({...env,FREEBASE_URL:'https://user:password@example.test'}));
  assert.throws(()=>configuration(env,'redis'));
  assert.throws(()=>configuration({...env,FREEBASE_INSTANCE_ID:''}));
  assert.equal(configuration(env,'postgresql').engine,'postgresql');
});
test('request sends real instance contract and never retries',async()=>{
  let calls=0;
  const api=new Freebase(configuration(env),async(url,opts)=>{
    calls++;assert.equal(url,'https://example.test/api/wire/query');
    assert.equal(opts.headers['X-Database-Instance'],'fixture-instance');
    assert.equal(opts.headers.Authorization,`Bearer ${env.FREEBASE_API_KEY}`);
    assert.equal(opts.redirect,'error');
    assert.deepEqual(JSON.parse(opts.body),{protocol:'postgresql',query:'SELECT 1',namespace:'default'});
    return Response.json({columns:['n'],rows:[[1]]});
  });
  assert.deepEqual(records(await api.query('SELECT 1')),[{n:1}]);assert.equal(calls,1);
});
test('HTTP and operation errors fail without printing returned secrets',async()=>{
  for (const response of [new Response('sensitive',{status:403}),Response.json({error:'sensitive'}),Response.json({operation:'ERROR'}),new Response('not json')]) {
    const api=new Freebase(configuration(env),async()=>response);
    await assert.rejects(api.query('SELECT 1'),error=>!error.message.includes('sensitive'));
  }
});
test('transport exceptions do not echo secret URLs or retry writes',async()=>{
  let calls=0;
  const api=new Freebase(configuration(env),async()=>{calls++;throw new Error('sensitive');});
  await assert.rejects(api.dispatch('INSERT'),error=>!error.message.includes('sensitive'));
  assert.equal(calls,1);
});
test('column and native document result envelopes normalize',()=>{
  assert.deepEqual(records({columns:['id'],rows:[[1]]}),[{id:1}]);
  assert.deepEqual(records({cursor:{firstBatch:[{id:2}]}}),[{id:2}]);
  assert.throws(()=>records({}));
});
