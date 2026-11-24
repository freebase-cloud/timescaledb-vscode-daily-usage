import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {engines,resourceName,scenario} from './engines.mjs';
import {Freebase,configuration,runStep} from './client.mjs';
import {dataRecords} from './read.mjs';
import {executeFixture} from './fixture.mjs';
export function verifyRead(def, phase, result) {
  const rows=dataRecords(def,result);
  const metric=def.columns[2][0];
  if (phase==='read') {
    if (rows.length!==def.rows.length || def.rows.some(expected=>!rows.some(row=>String(row.id)===String(expected.id) &&
        String(row[def.columns[1][0]])===String(expected[def.columns[1][0]]) &&
        Number(row[metric])===expected[metric]))) throw new Error('Seeded records did not match the read result');
  } else if (phase==='verify') {
    const row=rows.find(row=>String(row.id)==='1');
    if (!row || Number(row[metric])!==def.rows[0][metric]+10) throw new Error('Updated record did not match the read result');
  }
}
export async function demonstrate(def, api, {apply=false, suffix=randomBytes(12).toString('hex'), log=console.log}={}) {
  const resource=resourceName(def.slug,suffix);
  const plan=scenario(def,resource);
  if (!apply) { log(JSON.stringify({mode:'preview',resource,steps:plan},null,2)); return plan; }
  try {
    return await executeFixture(plan,step=>runStep(api,step),{
      verify:(step,result)=>{
        if (step.phase==='read'||step.phase==='verify') verifyRead(def,step.phase,result);
      },
      log,
    });
  } catch(error) {
    if (error.cleanupErrors) error.message+=` Fixture: ${resource}.`;
    throw error;
  }
}
async function main() {
  const meta=JSON.parse(await readFile(new URL('../example.json',import.meta.url),'utf8'));
  const def=engines.find(x=>x.engine===meta.engine);
  const apply=process.argv.includes('--apply');
  const api=apply ? new Freebase(configuration(process.env,def.engine)) : null;
  await demonstrate(def,api,{apply});
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(error=>{console.error(error.message);process.exitCode=1;});
