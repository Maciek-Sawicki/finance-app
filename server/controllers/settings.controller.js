import Settings from "../models/settings.model.js";

export const getSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const settings = await Settings.findOne({ userId });

    if (!settings) {
      return res.status(404).json({ message: "Settings not found." });
    }

    res.status(200).json(settings);
  }
  catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const createSettings = async (req, res) => {
  const userId = req.user._id;
  const { defaultCurrency, theme } = req.body;

  const existing = await Settings.findOne({ userId });
  if (existing) {
    return res.status(400).json({ message: "Settings already exist" });
  }

  const settings = await Settings.create({
    userId,
    defaultCurrency,
    theme: theme || "system"
  });

  res.status(201).json(settings);
};

export const updateSettings = async (req, res) => {
  const userId = req.user._id;
  const { defaultCurrency, theme } = req.body;

  const settings = await Settings.findOneAndUpdate(
    { userId },
    { defaultCurrency, theme },
    { new: true, upsert: true }
  );

  res.status(200).json(settings);
};
