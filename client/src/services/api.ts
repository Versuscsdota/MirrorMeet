import axios from 'axios';
import { Model, Slot, AuditLog } from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  }
};

export const modelsAPI = {
  getAll: async (): Promise<Model[]> => {
    const { data } = await api.get('/models');
    return data;
  },
  
  getById: async (id: string): Promise<Model> => {
    const { data } = await api.get(`/models/${id}`);
    return data;
  },
  
  create: async (model: Omit<Model, 'id' | 'createdAt' | 'updatedAt'>): Promise<Model> => {
    const { data } = await api.post('/models', model);
    return data;
  },
  
  update: async (id: string, updates: Partial<Model>): Promise<Model> => {
    const { data } = await api.put(`/models/${id}`, updates);
    return data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/models/${id}`);
  },
  
  uploadFiles: async (id: string, files: File[]): Promise<Model> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const { data } = await api.post(`/models/${id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  
  syncWithSlot: async (modelId: string, slotId: string): Promise<void> => {
    await api.post(`/models/${modelId}/sync/${slotId}`);
  }
};

export const slotsAPI = {
  getAll: async (): Promise<Slot[]> => {
    const { data } = await api.get('/slots');
    return data;
  },
  
  getById: async (id: string): Promise<Slot> => {
    const { data } = await api.get(`/slots/${id}`);
    return data;
  },
  
  create: async (slot: Omit<Slot, 'id' | 'createdAt' | 'updatedAt'>): Promise<Slot> => {
    const { data } = await api.post('/slots', slot);
    return data;
  },
  
  update: async (id: string, updates: Partial<Slot>): Promise<Slot> => {
    const { data } = await api.put(`/slots/${id}`, updates);
    return data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/slots/${id}`);
  },
  
  uploadFiles: async (id: string, files: File[]): Promise<Slot> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const { data } = await api.post(`/slots/${id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  
  registerModel: async (slotId: string, modelId: string): Promise<void> => {
    await api.post(`/slots/${slotId}/register-model`, { modelId });
  }
};

export const auditAPI = {
  getAll: async (filters?: {
    from?: string;
    to?: string;
    action?: string;
    userId?: string;
  }): Promise<{ items: AuditLog[]; nextCursor: string | null }> => {
    const { data } = await api.get('/audit', { params: filters });
    return data;
  }
};
