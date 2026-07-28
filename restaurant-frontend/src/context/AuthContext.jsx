import { createContext, useContext, useEffect, useState } from "react";
import { decodeToken, isTokenExpired } from "../utils/decodeToken";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const existing = localStorage.getItem("token");
    const decoded = decodeToken(existing);
    if (!decoded || isTokenExpired(decoded)) return null;
    return { username: decoded.sub, role: decoded.role };
  });

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const decoded = decodeToken(token);

    if (!decoded || isTokenExpired(decoded)) {
      logout();
      return;
    }

    setUser({ username: decoded.sub, role: decoded.role });
  }, [token]);

  function login(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
