import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordsSnapshot, trainingPayload, parseShotCount, replaceRecord } from '../src/utils/training-records.js';

test('editing replaces one record and preserves other shot locations without mutation', () => {
  const first = {shot_type:'Sabit Catch & Shoot',points:[{x:20,y:30}],attempted:10,made:6};
  const second = {shot_type:'Dribling Üzeri',points:[{x:40,y:50},{x:60,y:70}],attempted:5,made:1};
  const original = [first,second];
  const result = replaceRecord(original,0,{...first,made:8});
  assert.equal(result.length,2);assert.equal(result[0].made,8);
  assert.equal(original[0].made,6);assert.equal(result[1],second);
  assert.deepEqual(result[0].points,first.points);
});

test('dirty comparison ignores server metadata and detects edits, removal and clearing', () => {
  const record={shot_type:'Sabit Catch & Shoot',points:[{x:20,y:30}],attempted:10,made:0};
  const baseline=recordsSnapshot([record]);
  assert.equal(recordsSnapshot([{...record,id:42,training_id:8,points_json:'[]'}]),baseline);
  assert.notEqual(recordsSnapshot([{...record,made:1}]),baseline);
  assert.notEqual(recordsSnapshot([{...record,points:[{x:21,y:30}]}]),baseline);
  assert.notEqual(recordsSnapshot([]),baseline);
  assert.deepEqual(trainingPayload([]),[]);
});

test('shot counts accept zero and reject blanks, decimals, exponents and excessive values', () => {
  for (const input of ['', ' ', '-1','1.5','2e3','12abc','1000001']) assert.equal(parseShotCount(input),null);
  assert.equal(parseShotCount('0'),0);assert.equal(parseShotCount('1000000'),1000000);
});
