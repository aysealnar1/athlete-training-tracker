// preserveAspectRatio="xMidYMid meet" centers the square court in the SVG.
export function courtCoordinates(rect, clientX, clientY) {
  const size = Math.min(rect.width, rect.height);
  if (!size) return null;
  const left = rect.left + (rect.width - size) / 2;
  const top = rect.top + (rect.height - size) / 2;
  const x = ((clientX - left) / size) * 100;
  const y = ((clientY - top) / size) * 100;
  if (x < 0 || x > 100 || y < 0 || y > 100) return null;
  return { x, y };
}

// New landscape display rotates the existing canonical coordinates 180 degrees.
// The stored values and API payload remain in the original coordinate system.
export function landscapeCourtCoordinates(rect, clientX, clientY) {
  const width = Math.min(rect.width, rect.height * 2);
  const height = width / 2;
  if (!width || !height) return null;
  const left = rect.left + (rect.width - width) / 2;
  const top = rect.top + (rect.height - height) / 2;
  const x = (clientX - left) / width * 100;
  const y = (clientY - top) / height * 100;
  if (x < 0 || x > 100 || y < 0 || y > 100) return null;
  return { x: 100 - x, y: 100 - y };
}

// Bounds of the playing surface within the supplied 1672 × 940 image.
export const FULL_COURT = { width: 1672, height: 940, left: 38, top: 60, courtWidth: 1596, courtHeight: 790 };
export function fullCourtCoordinates(rect, clientX, clientY) {
  const c = FULL_COURT;
  if (!(rect.width > 0) || !(rect.height > 0)) return null;
  const x = ((clientX - rect.left) / rect.width * c.width - c.left) / c.courtWidth * 100;
  const y = ((clientY - rect.top) / rect.height * c.height - c.top) / c.courtHeight * 100;
  if (x < 0 || x > 100 || y < 0 || y > 100) return null;
  return { x, y, coordinate_space: 'full-court' };
}
export function fullCourtDisplayPoint(point) {
  // Legacy half-court points retain their stored values; baseline becomes the left edge.
  const x = point.coordinate_space === 'full-court' ? point.x : (100 - point.y) / 2;
  const y = point.coordinate_space === 'full-court' ? point.y : point.x;
  return { x: FULL_COURT.left + x / 100 * FULL_COURT.courtWidth,
    y: FULL_COURT.top + y / 100 * FULL_COURT.courtHeight };
}
