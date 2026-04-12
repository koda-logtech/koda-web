import { api } from './api';
import { Armazem } from '../types/models';

const RESOURCE = '/armazens';

export const armazemService = {
  async getAll(page?: number, limit?: number): Promise<Armazem[]> {
    const { data } = await api.get<Armazem[]>(RESOURCE, {
      params: { page, limit }
    });
    return data;
  },

  async getById(id: number): Promise<Armazem> {
    const { data } = await api.get<Armazem>(`${RESOURCE}/${id}`);
    return data;
  },

  async create(payload: Omit<Armazem, 'id' | 'created_at' | 'updated_at'>): Promise<Armazem> {
    const { data } = await api.post<Armazem>(RESOURCE, payload);
    return data;
  },

  async update(id: number, payload: Partial<Omit<Armazem, 'id' | 'created_at' | 'updated_at'>>): Promise<Armazem> {
    const { data } = await api.put<Armazem>(`${RESOURCE}/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  }
};
