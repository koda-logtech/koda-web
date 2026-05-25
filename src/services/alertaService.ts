import { api } from './api';
import type { CargaAlerta, CargaAlertaStatus, CargaAlertaTipo } from '../types/models';

const RESOURCE = '/alertas';

export interface AlertaQueryParams {
  page?: number;
  limit?: number;
  status?: CargaAlertaStatus;
  tipo?: CargaAlertaTipo;
  id_carga?: number;
}

export const alertaService = {
  async getAll(params: AlertaQueryParams = {}): Promise<CargaAlerta[]> {
    const { data } = await api.get<CargaAlerta[]>(RESOURCE, { params });
    return data ?? [];
  },

  async getById(id: number): Promise<CargaAlerta> {
    const { data } = await api.get<CargaAlerta>(`${RESOURCE}/${id}`);
    return data;
  },

  async count(status: CargaAlertaStatus = 'aberto'): Promise<number> {
    const { data } = await api.get<{ status: string; count: number }>(
      `${RESOURCE}/contagem`,
      { params: { status } },
    );
    return Number(data?.count ?? 0);
  },

  async cancelar(id: number): Promise<CargaAlerta> {
    const { data } = await api.patch<CargaAlerta>(`${RESOURCE}/${id}/cancelar`);
    return data;
  },
};
