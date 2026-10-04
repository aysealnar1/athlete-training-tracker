import { Target, Activity, CircleDot, Shuffle, Info, Save, ArrowRight, Pencil, Trash2, List, Undo2, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useBlocker } from 'react-router-dom';
import { api } from '../api';
import CourtMap from '../components/CourtMap';
import { trainingPayload, recordsSnapshot, parseShotCount, replaceRecord } from '../utils/training-records';

const SHOT_TYPES = [
  { id: 'Sabit Catch & Shoot', label: 'Sabit Catch & Shoot', maxPoints: 1, Icon: Target },
  { id: 'Hareketli Catch & Shoot', label: 'Hareketli Catch & Shoot', maxPoints: 2, Icon: Activity },
  { id: 'Dribling Üzeri', label: 'Dribling Üzeri Şut', maxPoints: 2, Icon: CircleDot },
  { id: 'Crossover Üzeri', label: 'Crossover Üzeri Şut', maxPoints: null, Icon: Shuffle },
];

export default function Training() {
  const { athleteId, trainingId } = useParams();
  const navigate = useNavigate();
  const isNew = !trainingId || trainingId === 'new';

  const [athlete, setAthlete] = useState(null);
  const [training, setTraining] = useState(null);
  const [records, setRecords] = useState([]);
  const [currentType, setCurrentType] = useState(null);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [step, setStep] = useState('select');
  const [attemptedInput, setAttemptedInput] = useState('');
  const [madeInput, setMadeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trainingNumber, setTrainingNumber] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [editingIndex, setEditingIndex] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState(recordsSnapshot([]));
  const allowNavigation = useRef(false);
  const pendingCreation = useRef(null);
  const leaveDialog = useRef(null);
  const hasDraft = currentType !== null;
  const hasUnsavedChanges = recordsSnapshot(records) !== savedSnapshot || hasDraft;
  const blocker = useBlocker(() => !allowNavigation.current && (saving || hasUnsavedChanges));

  useEffect(() => {
    const warnBeforeUnload = event => {
      if (!allowNavigation.current && (hasUnsavedChanges || saving)) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [hasUnsavedChanges, saving]);

  useEffect(() => {
    if (blocker.state === 'blocked' && leaveDialog.current && !leaveDialog.current.open) {
      leaveDialog.current.showModal();
    }
  }, [blocker.state]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!athleteId) return;
    let cancelled = false;
    if (!isNew) pendingCreation.current = null;
    setLoading(true);
    allowNavigation.current = false;
    const load = async () => {
      try {
        // Reuse the creation promise during StrictMode's effect replay.
        if (isNew && pendingCreation.current?.athleteId !== athleteId) {
          pendingCreation.current = {athleteId, promise: api.createTraining(athleteId)};
        }
        const [person, t, list] = await Promise.all([
          api.getAthlete(athleteId),
          isNew ? pendingCreation.current.promise : api.getTraining(trainingId),
          isNew ? Promise.resolve([]) : api.getTrainings(athleteId),
        ]);
        if (cancelled) return;
        const loaded = (t.records || []).map(r => ({
          ...r,
          points: typeof r.points_json === 'string' ? JSON.parse(r.points_json || '[]') : r.points_json || [],
        }));
        setAthlete(person);
        setTraining(t);
        setRecords(loaded);
        setSavedSnapshot(recordsSnapshot(loaded));
        resetDraft();
        const idx = list.findIndex(tr => String(tr.id) === String(trainingId));
        setTrainingNumber(isNew ? 'Yeni' : idx >= 0 ? list.length - idx : null);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          alert(err.message);
          navigate(`/athlete/${athleteId}`);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [athleteId, trainingId, isNew, navigate]);

  function resetDraft() {
    setCurrentType(null);
    setCurrentPoints([]);
    setAttemptedInput('');
    setMadeInput('');
    setEditingIndex(null);
    setStep('select');
  }

  const discardDraft = () => {
    if (hasDraft && !window.confirm('Tamamlanmamış şut kaydını iptal etmek istiyor musunuz?')) return false;
    resetDraft();
    return true;
  };

  const editRecord = index => {
    if (saving || !discardDraft()) return;
    const record = records[index];
    setEditingIndex(index);
    setCurrentType(record.shot_type);
    setCurrentPoints((record.points || []).map(point => ({...point})));
    setAttemptedInput(String(record.attempted));
    setMadeInput(String(record.made));
    setStep('select');
  };

  const deleteRecord = index => {
    if (saving || !window.confirm('Bu şut kaydı listeden silinsin mi? Değişiklik Kaydet düğmesiyle uygulanır.')) return;
    setRecords(previous => previous.filter((_, position) => position !== index));
    if (editingIndex === index) resetDraft();
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  };

  const addPoint = (coord) => {
    if (saving || !currentType) return;
    const typeConfig = SHOT_TYPES.find((t) => t.id === currentType);
    const max = typeConfig?.maxPoints;

    if (currentPoints.length >= 1000) return;
    if (max !== null && currentPoints.length >= max) return;

    setCurrentPoints((prev) => [...prev, coord]);
  };

  const goNext = () => {
    if (saving) return;
    if (step === 'select') {
      if (!currentType) return;

      const typeConfig = SHOT_TYPES.find((t) => t.id === currentType);
      const max = typeConfig?.maxPoints;

      if (max === 1 && currentPoints.length >= 1) {
        setStep('attempted');
      } else if (max === 2 && currentPoints.length >= 2) {
        setStep('attempted');
      } else if (max === null) {
        setStep('attempted');
      } else {
        return;
      }
    } else if (step === 'points') {
      setStep('attempted');
    } else if (step === 'attempted') {
      const n = parseShotCount(attemptedInput);

      if (n === null) {
        alert('0 ile 1.000.000 arasında bir tam sayı girin.');
        return;
      }

      setStep('made');
    } else if (step === 'made') {
      const attempted = parseShotCount(attemptedInput);
      const made = parseShotCount(madeInput);

      if (attempted === null || made === null || made > attempted) {
        alert('İsabetli sayısı 0 ile atılan şut sayısı arasında olmalıdır.');
        return;
      }

      const record = {shot_type: currentType, points: [...currentPoints], attempted, made};
      setRecords(previous => editingIndex === null
        ? [...previous, record]
        : replaceRecord(previous, editingIndex, record));
      resetDraft();
    }
  };

  const handleSave = async () => {
    if (!training?.id || saving) return;
    if (hasDraft) {
      alert('Önce şut kaydını tamamlayın veya Kaydı İptal Et düğmesine basın.');
      return;
    }

    setSaving(true);

    try {
      const payload = trainingPayload(records);
      await api.saveTraining(training.id, payload);
      setSavedSnapshot(recordsSnapshot(records));
      allowNavigation.current = true;
      navigate(`/athlete/${athleteId}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ padding: '2rem' }}>
        Yükleniyor...
      </div>
    );
  }

  const selectedType = SHOT_TYPES.find(type => type.id === currentType);

  return (
    <div className="page training-page" style={{ flexDirection: 'column' }}>
      <header className="training-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            minWidth: 0,
          }}
        >
          {isMobile && (
            <button
              type="button"
              className="btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Şut tipleri menüsünü aç"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.75rem',
                fontWeight: 700,
                border: '1px solid var(--accent)',
              }}
            >
              ☰ Şut Tipleri
            </button>
          )}

          <Link to={`/athlete/${athleteId}`} style={{ fontWeight: 600, flexShrink: 0 }}>
            ← Sporcuya Dön
          </Link>

          <div className="training-heading"><h1
            style={{
              fontSize: 'clamp(1rem, 4vw, 1.25rem)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {athlete?.name} {athlete?.surname} —{' '}
            {trainingNumber === 'Yeni'
              ? 'Yeni Antrenman'
              : trainingNumber != null
                ? `${trainingNumber}. Antrenman`
                : 'Antrenman'}
          </h1><p>Şut konumlarını ve isabet sayılarını kaydedin.</p></div>
        </div>

        <div className="training-save-area">
          <p role="status" className={`training-save-status ${hasUnsavedChanges ? 'is-pending' : ''}`}>
            <span aria-hidden="true" />
            {saving ? 'Kaydediliyor…' : hasDraft ? 'Şut kaydı tamamlanıyor' : hasUnsavedChanges ? 'Kaydedilmemiş değişiklikler' : 'Tüm değişiklikler kaydedildi'}
          </p>
        <button
          type="button"
          className="btn"
          onClick={handleSave}
          disabled={saving || hasDraft}
          style={{ flexShrink: 0 }}
        >
          <Save size={19} aria-hidden="true" /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button></div>
      </header>

      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(0,0,0,0.45)',
          }}
        />
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }} className="training-layout">
        <aside
          className="sidebar-left training-sidebar"
          style={
            isMobile
              ? {
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: 'min(82vw, 320px)',
                  zIndex: 1000,
                  transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                  transition: 'transform 0.25s ease',
                  background: 'var(--surface)',
                  borderRight: '1px solid var(--border)',
                  overflowY: 'auto',
                  padding: '1rem',
                  maxHeight: '100dvh',
                }
              : undefined
          }
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <h3 className="shot-menu-heading"><Target size={21} aria-hidden="true" /> Şut Tipleri</h3>

            {isMobile && (
              <button
                type="button"
                className="btn"
                onClick={() => setSidebarOpen(false)}
                style={{
                  padding: '0.45rem 0.7rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                }}
              >
                ← Kapat
              </button>
            )}
          </div>

          <p className="shot-menu-intro">Kayıt yapmak istediğiniz şut tipini seçin.</p>
          {SHOT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`shot-type-option ${currentType === t.id ? 'is-selected' : ''}`}
              aria-pressed={currentType === t.id}
              disabled={saving || step !== 'select'}
              onClick={() => {
                if (saving || step !== 'select' || (hasDraft && !discardDraft())) return;

                setCurrentType(t.id);
                setCurrentPoints([]);
                setSidebarOpen(false);
              }}
            >
              <span className="shot-type-icon"><t.Icon size={22} aria-hidden="true" /></span>
              <span><strong>{t.label}</strong><small>({t.maxPoints == null ? 'Sınırsız nokta' : `${t.maxPoints} nokta`})</small></span>
            </button>
          ))}

          <section className="training-record-list" aria-labelledby="training-records-heading">
            <h4 id="training-records-heading"><List size={18} aria-hidden="true" /> Bu antrenmandaki kayıtlar ({records.length})</h4>
            {records.length === 0 ? <p className="training-empty-records">Henüz şut kaydı eklenmedi.</p> : (
              <ul className="training-record-rows">
                {records.map((r, i) => (
                  <li key={i} className="training-record-row">
                    <span className={`record-type-dot record-type-${Math.max(0, SHOT_TYPES.findIndex(type => type.id === r.shot_type))}`} aria-hidden="true" />
                    <div className="training-record-text"><strong>{SHOT_TYPES.find(type => type.id === r.shot_type)?.label || r.shot_type}</strong><span>{r.made} / {r.attempted} isabet</span></div>
                    <div className="training-record-actions">
                      <button type="button" className="record-icon-button" disabled={saving} onClick={() => editRecord(i)} title="Düzenle" aria-label={`${i + 1}. şut kaydını düzenle`}><Pencil size={18} aria-hidden="true" /></button>
                      <button type="button" className="record-icon-button record-delete-button" disabled={saving} onClick={() => deleteRecord(i)} title="Sil" aria-label={`${i + 1}. şut kaydını sil`}><Trash2 size={18} aria-hidden="true" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="training-help">
            <h4><Info size={18} aria-hidden="true" /> Nasıl kullanılır?</h4>
            <p>Şut tipini seçip noktaları işaretleyin. Sıradaki ile deneme ve isabet sayılarını girin.</p>
          </div>

        </aside>

        <main
          style={{
            flex: 1,
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            minWidth: 0,
          }}
          className="training-main"
        >
          <section className="training-workspace" aria-labelledby="shot-map-heading">
          <div className="training-workspace-heading"><h2 id="shot-map-heading">Antrenman Şut Haritası</h2>
            {editingIndex !== null && <span>{editingIndex + 1}. kayıt düzenleniyor</span>}
          </div>
          <div className={`court-wrap ${step !== 'select' ? 'court-count-step' : ''}`}>
            <CourtMap
              points={currentPoints}
              onPointAdd={addPoint}
              maxPoints={
                currentType
                  ? SHOT_TYPES.find((t) => t.id === currentType)?.maxPoints
                  : 0
              }
              disabled={saving || !currentType || step !== 'select'}
            />

            {(step === 'attempted' || step === 'made') && (
              <div
                className="training-count-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: 10,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="card training-step-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  {step === 'attempted' && (
                    <>
                      <label htmlFor="shot-attempted" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Kaç şut atıldı?
                      </label>

                      <input
                        id="shot-attempted"
                        type="number"
                        min="0"
                        max="1000000"
                        step="1"
                        autoFocus={!isMobile}
                        value={attemptedInput}
                        onChange={(e) => setAttemptedInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && goNext()}
                        style={{
                          width: '100%',
                          padding: '0.6rem',
                          marginBottom: '1rem',
                          fontSize: '1rem',
                        }}
                      />
                    </>
                  )}

                  {step === 'made' && (
                    <>
                      <label htmlFor="shot-made" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Kaç tanesi isabetli?
                      </label>

                      <input
                        id="shot-made"
                        type="number"
                        min="0"
                        max={attemptedInput || 0}
                        step="1"
                        autoFocus={!isMobile}
                        value={madeInput}
                        onChange={(e) => setMadeInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && goNext()}
                        style={{
                          width: '100%',
                          padding: '0.6rem',
                          marginBottom: '1rem',
                          fontSize: '1rem',
                        }}
                      />

                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          marginBottom: '0.75rem',
                        }}
                      >
                        En fazla {attemptedInput || 0} girebilirsiniz.
                      </p>
                    </>
                  )}

                  <div className="training-step-actions">
                    <button type="button" className="btn training-step-primary" onClick={goNext}>
                      {step === 'made' ? (editingIndex === null ? 'Listeye Ekle' : 'Değişikliği Uygula') : 'Sıradaki'}
                    </button>
                    <button type="button" className="btn training-secondary" onClick={() => setStep(step === 'made' ? 'attempted' : 'select')}>Önceki Adım</button>
                    <button type="button" className="btn training-secondary" onClick={discardDraft}>Kaydı İptal Et</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="card training-point-controls"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div className="shot-selection-summary">
              <span className="shot-summary-icon"><Target size={24} aria-hidden="true" /></span>
              <div><h3>{selectedType?.label || 'Şut tipi seçin'}</h3>
                <p>{selectedType ? selectedType.maxPoints == null ? 'Sahada şut noktalarını işaretleyin.' : `Sahada ${selectedType.maxPoints} nokta işaretleyin.` : 'Sol menüden bir şut tipi seçerek başlayın.'}</p>
              </div>
            </div>
            <div className="training-control-progress">
            <div className="shot-point-count"><span>İşaretlenen noktalar</span><strong>{currentPoints.length}<small> / {selectedType?.maxPoints ?? (selectedType ? '∞' : '—')}</small></strong></div>
            {step === 'select' && (
              <button type="button" className="btn shot-next" onClick={goNext} disabled={!selectedType || saving || (selectedType.maxPoints !== null && currentPoints.length < selectedType.maxPoints) || !currentPoints.length}>
                Sıradaki <ArrowRight size={19} aria-hidden="true" />
              </button>
            )}
            </div>

            {currentType && step === 'select' && (
              <div className="shot-secondary-actions">
                <button type="button" className="btn training-secondary" disabled={saving || !currentPoints.length} onClick={() => setCurrentPoints(previous => previous.slice(0,-1))}><Undo2 size={16} aria-hidden="true" /> Son Noktayı Geri Al</button>
                <button type="button" className="btn training-secondary" disabled={saving || !currentPoints.length} onClick={() => setCurrentPoints([])}><Trash2 size={16} aria-hidden="true" /> Noktaları Temizle</button>
                <button type="button" className="btn training-secondary" disabled={saving} onClick={discardDraft}><X size={16} aria-hidden="true" /> Kaydı İptal Et</button>
              </div>
            )}

          </div>
          </section>
        </main>
      </div>
      {blocker.state === 'blocked' && (
        <dialog ref={leaveDialog} onCancel={event => {event.preventDefault(); blocker.reset();}}
          aria-labelledby="leave-training-title" style={{margin: 'auto', padding: '1.5rem', maxWidth: '90vw', borderRadius: 12, background: 'var(--surface)', color: 'var(--text)'}}>
          <h2 id="leave-training-title" style={{fontSize: '1.15rem'}}>Kaydetmeden çıkılsın mı?</h2>
          <p>{saving ? 'Kaydetme işlemi devam ediyor. Lütfen bekleyin.' : 'Şut kayıtlarındaki değişiklikler ve tamamlanmamış kayıt kaybolacak.'}</p>
          <div className="training-leave-actions">
            <button autoFocus type="button" className="btn training-secondary" onClick={() => blocker.reset()}>Sayfada Kal</button>
            <button type="button" className="btn" disabled={saving} onClick={() => blocker.proceed()}>Kaydetmeden Çık</button>
          </div>
        </dialog>
      )}
    </div>
  );
}
