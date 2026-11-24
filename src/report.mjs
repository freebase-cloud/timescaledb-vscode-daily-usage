export function report(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('Expected at least one sample record');
  rows=rows.map(row=>({...row}));
  for (const row of rows) {
    if (["id","day","requests"].some(k=>row[k]==null)) throw new Error('Missing required field');
    if (typeof row.requests==='string' && row.requests.trim()) row.requests=Number(row.requests);
    if (!Number.isFinite(row.requests)) throw new Error('Expected a numeric metric');
  }
  return {total:rows.reduce((s,r)=>s+r.requests,0),peak:rows.toSorted((a,b)=>b.requests-a.requests)[0].day,quietDays:rows.filter(r=>r.requests<100).map(r=>r.day)};
}
