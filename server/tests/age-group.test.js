import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ageGroupAtTraining as group} from '../age-group.js';
test('age groups use the training date and actual eighteenth birthday',()=>{
 assert.equal(group('2008-09-30','2026-09-29'),'under18');
 assert.equal(group('2008-09-30','2026-09-30'),'adult');
 assert.equal(group('2008-09-30','2025-12-01'),'under18');
 for(const birth of [null,'','2025-02-30','2027-01-01'])assert.equal(group(birth,'2026-09-30'),'unknown');
 assert.equal(group('2000-01-01',null),'unknown');
});
