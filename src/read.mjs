import {readQuery,resourceName} from './engines.mjs';
import {records} from './client.mjs';
export function boundedQuery(def, table) {
  if (!/^[a-z][a-z0-9_]{0,119}$/.test(table || '')) throw new Error('Set FREEBASE_TABLE to a simple, lowercase resource name');
  const fixture=resourceName(def.slug,'0'.repeat(24));
  return readQuery(def,fixture).replaceAll(fixture,table);
}
export function dataRecords(def, result) {
  if (def.dialect!=='redis') return records(result);
  const rows=records(result);
  const value=rows[0]?.value ?? Object.values(rows[0] || {})[0];
  let parsed;
  try { parsed=JSON.parse(value); } catch { throw new Error('Redis key must contain a JSON array of sample records'); }
  if (!Array.isArray(parsed)) throw new Error('Redis value is not a record array');
  return parsed;
}
