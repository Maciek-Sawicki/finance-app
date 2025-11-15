"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "./AuthContext";

export interface UserSettings {
  defaultCurrency: string;
  favoriteCurrencies: string[];
  locale: string;
  country?: string;
  theme?: "light" | "dark" | "system";
  dateFormat?: string;
}

interface SettingsContextType {
  settings: UserSettings | null;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user settings
  const fetchSettings = async () => {
    if (!token || !user) return;
    try {
      const res = await api.get("/settings/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data);
    } catch (err) {
      console.error("❌ Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token, user]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!token) return;
    try {
      const res = await api.patch("/settings/me", updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data);
    } catch (err) {
      console.error("❌ Error update settings:", err);
    }
  };
  

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        loading,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useUserSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useUserSettings must be used within UserSettingsProvider");
  return context;
};
