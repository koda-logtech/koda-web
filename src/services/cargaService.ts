import { api } from './api';
import { Carga } from '../types/models';

const RESOURCE = '/carga';

export const cargaService = {
  async getAll(page?: number, limit?: number): Promise<Carga[]> {
    const { data } = await api.get<Carga[]>(RESOURCE, {
      params: { page, limit }
    });
    return data;
  },

  async getById(id: number): Promise<Carga> {
    const { data } = await api.get<Carga>(`${RESOURCE}/${id}`);
    return data;
  },

  async create(payload: Omit<Carga, 'id' | 'created_at' | 'updated_at'>): Promise<Carga> {
    const { data } = await api.post<Carga>(RESOURCE, payload);
    return data;
  },

  async update(id: number, payload: Partial<Omit<Carga, 'id' | 'created_at' | 'updated_at'>>): Promise<Carga> {
    const { data } = await api.put<Carga>(`${RESOURCE}/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  }
};
