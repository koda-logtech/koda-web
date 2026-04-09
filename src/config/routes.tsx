import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import Login from "@pages/Login/Login";
import Dashboard from "@pages/Dashboard/Dashboard";
import { ProtectedRoute } from "@components/common/ProtectedRoute";

export function AppRoutes() {
  const { handleLoginSuccess } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={<Login onLoginSuccess={handleLoginSuccess} />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}
