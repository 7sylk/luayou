import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("luayou_token");
    if (token) {
      authAPI
        .me()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("luayou_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem("luayou_token", token);
    setUser(userData);
    return userData;
  };

  const register = async (email, password, username) => {
    const res = await authAPI.register({ email, password, username });
    const { token, user: userData } = res.data;
    localStorage.setItem("luayou_token", token);
    setUser(userData);
    return userData;
  };

  const setSession = (token, userData) => {
    localStorage.setItem("luayou_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("luayou_token");
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
    } catch {
      // ignore
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