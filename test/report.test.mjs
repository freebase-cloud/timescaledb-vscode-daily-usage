import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {report} from '../src/report.mjs';
test('domain report matches sample result',async()=>{const load=async f=>JSON.parse(await readFile(new URL('../data/'+f,import.meta.url)));assert.deepEqual(report(await load('sample.json')),await load('expected.json'));});
test('invalid records fail explicitly',()=>{assert.throws(()=>report([]));assert.throws(()=>report([{}]));});
