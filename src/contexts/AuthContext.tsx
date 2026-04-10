import { createContext, ReactNode, useState, useEffect, useCallback } from "react";
import { User, AuthResponse } from "../types/auth";
import { authService } from "../services/auth";
import { storage } from "../utils/storage";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: Record<string, unknown>) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  // Mantidos temporariamente para compatibilidade com o código atual
  handleLoginSuccess: (token: string) => void;
  handleLogout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validação inicial da sessão ao carregar a aplicação
  useEffect(() => {
    async function loadSession() {
      const accessToken = storage.getAccessToken();
      const refreshToken = storage.getRefreshToken();
      
      if (accessToken || refreshToken) {
        try {
          const userData = await authService.me();
          setUser(userData);
        } catch (error) {
          // Se falhar o /profile, os interceptors do axios já vão tentar fazer o refresh.
          // Se o refresh falhar, ele limpará os tokens.
          console.error("Falha ao recuperar sessão:", error);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    
    loadSession();
  }, []);

  const login = async (credentials: Record<string, unknown>) => {
    const data = await authService.login(credentials);
    
    if (data.user) {
      setUser(data.user);
    } else {
      // Caso o backend não retorne o user no login, buscamos via /profile
      const userData = await authService.me();
      setUser(userData);
    }
    
    return data;
  };

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      // Redirecionamento pode ser feito pelos componentes ou hooks do router
    }
  }, []);

  // Wrappers de compatibilidade para código legado
  const handleLoginSuccess = async (token: string) => {
    storage.setAccessToken(token);
    try {
      const userData = await authService.me();
      setUser(userData);
    } catch (error) {
      console.error("Erro ao carregar usuário após login compat:", error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        handleLoginSuccess,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
