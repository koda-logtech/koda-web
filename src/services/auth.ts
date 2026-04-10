import { api } from './api';
import { storage } from '../utils/storage';
import { AuthResponse, User } from '../types/auth';

export const authService = {
  /**
   * Performs login with the provided credentials.
   * Browser stores cookies (access_token, refresh_token) automatically.
   */
  async login(credentials: Record<string, unknown>): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/users/login', credentials);
    return data;
  },

  /**
   * Performs logout, clearing cookies via backend and resetting local state.
   */
  async logout(): Promise<void> {
    try {
      await api.post('/users/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    }
  },

  /**
   * Fetches the current user's profile information using cookies.
   */
  async me(): Promise<User> {
    const { data } = await api.get<User>('/users/profile');
    return data;
  },

  /**
   * Initial validation to check if the user is authenticated via cookies.
   */
  async validateSession(): Promise<User | null> {
    try {
      return await this.me();
    } catch (error) {
      return null;
    }
  }
};
