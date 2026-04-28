import { api } from './api';
import { Entrega, EntregaCompleta, EntregaDirectionResponse } from '../types/models';

const RESOURCE = '/entregas';

export const entregaService = {
  async getAll(page?: number, limit?: number): Promise<Entrega[]> {
    const { data } = await api.get<Entrega[]>(RESOURCE, {
      params: { page, limit }
    });
    return data;
  },

  /** Lista com joins: placa, cliente, motorista, temperaturas da carga (`GET /entregas/completo`). */
  async getCompleto(page?: number, limit?: number): Promise<EntregaCompleta[]> {
    const { data } = await api.get<EntregaCompleta[]>(`${RESOURCE}/completo`, {
      params: { page, limit },
    });
    return data;
  },

  async getById(id: number): Promise<Entrega> {
    const { data } = await api.get<Entrega>(`${RESOURCE}/${id}`);
    return data;
  },

  /** Um registro no mesmo formato da lista completa (`GET /entregas/:id/completo`). */
  async getCompletoById(id: number): Promise<EntregaCompleta> {
    const { data } = await api.get<EntregaCompleta>(`${RESOURCE}/${id}/completo`);
    return data;
  },

  async getDirection(id: number): Promise<EntregaDirectionResponse> {
    const { data } = await api.get<EntregaDirectionResponse>(`${RESOURCE}/${id}/direction`);
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
