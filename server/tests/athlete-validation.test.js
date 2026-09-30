import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateAthlete} from '../athlete-validation.js';
const base={name:' Test ',surname:' Athlete '};
test('optional measurements and actual calendar dates',()=>{
 assert.equal(validateAthlete({...base,birth_date:'2024-02-29',body_fat:0}).values.name,'Test');
 for(const change of [{birth_date:'2023-02-29'},{birth_date:'2000-13-01'},{birth_date:'0000-01-01'},{height:0},{weight:Infinity},{body_fat:-1},{name:' '},{surname:'x'.repeat(101)}])assert.ok(validateAthlete({...base,...change}).error);
 assert.ok(validateAthlete(null).error);assert.ok(validateAthlete([]).error);
 const existing={...base,height:180};assert.equal(validateAthlete({},existing).values.height,180);assert.equal(validateAthlete({height:null},existing).values.height,null);
});
