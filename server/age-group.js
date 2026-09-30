function calendarDate(value) {
  if (typeof value !== 'string') return null;
  const date = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '0001-01-01') return null;
  const parsed = new Date(date + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === date ? date : null;
}
export function ageGroupAtTraining(birthDate, trainingDate) {
  const birth=calendarDate(birthDate), reference=calendarDate(trainingDate);
  if (!birth || !reference || birth > reference) return 'unknown';
  let age=Number(reference.slice(0,4))-Number(birth.slice(0,4));
  if(reference.slice(5)<birth.slice(5)) age--;
  return age<18?'under18':'adult';
}
