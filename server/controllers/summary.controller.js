import * as summaryService from "../services/summary.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const getMonthlySummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { targetCurrency } = req.query;

  if (!targetCurrency) return res.status(400).json({ message: "targetCurrency is required." });

  const monthlySummary = await summaryService.getMonthlySummary(userId, targetCurrency);
  res.status(200).json({ targetCurrency, monthlySummary });
});
