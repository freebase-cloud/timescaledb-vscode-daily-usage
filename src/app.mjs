import {readFile} from 'node:fs/promises';
import {report} from './report.mjs';
import {engines} from './engines.mjs';
import {configuration,Freebase} from './client.mjs';
import {boundedQuery,dataRecords} from './read.mjs';
async function main() {
  let rows;
  if (process.argv.includes('--live')) {
    const def=engines.find(x=>x.engine==="timescaledb");
    rows=dataRecords(def,await new Freebase(configuration(process.env,def.engine)).query(boundedQuery(def,process.env.FREEBASE_TABLE)));
  } else rows=JSON.parse(await readFile(new URL('../data/sample.json',import.meta.url),'utf8'));
  console.log(JSON.stringify(report(rows),null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
