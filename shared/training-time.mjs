const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function trainingTimeParts(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  let timestamp = value.trim().replace(' ', 'T');
  // SQLite datetime('now') returns UTC without an explicit zone suffix.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(timestamp)) timestamp += 'Z';
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp)) return null;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return null;
  return Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
}

export function trainingDateKey(value) {
  const parts = trainingTimeParts(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : '';
}

export function formatTrainingTime(value) {
  const parts = trainingTimeParts(value);
  return parts ? `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}` : 'Tarih bilinmiyor';
}
