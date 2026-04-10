import { api } from './api';
import { CentroLogistica } from '../types/models';

const RESOURCE = '/centros-logistica';

export const centroLogisticaService = {
  async getAll(page?: number, limit?: number): Promise<CentroLogistica[]> {
    const { data } = await api.get<CentroLogistica[]>(RESOURCE, {
      params: { page, limit }
    });
    return data;
  },

  async getById(id: number): Promise<CentroLogistica> {
    const { data } = await api.get<CentroLogistica>(`${RESOURCE}/${id}`);
    return data;
  },

  async create(payload: Omit<CentroLogistica, 'id' | 'created_at' | 'updated_at'>): Promise<CentroLogistica> {
    const { data } = await api.post<CentroLogistica>(RESOURCE, payload);
    return data;
  },

  async update(id: number, payload: Partial<Omit<CentroLogistica, 'id' | 'created_at' | 'updated_at'>>): Promise<CentroLogistica> {
    const { data } = await api.put<CentroLogistica>(`${RESOURCE}/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  }
};
