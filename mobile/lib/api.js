import { API_BASE } from './config';
let sessionToken = null;
const listeners = new Set();
export const onSessionExpired = listener => { listeners.add(listener); return () => listeners.delete(listener); };


async function request(path, options = {}) {
  const url = API_BASE + path;
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'SportTracker',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}), ...options.headers },
    });
  } catch (err) {
    throw new Error(err?.message || 'Bağlantı kurulamadı. API adresini ve WiFi\'yi kontrol edin.');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/api/login') {
    sessionToken = null;
    listeners.forEach(listener => listener());
  }
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const api = {
  registerCoach: body => request('/api/register', { method: 'POST', body: JSON.stringify(body) }),
  loginCoach: async body => {
    const result = await request('/api/login', { method: 'POST', headers: { 'X-Native-Client': '1' }, body: JSON.stringify(body) });
    sessionToken = result.token;
    return result.user;
  },
  logoutCoach: async () => {
    await request('/api/logout', { method: 'POST' });
    sessionToken = null;
  },
  getBranches: () => request('/api/branches'),
  getAthletes: (branch, q) => request(`/api/athletes?branch=${encodeURIComponent(branch || 'Basketbol')}&q=${encodeURIComponent(q || '')}`),
  getAthlete: (id) => request(`/api/athletes/${id}`),
  createAthlete: (body) => request('/api/athletes', { method: 'POST', body: JSON.stringify(body) }),
  updateAthlete: (id, body) => request(`/api/athletes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAthlete: (id) => request(`/api/athletes/${id}`, { method: 'DELETE' }),
  getTrainings: (athleteId) => request(`/api/athletes/${athleteId}/trainings`),
  createTraining: (athleteId) => request(`/api/athletes/${athleteId}/trainings`, { method: 'POST' }),
  getTraining: (id) => request(`/api/trainings/${id}`),
  saveTraining: (id, records) => request(`/api/trainings/${id}`, { method: 'PUT', body: JSON.stringify({ records }) }),
  getBranchStats: (branch) => request(`/api/stats/branch/${encodeURIComponent(branch)}`),
  getAthleteStats: (id) => request(`/api/athletes/${id}/stats`),
};
