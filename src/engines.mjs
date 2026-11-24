// Public engine labels deliberately map postgres -> postgresql.
const sql = (engine, slug, useCase, columns, rows, filter, note) => ({
  engine, slug, useCase, columns, rows, filter,
  dialect: 'sql', note,
});
export const engines = [
  sql('postgresql', 'postgres', 'inventory', [['id','integer'],['product','text'],['stock','integer']], [
    {id:1,product:'Keyboard',stock:3},{id:2,product:'Monitor',stock:12},{id:3,product:'Mouse',stock:1},
  ], 'stock < 5', 'SQL compatibility over Freebase shared storage; no PostgreSQL extensions, replication, or full pg_catalog.'),
  sql('mysql', 'mysql', 'orders', [['id','integer'],['customer','text'],['total','float']], [
    {id:1,customer:'Ada',total:120},{id:2,customer:'Bo',total:18},{id:3,customer:'Cy',total:85},
  ], 'total >= 80', 'Bounded SQL; no MySQL server administration, stored routines, or InnoDB guarantees.'),
  {engine:'mongodb',slug:'mongodb',useCase:'support-tickets',dialect:'mongo',
    columns:[['id','integer'],['subject','text'],['priority','integer']],
    rows:[{id:1,subject:'Login issue',priority:3},{id:2,subject:'Invoice copy',priority:1},{id:3,subject:'Sync failure',priority:4}],
    filter:'priority >= 3',note:'Basic document commands only; no replica sets, change streams, or full aggregation pipeline. HTTP query translation and native BSON clients have different result envelopes.'},
  {engine:'redis',slug:'redis',useCase:'session-cache',dialect:'redis',
    columns:[['id','integer'],['user','text'],['minutes','integer']],
    rows:[{id:1,user:'Ada',minutes:45},{id:2,user:'Bo',minutes:5},{id:3,user:'Cy',minutes:90}],
    filter:'minutes >= 30',note:'String-key demo only. No Redis cluster, Lua scripting, or delivery/expiry guarantees. JSON filtering is performed in this application, not Redis.'},
  sql('sqlite','sqlite','expenses',[['id','integer'],['category','text'],['amount','float']],[
    {id:1,category:'Travel',amount:140},{id:2,category:'Office',amount:15},{id:3,category:'Hosting',amount:90},
  ],'amount >= 80','Hosted SQL compatibility, not a local SQLite file. No filesystem access, PRAGMA administration, or SQLite extension loading.'),
  {engine:'cassandra',slug:'cassandra',useCase:'device-events',dialect:'cql',
    columns:[['id','integer'],['device','text'],['temperature','integer']],
    rows:[{id:1,device:'pump-a',temperature:85},{id:2,device:'pump-b',temperature:42},{id:3,device:'pump-c',temperature:91}],
    filter:'temperature >= 80',note:'Bounded CQL v4 compatibility; no real distributed ring, consistency levels, partitioning, or production Cassandra performance semantics.'},
  {engine:'dynamodb',slug:'dynamodb',useCase:'feature-flags',dialect:'dynamo',
    columns:[['id','integer'],['flag','text'],['rollout','integer']],
    rows:[{id:1,flag:'new-search',rollout:100},{id:2,flag:'new-checkout',rollout:10},{id:3,flag:'dark-mode',rollout:75}],
    filter:'rollout >= 50',note:'JSON DynamoDB-style commands translated by Freebase; not the AWS SDK endpoint. No IAM, streams, GSIs, or AWS capacity semantics.'},
  sql('clickhouse','clickhouse','event-analytics',[['id','integer'],['event','text'],['hits','integer']],[
    {id:1,event:'signup',hits:30},{id:2,event:'purchase',hits:7},{id:3,event:'pageview',hits:150},
  ],'hits >= 20','SQL compatibility, not a ClickHouse cluster. No MergeTree storage engine, codecs, materialized views, or native performance claims.'),
  {engine:'elasticsearch',slug:'elasticsearch',useCase:'incident-search',dialect:'elastic',
    columns:[['id','integer'],['message','text'],['severity','integer']],
    rows:[{id:1,message:'API unavailable',severity:5},{id:2,message:'Cache miss',severity:1},{id:3,message:'Worker retry',severity:4}],
    filter:'severity >= 4',note:'Basic JSON search/index translation; no full analyzers, relevance ranking, shards, cluster APIs, or official Elasticsearch client compatibility.'},
  {engine:'neo4j',slug:'neo4j',useCase:'team-directory',dialect:'cypher',
    columns:[['id','integer'],['person','text'],['reports','integer']],
    rows:[{id:1,person:'Ada',reports:5},{id:2,person:'Bo',reports:0},{id:3,person:'Cy',reports:3}],
    filter:'reports >= 3',note:'Node-label CRUD subset of Cypher. No Bolt endpoint, traversal engine, graph constraints, or native Neo4j transaction guarantees.'},
  sql('mariadb','mariadb','product-pricing',[['id','integer'],['sku','text'],['price','float']],[
    {id:1,sku:'PRO',price:99},{id:2,sku:'BASIC',price:9},{id:3,sku:'TEAM',price:59},
  ],'price >= 50','Bounded MySQL-family SQL compatibility; no MariaDB plugins, stored routines, replication, or engine-specific guarantees.'),
  {engine:'influxdb',slug:'influxdb',useCase:'sensor-readings',dialect:'influx',
    columns:[['id','integer'],['sensor','text'],['value','float']],
    rows:[{id:1,sensor:'outdoor',value:35},{id:2,sensor:'office',value:22},{id:3,sensor:'rack',value:40}],
    filter:'value >= 30',note:'InfluxQL-style queries and line protocol translation. No native Flux runtime, retention engine, downsampling, or InfluxDB client endpoint.'},
  {engine:'prometheus',slug:'prometheus',useCase:'service-health',dialect:'promql',
    columns:[['id','integer'],['job','text'],['value','float']],
    rows:[{id:1,job:'api',value:0.97},{id:2,job:'worker',value:0.5},{id:3,job:'web',value:0.99}],
    filter:'value >= 0.95',note:'PromQL-like selectors over stored samples. No scraper, alert manager, rate extrapolation, or native Prometheus HTTP endpoint. Seeding uses Freebase structured writes.'},
  sql('timescaledb','timescaledb','daily-usage',[['id','integer'],['day','text'],['requests','integer']],[
    {id:1,day:'2026-01-01',requests:500},{id:2,day:'2026-01-02',requests:30},{id:3,day:'2026-01-03',requests:700},
  ],'requests >= 100','PostgreSQL-style table queries; not the Timescale extension. No hypertables, time_bucket, compression, or continuous aggregates.'),
  sql('cockroachdb','cockroachdb','account-balances',[['id','integer'],['account','text'],['balance','float']],[
    {id:1,account:'Operations',balance:1200},{id:2,account:'Petty cash',balance:80},{id:3,account:'Reserve',balance:9000},
  ],'balance >= 1000','SQL compatibility only; no distributed transactions, serializability, geo-replication, or CockroachDB cluster semantics.'),
];

