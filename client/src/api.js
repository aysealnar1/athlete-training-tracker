const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'SportTracker', ...options.headers },
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && path !== '/login') window.dispatchEvent(new Event('auth-changed'));

  if (!res.ok) {
    const error = new Error(data.error || res.statusText);
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  getSession: () => request('/me'),
  logoutCoach: () => request('/logout', { method: 'POST' }),
  // Auth
  loginCoach: (body) =>
    request('/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  registerCoach: (body) =>
    request('/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Branches
  getBranches: () => request('/branches'),

  // Athletes
  getAthletes: (branch, q) =>
    request(
      `/athletes?branch=${encodeURIComponent(branch || 'Basketbol')}&q=${encodeURIComponent(q || '')}`
    ),

  getAthlete: (id) => request(`/athletes/${id}`),

  createAthlete: (body) =>
    request('/athletes', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateAthlete: (id, body) =>
    request(`/athletes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteAthlete: (id) =>
    request(`/athletes/${id}`, {
      method: 'DELETE',
    }),

  // Trainings
  getTrainings: (athleteId) =>
    request(`/athletes/${athleteId}/trainings`),

  createTraining: (athleteId) =>
    request(`/athletes/${athleteId}/trainings`, {
      method: 'POST',
    }),

  getTraining: (id) => request(`/trainings/${id}`),

  saveTraining: (id, records) =>
    request(`/trainings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ records }),
    }),

  // Stats
  getBranchStats: (branch) =>
    request(`/stats/branch/${encodeURIComponent(branch)}`),
  getAthleteStats: (id) =>
    request(`/athletes/${id}/stats`),
};
