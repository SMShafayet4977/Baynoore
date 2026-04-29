import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminProtectedRoute({ children, superAdminOnly = false }) {
  const { isLoggedIn, isSuperAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/admin/login" replace />;
  if (superAdminOnly && !isSuperAdmin) return <Navigate to="/admin/dashboard" replace />;
  return children;
}
