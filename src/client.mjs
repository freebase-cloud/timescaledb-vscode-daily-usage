export function configuration(env = process.env, expectedEngine) {
  let url;
  try { url = new URL(env.FREEBASE_URL); } catch { throw new Error('Set FREEBASE_URL to an HTTPS origin'); }
  const loopback = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
      (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:'))) throw new Error('Use an HTTPS origin; HTTP is allowed only on loopback');
  if (!/^fbk_[a-f0-9]{64}$/.test(env.FREEBASE_API_KEY || '')) throw new Error('Set a valid FREEBASE_API_KEY; never commit it');
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(env.FREEBASE_INSTANCE_ID || '')) throw new Error('Set FREEBASE_INSTANCE_ID from the selected database');
  if (expectedEngine && env.FREEBASE_ENGINE !== expectedEngine) throw new Error(`FREEBASE_ENGINE must be ${expectedEngine}`);
  return {origin:url.origin,key:env.FREEBASE_API_KEY,instance:env.FREEBASE_INSTANCE_ID,engine:expectedEngine || env.FREEBASE_ENGINE};
}
export class Freebase {
  constructor(config, transport = fetch) { this.config=config; this.transport=transport; }
  async request(path, payload) {
    if (!['/query','/dispatch'].includes(path)) throw new Error('Unsupported API route');
    let response;
    try {
      response = await this.transport(`${this.config.origin}/api/wire${path}`, {
        method:'POST', redirect:'error', signal:AbortSignal.timeout(30000),
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${this.config.key}`,'X-Database-Instance':this.config.instance},
        body:JSON.stringify({...payload,namespace:'default'}),
      });
    } catch { throw new Error('Freebase transport failed; request was not retried'); }
    if (!response.ok) throw new Error(`Freebase HTTP ${response.status}; check credentials, access and instance selection`);
    let body;
    try { body=await response.json(); } catch { throw new Error('Freebase returned invalid JSON'); }
    if (!body || typeof body!=='object' || body.error || body.operation === 'ERROR') throw new Error('Freebase rejected the operation; check compatibility and permissions');
    return body;
  }
  query(query) { return this.request('/query',{protocol:this.config.engine,query}); }
  dispatch(operation, args={}) { return this.request('/dispatch',{...args,operation}); }
}
export function records(result) {
  if (Array.isArray(result?.columns) && Array.isArray(result?.rows)) {
    return result.rows.map(row=>Array.isArray(row) ? Object.fromEntries(result.columns.map((key,i)=>[key,row[i]])) : row);
  }
  if (Array.isArray(result?.cursor?.firstBatch)) return result.cursor.firstBatch;
  if (Array.isArray(result?.documents)) return result.documents;
  throw new Error('Unsupported data envelope; inspect the bounded API response');
}
export async function runStep(api, step) {
  if (typeof step.query === 'string') return api.query(step.query);
  const {phase,operation,...args}=step;
  return api.dispatch(operation,args);
}
