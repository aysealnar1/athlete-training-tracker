import app from './app.js';

const PORT = Number(process.env.PORT || 3001);

app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
  console.log(`API http://localhost:${PORT}`);
  console.log('Telefonla test için HOST ve ALLOWED_ORIGINS ayarlarını README üzerinden yapılandırın.');
});