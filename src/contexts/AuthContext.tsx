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
      try {
        // Tentamos buscar o perfil. Se houver cookies válidos, o profile retornará os dados.
        // Se não houver cookies ou estiverem expirados, o catch lidará com isso.
        const userData = await authService.me();
        setUser(userData);
      } catch (error) {
        // Falha silenciosa no carregamento inicial (usuário não logado)
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSession();
  }, []);

  const login = async (credentials: Record<string, unknown>) => {
    const data = await authService.login(credentials);
    
    // O backend agora retorna apenas o user e message, os tokens estão nos Cookies
    if (data.user) {
      setUser(data.user);
    } else {
      // Caso não venha o user no corpo (depende do contrato), buscamos via /profile
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
    }
  }, []);

  // Wrapper de compatibilidade legado (pode ser removido futuramente)
  const handleLoginSuccess = async () => {
    try {
      const userData = await authService.me();
      setUser(userData);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
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
