import Settings from "../models/settings.model";

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
}

export const updateSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const updatedSettings = await Settings.findOneAndUpdate(
      { userId },
      { ...req.body },
      { new: true, upsert: true } // Create new settings if none exist
    );

    res.status(200).json({ message: "Settings updated successfully", settings: updatedSettings });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

