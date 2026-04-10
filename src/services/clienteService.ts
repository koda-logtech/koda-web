import { api } from './api';
import { Cliente } from '../types/models';

const RESOURCE = '/clientes';

export const clienteService = {
  async getAll(page?: number, limit?: number): Promise<Cliente[]> {
    const { data } = await api.get<Cliente[]>(RESOURCE, {
      params: { page, limit }
    });
    return data;
  },

  async getById(id: number): Promise<Cliente> {
    const { data } = await api.get<Cliente>(`${RESOURCE}/${id}`);
    return data;
  },

  async create(payload: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<Cliente> {
    const { data } = await api.post<Cliente>(RESOURCE, payload);
    return data;
  },

  async update(id: number, payload: Partial<Omit<Cliente, 'id' | 'created_at' | 'updated_at'>>): Promise<Cliente> {
    const { data } = await api.put<Cliente>(`${RESOURCE}/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  }
};
