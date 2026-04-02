import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI
      .me()
      .then((res) => setUser(res.data))
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user: userData } = res.data;
    setUser(userData);
    return userData;
  };

  const register = async (email, password, username) => {
    return authAPI.register({ email, password, username });
  };

  const setSession = (_token, userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
