import { createContext, ReactNode } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  token: string | null;
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
  // TODO: Integrar com serviço de autenticação
  // - Implementar login com API
  // - Validar token ao carregar (localStorage, sessionStorage, etc)
  // - Implementar refresh token
  // - Persistir estado de autenticação
  // - Implementar logout com API

  const handleLoginSuccess = (token: string) => {
    // TODO: Implementar após integração com API de autenticação
    console.log("TODO: Implementar login:", token);
  };

  const handleLogout = () => {
    // TODO: Implementar após integração com API de autenticação
    console.log("TODO: Implementar logout");
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: true, // TODO: Substituir por estado real de autenticação (removido para desenvolvimento)
        token: null, // TODO: Substituir por token real
        handleLoginSuccess,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


