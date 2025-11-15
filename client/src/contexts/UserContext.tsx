"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { UserService } from "@/services/user"
import type { User, UserSettings } from "@/lib/types"

interface UserContextType {
  user: User | null
  settings: UserSettings | null
  refreshUser: () => Promise<void>
  updateSettings: (data: Partial<UserSettings>) => Promise<void>
  loading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      setLoading(true)

      // Fetch user info
      const { user } = await UserService.getProfile()
      setUser(user)

      // Fetch settings separately
      const userSettings = await UserService.getSettings()
      setSettings(userSettings)
    } catch (err) {
      console.error("Error fetching user or settings:", err)
      setUser(null)
      setSettings(null)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (data: Partial<UserSettings>) => {
    const updated = await UserService.updateSettings(data)
    setSettings(updated)
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <UserContext.Provider value={{ user, settings, refreshUser, updateSettings, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used within UserProvider")
  return ctx
}
