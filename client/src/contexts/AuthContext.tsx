import React, { createContext, useEffect, useContext, useState } from "react";
import type { ReactNode } from "react";
import api from "../lib/api";
import type { AuthContextType } from "../lib/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          })
          setUser(res.data.user)
        } catch (err) {
          console.error("Error fetching user:", err)
          setToken(null)
          localStorage.removeItem("token")
        }
      }
      setLoading(false)
    }

    fetchUser()
  }, [token])

  const signIn = async (email: string, password: string) => {
    const res = await api.post('/auth/signIn', { email, password });
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};