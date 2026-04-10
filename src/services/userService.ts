import { api } from './api';
import { User } from '../types/models';

const RESOURCE = '/users';

export const userService = {
  async getAll(page?: number, limit?: number): Promise<User[]> {
    const { data } = await api.get<User[]>(RESOURCE, {
      params: { page, limit }
    });
    return data;
  },

  async getById(id: number): Promise<User> {
    const { data } = await api.get<User>(`${RESOURCE}/${id}`);
    return data;
  },

  async create(payload: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const { data } = await api.post<User>(RESOURCE, payload);
    return data;
  },

  async update(id: number, payload: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User> {
    const { data } = await api.put<User>(`${RESOURCE}/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${RESOURCE}/${id}`);
  }
};
