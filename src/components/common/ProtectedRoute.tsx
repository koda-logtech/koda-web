import { Navigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  requiredRole?: 'admin' | 'user';
}

export function ProtectedRoute({
  children,
  adminOnly = false,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null; // Pode ser substituído por um componente de Loading se preferir
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/404" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/404" replace />;
  }

  return <>{children}</>;
}
