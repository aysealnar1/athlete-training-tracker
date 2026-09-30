import { useId, useRef } from 'react';

import { ageFromBirthDate } from './athlete-age';
export { ageFromBirthDate } from './athlete-age';

export default function AthletePersonalFields({ value, onChange }) {
  const id = useId();
  const dateInput = useRef(null);
  const today = new Date();
  const maxDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const age = ageFromBirthDate(value.birth_date, today);
  const openCalendar = () => {
    try {
      if (dateInput.current.showPicker) dateInput.current.showPicker();
      else dateInput.current.focus();
    } catch {
      dateInput.current.focus();
    }
  };
  return <>
    <div className="input-group">
      <label htmlFor={`${id}-birth`}>Doğum Tarihi</label>
      <input id={`${id}-birth`} ref={dateInput} type="date" lang="tr" min="0001-01-01" max={maxDate}
        style={{ colorScheme: 'dark', cursor: 'pointer' }} value={value.birth_date || ''}
        onClick={openCalendar} onChange={event => onChange(form => ({ ...form, birth_date: event.target.value }))} />
      <button type="button" className="btn btn-ghost" onClick={openCalendar}>Takvim Aç</button>
    </div>
    <div className="input-group">
      <label htmlFor={`${id}-age`}>Yaş</label>
      <input id={`${id}-age`} readOnly value={age === null ? '' : age} placeholder="Doğum tarihi seçin" aria-describedby={`${id}-age-help`} />
      <small id={`${id}-age-help`} className="text-muted">Doğum tarihinden otomatik hesaplanır.</small>
    </div>
    <div className="input-group">
      <label htmlFor={`${id}-gender`}>Cinsiyet</label>
      <select id={`${id}-gender`} value={value.gender || ''}
        onChange={event => onChange(form => ({ ...form, gender: event.target.value }))}>
        <option value="">Belirtilmedi</option>
        <option value="Kadın">Kadın</option>
        <option value="Erkek">Erkek</option>
        <option value="Diğer">Diğer</option>
      </select>
    </div>
  </>;
}
