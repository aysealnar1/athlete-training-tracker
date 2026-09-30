import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import sportBackground from '../assets/sportbackgr.jpg';
import { Eye, EyeOff } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();
  const [view, setView] = useState('menu');

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: '#fff'
  };

  const passwordInputStyle = {
    ...inputStyle,
    paddingRight: '2.8rem'
  };

  const iconButtonStyle = {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    width: '24px',
    height: '24px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.3rem',
    fontSize: '0.9rem',
    color: 'var(--text-muted)'
  };

  const smallLabelStyle = {
    ...labelStyle,
    fontSize: '0.85rem'
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler birbiriyle uyuşmuyor!');
      return;
    }

    setLoading(true);
    try {
      await api.registerCoach({
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        password: formData.password
      });

      alert('Kayıt başarıyla tamamlandı! Giriş yapabilirsiniz.');
      setView('login');
    } catch (err) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.loginCoach({
        email: formData.email,
        password: formData.password
      });

      // The server sets an HttpOnly session cookie; no credentials go into localStorage.
      localStorage.removeItem('coach');

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${sportBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        padding: '1rem',
        position: 'relative'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '450px',
          width: '100%',
          textAlign: 'center',
          padding: '2.5rem 2rem',
          background: 'rgba(26, 26, 26, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          borderRadius: '12px',
          color: 'var(--text)'
        }}
      >
        <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
          🏀
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
          Antrenman Analizi
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Performans Takip ve Analiz Platformu
        </p>

        {error && (
          <p
            style={{
              color: '#ef4444',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '0.5rem',
              borderRadius: '6px'
            }}
          >
            {error}
          </p>
        )}

        {view === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              type="button"
              className="btn"
              onClick={() => setView('login')}
              style={{ width: '100%', fontSize: '1rem', fontWeight: '600' }}
            >
              Antrenör Paneline Giriş
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setView('register')}
              style={{ width: '100%', fontSize: '1rem' }}
            >
              Yeni Antrenör Kaydı
            </button>
          </div>
        )}

        {view === 'login' && (
          <form
            onSubmit={handleLogin}
            style={{
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div className="input-group">
              <label style={labelStyle}>E-posta Adresi</label>

              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </div>

            <div className="input-group">
              <label style={labelStyle}>Şifre</label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  style={passwordInputStyle}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={iconButtonStyle}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setView('menu')}
              style={{ width: '100%', fontSize: '0.9rem' }}
            >
              ← Geri Dön
            </button>
          </form>
        )}

        {view === 'register' && (
          <form
            onSubmit={handleRegister}
            style={{
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label style={smallLabelStyle}>Ad</label>

                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>

              <div className="input-group" style={{ flex: 1 }}>
                <label style={smallLabelStyle}>Soyad</label>

                <input
                  type="text"
                  name="surname"
                  required
                  value={formData.surname}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="input-group">
              <label style={smallLabelStyle}>Gmail / E-posta</label>

              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </div>

            <div className="input-group">
              <label style={smallLabelStyle}>Şifre</label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  minLength={10}
                  maxLength={128}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  style={passwordInputStyle}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={iconButtonStyle}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label style={smallLabelStyle}>Şifre Tekrar</label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  minLength={10}
                  maxLength={128}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  style={passwordInputStyle}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={iconButtonStyle}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydı Tamamla ve Ekle'}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setView('menu')}
              style={{ width: '100%', fontSize: '0.9rem' }}
            >
              ← Geri Dön
            </button>
          </form>
        )}
      </div>
    </div>
  );
}