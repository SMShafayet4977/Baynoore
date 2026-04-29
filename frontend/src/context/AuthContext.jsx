import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem("baynoore_admin_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  async function login(email, password) {
    const res = await authApi.login({ email, password });
    const { token, admin: adminData } = res.data;
    localStorage.setItem("baynoore_admin_token", token);
    localStorage.setItem("baynoore_admin_user", JSON.stringify(adminData));
    setAdmin(adminData);
    return adminData;
  }

  function logout() {
    localStorage.removeItem("baynoore_admin_token");
    localStorage.removeItem("baynoore_admin_user");
    setAdmin(null);
  }

  const isSuperAdmin = admin?.role === "super_admin";
  const isLoggedIn = !!admin;

  return (
    <AuthContext.Provider value={{ admin, login, logout, isSuperAdmin, isLoggedIn, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
