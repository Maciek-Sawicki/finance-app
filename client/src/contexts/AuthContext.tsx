import React, { createContext, useEffect, useContext, useState } from "react";
import type { ReactNode } from "react";
import api from "../lib/api";

interface AuthContextType {
  user: any;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Przy odświeżeniu strony odczytujemy token z localStorage
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  // Dane usera trzymamy w stanie tylko jeśli był signin w tej sesji
  const [user, setUser] = useState<any>(null);

  // Funkcja logowania
  const signIn = async (email: string, password: string) => {
    const res = await api.post('/auth/signIn', { email, password });
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
  };

  // Funkcja wylogowania
  const signOut = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook do korzystania z kontekstu
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};