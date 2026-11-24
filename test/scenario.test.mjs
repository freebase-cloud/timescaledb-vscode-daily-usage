import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {engines,resourceName,scenario} from '../src/engines.mjs';
import {demonstrate,verifyRead} from '../src/demo.mjs';
const meta=JSON.parse(await readFile(new URL('../example.json',import.meta.url)));
const def=engines.find(x=>x.engine===meta.engine);
test('engine scenario owns its fixture and includes seed, read, update and cleanup',()=>{
  const resource=resourceName(def.slug,'a'.repeat(24));
  const plan=scenario(def,resource);
  for (const phase of ['seed','read','update','cleanup']) assert.ok(plan.some(x=>x.phase===phase),phase);
  for (const step of plan) assert.ok(JSON.stringify(step).includes(resource));
  assert.throws(()=>scenario(def,'users'));
  assert.throws(()=>resourceName('../escape','a'.repeat(24)));
});
test('preview never contacts the API',async()=>{
  const result=await demonstrate(def,null,{log:()=>{}});
  assert.ok(result.length>4);
});
test('complete scenario reaches transport, including bounded cleanup',async()=>{
  const seen=[];
  const plan=scenario(def,resourceName(def.slug,'b'.repeat(24)));
  function response() {
    const phase=plan[seen.length-1].phase;
    const rows=phase==='verify' ? def.rows.map((r,i)=>i ? r : {...r,[def.columns[2][0]]:r[def.columns[2][0]]+10}) : def.rows;
    return def.dialect==='redis' ? {columns:['value'],rows:[[JSON.stringify(rows)]]} :
      {columns:def.columns.map(c=>c[0]),rows:rows.map(r=>def.columns.map(([c])=>r[c]))};
  }
  const api={query:async q=>{seen.push(q);return response();},dispatch:async(op,args)=>{seen.push({op,args});return response();}};
  await demonstrate(def,api,{apply:true,suffix:'b'.repeat(24),log:()=>{}});
  assert.equal(seen.length,scenario(def,resourceName(def.slug,'b'.repeat(24))).length);
});
test('failed writes are not retried and cleanup is attempted',async()=>{
  let n=0; const seen=[];
  const action=async(...args)=>{seen.push(args);if (++n===1) throw new Error('planned failure');return {};};
  await assert.rejects(demonstrate(def,{query:action,dispatch:action},{apply:true,log:()=>{}}),/planned failure/);
  assert.equal(seen.length,2);
});
test('live read verification rejects missing or incorrect data',()=>{
  assert.throws(()=>verifyRead(def,'read',{columns:[],rows:[]}));
  assert.throws(()=>verifyRead(def,'verify',{columns:['id'],rows:[[1]]}));
});
