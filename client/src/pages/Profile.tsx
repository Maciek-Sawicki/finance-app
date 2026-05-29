"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

import { UserService } from "@/services/user";
import type { User, UserSettings } from "@/lib/types";

import { currencies } from "@/lib/constants";
import { countryConfig, type SupportedCountry } from "@/lib/countryConfig";
import { useUserSettings } from "@/contexts/UserSettingsContext";

export default function ProfilePage() {
  const { updateSettings: updateContextSettings } = useUserSettings();

  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load profile + settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await UserService.getProfile();
        let settingsData = await UserService.getSettings();

        // fallback to user.country if settings.country is empty
        if (!settingsData.country && userData.user.country) {
          settingsData = { ...settingsData, country: userData.user.country };
        }

        setUser(userData.user);
        setSettings(settingsData);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      // Update backend and context
      await updateContextSettings(settings);
      setSettings({ ...settings }); // refresh local state
    } catch (err) {
      console.error("Error updating settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Card: Personal Information */}
        <div className="space-y-4 border rounded-lg p-4 animate-pulse">
          <Skeleton className="h-6 w-1/3 mb-2" /> {/* CardTitle */}
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Card: Preferences */}
        <div className="space-y-4 border rounded-lg p-4 animate-pulse">
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        <Skeleton className="h-10 w-32 rounded-md animate-pulse" />
      </div>
    );
  }

  if (!user || !settings) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        User data not found.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* PROFILE INFO */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">First Name</label>
              <Input value={user.firstName} disabled />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Last Name</label>
              <Input value={user.lastName} disabled />
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Email</label>
            <Input value={user.email} disabled />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Username</label>
            <Input value={user.username} disabled />
          </div>
        </CardContent>
      </Card>

      {/* SETTINGS */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* COUNTRY SELECT */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Country</label>
            <Select
              value={settings.country ?? ""}
              onValueChange={(value: SupportedCountry) =>
                setSettings({ ...settings, country: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(countryConfig).map(([code, info]) => (
                  <SelectItem key={code} value={code}>
                    {info.flag} {info.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DEFAULT CURRENCY SELECT */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Default Currency</label>
            <Select
              value={settings.defaultCurrency ?? ""}
              onValueChange={(value) =>
                setSettings({ ...settings, defaultCurrency: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* FAVORITE CURRENCIES */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Favorite Currencies</label>
            <div className="grid grid-cols-3 gap-2">
              {currencies.map((c) => (
                <label key={c.code} className="flex items-center gap-2">
                  <Checkbox
                    checked={settings.favoriteCurrencies.includes(c.code)}
                    onCheckedChange={(checked) => {
                      if (!settings) return;
                      const newFavs =
                        checked === true
                          ? [...settings.favoriteCurrencies, c.code]
                          : settings.favoriteCurrencies.filter((v) => v !== c.code);
                      setSettings({ ...settings, favoriteCurrencies: newFavs });
                    }}
                  />
                  {c.code}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SAVE BUTTON */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full md:w-auto"
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
