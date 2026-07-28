import React, { createContext, useEffect, useContext, useState } from "react";
import type { ReactNode } from "react";
import api from "../lib/api";
import type { AuthContextType } from "../lib/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // No local token to gate on anymore - the httpOnly cookie (if any) is
    // sent automatically, so this just asks the server "am I logged in?"
    // on every load. A 401 here just means "not signed in", not an error.
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const signUp = async (data: any) => {
    const res = await api.post("/auth/signup", data)
    return res.data
  }

  const signIn = async (email: string, password: string) => {
    const res = await api.post('/auth/signin', { email, password });
    setUser(res.data.user);
  };

  const signOut = async () => {
    // The cookie is httpOnly, so only the server can clear it - clearing
    // just the local user state used to leave a still-valid session cookie
    // sitting in the browser after "signing out".
    try {
      await api.post("/auth/signout");
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, signUp, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
