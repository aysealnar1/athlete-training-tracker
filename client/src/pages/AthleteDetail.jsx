import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import AthletePersonalFields, { ageFromBirthDate } from '../components/AthletePersonalFields';
import SuccessChart from '../components/SuccessChart';
import { formatTrainingTime, trainingDateKey } from '../utils/training-time';

function openDatePicker(input) {
  if (!input) return;
  try {
    if (input.showPicker) input.showPicker();
    else input.focus();
  } catch {
    input.focus();
  }
}

const SHOT_LABELS = {
  'Sabit Catch & Shoot': 'Sabit C&S',
  'Hareketli Catch & Shoot': 'Hareketli C&S',
  'Dribling Üzeri': 'Dribling',
  'Crossover Üzeri': 'Crossover',
};


export default function AthleteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [athlete, setAthlete] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [stats, setStats] = useState({ progression: [], shotTypeDistribution: [] });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const handleLogout = async () => {
    try {
      await api.logoutCoach();
      localStorage.removeItem('coach');
      window.dispatchEvent(new Event('auth-changed'));
      navigate('/', { replace: true });
    } catch (err) {
      alert('Çıkış yapılamadı. ' + err.message);
    }
  };

  const load = async () => {
    if (!id) return;

    setLoading(true);

    try {
      const [a, t, s] = await Promise.all([
        api.getAthlete(id),
        api.getTrainings(id),
        api.getAthleteStats(id),
      ]);

      setAthlete(a);
      setTrainings(t || []);

      setStats({
        progression: s?.progression || [],
        shotTypeDistribution: s?.shotTypeDistribution || [],
      });

      setEditForm(
        a
          ? {
              name: a.name,
              surname: a.surname,
              height: a.height ?? '',
              weight: a.weight ?? '',
              body_fat: a.body_fat ?? '',
              gender: a.gender || '',
              birth_date: a.birth_date ? a.birth_date.slice(0, 10) : '',
            }
          : {}
      );
    } catch (e) {
      console.error('Sporcu detayları yüklenirken hata:', e);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

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

  const filteredTrainings = trainings.filter((tr) => {
    const d = trainingDateKey(tr.created_at);

    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;

    return true;
  });

  const handleSaveEdit = async () => {
    try {
      await api.updateAthlete(id, {
        name: editForm.name,
        surname: editForm.surname,
        height: editForm.height ? Number(editForm.height) : null,
        weight: editForm.weight ? Number(editForm.weight) : null,
        body_fat: editForm.body_fat ? Number(editForm.body_fat) : null,
        birth_date: editForm.birth_date || null,
        gender: editForm.gender || null,
      });

      setEditModal(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteAthlete(id);
      setDeleteConfirm(false);
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
  };

  const createTraining = async () => {
    try {
      const t = await api.createTraining(id);
      navigate(`/athlete/${id}/training/${t.id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading || !athlete) {
    return (
      <div
        className="page"
        style={{
          padding: '2rem',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="page" style={{ overflowX: 'hidden' }}>
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

      <aside
        className="sidebar-left"
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
                flexShrink: 0,
              }
            : {
                flexShrink: 0,
              }
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            paddingBottom: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/dashboard')}
              style={{
                minHeight: '32px',
                padding: '0 0.6rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              ← Genel Panel
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleLogout}
              style={{
                minHeight: '32px',
                padding: '0 0.5rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              Çıkış Yap
            </button>
          </div>

          {isMobile && (
            <button
              type="button"
              className="btn"
              onClick={() => setSidebarOpen(false)}
              style={{
                width: '100%',
                minHeight: '36px',
                fontSize: '0.9rem',
                fontWeight: 700,
              }}
            >
              ← Kapat
            </button>
          )}

          <div
            style={{
              display: 'inline-block',
              alignSelf: 'flex-start',
              borderBottom: '2px solid var(--accent)',
              paddingBottom: '2px',
              marginTop: '0.25rem',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'var(--text)',
              }}
            >
              Sporcu Detay
            </span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: 0,
              color: 'var(--text)',
              wordBreak: 'break-word',
            }}
          >
            {athlete.name} {athlete.surname}
          </h1>
          <p className="text-muted" style={{ marginTop: "0.5rem" }}>{athlete.gender || "Cinsiyet belirtilmedi"} · {ageFromBirthDate(athlete.birth_date) === null ? "Yaş belirtilmedi" : `${ageFromBirthDate(athlete.birth_date)} yaş`}</p>
        </div>

        <div className="card">
          <div className="input-group">
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
              }}
            >
              Antrenman Tarih Aralığı
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <label htmlFor="dateFrom">Başlangıç Tarihi</label>
              <input
                id="dateFrom"
                type="date"
                lang="tr"
                onClick={(event) => openDatePicker(event.currentTarget)}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  colorScheme: 'dark',
                  cursor: 'pointer',
                  width: '100%',
                  padding: '0.4rem',
                  fontSize: '0.85rem',
                }}
              />
              <button type="button" className="btn btn-ghost" onClick={() => openDatePicker(document.getElementById("dateFrom"))}>Takvim Aç</button>

              <label htmlFor="dateTo">Bitiş Tarihi</label>
              <input
                id="dateTo"
                type="date"
                lang="tr"
                onClick={(event) => openDatePicker(event.currentTarget)}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  colorScheme: 'dark',
                  cursor: 'pointer',
                  width: '100%',
                  padding: '0.4rem',
                  fontSize: '0.85rem',
                }}
              />
              <button type="button" className="btn btn-ghost" onClick={() => openDatePicker(document.getElementById("dateTo"))}>Takvim Aç</button>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>
            Antrenman Listesi
          </h3>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              maxHeight: '320px',
              overflowY: 'auto',
            }}
          >
            {filteredTrainings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Antrenman yok.
              </p>
            ) : (
              filteredTrainings.map((tr, i) => (
                <div
                  key={tr.id}
                  className="list-item"
                  onClick={() => {
                    setSidebarOpen(false);
                    navigate(`/athlete/${id}/training/${tr.id}`);
                  }}
                  style={{
                    fontSize: '0.9rem',
                    padding: '0.5rem',
                  }}
                >
                  {filteredTrainings.length - i}. Antrenman —{' '}
                  {formatTrainingTime(tr.created_at)}
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <main className="main-right" style={{ flexGrow: 1, minWidth: 0 }}>
        {isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginBottom: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={() => setSidebarOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.75rem',
                fontWeight: 700,
                border: '1px solid var(--accent)',
              }}
            >
              ☰ Sporcu Menü
            </button>

            <div
              style={{
                fontWeight: 700,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
              }}
            >
              {athlete.name} {athlete.surname}
            </div>
          </div>
        )}

        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            padding: '0.5rem 0',
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setEditModal(true)}
            style={{ padding: '0.5rem 1.25rem', whiteSpace: 'nowrap' }}
          >
            Düzenle
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setDeleteConfirm(true)}
            style={{ padding: '0.5rem 1.25rem', whiteSpace: 'nowrap' }}
          >
            Sil
          </button>

          <button
            type="button"
            className="btn"
            onClick={createTraining}
            style={{
              background: '#2563eb',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: '600',
              padding: '0.5rem 1.5rem',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
              border: 'none',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            Antrenman Oluştur
          </button>
        </header>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
            Şut İsabet Yüzdesi Gelişimi
          </h3>

          <div style={{ height: 260, width: '100%' }}>
            {stats.progression && stats.progression.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.progression}>
                  <defs>
                    <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />

                  <XAxis
                    dataKey="label"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={11}
                    domain={[0, 100]}
                    tickFormatter={(v) => v + '%'}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    formatter={(v) => [v + '%', 'İsabet Oranı']}
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="pct"
                    stroke="var(--accent)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPct)"
                    dot={{
                      fill: 'var(--accent)',
                      stroke: '#111',
                      strokeWidth: 2,
                      r: 4,
                    }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="İsabet %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Henüz antrenman verisi yok.</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
            Şut Türüne Göre Başarı (İsabet %)
          </h3>

          <div style={{ height: 260, width: '100%' }}>
            {stats.shotTypeDistribution && stats.shotTypeDistribution.length ? (
              <SuccessChart data={stats.shotTypeDistribution.map(item => ({ ...item, name: SHOT_LABELS[item.name] || item.name }))} />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Henüz veri yok.</p>
            )}
          </div>
        </div>
      </main>

      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Bilgileri Düzenle</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="input-group">
                <label>Ad</label>
                <input
                  value={editForm.name || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="input-group">
                <label>Soyad</label>
                <input
                  value={editForm.surname || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      surname: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="input-group">
                <label>Boy (cm)</label>
                <input
                  type="number"
                  value={editForm.height ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      height: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="input-group">
                <label>Kilo (kg)</label>
                <input
                  type="number"
                  value={editForm.weight ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      weight: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="input-group">
                <label>Yağ Oranı (%)</label>
                <input
                  type="number"
                  value={editForm.body_fat ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      body_fat: e.target.value,
                    }))
                  }
                />
              </div>

              <AthletePersonalFields value={editForm} onChange={setEditForm} />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditModal(false)}
              >
                İptal
              </button>

              <button type="button" className="btn" onClick={handleSaveEdit}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Sporcuyu Sil</h3>

            <p>
              Bu sporcuyu ve tüm antrenman verilerini silmek istediğinize emin misiniz? Bu
              işlem geri alınamaz.
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDeleteConfirm(false)}
              >
                İptal
              </button>

              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
