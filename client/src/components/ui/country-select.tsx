"use client";

import { countryConfig, type SupportedCountry } from "@/lib/countryConfig";

interface Props {
  value: SupportedCountry | "";
  onChange: (country: SupportedCountry) => void;
}

export function CountrySelect({ value, onChange }: Props) {
  return (
    <select
      className="border rounded-md px-3 py-2 w-full"
      value={value}
      onChange={(e) => onChange(e.target.value as SupportedCountry)}
    >
      <option value="">Select country</option>

      {Object.entries(countryConfig).map(([code, info]) => (
        <option key={code} value={code}>
          {info.flag} {info.name}
        </option>
      ))}
    </select>
  );
}
