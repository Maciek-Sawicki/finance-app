import * as categoryBreakdownService from "../services/categoryBreakdown.service.js";
import { CATEGORY_TYPES } from "../constants/transactionTypes.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

interface BreakdownQuery {
  type?: string;
  targetCurrency?: string;
  limit?: string;
}

const parseAndValidate = (query: BreakdownQuery) => {
  const { type, targetCurrency, limit } = query;
  if (!targetCurrency) return { error: "targetCurrency is required." } as const;
  if (!type || !(CATEGORY_TYPES as readonly string[]).includes(type)) {
    return { error: "Type is required and must be 'income' or 'expense'." } as const;
  }
  return { type, targetCurrency, limit: limit ? Number(limit) : undefined } as const;
};

export const getMonthlyTopCategories = asyncHandler(async (req, res) => {
  const parsed = parseAndValidate(req.query as BreakdownQuery);
  if ("error" in parsed) return res.status(400).json({ message: parsed.error });

  const monthlyCategories = await categoryBreakdownService.getTopCategoriesByPeriod(req.user._id, {
    type: parsed.type, targetCurrency: parsed.targetCurrency, limit: parsed.limit, dateFormat: "%Y-%m",
  });

  res.status(200).json({ targetCurrency: parsed.targetCurrency, type: parsed.type, monthlyCategories });
});

export const getYearlyTopCategories = asyncHandler(async (req, res) => {
  const parsed = parseAndValidate(req.query as BreakdownQuery);
  if ("error" in parsed) return res.status(400).json({ message: parsed.error });

  const yearlyCategories = await categoryBreakdownService.getTopCategoriesByPeriod(req.user._id, {
    type: parsed.type, targetCurrency: parsed.targetCurrency, limit: parsed.limit, dateFormat: "%Y",
  });

  res.status(200).json({ targetCurrency: parsed.targetCurrency, type: parsed.type, yearlyCategories });
});
