import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomInt } from 'node:crypto';
import Database from 'better-sqlite3';

const serverDir = dirname(dirname(fileURLToPath(import.meta.url)));
test('authentication and coach isolation', { timeout: 30000 }, async t => {
  const temporary = await mkdtemp(join(tmpdir(), 'sport-auth-'));
  const database = join(temporary, 'test.db');
  const port = randomInt(20000, 45000);
  const child = spawn(process.execPath, ['index.js'], {
    cwd: serverDir, env: { ...process.env, DB_PATH: database, PORT: String(port), HOST: '127.0.0.1', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => {
    if (child.exitCode === null) {
      await new Promise(resolve => { child.once('exit',resolve); child.kill(); });
    }
    await rm(temporary, { recursive: true, force: true });
  });
  await new Promise((resolve,reject) => {
    const timeout = setTimeout(() => reject(new Error('Server did not start')), 10000);
    child.stdout.on('data', data => { if (String(data).includes('API http')) { clearTimeout(timeout); resolve(); } });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}`)); });
  });
  async function request(path, method='GET', body, cookie, extra={}) {
    const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
      method, headers: { 'Content-Type':'application/json', 'X-Requested-With':'SportTracker', ...(cookie ? { Cookie:cookie } : {}), ...extra },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status:response.status, cookie:response.headers.get('set-cookie')?.split(';')[0], rawCookie:response.headers.get('set-cookie'), data:response.status===204?null:await response.json() };
  }
  const account = { name:'Test', surname:'Coach', email:'first@example.test', password:' Password123! ' };
  let firstCookie, secondCookie, athlete, training, bearer;
  await t.test('anonymous reads and writes are rejected', async () => {
    assert.equal((await request('/athletes')).status,401);
    assert.equal((await request('/athletes','POST',{name:'A',surname:'B'})).status,401);
  });
  await t.test('registration validates and hashes passwords', async () => {
    assert.equal((await request('/register','POST',{...account,password:'short'})).status,400);
    assert.equal((await request('/register','POST',account)).status,201);
    assert.equal((await request('/register','POST',{...account,email:'FIRST@example.test'})).status,409);
    const db = new Database(database);
    const stored = db.prepare('SELECT password FROM coaches').get().password;
    assert.match(stored,/^scrypt\$/);assert.notEqual(stored,account.password);db.close();
  });
  await t.test('login preserves password spaces and issues an HttpOnly cookie', async () => {
    assert.equal((await request('/login','POST',{email:account.email,password:account.password.trim()})).status,401);
    const response = await request('/login','POST',{email:'FIRST@example.test',password:account.password});
    assert.equal(response.status,200);assert.match(response.rawCookie,/HttpOnly/);assert.match(response.rawCookie,/SameSite=Strict/);
    assert.equal(response.data.token,undefined);firstCookie=response.cookie;
    assert.equal((await request('/me','GET',undefined,firstCookie)).status,200);
  });
  await t.test('authenticated athlete and training flow succeeds', async () => {
    let response = await request('/athletes','POST',{name:'Synthetic',surname:'Athlete',branch:'Basketbol',gender:'Erkek'},firstCookie);
    assert.equal(response.status,201);assert.equal(response.data.gender,'Erkek');athlete=response.data.id;
    response=await request(`/athletes/${athlete}/trainings`,'POST',{},firstCookie);
    assert.equal(response.status,201);training=response.data.id;
    assert.equal((await request(`/trainings/${training}`,'PUT',{records:[{shot_type:'Sabit Catch & Shoot',points:[{x:50,y:50}],attempted:10,made:6}]},firstCookie)).status,200);
    assert.equal((await request(`/athletes/${athlete}/stats`,'GET',undefined,firstCookie)).data.progression[0].pct,60);
  });
  await t.test('route modules preserve branches, athlete search and training lists', async () => {
    assert.deepEqual((await request('/branches','GET',undefined,firstCookie)).data,['Basketbol','Voleybol']);
    const list=await request('/athletes?branch=Basketbol&q=Synthetic','GET',undefined,firstCookie);
    assert.equal(list.status,200);assert.equal(list.data.length,1);assert.equal(list.data[0].id,athlete);
    const detail=await request(`/athletes/${athlete}`,'GET',undefined,firstCookie);
    assert.equal(detail.status,200);assert.equal(detail.data.name,'Synthetic');
    const sessions=await request(`/athletes/${athlete}/trainings`,'GET',undefined,firstCookie);
    assert.equal(sessions.status,200);assert.equal(sessions.data.length,1);
    assert.equal(sessions.data[0].id,training);assert.equal(sessions.data[0].record_count,1);
    assert.deepEqual((await request('/stats/branch/Voleybol','GET',undefined,firstCookie)).data,
      {monthlyTrend:[],shotTypeDistribution:[],ageGroupSuccess:[]});
  });
  await t.test('unknown ages stay separate and zero percent keeps attempt counts', async () => {
    let stats=(await request('/stats/branch/Basketbol','GET',undefined,firstCookie)).data;
    assert.equal(stats.ageGroupSuccess.find(g=>g.name==='Yaş Bilinmiyor').totalAttempted,10);
    assert.equal(stats.ageGroupSuccess.find(g=>g.name==='18 Yaş ve Üzeri').totalAttempted,0);
    await request(`/trainings/${training}`,'PUT',{records:[{shot_type:'Sabit Catch & Shoot',points:[],attempted:10,made:0}]},firstCookie);
    stats=(await request('/stats/branch/Basketbol','GET',undefined,firstCookie)).data;
    const unknown=stats.ageGroupSuccess.find(g=>g.name==='Yaş Bilinmiyor');
    assert.equal(unknown.pct,0);assert.equal(unknown.totalAttempted,10);
    assert.equal(stats.shotTypeDistribution[0].value,0);assert.equal(stats.shotTypeDistribution[0].totalMade,0);
    await request(`/trainings/${training}`,'PUT',{records:[{shot_type:'Sabit Catch & Shoot',points:[],attempted:10,made:6}]},firstCookie);
  });
  await t.test('athlete validation and explicit clearing', async () => {
    for (const change of [{height:-1},{weight:'80'},{body_fat:101},{birth_date:'2025-02-30'},{birth_date:'9999-01-01'},{name:23}]) assert.equal((await request(`/athletes/${athlete}`,'PUT',change,firstCookie)).status,400);
    assert.equal((await request('/athletes','POST',{name:'Test',surname:'Test',branch:'Unknown'},firstCookie)).status,400);
    await request(`/athletes/${athlete}`,'PUT',{height:180,weight:75},firstCookie);
    assert.equal((await request(`/athletes/${athlete}`,'PUT',{name:'Updated'},firstCookie)).data.height,180);
    const cleared=await request(`/athletes/${athlete}`,'PUT',{height:null,weight:null},firstCookie);
    assert.equal(cleared.data.height,null);assert.equal(cleared.data.weight,null);
  });
  await t.test('gender and birth date persist, retain and clear', async () => {
    let response=await request(`/athletes/${athlete}`,'PUT',{gender:'Kadın',birth_date:'2005-01-01'},firstCookie);
    assert.equal(response.status,200);assert.equal(response.data.gender,'Kadın');assert.equal(response.data.birth_date,'2005-01-01');
    response=await request(`/athletes/${athlete}`,'PUT',{surname:'Athlete'},firstCookie);
    assert.equal(response.data.gender,'Kadın');assert.equal(response.data.birth_date,'2005-01-01');
    assert.equal((await request(`/athletes/${athlete}`,'PUT',{gender:'invalid'},firstCookie)).status,400);
    response=await request(`/athletes/${athlete}`,'GET',undefined,firstCookie);
    assert.equal(response.data.gender,'Kadın');
    response=await request(`/athletes/${athlete}`,'PUT',{gender:null,birth_date:null},firstCookie);
    assert.equal(response.data.gender,null);assert.equal(response.data.birth_date,null);
  });
  await t.test('invalid training requests preserve saved records', async () => {
    const before=(await request(`/trainings/${training}`,'GET',undefined,firstCookie)).data.records;
    for (const body of [{}, {records:null}, {records:{}},
      {records:[{shot_type:'Sabit Catch & Shoot',points:[],attempted:2,made:5}]},
      {records:[{shot_type:'Sabit Catch & Shoot',points:[],attempted:-1,made:0}]},
      {records:[{shot_type:'Sabit Catch & Shoot',points:[],attempted:1.5,made:1}]},
      {records:[{shot_type:'Sabit Catch & Shoot',points:[{x:101,y:10}],attempted:2,made:1}]}]) {
      assert.equal((await request(`/trainings/${training}`,'PUT',body,firstCookie)).status,400);
      assert.deepEqual((await request(`/trainings/${training}`,'GET',undefined,firstCookie)).data.records,before);
    }
  });
  await t.test('athlete analytics filter Türkiye dates, omit empty attempts and retain real zero success', async () => {
    const person=(await request('/athletes','POST',{name:'Analysis',surname:'Fixture',branch:'Basketbol'},firstCookie)).data.id;
    const sessions=[];
    for(let i=0;i<4;i++) sessions.push((await request(`/athletes/${person}/trainings`,'POST',{},firstCookie)).data.id);
    const localDb=new Database(database);
    for(let i=0;i<4;i++) localDb.prepare('UPDATE trainings SET created_at=? WHERE id=?').run(
      i===0?'2026-10-01 20:59:00':`2026-10-01 21:0${i}:00`,sessions[i]);
    localDb.close();
    const record=(attempted,made)=>({shot_type:'Sabit Catch & Shoot',points:[],attempted,made});
    await request(`/trainings/${sessions[0]}`,'PUT',{records:[record(10,0)]},firstCookie);
    await request(`/trainings/${sessions[2]}`,'PUT',{records:[record(0,0)]},firstCookie);
    await request(`/trainings/${sessions[3]}`,'PUT',{records:[record(20,10)]},firstCookie);
    const path=`/athletes/${person}/stats`;
    const all=(await request(path,'GET',undefined,firstCookie)).data;
    assert.deepEqual(all.progression.map(item=>item.pct),[0,50]);
    assert.deepEqual(all.progression.map(item=>item.label),['1. Antrenman','4. Antrenman']);
    assert.equal(all.shotTypeDistribution[0].value,33);
    const selected=(await request(path+'?dateFrom=2026-10-02&dateTo=2026-10-02','GET',undefined,firstCookie)).data;
    assert.equal(selected.progression.length,1);assert.equal(selected.progression[0].trainingId,sessions[3]);
    assert.equal(selected.progression[0].totalAttempted,20);assert.equal(selected.shotTypeDistribution[0].value,50);
    const empty=(await request(path+'?dateFrom=2026-10-03','GET',undefined,firstCookie)).data;
    assert.deepEqual(empty,{progression:[],shotTypeDistribution:[]});
    for(const query of ['dateFrom=2026-02-30','dateFrom=2026-10-03&dateTo=2026-10-02','dateTo=oops','dateFrom=a&dateFrom=b'])
      assert.equal((await request(path+'?'+query,'GET',undefined,firstCookie)).status,400);
    await request(`/athletes/${person}`,'DELETE',undefined,firstCookie);
  });
  await t.test('another coach cannot read, change, delete or aggregate the first coach records', async () => {
    await request('/register','POST',{...account,email:'second@example.test'});
    secondCookie=(await request('/login','POST',{email:'second@example.test',password:account.password})).cookie;
    assert.deepEqual((await request('/athletes','GET',undefined,secondCookie)).data,[]);
    for (const path of [`/athletes/${athlete}`,`/athletes/${athlete}/trainings`,`/athletes/${athlete}/stats`,`/trainings/${training}`])
      assert.equal((await request(path,'GET',undefined,secondCookie)).status,404);
    assert.equal((await request(`/athletes/${athlete}`,'PUT',{name:'Changed'},secondCookie)).status,404);
    assert.equal((await request(`/athletes/${athlete}`,'DELETE',undefined,secondCookie)).status,404);
    assert.equal((await request(`/athletes/${athlete}/trainings`,'POST',{},secondCookie)).status,404);
    assert.equal((await request(`/trainings/${training}`,'PUT',{records:[]},secondCookie)).status,404);
    assert.deepEqual((await request('/stats/branch/Basketbol','GET',undefined,secondCookie)).data.monthlyTrend,[]);
  });
  await t.test('cross-origin and missing custom-header writes are rejected', async () => {
    assert.equal((await request('/logout','POST',undefined,firstCookie,{Origin:'https://untrusted.example'})).status,403);
    assert.equal((await request('/logout','POST',undefined,firstCookie,{'X-Requested-With':''})).status,403);
  });
  await t.test('native bearer sessions work and expire', async () => {
    const response=await request('/login','POST',{email:account.email,password:account.password},undefined,{'X-Native-Client':'1'});
    bearer=response.data.token;assert.match(bearer,/^[a-f0-9]{64}$/);
    assert.equal((await request('/me','GET',undefined,undefined,{Authorization:`Bearer ${bearer}`})).status,200);
    const db=new Database(database);db.prepare('UPDATE sessions SET expires_at=0 WHERE token_hash NOT NULL').run();db.close();
    assert.equal((await request('/me','GET',undefined,undefined,{Authorization:`Bearer ${bearer}`})).status,401);
  });
  await t.test('logout invalidates a session on the server', async () => {
    const cookie=(await request('/login','POST',{email:account.email,password:account.password})).cookie;
    assert.equal((await request('/logout','POST',undefined,cookie)).status,204);
    assert.equal((await request('/me','GET',undefined,cookie)).status,401);
  });
});
