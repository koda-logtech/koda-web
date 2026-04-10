import { api } from './api';
import { Caminhao } from '../types/models';

const RESOURCE = '/caminhoes';

export const caminhaoService = {
  async getAll(page?: number, limit?: number): Promise<Caminhao[]> {
    const { data } = await api.get<Caminhao[]>(RESOURCE, {
      params: { page, limit }
    });
    return data;
  },

  async getById(id: number): Promise<Caminhao> {
    const { data } = await api.get<Caminhao>(`${RESOURCE}/${id}`);
    return data;
  },

  async create(payload: Omit<Caminhao, 'id' | 'created_at' | 'updated_at'>): Promise<Caminhao> {
    const { data } = await api.post<Caminhao>(RESOURCE, payload);
    return data;
  },

  async update(id: number, payload: Partial<Omit<Caminhao, 'id' | 'created_at' | 'updated_at'>>): Promise<Caminhao> {
    const { data } = await api.put<Caminhao>(`${RESOURCE}/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  }
};
