import { api } from './api';
import { storage } from '../utils/storage';
import { AuthResponse, User } from '../types/auth';

export const authService = {
  /**
   * Performs login with the provided credentials.
   * Stores access and refresh tokens on success.
   */
  async login(credentials: Record<string, unknown>): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/login', credentials);
    
    if (data.accessToken) {
      storage.setAccessToken(data.accessToken);
    }
    
    if (data.refreshToken) {
      storage.setRefreshToken(data.refreshToken);
    }
    
    return data;
  },

  /**
   * Performs logout, clearing tokens from storage and optionally notifying the backend.
   */
  async logout(): Promise<void> {
    try {
      // Optional call to backend if a logout route exists
      await api.post('/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Always clear tokens regardless of backend success
      storage.clearTokens();
    }
  },

  /**
   * Fetches the current user's profile information.
   */
  async me(): Promise<User> {
    const { data } = await api.get<User>('/profile');
    return data;
  },

  /**
   * Initial validation to check if the user is authenticated.
   * Can be used to fetch the user profile on app load.
   */
  async validateSession(): Promise<User | null> {
    const token = storage.getAccessToken();
    if (!token) return null;

    try {
      return await this.me();
    } catch (error) {
      return null;
    }
  }
};
