import api from "@/lib/api"
import type { User, UserSettings } from "@/lib/types"

export const UserService = {
  getProfile: async (): Promise<{ user: User }> => {
    const res = await api.get("/auth/me")
    return res.data
  },
  getSettings: async (): Promise<UserSettings> => {
    const res = await api.get("/settings/me")
    return res.data
  },
  updateSettings: async (data: Partial<UserSettings>): Promise<UserSettings> => {
    const res = await api.patch("/settings/me", data);
    return res.data;
},
}
