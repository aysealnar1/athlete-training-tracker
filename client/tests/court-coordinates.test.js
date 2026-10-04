import test from 'node:test';
import assert from 'node:assert/strict';
import { courtCoordinates, landscapeCourtCoordinates } from '../src/utils/court-coordinates.js';

test('court points follow the square drawing across wide and tall viewports', () => {
  assert.deepEqual(courtCoordinates({left: 10, top: 20, width: 800, height: 400}, 310, 320), {x: 25, y: 75});
  assert.deepEqual(courtCoordinates({left: 10, top: 20, width: 200, height: 400}, 60, 270), {x: 25, y: 75});
  assert.equal(courtCoordinates({left: 10, top: 20, width: 800, height: 400}, 110, 220), null);
  assert.equal(courtCoordinates({left: 0, top: 0, width: 0, height: 0}, 0, 0), null);
});

test('landscape clicks retain canonical saved coordinates when resized and rotated', () => {
  assert.deepEqual(landscapeCourtCoordinates({left: 10, top: 20, width: 800, height: 400}, 610, 120), {x: 25, y: 75});
  assert.deepEqual(landscapeCourtCoordinates({left: 10, top: 20, width: 400, height: 400}, 310, 170), {x: 25, y: 75});
  assert.equal(landscapeCourtCoordinates({left: 0, top: 0, width: 400, height: 400}, 200, 20), null);
  assert.equal(landscapeCourtCoordinates({left: 0, top: 0, width: 0, height: 0}, 0, 0), null);
});

import { fullCourtCoordinates, fullCourtDisplayPoint, FULL_COURT } from '../src/utils/court-coordinates.js';
test('full court clicks and markers share coordinates after independent width and height changes', () => {
  for (const rect of [{left:10,top:20,width:1672,height:940}, {left:30,top:40,width:500,height:600}]) {
    const expected = {x:75,y:25,coordinate_space:'full-court'};
    const pixel = fullCourtDisplayPoint(expected);
    const point = fullCourtCoordinates(rect, rect.left+pixel.x/1672*rect.width,
      rect.top+pixel.y/940*rect.height);
    assert.ok(Math.abs(point.x-75)<1e-10);
    assert.ok(Math.abs(point.y-25)<1e-10);
    assert.equal(point.coordinate_space,'full-court');
    assert.equal(fullCourtCoordinates(rect,rect.left,rect.top),null);
  }
  assert.equal(fullCourtCoordinates({left:0,top:0,width:0,height:0},0,0),null);
});
test('legacy points stay unchanged and map to the left half of the full court', () => {
  const legacy={x:50,y:90};
  assert.deepEqual(fullCourtDisplayPoint(legacy),fullCourtDisplayPoint({x:5,y:50,coordinate_space:'full-court'}));
  assert.deepEqual(legacy,{x:50,y:90});
});
