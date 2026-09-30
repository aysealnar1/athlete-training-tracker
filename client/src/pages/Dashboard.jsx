import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AthletePersonalFields from '../components/AthletePersonalFields';
import SuccessChart from '../components/SuccessChart';

const SHOT_LABELS = {
  'Sabit Catch & Shoot': 'Sabit C&S',
  'Hareketli Catch & Shoot': 'Hareketli C&S',
  'Dribling Üzeri': 'Dribling',
  'Crossover Üzeri': 'Crossover',
};


export default function Dashboard() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState(['Basketbol']);
  const [branch, setBranch] = useState('Basketbol');
  const [search, setSearch] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [stats, setStats] = useState({ monthlyTrend: [], shotTypeDistribution: [], ageGroupSuccess: [] });
  const [form, setForm] = useState({ name: '', surname: '', height: '', weight: '', body_fat: '', birth_date: '', gender: '' });
  const [loading, setLoading] = useState(true);
  
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    setLoading(true);
    try {
      const [br, list, st] = await Promise.all([
        api.getBranches(),
        api.getAthletes(branch, search),
        api.getBranchStats(branch),
      ]);
      setBranches(br || ['Basketbol']);
      setAthletes(list || []);
      
      setStats({
        monthlyTrend: st?.monthlyTrend || [],
        shotTypeDistribution: st?.shotTypeDistribution || [],
        ageGroupSuccess: st?.ageGroupSuccess || []
      });
    } catch (e) {
      console.error("Veriler yüklenirken hata oluştu:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [branch, search]);

 
  const handleNavigate = (path) => {
    setIsSidebarOpen(false);
    navigate(path);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.surname.trim()) return;
    try {
      await api.createAthlete({
        branch,
        name: form.name.trim(),
        surname: form.surname.trim(),
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        body_fat: form.body_fat ? Number(form.body_fat) : null,
      });
      setForm({ name: '', surname: '', height: '', weight: '', body_fat: '', birth_date: '', gender: '' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page">
    
      <button 
        type="button" 
        className="hamburger-btn" 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Menüyü Aç"
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

     
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}


      <aside className={`sidebar-left ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.2rem' }}>
          <div style={{ display: 'inline-block', borderBottom: '2px solid var(--accent)', paddingBottom: '2px' }}>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>Genel Panel</span>
          </div>
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={handleLogout} 
            style={{ minHeight: '32px', minWidth: '70px', height: '32px', padding: '0 0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Çıkış Yap
          </button>
        </div>

        <div className="card">
          <div className="input-group">
            <label>Branş</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="card">
          <div className="input-group">
            <label>Arama (İsim / Soyad)</label>
            <input
              type="text"
              placeholder="Sporcu ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Sporcu Listesi</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '280px', overflowY: 'auto' }}>
            {loading ? (
              <p className="text-muted">Yükleniyor...</p>
            ) : athletes.length === 0 ? (
              <p className="text-muted">Sporcu yok.</p>
            ) : (
              athletes.map((a) => (
                <div
                  key={a.id}
                  className="list-item"
                  onClick={() => handleNavigate(`/athlete/${a.id}`)}
                >
                  {a.name} {a.surname}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Sporcu Ekle</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="input-group">
              <label>Ad</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label>Soyad</label>
              <input value={form.surname} onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label>Boy (cm)</label>
              <input type="number" min="0" step="0.1" value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Kilo (kg)</label>
              <input type="number" min="0" step="0.1" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Yağ Oranı (%)</label>
              <input type="number" min="0" max="100" step="0.1" value={form.body_fat} onChange={(e) => setForm((f) => ({ ...f, body_fat: e.target.value }))} />
            </div>
            <AthletePersonalFields value={form} onChange={setForm} />
            <button type="submit" className="btn">Ekle</button>
          </form>
        </div>
      </aside>
      
      <main className="main-right">
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Genel İstatistikler</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Branş: {branch}</p>
        

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Ay Ay İsabetli Şut Yüzdesi (Takım)</h3>
          <div style={{ height: 260 }}>
            {stats.monthlyTrend && stats.monthlyTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyTrend}>
                  <defs>
                    <linearGradient id="dashboardTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} tickFormatter={(v) => v + '%'} tickLine={false} axisLine={false} />
                  
                  <Tooltip 
                    formatter={(v) => [v + '%', 'Takım Başarısı']} 
                    contentStyle={{ 
                      background: '#1a1a1a', 
                      border: '1px solid #333', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }} 
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: 'var(--text-muted)', fontSize: '11px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pct" 
                    stroke="var(--accent)" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#dashboardTrendGrad)"
                    dot={{ fill: 'var(--accent)', stroke: '#111', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="İsabet %" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Henüz veri yok.</p>
            )}
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="dashboard-charts">
          
         
          <div className="card">
            <h3 style={{ marginBottom: '0.75rem' }}>Şut Türüne Göre Başarı (İsabet %)</h3>
            <div style={{ height: 240 }}>
              {stats.shotTypeDistribution && stats.shotTypeDistribution.length ? (
                <SuccessChart data={stats.shotTypeDistribution.map(item => ({ ...item, name: SHOT_LABELS[item.name] || item.name }))} />
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Henüz veri yok.</p>
              )}
            </div>
          </div>
          
  
          <div className="card">
            <h3 style={{ marginBottom: '0.75rem' }}>Yaş Grubu Başarısı (İsabet %)</h3>
            <div style={{ height: 240 }}>
              {stats.ageGroupSuccess && stats.ageGroupSuccess.some((a) => a.totalAttempted > 0) ? (
                <SuccessChart data={stats.ageGroupSuccess.filter(group => group.totalAttempted > 0)} valueKey="pct" />
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Henüz şut denemesi yok.</p>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}