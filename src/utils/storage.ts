const PREFIX = import.meta.env.VITE_STORAGE_PREFIX || 'koda_';
const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY || 'access_token';
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token';

const getPrefixedKey = (key: string) => `${PREFIX}${key}`;

export const storage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(getPrefixedKey(ACCESS_TOKEN_KEY));
  },
  
  setAccessToken: (token: string): void => {
    localStorage.setItem(getPrefixedKey(ACCESS_TOKEN_KEY), token);
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem(getPrefixedKey(REFRESH_TOKEN_KEY));
  },
  
  setRefreshToken: (token: string): void => {
    localStorage.setItem(getPrefixedKey(REFRESH_TOKEN_KEY), token);
  },
  
  clearTokens: (): void => {
    localStorage.removeItem(getPrefixedKey(ACCESS_TOKEN_KEY));
    localStorage.removeItem(getPrefixedKey(REFRESH_TOKEN_KEY));
  }
};
