export function formatAmount(amount: number, currency?: string, locale: string = "en-US") {
  return amount.toLocaleString(locale, {
    style: currency ? "currency" : "decimal",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
