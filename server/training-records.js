const shotTypes = new Set(['Sabit Catch & Shoot', 'Hareketli Catch & Shoot', 'Dribling Üzeri', 'Crossover Üzeri']);

export function validateRecords(records) {
  if (!Array.isArray(records) || records.length > 500) return 'Şut kayıtları en fazla 500 elemanlık bir liste olmalıdır.';
  for (const record of records) {
    if (!record || typeof record !== 'object' || !shotTypes.has(record.shot_type)) return 'Geçerli bir şut tipi seçin.';
    if (!Number.isSafeInteger(record.attempted) || !Number.isSafeInteger(record.made) ||
        record.attempted < 0 || record.attempted > 1000000 || record.made < 0 || record.made > record.attempted) {
      return 'Atılan ve isabetli şutlar 0–1000000 aralığında tam sayı olmalı; isabet sayısı atılanı aşmamalıdır.';
    }
    if (!Array.isArray(record.points) || record.points.length > 1000 || record.points.some(point =>
      !point || !Number.isFinite(point.x) || !Number.isFinite(point.y) ||
      point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100)) {
      return 'Saha noktaları 0–100 aralığında sayısal x ve y koordinatları içermelidir.';
    }
  }
  return null;
}

export function createRecordWriter(db) {
  const remove = db.prepare('DELETE FROM shot_records WHERE training_id = ?');
  const insert = db.prepare('INSERT INTO shot_records (training_id, shot_type, points_json, attempted, made) VALUES (?, ?, ?, ?, ?)');
  return db.transaction((trainingId, records) => {
    remove.run(trainingId);
    for (const record of records) {
      insert.run(trainingId, record.shot_type, JSON.stringify(record.points), record.attempted, record.made);
    }
  });
}
