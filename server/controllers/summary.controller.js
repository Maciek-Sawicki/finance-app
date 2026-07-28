import * as summaryService from "../services/summary.service.js";

export const getMonthlySummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetCurrency } = req.query;

    if (!targetCurrency) return res.status(400).json({ message: "targetCurrency is required." });

    const monthlySummary = await summaryService.getMonthlySummary(userId, targetCurrency);
    res.status(200).json({ targetCurrency, monthlySummary });
  } catch (err) {
    console.error("Error fetching monthly summary:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};
