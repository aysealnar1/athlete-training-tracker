import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ageFromBirthDate} from '../../client/src/components/athlete-age.js';
test('display age follows birthday, leap dates and missing values',()=>{
 const today=new Date(2026,8,30,12);
 assert.equal(ageFromBirthDate('2005-09-30',today),21);
 assert.equal(ageFromBirthDate('2005-10-01',today),20);
 assert.equal(ageFromBirthDate('2024-02-29',today),2);
 for(const value of [null,'','2023-02-29','2027-01-01','0000-01-01'])assert.equal(ageFromBirthDate(value,today),null);
});
