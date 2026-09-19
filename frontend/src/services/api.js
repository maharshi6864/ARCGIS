const API_BASE = '/api';

async function handleResponse(res) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Statistics
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return handleResponse(res);
  },

  // Health
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Detachments (Det)
  async getDets(skip = 0, limit = 100) {
    const res = await fetch(`${API_BASE}/dets?skip=${skip}&limit=${limit}`);
    return handleResponse(res);
  },

  async getDet(id) {
    const res = await fetch(`${API_BASE}/dets/${id}`);
    return handleResponse(res);
  },

  async createDet(data) {
    const res = await fetch(`${API_BASE}/dets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateDet(id, data) {
    const res = await fetch(`${API_BASE}/dets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteDet(id) {
    const res = await fetch(`${API_BASE}/dets/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Vehicle Models
  async getVehicleModels(skip = 0, limit = 100) {
    const res = await fetch(`${API_BASE}/vehicle-models?skip=${skip}&limit=${limit}`);
    return handleResponse(res);
  },

  async createVehicleModel(data) {
    const res = await fetch(`${API_BASE}/vehicle-models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateVehicleModel(id, data) {
    const res = await fetch(`${API_BASE}/vehicle-models/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteVehicleModel(id) {
    const res = await fetch(`${API_BASE}/vehicle-models/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Vehicles
  async getVehicles(detId = null, skip = 0, limit = 100) {
    const url = detId ? `${API_BASE}/vehicles?det_id=${detId}&skip=${skip}&limit=${limit}` : `${API_BASE}/vehicles?skip=${skip}&limit=${limit}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async getVehicle(id) {
    const res = await fetch(`${API_BASE}/vehicles/${id}`);
    return handleResponse(res);
  },

  async createVehicle(data) {
    const res = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateVehicle(id, data) {
    const res = await fetch(`${API_BASE}/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteVehicle(id) {
    const res = await fetch(`${API_BASE}/vehicles/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Recovery Operations
  async getRecoveries(detId = null, status = null, skip = 0, limit = 100) {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (detId) params.append('det_id', detId.toString());
    if (status && status !== 'all') params.append('status', status);
    const res = await fetch(`${API_BASE}/recoveries?${params.toString()}`);
    return handleResponse(res);
  },

  async getRecovery(id) {
    const res = await fetch(`${API_BASE}/recoveries/${id}`);
    return handleResponse(res);
  },

  async createRecovery(data) {
    const res = await fetch(`${API_BASE}/recoveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateRecovery(id, data) {
    const res = await fetch(`${API_BASE}/recoveries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteRecovery(id) {
    const res = await fetch(`${API_BASE}/recoveries/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },
};
