export function validateAthlete(body, existing = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {error:'Sporcu bilgileri bir nesne olmalıdır.'};
  const values={};
  for (const field of ['branch','name','surname','height','weight','body_fat','birth_date','gender']) values[field]=Object.hasOwn(body,field)?body[field]:(existing[field]??(field==='branch'?'Basketbol':null));
  for (const field of ['name','surname']) {
    if(typeof values[field]!=='string'||!values[field].trim()||values[field].trim().length>100)return {error:'Ad ve soyad 1–100 karakter olmalıdır.'};
    values[field]=values[field].trim();
  }
  if(!['Basketbol','Voleybol'].includes(values.branch))return {error:'Geçerli bir branş seçin.'};
  if(existing.branch && values.branch!==existing.branch)return {error:'Mevcut sporcunun branşı bu işlemle değiştirilemez.'};
  for(const field of ['height','weight','body_fat']){
    const value=values[field];
    if(value!==null&&(!Number.isFinite(value)||(field==='body_fat'?value<0||value>100:value<=0)))return {error:'Boy ve kilo pozitif sayı; yağ oranı 0–100 arasında sayı olmalıdır.'};
  }
  if(values.gender!==null&&!['Kadın','Erkek','Diğer'].includes(values.gender))return {error:'Geçerli bir cinsiyet seçin.'};
  const date=values.birth_date;
  if(date!==null){
    if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return {error:'Doğum tarihi YYYY-AA-GG biçiminde olmalıdır.'};
    const parsed=new Date(date+'T00:00:00Z');
    if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||date<'0001-01-01'||date>new Date().toISOString().slice(0,10))return {error:'Geçerli, gelecekte olmayan bir doğum tarihi girin.'};
  }
  return {values};
}
