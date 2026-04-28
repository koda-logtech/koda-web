import { api } from './api';
import { Caminhao, CaminhaoCompleto } from '../types/models';

const RESOURCE = '/caminhoes';

export const caminhaoService = {
  async getAll(page?: number, limit?: number): Promise<Caminhao[]> {
    const { data } = await api.get<Caminhao[]>(RESOURCE, {
      params: { page, limit }
    });
    return data;
  },

  /** Lista com joins: motorista, tipo de carga, centro logístico (`GET /caminhoes/completo`). */
  async getCompleto(page?: number, limit?: number): Promise<CaminhaoCompleto[]> {
    const { data } = await api.get<CaminhaoCompleto[]>(`${RESOURCE}/completo`, {
      params: { page, limit },
    });
    return data;
  },

  async getById(id: number): Promise<Caminhao> {
    const { data } = await api.get<Caminhao>(`${RESOURCE}/${id}`);
    return data;
  },

  /** Um registro no mesmo formato da lista completa (`GET /caminhoes/:id/completo`). */
  async getCompletoById(id: number): Promise<CaminhaoCompleto> {
    const { data } = await api.get<CaminhaoCompleto>(`${RESOURCE}/${id}/completo`);
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
