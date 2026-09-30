import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import CourtMap from '../components/CourtMap';

const SHOT_TYPES = [
  { id: 'Sabit Catch & Shoot', label: 'Sabit Catch & Shoot', maxPoints: 1 },
  { id: 'Hareketli Catch & Shoot', label: 'Hareketli Catch & Shoot', maxPoints: 2 },
  { id: 'Dribling Üzeri', label: 'Dribling Üzeri Şut', maxPoints: 2 },
  { id: 'Crossover Üzeri', label: 'Crossover Üzeri Şut', maxPoints: null },
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

    api.getAthlete(athleteId).then(setAthlete).catch(() => navigate('/'));

    if (!isNew) {
      Promise.all([
        api.getTraining(trainingId),
        api.getTrainings(athleteId),
      ])
        .then(([t, list]) => {
          setTraining(t);

          setRecords(
            (t.records || []).map((r) => ({
              ...r,
              points:
                typeof r.points_json === 'string'
                  ? JSON.parse(r.points_json || '[]')
                  : r.points_json || [],
            }))
          );

          const idx = list.findIndex((tr) => String(tr.id) === String(trainingId));
          setTrainingNumber(idx >= 0 ? list.length - idx : null);
        })
        .catch(() => navigate(`/athlete/${athleteId}`));
    } else {
      api.createTraining(athleteId)
        .then((t) => {
          setTraining(t);
          setTrainingNumber('Yeni');
        })
        .catch(() => navigate(`/athlete/${athleteId}`));
    }
  }, [athleteId, trainingId, isNew, navigate]);

  useEffect(() => {
    if (athlete && training) {
      setLoading(false);
    }
  }, [athlete, training]);

  const addPoint = (coord) => {
    const typeConfig = SHOT_TYPES.find((t) => t.id === currentType);
    const max = typeConfig?.maxPoints;

    if (max !== null && currentPoints.length >= max) return;

    setCurrentPoints((prev) => [...prev, coord]);
  };

  const goNext = () => {
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
      const n = parseInt(attemptedInput, 10);

      if (isNaN(n) || n < 0) {
        alert('Geçerli bir sayı girin.');
        return;
      }

      setStep('made');
    } else if (step === 'made') {
      const attempted = parseInt(attemptedInput, 10);
      const made = parseInt(madeInput, 10);

      if (isNaN(made) || made < 0 || made > attempted) {
        alert('İsabetli sayısı 0 ile atılan şut sayısı arasında olmalıdır.');
        return;
      }

      setRecords((prev) => [
        ...prev,
        {
          shot_type: currentType,
          points: [...currentPoints],
          attempted,
          made,
        },
      ]);

      setCurrentType(null);
      setCurrentPoints([]);
      setAttemptedInput('');
      setMadeInput('');
      setStep('select');
    }
  };

  const handleSave = async () => {
    if (!training?.id) return;

    setSaving(true);

    try {
      const payload = records.map((r) => ({
        shot_type: r.shot_type,
        points: r.points || [],
        attempted: r.attempted,
        made: r.made,
      }));

      await api.saveTraining(training.id, payload);
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

  return (
    <div className="page" style={{ flexDirection: 'column' }}>
      <header
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

          <h1
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
          </h1>
        </div>

        <button
          type="button"
          className="btn"
          onClick={handleSave}
          disabled={saving}
          style={{ flexShrink: 0 }}
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
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
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Şut Tipleri</h3>

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

          {SHOT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="list-item"
              style={{
                textAlign: 'left',
                width: '100%',
                background: currentType === t.id ? 'var(--surface2)' : undefined,
                borderColor: currentType === t.id ? 'var(--accent)' : undefined,
              }}
              onClick={() => {
                if (step !== 'select') return;

                setCurrentType(t.id);
                setCurrentPoints([]);
                setSidebarOpen(false);
              }}
            >
              {t.label}
              {t.maxPoints === 1 && ' (1 nokta)'}
              {(t.maxPoints === 2 || t.maxPoints === null) &&
                ` (${t.maxPoints == null ? 'Sınırsız nokta' : '2 nokta'})`}
            </button>
          ))}

          <div className="card">
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Şut türünü seçin, sahada noktaları işaretleyin, ardından &quot;Sıradaki&quot; ile
              atılan / isabetli sayıları girin.
            </p>
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
          <div style={{ flex: 1, minHeight: 360, position: 'relative' }} className="court-wrap">
            <CourtMap
              points={currentPoints}
              onPointAdd={addPoint}
              maxPoints={
                currentType
                  ? SHOT_TYPES.find((t) => t.id === currentType)?.maxPoints ?? 2
                  : 0
              }
              disabled={!currentType || step !== 'select'}
            />

            {(step === 'attempted' || step === 'made') && (
              <div
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
                  className="card"
                  style={{
                    minWidth: 280,
                    maxWidth: '90%',
                    padding: '1.5rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {step === 'attempted' && (
                    <>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Kaç şut atıldı?
                      </label>

                      <input
                        type="number"
                        min="0"
                        autoFocus
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
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Kaç tanesi isabetli?
                      </label>

                      <input
                        type="number"
                        min="0"
                        max={attemptedInput || 999}
                        autoFocus
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

                  <button type="button" className="btn" onClick={goNext} style={{ width: '100%' }}>
                    Sıradaki
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            {step === 'select' && (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                {currentType
                  ? currentPoints.length
                    ? `Nokta sayısı: ${currentPoints.length}`
                    : 'Sahada nokta işaretleyin.'
                  : 'Önce sol taraftan şut tipi seçin.'}
              </p>
            )}

            {step === 'select' && (
              <button type="button" className="btn" onClick={goNext} style={{ marginLeft: 'auto' }}>
                Sıradaki
              </button>
            )}
          </div>

          {records.length > 0 && (
            <div className="card">
              <h4 style={{ marginBottom: '0.5rem' }}>
                Bu antrenmandaki kayıtlar ({records.length})
              </h4>

              <ul style={{ listStyle: 'none', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {records.map((r, i) => (
                  <li key={i} className="animate-fade-in-up" style={{ padding: '0.25rem 0' }}>
                    {r.shot_type}: {r.made}/{r.attempted} isabet
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
