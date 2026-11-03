import { useState, useCallback } from "react";
import { UserContext } from "./UserContextCore.js";

export { UserContext };

const API = "/api/auth";

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("vesource_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("vesource_token") || null
  );

  const saveSession = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem("vesource_user", JSON.stringify(userData));
    localStorage.setItem("vesource_token", jwt);
  };

  const register = useCallback(async (name, email, password) => {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    saveSession(data.user, data.token);
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    saveSession(data.user, data.token);
    return data;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("vesource_user");
    localStorage.removeItem("vesource_token");
  }, []);

  return (
    <UserContext.Provider value={{ user, token, register, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
