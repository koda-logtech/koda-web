import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@pages/Login/Login";
import Dashboard from "@pages/Dashboard/Dashboard";
import RequestAccess from "@pages/RequestAccess/RequestAccess";
import AdminDashboard from "@pages/AdminDashboard/AdminDashboard";
import { ProtectedRoute } from "@components/common/ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/solicitar-acesso"
        element={<RequestAccess />}
      />

      {/* TODO: Limitar o acesso a esta rota apenas para administradores */}
      <Route
        path="/admin/acessos"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
