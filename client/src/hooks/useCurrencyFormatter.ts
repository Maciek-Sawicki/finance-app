"use client";

import { useUserSettings } from "@/contexts/UserSettingsContext";

export function useCurrencyFormatter() {
  const { settings } = useUserSettings();

  const locale = settings?.locale ?? "en-US";

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  return { formatNumber, locale };
}
