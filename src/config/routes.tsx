import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@pages/Login/Login";
import Dashboard from "@pages/Dashboard/Dashboard";
import RequestAccess from "@pages/RequestAccess/RequestAccess";
import AdminDashboard from "@pages/AdminDashboard/AdminDashboard";
import ActivateAccount from "@pages/ActivateAccount/ActivateAccount";
import NotFound from "@pages/NotFound/NotFound";
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

      <Route
        path="/ativar-conta"
        element={<ActivateAccount />}
      />

      <Route
        path="/admin/acessos"
        element={
          <ProtectedRoute adminOnly>
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

      <Route path="/404" element={<NotFound />} />

      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
