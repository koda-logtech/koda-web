import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@pages/Login/Login";
import Dashboard from "@pages/Dashboard/Dashboard";
import { ProtectedRoute } from "@components/common/ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
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
