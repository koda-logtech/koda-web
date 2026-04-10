export interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
  exp: number;
  iat: number;
}
