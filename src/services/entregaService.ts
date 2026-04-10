import { api } from './api';
import { Entrega } from '../types/models';

const RESOURCE = '/entregas';

export const entregaService = {
  async getAll(page?: number, limit?: number): Promise<Entrega[]> {
    const { data } = await api.get<Entrega[]>(RESOURCE, {
      params: { page, limit }
    });
    return data;
  },

  async getById(id: number): Promise<Entrega> {
    const { data } = await api.get<Entrega>(`${RESOURCE}/${id}`);
    return data;
  },

  async create(payload: Omit<Entrega, 'id' | 'created_at' | 'updated_at'>): Promise<Entrega> {
    const { data } = await api.post<Entrega>(RESOURCE, payload);
    return data;
  },

  async update(id: number, payload: Partial<Omit<Entrega, 'id' | 'created_at' | 'updated_at'>>): Promise<Entrega> {
    const { data } = await api.put<Entrega>(`${RESOURCE}/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  }
};
