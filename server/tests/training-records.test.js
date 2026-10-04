import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { validateRecords, createRecordWriter } from '../training-records.js';
const record = { shot_type: 'Sabit Catch & Shoot', points: [{x:50,y:50}], attempted:10, made:6 };

test('record validation covers unsafe values and permits explicit empty or zero records', () => {
  assert.equal(validateRecords([record]),null);
  assert.equal(validateRecords([]),null);
  assert.equal(validateRecords([{...record,attempted:0,made:0}]),null);
  for (const value of [undefined, null, {}, [null], [{...record,shot_type:'Unknown'}],
    [{...record,attempted:'10'}], [{...record,made:Infinity}], [{...record,attempted:1000001}],
    [{...record,points:null}], [{...record,points:[{x:NaN,y:0}]}],
    Array.from({length:501},()=>record)]) assert.equal(typeof validateRecords(value),'string');
});

test('a failed second insert rolls back deletion and the first insert', () => {
  const db=new Database(':memory:');
  try {
    db.exec(`CREATE TABLE shot_records (id INTEGER PRIMARY KEY,training_id INTEGER,shot_type TEXT,points_json TEXT,attempted INTEGER,made INTEGER);`);
    const write=createRecordWriter(db);
    write(1,[record]);
    const before=db.prepare('SELECT * FROM shot_records').all();
    // Failure after the first new record has been written proves whole-transaction rollback.
    db.exec(`CREATE TRIGGER fail_second BEFORE INSERT ON shot_records WHEN NEW.made=7 BEGIN SELECT RAISE(ABORT,'simulated write failure'); END;`);
    assert.throws(()=>write(1,[{...record,made:5},{...record,made:7}]),/simulated write failure/);
    assert.deepEqual(db.prepare('SELECT * FROM shot_records').all(),before);
    db.exec('DROP TRIGGER fail_second');
    write(1,[{...record,made:8}]);
    assert.equal(db.prepare('SELECT made FROM shot_records').get().made,8);
    write(1,[]);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM shot_records').get().count,0);
  } finally { db.close(); }
});

test('full court coordinate metadata survives saving alongside legacy points', () => {
  const db = new Database(':memory:');
  try {
    db.exec('CREATE TABLE shot_records (id INTEGER PRIMARY KEY, training_id INTEGER, shot_type TEXT, points_json TEXT, attempted INTEGER, made INTEGER)');
    const mixed = {...record, points:[{x:50,y:90},{x:80,y:25,coordinate_space:'full-court'}]};
    assert.equal(validateRecords([mixed]),null);
    createRecordWriter(db)(1,[mixed]);
    assert.deepEqual(JSON.parse(db.prepare('SELECT points_json FROM shot_records').get().points_json),mixed.points);
  } finally { db.close(); }
});