const literal = value => typeof value === 'string' ? `'${value.replaceAll("'", "''")}'` : String(value);
export function resourceName(slug, suffix) {
  if (!/^[a-z][a-z0-9-]*$/.test(slug) || !/^[a-f0-9]{24}$/.test(suffix)) throw new Error('Unsafe fixture identifier');
  return `fbx_${slug.replaceAll('-','_')}_${suffix}`;
}
export function scenario(def, resource) {
  if (!/^fbx_[a-z0-9_]+_[a-f0-9]{24}$/.test(resource)) throw new Error('Only generated fixture identifiers are allowed');
  const [id, label, metric] = def.columns.map(c => c[0]);
  const rows = def.rows;
  const update = {[metric]:rows[0][metric] + 10};
  const q = (phase, query, extra={}) => ({phase,query,...extra});
  const s = JSON.stringify;
  if (def.dialect === 'redis') return [
    q('seed',`SET ${resource} '${s(rows)}'`),
    q('read',`GET ${resource}`),
    q('update',`SET ${resource} '${s(rows.map((r,i)=>i ? r : {...r,...update}))}'`),
    q('verify',`GET ${resource}`),
    q('cleanup',`DEL ${resource}`),
  ];
  if (def.dialect === 'mongo') return [
    q('seed',s({insert:resource,documents:rows})),
    q('read',s({find:resource,filter:{},limit:100})),
    q('update',s({update:resource,updates:[{q:{id:1},u:{$set:update},multi:false}]})),
    q('verify',s({find:resource,filter:{id:1},limit:100})),
    q('delete',s({delete:resource,deletes:[{q:{id:2},limit:1}]})),
    q('cleanup',s({drop:resource})),
  ];
  if (def.dialect === 'dynamo') return [
    ...rows.map(Item=>q('seed',s({Action:'PutItem',TableName:resource,Item}))),
    q('read',s({Action:'Scan',TableName:resource,Limit:100})),
    q('update',s({Action:'UpdateItem',TableName:resource,Key:{id:1},UpdateExpression:`SET ${metric} = :v`,ExpressionAttributeValues:{':v':update[metric]}})),
    q('verify',s({Action:'GetItem',TableName:resource,Key:{id:1}})),
    q('delete',s({Action:'DeleteItem',TableName:resource,Key:{id:2}})),
    q('cleanup',s({Action:'DeleteTable',TableName:resource})),
  ];
  if (def.dialect === 'elastic') return [
    ...rows.map(r=>q('seed',`PUT /${resource}/_doc/${r.id}\n${s(r)}`)),
    q('read',`GET /${resource}/_search\n${s({size:100,query:{match_all:{}}})}`),
    q('update',`POST /${resource}/_update/1\n${s({doc:update})}`),
    q('verify',`GET /${resource}/_doc/1`),
    q('delete',`DELETE /${resource}/_doc/2`),
    q('cleanup',`DELETE /${resource}`),
  ];
  if (def.dialect === 'cypher') return [
    ...rows.map(r=>q('seed',`CREATE (n:${resource} {${Object.entries(r).map(([k,v])=>`${k}: ${literal(v)}`).join(', ')}}) RETURN n`)),
    q('read',`MATCH (n:${resource}) RETURN n LIMIT 100`),
    q('update',`MATCH (n:${resource} {id: 1}) SET n.${metric} = ${literal(update[metric])} RETURN n`),
    q('verify',`MATCH (n:${resource} {id: 1}) RETURN n LIMIT 100`),
    q('delete',`MATCH (n:${resource} {id: 2}) DELETE n`),
    // The label is a randomized fixture table, never a user-provided label.
    {phase:'cleanup',operation:'DROP_TABLE',table:resource},
  ];
  if (def.dialect === 'influx' || def.dialect === 'promql') return [
    ...rows.map(row=>({phase:'seed',operation:'INSERT',table:resource,rows:[row],create_if_missing:true,columns:def.columns.map(([name,type])=>({name,type}))})),
    q('read',def.dialect === 'promql' ? resource : `SELECT * FROM ${resource} LIMIT 100`),
    {phase:'update',operation:'UPDATE',table:resource,filter:'id = 1',values:update},
    q('verify',def.dialect === 'promql' ? resource : `SELECT * FROM ${resource} WHERE id = 1 LIMIT 100`),
    {phase:'delete',operation:'DELETE',table:resource,filter:'id = 2'},
    {phase:'cleanup',operation:'DROP_TABLE',table:resource},
  ];
  const types = def.dialect === 'cql' ? {integer:'int',text:'text',float:'double'} : {integer:'INTEGER',text:'TEXT',float:'REAL'};
  return [
    q('create',`CREATE TABLE ${resource} (${def.columns.map(([n,t])=>`${n} ${types[t]}${n==='id' ? ' PRIMARY KEY' : ''}`).join(', ')})`),
    ...rows.map(r=>q('seed',`INSERT INTO ${resource} (${Object.keys(r).join(', ')}) VALUES (${Object.values(r).map(literal).join(', ')})`)),
    q('read',`SELECT * FROM ${resource} LIMIT 100`),
    q('update',`UPDATE ${resource} SET ${metric} = ${literal(update[metric])} WHERE id = 1`),
    q('verify',`SELECT * FROM ${resource} WHERE id = 1 LIMIT 100`),
    q('delete',`DELETE FROM ${resource} WHERE id = 2`),
    q('cleanup',`DROP TABLE ${resource}`),
  ];
}

// Fixed, bounded read templates for fixture resources only. Never accept arbitrary AI SQL.
export function readQuery(def, resource) {
  return scenario(def,resource).find(step=>step.phase==='read').query;
}
