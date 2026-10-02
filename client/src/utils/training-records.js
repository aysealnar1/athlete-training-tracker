// Compare only the fields sent to the API, excluding database IDs and timestamps.
export function trainingPayload(records) {
  return records.map(({ shot_type, points = [], attempted, made }) => ({ shot_type, points, attempted, made }));
}

export function recordsSnapshot(records) {
  return JSON.stringify(trainingPayload(records));
}

export function parseShotCount(input) {
  const text = String(input).trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) && value <= 1000000 ? value : null;
}

export function replaceRecord(records, index, record) {
  return records.map((item, position) => position === index ? record : item);
}
