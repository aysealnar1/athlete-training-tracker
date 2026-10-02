import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trainingDateKey, formatTrainingTime } from '../src/utils/training-time.js';

test('SQLite UTC timestamps display in Türkiye time', () => {
  assert.equal(formatTrainingTime('2026-10-02 09:45:00'), '02.10.2026 12:45');
  assert.equal(formatTrainingTime('2026-09-30 17:47:00'), '30.09.2026 20:47');
});

test('date filters use the Türkiye date across midnight, month and year boundaries', () => {
  assert.equal(trainingDateKey('2026-10-01 21:45:00'), '2026-10-02');
  assert.equal(trainingDateKey('2026-09-30 21:00:00'), '2026-10-01');
  assert.equal(formatTrainingTime('2026-12-31 21:00:00'), '01.01.2027 00:00');
});

test('explicit UTC and offset timestamps are converted once; missing timestamps stay unknown', () => {
  assert.equal(formatTrainingTime('2026-10-02T09:45:00Z'), '02.10.2026 12:45');
  assert.equal(formatTrainingTime('2026-10-02T12:45:00+03:00'), '02.10.2026 12:45');
  for (const value of [null, undefined, '', 'invalid', '2026-10-02', '2026-13-02 09:45:00']) {
    assert.equal(trainingDateKey(value), '');
    assert.equal(formatTrainingTime(value), 'Tarih bilinmiyor');
  }
});
