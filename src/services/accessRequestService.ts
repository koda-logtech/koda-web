import { api } from './api';
import { AccessRequest } from '@/types/accessRequest';
import { User } from '@/types/auth';

const RESOURCE = '/access-requests';

export interface ApproveResponse extends User {
  user?: User;
  activationToken?: string;
  activationLink?: string;
  message?: string;
}

export const accessRequestService = {
  async getRequests(): Promise<AccessRequest[]> {
    const { data } = await api.get<AccessRequest[]>(RESOURCE);
    return data;
  },

  async createRequest(payload: Omit<AccessRequest, 'id' | 'status' | 'createdAt'>): Promise<AccessRequest> {
    const { data } = await api.post<AccessRequest>(RESOURCE, payload);
    return data;
  },

  async approveRequest(id: string): Promise<User> {
    const { data } = await api.post<ApproveResponse>(`${RESOURCE}/${id}/approve`);
    return data.user || data;
  },

  async rejectRequest(id: string): Promise<void> {
    await api.post(`${RESOURCE}/${id}/reject`);
  },
};
